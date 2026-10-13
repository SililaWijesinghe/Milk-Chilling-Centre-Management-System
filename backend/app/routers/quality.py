"""Quality Analysis and Quality Metrics API Router (UI Mockup 5)."""
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import Envelope, ok
from app.schemas.quality import (
    DailyQualityBreakdownResponse,
    QualitySummaryResponse,
    QualityTrendsResponse,
)
from app.services.quality_service import (
    get_daily_quality_breakdown,
    get_quality_summary,
    get_quality_trends,
)

router = APIRouter(prefix="/quality", tags=["quality"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("/summary", response_model=Envelope[QualitySummaryResponse])
def get_summary(
    db: DbSession,
    date_from: date | None = Query(None, description="Start date for aggregation"),
    date_to: date | None = Query(None, description="End date for aggregation"),
    route_id: str | None = Query(None, description="Filter by route ID"),
):
    """Aggregate quality rejection rates, Fat/SNF metrics, and session summaries."""
    data = get_quality_summary(db, date_from=date_from, date_to=date_to, route_id=route_id)
    return ok(QualitySummaryResponse(**data))


@router.get("/trends", response_model=Envelope[QualityTrendsResponse])
def get_trends(
    db: DbSession,
    days: int = Query(7, ge=3, le=90, description="Number of days for trend history"),
):
    """Return historical quality trend line data for Fat, SNF, and temperatures."""
    items = get_quality_trends(db, days=days)
    return ok(QualityTrendsResponse(items=items))


@router.get("/daily-breakdown", response_model=Envelope[DailyQualityBreakdownResponse])
def get_breakdown(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Return daily and session-wise quality table breakdown with compliance grade."""
    data = get_daily_quality_breakdown(db, page=page, page_size=page_size)
    return ok(DailyQualityBreakdownResponse(**data))
