import { Plane, PlaneTakeoff, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui';

interface FlightsSectionProps {
  flights: any[];
}

export default function FlightsSection({ flights }: FlightsSectionProps) {
  if (!flights || flights.length === 0) return null;

  return (
    <Card className="border-[0.5px] border-card-border bg-card shadow-xs mb-6">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border/50 pb-2">
          <Plane className="text-sky-500" size={16} />
          Flight Information
        </h3>

        <div className="space-y-4">
          {flights.map((flight, idx) => (
            <div 
              key={idx} 
              className="bg-muted/10 border-[0.5px] border-card-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-all shadow-xs"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="primary" className="text-xs font-bold px-2 py-0.5 uppercase tracking-wider">
                    {flight.airline || 'Airline'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-semibold">Flight {flight.flight_number || '101'}</span>
                </div>
                
                <div className="flex items-center gap-6 mt-3">
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{flight.departure_time || '10:00'}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{flight.departure_airport || 'ORIGIN'}</p>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center px-4">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 font-semibold">
                      <Clock size={11} /> {flight.duration || '2h 30m'}
                    </p>
                    <div className="w-full relative flex items-center justify-center">
                      <div className="h-[0.5px] w-full bg-border absolute" />
                      <PlaneTakeoff size={14} className="text-muted-foreground relative z-10 bg-card px-1 w-6 h-4" />
                    </div>
                    <p className="text-xs font-bold text-accent/90 mt-1 uppercase tracking-widest">Direct</p>
                  </div>

                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{flight.arrival_time || '12:30'}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{flight.arrival_airport || 'DEST'}</p>
                  </div>
                </div>
              </div>

              <div className="md:w-28 flex flex-col items-end justify-center border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0">
                <span className="text-xs font-bold text-muted-foreground mb-0.5">Est. Cost</span>
                <span className="text-lg font-bold text-accent flex items-center">
                  <DollarSign size={16} />
                  {flight.price || flight.cost || '450'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
