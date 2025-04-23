from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from .config import UPLOAD_DIR
from .database import Base, engine, SessionLocal
from . import models
from .routes import users, contracts, contract_files
from .utils.email_utils import schedule_all_reminders

# Tabellen anlegen
Base.metadata.create_all(bind=engine)

# Admin‑User automatisch anlegen
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()
if not db.query(models.User).filter(models.User.email == "admin@admin").first():
    db.add(models.User(
        email="admin@admin",
        hashed_password=pwd_context.hash("admin"),
        is_admin=True
    ))
    db.commit()
db.close()

app = FastAPI(
    title="PlanPago API",
    description="Vertragsverwaltung für Privatpersonen",
)

origins = ["https://planpago.buccilab.com"]

# CORS erlauben
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Static files für Anhänge
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

# Scheduler mit CET
jobstores = {"default": MemoryJobStore()}
scheduler = BackgroundScheduler(jobstores=jobstores, timezone="Europe/Berlin")
scheduler.start()
# Scheduler in app.state verfügbar machen
app.state.scheduler = scheduler

@app.on_event("startup")
def load_existing_reminders():
    """Beim Start alle existierenden Contracts einplanen."""
    db = SessionLocal()
    for c in db.query(models.Contract).all():
        schedule_all_reminders(c, scheduler)
    db.close()

# Router einbinden
app.include_router(users.router)
app.include_router(contracts.router)
app.include_router(contract_files.router)
