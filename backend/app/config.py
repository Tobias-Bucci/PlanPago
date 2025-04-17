# app/config.py
import pathlib
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploaded_files"
UPLOAD_DIR.mkdir(exist_ok=True)
