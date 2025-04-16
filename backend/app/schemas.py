from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# User-Schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
    
class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Contract-Schemas
class ContractBase(BaseModel):
    name: str
    contract_type: str
    start_date: datetime
    end_date: Optional[datetime] = None
    amount: float
    payment_interval: str
    status: Optional[str] = "active"
    notes: Optional[str] = None
    
# Contract‑Schemas
class ContractUpdate(BaseModel):
    # alle Felder optional – nur das senden, was geändert werden soll
    name:           Optional[str]      = None
    contract_type:  Optional[str]      = None
    start_date:     Optional[datetime] = None
    end_date:       Optional[datetime] = None
    amount:         Optional[float]    = None
    payment_interval: Optional[str]    = None
    status:         Optional[str]      = None
    notes:          Optional[str]      = None

    model_config = ConfigDict(from_attributes=True)


class ContractCreate(ContractBase):
    pass

class Contract(ContractBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Authentifizierungs-Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
