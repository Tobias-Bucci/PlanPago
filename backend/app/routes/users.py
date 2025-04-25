# backend/app/routes/users.py
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import (
    APIRouter, Depends, HTTPException, BackgroundTasks, status
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

# ───────── Auth / crypto setup ────────────────────────────────────
pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY    = os.getenv("SECRET_KEY")
ALGORITHM     = "HS256"
TOKEN_TTL_MIN = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/verify-code")


def _hash(password: str) -> str:
    return pwd_context.hash(password)


def _create_token(data: dict, ttl: timedelta | None = None) -> str:
    expire = datetime.utcnow() + (ttl or timedelta(minutes=TOKEN_TTL_MIN))
    payload = {**data, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ───────── DB helper ──────────────────────────────────────────────
def get_db():
    db = database.SessionLocal()
    try:
        # bootstrap admin user once
        if not db.query(models.User).filter(models.User.email == "admin@admin").first():
            admin = models.User(
                email="admin@admin",
                hashed_password=_hash("admin"),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
        yield db
    finally:
        db.close()


# ───────── 1) Registration ───────────────────────────────────────
@router.post("/", status_code=201, response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(400, "E-mail already in use")

    new_user = models.User(
        email=user.email,
        hashed_password=_hash(user.password),
        country=None,
        currency=None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ───────── 2) Login – step 1 (request code) ──────────────────────
@router.post("/login")
def login_step1(
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.email == form_data.username)
        .first()
    )
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(400, "Wrong credentials")

    # “trusted-window” for 10 min after last 2FA
    if user.last_2fa_at and (datetime.utcnow() - user.last_2fa_at) < timedelta(minutes=10):
        token = _create_token({"sub": user.email})
        return {"access_token": token, "token_type": "bearer"}

    # otherwise send new 2FA code
    code     = f"{secrets.randbelow(10**6):06d}"
    expires  = datetime.utcnow() + timedelta(minutes=10)
    vc       = models.VerificationCode(user_id=user.id, code=code, expires_at=expires)
    db.add(vc)
    db.commit()

    recipient = "mainbuccitobias@gmail.com" if user.email == "admin@admin" else user.email
    background_tasks.add_task(send_code_via_email, recipient, code)

    tmp_token = _create_token({"sub": user.email}, ttl=timedelta(minutes=10))
    return {"temp_token": tmp_token}


class CodeVerify(BaseModel):
    temp_token: str
    code: str


# ───────── 3) Login – step 2 (verify code) ───────────────────────
@router.post("/verify-code", response_model=schemas.Token)
def verify_code(payload: CodeVerify, db: Session = Depends(get_db)):
    try:
        data  = jwt.decode(payload.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = data.get("sub")
        if not email:
            raise JWTError()
    except JWTError:
        raise HTTPException(401, "Invalid session")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(401, "Invalid session")

    vc = (
        db.query(models.VerificationCode)
        .filter(
            models.VerificationCode.user_id == user.id,
            models.VerificationCode.code == payload.code,
            models.VerificationCode.expires_at >= datetime.utcnow(),
        )
        .first()
    )
    if not vc:
        raise HTTPException(400, "Invalid or expired code")

    # mark 2FA-time & issue real access token
    user.last_2fa_at = datetime.utcnow()
    db.delete(vc)
    db.commit()

    token = _create_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# ───────── Current-user helper ───────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    cred_exc = HTTPException(401, "Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email   = payload.get("sub")
        if not email:
            raise cred_exc
    except JWTError:
        raise cred_exc

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise cred_exc
    return user


# ───────── 4) Profile (read) ─────────────────────────────────────
@router.get("/me", response_model=schemas.User)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ───────── 5 & 6) change e-mail / password (2-step same as before)
class UpdateConfirm(BaseModel):
    temp_token: str
    code: str


@router.patch("/me")
def update_request(
    background_tasks: BackgroundTasks,
    upd: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not pwd_context.verify(upd.old_password, current_user.hashed_password):
        raise HTTPException(400, "Wrong current password")

    if not upd.email and not upd.password:
        raise HTTPException(400, "Nothing to change")

    if upd.email and db.query(models.User).filter(
        models.User.email == upd.email,
        models.User.id != current_user.id,
    ).first():
        raise HTTPException(400, "E-mail already in use")

    new_hash = _hash(upd.password) if upd.password else None

    code     = f"{secrets.randbelow(10**6):06d}"
    expires  = datetime.utcnow() + timedelta(minutes=10)
    vc       = models.VerificationCode(user_id=current_user.id, code=code, expires_at=expires)
    db.add(vc)
    db.commit()

    background_tasks.add_task(send_code_via_email, current_user.email, code)

    payload = {"sub": current_user.email}
    if upd.email:
        payload["new_email"] = upd.email
    if new_hash:
        payload["new_password"] = new_hash

    temp_token = _create_token(payload, ttl=timedelta(minutes=10))
    return {"temp_token": temp_token}


@router.patch("/me/confirm", response_model=schemas.User)
def update_confirm(payload: UpdateConfirm, db: Session = Depends(get_db)):
    try:
        data  = jwt.decode(payload.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = data.get("sub")
        if not email:
            raise JWTError()
    except JWTError:
        raise HTTPException(401, "Invalid session")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(401, "Invalid session")

    vc = (
        db.query(models.VerificationCode)
        .filter(
            models.VerificationCode.user_id == user.id,
            models.VerificationCode.code == payload.code,
            models.VerificationCode.expires_at >= datetime.utcnow(),
        )
        .first()
    )
    if not vc:
        raise HTTPException(400, "Invalid or expired code")

    if data.get("new_email"):
        user.email = data["new_email"]
    if data.get("new_password"):
        user.hashed_password = data["new_password"]

    db.delete(vc)
    db.commit()
    db.refresh(user)
    return user


# ───────── 7) Settings (country/currency + reminders) ────────────
@router.patch("/me/settings", response_model=schemas.User)
def update_settings(
    settings: schemas.UserSettings,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.email_reminders_enabled = settings.email_reminders_enabled
    current_user.country  = settings.country
    current_user.currency = settings.currency
    db.commit()
    db.refresh(current_user)
    return current_user


# ───────── 8) Delete account ─────────────────────────────────────
@router.delete("/me", response_model=schemas.User)
def delete_me(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Contract).filter(
        models.Contract.user_id == current_user.id
    ).delete()
    db.delete(current_user)
    db.commit()
    return current_user


# ───────── 9) Admin utilities ────────────────────────────────────
def _ensure_admin(user: models.User):
    if not user.is_admin:
        raise HTTPException(403, "Admin privileges required")


@router.get("/admin/users", response_model=List[schemas.User])
def admin_list_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_admin(current_user)
    return db.query(models.User).all()


@router.delete("/admin/users/{user_id}", status_code=204)
def admin_delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_admin(current_user)
    target = db.get(models.User, user_id)
    if not target:
        raise HTTPException(404, "User not found")
    db.delete(target)
    db.commit()
