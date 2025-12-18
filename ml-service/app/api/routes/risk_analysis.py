from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_api_key
from app.ml.risk_analyzer import RiskAnalyzerModel
from app.utils.logger import get_logger

router = APIRouter(prefix="/api/ml/risks", tags=["Risk Analysis"])
logger = get_logger(__name__)
risk_model = RiskAnalyzerModel()


@router.post(
    "/analyze-project",
    summary="Analyze project-level risks",
    dependencies=[Depends(require_api_key)],
)
async def analyze_project(payload: Dict[str, Any]) -> Dict[str, Any]:
    project_id = payload.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
    return risk_model.analyze_project_risks(project_id)


@router.post(
    "/analyze-sprint",
    summary="Analyze sprint-specific risks",
    dependencies=[Depends(require_api_key)],
)
async def analyze_sprint(payload: Dict[str, Any]) -> Dict[str, Any]:
    sprint_id = payload.get("sprint_id")
    if not sprint_id:
        raise HTTPException(status_code=400, detail="sprint_id is required")
    return risk_model.analyze_sprint_risks(sprint_id)


@router.post(
    "/detect-bottlenecks",
    summary="Detect overloaded developers",
    dependencies=[Depends(require_api_key)],
)
async def detect_bottlenecks(payload: Dict[str, Any]) -> Dict[str, Any]:
    team_id = payload.get("team_id")
    if not team_id:
        raise HTTPException(status_code=400, detail="team_id is required")
    return {"bottlenecks": risk_model.detect_bottlenecks("team", team_id)}


@router.post(
    "/predict-delays",
    summary="Predict sprint delays",
    dependencies=[Depends(require_api_key)],
)
async def predict_delays(payload: Dict[str, Any]) -> Dict[str, Any]:
    sprint_id = payload.get("sprint_id")
    if not sprint_id:
        raise HTTPException(status_code=400, detail="sprint_id is required")
    return risk_model.predict_delays("sprint", sprint_id)


@router.get(
    "/alerts/{team_id}",
    summary="Get active risk alerts for a team",
    dependencies=[Depends(require_api_key)],
)
async def risk_alerts(team_id: str) -> Dict[str, Any]:
    risks = risk_model.analyze_project_risks(team_id)
    alerts = [risk for risk in risks.get("risk_factors", []) if risk["score"] >= 60]
    return {"alerts": alerts}

