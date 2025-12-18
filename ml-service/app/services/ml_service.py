"""
ML service implementation responsible for model lifecycle and inference.
"""
from pathlib import Path
from typing import Any, Dict, List

import numpy as np

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MLService:
    def __init__(self, model_dir: str):
        self.model_dir = Path(model_dir)
        self.models: Dict[str, Dict[str, Any]] = {}
        self._load_models()

    def _load_models(self) -> None:
        """
        Locate and register available models.
        """
        self.model_dir.mkdir(parents=True, exist_ok=True)

        # Placeholder metadata; replace with actual model discovery.
        self.models = {
            "default-regression": {
                "name": "default-regression",
                "type": "regression",
                "version": "1.0.0",
                "status": "ready",
                "path": str(self.model_dir / "default-regression.joblib"),
            },
            "nlp-sentiment": {
                "name": "nlp-sentiment",
                "type": "nlp",
                "version": "0.1.0",
                "status": "trained",
                "path": str(self.model_dir / "nlp-sentiment"),
            },
        }

        logger.info("Registered %s ML models.", len(self.models))

    def list_models(self) -> List[Dict[str, Any]]:
        return list(self.models.values())

    def predict(self, data: List[float], model_name: str) -> Dict[str, Any]:
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' is not available.")

        array = np.array(data or [0.0], dtype=float)
        prediction = float(array.mean())

        return {
            "prediction": [prediction],
            "confidence": 0.85,
            "model_used": model_name,
        }

    def analyze_text(self, text: str) -> Dict[str, Any]:
        snippet = (text or "").strip()
        sentiment = "neutral"
        if snippet:
            sentiment = "positive" if "good" in snippet.lower() else "negative" if "bad" in snippet.lower() else "neutral"

        return {
            "sentiment": sentiment,
            "keywords": [],
            "summary": snippet[:160],
        }


ml_service = MLService(settings.model_path)
