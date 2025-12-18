from collections import defaultdict
from typing import Dict, List, Optional, Tuple

import numpy as np

from app.ml.task_assignment import TaskAssignmentModel
from app.utils.logger import get_logger

logger = get_logger(__name__)


class WorkloadBalancer:
    """
    Optimizes task distribution across a team to maximize skill match while keeping load balanced.
    Uses a greedy heuristic that approximates a constraint optimization strategy.
    """

    def __init__(self):
        self.assignment_model = TaskAssignmentModel()

    def balance_workload(self, tasks: List[Dict], team_members: List[Dict]) -> Dict[str, any]:
        if not tasks or not team_members:
            return {
                "balanced_assignments": [],
                "balance_score": 0.0,
                "team_utilization": [],
            }

        team_state = {member["user_id"]: member.copy() for member in team_members}
        assignments = []

        for task in sorted(tasks, key=lambda t: t.get("priority", "medium"), reverse=True):
            recommendations = self.assignment_model.get_recommendations(task, team_members)
            top_choice = self._select_best_fit(recommendations, team_state)

            if not top_choice:
                continue

            user_id, rec = top_choice
            team_state[user_id]["current_workload"] = (
                team_state[user_id].get("current_workload", 0)
                + task.get("estimated_story_points", 0)
            )

            assignments.append(
                {
                    "task_id": task.get("task_id"),
                    "assign_to": user_id,
                    "reason": rec["reasoning"],
                    "confidence": rec["confidence"],
                    "workload_percentage": rec["workload_percentage"],
                }
            )

        balance_score = self.calculate_balance_score(team_state)
        utilization = self._summarize_utilization(team_members, team_state)

        return {
            "balanced_assignments": assignments,
            "balance_score": balance_score,
            "team_utilization": utilization,
        }

    def _select_best_fit(self, recommendations: Dict, team_state: Dict) -> Optional[Tuple[str, Dict]]:
        recs = recommendations.get("recommendations", [])
        for rec in recs:
            user_id = rec["user_id"]
            member = team_state.get(user_id)
            if not member:
                continue
            capacity = member.get("capacity", 0)
            projected = member.get("current_workload", 0) + rec["skill_match_score"]
            if capacity <= 0 or projected > capacity * 1.0:
                continue
            return user_id, rec
        return None

    def calculate_balance_score(self, team_state: Dict) -> float:
        workloads = [
            min(member.get("current_workload", 0) / max(member.get("capacity", 1e-3), 1e-3), 1.0)
            for member in team_state.values()
        ]
        if not workloads:
            return 0.0
        variance = np.var(workloads)
        return max(0.0, 1.0 - variance)

    def suggest_reassignments(self, current_assignments: List[Dict], team_members: List[Dict]) -> Dict:
        overloaded = [m for m in team_members if self._utilization(m) > 1.0]
        underloaded = [m for m in team_members if self._utilization(m) < 0.7]

        suggestions = []
        for task in current_assignments:
            assigned_member = next(
                (m for m in overloaded if m["user_id"] == task.get("assign_to")), None
            )
            if not assigned_member:
                continue

            candidate = next(iter(underloaded), None)
            if not candidate:
                break

            suggestions.append(
                {
                    "task_id": task.get("task_id"),
                    "from": assigned_member["user_id"],
                    "to": candidate["user_id"],
                    "reason": "Balances workload"
                    if self._utilization(candidate) + 0.1 < 1.0
                    else "Improves skill match",
                }
            )

        return {"suggestions": suggestions}

    def _summarize_utilization(self, before_members: List[Dict], after_state: Dict) -> List[Dict]:
        summary = []
        for member in before_members:
            user_id = member["user_id"]
            capacity = member.get("capacity", 0)
            before = member.get("current_workload", 0)
            after = after_state[user_id].get("current_workload", before)

            def fmt(value):
                pct = 0 if capacity == 0 else (value / capacity) * 100
                return f"{value}/{capacity} ({pct:.0f}%)"

            summary.append(
                {
                    "user": member.get("name", user_id),
                    "before": fmt(before),
                    "after": fmt(after),
                }
            )
        return summary

    @staticmethod
    def _utilization(member: Dict) -> float:
        capacity = member.get("capacity", 0)
        workload = member.get("current_workload", 0)
        if capacity <= 0:
            return 0
        return workload / capacity

