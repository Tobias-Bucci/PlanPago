from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from passlib.context import CryptContext
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore

from .config import UPLOAD_DIR
from .database import Base, engine, SessionLocal
from . import models
from .routes import users, contracts, contract_files, logs          # NEW
from .utils.email_utils import schedule_all_reminders
from .logging_config import setup_logging                           # NEW

# ────────────── Basics & Logging ─────────────────────────────────
load_dotenv()                 # lädt .env (+ .env.development bei Bedarf)
setup_logging()               # file- & console-Logger aktivieren

# ────────────── DB-Schema & Admin-Seed ───────────────────────────
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()
if not db.query(models.User).filter(models.User.email == "admin@admin").first():
    db.add(
        models.User(
            email="admin@admin",
            hashed_password=pwd_context.hash("admin"),
            is_admin=True,
        )
    )
    db.commit()
db.close()

# ────────────── FastAPI-App ──────────────────────────────────────
app = FastAPI(
    title="PlanPago API",
    description="Vertragsverwaltung für Privatpersonen",
)

# ────────────── CORS ─────────────────────────────────────────────
origins = os.getenv("CORS_ORIGINS", "").split(",")
if not origins or origins == [""]:
    origins = ["https://planpago.buccilab.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ────────────── Static-Files (Uploads) ───────────────────────────
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

# ────────────── Scheduler (Reminder-Jobs) ────────────────────────
jobstores = {"default": MemoryJobStore()}
scheduler = BackgroundScheduler(jobstores=jobstores, timezone="Europe/Berlin")
scheduler.start()
app.state.scheduler = scheduler

@app.on_event("startup")
def load_existing_reminders():
    """Beim Start Reminder für alle vorhandenen Verträge neu planen."""
    session = SessionLocal()
    for c in session.query(models.Contract).all():
        schedule_all_reminders(c, scheduler, replace=True)  # Fix: replace=True, damit Reminder-Jobs nicht dupliziert werden
    session.close()

# ────────────── Router registrieren ──────────────────────────────
app.include_router(users.router)
app.include_router(contracts.router)
app.include_router(contract_files.router)
app.include_router(logs.router)        # NEW  →  /admin/logs
