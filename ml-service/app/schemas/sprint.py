from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class SprintBase(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    project: str
    start_date: Optional[date] = Field(None, alias="startDate")
    end_date: Optional[date] = Field(None, alias="endDate")
    capacity: Optional[float] = None
    velocity: Optional[float] = None
    status: Optional[str] = None

    class Config:
        populate_by_name = True


class SprintWithRetrospective(SprintBase):
    retrospective: Optional[dict] = None


class SprintForPlanning(BaseModel):
    capacity: float
    team_members: List[str] = Field(default_factory=list)
    available_stories: List[str] = Field(default_factory=list)
    team_velocity: Optional[float] = None


__all__ = [
    "SprintBase",
    "SprintWithRetrospective",
    "SprintForPlanning",
]

