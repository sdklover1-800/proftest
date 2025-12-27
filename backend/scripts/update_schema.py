import asyncio
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine
from app.db.base import Base
from app.models.assessment import AssessmentSession, UserResponse
from sqlalchemy import text

async def reset_tables():
    async with engine.begin() as conn:
        print("Dropping tables...")
        # We use CASCADE to handle foreign keys
        await conn.execute(text("DROP TABLE IF EXISTS user_responses CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS assessment_sessions CASCADE"))
        print("Tables dropped.")
        
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created.")

if __name__ == "__main__":
    asyncio.run(reset_tables())
