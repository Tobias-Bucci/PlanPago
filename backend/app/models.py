from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)

    contracts          = relationship(
        "Contract", back_populates="user", cascade="all, delete-orphan"
    )
    verification_codes = relationship(
        "VerificationCode", back_populates="user", cascade="all, delete-orphan"
    )

class Contract(Base):
    __tablename__ = "contracts"

    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String, nullable=False)
    contract_type    = Column(String, nullable=False)
    start_date       = Column(DateTime, nullable=False)
    end_date         = Column(DateTime, nullable=True)
    amount           = Column(Float, nullable=False)
    payment_interval = Column(String, nullable=False)
    status           = Column(String, nullable=False, default="active")
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
