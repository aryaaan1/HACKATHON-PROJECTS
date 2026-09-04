import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import Base, get_db
from backend.models import (
    Warehouse, Row, Bin, Product, Inventory, Order, OrderItem, StockMovement
)

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()

    warehouse = Warehouse(name="Test Warehouse")
    db.add(warehouse)
    db.flush()

    row = Row(warehouse_id=warehouse.id, name="ROW-A")
    db.add(row)
    db.flush()

    bin1 = Bin(row_id=row.id, location_code="A-001")
    bin2 = Bin(row_id=row.id, location_code="A-002")
    db.add_all([bin1, bin2])
    db.flush()

    product1 = Product(sku="SKU001", name="Test Product 1", category="Test")
    product2 = Product(sku="SKU002", name="Test Product 2", category="Test")
    db.add_all([product1, product2])
    db.flush()

    inventory1 = Inventory(
        product_id=product1.id, bin_id=bin1.id, quantity=50, low_stock_threshold=10
    )
    inventory2 = Inventory(
        product_id=product2.id, bin_id=bin2.id, quantity=5, low_stock_threshold=10
    )
    db.add_all([inventory1, inventory2])

    order1 = Order(order_number="ORD-001", status="pending")
    db.add(order1)
    db.flush()

    order_item1 = OrderItem(order_id=order1.id, product_id=product1.id, ordered_quantity=2)
    db.add(order_item1)

    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_dashboard(setup_db):
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_products" in data
    assert "total_stock" in data
    assert "low_stock_items" in data
    assert "total_rows" in data
    assert data["total_products"] == 2
    assert data["total_stock"] == 55

def test_search_products(setup_db):
    response = client.get("/api/products?search=Test")
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 2
    assert products[0]["name"] == "Test Product 1"

def test_search_products_by_sku(setup_db):
    response = client.get("/api/products?search=SKU001")
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 1
    assert products[0]["sku"] == "SKU001"
    assert len(products[0]["locations"]) > 0

def test_get_product_by_id(setup_db):
    response = client.get("/api/products/1")
    assert response.status_code == 200
    product = response.json()
    assert product["sku"] == "SKU001"
    assert product["name"] == "Test Product 1"
    assert len(product["locations"]) > 0

def test_get_locations(setup_db):
    response = client.get("/api/locations")
    assert response.status_code == 200
    locations = response.json()
    assert len(locations) > 0
    assert "warehouse_name" in locations[0]
    assert "row_name" in locations[0]
    assert "bin_location_code" in locations[0]

def test_get_order(setup_db):
    response = client.get("/api/orders/ORD-001")
    assert response.status_code == 200
    order = response.json()
    assert order["order_number"] == "ORD-001"
    assert order["status"] == "pending"
    assert len(order["items"]) > 0
    assert order["items"][0]["location"] is not None

def test_stock_inward(setup_db):
    response = client.post(
        "/api/stock/inward",
        json={"product_id": 1, "bin_id": 1, "quantity": 25, "reference": "TEST-001"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["new_quantity"] == 75

def test_stock_outward(setup_db):
    response = client.post(
        "/api/stock/outward",
        json={"product_id": 1, "bin_id": 1, "quantity": 20, "reference": "TEST-002"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["new_quantity"] == 30

def test_stock_outward_insufficient(setup_db):
    response = client.post(
        "/api/stock/outward",
        json={"product_id": 2, "bin_id": 2, "quantity": 10, "reference": "TEST-003"}
    )
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]

def test_stock_outward_negative_prevention(setup_db):
    response = client.post(
        "/api/stock/outward",
        json={"product_id": 1, "bin_id": 1, "quantity": 100, "reference": "TEST-004"}
    )
    assert response.status_code == 400

def test_stock_transfer(setup_db):
    response = client.post(
        "/api/stock/transfer",
        json={
            "product_id": 1,
            "from_bin_id": 1,
            "to_bin_id": 2,
            "quantity": 15,
            "reference": "TEST-005"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["from_quantity"] == 35
    assert data["to_quantity"] == 15

def test_stock_transfer_creates_new_inventory(setup_db):
    response = client.post(
        "/api/stock/transfer",
        json={
            "product_id": 2,
            "from_bin_id": 2,
            "to_bin_id": 1,
            "quantity": 3,
            "reference": "TEST-006"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["to_quantity"] == 3

def test_get_stock_movements(setup_db):
    client.post(
        "/api/stock/inward",
        json={"product_id": 1, "bin_id": 1, "quantity": 10}
    )
    response = client.get("/api/stock/movements")
    assert response.status_code == 200
    movements = response.json()
    assert len(movements) > 0
    assert movements[0]["movement_type"] in ["INWARD", "OUTWARD", "TRANSFER"]

def test_get_low_stock(setup_db):
    response = client.get("/api/low-stock")
    assert response.status_code == 200
    low_stock = response.json()
    assert len(low_stock) == 1
    assert low_stock[0]["product_sku"] == "SKU002"
    assert low_stock[0]["current_quantity"] == 5

def test_movement_logging(setup_db):
    client.post(
        "/api/stock/inward",
        json={"product_id": 1, "bin_id": 1, "quantity": 10, "reference": "RECV-001"}
    )

    response = client.get("/api/stock/movements")
    movements = response.json()
    assert len(movements) >= 1
    last_movement = movements[0]
    assert last_movement["movement_type"] == "INWARD"
    assert last_movement["reference"] == "RECV-001"
