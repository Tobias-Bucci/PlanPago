# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Router‑Module
from app.routes import users, contracts, contract_files
from app.config import UPLOAD_DIR

app = FastAPI(
    title="PlanPago API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

# ───────────────────────────────
#  CORS (Frontend → Backend)
# ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # in Prod auf Domain einschränken
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ───────────────────────────────
#  Router registrieren
# ───────────────────────────────
app.include_router(users.router)
app.include_router(contracts.router)
app.include_router(contract_files.router)   # <— Upload & Download

# ───────────────────────────────
#  Statische Auslieferung der Files
# ───────────────────────────────
app.mount("/files", StaticFiles(directory=str(UPLOAD_DIR)), name="files")

# ───────────────────────────────
@app.get("/")
def root():
    return {"message": "Willkommen beim PlanPago Backend"}
