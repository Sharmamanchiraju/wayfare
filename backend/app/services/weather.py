# pyrefly: ignore [missing-import]
import httpx
from typing import Dict, Any
from async_lru import alru_cache

@alru_cache(maxsize=100)
async def get_weather_forecast(lat: float, lon: float, days: int = 7) -> Dict[str, Any]:
    """
    Fetches the weather forecast for a given location (latitude, longitude) for the specified number of days.
    """
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days={days}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                return {"status": "success", "data": data}
            return {"status": "error", "message": f"Failed to fetch weather: API returned status {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": f"Weather service temporarily unavailable."}
