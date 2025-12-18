from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_api_key
from app.ml.sprint_generator import SprintAutoGenerator
from app.utils.logger import get_logger

router = APIRouter(
    prefix="/api/ml/sprints",
    tags=["Sprint Generator"],
    dependencies=[Depends(require_api_key)],
)

logger = get_logger(__name__)
sprint_generator = SprintAutoGenerator()


@router.post("/auto-generate")
async def auto_generate_sprint_plan(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Auto-generate sprint plan instantly.
    Returns optimal story selection and task assignments.
    """
    try:
        sprint_id = payload.get("sprint_id")
        capacity = payload.get("capacity", 0)
        team_members = payload.get("team_members", [])
        available_stories = payload.get("available_stories", [])

        if not sprint_id:
            raise HTTPException(status_code=400, detail="sprint_id is required")
        if not team_members:
            raise HTTPException(status_code=400, detail="team_members are required")
        if not available_stories:
            raise HTTPException(status_code=400, detail="available_stories are required")

        result = sprint_generator.generate_plan(
            sprint_id=sprint_id,
            capacity=capacity,
            team_members=team_members,
            available_stories=available_stories,
        )

        return result
    except Exception as e:
        logger.error(f"Error auto-generating sprint plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate sprint plan: {str(e)}")

