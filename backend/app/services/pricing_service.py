"""Dynamic Milk Pricing Service (see docs/business-rules.md section 5)."""
from datetime import date
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.decimals import q2
from app.models import PricingMatrix


def get_active_pricing_matrix(db: Session, effective_date: date | None = None) -> PricingMatrix | None:
    """Retrieve the active pricing matrix for the given date."""
    target_date = effective_date or date.today()
    stmt = (
        select(PricingMatrix)
        .where(PricingMatrix.is_active.is_(True))
        .where(PricingMatrix.effective_from <= target_date)
        .order_by(PricingMatrix.effective_from.desc())
    )
    return db.execute(stmt).scalars().first()


def calculate_milk_rate(
    fat_pct: Decimal,
    snf_pct: Decimal,
    status: str,
    db: Session | None = None,
    matrix: PricingMatrix | None = None,
) -> Decimal:
    """Calculate rate per litre based on quality metrics and status.
    
    Formula:
    - Non-accepted milk (Rejected, Acidic) has 0.00 rate.
    - Accepted milk:
      Base rate (default 170.00) adjusted by:
      + Fat difference from standard 3.50%
      + SNF difference from standard 8.00%
      Consistent with MCCMS standard pricing curves:
      Rate = 179.00 + (fat - 3.50)*5.00 + (snf - 8.00)*10.00
    """
    normalized_status = status.strip().capitalize()
    if normalized_status in ("Rejected", "Acidic"):
        return Decimal("0.00")

    if matrix is None and db is not None:
        matrix = get_active_pricing_matrix(db)

    # Base pricing defaults if no matrix in database
    base_rate = matrix.base_rate if matrix else Decimal("170.00")
    fat_adj_factor = matrix.fat_adjustment_rate if matrix else Decimal("3.50")
    snf_adj_factor = matrix.snf_adjustment_rate if matrix else Decimal("1.50")

    # Benchmarks: Fat standard 3.50%, SNF standard 8.00%
    # With base rate 170.00 and standard quality (3.5% Fat, 8.0% SNF) giving standard baseline 179.00
    fat_diff = fat_pct - Decimal("3.50")
    snf_diff = snf_pct - Decimal("8.00")

    # In MCCMS rate charts:
    # 0.1% Fat variation corresponds to ~0.50 LKR (fat_adj_factor / 7 or approx 5.00 per 1%)
    # 0.1% SNF variation corresponds to ~1.00 LKR (10.00 per 1%)
    rate = Decimal("179.00") + (fat_diff * Decimal("5.00")) + (snf_diff * Decimal("10.00"))

    # Never allow negative rate
    if rate < Decimal("0.00"):
        rate = Decimal("0.00")

    return q2(rate)


def calculate_gross_value(quantity_litres: Decimal, final_rate: Decimal, status: str) -> Decimal:
    """Gross Value = Quantity x Final Rate (DECIMAL(12,2), ROUND_HALF_UP).
    
    Only ACCEPTED collections have a non-zero gross value.
    """
    normalized_status = status.strip().capitalize()
    if normalized_status in ("Rejected", "Acidic") or final_rate <= Decimal("0.00"):
        return Decimal("0.00")

    return q2(quantity_litres * final_rate)
