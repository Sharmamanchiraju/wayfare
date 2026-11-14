import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface Trip {
  id: number;
  destination: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status: string;
  persona_id?: number;
  conversation_id: string;
  created_at: string;
  updated_at: string;
  persona?: { id: number; name: string };
  trip_data?: any;
}

export const useTrips = (filters?: { page?: number; status?: string; search?: string }) => {
  const queryClient = useQueryClient();

  const tripsQuery = useQuery({
    queryKey: ['trips', filters],
    queryFn: async () => {
      const response = await api.get('/trips', { params: filters });
      return response.data as Trip[];
    },
  });

  const getOne = async (tripId: number) => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data as Trip;
  };

  const createTrip = useMutation({
    mutationFn: async (newTrip: any) => {
      const response = await api.post('/trips', newTrip);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const updateTrip = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/trips/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', variables.id] });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (tripId: number) => {
      const response = await api.delete(`/trips/${tripId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const exportTrip = async (tripId: number, format: string) => {
    const response = await api.get(`/trips/${tripId}/export`, { params: { format } });
    return response.data;
  };

  return {
    trips: tripsQuery.data || [],
    isLoading: tripsQuery.isLoading,
    error: tripsQuery.error,
    createTrip,
    updateTrip,
    deleteTrip,
    getOne,
    exportTrip
  };
};
