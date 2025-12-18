from typing import Optional

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    key: str
    team: Optional[str] = None
    status: Optional[str] = None


__all__ = ["ProjectBase"]

