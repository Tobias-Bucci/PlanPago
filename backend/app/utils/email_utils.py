# app/utils/email_utils.py
from dotenv import load_dotenv
import os, smtplib
from email.message import EmailMessage

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
