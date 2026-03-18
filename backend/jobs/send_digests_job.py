import logging
from app.db import query
from app.services.notification_service import send_digest
from app.services.job_service import start_job, complete_job, fail_job

logger = logging.getLogger(__name__)


def send_digests_job():
    job_id = start_job("send_digests")
    total_sent = 0

    try:
        users = query("""
            SELECT id FROM users
            WHERE digest_enabled = TRUE AND digest_frequency != 'never'
        """)

        for user in users:
            try:
                result = send_digest(user["id"], email_type="weekly_digest")
                if result and result.get("sent"):
                    total_sent += 1
            except Exception as e:
                logger.warning(f"Failed to send digest for user {user['id']}: {e}")

        complete_job(job_id, matches_created=total_sent)
        logger.info(f"Digest job complete: {total_sent} emails sent")

    except Exception as e:
        logger.error(f"Digest job failed: {e}")
        fail_job(job_id, str(e))
