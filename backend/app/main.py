from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext

from .database import Base, engine, SessionLocal
from .config import UPLOAD_DIR
from . import models

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

# CORS erlauben
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Static files für Anhänge
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

# Router import & einbinden
from .routes import users, contracts, contract_files

app.include_router(users.router)
app.include_router(contracts.router)
app.include_router(contract_files.router)
