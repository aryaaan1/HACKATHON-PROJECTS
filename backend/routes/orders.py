from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.auth import get_current_user, require_admin, CurrentUser
from backend.database import get_db
from backend.models import Order, OrderItem, Inventory, Product
from backend.schemas import OrderCreateRequest

router = APIRouter(prefix="/api", tags=["orders"])

@router.post("/orders", status_code=201)
def create_order(
    request: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    existing = db.query(Order).filter(Order.order_number == request.order_number).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Order {request.order_number} already exists"
        )

    if not request.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    product_ids = [item.product_id for item in request.items]
    found_ids = {
        p.id for p in db.query(Product.id).filter(Product.id.in_(product_ids)).all()
    }
    missing_ids = sorted(set(product_ids) - found_ids)
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid product_id(s): {missing_ids}"
        )

    order = Order(order_number=request.order_number)
    db.add(order)
    db.flush()

    for item in request.items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            ordered_quantity=item.ordered_quantity
        ))

    db.commit()

    return {
        "status": "success",
        "message": f"Order {order.order_number} created",
        "order_number": order.order_number,
        "id": order.id
    }

@router.get("/orders/{order_number}")
def get_order(
    order_number: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
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
