"use client";

import { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, MapPin, ChevronDown, ChevronUp, MoveUp, MoveDown, Compass, 
  Map, Sparkles, Navigation, AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrip } from '@/hooks/useTrip';
import { AppShell, Card, Button, Badge } from '@/components/ui';
import { clsx } from 'clsx';

import api from '../../../../utils/api';

// Dynamically import RouteMap to avoid Leaflet SSR build errors
const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] rounded-2xl bg-gray-50 border border-border flex items-center justify-center select-none">
      <div className="flex flex-col items-center gap-4">
        <div className="w-9 h-9 border-2 border-border border-t-primary rounded-full animate-spin" />
        <p className="text-text-secondary text-xs font-bold tracking-wider uppercase">Loading Route Map…</p>
      </div>
    </div>
  )
});

// Mock locations dataset with geo coordinates around Manali
const MANALI_STOPS = [
  { id: 'manali-center', name: 'Manali Town Center', locality: 'Hadimba Road', lat: 32.2396, lng: 77.1887, note: 'Arrival at transit terminal, local exploration.', img: '/kyoto.png' },
  { id: 'hidimba-temple', name: 'Hidimba Devi Temple', locality: 'Dhungri Park', lat: 32.2475, lng: 77.1798, note: '16th century wooden temple.', img: '/kyoto.png' },
  { id: 'old-manali', name: 'Old Manali Café Street', locality: 'Old Manali', lat: 32.2548, lng: 77.1824, note: 'Riverside trails, cafes, and backpacker hubs.', img: '/bali.png' },
  { id: 'solang-valley', name: 'Solang Valley Adventure', locality: 'Palchan Road', lat: 32.3165, lng: 77.1505, note: 'Paragliding, skiing, and dynamic ropeway.', img: '/swiss_alps.png' },
  { id: 'mall-road', name: 'Manali Mall Road', locality: 'Main Market', lat: 32.2426, lng: 77.1890, note: 'Local souvenir shopping and dining.', img: '/kyoto.png' },
  { id: 'rohtang-pass', name: 'Rohtang Pass Peak', locality: 'Leh Highway', lat: 32.3716, lng: 77.2466, note: 'High Himalayan glacier pass view.', img: '/swiss_alps.png' }
];

// Haversine formula to compute geo distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function MapRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = parseInt(resolvedParams.id, 10);

  const { isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const { trip, isLoading: tripLoading } = useTrip(tripId);
  const router = useRouter();

  // Stops list state
  const [stops, setStops] = useState(MANALI_STOPS);
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);
  
  // Interactive map states
  const [activeStop, setActiveStop] = useState<any>(null);
  const [fitAllTrigger, setFitAllTrigger] = useState(0);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const getFallbackImage = (idx: number) => {
    const images = ['/kyoto.png', '/swiss_alps.png', '/bali.png', '/paris.png'];
    return images[idx % images.length];
  };

  // Expand trip destinations stops if dynamically loaded
  useEffect(() => {
    if (trip?.trip_data?.itinerary?.itinerary) {
      const allStops: any[] = [];
      const days = trip.trip_data.itinerary.itinerary;
      days.forEach((day: any) => {
        if (day.stops && Array.isArray(day.stops)) {
          day.stops.forEach((stop: any, idx: number) => {
            if (stop.lat && stop.lng) {
              allStops.push({
                id: stop.id || `${day.day}-${idx}-${stop.title}`,
                name: stop.title,
                locality: stop.desc || 'Local Area',
                lat: parseFloat(stop.lat),
                lng: parseFloat(stop.lng),
                note: stop.desc || 'Sightseeing stop',
                img: getFallbackImage(idx)
              });
            }
          });
        }
      });
      if (allStops.length > 0) {
        setStops(allStops);
      }
    }
  }, [trip]);

  // Compute reactive route details (total distance and travel time) based on current reordered stops
  const routeStats = useMemo(() => {
    let totalDist = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      totalDist += getDistance(stops[i].lat, stops[i].lng, stops[i+1].lat, stops[i+1].lng);
    }
    
    // Curvature roads factor multiplier
    const finalDist = totalDist * 1.35;
    // Estimate 35 km/h in mountain terrain
    const totalHours = finalDist / 35;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    return {
      distance: `${finalDist.toFixed(0)} km`,
      time: `${hours}h ${minutes}m`
    };
  }, [stops]);

  // Up/Down reorder actions
  const moveStop = async (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= stops.length) return;

    let updatedStops: any[] = [];
    setStops(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[nextIndex];
      updated[nextIndex] = temp;
      updatedStops = updated;
      return updated;
    });
    
    // Trigger map auto bounds refit
    setFitAllTrigger(prev => prev + 1);

    try {
      await api.put(`/trips/${tripId}/route`, {
        stops: updatedStops.map(s => ({
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          name: s.name,
          note: s.note || '',
          img: s.img || ''
        }))
      });
    } catch (err) {
      console.error('Failed to save route order changes to backend API', err);
    }
  };

  const handleStopClick = (stop: any) => {
    setExpandedStopId(prev => prev === stop.id ? null : stop.id);
    setActiveStop(stop);
  };

  const handleViewFullRoute = () => {
    setActiveStop(null);
    setFitAllTrigger(prev => prev + 1);
  };

  if (authLoading || tripLoading) {
    return (
      <div className="h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary text-xs tracking-wider uppercase font-bold">Loading…</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="h-screen bg-app-bg flex flex-col items-center justify-center p-6 text-center select-none">
        <h1 className="text-xl font-bold text-text-primary">Trip Plan Not Found</h1>
        <Link href="/dashboard" className="text-primary hover:underline mt-4 text-sm font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <AppShell
      activeItem="Itinerary"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="space-y-6 text-left">
        
        {/* Header navigation bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Map Route Planner
            </h1>
            <p className="text-xs text-text-secondary font-medium">
              Manage stops sequence order, calculate routes and view destinations
            </p>
          </div>

          <Link href={`/trips/${tripId}/itinerary`} className="h-9 px-4.5 rounded-xl border border-border bg-white text-xs font-bold text-text-primary flex items-center gap-2 hover:bg-gray-50/50 transition-colors shadow-2xs">
            <ArrowLeft className="w-3.5 h-3.5 text-text-secondary" />
            <span>Back to Itinerary Timeline</span>
          </Link>
        </div>

        {/* SPLIT SCREEN VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT PANEL: ITINERARY PLACES (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-border rounded-2xl p-5 shadow-2xs flex flex-col justify-between h-[550px]">
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider select-none mb-3">
                Itinerary Places Stops
              </h3>

              {/* Vertical stops list */}
              <div className="space-y-2">
                {stops.map((stop, idx) => {
                  const isExpanded = expandedStopId === stop.id;
                  const isStart = idx === 0;
                  const isEnd = idx === stops.length - 1;

                  return (
                    <div 
                      key={stop.id}
                      className={clsx(
                        "rounded-xl border transition-all duration-200 select-none",
                        isExpanded ? "border-primary bg-primary-50/15" : "border-border bg-white"
                      )}
                    >
                      {/* Summary row clickable */}
                      <div 
                        onClick={() => handleStopClick(stop)}
                        className="p-3 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Number badge */}
                          <div className={clsx(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0",
                            isStart ? "bg-success" : isEnd ? "bg-error" : "bg-primary"
                          )}>
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-text-primary truncate">
                              {stop.name}
                            </h4>
                            <span className="text-[10px] text-text-secondary font-bold truncate block">
                              {stop.locality}
                            </span>
                          </div>
                        </div>

                        {/* Expand chevron and Reordering arrows buttons */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={isStart}
                            onClick={() => moveStop(idx, 'up')}
                            className="p-1 hover:bg-gray-100 disabled:opacity-30 rounded-lg text-text-secondary cursor-pointer"
                            title="Move Stop Up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={isEnd}
                            onClick={() => moveStop(idx, 'down')}
                            className="p-1 hover:bg-gray-100 disabled:opacity-30 rounded-lg text-text-secondary cursor-pointer"
                            title="Move Stop Down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                      </div>

                      {/* Expandable details notes panel */}
                      {isExpanded && (
                        <div className="px-4.5 pb-4.5 pt-1.5 border-t border-border/60 text-left space-y-3 animate-fade-in">
                          <p className="text-[11px] text-text-secondary leading-normal font-semibold">
                            {stop.note}
                          </p>
                          <div className="w-full h-24 rounded-lg overflow-hidden border border-border bg-gray-50">
                            <img 
                              src={stop.img} 
                              alt={stop.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Bottom summary metrics row */}
            <div className="border-t border-border pt-4 mt-4 select-none space-y-4">
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-0.5 border-r border-border">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Total Distance</span>
                  <p className="text-base font-extrabold text-text-primary">{routeStats.distance}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Travel Time</span>
                  <p className="text-base font-extrabold text-text-primary">{routeStats.time}</p>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleViewFullRoute}
                className="w-full h-10 text-xs font-bold gap-1.5 justify-center shadow-md shadow-primary-500/10 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>View Full Route</span>
              </Button>

            </div>

          </div>

          {/* RIGHT PANEL: MAP (7 cols) */}
          <div className="lg:col-span-7 h-[550px]">
            <RouteMap 
              stops={stops} 
              activeStop={activeStop} 
              fitAllTrigger={fitAllTrigger} 
            />
          </div>

        </div>

      </div>
    </AppShell>
  );
}
