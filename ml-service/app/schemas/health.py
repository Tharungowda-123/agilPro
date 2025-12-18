from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "ml-service"
    timestamp: datetime


