import asyncio
import sys
import json
from unittest.mock import patch, AsyncMock

sys.path.append("/home/sharma/agent-project/backend")

from app.agent.trip_planner import TripPlannerAgent
from app.services.places import PlacesResult, Provenance
from langchain_core.messages import HumanMessage

async def mock_failed_find(*args, **kwargs):
    return PlacesResult(
        places=[],
        provenance=Provenance.NONE,
        notice="Couldn't load options right now. Tap to retry."
    )

async def test_offline_degradation():
    print("--- Running Offline Degradation Test: Overpass API Failure ---")
    
    agent = TripPlannerAgent()
    
    initial_state = {
        "messages": [HumanMessage(content="Yes, please! Generate my itinerary now.")],
        "user_id": 1,
        "conversation_id": "test-degradation-session",
        "ready_for_tools": True,
        "intent": "confirm_generation",
        "trip_state": {
            "destination": "Manali, India",
            "destination_verified": True,
            "destination_coords": {"lat": 32.2455, "lng": 77.1873},
            "origin_city": "Delhi, India",
            "trip_type": "domestic",
            "budget": 50000.0,
            "group_size": 2,
            "duration_days": 3,
            "status": "ready"
        }
    }
    
    with patch("app.services.places.PlacesService.find", side_effect=mock_failed_find):
        final_state = await agent.run_controller(initial_state)
        
    trip_data = final_state.get("trip_state", {})
    hotels = trip_data.get("recommended_hotels", [])
    
    print(f"Hotels returned under API failure: {hotels}")
    
    # Gate assertion: No fake hotels should be shipped when API fails
    assert len(hotels) == 0, f"FAILED: Invented hotels shipped under upstream failure: {hotels}"
    print("✓ DEGRADATION TEST PASSED: 0 invented hotels shipped under tool failure!")

if __name__ == "__main__":
    asyncio.run(test_offline_degradation())
