from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
from keras import Sequential
from keras.layers import LSTM, Dense, Dropout
from keras.optimizers import Adam

from app.core.config import settings
from app.core.database import fetch_training_data
from app.utils.logger import get_logger

logger = get_logger(__name__)


class VelocityForecaster:
    """
    LSTM-based velocity predictor that incorporates story points, actual hours,
    capacity changes, complexity mix, and team availability.
    """

    MODEL_FILENAME = "velocity_forecaster.keras"
    SCALER_FILENAME = "velocity_scaler.pkl"
    SEQUENCE_LENGTH = 6

    def __init__(self):
        self.model_dir = Path(settings.model_path) / "velocity"
        self.model_dir.mkdir(parents=True, exist_ok=True)

        self.model_path = self.model_dir / self.MODEL_FILENAME
        self.scaler_path = self.model_dir / self.SCALER_FILENAME

        self.model: Sequential | None = None
        self.scaler_stats: Dict[str, Tuple[float, float]] = {}

        self._load_model()

    # ------------------------------------------------------------------
    # Data preparation
    # ------------------------------------------------------------------
    def load_sprint_history(self, team_id: str, limit: int = 10) -> List[Dict]:
        history = fetch_training_data("sprints_history", {"team_id": team_id}, limit=limit)
        history = sorted(history, key=lambda sprint: sprint.get("end_date", ""))
        logger.info("Loaded %s historical sprints for team %s", len(history), team_id)
        return history

    def prepare_training_data(self, history: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        if len(history) < self.SEQUENCE_LENGTH + 1:
            return np.array([]), np.array([])

        features = []
        targets = []
        normalized_history = [self._sprint_features(sprint) for sprint in history]

        for idx in range(len(normalized_history) - self.SEQUENCE_LENGTH):
            window = normalized_history[idx : idx + self.SEQUENCE_LENGTH]
            features.append(window)
            targets.append(normalized_history[idx + self.SEQUENCE_LENGTH][-1])  # velocity is last feature

        return np.array(features), np.array(targets)

    def _sprint_features(self, sprint: Dict) -> List[float]:
        velocity = sprint.get("velocity", 0)
        hours = sprint.get("actual_hours", 0)
        estimated_hours = sprint.get("estimated_hours", velocity * 2)
        efficiency = hours / estimated_hours if estimated_hours else 1
        capacity = sprint.get("capacity", 0)
        complexity_mix = sprint.get("complexity_mix", {"high": 0.3, "medium": 0.5, "low": 0.2})
        duration = sprint.get("duration_days", 14)
        time_off = sprint.get("time_off_days", 0)

        features = [
            velocity,
            hours,
            capacity,
            complexity_mix.get("high", 0.3),
            complexity_mix.get("medium", 0.5),
            complexity_mix.get("low", 0.2),
            duration,
            time_off,
            efficiency,
        ]

        return self._normalize(features)

    def _normalize(self, values: List[float]) -> List[float]:
        normalized = []
        for idx, value in enumerate(values):
            mean, std = self.scaler_stats.get(str(idx), (0.0, 1.0))
            normalized.append((value - mean) / (std or 1.0))
        return normalized

    def _update_scaler(self, dataset: List[List[float]]) -> None:
        if not dataset:
            return
        matrix = np.array(dataset)
        for idx in range(matrix.shape[1]):
            self.scaler_stats[str(idx)] = (float(np.mean(matrix[:, idx])), float(np.std(matrix[:, idx]) + 1e-6))

    # ------------------------------------------------------------------
    # Model training
    # ------------------------------------------------------------------
    def train_model(self, team_id: str) -> None:
        history = self.load_sprint_history(team_id)
        if len(history) < self.SEQUENCE_LENGTH + 1:
            logger.warning("Not enough sprint history to train velocity model.")
            return

        raw_features = [self._sprint_raw_features(sprint) for sprint in history]
        self._update_scaler(raw_features)
        joblib.dump(self.scaler_stats, self.scaler_path)

        X, y = self.prepare_training_data(history)
        if X.size == 0:
            logger.warning("Failed to prepare training matrix.")
            return

        self.model = Sequential(
            [
                LSTM(64, return_sequences=True, input_shape=(self.SEQUENCE_LENGTH, X.shape[2])),
                Dropout(0.2),
                LSTM(32),
                Dropout(0.2),
                Dense(1),
            ]
        )
        self.model.compile(optimizer=Adam(learning_rate=0.001), loss="mse")
        self.model.fit(X, y, epochs=80, batch_size=8, verbose=0)
        self.model.save(self.model_path)
        logger.info("Velocity forecaster trained and saved for team %s", team_id)

    def _sprint_raw_features(self, sprint: Dict) -> List[float]:
        velocity = sprint.get("velocity", 0)
        hours = sprint.get("actual_hours", 0)
        capacity = sprint.get("capacity", 0)
        complexity = sprint.get("complexity_mix", {"high": 0.3, "medium": 0.5, "low": 0.2})
        duration = sprint.get("duration_days", 14)
        time_off = sprint.get("time_off_days", 0)
        estimated_hours = sprint.get("estimated_hours", velocity * 2)
        efficiency = hours / estimated_hours if estimated_hours else 1
        return [
            velocity,
            hours,
            capacity,
            complexity.get("high", 0.3),
            complexity.get("medium", 0.5),
            complexity.get("low", 0.2),
            duration,
            time_off,
            efficiency,
        ]

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------
    def predict_velocity(self, team_id: str, next_capacity: float) -> Dict[str, any]:
        history = self.load_sprint_history(team_id)
        if len(history) < self.SEQUENCE_LENGTH:
            return {"predicted_velocity": 0, "confidence_interval": [0, 0], "confidence": 0.0}

        if not self.model:
            self.train_model(team_id)

        window = history[-self.SEQUENCE_LENGTH :]
        sequence = np.array([self._sprint_features(sprint) for sprint in window])
        sequence = np.expand_dims(sequence, axis=0)

        prediction = float(self.model.predict(sequence, verbose=0)[0][0])
        base_velocity = np.mean([s.get("velocity", 0) for s in window])
        capacity_adjustment = (next_capacity - window[-1].get("capacity", next_capacity)) * 0.3
        time_efficiency = np.mean([s.get("actual_hours", 0) / max(s.get("estimated_hours", 1), 1) for s in window])

        adjusted_velocity = prediction + capacity_adjustment * 0.5 - (time_efficiency - 1) * 5

        confidence_interval = [round(adjusted_velocity - 4), round(adjusted_velocity + 4)]
        confidence = 0.85

        trend = "increasing" if adjusted_velocity > base_velocity else "stable"

        prediction_summary = {
            "predicted_velocity": round(adjusted_velocity),
            "confidence_interval": confidence_interval,
            "confidence": confidence,
            "factors": {
                "historical_average": round(base_velocity),
                "trend": trend,
                "capacity_adjustment": round(capacity_adjustment, 1),
                "time_efficiency": round(time_efficiency, 2),
                "recent_performance": "above_average" if adjusted_velocity >= base_velocity else "below_average",
            },
        }

        completion = self.predict_completion_date(
            remaining_points=history[-1].get("remaining_points", 0),
            predicted_velocity=prediction_summary["predicted_velocity"],
        )

        prediction_summary["completion_forecast"] = completion
        return prediction_summary

    def predict_completion_date(self, remaining_points: float, predicted_velocity: float) -> Dict[str, any]:
        if predicted_velocity <= 0:
            return {"remaining_story_points": remaining_points}

        sprints_needed = np.ceil(remaining_points / predicted_velocity)
        estimated_date = datetime.utcnow() + timedelta(days=14 * sprints_needed)

        return {
            "remaining_story_points": remaining_points,
            "estimated_sprints": int(sprints_needed),
            "estimated_completion_date": estimated_date.strftime("%Y-%m-%d"),
            "confidence": 0.8,
        }

    def _load_model(self) -> None:
        if self.model_path.exists():
            from keras.models import load_model

            self.model = load_model(self.model_path)
        if self.scaler_path.exists():
            self.scaler_stats = joblib.load(self.scaler_path)

