import logging
import os
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app         # passe den Importpfad ggf. an

# ─── Logging ─────────────────────────────────────────────────────────
log_path = "tests/test_run.log"
os.makedirs("tests", exist_ok=True)
logging.basicConfig(
    filename=log_path,
    filemode="w",
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
)
logging.getLogger("passlib").setLevel(logging.WARNING)

# ─── Test‑Client ────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def client():
    return TestClient(app)

# ─── Dummy‑Users ────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def user_data():
    # eindeutige E‑Mails pro Testlauf
    u1 = f"alice_{uuid.uuid4().hex[:6]}@test.com"
    u2 = f"bob_{uuid.uuid4().hex[:6]}@test.com"
    return {
        "user1": {"email": u1, "password": "Sekret123!"},
        "user2": {"email": u2, "password": "Sekret123!"},
    }

# ─── Helper: Register + Login ───────────────────────────────────────
# tests/conftest.py
# ...
def register_and_login(client, email, password):
    """Versucht zu registrieren. Falls User schon existiert → direkt login."""
    reg = client.post("/users/", json={"email": email, "password": password})
    if reg.status_code == 201:
        logging.info("Registered %s", email)
    elif reg.status_code == 400:
        logging.info("User %s already exists – skipping registration", email)
    else:                                   # alle anderen Codes → Fehler
        reg.raise_for_status()

    # Login (immer)
    log = client.post(
        "/users/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert log.status_code == 200
    token = log.json()["access_token"]
    logging.info("Logged in %s, token received", email)
    return token


@pytest.fixture(scope="session")
def tokens(client, user_data):
    t1 = register_and_login(client, **user_data["user1"])
    t2 = register_and_login(client, **user_data["user2"])
    return {"user1": t1, "user2": t2}

# ─── Helper‑Header ──────────────────────────────────────────────────
def auth_header(token):
    return {"Authorization": f"Bearer {token}"}
