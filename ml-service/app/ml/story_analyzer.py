from __future__ import annotations

import math
from typing import Dict, List

import numpy as np
from sentence_transformers import SentenceTransformer, util

from app.core.database import fetch_training_data
from app.utils.logger import get_logger

logger = get_logger(__name__)


class StoryAnalyzer:
    """
    Uses sentence-transformers to analyze story complexity and suggest story points.
    """

    MODEL_NAME = "all-MiniLM-L6-v2"

    def __init__(self):
        self.embedder = SentenceTransformer(self.MODEL_NAME)
        self.training_cache: List[Dict] = []

    def analyze_story(self, title: str, description: str, acceptance_criteria: List[str]) -> Dict[str, any]:
        embedding = self.embedder.encode(description)
        complexity_breakdown = self._calculate_complexity_factors(description, acceptance_criteria)
        score = np.mean(list(complexity_breakdown.values())) * 1.2
        score = min(10.0, max(1.0, score))

        story_points = self.estimate_story_points(score)
        similar = self.find_similar_stories(embedding)
        requirements = self.extract_requirements(description)

        return {
            "complexity_score": round(score, 1),
            "complexity_level": self._complexity_level(score),
            "breakdown": {
                "ui_complexity": complexity_breakdown["ui"],
                "backend_complexity": complexity_breakdown["backend"],
                "integration_complexity": complexity_breakdown["integration"],
                "testing_complexity": complexity_breakdown["testing"],
            },
            "estimated_story_points": story_points,
            "confidence": 0.82,
            "factors": self._explain_factors(description),
            "similar_stories": similar,
            "requirements_extracted": requirements,
        }

    def estimate_story_points(self, complexity_score: float) -> int:
        if complexity_score <= 3:
            return 3
        if complexity_score <= 5:
            return 5
        if complexity_score <= 7:
            return 8
        return 13

    def extract_requirements(self, description: str) -> List[str]:
        requirements = []
        keywords = {
            "authentication": "User authentication required",
            "payment": "Payment gateway integration",
            "notification": "Email/notification feature",
            "report": "Reporting or analytics",
            "integration": "External system integration",
        }
        for word, req in keywords.items():
            if word in description.lower():
                requirements.append(req)
        return requirements or ["General functional requirements inferred"]

    def find_similar_stories(self, embedding: np.ndarray, top_k: int = 3) -> List[Dict]:
        if not self.training_cache:
            self.training_cache = fetch_training_data("stories", limit=100)

        candidates = []
        for story in self.training_cache:
            if "embedding" not in story:
                continue
            similarity = util.cos_sim(embedding, np.array(story["embedding"]))[0][0]
            candidates.append(
                {
                    "story_id": story.get("story_id"),
                    "title": story.get("title"),
                    "similarity": round(float(similarity), 2),
                    "actual_points": story.get("story_points"),
                    "actual_time": f"{story.get('actual_hours', 0)} hours",
                }
            )
        candidates.sort(key=lambda c: c["similarity"], reverse=True)
        return candidates[:top_k]

    def _calculate_complexity_factors(self, description: str, acceptance_criteria: List[str]) -> Dict[str, float]:
        text = description.lower()
        criteria_count = len(acceptance_criteria)
        length_factor = min(len(description) / 500, 2)

        ui = 3 + 2 * ("ui" in text or "frontend" in text)
        backend = 3 + 2 * ("api" in text or "database" in text)
        integration = 2 + 3 * ("integration" in text or "third-party" in text)
        testing = 2 + 0.5 * criteria_count + ("edge case" in text)

        complexity = {
            "ui": min(10, ui + length_factor),
            "backend": min(10, backend + length_factor),
            "integration": min(10, integration),
            "testing": min(10, testing),
        }

        return complexity

    def _explain_factors(self, description: str) -> List[str]:
        factors = []
        text = description.lower()

        if "integration" in text:
            factors.append("Requires third-party API integration (high complexity)")
        if "database" in text:
            factors.append("Multiple database operations (medium complexity)")
        if "ui" in text or "frontend" in text:
            factors.append("Complex UI considerations (medium complexity)")
        if "authentication" in text:
            factors.append("Security and authentication requirements")

        return factors or ["General complexity factors inferred"]

    @staticmethod
    def _complexity_level(score: float) -> str:
        if score < 4:
            return "low"
        if score < 7:
            return "medium"
        return "high"

