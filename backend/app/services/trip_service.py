from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid

from app.db.models import Trip, Message, Persona
from app.schemas.trip import TripCreate, TripUpdate, MessageCreate

async def create_trip(db: AsyncSession, user_id: int, trip_in: TripCreate) -> Trip:
    from datetime import datetime, timedelta
    from app.core.logger import get_logger
    
    local_logger = get_logger(__name__)
    ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)
    
    existing_trip = None
    if trip_in.destination:
        # Check for duplicate draft trip to same destination in the last 10 minutes to reuse
        result = await db.execute(
            select(Trip)
            .options(selectinload(Trip.persona))
            .filter(
                Trip.user_id == user_id,
                Trip.destination.ilike(trip_in.destination),
                Trip.status.in_(["draft", "planning", "draft_trip"]),
                Trip.created_at >= ten_mins_ago
            )
            .order_by(Trip.created_at.desc())
        )
        existing_trip = result.scalars().first()
        if existing_trip:
            local_logger.info(f"Reusing existing draft trip ID {existing_trip.id} instead of inserting a new one.")
            existing_trip.start_date = trip_in.start_date
            existing_trip.end_date = trip_in.end_date
            if trip_in.budget is not None:
                existing_trip.budget = trip_in.budget
            await db.commit()
            return existing_trip

    # Auto-generate a unique conversation_id (thread_id for LangGraph)
    conversation_id = str(uuid.uuid4())
    
    # Pre-fill budget if persona is provided and budget is not
    budget = trip_in.budget
    if trip_in.persona_id and budget is None:
        result = await db.execute(select(Persona).filter(Persona.id == trip_in.persona_id, Persona.user_id == user_id))
        persona = result.scalars().first()
        if persona and persona.budget_max:
            budget = float(persona.budget_max)
            
    trip_data = {}
    if trip_in.travelers:
        trip_data["travelers"] = trip_in.travelers
    if trip_in.interests:
        trip_data["interests"] = trip_in.interests

    db_trip = Trip(
        destination=trip_in.destination,
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        budget=budget,
        status=trip_in.status,
        persona_id=trip_in.persona_id,
        user_id=user_id,
        conversation_id=conversation_id,
        trip_data=trip_data
    )
    db.add(db_trip)
    await db.commit()
    await db.refresh(db_trip)

    # Save the first welcome message in the database
    from app.db.models import User
    user_res = await db.execute(select(User).filter(User.id == user_id))
    user_obj = user_res.scalars().first()
    username = user_obj.username.split(" ")[0] if user_obj else "Traveler"
    
    welcome_content = f"Hello {username}! I'm TripPlanner, your AI travel expert. Where would you like to go?"
    db_msg = Message(
        trip_id=db_trip.id,
        role="assistant",
        content=welcome_content
    )
    db.add(db_msg)
    await db.commit()

    # Re-fetch with persona loaded to prevent MissingGreenlet in Pydantic serialization
    result = await db.execute(
        select(Trip).options(selectinload(Trip.persona)).filter(Trip.id == db_trip.id)
    )
    return result.scalars().first()

async def get_trips(db: AsyncSession, user_id: int) -> List[Trip]:
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.persona))
        .filter(Trip.user_id == user_id)
        .order_by(Trip.updated_at.desc())
    )
    return result.scalars().all()

async def get_trip_with_messages(db: AsyncSession, trip_id: int, user_id: int) -> Optional[Trip]:
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.messages))
        .options(selectinload(Trip.persona))
        .filter(Trip.id == trip_id, Trip.user_id == user_id)
    )
    return result.scalars().first()

async def get_trip(db: AsyncSession, trip_id: int, user_id: int) -> Optional[Trip]:
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.persona))
        .filter(Trip.id == trip_id, Trip.user_id == user_id)
    )
    return result.scalars().first()

async def update_trip(db: AsyncSession, db_trip: Trip, trip_in: TripUpdate) -> Trip:
    update_data = trip_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_trip, field, value)
    await db.commit()
    await db.refresh(db_trip)
    return db_trip

async def delete_trip(db: AsyncSession, db_trip: Trip) -> None:
    await db.delete(db_trip)
    await db.commit()

async def create_message(db: AsyncSession, trip_id: int, message_in: MessageCreate) -> Message:
    db_message = Message(
        trip_id=trip_id,
        role=message_in.role,
        content=message_in.content,
        tool_calls=message_in.tool_calls
    )
    db.add(db_message)
    
    # Update trip updated_at
    result = await db.execute(select(Trip).filter(Trip.id == trip_id))
    trip = result.scalars().first()
    if trip:
        from datetime import datetime
        trip.updated_at = datetime.utcnow()
        
    await db.commit()
    await db.refresh(db_message)
    return db_message

async def get_messages(db: AsyncSession, trip_id: int) -> List[Message]:
    result = await db.execute(
        select(Message)
        .filter(Message.trip_id == trip_id)
        .order_by(Message.created_at.asc())
    )
    return result.scalars().all()
