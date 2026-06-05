import logging
import time
from threading import Thread

logger = logging.getLogger(__name__)

def run_async(func, *args, **kwargs):
    """
    Helper to run a function in a separate thread.
    In a full production system, this would be replaced by Celery.
    """
    Thread(target=func, args=args, kwargs=kwargs).start()

def send_enrollment_status_email(application_id, status, email):
    """
    Simulates sending an email notification for enrollment status changes.
    """
    def _send():
        try:
            logger.info(f"Starting email dispatch for application {application_id} to {email}")
            # Simulate network delay
            time.sleep(2)
            logger.info(f"Email sent successfully to {email}: Your enrollment status is now {status}")
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {str(e)}")

    run_async(_send)

def log_system_event(event_type, description, user_id=None):
    """
    Asynchronously logs important system events for audit.
    """
    def _log():
        logger.info(f"AUDIT EVENT: [{event_type}] {description} (User: {user_id})")
    
    run_async(_log)
