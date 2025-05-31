Here is the complete README translated into English:

---

## PlanPago

**PlanPago** is a browser-based web tool for the structured management of your contracts and recurring payment obligations. With PlanPago, you can keep track of rental contracts, insurance policies, subscriptions, and employment contracts. It includes automatic net salary calculations and email reminders for upcoming deadlines.

---

### 📂 Project Structure

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

## 🚀 Technology Stack

* **Backend**

  * Python 3.11
  * FastAPI (REST API + OpenAPI Docs)
  * SQLAlchemy ORM
  * SQLite (or PostgreSQL)
  * Pydantic v2
  * Passlib (bcrypt)
  * jose (JWT)
  * pytest, httpx for unit tests

* **Frontend**

  * React 18
  * React Router
  * Tailwind CSS
  * Fetch API (with JWT Bearer headers)

---

## 🔧 Installation & Startup

### 1. Backend

1. Clone the repository and navigate to the backend directory:

   ```bash
   git clone <repo-url>
   cd PlanPago/backend
   ```

2. Create and activate a virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. (Optional) Reset the database:

   ```bash
   rm database.db
   export PYTHONPATH=.
   python - <<EOF
   from app.database import Base, engine
   Base.metadata.create_all(bind=engine)
   EOF
   ```

5. Start the server:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   ```

6. API documentation is available at:

   > [http://localhost:8001/docs](http://localhost:8001/docs)

7. Run tests:

   ```bash
   export PYTHONPATH=.
   pytest -v
   ```

### 2. Frontend

1. Navigate to the frontend directory:

   ```bash
   cd ../frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open the app at:

   > [http://localhost:4000](http://localhost:4000/)

---

## ✅ Currently Implemented Features

### Authentication & User Management

* **Registration** with email and password
* **Login** via JWT (Bearer token in localStorage)
* **2FA support**: Email codes or TOTP (Authenticator apps)
* **Brute-force protection**: Login limits with cooldown
* **Profile**

  * Change email and password (with 2FA confirmation)
  * Password validation (minimum requirements)
  * User-specific settings: country, currency
  * Account deletion (including all contracts)

### Contract Management (CRUD)

* **Contracts API**

  * `POST /contracts/` → Create a new contract (linked to `user_id`)
  * `GET /contracts/` → Lists only **your** contracts
  * `GET /contracts/{id}` → View details (only your own)
  * `PATCH /contracts/{id}` → Partial update of any fields
  * `DELETE /contracts/{id}` → Delete (only your own)
* **Tenant isolation**: Each user sees and modifies only their own contracts

### Frontend UX

* **Modern Glass-Morphism Design**

  * Consistent visual language across all pages (Dashboard, Forms, Profile, Statistics)
  * Semi-transparent cards with backdrop blur effects
  * Smooth animations and hover transitions
* **NavBar** with links to Dashboard, New Contract, Statistics, Profile, and Logout
* **Dashboard**

  * Consistent desktop layout for all screen sizes
  * Advanced filtering and sorting with live search
  * Bulk export functionality (CSV/PDF)
  * File attachment preview and management
  * Intuitive pagination with visual feedback
* **Statistics Page**

  * Comprehensive financial overview with KPI cards
  * Interactive pie charts for expense and income breakdown
  * Upcoming payments timeline with visual indicators
  * Responsive design optimized for all devices
  * Real-time calculation of savings rate and available budget
* **ContractForm** (Create & Edit)

  * Structured multi-section layout with clear visual hierarchy
  * Contextual form fields that adapt based on contract type
  * Enhanced file upload with drag-and-drop support
  * Live validation with helpful error messages and guidance
  * Smart net salary calculation for employment contracts
  * Responsive design optimized for mobile and desktop
* **Profile**

  * Comprehensive user settings management
  * Secure password change functionality
  * Country and currency preferences with autocomplete
  * Account deletion with data protection compliance

---

## 🔮 Planned Features

* **Email reminders**

  * Automatic notifications before due dates and termination deadlines
* **Calendar export**

  * iCal / Google Calendar integration
* **Document management**

  * Upload and securely store contract PDFs/images
* **Advanced financial analytics**

  * Charts: cost distribution, monthly overview
  * Forecasting of future expenses
* **Multi-user support**

  * Family or team accounts with roles (Admin, Editor, Viewer)
* **2-factor authentication** (TOTP)
* **Dark Mode** and accessibility improvements
* **Mobile App** (React Native or Flutter)
