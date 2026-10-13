# Milk Chilling Centre Management System (MCCMS)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React_19_|_Vite-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Styling-Tailwind_CSS_4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_|_Supabase-336791.svg?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**MCCMS** is a mission-critical operational management platform designed for dairy milk chilling centres. It oversees the complete lifecycle of dairy intake: from counter farmer collections and laboratory quality grading to dynamic formula pricing, cold silo inventory balancing, bulk bowser dispatches, and financial reconciliation.

---

## 🥛 System Domain Flow

```
Farmer Profile (KYC & Routes)
   └──> Twice-Daily Milk Collection (Morning / Evening Shifts)
         └──> Quality Testing (Fat %, SNF %, Temp °C, Verdict)
               └──> Dynamic Formula Pricing (Quantity × Final Rate = Gross Value)
                     └──> Cold Storage Silo (Opening + Collections - Dispatches = Closing)
                           └──> Bulk Bowser Dispatch & Buyer Reconciliation
                                 └──> Monthly Farmer Payouts & Input Credit Deductions
```

---

## 🚀 Key Modules & Operational Views

### Level 1 Operational Views
1. **Daily Milk Collection (UI Mockup 4)**:
   - Twice-daily counter milk intake (`Morning` and `Evening` session toggle).
   - Route selector (`R-001` through `R-004`) and active farmer lookup with autocomplete.
   - Real-time dynamic pricing calculation card (`Quantity × Rate = Gross Value`).
   - One-click quality status validation (`Accepted`, `Rejected`, `Acidic`).
   - Live session summary metrics (Volume, Gross Amount, Accepted/Rejected counts, Averages).

2. **Quality Analysis & Compliance (UI Mockup 5)**:
   - Center quality KPI cards (Average Fat %, Average SNF %, Reception Temperature, Acceptance Rate).
   - Recharts dual-line trend curves over 7, 14, and 30 days with regulatory benchmark reference lines (Min 3.5% Fat, 8.0% SNF).
   - Quality acceptance donut ratio (Accepted vs. Acidic vs. Rejected).
   - Morning vs. Evening ambient shift comparison metrics.
   - Granular daily quality breakdown table with automated quality grading (`Grade A`, `Standard`, `Review`).

3. **Chilling Stock & Cold Silo (UI Mockup 6)**:
   - High-fidelity visual cold silo level (15,000 L capacity, fill percentage, chamber Fat & SNF).
   - Live cold chamber temperature probe monitoring with safety threshold badges (`Optimal`, `Acceptable`, `Warning`) and logging modal.
   - Enforced core inventory balance equation:
     $$\text{Closing Stock} = \text{Opening Stock} + \text{Accepted Collections} - \text{Dispatches}$$
   - Prevents negative stock violations (`422 BUSINESS_RULE_VIOLATION`).
   - 14-day historical balance reconciliation ledger.

4. **Bowser Dispatch & Buyer Reconciliation (UI Mockup 7)**:
   - Tanker dispatch directory tracking drivers, buyer destinations, and volumes.
   - **"New Dispatch" modal** with live stock limit validation (prevents over-dispatching).
   - **"Buyer Reconciliation" modal** for recording buyer received quantities and agreed rates.
   - Real-time transit variance calculation ($\text{Dispatched} - \text{Accepted}$) and buyer payable ledger integration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, Lucide Icons, Axios |
| **Backend** | FastAPI, Pydantic v2, SQLAlchemy 2, Uvicorn, psycopg2-binary |
| **Database** | PostgreSQL 16 (Supabase cloud pooler or local Docker container) |
| **Precision** | Strict fixed-point arithmetic (`Decimal(10,2)`, `ROUND_HALF_UP`, strings over JSON wire format) |
| **Architecture**| Fully decoupled HTTP JSON API with standardized response envelope (`Envelope[T]`) |

---

## 📦 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database engine, error envelopes, decimal helpers
│   │   ├── models/         # SQLAlchemy ORM models (Farmers, Collections, Dispatches, Stocks, etc.)
│   │   ├── schemas/        # Pydantic v2 validation models
│   │   ├── routers/        # Thin FastAPI HTTP routes (Collections, Stock, Dispatches, Quality, Farmers)
│   │   ├── services/       # Core business logic, pricing formula, stock recalculation engine
│   │   └── main.py         # FastAPI application entrypoint
│   ├── requirements.txt    # Python backend dependencies
│   └── .env.example        # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── components/     # Navigation, Sidebar, TopBar, DashboardView, FarmersManagementView
│   │   ├── views/          # Level 1 Operational Views (DailyMilkCollection, QualityAnalysis, etc.)
│   │   ├── lib/            # Axios API client with envelope unwrap interceptor
│   │   └── types/          # Strict TypeScript interface contracts
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── architecture.md     # Architectural constraints, precision rules, and contracts
│   └── business-rules.md   # Domain rules, formulas, constraints, and audit invariants
└── docker-compose.yml      # Local PostgreSQL service
```

---

## ⚡ Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL (or access to Supabase)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL

# Start backend server
uvicorn app.main:app --reload --port 8000
```
- API Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Interactive Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Frontend UI: [http://localhost:5173](http://localhost:5173)

---

## 🔒 Financial & Data Precision Principles

1. **No Floating Point Numbers**: All milk volumes, quality percentages, rates, and currency values are stored as fixed-point `DECIMAL` types.
2. **Deterministic Rounding**: Calculated values are quantized once using `ROUND_HALF_UP` (`TWO_PLACES = Decimal("0.01")`).
3. **Wire Format Strings**: Decimals travel as JSON strings (`"125.50"`) to prevent IEEE-754 precision loss in browser runtimes.
4. **Standardized Envelopes**:
   ```json
   {
     "success": true,
     "data": { ... },
     "error": null
   }
   ```

---

## 📄 License
This project is licensed under the MIT License.
