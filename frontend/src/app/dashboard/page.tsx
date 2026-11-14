"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Wallet, Sun, Compass, Heart, Users, User, Star, ArrowRight,
  TrendingUp, MapPin, Calendar, Search, CloudRain, ShieldCheck, Ticket
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { usePersonas } from '@/hooks/usePersonas';
import { AppShell, Card, Button, Badge } from '@/components/ui';
import { clsx } from 'clsx';


// Static destinations and recommendations
const POPULAR_DESTINATIONS = [
  { id: 'kyoto', name: 'Kyoto', region: 'Japan', rating: 4.9, reviews: 120, img: '/kyoto.png' },
  { id: 'paris', name: 'Paris', region: 'France', rating: 4.8, reviews: 340, img: '/paris.png' },
  { id: 'swiss-alps', name: 'Swiss Alps', region: 'Switzerland', rating: 4.9, reviews: 190, img: '/swiss_alps.png' },
  { id: 'bali', name: 'Bali', region: 'Indonesia', rating: 4.7, reviews: 280, img: '/bali.png' }
];

const RECOMMENDATIONS = {
  Adventure: [
    { id: 'leh-ladakh', name: 'Leh Ladakh Expedition', region: 'India', rating: 4.8, reviews: 85, img: '/swiss_alps.png' },
    { id: 'solang-valley', name: 'Solang Paragliding', region: 'Manali, India', rating: 4.7, reviews: 92, img: '/swiss_alps.png' }
  ],
  Beaches: [
    { id: 'havelock-island', name: 'Havelock Island Escapade', region: 'Andaman, India', rating: 4.9, reviews: 110, img: '/bali.png' },
    { id: 'gokarna-trek', name: 'Gokarna Beach Trek', region: 'Karnataka, India', rating: 4.6, reviews: 64, img: '/bali.png' }
  ],
  Heritage: [
    { id: 'taj-mahal', name: 'Taj Mahal & Agra Fort', region: 'Agra, India', rating: 4.9, reviews: 320, img: '/paris.png' },
    { id: 'hampi-ruins', name: 'Hampi Ruins Tour', region: 'Karnataka, India', rating: 4.8, reviews: 150, img: '/kyoto.png' }
  ],
  'Family Trips': [
    { id: 'munnar-tea', name: 'Munnar Tea Gardens', region: 'Kerala, India', rating: 4.7, reviews: 210, img: '/kyoto.png' },
    { id: 'ooty-train', name: 'Ooty Toy Train Ride', region: 'Tamil Nadu, India', rating: 4.6, reviews: 175, img: '/swiss_alps.png' }
  ],
  Pilgrimage: [
    { id: 'varanasi-ghats', name: 'Varanasi Spiritual Walk', region: 'UP, India', rating: 4.9, reviews: 410, img: '/kyoto.png' },
    { id: 'golden-temple', name: 'Golden Temple Visit', region: 'Amritsar, India', rating: 4.9, reviews: 530, img: '/paris.png' }
  ]
};

export default function DashboardPage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { trips, createTrip } = useTrips();
  const { personas } = usePersonas();
  const router = useRouter();

  const [searchVal, setSearchVal] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [activeTab, setActiveTab] = useState<keyof typeof RECOMMENDATIONS>('Adventure');
  const [creatingTrip, setCreatingTrip] = useState(false);

  // Greeting parser based on hour of day
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.username?.split(' ')[0] || 'Traveler';

  // AI Planner action
  const handleAIPlan = async (text: string) => {
    if (!text.trim()) return;

    setCreatingTrip(true);
    try {
      const activePersonaId = personas.length > 0 ? personas[0].id : undefined;
      const destination = text.replace(/Ask AI to plan your perfect trip to|plan a trip to|Weekend trip to|Budget trip to|Family vacation in/gi, '').trim();

      const newTrip = await createTrip.mutateAsync({
        destination: destination || text,
        persona_id: activePersonaId,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: 'planning'
      });

      router.push(`/trips/${newTrip.id}/chat?seed=${encodeURIComponent(text)}`);
    } catch (err) {
      console.error('Failed to create trip with AI', err);
    } finally {
      setCreatingTrip(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setPromptInput(promptText);
    handleAIPlan(promptText);
  };

  // Extract next upcoming trip if any
  const upcomingTrip = trips && trips.length > 0 
    ? trips.find(t => t.destination && t.status?.toLowerCase() !== 'draft' && (t.status?.toLowerCase() === 'planning' || t.status?.toLowerCase() === 'confirmed'))
    : null;

  // Budget stats resolver
  const getCurrencySymbol = (currencyCode?: string) => {
    switch (currencyCode?.toUpperCase()) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'INR': return '₹';
      case 'AED': return 'AED ';
      case 'USD': return '$';
      default: return '₹';
    }
  };

  const displayTripForBudget = upcomingTrip || (trips && trips.length > 0 ? trips.find(t => t.destination && t.status?.toLowerCase() !== 'draft') : null);
  const tripCurrency = displayTripForBudget?.trip_data?.currency || 'INR';
  const tripCurrencySymbol = getCurrencySymbol(tripCurrency);
  
  const budgetMaxVal = displayTripForBudget?.budget 
    ? displayTripForBudget.budget 
    : (personas.length > 0 && personas[0].budget_max ? personas[0].budget_max * 7 : 35000);
    
  const budgetMinVal = displayTripForBudget 
    ? Math.round(budgetMaxVal / (displayTripForBudget.start_date && displayTripForBudget.end_date ? Math.ceil((new Date(displayTripForBudget.end_date).getTime() - new Date(displayTripForBudget.start_date).getTime()) / (1000 * 3600 * 24)) || 5 : 5))
    : (personas.length > 0 && personas[0].budget_min ? personas[0].budget_min : 714);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary text-xs tracking-wider uppercase font-bold">Loading…</p>
        </div>
      </div>
    );
  }

  // Filter destinations based on topbar search query
  const filteredPopular = POPULAR_DESTINATIONS.filter(d => 
    d.name.toLowerCase().includes(searchVal.toLowerCase()) || 
    d.region.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <AppShell
      activeItem="Home"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
      searchQuery={searchVal}
      onSearchChange={setSearchVal}
      searchPlaceholder="Search destinations, places, activities..."
    >
      <div className="space-y-8 text-left">
        
        {/* GREETING ROW */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-sm text-text-secondary mt-1 font-medium">
              Where do you want to explore today?
            </p>
          </div>
          {/* Active travel persona pill */}
          {personas.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200/50 text-primary text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Active Profile: {personas[0].name}
            </div>
          )}
        </div>

        {/* AI PROMPT BAR */}
        <Card className="p-6 border border-border bg-white shadow-sm rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[40%] h-[120%] bg-gradient-to-l from-primary-50/40 via-transparent to-transparent pointer-events-none z-0" />
          <div className="relative z-10 space-y-4">
            
            {/* Prompt input field */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="relative flex-1">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Ask AI to plan your perfect trip..."
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:bg-white focus:border-primary transition-all duration-200"
                />
              </div>
              <Button
                onClick={() => handleAIPlan(promptInput)}
                loading={creatingTrip}
                variant="primary"
                className="h-12 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shrink-0 shadow-md shadow-primary-500/10 cursor-pointer text-sm"
              >
                <Sparkles className="w-4.5 h-4.5" />
                <span>Plan with AI</span>
              </Button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
              <span className="text-xs font-bold text-text-secondary select-none">Quick Prompts:</span>
              {[
                "Weekend trip to Coorg",
                "Budget trip to Manali",
                "Family vacation in Kerala"
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleQuickPrompt(chip)}
                  disabled={creatingTrip}
                  className="px-4 py-2 rounded-full border border-border bg-white text-xs font-semibold text-text-secondary hover:text-primary hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-200 cursor-pointer shadow-2xs select-none disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

          </div>
        </Card>

        {/* STAT/INFO CARDS ROW (3 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Upcoming Trip */}
          <Card className="p-5 border border-border bg-white shadow-sm rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-border">
              <img 
                src={upcomingTrip ? "/kyoto.png" : "/paris.png"} 
                alt="Trip Thumbnail" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary leading-none">
                  Upcoming Trip
                </span>
                <Badge variant="success" className="text-[9px] font-extrabold px-1.5 py-0.5 leading-none shrink-0 uppercase select-none">
                  In <span className="font-mono tracking-tight">3</span> days
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-text-primary truncate mt-1.5 leading-none">
                {upcomingTrip ? `Trip to ${upcomingTrip.destination}` : 'Paris Getaway'}
              </h3>
              <p className="text-xs text-text-secondary font-medium mt-1 leading-none font-mono tracking-tight">
                {upcomingTrip?.start_date 
                  ? `${upcomingTrip.start_date} – ${upcomingTrip.end_date}`
                  : '24 Jul – 30 Jul'}
              </p>
            </div>
          </Card>

          {/* Card 2: Budget */}
          <Card className="p-5 border border-border bg-white shadow-sm rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0 border border-primary-100">
              <Wallet className="w-5.5 h-5.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary leading-none">
                Total Budget
              </span>
              <h3 className="text-xl font-bold text-text-primary mt-1.5 leading-none font-mono tracking-tight">
                {tripCurrencySymbol}{budgetMaxVal.toLocaleString()}
              </h3>
              <p className="text-xs text-text-secondary font-semibold mt-1 leading-none">
                <span className="font-mono tracking-tight">{tripCurrencySymbol}{budgetMinVal.toLocaleString()}</span> / day avg
              </p>
            </div>
          </Card>

          {/* Card 3: Weather */}
          <Card className="p-5 border border-border bg-white shadow-sm rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
              <Sun className="w-5.5 h-5.5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary leading-none">
                Local Weather
              </span>
              <h3 className="text-xl font-bold text-text-primary mt-1.5 leading-none">
                <span className="font-mono tracking-tight">24</span>°C, Sunny
              </h3>
              <p className="text-xs text-text-secondary font-medium mt-1 leading-none">
                {upcomingTrip ? upcomingTrip.destination : 'Manali, India'}
              </p>
            </div>
          </Card>

        </div>

        {/* POPULAR DESTINATIONS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center select-none">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight text-text-primary">
              Popular Destinations
            </h2>
            <button 
              onClick={() => alert("Explore view coming soon!")}
              className="text-xs font-bold text-primary hover:text-primary-hover hover:underline transition-all cursor-pointer"
            >
              View All
            </button>
          </div>

          {/* Scrollable destination list */}
          <div className="flex gap-5 overflow-x-auto pb-3.5 custom-scrollbar snap-x snap-mandatory">
            {filteredPopular.length === 0 ? (
              <div className="text-center py-6 text-text-secondary/70 w-full text-xs font-semibold select-none">
                No matching popular destinations found.
              </div>
            ) : (
              filteredPopular.map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => router.push(`/explore/${dest.id}`)}
                  className="w-[200px] text-left shrink-0 snap-start select-none cursor-pointer focus:outline-none group"
                >
                  <div className="h-32 w-full rounded-2xl overflow-hidden border border-border bg-gray-50 relative shadow-sm">
                    <img 
                      src={dest.img} 
                      alt={dest.name} 
                      className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2.5 px-0.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-text-primary truncate">
                        {dest.name}
                      </h4>
                      <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold font-mono tracking-tight">{dest.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-text-secondary font-medium truncate">
                        {dest.region}
                      </span>
                      <span className="text-[10px] text-text-secondary/80 font-semibold leading-none">
                        (<span className="font-mono tracking-tight">{dest.reviews}</span> reviews)
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RECOMMENDED FOR YOU */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4.5 select-none">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight text-text-primary">
              Recommended For You
            </h2>
            
            {/* Filter pills horizontal tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
              {(Object.keys(RECOMMENDATIONS) as Array<keyof typeof RECOMMENDATIONS>).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={clsx(
                      "px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap cursor-pointer",
                      isActive
                        ? "bg-primary text-white border-primary shadow-2xs"
                        : "bg-white text-text-secondary border-border hover:bg-gray-50/50 hover:text-text-primary"
                    )}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards grid filtered by active tab */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {RECOMMENDATIONS[activeTab].map((rec) => (
              <button
                key={rec.id}
                onClick={() => router.push(`/explore/${rec.id}`)}
                className="w-full text-left bg-white border border-border rounded-2xl p-4 flex gap-4 hover:shadow-sm transition-all duration-200 group focus:outline-none cursor-pointer"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-border bg-gray-50">
                  <img 
                    src={rec.img} 
                    alt={rec.name} 
                    className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-105"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="text-sm font-bold text-text-primary truncate">
                        {rec.name}
                      </h4>
                      <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold font-mono tracking-tight">{rec.rating}</span>
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary font-medium truncate mt-1 block">
                      {rec.region}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-text-secondary/70 font-semibold uppercase tracking-wider">
                      {activeTab}
                    </span>
                    <span className="text-[10px] text-text-secondary/80 font-bold leading-none">
                      <span className="font-mono tracking-tight">{rec.reviews}</span> reviews
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
