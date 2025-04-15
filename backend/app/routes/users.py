from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import timedelta, datetime
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .. import models, schemas, database
from passlib.context import CryptContext

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

# Passwort-Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Registrierung
@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Diese Email-Adresse wird bereits verwendet")
    hashed_pw = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# JWT Einstellungen
SECRET_KEY = "xbsFZ4NFRhJz1jWs_caUXU3oKlFxgf5ob8n57Y52ZIVEa0qSF0K2UOuZIIAeDsXrFYPnnI7CBHL2yzRPwGrkOA" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# OAuth2 Schema (für die automatische Dokumentation)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# Login-Endpunkt
@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Falsche Anmeldedaten")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}
