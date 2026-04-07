from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_time: str


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_time: datetime
    is_completed: bool
    is_notified: bool
    created_at: datetime

    class Config:
        from_attributes = True