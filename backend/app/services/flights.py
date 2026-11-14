import random
import math
from typing import Dict, Any, List
from app.services.places import geocode_city
from async_lru import alru_cache

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@alru_cache(maxsize=100)
async def search_flights(origin: str, destination: str, departure_date: str, return_date: str = None, budget_limit: float = None) -> Dict[str, Any]:
    """
    Searches for flights between origin and destination on the specified dates.
    Calculates geographical distance dynamically to estimate flight duration and prices.
    Filters out flights exceeding the budget_limit if provided.
    """
    origin_geo = await geocode_city(origin)
    dest_geo = await geocode_city(destination)
    
    if origin_geo["status"] == "error":
        return {"status": "error", "message": f"Could not find origin city '{origin}'."}
    if dest_geo["status"] == "error":
        return {"status": "error", "message": f"Could not find destination city '{destination}'."}
        
    distance_km = haversine(
        origin_geo["data"]["lat"], origin_geo["data"]["lon"], 
        dest_geo["data"]["lat"], dest_geo["data"]["lon"]
    )
        
    duration_hours = max(1, round((distance_km / 800) + 1))
    base_price = 50 + (distance_km * 0.10)
    
    airlines = [f"{origin[:3].upper()} Airlines", "Global Airways", f"{destination[:3].upper()} Express", "SkyConnect Flight"]
    
    flights = []
    for _ in range(3):
        price = max(50, int(base_price * random.uniform(0.7, 1.4)))
        flights.append({
            "airline": random.choice(airlines),
            "origin": origin_geo["data"].get("display_name", origin).split(",")[0],
            "destination": dest_geo["data"].get("display_name", destination).split(",")[0],
            "departure_date": departure_date,
            "return_date": return_date,
            "price_usd": price,
            "duration_hours": duration_hours
        })
        
    flights.sort(key=lambda x: x["price_usd"])
    
    if budget_limit:
        flights = [f for f in flights if f["price_usd"] <= budget_limit]
        if not flights:
            return {"status": "error", "message": f"No flights found under your budget of ${budget_limit}."}
            
    return {"status": "success", "data": flights}
