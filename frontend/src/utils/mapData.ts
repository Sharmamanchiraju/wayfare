export interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'destination' | 'hotel' | 'attraction' | 'flight';
  description?: string;
  price?: number;
  day?: number;
  time?: string;
}

export function parseTripDataToMap(tripData: any): MapLocation[] {
  if (!tripData) return [];
  
  const locations: MapLocation[] = [];
  
  // Base coordinates from the destination (if provided by agent)
  // Fallback to a default if the agent didn't provide it
  const baseLat = tripData.map_coordinates?.lat || tripData.map_coordinates?.latitude || 0;
  const baseLng = tripData.map_coordinates?.lon || tripData.map_coordinates?.longitude || 0;

  // 1. Destination
  if (tripData.destination) {
    locations.push({
      id: 'dest_main',
      name: tripData.destination,
      lat: baseLat,
      lng: baseLng,
      type: 'destination',
      description: 'Your Trip Destination'
    });
  }

  // Jitter function to scatter markers slightly around the main destination
  const jitter = () => (Math.random() - 0.5) * 0.05;

  // 2. Hotels
  if (Array.isArray(tripData.recommended_hotels)) {
    tripData.recommended_hotels.forEach((hotel: any, idx: number) => {
      locations.push({
        id: `hotel_${idx}`,
        name: hotel.name || 'Hotel',
        lat: hotel.lat || baseLat + jitter(),
        lng: hotel.lng || baseLng + jitter(),
        type: 'hotel',
        price: hotel.price_usd || hotel.price,
        description: hotel.description || 'Recommended accommodation'
      });
    });
  }

  // 3. Itinerary Activities (Attractions)
  if (Array.isArray(tripData.itinerary)) {
    tripData.itinerary.forEach((day: any) => {
      if (Array.isArray(day.activities)) {
        day.activities.forEach((activity: any, idx: number) => {
          locations.push({
            id: `act_${day.day}_${idx}`,
            name: activity.name || 'Activity',
            lat: activity.lat || baseLat + jitter(),
            lng: activity.lng || baseLng + jitter(),
            type: 'attraction',
            price: activity.cost_usd || activity.cost_local,
            description: activity.type || 'Planned activity',
            day: day.day,
            time: activity.time
          });
        });
      }
    });
  }

  return locations;
}
