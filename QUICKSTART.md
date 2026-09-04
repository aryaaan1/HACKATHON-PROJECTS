# Quick Start

## 30-Second Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create database with test data
python seed.py

# 3. Start server
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at: **http://localhost:8000**

## Test It Immediately

### In Browser
- Dashboard: http://localhost:8000/docs
- API Docs: http://localhost:8000/docs (interactive Swagger UI)

### In Terminal
```bash
# Get dashboard metrics
curl http://localhost:8000/api/dashboard

# Search products
curl http://localhost:8000/api/products?search=laptop

# Look up order with pick locations
curl http://localhost:8000/api/orders/ORD-001

# Add stock
curl -X POST http://localhost:8000/api/stock/inward \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"bin_id":1,"quantity":50,"reference":"RECV-001"}'

# View stock movements
curl http://localhost:8000/api/stock/movements
```

## Run Tests
```bash
pytest backend/tests/test_api.py -v
```
All 16 tests pass (product search, order lookup, stock operations, etc.)

## What's Included

✓ **FastAPI Backend** - Production-ready REST API
✓ **SQLite Database** - Persistent data storage
✓ **SQLAlchemy ORM** - Database models
✓ **20 Test Products** - With realistic quantities
✓ **5 Sample Orders** - For fulfillment testing
✓ **16 Unit Tests** - All passing
✓ **Seed Script** - Generate consistent test data
✓ **Stock Audit Trail** - Complete movement logging

## Database Schema

- **Warehouse** (1 main warehouse)
- **Row** (4 rows: ROW-A to ROW-D)
- **Bin** (12 bins: A-001 to D-003)
- **Product** (20 SKUs)
- **Inventory** (stock per product per bin)
- **Order** (5 sample orders)
- **OrderItem** (items in orders)
- **StockMovement** (audit log)

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard` | GET | Real-time metrics |
| `/api/products` | GET | Search products |
| `/api/products/{id}` | GET | Product with locations |
| `/api/locations` | GET | All inventory locations |
| `/api/orders/{order_num}` | GET | Order with pick locations |
| `/api/stock/inward` | POST | Receive stock |
| `/api/stock/outward` | POST | Remove stock |
| `/api/stock/transfer` | POST | Move between bins |
| `/api/stock/movements` | GET | Audit trail |
| `/api/low-stock` | GET | Below-threshold items |

## Ready to Scale

Later, to expand seed data to 500-1000 SKUs:
Edit `seed.py` - increase the products list and it will auto-generate realistic quantities and distribute across bins.

## Next Steps

1. ✓ Backend running
2. ✓ Database seeded
3. ✓ Tests passing
4. Ready to connect frontend!
