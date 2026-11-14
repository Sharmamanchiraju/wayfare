import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sun, CloudRain } from 'lucide-react';
import ActivityCard from './ActivityCard';
import { Card } from '@/components/ui';

interface DayCardProps {
  day: any;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function DayCard({ day, isExpanded, onToggle }: DayCardProps) {
  const hasWeather = !!day.weather;
  const isSunny = day.day % 2 === 0;

  return (
    <Card className="border-[0.5px] border-card-border bg-muted/10 overflow-hidden shadow-xs hover:border-border transition-all">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs shrink-0 select-none">
            Day {day.day}
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-foreground">
              {day.date || `Day ${day.day} Itinerary`}
            </h3>
            {day.totalCost && (
              <p className="text-sm text-accent font-semibold mt-1">Est. Cost: ${day.totalCost}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="hidden sm:flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-md border border-border">
            {isSunny ? <Sun size={16} className="text-amber-semantic" /> : <CloudRain size={16} className="text-sky-500" />}
            <span className="text-sm font-semibold">{hasWeather ? day.weather.temp : (isSunny ? '75°F' : '65°F')}</span>
          </div>
          {isExpanded ? (
            <ChevronUp size={18} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={18} className="text-muted-foreground/60" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t-[0.5px] border-card-border bg-card/60"
          >
            <div className="p-5 space-y-3">
              {day.activities && day.activities.length > 0 ? (
                day.activities.map((act: any, idx: number) => (
                  <ActivityCard key={idx} activity={act} index={idx} />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm italic">No activities planned yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
