import os
import sys
import typing
typing.TypingOnly = object
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLITE_DB_PATH lets a deployed environment point at a persistent disk
# (e.g. "/var/data/inventory.db" on Render) instead of the repo-relative
# default used for local development.
SQLITE_DB_PATH = os.environ.get("SQLITE_DB_PATH", "./inventory.db")
DATABASE_URL = f"sqlite:///{SQLITE_DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
