# backend/app/routes/logs.py
"""
Server-side log tailing for the Admin Panel.

Endpoints (admin only)
─────────────────────────────────────────────────────────────
GET /admin/logs?lines=400          →   server.log
GET /admin/email-logs?lines=400    →   emails.log
"""
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse

from .users import get_current_user           # reuse auth helper
from ..models import User
from ..logging_config import LOG_FILE         # server.log location

router = APIRouter(prefix="/admin", tags=["admin-logs"])

# ------------------------------------------------------------------
# e-mail log lives next to server.log inside /logs/
# ------------------------------------------------------------------
MAIL_LOG: Path = LOG_FILE.parent / "emails.log"

MAX_LINES_DEFAULT = 500
MAX_LINES_HARD    = 5_000


# ------------------------------------------------------------------
# tiny, memory-friendly tail implementation
# ------------------------------------------------------------------
def _tail(path: Path, lines: int) -> str:
    """Return *lines* last lines of *path* without loading entire file."""
    with path.open("rb") as f:
        f.seek(0, 2)                       # -> EOF
        end = f.tell()
        data = b""
        block = 1024
        while end > 0 and data.count(b"\n") <= lines:
            step = min(block, end)
            end -= step
            f.seek(end)
            data = f.read(step) + data
        return b"\n".join(data.splitlines()[-lines:]).decode("utf-8", "ignore")


def _ensure_admin(u: User) -> None:
    if not u.is_admin:
        raise HTTPException(403, "Admin privileges required")


# ------------------------------------------------------------------
# server.log
# ------------------------------------------------------------------
@router.get("/logs", response_class=PlainTextResponse)
def read_server_log(
    lines: int = MAX_LINES_DEFAULT,
    cur:   User = Depends(get_current_user),
):
    """Tail the main application log (server.log)."""
    _ensure_admin(cur)
    if not LOG_FILE.exists():
        return "No server log yet."
    lines = max(1, min(lines, MAX_LINES_HARD))
    return _tail(LOG_FILE, lines)


# ------------------------------------------------------------------
# emails.log
# ------------------------------------------------------------------
@router.get("/email-logs", response_class=PlainTextResponse)
def read_mail_log(
    lines: int = MAX_LINES_DEFAULT,
    cur:   User = Depends(get_current_user),
):
    """Tail the e-mail outbox log (emails.log)."""
    _ensure_admin(cur)
    if not MAIL_LOG.exists():
        return "No mail log yet."
    lines = max(1, min(lines, MAX_LINES_HARD))
    return _tail(MAIL_LOG, lines)
