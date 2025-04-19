# backend/app/utils/email_utils.py

from dotenv import load_dotenv
import os
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from ..database import SessionLocal
from ..models import Contract, User
from .email_templates import TEMPLATES

# Umgebungsvariablen laden
load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


def send_code_via_email(to_address: str, code: str):
    """Sendet den 2FA-Code per E‑Mail."""
    if not EMAIL_USER or not EMAIL_PASS:
        print("⚠️ E‑Mail‑Credentials fehlen (EMAIL_USER/EMAIL_PASS)!")
        return

    msg = EmailMessage()
    msg["Subject"] = "PlanPago Verifizierungscode"
    msg["From"] = EMAIL_USER
    msg["To"] = to_address
    msg.set_content(
        f"Ihr Verifizierungscode lautet:\n\n  {code}\n\nGültig für 10 Minuten."
    )

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)
            print(f"✅ Code an {to_address} gesendet.")
    except Exception as e:
        print("❌ Fehler beim E‑Mail‑Versand:", e)


def send_reminder_email(to_address: str, contract_id: int, days_before: int, reminder_type: str):
    """
    Baut auf TEMPLATES auf und versendet Erinnerung:
    - reminder_type: "payment" oder "end"
    - days_before: 3 oder 1
    """
    session = SessionLocal()

    # Vertrag und User laden
    contract: Contract = session.get(Contract, contract_id)
    user: User = session.get(User, contract.user_id) if contract else None
    session.close()

    if not contract or not user:
        return

    # Prüfen, ob der Nutzer E‑Mail‑Reminder aktiviert hat
    if not getattr(user, "email_reminders_enabled", True):
        return

    # Auswahl der passenden Sub-Template nach Vertragstyp oder Default
    type_templates = TEMPLATES.get(reminder_type, {})
    sub_tpl = type_templates.get(
        contract.contract_type,
        type_templates.get("Default")
    )
    if not sub_tpl:
        return

    subject = sub_tpl["subject"].format(
        name=contract.name,
        type=contract.contract_type,
        days=days_before
    )

    # Datum bestimmen
    if reminder_type == "payment":
        due = contract.start_date
        interval = contract.payment_interval.lower()
        if interval == "monatlich":
            step = relativedelta(months=1)
        elif interval == "jährlich":
            step = relativedelta(years=1)
        else:
            step = None

        # nächstes Fälligkeitsdatum ≥ heute
        while step and due < datetime.now():
            due += step
        date_str = due.date().isoformat()
    else:
        # Vertragsende
        date_str = contract.end_date.date().isoformat()

    body = sub_tpl["body"].format(
        name=contract.name,
        type=contract.contract_type,
        amount=contract.amount,
        date=date_str,
        days=days_before
    )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_address
    msg.set_content(body)

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)
            print(f"✅ Reminder ({reminder_type}-{days_before}d) an {to_address} gesendet.")
    except Exception as e:
        print("❌ Fehler beim Reminder‑Versand:", e)


def schedule_all_reminders(contract: Contract, scheduler, replace: bool = False):
    """
    Plant für den gegebenen Vertrag jeweils zwei Erinnerungen
    (3 Tage und 1 Tag vorher) für Zahlungstermin und Vertragsende.
    """
    if replace:
        for job in scheduler.get_jobs():
            if job.id.startswith(f"rem_{contract.id}_"):
                scheduler.remove_job(job.id)

    for days in (3, 1):
        # ─── Zahlungserinnerung ────────────────────────────────
        due = contract.start_date
        interval = contract.payment_interval.lower()
        if interval == "monatlich":
            step = relativedelta(months=1)
        elif interval == "jährlich":
            step = relativedelta(years=1)
        else:
            step = None

        while step and due < datetime.now():
            due += step

        run_date = due - timedelta(days=days)
        run_date = run_date.replace(hour=3, minute=0, second=0, microsecond=0)

        scheduler.add_job(
            send_reminder_email,
            trigger="date",
            id=f"rem_{contract.id}_pay_{days}",
            run_date=run_date,
            args=[contract.user.email, contract.id, days, "payment"],
            timezone="Europe/Berlin",
        )

        # ─── Enderinnerung ──────────────────────────────────────
        if contract.end_date:
            end_run = contract.end_date - timedelta(days=days)
            end_run = end_run.replace(hour=3, minute=0, second=0, microsecond=0)

            scheduler.add_job(
                send_reminder_email,
                trigger="date",
                id=f"rem_{contract.id}_end_{days}",
                run_date=end_run,
                args=[contract.user.email, contract.id, days, "end"],
                timezone="Europe/Berlin",
            )
