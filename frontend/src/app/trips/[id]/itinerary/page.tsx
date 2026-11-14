"use client";

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Home, Compass, Utensils, Camera, MapPin, Sparkles, Check, 
  AlertCircle, ChevronRight, HelpCircle, Footprints, Flame, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { AppShell, Card, Button, Badge } from '@/components/ui';
import { clsx } from 'clsx';

// Activity styling lookup
const ACTIVITY_TYPES = {
  hotel: { color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Home },
  adventure: { color: 'bg-orange-50 text-orange-600 border-orange-200', icon: Flame },
  food: { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: Utensils },
  sightseeing: { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: Camera },
  exploration: { color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Footprints },
  entertainment: { color: 'bg-pink-50 text-pink-600 border-pink-200', icon: Sparkles }
};

// Rich default/fallback itinerary data structure
const DEFAULT_ITINERARY = [
  {
    day: 1,
    title: "Arrival & Local Sightseeing",
    desc: "Explore the ancient wooden temples of Manali and walk through Old Manali's vibrant streets.",
    included: ["Hotel private transfer", "Guided sightseeing tour", "Hidimba Temple entry tickets"],
    tips: "Wear comfortable walking shoes and dress modestly inside the temple grounds.",
    image: "/kyoto.png",
    stops: [
      { time: "08:00 AM", type: "hotel", title: "Hotel check-in", desc: "Check-in at Manali Grand luxury hotel." },
      { time: "10:00 AM", type: "food", title: "Breakfast at Hotel Cafe", desc: "Traditional Himachali breakfast and coffee." },
      { time: "11:30 AM", type: "sightseeing", title: "Visit Hidimba Temple", desc: "16th-century wooden temple built inside thick cedar forests." },
      { time: "02:00 PM", type: "food", title: "Lunch at Old Manali Café", desc: "Delicious local Himachali cuisine and woodfired pizza." },
      { time: "04:00 PM", type: "exploration", title: "Mall Road Exploration", desc: "Browse souvenirs, wooden handicrafts, and local markets." },
      { time: "08:30 PM", type: "entertainment", title: "Dinner & Bonfire", desc: "Under-the-stars local dinner and music bonfire event." }
    ]
  },
  {
    day: 2,
    title: "Solang Valley Adventure",
    desc: "Experience the thrills of paragliding, zorbing, and mountain views at Solang Valley.",
    included: ["Paragliding flight permit", "Ski/Snow gear rental", "Adventure activities instructor"],
    tips: "Wear warm clothes, carry extra layers, and keep hydrated during outdoor activities.",
    image: "/swiss_alps.png",
    stops: [
      { time: "08:00 AM", type: "food", title: "Breakfast at Hotel", desc: "Fuel up with warm food and dynamic tea." },
      { time: "09:30 AM", type: "adventure", title: "Solang Valley Activities", desc: "Breathtaking paragliding flight and snow-scooter rides." },
      { time: "01:30 PM", type: "food", title: "Lunch at Adventure Camp", desc: "Buffer lunch served at base camp." },
      { time: "03:00 PM", type: "sightseeing", title: "Anjani Mahadev Temple Trek", desc: "Scenic walk to a sacred mountain waterfall shrine." },
      { time: "07:00 PM", type: "exploration", title: "Local Crafts Market", desc: "Shop handmade woolen shawls and spices." },
      { time: "08:30 PM", type: "food", title: "Traditional Himachali Dinner", desc: "Authentic Dham feast in traditional dining." }
    ]
  },
  {
    day: 3,
    title: "Rohtang Pass Excursion",
    desc: "Ascend to 13,058 feet to experience pristine snow, majestic glaciers, and panoramic peaks.",
    included: ["Rohtang Permit entry fee", "Shared luxury tourist shuttle", "Fleece protective jumpsuit"],
    tips: "Rohtang permits are limited; ensure they are verified. Keep warm wear handy.",
    image: "/swiss_alps.png",
    stops: [
      { time: "07:00 AM", type: "exploration", title: "Drive to Rohtang Pass", desc: "Scenic climb through winding mountain passes." },
      { time: "09:30 AM", type: "adventure", title: "Snow Activities at Rohtang", desc: "Tobogganing, snow ball throwing, and glacier walking." },
      { time: "01:00 PM", type: "food", title: "Pack Lunch at Rohtang", desc: "Delivered lunch box at high altitude." },
      { time: "03:30 PM", type: "sightseeing", title: "Rahala Waterfalls View", desc: "Cascading glacial water amidst deep pine valleys." },
      { time: "06:30 PM", type: "hotel", title: "Relax at Hotel Spa", desc: "Soothing massage to relax after the cold pass trip." },
      { time: "08:00 PM", type: "food", title: "Gala Dinner", desc: "Premium multi-cuisine dinner buffet at the hotel." }
    ]
  },
  {
    day: 4,
    title: "Kasol & Manikaran Day Trip",
    desc: "Visit the picturesque town of Kasol and experience the hot sulphur springs of Manikaran.",
    included: ["AC Sedan cab transport", "Mineral water bottles", "Parvati Valley tourist permit"],
    tips: "Carry a change of clothes if you plan to dip in the thermal hot springs.",
    image: "/bali.png",
    stops: [
      { time: "08:00 AM", type: "food", title: "Quick Breakfast at Hotel", desc: "Hot parathas and juice." },
      { time: "09:00 AM", type: "exploration", title: "Drive to Parvati Valley", desc: "Gorgeous valley roads alongside the Parvati River." },
      { time: "11:30 AM", type: "exploration", title: "Kasol Café Trail Walk", desc: "Stroll around the famous Riverside cafes and markets." },
      { time: "02:00 PM", type: "food", title: "Lunch at Evergreen Café", desc: "Charming cafe serving international food." },
      { time: "03:30 PM", type: "sightseeing", title: "Manikaran Hot Springs", desc: "Visit Manikaran Sahib Gurudwara thermal natural pools." },
      { time: "08:30 PM", type: "hotel", title: "Dinner back at Hotel", desc: "Warm dinner served in hotel rooms." }
    ]
  },
  {
    day: 5,
    title: "Jogini Waterfalls Trek",
    desc: "Embark on a scenic pine-forest trek from Vashisht village to the cascading Jogini Falls.",
    included: ["Local guide for trek", "Vashisht temple entry fee", "Souvenir trip map booklet"],
    tips: "The trek takes around 1.5 hours return; carry water bottles and sunblock.",
    image: "/kyoto.png",
    stops: [
      { time: "08:00 AM", type: "food", title: "Breakfast at Hotel", desc: "Warm breakfast selection." },
      { time: "09:00 AM", type: "adventure", title: "Jogini Waterfalls Trek", desc: "Scenic hill walk through apple orchards and pine forests." },
      { time: "12:30 PM", type: "food", title: "Lunch at Vashisht Village Cafe", desc: "Great fresh juices and local bakery." },
      { time: "02:00 PM", type: "exploration", title: "Souvenir Shopping", desc: "Buy tea leaves, honey, and local pine art." },
      { time: "04:00 PM", type: "hotel", title: "Departure from Manali", desc: "Private drop back to the transit hub." }
    ]
  }
];

export default function TripItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = parseInt(resolvedParams.id, 10);
  
  const { isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const { trip, isLoading: tripLoading } = useChat(tripId);
  const router = useRouter();

  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [selectedStopIdx, setSelectedStopIdx] = useState<number | null>(null);
  
  const [imgSrc, setImgSrc] = useState("/generating_illustration.png");
  const [fadeClass, setFadeClass] = useState("opacity-100 scale-100");

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Parse structured itinerary from backend if it exists, otherwise return empty array
  const itinerary = useMemo(() => {
    const tripData = trip?.trip_data;
    if (tripData && tripData.days && Array.isArray(tripData.days) && tripData.days.length > 0) {
      return tripData.days.map((day: any, idx: number) => ({
        day: idx + 1,
        title: day.title || `Day ${idx + 1} Plan`,
        desc: day.description || day.desc || "Explore beautiful locations and activities.",
        included: day.included || ["Sightseeing entry", "Guided transport"],
        tips: day.tips || "Carry mineral water and dress in comfortable layers.",
        image: day.image || "/generating_illustration.png",
        stops: (day.stops || []).map((stop: any) => ({
          time: stop.time || "09:00 AM",
          type: stop.type || "sightseeing",
          title: stop.title || "Sightseeing Destination",
          desc: stop.description || stop.desc || "Explore the surroundings.",
          lat: stop.lat,
          lng: stop.lng
        }))
      }));
    }
    return [];
  }, [trip]);

  const activeDay = itinerary[activeDayIdx] || itinerary[0];

  // Auto reset selected stop when active day tab changes
  useEffect(() => {
    setSelectedStopIdx(null);
  }, [activeDayIdx]);

  // Sync initial cover image
  useEffect(() => {
    if (activeDay?.image) {
      setImgSrc(activeDay.image);
    }
  }, [activeDay]);

  // Handle active day image transition cross-fade
  useEffect(() => {
    if (activeDay?.image && activeDay.image !== imgSrc) {
      setFadeClass("opacity-0 scale-[0.98]");
      const timer = setTimeout(() => {
        setImgSrc(activeDay.image);
        setFadeClass("opacity-100 scale-100");
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeDay?.image]);

  if (authLoading || tripLoading) {
    return (
      <AppShell activeItem="Itinerary" userName={user?.username} userEmail={user?.email} onLogout={logout}>
        <div className="space-y-6 text-left max-w-4xl mx-auto animate-pulse select-none">
          {/* Header Skeleton */}
          <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
          
          {/* Tabs Skeleton */}
          <div className="flex gap-2">
            <div className="h-9 bg-slate-200 rounded-full w-20" />
            <div className="h-9 bg-slate-200 rounded-full w-20" />
            <div className="h-9 bg-slate-200 rounded-full w-20" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Timeline Skeleton */}
            <div className="lg:col-span-7 bg-white border border-border rounded-2xl p-6 md:p-8 space-y-6">
              <div className="h-5 bg-slate-200 rounded-md w-1/4" />
              <div className="space-y-6 pl-6 border-l border-slate-100">
                {[1, 2, 3].map(n => (
                  <div key={n} className="space-y-2 relative">
                    <div className="absolute -left-[36px] top-0 w-6 h-6 rounded-full bg-slate-200" />
                    <div className="h-4 bg-slate-200 rounded-md w-1/6" />
                    <div className="h-5 bg-slate-200 rounded-md w-1/2" />
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Card Skeleton */}
            <div className="lg:col-span-5 bg-white border border-border rounded-2xl overflow-hidden">
              <div className="w-full aspect-video bg-slate-200" />
              <div className="p-6 space-y-4">
                <div className="h-6 bg-slate-200 rounded-md w-1/2" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-4 bg-slate-200 rounded-md w-full" />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
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

  if (itinerary.length === 0) {
    return (
      <AppShell
        activeItem="Itinerary"
        userName={user?.username}
        userEmail={user?.email}
        onLogout={logout}
      >
        <div className="max-w-md mx-auto py-16 text-center space-y-6 select-none text-left">
          <div className="w-16 h-16 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto shadow-2xs">
            <Compass className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              No Itinerary Generated Yet
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed font-medium">
              We haven't finalized the itinerary details for this trip. Open the chat to complete slot validations and generate your custom day-by-day plan!
            </p>
          </div>
          <Button
            onClick={() => router.push(`/trips/${tripId}/chat`)}
            variant="primary"
            className="w-full h-11 text-xs font-bold gap-2 cursor-pointer shadow-md justify-center"
          >
            <span>Open Chat Assistant</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeItem="Itinerary"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="space-y-8 text-left">
        
        {/* Header bar controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
              Day-wise Itinerary
            </h1>
            <p className="text-xs text-text-secondary font-semibold">
              Planned for: Trip to {trip.destination}
            </p>
          </div>

          <Link href={`/trips/${tripId}`} className="h-9 px-4.5 rounded-xl border border-border bg-white text-xs font-bold text-text-primary flex items-center gap-2 hover:bg-gray-50/50 transition-colors shadow-2xs">
            <MessageSquare className="w-3.5 h-3.5 text-text-secondary" />
            <span>Back to Chat Summary</span>
          </Link>
        </div>

        {/* Day Tabs horizontal pills list */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar select-none">
          {itinerary.map((dayItem: any, idx: number) => {
            const isActive = activeDayIdx === idx;
            return (
              <button
                key={dayItem.day}
                onClick={() => setActiveDayIdx(idx)}
                className={clsx(
                  "px-5 py-2.5 rounded-full text-xs font-extrabold border transition-all duration-200 whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-text-secondary border-border hover:bg-gray-50/50 hover:text-text-primary"
                )}
              >
                Day {dayItem.day}
              </button>
            );
          })}
        </div>

        {/* Core Timeline split section layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: TIMELINE LIST (8 cols) */}
          <div className="lg:col-span-7 bg-white border border-border rounded-2xl p-6 md:p-8 shadow-2xs">
            <h3 className="text-lg md:text-xl font-semibold tracking-tight text-text-primary mb-6 select-none">
              Schedule Overview
            </h3>

            {/* Vertical timeline stops */}
            <div key={activeDayIdx} className="relative border-l-2 border-gray-100 pl-7 ml-4.5 space-y-7 animate-fade-in">
              {activeDay.stops.map((stop: any, sIdx: number) => {
                const isSelected = selectedStopIdx === sIdx;
                const activityStyle = ACTIVITY_TYPES[stop.type as keyof typeof ACTIVITY_TYPES] || ACTIVITY_TYPES.sightseeing;
                const Icon = activityStyle.icon;

                return (
                  <button
                    key={sIdx}
                    onClick={() => setSelectedStopIdx(sIdx)}
                    className={clsx(
                      "w-full text-left relative block transition-all duration-200 outline-none select-none cursor-pointer focus:outline-none",
                      isSelected ? "scale-[1.01]" : "hover:translate-x-0.5"
                    )}
                  >
                    {/* Connecting Timeline dot */}
                    <div className={clsx(
                      "absolute -left-[45px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 shadow-2xs",
                      isSelected ? "bg-primary text-white border-primary" : "bg-white text-text-secondary border-border"
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {/* Timeline row details */}
                    <div className={clsx(
                      "p-3.5 rounded-xl border transition-all duration-200",
                      isSelected 
                        ? "border-primary bg-primary-50/30 ring-1 ring-primary/20" 
                        : "border-transparent bg-transparent hover:bg-gray-50/50"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-primary uppercase tracking-tight leading-none font-mono">
                          {stop.time}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider leading-none">
                          {stop.type}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary mt-1.5 leading-snug">
                        {stop.title}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1 leading-normal font-medium">
                        {stop.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: DAY DETAIL CARD (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Detail card container */}
            <Card className="overflow-hidden border border-border bg-white shadow-2xs rounded-2xl">
              
              {/* Header Cover Photo */}
              <div className="w-full aspect-video relative bg-gray-50 border-b border-border select-none">
                <img 
                  src={imgSrc} 
                  alt={activeDay.title} 
                  className={`w-full h-full object-cover transition-all duration-300 ease-in-out ${fadeClass}`}
                />
                <Badge variant="success" className="absolute top-4 left-4 text-[10px] font-extrabold px-2.5 py-1 tracking-wider uppercase leading-none shadow-sm">
                  Active Day <span className="font-mono tracking-tight">{activeDay.day}</span>
                </Badge>
              </div>

              {/* Detail Content */}
              <div className="p-6 space-y-6">
                
                {/* Heading */}
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold tracking-tight text-text-primary">
                    {selectedStopIdx !== null && activeDay.stops[selectedStopIdx]
                      ? activeDay.stops[selectedStopIdx].title
                      : activeDay.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    {selectedStopIdx !== null && activeDay.stops[selectedStopIdx]
                      ? activeDay.stops[selectedStopIdx].desc
                      : activeDay.desc}
                  </p>
                </div>

                {/* Included items checklists */}
                <div className="space-y-2.5 border-t border-border pt-5">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider select-none">
                    Included Amenities / Activities
                  </span>
                  <div className="space-y-2 select-none">
                    {activeDay.included.map((inc: string) => (
                      <div key={inc} className="flex items-center gap-2.5 text-xs text-text-primary font-semibold">
                        <div className="w-4.5 h-4.5 rounded-full bg-success-bg text-success-text flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips Box notes */}
                <div className="border border-amber-200/60 bg-amber-50/40 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-wider select-none">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Traveler Note / Tips</span>
                  </div>
                  <p className="text-xs text-amber-700 leading-normal font-medium">
                    {activeDay.tips}
                  </p>
                </div>

              </div>

            </Card>

            {/* Bottom details helper banner */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-white select-none">
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-border text-text-secondary">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h5 className="text-xs font-bold text-text-primary">Need customization?</h5>
                <p className="text-[10px] text-text-secondary font-medium leading-normal mt-0.5">
                  Click 'Back to Chat Summary' to update plan variables anytime.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}
