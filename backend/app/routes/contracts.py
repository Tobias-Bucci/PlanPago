from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from .. import models, schemas, database
from .users import get_current_user
from ..utils.email_utils import schedule_all_reminders

router = APIRouter(prefix="/contracts", tags=["contracts"])

# ───────── DB helper ──────────────────────────────────────────────
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ───────── Create ────────────────────────────────────────────────
@router.post("/", response_model=schemas.Contract, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract: schemas.ContractCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = contract.model_dump()
    db_contract = models.Contract(**data, user_id=current_user.id)
    db.add(db_contract); db.commit(); db.refresh(db_contract)

    scheduler = request.app.state.scheduler
    schedule_all_reminders(db_contract, scheduler)
    return db_contract

# ───────── Read (paginated, filterable) ───────────────────────────
@router.get("/", response_model=schemas.PaginatedContracts)
def read_contracts(
    skip : int  = Query(0,  ge=0),
    limit: int  = Query(10, ge=1, le=100),
    q    : Optional[str] = Query(None, description="Free-text search"),
    type : Optional[str] = Query(None, alias="type", description="Contract type filter (rent, insurance, streaming, salary, leasing, other)"),
    status: Optional[str] = Query(None, description="Status filter (active, cancelled, expired)"),
    db  : Session         = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Contract).filter(models.Contract.user_id == current_user.id)

    if q:
        pat = f"%{q}%"
        query = query.filter(or_(models.Contract.name.ilike(pat),
                                 models.Contract.notes.ilike(pat)))
    if type:
        query = query.filter(models.Contract.contract_type == type)
    if status:
        query = query.filter(models.Contract.status == status)

    total  = query.count()
    items  = query.order_by(models.Contract.start_date.desc()) \
                  .offset(skip).limit(limit).all()

    return {"items": items, "total": total}

# ───────── Read by id ─────────────────────────────────────────────
@router.get("/{contract_id}", response_model=schemas.Contract)
def read_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contract = (
        db.query(models.Contract)
        .filter(models.Contract.id == contract_id,
                models.Contract.user_id == current_user.id)
        .first()
    )
    if not contract:
        raise HTTPException(404, "Contract not found")
    return contract

# ───────── Update ────────────────────────────────────────────────
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
        .filter(models.Contract.id == contract_id,
                models.Contract.user_id == current_user.id)
        .first()
    )
    if not contract:
        raise HTTPException(404, "Contract not found")

    for field, value in upd.model_dump(exclude_none=True).items():
        setattr(contract, field, value)

    db.commit(); db.refresh(contract)

    scheduler = request.app.state.scheduler
    schedule_all_reminders(contract, scheduler, replace=True)
    return contract

# ───────── Delete ────────────────────────────────────────────────
@router.delete("/{contract_id}", response_model=schemas.Contract)
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contract = (
        db.query(models.Contract)
        .filter(models.Contract.id == contract_id,
                models.Contract.user_id == current_user.id)
        .first()
    )
    if not contract:
        raise HTTPException(404, "Contract not found")

    db.delete(contract); db.commit()
    return contract
