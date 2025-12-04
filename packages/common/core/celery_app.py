"""
Celery Application Configuration for FileForge

Configures Celery for async task processing.
"""

from celery import Celery

from packages.common.core.config import settings


# Create Celery application
celery_app = Celery(
    "fileforge",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["apps.worker.tasks.convert_task"],
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Task execution
    task_time_limit=settings.celery_task_time_limit,
    task_soft_time_limit=settings.celery_task_soft_time_limit,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=2,
    # Result settings
    result_expires=3600,  # 1 hour
    result_extended=True,
    # Broker settings
    broker_connection_retry_on_startup=True,
    broker_transport_options={
        "visibility_timeout": 43200,  # 12 hours
    },
    # Task routes
    task_routes={
        "apps.worker.tasks.convert_task.*": {"queue": "conversion"},
    },
    # Default queue
    task_default_queue="default",
)

# Optional: Configure task annotations
celery_app.conf.task_annotations = {
    "*": {
        "rate_limit": "10/m",  # 10 tasks per minute per worker
    },
}
