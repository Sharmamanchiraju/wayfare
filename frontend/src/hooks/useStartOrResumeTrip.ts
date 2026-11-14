import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrips } from './useTrips';

export const useStartOrResumeTrip = () => {
  const router = useRouter();
  const { trips, createTrip } = useTrips();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startOrResumeTrip = async () => {
    setIsPending(true);
    setError(null);
    try {
      // Find the most recent in-progress trip (destination is non-null and status in in-progress set)
      const inProgressTrip = trips
        .filter(t => 
          t.destination && 
          ['planning', 'in_progress', 'draft_trip', 'planned'].includes(t.status?.toLowerCase())
        )
        .sort((a, b) => b.id - a.id)[0];

      if (inProgressTrip) {
        router.push(`/trips/${inProgressTrip.id}/chat`);
      } else {
        // Start a new draft conversation (destination is null/None in DB)
        const newTrip = await createTrip.mutateAsync({
          destination: undefined as any,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
          status: "draft"
        });
        router.push(`/trips/${newTrip.id}/chat`);
      }
    } catch (err: any) {
      console.error("Failed to start or resume trip:", err);
      setError(err?.response?.data?.detail || err?.message || "Failed to initiate AI assistant session. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return {
    startOrResumeTrip,
    isPending,
    error
  };
};
