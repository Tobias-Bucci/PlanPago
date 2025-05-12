# backend/app/routes/contract_files.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from ..config import UPLOAD_DIR
from ..models import Contract, ContractFile
from ..database import SessionLocal
from ..routes.users import get_current_user
import uuid, shutil, mimetypes

router = APIRouter(
    prefix="/contracts/{contract_id}/files",
    tags=["contract files"]
)

MAX_FILE_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB

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
        # Check file size
        if up.size > MAX_FILE_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds the limit of {MAX_FILE_UPLOAD_SIZE / 1024 / 1024} MB.",
            )

        # Dateiendung ermitteln (optional)
        ext = mimetypes.guess_extension(up.content_type) or ""
        # Eindeutigen Dateinamen generieren
        uid = f"{uuid.uuid4()}{ext}"
        dest = UPLOAD_DIR / uid
        # Datei speichern
        with dest.open("wb") as buffer:
            shutil.copyfileobj(up.file, buffer)

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
