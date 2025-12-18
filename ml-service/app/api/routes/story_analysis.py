from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_api_key
from app.ml.feature_breakdown import FeatureBreakdownModel
from app.ml.story_analyzer import StoryAnalyzer
from app.utils.logger import get_logger

router = APIRouter(
    prefix="/api/ml/stories",
    tags=["Story Analysis"],
    dependencies=[Depends(require_api_key)],
)

logger = get_logger(__name__)
story_analyzer = StoryAnalyzer()
feature_breakdown = FeatureBreakdownModel()


@router.post("/analyze-complexity")
async def analyze_story(payload: Dict[str, Any]) -> Dict[str, Any]:
    title = payload.get("title")
    description = payload.get("description")
    acceptance_criteria: List[str] = payload.get("acceptance_criteria", [])

    if not title or not description:
        raise HTTPException(status_code=400, detail="title and description are required")

    return story_analyzer.analyze_story(title, description, acceptance_criteria)


@router.post("/estimate-points")
async def estimate_points(payload: Dict[str, Any]) -> Dict[str, Any]:
    complexity_score = payload.get("complexity_score")
    if complexity_score is None:
        analysis = analyze_story(payload)
        complexity_score = analysis.get("complexity_score", 5)
    points = story_analyzer.estimate_story_points(complexity_score)
    return {"estimated_story_points": points}


@router.post("/extract-requirements")
async def extract_requirements(payload: Dict[str, Any]) -> Dict[str, Any]:
    description = payload.get("description", "")
    requirements = story_analyzer.extract_requirements(description)
    return {"requirements_extracted": requirements}


@router.post("/find-similar")
async def find_similar(payload: Dict[str, Any]) -> Dict[str, Any]:
    description = payload.get("description", "")
    embedding = story_analyzer.embedder.encode(description)
    similar = story_analyzer.find_similar_stories(embedding)
    return {"similar_stories": similar}


@router.post("/breakdown")
async def breakdown_feature(payload: Dict[str, Any]) -> Dict[str, Any]:
    title = payload.get("title")
    description = payload.get("description")
    if not title or not description:
        raise HTTPException(status_code=400, detail="title and description are required")

    return feature_breakdown.break_down_feature(title, description)

