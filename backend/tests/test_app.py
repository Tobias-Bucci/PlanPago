import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import models
from app.database import SessionLocal

client = TestClient(app)

# Diese Fixture sorgt dafür, dass nach jedem Test alle Einträge gelöscht werden.
@pytest.fixture(autouse=True)
def clean_db():
    yield
    db = SessionLocal()
    # Lösche zunächst alle Verträge (falls Fremdschlüssel bestehen)
    db.query(models.Contract).delete()
    # Lösche alle User
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
    user_data = {"email": unique_email, "password": "secret"}
    
    # Registrierung eines Testnutzers
    response = client.post("/users/", json=user_data)
    assert response.status_code == 200, f"Registrierung fehlgeschlagen: {response.json()}"
    user_response = response.json()
    assert user_response["email"] == unique_email
    assert "id" in user_response

    # Login des Testnutzers (OAuth2 erwartet Formulardaten, daher das Argument 'data')
    login_data = {"username": unique_email, "password": "secret"}
    response = client.post("/users/login", data=login_data)
    assert response.status_code == 200, f"Login fehlgeschlagen: {response.json()}"
    token_response = response.json()
    assert "access_token" in token_response
    assert token_response["token_type"] == "bearer"

def test_contract_creation():
    # Erstelle einen Vertrag
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
    response = client.post("/contracts/", json=contract_data)
    assert response.status_code == 200, f"Vertragserstellung fehlgeschlagen: {response.json()}"
    contract_response = response.json()
    assert contract_response["name"] == "Test Contract"
    assert "id" in contract_response
