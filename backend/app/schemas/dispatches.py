"""Pydantic schemas for Bowser Dispatches and Reconciliation."""
import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class BowserDispatchCreate(BaseModel):
    dispatch_code: str | None = None
    dispatch_date: date | None = None
    bowser_number: str = Field(..., min_length=2, max_length=50)
    driver_name: str = Field(..., min_length=2, max_length=100)
    buyer_id: uuid.UUID | None = None
    buyer_name: str | None = None
    dispatched_litres: Decimal = Field(..., ge=Decimal("1.0"), max_digits=10, decimal_places=2)
    temperature_c: Decimal | None = Field(None, ge=Decimal("-5.0"), le=Decimal("40.0"), max_digits=5, decimal_places=2)
    fat_pct: Decimal | None = Field(None, ge=Decimal("0.0"), le=Decimal("15.0"), max_digits=5, decimal_places=2)
    snf_pct: Decimal | None = Field(None, ge=Decimal("0.0"), le=Decimal("15.0"), max_digits=5, decimal_places=2)


class BowserDispatchUpdate(BaseModel):
    accepted_litres: Decimal | None = Field(None, ge=Decimal("0.0"), max_digits=10, decimal_places=2)
    buyer_rate: Decimal | None = Field(None, ge=Decimal("0.0"), max_digits=10, decimal_places=2)
    status: str | None = Field(None, description="Dispatched, Pending, Reconciled")
    driver_name: str | None = None
    bowser_number: str | None = None
    temperature_c: Decimal | None = None
    fat_pct: Decimal | None = None
    snf_pct: Decimal | None = None


class BowserDispatchResponse(BaseModel):
    id: uuid.UUID
    dispatch_code: str
    dispatch_date: date
    bowser_number: str
    driver_name: str
    buyer_id: uuid.UUID | None = None
    buyer_name: str
    dispatched_litres: str
    accepted_litres: str | None = None
    variance_litres: str | None = None
    buyer_rate: str | None = None
    buyer_amount: str | None = None
    temperature_c: str | None = None
    fat_pct: str | None = None
    snf_pct: str | None = None
    status: str
    created_at: datetime


class BowserDispatchListResponse(BaseModel):
    items: list[BowserDispatchResponse]
    today_dispatched_litres: str
    active_bowsers_count: int
    pending_reconciliation_count: int
    page: int
    page_size: int
    total: int
