import json
from typing import Optional, Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from app.db.models import Trip, Persona, Message
from app.agent.trip_planner import TripPlannerAgent
from app.schemas.chat import ChatEndpointResponse
from app.schemas.trip import MessageCreate
from app.services.trip_service import create_message
from app.core.logger import get_logger

logger = get_logger(__name__)

class ChatService:
    @staticmethod
    async def process_chat(
        db: AsyncSession, user_id: int, trip_id: int, message_content: str
    ) -> ChatEndpointResponse:
        
        logger.info(f"Processing chat for user {user_id}, trip {trip_id}")

        # 1. Load trip from DB
        result = await db.execute(
            select(Trip)
            .options(selectinload(Trip.messages))
            .options(selectinload(Trip.persona))
            .filter(Trip.id == trip_id, Trip.user_id == user_id)
        )
        trip = result.scalars().first()
        
        if not trip:
            raise ValueError("Trip not found")

        # 2 & 3. Context
        conversation_id = trip.conversation_id
        persona = trip.persona
        
        # 4. Create agent memory (Langchain) from DB messages
        past_messages = []
        for msg in trip.messages:
            if msg.role == "user":
                past_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                # Restore AIMessage, optionally with tool calls if we stored them
                ai_msg = AIMessage(content=msg.content)
                if msg.tool_calls:
                    # In a production app, we would hydrate tool_calls into the AIMessage properly,
                    # but for this text-based extraction context, the text content usually suffices.
                    ai_msg.additional_kwargs["tool_calls"] = msg.tool_calls
                past_messages.append(ai_msg)
            elif msg.role == "tool":
                past_messages.append(ToolMessage(content=msg.content, tool_call_id="legacy"))

        # Initialize agent
        agent = TripPlannerAgent(memory_messages=past_messages)
        config = {"configurable": {"thread_id": conversation_id}, "recursion_limit": 12}
        
        # Hydrate initial TripState context
        state = agent.memory.get_tuple(config)
        if not state:
            initial_state = {
                "messages": agent.chat_history,
                "user_id": user_id,
                "conversation_id": conversation_id,
                "persona_name": persona.name if persona else "None",
                "travel_style": persona.travel_style if persona else "General",
                "budget": float(persona.budget_max) if persona and persona.budget_max else float(trip.budget) if trip.budget else None,
                "trip_duration": persona.trip_duration if persona else None,
                "user_preferences": json.loads(persona.description) if persona and persona.description and persona.description.startswith('{') else {"notes": persona.description if persona else ""},
                "trip_state": trip.trip_data or {}
            }
            agent.graph.update_state(config, initial_state)

        # 6. Store user message in DB
        user_db_message = await create_message(db, trip_id, MessageCreate(role="user", content=message_content))

        full_response_text = ""
        tool_calls_extracted = []
        itinerary_data = trip.trip_data

        try:
            # 5. Execute LangGraph agent
            final_state = await agent.graph.ainvoke(
                {"messages": [HumanMessage(content=message_content)]},
                config=config
            )
            
            messages = final_state.get("messages", [])
            
            # Extract final response and tool calls
            for msg in reversed(messages):
                if isinstance(msg, AIMessage) and msg.content:
                    full_response_text = msg.content
                    # Extract tool calls from this run if we want (simplified extraction)
                    break
                    
            for msg in messages:
                if isinstance(msg, AIMessage) and hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        tool_calls_extracted.append({"tool": tc.get("name"), "args": tc.get("args")})
                    
            # Update trip_data and top-level fields
            itinerary_data = final_state.get("trip_state", {})
            if itinerary_data:
                if itinerary_data.get("destination"):
                    trip.destination = itinerary_data["destination"]
                    if trip.status == "draft":
                        trip.status = "planning"
                if itinerary_data.get("budget"):
                    try:
                        nums = re.findall(r'\d+', str(itinerary_data["budget"]).replace(",", ""))
                        if nums:
                            trip.budget = float(nums[0])
                    except Exception:
                        pass

                # Hard Invariant Check
                is_ready = final_state.get("ready_for_tools", False)
                curr_intent = final_state.get("intent", "general_chat")
                
                if is_ready and curr_intent in ["generate_new", "update_existing"]:
                    # Set trip status to planned
                    trip.status = "planned"
                    
                    # Verify trip_data.itinerary is non-empty
                    has_itinerary = False
                    days_list = itinerary_data.get("days") or (itinerary_data.get("itinerary") if isinstance(itinerary_data.get("itinerary"), list) else itinerary_data.get("itinerary", {}).get("itinerary") if isinstance(itinerary_data.get("itinerary"), dict) else None)
                    if days_list and isinstance(days_list, list) and len(days_list) > 0:
                        has_itinerary = True
                        
                    if not has_itinerary:
                        logger.error(f"CRITICAL BUG: User confirmed plan generation but trip_data.itinerary is empty or invalid! Trip ID: {trip_id}, Status: {trip.status}")
                        trip.status = "planning"
                        full_response_text = "I generated your plan but hit an issue saving it — let me try again"
                        # Strip any empty structures
                        if "itinerary" in itinerary_data:
                            del itinerary_data["itinerary"]
                        if "days" in itinerary_data:
                            del itinerary_data["days"]
                    else:
                        logger.info(f"Invariant check passed: status is {trip.status} and itinerary has {len(days_list)} days.")

                if itinerary_data != trip.trip_data:
                    trip.trip_data = itinerary_data
                await db.commit()
                
        except Exception as e:
            logger.error(f"Error during agent execution: {e}", exc_info=True)
            full_response_text = "I encountered a temporary service issue. Please try again."

        # 7. Store assistant response
        assistant_db_message = await create_message(
            db, 
            trip_id, 
            MessageCreate(role="assistant", content=full_response_text, tool_calls={"calls": tool_calls_extracted} if tool_calls_extracted else None)
        )
            
        # 9. Return response
        return ChatEndpointResponse(
            success=True,
            response=full_response_text,
            trip_data=itinerary_data,
            tool_calls=tool_calls_extracted,
            message_id=assistant_db_message.id
        )

    @staticmethod
    async def process_chat_stateless(
        db: AsyncSession,
        user_id: int,
        message_content: str,
        conversation_id: str,
        initial_trip_state: Optional[dict] = None
    ) -> ChatEndpointResponse:
        import uuid
        import re
        from datetime import datetime, timedelta
        
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            
        agent = TripPlannerAgent(memory_messages=[])
        config = {"configurable": {"thread_id": conversation_id}}
        
        state = agent.memory.get_tuple(config)
        if not state:
            initial_state = {
                "messages": [],
                "user_id": user_id,
                "conversation_id": conversation_id,
                "trip_state": initial_trip_state or {}
            }
            agent.graph.update_state(config, initial_state)
            
        final_state = await agent.graph.ainvoke(
            {"messages": [HumanMessage(content=message_content)]},
            config=config
        )
        
        messages = final_state.get("messages", [])
        
        full_response_text = ""
        for msg in reversed(messages):
            if isinstance(msg, AIMessage) and msg.content:
                full_response_text = msg.content
                break
                
        tool_calls_extracted = []
        for msg in messages:
            if isinstance(msg, AIMessage) and hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    tool_calls_extracted.append({"tool": tc.get("name"), "args": tc.get("args")})
                    
        trip_state = final_state.get("trip_state", {})
        ready = final_state.get("ready_for_tools", False)
        
        trip_id = None
        if ready and trip_state.get("itinerary"):
            start_date = datetime.utcnow().strftime("%Y-%m-%d")
            duration = 5
            if trip_state.get("duration_days"):
                try:
                    duration = int(trip_state["duration_days"])
                except Exception:
                    pass
            end_date = (datetime.utcnow() + timedelta(days=duration)).strftime("%Y-%m-%d")
            
            budget_val = 0.0
            if trip_state.get("budget"):
                try:
                    nums = re.findall(r'\d+', str(trip_state["budget"]).replace(",", ""))
                    if nums:
                        budget_val = float(nums[0])
                except Exception:
                    pass
                    
            db_trip = Trip(
                destination=trip_state.get("destination", "Trip"),
                start_date=start_date,
                end_date=end_date,
                budget=budget_val,
                status="confirmed",
                user_id=user_id,
                conversation_id=conversation_id,
                trip_data=trip_state
            )
            db.add(db_trip)
            await db.commit()
            await db.refresh(db_trip)
            trip_id = db_trip.id
            
            # Save messages log
            for msg in messages:
                role = "user" if isinstance(msg, HumanMessage) else "assistant" if isinstance(msg, AIMessage) else "tool"
                # Strip system errors
                if role == "assistant" and getattr(msg, "name", "") == "system_error":
                    continue
                db_msg = Message(
                    trip_id=trip_id,
                    role=role,
                    content=msg.content
                )
                db.add(db_msg)
            await db.commit()
            
        return ChatEndpointResponse(
            success=True,
            response=full_response_text,
            trip_data=trip_state,
            tool_calls=tool_calls_extracted,
            message_id=None,
            conversation_id=conversation_id,
            ready=ready,
            trip_id=trip_id
        )
