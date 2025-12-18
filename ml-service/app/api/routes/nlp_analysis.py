"""
NLP Analysis API Routes
Advanced NLP analysis for feature descriptions
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.core.security import require_api_key
from app.ml.advanced_feature_nlp import nlp_analyzer
from app.utils.logger import get_logger

router = APIRouter(
    prefix="/api/ml/features",
    tags=["Feature NLP Analysis"],
    dependencies=[Depends(require_api_key)],
)

logger = get_logger(__name__)


class FeatureAnalysisRequest(BaseModel):
    """Request model for NLP analysis."""

    feature_id: str
    title: str
    description: str
    business_value: Optional[str] = ""


class FeatureAnalysisResponse(BaseModel):
    """Response model for NLP analysis."""

    feature_id: str
    analysis: dict
    generated_stories: List[dict]
    confidence: float


@router.post("/analyze-nlp", response_model=FeatureAnalysisResponse)
async def analyze_feature_nlp(request: FeatureAnalysisRequest):
    """
    Perform advanced NLP analysis on feature description.
    """
    try:
        # Analyze feature
        analysis = nlp_analyzer.analyze_feature(
            title=request.title,
            description=request.description,
            business_value=request.business_value,
        )

        # Generate user stories
        stories = nlp_analyzer.generate_user_stories(analysis, request.title)

        # Calculate confidence
        confidence = analysis["intents"]["scores"].get(
            analysis["intents"]["primary"], 0.5
        )

        return FeatureAnalysisResponse(
            feature_id=request.feature_id,
            analysis=analysis,
            generated_stories=stories,
            confidence=confidence,
        )

    except Exception as e:
        logger.error(f"Error in NLP analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze feature: {str(e)}")

