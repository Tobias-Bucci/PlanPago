import logging
from .conftest import auth_header

def test_contract_crud_and_tenant_isolation(client, tokens):
    t1 = tokens["user1"]
    t2 = tokens["user2"]

    body = {
        "name": "Miete Wohnung",
        "contract_type": "Miete",
        "start_date": "2025-02-01",
        "amount": 850,
        "payment_interval": "monatlich",
        "status": "active",
        "notes": "Warmmiete",
    }

    # user1 legt Contract an
    r = client.post("/contracts/", headers=auth_header(t1), json=body)
    assert r.status_code == 201
    contract_id = r.json()["id"]
    logging.info("User1 created contract %s", contract_id)

    # user1 sieht seinen Contract in der Liste
    r = client.get("/contracts/", headers=auth_header(t1))
    assert any(c["id"] == contract_id for c in r.json())
    logging.info("Contract %s visible for user1", contract_id)

    # user2 sieht den Contract NICHT
    r = client.get("/contracts/", headers=auth_header(t2))
    assert all(c["id"] != contract_id for c in r.json())
    logging.info("Contract not visible for user2 (tenant isolation OK)")

    # user2 versucht, fremden Contract zu löschen → 404
    r = client.delete(f"/contracts/{contract_id}", headers=auth_header(t2))
    assert r.status_code == 404
    logging.info("User2 cannot delete user1 contract (404)")

    # user1 löscht seinen Contract erfolgreich
    r = client.delete(f"/contracts/{contract_id}", headers=auth_header(t1))
    assert r.status_code == 200
    logging.info("User1 deleted contract %s", contract_id)
