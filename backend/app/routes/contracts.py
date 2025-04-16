# app/routes/contracts.py
"""
REST‑Endpoints für Vertrags‑CRUD – mandanten­sicher:
Jeder Aufruf ist an den eingeloggten Benutzer (current_user) gebunden,
über das Foreign‑Key‑Feld  Contract.user_id.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, database
from ..routes.users import get_current_user   # current_user Dependency

# ─── FastAPI‑Router ──────────────────────────────────────────────────────
router = APIRouter(
    prefix="/contracts",
    tags=["contracts"],
)

# ─── DB‑Session Dependency ──────────────────────────────────────────────
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ────────────────────────────────────────────────────────────────────────
#  Create  (POST /contracts/)
# ────────────────────────────────────────────────────────────────────────
@router.post("/", response_model=schemas.Contract, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract: schemas.ContractCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_contract = models.Contract(
        **contract.model_dump(),
        user_id=current_user.id,          #  Besitzer festlegen
    )
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

# ────────────────────────────────────────────────────────────────────────
#  List  (GET /contracts/)
# ────────────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[schemas.Contract])
def read_contracts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Contract)
        .filter(models.Contract.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

# ────────────────────────────────────────────────────────────────────────
#  Read single  (GET /contracts/{id})
# ────────────────────────────────────────────────────────────────────────
@router.get("/{contract_id}", response_model=schemas.Contract)
def read_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contract = (
        db.query(models.Contract)
        .filter(
            models.Contract.id == contract_id,
            models.Contract.user_id == current_user.id,
        )
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

# ────────────────────────────────────────────────────────────────────────
#  Update  (PATCH /contracts/{id})
# ────────────────────────────────────────────────────────────────────────
@router.patch("/{contract_id}", response_model=schemas.Contract)
def update_contract(
    contract_id: int,
    upd: schemas.ContractUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contract = (
        db.query(models.Contract)
        .filter(
            models.Contract.id == contract_id,
            models.Contract.user_id == current_user.id,
        )
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    for key, value in upd.model_dump(exclude_unset=True).items():
        setattr(contract, key, value)

    db.commit()
    db.refresh(contract)
    return contract

# ────────────────────────────────────────────────────────────────────────
#  Delete  (DELETE /contracts/{id})
# ────────────────────────────────────────────────────────────────────────
@router.delete("/{contract_id}", response_model=schemas.Contract)
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contract = (
        db.query(models.Contract)
        .filter(
            models.Contract.id == contract_id,
            models.Contract.user_id == current_user.id,
        )
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    db.delete(contract)
    db.commit()
    return contract
