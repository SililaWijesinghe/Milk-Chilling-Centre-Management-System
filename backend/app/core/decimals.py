"""Shared Decimal precision utilities (see docs/architecture.md section 3.2)."""
from decimal import Decimal, ROUND_HALF_UP

TWO_PLACES = Decimal("0.01")
ONE_PLACE = Decimal("0.1")


def q2(value: Decimal | int | float | str) -> Decimal:
    """Quantize to 2 decimal places using ROUND_HALF_UP."""
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def q1(value: Decimal | int | float | str) -> Decimal:
    """Quantize to 1 decimal place using ROUND_HALF_UP."""
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return value.quantize(ONE_PLACE, rounding=ROUND_HALF_UP)


def str_decimal(value: Decimal | None, places: int = 2) -> str:
    """Safely format Decimal to fixed-point string representation for wire transfer."""
    if value is None:
        return "0.00" if places == 2 else "0.0"
    if places == 2:
        return f"{q2(value):.2f}"
    if places == 1:
        return f"{q1(value):.1f}"
    return str(value)
