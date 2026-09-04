import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import Base, get_db
from backend.auth import hash_password
from backend.models import (
    Warehouse, Row, Bin, Product, Inventory, Order, OrderItem, StockMovement, User
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

def get_token(username, password):
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]

def admin_headers():
    return {"Authorization": f"Bearer {get_token('admin', 'Admin@123')}"}

def employee_headers():
    return {"Authorization": f"Bearer {get_token('employee', 'Employee@123')}"}

@pytest.fixture(scope="function")
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()

    admin_user = User(username="admin", password_hash=hash_password("Admin@123"), role="admin")
    employee_user = User(username="employee", password_hash=hash_password("Employee@123"), role="employee")
    db.add_all([admin_user, employee_user])

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

# --- Authentication ---

def test_login_admin_success(setup_db):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "admin"
    assert data["username"] == "admin"
    assert data["access_token"]
    assert "password" not in response.text

def test_login_employee_success(setup_db):
    response = client.post("/api/auth/login", json={"username": "employee", "password": "Employee@123"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "employee"
    assert data["username"] == "employee"
    assert data["access_token"]

def test_login_invalid_credentials(setup_db):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "wrong-password"})
    assert response.status_code == 401

def test_login_unknown_user(setup_db):
    response = client.post("/api/auth/login", json={"username": "nobody", "password": "whatever"})
    assert response.status_code == 401

def test_me_requires_valid_token(setup_db):
    response = client.get("/api/auth/me", headers=admin_headers())
    assert response.status_code == 200
    assert response.json() == {"username": "admin", "role": "admin"}

def test_protected_endpoint_rejects_unauthenticated_request(setup_db):
    response = client.get("/api/dashboard")
    assert response.status_code == 401

def test_protected_endpoint_rejects_bad_token(setup_db):
    response = client.get("/api/dashboard", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401

def test_employee_cannot_perform_admin_stock_operation(setup_db):
    response = client.post(
        "/api/stock/inward",
        json={"product_id": 1, "bin_id": 1, "quantity": 10},
        headers=employee_headers(),
    )
    assert response.status_code == 403

def test_employee_cannot_create_order(setup_db):
    response = client.post(
        "/api/orders",
        json={"order_number": "ORD-EMP-001", "items": [{"product_id": 1, "ordered_quantity": 1}]},
        headers=employee_headers(),
    )
    assert response.status_code == 403

def test_admin_can_perform_stock_operation(setup_db):
    response = client.post(
        "/api/stock/inward",
        json={"product_id": 1, "bin_id": 1, "quantity": 10},
        headers=admin_headers(),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_employee_can_access_operational_endpoints(setup_db):
    response = client.get("/api/dashboard", headers=employee_headers())
    assert response.status_code == 200

# --- Dashboard / products / locations (Employee + Admin can both read) ---

def test_get_dashboard(setup_db):
    response = client.get("/api/dashboard", headers=admin_headers())
    assert response.status_code == 200
    data = response.json()
    assert "total_products" in data
    assert "total_stock" in data
    assert "low_stock_items" in data
    assert "total_rows" in data
    assert data["total_products"] == 2
    assert data["total_stock"] == 55

def test_search_products(setup_db):
    response = client.get("/api/products?search=Test", headers=employee_headers())
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 2
    assert products[0]["name"] == "Test Product 1"

def test_search_products_by_sku(setup_db):
    response = client.get("/api/products?search=SKU001", headers=employee_headers())
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 1
    assert products[0]["sku"] == "SKU001"
    assert len(products[0]["locations"]) > 0

def test_get_product_by_id(setup_db):
    response = client.get("/api/products/1", headers=employee_headers())
    assert response.status_code == 200
    product = response.json()
    assert product["sku"] == "SKU001"
    assert product["name"] == "Test Product 1"
    assert len(product["locations"]) > 0

def test_get_locations(setup_db):
    response = client.get("/api/locations", headers=employee_headers())
    assert response.status_code == 200
    locations = response.json()
    assert len(locations) > 0
    assert "warehouse_name" in locations[0]
    assert "row_name" in locations[0]
    assert "bin_location_code" in locations[0]

def test_get_order(setup_db):
    response = client.get("/api/orders/ORD-001", headers=employee_headers())
    assert response.status_code == 200
    order = response.json()
    assert order["order_number"] == "ORD-001"
    assert order["status"] == "pending"
    assert len(order["items"]) > 0
    assert order["items"][0]["location"] is not None

# --- Order creation (Admin-only) ---

def test_create_order(setup_db):
    response = client.post(
        "/api/orders",
        json={
            "order_number": "ORD-NEW-001",
            "items": [
                {"product_id": 1, "ordered_quantity": 3},
                {"product_id": 2, "ordered_quantity": 1},
            ],
        },
        headers=admin_headers(),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["order_number"] == "ORD-NEW-001"

def test_create_order_is_retrievable(setup_db):
    client.post(
        "/api/orders",
        json={
            "order_number": "ORD-NEW-002",
            "items": [{"product_id": 1, "ordered_quantity": 5}],
        },
        headers=admin_headers(),
    )

    response = client.get("/api/orders/ORD-NEW-002", headers=employee_headers())
    assert response.status_code == 200
    order = response.json()
    assert order["order_number"] == "ORD-NEW-002"
    assert order["status"] == "pending"
    assert len(order["items"]) == 1
    assert order["items"][0]["ordered_quantity"] == 5

def test_create_order_does_not_change_inventory(setup_db):
    before = client.get("/api/products/1", headers=admin_headers()).json()
    before_qty = sum(loc["quantity"] for loc in before["locations"])

    client.post(
        "/api/orders",
        json={
            "order_number": "ORD-NEW-003",
            "items": [{"product_id": 1, "ordered_quantity": 5}],
        },
        headers=admin_headers(),
    )

    after = client.get("/api/products/1", headers=admin_headers()).json()
    after_qty = sum(loc["quantity"] for loc in after["locations"])
    assert after_qty == before_qty

def test_create_order_duplicate_number(setup_db):
    response = client.post(
        "/api/orders",
        json={
            "order_number": "ORD-001",
            "items": [{"product_id": 1, "ordered_quantity": 1}],
        },
        headers=admin_headers(),
    )
    assert response.status_code == 409

def test_create_order_invalid_product(setup_db):
    response = client.post(
        "/api/orders",
        json={
            "order_number": "ORD-NEW-004",
            "items": [{"product_id": 9999, "ordered_quantity": 1}],
        },
        headers=admin_headers(),
    )
    assert response.status_code == 400
    assert "Invalid product_id" in response.json()["detail"]

def test_create_order_empty_items(setup_db):
    response = client.post(
        "/api/orders",
        json={"order_number": "ORD-NEW-005", "items": []},
        headers=admin_headers(),
    )
    assert response.status_code == 400

# --- Stock operations (Admin-only) ---

def test_stock_inward(setup_db):
    response = client.post(
        "/api/stock/inward",
        json={"product_id": 1, "bin_id": 1, "quantity": 25, "reference": "TEST-001"},
        headers=admin_headers(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["new_quantity"] == 75

def test_stock_outward(setup_db):
    response = client.post(
        "/api/stock/outward",
        json={"product_id": 1, "bin_id": 1, "quantity": 20, "reference": "TEST-002"},
        headers=admin_headers(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["new_quantity"] == 30

def test_stock_outward_insufficient(setup_db):
    response = client.post(
        "/api/stock/outward",
        json={"product_id": 2, "bin_id": 2, "quantity": 10, "reference": "TEST-003"},
        headers=admin_headers(),
    )
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]

def test_stock_outward_negative_prevention(setup_db):
    response = client.post(
        "/api/stock/outward",
        json={"product_id": 1, "bin_id": 1, "quantity": 100, "reference": "TEST-004"},
        headers=admin_headers(),
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
        },
        headers=admin_headers(),
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
        },
        headers=admin_headers(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["to_quantity"] == 3

def test_get_stock_movements(setup_db):
    client.post(
        "/api/stock/inward",
        json={"product_id": 1, "bin_id": 1, "quantity": 10},
        headers=admin_headers(),
    )
    response = client.get("/api/stock/movements", headers=employee_headers())
    assert response.status_code == 200
    movements = response.json()
    assert len(movements) > 0
    assert movements[0]["movement_type"] in ["INWARD", "OUTWARD", "TRANSFER"]

def test_get_low_stock(setup_db):
    response = client.get("/api/low-stock", headers=employee_headers())
    assert response.status_code == 200
    low_stock = response.json()
    assert len(low_stock) == 1
    assert low_stock[0]["product_sku"] == "SKU002"
    assert low_stock[0]["current_quantity"] == 5

def test_movement_logging(setup_db):
    client.post(
        "/api/stock/inward",
        json={"product_id": 1, "bin_id": 1, "quantity": 10, "reference": "RECV-001"},
        headers=admin_headers(),
    )

    response = client.get("/api/stock/movements", headers=admin_headers())
    movements = response.json()
    assert len(movements) >= 1
    last_movement = movements[0]
    assert last_movement["movement_type"] == "INWARD"
    assert last_movement["reference"] == "RECV-001"
