import asyncio
import os
import sys

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.security import get_password_hash
from app.db.session import engine
from app.models.user import User


async def create_superuser():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if user exists
        from sqlalchemy import select

        result = await session.execute(
            select(User).where(User.email == "admin@example.com")
        )
        user = result.scalars().first()

        if user:
            print("Superuser user already exists.")
            return

        print("Creating superuser...")
        hashed_password = get_password_hash("admin")
        user = User(
            email="admin@example.com",
            hashed_password=hashed_password,
            is_superuser=True,
            age=30,
        )
        session.add(user)
        await session.commit()
        print("Superuser created successfully.")
        print("Email: admin@example.com")
        print("Password: admin")


if __name__ == "__main__":
    asyncio.run(create_superuser())
