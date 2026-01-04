import os


def get_env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if not value:
        return default
    try:
        return int(value)
    except ValueError:
        return default


class Settings:
    redis_addr = get_env("REDIS_ADDR", "redis:6379")
    redis_password = get_env("REDIS_PASSWORD", "")
    redis_db = get_int("REDIS_DB", 0)

    db_dsn = get_env("DB_DSN", "")

    model_embedding = get_env("MODEL_EMBEDDING", "sentence-transformers/all-MiniLM-L6-v2")

    openrouter_api_key = get_env("OPENROUTER_API_KEY", "")
    openrouter_model = get_env("OPENROUTER_MODEL", "deepseek/deepseek-v3.2-speciale")
    openrouter_base_url = get_env("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    openrouter_app_name = get_env("OPENROUTER_APP_NAME", "course-constructor")
    openrouter_referer = get_env("OPENROUTER_REFERER", "http://localhost")
    openrouter_reasoning_fallback = get_env("OPENROUTER_REASONING_FALLBACK", "true").lower() == "true"
    openrouter_reasoning_max_tokens = get_int("OPENROUTER_REASONING_MAX_TOKENS", 256)

    hf_home = get_env("HF_HOME", "/cache")

    s3_endpoint = get_env("S3_ENDPOINT", "minio:9000")
    s3_access_key = get_env("S3_ACCESS_KEY", "")
    s3_secret_key = get_env("S3_SECRET_KEY", "")
    s3_bucket = get_env("S3_BUCKET", "course-constructor")
    s3_use_ssl = get_env("S3_USE_SSL", "false").lower() == "true"

    qdrant_url = get_env("QDRANT_URL", "http://qdrant:6333")
    searxng_url = get_env("SEARXNG_URL", "http://searxng:8080")

    max_context_chunks = get_int("MAX_CONTEXT_CHUNKS", 6)
    chunk_size = get_int("CHUNK_SIZE", 800)
    chunk_overlap = get_int("CHUNK_OVERLAP", 120)

    max_new_tokens = get_int("MAX_NEW_TOKENS", 900)
    temperature = float(get_env("TEMPERATURE", "0.6"))
    top_p = float(get_env("TOP_P", "0.9"))
    do_sample = get_env("DO_SAMPLE", "false").lower() == "true"


settings = Settings()
