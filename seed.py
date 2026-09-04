import sys
import typing
typing.TypingOnly = object

from backend.database import SessionLocal, init_db
from backend.models import (
    Warehouse, Row, Bin, Product, Inventory, Order, OrderItem, StockMovement
)
from backend.seed_data import populate_demo_data

def seed_database():
    """Destructive full reseed: wipes existing data and inserts fresh demo data.

    Intended for manual local use (`python seed.py`) only. The application
    itself never calls this on startup — see backend.seed_data.seed_if_empty
    for the safe, automatic initialization used at process start.
    """
    init_db()
    db = SessionLocal()

    try:
        db.query(Warehouse).delete()
        db.query(Row).delete()
        db.query(Bin).delete()
        db.query(Product).delete()
        db.query(Inventory).delete()
        db.query(Order).delete()
        db.query(OrderItem).delete()
        db.query(StockMovement).delete()
        db.commit()

        populate_demo_data(db)

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
