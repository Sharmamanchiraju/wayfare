from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import User
from app.core.logger import get_logger

logger = get_logger(__name__)

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user(self, user_id: int) -> Optional[User]:
        logger.debug(f"Fetching user with ID {user_id}")
        user = await self.db.get(User, user_id)
        return user

    async def create_user(self, user_id: int, username: str) -> User:
        logger.info(f"Creating new user: {username} ({user_id})")
        user = User(id=user_id, username=username)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
