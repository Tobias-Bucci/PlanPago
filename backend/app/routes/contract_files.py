# backend/app/routes/contract_files.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from ..config import UPLOAD_DIR
from ..models import Contract, ContractFile
from ..database import SessionLocal
from ..routes.users import get_current_user
import uuid, shutil, mimetypes
from ..utils import crypto_utils

router = APIRouter(
    prefix="/contracts/{contract_id}/files",
    tags=["contract files"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_files(
    contract_id: int,
    files: list[UploadFile] = File(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Stelle sicher, dass der Contract existiert und dem aktuellen User gehört
    contract = (
        db.query(Contract)
        .filter(Contract.id == contract_id, Contract.user_id == current_user.id)
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    saved = []
    for up in files:
        # Dateiendung ermitteln (optional)
        ext = mimetypes.guess_extension(up.content_type) or ""
        # Eindeutigen Dateinamen generieren
        uid = f"{uuid.uuid4()}{ext}"
        dest = UPLOAD_DIR / uid
        # Datei verschlüsselt speichern
        with dest.open("wb") as buffer:
            crypto_utils.encrypt_file(up.file, buffer)

        # Im DB‑Objekt nur den Pfad und Originalnamen speichern
        db_file = ContractFile(
            contract_id=contract.id,
            file_path=f"/files/{uid}",
            original_filename=up.filename,
        )
        db.add(db_file)
        saved.append(db_file)

    db.commit()

    # Gib zurück, was wir gerade angelegt haben
    return [
        {"id": f.id, "original": f.original_filename, "url": f.file_path}
        for f in saved
    ]

@router.get("", response_class=JSONResponse)
def list_files(
    contract_id: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
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
        {"id": f.id, "original": f.original_filename, "url": f.file_path}
        for f in files
    ]

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    contract_id: int,
    file_id: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    f = (
        db.query(ContractFile)
        .join(Contract)
        .filter(
            ContractFile.id == file_id,
            Contract.id == contract_id,
            Contract.user_id == current_user.id,
        )
        .first()
    )
    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    # Datei vom Filesystem löschen
    path = UPLOAD_DIR / f.file_path.split("/files/")[-1]
    if path.exists():
        path.unlink()

    # DB‑Eintrag löschen
    db.delete(f)
    db.commit()

    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

@router.get("/preview/{file_id}")
def preview_file(
    contract_id: int,
    file_id: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    f = (
        db.query(ContractFile)
        .join(Contract)
        .filter(
            ContractFile.id == file_id,
            Contract.id == contract_id,
            Contract.user_id == current_user.id,
        )
        .first()
    )
    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    import io, os
    file_path = UPLOAD_DIR / f.file_path.split("/files/")[-1]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    # Entschlüsseln und als StreamingResponse zurückgeben
    def file_stream():
        with file_path.open("rb") as enc_file:
            buf = io.BytesIO()
            crypto_utils.decrypt_file(enc_file, buf)
            buf.seek(0)
            yield from buf

    # Content-Type anhand des Original-Dateinamens bestimmen
    import mimetypes
    mime, _ = mimetypes.guess_type(f.original_filename)
    return StreamingResponse(file_stream(), media_type=mime or "application/octet-stream", headers={
        "Content-Disposition": f'inline; filename="{f.original_filename}"'
    })
