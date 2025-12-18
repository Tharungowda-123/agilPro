from fastapi import APIRouter, Depends

from app.core.security import require_api_key
from app.schemas.ml import (
    AnalysisRequest,
    AnalysisResult,
    ModelCatalog,
    PredictionRequest,
    PredictionResult,
)
from app.services.ml_service import ml_service

router = APIRouter(dependencies=[Depends(require_api_key)])


@router.get("/info", response_model=ModelCatalog)
async def get_model_catalog() -> ModelCatalog:
    """
    Return metadata about the loaded/supported ML models.
    """
    models = ml_service.list_models()
    return ModelCatalog(models=models, total=len(models))


@router.post("/predict", response_model=PredictionResult)
async def predict(payload: PredictionRequest) -> PredictionResult:
    """
    Run inference using one of the available regression/classification models.
    """
    return PredictionResult(**ml_service.predict(payload.data, payload.model_name))


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_text(payload: AnalysisRequest) -> AnalysisResult:
    """
    Run lightweight NLP analysis (placeholder for future transformer integration).
    """
    return AnalysisResult(**ml_service.analyze_text(payload.text))



