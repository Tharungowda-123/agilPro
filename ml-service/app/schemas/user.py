from typing import List, Optional

from pydantic import BaseModel, Field


class UserBase(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: str
    role: str
    skills: List[str] = Field(default_factory=list)
    availability: Optional[float] = None
    team: Optional[str] = None


class UserWithWorkload(UserBase):
    current_workload: Optional[float] = None
    capacity_used_percentage: Optional[float] = None


class UserPerformance(BaseModel):
    id: str = Field(..., alias="_id")
    tasks_completed: int
    avg_completion_time: float
    velocity: float


__all__ = [
    "UserBase",
    "UserWithWorkload",
    "UserPerformance",
]

