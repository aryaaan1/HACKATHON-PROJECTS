from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    rows = relationship("Row", back_populates="warehouse", cascade="all, delete-orphan")

class Row(Base):
    __tablename__ = "rows"

    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    name = Column(String, nullable=False)

    warehouse = relationship("Warehouse", back_populates="rows")
    bins = relationship("Bin", back_populates="row", cascade="all, delete-orphan")

class Bin(Base):
    __tablename__ = "bins"

    id = Column(Integer, primary_key=True)
    row_id = Column(Integer, ForeignKey("rows.id"), nullable=False)
    location_code = Column(String, unique=True, nullable=False)

    row = relationship("Row", back_populates="bins")
    inventories = relationship("Inventory", back_populates="bin", cascade="all, delete-orphan")
    outbound_movements = relationship("StockMovement", foreign_keys="StockMovement.from_bin_id", back_populates="from_bin")
    inbound_movements = relationship("StockMovement", foreign_keys="StockMovement.to_bin_id", back_populates="to_bin")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    sku = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)

    inventories = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product", cascade="all, delete-orphan")
    movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    bin_id = Column(Integer, ForeignKey("bins.id"), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)

    product = relationship("Product", back_populates="inventories")
    bin = relationship("Bin", back_populates="inventories")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    order_number = Column(String, unique=True, nullable=False)
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    ordered_quantity = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    movement_type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    from_bin_id = Column(Integer, ForeignKey("bins.id"), nullable=True)
    to_bin_id = Column(Integer, ForeignKey("bins.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    reference = Column(String, nullable=True)

    product = relationship("Product", back_populates="movements")
    from_bin = relationship("Bin", foreign_keys=[from_bin_id], back_populates="outbound_movements")
    to_bin = relationship("Bin", foreign_keys=[to_bin_id], back_populates="inbound_movements")
