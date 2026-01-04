import json
import logging
import time

import redis

from app.config import settings
from app.db import get_conn
from app.rag import build_context
from app.text_model import get_generator

logger = logging.getLogger("ai-worker")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def update_status(conn, task_id: str, status: str, error_message: str | None) -> None:
    if not task_id:
        return
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE generation_tasks
            SET status = %s,
                started_at = CASE WHEN %s = 'processing' THEN now() ELSE started_at END,
                completed_at = CASE WHEN %s = 'completed' THEN now() ELSE completed_at END,
                error_message = %s
            WHERE id = %s
            """,
            (status, status, status, error_message, task_id),
        )
    conn.commit()


def update_course(conn, course_id: str, status: str, content_text: str) -> None:
    if not course_id:
        return
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE courses
            SET status = %s,
                content_text = %s,
                updated_at = now()
            WHERE id = %s
            """,
            (status, content_text, course_id),
        )
    conn.commit()


def fetch_documents(conn, document_ids: list[str]) -> list[dict]:
    if not document_ids:
        return []
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, filename, storage_key
            FROM documents
            WHERE id = ANY(%s)
            """,
            (document_ids,),
        )
        rows = cur.fetchall()
    return [
        {"id": str(row[0]), "filename": row[1], "storage_key": row[2]}
        for row in rows
    ]


def run() -> None:
    host, port = settings.redis_addr.split(":")
    redis_client = redis.Redis(
        host=host,
        port=int(port),
        password=settings.redis_password or None,
        db=settings.redis_db,
        decode_responses=True,
    )

    generator = get_generator()
    logger.info("worker_started")

    while True:
        task_id = None
        course_id = None
        try:
            _, payload = redis_client.blpop("generation_queue", timeout=0)
            data = json.loads(payload)
            task_id = data.get("task_id")
            course_id = data.get("course_id")
            topic = data.get("topic", "")
            goal = data.get("goal", "")
            document_ids = data.get("sources") or []

            logger.info(
                "task_received task_id=%s course_id=%s documents=%s",
                task_id,
                course_id,
                len(document_ids),
            )

            with get_conn() as conn:
                update_status(conn, task_id, "processing", None)
                update_course(conn, course_id, "processing", "")

                docs = fetch_documents(conn, document_ids)
                context = build_context(topic, goal, course_id, docs)
                logger.info(
                    "context_ready task_id=%s course_id=%s context_chars=%s",
                    task_id,
                    course_id,
                    len(context),
                )
                text = generator.generate(topic, goal, context)
                if not text.strip():
                    raise RuntimeError("empty_generated_text")

                update_course(conn, course_id, "completed", text)
                update_status(conn, task_id, "completed", None)
                logger.info(
                    "task_completed task_id=%s course_id=%s text_chars=%s",
                    task_id,
                    course_id,
                    len(text),
                )
        except Exception as exc:
            logger.exception("task_failed task_id=%s course_id=%s error=%s", task_id, course_id, exc)
            try:
                with get_conn() as conn:
                    update_status(conn, task_id, "failed", str(exc))
                    update_course(conn, course_id, "failed", "")
            except Exception:
                pass
            time.sleep(2)


if __name__ == "__main__":
    run()
