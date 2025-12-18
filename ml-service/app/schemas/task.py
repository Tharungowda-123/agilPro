from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    description: Optional[str] = None
    story: Optional[str] = None
    assigned_to: Optional[str] = Field(None, alias="assignedTo")
    status: str
    priority: str
    estimated_hours: Optional[float] = Field(None, alias="estimatedHours")
    actual_hours: Optional[float] = Field(None, alias="actualHours")

    class Config:
        populate_by_name = True


class TaskForAssignment(TaskBase):
    required_skills: List[str] = Field(default_factory=list)
    complexity: Optional[str] = None


class TaskTimeTracking(BaseModel):
    id: str = Field(..., alias="_id")
    task: str
    user: str
    hours_logged: float
    date: datetime


__all__ = [
    "TaskBase",
    "TaskForAssignment",
    "TaskTimeTracking",
]

