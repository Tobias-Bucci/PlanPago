## PlanPago

**PlanPago** ist eine browserbasiertes Web­tool zur strukturierten Verwaltung deiner Verträge und wiederkehrenden Zahlungsverpflichtungen. Mit PlanPago behältst du Mietverträge, Versicherungen, Abonnements und Gehaltsverträge im Blick, erhältst automatische Netto‑Berechnungen und kannst dich per E‑Mail an anstehende Fristen erinnern lassen.

---

### 📂 Projektstruktur

```
backend/
├─ app/
│  ├─ main.py
│  ├─ models.py
│  ├─ schemas.py
│  ├─ database.py
│  └─ routes/
│     ├─ users.py
│     └─ contracts.py
└─ tests/
   ├─ test_contracts.py
   └─ test_users.py

frontend/
├─ src/
│  ├─ components/
│  │  └─ NavBar.jsx
│  ├─ pages/
│  │  ├─ Dashboard.jsx
│  │  ├─ ContractForm.jsx
│  │  └─ Profile.jsx
│  ├─ utils/
│  │  └─ taxUtils.js
│  └─ App.js
├─ package.json
└─ tailwind.config.js
```

---

## 🚀 Technologie‑Stack

- **Backend**
  - Python 3.11
  - FastAPI (REST‑API + OpenAPI‑Docs)
  - SQLAlchemy ORM
  - SQLite (oder PostgreSQL)
  - Pydantic v2
  - Passlib (bcrypt)
  - jose (JWT)
  - pytest, httpx für Unit‑Tests
- **Frontend**
  - React 18
  - React Router
  - Tailwind CSS
  - Fetch API (mit JWT‑Bearer‑Headern)

---

## 🔧 Installation & Start

### 1. Backend

1. Repository klonen und in das Backend‑Verzeichnis wechseln

   ```bash
   git clone <repo-url>
   cd PlanPago/backend
   ```

2. Virtuelle Umgebung anlegen und aktivieren

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Abhängigkeiten installieren

   ```bash
   pip install -r requirements.txt
   ```

4. (Optional) Datenbank zurücksetzen

   ```bash
   rm database.db
   export PYTHONPATH=.
   python - <<EOF
   from app.database import Base, engine
   Base.metadata.create_all(bind=engine)
   EOF
   ```

5. Server starten

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   ```

6. API‑Docs verfügbar unter

   > [http://localhost:8001/docs](http://localhost:8001/docs)

7. Tests ausführen

   ```bash
   export PYTHONPATH=.
   pytest -v
   ```

### 2. Frontend

1. In das Frontend‑Verzeichnis wechseln

   ```bash
   cd ../frontend
   ```

2. Abhängigkeiten installieren

   ```bash
   npm install
   ```

3. Dev‑Server starten

   ```bash
   npm start
   ```

4. App öffnen unter

   > [http://localhost:4000](http://localhost:4000/)

---

## ✅ Aktuell implementierte Features

### Authentifizierung & Nutzerverwaltung

- **Registrierung** mit E‑Mail + Passwort
- **Login** via JWT (Bearer‑Token im LocalStorage)
- **Profil**
  - E‑Mail und Passwort ändern
  - Benutzer­spezifische Einstellungen: Land, Währung
  - Account löschen (inkl. aller Verträge)

### Vertragsverwaltung (CRUD)

- **Contracts** API
  - `POST /contracts/` → Neues Vertragsobjekt mit `user_id`
  - `GET /contracts/` → Listet nur **eigene** Verträge
  - `GET /contracts/{id}` → Details (nur eigener Vertrag)
  - `PATCH /contracts/{id}` → Teil‑Update, beliebige Felder
  - `DELETE /contracts/{id}` → Löschen (nur eigener Vertrag)
- **Mandanten‑Isolation**: Jeder Nutzer sieht und ändert nur seine Verträge

### Frontend UX

- **NavBar** mit Links zu Dashboard, neuem Vertrag, Profil und Logout
- **Dashboard**
  - Tabelle aller eigenen Verträge
  - Abgelaufene Verträge als „inactive“ gekennzeichnet
  - Aktionen: 🗑️ Löschen, ✏️ Bearbeiten
- **ContractForm** (Create & Edit)
  - Einheitliches Formular für Neu‑Anlage oder Bearbeitung
  - Live‑Netto‑Berechnung (via `computeNet`), überschreibbar
  - Pflicht‑Validierung (Felder, Land, Betrag) mit freundlichen Hinweisen
  - Bei fehlendem Land roter, klickbarer Hinweis zur Profile‑Seite
- **Profile**
  - Lesen und Ändern von E‑Mail/Passwort
  - Country‑Autocomplete (Dropdown / Freitext mit Vorschlägen)
  - Währungs‑Auswahl (EUR, USD, CHF, GBP)
  - Persistente Speicherung pro E‑Mail in `localStorage`
  - Löschen des Accounts und zugehöriger Daten

---

## 🔮 Geplante Features

- **E‑Mail‑Reminder**
  - Automatische Benachrichtigungen vor Fälligkeiten und Kündigungsfristen
- **Kalender‑Export**
  - iCal / Google Calendar Integration
- **Dokumenten­verwaltung**
  - Hochladen und sichere Speicherung von Vertrags‑PDFs/Bildern
- **Erweiterte Finanz‑Analytics**
  - Diagramme: Kostenverteilung, Monatsüberblick
  - Prognosen zukünftiger Ausgaben
- **Mehrbenutzer‑Support**
  - Familien‑ oder Team‑Accounts mit Rollen (Admin, Editor, Viewer)
- **2‑Faktor‑Authentifizierung** (TOTP)
- **Dark Mode** und Accessibility‑Optimierungen
- **Mobile App** (React Native oder Flutter)
