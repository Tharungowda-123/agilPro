"""
ML Training Scheduler
Starts the automatic model retraining scheduler in a background thread
"""
import os
import threading
from app.ml.training_pipeline import training_pipeline
from app.utils.logger import get_logger

logger = get_logger(__name__)


def start_training_scheduler():
    """
    Start the training scheduler in a background thread.
    This will run model retraining on a schedule (weekly on Monday at 2 AM).
    """
    try:
        logger.info("Starting ML Training Scheduler (runs every Monday at 2 AM)")
        training_pipeline.start_scheduler()
    except Exception as e:
        logger.error(f"Error in training scheduler: {e}", exc_info=True)


# Start scheduler in background thread when module is imported
scheduler_thread = threading.Thread(target=start_training_scheduler, daemon=True)
scheduler_thread.start()
logger.info("ML Training Scheduler thread started")

