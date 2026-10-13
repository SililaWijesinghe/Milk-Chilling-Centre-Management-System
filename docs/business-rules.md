# MCCMS Business Rules

Defines the domain flow and the integrity rules that all generated code must follow.
Numeric types follow `architecture.md` section 3 (fixed-point `Decimal` only).

## 1. Core Flow

```
Farmer Profile
   -> Twice-Daily Collection (Morning / Evening)
      -> Quality Testing (Fat %, SNF %, Temperature, Status)
         -> Dynamic Pricing (Quantity x Final Rate = Gross Value)
            -> Chilling Stock (Opening + Collection - Dispatch = Closing)
               -> Bowser Dispatch & Buyer Reconciliation
                  -> Monthly Payouts (Gross - Input Credit Deductions = Net Payable)
```

Each stage consumes the output of the previous one. Data moves forward only.
Corrections are made by explicit adjustment records, not by silently editing history.

## 2. Farmer Profile

| Field                | Notes                                         |
|----------------------|-----------------------------------------------|
| `farmer_code`        | Unique, human-readable ID used at the counter |
| `name`, `phone`      | Required                                      |
| `village`            | Optional                                      |
| `bank_account`       | Needed for payouts                            |
| `is_active`          | Inactive farmers cannot have new collections  |

- `farmer_code` is unique.
- Farmers are never hard-deleted once they have collections. Deactivate them instead.

## 3. Twice-Daily Collection

- Milk is collected in two **sessions** per day: `MORNING` and `EVENING`.
- A collection record is one farmer's delivery in one session:
  `(farmer_id, collection_date, session)`.
- `quantity_litres` is `DECIMAL(10,2)` and must be `> 0`.
- A farmer has **at most one collection per date per session**. Extra milk in the
  same session is added by updating that record, not by inserting a second one.
- Collections are entered only for active farmers.

## 4. Quality Testing

Every collection is tested before it is accepted.

| Field           | Type           | Rule                                  |
|-----------------|----------------|---------------------------------------|
| `fat_percent`   | `DECIMAL(5,2)` | 0 to 15                               |
| `snf_percent`   | `DECIMAL(5,2)` | 0 to 15                               |
| `temperature_c` | `DECIMAL(5,2)` | Recorded at reception                 |
| `status`        | enum           | `ACCEPTED`, `REJECTED`, `ACIDIC`      |

Status handling:

- `ACCEPTED`: Counts toward chilling stock and is priced and paid.
- `REJECTED`: Not added to stock. Gross value is `0.00`. Not paid.
- `ACIDIC`: Not added to stock. Gross value is `0.00`. Not paid. Recorded separately
  from `REJECTED` for reporting on spoilage causes.
- Fat and SNF are required when status is `ACCEPTED`.
- Testing a collection again replaces the result only until the day is closed (section 5).
  After that, changes need an adjustment record.

## 5. Dynamic Pricing

```
Gross Value = Quantity x Final Rate
```

- `Final Rate` (per litre, `DECIMAL(10,2)`) comes from the active **rate chart** based on
  the collection's `fat_percent` and `snf_percent`, plus any configured bonus or penalty.
- The rate used is **snapshotted onto the collection** (`final_rate`, `gross_value`) at
  pricing time. Later rate-chart changes never alter past collections.
- `gross_value = q2(quantity_litres * final_rate)`. It is `DECIMAL(12,2)` and rounded
  once, with `ROUND_HALF_UP`.
- Only `ACCEPTED` collections have a non-zero gross value.
- Pricing logic lives in one service function. No other code computes rates.

## 6. Chilling Stock

Tracked per day for the centre:

```
Closing = Opening + Collection - Dispatch
```

- `Opening` of day D equals `Closing` of day D-1. The first day starts from a set value.
- `Collection` is the sum of `quantity_litres` of that day's `ACCEPTED` collections.
- `Dispatch` is the sum of litres loaded on that day's bowsers.
- All values are `DECIMAL(10,2)`.
- `Closing` must never be negative. A dispatch that would make it negative is rejected
  with `BUSINESS_RULE_VIOLATION`.
- A stock record is unique per date (section 9).
- Closing a day locks that day's collections and dispatches against edits.

## 7. Bowser Dispatch and Buyer Reconciliation

- A **dispatch** loads milk from chilling stock onto a bowser (tanker) for a buyer:
  bowser number, buyer, `quantity_litres`, dispatch time, and fat/SNF of the load.
- Each dispatch reduces chilling stock (section 6).
- **Reconciliation** compares what we dispatched with what the buyer received and
  accepted:

```
Variance = Dispatched Quantity - Buyer Received Quantity
```

| Field                     | Type            |
|---------------------------|-----------------|
| `dispatched_litres`       | `DECIMAL(10,2)` |
| `received_litres`         | `DECIMAL(10,2)` |
| `variance_litres`         | `DECIMAL(10,2)` |
| `buyer_rate`              | `DECIMAL(10,2)` |
| `buyer_amount`            | `DECIMAL(12,2)` |

- `buyer_amount = q2(received_litres * buyer_rate)`.
- A dispatch is `PENDING` until the buyer's figures are recorded, then `RECONCILED`.
- Variance is stored, not hidden. Variances beyond a configured tolerance are flagged
  for review.

## 8. Monthly Payouts

```
Net Payable = Gross - Input Credit Deductions
```

- A **payment statement** is generated once per farmer per calendar month.
- `gross_amount` = sum of `gross_value` of that farmer's `ACCEPTED` collections in the month.
- **Input credits** are goods or advances given to the farmer on credit (cattle feed,
  medicines, cash advances). Each has an amount and a date.
- `deduction_amount` = sum of the farmer's input credits being recovered in this statement.
- `net_payable = gross_amount - deduction_amount`. All amounts are `DECIMAL(12,2)`.
- If deductions exceed gross, `net_payable` is `0.00` and the unrecovered balance carries
  forward as an outstanding credit. Net payable is never negative.
- Statements move `DRAFT -> FINALISED -> PAID`. A finalised statement is immutable.
  Corrections are made by an adjustment in the next month.
- Generating the same statement twice must not create a duplicate (section 9).

## 9. Data Integrity Rules

These must exist as **database constraints**, in addition to service-level checks.

### 9.1 Unique constraints

| Table                | Constraint                                              | Purpose                                          |
|----------------------|---------------------------------------------------------|--------------------------------------------------|
| `farmers`            | `UNIQUE (farmer_code)`                                  | One counter ID per farmer                        |
| `collections`        | `UNIQUE (farmer_id, collection_date, session)`          | One delivery per farmer per daily session        |
| `chilling_stock`     | `UNIQUE (stock_date)`                                   | One stock record per day                         |
| `payment_statements` | `UNIQUE (farmer_id, statement_year, statement_month)`   | One statement per farmer per month               |

A violation returns `409 CONFLICT` with the code `CONFLICT`. Services should catch
`IntegrityError` and translate it. They must not pre-check and then insert, because that
races under concurrency.

### 9.2 Check constraints

```sql
CHECK (session IN ('MORNING', 'EVENING'))
CHECK (status IN ('ACCEPTED', 'REJECTED', 'ACIDIC'))
CHECK (quantity_litres > 0)
CHECK (fat_percent BETWEEN 0 AND 15 AND snf_percent BETWEEN 0 AND 15)
CHECK (closing_stock >= 0)
CHECK (net_payable >= 0)
CHECK (statement_month BETWEEN 1 AND 12)
```

- All quantity and amount columns also carry `CHECK (value >= 0)`.
- Computed columns that are stored (`gross_value`, `closing_stock`, `net_payable`)
  must be written by services only, and verified by tests against the formulas above.

### 9.3 Referential integrity

- Foreign keys are `ON DELETE RESTRICT` for farmers, collections, and statements.
  Financial and stock history is never cascade-deleted.
- Use soft deactivation (`is_active`) rather than deletion.

## 10. Formula Reference

| Name           | Formula                                    | Type            |
|----------------|--------------------------------------------|-----------------|
| Gross Value    | `Quantity x Final Rate`                    | `DECIMAL(12,2)` |
| Closing Stock  | `Opening + Collection - Dispatch`          | `DECIMAL(10,2)` |
| Variance       | `Dispatched - Received`                    | `DECIMAL(10,2)` |
| Buyer Amount   | `Received x Buyer Rate`                    | `DECIMAL(12,2)` |
| Net Payable    | `Gross - Input Credit Deductions` (min 0)  | `DECIMAL(12,2)` |
