import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


# --- Farmer Schemas ---
class FarmerBase(BaseModel):
    farmer_code: str = Field(..., max_length=20, description="Unique code, e.g. FAR-001")
    full_name: str = Field(..., max_length=150)
    route_id: uuid.UUID | None = None
    phone: str = Field(..., max_length=20)
    nic: str = Field(..., max_length=20)
    address: str | None = None
    bank_name: str = Field(..., max_length=100)
    bank_branch: str = Field(..., max_length=100)
    account_number: str = Field(..., max_length=50)
    account_name: str = Field(..., max_length=150)
    status: str = Field("Active", max_length=9)


class FarmerCreate(FarmerBase):
    pass


class FarmerUpdate(BaseModel):
    full_name: str | None = None
    route_id: uuid.UUID | None = None
    phone: str | None = None
    nic: str | None = None
    address: str | None = None
    bank_name: str | None = None
    bank_branch: str | None = None
    account_number: str | None = None
    account_name: str | None = None
    status: str | None = None


class RouteSimple(BaseModel):
    id: uuid.UUID
    route_code: str
    route_name: str


class FarmerPerformance(BaseModel):
    total_milk_litres: str = "0.00"
    avg_fat: str = "0.00"
    avg_snf: str = "0.00"
    gross_earnings: str = "0.00"


class FarmerResponse(FarmerBase):
    id: uuid.UUID
    registered_at: date | None = None
    created_at: datetime | None = None
    route: RouteSimple | None = None
    performance: FarmerPerformance | None = None


class FarmerListResponse(BaseModel):
    items: list[FarmerResponse]
    page: int
    page_size: int
    total: int


# --- Dashboard Schemas ---
class DashboardMetrics(BaseModel):
    active_farmers: int = 248
    active_farmers_change: str = "+3 this month"
    todays_collection_litres: str = "8450.00"
    todays_collection_change: str = "+12% vs. yesterday"
    current_stock_litres: str = "5820.00"
    current_stock_change: str = "-6% after dispatch"
    todays_dispatch_litres: str = "2680.00"
    todays_dispatch_note: str = "1 bowser"
    avg_fat: str = "3.72"
    avg_fat_change: str = "+0.08%"
    avg_snf: str = "8.34"
    avg_snf_change: str = "+0.12%"
    pending_farmer_payments: str = "7993000.00"
    pending_farmer_payments_note: str = "for Sep 2026"
    pending_input_recovery: str = "425000.00"
    pending_input_recovery_note: str = "from 86 farmers"
    chilling_temperature_c: str = "4.2"
    chilling_stock_fat: str = "3.64"
    chilling_stock_snf: str = "8.31"


class DailyCollectionPoint(BaseModel):
    date: str
    morning_litres: str
    evening_litres: str
    total_litres: str


class QualityTrendPoint(BaseModel):
    date: str
    fat_pct: str
    snf_pct: str


class DashboardCharts(BaseModel):
    collection_overview: list[DailyCollectionPoint]
    quality_trend: list[QualityTrendPoint]


class RouteCollectionSummary(BaseModel):
    route_code: str
    route_name: str
    farmers_count: int
    morning_litres: str
    evening_litres: str
    total_litres: str
    avg_fat: str
    avg_snf: str


class TodaysCollectionSummaryResponse(BaseModel):
    date: str
    items: list[RouteCollectionSummary]
    total_farmers: int
    total_morning_litres: str
    total_evening_litres: str
    total_litres: str
    overall_avg_fat: str
    overall_avg_snf: str


class ActivityItem(BaseModel):
    id: str
    title: str
    timestamp: str
    type: str  # collection, dispatch, sale, payment, registration
