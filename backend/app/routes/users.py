# backend/app/routes/users.py

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    BackgroundTasks,
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .. import models, schemas, database
from ..utils.email_utils import send_code_via_email

load_dotenv()
router = APIRouter(prefix="/users", tags=["users"])

# --- Hashing & JWT ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(pw: str) -> str:
    return pwd_context.hash(pw)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/verify-code")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------
# 1) Registrierung
# -------------------
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Diese E‑Mail wird bereits verwendet")
    new_user = models.User(
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(new_user); db.commit(); db.refresh(new_user)
    return new_user

# -------------------
# 2) Login Schritt 1
# -------------------
@router.post("/login", status_code=200)
def login_step1(
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Falsche Anmeldedaten")
    # Code + DB-Eintrag
    code = f"{secrets.randbelow(10**6):06d}"
    expires = datetime.utcnow() + timedelta(minutes=10)
    vc = models.VerificationCode(user_id=user.id, code=code, expires_at=expires)
    db.add(vc); db.commit()
    background_tasks.add_task(send_code_via_email, user.email, code)
    temp_token = create_access_token({"sub": str(user.id)}, expires_delta=timedelta(minutes=10))
    return {"temp_token": temp_token}

# DTOs für Code‑Verifikation
class CodeVerify(BaseModel):
    temp_token: str
    code: str

# -------------------
# 3) Login Schritt 2
# -------------------
@router.post("/verify-code", status_code=200, response_model=schemas.Token)
def verify_code(payload: CodeVerify, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(data["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Ungültige Session")
    vc = (
        db.query(models.VerificationCode)
          .filter(
              models.VerificationCode.user_id == user_id,
              models.VerificationCode.code == payload.code,
              models.VerificationCode.expires_at >= datetime.utcnow(),
          ).first()
    )
    if not vc:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Code")
    db.delete(vc); db.commit()
    user = db.get(models.User, user_id)
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# -------------------
# Helper: aktueller User
# -------------------
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    cred_exc = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if not email:
            raise cred_exc
    except JWTError:
        raise cred_exc
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise cred_exc
    return user

# -------------------
# 4) GET /users/me
# -------------------
@router.get("/me", response_model=schemas.User)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# -------------------
# 5) PATCH /users/me → Update‑Request (alter PW + neue Werte)
# -------------------
class UpdateConfirm(BaseModel):
    temp_token: str
    code: str

@router.patch("/me", status_code=200)
def update_request(
    background_tasks: BackgroundTasks,
    upd: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # altes PW prüfen
    if not pwd_context.verify(upd.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Altes Passwort falsch")
    # Email‑Duplikat?
    if upd.email:
        dup = db.query(models.User).filter(
            models.User.email == upd.email,
            models.User.id != current_user.id
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="E‑Mail bereits vergeben")
    # Passwort hashen
    new_hashed = None
    if upd.password:
        new_hashed = get_password_hash(upd.password)
    # Code erzeugen
    code = f"{secrets.randbelow(10**6):06d}"
    expires = datetime.utcnow() + timedelta(minutes=10)
    vc = models.VerificationCode(user_id=current_user.id, code=code, expires_at=expires)
    db.add(vc); db.commit()
    background_tasks.add_task(send_code_via_email, current_user.email, code)
    # temp_token mit Änderungen
    payload = {"sub": str(current_user.id)}
    if upd.email:
        payload["new_email"] = upd.email
    if new_hashed:
        payload["new_password"] = new_hashed
    temp_token = create_access_token(data=payload, expires_delta=timedelta(minutes=10))
    return {"temp_token": temp_token}

# -------------------
# 6) PATCH /users/me/confirm → Code prüfen & anwenden
# -------------------
@router.patch("/me/confirm", status_code=200, response_model=schemas.User)
def update_confirm(payload: UpdateConfirm, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(data["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Ungültige Session")
    vc = db.query(models.VerificationCode).filter(
        models.VerificationCode.user_id == user_id,
        models.VerificationCode.code == payload.code,
        models.VerificationCode.expires_at >= datetime.utcnow(),
    ).first()
    if not vc:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Code")
    user = db.get(models.User, user_id)
    if data.get("new_email"):
        user.email = data["new_email"]
    if data.get("new_password"):
        user.hashed_password = data["new_password"]
    db.delete(vc); db.commit(); db.refresh(user)
    return user

# -------------------
# 7) DELETE /users/me
# -------------------
@router.delete("/me", response_model=schemas.User)
def delete_current_user(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Contract).filter(models.Contract.user_id == current_user.id).delete()
    db.delete(current_user); db.commit()
    return current_user
