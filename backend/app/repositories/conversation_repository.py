from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import ChatSession, Message
from app.core.logger import get_logger

logger = get_logger(__name__)

class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_session(self, session_id: int) -> Optional[ChatSession]:
        logger.debug(f"Fetching chat session {session_id}")
        session = await self.db.get(ChatSession, session_id)
        return session

    async def create_session(self, user_id: int, title: str = "Trip Plan") -> ChatSession:
        logger.info(f"Creating new chat session for user {user_id}")
        session = ChatSession(user_id=user_id, title=title)
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_messages_for_session(self, session_id: int) -> List[Message]:
        logger.debug(f"Fetching messages for session {session_id}")
        result = await self.db.execute(
            select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())
        )
        return list(result.scalars().all())

    async def save_message(self, session_id: int, role: str, content: str) -> Message:
        logger.debug(f"Saving {role} message for session {session_id}")
        msg = Message(session_id=session_id, role=role, content=content)
        self.db.add(msg)
        await self.db.commit()
        await self.db.refresh(msg)
        return msg
