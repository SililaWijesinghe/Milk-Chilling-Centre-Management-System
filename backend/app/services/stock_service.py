"""Chilling Stock Service and Recalculation Engine (see docs/business-rules.md section 6)."""
import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.decimals import q1, q2
from app.core.errors import AppError
from app.models import BowserDispatch, ChillingStockLog, MilkCollection

DEFAULT_OPENING_STOCK = Decimal("5000.00")
TANK_CAPACITY_LITRES = Decimal("15000.00")


def recalculate_chilling_stock(
    db: Session,
    target_date: date,
    auto_commit: bool = False,
) -> ChillingStockLog:
    """Enforces the formula: Closing = Opening + Collection - Dispatch.
    
    - Opening of day D equals Closing of day D-1.
    - Collection is the sum of quantity_litres of that day's ACCEPTED collections.
    - Dispatch is the sum of litres loaded on that day's bowsers.
    - Closing must never be negative.
    """
    # 1. Determine Opening Stock from previous day's closing stock
    prev_log = db.execute(
        select(ChillingStockLog)
        .where(ChillingStockLog.log_date < target_date)
        .order_by(ChillingStockLog.log_date.desc())
    ).scalars().first()

    opening_stock = prev_log.closing_stock_litres if prev_log else DEFAULT_OPENING_STOCK

    # 2. Sum today's ACCEPTED milk collections
    from sqlalchemy import cast, String

    collected_litres = db.execute(
        select(func.coalesce(func.sum(MilkCollection.quantity_litres), Decimal("0.00")))
        .where(MilkCollection.collection_date == target_date)
        .where(cast(MilkCollection.status, String).ilike("accepted"))
    ).scalar() or Decimal("0.00")

    # 3. Sum today's Bowser Dispatches
    dispatched_litres = db.execute(
        select(func.coalesce(func.sum(BowserDispatch.dispatched_litres), Decimal("0.00")))
        .where(BowserDispatch.dispatch_date == target_date)
    ).scalar() or Decimal("0.00")

    # 4. Calculate Closing Stock
    closing_stock = q2(opening_stock + collected_litres - dispatched_litres)

    if closing_stock < Decimal("0.00"):
        available = opening_stock + collected_litres
        raise AppError(
            422,
            "BUSINESS_RULE_VIOLATION",
            f"Closing stock cannot be negative. Current available is {available:.2f} L, but total dispatch requested is {dispatched_litres:.2f} L.",
        )

    # 5. Average Fat and SNF for the day's accepted milk
    avg_quality = db.execute(
        select(
            func.avg(MilkCollection.fat_pct),
            func.avg(MilkCollection.snf_pct),
            func.avg(MilkCollection.temperature_c),
        )
        .where(MilkCollection.collection_date == target_date)
        .where(cast(MilkCollection.status, String).ilike("accepted"))
    ).first()

    avg_fat = q2(avg_quality[0]) if avg_quality and avg_quality[0] is not None else (prev_log.avg_fat if prev_log else Decimal("3.72"))
    avg_snf = q2(avg_quality[1]) if avg_quality and avg_quality[1] is not None else (prev_log.avg_snf if prev_log else Decimal("8.34"))
    default_temp = q1(avg_quality[2]) if avg_quality and avg_quality[2] is not None else Decimal("4.2")

    # 6. Find or create the stock log for target_date
    stock_log = db.execute(
        select(ChillingStockLog).where(ChillingStockLog.log_date == target_date)
    ).scalar_one_or_none()

    if not stock_log:
        stock_log = ChillingStockLog(
            id=uuid.uuid4(),
            log_date=target_date,
            opening_stock_litres=opening_stock,
            collected_litres=collected_litres,
            dispatched_litres=dispatched_litres,
            closing_stock_litres=closing_stock,
            avg_fat=avg_fat,
            avg_snf=avg_snf,
            temperature_c=default_temp,
        )
        db.add(stock_log)
    else:
        stock_log.opening_stock_litres = opening_stock
        stock_log.collected_litres = collected_litres
        stock_log.dispatched_litres = dispatched_litres
        stock_log.closing_stock_litres = closing_stock
        stock_log.avg_fat = avg_fat
        stock_log.avg_snf = avg_snf
        stock_log.updated_at = datetime.utcnow()

    if auto_commit:
        db.commit()
        db.refresh(stock_log)

    return stock_log


def log_chamber_temperature(
    db: Session,
    temperature_c: Decimal,
    target_date: date | None = None,
) -> ChillingStockLog:
    """Record live chamber temperature for a date."""
    log_date = target_date or date.today()
    stock_log = db.execute(
        select(ChillingStockLog).where(ChillingStockLog.log_date == log_date)
    ).scalar_one_or_none()

    if not stock_log:
        stock_log = recalculate_chilling_stock(db, log_date, auto_commit=False)

    stock_log.temperature_c = q1(temperature_c)
    stock_log.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(stock_log)
    return stock_log


def get_current_stock_status(db: Session, as_of_date: date | None = None) -> dict:
    """Retrieve full chilling stock inventory status, KPIs and recent history."""
    target_date = as_of_date or date.today()

    # Recalculate today's log to guarantee consistency
    stock_log = recalculate_chilling_stock(db, target_date, auto_commit=True)

    # Calculate tank utilization percentage
    utilization_pct = q1((stock_log.closing_stock_litres / TANK_CAPACITY_LITRES) * Decimal("100.0"))

    # Temperature threshold status: Optimal is 2.0C - 4.0C, Safe is <= 4.5C
    temp_val = float(stock_log.temperature_c or Decimal("4.2"))
    if temp_val <= 4.0:
        temp_status = "Optimal"
        temp_note = "Within ideal chilling range (2.0°C - 4.0°C)"
    elif temp_val <= 4.8:
        temp_note = "Slightly elevated; monitor cooling compressor"
        temp_status = "Acceptable"
    else:
        temp_status = "Warning"
        temp_note = "High temperature alert; check refrigeration unit immediately!"

    # Fetch recent 14 days stock history
    recent_logs = db.execute(
        select(ChillingStockLog)
        .order_by(ChillingStockLog.log_date.desc())
        .limit(14)
    ).scalars().all()

    return {
        "target_date": target_date.isoformat(),
        "tank_capacity_litres": f"{TANK_CAPACITY_LITRES:.2f}",
        "current_stock_litres": f"{stock_log.closing_stock_litres:.2f}",
        "opening_stock_litres": f"{stock_log.opening_stock_litres:.2f}",
        "collected_litres": f"{stock_log.collected_litres:.2f}",
        "dispatched_litres": f"{stock_log.dispatched_litres:.2f}",
        "closing_stock_litres": f"{stock_log.closing_stock_litres:.2f}",
        "avg_fat": f"{stock_log.avg_fat:.2f}" if stock_log.avg_fat else "3.72",
        "avg_snf": f"{stock_log.avg_snf:.2f}" if stock_log.avg_snf else "8.34",
        "temperature_c": f"{stock_log.temperature_c:.1f}" if stock_log.temperature_c else "4.2",
        "temperature_status": temp_status,
        "temperature_note": temp_note,
        "utilization_pct": f"{utilization_pct:.1f}",
        "recent_logs": [
            {
                "id": str(log.id),
                "log_date": log.log_date.isoformat(),
                "opening_stock_litres": f"{log.opening_stock_litres:.2f}",
                "collected_litres": f"{log.collected_litres:.2f}",
                "dispatched_litres": f"{log.dispatched_litres:.2f}",
                "closing_stock_litres": f"{log.closing_stock_litres:.2f}",
                "avg_fat": f"{log.avg_fat:.2f}" if log.avg_fat else "3.70",
                "avg_snf": f"{log.avg_snf:.2f}" if log.avg_snf else "8.30",
                "temperature_c": f"{log.temperature_c:.1f}" if log.temperature_c else "4.2",
                "variance": "0.00",
            }
            for log in recent_logs
        ],
    }
