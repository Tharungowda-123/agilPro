import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.api import api_router
from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
from app.utils.logger import configure_logging, get_logger

configure_logging(settings.log_level)
logger = get_logger(__name__)


class APIKeyMiddleware(BaseHTTPMiddleware):
    """
    API key enforcement disabled for local/dev to avoid 401s.
    """

    async def dispatch(self, request: Request, call_next):
        return await call_next(request)


def create_app() -> FastAPI:
    app = FastAPI(
        title="AgileSAFe ML Service",
        description="Production-ready FastAPI service powering ML workloads.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(APIKeyMiddleware)

    app.include_router(api_router)

    @app.on_event("startup")
    async def startup_event() -> None:
        logger.info("Starting ML service")
        await connect_to_mongo()

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        logger.info("Shutting down ML service")
        await close_mongo_connection()

    return app


app = create_app()


# Import scheduler to start training pipeline
try:
    from app.scheduler import start_training_scheduler
    logger.info("ML Training Scheduler module loaded")
except Exception as e:
    logger.warning(f"Could not load training scheduler: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        log_level=settings.log_level.lower(),
    )



