# app/routes/contract_files.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from ..config import UPLOAD_DIR
from ..models import Contract, ContractFile, User
from ..database import SessionLocal
from ..routes.users import get_current_user
import uuid, shutil, mimetypes

router = APIRouter(prefix="/contracts/{contract_id}/files", tags=["contract files"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", status_code=201)
async def upload_files(
    contract_id: int,
    files: list[UploadFile] = File(...),
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = (
        db.query(Contract)
        .filter(Contract.id == contract_id, Contract.user_id == current_user.id)
        .first()
    )
    if not contract:
        raise HTTPException(404, "Contract not found")

    saved = []
    for up in files:
        ext = mimetypes.guess_extension(up.content_type) or ""
        uid = f"{uuid.uuid4()}{ext}"
        dest = UPLOAD_DIR / uid
        with dest.open("wb") as buffer:
            shutil.copyfileobj(up.file, buffer)

        db_file = ContractFile(
            contract_id=contract.id,
            filename=uid,
            original=up.filename,
            mime_type=up.content_type,
        )
        db.add(db_file)
        saved.append(db_file)

    db.commit()
    return [{"id": f.id, "original": f.original} for f in saved]

@router.get("")
def list_files(
    contract_id: int,
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    files = (
        db.query(ContractFile)
        .join(Contract)
        .filter(
            Contract.id == contract_id,
            Contract.user_id == current_user.id,
        )
        .all()
    )
    return [
        {
            "id": f.id,
            "original": f.original,
            "url": f"/files/{f.filename}",
            "mime_type": f.mime_type,          #  <────────
        }
        for f in files
    ]


@router.delete("/{file_id}", status_code=204)
def delete_file(contract_id: int, file_id: int, db=Depends(get_db), current_user: User = Depends(get_current_user)):
    f = (
        db.query(ContractFile)
        .join(Contract)
        .filter(
            ContractFile.id == file_id,
            Contract.id == contract_id,
            Contract.user_id == current_user.id,
        ).first()
    )
    if not f:
        raise HTTPException(404, "File not found")

    path = UPLOAD_DIR / f.filename
    if path.exists():
        path.unlink()
    db.delete(f)
    db.commit()
