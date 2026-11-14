from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PersonaBase(BaseModel):
    name: str = Field(..., max_length=255)
    travel_style: Optional[str] = Field(None, max_length=255)
    budget_min: Optional[int] = Field(None)
    budget_max: Optional[int] = Field(None)
    trip_duration: Optional[int] = Field(None)
    description: Optional[str] = Field(None)
    preferred_destination: Optional[str] = Field(None, max_length=255)

class PersonaCreate(PersonaBase):
    pass

class PersonaUpdate(PersonaBase):
    name: Optional[str] = Field(None, max_length=255)

class PersonaResponse(PersonaBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
