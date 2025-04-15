from sqlalchemy import Column, Integer, String, Float, DateTime
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    contract_type = Column(String, index=True)  # z. B. Mietvertrag, Versicherung, Streaming, etc.
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    amount = Column(Float)
    payment_interval = Column(String)  # z. B. "monatlich", "jährlich" etc.
    status = Column(String, default="active")
    notes = Column(String, nullable=True)