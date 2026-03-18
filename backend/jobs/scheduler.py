from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

scheduler = BackgroundScheduler()


def init_scheduler():
    from jobs.fetch_events_job import fetch_events_job
    from jobs.send_digests_job import send_digests_job
    from app.services.event_service import cleanup_old_events, cleanup_old_job_runs
    from app.services.ticketmaster_service import reset_daily_count

    # Fetch events every 6 hours, first run 30s after startup
    scheduler.add_job(
        fetch_events_job,
        trigger=IntervalTrigger(hours=6),
        id="fetch_events",
        replace_existing=True,
        next_run_time=datetime.now() + timedelta(seconds=30),
    )

    # Send weekly digest: Monday 9am UTC
    scheduler.add_job(
        send_digests_job,
        trigger=CronTrigger(day_of_week="mon", hour=9),
        id="send_weekly_digests",
        replace_existing=True,
    )

    # Cleanup old events daily at 3am
    scheduler.add_job(
        cleanup_old_events,
        trigger=CronTrigger(hour=3),
        id="cleanup_events",
        replace_existing=True,
    )

    # Cleanup old job runs daily at 3:15am
    scheduler.add_job(
        cleanup_old_job_runs,
        trigger=CronTrigger(hour=3, minute=15),
        id="cleanup_jobs",
        replace_existing=True,
    )

    # Reset Ticketmaster daily count at midnight
    scheduler.add_job(
        reset_daily_count,
        trigger=CronTrigger(hour=0),
        id="reset_tm_count",
        replace_existing=True,
    )

    scheduler.start()


def shutdown_scheduler():
    scheduler.shutdown(wait=False)
