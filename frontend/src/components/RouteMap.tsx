"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Map Controller to handle pan, zoom, and full fit actions
function MapController({ 
  activeStop, 
  fitAllTrigger, 
  stops 
}: { 
  activeStop: any; 
  fitAllTrigger: number; 
  stops: any[] 
}) {
  const map = useMap();

  // Focus single place
  useEffect(() => {
    if (activeStop) {
      map.setView([activeStop.lat, activeStop.lng], 14, { animate: true });
    }
  }, [activeStop, map]);

  // Fit all stops bounds
  useEffect(() => {
    if (stops.length === 0) return;
    import('leaflet').then((L) => {
      const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    });
  }, [fitAllTrigger, stops, map]);

  return null;
}

interface RouteMapProps {
  stops: any[];
  activeStop: any;
  fitAllTrigger: number;
}

export default function RouteMap({ stops, activeStop, fitAllTrigger }: RouteMapProps) {
  
  // Custom marker markers creator
  const getMarkerIcon = (idx: number, total: number) => {
    const isStart = idx === 0;
    const isEnd = idx === total - 1;
    const color = isStart ? '#10B981' : isEnd ? '#EF4444' : '#4F46E5'; // Green start, Red end, Indigo mid

    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return L.divIcon({
        html: `<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; display: flex; items-center; justify-content: center; color: white; font-size: 11px; font-weight: 800; box-shadow: 0 3px 6px rgba(0,0,0,0.16); line-height: 21px; text-align: center;">${idx + 1}</div>`,
        className: 'custom-leaflet-marker',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -10]
      });
    }
    return null;
  };

  const polylinePositions = stops.map(s => [s.lat, s.lng] as [number, number]);

  return (
    <div className="w-full h-full min-h-[450px] bg-gray-100 rounded-2xl overflow-hidden border border-border relative z-0">
      
      <MapContainer
        center={[32.2396, 77.1887]}
        zoom={12}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Connecting route polyline in order */}
        {polylinePositions.length > 1 && (
          <Polyline 
            positions={polylinePositions} 
            color="#4F46E5" 
            weight={3.5} 
            dashArray="6, 8" 
          />
        )}

        {/* Stops Markers */}
        {stops.map((stop, idx) => {
          const icon = getMarkerIcon(idx, stops.length);
          if (!icon) return null;

          return (
            <Marker 
              key={stop.id} 
              position={[stop.lat, stop.lng]} 
              icon={icon}
            >
              <Popup>
                <div className="text-left p-1 max-w-[160px] select-text">
                  <h4 className="text-xs font-extrabold text-text-primary leading-tight">
                    {stop.name}
                  </h4>
                  <p className="text-[10px] text-text-secondary leading-normal mt-1">
                    {stop.note}
                  </p>
                  <div className="mt-2 w-full h-16 rounded-md overflow-hidden bg-gray-100 border border-border">
                    <img 
                      src={stop.img} 
                      alt={stop.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Map Pan / Zoom Controller */}
        <MapController 
          activeStop={activeStop} 
          fitAllTrigger={fitAllTrigger} 
          stops={stops} 
        />

      </MapContainer>

    </div>
  );
}
