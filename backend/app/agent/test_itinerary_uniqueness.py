import asyncio
import sys
import json

sys.path.append("/home/sharma/agent-project/backend")

from app.agent.trip_planner import TripPlannerAgent
from langchain_core.messages import HumanMessage

async def generate_mock_trip(destination: str, origin: str, budget: str) -> dict:
    print(f"\n--- Testing Generation for: {destination} ---")
    agent = TripPlannerAgent(memory_messages=[])
    
    # We pre-fill all required slots in trip_state so it goes straight to planning
    initial_state = {
        "messages": [],
        "user_id": 1,
        "conversation_id": f"test-{destination.lower()}",
        "ready_for_tools": True,
        "intent": "generate_new",
        "trip_state": {
            "destination": destination,
            "origin_city": origin,
            "trip_type": "international" if destination != "Goa" else "domestic",
            "budget": budget,
            "group_size": 2,
            "duration_days": 3
        }
    }
    
    config = {"configurable": {"thread_id": f"test-{destination.lower()}"}}
    agent.graph.update_state(config, initial_state)
    
    # Trigger final planning turn
    final_state = await agent.graph.ainvoke(
        {"messages": [HumanMessage(content="Yes, please! Generate my itinerary now.")]},
        config=config
    )
    
    trip_data = final_state.get("trip_state", {})
    return trip_data

async def main():
    try:
        tokyo_data = await generate_mock_trip("Tokyo", "Delhi", "$3000")
        goa_data = await generate_mock_trip("Goa", "Mumbai", "₹30,000")
        paris_data = await generate_mock_trip("Paris", "New York", "$4000")
        
        # 1. Assertions on success
        assert tokyo_data.get("itinerary") is not None, "Tokyo itinerary generation failed!"
        assert goa_data.get("itinerary") is not None, "Goa itinerary generation failed!"
        assert paris_data.get("itinerary") is not None, "Paris itinerary generation failed!"
        
        # Verify days array and real content immediately after generation
        assert isinstance(tokyo_data.get("days"), list) and len(tokyo_data["days"]) == 3, "Tokyo days array should be 3!"
        assert isinstance(goa_data.get("days"), list) and len(goa_data["days"]) == 3, "Goa days array should be 3!"
        assert isinstance(paris_data.get("days"), list) and len(paris_data["days"]) == 3, "Paris days array should be 3!"
        
        for name, data in [("Tokyo", tokyo_data), ("Goa", goa_data), ("Paris", paris_data)]:
            cost_bd = data.get("costBreakdown")
            assert cost_bd is not None, f"{name} cost breakdown is missing!"
            assert cost_bd.get("total") is not None and cost_bd["total"] > 0, f"{name} cost breakdown total should be > 0!"
            
            for i, day in enumerate(data["days"]):
                assert day.get("day") == i + 1, f"{name} Day {i+1} day number mismatch!"
                assert len(day.get("title", "")) > 0, f"{name} Day {i+1} title is empty!"
                assert len(day.get("desc", "")) > 0, f"{name} Day {i+1} description is empty!"
                assert isinstance(day.get("stops"), list) and len(day["stops"]) > 0, f"{name} Day {i+1} stops are empty!"
                for s_idx, stop in enumerate(day["stops"]):
                    assert len(stop.get("title", "")) > 0, f"{name} Day {i+1} Stop {s_idx+1} title is empty!"
                    assert len(stop.get("desc", "")) > 0, f"{name} Day {i+1} Stop {s_idx+1} description is empty!"
                    assert stop.get("type") in ["hotel", "adventure", "food", "sightseeing", "exploration", "entertainment"], f"{name} Day {i+1} Stop {s_idx+1} invalid type {stop.get('type')}!"
        
        tokyo_itinerary = tokyo_data["itinerary"]
        goa_itinerary = goa_data["itinerary"]
        paris_itinerary = paris_data["itinerary"]
        
        print("\n--- TOKYO GENERATED ITINERARY ---")
        print(json.dumps(tokyo_itinerary, indent=2, ensure_ascii=False))
        
        print("\n--- GOA GENERATED ITINERARY ---")
        print(json.dumps(goa_itinerary, indent=2, ensure_ascii=False))
        
        print("\n--- PARIS GENERATED ITINERARY ---")
        print(json.dumps(paris_itinerary, indent=2, ensure_ascii=False))
        
        print("\n--- ASSERTION CHECKS ---")
        
        tokyo_str = json.dumps(tokyo_itinerary).lower()
        goa_str = json.dumps(goa_itinerary).lower()
        paris_str = json.dumps(paris_itinerary).lower()
        
        # 2. Assert distinct destinations and place references
        assert any(x in tokyo_str for x in ["tokyo", "japan", "shinjuku", "shibuya", "temple", "sushi", "日本", "東京都"]), "Tokyo elements not found!"
        assert any(x in goa_str for x in ["goa", "beach", "sea", "fort", "panaji"]), "Goa elements not found!"
        assert any(x in paris_str for x in ["paris", "france", "eiffel", "louvre", "seine", "museum"]), "Paris elements not found!"
        
        # Cross-contamination checks
        assert "eiffel" not in tokyo_str, "Tokyo itinerary contains Paris landmarks!"
        assert "solang" not in tokyo_str, "Tokyo itinerary contains Manali landmarks!"
        assert "sensoji" not in goa_str, "Goa itinerary contains Tokyo landmarks!"
        
        print("✓ Landmark distinctness checks passed successfully!")
        
        # 3. Assert no shared specific images
        tokyo_images = {day.get("image") for day in tokyo_itinerary.get("itinerary", []) if day.get("image")}
        goa_images = {day.get("image") for day in goa_itinerary.get("itinerary", []) if day.get("image")}
        paris_images = {day.get("image") for day in paris_itinerary.get("itinerary", []) if day.get("image")}
        
        # Filter out generic placeholder "/generating_illustration.png"
        tokyo_spec = tokyo_images - {"/generating_illustration.png"}
        goa_spec = goa_images - {"/generating_illustration.png"}
        paris_spec = paris_images - {"/generating_illustration.png"}
        
        overlap_tokyo_goa = tokyo_spec.intersection(goa_spec)
        overlap_tokyo_paris = tokyo_spec.intersection(paris_spec)
        overlap_goa_paris = goa_spec.intersection(paris_spec)
        
        assert len(overlap_tokyo_goa) == 0, f"Tokyo and Goa share specific images: {overlap_tokyo_goa}"
        assert len(overlap_tokyo_paris) == 0, f"Tokyo and Paris share specific images: {overlap_tokyo_paris}"
        assert len(overlap_goa_paris) == 0, f"Goa and Paris share specific images: {overlap_goa_paris}"
        
        print("✓ Image uniqueness checks passed successfully!")
        print("\nALL REGRESSION TESTS PASSED SUCCESSFULLY! The itinerary builder is 100% dynamic and distinct per destination.")
        
    except Exception as e:
        print(f"\n❌ REGRESSION TEST FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
