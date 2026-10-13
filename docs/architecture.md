# MCCMS Architecture

Milk Chilling Centre Management System. This document is the source of truth for
all generated code. Where code and this document disagree, fix the code.

## 1. System Overview

| Layer     | Stack                                                                  | Location    |
|-----------|------------------------------------------------------------------------|-------------|
| Frontend  | React 19, Vite, TypeScript, Tailwind CSS 4, Axios, Recharts, Lucide    | `/frontend` |
| Backend   | FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, psycopg2                    | `/backend`  |
| Database  | PostgreSQL (Supabase-hosted; local Postgres 16 via `docker-compose`)   | -           |
| Auth      | Supabase Auth. The backend verifies JWTs against `SUPABASE_JWKS_URL`   | -           |

The frontend and backend are **fully decoupled**. They communicate only through the
HTTP JSON API described below. The frontend never talks to the database directly and
never holds `SUPABASE_SECRET_KEY`.

### Backend layout (`/backend/app`)

```
config.py     settings (pydantic-settings, reads .env)
database.py   engine, SessionLocal, Base, get_db dependency
auth.py       Supabase JWT verification dependency
main.py       app factory, routers, exception handlers
models/       SQLAlchemy models        (one module per aggregate)
schemas/      Pydantic request/response models
routers/      thin HTTP layer          (no business logic)
services/     business logic, calculations, transactions
```

Rules:
- Routers validate input, call a service, and wrap the result in the response envelope.
- Services own all calculations and database transactions.
- Models and schemas are separate. Never return an ORM object directly.

## 2. API Contract

### 2.1 Conventions

- Base path: `/api/v1`. The existing `/health` endpoint stays unversioned.
- JSON only. Field names are `snake_case`. The frontend types mirror them exactly.
- Dates are ISO 8601 (`YYYY-MM-DD`). Timestamps are UTC ISO 8601 with `Z`.
- Auth: `Authorization: Bearer <supabase_access_token>` on every route except `/health`.
- IDs are UUIDs (strings).
- Plural nouns for collections: `/farmers`, `/collections`, `/payouts`.
- Standard verbs: `GET` read, `POST` create, `PATCH` partial update, `DELETE` remove.
- Pagination: `?page=1&page_size=50`. `page_size` is capped at 200.

### 2.2 Response Envelope (mandatory)

**Every** response, success or failure, uses this shape:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

```json
{
  "success": false,
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "fat_percent must be between 0 and 15" }
}
```

| Field     | Type                                      | Rules                                              |
|-----------|-------------------------------------------|----------------------------------------------------|
| `success` | boolean                                   | `true` only for 2xx                                |
| `data`    | object, array or `null`                   | `null` when `success` is `false`                   |
| `error`   | `{ code: string, message: string }`, or `null` | `null` when `success` is `true`               |

Paginated lists put the array and the paging info inside `data`:

```json
{
  "success": true,
  "data": { "items": [], "page": 1, "page_size": 50, "total": 0 },
  "error": null
}
```

Backend implementation:

```python
class ErrorBody(BaseModel):
    code: str
    message: str

class Envelope(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    error: ErrorBody | None = None
```

- Use `Envelope[T]` as the `response_model` of every route.
- Register global exception handlers for `HTTPException`, `RequestValidationError`,
  and bare `Exception`, so no response ever leaves the app without the envelope.
- Never leak stack traces or SQL in `message`.

Frontend implementation:
- One Axios instance in `src/lib/api.ts`. A response interceptor unwraps the envelope.
  If `success` is `false`, it throws an `ApiError(code, message)`.
- Components never read `response.data.data` directly. They call typed API functions.

### 2.3 Error Codes

| HTTP | `code`               | Meaning                                              |
|------|----------------------|------------------------------------------------------|
| 400  | `BAD_REQUEST`        | Malformed request                                    |
| 401  | `UNAUTHENTICATED`    | Missing or invalid JWT                               |
| 403  | `FORBIDDEN`          | Authenticated but not allowed                        |
| 404  | `NOT_FOUND`          | Resource does not exist                              |
| 409  | `CONFLICT`           | Unique constraint hit (duplicate session or statement) |
| 422  | `VALIDATION_ERROR`   | Pydantic validation failed                           |
| 422  | `BUSINESS_RULE_VIOLATION` | Rule from `business-rules.md` broken (for example, negative closing stock) |
| 500  | `INTERNAL_ERROR`     | Unhandled error                                      |

Codes are `UPPER_SNAKE_CASE` and stable. The frontend branches on `code`, never on `message`.

## 3. Numeric Precision: Fixed-Point Only

> **Floats are forbidden for milk quantities, rates, fat/SNF, and money.**
> Floating-point drift (`0.1 + 0.2 != 0.3`) corrupts payouts and stock reconciliation.

### 3.1 PostgreSQL

| Kind                                   | Column type      | Examples                                        |
|----------------------------------------|------------------|-------------------------------------------------|
| Milk quantity (litres / kg)            | `DECIMAL(10,2)`  | `quantity_litres`, `opening_stock`, `dispatched`|
| Quality percentages and temperature    | `DECIMAL(5,2)`   | `fat_percent`, `snf_percent`, `temperature_c`   |
| Rates per litre                        | `DECIMAL(10,2)`  | `base_rate`, `final_rate`                       |
| Monetary amounts                       | `DECIMAL(12,2)`  | `gross_value`, `deduction_amount`, `net_payable`|

- Never use `REAL`, `DOUBLE PRECISION`, `FLOAT`, or `MONEY`.
- Currency is a single configured currency. Amounts are stored in major units with 2 decimals.

### 3.2 Python (backend)

- Use `decimal.Decimal` everywhere. SQLAlchemy columns use `Numeric(precision, scale)`
  with `asdecimal=True` (the default).
- Never call `float()` on a quantity or money value. Never use float literals
  (`Decimal("0.10")`, not `Decimal(0.10)`).
- Quantise results explicitly with a single shared helper:

```python
from decimal import Decimal, ROUND_HALF_UP

TWO_PLACES = Decimal("0.01")

def q2(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
```

- Rounding is `ROUND_HALF_UP`, applied **once** per calculated value
  (for example, `gross_value = q2(quantity * final_rate)`). Do not round intermediates.
- Sums of stored, already-rounded values are exact. Never recompute a total from floats.
- Set the decimal context once at startup (`getcontext().prec = 28`).

### 3.3 Pydantic and the wire format

- Declare fields as `Decimal` with constraints, for example
  `Annotated[Decimal, Field(max_digits=10, decimal_places=2, ge=0)]`.
- **Decimals travel as JSON strings** (`"125.50"`), never JSON numbers. This stops
  JavaScript from parsing them into binary floats. Configure Pydantic to serialise
  `Decimal` as a string, and keep the value at 2 decimal places.
- Incoming decimals are accepted as strings. A JSON number is rejected with
  `VALIDATION_ERROR`.

### 3.4 Frontend

- Treat decimal fields as `string` in TypeScript types (`type Decimal = string`).
- Do not do arithmetic on them with the `number` type. Calculations belong to the backend.
  The frontend only displays server-computed values, or uses a decimal library
  (for example `decimal.js`) if live previews are needed.
- Format for display with `Intl.NumberFormat` on the string value only at render time.

## 4. Data Integrity at the Database Level

- Business invariants are enforced by **database constraints**, not only application code.
  The full list is in `business-rules.md` section 6.
- Wrap every multi-row write (collection plus stock update, payout generation) in one
  transaction. Roll back on any failure.
- Schema changes go through migrations (Alembic). No ad-hoc DDL.
- `NOT NULL` by default. Add `CHECK (... >= 0)` on every quantity and amount column.
- Every table has `id UUID PK`, `created_at`, `updated_at`.

## 5. Security

- Secrets live in `.env` files only. They are never committed (see `.gitignore`).
- `SUPABASE_SECRET_KEY` is backend-only. Frontend variables are `VITE_*` and are public.
- Backend enforces authorisation on every route. Hiding a button is not security.
- CORS is limited to `CORS_ORIGINS`.

## 6. Checklist for Generated Code

- [ ] Route returns `Envelope[T]`.
- [ ] No `float` for quantities, rates, or money (Python, SQL, TypeScript).
- [ ] Decimals serialised as strings.
- [ ] Logic in `services/`, not in routers or components.
- [ ] Constraints from `business-rules.md` exist in the migration.
- [ ] Errors use a code from section 2.3.
