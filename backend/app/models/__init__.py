"""SQLAlchemy ORM models mirroring the Supabase schema."""
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    route_name: Mapped[str] = mapped_column(String(100), nullable=False)
    collector_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vehicle_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    farmers: Mapped[list["Farmer"]] = relationship("Farmer", back_populates="route")
    milk_collections: Mapped[list["MilkCollection"]] = relationship("MilkCollection", back_populates="route")


class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    route_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id"), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    nic: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    bank_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bank_branch: Mapped[str] = mapped_column(String(100), nullable=False)
    account_number: Mapped[str] = mapped_column(String(50), nullable=False)
    account_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(9), default="Active")
    registered_at: Mapped[date | None] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    route: Mapped[Route | None] = relationship("Route", back_populates="farmers")
    milk_collections: Mapped[list["MilkCollection"]] = relationship("MilkCollection", back_populates="farmer")
    credit_sales: Mapped[list["InputCreditSale"]] = relationship("InputCreditSale", back_populates="farmer")


class MilkCollection(Base):
    __tablename__ = "milk_collections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    session: Mapped[str] = mapped_column(String(7), nullable=False)  # Morning / Evening
    farmer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=True)
    route_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id"), nullable=True)
    quantity_litres: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    fat_pct: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False)
    snf_pct: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False)
    temperature_c: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(8), default="Accepted")  # Accepted, Rejected, Acidic
    final_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    farmer: Mapped[Farmer | None] = relationship("Farmer", back_populates="milk_collections")
    route: Mapped[Route | None] = relationship("Route", back_populates="milk_collections")


class ChillingStockLog(Base):
    __tablename__ = "chilling_stock_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    opening_stock_litres: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    collected_litres: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    dispatched_litres: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    closing_stock_litres: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    avg_fat: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    avg_snf: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    temperature_c: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Buyer(Base):
    __tablename__ = "buyers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    dispatches: Mapped[list["BowserDispatch"]] = relationship("BowserDispatch", back_populates="buyer")


class BowserDispatch(Base):
    __tablename__ = "bowser_dispatches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dispatch_code: Mapped[str] = mapped_column(String(20), nullable=False)
    dispatch_date: Mapped[date] = mapped_column(Date, nullable=False)
    bowser_number: Mapped[str] = mapped_column(String(50), nullable=False)
    driver_name: Mapped[str] = mapped_column(String(100), nullable=False)
    buyer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("buyers.id"), nullable=True)
    dispatched_litres: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    accepted_litres: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    fat_pct: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    snf_pct: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    temperature_c: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(10), default="Dispatched")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    buyer: Mapped[Buyer | None] = relationship("Buyer", back_populates="dispatches")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_code: Mapped[str] = mapped_column(String(20), nullable=False)
    item_name: Mapped[str] = mapped_column(String(150), nullable=False)
    unit: Mapped[str] = mapped_column(String(6), nullable=False)
    stock_qty: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    credit_sales: Mapped[list["InputCreditSale"]] = relationship("InputCreditSale", back_populates="item")


class InputCreditSale(Base):
    __tablename__ = "input_credit_sales"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_date: Mapped[date] = mapped_column(Date, nullable=False)
    farmer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=True)
    item_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_recovered: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    farmer: Mapped[Farmer | None] = relationship("Farmer", back_populates="credit_sales")
    item: Mapped[InventoryItem | None] = relationship("InventoryItem", back_populates="credit_sales")


class OperatingExpense(Base):
    __tablename__ = "operating_expenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PaymentCycle(Base):
    __tablename__ = "payment_cycles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cycle_name: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(9), default="Pending")
    total_farmers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gross_earnings: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    total_deductions: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    net_payable: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    statements: Mapped[list["FarmerPaymentStatement"]] = relationship("FarmerPaymentStatement", back_populates="payment_cycle")


class FarmerPaymentStatement(Base):
    __tablename__ = "farmer_payment_statements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_cycle_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("payment_cycles.id"), nullable=True)
    farmer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=True)
    total_litres: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    gross_earnings: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    input_deductions: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    net_payable: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    payment_cycle: Mapped[PaymentCycle | None] = relationship("PaymentCycle", back_populates="statements")


class PricingMatrix(Base):
    __tablename__ = "pricing_matrix"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    base_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    fat_adjustment_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    snf_adjustment_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
