import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
from db import engine, Base
from app.routes.task_route import router
from scheduler import start_scheduler
from app.routes.watch_routes import router as watch_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown (optional for now)


# app entry point
app = FastAPI(lifespan=lifespan, title="Automation Api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_path = Path(__file__).resolve().parent.parent / "frontend"

app.mount("/static", StaticFiles(directory=frontend_path), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse(frontend_path / "index.html")

# Include routes
app.include_router(router)
app.include_router(watch_router)