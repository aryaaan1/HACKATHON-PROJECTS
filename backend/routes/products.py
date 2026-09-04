from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Product, Inventory
from backend.schemas import ProductResponse

router = APIRouter(prefix="/api", tags=["products"])

@router.get("/products", response_model=list[ProductResponse])
def search_products(search: str = Query(None), db: Session = Depends(get_db)):
    query = db.query(Product)

    if search:
        query = query.filter(
            (Product.sku.ilike(f"%{search}%")) |
            (Product.name.ilike(f"%{search}%")) |
            (Product.category.ilike(f"%{search}%"))
        )

    products = query.all()

    result = []
    for product in products:
        inventories = db.query(Inventory).filter(
            Inventory.product_id == product.id
        ).all()

        locations = []
        for inv in inventories:
            if inv.bin:
                row = inv.bin.row
                warehouse = row.warehouse
                locations.append({
                    "warehouse": warehouse.name,
                    "row": row.name,
                    "bin_location": inv.bin.location_code,
                    "quantity": inv.quantity
                })

        product_response = ProductResponse(
            id=product.id,
            sku=product.sku,
            name=product.name,
            category=product.category,
            locations=locations
        )
        result.append(product_response)

    return result

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        return {"error": "Product not found"}

    inventories = db.query(Inventory).filter(
        Inventory.product_id == product.id
    ).all()

    locations = []
    for inv in inventories:
        if inv.bin:
            row = inv.bin.row
            warehouse = row.warehouse
            locations.append({
                "warehouse": warehouse.name,
                "row": row.name,
                "bin_location": inv.bin.location_code,
                "quantity": inv.quantity
            })

    return ProductResponse(
        id=product.id,
        sku=product.sku,
        name=product.name,
        category=product.category,
        locations=locations
    )
