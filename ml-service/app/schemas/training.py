from typing import Optional

from pydantic import BaseModel


class TrainingRequest(BaseModel):
    model_type: str
    parameters: dict


class TrainingResponse(BaseModel):
    status: str
    accuracy: Optional[float] = None
    model_version: Optional[str] = None


__all__ = [
    "TrainingRequest",
    "TrainingResponse",
]

