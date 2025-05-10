from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from fastapi.responses import StreamingResponse, FileResponse
import csv
from io import StringIO, BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import Table, TableStyle, Image as RLImage
import os

from .. import models, schemas, database
from .users import get_current_user
from ..utils.email_utils import schedule_all_reminders

router = APIRouter(prefix="/contracts", tags=["contracts"])

# ───────── DB helper ──────────────────────────────────────────────
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ───────── Create ────────────────────────────────────────────────
@router.post("/", response_model=schemas.Contract, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract: schemas.ContractCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = contract.model_dump()
    db_contract = models.Contract(**data, user_id=current_user.id)
    db.add(db_contract); db.commit(); db.refresh(db_contract)

    scheduler = request.app.state.scheduler
    schedule_all_reminders(db_contract, scheduler, replace=True)  # Fix: replace=True, damit Reminder-Jobs nicht dupliziert werden
    return db_contract

# ───────── Read (paginated, filterable) ───────────────────────────
@router.get("/", response_model=schemas.PaginatedContracts)
def read_contracts(
    skip : int  = Query(0,  ge=0),
    limit: int  = Query(10, ge=1, le=100),
    q    : Optional[str] = Query(None, description="Free-text search"),
    type : Optional[str] = Query(None, alias="type", description="Contract type filter (rent, insurance, streaming, salary, leasing, other)"),
    status: Optional[str] = Query(None, description="Status filter (active, cancelled, expired)"),
    db  : Session         = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Contract).filter(models.Contract.user_id == current_user.id)

    if q:
        pat = f"%{q}%"
        query = query.filter(or_(models.Contract.name.ilike(pat),
                                 models.Contract.notes.ilike(pat)))
    if type:
        query = query.filter(models.Contract.contract_type == type)
    if status:
        query = query.filter(models.Contract.status == status)

    total  = query.count()
    items  = query.order_by(models.Contract.start_date.desc()) \
                  .offset(skip).limit(limit).all()

    return {"items": items, "total": total}

# ───────── Read by id ─────────────────────────────────────────────
@router.get("/{contract_id}", response_model=schemas.Contract)
def read_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contract = (
        db.query(models.Contract)
        .filter(models.Contract.id == contract_id,
                models.Contract.user_id == current_user.id)
        .first()
    )
    if not contract:
        raise HTTPException(404, "Contract not found")
    return contract

# ───────── Update ────────────────────────────────────────────────
@router.patch("/{contract_id}", response_model=schemas.Contract)
def update_contract(
    contract_id: int,
    upd: schemas.ContractUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contract = (
        db.query(models.Contract)
        .filter(models.Contract.id == contract_id,
                models.Contract.user_id == current_user.id)
        .first()
    )
    if not contract:
        raise HTTPException(404, "Contract not found")

    for field, value in upd.model_dump(exclude_none=True).items():
        setattr(contract, field, value)

    db.commit(); db.refresh(contract)

    scheduler = request.app.state.scheduler
    schedule_all_reminders(contract, scheduler, replace=True)
    return contract

# ───────── Delete ────────────────────────────────────────────────
@router.delete("/{contract_id}", response_model=schemas.Contract)
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contract = (
        db.query(models.Contract)
        .filter(models.Contract.id == contract_id,
                models.Contract.user_id == current_user.id)
        .first()
    )
    if not contract:
        raise HTTPException(404, "Contract not found")

    db.delete(contract); db.commit()
    return contract

# ───────── Export CSV ────────────────────────────────────────────
@router.get("/export/csv")
def export_contracts_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contracts = db.query(models.Contract).filter(models.Contract.user_id == current_user.id).all()
    si = StringIO()
    writer = csv.writer(si)
    writer.writerow([
        "ID", "Name", "Type", "Start Date", "End Date", "Amount", "Payment Interval", "Status"
    ])
    for c in contracts:
        writer.writerow([
            c.id,
            c.name,
            c.contract_type,
            c.start_date.strftime("%Y-%m-%d"),
            c.end_date.strftime("%Y-%m-%d") if c.end_date else "",
            c.amount,
            c.payment_interval,
            c.status
        ])
    si.seek(0)
    return StreamingResponse(
        si,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=contracts.csv"
        },
    )

# ───────── Export PDF ────────────────────────────────────────────
@router.get("/export/pdf")
def export_contracts_pdf(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contracts = db.query(models.Contract).filter(models.Contract.user_id == current_user.id).all()
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 1*cm
    table_width = width - 2*margin

    # Logo
    logo_path = os.path.join(os.path.dirname(__file__), "../../..", "frontend", "public", "PlanPago-trans.png")
    if os.path.exists(logo_path):
        c.drawImage(logo_path, x=(width-4*cm)/2, y=height-5*cm, width=4*cm, height=4*cm, mask='auto')
    c.setFont("Helvetica-Bold", 22)
    c.setFillColorRGB(30/255, 64/255, 175/255)
    c.drawCentredString(width/2, height-6*cm, "PlanPago – Contract Overview")
    c.setFont("Helvetica", 12)
    c.setFillColorRGB(0,0,0)
    c.drawCentredString(width/2, height-6.8*cm, f"Exported: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}")

    # Table data (English, no notes)
    data = [[
        "ID", "Name", "Type", "Start Date", "End Date", "Amount", "Payment Interval", "Status"
    ]]
    for cobj in contracts:
        data.append([
            cobj.id,
            cobj.name,
            cobj.contract_type,
            cobj.start_date.strftime("%Y-%m-%d"),
            cobj.end_date.strftime("%Y-%m-%d") if cobj.end_date else "",
            f"{cobj.amount:.2f}",
            cobj.payment_interval,
            cobj.status
        ])
    col_widths = [table_width * w for w in [0.07, 0.18, 0.13, 0.13, 0.13, 0.12, 0.12, 0.12]]
    table = Table(data, repeatRows=1, hAlign='CENTER', colWidths=col_widths)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1E40AF")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,0), 12),
        ("ALIGN", (0,0), (-1,0), "CENTER"),
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.whitesmoke, colors.lightgrey]),
        ("FONTSIZE", (0,1), (-1,-1), 10),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN", (0,1), (-1,-1), "CENTER"),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    table_height = table.wrapOn(c, table_width, height)[1]
    table_x = margin
    table_y = height-8*cm-table_height
    table.drawOn(c, table_x, table_y)
    c.showPage()
    c.save()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=contracts.pdf"})
