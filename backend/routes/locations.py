from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.auth import get_current_user, CurrentUser
from backend.database import get_db
from backend.models import Inventory
from backend.schemas import LocationResponse

router = APIRouter(prefix="/api", tags=["locations"])

@router.get("/locations", response_model=list[LocationResponse])
def get_locations(db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    inventories = db.query(Inventory).filter(Inventory.quantity > 0).all()

    locations = []
    for inv in inventories:
        location = LocationResponse(
            warehouse_name=inv.bin.row.warehouse.name,
            row_name=inv.bin.row.name,
            bin_location_code=inv.bin.location_code,
            product_sku=inv.product.sku,
            product_name=inv.product.name,
            quantity=inv.quantity
        )
        locations.append(location)

    return locations
