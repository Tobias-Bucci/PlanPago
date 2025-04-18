# backend/app/routes/contracts.py

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from .users import get_current_user
from ..utils.email_utils import schedule_all_reminders

router = APIRouter(
    prefix="/contracts",
    tags=["contracts"]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Contract, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract: schemas.ContractCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = contract.model_dump()
    db_contract = models.Contract(**data, user_id=current_user.id)
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    # Scheduler aus app.state holen
    scheduler = request.app.state.scheduler
    schedule_all_reminders(db_contract, scheduler)
    return db_contract

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return contract

@router.patch("/{contract_id}", response_model=schemas.Contract)
def update_contract(
    contract_id: int,
    upd: schemas.ContractUpdate,
    request: Request,
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    update_data = upd.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(contract, field, value)

    db.commit()
    db.refresh(contract)
    # Reminder neu planen (alte Jobs löschen + neue anlegen)
    scheduler = request.app.state.scheduler
    schedule_all_reminders(contract, scheduler, replace=True)
    return contract

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    db.delete(contract)
    db.commit()
    return contract
