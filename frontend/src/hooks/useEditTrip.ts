import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface EditTripPayload {
  destination?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status?: string;
  persona_id?: number;
}

export const useEditTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EditTripPayload }) => {
      const response = await api.put(`/trips/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', variables.id] });
    },
  });
};
