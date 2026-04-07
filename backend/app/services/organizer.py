import os
import shutil
from datetime import datetime

# File type mapping
FILE_CATEGORIES = {
    "documents": [".pdf", ".docx", ".txt"],
    "images": [".jpg", ".jpeg", ".png"],
    "videos": [".mp4", ".mkv"],
    "music": [".mp3", ".wav"]
}


def get_category(file_name: str):
    _, ext = os.path.splitext(file_name.lower())

    for category, extensions in FILE_CATEGORIES.items():
        if ext in extensions:
            return category

    return "others"


def generate_new_name(file_path):
    """
    Prevent overwriting existing files
    """
    base, ext = os.path.splitext(file_path)
    counter = 1

    new_path = file_path
    while os.path.exists(new_path):
        new_path = f"{base}_{counter}{ext}"
        counter += 1

    return new_path


def move_file(file_path: str, base_dir: str):
    """
    Move file into categorized folder
    """
    if not os.path.isfile(file_path):
        return

    file_name = os.path.basename(file_path)
    category = get_category(file_name)

    target_dir = os.path.join(base_dir, category)
    os.makedirs(target_dir, exist_ok=True)

    target_path = os.path.join(target_dir, file_name)

    # Prevent overwrite
    target_path = generate_new_name(target_path)

    try:
        now = datetime.now()
        moved_at = now.strftime("%H:%M:%S")
        shutil.move(file_path, target_path)
        print(f"[{moved_at}][MOVED] {file_name} → {category}/")

        with open("activity.log", "a", encoding="utf-8") as f:
            f.write(f"[{moved_at}]Moved {file_name} → {category}\n")
    except Exception as e:
        print(f"[ERROR] {e}")