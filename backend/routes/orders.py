from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Order, OrderItem, Inventory

router = APIRouter(prefix="/api", tags=["orders"])

@router.get("/orders/{order_number}")
def get_order(order_number: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_number == order_number).first()

    if not order:
        return {"error": f"Order {order_number} not found"}

    items = []
    for order_item in order.items:
        inventory = db.query(Inventory).filter(
            Inventory.product_id == order_item.product_id
        ).first()

        item_info = {
            "product_id": order_item.product_id,
            "product_sku": order_item.product.sku,
            "product_name": order_item.product.name,
            "ordered_quantity": order_item.ordered_quantity,
            "location": None
        }

        if inventory and inventory.bin:
            item_info["location"] = {
                "warehouse": inventory.bin.row.warehouse.name,
                "row": inventory.bin.row.name,
                "bin": inventory.bin.location_code,
                "available_quantity": inventory.quantity
            }

        items.append(item_info)

    return {
        "order_number": order.order_number,
        "status": order.status,
        "created_at": order.created_at,
        "items": items
    }
