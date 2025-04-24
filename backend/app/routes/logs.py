# backend/app/routes/logs.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from pathlib import Path

from .users import get_current_user
from ..models import User
from ..logging_config import LOG_FILE

router = APIRouter(prefix="/admin/logs", tags=["admin-logs"])

MAX_LINES_DEFAULT = 500

def tail(path: Path, lines: int) -> str:
    """Liefert die letzten *n* Zeilen einer Datei (ohne großes Memory)."""
    with path.open("rb") as f:
        f.seek(0, 2)
        end = f.tell()
        size = 0
        block = 1024
        data = b""
        n = 0
        while end > 0 and n <= lines:
            step = min(block, end)
            end -= step
            f.seek(end)
            data = f.read(step) + data
            n = data.count(b"\n")
        return b"\n".join(data.splitlines()[-lines:]).decode("utf-8", "ignore")

@router.get("", response_class=PlainTextResponse)
def read_logs(
    lines: int = MAX_LINES_DEFAULT,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin required")
    if not LOG_FILE.exists():
        return "No log file found."
    lines = max(1, min(lines, 5000))
    return tail(LOG_FILE, lines)
