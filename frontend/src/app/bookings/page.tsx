"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Ticket, Plane, Calendar, ArrowRight, Compass, Sparkles, MapPin, 
  Clock, AlertCircle, CheckCircle, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips, Trip } from '@/hooks/useTrips';
import { AppShell, Card, Button, Badge } from '@/components/ui';
import { clsx } from 'clsx';

// Utility helper to select hero image based on destination name
const getHeroImage = (dest?: string) => {
  const d = dest?.toLowerCase() || '';
  if (d.includes('kyoto') || d.includes('japan')) return '/kyoto.png';
  if (d.includes('paris') || d.includes('france')) return '/paris.png';
  if (d.includes('swiss') || d.includes('switzerland')) return '/swiss_alps.png';
  if (d.includes('bali') || d.includes('indonesia')) return '/bali.png';
  return '/generating_illustration.png'; // fallback
};

export default function BookingsListPage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { trips, isLoading: tripsLoading } = useTrips();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming');

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Compute duration in days/nights (nights = (end - start).days, days = nights + 1)
  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return "5 Days / 4 Nights";
    const s = new Date(start);
    const e = new Date(end);
    const nights = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)));
    const days = nights + 1;
    return `${days} Days / ${nights} Nights`;
  };

  // Filter trips based on active tab selection
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (!trip.destination || trip.status?.toLowerCase() === 'draft') return false;
      const status = trip.status?.toLowerCase();
      
      if (activeTab === 'Upcoming') {
        // confirmed, upcoming, active, planning are upcoming
        return status === 'confirmed' || status === 'upcoming' || status === 'active' || status === 'planning';
      }
      if (activeTab === 'Completed') {
        return status === 'completed';
      }
      if (activeTab === 'Cancelled') {
        return status === 'cancelled' || status === 'inactive';
      }
      return true;
    });
  }, [trips, activeTab]);

  const handleCardClick = (id: number) => {
    router.push(`/trips/${id}`);
  };

  if (authLoading || tripsLoading) {
    return (
      <div className="h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary text-xs tracking-wider uppercase font-bold">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      activeItem="Bookings"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="space-y-8 text-left max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="space-y-1 select-none">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
            My Stays & Bookings
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            View booking reservations, active schedules, and past trips history
          </p>
        </div>

        {/* Horizontal tabs list stepper */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar select-none border-b border-border pb-3.5">
          {(['Upcoming', 'Completed', 'Cancelled'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "px-5 py-2.5 rounded-full text-xs font-extrabold border transition-all duration-200 whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-text-secondary border-border hover:bg-gray-50/50 hover:text-text-primary"
                )}
              >
                {tab} Bookings
              </button>
            );
          })}
        </div>

        {/* TRIP LIST PER ACTIVE TAB */}
        <div className="space-y-4">
          {filteredTrips.length === 0 ? (
            
            /* EMPTY STATE CARD */
            <Card className="p-10 border border-border bg-white shadow-2xs rounded-2xl text-center space-y-5 select-none max-w-md mx-auto animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto shadow-2xs">
                {activeTab === 'Upcoming' ? (
                  <Calendar className="w-6.5 h-6.5 text-primary" />
                ) : activeTab === 'Completed' ? (
                  <CheckCircle className="w-6.5 h-6.5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-6.5 h-6.5 text-rose-500" />
                )}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-text-primary">
                  No {activeTab.toLowerCase()} bookings found
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  {activeTab === 'Upcoming' 
                    ? "You don't have any active travel reservations lined up."
                    : activeTab === 'Completed'
                    ? "No completed trips history found in your account."
                    : "No cancelled stay reservations found."}
                </p>
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="primary"
                className="h-9 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-primary-500/10 cursor-pointer mx-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Plan a New Trip</span>
              </Button>
            </Card>

          ) : (
            
            /* DYNAMIC BOOKINGS LIST */
            <div className="space-y-2.5">
              {filteredTrips.map((tripItem) => {
                const duration = calculateDuration(tripItem.start_date, tripItem.end_date);
                const thumbnail = getHeroImage(tripItem.destination);
                const status = tripItem.status?.toLowerCase();
                
                // Map status badges
                const isConfirmed = status === 'confirmed' || status === 'active';
                const isCancelled = status === 'cancelled' || status === 'inactive';
                const isStillPlanning = status === 'planning' || !tripItem.trip_data?.itinerary;
                const isPendingConf = !isConfirmed && !isCancelled && !isStillPlanning;

                return (
                  <Card
                    key={tripItem.id}
                    onClick={() => handleCardClick(tripItem.id)}
                    className="overflow-hidden border border-border bg-white rounded-2xl p-3.5 flex gap-4 hover:shadow-md transition-all duration-300 group cursor-pointer text-left relative"
                  >
                    
                    {/* Status Badge in top right */}
                    <div className="absolute top-4 right-4 select-none h-auto">
                      {isConfirmed && (
                        <Badge variant="success" className="text-[8px] font-extrabold px-2 py-0.5 tracking-wider uppercase leading-none bg-emerald-50 text-emerald-700 border-emerald-200/50">
                          Confirmed
                        </Badge>
                      )}
                      {isStillPlanning && (
                        <Badge variant="warning" className="text-[8px] font-extrabold px-2 py-0.5 tracking-wider uppercase leading-none bg-amber-50 text-amber-700 border-amber-200/50 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Planning
                        </Badge>
                      )}
                      {isPendingConf && (
                        <Badge variant="warning" className="text-[8px] font-extrabold px-2 py-0.5 tracking-wider uppercase leading-none bg-yellow-50 text-yellow-700 border-yellow-200/50">
                          Pending Confirmation
                        </Badge>
                      )}
                      {isCancelled && (
                        <Badge variant="error" className="text-[8px] font-extrabold px-2 py-0.5 tracking-wider uppercase leading-none bg-rose-50 text-rose-700 border-rose-200/50">
                          Cancelled
                        </Badge>
                      )}
                    </div>

                    {/* Thumbnail image box */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border bg-gray-50 select-none">
                      <img 
                        src={thumbnail} 
                        alt={tripItem.destination} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                      />
                    </div>

                    {/* Specifications column */}
                    <div className="flex-grow flex flex-col justify-between py-0.5 pr-12 min-w-0">
                      <div>
                        <h3 className="text-sm font-extrabold text-text-primary group-hover:text-primary transition-colors leading-none truncate">
                          {tripItem.destination} Trip
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium mt-2 select-none">
                          <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                          <span className="truncate">{tripItem.destination}</span>
                          <span className="w-1 h-1 rounded-full bg-border mx-1.5" />
                          <span className="shrink-0 font-mono tracking-tight">{duration}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary select-none mt-2">
                        <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="font-mono tracking-tight">
                          {tripItem.start_date && tripItem.end_date 
                            ? `${new Date(tripItem.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(tripItem.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : 'Jul 24 – Jul 29, 2026'}
                        </span>
                      </div>
                    </div>

                  </Card>
                );
              })}

              {/* Bottom full list overview button trigger */}
              <div className="pt-4 text-center select-none">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => alert("All stay bookings are displayed in this view.")}
                  className="h-10 px-6 text-xs font-bold bg-white border border-border cursor-pointer shadow-2xs hover:bg-gray-50/50"
                >
                  View All Bookings
                </Button>
              </div>

            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
