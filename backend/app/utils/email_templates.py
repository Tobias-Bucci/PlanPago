# backend/app/utils/email_templates.py

# Hier sind für jede Vertragsart und jeden Reminder-Typ individuelle Vorlagen
# möglichen Vertragsarten: "Miete", "Versicherung", "Streaming", "Gehalt", "Leasing", "Sonstiges"

TEMPLATES = {
    "payment": {
        "Miete": {
            "subject": "PlanPago: Mietzahlung für \"{name}\" in {days} Tagen fällig",
            "body": (
                "Hallo,\n\n"
                "Ihre Mietzahlung für den Vertrag \"{name}\" in Höhe von {amount} EUR ist in {days} Tagen fällig (am {date}).\n"
                "Bitte stellen Sie sicher, dass der Betrag rechtzeitig überwiesen wird.\n\n"
                "Mit besten Grüßen,\n"
                "Ihr PlanPago-Team"
            )
        },
        "Versicherung": {
            "subject": "PlanPago: Versicherungsprämie für \"{name}\" in {days} Tagen fällig",
            "body": (
                "Hallo,\n\n"
                "Die Prämie für Ihre Versicherung \"{name}\" in Höhe von {amount} EUR ist in {days} Tagen fällig (am {date}).\n"
                "Vergessen Sie nicht, rechtzeitig zu zahlen, damit Ihr Schutz bestehen bleibt.\n\n"
                "Viele Grüße,\n"
                "Ihr PlanPago-Team"
            )
        },
        "Streaming": {
            "subject": "PlanPago: Abo-Verlängerung für \"{name}\" in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Ihr Streaming-Abonnement \"{name}\" für {amount} EUR läuft in {days} Tagen ab (am {date}).\n"
                "Denken Sie daran, Ihr Abo rechtzeitig zu erneuern.\n\n"
                "Beste Grüße,\n"
                "Ihr PlanPago-Team"
            )
        },
        "Gehalt": {
            "subject": "PlanPago: Gehaltszahlung in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Ihre Gehaltszahlung in Höhe von {amount} EUR wird in {days} Tagen eingehen (am {date}).\n"
                "Überprüfen Sie bei Bedarf Ihre Kontoauszüge, um sicherzugehen.\n\n"
                "Herzliche Grüße,\n"
                "Ihr PlanPago-Team"
            )
        },
        "Leasing": {
            "subject": "PlanPago: Leasingrate für \"{name}\" in {days} Tagen fällig",
            "body": (
                "Hallo,\n\n"
                "Die nächste Leasingrate für \"{name}\" in Höhe von {amount} EUR ist in {days} Tagen fällig (am {date}).\n"
                "Bitte sorgen Sie dafür, dass das Geld rechtzeitig verfügbar ist.\n\n"
                "Viele Grüße,\n"
                "Ihr PlanPago-Team"
            )
        },
        "Sonstiges": {
            "subject": "PlanPago: Zahlung für \"{name}\" in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Für Ihren Vertrag \"{name}\" ist eine Zahlung in Höhe von {amount} EUR in {days} Tagen fällig (am {date}).\n"
                "Bitte überweisen Sie rechtzeitig.\n\n"
                "Ihr PlanPago-Team"
            )
        },
        "Default": {
            "subject": "PlanPago: Zahlung in {days} Tagen fällig",
            "body": (
                "Hallo,\n\n"
                "Eine Zahlung in Höhe von {amount} EUR ist in {days} Tagen fällig (am {date}).\n\n"
                "Beste Grüße,\n"
                "Ihr PlanPago-Team"
            )
        }
    },
    "end": {
        "Miete": {
            "subject": "PlanPago: Mietvertrag \"{name}\" endet in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Ihr Mietvertrag \"{name}\" endet in {days} Tagen (am {date}).\n"
                "Sie können ihn bei Bedarf rechtzeitig kündigen oder verlängern.\n\n"
                "Mit freundlichen Grüßen,\n"
                "Ihr PlanPago-Team"
            )
        },
        "Versicherung": {
            "subject": "PlanPago: Versicherungsvertrag \"{name}\" endet in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Ihr Versicherungsvertrag \"{name}\" läuft in {days} Tagen aus (am {date}).\n"
                "Bitte prüfen Sie Ihre Optionen zur Verlängerung oder Änderung.\n\n"
                "Beste Grüße,\n"
                "Ihr PlanPago-Team"
            )
        },
        "Streaming": {
            "subject": "PlanPago: Streamingvertrag \"{name}\" endet in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Ihr Streaming-Vertrag \"{name}\" endet in {days} Tagen (am {date}).\n"
                "Denken Sie daran, Ihr Abo zu verlängern, um Unterbrechungen zu vermeiden.\n\n"
                "Ihr PlanPago-Team"
            )
        },
        "Gehalt": {
            "subject": "PlanPago: Gehaltsvertrag endet in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Ihr Gehaltsvertrag endet in {days} Tagen (am {date}).\n"
                "Bitte klären Sie Änderungen oder Verlängerungen rechtzeitig.\n\n"
                "Mit besten Grüßen,\n"
                "Ihr PlanPago-Team"
            )
        },
        "Leasing": {
            "subject": "PlanPago: Leasingvertrag \"{name}\" endet in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Ihr Leasingvertrag \"{name}\" läuft in {days} Tagen aus (am {date}).\n"
                "Überlegen Sie, ob Sie einen neuen Vertrag abschließen möchten.\n\n"
                "Viele Grüße,\n"
                "Ihr PlanPago-Team"
            )
        },
        "Sonstiges": {
            "subject": "PlanPago: Vertrag \"{name}\" endet in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Ihr Vertrag \"{name}\" endet in {days} Tagen (am {date}).\n"
                "Bitte beachten Sie das Ende und handeln Sie entsprechend.\n\n"
                "Ihr PlanPago-Team"
            )
        },
        "Default": {
            "subject": "PlanPago: Vertrag endet in {days} Tagen",
            "body": (
                "Hallo,\n\n"
                "Ein Vertrag endet in {days} Tagen (am {date}).\n\n"
                "Beste Grüße,\n"
                "Ihr PlanPago-Team"
            )
        }
    }
}
