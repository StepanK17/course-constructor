import psycopg

from app.config import settings


def get_conn():
    if not settings.db_dsn:
        raise RuntimeError("DB_DSN is required")
    return psycopg.connect(settings.db_dsn)
