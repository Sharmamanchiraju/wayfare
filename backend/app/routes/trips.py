from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.database import get_db
from app.db.models import User
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripWithMessagesResponse, MessageCreate, MessageResponse
from app.services import trip_service
from app.middleware.auth import get_current_user
from app.db.storage import PgIdempotency, IdempotencyConflict

router = APIRouter(prefix="/trips", tags=["trips"])

@router.post("/", response_model=TripResponse)
async def create_trip(
    trip_in: TripCreate,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if idempotency_key:
        idem = PgIdempotency(user_id=current_user.id, key=idempotency_key)
        try:
            cached_resp = await idem.claim()
            if cached_resp:
                return cached_resp
        except IdempotencyConflict as ic:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ic))

    try:
        new_trip = await trip_service.create_trip(db, current_user.id, trip_in)
        if idempotency_key:
            trip_dict = TripResponse.model_validate(new_trip).model_dump(mode="json")
            await idem.complete(trip_dict)
        return new_trip
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[TripResponse])
async def list_trips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await trip_service.get_trips(db, current_user.id)

@router.get("/{trip_id}", response_model=TripWithMessagesResponse)
async def get_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = await trip_service.get_trip_with_messages(db, trip_id, current_user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: int,
    trip_in: TripUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = await trip_service.get_trip(db, trip_id, current_user.id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return await trip_service.update_trip(db, db_trip, trip_in)

@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = await trip_service.get_trip(db, trip_id, current_user.id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    await trip_service.delete_trip(db, db_trip)

@router.post("/{trip_id}/messages", response_model=MessageResponse)
async def create_message(
    trip_id: int,
    message_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = await trip_service.get_trip(db, trip_id, current_user.id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    return await trip_service.create_message(db, trip_id, message_in)

@router.get("/{trip_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = await trip_service.get_trip(db, trip_id, current_user.id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    return await trip_service.get_messages(db, trip_id)


# --- Hardening updates support schemas ---
from pydantic import BaseModel
from typing import Optional, Any

class BudgetCategory(BaseModel):
    name: str
    amount: float

class BudgetUpdateRequest(BaseModel):
    categories: List[BudgetCategory]

class StopItem(BaseModel):
    id: str
    lat: float
    lng: float
    name: str
    note: Optional[str] = None
    img: Optional[str] = None

class RouteUpdateRequest(BaseModel):
    stops: List[StopItem]

class ApiResponseEnvelope(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[dict] = None

import httpx
async def calculate_osrm_route(stops: List[dict]) -> tuple:
    if len(stops) < 2:
        return 0.0, 0.0
    total_dist = 0.0
    total_dur = 0.0
    coords_str = ";".join([f"{s['lng']},{s['lat']}" for s in stops])
    url = f"https://router.project-osrm.org/route/v1/driving/{coords_str}?overview=false"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                routes = data.get("routes", [])
                if routes:
                    route = routes[0]
                    total_dist = route.get("distance", 0) / 1000.0
                    total_dur = route.get("duration", 0) / 3600.0
                    return round(total_dist, 1), round(total_dur, 2)
    except Exception:
        pass
    from app.services.flights import haversine
    for i in range(len(stops) - 1):
        d = haversine(stops[i]["lat"], stops[i]["lng"], stops[i+1]["lat"], stops[i+1]["lng"])
        total_dist += d
        total_dur += (d / 40.0)
    return round(total_dist, 1), round(total_dur, 2)

@router.put("/{trip_id}/budget", response_model=ApiResponseEnvelope)
async def update_trip_budget_breakdown(
    trip_id: int,
    budget_in: BudgetUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        db_trip = await trip_service.get_trip(db, trip_id, current_user.id)
        if not db_trip:
            return {
                "success": False,
                "data": None,
                "error": {"code": "NOT_FOUND", "message": "Trip not found"}
            }
        
        # Calculate sum from categories
        total_amount = sum(c.amount for c in budget_in.categories)
        
        # Update trip_data
        trip_data = dict(db_trip.trip_data) if db_trip.trip_data else {}
        
        # Keep consistent category list structure
        budget_list = [{"name": c.name, "amount": c.amount} for c in budget_in.categories]
        trip_data["budget_breakdown"] = budget_list
        trip_data["estimated_cost_local"] = total_amount
        
        db_trip.trip_data = trip_data
        db_trip.budget = float(total_amount)
        await db.commit()
        
        return {
            "success": True,
            "data": trip_data,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {"code": "INTERNAL_ERROR", "message": f"Server failed to update budget: {str(e)}"}
        }

@router.put("/{trip_id}/route", response_model=ApiResponseEnvelope)
async def update_trip_route_stops(
    trip_id: int,
    route_in: RouteUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        db_trip = await trip_service.get_trip(db, trip_id, current_user.id)
        if not db_trip:
            return {
                "success": False,
                "data": None,
                "error": {"code": "NOT_FOUND", "message": "Trip not found"}
            }
        
        # Calculate distance and duration from OSRM
        stops_dicts = [s.model_dump() for s in route_in.stops]
        dist_km, dur_hours = await calculate_osrm_route(stops_dicts)
        
        # Update trip_data
        trip_data = dict(db_trip.trip_data) if db_trip.trip_data else {}
        trip_data["stops"] = stops_dicts
        trip_data["distance_km"] = dist_km
        trip_data["duration_hours"] = dur_hours
        
        db_trip.trip_data = trip_data
        await db.commit()
        
        return {
            "success": True,
            "data": trip_data,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {"code": "INTERNAL_ERROR", "message": f"Server failed to update route: {str(e)}"}
        }
