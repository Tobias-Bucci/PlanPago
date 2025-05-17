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
    # HTML email with logo and professional layout
    logo_url = "https://planpago.buccilab.com/PlanPago-trans.png"  # Update to your real public logo URL if available
    html = f'''
    <div style="font-family: 'Inter', Arial, sans-serif; background: #f6f8fa; padding: 32px 0;">
      <div style="max-width: 420px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(30,99,255,0.08); padding: 32px 32px 24px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="{logo_url}" alt="PlanPago Logo" style="height: 48px; margin-bottom: 8px;"/>
        </div>
        <h2 style="color: #1e63ff; font-size: 1.5rem; margin-bottom: 12px; text-align: center; font-weight: 700; letter-spacing: 0.01em;">Your Verification Code</h2>
        <p style="font-size: 1.08rem; color: #222; margin-bottom: 18px; text-align: center;">Thank you for using PlanPago.<br>Your verification code is:</p>
        <div style="font-size: 2.2rem; font-weight: 700; color: #1e63ff; background: #f3f7ff; border-radius: 10px; padding: 18px 0; text-align: center; letter-spacing: 0.18em; margin-bottom: 18px;">{code}</div>
        <p style="font-size: 1rem; color: #444; margin-bottom: 18px; text-align: center;">Please enter this code to complete your login.<br>For your security, the code is valid for <b>10 minutes</b> only.</p>
        <p style="font-size: 0.98rem; color: #888; margin-bottom: 18px; text-align: center;">If you did not request this code, you can ignore this message and we recommend changing your password.</p>
        <div style="text-align: center; color: #aaa; font-size: 0.95rem; margin-top: 24px;">Best regards,<br><b>The PlanPago Team</b></div>
      </div>
      <div style="text-align: center; color: #bbb; font-size: 0.9rem; margin-top: 18px;">&copy; {datetime.utcnow().year} PlanPago</div>
    </div>
    '''
    msg.set_content(f"""Hello,\n\nYour PlanPago verification code is: {code}\n\nPlease enter this code to complete your login. For your security, the code is valid for 10 minutes only.\n\nIf you did not request this code, please ignore this message and change your password.\n\nBest regards,\nThe PlanPago Team""")
    msg.add_alternative(html, subtype="html")
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


def send_admin_impersonation_request_email(to_address: str, admin_email: str, confirm_url: str) -> None:
    display_admin = "Administrator" if admin_email == "admin@admin" else admin_email
    msg = EmailMessage()
    msg["Subject"] = "PlanPago – Admin login request"
    msg["From"] = EMAIL_USER or "planpago@example.com"
    msg["To"] = to_address
    html = f'''
    <div style="font-family: 'Inter', Arial, sans-serif; background: #f6f8fa; padding: 32px 0;">
      <div style="max-width: 420px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(30,99,255,0.08); padding: 32px 32px 24px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://planpago.buccilab.com/PlanPago-trans.png" alt="PlanPago Logo" style="height: 48px; margin-bottom: 8px;"/>
        </div>
        <h2 style="color: #1e63ff; font-size: 1.5rem; margin-bottom: 12px; text-align: center; font-weight: 700; letter-spacing: 0.01em;">Admin login request</h2>
        <p style="font-size: 1.08rem; color: #222; margin-bottom: 18px; text-align: center;">{display_admin} wants to access your account for support purposes.<br><br>Please confirm to allow access:</p>
        <div style="text-align: center; margin-bottom: 18px;">
          <a href="{confirm_url}" style="display: inline-block; background: #1e63ff; color: #fff; font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 1.1rem;">Allow admin access</a>
        </div>
        <p style="font-size: 0.98rem; color: #555; text-align: center;">If you did not expect this, you can ignore this email.</p>
      </div>
    </div>
    '''
    msg.set_content(f"{display_admin} wants to access your account. Confirm here: {confirm_url}")
    msg.add_alternative(html, subtype="html")
    _smtp_send(msg, to_address)
