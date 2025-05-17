from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

# ───────── User schemas ────────────────────────────────────────────
class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    password: str
    twofa_method: str = "email"  # "email" oder "totp"


class User(UserBase):
    id: int
    email_reminders_enabled: bool
    country: Optional[str] = None
    currency: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    old_password: str
    email: Optional[str] = None
    password: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class UserSettings(BaseModel):
    email_reminders_enabled: bool
    country: Optional[str] = None
    currency: Optional[str] = None


# ───────── Contract schemas ───────────────────────────────────────
class ContractBase(BaseModel):
    name: str
    contract_type: str  # expects: rent, insurance, streaming, salary, leasing, other
    start_date: datetime
    end_date: Optional[datetime] = None
    amount: float
    payment_interval: str  # expects: monthly, yearly, one-time
    status: Optional[str] = "active"  # expects: active, cancelled, expired
    notes: Optional[str] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    name: Optional[str] = None
    contract_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    amount: Optional[float] = None
    payment_interval: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class Contract(ContractBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ───────── ContractFile schema ────────────────────────────────────
class ContractFile(BaseModel):
    id: int
    contract_id: int
    file_path: str
    original_filename: str
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ───────── Auth schemas ───────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# ───────── Pagination wrapper ─────────────────────────────────────
class PaginatedContracts(BaseModel):
    items: List[Contract]
    total: int


# ───────── ImpersonationRequest schemas ───────────────────────────
class ImpersonationRequest(BaseModel):
    id: int
    admin_id: int
    user_id: int
    created_at: datetime
    confirmed: bool
    confirmed_at: datetime | None = None
    token: str


class ImpersonationRequestCreate(BaseModel):
    user_id: int


class ImpersonationRequestStatus(BaseModel):
    confirmed: bool
