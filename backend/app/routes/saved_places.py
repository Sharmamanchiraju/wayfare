from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.db.models import User, SavedPlace
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/saved-places", tags=["saved-places"])

class SavedPlaceBase(BaseModel):
    place_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_type: Optional[str] = None
    notes: Optional[str] = None
    trip_id: Optional[int] = None

class SavedPlaceCreate(SavedPlaceBase):
    pass

class SavedPlaceResponse(SavedPlaceBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[SavedPlaceResponse])
async def list_saved_places(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(SavedPlace).filter(SavedPlace.user_id == current_user.id)
    )
    return result.scalars().all()

@router.post("/", response_model=SavedPlaceResponse)
async def create_saved_place(
    place_in: SavedPlaceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_place = SavedPlace(
        user_id=current_user.id,
        trip_id=place_in.trip_id,
        place_name=place_in.place_name,
        latitude=place_in.latitude,
        longitude=place_in.longitude,
        place_type=place_in.place_type,
        notes=place_in.notes
    )
    db.add(db_place)
    await db.commit()
    await db.refresh(db_place)
    return db_place

@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_place(
    place_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(SavedPlace).filter(SavedPlace.id == place_id, SavedPlace.user_id == current_user.id)
    )
    db_place = result.scalars().first()
    if not db_place:
        raise HTTPException(status_code=404, detail="Saved place not found")
        
    await db.delete(db_place)
    await db.commit()
