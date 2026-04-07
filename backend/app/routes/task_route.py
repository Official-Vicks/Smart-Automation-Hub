from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import SessionLocal
from app.models.task_model import Task
from app.schemas.task_schemas import TaskCreate, TaskResponse
from typing import List
from datetime import datetime

def parse_datetime(dt_str: str):
    return datetime.strptime(dt_str, "%d/%m/%y %I:%M %p")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

@router.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    try:
        parsed_time = parse_datetime(task.due_time)
    except ValueError:
        return {"error": "Invalid date format. Use DD/MM/YY HH:MM"}

    new_task = Task(
        title=task.title,
        description=task.description,
        due_time=parsed_time
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()

@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_tasks_by_id(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task at ID {task_id} not found")
    
    return task

@router.put("/tasks/{task_id}/complete", response_model=TaskResponse)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task.is_completed = True
    db.commit()
    db.refresh(task)

    return task
