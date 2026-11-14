import { Marker } from 'react-leaflet';
import L from 'leaflet';
import MapPopup from './MapPopup';
import { MapLocation } from '@/utils/mapData';

// Custom icons using standard Leaflet icons but we could use SVG markers
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
};

const icons = {
  destination: createCustomIcon('#ef4444'), // red
  hotel: createCustomIcon('#8b5cf6'), // purple
  attraction: createCustomIcon('#10b981'), // emerald
  flight: createCustomIcon('#3b82f6'), // blue
};

interface MapMarkerProps {
  location: MapLocation;
}

export default function MapMarker({ location }: MapMarkerProps) {
  // If coordinates are exactly 0, 0, they might be invalid (or Null Island), but we'll plot them anyway
  const icon = icons[location.type] || icons.destination;

  return (
    <Marker position={[location.lat, location.lng]} icon={icon}>
      <MapPopup location={location} />
    </Marker>
  );
}
