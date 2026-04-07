from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

from db import SessionLocal
from app.models.task_model import Task
import os


scheduler = BackgroundScheduler()


def check_due_tasks():
    db = SessionLocal()
    try:
        now = datetime.utcnow()

        tasks = db.query(Task).filter(
            Task.due_time <= now,
            Task.is_notified == False,
            Task.is_completed == False
        ).all()

        for task in tasks:
            print(f"Reminder: {task.title} (Due: {task.due_time})")
            with open("activity.log", "a", encoding="utf-8") as f:
                f.write(f"Reminder: {task.title} (Due: {task.due_time})\n")

            task.is_notified = True
            db.commit()

    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(check_due_tasks, "interval", minutes=1)
    scheduler.start()