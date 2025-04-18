from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles        # ← hinzufügen
from .config import UPLOAD_DIR                     # ← hinzufügen
from .database import Base, engine
from . import models

# Routers
from .routes import users, contracts, contract_files

# Tabellen anlegen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PlanPago API",
    description="Vertragsverwaltung für Privatpersonen",
)

# CORS erlauben (in Prod bitte einschränken!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

# Router einbinden
app.include_router(users.router)
app.include_router(contracts.router)
app.include_router(contract_files.router)
