from typing import Annotated, Sequence, TypedDict, Optional, Dict, Any, List
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


def merge_trip_state(existing: dict, new: dict) -> dict:
    """
    Deep-merge new slot values into the existing trip_state.
    Existing values are NEVER overwritten with None/empty — only with a real value.
    This guarantees slots collected in earlier turns survive across graph invocations.
    """
    if not existing:
        existing = {}
    if not new:
        return existing
    result = existing.copy()
    for k, v in new.items():
        # Only update if the new value is actually present (not None, not empty string)
        if v is not None and v != "" and v != [] and v != {}:
            result[k] = v
    return result


def merge_asked_slots(existing: list, new: list) -> list:
    """Accumulate asked_slots across turns without duplicates."""
    if not existing:
        existing = []
    if not new:
        return existing
    combined = list(existing)
    for slot in new:
        if slot not in combined:
            combined.append(slot)
    return combined


class TripPlannerState(TypedDict, total=False):
    """
    The persistent state for the custom LangGraph travel planner pipeline.
    """
    # Message history (append-only via add_messages reducer)
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # ── Context injected at session start ──────────────────────────────────
    user_id: Optional[int]
    conversation_id: Optional[str]
    persona_name: Optional[str]
    travel_style: Optional[str]
    budget: Optional[float]
    trip_duration: Optional[int]
    user_preferences: Optional[dict]

    # ── Internal agent reasoning fields ────────────────────────────────────
    intent: Optional[str]
    # Slots still unfilled (single label, e.g. "destination")
    next_missing_slot: Optional[str]
    # Human-readable explanation used only for ask_followup
    missing_info: Optional[str]
    ready_for_tools: bool
    retry_count: int

    # ── NEW: Extracted from ONLY the latest message (not full history) ─────
    # Used during normalize_and_validate to merge into trip_state
    newly_extracted: Optional[Dict[str, Any]]
    destination_too_vague: Optional[bool]

    # ── NEW: Tracks which slots have already been asked about ──────────────
    # Persisted via checkpointer across every turn in the same conversation.
    # Uses a custom reducer so it only grows — never resets.
    asked_slots: Annotated[List[str], merge_asked_slots]

    # ── Tool output tracking ────────────────────────────────────────────────
    tool_calls_made: Optional[list]
    flights_data: Optional[dict]
    weather_data: Optional[dict]
    places_data: Optional[dict]

    # ── Persistent Trip Context (accumulated across all turns) ─────────────
    # Uses merge_trip_state reducer: values are only ever added, never removed.
    trip_state: Annotated[Dict[str, Any], merge_trip_state]
