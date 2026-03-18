from app.db import query, query_one, execute
from datetime import datetime, timezone


def start_job(job_name: str) -> int:
    execute(
        "INSERT INTO job_runs (job_name, status) VALUES (%s, 'running')",
        (job_name,)
    )
    row = query_one(
        "SELECT id FROM job_runs WHERE job_name = %s ORDER BY id DESC LIMIT 1",
        (job_name,)
    )
    return row["id"]


def complete_job(job_id: int, events_fetched: int = 0, matches_created: int = 0):
    execute("""
        UPDATE job_runs SET status = 'completed', events_fetched = %s,
            matches_created = %s, completed_at = NOW()
        WHERE id = %s
    """, (events_fetched, matches_created, job_id))


def fail_job(job_id: int, error_message: str):
    execute("""
        UPDATE job_runs SET status = 'failed', error_message = %s,
            completed_at = NOW()
        WHERE id = %s
    """, (error_message, job_id))
