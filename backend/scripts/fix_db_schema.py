import asyncio
import sys
import os
from sqlalchemy import text

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine

async def fix_schema():
    async with engine.begin() as conn:
        print("Executing ALTER TABLE to drop NOT NULL constraint...")
        try:
            await conn.execute(text("ALTER TABLE assessment_sessions ALTER COLUMN user_id DROP NOT NULL;"))
            print("Constraint dropped successfully.")
        except Exception as e:
            print(f"Error executing ALTER TABLE: {e}")

if __name__ == "__main__":
    asyncio.run(fix_schema())
