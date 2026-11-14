import json
import re
import traceback
from typing import List, Optional, Tuple, Dict, Any, Literal

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel, Field

from app.tools.agent_tools import (
    get_all_tools, geocode_location, get_weather, find_places, get_route, submit_final_itinerary
)
from app.config import get_settings
from app.core.logger import get_logger
from app.agent.state import TripPlannerState
from app.agent.router import ModelRouter

logger = get_logger(__name__)

class MapCoordinates(BaseModel):
    lat: float
    lng: float

class FlightSchema(BaseModel):
    airline: str = Field(description="Name of the airline")
    origin: str = Field(description="Departure city/airport code")
    destination: str = Field(description="Arrival city/airport code")
    departure_date: str = Field(description="YYYY-MM-DD")
    return_date: Optional[str] = Field(None, description="YYYY-MM-DD")
    price_usd: float = Field(description="Estimated flight price in USD")
    duration_hours: float = Field(description="Flight duration in hours")
    flight_number: Optional[str] = Field("101", description="Flight number")
    departure_time: Optional[str] = Field("10:00 AM", description="Departure time")
    arrival_time: Optional[str] = Field("12:30 PM", description="Arrival time")

class HotelSchema(BaseModel):
    name: str = Field(description="Hotel name")
    location: str = Field(description="Hotel address/neighborhood")
    rating: float = Field(description="Star rating (e.g. 4.5)")
    description: str = Field(description="Short description of amenities and why selected")
    price_usd: float = Field(description="Estimated nightly price in USD")

class StopSchema(BaseModel):
    time: str = Field(description="Time of activity (e.g. '09:00 AM')")
    type: str = Field(description="Activity type (e.g. hotel, adventure, food, sightseeing, exploration, entertainment)")
    title: str = Field(description="Name of place or activity")
    desc: str = Field(description="Brief details of what to do there")
    lat: Optional[float] = Field(None, description="Latitude of stop if known")
    lng: Optional[float] = Field(None, description="Longitude of stop if known")

class DaySchema(BaseModel):
    day: int = Field(description="Day number (1, 2, 3...)")
    title: str = Field(description="Day theme/title")
    desc: str = Field(description="Short summary of the day's activities")
    included: List[str] = Field(description="List of included things/amenities")
    tips: str = Field(description="Tips/notes for travelers for this day")
    image: Optional[str] = Field(None, description="Cover image file path. If none, use default or a related placeholder image like '/kyoto.png' or '/swiss_alps.png' or '/bali.png'")
    stops: List[StopSchema] = Field(description="Sequential list of activities/stops for this day")

class CostBreakdownSchema(BaseModel):
    flights: float = Field(description="Total estimated flights cost")
    hotels: float = Field(description="Total estimated hotels cost")
    activities: float = Field(description="Total estimated activities cost")
    food: float = Field(description="Total estimated food and local transit cost")
    total: float = Field(description="Total sum of all estimated costs")

class ItineraryStructuredSchema(BaseModel):
    destination: str = Field(description="Target destination city/region")
    map_coordinates: MapCoordinates = Field(description="Latitude and longitude coordinates of destination")
    currency: str = Field("INR", description="Currency code (e.g. USD, INR). Use INR by default unless the user explicitly specified a different currency code or symbol.")
    total_budget_usd: int = Field(description="Stated/maximum budget in USD")
    total_budget_local: int = Field(description="Stated/maximum budget in local currency")
    estimated_cost_usd: int = Field(description="Estimated total cost in USD")
    estimated_cost_local: int = Field(description="Estimated total cost in local currency")
    flights: List[FlightSchema] = Field(description="List of recommended flight options")
    recommended_hotels: List[HotelSchema] = Field(description="List of recommended accommodation places")
    local_transportation: str = Field(description="Description of local transport options (e.g. 'taxi', 'metro')")
    nearby_landmarks: List[str] = Field(description="List of interesting landmarks nearby")
    itinerary: List[DaySchema] = Field(description="List of days, matching the requested duration")
    costBreakdown: CostBreakdownSchema = Field(description="Cost breakdown of the estimated expenses")

def clean_destination(dest: str) -> str:
    if not dest:
        return ""
    # Collapse multiple whitespaces and trim
    cleaned = " ".join(dest.split())
    # Remove leading/trailing quotes and common punctuation
    cleaned = cleaned.strip(".,!?\"' ")
    
    # Remove common filler words/phrases at start/end recursively
    fillers = [
        "hello", "hi", "hey", "umm", "um", "please", "set", "destination", "change", "switch", "go"
    ]
    
    words = cleaned.split()
    # Remove starting filler words/phrases
    while words:
        first_word_lower = words[0].lower().strip(".,!?\"' ")
        if first_word_lower in fillers:
            words.pop(0)
            continue
        # Check prefix phrases
        found_prefix = False
        prefixes = [
            "i want to go to", "i want to visit", "change destination to",
            "set destination to", "destination to", "switch to", "change to",
            "trip to", "travel to", "set to", "to"
        ]
        for prefix in prefixes:
            prefix_words = prefix.split()
            if len(words) >= len(prefix_words):
                if [w.lower().strip(".,!?\"' ") for w in words[:len(prefix_words)]] == prefix_words:
                    words = words[len(prefix_words):]
                    found_prefix = True
                    break
        if found_prefix:
            continue
        break
        
    # Remove ending filler words/phrases
    while words:
        last_word_lower = words[-1].lower().strip(".,!?\"' ")
        if last_word_lower in ["please"]:
            words.pop()
            continue
        # Check suffix phrases
        found_suffix = False
        for suffix in ["i think"]:
            suffix_words = suffix.split()
            if len(words) >= len(suffix_words):
                if [w.lower().strip(".,!?\"' ") for w in words[-len(suffix_words):]] == suffix_words:
                    words = words[:-len(suffix_words)]
                    found_suffix = True
                    break
        if found_suffix:
            continue
        break

    cleaned = " ".join(words)
    # Correct casing if appropriate
    if cleaned:
        if len(cleaned.split()) == 1:
            cleaned = cleaned.strip(".,!?\"' ").capitalize()
        else:
            if cleaned.isupper() or cleaned.islower():
                cleaned = cleaned.title()
    return cleaned

def sanitize_stops_in_itinerary(struct_dict: dict) -> dict:
    valid_types = {"hotel", "adventure", "food", "sightseeing", "exploration", "entertainment"}
    itinerary = struct_dict.get("itinerary")
    if isinstance(itinerary, list):
        for day in itinerary:
            if isinstance(day, dict):
                stops = day.get("stops")
                if isinstance(stops, list):
                    for stop in stops:
                        if isinstance(stop, dict):
                            t = str(stop.get("type", "")).lower().strip()
                            if t not in valid_types:
                                if t in ["arrival", "departure", "airport", "transport", "flight", "bus", "train", "road", "transit"]:
                                    stop["type"] = "adventure"
                                elif t in ["shopping", "shop", "market"]:
                                    stop["type"] = "exploration"
                                else:
                                    stop["type"] = "exploration"
                            else:
                                stop["type"] = t
    return struct_dict

# Extraction schemas
class SlotDiff(BaseModel):
    destination: Optional[str] = Field(None, description="Clean destination city/region/country name. Do NOT include any filler words (e.g. 'hello', 'hi', 'visit', 'i want to go to'). Return ONLY the place name (e.g. 'Tokyo, Japan', 'Manali').")
    origin: Optional[str] = Field(None, description="Starting departure city (e.g. 'Delhi', 'New York')")
    trip_type: Optional[Literal["domestic", "international", "None"]] = Field(None, description="Whether the trip is domestic or international")
    budget: Optional[float] = Field(None, description="Stated total budget limit value (e.g. 150000.0, 4000.0)")
    budget_currency: Optional[str] = Field(None, description="Stated budget currency code (e.g. INR, USD)")
    group_size: Optional[int] = Field(None, description="Number of travelers")
    duration_days: Optional[int] = Field(None, description="Trip duration in days")
    transport_pref: Optional[str] = Field(None, description="Preferred transport mode")
    accommodation_pref: Optional[str] = Field(None, description="Preferred accommodation standard (e.g. budget, mid-range, luxury)")
    food_pref: Optional[str] = Field(None, description="Dietary/food preference (e.g. veg, vegan)")
    custom_notes: Optional[str] = Field(None, description="Other notes/preferences")

class ExtractionOutput(BaseModel):
    intent: Literal["plan_trip", "confirm_generation", "answer_question", "general_chat"] = Field(
        description="The user intent: 'confirm_generation' if they confirm generation or click confirm, 'answer_question' if asking about existing itinerary details, 'plan_trip' if planning/updating details, 'general_chat' otherwise."
    )
    diff: SlotDiff = Field(description="Extracted travel slots from the user's latest statement. Always extract slots if present in the message, even when the user intent is confirm_generation.")

class TripPlannerAgent:
    def __init__(self, memory_messages=[]):
        self.router = ModelRouter()
        
        # Extraction uses the strong (large) model
        self.extractor_model = self.router.get_extraction_model()
        self.extractor_llm = self.extractor_model.with_structured_output(ExtractionOutput)
        
        # Conversational / general tasks use the smaller / faster model
        self.conversational_llm = self.router.get_conversational_model()
        
        self.tools = get_all_tools()
        self.chat_history = memory_messages
 
        # Build Graph - Linear Python control flow
        workflow = StateGraph(TripPlannerState)
        
        workflow.add_node("extractor", self.extract_slots)
        workflow.add_node("controller", self.run_controller)
        workflow.add_node("responder", self.generate_response)
        
        workflow.add_edge(START, "extractor")
        workflow.add_edge("extractor", "controller")
        workflow.add_edge("controller", "responder")
        workflow.add_edge("responder", END)
        
        self.memory = MemorySaver()
        self.graph = workflow.compile(checkpointer=self.memory)
 
        logger.debug("TripPlanner slot-filling Agent Graph initialized.")

    async def extract_slots(self, state: TripPlannerState) -> Dict[str, Any]:
        messages = state["messages"]
        trip_state = state.get("trip_state", {})
        
        sys_msg = SystemMessage(content=f"""
        You are an expert travel data extraction model.
        Analyze the user's latest message and extract any changes/updates to slots relative to the current state:
        Current State: {json.dumps(trip_state)}
        
        Return ONLY a structured ExtractionOutput:
        - intent: 'confirm_generation' if the user explicitly confirms generating the plan (e.g. 'Yes, please!', 'generate it', 'go ahead'), 'answer_question' if asking about existing itinerary details, 'plan_trip' if providing details/updating parameters, 'general_chat' for greeting/chit-chat.
        - diff: Any new or modified slot values found in the user's latest message. Extract budget amount as a number and currency separately (e.g. ₹150000 -> budget=150000, budget_currency='INR').
        
        For the destination slot, extract ONLY the place name city/region/country, with absolutely no other greeting or filler words from the message.
        """)
        
        try:
            output = await self.extractor_llm.ainvoke([sys_msg] + messages)
            output_dict = output if isinstance(output, dict) else output.model_dump()
        except Exception as err:
            logger.warning(f"First slot extraction attempt failed: {err}. Re-prompting once...")
            warning_msg = HumanMessage(content=f"Warning: Your previous response failed validation with error: {err}. Please re-extract the diff correctly using the strict JSON schema/tool.")
            try:
                output = await self.extractor_llm.ainvoke([sys_msg] + messages + [warning_msg])
                output_dict = output if isinstance(output, dict) else output.model_dump()
            except Exception as final_err:
                logger.error(f"Re-prompt slot extraction also failed: {final_err}")
                output_dict = {
                    "intent": "general_chat",
                    "diff": {}
                }
                
        logger.info(f"Extractor output: {output_dict}")
        return {
            "intent": output_dict.get("intent", "general_chat"),
            "newly_extracted": output_dict.get("diff", {}),
            "retry_count": 0
        }

    async def run_controller(self, state: TripPlannerState) -> Dict[str, Any]:
        trip_state = dict(state.get("trip_state", {}))
        intent = state.get("intent", "general_chat")
        diff = state.get("newly_extracted", {})
        
        # Initialize status if not present
        if "status" not in trip_state:
            trip_state["status"] = "collecting"
            
        KEY_MAP = {
            "destination": "destination",
            "origin": "origin_city",
            "trip_type": "trip_type",
            "budget": "budget",
            "budget_currency": "budget_currency",
            "group_size": "group_size",
            "duration_days": "duration_days",
            "transport_pref": "transport_mode",
            "accommodation_pref": "accommodation_preference",
            "food_pref": "food_preference",
            "custom_notes": "custom_preferences"
        }
        
        # Keep track of old destination for conflict check
        old_dest = trip_state.get("destination")
        old_dest_verified = trip_state.get("destination_verified", False)
        
        # Apply slots
        dest_changed = False
        for diff_k, val in diff.items():
            if val is not None and val != "" and val != "None":
                state_k = KEY_MAP.get(diff_k)
                if state_k:
                    from app.agent.normalizer import normalize_travelers, normalize_duration, normalize_budget
                    if state_k == "group_size":
                        norm = normalize_travelers(val)
                        if norm: trip_state[state_k] = norm
                    elif state_k == "duration_days":
                        norm = normalize_duration(val)
                        if norm: trip_state[state_k] = norm
                    elif state_k == "budget":
                        norm = normalize_budget(val)
                        if norm:
                            try:
                                nums = re.findall(r'\d+', str(norm).replace(",", ""))
                                if nums:
                                    trip_state[state_k] = float(nums[0])
                            except Exception:
                                trip_state[state_k] = norm
                    elif state_k == "destination":
                        cleaned_val = clean_destination(val)
                        if cleaned_val:
                            trip_state[state_k] = cleaned_val
                            dest_changed = True
                        else:
                            trip_state[state_k] = val
                            dest_changed = True
                    else:
                        trip_state[state_k] = val
                        
                    if state_k == "destination" and not dest_changed:
                        dest_changed = True
                        
        # 1. Conflict detection (simple string/coords comparison)
        new_dest = trip_state.get("destination")
        if dest_changed and old_dest and old_dest_verified:
            if new_dest.lower().strip() != old_dest.lower().strip():
                # Force clarification turn
                trip_state["status"] = "clarifying"
                trip_state["destination_conflict"] = {
                    "old": old_dest,
                    "new": new_dest
                }
                return {"trip_state": trip_state}
                
        # Handle clarification response
        if trip_state.get("status") == "clarifying":
            last_msg = state["messages"][-1].content.lower()
            conflict = trip_state.get("destination_conflict", {})
            if any(w in last_msg for w in ["yes", "switch", "change", "new", conflict.get("new", "").lower()]):
                # User confirmed switching to new
                trip_state["destination"] = clean_destination(conflict.get("new"))
                trip_state.pop("destination_conflict", None)
                trip_state["status"] = "collecting"
                dest_changed = True
            elif any(w in last_msg for w in ["no", "keep", "stay", "old", conflict.get("old", "").lower()]):
                # User wants to keep old
                trip_state["destination"] = clean_destination(conflict.get("old"))
                trip_state.pop("destination_conflict", None)
                trip_state["status"] = "collecting"
                dest_changed = False
            else:
                # Keep asking
                return {"trip_state": trip_state}
                
        # 2. Geocoding changes immediately
        if dest_changed or (trip_state.get("destination") and not trip_state.get("destination_verified")):
            dest_to_geocode = clean_destination(trip_state.get("destination"))
            geo_res = await geocode_location.ainvoke({"place_name": dest_to_geocode})
            if geo_res.get("available"):
                trip_state["destination"] = geo_res["display_name"]
                trip_state["destination_verified"] = True
                trip_state["destination_coords"] = {
                    "lat": geo_res["lat"],
                    "lng": geo_res["lng"]
                }
                trip_state["destination_country"] = geo_res["country"]
            else:
                trip_state["destination_verified"] = False
                trip_state["destination_coords"] = None
                trip_state["destination"] = None
                
        # Robust parsing and bounds check
        if trip_state.get("budget"):
            try:
                if isinstance(trip_state["budget"], str):
                    nums = re.findall(r'\d+', trip_state["budget"].replace(",", ""))
                    if nums:
                        trip_state["budget"] = float(nums[0])
                    else:
                        trip_state["budget"] = None
                else:
                    trip_state["budget"] = float(trip_state["budget"])
                
                if trip_state["budget"] is not None:
                    if trip_state["budget"] <= 0 or trip_state["budget"] > 1000000:
                        trip_state["budget"] = None
            except Exception:
                trip_state["budget"] = None
                
        if trip_state.get("duration_days"):
            try:
                if isinstance(trip_state["duration_days"], str):
                    nums = re.findall(r'\d+', trip_state["duration_days"])
                    if nums:
                        trip_state["duration_days"] = int(nums[0])
                    else:
                        trip_state["duration_days"] = None
                else:
                    trip_state["duration_days"] = int(float(trip_state["duration_days"]))
                
                if trip_state["duration_days"] is not None:
                    if trip_state["duration_days"] <= 0 or trip_state["duration_days"] > 60:
                        trip_state["duration_days"] = None
            except Exception:
                trip_state["duration_days"] = None
                
        if trip_state.get("group_size"):
            try:
                if isinstance(trip_state["group_size"], str):
                    nums = re.findall(r'\d+', trip_state["group_size"])
                    if nums:
                        trip_state["group_size"] = int(nums[0])
                    else:
                        trip_state["group_size"] = None
                else:
                    trip_state["group_size"] = int(float(trip_state["group_size"]))
                
                if trip_state["group_size"] is not None:
                    if trip_state["group_size"] <= 0:
                        trip_state["group_size"] = None
            except Exception:
                trip_state["group_size"] = None
                
        # Determine missing slots
        REQUIRED_KEYS = ["destination", "origin_city", "trip_type", "budget", "group_size", "duration_days"]
        missing_slots = []
        for k in REQUIRED_KEYS:
            if not trip_state.get(k) or (k == "destination" and not trip_state.get("destination_verified")):
                missing_slots.append(k)
                
        if missing_slots:
            trip_state["status"] = "collecting"
            from app.agent.normalizer import SLOT_LABELS
            labels = [SLOT_LABELS.get(s, s) for s in missing_slots]
            return {
                "trip_state": trip_state,
                "missing_info": ", ".join(labels),
                "ready_for_tools": False
            }
            
        # If all slots filled and geocoded, ready to generate
        trip_state["status"] = "ready_to_generate"
        
        # 3. Check for confirmation to trigger generation pipeline
        is_confirmed = (intent == "confirm_generation") or ("yes please" in state["messages"][-1].content.lower())
        
        if is_confirmed:
            trip_state["status"] = "generating"
            try:
                # 1. Geocode origin
                origin_geo = await geocode_location.ainvoke({"place_name": trip_state["origin_city"]})
                origin_lat = origin_geo.get("lat", 0.0) if origin_geo.get("available") else 0.0
                origin_lng = origin_geo.get("lng", 0.0) if origin_geo.get("available") else 0.0
                
                # 2. Get Weather
                weather_res = await get_weather.ainvoke({
                    "lat": trip_state["destination_coords"]["lat"],
                    "lng": trip_state["destination_coords"]["lng"],
                    "start_date": trip_state.get("start_date") or "2026-07-20",
                    "end_date": trip_state.get("end_date") or "2026-07-25"
                })
                
                # 3. Get Route
                route_res = await get_route.ainvoke({
                    "origin_lat": origin_lat,
                    "origin_lng": origin_lng,
                    "dest_lat": trip_state["destination_coords"]["lat"],
                    "dest_lng": trip_state["destination_coords"]["lng"],
                    "mode": trip_state.get("transport_mode") or "flight"
                })
                
                import asyncio
                from app.services.places import PlacesService, places_context_for_model, Provenance
                from app.db.storage import PgCache, PgRateLimiter
                from datetime import timedelta

                places_service = PlacesService(
                    cache=PgCache(),
                    limiter=PgRateLimiter(bucket="overpass", interval=timedelta(seconds=2.0))
                )

                # Concurrently execute weather, route, and places API queries
                weather_task = get_weather.ainvoke({
                    "lat": trip_state["destination_coords"]["lat"],
                    "lng": trip_state["destination_coords"]["lng"],
                    "start_date": "",
                    "end_date": ""
                })
                route_task = get_route.ainvoke({
                    "origin_lat": origin_lat,
                    "origin_lng": origin_lng,
                    "dest_lat": trip_state["destination_coords"]["lat"],
                    "dest_lng": trip_state["destination_coords"]["lng"],
                    "mode": trip_state.get("transport_mode") or "flight"
                })
                hotels_task = places_service.find(
                    trip_state["destination_coords"]["lat"],
                    trip_state["destination_coords"]["lng"],
                    "hotel"
                )
                sights_task = places_service.find(
                    trip_state["destination_coords"]["lat"],
                    trip_state["destination_coords"]["lng"],
                    "sightseeing"
                )
                foods_task = places_service.find(
                    trip_state["destination_coords"]["lat"],
                    trip_state["destination_coords"]["lng"],
                    "food"
                )

                weather_res, route_res, hotels_res, sights_res, foods_res = await asyncio.gather(
                    weather_task, route_task, hotels_task, sights_task, foods_task
                )
                await places_service.aclose()
                
                hotel_ctx = places_context_for_model(hotels_res, "hotel")
                sights_ctx = places_context_for_model(sights_res, "sightseeing")
                foods_ctx = places_context_for_model(foods_res, "food")

                # 5. Build system prompt for structured generation
                sys_msg_planning = SystemMessage(content=f"""
                You are an expert travel planner structuring assistant.
                Generate a perfect multi-day itinerary based on the following details:
                
                Trip Details:
                - Destination: {trip_state["destination"]}
                - Origin: {trip_state["origin_city"]}
                - Budget: {trip_state["budget"]} ({trip_state.get("budget_currency", "INR")})
                - Travelers: {trip_state["group_size"]}
                - Duration: {trip_state["duration_days"]} days
                - Accommodation Preference: {trip_state.get("accommodation_preference")}
                - Transport Mode Preference: {trip_state.get("transport_mode")}
                - Food Preference: {trip_state.get("food_preference")}
                - Custom Notes: {trip_state.get("custom_preferences")}
                
                Tool Context:
                - Weather: {json.dumps(weather_res)}
                - Route/Distance: {json.dumps(route_res)}
                
                Places Data Context & Strict Provenance Rules:
                [HOTELS CONTEXT]
                {hotel_ctx}

                [ATTRACTIONS CONTEXT]
                {sights_ctx}

                [RESTAURANTS CONTEXT]
                {foods_ctx}

                CRITICAL INSTRUCTIONS:
                1. Every single day in the itinerary (including arrival and departure days) MUST contain at least one stop in the `stops` list. Do NOT leave `stops` empty for any day.
                2. The fields `total_budget_usd`, `total_budget_local`, `estimated_cost_usd`, and `estimated_cost_local` MUST be integers. Do not output float values for these fields.
                3. For every stop in the `stops` list of a day, the `type` field MUST be exactly one of the allowed literals: "hotel", "adventure", "food", "sightseeing", "exploration", "entertainment". Do NOT use other values like "airport", "transport", "shopping", "flight", "bus", "train", "metro", or "check-out".
                
                Generate a strict structured itinerary output matching the ItineraryStructuredSchema.
                """)
                
                # Itinerary generation structuring uses the strong model with automatic retry fallback
                structuring_model = self.router.get_extraction_model()
                structuring_llm = structuring_model.with_structured_output(ItineraryStructuredSchema)
                
                try:
                    structured_output = await structuring_llm.ainvoke([sys_msg_planning])
                except Exception as struct_err:
                    logger.warning(f"First itinerary structuring attempt failed: {struct_err}. Re-prompting once...")
                    struct_warning = HumanMessage(content=f"Warning: Your previous response failed itinerary structuring validation with error: {struct_err}. Please ensure all itinerary fields are completely populated and match ItineraryStructuredSchema correctly.")
                    structured_output = await structuring_llm.ainvoke([sys_msg_planning, struct_warning])
                
                # Call submit_final_itinerary to write to DB
                struct_dict = structured_output if isinstance(structured_output, dict) else structured_output.model_dump()
                struct_dict = sanitize_stops_in_itinerary(struct_dict)
                
                # Enforce boundary gate: a place name may only reach a UI element if provenance is LIVE or CACHED
                if not hotels_res.is_real:
                    struct_dict["recommended_hotels"] = []
                else:
                    struct_dict["recommended_hotels"] = [
                        {
                            "name": p.name,
                            "category": p.category,
                            "lat": p.lat,
                            "lng": p.lon,
                            "address": f"Lat {p.lat:.4f}, Lng {p.lon:.4f}"
                        }
                        for p in hotels_res.places[:5]
                    ]
                if "currency" not in struct_dict or not struct_dict["currency"]:
                    struct_dict["currency"] = "INR"
                if "costBreakdown" not in struct_dict or not struct_dict["costBreakdown"]:
                    struct_dict["costBreakdown"] = {
                        "flights": struct_dict.get("total_budget_usd", 0) * 0.4,
                        "hotels": struct_dict.get("total_budget_usd", 0) * 0.3,
                        "activities": struct_dict.get("total_budget_usd", 0) * 0.2,
                        "food": struct_dict.get("total_budget_usd", 0) * 0.1,
                        "total": struct_dict.get("total_budget_usd", 0)
                    }
                tool_result = await submit_final_itinerary.ainvoke(struct_dict)
                
                # Update trip_state keys
                trip_state["itinerary"] = tool_result
                trip_state["days"] = tool_result.get("itinerary", [])
                trip_state["currency"] = tool_result.get("currency", "INR")
                trip_state["budget_breakdown"] = tool_result.get("budget_breakdown", [])
                if "costBreakdown" in tool_result:
                    trip_state["costBreakdown"] = tool_result["costBreakdown"]
                    
                # Hard Invariant check
                if tool_result.get("itinerary") and len(tool_result["itinerary"]) > 0:
                    trip_state["status"] = "generated"
                else:
                    trip_state["status"] = "failed"
            except Exception as e:
                logger.error(f"Generation pipeline failed: {e}\n{traceback.format_exc()}")
                trip_state["status"] = "failed"
                
        return {
            "trip_state": trip_state,
            "ready_for_tools": trip_state.get("status") == "ready_to_generate"
        }

    async def generate_response(self, state: TripPlannerState) -> Dict[str, Any]:
        trip_state = state.get("trip_state", {})
        status = trip_state.get("status", "collecting")
        intent = state.get("intent", "general_chat")
        
        # 1. Answer question intent (uses conversational model)
        if intent == "answer_question" and trip_state.get("itinerary"):
            sys_msg = SystemMessage(content=f"""
            You are TripPlanner, a premium AI Travel Assistant.
            The user is asking a question about their active itinerary. Answer concisely based ONLY on this trip state:
            {json.dumps(trip_state.get("itinerary"))}
            Do NOT run tools. Do NOT change parameters.
            """)
            response = await self.conversational_llm.ainvoke([sys_msg] + state["messages"])
            return {"messages": [response]}
            
        # 2. General status responders (uses conversational model)
        if status == "collecting":
            missing = state.get("missing_info", "")
            sys_msg = SystemMessage(content=f"""
            You are TripPlanner, a premium AI Travel Assistant.
            We are collecting slots for a trip planner.
            Missing required slots: {missing}.
            Current collected slots: {json.dumps(trip_state)}.
            Ask a friendly, conversationally natural question to collect 1 or 2 of the missing items at a time (e.g. ask for departure city and budget, or travelers and duration).
            Keep it concise. Do NOT list out all missing slots.
            """)
            response = await self.conversational_llm.ainvoke([sys_msg] + state["messages"])
            return {"messages": [response]}
            
        elif status == "clarifying":
            conflict = trip_state.get("destination_conflict", {})
            sys_msg = SystemMessage(content=f"""
            You are TripPlanner, a premium AI Travel Assistant.
            The user previously set and verified destination as '{conflict.get("old")}', but now wants to change it to '{conflict.get("new")}'.
            Politely ask them if they want to discard their current plan details and switch their destination to '{conflict.get("new")}', or keep '{conflict.get("old")}'.
            """)
            response = await self.conversational_llm.ainvoke([sys_msg] + state["messages"])
            return {"messages": [response]}
            
        elif status == "ready_to_generate":
            sys_msg = SystemMessage(content=f"""
            You are TripPlanner, a premium AI Travel Assistant.
            All required slot parameters have been collected:
            {json.dumps(trip_state)}
            
            Confirm the details to the user and ask if they are ready to generate the complete itinerary.
            Politely ask them: "Yes, please! Generate my itinerary?" or something similar.
            Keep it exciting, short, and premium.
            """)
            response = await self.conversational_llm.ainvoke([sys_msg] + state["messages"])
            return {"messages": [response]}
            
        elif status == "generated":
            sys_msg = SystemMessage(content=f"""
            You are TripPlanner, a premium AI Travel Assistant.
            The structured travel itinerary has been successfully generated and saved:
            {json.dumps(trip_state.get("itinerary", {}))}
            
            Provide a premium, enthusiastic summary of the trip itinerary. Keep the text clean, readable, and highly engaging. Tell the user their plan is fully loaded and ready on the dashboard!
            """)
            response = await self.conversational_llm.ainvoke([sys_msg] + state["messages"])
            return {"messages": [response]}
            
        else: # failed
            return {
                "messages": [AIMessage(content="I ran into an issue assembling your itinerary details. Please try planning again by sending your destination and preferences.")]
            }
