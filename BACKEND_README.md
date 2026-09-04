# Backend Setup Guide

## Overview
This is a FastAPI-based e-commerce inventory management system with SQLite database. It handles warehouse management, product inventory tracking, and stock movements.

## Architecture

### Database Structure
- **Warehouse**: Container for rows (locations)
- **Row**: Contains bins (e.g., ROW-A, ROW-B)
- **Bin**: Physical storage location (e.g., A-001, A-002) with unique location codes
- **Product**: Items with SKU and metadata
- **Inventory**: Quantity of product in specific bin (tracks stock per location)
- **Order**: Customer orders with status
- **OrderItem**: Individual items in an order
- **StockMovement**: Log of all inventory changes (inward, outward, transfer)

### Directory Structure
```
backend/
├── __init__.py
├── main.py              # FastAPI app
├── database.py          # SQLAlchemy setup
├── models.py            # Database models
├── schemas.py           # Pydantic schemas
├── routes/
│   ├── dashboard.py     # Dashboard metrics
│   ├── products.py      # Product search & lookup
│   ├── locations.py     # Bin locations
│   ├── orders.py        # Order lookup
│   └── stock.py         # Stock operations
└── tests/
    └── test_api.py      # 16 comprehensive tests

seed.py                 # Seed script for test data
test_api_manual.py      # Manual API verification
inventory.db            # SQLite database
```

## Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Create & Seed Database
```bash
python seed.py
```
This creates `inventory.db` with:
- 1 warehouse
- 4 rows (ROW-A to ROW-D)
- 12 bins (3 per row)
- 20 products
- 5 orders with multiple items
- Realistic inventory quantities

### 3. Run Backend Server
```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### 4. Run Tests
```bash
pytest backend/tests/test_api.py -v
```
All 16 tests pass:
- Product search
- Order lookup
- Inventory operations
- Stock transfers
- Movement logging
- Negative stock prevention

## API Endpoints

### Dashboard
**GET `/api/dashboard`**
Returns real-time inventory metrics:
```json
{
  "total_products": 20,
  "total_stock": 1719,
  "low_stock_items": 4,
  "total_rows": 4,
  "recent_movements": [...],
  "stock_by_row": [...]
}
```

### Products
**GET `/api/products`** - Search by SKU, name, or category
```
?search=laptop
```

**GET `/api/products/{id}`** - Get product with all bin locations
Returns product details + all locations where it's stored with quantities

### Locations
**GET `/api/locations`**
Lists all inventory bins with products and quantities:
```json
[
  {
    "warehouse_name": "Main Warehouse",
    "row_name": "ROW-A",
    "bin_location_code": "A-001",
    "product_sku": "SKU001",
    "product_name": "Laptop",
    "quantity": 50
  }
]
```

### Orders
**GET `/api/orders/{order_number}`**
Returns order with exact pick locations for each item:
```json
{
  "order_number": "ORD-001",
  "status": "pending",
  "created_at": "2026-08-28T...",
  "items": [
    {
      "product_sku": "SKU001",
      "ordered_quantity": 2,
      "location": {
        "warehouse": "Main Warehouse",
        "row": "ROW-A",
        "bin": "A-001",
        "available_quantity": 50
      }
    }
  ]
}
```

### Stock Operations
**POST `/api/stock/inward`**
Receive stock into a bin:
```json
{
  "product_id": 1,
  "bin_id": 1,
  "quantity": 50,
  "reference": "RECV-001"
}
```

**POST `/api/stock/outward`**
Remove stock from a bin (with negative stock prevention):
```json
{
  "product_id": 1,
  "bin_id": 1,
  "quantity": 10,
  "reference": "PICK-001"
}
```

**POST `/api/stock/transfer`**
Move stock between bins (atomic transaction):
```json
{
  "product_id": 1,
  "from_bin_id": 1,
  "to_bin_id": 2,
  "quantity": 5,
  "reference": "TRANS-001"
}
```

**GET `/api/stock/movements`**
View movement history (newest first):
```json
[
  {
    "id": 1,
    "product_id": 1,
    "movement_type": "INWARD",
    "quantity": 50,
    "from_bin_id": null,
    "to_bin_id": 1,
    "timestamp": "2026-08-28T...",
    "reference": "RECV-001"
  }
]
```

**GET `/api/low-stock`**
List items below threshold:
```json
[
  {
    "product_sku": "SKU002",
    "product_name": "Monitor",
    "bin_location_code": "B-001",
    "current_quantity": 5,
    "low_stock_threshold": 10
  }
]
```

## Key Features

✓ **Real-time Inventory Tracking** - Quantities updated immediately
✓ **Multi-bin Support** - Products can exist in multiple locations
✓ **Safe Stock Operations** - Prevents negative inventory
✓ **Atomic Transfers** - Database transaction ensures consistency
✓ **Complete Audit Trail** - All movements logged with references
✓ **Order Fulfillment** - Shows exact bin locations for picking
✓ **Dashboard Metrics** - Real-time KPIs
✓ **Search Capability** - Find products by SKU, name, or category

## Database Queries

The system uses SQLAlchemy ORM with these key queries:

### Get product locations and quantities
```python
inventories = db.query(Inventory).filter(
    Inventory.product_id == product_id
).all()
```

### Stock by warehouse/row
```python
stock_by_row = db.query(
    Row.name,
    func.sum(Inventory.quantity).label("quantity")
).join(Inventory.bin).join(Row).group_by(Row.id).all()
```

### Low stock items
```python
low_stock = db.query(Inventory).filter(
    Inventory.quantity <= Inventory.low_stock_threshold
).all()
```

## Testing

16 tests cover:
- ✓ Product search and filtering
- ✓ Order lookup with location details
- ✓ Inward stock receipt
- ✓ Outward stock removal
- ✓ Stock transfer between bins
- ✓ Negative inventory prevention
- ✓ Movement logging and retrieval
- ✓ Low stock identification
- ✓ Dashboard data accuracy

Run: `pytest backend/tests/test_api.py -v`

## Seed Data

The seed script generates:
- **1 Warehouse**: Main Warehouse
- **4 Rows**: ROW-A, ROW-B, ROW-C, ROW-D
- **12 Bins**: 3 bins per row with unique location codes
- **20 Products**: Mix of electronics and accessories
- **5 Orders**: With varied statuses (pending, processing, shipped, delivered)
- **~60 Inventory Records**: Products distributed across multiple bins
- **15 Stock Movements**: Inward receipts and internal transfers

All data is consistent and realistic for testing.

## Performance Notes

- SQLite handles ~1000 SKUs efficiently
- Indexes on product_id, bin_id for fast lookups
- Paging can be added for large result sets
- Database size: ~500KB for full seed data

## Future Enhancements

- Add pagination for large result sets
- Implement user authentication
- Add barcode scanning support
- Batch operations for bulk transfers
- Reorder point automation
- Multi-warehouse support at API level
- Cost tracking per inventory item
