import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: number) => {
      const response = await api.delete(`/trips/${tripId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};
