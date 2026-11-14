"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Compass, MapPin, Star, Calendar, Clock, DollarSign, Check, X, 
  Sparkles, Sliders, ChevronDown, Heart 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppShell, Card, Button, Badge, Modal } from '@/components/ui';
import { clsx } from 'clsx';

// Example attractions database
const ATTRACTIONS_DB = [
  { id: 'solang-valley', name: 'Solang Valley', category: 'Adventure', desc: 'Adventure sports, paragliding & cable cars.', rating: 4.8, reviews: 220, fee: 'Free (activities extra)', timings: '09:00 AM - 06:00 PM', img: '/swiss_alps.png', gallery: ['/swiss_alps.png', '/kyoto.png', '/bali.png'] },
  { id: 'rohtang-pass', name: 'Rohtang Pass', category: 'Nature', desc: 'High Himalayan pass with snow and scenic peaks.', rating: 4.9, reviews: 310, fee: '₹550 (permit fee)', timings: '06:00 AM - 04:00 PM', img: '/swiss_alps.png', gallery: ['/swiss_alps.png', '/paris.png', '/kyoto.png'] },
  { id: 'hidimba-temple', name: 'Hidimba Temple', category: 'Culture', desc: 'Historic 16th-century wooden pagoda temple.', rating: 4.7, reviews: 195, fee: 'Free', timings: '08:00 AM - 06:00 PM', img: '/kyoto.png', gallery: ['/kyoto.png', '/bali.png', '/swiss_alps.png'] },
  { id: 'old-manali', name: 'Old Manali', category: 'Culture', desc: 'Charming village, orchards and café trails.', rating: 4.6, reviews: 150, fee: 'Free', timings: 'Open 24 hours', img: '/bali.png', gallery: ['/bali.png', '/paris.png', '/kyoto.png'] },
  { id: 'jogini-waterfall', name: 'Jogini Waterfall', category: 'Nature', desc: 'Beautiful cascading valley waterfalls trek.', rating: 4.8, reviews: 175, fee: 'Free', timings: '06:00 AM - 06:00 PM', img: '/kyoto.png', gallery: ['/kyoto.png', '/swiss_alps.png', '/bali.png'] },
  { id: 'manu-temple', name: 'Manu Temple', category: 'Culture', desc: 'Historical pagoda temple honoring Sage Manu.', rating: 4.5, reviews: 90, fee: 'Free', timings: '06:00 AM - 05:00 PM', img: '/paris.png', gallery: ['/paris.png', '/bali.png', '/swiss_alps.png'] }
];

const FILTERS = ["All", "Adventure", "Sightseeing", "Nature", "Culture"];

export default function AttractionsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedAttraction, setSelectedAttraction] = useState<typeof ATTRACTIONS_DB[0] | null>(null);
  
  // Pagination limit state
  const [limit, setLimit] = useState(3);

  // Filter logic
  const filteredAttractions = useMemo(() => {
    return ATTRACTIONS_DB.filter((item) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Sightseeing") {
        return item.category === "Nature" || item.category === "Culture";
      }
      return item.category === activeFilter;
    });
  }, [activeFilter]);

  const visibleAttractions = useMemo(() => {
    return filteredAttractions.slice(0, limit);
  }, [filteredAttractions, limit]);

  const handleLoadMore = () => {
    setLimit(prev => Math.min(ATTRACTIONS_DB.length, prev + 3));
  };

  const handleAddToItinerary = (attractionName: string) => {
    alert(`Success: ${attractionName} has been added to your Day 1 itinerary!`);
    setSelectedAttraction(null);
  };

  return (
    <AppShell
      activeItem="Explore"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="space-y-6 text-left">
        
        {/* Header Section */}
        <div className="space-y-1 select-none">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Top Attractions in Manali
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Explore highly rated local spots, activities, and nature hikes
          </p>
        </div>

        {/* Filter pills selection bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar select-none border-b border-border pb-3.5">
          {FILTERS.map((pill) => {
            const isActive = activeFilter === pill;
            return (
              <button
                key={pill}
                onClick={() => {
                  setActiveFilter(pill);
                  setLimit(3); // reset view limit on filter change
                }}
                className={clsx(
                  "px-4.5 py-2.5 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-text-secondary border-border hover:bg-gray-50/50 hover:text-text-primary"
                )}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* RESPONSIVE 3-COLUMN CARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleAttractions.map((item) => (
            <Card
              key={item.id}
              onClick={() => setSelectedAttraction(item)}
              className="overflow-hidden border border-border bg-white rounded-2xl shadow-2xs hover:shadow-md transition-all duration-300 group cursor-pointer text-left flex flex-col justify-between"
            >
              <div>
                {/* Cover image */}
                <div className="w-full aspect-video overflow-hidden bg-gray-50 border-b border-border relative select-none">
                  <img 
                    src={item.img} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  <Badge variant="primary" className="absolute top-3 left-3 text-[9px] font-extrabold px-2 py-0.5 tracking-wider uppercase leading-none shadow-sm h-auto select-none">
                    {item.category}
                  </Badge>
                </div>

                {/* Details */}
                <div className="p-5 space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span className="text-xs font-bold">{item.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Card Footer detail trigger */}
              <div className="px-5 pb-5 pt-1 text-right select-none flex justify-between items-center">
                <span className="text-[10px] text-text-secondary/70 font-semibold uppercase tracking-wider">
                  {item.reviews} reviews
                </span>
                <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-0.5">
                  Learn More
                  <ChevronDown className="w-3.5 h-3.5 transform -rotate-90" />
                </span>
              </div>

            </Card>
          ))}
        </div>

        {/* View More centered affordance button */}
        {filteredAttractions.length > visibleAttractions.length && (
          <div className="pt-8 text-center select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={handleLoadMore}
              className="h-10 px-6 text-xs font-bold bg-white border border-border cursor-pointer shadow-2xs hover:bg-gray-50/50"
            >
              View More Attractions
            </Button>
          </div>
        )}

      </div>

      {/* ATTRACTION DETAIL MODAL */}
      <Modal
        isOpen={selectedAttraction !== null}
        onClose={() => setSelectedAttraction(null)}
        title={selectedAttraction?.name || "Attraction Details"}
      >
        {selectedAttraction && (
          <div className="space-y-6 text-left">
            
            {/* Gallery Images Array */}
            <div className="grid grid-cols-3 gap-2.5 select-none">
              {selectedAttraction.gallery.map((gImg, idx) => (
                <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-border bg-gray-50">
                  <img 
                    src={gImg} 
                    alt={`Gallery ${idx + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider select-none">
                Attraction Overview
              </span>
              <p className="text-xs text-text-primary leading-relaxed font-medium select-text">
                {selectedAttraction.desc} Detailed historical architecture reviews, seasonal visitor counts, and photo trail locations.
              </p>
            </div>

            {/* Metadata timings fee */}
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 select-none">
              
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Timings</span>
                  <p className="text-xs font-bold text-text-primary">{selectedAttraction.timings}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Entry Fee</span>
                  <p className="text-xs font-bold text-text-primary">{selectedAttraction.fee}</p>
                </div>
              </div>

            </div>

            {/* Action Bar CTA */}
            <div className="flex gap-3 pt-5 border-t border-border justify-end select-none">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedAttraction(null)}
                className="h-10 text-xs font-bold border border-border shadow-2xs cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleAddToItinerary(selectedAttraction.name)}
                className="h-10 text-xs font-bold shadow-md shadow-primary-500/10 cursor-pointer gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Add to Itinerary</span>
              </Button>
            </div>

          </div>
        )}
      </Modal>

    </AppShell>
  );
}
