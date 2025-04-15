from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routes import users, contracts

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
