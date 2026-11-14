import { useState } from 'react';
import { Map, Calendar, Wallet, Compass, Download, Settings } from 'lucide-react';
import DayCard from './DayCard';
import CostBreakdown from './CostBreakdown';
import FlightsSection from './FlightsSection';
import HotelsSection from './HotelsSection';
import { Card, CardContent, Button, Badge } from '@/components/ui';

interface ItineraryDisplayProps {
  tripData: any;
  isLoading?: boolean;
}

export default function ItineraryDisplay({ tripData, isLoading }: ItineraryDisplayProps) {
  const [expandedDays, setExpandedDays] = useState<number[]>([1]); // Expand Day 1 by default

  const toggleDay = (day: number) => {
    setExpandedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center p-8 border-[0.5px] border-card-border bg-card shadow-sm rounded-xl">
        <div className="w-10 h-10 border-2 border-muted border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm animate-pulse">Generating your custom itinerary...</p>
      </Card>
    );
  }

  if (!tripData || !tripData.itinerary) {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center p-8 border-[0.5px] border-card-border bg-card shadow-sm rounded-xl">
        <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mb-5 animate-pulse">
          <Map size={26} className="text-accent" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Itinerary Yet</h3>
        <p className="text-muted-foreground text-center text-sm max-w-xs">
          Chat with TripPlanner on the left to start planning your dream trip. Your full itinerary will appear here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full overflow-y-auto custom-scrollbar border-[0.5px] border-card-border bg-card shadow-sm rounded-xl relative p-6 sm:p-8">
      {/* Header / Trip Overview */}
      <header className="mb-8 border-b border-border/50 pb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">
              {tripData.destination || 'Your Trip'}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {tripData.duration && (
                <span className="flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg border border-border">
                  <Calendar size={13} className="text-muted-foreground/80" />
                  {tripData.duration} Days
                </span>
              )}
              {tripData.budget && (
                <span className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-lg border border-accent/25">
                  <Wallet size={13} className="text-accent" />
                  Budget: ${tripData.budget}
                </span>
              )}
              <Badge variant="primary" className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-foreground px-3 py-1.5 rounded-lg h-auto text-xs font-semibold">
                <Compass size={13} className="text-muted-foreground" />
                {tripData.travel_style || 'Custom Style'}
              </Badge>
            </div>
          </div>
          
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-md">
              <Download size={15} />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Day by Day breakdown */}
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
            Day-by-Day Plan
          </h3>
          
          <div className="space-y-4">
            {tripData.itinerary.map((day: any) => (
              <DayCard 
                key={day.day} 
                day={day} 
                isExpanded={expandedDays.includes(day.day)}
                onToggle={() => toggleDay(day.day)}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Bookings & Costs */}
        <div className="space-y-6">
          {tripData.flights && <FlightsSection flights={tripData.flights} />}
          {tripData.recommended_hotels && <HotelsSection hotels={tripData.recommended_hotels} />}
          
          <CostBreakdown costs={tripData.costBreakdown} />

          {/* Action Buttons */}
          <Card className="border-[0.5px] border-card-border shadow-xs bg-muted/20">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <Settings size={15} className="text-accent" />
                Refine Trip
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                <Button variant="outline" className="w-full text-xs font-semibold justify-center h-9">
                  Suggest Alternatives
                </Button>
                <Button variant="outline" className="w-full text-xs font-semibold justify-center h-9">
                  Adjust Budget
                </Button>
                <Button variant="outline" className="w-full text-xs font-semibold justify-center h-9">
                  Add More Activities
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </Card>
  );
}
