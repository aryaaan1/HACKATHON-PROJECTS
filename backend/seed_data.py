"""Shared demo-data population logic.

`populate_demo_data` inserts the standard demo dataset and is used by:
  - the root-level `seed.py` script (destructive, manual reseed), and
  - `seed_if_empty` below (safe, automatic first-run initialization).

`seed_if_empty` is the only entry point that should run automatically on
application startup. It never deletes existing rows: it seeds demo data
once, the first time the database has no warehouses, and is a no-op on
every subsequent call (e.g. a Render Free restart).
"""
import random
from datetime import datetime, timedelta

from backend.auth import hash_password
from backend.database import SessionLocal, init_db
from backend.models import (
    Warehouse, Row, Bin, Product, Inventory, Order, OrderItem, StockMovement, User
)

DEMO_USERS = [
    ("admin", "Admin@123", "admin"),
    ("employee", "Employee@123", "employee"),
]


def ensure_demo_users(db):
    """Create the demo accounts if they don't exist yet. Idempotent and safe
    to call on every startup, including against an already-seeded database —
    it never touches an existing user's password or role."""
    changed = False
    for username, password, role in DEMO_USERS:
        if not db.query(User).filter(User.username == username).first():
            db.add(User(username=username, password_hash=hash_password(password), role=role))
            changed = True
    if changed:
        db.commit()


def populate_demo_data(db):
    """Insert the demo dataset into `db`. Assumes the relevant tables are empty."""
    warehouse = Warehouse(name="Main Warehouse")
    db.add(warehouse)
    db.flush()

    rows = [
        Row(warehouse_id=warehouse.id, name="ROW-A"),
        Row(warehouse_id=warehouse.id, name="ROW-B"),
        Row(warehouse_id=warehouse.id, name="ROW-C"),
        Row(warehouse_id=warehouse.id, name="ROW-D"),
    ]
    for row in rows:
        db.add(row)
    db.flush()

    bins = [
        Bin(row_id=rows[0].id, location_code="A-001"),
        Bin(row_id=rows[0].id, location_code="A-002"),
        Bin(row_id=rows[0].id, location_code="A-003"),
        Bin(row_id=rows[1].id, location_code="B-001"),
        Bin(row_id=rows[1].id, location_code="B-002"),
        Bin(row_id=rows[1].id, location_code="B-003"),
        Bin(row_id=rows[2].id, location_code="C-001"),
        Bin(row_id=rows[2].id, location_code="C-002"),
        Bin(row_id=rows[2].id, location_code="C-003"),
        Bin(row_id=rows[3].id, location_code="D-001"),
        Bin(row_id=rows[3].id, location_code="D-002"),
        Bin(row_id=rows[3].id, location_code="D-003"),
    ]
    for bin_item in bins:
        db.add(bin_item)
    db.flush()

    products = [
        Product(sku="SKU001", name="Laptop", category="Electronics"),
        Product(sku="SKU002", name="Monitor", category="Electronics"),
        Product(sku="SKU003", name="Keyboard", category="Electronics"),
        Product(sku="SKU004", name="Mouse", category="Electronics"),
        Product(sku="SKU005", name="USB Cable", category="Accessories"),
        Product(sku="SKU006", name="HDMI Cable", category="Accessories"),
        Product(sku="SKU007", name="Power Bank", category="Electronics"),
        Product(sku="SKU008", name="Headphones", category="Electronics"),
        Product(sku="SKU009", name="Phone Stand", category="Accessories"),
        Product(sku="SKU010", name="Desk Lamp", category="Accessories"),
        Product(sku="SKU011", name="Webcam", category="Electronics"),
        Product(sku="SKU012", name="Microphone", category="Electronics"),
        Product(sku="SKU013", name="Screen Protector", category="Accessories"),
        Product(sku="SKU014", name="Phone Case", category="Accessories"),
        Product(sku="SKU015", name="SSD 1TB", category="Electronics"),
        Product(sku="SKU016", name="RAM 8GB", category="Electronics"),
        Product(sku="SKU017", name="Charger", category="Accessories"),
        Product(sku="SKU018", name="Cooling Pad", category="Electronics"),
        Product(sku="SKU019", name="Monitor Arm", category="Accessories"),
        Product(sku="SKU020", name="Docking Station", category="Electronics"),
    ]
    for product in products:
        db.add(product)
    db.flush()

    for product in products:
        num_bins = random.randint(1, 3)
        selected_bins = random.sample(bins, num_bins)
        for bin_item in selected_bins:
            quantity = random.randint(10, 100)
            inventory = Inventory(
                product_id=product.id,
                bin_id=bin_item.id,
                quantity=quantity,
                low_stock_threshold=15
            )
            db.add(inventory)
    db.flush()

    orders = [
        Order(order_number="ORD-001", status="pending"),
        Order(order_number="ORD-002", status="processing"),
        Order(order_number="ORD-003", status="shipped"),
        Order(order_number="ORD-004", status="delivered"),
        Order(order_number="ORD-005", status="pending"),
    ]
    for order in orders:
        db.add(order)
    db.flush()

    order_mappings = [
        (orders[0].id, products[0].id, 2),
        (orders[0].id, products[1].id, 1),
        (orders[1].id, products[2].id, 3),
        (orders[1].id, products[3].id, 2),
        (orders[2].id, products[4].id, 5),
        (orders[2].id, products[5].id, 2),
        (orders[3].id, products[6].id, 1),
        (orders[3].id, products[7].id, 1),
        (orders[4].id, products[8].id, 4),
        (orders[4].id, products[9].id, 2),
    ]
    for order_id, product_id, quantity in order_mappings:
        order_item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            ordered_quantity=quantity
        )
        db.add(order_item)
    db.flush()

    base_time = datetime.utcnow() - timedelta(days=7)
    movements = []
    for i, product in enumerate(products[:10]):
        movement = StockMovement(
            product_id=product.id,
            movement_type="INWARD",
            quantity=50,
            to_bin_id=bins[i % len(bins)].id,
            timestamp=base_time + timedelta(days=i),
            reference=f"RECV-{i:03d}"
        )
        movements.append(movement)

    for movement in movements:
        db.add(movement)

    for i, product in enumerate(products[10:15]):
        movement = StockMovement(
            product_id=product.id,
            movement_type="TRANSFER",
            quantity=10,
            from_bin_id=bins[i % len(bins)].id,
            to_bin_id=bins[(i + 1) % len(bins)].id,
            timestamp=base_time + timedelta(days=5 + i),
            reference=f"TRANS-{i:03d}"
        )
        db.add(movement)

    db.commit()
    print("Database seeded successfully!")
    print(f"  - 1 warehouse")
    print(f"  - 4 rows")
    print(f"  - 12 bins")
    print(f"  - 20 products")
    print(f"  - Multiple inventory entries")
    print(f"  - 5 orders")
    print(f"  - 10 order items")
    print(f"  - 15 stock movements")


def seed_if_empty():
    """Create the schema if needed, then seed demo data exactly once.

    Safe to call on every application startup: if the database already
    has a warehouse row, this is a no-op and no existing data is touched.
    """
    init_db()
    db = SessionLocal()
    try:
        ensure_demo_users(db)
        if db.query(Warehouse).count() > 0:
            return
        populate_demo_data(db)
    except Exception as e:
        db.rollback()
        print(f"Error during initial database seeding: {e}")
        raise
    finally:
        db.close()
