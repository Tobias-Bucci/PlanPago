# backend/app/main.py

import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base
from .routes import users, contracts, contract_files

# 1. Load environment variables from .env
load_dotenv()

# 2. Create all database tables (if they don't exist)
Base.metadata.create_all(bind=engine)

# 3. Instantiate FastAPI app
app = FastAPI(
    title="PlanPago",
    description="API für die Vertragsverwaltung mit Nutzer-Authentifizierung",
)

# 4. Configure CORS
#    Default: allow all origins; 
#    Override via CORS_ORIGINS env, z.B. "http://localhost:4000,https://myfrontend.example.com"
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Mount directory for uploaded files (contract attachments)
UPLOADS_DIR = os.getenv("UPLOADS_DIR", "files")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/files", StaticFiles(directory=UPLOADS_DIR), name="files")

# 6. Include all Routers
app.include_router(users.router)
app.include_router(contracts.router)
app.include_router(contract_files.router)
