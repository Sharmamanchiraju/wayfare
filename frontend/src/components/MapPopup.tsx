import { Popup } from 'react-leaflet';
import { MapPin, Building, Star, Navigation } from 'lucide-react';
import { MapLocation } from '@/utils/mapData';

interface MapPopupProps {
  location: MapLocation;
}

export default function MapPopup({ location }: MapPopupProps) {
  const getIcon = () => {
    switch (location.type) {
      case 'destination': return <MapPin className="text-red-500" size={18} />;
      case 'hotel': return <Building className="text-purple-500" size={18} />;
      case 'attraction': return <Star className="text-emerald-500" size={18} />;
      case 'flight': return <Navigation className="text-blue-500" size={18} />;
      default: return <MapPin size={18} />;
    }
  };

  return (
    <Popup className="custom-leaflet-popup">
      <div className="p-1 min-w-[150px]">
        <div className="flex items-center gap-2 mb-2 font-bold text-gray-800 border-b pb-1">
          {getIcon()}
          <span>{location.name}</span>
        </div>
        
        {location.description && (
          <p className="text-sm text-gray-600 mb-2">{location.description}</p>
        )}
        
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          {location.price && (
            <div className="flex items-center gap-1 font-semibold text-emerald-600">
              <span>Price:</span>
              <span>${location.price}</span>
            </div>
          )}
          {location.day && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">Day {location.day}</span>
              {location.time && <span className="text-gray-400">{location.time}</span>}
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
}
