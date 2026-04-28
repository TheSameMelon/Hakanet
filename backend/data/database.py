from sqlmodel import create_engine, SQLModel
import csv
from sqlalchemy import event

engine = create_engine(
    "sqlite:///data/data.db",
    connect_args={"check_same_thread": False}
)

@event.listens_for(engine, "connect")
def enable_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA foreign_keys")
    result = cursor.fetchone()
    print(f"FOREIGN KEYS: {'ON' if result[0] else 'OFF'}")
    cursor.close()