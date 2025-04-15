from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

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

@router.post("/", response_model=schemas.Contract)
def create_contract(contract: schemas.ContractCreate, db: Session = Depends(get_db)):
    db_contract = models.Contract(**contract.dict())
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

@router.get("/", response_model=List[schemas.Contract])
def read_contracts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    contracts = db.query(models.Contract).offset(skip).limit(limit).all()
    return contracts

@router.get("/{contract_id}", response_model=schemas.Contract)
def read_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

@router.delete("/{contract_id}", response_model=schemas.Contract)
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    db.delete(contract)
    db.commit()
    return contract
