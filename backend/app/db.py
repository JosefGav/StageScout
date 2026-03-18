import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

_pool = None


def init_pool():
    global _pool
    _pool = psycopg2.pool.SimpleConnectionPool(
        1, 10,
        dsn=os.environ["DATABASE_URL"]
    )


def close_pool():
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None


@contextmanager
def get_db():
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def query(sql, params=None):
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]


def query_one(sql, params=None):
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            return dict(row) if row else None


def execute(sql, params=None):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur
