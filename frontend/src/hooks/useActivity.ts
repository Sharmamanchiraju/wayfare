import { useState, useEffect } from 'react';

export interface ActivityItemType {
  id: number;
  type: 'update' | 'save' | 'budget' | 'complete' | 'create';
  text: string;
  subtitle?: string;
  time: string;
  tripId?: number;
}

export const useActivity = () => {
  const [activities, setActivities] = useState<ActivityItemType[]>([]);
  const [limit, setLimit] = useState(5);

  useEffect(() => {
    const mockActivities: ActivityItemType[] = [
      { id: 1, type: 'update', text: "Tokyo itinerary updated", time: "3 hours ago", tripId: 101 },
      { id: 2, type: 'save', text: "New places saved in Tokyo trip", subtitle: "5 new spots", time: "5 hours ago", tripId: 101 },
      { id: 3, type: 'budget', text: "Budget updated for Thailand trip", time: "1 day ago", tripId: 106 },
      { id: 4, type: 'complete', text: "Trip to Bali completed", time: "2 days ago", tripId: 102 },
      { id: 5, type: 'create', text: "Switzerland travel workspace created", time: "4 days ago", tripId: 103 },
      { id: 6, type: 'save', text: "Eiffel Tower saved in Europe Itinerary", time: "5 days ago", tripId: 104 },
      { id: 7, type: 'update', text: "Kerala flight itinerary added", time: "1 week ago", tripId: 105 },
    ];
    setActivities(mockActivities);
  }, []);

  const visibleActivities = activities.slice(0, limit);
  const hasMore = activities.length > limit;

  const loadMore = () => {
    setLimit(prev => prev + 5);
  };

  return { activities: visibleActivities, hasMore, loadMore };
};
