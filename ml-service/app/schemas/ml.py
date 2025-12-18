from typing import List, Optional

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    data: List[float] = Field(..., description="Numerical payload used for inference.")
    model_name: str = Field("default-regression", description="Model identifier.")


class PredictionResult(BaseModel):
    prediction: List[float]
    confidence: float
    model_used: str


class AnalysisRequest(BaseModel):
    text: str


class AnalysisResult(BaseModel):
    sentiment: str
    keywords: List[str]
    summary: str


class ModelInfo(BaseModel):
    name: str
    type: str
    version: str
    status: str


class ModelCatalog(BaseModel):
    models: List[ModelInfo]
    total: int


