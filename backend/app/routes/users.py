from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .. import models, schemas, database
from passlib.context import CryptContext

router = APIRouter(prefix="/users", tags=["users"])

# ─────────────────────────────
# Datenbank‑Session‑Helper
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────
# Passwort‑Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# ─────────────────────────────
# JWT‑Konfiguration
SECRET_KEY = (
    "xbsFZ4NFRhJz1jWs_caUXU3oKlFxgf5ob8n57Y52ZIVEa0qSF0K2UOuZIIAeDsXrFYPnnI7CBHL2yzRPwGrkOA"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# OAuth‑Schema
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# ─────────────────────────────
# Registrierung
@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Diese E‑Mail wird bereits verwendet")
    new_user = models.User(
        email=user.email, hashed_password=get_password_hash(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# ─────────────────────────────
# Login
@router.post("/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Falsche Anmeldedaten")
    token = create_access_token(
        {"sub": user.email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer"}

# ─────────────────────────────
# Aktuellen Nutzer aus Token holen
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Anmeldung erforderlich"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise cred_exc
    except JWTError:
        raise cred_exc
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise cred_exc
    return user

# ─────────────────────────────
# Profil‑Endpunkte
@router.get("/me", response_model=schemas.User)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=schemas.User)
def update_me(
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
def delete_me(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # alle Verträge des Users löschen
    db.query(models.Contract).filter(
        models.Contract.user_id == current_user.id
    ).delete()
    db.delete(current_user)
    db.commit()
    return current_user
