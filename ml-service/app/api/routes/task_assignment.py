from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import fetch_users_by_ids
from app.core.security import require_api_key
from app.core.redis_cache import cache_prediction
from app.ml.task_assignment import TaskAssignmentModel
from app.utils.logger import get_logger

router = APIRouter(prefix="/api/ml/tasks", tags=["Task Assignment"])
logger = get_logger(__name__)
model = TaskAssignmentModel()


def _normalize_team_members(team_members: List[Any]) -> List[Dict[str, Any]]:
    """
    Normalize team members to the expected format.
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
                "full_name": member.get("full_name") or member.get("name") or "Unknown",
                "skills": member.get("skills", []),
                "capacity": member.get("capacity") or member.get("availability") or 40,
                "current_workload": member.get("current_workload") or member.get("currentWorkload") or 0,
                "velocity": member.get("velocity", 0.0),
                "completion_rate": member.get("completion_rate", 0.5),
                "time_accuracy": member.get("time_accuracy", 0.5),
                "collaboration_index": member.get("collaboration_index", 0.5),
                "on_time_delivery": member.get("on_time_delivery", 0.5),
                "quality_score": member.get("quality_score", 0.5),
                "complexity_handled": member.get("complexity_handled", "medium"),
                "completed_similar_tasks": member.get("completed_similar_tasks", 0),
                "time_tracking_consistency": member.get("time_tracking_consistency", 0.5),
                "time_logging_variance": member.get("time_logging_variance", 0.3),
                "on_vacation": member.get("on_vacation", False),
            }
            normalized.append(normalized_member)
        return normalized
    else:
        # Unknown format, try to convert to strings and fetch
        user_ids = [str(m) for m in team_members]
        return fetch_users_by_ids(user_ids)


@router.post(
    "/recommend-assignee",
    summary="Recommend the best assignee for a task",
    dependencies=[Depends(require_api_key)],
)
async def recommend_assignee(payload: Dict[str, Any]) -> Dict[str, Any]:
    task = {
        "task_id": payload.get("task_id"),
        "title": payload.get("title"),
        "description": payload.get("description"),
        "required_skills": payload.get("required_skills", []),
        "estimated_hours": payload.get("estimated_hours"),
        "estimated_story_points": payload.get("story_points", 0),
        "complexity": payload.get("complexity", "medium"),
    }
    team_members_raw = payload.get("team_members", [])

    if not team_members_raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team member list cannot be empty.",
        )

    # Normalize team members (fetch from DB if needed)
    team_members = _normalize_team_members(team_members_raw)
    
    if not team_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not resolve team members. Please provide valid user IDs or developer objects.",
        )

    # Cache the result
    from app.core.redis_cache import cache_utils
    import hashlib
    import json
    
    # Generate cache key
    cache_key_data = {
        'task': task,
        'team_members': [m.get('user_id') or m.get('_id') for m in team_members],
    }
    cache_key_str = json.dumps(cache_key_data, sort_keys=True)
    cache_key_hash = hashlib.md5(cache_key_str.encode()).hexdigest()
    cache_key = f"ml:task-assign:{cache_key_hash}"
    
    # Try to get from cache
    cached_result = cache_utils.get(cache_key)
    if cached_result:
        logger.info(f"Cache HIT for task assignment: {cache_key}")
        return cached_result
    
    # Cache miss - get recommendations
    logger.info(f"Cache MISS for task assignment: {cache_key}")
    recommendations = model.get_recommendations(task, team_members)
    
    # Cache for 10 minutes
    cache_utils.set(cache_key, recommendations, 600)
    
    return recommendations


@router.post(
    "/batch-assign",
    summary="Recommend optimal assignment for multiple tasks",
    dependencies=[Depends(require_api_key)],
)
async def batch_assign(tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    assignments = []
    for task in tasks:
        team_members_raw = task.get("team_members", [])
        if not team_members_raw:
            continue
        team_members = _normalize_team_members(team_members_raw)
        if not team_members:
            continue
        recs = model.get_recommendations(task, team_members)
        if recs["recommendations"]:
            assignments.append(
                {
                    "task_id": task.get("task_id"),
                    "recommendation": recs["recommendations"][0],
                }
            )
    return {"assignments": assignments}


@router.post(
    "/rebalance-workload",
    summary="Suggest workload rebalancing for the team",
    dependencies=[Depends(require_api_key)],
)
async def rebalance_workload(payload: Dict[str, Any]) -> Dict[str, Any]:
    team_members_raw = payload.get("team_members", [])
    tasks = payload.get("tasks", [])

    team_members = _normalize_team_members(team_members_raw)
    
    suggestions = []
    for task in tasks:
        if not team_members:
            continue
        recs = model.get_recommendations(task, team_members)
        if recs["recommendations"]:
            top = recs["recommendations"][0]
            suggestions.append(
                {
                    "task_id": task.get("task_id"),
                    "suggested_user": top["user_id"],
                    "reasoning": top["reasoning"],
                    "workload_impact": top["workload_percentage"],
                }
            )
    return {"suggestions": suggestions}


@router.post(
    "/feedback",
    summary="Submit feedback on a recommendation",
    dependencies=[Depends(require_api_key)],
)
async def submit_feedback(payload: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("Feedback received: %s", payload)
    # Future: store in DB for continuous learning.
    return {"status": "received"}


@router.get(
    "/model-stats",
    summary="Get task assignment model statistics",
    dependencies=[Depends(require_api_key)],
)
async def model_stats() -> Dict[str, Any]:
    return {
        "model_version": model.model_version,
        "trained": bool(model.clf),
        "features": model.feature_columns,
    }

