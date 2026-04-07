from sqlalchemy import Column, String, Integer, DateTime, Boolean
from db import Base
from datetime import datetime


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    due_time = Column(DateTime, nullable=False)

    is_completed = Column(Boolean, default=False)
    is_notified = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)