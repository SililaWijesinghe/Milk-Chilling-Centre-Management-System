"""Pydantic schemas for Quality Analysis and Trend Reports."""
from pydantic import BaseModel


class QualityStatusDistributionItem(BaseModel):
    status: str
    count: int
    percentage: str
    litres: str
    color: str


class SessionQualityStats(BaseModel):
    count: int
    litres: str
    avg_fat: str
    avg_snf: str
    avg_temp: str
    accepted_count: int
    rejection_count: int
    acceptance_rate: str


class SessionBreakdown(BaseModel):
    morning: SessionQualityStats
    evening: SessionQualityStats


class QualitySummaryResponse(BaseModel):
    total_tests: int
    acceptance_rate: str
    rejection_rate: str
    acidic_rate: str
    avg_fat: str
    avg_snf: str
    avg_temperature_c: str
    accepted_litres: str
    rejected_litres: str
    acidic_litres: str
    total_litres: str
    status_distribution: list[QualityStatusDistributionItem]
    session_breakdown: SessionBreakdown


class QualityTrendPoint(BaseModel):
    date: str
    iso_date: str
    avg_fat: str
    avg_snf: str
    avg_temp: str
    total_litres: str
    accepted_litres: str
    rejected_litres: str
    acidic_litres: str
    rejection_rate_pct: str


class QualityTrendsResponse(BaseModel):
    items: list[QualityTrendPoint]


class DailyQualityBreakdownItem(BaseModel):
    date: str
    session: str
    route_code: str
    samples: int
    total_litres: str
    avg_fat: str
    avg_snf: str
    avg_temp: str
    quality_grade: str


class DailyQualityBreakdownResponse(BaseModel):
    items: list[DailyQualityBreakdownItem]
    page: int
    page_size: int
    total: int
