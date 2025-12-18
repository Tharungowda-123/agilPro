from typing import List, Optional

from pydantic import BaseModel, Field


class StoryBase(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    description: Optional[str] = None
    story_points: Optional[int] = Field(None, alias="storyPoints")
    priority: Optional[str] = None
    status: Optional[str] = None
    project: Optional[str] = None
    sprint: Optional[str] = None

    class Config:
        populate_by_name = True


class StoryWithComplexity(StoryBase):
    ai_insights: Optional[dict] = Field(default=None, alias="aiInsights")


class StoryForAnalysis(BaseModel):
    title: str
    description: Optional[str] = None
    acceptance_criteria: List[str] = Field(default_factory=list, alias="acceptanceCriteria")

    class Config:
        populate_by_name = True


__all__ = [
    "StoryBase",
    "StoryWithComplexity",
    "StoryForAnalysis",
]

