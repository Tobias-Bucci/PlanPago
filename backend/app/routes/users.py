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


# Umgebung laden (.env)
load_dotenv()

router = APIRouter(prefix="/users", tags=["users"])

# Passwort-Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# DB-Session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT-Konfiguration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/verify-code")


# 1) Registrierung
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Diese E‑Mail wird bereits verwendet"
        )
    hashed_pw = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# 2) Login – Schritt 1: Credentials prüfen, Code erzeugen und mailen
@router.post("/login", status_code=status.HTTP_200_OK)
def login_step1(
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Falsche Anmeldedaten"
        )
    # Einmal-Code erzeugen
    code = f"{secrets.randbelow(10**6):06d}"
    expires = datetime.utcnow() + timedelta(minutes=10)
    vc = models.VerificationCode(user_id=user.id, code=code, expires_at=expires)
    db.add(vc)
    db.commit()

    # Mail asynchron verschicken
    background_tasks.add_task(send_code_via_email, user.email, code)

    # Temporäres Token für Code-Verification
    temp_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=10),
    )
    return {"temp_token": temp_token}


# Payload für Code-Verifikation
class CodeVerify(BaseModel):
    temp_token: str
    code: str


# 3) Login – Schritt 2: Code prüfen, JWT ausgeben
@router.post("/verify-code", status_code=status.HTTP_200_OK, response_model=schemas.Token)
def verify_code(payload: CodeVerify, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(data.get("sub", ""))
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige Session"
        )

    vc = (
        db.query(models.VerificationCode)
          .filter(
              models.VerificationCode.user_id == user_id,
              models.VerificationCode.code == payload.code,
              models.VerificationCode.expires_at >= datetime.utcnow(),
          )
          .first()
    )
    if not vc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ungültiger oder abgelaufener Code"
        )

    # Code verbrauchen
    db.delete(vc)
    db.commit()

    # Endgültiges JWT ausgeben
    user = db.query(models.User).get(user_id)
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# Hilfsfunktion: aktuellen User anhand JWT ermitteln
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise credentials_exception
    return user


# 4) Profil-Endpunkte
@router.get("/me", response_model=schemas.User)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=schemas.User)
def update_current_user(
    user_upd: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_upd.email:
        current_user.email = user_upd.email
    if user_upd.password:
        current_user.hashed_password = get_password_hash(user_upd.password)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", response_model=schemas.User)
def delete_current_user(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Contract).filter(models.Contract.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()
    return current_user
