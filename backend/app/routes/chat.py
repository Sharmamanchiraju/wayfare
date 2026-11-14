from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.schemas.chat import ChatEndpointRequest, ChatEndpointResponse
from app.services.chat_service import ChatService
from app.middleware.auth import get_current_user
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/trips", tags=["chat"])

@router.post("/{trip_id}/chat", response_model=ChatEndpointResponse)
async def chat_with_trip_agent(
    trip_id: int, 
    request: ChatEndpointRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Interact with the Trip Planner Agent for a specific trip.
    """
    try:
        response = await ChatService.process_chat(
            db=db,
            user_id=current_user.id,
            trip_id=trip_id,
            message_content=request.message
        )
        return response
        
    except ValueError as e:
        if str(e) == "Trip not found":
            raise HTTPException(status_code=404, detail="Trip not found")
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error. Check logs for details.")

@router.post("/chat", response_model=ChatEndpointResponse)
async def chat_stateless(
    request: ChatEndpointRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stateless chat handler for slot-filling phase before Trip DB row creation.
    """
    try:
        response = await ChatService.process_chat_stateless(
            db=db,
            user_id=current_user.id,
            message_content=request.message,
            conversation_id=request.conversation_id,
            initial_trip_state=request.trip_state
        )
        return response
    except Exception as e:
        logger.error(f"Error processing stateless chat request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error.")
