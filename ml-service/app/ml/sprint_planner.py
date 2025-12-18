import random
from itertools import combinations
from typing import Dict, List, Optional, Tuple

import numpy as np

from app.utils.logger import get_logger


logger = get_logger(__name__)


class SprintPlannerModel:
    """
    Sprint planning optimizer using Thompson Sampling-like approach to select
    story combinations that maximize value while respecting capacity and risk.
    """

    def __init__(self):
        self.historical_performance = {}

    def suggest_stories_for_sprint(
        self,
        backlog: List[Dict],
        team_capacity: float,
        team_members: List[Dict],
        velocity: Optional[float] = None,
    ) -> Dict[str, any]:
        # Normalize backlog stories to ensure consistent field names
        normalized_backlog = []
        for story in backlog:
            normalized_story = {
                "story_id": story.get("story_id") or story.get("id") or str(story.get("_id", "")),
                "id": story.get("id") or story.get("story_id") or str(story.get("_id", "")),
                "title": story.get("title", ""),
                "story_points": story.get("story_points") or story.get("points") or 0,
                "points": story.get("points") or story.get("story_points") or 0,
                "priority": story.get("priority", "medium"),
                "complexity": story.get("complexity", "medium"),
                "business_value": story.get("business_value", 1),
                "blocked_by": story.get("blocked_by"),
                "dependencies": story.get("dependencies", []),
                "required_skills": story.get("required_skills", []),
            }
            normalized_backlog.append(normalized_story)
        
        effective_capacity = self._calculate_team_capacity(team_members, team_capacity)
        candidate_sets = self.optimize_story_selection(normalized_backlog, effective_capacity, team_members)

        best_selection = candidate_sets[0] if candidate_sets else []
        total_points = sum(s.get("story_points", 0) or s.get("points", 0) for s in best_selection)
        utilization = total_points / effective_capacity if effective_capacity else 0

        assignment = self.calculate_sprint_load(best_selection, team_members)
        completion_probability = self.simulate_sprint_outcome(best_selection, assignment["assignments"])
        risks = self._assess_risks(best_selection, assignment["assignments"])

        return {
            "suggested_stories": assignment["assignments"],
            "total_story_points": total_points,
            "team_capacity": effective_capacity,
            "capacity_utilization": f"{utilization * 100:.0f}%",
            "predicted_completion_probability": completion_probability,
            "risk_factors": risks,
            "alternative_selections": [
                {
                    "story_ids": [s.get("story_id") or s.get("id") for s in combo],
                    "total_points": sum(st.get("story_points", 0) or st.get("points", 0) for st in combo)
                }
                for combo in candidate_sets[1:4]
            ],
        }

    def _calculate_team_capacity(self, team_members: List[Dict], fallback: float) -> float:
        capacity = 0
        for member in team_members:
            remaining = member.get("capacity", 0) - member.get("current_workload", 0)
            if member.get("on_vacation"):
                remaining *= 0.5
            capacity += max(remaining, 0)
        return capacity or fallback

    def optimize_story_selection(
        self,
        backlog: List[Dict],
        capacity: float,
        team_members: List[Dict],
        iterations: int = 200,
    ) -> List[List[Dict]]:
        stories = [story for story in backlog if not story.get("blocked_by")]
        best_sets = []

        for _ in range(iterations):
            sample = self._thompson_sample(stories, capacity)
            if sample:
                best_sets.append(sample)

        best_sets.sort(
            key=lambda selection: (
                self._calculate_value(selection),
                -self._calculate_complexity_risk(selection),
            ),
            reverse=True,
        )
        return best_sets[:5]

    def _thompson_sample(self, stories: List[Dict], capacity: float) -> Optional[List[Dict]]:
        random.shuffle(stories)
        selection = []
        total = 0

        for story in stories:
            points = story.get("story_points", 0) or story.get("points", 0)
            priority_bonus = {"high": 1.5, "medium": 1.0, "low": 0.7}.get(story.get("priority", "medium"), 1.0)
            probability = np.random.beta(priority_bonus * 2, 2)

            if total + points <= capacity and probability > 0.4:
                selection.append(story)
                total += points
        return selection if selection else None

    def _calculate_value(self, stories: List[Dict]) -> float:
        value = 0
        for story in stories:
            priority = story.get("priority", "medium")
            value += story.get("business_value", 1) * {"high": 1.5, "medium": 1.0, "low": 0.7}.get(priority, 1.0)
        return value

    def _calculate_complexity_risk(self, stories: List[Dict]) -> float:
        complexities = {"low": 0.2, "medium": 0.5, "high": 0.8}
        return np.mean([complexities.get(story.get("complexity", "medium"), 0.5) for story in stories]) if stories else 0

    def calculate_sprint_load(self, selected_stories: List[Dict], team_members: List[Dict]) -> Dict[str, any]:
        assignments = []
        # Use user_id or _id as key, fallback to index if neither exists
        member_states = {}
        for m in team_members:
            key = m.get("user_id") or m.get("_id") or str(team_members.index(m))
            member_states[key] = m.copy()

        for story in selected_stories:
            candidate = self._find_best_assignee(story, member_states)
            if not candidate:
                continue

            user_id, member = candidate
            member["current_workload"] = member.get("current_workload", 0) + story.get("story_points", 0)
            assignments.append(
                {
                    "story_id": story.get("story_id") or story.get("id"),
                    "title": story.get("title"),
                    "story_points": story.get("story_points", 0),
                    "priority": story.get("priority", "medium"),
                    "suggested_assignee": member.get("name") or member.get("full_name") or user_id,
                    "reason": f"{member.get('name') or member.get('full_name') or user_id} has {self._remaining_capacity(member)} points remaining",
                }
            )
        return {"assignments": assignments}

    def _find_best_assignee(self, story: Dict, members: Dict[str, Dict]) -> Optional[Tuple[str, Dict]]:
        best_score = -1
        best_candidate = None
        for user_id, member in members.items():
            remaining = self._remaining_capacity(member)
            if remaining < story.get("story_points", 0):
                continue
            skill_match = self._skill_match(story.get("required_skills", []), member.get("skills", []))
            capacity_bonus = remaining / max(member.get("capacity", 1), 1)
            score = 0.7 * skill_match + 0.3 * capacity_bonus
            if score > best_score:
                best_score = score
                best_candidate = (user_id, member)
        return best_candidate

    def _skill_match(self, required: List[str], skills: List[str]) -> float:
        if not required:
            return 0.5
        set_required = set(skill.lower() for skill in required)
        set_skills = set(skill.lower() for skill in skills)
        if not set_skills:
            return 0
        return len(set_required & set_skills) / len(set_required)

    def _remaining_capacity(self, member: Dict) -> float:
        capacity = member.get("capacity", 0)
        workload = member.get("current_workload", 0)
        return max(capacity - workload, 0)

    def simulate_sprint_outcome(self, stories: List[Dict], assignments: List[Dict]) -> float:
        if not stories:
            return 0.0
        base_probability = 0.6
        complexity_risk = self._calculate_complexity_risk(stories)
        dependency_penalty = sum(0.05 for story in stories if story.get("dependencies"))  # each dependency adds risk
        return max(0.1, min(0.95, base_probability + 0.2 - complexity_risk - dependency_penalty))

    def _assess_risks(self, stories: List[Dict], assignments: List[Dict]) -> List[str]:
        risks = []
        high_complexity = [story for story in stories if story.get("complexity") == "high"]
        if len(high_complexity) > len(stories) * 0.4:
            risks.append(f"{len(high_complexity)} stories have high complexity")

        dependencies = [story for story in stories if story.get("dependencies")]
        if dependencies:
            risks.append(f"{len(dependencies)} stories have dependencies")

        overloaded = [assignment for assignment in assignments if "100%" in assignment.get("reason", "")]
        if overloaded:
            risks.append("One or more developers at 100% capacity")

        return risks or ["No major risks identified"]

