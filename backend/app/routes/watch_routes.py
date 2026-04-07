from fastapi import APIRouter, HTTPException
from app.services.watcher import Watcher
from app.services import config
from app.schemas.watch_schemas import StartRequest

router = APIRouter()


@router.post("/start")
def start(req: StartRequest):
    if config.is_running:
        return {"message": "Watcher already running"}

    try:
        watcher = Watcher()
        message = watcher.start(req.directory)

        config.watcher_instance = watcher
        config.watch_directory = req.directory
        config.is_running = True

        return {"message": f"{message}"}
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
def stop():
    if not config.is_running:
        return {"message": "Watcher is not running"}

    config.watcher_instance.stop()

    config.watcher_instance = None
    config.is_running = False

    return {"message": "Watcher stopped"}


@router.get("/status")
def status():
    return {
        "running": config.is_running,
        "directory": config.watch_directory
    }

@router.get("/logs")
def get_logs():
    try:
        with open("activity.log", "r", encoding="utf-8") as f:
            lines = f.readlines()[-20:]  # last 20 logs
        return {"logs": lines}
    except:
        return {"logs": []}