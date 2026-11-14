import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface CreateTripPayload {
  destination: string;
  start_date: string;
  end_date: string;
  budget?: number;
  travelers?: string;
  interests?: string[];
  persona_id?: number;
  status: string;
}

export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTripPayload) => {
      const response = await api.post('/trips', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};
