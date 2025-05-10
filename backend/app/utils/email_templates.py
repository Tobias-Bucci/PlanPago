"""
E-Mail-Vorlagen (Plain-Text + HTML) für PlanPago.

Jedes Template-Dict hat drei Schlüssel:
    • subject –  Subject-String mit Platzhaltern
    • body    –  Plain-Text-Body mit Platzhaltern
    • html    –  Callable, die denselben Inhalt im Corporate-HTML-Layout rendert
"""

from datetime import datetime
from typing import List

PRIMARY = "#1e63ff"
BG_LIGHT = "#f6f8fa"

def _build_html(subject: str, body_lines: List[str]) -> str:
    """Erzeuge den HTML-Wrapper mit Logo, Farben & Copy‐Footer."""
    logo_url = "https://planpago.buccilab.com/PlanPago-trans.png"
    paragraphs = "".join(
        f"<p style='font-size:1.08rem;color:#222;margin-bottom:18px;text-align:center'>{line}</p>"
        for line in body_lines
    )
    year = datetime.utcnow().year
    return f"""
    <div style="font-family:Inter,Arial,sans-serif;background:{BG_LIGHT};padding:32px 0">
      <div style="max-width:420px;margin:auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(30,99,255,.08);padding:32px">
        <div style="text-align:center;margin-bottom:24px">
          <img src="{logo_url}" alt="PlanPago Logo" style="height:48px;margin-bottom:8px">
        </div>
        <h2 style="color:{PRIMARY};font-size:1.5rem;margin-bottom:12px;text-align:center;font-weight:700">
          {subject}
        </h2>
        {paragraphs}
        <div style="text-align:center;color:#aaa;font-size:.95rem;margin-top:24px">
          Best regards,<br><b>The PlanPago Team</b>
        </div>
      </div>
      <div style="text-align:center;color:#bbb;font-size:.9rem;margin-top:18px">&copy; {year} PlanPago</div>
    </div>
    """

# ────────────────────────────────────────────────────────────────
#  TEMPLATES
# ────────────────────────────────────────────────────────────────

TEMPLATES = {
    "payment": {
        "rent": {
            "subject": "PlanPago: Rent payment for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "Your rent payment for contract '{name}' of {amount} EUR is due in {days} days (on {date}).\n"
                "Please ensure the amount is transferred on time.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, amount=None, days=None, date=None: _build_html(
                f"Rent payment due in {days} days",
                [
                    f"Your rent payment for contract '{name}' of {amount} EUR is due in {days} days (on {date}).",
                    "Please ensure the amount is transferred on time.",
                ],
            ),
        },
        "insurance": {
            "subject": "PlanPago: Insurance premium for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "The premium for your insurance '{name}' of {amount} EUR is due in {days} days (on {date}).\n"
                "Please pay on time to keep your coverage active.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, amount=None, days=None, date=None: _build_html(
                f"Insurance premium due in {days} days",
                [
                    f"The premium for your insurance '{name}' of {amount} EUR is due in {days} days (on {date}).",
                    "Please pay on time to keep your coverage active.",
                ],
            ),
        },
        "streaming": {
            "subject": "PlanPago: Streaming subscription for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "Your streaming subscription '{name}' of {amount} EUR is due in {days} days (on {date}).\n"
                "Please renew your subscription on time.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, amount=None, days=None, date=None: _build_html(
                f"Streaming subscription due in {days} days",
                [
                    f"Your streaming subscription '{name}' of {amount} EUR is due in {days} days (on {date}).",
                    "Please renew your subscription on time.",
                ],
            ),
        },
        "salary": {
            "subject": "PlanPago: Salary payment in {days} days",
            "body": (
                "Hello,\n\n"
                "Your salary payment of {amount} EUR will be received in {days} days (on {date}).\n"
                "Please check your account statement if needed.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, amount=None, days=None, date=None, **_: _build_html(
                f"Salary payment in {days} days",
                [
                    f"Your salary payment of {amount} EUR will be received in {days} days (on {date}).",
                    "Please check your account statement if needed.",
                ],
            ),
        },
        "leasing": {
            "subject": "PlanPago: Leasing rate for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "The next leasing rate for '{name}' of {amount} EUR is due in {days} days (on {date}).\n"
                "Please ensure the funds are available on time.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, amount=None, days=None, date=None: _build_html(
                f"Leasing rate due in {days} days",
                [
                    f"The next leasing rate for '{name}' of {amount} EUR is due in {days} days (on {date}).",
                    "Please ensure the funds are available on time.",
                ],
            ),
        },
        "other": {
            "subject": "PlanPago: Payment for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "A payment for your contract '{name}' of {amount} EUR is due in {days} days (on {date}).\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, amount=None, days=None, date=None: _build_html(
                f"Payment due in {days} days",
                [
                    f"A payment for your contract '{name}' of {amount} EUR is due in {days} days (on {date})."
                ],
            ),
        },
        # Fallback — Schlüssel muss hier "Default" heißen, weil _make_reminder_body ihn so abfragt
        "Default": {
            "subject": "PlanPago: Payment due in {days} days",
            "body": (
                "Hello,\n\n"
                "A payment of {amount} EUR is due in {days} days (on {date}).\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, amount=None, days=None, date=None, **_: _build_html(
                f"Payment due in {days} days",
                [f"A payment of {amount} EUR is due in {days} days (on {date})."],
            ),
        },
    },

    # ───── Contract End Reminder ────────────────────────────────
    "end": {
        "rent": {
            "subject": "PlanPago: Rent contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your rent contract '{name}' ends in {days} days (on {date}).\n"
                "You can cancel or renew it as needed.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, days=None, date=None, **_: _build_html(
                f"Rent contract ends in {days} days",
                [
                    f"Your rent contract '{name}' ends in {days} days (on {date}).",
                    "You can cancel or renew it as needed.",
                ],
            ),
        },
        "insurance": {
            "subject": "PlanPago: Insurance contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your insurance contract '{name}' ends in {days} days (on {date}).\n"
                "Please check your options for renewal or changes.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, days=None, date=None, **_: _build_html(
                f"Insurance contract ends in {days} days",
                [
                    f"Your insurance contract '{name}' ends in {days} days (on {date}).",
                    "Please check your options for renewal or changes.",
                ],
            ),
        },
        "streaming": {
            "subject": "PlanPago: Streaming contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your streaming contract '{name}' ends in {days} days (on {date}).\n"
                "Please renew your subscription to avoid interruptions.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, days=None, date=None, **_: _build_html(
                f"Streaming contract ends in {days} days",
                [
                    f"Your streaming contract '{name}' ends in {days} days (on {date}).",
                    "Please renew your subscription to avoid interruptions.",
                ],
            ),
        },
        "salary": {
            "subject": "PlanPago: Salary contract ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your salary contract ends in {days} days (on {date}).\n"
                "Please clarify changes or extensions in time.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, days=None, date=None, **_: _build_html(
                f"Salary contract ends in {days} days",
                [
                    f"Your salary contract ends in {days} days (on {date}).",
                    "Please clarify changes or extensions in time.",
                ],
            ),
        },
        "leasing": {
            "subject": "PlanPago: Leasing contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your leasing contract '{name}' ends in {days} days (on {date}).\n"
                "Consider signing a new contract if needed.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, days=None, date=None, **_: _build_html(
                f"Leasing contract ends in {days} days",
                [
                    f"Your leasing contract '{name}' ends in {days} days (on {date}).",
                    "Consider signing a new contract if needed.",
                ],
            ),
        },
        "other": {
            "subject": "PlanPago: Contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your contract '{name}' ends in {days} days (on {date}).\n"
                "Please take appropriate action.\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, name=None, days=None, date=None, **_: _build_html(
                f"Contract ends in {days} days",
                [
                    f"Your contract '{name}' ends in {days} days (on {date}).",
                    "Please take appropriate action.",
                ],
            ),
        },
        "Default": {
            "subject": "PlanPago: Contract ends in {days} days",
            "body": (
                "Hello,\n\n"
                "A contract ends in {days} days (on {date}).\n\n"
                "Best regards,\n"
                "Your PlanPago Team"
            ),
            "html": lambda *, days=None, date=None, **_: _build_html(
                f"Contract ends in {days} days",
                [f"A contract ends in {days} days (on {date})."],
            ),
        },
    },
}
