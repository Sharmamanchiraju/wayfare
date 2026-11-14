"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapLocation } from '@/utils/mapData';
import MapMarker from './MapMarker';
import MapLegend from './MapLegend';
import { Maximize2, RotateCcw } from 'lucide-react';

// Helper component to auto-center map bounds when locations change
function MapBoundsFit({ locations }: { locations: MapLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;
    
    // We import leaflet dynamically here to avoid SSR issues
    import('leaflet').then((L) => {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng] as [number, number]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    });
  }, [locations, map]);

  return null;
}

interface MapDisplayProps {
  locations: MapLocation[];
  selectedDay?: number | null;
}

export default function MapDisplay({ locations, selectedDay }: MapDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter locations if a specific day is selected (but always keep destination and hotels)
  const visibleLocations = locations.filter(loc => 
    !selectedDay || 
    loc.type === 'destination' || 
    loc.type === 'hotel' || 
    loc.day === selectedDay
  );

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full min-h-[400px] rounded-xl overflow-hidden shadow-xs border-[0.5px] border-card-border bg-card'}`}>
      
      {/* Custom Controls Layer */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-card hover:bg-muted border-[0.5px] border-card-border text-foreground p-2.5 rounded-lg shadow-xs transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      <MapContainer 
        center={[20, 0]} 
        zoom={3} 
        zoomControl={false}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        {/* Dark theme map tiles for aesthetic consistency */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <ZoomControl position="topleft" />
        
        {visibleLocations.map(location => (
          <MapMarker key={location.id} location={location} />
        ))}

        <MapBoundsFit locations={visibleLocations} />
      </MapContainer>

      <MapLegend />
    </div>
  );
}
