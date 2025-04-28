#!/usr/bin/env python3
"""
bulk_create_contracts.py
────────────────────────
Erstellt auf Knopfdruck mehrere Demo-Verträge (Default: 25) über die REST-API.

• TOKEN        : JWT aus localStorage              (Pflicht, ENV oder CLI)
• API_BASE_URL : https://planpago.buccilab.com/api (ENV oder CLI)
• --count      : Anzahl der Einträge (Default 25)
• --insecure   : SSL-Prüfung abschalten (Self-signed Certs)

Beispiel:
  export TOKEN="$(pbpaste)"                           # JWT aus Zwischenablage
  python3 bulk_create_contracts.py \
          --api https://planpago.buccilab.com/api \
          --count 25
"""

import os, random, datetime, argparse, sys, requests
from typing import Dict

TYPES   = ["Miete", "Versicherung", "Streaming", "Gehalt", "Leasing", "Sonstiges"]
PAY_INT = ["monthly", "yearly", "one-time"]
TODAY   = datetime.date.today()

# ─────────────────────────────────────────────────────────────────────────────
def fake_contract(idx: int) -> Dict:
    ctype  = TYPES[idx % len(TYPES)]
    amount = {
        "Miete"       : random.randint(600, 1400),
        "Versicherung": random.randint(20, 80),
        "Streaming"   : random.randint(8, 20),
        "Gehalt"      : random.randint(1700, 3000),
        "Leasing"     : random.randint(200, 600),
        "Sonstiges"   : random.randint(15, 80),
    }[ctype]

    start = TODAY + datetime.timedelta(days=idx)             # etwas verteilt
    end   = start + datetime.timedelta(days=365) if random.random() < .6 else None

    return {
        "name"            : f"Demo #{idx+1}",
        "contract_type"   : ctype,
        "start_date"      : f"{start}T00:00:00",
        "end_date"        : f"{end}T00:00:00" if end else None,
        "amount"          : float(amount),
        "payment_interval": random.choice(PAY_INT),
        "status"          : "active",
        "notes"           : "generated via bulk script",
    }

# ─────────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api",    default=os.getenv("API_BASE_URL", "https://planpago.buccilab.com/api"),
                        help="Base URL, e.g. https://planpago.buccilab.com/api")
    parser.add_argument("--count",  type=int, default=25, help="how many contracts to create")
    parser.add_argument("--token",  default=os.getenv("TOKEN"), help="JWT token")
    parser.add_argument("--insecure", action="store_true", help="disable TLS verification")
    args = parser.parse_args()

    if not args.token:
        sys.exit("❌  TOKEN fehlt. Setze ihn via --token oder $TOKEN")

    url     = f"{args.api.rstrip('/')}/contracts/"
    headers = {"Authorization": f"Bearer {args.token}", "Content-Type": "application/json"}
    verify  = not args.insecure                                   # False = self-signed

    print(f"→  POST {url}  (count={args.count})")
    for i in range(args.count):
        payload = fake_contract(i)
        resp    = requests.post(url, json=payload, headers=headers, verify=verify, timeout=15)
        if resp.status_code == 201:
            cid = resp.json()["id"]
            print(f"   ✓  id {cid:<4}  {payload['name']:<10} ({payload['contract_type']})")
        else:
            print("   ⚠︎  Fehler:", resp.status_code, resp.text)
            break

# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    main()
