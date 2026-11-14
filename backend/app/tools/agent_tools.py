from langchain_core.tools import tool
from typing import Dict, Any, List, Optional
from app.core.logger import get_logger

logger = get_logger(__name__)

from datetime import timedelta
from app.db.storage import PgCache, PgRateLimiter

cache = PgCache()
nominatim_limiter = PgRateLimiter(bucket="nominatim", interval=timedelta(seconds=1.0))
overpass_limiter = PgRateLimiter(bucket="overpass", interval=timedelta(seconds=2.0))

@tool
async def geocode_location(place_name: str) -> dict:
    """Geocode a place name (city, region, landmark) to extract latitude, longitude, country, and full display name using OpenStreetMap Nominatim. Input should be the place name string."""
    if not place_name:
        return {"available": False, "status": "NONE", "reason": "Empty place_name provided."}
    
    cache_key = f"geocode:{place_name.lower().strip()}"
    cached = await cache.get_json(cache_key)
    if cached:
        logger.info(f"geocode_location: Cache HIT for '{place_name}'")
        return cached

    await nominatim_limiter.acquire()
    import httpx
    url = f"https://nominatim.openstreetmap.org/search?q={place_name}&format=json&limit=1&accept-language=en&addressdetails=1"
    headers = {"User-Agent": "TripPlannerAgent/1.0 (contact@tripplanner.ai)"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200 and len(response.json()) > 0:
                data = response.json()[0]
                display_name = data["display_name"]
                lat = float(data["lat"])
                lng = float(data["lon"])
                
                address = data.get("address", {})
                city = (
                    address.get("city") or 
                    address.get("town") or 
                    address.get("village") or 
                    address.get("municipality") or 
                    address.get("city_district") or
                    address.get("suburb") or
                    address.get("district") or
                    address.get("state_district") or
                    address.get("province") or
                    address.get("state") or
                    address.get("county") or
                    address.get("region")
                )
                country = address.get("country") or display_name.split(",")[-1].strip()
                
                if city and country:
                    clean_name = f"{city}, {country}"
                else:
                    parts = [p.strip() for p in display_name.split(",")]
                    if len(parts) >= 2:
                        clean_name = f"{parts[0]}, {parts[-1]}"
                    else:
                        clean_name = display_name
                        
                logger.info(f"geocode_location: Resolved '{place_name}' to clean_name='{clean_name}', raw_display_name='{display_name}'")
                res = {
                    "available": True,
                    "status": "LIVE",
                    "lat": lat,
                    "lng": lng,
                    "display_name": clean_name,
                    "raw_display_name": display_name,
                    "country": country
                }
                await cache.set_json(cache_key, res, ex=604800)
                return res
            logger.info(f"geocode_location: Failed to resolve '{place_name}'")
            return {"available": False, "status": "NONE", "reason": f"Could not locate '{place_name}'."}
    except Exception as e:
        logger.error(f"geocode_location exception: {e}")
        return {"available": False, "status": "NONE", "reason": f"Geocoding service unavailable: {e}"}

@tool
async def get_weather(lat: float, lng: float, start_date: str, end_date: str) -> dict:
    """Get the weather forecast or historical average for a specific coordinate and date range. Dates should be in YYYY-MM-DD format."""
    import httpx
    from datetime import datetime, date
    
    # Horizon check: if start_date > 16 days out, label historical average
    note_text = "Forecast data."
    try:
        if start_date:
            d_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
            if (d_obj - date.today()).days > 16:
                month_name = d_obj.strftime("%B")
                note_text = f"Historical climate averages: Typical for {month_name}."
    except Exception:
        pass

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"get_weather: Fetched forecast data for lat={lat}, lng={lng}")
                return {
                    "available": True,
                    "status": "LIVE",
                    "daily": data.get("daily", {}),
                    "note": note_text
                }
            logger.info(f"get_weather: Failed to fetch weather for lat={lat}, lng={lng}")
            return {"available": False, "status": "NONE", "reason": "Failed to fetch weather from forecast service."}
    except Exception as e:
        logger.error(f"get_weather exception: {e}")
        return {"available": False, "status": "NONE", "reason": f"Weather service error: {e}"}

@tool
async def find_places(lat: float, lng: float, kind: str, radius_km: float = 5.0) -> dict:
    """Find local accommodations, foods (restaurants/cafes), or interesting places (attractions/museums/landmarks) around a lat/lng using Overpass API."""
    cache_key = f"places:{kind}:{round(lat, 4)}:{round(lng, 4)}"
    cached = await cache.get_json(cache_key)
    if cached:
        logger.info(f"find_places: Cache HIT for kind='{kind}', lat={lat}, lng={lng}")
        cached["status"] = "CACHED"
        return cached

    await overpass_limiter.acquire()
    import httpx
    radius_meters = int(radius_km * 1000)
    
    if kind == "accommodation":
        tags = f'node["tourism"="hotel"](around:{radius_meters},{lat},{lng}); way["tourism"="hotel"](around:{radius_meters},{lat},{lng}); node["tourism"="hostel"](around:{radius_meters},{lat},{lng});'
    elif kind == "foods":
        tags = f'node["amenity"="restaurant"](around:{radius_meters},{lat},{lng}); node["amenity"="cafe"](around:{radius_meters},{lat},{lng});'
    else:
        tags = f'node["tourism"="attraction"](around:{radius_meters},{lat},{lng}); node["tourism"="museum"](around:{radius_meters},{lat},{lng}); node["historic"](around:{radius_meters},{lat},{lng});'
    
    query = f"""
    [out:json];
    (
      {tags}
    );
    out center 15;
    """
    
    url = "https://overpass-api.de/api/interpreter"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, data={"data": query})
            if response.status_code == 200:
                data = response.json()
                elements = data.get("elements", [])
                places = []
                for el in elements:
                    name = el.get("tags", {}).get("name")
                    if not name or name == "Unnamed Spot":
                        continue
                    tags_dict = el.get("tags", {})
                    category = tags_dict.get("tourism") or tags_dict.get("amenity") or tags_dict.get("historic") or "Place"
                    lat_val = el.get("lat") or el.get("center", {}).get("lat")
                    lng_val = el.get("lon") or el.get("center", {}).get("lon")
                    address = tags_dict.get("addr:street", "") + " " + tags_dict.get("addr:housenumber", "")
                    
                    places.append({
                        "name": name,
                        "category": category.title(),
                        "lat": lat_val,
                        "lng": lng_val,
                        "address": address.strip() or "Local Area",
                        "image_url": None,
                        "source_url": f"https://www.openstreetmap.org/{el['type']}/{el['id']}"
                    })
                logger.info(f"find_places: Found {len(places)} real places of kind '{kind}' around lat={lat}, lng={lng}")
                if places:
                    res = {"available": True, "status": "LIVE", "places": places[:10]}
                    await cache.set_json(cache_key, res, ex=86400)
                    return res
            logger.info(f"find_places: Overpass query returned empty/error code for lat={lat}, lng={lng}")
            return {"available": False, "status": "NONE", "places": [], "reason": "Overpass query returned empty/error state."}
    except Exception as e:
        logger.error(f"find_places exception: {e}")
        return {"available": False, "status": "NONE", "places": [], "reason": f"Places service exception: {e}"}

@tool
async def get_route(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float, mode: str = "road") -> dict:
    """Calculate driving distance (km) and estimated travel duration (hours) between two coordinates using OSRM. mode should be 'road'."""
    import httpx
    url = f"https://router.project-osrm.org/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=false"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                routes = data.get("routes", [])
                if routes:
                    route = routes[0]
                    distance_km = route.get("distance", 0) / 1000.0
                    duration_hours = route.get("duration", 0) / 3600.0
                    logger.info(f"get_route: Resolved route of distance={distance_km:.1f} km, duration={duration_hours:.2f} hrs")
                    return {
                        "available": True,
                        "distance_km": round(distance_km, 1),
                        "duration_hours": round(duration_hours, 2),
                        "mode": mode
                    }
                logger.info("get_route: No routes found via OSRM")
                return {"available": False, "reason": "No routes found between these locations."}
            logger.info(f"get_route: OSRM router failed with status {response.status_code}")
            return {"available": False, "reason": f"OSRM router failed with code {response.status_code}"}
    except Exception as e:
        logger.warn(f"get_route exception, fallback to haversine: {e}")
        from app.services.flights import haversine
        dist = haversine(origin_lat, origin_lng, dest_lat, dest_lng)
        dur = dist / 60.0
        return {
            "available": True,
            "distance_km": round(dist, 1),
            "duration_hours": round(dur, 2),
            "mode": mode,
            "note": "Estimated via straight-line heuristic distance."
        }

@tool
async def convert_currency(amount: float, from_currency: str, to_currency: str) -> dict:
    """Convert a budget currency amount to another target currency using live Open Exchange Rates API. from_currency and to_currency should be 3-letter codes like 'USD', 'INR'."""
    import httpx
    url = f"https://open.er-api.com/v6/latest/{from_currency.upper()}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                rates = data.get("rates", {})
                rate = rates.get(to_currency.upper())
                if rate:
                    converted = amount * rate
                    logger.info(f"convert_currency: Converted {amount} {from_currency} -> {converted:.2f} {to_currency} at rate {rate}")
                    return {
                        "available": True,
                        "original_amount": amount,
                        "converted_amount": round(converted, 2),
                        "rate": rate,
                        "from_currency": from_currency.upper(),
                        "to_currency": to_currency.upper()
                    }
                logger.info(f"convert_currency: Code '{to_currency}' not found in rate list")
                return {"available": False, "reason": f"Currency code '{to_currency}' not found in exchange rate tables."}
            logger.info(f"convert_currency: Open rate endpoint returned code {response.status_code}")
            return {"available": False, "reason": f"Exchange rate service failed with code {response.status_code}"}
    except Exception as e:
        logger.warn(f"convert_currency exception, fallback ratios: {e}")
        fallback_rates = {"USD": 1.0, "INR": 83.5, "EUR": 0.92, "GBP": 0.79}
        f_rate = fallback_rates.get(to_currency.upper(), 1.0) / fallback_rates.get(from_currency.upper(), 1.0)
        return {
            "available": True,
            "original_amount": amount,
            "converted_amount": round(amount * f_rate, 2),
            "rate": f_rate,
            "from_currency": from_currency.upper(),
            "to_currency": to_currency.upper(),
            "note": "Estimated via offline fallback currency ratios."
        }

@tool
async def submit_final_itinerary(
    destination: str,
    map_coordinates: Dict[str, float],
    currency: str,
    total_budget_usd: int,
    total_budget_local: int,
    estimated_cost_usd: int,
    estimated_cost_local: int,
    flights: List[Dict[str, Any]],
    recommended_hotels: List[Dict[str, Any]],
    local_transportation: str,
    nearby_landmarks: List[str],
    itinerary: List[Dict[str, Any]],
    costBreakdown: Optional[Dict[str, Any]] = None
) -> dict:
    """MUST be called when you have gathered all necessary information to submit the final structured itinerary to the user. Do not call this until you have all the daily activities fully planned out with costs and timings!"""
    logger.info(f"submit_final_itinerary: Generating itinerary for destination='{destination}' (days={len(itinerary)})")
    res = {
        "destination": destination,
        "map_coordinates": map_coordinates,
        "currency": currency,
        "total_budget_usd": total_budget_usd,
        "total_budget_local": total_budget_local,
        "estimated_cost_usd": estimated_cost_usd,
        "estimated_cost_local": estimated_cost_local,
        "flights": flights,
        "recommended_hotels": recommended_hotels,
        "local_transportation": local_transportation,
        "nearby_landmarks": nearby_landmarks,
        "itinerary": itinerary
    }
    if costBreakdown is not None:
        res["costBreakdown"] = costBreakdown
    return res

def get_all_tools():
    return [geocode_location, get_weather, find_places, get_route, convert_currency, submit_final_itinerary]
