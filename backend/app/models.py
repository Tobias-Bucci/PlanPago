# app/models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from .database import Base

# ───────────────────────────────
#  USER
# ───────────────────────────────
class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)

    # 1:n – User → Contracts
    contracts = relationship(
        "Contract",
        cascade="all, delete",
        back_populates="owner",
    )

# ───────────────────────────────
#  CONTRACT
# ───────────────────────────────
class Contract(Base):
    __tablename__ = "contracts"
    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    name             = Column(String,  nullable=False)
    contract_type    = Column(String,  nullable=False)
    start_date       = Column(DateTime, nullable=False)
    end_date         = Column(DateTime)
    amount           = Column(Float,   nullable=False)
    payment_interval = Column(String,  nullable=False)
    status           = Column(String,  default="active")
    notes            = Column(String)

    owner = relationship("User", back_populates="contracts")

    # 1:n – Contract → Files
    files = relationship(
        "ContractFile",
        cascade="all, delete",
        back_populates="contract",
    )

# ───────────────────────────────
#  CONTRACT‑FILE
# ───────────────────────────────
class ContractFile(Base):
    __tablename__ = "contract_files"
    id          = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    filename    = Column(String, nullable=False)   # gespeicherter Name
    original    = Column(String, nullable=False)   # Upload‑Name
    mime_type   = Column(String, nullable=False)

    contract = relationship("Contract", back_populates="files")
