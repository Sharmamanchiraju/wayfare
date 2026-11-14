import { MapPin, Building, Star, Navigation } from 'lucide-react';

export default function MapLegend() {
  return (
    <div className="absolute bottom-6 right-6 z-[400] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200">
      <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Legend</h4>
      <div className="space-y-2 text-sm text-gray-600 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm flex items-center justify-center">
            <MapPin size={8} className="text-white" />
          </div>
          <span>Destination</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow-sm flex items-center justify-center">
            <Building size={8} className="text-white" />
          </div>
          <span>Hotel / Stay</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center">
            <Star size={8} className="text-white" />
          </div>
          <span>Attraction / Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
            <Navigation size={8} className="text-white" />
          </div>
          <span>Flight Info</span>
        </div>
      </div>
    </div>
  );
}
