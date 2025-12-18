import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import MinMaxScaler

from app.core.config import settings
from app.core.database import fetch_training_data
from app.schemas.ml_prediction import TaskAssignmentRecommendation
from app.utils.logger import get_logger


logger = get_logger(__name__)


class TaskAssignmentModel:
    """
    Capacity-aware task assignment engine that blends collaborative filtering with
    feature-based scoring and workload balancing.
    """

    MODEL_FILENAME = "task_assignment_model.pkl"
    ENCODER_FILENAME = "task_assignment_encoders.pkl"

    def __init__(self):
        self.model_dir = Path(settings.model_path) / "task_assignment"
        self.model_dir.mkdir(parents=True, exist_ok=True)

        self.model_path = self.model_dir / self.MODEL_FILENAME
        self.encoder_path = self.model_dir / self.ENCODER_FILENAME

        self.clf: Optional[LogisticRegression] = None
        self.svd: Optional[TruncatedSVD] = None
        self.scaler: Optional[MinMaxScaler] = None
        self.feature_columns: List[str] = []
        self.model_version: str = "1.0.0"

        self._load_model()

    # -------------------------------------------------------------------------
    # Training pipeline
    # -------------------------------------------------------------------------
    def load_training_data(self, limit: int = 5000) -> List[Dict]:
        """
        Load historical assignment data from MongoDB.
        Expected collection: task_assignments with developer/task metadata.
        """
        try:
            records = fetch_training_data("task_assignments", limit=limit)
            logger.info("Loaded %s historical task assignments for training", len(records))
            return records
        except Exception as exc:
            logger.error("Failed loading training data: %s", exc)
            return []

    def _encode_skills(self, required: List[str], developer: List[str]) -> Tuple[float, float]:
        match = self.calculate_skill_match(required, developer)
        experience = len(set(developer))
        return match, experience

    def _build_feature_vector(self, record: Dict) -> Dict:
        task_skills = record.get("task", {}).get("required_skills", [])
        dev_skills = record.get("developer", {}).get("skills", [])

        skill_match, dev_experience = self._encode_skills(task_skills, dev_skills)
        workload = record.get("developer", {}).get("current_workload", 0)
        capacity = record.get("developer", {}).get("capacity", 1)
        velocity = record.get("developer", {}).get("velocity", 0.0)
        completion_rate = record.get("developer", {}).get("completion_rate", 0.0)
        time_accuracy = record.get("developer", {}).get("time_accuracy", 0.0)
        collaboration = record.get("developer", {}).get("collaboration_index", 0.0)
        complexity = record.get("task", {}).get("complexity_score", 0.5)

        return {
            "skill_match": skill_match,
            "developer_experience": dev_experience,
            "workload_utilization": workload / max(capacity, 1e-3),
            "capacity": capacity,
            "velocity": velocity,
            "completion_rate": completion_rate,
            "time_accuracy": time_accuracy,
            "collaboration_index": collaboration,
            "task_complexity": complexity,
        }

    def train_model(self) -> None:
        records = self.load_training_data()
        if not records:
            logger.warning("No training data available; skipping training.")
            return

        feature_rows, labels, user_ids, task_ids = [], [], [], []
        for record in records:
            features = self._build_feature_vector(record)
            feature_rows.append(list(features.values()))
            labels.append(record.get("assignment_success", 0))
            user_ids.append(record.get("developer", {}).get("_id"))
            task_ids.append(record.get("task", {}).get("_id"))

        X = np.array(feature_rows)
        y = np.array(labels)

        # Collaborative filtering (user-task interactions)
        interaction_matrix = self._build_interaction_matrix(user_ids, task_ids, y)
        self.svd = TruncatedSVD(n_components=min(20, interaction_matrix.shape[1]))
        latent = self.svd.fit_transform(interaction_matrix)

        # Normalize features
        self.scaler = MinMaxScaler()
        X_scaled = self.scaler.fit_transform(X)
        self.feature_columns = [
            "skill_match",
            "developer_experience",
            "workload_utilization",
            "capacity",
            "velocity",
            "completion_rate",
            "time_accuracy",
            "collaboration_index",
            "task_complexity",
        ]

        # Combine latent factors with engineered features
        latent_aligned = latent[: X_scaled.shape[0]]
        training_matrix = np.hstack([X_scaled, latent_aligned])

        self.clf = LogisticRegression(max_iter=1000)
        self.clf.fit(training_matrix, y)

        self.model_version = "1.1.0"
        self._save_model()
        logger.info("Task assignment model trained and saved (version %s)", self.model_version)

    def _build_interaction_matrix(self, users: List[str], tasks: List[str], labels: np.ndarray) -> np.ndarray:
        unique_users = {user: idx for idx, user in enumerate(sorted(set(filter(None, users))))}
        unique_tasks = {task: idx for idx, task in enumerate(sorted(set(filter(None, tasks))))}

        matrix = np.zeros((len(unique_users), len(unique_tasks)))
        for user, task, success in zip(users, tasks, labels):
            if user in unique_users and task in unique_tasks:
                matrix[unique_users[user], unique_tasks[task]] += success
        return matrix

    def _save_model(self) -> None:
        payload = {
            "clf": self.clf,
            "svd": self.svd,
            "scaler": self.scaler,
            "feature_columns": self.feature_columns,
            "model_version": self.model_version,
        }
        joblib.dump(payload, self.model_path)
        logger.info("Model persisted to %s", self.model_path)

    def _load_model(self) -> None:
        if not self.model_path.exists():
            logger.info("Task assignment model not found. Training will be required.")
            return
        payload = joblib.load(self.model_path)
        self.clf = payload.get("clf")
        self.svd = payload.get("svd")
        self.scaler = payload.get("scaler")
        self.feature_columns = payload.get("feature_columns", [])
        self.model_version = payload.get("model_version", "unknown")
        logger.info("Loaded task assignment model (version %s)", self.model_version)

    # -------------------------------------------------------------------------
    # Recommendation pipeline
    # -------------------------------------------------------------------------
    def get_recommendations(self, task: Dict, available_developers: List[Dict], top_n: int = 3) -> Dict:
        recommendations: List[TaskAssignmentRecommendation] = []
        if not available_developers:
            return {"recommendations": []}

        for developer in available_developers:
            rec = self._score_developer(task, developer)
            if rec:
                recommendations.append(rec)

        recommendations.sort(key=lambda r: r.confidence, reverse=True)
        top_recs = recommendations[:top_n]

        payload = [
            {
                "user_id": rec.user,
                "user_name": developer_lookup(rec.user, available_developers),
                "confidence": round(rec.confidence, 2),
                "reasoning": rec.reasoning,
                "current_workload": rec.metadata["current_workload"],
                "estimated_new_workload": rec.metadata["estimated_new_workload"],
                "workload_percentage": rec.metadata["workload_percentage"],
                "availability": rec.metadata["availability"],
                "skill_match_score": round(rec.metadata["skill_match_score"], 2),
                "performance_score": round(rec.metadata["performance_score"], 2),
                "workload_score": round(rec.metadata["workload_score"], 2),
            }
            for rec in top_recs
        ]

        return {"recommendations": payload}

    def _score_developer(self, task: Dict, developer: Dict) -> Optional[TaskAssignmentRecommendation]:
        # Extract required_skills from task, or infer from description if missing
        required_skills = task.get("required_skills", [])
        if not required_skills and task.get("description"):
            # Try to extract skills from description (simple keyword matching)
            description = task.get("description", "").lower()
            common_skills = [
                "javascript", "typescript", "react", "vue", "angular", "node", "python", "java", 
                "ruby", "rails", "php", "swift", "kotlin", "go", "rust", "c++", "c#", "sql",
                "mongodb", "postgresql", "mysql", "redis", "docker", "kubernetes", "aws", "azure",
                "html", "css", "sass", "less", "webpack", "babel", "git", "github", "gitlab"
            ]
            found_skills = [skill for skill in common_skills if skill in description]
            if found_skills:
                required_skills = found_skills
                logger.debug(f"Extracted skills from task description: {found_skills}")
        
        task_complexity = task.get("complexity", "medium")

        skill_match = self.calculate_skill_match(required_skills, developer.get("skills", []))
        workload_score, utilization, availability = self.calculate_workload_score(developer)
        performance_score = self.calculate_performance_score(developer)
        time_pattern_score = self.calculate_time_pattern_score(developer)
        complexity_alignment = self._calculate_complexity_alignment(task_complexity, developer)
        collaboration_score = developer.get("collaboration_index", 0.5)

        features = np.array(
            [
                skill_match,
                len(developer.get("skills", [])),
                utilization,
                developer.get("capacity", 1),
                developer.get("velocity", 0.0),
                developer.get("completion_rate", 0.0),
                developer.get("time_accuracy", 0.0),
                collaboration_score,
                self._complexity_to_numeric(task_complexity),
            ]
        ).reshape(1, -1)

        probability = self._predict_probability(features)

        # Weighted scoring combining heuristic components
        weighted_score = (
            0.3 * skill_match
            + 0.25 * performance_score
            + 0.2 * workload_score
            + 0.1 * time_pattern_score
            + 0.1 * complexity_alignment
            + 0.05 * collaboration_score
        )

        # Improved confidence calculation with better baseline
        # If we have minimal data, give a reasonable baseline confidence
        # Otherwise use the weighted formula
        if weighted_score < 0.2 and probability < 0.2:
            # Very sparse data - use a conservative baseline (30-50%)
            # This ensures recommendations are still useful even with limited data
            baseline_confidence = 0.35 + (weighted_score * 0.3)  # Range: 0.35 to 0.41
            confidence = min(1.0, max(0.3, baseline_confidence))
        else:
            # Normal calculation with improved weighting
            confidence = min(1.0, max(0.3, 0.6 * weighted_score + 0.4 * probability))

        reasoning = self.explain_recommendation(
            task,
            developer,
            skill_match=skill_match,
            workload_score=workload_score,
            performance_score=performance_score,
        )

        estimated_workload = developer.get("current_workload", 0) + task.get("estimated_story_points", 0)
        metadata = {
            "current_workload": f"{developer.get('current_workload', 0)}/{developer.get('capacity', 0)} story points",
            "estimated_new_workload": f"{estimated_workload}/{developer.get('capacity', 0)} story points",
            "workload_percentage": round(utilization * 100, 2),
            "availability": f"{max(developer.get('capacity', 0) - developer.get('current_workload', 0), 0)} story points remaining",
            "skill_match_score": skill_match,
            "performance_score": performance_score,
            "workload_score": workload_score,
        }

        return TaskAssignmentRecommendation(
            user=developer.get("user_id") or developer.get("_id"),
            confidence=confidence,
            reasoning=reasoning,
            workload_impact=utilization,
            metadata=metadata,
        )

    def _predict_probability(self, features: np.ndarray) -> float:
        if not self.clf or not self.scaler or not self.svd:
            # Fallback to heuristic probability
            return float(np.mean(features))

        scaled = self.scaler.transform(features)
        latent = self.svd.transform(scaled)
        matrix = np.hstack([scaled, latent])
        return float(self.clf.predict_proba(matrix)[0, 1])

    # -------------------------------------------------------------------------
    # Feature calculations
    # -------------------------------------------------------------------------
    @staticmethod
    def calculate_skill_match(required_skills: List[str], developer_skills: List[str]) -> float:
        if not required_skills:
            # If no required skills specified, give neutral score (0.5) instead of penalizing
            return 0.5
        required = set(skill.lower() for skill in required_skills)
        developer = set(skill.lower() for skill in developer_skills)
        if not developer:
            # If developer has no skills but task requires skills, give lower score but not zero
            return 0.2
        intersection = len(required & developer)
        union = len(required | developer)
        if union == 0:
            return 0.2
        # Use Jaccard similarity (intersection/union) but ensure minimum score
        match_score = intersection / union
        # Ensure minimum score of 0.2 even with no matches (to avoid zero confidence)
        return max(0.2, match_score)

    @staticmethod
    def calculate_workload_score(developer: Dict) -> Tuple[float, float, float]:
        # Use reasonable default capacity if missing (40 story points per sprint)
        capacity = developer.get("capacity", 0) or developer.get("availability", 0) or 40
        workload = developer.get("current_workload", 0) or 0
        
        # If capacity is still 0 or very low, set a reasonable default
        if capacity <= 0:
            capacity = 40  # Default capacity: 40 story points per sprint
            logger.warning(f"Developer {developer.get('user_id')} has no capacity, using default 40")
        
        utilization = workload / capacity
        score = 1.0 - utilization

        if utilization >= 0.9:
            score *= 0.2  # heavy penalty for overloaded
        elif utilization <= 0.5:
            score *= 1.2  # slight boost for available capacity
        elif utilization <= 0.3:
            score *= 1.3  # more boost for very available

        score = max(0.0, min(1.0, score))
        availability = max(capacity - workload, 0)
        return score, utilization, availability

    @staticmethod
    def calculate_performance_score(developer: Dict) -> float:
        completion_rate = developer.get("completion_rate", 0.5)
        on_time = developer.get("on_time_delivery", 0.5)
        quality = developer.get("quality_score", 0.5)
        return float(np.mean([completion_rate, on_time, quality]))

    @staticmethod
    def calculate_time_pattern_score(developer: Dict) -> float:
        consistency = developer.get("time_tracking_consistency", 0.5)
        variance = developer.get("time_logging_variance", 0.3)
        return max(0.0, min(1.0, consistency - 0.2 * variance))

    def _calculate_complexity_alignment(self, task_complexity: str, developer: Dict) -> float:
        complexity_map = {"low": 0.3, "medium": 0.6, "high": 0.9}
        developer_experience = developer.get("complexity_handled", "medium")
        dev_score = complexity_map.get(developer_experience, 0.6)
        task_score = complexity_map.get(task_complexity, 0.6)
        return 1.0 - abs(dev_score - task_score)

    @staticmethod
    def _complexity_to_numeric(value: str) -> float:
        return {"low": 0.2, "medium": 0.5, "high": 0.8}.get(value, 0.5)

    def explain_recommendation(
        self,
        task: Dict,
        developer: Dict,
        *,
        skill_match: float,
        workload_score: float,
        performance_score: float,
    ) -> str:
        fragments = []

        if skill_match >= 0.75:
            fragments.append("Strong skill match")
        elif skill_match >= 0.5:
            fragments.append("Skills mostly aligned")
        else:
            fragments.append("Moderate skill alignment")

        capacity = developer.get("capacity", 0)
        workload = developer.get("current_workload", 0)
        availability = max(capacity - workload, 0)
        fragments.append(f"Currently at {int(workload_score * 100)}% workload")
        fragments.append(f"Availability: {availability} story points remaining")

        completed = developer.get("completed_similar_tasks", 0)
        on_time_rate = developer.get("on_time_delivery", 0.0)
        fragments.append(
            f"Completed {completed} similar tasks with {int(on_time_rate * 100)}% on-time rate"
        )

        return ". ".join(fragments) + "."


def developer_lookup(user_id: str, developers: List[Dict]) -> str:
    for developer in developers:
        if developer.get("user_id") == user_id or developer.get("_id") == user_id:
            return developer.get("name") or developer.get("full_name") or "Unknown"
    return "Unknown"

