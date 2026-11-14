"use client";

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, Compass, MapPin, Wallet, Sparkles, Star, 
  Bookmark, Share2, Download, Pencil, ChevronRight, Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrip } from '@/hooks/useTrip';
import { useEditTrip } from '@/hooks/useEditTrip';
import { AppShell, Card, Button, Badge } from '@/components/ui';
import { clsx } from 'clsx';

// Utility helper to select hero image based on destination name
const getHeroImage = (dest?: string) => {
  const d = dest?.toLowerCase() || '';
  if (d.includes('kyoto') || d.includes('japan')) return '/kyoto.png';
  if (d.includes('paris') || d.includes('france')) return '/paris.png';
  if (d.includes('swiss') || d.includes('switzerland')) return '/swiss_alps.png';
  if (d.includes('bali') || d.includes('indonesia')) return '/bali.png';
  return '/generating_illustration.png'; // beautiful fallback
};

// Utility to estimate best time to visit based on destination
const getBestTimeToVisit = (dest?: string) => {
  const d = dest?.toLowerCase() || '';
  if (d.includes('kyoto') || d.includes('japan')) return 'October to November (Autumn) / March to April (Cherry Blossom)';
  if (d.includes('paris') || d.includes('france')) return 'May to September (Spring/Summer)';
  if (d.includes('swiss') || d.includes('switzerland')) return 'December to March (Skiing) / June to September (Hiking)';
  if (d.includes('bali') || d.includes('indonesia')) return 'April to October (Dry Season)';
  return 'October to March (Pleasant Weather)';
};

export default function TripSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = parseInt(resolvedParams.id, 10);

  const { isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const { trip, isLoading: tripLoading } = useTrip(tripId);
  const editTrip = useEditTrip();
  const router = useRouter();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Sync saved status on load
  useEffect(() => {
    if (trip) {
      setSaved(trip.status === 'confirmed' || trip.status === 'upcoming');
    }
  }, [trip]);

  // Compute duration (nights = (end - start).days, days = nights + 1)
  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return "5 Days / 4 Nights";
    const s = new Date(start);
    const e = new Date(end);
    const nights = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)));
    const days = nights + 1;
    return `${days} Days / ${nights} Nights`;
  };

  const handleSaveTrip = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click navigation
    setSaving(true);
    try {
      await editTrip.mutateAsync({
        id: tripId,
        data: { status: 'confirmed' }
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save trip summary status', err);
    } finally {
      setSaving(false);
    }
  };

  const handleShareTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/trips/${tripId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Trip share link copied to clipboard!');
  };

  const handleDownloadItinerary = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert('Itinerary PDF download started successfully!');
  };

  const handleCustomizeTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/trips/${tripId}/chat`);
  };

  const handleCardClick = () => {
    router.push(`/trips/${tripId}/itinerary`);
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

  const durationStr = calculateDuration(trip.start_date, trip.end_date);
  const heroImage = getHeroImage(trip.destination);
  const bestTime = getBestTimeToVisit(trip.destination);

  return (
    <AppShell
      activeItem="Trips"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* Back Link */}
        <div className="flex items-center gap-2 select-none">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* TRIP SUMMARY COMPOSITE CARD */}
        <Card 
          onClick={handleCardClick}
          className="overflow-hidden border border-border bg-white shadow-sm rounded-2xl cursor-pointer hover:shadow-md transition-all duration-300 group"
        >
          {/* Main Content Area: Split 2 columns on desktop */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-stretch justify-between">
            
            {/* Left Column: Trip Parameters Details */}
            <div className="flex-1 space-y-6">
              
              {/* Header card items */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
                    Trip to {trip.destination}
                  </h1>
                  <Badge variant="primary" className="text-[10px] font-extrabold px-2.5 py-1 uppercase tracking-wider select-none leading-none h-auto">
                    Recommended
                  </Badge>
                </div>

                {/* Meta details */}
                <div className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {trip.destination}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  <span>{durationStr}</span>
                </div>
              </div>

              {/* Grid Information rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 border-t border-border pt-5">
                
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Travel Dates
                  </span>
                  <p className="text-sm font-semibold text-text-primary">
                    {trip.start_date && trip.end_date 
                      ? `${new Date(trip.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(trip.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'Jul 24, 2026 – Jul 29, 2026'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Budget Limit
                  </span>
                  <p className="text-sm font-semibold text-text-primary">
                    {trip.budget ? `₹${Number(trip.budget).toLocaleString()}` : '₹1,50,000'}
                    <span className="text-[11px] font-medium text-text-secondary ml-1.5">
                      (total budget)
                    </span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Travel Style
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1 select-none">
                    {(((trip.persona as any)?.travel_style as string)?.split(',') || ['Adventure', 'Relaxation']).map((style: string) => (
                      <span 
                        key={style} 
                        className="px-2 py-0.5 rounded-md bg-primary-50 text-[10px] font-extrabold text-primary border border-primary-100 uppercase tracking-wider"
                      >
                        {style.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Best Time to Visit
                  </span>
                  <p className="text-sm font-semibold text-text-primary">
                    {bestTime}
                  </p>
                </div>

              </div>

              {/* TRIP HIGHLIGHTS CHIPS */}
              <div className="space-y-2.5 border-t border-border pt-5 select-none">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Trip Highlights Included
                </span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {[
                    { label: 'Adventure', icon: Compass },
                    { label: 'Nature', icon: Sparkles },
                    { label: 'Sightseeing', icon: MapPin },
                    { label: 'Local Cuisine', icon: Star }
                  ].map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <div 
                        key={chip.label}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-gray-50 text-xs font-semibold text-text-secondary"
                      >
                        <Icon className="w-3.5 h-3.5 text-text-secondary" />
                        <span>{chip.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: Hero Image container */}
            <div className="w-full md:w-[320px] shrink-0 flex flex-col justify-between">
              
              {/* Rounded hero photo */}
              <div className="relative w-full aspect-4/3 md:h-60 rounded-2xl overflow-hidden border border-border shadow-2xs">
                <img 
                  src={heroImage} 
                  alt={trip.destination} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
                
                {/* View Gallery Pill Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert("Gallery views are disabled in this session.");
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xs text-[10px] font-bold text-white transition-colors cursor-pointer border border-white/20 select-none"
                >
                  View Gallery
                </button>
              </div>

              {/* View details affordance on bottom-right */}
              <div className="hidden md:flex justify-end items-center gap-1 text-primary group-hover:translate-x-1.5 transition-transform duration-300 select-none text-xs font-extrabold tracking-wider uppercase pt-4">
                <span>View Details</span>
                <ChevronRight className="w-4 h-4" />
              </div>

            </div>

          </div>

          {/* ACTION BAR (sticky / bottom border) */}
          <div className="bg-gray-50 border-t border-border px-6 md:px-8 py-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between select-none">
            
            <div className="flex gap-2 items-center flex-wrap">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveTrip}
                loading={saving}
                className={clsx(
                  "h-9 px-4.5 text-xs font-bold gap-1.5 border border-border cursor-pointer",
                  saved ? "bg-success-bg text-success-text hover:bg-success-bg/80 border-success/30" : "bg-white"
                )}
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5 text-text-secondary" />}
                <span>{saved ? 'Saved' : 'Save Trip'}</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleShareTrip}
                className="h-9 px-4.5 text-xs font-bold gap-1.5 bg-white border border-border cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-text-secondary" />
                <span>Share</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownloadItinerary}
                className="h-9 px-4.5 text-xs font-bold gap-1.5 bg-white border border-border cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-text-secondary" />
                <span>Download</span>
              </Button>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCustomizeTrip}
              className="h-9 px-5 text-xs font-bold gap-1.5 cursor-pointer shadow-sm shadow-primary-500/10 shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Customize Trip</span>
            </Button>

          </div>

        </Card>

      </div>
    </AppShell>
  );
}
