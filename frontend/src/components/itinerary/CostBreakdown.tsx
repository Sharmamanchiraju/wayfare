import { DollarSign, Plane, Building, Ticket, Utensils } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

interface CostBreakdownProps {
  costs?: {
    flights?: number;
    hotels?: number;
    activities?: number;
    food?: number;
    total?: number;
  };
}

export default function CostBreakdown({ costs }: CostBreakdownProps) {
  const data = costs || {
    flights: 850,
    hotels: 1200,
    activities: 450,
    food: 600,
    total: 3100
  };

  const getPercentage = (value: number) => {
    return Math.round((value / data.total!) * 100);
  };

  return (
    <Card className="border-[0.5px] border-card-border bg-card shadow-xs">
      <CardContent className="p-6 space-y-5">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
          <DollarSign className="text-accent" size={18} />
          Cost Breakdown
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <Plane size={16} className="text-sky-500" /> Flights
              </span>
              <span className="font-bold text-foreground">${data.flights}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 rounded-full" 
                style={{ width: `${getPercentage(data.flights!)}%` }} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <Building size={16} className="text-muted-foreground/80" /> Hotels
              </span>
              <span className="font-bold text-foreground">${data.hotels}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${getPercentage(data.hotels!)}%` }} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <Ticket size={16} className="text-accent" /> Activities
              </span>
              <span className="font-bold text-foreground">${data.activities}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full" 
                style={{ width: `${getPercentage(data.activities!)}%` }} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <Utensils size={16} className="text-amber-semantic" /> Food & Transit
              </span>
              <span className="font-bold text-foreground">${data.food}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-semantic rounded-full" 
                style={{ width: `${getPercentage(data.food!)}%` }} 
              />
            </div>
          </div>

          <div className="pt-4 border-t-[0.5px] border-card-border mt-6 flex justify-between items-center select-none">
            <span className="text-base font-bold text-foreground">Estimated Total</span>
            <span className="text-2xl font-black text-accent">
              ${data.total}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
