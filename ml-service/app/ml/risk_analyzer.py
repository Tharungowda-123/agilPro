from typing import Dict, List

from app.utils.logger import get_logger

logger = get_logger(__name__)


class RiskAnalyzerModel:
    """
    Evaluates project/sprint/story risks based on capacity, complexity, dependencies,
    time tracking, and historical patterns.
    """

    def analyze_project_risks(self, project_id: str) -> Dict[str, any]:
        # Placeholder: in reality, fetch data from DB
        sprint_risks = [
            self._risk_item(
                "CAPACITY_OVERLOAD",
                75,
                "Team operating near capacity while handling complex features.",
                affected=["Project"],
                mitigation=[
                    "Split large features across sprints",
                    "Introduce buffer for critical tasks",
                ],
            )
        ]

        bottlenecks = self.detect_bottlenecks("project", project_id)
        delay_prediction = self.predict_delays("project", project_id)

        overall_score = max(risk["score"] for risk in sprint_risks) if sprint_risks else 10
        return {
            "overall_risk_score": overall_score,
            "risk_level": self._risk_level(overall_score),
            "risk_factors": sprint_risks,
            "bottlenecks": bottlenecks,
            "predictions": delay_prediction,
        }

    def analyze_sprint_risks(self, sprint_id: str) -> Dict[str, any]:
        # Example data; would query DB for actual metrics
        team_capacity = 400
        workload = 380
        dependency_chain = 4
        time_ratio = 1.6  # actual vs estimated
        complex_stories = 5

        risks = []

        if workload / team_capacity > 0.95:
            risks.append(
                self._risk_item(
                    "CAPACITY_OVERLOAD",
                    85,
                    f"Team at {int((workload / team_capacity) * 100)}% capacity - high overload risk",
                    affected=[sprint_id],
                    mitigation=[
                        "Remove 2-3 low priority stories",
                        "Reassign tasks from overloaded developers",
                    ],
                )
            )

        if dependency_chain > 3:
            risks.append(
                self._risk_item(
                    "DEPENDENCY_BLOCKER",
                    60,
                    "Multiple dependencies in critical path",
                    affected=["Dependency chain"],
                    mitigation=[
                        "Address blockers before sprint start",
                        "Plan contingency stories",
                    ],
                )
            )

        if time_ratio > 1.5:
            risks.append(
                self._risk_item(
                    "TIME_DELAY",
                    65,
                    f"Tasks taking {time_ratio:.1f}x longer than estimated",
                    affected=["Task-123", "Task-456"],
                    mitigation=[
                        "Re-estimate remaining tasks",
                        "Pair programming on complex tasks",
                    ],
                )
            )

        if complex_stories >= 5:
            risks.append(
                self._risk_item(
                    "COMPLEXITY_HIGH",
                    70,
                    "Too many complex stories selected for this sprint",
                    affected=["Sprint backlog"],
                    mitigation=["Swap some high complexity items with smaller stories"],
                )
            )

        overall_score = max((risk["score"] for risk in risks), default=25)
        return {
            "overall_risk_score": overall_score,
            "risk_level": self._risk_level(overall_score),
            "risk_factors": risks,
            "bottlenecks": self.detect_bottlenecks("sprint", sprint_id),
            "predictions": self.predict_delays("sprint", sprint_id),
        }

    def analyze_story_risks(self, story_id: str) -> Dict[str, any]:
        complexity_score = 8.5
        dependency_count = 2

        risks = []
        if complexity_score > 8:
            risks.append(
                self._risk_item(
                    "COMPLEXITY_HIGH",
                    80,
                    "AI complexity score indicates a high-risk story",
                    affected=[story_id],
                    mitigation=[
                        "Break down story into smaller tasks",
                        "Increase code review focus",
                    ],
                )
            )

        if dependency_count > 1:
            risks.append(
                self._risk_item(
                    "DEPENDENCY_BLOCKER",
                    55,
                    "Story depends on multiple pending items",
                    affected=[story_id],
                    mitigation=["Resolve dependencies early"],
                )
            )

        score = max((risk["score"] for risk in risks), default=20)
        return {
            "story_id": story_id,
            "risk_level": self._risk_level(score),
            "risk_factors": risks,
        }

    def detect_bottlenecks(self, entity_type: str, entity_id: str) -> List[Dict]:
        # Placeholder data; fetch from time tracking
        bottlenecks = [
            {
                "user": "Bob",
                "workload": "48/40 (120%)",
                "critical_tasks": 5,
            }
        ]
        return bottlenecks

    def predict_delays(self, entity_type: str, entity_id: str) -> Dict[str, any]:
        probability = 0.72
        delay_days = 3
        return {
            "sprint_delay_probability": probability,
            "estimated_delay_days": delay_days,
        }

    @staticmethod
    def _risk_item(
        risk_type: str,
        score: int,
        description: str,
        *,
        affected: List[str],
        mitigation: List[str],
    ) -> Dict[str, any]:
        return {
            "type": risk_type,
            "severity": RiskAnalyzerModel._risk_level(score),
            "score": score,
            "description": description,
            "affected_items": affected,
            "mitigation": mitigation,
        }

    @staticmethod
    def _risk_level(score: int) -> str:
        if score <= 30:
            return "low"
        if score <= 60:
            return "medium"
        return "high"

