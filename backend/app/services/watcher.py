from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
from app.services.organizer import move_file
import os

class FileHandler(FileSystemEventHandler):
    def __init__(self, directory):
        self.directory = directory

    def on_created(self, event):
        if not event.is_directory:
            time.sleep(1)  # wait for file to fully save
            print(f"[DETECTED] {event.src_path}")
            move_file(event.src_path, self.directory)


class Watcher:
    def __init__(self):
        self.observer = None
        self.directory = None
        self.is_running = False

    def start(self, directory: str):
        if self.is_running:
            print("[INFO] Watcher is already running")
            return

        # Validate directory FIRST
        if not os.path.exists(directory):
            raise FileNotFoundError(f"Directory not found: {directory}")
        
        try:
            self.directory = directory

            event_handler = FileHandler(directory)

            self.observer = Observer()
            self.observer.schedule(event_handler, directory, recursive=False)
            self.observer.start()

            self.is_running = True
            print(f"[STARTED] Watching: {directory}")
        except Exception as e:
            print(f"[ERROR] Failed to start watcher: {str(e)}")

    def stop(self):
        if not self.is_running or not self.observer:
            print("[INFO] Watcher is not running")
            return

        try:
            self.observer.stop()
            self.observer.join()

            self.is_running = False
            self.observer = None

            print("[STOPPED] Watcher stopped")

        except Exception as e:
            print(f"[ERROR] Failed to stop watcher: {str(e)}")