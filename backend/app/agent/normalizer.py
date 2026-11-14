"""
normalizer.py
─────────────
Parameter normalization + slot-registry utilities for slot-filling agent.
"""

import re
from typing import Optional, Dict, Any, List

REQUIRED_SLOTS: List[str] = [
    "destination",
    "origin_city",
    "trip_type",
    "budget",
    "group_size",
    "duration_days",
]

OPTIONAL_SLOTS: List[str] = [
    "transport_mode",
    "accommodation_preference",
    "food_preference",
    "custom_preferences"
]

SLOT_LABELS: Dict[str, str] = {
    "destination": "destination city/region",
    "origin_city": "departure city",
    "trip_type": "trip type (domestic or international)",
    "budget": "budget amount and currency",
    "group_size": "number of travelers",
    "duration_days": "duration in days",
}

SYMBOL_CURRENCY_MAP = {
    "$": "USD",
    "€": "EUR",
    "£": "GBP",
    "¥": "JPY",
    "₹": "INR",
}

def normalize_travelers(val: Any) -> Optional[int]:
    if not val:
        return None
    s = str(val).lower()
    if any(w in s for w in ["solo", "just me", "myself", "alone"]):
        return 1
    if any(w in s for w in ["couple", "partner", "wife", "husband", "two of us"]):
        return 2
    nums = re.findall(r'\d+', s)
    if nums:
        return int(nums[0])
    return None

def normalize_duration(val: Any) -> Optional[int]:
    if not val:
        return None
    s = str(val).lower()
    if "week" in s:
        nums = re.findall(r'\d+', s)
        weeks = int(nums[0]) if nums else 1
        return weeks * 7
    nums = re.findall(r'\d+', s)
    if nums:
        return int(nums[0])
    return None

def normalize_budget(val: Any) -> Optional[str]:
    if not val:
        return None
    s = str(val).strip()
    return s

def merge_trip_context(existing: Dict[str, Any], newly_extracted: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge newly-extracted slots into the cumulative state.
    Only updates when a new valid value is received.
    """
    result = dict(existing) if existing else {}
    if not newly_extracted:
        return result

    for k, v in newly_extracted.items():
        if v is not None and v != "" and v != "None":
            # Normalize fields
            if k == "group_size":
                norm = normalize_travelers(v)
                if norm:
                    result["group_size"] = norm
            elif k == "duration_days":
                norm = normalize_duration(v)
                if norm:
                    result["duration_days"] = norm
            elif k == "budget":
                norm = normalize_budget(v)
                if norm:
                    result["budget"] = norm
            else:
                result[k] = v

    # Auto-infer trip_type if origin_city and destination exist and trip_type is empty
    if result.get("origin_city") and result.get("destination") and not result.get("trip_type"):
        o = result["origin_city"].lower()
        d = result["destination"].lower()
        # Basic inference heuristic for domestic vs international
        # For simplicity, if both mention India, or same key terms, we infer. Let LLM decide or use this helper
        pass

    return result

def get_missing_required_slots(context: Dict[str, Any], destination_too_vague: bool = False) -> List[str]:
    missing = []
    for slot in REQUIRED_SLOTS:
        val = context.get(slot)
        if val is None or val == "" or val == "None":
            missing.append(slot)
    if "destination" not in missing and destination_too_vague:
        missing.append("destination") # re-ask destination if too vague
    return missing
