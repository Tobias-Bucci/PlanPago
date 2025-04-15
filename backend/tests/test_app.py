import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import models
from app.database import SessionLocal

client = TestClient(app)

# Diese Fixture wird nach jedem Test ausgeführt und löscht alle erstellten Einträge.
@pytest.fixture(autouse=True)
def clean_db():
    yield
    db = SessionLocal()
    db.query(models.Contract).delete()
    db.query(models.User).delete()
    db.commit()
    db.close()

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Willkommen beim PlanPago Backend"}

def test_user_registration_and_login():
    # Generiere eine eindeutige E-Mail-Adresse
    unique_email = f"test_{uuid.uuid4().hex}@example.com"
    # Registrierung
    user_data = {"email": unique_email, "password": "secret"}
    reg_response = client.post("/users/", json=user_data)
    assert reg_response.status_code == 200, f"Registrierungsfehler: {reg_response.json()}"
    user = reg_response.json()
    assert user["email"] == unique_email
    assert "id" in user

    # Login (über OAuth2 erwartet der Endpoint Form-Daten)
    login_data = {"username": unique_email, "password": "secret"}
    login_response = client.post("/users/login", data=login_data)
    assert login_response.status_code == 200, f"Loginfehler: {login_response.json()}"
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

def test_contract_creation_and_retrieval():
    # Vertrag erstellen
    contract_data = {
        "name": "Test Contract",
        "contract_type": "Miete",
        "start_date": "2025-04-15T16:25:21.113Z",
        "end_date": "2025-04-15T16:25:21.113Z",
        "amount": 500.0,
        "payment_interval": "monatlich",
        "status": "active",
        "notes": "Testvertrag"
    }
    create_response = client.post("/contracts/", json=contract_data)
    assert create_response.status_code == 200, f"Vertragserstellungsfehler: {create_response.json()}"
    created_contract = create_response.json()
    assert created_contract["name"] == "Test Contract"
    assert "id" in created_contract

    # Abrufen aller Verträge
    get_response = client.get("/contracts/")
    assert get_response.status_code == 200, f"Fehler beim Abrufen der Verträge: {get_response.json()}"
    contracts = get_response.json()
    # Es sollte einen Vertrag geben, der der erstellte entspricht
    assert any(c["id"] == created_contract["id"] for c in contracts)
