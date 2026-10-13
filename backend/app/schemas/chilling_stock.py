"""Pydantic schemas for Chilling Stock and Chamber Temperature Logging."""
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field


class TemperatureLogRequest(BaseModel):
    temperature_c: Decimal = Field(..., ge=Decimal("-10.0"), le=Decimal("40.0"), max_digits=5, decimal_places=2)
    log_date: date | None = None


class StockRecalculateRequest(BaseModel):
    target_date: date | None = None


class ChillingStockLogItem(BaseModel):
    id: str
    log_date: str
    opening_stock_litres: str
    collected_litres: str
    dispatched_litres: str
    closing_stock_litres: str
    avg_fat: str
    avg_snf: str
    temperature_c: str
    variance: str = "0.00"


class ChillingStockStatusResponse(BaseModel):
    target_date: str
    tank_capacity_litres: str
    current_stock_litres: str
    opening_stock_litres: str
    collected_litres: str
    dispatched_litres: str
    closing_stock_litres: str
    avg_fat: str
    avg_snf: str
    temperature_c: str
    temperature_status: str
    temperature_note: str
    utilization_pct: str
    recent_logs: list[ChillingStockLogItem]
