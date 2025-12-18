from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """
    Lightweight readiness endpoint used by the platform and orchestrators.
    """
    return HealthResponse(timestamp=datetime.now(timezone.utc))



