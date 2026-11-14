import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { Trip } from './useTrips';

export interface Message {
  id?: number;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any;
  created_at?: string;
  isOptimistic?: boolean;
}

export interface TripWithMessages extends Trip {
  messages: Message[];
  trip_data?: any;
}

export const useChat = (tripId: number) => {
  const queryClient = useQueryClient();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // 1. Fetch initial trip data and history
  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await api.get(`/trips/${tripId}`);
      return response.data as TripWithMessages;
    },
    refetchOnWindowFocus: false,
  });

  // 2. Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (messageContent: string) => {
      const response = await api.post(`/trips/${tripId}/chat`, { message: messageContent });
      return response.data;
    },
    onMutate: async (newMessageContent) => {
      // Optimistic UI update
      await queryClient.cancelQueries({ queryKey: ['trip', tripId] });
      
      const previousTrip = queryClient.getQueryData<TripWithMessages>(['trip', tripId]);
      
      const optimisticMsg: Message = {
        role: 'user',
        content: newMessageContent,
        isOptimistic: true,
      };

      setLocalMessages(prev => [...prev, optimisticMsg]);
      
      return { previousTrip, optimisticMsg };
    },
    onSuccess: (data) => {
      // Data contains { success, response, trip_data, tool_calls, message_id }
      // We'll let the next refetch sync the full state, but we can optimistically add the assistant response here too
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      
      const assistantMsg: Message = {
        id: data.message_id,
        role: 'assistant',
        content: data.response,
        tool_calls: data.tool_calls ? { calls: data.tool_calls } : undefined,
      };
      
      setLocalMessages(prev => [...prev.filter(m => !m.isOptimistic), assistantMsg]);
    },
    onError: (err, newMsg, context) => {
      // Revert optimistic update
      if (context?.previousTrip) {
        queryClient.setQueryData(['trip', tripId], context.previousTrip);
      }
      setLocalMessages(prev => prev.filter(m => !m.isOptimistic));
      console.error("Chat error:", err);
    },
  });

  // Combine server messages with optimistic local messages
  const serverMessages = tripQuery.data?.messages || [];
  
  // We only show local messages if they aren't fully synced yet
  // In a robust implementation, we'd merge them more carefully based on IDs
  // For now, if we have local uncommitted messages, append them
  const displayMessages = [...serverMessages];
  
  const uncommittedLocal = localMessages.filter(m => m.isOptimistic);
  if (sendMessage.isPending && uncommittedLocal.length > 0) {
    displayMessages.push(uncommittedLocal[uncommittedLocal.length - 1]);
  }

  const send = useCallback(async (content: string) => {
    if (sendMessage.isPending) return;
    return await sendMessage.mutateAsync(content);
  }, [sendMessage]);

  return {
    trip: tripQuery.data,
    messages: displayMessages,
    isLoading: tripQuery.isLoading,
    isSending: sendMessage.isPending,
    error: tripQuery.error || sendMessage.error,
    sendMessage: send,
    itineraryData: tripQuery.data?.trip_data,
  };
};
