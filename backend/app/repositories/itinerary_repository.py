from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import Itinerary
from app.core.logger import get_logger

logger = get_logger(__name__)

class ItineraryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_itinerary_by_session(self, session_id: int) -> Optional[Itinerary]:
        logger.debug(f"Fetching itinerary for session {session_id}")
        result = await self.db.execute(select(Itinerary).where(Itinerary.session_id == session_id))
        return result.scalar_one_or_none()

    async def save_or_update_itinerary(self, session_id: int, structured_data: Dict[str, Any]) -> Itinerary:
        existing_itinerary = await self.get_itinerary_by_session(session_id)
        
        if existing_itinerary:
            logger.info(f"Updating existing itinerary for session {session_id}")
            existing_itinerary.structured_data = structured_data
            itinerary = existing_itinerary
        else:
            logger.info(f"Creating new itinerary for session {session_id}")
            itinerary = Itinerary(session_id=session_id, structured_data=structured_data)
            self.db.add(itinerary)
            
        await self.db.commit()
        await self.db.refresh(itinerary)
        return itinerary
