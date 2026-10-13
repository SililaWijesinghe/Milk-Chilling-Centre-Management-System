"""Database seeding script with representative MCCMS data aligned with UI mockups."""
import random
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.models import (
    BowserDispatch,
    Buyer,
    ChillingStockLog,
    Farmer,
    FarmerPaymentStatement,
    InputCreditSale,
    InventoryItem,
    MilkCollection,
    OperatingExpense,
    PaymentCycle,
    PricingMatrix,
    Route,
)


def seed_database(db: Session):
    # Check if routes exist
    existing_routes = db.execute(select(Route)).scalars().all()
    if existing_routes:
        print("Database already contains data, skipping seed.")
        return

    print("Seeding MCCMS database with mockup-aligned data...")

    # 1. Routes
    r1 = Route(id=uuid.uuid4(), route_code="R-001", route_name="Route R-001", collector_name="Nuwan Silva", vehicle_number="WP-CAB-1234")
    r2 = Route(id=uuid.uuid4(), route_code="R-002", route_name="Route R-002", collector_name="Kasun Perera", vehicle_number="WP-CAB-5678")
    r3 = Route(id=uuid.uuid4(), route_code="R-003", route_name="Route R-003", collector_name="Saman Kumara", vehicle_number="WP-CAB-9012")
    r4 = Route(id=uuid.uuid4(), route_code="R-004", route_name="Route R-004", collector_name="Priyantha Fernando", vehicle_number="WP-CAB-3456")
    db.add_all([r1, r2, r3, r4])
    db.flush()

    # 2. Farmers (From Mockup 2 & 3)
    farmers_data = [
        ("FAR-001", "Kamal Perera", r1.id, "077 123 4567", "198001234567", "No. 245, Dairy Road, Kurunegala", "Bank of Ceylon (BOC)", "Kurunegala", "1234567890", "Kamal Perera", "Active"),
        ("FAR-002", "Sunil Silva", r2.id, "071 234 5678", "197502345678", "No. 12, Main Street, Ibbagamuwa", "BOC", "Ibbagamuwa", "2345678901", "Sunil Silva", "Active"),
        ("FAR-003", "Nimal Kumara", r1.id, "077 345 6789", "198203456789", "Galgamuwa Junction", "Commercial Bank", "Kurunegala", "3456789012", "Nimal Kumara", "Active"),
        ("FAR-004", "Saman Wijesinghe", r3.id, "075 456 7890", "197904567890", "Melsiripura East", "People's Bank", "Melsiripura", "4567890123", "Saman Wijesinghe", "Active"),
        ("FAR-005", "Priyantha Fernando", r2.id, "077 567 8901", "198505678901", "Pannala South", "People's Bank", "Pannala", "5678901234", "Priyantha Fernando", "Inactive"),
        ("FAR-006", "Anura Jayasekera", r4.id, "071 678 9012", "197306789012", "Wariyapola Town", "Commercial Bank", "Wariyapola", "6789012345", "Anura Jayasekera", "Active"),
        ("FAR-007", "Chandima Rathnayake", r2.id, "077 789 0123", "198807890123", "Kuliyapitiya Road", "BOC", "Kuliyapitiya", "7890123456", "Chandima Rathnayake", "Active"),
        ("FAR-008", "Kusal Perera", r3.id, "071 890 1234", "199108901234", "Polgahawela Village", "People's Bank", "Polgahawela", "8901234567", "Kusal Perera", "Active"),
        ("FAR-009", "Lalith Bandara", r4.id, "072 901 2345", "198409012345", "Mawathagama West", "Commercial Bank", "Mawathagama", "9012345678", "Lalith Bandara", "Active"),
        ("FAR-010", "Ruwan Fernando", r4.id, "070 012 3456", "198710123456", "Narammala Road", "BOC", "Narammala", "0123456789", "Ruwan Fernando", "Active"),
        ("FAR-011", "Nuwan Silva", r1.id, "077 111 2233", "198911223344", "Kurunegala Bypass", "Commercial Bank", "Kurunegala", "1122334455", "Nuwan Silva", "Active"),
        ("FAR-012", "Kasun Perera", r2.id, "071 222 3344", "199012223344", "Dambulla Road", "People's Bank", "Kurunegala", "2233445566", "Kasun Perera", "Active"),
        ("FAR-015", "Thilina Fernando", r1.id, "077 333 4455", "198613334455", "Milk Board Junction", "BOC", "Kurunegala", "3344556677", "Thilina Fernando", "Active"),
        ("FAR-018", "Dinesh Kumara", r3.id, "076 444 5566", "199214445566", "Ibbagamuwa Lake Road", "Commercial Bank", "Ibbagamuwa", "4455667788", "Dinesh Kumara", "Active"),
    ]

    farmers = []
    for code, name, rid, phone, nic, addr, bname, branch, acc_no, acc_name, st in farmers_data:
        f = Farmer(
            id=uuid.uuid4(),
            farmer_code=code,
            full_name=name,
            route_id=rid,
            phone=phone,
            nic=nic,
            address=addr,
            bank_name=bname,
            bank_branch=branch,
            account_number=acc_no,
            account_name=acc_name,
            status=st,
            registered_at=date(2022, 1, 12),
        )
        farmers.append(f)
        db.add(f)
    db.flush()

    # 3. Pricing Matrix
    pm = PricingMatrix(
        id=uuid.uuid4(),
        base_rate=Decimal("170.00"),
        fat_adjustment_rate=Decimal("3.50"),
        snf_adjustment_rate=Decimal("1.50"),
        effective_from=date(2026, 1, 1),
        is_active=True,
    )
    db.add(pm)

    # 4. Buyers
    b1 = Buyer(id=uuid.uuid4(), buyer_name="Milco Dairy Ltd", contact_person="Mr. Jayasinghe", phone="011 234 5678", address="Narahenpita, Colombo")
    b2 = Buyer(id=uuid.uuid4(), buyer_name="Nestle Lanka PLC", contact_person="Mr. Perera", phone="011 456 7890", address="Pannala")
    db.add_all([b1, b2])
    db.flush()

    # 5. Inventory Items
    inv1 = InventoryItem(id=uuid.uuid4(), item_code="INP-001", item_name="Mineral Mix", unit="kg", stock_qty=Decimal("250.00"), unit_price=Decimal("250.00"))
    inv2 = InventoryItem(id=uuid.uuid4(), item_code="INP-002", item_name="Cattle Feed", unit="kg", stock_qty=Decimal("1200.00"), unit_price=Decimal("180.00"))
    inv3 = InventoryItem(id=uuid.uuid4(), item_code="INP-003", item_name="Veterinary Drug", unit="bottle", stock_qty=Decimal("120.00"), unit_price=Decimal("850.00"))
    inv4 = InventoryItem(id=uuid.uuid4(), item_code="INP-004", item_name="Milk Can", unit="piece", stock_qty=Decimal("35.00"), unit_price=Decimal("6500.00"))
    db.add_all([inv1, inv2, inv3, inv4])
    db.flush()

    # 6. Today's date (Matching Mockup 1: 02 Oct 2026)
    today = date(2026, 10, 2)

    # Historical 7 days collections and stock logs (26 Sep to 02 Oct 2026)
    chart_dates = [
        (date(2026, 9, 26), Decimal("7200.00"), Decimal("6500.00"), Decimal("3.65"), Decimal("8.35")),
        (date(2026, 9, 27), Decimal("7800.00"), Decimal("6600.00"), Decimal("3.68"), Decimal("8.30")),
        (date(2026, 9, 28), Decimal("7100.00"), Decimal("6000.00"), Decimal("3.70"), Decimal("8.32")),
        (date(2026, 9, 29), Decimal("7500.00"), Decimal("6300.00"), Decimal("3.71"), Decimal("8.36")),
        (date(2026, 9, 30), Decimal("8000.00"), Decimal("6800.00"), Decimal("3.69"), Decimal("8.33")),
        (date(2026, 10, 1), Decimal("8100.00"), Decimal("6700.00"), Decimal("3.70"), Decimal("8.35")),
        (date(2026, 10, 2), Decimal("8450.00"), Decimal("7000.00"), Decimal("3.72"), Decimal("8.34")),
    ]

    for d, m_vol, e_vol, fat, snf in chart_dates:
        # Stock log
        stock_log = ChillingStockLog(
            id=uuid.uuid4(),
            log_date=d,
            opening_stock_litres=Decimal("5000.00"),
            collected_litres=m_vol,
            dispatched_litres=Decimal("2680.00") if d == today else Decimal("3000.00"),
            closing_stock_litres=Decimal("5820.00") if d == today else Decimal("5000.00"),
            avg_fat=fat,
            avg_snf=snf,
            temperature_c=Decimal("4.2"),
        )
        db.add(stock_log)

    # 7. Today's collections for farmers across routes
    # Route totals from Mockup 1:
    # R-001: 24 farmers, Morning: 1520, Evening: 1380, Total: 2900, Fat: 3.72, SNF: 8.34
    # R-002: 28 farmers, Morning: 1680, Evening: 1450, Total: 3130, Fat: 3.68, SNF: 8.31
    # R-003: 26 farmers, Morning: 1240, Evening: 980,  Total: 2220, Fat: 3.75, SNF: 8.40
    # R-004: 22 farmers, Morning: 980,  Evening: 760,  Total: 1740, Fat: 3.69, SNF: 8.27
    mockup_collections = [
        # farmer_id, route_id, session, qty, fat, snf, temp, status, rate, amount
        (farmers[0].id, r1.id, "Morning", Decimal("35.50"), Decimal("3.70"), Decimal("8.40"), Decimal("5.2"), "Accepted", Decimal("185.00"), Decimal("6567.50")),
        (farmers[3].id, r3.id, "Morning", Decimal("28.00"), Decimal("3.60"), Decimal("8.20"), Decimal("5.1"), "Accepted", Decimal("182.50"), Decimal("5110.00")),
        (farmers[7].id, r3.id, "Morning", Decimal("32.00"), Decimal("3.80"), Decimal("8.50"), Decimal("5.3"), "Accepted", Decimal("186.00"), Decimal("5952.00")),
        (farmers[10].id, r1.id, "Morning", Decimal("26.50"), Decimal("3.50"), Decimal("8.10"), Decimal("5.4"), "Accepted", Decimal("180.00"), Decimal("4770.00")),
        (farmers[12].id, r1.id, "Morning", Decimal("30.00"), Decimal("3.70"), Decimal("8.30"), Decimal("5.2"), "Accepted", Decimal("184.00"), Decimal("5520.00")),
        (farmers[13].id, r3.id, "Morning", Decimal("22.00"), Decimal("3.40"), Decimal("8.00"), Decimal("5.6"), "Accepted", Decimal("178.50"), Decimal("3927.00")),
    ]

    for fid, rid, sess, qty, fat, snf, temp, st, rate, amt in mockup_collections:
        mc = MilkCollection(
            id=uuid.uuid4(),
            collection_date=today,
            session=sess,
            farmer_id=fid,
            route_id=rid,
            quantity_litres=qty,
            fat_pct=fat,
            snf_pct=snf,
            temperature_c=temp,
            status=st,
            final_rate=rate,
            total_amount=amt,
        )
        db.add(mc)

    # 8. Bowser Dispatches
    bd1 = BowserDispatch(
        id=uuid.uuid4(),
        dispatch_code="BOW-003",
        dispatch_date=today,
        bowser_number="WP-BOW-1234",
        driver_name="Nuwan Perera",
        buyer_id=b1.id,
        dispatched_litres=Decimal("2680.00"),
        accepted_litres=Decimal("2680.00"),
        fat_pct=Decimal("3.64"),
        snf_pct=Decimal("8.31"),
        temperature_c=Decimal("4.2"),
        status="Dispatched",
    )
    db.add(bd1)

    # 9. Input credit sales
    ics = InputCreditSale(
        id=uuid.uuid4(),
        sale_date=today,
        farmer_id=farmers[12].id,  # FAR-015
        item_id=inv1.id,
        quantity=Decimal("10.00"),
        unit_price=Decimal("250.00"),
        total_amount=Decimal("2500.00"),
        is_recovered=False,
    )
    db.add(ics)

    # 10. Payment Cycle (Sep 2026)
    pc = PaymentCycle(
        id=uuid.uuid4(),
        cycle_name="September 2026 Payment Cycle",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 30),
        status="Generated",
        total_farmers=248,
        gross_earnings=Decimal("8450000.00"),
        total_deductions=Decimal("457000.00"),
        net_payable=Decimal("7993000.00"),
        generated_at=datetime(2026, 10, 1, 18, 30),
    )
    db.add(pc)

    db.commit()
    print("Database seeding completed successfully!")


if __name__ == "__main__":
    with SessionLocal() as db:
        seed_database(db)
