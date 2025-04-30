# backend/app/utils/email_utils.py
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
from .email_templates import TEMPLATES

# ────────────────────────────────────────────────────────────────
#  ENVIRONMENT
# ────────────────────────────────────────────────────────────────
load_dotenv()  # .env / secrets

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# ────────────────────────────────────────────────────────────────
#  LOG DIRECTORY & FILES
# ────────────────────────────────────────────────────────────────
LOG_DIR: Path = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

MAIL_LOG: Path = LOG_DIR / "emails.log"        # <── NEW (one line per recipient)


def _log_mail(to_addr: str | Sequence[str], subject: str) -> None:
    """
    Append a line per recipient to emails.log
    Format: ISO-timestamp  recipient  subject
    """
    subject = subject.replace("\n", " ").replace("\r", " ").strip()
    ts = datetime.utcnow().isoformat(timespec="milliseconds")
    recipients: Iterable[str] = (
        to_addr if isinstance(to_addr, (list, tuple)) else [to_addr]
    )
    with MAIL_LOG.open("a", encoding="utf-8") as f:
        for rcpt in recipients:
            f.write(f"{ts}  {rcpt}  {subject}\n")


# ────────────────────────────────────────────────────────────────
#  GENERIC SEND HELPER
# ────────────────────────────────────────────────────────────────
def _smtp_send(msg: EmailMessage, to_addr: str | Sequence[str]) -> None:
    """
    Send *msg* via SMTP STARTTLS.
    On success *or* simulated send (missing credentials) the e-mail is logged.
    """
    if not EMAIL_USER or not EMAIL_PASS:
        print("⚠︎  EMAIL_USER / EMAIL_PASS not configured – skip real send.")
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
    msg = EmailMessage()
    msg["Subject"] = "PlanPago – Your verification code"
    msg["From"] = EMAIL_USER or "planpago@example.com"
    msg["To"] = to_address
    msg.set_content(
    f"""Hello,

        Your PlanPago verification code is:

        {code}

        Please enter this code to complete your login. 
        For your security, the code is valid for 10 minutes only.

        If you did not request this code, please ignore this message and change your password.

        Best regards,  
        The PlanPago Team"""
        )

    _smtp_send(msg, to_address)


# ────────────────────────────────────────────────────────────────
#  (2)  REMINDER E-MAILS
# ────────────────────────────────────────────────────────────────
def _make_reminder_body(
    contract: Contract, reminder_type: str, days: int
) -> Tuple[str, str]:
    """Return (subject, body) prepared from email_templates.py."""
    tpl_group = TEMPLATES.get(reminder_type, {})
    tpl = tpl_group.get(contract.contract_type, tpl_group.get("Default"))
    if not tpl:
        return "", ""

    # calendar date shown in e-mail
    if reminder_type == "payment":
        due = contract.start_date
        step = (
            relativedelta(months=1)
            if contract.payment_interval.lower() == "monthly"
            else relativedelta(years=1)
            if contract.payment_interval.lower() == "yearly"
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
    return subject, body


def send_reminder_email(
    to_address: str, contract_id: int, days_before: int, reminder_type: str
) -> None:
    session = SessionLocal()
    contract: Contract | None = session.get(Contract, contract_id)
    user: User | None = session.get(User, contract.user_id) if contract else None
    session.close()

    if not contract or not user or not user.email_reminders_enabled:
        return

    subj, body = _make_reminder_body(contract, reminder_type, days_before)
    if not subj:
        return

    msg = EmailMessage()
    msg["Subject"] = subj
    msg["From"] = EMAIL_USER or "planpago@example.com"
    msg["To"] = to_address
    msg.set_content(body)

    _smtp_send(msg, to_address)


# ────────────────────────────────────────────────────────────────
#  (3)  BROADCAST / BULK MAIL
# ────────────────────────────────────────────────────────────────
def send_broadcast(to_addresses: list[str], subject: str, body: str) -> None:
    """Send a simple bulk e-mail (admin panel feature)."""
    if not to_addresses:
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER or "planpago@example.com"
    msg["To"] = ", ".join(to_addresses)
    msg.set_content(body)

    _smtp_send(msg, to_addresses)


# ────────────────────────────────────────────────────────────────
#  (4)  APSCHEDULER ENTRY POINT
# ────────────────────────────────────────────────────────────────
def schedule_all_reminders(contract: Contract, scheduler, replace: bool = False) -> None:
    """
    Schedule (3 d & 1 d) reminders for payment AND (optional) end of contract.
    """
    if replace:
        for job in scheduler.get_jobs():
            if job.id.startswith(f"rem_{contract.id}_"):
                scheduler.remove_job(job.id)

    from datetime import datetime  # local import to avoid circular ref

    for days in (3, 1):
        # ─── payment ───────────────────────────────────────────
        due = contract.start_date
        step = (
            relativedelta(months=1)
            if contract.payment_interval.lower() == "monthly"
            else relativedelta(years=1)
            if contract.payment_interval.lower() == "yearly"
            else None
        )
        while step and due < datetime.utcnow():
            due += step
        run_date = (due - timedelta(days=days)).replace(
            hour=3, minute=0, second=0, microsecond=0
        )
        scheduler.add_job(
            send_reminder_email,
            trigger="date",
            id=f"rem_{contract.id}_pay_{days}",
            run_date=run_date,
            args=[contract.user.email, contract.id, days, "payment"],
            timezone="Europe/Berlin",
        )

        # ─── contract end ──────────────────────────────────────
        if contract.end_date:
            end_run = (contract.end_date - timedelta(days=days)).replace(
                hour=3, minute=0, second=0, microsecond=0
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
#  (5)  ADMIN IMPERSONATION NOTIFICATION
# ────────────────────────────────────────────────────────────────
def send_admin_impersonation_email(to_address: str, admin_email: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = "PlanPago – Admin login notification"
    msg["From"] = EMAIL_USER or "planpago@example.com"
    msg["To"] = to_address
    msg.set_content(
    f"""Hello,
        We wanted to inform you that an administrator has just accessed your PlanPago account to provide support or perform troubleshooting.

        If you were not expecting this access or have any concerns, please contact our support team immediately.

        Thank you for using PlanPago.

        Best regards,  
        The PlanPago Team"""
)

    _smtp_send(msg, to_address)
