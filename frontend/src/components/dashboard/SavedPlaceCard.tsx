import Image from 'next/image';
import { Trash2, MapPin } from 'lucide-react';
import { SavedPlaceType } from '@/hooks/useSavedPlaces';
import { Card, CardContent, Badge } from '@/components/ui';

interface SavedPlaceCardProps {
  place: SavedPlaceType;
  onRemove: (id: number) => void;
}

export default function SavedPlaceCard({ place, onRemove }: SavedPlaceCardProps) {
  const getBadgeVariant = () => {
    switch (place.type) {
      case 'Restaurant':
        return 'secondary';
      case 'Hotel':
        return 'primary';
      case 'Activity':
        return 'accent';
      case 'Landmark':
      default:
        return 'warning';
    }
  };

  return (
    <Card className="relative group border-[0.5px] border-card-border bg-card shadow-xs hover:shadow-md transition-all rounded-xl overflow-hidden flex flex-col h-full select-none">
      {/* Thumbnail */}
      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative">
        <Image
          src={place.image}
          alt={place.name}
          fill
          sizes="(max-width: 768px) 100vw, 30vw"
          className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2">
          <Badge variant={getBadgeVariant()} className="text-xs px-2 py-0.5 font-bold capitalize tracking-wider shadow-xs">
            {place.type}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col justify-between text-left">
        <div>
          <h4 className="font-bold text-foreground text-sm leading-snug tracking-tight mb-1 truncate">
            {place.name}
          </h4>
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <MapPin size={10} className="shrink-0 text-slate-400" />
            <span className="truncate">{place.location}</span>
          </p>
        </div>

        <div className="pt-3 border-t border-border/60 mt-3 flex justify-between items-center text-xs">
          <span className="text-muted-foreground font-medium">
            Added to <strong className="text-foreground">{place.addedToTripsCount}</strong> trips
          </span>
        </div>
      </CardContent>

      {/* Remove Button on Hover */}
      <button
        onClick={() => onRemove(place.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-slate-950/80 hover:bg-red-semantic/95 text-white rounded-lg shadow-md transition-all cursor-pointer"
        title="Remove saved place"
      >
        <Trash2 size={13} />
      </button>
    </Card>
  );
}
