from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import HTTPException, Request
from .database import engine, Base
from . import models
from .routes import users, contracts
from app.logging_config import setup_logging
setup_logging()

# Erstelle zuerst das FastAPI-Objekt
app = FastAPI(
    title="PlanPago API",
    description="API zur Verwaltung von Verträgen, Zahlungsverpflichtungen und Fristen",
    version="1.0"
)

# CORS-Middleware hinzufügen
origins = [
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "http://192.168.1.150:4000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Erstelle alle Tabellen in der Datenbank
Base.metadata.create_all(bind=engine)

# Binde die Router ein
app.include_router(users.router)
app.include_router(contracts.router)

@app.get("/")
def read_root():
    return {"message": "Willkommen beim PlanPago Backend"}

@app.exception_handler(HTTPException)
async def custom_http_exception(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail or exc.status_code},
    )
