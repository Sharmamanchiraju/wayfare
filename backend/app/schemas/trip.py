from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

class TripBase(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    status: Optional[str] = "planning"

class TripCreate(TripBase):
    persona_id: Optional[int] = None
    travelers: Optional[str] = None
    interests: Optional[List[str]] = None

class TripUpdate(TripBase):
    persona_id: Optional[int] = None

class PersonaSummary(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class TripResponse(TripBase):
    id: int
    user_id: int
    persona_id: Optional[int] = None
    conversation_id: str
    trip_data: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    persona: Optional[PersonaSummary] = None
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    role: str
    content: str
    tool_calls: Optional[dict] = None

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    tool_calls: Optional[dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TripWithMessagesResponse(TripResponse):
    messages: List[MessageResponse] = []
