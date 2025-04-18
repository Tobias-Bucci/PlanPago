# backend/app/utils/email_utils.py

from dotenv import load_dotenv
import os, smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from .email_templates import TEMPLATES
from ..database import SessionLocal
from ..models import Contract

# lädt die Umgebungsvariablen aus .env
load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


def send_code_via_email(to_address: str, code: str):
    if not EMAIL_USER or not EMAIL_PASS:
        print("⚠️ E‑Mail‑Credentials fehlen (EMAIL_USER/EMAIL_PASS)!")
        return

    msg = EmailMessage()
    msg["Subject"] = "PlanPago Verifizierungscode"
    msg["From"]    = EMAIL_USER
    msg["To"]      = to_address
    msg.set_content(f"Ihr Verifizierungscode lautet:\n\n  {code}\n\nGültig für 10 Minuten.")

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
    session = SessionLocal()
    contract: Contract = session.get(Contract, contract_id)
    session.close()
    if not contract:
        return

    tpl = TEMPLATES[reminder_type]
    subject = tpl["subject"].format(
        name=contract.name,
        type=contract.contract_type,
        days=days_before
    )

    # Fälligkeitsdatum ermitteln
    if reminder_type == "payment":
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
        date_str = due.date().isoformat()
    else:
        date_str = contract.end_date.date().isoformat()

    body = tpl["body"].format(
        name=contract.name,
        type=contract.contract_type,
        amount=contract.amount,
        date=date_str,
        days=days_before
    )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"]    = EMAIL_USER
    msg["To"]      = to_address
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
    Plant alle 3d- und 1d-Reminder für Zahlung und Vertragsende.
    Wenn replace=True: vorherige Jobs für diesen Contract löschen.
    """
    # alte Jobs entfernen
    if replace:
        for job in scheduler.get_jobs():
            if job.id.startswith(f"rem_{contract.id}_"):
                scheduler.remove_job(job.id)

    # neue Jobs hinzufügen
    for days in (3, 1):
        # payment reminder
        scheduler.add_job(
            send_reminder_email,
            trigger="date",
            id=f"rem_{contract.id}_pay_{days}",
            run_date=contract.start_date - timedelta(days=days),
            args=[contract.user.email, contract.id, days, "payment"],
            timezone="Europe/Berlin",
        )
        # end reminder (falls gesetzt)
        if contract.end_date:
            scheduler.add_job(
                send_reminder_email,
                trigger="date",
                id=f"rem_{contract.id}_end_{days}",
                run_date=contract.end_date - timedelta(days=days),
                args=[contract.user.email, contract.id, days, "end"],
                timezone="Europe/Berlin",
            )
