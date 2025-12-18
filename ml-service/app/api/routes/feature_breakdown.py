from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_api_key
from app.ml.feature_breakdown import FeatureBreakdownModel
from app.utils.logger import get_logger

router = APIRouter(
    prefix="/api/ml/features",
    tags=["Feature Breakdown"],
    dependencies=[Depends(require_api_key)],
)

logger = get_logger(__name__)
feature_breakdown_model = FeatureBreakdownModel()


@router.post("/analyze")
async def analyze_feature(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Comprehensive AI analysis of a feature.
    Returns: complexity, personas, components, requirements, confidence
    """
    try:
        title = payload.get("title", "")
        description = payload.get("description", "")
        business_value = payload.get("business_value", "")
        acceptance_criteria: List[str] = payload.get("acceptance_criteria", [])

        if not title or not description:
            raise HTTPException(status_code=400, detail="title and description are required")

        analysis = feature_breakdown_model.analyze_feature(
            title=title,
            description=description,
            business_value=business_value,
            acceptance_criteria=acceptance_criteria,
        )

        return {
            "analysis": analysis,
            "confidence": analysis.get("confidence", 0.85),
        }
    except Exception as e:
        logger.error(f"Error analyzing feature: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze feature: {str(e)}")


@router.post("/breakdown")
async def breakdown_feature(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Complete feature breakdown: analysis + stories + tasks.
    Returns: analysis, suggested_breakdown (stories with tasks), confidence
    """
    try:
        title = payload.get("title", "")
        description = payload.get("description", "")
        business_value = payload.get("business_value", "")
        acceptance_criteria: List[str] = payload.get("acceptance_criteria", [])

        if not title or not description:
            raise HTTPException(status_code=400, detail="title and description are required")

        result = feature_breakdown_model.break_down_feature(
            title=title,
            description=description,
            business_value=business_value,
            acceptance_criteria=acceptance_criteria,
        )

        return result
    except Exception as e:
        logger.error(f"Error breaking down feature: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to break down feature: {str(e)}")

