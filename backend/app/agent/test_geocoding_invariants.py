import asyncio
import sys
import json

sys.path.append("/home/sharma/agent-project/backend")

from app.agent.trip_planner import TripPlannerAgent
from langchain_core.messages import HumanMessage

async def run_state_test(destination: str, origin: str, budget: str, message: str) -> tuple:
    print(f"\n--- Testing state flow for: Destination={repr(destination)} ---")
    agent = TripPlannerAgent(memory_messages=[])
    
    initial_state = {
        "messages": [],
        "user_id": 1,
        "conversation_id": f"test-invariant-{destination.lower().replace(' ', '-')}",
        "ready_for_tools": False,
        "trip_state": {
            "destination": destination,
            "origin_city": origin,
            "trip_type": "domestic",
            "budget": budget,
            "group_size": 2,
            "duration_days": 3
        }
    }
    
    config = {"configurable": {"thread_id": f"test-invariant-{destination.lower().replace(' ', '-')}"}}
    agent.graph.update_state(config, initial_state)
    
    # Trigger turn
    final_state = await agent.graph.ainvoke(
        {"messages": [HumanMessage(content=message)]},
        config=config
    )
    
    trip_data = final_state.get("trip_state", {})
    last_response = ""
    for msg in reversed(final_state.get("messages", [])):
        if msg.content:
            last_response = msg.content
            break
            
    return trip_data, last_response

async def main():
    try:
        # Case 1: Clean Valid Destination (Manali) -> Should verify and generate
        print("Running Case 1: Clean Valid Destination...")
        manali_data, manali_resp = await run_state_test("Manali", "Delhi", "₹50,000", "Yes, please! Generate my itinerary now.")
        assert manali_data.get("destination_verified") is True, "Manali geocode verification failed!"
        assert manali_data.get("itinerary") is not None, "Manali itinerary generation failed!"
        assert manali_data.get("status") == "generated", "Manali status is not 'generated'!"
        print("✓ Case 1 passed successfully!")

        # Case 2: Messy but extractable Destination (hello  manali) -> Should clean, verify, and generate
        print("\nRunning Case 2: Messy but Extractable Destination...")
        messy_data, messy_resp = await run_state_test("hello  manali", "Delhi", "₹50,000", "Yes, please! Generate my itinerary now.")
        assert messy_data.get("destination_verified") is True, "hello manali geocode verification failed!"
        assert "Manali" in messy_data.get("destination"), f"Destination was not cleaned correctly: {messy_data.get('destination')}"
        assert messy_data.get("itinerary") is not None, "hello manali itinerary generation failed!"
        assert messy_data.get("status") == "generated", "hello manali status is not 'generated'!"
        print("✓ Case 2 passed successfully!")

        # Case 3: Deliberately Messy Unresolvable Destination -> Should fail verification, halt generation, ask to clarify
        print("\nRunning Case 3: Deliberately Unresolvable Destination...")
        bad_data, bad_resp = await run_state_test("invalid_city_name_xyz_123", "Delhi", "₹50,000", "Yes, please! Generate my itinerary now.")
        assert bad_data.get("destination_verified") is False, "Invalid city was incorrectly verified!"
        assert bad_data.get("itinerary") is None, "Invalid city itinerary was generated!"
        assert bad_data.get("status") == "collecting", "Invalid city status is not 'collecting'!"
        assert "itinerary is ready" not in bad_resp.lower(), "Unsaved plan was conversationalized to the user!"
        print("✓ Case 3 passed successfully!")

        print("\nALL INVARIANT VERIFICATION TESTS PASSED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"\n❌ INVARIANT VERIFICATION TEST FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
