import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, DollarSign, Calendar, CloudRain, Sunrise, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function ItineraryView({ itinerary }: { itinerary: any }) {
  const [activeDay, setActiveDay] = useState<number | null>(null);

  if (!itinerary) return null;

  const getCurrencySymbol = (currency: string) => {
    switch (currency?.toUpperCase()) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'INR': return '₹';
      case 'AED': return 'AED ';
      case 'USD': default: return '$';
    }
  };

  const cSymbol = getCurrencySymbol(itinerary.currency);

  return (
    <div className="flex-1 h-full flex flex-col lg:flex-row relative z-10 overflow-hidden bg-background">
      
      {/* Left Area: Map (Fixed on Desktop, Top on Mobile) */}
      <div className="w-full lg:w-[45%] h-[40vh] lg:h-full relative border-r border-border">
        <Map lat={itinerary.map_coordinates.lat} lon={itinerary.map_coordinates.lon} zoom={13} />
        
        {/* Floating gradient overlay to blend map into content */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/50 pointer-events-none hidden lg:block" />
      </div>

      {/* Right Area: Scrollable Details */}
      <div className="w-full lg:w-[55%] h-[60vh] lg:h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-8 relative z-20 pt-4"
        >
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4">
              <MapPin className="w-3 h-3" />
              Generated Itinerary
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
              {itinerary.destination}
            </h1>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card/50 border border-border rounded-xl p-4 flex flex-col shadow-sm">
                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Duration</span>
                <span className="text-foreground font-bold text-xl flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {itinerary.itinerary.length} Days
                </span>
              </div>
              <div className="bg-card/50 border border-border rounded-xl p-4 flex flex-col shadow-sm">
                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Target Budget</span>
                <span className="text-foreground font-bold text-xl flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-semantic" />
                  {cSymbol}{itinerary.total_budget_local || itinerary.total_budget_usd}
                </span>
              </div>
              <div className="bg-card/50 border border-border rounded-xl p-4 flex flex-col shadow-sm">
                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Est. Cost</span>
                <span className="text-foreground font-bold text-xl flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-semantic" />
                  {cSymbol}{itinerary.estimated_cost_local || itinerary.estimated_cost_usd}
                </span>
              </div>
              <div className="bg-card/50 border border-border rounded-xl p-4 flex flex-col shadow-sm">
                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Flights</span>
                <span className="text-foreground font-bold text-xl flex items-center gap-2">
                  <Plane className="w-4 h-4 text-accent" />
                  {itinerary.flights?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Flights Section */}
          {itinerary.flights && itinerary.flights.length > 0 && (
            <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Plane className="w-5 h-5 text-accent" />
                Flight Options
              </h2>
              <div className="space-y-3">
                {itinerary.flights.map((flight: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/50 p-4 rounded-xl border border-border hover:border-accent/30 transition-colors">
                    <div>
                      <h3 className="text-foreground font-semibold">{flight.airline}</h3>
                      <p className="text-sm text-muted-foreground">{flight.details}</p>
                    </div>
                    <div className="mt-2 sm:mt-0 text-right">
                      <span className="text-green-semantic font-bold text-xl">${flight.price_usd}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Schedule */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Sunrise className="w-6 h-6 text-amber-semantic" />
              Daily Timeline
            </h2>
            <div className="space-y-6">
              {itinerary.itinerary.map((day: any, idx: number) => (
                <div 
                  key={idx}
                  className={`border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${activeDay === idx ? 'ring-1 ring-accent bg-card/80' : 'bg-card/50 hover:bg-card/80'}`}
                  onClick={() => setActiveDay(idx)}
                >
                  <div className="p-5 flex justify-between items-start cursor-pointer">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Day {day.day} <span className="text-muted-foreground font-normal mx-2">|</span> <span className="text-accent">{day.theme}</span></h3>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full border border-border text-xs font-medium text-blue-500 dark:text-blue-400">
                      <CloudRain className="w-3.5 h-3.5" />
                      {day.weather_forecast}
                    </div>
                  </div>
                  
                  <div className="px-5 pb-5">
                    <div className="space-y-2 border-t border-border pt-4">
                      {day.activities?.map((act: any, i: number) => (
                        <div key={i} className="flex gap-4 items-start py-2 group">
                          <div className="w-16 shrink-0 text-sm font-medium text-muted-foreground pt-0.5">{act.time}</div>
                          <div className="flex-1">
                            <h4 className="text-foreground font-medium group-hover:text-accent transition-colors">{act.name}</h4>
                            <div className="flex items-center gap-3 mt-1 opacity-80 text-xs text-muted-foreground">
                              {act.expected_duration && <span>{act.expected_duration}</span>}
                              {act.travel_distance && <span>• {act.travel_distance}</span>}
                            </div>
                          </div>
                          <div className="shrink-0 text-sm font-semibold text-green-semantic">{cSymbol}{act.cost_local || act.cost_usd}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
