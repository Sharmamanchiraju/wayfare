import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Building, Star, ChevronDown, ChevronUp, Sun } from 'lucide-react';

interface ItineraryTimelineProps {
  tripData: any;
  selectedDay: number | null;
  onDaySelect: (day: number | null) => void;
}

export default function ItineraryTimeline({ tripData, selectedDay, onDaySelect }: ItineraryTimelineProps) {
  if (!tripData || !tripData.itinerary) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-card/50 rounded-3xl border border-border backdrop-blur-md">
        <Sun size={48} className="text-amber-semantic mb-4 opacity-50" />
        <p>No itinerary data available yet.</p>
        <p className="text-sm mt-2 opacity-60">Plan your trip in the chat to generate a detailed day-by-day timeline.</p>
      </div>
    );
  }

  const days = tripData.itinerary;

  return (
    <div className="h-full flex flex-col bg-card/80 rounded-3xl border border-border backdrop-blur-md overflow-hidden">
      <div className="p-6 border-b border-border bg-muted/50 shrink-0">
        <h3 className="text-xl font-bold text-foreground mb-1">Your Itinerary</h3>
        <p className="text-sm text-muted-foreground">
          {tripData.destination} • {tripData.duration || `${days.length} Days`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Reset View Button */}
        <button 
          onClick={() => onDaySelect(null)}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
            selectedDay === null 
              ? 'bg-accent/10 text-accent border border-accent/20' 
              : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
          }`}
        >
          View Full Trip Overview
        </button>

        {days.map((dayObj: any) => {
          const isSelected = selectedDay === dayObj.day;

          return (
            <div 
              key={dayObj.day} 
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isSelected 
                  ? 'bg-muted/80 border-accent/30 shadow-md' 
                  : 'bg-muted/30 border-border hover:border-accent/20'
              }`}
            >
              <button 
                onClick={() => onDaySelect(isSelected ? null : dayObj.day)}
                className="w-full flex items-center justify-between p-4 focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isSelected ? 'bg-accent text-accent-foreground' : 'bg-muted border border-border text-muted-foreground'
                  }`}>
                    {dayObj.day}
                  </div>
                  <span className={`font-semibold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>Day {dayObj.day}</span>
                </div>
                {isSelected ? <ChevronUp size={20} className="text-accent" /> : <ChevronDown size={20} className="text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {isSelected && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-6">
                      {/* Activities Timeline */}
                      <div className="relative pl-3 border-l-2 border-accent/20 space-y-6">
                        {dayObj.activities && dayObj.activities.map((act: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[21px] bg-card p-1 rounded-full">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-semantic shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                            </div>
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-foreground text-sm">{act.name}</h4>
                                {act.time && <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{act.time}</span>}
                              </div>
                              <p className="text-xs text-muted-foreground/70">{act.type || 'Activity'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
