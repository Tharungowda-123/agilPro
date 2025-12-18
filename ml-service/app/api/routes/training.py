"""
Training API Routes
Endpoints for ML model retraining and performance tracking
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.core.security import require_api_key
from app.ml.training_pipeline import training_pipeline
from app.utils.logger import get_logger

router = APIRouter(
    prefix="/api/ml/training",
    tags=["ML Training"],
    dependencies=[Depends(require_api_key)],
)

logger = get_logger(__name__)


class RetrainRequest(BaseModel):
    """Request model for manual retraining."""

    model_type: str
    force: Optional[bool] = False


class RetrainResponse(BaseModel):
    """Response model for retraining."""

    status: str
    message: str
    model_type: str
    new_version: Optional[int] = None
    metrics: Optional[Dict] = None


@router.post("/retrain/{model_type}", response_model=RetrainResponse)
async def trigger_retrain(
    model_type: str, background_tasks: BackgroundTasks, force: bool = False
):
    """
    Manually trigger model retraining.
    """
    valid_models = list(training_pipeline.models.keys())

    if model_type not in valid_models:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model type. Must be one of: {valid_models}",
        )

    # Run retraining in background
    background_tasks.add_task(training_pipeline.retrain_model, model_type)

    return RetrainResponse(
        status="accepted",
        message=f"Retraining {model_type} in background",
        model_type=model_type,
    )


@router.get("/models/performance/{model_type}")
async def get_model_performance(model_type: str):
    """
    Get model performance metrics over time.
    """
    try:
        metrics = list(
            training_pipeline.metrics_collection.find(
                {'model_type': model_type}, sort=[('trained_at', -1)], limit=20
            )
        )

        # Convert ObjectId to string for JSON serialization
        for metric in metrics:
            metric['_id'] = str(metric['_id'])
            if isinstance(metric.get('trained_at'), datetime):
                metric['trained_at'] = metric['trained_at'].isoformat()
            if isinstance(metric.get('deployed_at'), datetime):
                metric['deployed_at'] = metric['deployed_at'].isoformat()

        return {
            "status": "success",
            "model_type": model_type,
            "metrics": metrics,
        }
    except Exception as e:
        logger.error(f"Error getting model performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/stats")
async def get_all_models_stats():
    """
    Get current stats for all models.
    """
    try:
        stats = {}

        for model_type in training_pipeline.models.keys():
            latest_metric = training_pipeline.metrics_collection.find_one(
                {'model_type': model_type, 'is_active': True}, sort=[('trained_at', -1)]
            )

            if latest_metric:
                stats[model_type] = {
                    'version': latest_metric.get('version', 0),
                    'accuracy': latest_metric.get('accuracy', 0),
                    'precision': latest_metric.get('precision', 0),
                    'recall': latest_metric.get('recall', 0),
                    'f1_score': latest_metric.get('f1_score', 0),
                    'trained_at': (
                        latest_metric['trained_at'].isoformat()
                        if isinstance(latest_metric.get('trained_at'), datetime)
                        else str(latest_metric.get('trained_at', ''))
                    ),
                    'training_samples': latest_metric.get('training_samples', 0),
                    'improvement': latest_metric.get('improvement', 0),
                }
            else:
                stats[model_type] = {
                    'version': 0,
                    'accuracy': 0,
                    'trained_at': None,
                    'training_samples': 0,
                }

        return {
            "status": "success",
            "models": stats,
        }
    except Exception as e:
        logger.error(f"Error getting model stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retrain-all")
async def retrain_all_models(background_tasks: BackgroundTasks):
    """
    Manually trigger retraining for all models.
    """
    background_tasks.add_task(training_pipeline.retrain_all_models)

    return {
        "status": "accepted",
        "message": "Retraining all models in background",
    }


from datetime import datetime

