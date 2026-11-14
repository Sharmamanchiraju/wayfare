import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { TripWithMessages } from './useChat';

export const useTrip = (tripId: number) => {
  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await api.get(`/trips/${tripId}`);
      return response.data as TripWithMessages;
    },
    refetchOnWindowFocus: false,
  });

  return {
    trip: tripQuery.data,
    isLoading: tripQuery.isLoading,
    error: tripQuery.error,
  };
};
