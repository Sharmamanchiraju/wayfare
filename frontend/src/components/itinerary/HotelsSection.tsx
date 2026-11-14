import { Building, MapPin, DollarSign, Star, ExternalLink } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '@/components/ui';

interface HotelsSectionProps {
  hotels: any[];
}

export default function HotelsSection({ hotels }: HotelsSectionProps) {
  if (!hotels || hotels.length === 0) return null;

  return (
    <Card className="border-[0.5px] border-card-border bg-card shadow-xs mb-6">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border/50 pb-2">
          <Building className="text-muted-foreground/80" size={16} />
          Accommodation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotels.map((hotel, idx) => (
            <div 
              key={idx} 
              className="bg-muted/10 border-[0.5px] border-card-border rounded-lg p-4 hover:bg-muted/20 transition-all flex flex-col h-full shadow-xs"
            >
              <div className="flex justify-between items-start mb-3 gap-3 text-left">
                <div>
                  <h4 className="font-bold text-sm text-foreground mb-1 leading-tight">{hotel.name || 'Recommended Hotel'}</h4>
                  <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <MapPin size={11} className="text-muted-foreground/75" />
                    <span>{hotel.location || 'City Center'}</span>
                  </div>
                </div>
                <Badge variant="warning" className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold shrink-0 select-none">
                  <Star size={10} className="fill-current text-amber-semantic" />
                  {hotel.rating || '4.5'}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-4 flex-1 line-clamp-3 leading-relaxed text-left">
                {hotel.description || 'A comfortable stay conveniently located near all major attractions with excellent amenities.'}
              </p>

              <div className="flex items-center justify-between border-t border-border/50 pt-3.5 mt-auto text-left">
                <div>
                  <span className="text-xs font-bold text-muted-foreground block mb-0.5">Est. Cost</span>
                  <span className="text-base font-bold text-accent flex items-center">
                    <DollarSign size={14} />
                    {hotel.price_usd || hotel.price || '150'} <span className="text-xs text-muted-foreground font-semibold ml-1">/ night</span>
                  </span>
                </div>
                
                <Button variant="solid" size="sm" className="h-8 gap-1.5 px-3 select-none">
                  <span>Book</span>
                  <ExternalLink size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
