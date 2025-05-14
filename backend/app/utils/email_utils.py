from __future__ import annotations

import os
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from pathlib import Path
from typing import Iterable, Sequence, Tuple

from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv

from ..database import SessionLocal
from ..models import Contract, User
from .email_templates import TEMPLATES  # ← gerade erstellt

# ────────────────────────────────────────────────────────────────
#  ENVIRONMENT
# ────────────────────────────────────────────────────────────────
load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

REMINDER_EMAIL_HOUR   = 14
REMINDER_EMAIL_MINUTE = 32

# ────────────────────────────────────────────────────────────────
#  LOGGING
# ────────────────────────────────────────────────────────────────
LOG_DIR  = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
MAIL_LOG = LOG_DIR / "emails.log"

def _log_mail(to_addr: str | Sequence[str], subject: str) -> None:
    subject = subject.replace("\n", " ").replace("\r", " ").strip()
    ts = datetime.utcnow().isoformat(timespec="milliseconds")
    recipients: Iterable[str] = (
        to_addr if isinstance(to_addr, (list, tuple)) else [to_addr]
    )
    with MAIL_LOG.open("a", encoding="utf-8") as f:
        for rcpt in recipients:
            f.write(f"{ts}  {rcpt}  {subject}\n")

# ────────────────────────────────────────────────────────────────
#  GENERIC SEND
# ────────────────────────────────────────────────────────────────
def _smtp_send(msg: EmailMessage, to_addr: str | Sequence[str]) -> None:
    if not EMAIL_USER or not EMAIL_PASS:
        print("⚠︎  EMAIL_USER / EMAIL_PASS missing – skipping real send.")
        _log_mail(to_addr, msg["Subject"])
        return

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=30) as smtp:
            smtp.starttls()
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)
        print(f"📧  Mail sent → {to_addr}")
        _log_mail(to_addr, msg["Subject"])
    except Exception as exc:
        print("❌  SMTP error:", exc)

# ────────────────────────────────────────────────────────────────
#  (1)  2-FA CODE
# ────────────────────────────────────────────────────────────────
def send_code_via_email(to_address: str, code: str) -> None:
    tpl = TEMPLATES["system"]["verification_code"]
    subject = tpl["subject"]
    body = tpl["body"].format(code=code)
    html = tpl["html"](code=code)

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"]    = EMAIL_USER or "planpago@example.com"
    msg["To"]      = to_address
    msg.set_content(body)
    msg.add_alternative(html, subtype="html")
    _smtp_send(msg, to_address)

# ────────────────────────────────────────────────────────────────
#  (2)  REMINDER E-MAILS
# ────────────────────────────────────────────────────────────────
def _make_reminder_body(contract: Contract, r_type: str, days: int) -> Tuple[str, str]:
    tpl_group = TEMPLATES.get(r_type, {})
    tpl       = tpl_group.get(contract.contract_type, tpl_group.get("Default"))
    if not tpl:
        return "", ""

    # Datum für Anzeige berechnen
    if r_type == "payment":
        due = contract.start_date
        step = (
            relativedelta(months=1) if contract.payment_interval.lower() == "monthly"
            else relativedelta(years=1) if contract.payment_interval.lower() == "yearly"
            else None
        )
        while step and due < datetime.utcnow():
            due += step
        date_str = due.date().isoformat()
    else:
        date_str = contract.end_date.date().isoformat()

    subject = tpl["subject"].format(
        name=contract.name, type=contract.contract_type, days=days
    )
    body = tpl["body"].format(
        name=contract.name,
        type=contract.contract_type,
        amount=contract.amount,
        date=date_str,
        days=days,
    )
    return subject, body, date_str, tpl

def send_reminder_email(
    to_address: str, contract_id: int, days_before: int, reminder_type: str
) -> None:
    session = SessionLocal()
    contract: Contract | None = session.get(Contract, contract_id)
    user:     User     | None = session.get(User, contract.user_id) if contract else None
    session.close()

    if not contract or not user or not user.email_reminders_enabled:
        return

    subj, body, date_str, tpl = _make_reminder_body(contract, reminder_type, days_before)
    if not subj:
        return

    msg = EmailMessage()
    msg["Subject"] = subj
    msg["From"]    = EMAIL_USER or "planpago@example.com"
    msg["To"]      = to_address
    msg.set_content(body)

    if "html" in tpl:
        msg.add_alternative(
            tpl["html"](
                name=contract.name,
                amount=contract.amount,
                days=days_before,
                date=date_str,
            ),
            subtype="html",
        )

    _smtp_send(msg, to_address)

# ────────────────────────────────────────────────────────────────
#  (3)  BROADCAST
# ────────────────────────────────────────────────────────────────
def send_broadcast(to_addresses: list[str], subject: str, body: str) -> None:
    if not to_addresses:
        return
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"]    = EMAIL_USER or "planpago@example.com"
    msg["To"]      = ", ".join(to_addresses)
    msg.set_content(body)
    _smtp_send(msg, to_addresses)

# ────────────────────────────────────────────────────────────────
#  (4)  APSCHEDULER ENTRY POINT
# ────────────────────────────────────────────────────────────────
def schedule_all_reminders(contract: Contract, scheduler, replace: bool = False) -> None:
    if contract.status == "expired":  # Add this check
        # Remove existing jobs for expired contracts
        for job_type in ["payment", "end"]:
            for days in [1, 3]:  # Assuming these are the typical reminder days
                job_id = f"reminder_{contract.id}_{job_type}_{days}"
                if scheduler.get_job(job_id):
                    scheduler.remove_job(job_id)
        return  # Do not schedule new reminders for expired contracts

    if replace:
        for job in list(scheduler.get_jobs()):
            if job.id.startswith(f"rem_{contract.id}_"):
                scheduler.remove_job(job.id)

    for days in (3, 1):
        # payment
        due = contract.start_date
        step = (
            relativedelta(months=1) if contract.payment_interval.lower() == "monthly"
            else relativedelta(years=1) if contract.payment_interval.lower() == "yearly"
            else None
        )
        while step and due < datetime.utcnow():
            due += step
        run_date = (due - timedelta(days=days)).replace(
            hour=REMINDER_EMAIL_HOUR, minute=REMINDER_EMAIL_MINUTE,
            second=0, microsecond=0
        )
        scheduler.add_job(
            send_reminder_email,
            trigger="date",
            id=f"rem_{contract.id}_pay_{days}",
            run_date=run_date,
            args=[contract.user.email, contract.id, days, "payment"],
            timezone="Europe/Berlin",
        )

        # end of contract
        if contract.end_date:
            end_run = (contract.end_date - timedelta(days=days)).replace(
                hour=REMINDER_EMAIL_HOUR, minute=REMINDER_EMAIL_MINUTE,
                second=0, microsecond=0
            )
            scheduler.add_job(
                send_reminder_email,
                trigger="date",
                id=f"rem_{contract.id}_end_{days}",
                run_date=end_run,
                args=[contract.user.email, contract.id, days, "end"],
                timezone="Europe/Berlin",
            )

# ────────────────────────────────────────────────────────────────
#  (5)  ADMIN IMPERSONATION
# ────────────────────────────────────────────────────────────────
def send_admin_impersonation_email(to_address: str, admin_email: str) -> None:
    tpl = TEMPLATES["system"]["admin_impersonation"]
    subject = tpl["subject"]
    body = tpl["body"]
    html = tpl["html"]()

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"]    = EMAIL_USER or "planpago@example.com"
    msg["To"]      = to_address
    msg.set_content(body)
    msg.add_alternative(html, subtype="html")
    _smtp_send(msg, to_address)
