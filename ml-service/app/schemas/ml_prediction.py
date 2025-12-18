from typing import Any, List, Optional

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    payload: Any
    model_name: Optional[str] = None
    options: Optional[dict] = None


class PredictionResponse(BaseModel):
    prediction: Any
    confidence: Optional[float] = None
    reasoning: Optional[str] = None
    alternatives: List[Any] = []


class TaskAssignmentRecommendation(BaseModel):
    user: str
    confidence: float
    reasoning: Optional[str] = None
    workload_impact: Optional[float] = None
    metadata: dict = Field(default_factory=dict)


class ComplexityAnalysis(BaseModel):
    overall_score: float
    breakdown: dict
    estimated_points: Optional[float] = None
    confidence: Optional[float] = None


class RiskAlert(BaseModel):
    risk_type: str
    severity: str
    affected_items: List[str]
    mitigation_suggestions: List[str] = []


__all__ = [
    "PredictionRequest",
    "PredictionResponse",
    "TaskAssignmentRecommendation",
    "ComplexityAnalysis",
    "RiskAlert",
]

