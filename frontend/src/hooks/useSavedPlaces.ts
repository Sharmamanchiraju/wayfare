import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export interface SavedPlaceType {
  id: number;
  name: string;
  location: string;
  type: 'Restaurant' | 'Landmark' | 'Hotel' | 'Activity';
  addedToTripsCount: number;
  image: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export const useSavedPlaces = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [localPlaces, setLocalPlaces] = useState<SavedPlaceType[]>([]);

  // Fetch saved places from backend
  const savedPlacesQuery = useQuery({
    queryKey: ['saved-places'],
    queryFn: async () => {
      const response = await api.get('/saved-places');
      return response.data;
    }
  });

  const savePlace = useMutation({
    mutationFn: async (placeData: any) => {
      const response = await api.post('/saved-places', placeData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-places'] });
    }
  });

  const removePlaceMutation = useMutation({
    mutationFn: async (placeId: number) => {
      await api.delete(`/saved-places/${placeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-places'] });
    }
  });

  // Default high quality items
  const mockPlaces: SavedPlaceType[] = [
    { id: 1, name: "Senso-ji Temple", location: "Asakusa, Tokyo", type: "Landmark", addedToTripsCount: 3, image: "/travel_hero_bg.png" },
    { id: 2, name: "Shibuya Crossing", location: "Shibuya, Tokyo", type: "Landmark", addedToTripsCount: 4, image: "/travel_hero_bg.png" },
    { id: 3, name: "Eiffel Tower", location: "Paris, France", type: "Landmark", addedToTripsCount: 5, image: "/travel_hero_bg.png" },
    { id: 4, name: "Hotel Cluny Sorbonne", location: "Paris, France", type: "Hotel", addedToTripsCount: 1, image: "/travel_hero_bg.png" },
    { id: 5, name: "Ichiran Ramen", location: "Shinjuku, Tokyo", type: "Restaurant", addedToTripsCount: 2, image: "/travel_hero_bg.png" },
    { id: 6, name: "Park Hyatt Tokyo", location: "Shinjuku, Tokyo", type: "Hotel", addedToTripsCount: 1, image: "/travel_hero_bg.png" },
    { id: 7, name: "Louvre Museum", location: "Paris, France", type: "Landmark", addedToTripsCount: 4, image: "/travel_hero_bg.png" },
    { id: 8, name: "Mount Fuji Day Trip", location: "Shizuoka, Japan", type: "Activity", addedToTripsCount: 3, image: "/travel_hero_bg.png" },
    { id: 9, name: "Tsujiki Outer Market", location: "Chuo, Tokyo", type: "Restaurant", addedToTripsCount: 2, image: "/travel_hero_bg.png" }
  ];

  // Combine backend list with fallback defaults
  useEffect(() => {
    if (savedPlacesQuery.data && savedPlacesQuery.data.length > 0) {
      const mapped = savedPlacesQuery.data.map((p: any) => ({
        id: p.id,
        name: p.place_name,
        location: p.notes || 'Tokyo',
        type: (p.place_type || 'Landmark') as any,
        addedToTripsCount: 1,
        image: "/travel_hero_bg.png"
      }));
      setLocalPlaces(mapped);
    } else {
      setLocalPlaces(mockPlaces);
    }
  }, [savedPlacesQuery.data]);

  const filteredPlaces = localPlaces.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(search.toLowerCase()) || 
                          place.location.toLowerCase().includes(search.toLowerCase());
    
    let targetFilter = filterType;
    if (filterType === 'Activities') targetFilter = 'Activity';
    if (filterType === 'Hotels') targetFilter = 'Hotel';
    if (filterType === 'Landmarks') targetFilter = 'Landmark';
    if (filterType === 'Restaurants') targetFilter = 'Restaurant';

    const matchesType = targetFilter === 'All' || place.type === targetFilter;
    return matchesSearch && matchesType;
  });

  return {
    places: filteredPlaces,
    search,
    setSearch,
    filterType,
    setFilterType,
    removePlace: (id: number) => {
      // Check if it's backend or mock item
      if (id > 100) {
        removePlaceMutation.mutate(id);
      } else {
        setLocalPlaces(prev => prev.filter(p => p.id !== id));
      }
    },
    savePlace
  };
};
