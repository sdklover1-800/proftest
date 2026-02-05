from sqlalchemy import create_engine
import sys

from app.core.config import settings
from app.db.base import Base
import app.models  # noqa: F401


def create_tables():
    engine = create_engine(settings.SYNC_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("Tables created or already exist.")


if __name__ == "__main__":
    try:
        create_tables()
    except Exception as e:
        print("Error creating tables:", e)
        sys.exit(1)
