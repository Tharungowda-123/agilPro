from typing import Any, Dict, List

from fastapi import APIRouter, Depends

from app.core.database import fetch_users_by_ids
from app.core.security import require_api_key
from app.ml.sprint_planner import SprintPlannerModel
from app.utils.logger import get_logger

router = APIRouter(prefix="/api/ml/sprints", tags=["Sprint Planning"])
logger = get_logger(__name__)
planner = SprintPlannerModel()


def _normalize_team_members(team_members: List[Any]) -> List[Dict[str, Any]]:
    """
    Normalize team members to the expected format for sprint planning.
    If team_members contains strings (user IDs), fetch from database.
    If already dictionaries, ensure they have required fields.
    """
    if not team_members:
        return []
    
    # Check if first item is a string (user ID) or dict
    if isinstance(team_members[0], str):
        # Fetch from database
        return fetch_users_by_ids(team_members)
    elif isinstance(team_members[0], dict):
        # Already in dict format, but ensure required fields exist
        normalized = []
        for member in team_members:
            normalized_member = {
                "user_id": member.get("user_id") or member.get("_id") or str(member.get("id", "")),
                "_id": member.get("_id") or member.get("user_id") or str(member.get("id", "")),
                "name": member.get("name") or member.get("full_name") or "Unknown",
                "skills": member.get("skills", []),
                "capacity": member.get("capacity", 40),
                "current_workload": member.get("current_workload", 0),
                "on_vacation": member.get("on_vacation", False),
            }
            normalized.append(normalized_member)
        return normalized
    else:
        # Unknown format, try to convert to strings and fetch
        user_ids = [str(m) for m in team_members]
        return fetch_users_by_ids(user_ids)


@router.post(
    "/optimize-plan",
    summary="Optimize sprint plan based on capacity and backlog",
    dependencies=[Depends(require_api_key)],
)
async def optimize_sprint_plan(payload: Dict[str, Any]) -> Dict[str, Any]:
    team_members_raw = payload.get("team_members", [])
    team_members = _normalize_team_members(team_members_raw)
    
    result = planner.suggest_stories_for_sprint(
        backlog=payload.get("available_stories", []),
        team_capacity=payload.get("sprint_capacity", 0),
        team_members=team_members,
    )
    return result


@router.post(
    "/predict-velocity",
    summary="Predict team velocity for upcoming sprint",
    dependencies=[Depends(require_api_key)],
)
async def predict_velocity(payload: Dict[str, Any]) -> Dict[str, Any]:
    history = payload.get("historical_velocities", [])
    if not history:
        return {"predicted_velocity": 0, "confidence_interval": [0, 0], "confidence": 0.0}

    mean_velocity = sum(history) / len(history)
    std_dev = (sum((v - mean_velocity) ** 2 for v in history) / len(history)) ** 0.5

    return {
        "predicted_velocity": round(mean_velocity),
        "confidence_interval": [round(mean_velocity - std_dev), round(mean_velocity + std_dev)],
        "confidence": 0.85,
    }


@router.post(
    "/simulate",
    summary="Simulate sprint outcome for selected stories",
    dependencies=[Depends(require_api_key)],
)
async def simulate_sprint(payload: Dict[str, Any]) -> Dict[str, Any]:
    stories = payload.get("stories", [])
    assignments = payload.get("assignments", [])
    probability = planner.simulate_sprint_outcome(stories, assignments)
    risks = planner._assess_risks(stories, assignments)  # noqa: SLF001

    return {
        "predicted_completion_probability": probability,
        "risk_factors": risks,
    }


@router.post(
    "/suggest-stories",
    summary="Suggest top backlog stories based on constraints",
    dependencies=[Depends(require_api_key)],
)
async def suggest_stories(payload: Dict[str, Any]) -> Dict[str, Any]:
    backlog = payload.get("available_stories", [])
    team_capacity = payload.get("team_capacity", 0)
    team_members_raw = payload.get("team_members", [])

    team_members = _normalize_team_members(team_members_raw)
    result = planner.suggest_stories_for_sprint(backlog, team_capacity, team_members)
    return {"suggested_stories": result.get("suggested_stories", [])[:10]}

