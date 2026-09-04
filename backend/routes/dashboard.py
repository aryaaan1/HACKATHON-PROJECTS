from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.auth import get_current_user, CurrentUser
from backend.database import get_db
from backend.models import Product, Inventory, StockMovement, Row
from backend.schemas import DashboardResponse, StockMovementResponse

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_stock = db.query(func.sum(Inventory.quantity)).scalar() or 0
    low_stock_items = db.query(func.count(Inventory.id)).filter(
        Inventory.quantity <= Inventory.low_stock_threshold
    ).scalar() or 0
    total_rows = db.query(func.count(Row.id)).scalar() or 0

    recent_movements = db.query(StockMovement).order_by(
        StockMovement.timestamp.desc()
    ).limit(10).all()

    stock_by_row = db.query(
        Row.name,
        func.sum(Inventory.quantity).label("quantity")
    ).join(
        Inventory.bin
    ).join(
        Row
    ).group_by(Row.id, Row.name).all()

    stock_by_row_data = [
        {"row_name": row[0], "quantity": row[1]} for row in stock_by_row
    ]

    return DashboardResponse(
        total_products=total_products,
        total_stock=total_stock,
        low_stock_items=low_stock_items,
        total_rows=total_rows,
        recent_movements=[
            StockMovementResponse.from_orm(m) for m in recent_movements
        ],
        stock_by_row=stock_by_row_data
    )
