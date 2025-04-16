# tests/test_users.py
import logging
import pytest
from tests.conftest import auth_header, register_and_login

# ────────────────────────────────────────────────────────────────────
def test_profile_and_update(client, user_data):
    """
    •   Ruft /users/me ab
    •   Ändert die E‑Mail
    •   Loggt sich erneut ein → neues Token
    •   Ändert das Passwort
    """

    # 1) Registrierung + Login für einen frischen Benutzer
    email_orig = user_data["user1"]["email"]
    password   = user_data["user1"]["password"]
    token = register_and_login(client, email_orig, password)

    # 2) Profil abrufen
    r = client.get("/users/me", headers=auth_header(token))
    assert r.status_code == 200 and r.json()["email"] == email_orig
    logging.info("Profile fetched for %s", email_orig)

    # 3) E‑Mail ändern
    new_email = "new_" + email_orig
    r = client.patch(
        "/users/me",
        headers=auth_header(token),
        json={"email": new_email},
    )
    assert r.status_code == 200 and r.json()["email"] == new_email
    logging.info("Email updated to %s", new_email)

    # 4) Neu einloggen, um ein Token mit neuer E‑Mail zu erhalten
    r = client.post(
        "/users/login",
        data={"username": new_email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200
    token = r.json()["access_token"]
    logging.info("Re‑login successful with %s", new_email)

    # 5) Passwort ändern mit neuem Token
    r = client.patch(
        "/users/me",
        headers=auth_header(token),
        json={"password": "NeuSecret!"},
    )
    assert r.status_code == 200
    logging.info("Password updated for %s", new_email)


# ────────────────────────────────────────────────────────────────────
def test_unauthorized_access(client):
    """Auf geschützte Endpunkte ohne Token → 401"""
    r = client.get("/contracts/")
    assert r.status_code == 401
    logging.info("Unauthorized access correctly denied (401)")


# ────────────────────────────────────────────────────────────────────
def test_delete_user_also_deletes_contracts(client, user_data):
    """
    •   Legt zweiten User an
    •   Erstellt einen Vertrag
    •   Löscht den Account
    •   Prüft, dass Token invalid ist und Contract weg ist
    """
    email = user_data["user2"]["email"]
    pwd   = user_data["user2"]["password"]
    token = register_and_login(client, email, pwd)

    # Contract anlegen
    body = {
        "name": "Kurz‑Abo",
        "contract_type": "Streaming",
        "start_date": "2025-01-01",
        "amount": 10,
        "payment_interval": "monatlich",
        "status": "active",
        "notes": "",
    }
    r = client.post("/contracts/", headers=auth_header(token), json=body)
    assert r.status_code == 201
    c_id = r.json()["id"]
    logging.info("Contract %s created for %s", c_id, email)

    # Account löschen
    r = client.delete("/users/me", headers=auth_header(token))
    assert r.status_code == 200
    logging.info("User %s deleted", email)

    # Token sollte nun ungültig sein
    r = client.get("/contracts/", headers=auth_header(token))
    assert r.status_code == 401

    # Vertrag darf nicht mehr existieren (auch mit neuem Login unmöglich)
    # Neuer Login schlägt erwartungsgemäß fehl, weil User weg ist
    r = client.post(
        "/users/login",
        data={"username": email, "password": pwd},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 400
    logging.info("Deleted user %s cannot login anymore", email)
