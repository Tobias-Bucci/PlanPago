from fastapi import FastAPI
from .routes import users, contracts
from .database import engine, Base
from . import models

# Erstellen aller Tabellen (User, Contract, etc.)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PlanPago API",
    description="API zur Verwaltung von Verträgen, Zahlungsverpflichtungen und Fristen",
    version="1.0"
)

app.include_router(users.router)
app.include_router(contracts.router)

@app.get("/")
def read_root():
    return {"message": "Willkommen beim PlanPago Backend"}
