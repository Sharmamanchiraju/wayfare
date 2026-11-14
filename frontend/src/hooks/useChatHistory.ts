import { useState, useEffect } from 'react';
import { useTrips } from './useTrips';

export interface ChatHistoryItemType {
  id: number;
  destination: string;
  status: 'in progress' | 'completed' | 'saved';
  dates: string;
  timeframe: 'today' | 'yesterday' | 'this week';
}

export const useChatHistory = () => {
  const { trips } = useTrips();
  const [history, setHistory] = useState<ChatHistoryItemType[]>([]);

  useEffect(() => {
    const baseHistory: ChatHistoryItemType[] = trips
      .filter(t => t.destination && t.status?.toLowerCase() !== 'draft')
      .map((t, idx) => ({
        id: t.id,
        destination: t.destination,
      status: (t.status?.toLowerCase() === 'in progress' ? 'in progress' : 'saved') as any,
      dates: t.start_date && t.end_date ? `${t.start_date} - ${t.end_date}` : 'May 15 - May 22',
      timeframe: idx === 0 ? 'today' : idx === 1 ? 'yesterday' : 'this week'
    }));

    const mockHistory: ChatHistoryItemType[] = [
      { id: 101, destination: "Trip to Tokyo", status: "in progress", dates: "May 15 - May 22", timeframe: "today" },
      { id: 102, destination: "Weekend in Bali", status: "saved", dates: "Apr 10 - Apr 12", timeframe: "today" },
      { id: 103, destination: "Switzerland Trip Plan", status: "saved", dates: "Jun 20 - Jun 30", timeframe: "today" },
      { id: 104, destination: "Europe Itinerary", status: "saved", dates: "Jul 05 - Jul 25", timeframe: "yesterday" },
      { id: 105, destination: "Kerala Backpackers", status: "saved", dates: "Aug 12 - Aug 18", timeframe: "yesterday" },
      { id: 106, destination: "Thailand Adventure", status: "saved", dates: "Sep 01 - Sep 10", timeframe: "this week" },
    ];

    const combined = [...baseHistory];
    mockHistory.forEach(mock => {
      if (!combined.some(c => c.destination.toLowerCase().includes(mock.destination.toLowerCase()) || mock.destination.toLowerCase().includes(c.destination.toLowerCase()))) {
        combined.push(mock);
      }
    });

    setHistory(combined);
  }, [trips]);

  const deleteHistoryItem = (id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return { history, deleteHistoryItem };
};
