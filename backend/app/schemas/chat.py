from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class ChatEndpointRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    trip_state: Optional[Dict[str, Any]] = None

class ChatEndpointResponse(BaseModel):
    success: bool = True
    response: str
    trip_data: Optional[Dict[str, Any]] = None
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    message_id: Optional[int] = None
    conversation_id: Optional[str] = None
    ready: Optional[bool] = False
    trip_id: Optional[int] = None
