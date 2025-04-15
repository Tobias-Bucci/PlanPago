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
