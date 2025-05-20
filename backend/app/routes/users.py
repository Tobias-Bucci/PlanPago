# backend/app/routes/users.py
# ────────────────────────────────────────────────────────────────
import os, secrets, smtplib, pathlib
import time
from datetime import datetime, timedelta
from typing import List, Optional
from urllib.parse import urlencode

from fastapi import (
    APIRouter, Depends, HTTPException, BackgroundTasks, Request, status, UploadFile, File, Form
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

from .. import models, schemas, database
from ..utils import email_utils                     #  ← send_code_via_email, send_broadcast
from ..utils.email_utils import EMAIL_HOST, EMAIL_PORT

load_dotenv()

router = APIRouter(prefix="/users", tags=["users"])

# ───────── Auth / Crypto ─────────────────────────────────────────
pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY    = os.getenv("SECRET_KEY")
ALGORITHM     = "HS256"
TOKEN_TTL_MIN = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/verify-code")

def _hash(pw: str) -> str:
    return pwd_context.hash(pw)

def _create_token(data: dict, ttl: timedelta | None = None) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + (ttl or timedelta(minutes=TOKEN_TTL_MIN))
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ───────── Login Cooldown (Brute-Force-Schutz) ───────────────
LOGIN_ATTEMPTS = {}  # {email: [timestamps]}
MAX_ATTEMPTS = 10
WINDOW_SECONDS = 600  # 10 Minuten
COOLDOWN_SECONDS = 600  # 10 Minuten

def is_login_allowed(email):
    now = time.time()
    attempts = LOGIN_ATTEMPTS.get(email, [])
    # Entferne alte Versuche
    attempts = [t for t in attempts if now - t < WINDOW_SECONDS]
    LOGIN_ATTEMPTS[email] = attempts
    if len(attempts) >= MAX_ATTEMPTS:
        # Prüfe, ob Cooldown vorbei ist
        if now - attempts[0] < COOLDOWN_SECONDS:
            return False, int(COOLDOWN_SECONDS - (now - attempts[0]))
        # Entferne ältesten Versuch nach Cooldown
        LOGIN_ATTEMPTS[email] = attempts[1:]
    return True, 0

# ───────── DB-Helper ────────────────────────────────────────────
def get_db():
    db = database.SessionLocal()
    try:
        # einmalig Admin-User anlegen
        if not db.query(models.User).filter(models.User.email == "admin@admin").first():
            db.add(models.User(email="admin@admin",
                               hashed_password=_hash("admin"),
                               is_admin=True))
            db.commit()
        yield db
    finally:
        db.close()

# ───────── Admin-Helper ─────────────────────────────────────────
def _ensure_admin(user: models.User):
    if not user.is_admin:
        raise HTTPException(403, "Admin privileges required")

# ───────── 1) Registrierung ─────────────────────────────────────
@router.post("/", status_code=201)
def register(u: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == u.email).first():
        raise HTTPException(400, "E-mail already in use")
    user = models.User(email=u.email, hashed_password=_hash(u.password), twofa_method=u.twofa_method)
    qr_url = None
    if u.twofa_method == "totp":
        try:
            import pyotp
            secret = pyotp.random_base32()
            user.totp_secret = secret
            qr_url = pyotp.totp.TOTP(secret).provisioning_uri(name=u.email, issuer_name="PlanPago")
        except Exception as e:
            raise HTTPException(500, f"TOTP setup failed: {e}")
    db.add(user); db.commit(); db.refresh(user)
    resp = {"id": user.id, "email": user.email, "twofa_method": user.twofa_method}
    if qr_url:
        resp["totp_qr_url"] = qr_url
    return resp

# ───────── 2) Login – Schritt 1 (Code anfordern) ────────────────
@router.post("/login")
def login_step1(
    request: Request,
    background_tasks: BackgroundTasks,
    form: OAuth2PasswordRequestForm = Depends(),
    db:   Session                   = Depends(get_db),
):
    email = form.username.lower().strip()
    allowed, wait = is_login_allowed(email)
    if not allowed:
        raise HTTPException(429, f"Too many login attempts. Try again in {wait} seconds.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        LOGIN_ATTEMPTS.setdefault(email, []).append(time.time())
        raise HTTPException(400, "Wrong credentials")

    # Bei Erfolg: Reset der Versuche
    LOGIN_ATTEMPTS[email] = []

    # Trusted-Window 10 min
    if user.last_2fa_at and (datetime.utcnow() - user.last_2fa_at) < timedelta(minutes=10):
        return {"access_token": _create_token({"sub": user.email}),
                "token_type":   "bearer"}

    if user.twofa_method == "totp":
        temp_token = _create_token({"sub": user.email}, ttl=timedelta(minutes=10))
        return {"temp_token": temp_token, "twofa_method": "totp"}

    # Standard: E-Mail-Code
    code    = f"{secrets.randbelow(10**6):06d}"
    expires = datetime.utcnow() + timedelta(minutes=10)
    db.add(models.VerificationCode(user_id=user.id, code=code, expires_at=expires))
    db.commit()

    rcpt = "planpago.contact@gmail.com" if user.email == "admin@admin" else user.email
    background_tasks.add_task(email_utils.send_code_via_email, rcpt, code)

    temp_token = _create_token({"sub": user.email}, ttl=timedelta(minutes=10))
    return {"temp_token": temp_token, "twofa_method": "email"}

# ───────── 3) Login – Schritt 2 (Code prüfen) ───────────────────
class CodeVerify(BaseModel):
    temp_token: str
    code: str

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

    if user.twofa_method == "totp":
        import pyotp
        if not user.totp_secret:
            raise HTTPException(400, "No TOTP secret set")
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(payload.code, valid_window=1):
            raise HTTPException(400, "Invalid or expired code")
        user.last_2fa_at = datetime.utcnow()
        db.commit()
        token = _create_token({"sub": user.email})
        return {"access_token": token, "token_type": "bearer"}

    # Standard: E-Mail-Code
    vc = db.query(models.VerificationCode).filter(
        models.VerificationCode.user_id == user.id,
        models.VerificationCode.code == payload.code,
        models.VerificationCode.expires_at >= datetime.utcnow()
    ).first()
    if not vc:
        raise HTTPException(400, "Invalid or expired code")

    user.last_2fa_at = datetime.utcnow()
    db.delete(vc); db.commit()
    token = _create_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# ───────── Helper: aktuellen User ermitteln ─────────────────────
def get_current_user(token: str = Depends(oauth2_scheme),
                     db:    Session = Depends(get_db)):
    exc = HTTPException(401, "Could not validate credentials")
    try:
        data  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = data.get("sub")
        if not email:
            raise JWTError()
    except JWTError:
        raise exc
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise exc
    return user

# ───────── 4) Profil lesen ──────────────────────────────────────
@router.get("/me", response_model=schemas.User)
def read_me(cur: models.User = Depends(get_current_user)):
    return cur

# ───────── 5 & 6) Passwort / E-Mail ändern (2-Stufen) ───────────
class UpdateConfirm(BaseModel):
    temp_token: str
    code: str

@router.patch("/me")
def update_request(
    background_tasks: BackgroundTasks,
    upd: schemas.UserUpdate,
    cur: models.User = Depends(get_current_user),
    db:  Session     = Depends(get_db),
):
    if not pwd_context.verify(upd.old_password, cur.hashed_password):
        raise HTTPException(400, "Wrong current password")
    if not upd.email and not upd.password:
        raise HTTPException(400, "Nothing to change")

    if upd.email and db.query(models.User).filter(
        models.User.email == upd.email,
        models.User.id    != cur.id
    ).first():
        raise HTTPException(400, "E-mail already in use")

    new_hash = _hash(upd.password) if upd.password else None

    if cur.twofa_method == "totp":
        payload = {"sub": cur.email}
        if upd.email:   payload["new_email"]    = upd.email
        if new_hash:    payload["new_password"] = new_hash
        tmp = _create_token(payload, ttl=timedelta(minutes=10))
        return {"temp_token": tmp, "twofa_method": "totp"}

    # Standard: E-Mail-Code
    code    = f"{secrets.randbelow(10**6):06d}"
    expires = datetime.utcnow() + timedelta(minutes=10)
    db.add(models.VerificationCode(user_id=cur.id, code=code, expires_at=expires))
    db.commit()
    background_tasks.add_task(email_utils.send_code_via_email, cur.email, code)

    payload = {"sub": cur.email}
    if upd.email:   payload["new_email"]    = upd.email
    if new_hash:    payload["new_password"] = new_hash
    tmp = _create_token(payload, ttl=timedelta(minutes=10))
    return {"temp_token": tmp, "twofa_method": "email"}

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

    # NEU: Prüfe TOTP, wenn User TOTP nutzt
    if user.twofa_method == "totp":
        import pyotp
        if not user.totp_secret:
            raise HTTPException(400, "No TOTP secret set")
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(payload.code, valid_window=1):
            raise HTTPException(400, "Invalid or expired code")
        user.last_2fa_at = datetime.utcnow()
        # Änderungen übernehmen
        if data.get("new_email"):
            user.email = data["new_email"]
        if data.get("new_password"):
            user.hashed_password = data["new_password"]
        db.commit(); db.refresh(user)
        return user

    # Standard: E-Mail-Code
    vc = db.query(models.VerificationCode).filter(
        models.VerificationCode.user_id == user.id,
        models.VerificationCode.code    == payload.code,
        models.VerificationCode.expires_at >= datetime.utcnow()
    ).first()
    if not vc:
        raise HTTPException(400, "Invalid or expired code")

    if data.get("new_email"):
        user.email = data["new_email"]
    if data.get("new_password"):
        user.hashed_password = data["new_password"]

    db.delete(vc); db.commit(); db.refresh(user)
    return user

# ───────── 7) Settings ──────────────────────────────────────────
@router.patch("/me/settings", response_model=schemas.User)
def change_settings(
    s:   schemas.UserSettings,
    cur: models.User = Depends(get_current_user),
    db:  Session     = Depends(get_db),
):
    cur.email_reminders_enabled = s.email_reminders_enabled
    cur.country  = s.country
    cur.currency = s.currency
    db.commit(); db.refresh(cur)
    return cur

# ───────── 8) Account löschen ──────────────────────────────────
@router.delete("/me", response_model=schemas.User)
def delete_me(cur: models.User = Depends(get_current_user),
              db:  Session     = Depends(get_db)):
    db.query(models.Contract).filter(models.Contract.user_id == cur.id).delete()
    db.delete(cur); db.commit()
    return cur

# ───────── 9) Admin – User-Verwaltung ──────────────────────────
@router.get("/admin/users", response_model=List[schemas.User])
def admin_users(cur: models.User = Depends(get_current_user),
                db:  Session     = Depends(get_db)):
    _ensure_admin(cur)
    return db.query(models.User).all()

@router.delete("/admin/users/{uid}", status_code=204)
def admin_del(uid: int,
              cur: models.User = Depends(get_current_user),
              db:  Session     = Depends(get_db)):
    _ensure_admin(cur)
    tgt = db.get(models.User, uid)
    if not tgt:
        raise HTTPException(404, "User not found")
    db.delete(tgt); db.commit()

# ───────── 10) Admin – Impersonate / Health / Broadcast ────────
@router.post("/admin/impersonate-request/{uid}", status_code=201)
def admin_impersonate_request(uid: int,
                             background_tasks: BackgroundTasks,
                             cur: models.User = Depends(get_current_user),
                             db: Session = Depends(get_db),
                             request: Request = None):
    _ensure_admin(cur)
    tgt = db.get(models.User, uid)
    if not tgt:
        raise HTTPException(404, "User not found")
    # Create unique token
    token = secrets.token_urlsafe(32)
    # Remove any previous pending requests for this admin/user
    db.query(models.ImpersonationRequest).filter_by(admin_id=cur.id, user_id=uid, confirmed=False).delete()
    imp_req = models.ImpersonationRequest(
        admin_id=cur.id, user_id=uid, token=token
    )
    db.add(imp_req)
    db.commit()
    # Build confirmation URL
    base_url = str(request.base_url).rstrip("/")
    confirm_url = f"{base_url}/users/admin/impersonate-confirm/{token}"
    background_tasks.add_task(
        email_utils.send_admin_impersonation_request_email,
        tgt.email, cur.email, confirm_url
    )
    return {"request_id": imp_req.id}

@router.get("/admin/impersonate-status/{request_id}", response_model=schemas.ImpersonationRequestStatus)
def admin_impersonate_status(request_id: int,
                            cur: models.User = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    _ensure_admin(cur)
    req = db.get(models.ImpersonationRequest, request_id)
    if not req or req.admin_id != cur.id:
        raise HTTPException(404, "Request not found")
    return {"confirmed": req.confirmed}

@router.get("/admin/impersonate-confirm/{token}")
def admin_impersonate_confirm(token: str, db: Session = Depends(get_db)):
    req = db.query(models.ImpersonationRequest).filter_by(token=token, confirmed=False).first()
    if not req:
        return "Invalid or expired request."
    req.confirmed = True
    req.confirmed_at = datetime.utcnow()
    db.commit()
    return "Admin access has been approved. You may close this window."

@router.post("/admin/impersonate/{uid}", response_model=schemas.Token)
def admin_impersonate(uid: int,
                      cur: models.User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    _ensure_admin(cur)
    tgt = db.get(models.User, uid)
    if not tgt:
        raise HTTPException(404, "User not found")
    # Check for confirmed impersonation request
    req = db.query(models.ImpersonationRequest).filter_by(admin_id=cur.id, user_id=uid, confirmed=True).order_by(models.ImpersonationRequest.confirmed_at.desc()).first()
    if not req or (datetime.utcnow() - req.confirmed_at).total_seconds() > 600:
        raise HTTPException(403, "User has not confirmed or confirmation expired.")
    return {"access_token": _create_token({"sub": tgt.email}),
            "token_type":   "bearer"}

@router.get("/admin/health")
def admin_health(cur: models.User = Depends(get_current_user),
                 db:  Session     = Depends(get_db)):
    _ensure_admin(cur)
    # DB
    try:
        db.execute(text("SELECT 1")); db_ok = True
    except Exception:
        db_ok = False
    # SMTP
    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=5) as s:
            s.ehlo()
        smtp_ok = True
    except Exception:
        smtp_ok = False
    # Scheduler
    try:
        from ..main import app
        sched_jobs = len(app.state.scheduler.get_jobs())
    except Exception:
        sched_jobs = 0
    return {"db": db_ok, "smtp": smtp_ok, "scheduler_jobs": sched_jobs}

# ───────── Broadcast an alle Nutzer ─────────────────────────────
class _Broadcast(BaseModel):
    subject: str
    body: str

@router.post("/admin/broadcast")
async def admin_broadcast(
    request: Request,
    background_tasks: BackgroundTasks,
    subject: Optional[str] = Form(None),
    body: Optional[str] = Form(None),
    files: Optional[list[UploadFile]] = File(None),
    cur:  models.User = Depends(get_current_user),
    db:   Session     = Depends(get_db),
):
    _ensure_admin(cur)
    recipients = [u.email for u in db.query(models.User).all()]
    # multipart/form-data: subject/body als Form, Dateien als UploadFile
    if subject and body:
        saved_files = []
        from ..config import UPLOAD_DIR
        import shutil, uuid
        if files:
            for up in files:
                ext = os.path.splitext(up.filename)[1]
                fname = f"broadcast_{uuid.uuid4().hex}{ext}"
                dest = UPLOAD_DIR / fname
                with dest.open("wb") as buffer:
                    shutil.copyfileobj(up.file, buffer)
                saved_files.append(dest)
        background_tasks.add_task(
            email_utils.send_broadcast,
            recipients,
            subject.strip(),
            body.strip(),
            [str(f) for f in saved_files] if saved_files else None
        )
        return {"sent": len(recipients)}
    # JSON: subject/body im Body, keine Dateien
    data = await request.json()
    subject = data.get("subject")
    body = data.get("body")
    if not subject or not body:
        return JSONResponse({"detail": "Subject and body required."}, status_code=400)
    background_tasks.add_task(
        email_utils.send_broadcast,
        recipients,
        subject.strip(),
        body.strip(),
        None
    )
    return {"sent": len(recipients)}

# ───────── Password Reset ───────────────────────────────────────────
class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    code: str
    new_password: str

@router.post("/password-reset")
def request_password_reset(
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(404, "User not found")

    if user.twofa_method == "totp":
        temp_token = _create_token({"sub": user.email}, ttl=timedelta(minutes=10))
        return {"temp_token": temp_token, "twofa_method": "totp", "message": "Enter the 6-digit code from your Authenticator-App."}

    # Standard: E-Mail-Code
    code = f"{secrets.randbelow(10**6):06d}"
    expires = datetime.utcnow() + timedelta(minutes=10)
    db.add(models.VerificationCode(user_id=user.id, code=code, expires_at=expires))
    db.commit()
    background_tasks.add_task(email_utils.send_code_via_email, user.email, code)
    return {"message": "Password reset email sent.", "email": user.email, "twofa_method": "email"}

@router.post("/password-reset/confirm")
def confirm_password_reset(
    payload: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(404, "User not found")
    vc = db.query(models.VerificationCode).filter(
        models.VerificationCode.user_id == user.id,
        models.VerificationCode.code == payload.code,
        models.VerificationCode.expires_at >= datetime.utcnow()
    ).first()
    if not vc:
        raise HTTPException(400, "Invalid or expired code")
    user.hashed_password = _hash(payload.new_password)
    db.delete(vc)
    db.commit()
    return {"message": "Password has been reset successfully."}
