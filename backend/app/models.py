# backend/app/models.py
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Float,
    ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id                      = Column(Integer, primary_key=True, index=True)
    email                   = Column(String, unique=True, index=True, nullable=False)
    hashed_password         = Column(String, nullable=False)
    is_admin                = Column(Boolean, default=False, nullable=False)
    last_2fa_at             = Column(DateTime, nullable=True)
    email_reminders_enabled = Column(Boolean, default=True, nullable=False)
    country                 = Column(String, nullable=True)
    currency                = Column(String, nullable=True)   # ✅ lower-case & consistent

    # Login cooldown fields
    failed_login_count   = Column(Integer, default=0, nullable=False)
    login_cooldown_until = Column(DateTime, nullable=True)

    twofa_method = Column(String, default="email", nullable=False)  # "email" oder "totp"
    totp_secret = Column(String, nullable=True)

    contracts = relationship(
        "Contract", back_populates="user", cascade="all, delete-orphan"
    )
    verification_codes = relationship(
        "VerificationCode", back_populates="user", cascade="all, delete-orphan"
    )


class Contract(Base):
    __tablename__ = "contracts"

    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String, nullable=False)
    contract_type    = Column(String, nullable=False)  # expects: rent, insurance, streaming, salary, leasing, other
    start_date       = Column(DateTime, nullable=False)
    end_date         = Column(DateTime, nullable=True)
    amount           = Column(Float, nullable=False)
    payment_interval = Column(String, nullable=False)  # expects: monthly, yearly, one-time
    status           = Column(String, default="active", nullable=False)  # expects: active, cancelled, expired
    notes            = Column(String, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user    = relationship("User", back_populates="contracts")

    files = relationship(
        "ContractFile", back_populates="contract", cascade="all, delete-orphan"
    )


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code       = Column(String(6), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="verification_codes")


class ContractFile(Base):
    __tablename__ = "contract_files"

    id                = Column(Integer, primary_key=True, index=True)
    contract_id       = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    file_path         = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    uploaded_at       = Column(DateTime, default=datetime.utcnow)

    contract = relationship("Contract", back_populates="files")


class ImpersonationRequest(Base):
    __tablename__ = "impersonation_requests"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed = Column(Boolean, default=False)
    confirmed_at = Column(DateTime, nullable=True)
    token = Column(String, unique=True, nullable=False)

    admin = relationship("User", foreign_keys=[admin_id])
    user = relationship("User", foreign_keys=[user_id])
