import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface Persona {
  id: number;
  name: string;
  travel_style: string;
  budget_min?: number;
  budget_max?: number;
  trip_duration?: number;
  description?: string;
  preferred_destination?: string;
}

export const usePersonas = () => {
  const queryClient = useQueryClient();

  const personasQuery = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await api.get('/personas');
      return response.data as Persona[];
    },
  });

  const createPersona = useMutation({
    mutationFn: async (newPersona: Omit<Persona, 'id'>) => {
      const response = await api.post('/personas', newPersona);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });

  const updatePersona = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Persona> }) => {
      const response = await api.put(`/personas/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });

  const deletePersona = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/personas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });

  return {
    personas: personasQuery.data || [],
    isLoading: personasQuery.isLoading,
    error: personasQuery.error,
    createPersona,
    updatePersona,
    deletePersona,
  };
};
