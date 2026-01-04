from __future__ import annotations

from typing import Iterable, List

import io
import requests
from docx import Document
from minio import Minio
from pypdf import PdfReader
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from sentence_transformers import SentenceTransformer

from app.config import settings


def chunk_text(text: str) -> List[str]:
    size = settings.chunk_size
    overlap = settings.chunk_overlap
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + size, length)
        chunks.append(text[start:end])
        if end == length:
            break
        start = end - overlap
    return chunks


def build_context(topic: str, goal: str, course_id: str, documents: List[dict]) -> str:
    parts: List[str] = [f"Topic: {topic}", f"Goal: {goal}"]

    doc_texts = _load_documents(documents)
    if doc_texts:
        top_chunks = _semantic_search(course_id, doc_texts, f"{topic} {goal}")
        parts.append("\n".join(top_chunks))
    else:
        web_snippets = _fetch_web_snippets(topic)
        if web_snippets:
            parts.append("\n".join(web_snippets))

    return "\n\n".join([part for part in parts if part])


def _load_documents(documents: List[dict]) -> List[str]:
    if not documents:
        return []

    client = _get_minio_client()
    texts = []
    for doc in documents:
        filename = doc.get("filename", "")
        storage_key = doc.get("storage_key")
        if not storage_key:
            continue
        try:
            obj = client.get_object(settings.s3_bucket, storage_key)
            data = obj.read()
            obj.close()
            obj.release_conn()
            if filename.endswith(".txt") or filename.endswith(".md"):
                texts.append(data.decode("utf-8", errors="ignore"))
            elif filename.endswith(".pdf"):
                texts.append(_extract_pdf_text(data))
            elif filename.endswith(".docx"):
                texts.append(_extract_docx_text(data))
        except Exception:
            continue
    return texts


def _semantic_search(course_id: str, texts: Iterable[str], query: str) -> List[str]:
    embedder = _get_embedder()
    qdrant = _get_qdrant_client()
    collection = f"course_{course_id}"

    vectors = []
    payloads = []
    point_ids = []

    for text in texts:
        for chunk in chunk_text(text):
            vectors.append(embedder.encode(chunk).tolist())
            payloads.append({"text": chunk})
            point_ids.append(len(point_ids) + 1)

    if vectors:
        vector_size = len(vectors[0])
        if not qdrant.collection_exists(collection):
            qdrant.create_collection(
                collection_name=collection,
                vectors_config=qmodels.VectorParams(size=vector_size, distance=qmodels.Distance.COSINE),
            )
        qdrant.upsert(
            collection_name=collection,
            points=qmodels.Batch(ids=point_ids, vectors=vectors, payloads=payloads),
        )

    query_vector = embedder.encode(query).tolist()
    hits = qdrant.search(
        collection_name=collection,
        query_vector=query_vector,
        limit=settings.max_context_chunks,
    )
    return [hit.payload.get("text", "") for hit in hits if hit.payload]


def _fetch_web_snippets(topic: str) -> List[str]:
    if not settings.searxng_url:
        return []
    try:
        response = requests.get(
            f"{settings.searxng_url}/search",
            params={"q": topic, "format": "json"},
            headers={
                "User-Agent": "course-constructor-ai-worker",
                "X-Forwarded-For": "127.0.0.1",
                "X-Real-IP": "127.0.0.1",
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])[: settings.max_context_chunks]
        snippets = []
        for item in results:
            title = item.get("title") or ""
            content = item.get("content") or ""
            url = item.get("url") or ""
            snippet = "\n".join([line for line in [title, content, url] if line])
            if snippet:
                snippets.append(snippet)
        return snippets
    except Exception:
        return []


_minio_client: Minio | None = None
_embedder: SentenceTransformer | None = None
_qdrant_client: QdrantClient | None = None


def _extract_pdf_text(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return ""


def _extract_docx_text(data: bytes) -> str:
    try:
        doc = Document(io.BytesIO(data))
        return "\n".join(paragraph.text for paragraph in doc.paragraphs)
    except Exception:
        return ""


def _get_minio_client() -> Minio:
    global _minio_client
    if _minio_client is None:
        _minio_client = Minio(
            settings.s3_endpoint,
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
            secure=settings.s3_use_ssl,
        )
    return _minio_client


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(settings.model_embedding)
    return _embedder


def _get_qdrant_client() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(url=settings.qdrant_url)
    return _qdrant_client
