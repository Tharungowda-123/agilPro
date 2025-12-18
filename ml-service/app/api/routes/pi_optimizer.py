from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_api_key
from app.ml.pi_optimizer import PIOptimizer
from app.utils.logger import get_logger

router = APIRouter(
    prefix="/api/ml/pi",
    tags=["PI Optimizer"],
    dependencies=[Depends(require_api_key)],
)

logger = get_logger(__name__)
pi_optimizer = PIOptimizer()


@router.post("/optimize")
async def optimize_pi(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Optimize feature distribution across sprints in a Program Increment.
    """
    try:
        features = payload.get("features", [])
        sprints = payload.get("sprints", [])
        dependencies = payload.get("dependencies", [])

        if not features:
            raise HTTPException(status_code=400, detail="Features are required")
        if not sprints:
            raise HTTPException(status_code=400, detail="Sprints are required")

        result = pi_optimizer.optimize(features, sprints, dependencies)

        return result
    except Exception as e:
        logger.error(f"Error optimizing PI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to optimize PI: {str(e)}")

