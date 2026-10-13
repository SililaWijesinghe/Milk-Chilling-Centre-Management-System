"""Pydantic schemas for Daily Milk Collections."""
import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class CollectionCreate(BaseModel):
    collection_date: date | None = None
    session: str = Field(..., description="Morning or Evening")
    route_id: uuid.UUID | None = None
    farmer_id: uuid.UUID
    quantity_litres: Decimal = Field(..., ge=Decimal("0.1"), max_digits=10, decimal_places=2)
    fat_pct: Decimal = Field(..., ge=Decimal("0.0"), le=Decimal("15.0"), max_digits=5, decimal_places=2)
    snf_pct: Decimal = Field(..., ge=Decimal("0.0"), le=Decimal("15.0"), max_digits=5, decimal_places=2)
    temperature_c: Decimal = Field(..., ge=Decimal("-5.0"), le=Decimal("50.0"), max_digits=5, decimal_places=2)
    status: str = Field("Accepted", description="Accepted, Rejected, Acidic")

    @field_validator("session")
    @classmethod
    def validate_session(cls, v: str) -> str:
        s = v.strip().capitalize()
        if s not in ("Morning", "Evening"):
            raise ValueError("session must be 'Morning' or 'Evening'")
        return s

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        s = v.strip().capitalize()
        if s not in ("Accepted", "Rejected", "Acidic"):
            raise ValueError("status must be 'Accepted', 'Rejected', or 'Acidic'")
        return s


class CollectionResponse(BaseModel):
    id: uuid.UUID
    collection_date: date
    session: str
    farmer_id: uuid.UUID
    farmer_code: str
    farmer_name: str
    route_id: uuid.UUID | None = None
    route_code: str | None = None
    route_name: str | None = None
    quantity_litres: str
    fat_pct: str
    snf_pct: str
    temperature_c: str
    status: str
    final_rate: str
    total_amount: str
    created_at: datetime


class CollectionSessionTotals(BaseModel):
    total_farmers: int
    accepted_litres: str
    rejected_litres: str
    acidic_litres: str
    total_litres: str
    total_amount: str
    avg_fat: str
    avg_snf: str
    avg_temp: str


class CollectionListResponse(BaseModel):
    items: list[CollectionResponse]
    totals: CollectionSessionTotals
    page: int
    page_size: int
    total: int
