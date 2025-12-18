from fastapi import APIRouter

from app.api.routes import (
    health,
    ml,
    risk_analysis,
    sprint_planning,
    story_analysis,
    task_assignment,
    velocity_forecasting,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(ml.router, prefix="/api/ml", tags=["ML"])
api_router.include_router(task_assignment.router)
api_router.include_router(sprint_planning.router)
api_router.include_router(velocity_forecasting.router)
api_router.include_router(risk_analysis.router)
api_router.include_router(story_analysis.router)

# Feature breakdown routes
from app.api.routes import feature_breakdown

api_router.include_router(feature_breakdown.router)

# PI Optimizer routes
from app.api.routes import pi_optimizer

api_router.include_router(pi_optimizer.router)

# Sprint Generator routes
from app.api.routes import sprint_generator

api_router.include_router(sprint_generator.router)

# NLP Analysis routes
from app.api.routes import nlp_analysis

api_router.include_router(nlp_analysis.router)

# Training routes
from app.api.routes import training

api_router.include_router(training.router)



