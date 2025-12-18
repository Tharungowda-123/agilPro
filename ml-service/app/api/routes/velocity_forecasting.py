from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_api_key
from app.ml.velocity_forecaster import VelocityForecaster
from app.utils.logger import get_logger

router = APIRouter(prefix="/api/ml/velocity", tags=["Velocity Forecasting"])
logger = get_logger(__name__)
forecaster = VelocityForecaster()


@router.post(
    "/forecast",
    summary="Forecast next sprint velocity",
    dependencies=[Depends(require_api_key)],
)
async def forecast_velocity(payload: Dict[str, Any]) -> Dict[str, Any]:
    team_id = payload.get("team_id")
    capacity = payload.get("sprint_capacity", 0)
    if not team_id:
        raise HTTPException(status_code=400, detail="team_id is required")
    return forecaster.predict_velocity(team_id, capacity)


@router.post(
    "/predict-completion",
    summary="Estimate completion timeline given remaining work",
    dependencies=[Depends(require_api_key)],
)
async def predict_completion(payload: Dict[str, Any]) -> Dict[str, Any]:
    team_id = payload.get("team_id")
    remaining = payload.get("remaining_story_points", 0)
    if not team_id:
        raise HTTPException(status_code=400, detail="team_id is required")
    forecast = forecaster.predict_velocity(team_id, payload.get("sprint_capacity", 0))
    return forecaster.predict_completion_date(remaining, forecast.get("predicted_velocity", 0))


@router.post(
    "/detect-anomalies",
    summary="Detect anomalies in sprint velocities",
    dependencies=[Depends(require_api_key)],
)
async def detect_anomalies(payload: Dict[str, Any]) -> Dict[str, Any]:
    velocities = payload.get("velocities", [])
    if len(velocities) < 3:
        return {"anomalies": []}

    mean = sum(velocities) / len(velocities)
    std_dev = (sum((v - mean) ** 2 for v in velocities) / len(velocities)) ** 0.5

    anomalies = [
        {"sprint_index": idx, "velocity": velocity}
        for idx, velocity in enumerate(velocities)
        if abs(velocity - mean) > 2 * std_dev
    ]
    return {"anomalies": anomalies}


@router.get(
    "/trends/{team_id}",
    summary="Return velocity trend classification",
    dependencies=[Depends(require_api_key)],
)
async def velocity_trend(team_id: str) -> Dict[str, Any]:
    history = forecaster.load_sprint_history(team_id)
    velocities = [sprint.get("velocity", 0) for sprint in history]

    if len(velocities) < 2:
        return {"trend": "insufficient_data"}

    trend = "increasing" if velocities[-1] > velocities[0] else "decreasing"
    if abs(velocities[-1] - velocities[0]) < 3:
        trend = "stable"

    return {"trend": trend}

