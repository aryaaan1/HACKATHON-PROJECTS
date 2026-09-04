from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProductBase(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    locations: List[dict] = []

    class Config:
        from_attributes = True

class WarehouseBase(BaseModel):
    name: str

class WarehouseResponse(WarehouseBase):
    id: int

    class Config:
        from_attributes = True

class RowBase(BaseModel):
    warehouse_id: int
    name: str

class RowResponse(RowBase):
    id: int

    class Config:
        from_attributes = True

class BinBase(BaseModel):
    row_id: int
    location_code: str

class BinResponse(BinBase):
    id: int

    class Config:
        from_attributes = True

class LocationResponse(BaseModel):
    warehouse_name: str
    row_name: str
    bin_location_code: str
    product_sku: str
    product_name: str
    quantity: int

class OrderItemRequest(BaseModel):
    product_id: int
    ordered_quantity: int

class OrderCreateRequest(BaseModel):
    order_number: str
    items: List[OrderItemRequest]

class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: str
    created_at: datetime
    items: List[dict] = []

    class Config:
        from_attributes = True

class StockInwardRequest(BaseModel):
    product_id: int
    bin_id: int
    quantity: int
    reference: Optional[str] = None

class StockOutwardRequest(BaseModel):
    product_id: int
    bin_id: int
    quantity: int
    reference: Optional[str] = None

class StockTransferRequest(BaseModel):
    product_id: int
    from_bin_id: int
    to_bin_id: int
    quantity: int
    reference: Optional[str] = None

class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    movement_type: str
    quantity: int
    from_bin_id: Optional[int] = None
    to_bin_id: Optional[int] = None
    timestamp: datetime
    reference: Optional[str] = None

    class Config:
        from_attributes = True

class LowStockItemResponse(BaseModel):
    product_id: int
    product_sku: str
    product_name: str
    bin_location_code: str
    current_quantity: int
    low_stock_threshold: int

class DashboardResponse(BaseModel):
    total_products: int
    total_stock: int
    low_stock_items: int
    total_rows: int
    recent_movements: List[StockMovementResponse] = []
    stock_by_row: List[dict] = []
