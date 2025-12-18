"""
Logging utility for ML service
"""
import logging
import sys
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/ml-service.log"),
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger("ml-service")

