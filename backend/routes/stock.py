from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.auth import get_current_user, require_admin, CurrentUser
from backend.database import get_db
from backend.models import Inventory, StockMovement, Product
from backend.schemas import (
    StockInwardRequest, StockOutwardRequest, StockTransferRequest,
    StockMovementResponse
)

router = APIRouter(prefix="/api", tags=["stock"])

@router.post("/stock/inward")
def stock_inward(
    request: StockInwardRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    inventory = db.query(Inventory).filter(
        (Inventory.product_id == request.product_id) &
        (Inventory.bin_id == request.bin_id)
    ).first()

    if not inventory:
        inventory = Inventory(
            product_id=request.product_id,
            bin_id=request.bin_id,
            quantity=0
        )
        db.add(inventory)

    inventory.quantity += request.quantity

    movement = StockMovement(
        product_id=request.product_id,
        movement_type="INWARD",
        quantity=request.quantity,
        to_bin_id=request.bin_id,
        reference=request.reference
    )
    db.add(movement)
    db.commit()

    return {
        "status": "success",
        "message": f"Added {request.quantity} units to bin {request.bin_id}",
        "new_quantity": inventory.quantity
    }

@router.post("/stock/outward")
def stock_outward(
    request: StockOutwardRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    inventory = db.query(Inventory).filter(
        (Inventory.product_id == request.product_id) &
        (Inventory.bin_id == request.bin_id)
    ).first()

    if not inventory:
        raise HTTPException(status_code=400, detail="Product not found in bin")

    if inventory.quantity < request.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {inventory.quantity}"
        )

    inventory.quantity -= request.quantity

    movement = StockMovement(
        product_id=request.product_id,
        movement_type="OUTWARD",
        quantity=request.quantity,
        from_bin_id=request.bin_id,
        reference=request.reference
    )
    db.add(movement)
    db.commit()

    return {
        "status": "success",
        "message": f"Removed {request.quantity} units from bin {request.bin_id}",
        "new_quantity": inventory.quantity
    }

@router.post("/stock/transfer")
def stock_transfer(
    request: StockTransferRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    from_inventory = db.query(Inventory).filter(
        (Inventory.product_id == request.product_id) &
        (Inventory.bin_id == request.from_bin_id)
    ).first()

    if not from_inventory:
        raise HTTPException(status_code=400, detail="Product not found in source bin")

    if from_inventory.quantity < request.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {from_inventory.quantity}"
        )

    to_inventory = db.query(Inventory).filter(
        (Inventory.product_id == request.product_id) &
        (Inventory.bin_id == request.to_bin_id)
    ).first()

    if not to_inventory:
        to_inventory = Inventory(
            product_id=request.product_id,
            bin_id=request.to_bin_id,
            quantity=0
        )
        db.add(to_inventory)

    from_inventory.quantity -= request.quantity
    to_inventory.quantity += request.quantity

    movement = StockMovement(
        product_id=request.product_id,
        movement_type="TRANSFER",
        quantity=request.quantity,
        from_bin_id=request.from_bin_id,
        to_bin_id=request.to_bin_id,
        reference=request.reference
    )
    db.add(movement)
    db.commit()

    return {
        "status": "success",
        "message": f"Transferred {request.quantity} units from bin {request.from_bin_id} to bin {request.to_bin_id}",
        "from_quantity": from_inventory.quantity,
        "to_quantity": to_inventory.quantity
    }

@router.get("/stock/movements", response_model=list[StockMovementResponse])
def get_movements(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    movements = db.query(StockMovement).order_by(
        StockMovement.timestamp.desc()
    ).all()
    return [StockMovementResponse.from_orm(m) for m in movements]

@router.get("/low-stock")
def get_low_stock(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    low_stock_items = db.query(Inventory).filter(
        Inventory.quantity <= Inventory.low_stock_threshold
    ).all()

    items = []
    for inv in low_stock_items:
        items.append({
            "product_id": inv.product.id,
            "product_sku": inv.product.sku,
            "product_name": inv.product.name,
            "bin_location_code": inv.bin.location_code,
            "current_quantity": inv.quantity,
            "low_stock_threshold": inv.low_stock_threshold
        })

    return items
