"""Chilling Stock API Router (UI Mockup 6)."""
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.chilling_stock import (
    ChillingStockStatusResponse,
    StockRecalculateRequest,
    TemperatureLogRequest,
)
from app.schemas.common import Envelope, ok
from app.services.stock_service import (
    get_current_stock_status,
    log_chamber_temperature,
    recalculate_chilling_stock,
)

router = APIRouter(prefix="/chilling-stock", tags=["chilling-stock"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=Envelope[ChillingStockStatusResponse])
def get_stock_status(
    db: DbSession,
    as_of_date: date | None = Query(None, description="Target date for chilling stock log"),
):
    """Retrieve full chilling stock inventory status, tank capacity, and history."""
    status_data = get_current_stock_status(db, as_of_date=as_of_date)
    return ok(ChillingStockStatusResponse(**status_data))


@router.post("/temperature", response_model=Envelope[ChillingStockStatusResponse])
def record_chamber_temperature(data: TemperatureLogRequest, db: DbSession):
    """Record live chamber temperature reading."""
    log_chamber_temperature(db, temperature_c=data.temperature_c, target_date=data.log_date)
    status_data = get_current_stock_status(db, as_of_date=data.log_date)
    return ok(ChillingStockStatusResponse(**status_data))


@router.post("/recalculate", response_model=Envelope[ChillingStockStatusResponse])
def trigger_stock_recalculation(data: StockRecalculateRequest, db: DbSession):
    """Trigger manual or scheduled recalculation of chilling stock inventory."""
    target_d = data.target_date or date.today()
    recalculate_chilling_stock(db, target_date=target_d, auto_commit=True)
    status_data = get_current_stock_status(db, as_of_date=target_d)
    return ok(ChillingStockStatusResponse(**status_data))
