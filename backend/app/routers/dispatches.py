"""Bowser Dispatch and Buyer Reconciliation API Router (UI Mockup 7)."""
import uuid
from datetime import date
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.decimals import q1, q2
from app.core.errors import AppError
from app.models import BowserDispatch, Buyer, ChillingStockLog
from app.schemas.common import Envelope, ok
from app.schemas.dispatches import (
    BowserDispatchCreate,
    BowserDispatchListResponse,
    BowserDispatchResponse,
    BowserDispatchUpdate,
)
from app.services.stock_service import recalculate_chilling_stock

router = APIRouter(prefix="/dispatches", tags=["dispatches"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=Envelope[BowserDispatchListResponse])
def list_dispatches(
    db: DbSession,
    dispatch_date: date | None = Query(None, description="Filter by dispatch date"),
    status: str | None = Query(None, description="Filter by status (Dispatched, Pending, Reconciled)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """List bowser dispatches with KPIs and reconciliation status."""
    query = select(BowserDispatch)

    if dispatch_date:
        query = query.where(BowserDispatch.dispatch_date == dispatch_date)
    if status and status != "All":
        from sqlalchemy import cast, String
        query = query.where(cast(BowserDispatch.status, String).ilike(status))

    count_stmt = select(func.count()).select_from(query.subquery())
    total = db.execute(count_stmt).scalar() or 0

    stmt = query.order_by(BowserDispatch.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    dispatches = db.execute(stmt).scalars().all()

    # Aggregate KPIs for today
    today = date.today()
    all_today = db.execute(select(BowserDispatch).where(BowserDispatch.dispatch_date == today)).scalars().all()
    today_vol = sum((d.dispatched_litres for d in all_today), Decimal("0.00"))
    active_bowsers = len(set(d.bowser_number for d in all_today))

    all_dispatches = db.execute(select(BowserDispatch)).scalars().all()
    pending_reconciliation = len([d for d in all_dispatches if d.status.strip().capitalize() in ("Dispatched", "Pending")])

    items = []
    for d in dispatches:
        buyer_name = d.buyer.buyer_name if d.buyer else "Milco Dairy Ltd"

        variance_str = None
        if d.accepted_litres is not None:
            variance = d.dispatched_litres - d.accepted_litres
            variance_str = f"{variance:.2f}"

        items.append(
            BowserDispatchResponse(
                id=d.id,
                dispatch_code=d.dispatch_code,
                dispatch_date=d.dispatch_date,
                bowser_number=d.bowser_number,
                driver_name=d.driver_name,
                buyer_id=d.buyer_id,
                buyer_name=buyer_name,
                dispatched_litres=f"{d.dispatched_litres:.2f}",
                accepted_litres=f"{d.accepted_litres:.2f}" if d.accepted_litres is not None else None,
                variance_litres=variance_str,
                temperature_c=f"{d.temperature_c:.1f}" if d.temperature_c is not None else "4.2",
                fat_pct=f"{d.fat_pct:.2f}" if d.fat_pct is not None else "3.64",
                snf_pct=f"{d.snf_pct:.2f}" if d.snf_pct is not None else "8.31",
                status=d.status,
                created_at=d.created_at,
            )
        )

    return ok(
        BowserDispatchListResponse(
            items=items,
            today_dispatched_litres=f"{today_vol:.2f}",
            active_bowsers_count=active_bowsers,
            pending_reconciliation_count=pending_reconciliation,
            page=page,
            page_size=page_size,
            total=total,
        )
    )


@router.post("", response_model=Envelope[BowserDispatchResponse])
def create_dispatch(data: BowserDispatchCreate, db: DbSession):
    """Create a new bowser dispatch and update chilling stock.
    
    Enforces business rules:
    - Dispatched litres must not exceed available chilling stock.
    - Automatically updates ChillingStockLog.
    """
    dispatch_date = data.dispatch_date or date.today()

    # Resolve buyer
    buyer_id = data.buyer_id
    if not buyer_id:
        # Default or find by name
        b = db.execute(select(Buyer)).scalars().first()
        buyer_id = b.id if b else None

    # Check available stock before committing
    curr_log = db.execute(
        select(ChillingStockLog).where(ChillingStockLog.log_date == dispatch_date)
    ).scalar_one_or_none()

    if curr_log:
        available = curr_log.opening_stock_litres + curr_log.collected_litres - curr_log.dispatched_litres
        if data.dispatched_litres > available:
            raise AppError(
                422,
                "BUSINESS_RULE_VIOLATION",
                f"Dispatch quantity ({data.dispatched_litres:.2f} L) exceeds available chilling stock ({available:.2f} L)",
            )

    # Generate dispatch code if absent
    if not data.dispatch_code:
        count = db.execute(select(func.count(BowserDispatch.id))).scalar() or 0
        dispatch_code = f"BOW-{count + 1:03d}"
    else:
        dispatch_code = data.dispatch_code

    new_dispatch = BowserDispatch(
        id=uuid.uuid4(),
        dispatch_code=dispatch_code,
        dispatch_date=dispatch_date,
        bowser_number=data.bowser_number,
        driver_name=data.driver_name,
        buyer_id=buyer_id,
        dispatched_litres=q2(data.dispatched_litres),
        accepted_litres=None,
        temperature_c=q1(data.temperature_c) if data.temperature_c is not None else Decimal("4.2"),
        fat_pct=q2(data.fat_pct) if data.fat_pct is not None else Decimal("3.65"),
        snf_pct=q2(data.snf_pct) if data.snf_pct is not None else Decimal("8.30"),
        status="Dispatched",
    )
    db.add(new_dispatch)
    db.flush()

    # Recalculate chilling stock
    recalculate_chilling_stock(db, dispatch_date, auto_commit=False)

    db.commit()
    db.refresh(new_dispatch)

    buyer_name = new_dispatch.buyer.buyer_name if new_dispatch.buyer else "Milco Dairy Ltd"

    return ok(
        BowserDispatchResponse(
            id=new_dispatch.id,
            dispatch_code=new_dispatch.dispatch_code,
            dispatch_date=new_dispatch.dispatch_date,
            bowser_number=new_dispatch.bowser_number,
            driver_name=new_dispatch.driver_name,
            buyer_id=new_dispatch.buyer_id,
            buyer_name=buyer_name,
            dispatched_litres=f"{new_dispatch.dispatched_litres:.2f}",
            accepted_litres=None,
            variance_litres=None,
            temperature_c=f"{new_dispatch.temperature_c:.1f}" if new_dispatch.temperature_c is not None else "4.2",
            fat_pct=f"{new_dispatch.fat_pct:.2f}" if new_dispatch.fat_pct is not None else "3.65",
            snf_pct=f"{new_dispatch.snf_pct:.2f}" if new_dispatch.snf_pct is not None else "8.30",
            status=new_dispatch.status,
            created_at=new_dispatch.created_at,
        )
    )


@router.get("/{dispatch_id}", response_model=Envelope[BowserDispatchResponse])
def get_dispatch_detail(dispatch_id: uuid.UUID, db: DbSession):
    """Retrieve details for a single bowser dispatch."""
    d = db.execute(select(BowserDispatch).where(BowserDispatch.id == dispatch_id)).scalar_one_or_none()
    if not d:
        raise AppError(404, "NOT_FOUND", f"Dispatch with id {dispatch_id} not found")

    buyer_name = d.buyer.buyer_name if d.buyer else "Milco Dairy Ltd"
    variance_str = None
    if d.accepted_litres is not None:
        variance = d.dispatched_litres - d.accepted_litres
        variance_str = f"{variance:.2f}"

    return ok(
        BowserDispatchResponse(
            id=d.id,
            dispatch_code=d.dispatch_code,
            dispatch_date=d.dispatch_date,
            bowser_number=d.bowser_number,
            driver_name=d.driver_name,
            buyer_id=d.buyer_id,
            buyer_name=buyer_name,
            dispatched_litres=f"{d.dispatched_litres:.2f}",
            accepted_litres=f"{d.accepted_litres:.2f}" if d.accepted_litres is not None else None,
            variance_litres=variance_str,
            temperature_c=f"{d.temperature_c:.1f}" if d.temperature_c is not None else "4.2",
            fat_pct=f"{d.fat_pct:.2f}" if d.fat_pct is not None else "3.65",
            snf_pct=f"{d.snf_pct:.2f}" if d.snf_pct is not None else "8.30",
            status=d.status,
            created_at=d.created_at,
        )
    )


@router.patch("/{dispatch_id}", response_model=Envelope[BowserDispatchResponse])
def update_dispatch(dispatch_id: uuid.UUID, data: BowserDispatchUpdate, db: DbSession):
    """Update dispatch or finalize buyer reconciliation."""
    d = db.execute(select(BowserDispatch).where(BowserDispatch.id == dispatch_id)).scalar_one_or_none()
    if not d:
        raise AppError(404, "NOT_FOUND", f"Dispatch with id {dispatch_id} not found")

    if data.accepted_litres is not None:
        d.accepted_litres = q2(data.accepted_litres)
        d.status = "Reconciled"

    if data.status is not None:
        d.status = data.status

    if data.driver_name is not None:
        d.driver_name = data.driver_name

    if data.bowser_number is not None:
        d.bowser_number = data.bowser_number

    if data.temperature_c is not None:
        d.temperature_c = q1(data.temperature_c)

    if data.fat_pct is not None:
        d.fat_pct = q2(data.fat_pct)

    if data.snf_pct is not None:
        d.snf_pct = q2(data.snf_pct)

    db.commit()
    db.refresh(d)

    buyer_name = d.buyer.buyer_name if d.buyer else "Milco Dairy Ltd"
    variance_str = None
    buyer_amount_str = None
    buyer_rate_str = None

    if d.accepted_litres is not None:
        variance = d.dispatched_litres - d.accepted_litres
        variance_str = f"{variance:.2f}"
        if data.buyer_rate is not None:
            rate = q2(data.buyer_rate)
            buyer_rate_str = f"{rate:.2f}"
            amount = q2(d.accepted_litres * rate)
            buyer_amount_str = f"{amount:.2f}"

    return ok(
        BowserDispatchResponse(
            id=d.id,
            dispatch_code=d.dispatch_code,
            dispatch_date=d.dispatch_date,
            bowser_number=d.bowser_number,
            driver_name=d.driver_name,
            buyer_id=d.buyer_id,
            buyer_name=buyer_name,
            dispatched_litres=f"{d.dispatched_litres:.2f}",
            accepted_litres=f"{d.accepted_litres:.2f}" if d.accepted_litres is not None else None,
            variance_litres=variance_str,
            buyer_rate=buyer_rate_str,
            buyer_amount=buyer_amount_str,
            temperature_c=f"{d.temperature_c:.1f}" if d.temperature_c is not None else "4.2",
            fat_pct=f"{d.fat_pct:.2f}" if d.fat_pct is not None else "3.65",
            snf_pct=f"{d.snf_pct:.2f}" if d.snf_pct is not None else "8.30",
            status=d.status,
            created_at=d.created_at,
        )
    )


@router.delete("/{dispatch_id}", response_model=Envelope[dict])
def delete_dispatch(dispatch_id: uuid.UUID, db: DbSession):
    """Delete a dispatch and restore chilling stock."""
    d = db.execute(select(BowserDispatch).where(BowserDispatch.id == dispatch_id)).scalar_one_or_none()
    if not d:
        raise AppError(404, "NOT_FOUND", f"Dispatch with id {dispatch_id} not found")

    dispatch_date = d.dispatch_date
    db.delete(d)
    db.flush()

    recalculate_chilling_stock(db, dispatch_date, auto_commit=False)
    db.commit()

    return ok({"message": f"Dispatch {dispatch_id} successfully deleted"})
