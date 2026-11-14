"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Compass, Sliders, Star, MapPin, ChevronLeft, ChevronRight, Search, 
  X, Sparkles 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppShell, Card, Button, Input, Modal, Badge } from '@/components/ui';
import { clsx } from 'clsx';

// Full list of example destinations
const EXPLORE_DESTINATIONS = [
  { id: 'manali', name: 'Manali', region: 'Himachal Pradesh', category: 'Mountains', rating: 4.8, reviews: 220, price: 'medium', duration: '5 days', img: '/swiss_alps.png' },
  { id: 'coorg', name: 'Coorg', region: 'Karnataka', category: 'Mountains', rating: 4.7, reviews: 180, price: 'medium', duration: '3 days', img: '/kyoto.png' },
  { id: 'goa', name: 'Goa', region: 'India', category: 'Beaches', rating: 4.9, reviews: 450, price: 'low', duration: '4 days', img: '/bali.png' },
  { id: 'kerala', name: 'Kerala', region: "God's Own Country", category: 'Wildlife', rating: 4.8, reviews: 310, price: 'high', duration: '7 days', img: '/kyoto.png' },
  { id: 'ladakh', name: 'Ladakh', region: 'Jammu & Kashmir', category: 'Adventure', rating: 4.9, reviews: 150, price: 'high', duration: '6 days', img: '/swiss_alps.png' },
  { id: 'rajasthan', name: 'Rajasthan', region: 'The Royal State', category: 'Heritage', rating: 4.7, reviews: 280, price: 'high', duration: '5 days', img: '/paris.png' },
  { id: 'uttarakhand', name: 'Uttarakhand', region: 'Devbhoomi', category: 'Pilgrimage', rating: 4.8, reviews: 210, price: 'low', duration: '4 days', img: '/swiss_alps.png' },
  { id: 'andaman', name: 'Andaman', region: 'Andaman & Nicobar', category: 'Beaches', rating: 4.9, reviews: 140, price: 'high', duration: '6 days', img: '/bali.png' }
];

const CATEGORIES = ["All", "Mountains", "Beaches", "Heritage", "Adventure", "Wildlife", "Pilgrimage"];

export default function ExplorePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  // Filters state
  const [filterPrice, setFilterPrice] = useState("all");
  const [filterDuration, setFilterDuration] = useState("all");
  const [filterRating, setFilterRating] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Filter logic
  const filteredDestinations = useMemo(() => {
    return EXPLORE_DESTINATIONS.filter((dest) => {
      // Category pill filter
      if (activeTab !== "All" && dest.category !== activeTab) return false;
      
      // Search text filter
      if (searchVal.trim() !== "") {
        const query = searchVal.toLowerCase();
        const matchesName = dest.name.toLowerCase().includes(query);
        const matchesRegion = dest.region.toLowerCase().includes(query);
        if (!matchesName && !matchesRegion) return false;
      }

      // Price filter
      if (filterPrice !== "all" && dest.price !== filterPrice) return false;

      // Duration filter
      if (filterDuration !== "all") {
        if (filterDuration === "short" && parseInt(dest.duration) > 4) return false;
        if (filterDuration === "long" && parseInt(dest.duration) <= 4) return false;
      }

      // Rating filter
      if (filterRating !== "all") {
        const minRating = parseFloat(filterRating);
        if (dest.rating < minRating) return false;
      }

      return true;
    });
  }, [activeTab, searchVal, filterPrice, filterDuration, filterRating]);

  // Paginated list calculation
  const totalPages = Math.ceil(filteredDestinations.length / itemsPerPage) || 1;
  const paginatedDestinations = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredDestinations.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredDestinations, currentPage]);

  const handleResetFilters = () => {
    setFilterPrice("all");
    setFilterDuration("all");
    setFilterRating("all");
    setShowFilterModal(false);
    setCurrentPage(1);
  };

  const handleCardClick = (id: string) => {
    router.push(`/explore/${id}`);
  };

  return (
    <AppShell
      activeItem="Explore"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
      searchQuery={searchVal}
      onSearchChange={(val) => {
        setSearchVal(val);
        setCurrentPage(1);
      }}
      searchPlaceholder="Search destinations, states, categories..."
    >
      <div className="space-y-6 text-left">
        
        {/* Header Title */}
        <div className="space-y-1 select-none">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Explore Destinations
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Find the perfect getaway and plan your dream trip with AI
          </p>
        </div>

        {/* Tab pills filters row + Filters Drawer Trigger Button */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pt-2 border-b border-border pb-4 select-none">
          
          {/* Categories Horizontal scrolling pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = activeTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveTab(cat);
                    setCurrentPage(1);
                  }}
                  className={clsx(
                    "px-4.5 py-2 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-white text-text-secondary border-border hover:bg-gray-50/50 hover:text-text-primary"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Filters modal trigger */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowFilterModal(true)}
            className="h-9 px-4 text-xs font-bold gap-2 bg-white border border-border shrink-0 cursor-pointer shadow-2xs self-end sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5 text-text-secondary" />
            <span>Filters</span>
            {(filterPrice !== 'all' || filterDuration !== 'all' || filterRating !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>

        </div>

        {/* GRID OF DESTINATIONS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {paginatedDestinations.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white border border-border rounded-2xl space-y-3 shadow-2xs select-none">
              <Compass className="w-10 h-10 text-text-secondary/50 mx-auto animate-pulse" />
              <h3 className="text-sm font-bold text-text-primary">No destinations found</h3>
              <p className="text-xs text-text-secondary">Try adjusting your filters or search query.</p>
              <Button size="sm" variant="secondary" onClick={handleResetFilters} className="h-8 text-xs font-bold cursor-pointer">
                Clear Filters
              </Button>
            </div>
          ) : (
            paginatedDestinations.map((dest) => (
              <Card
                key={dest.id}
                onClick={() => handleCardClick(dest.id)}
                className="overflow-hidden border border-border bg-white rounded-2xl shadow-2xs hover:shadow-md transition-all duration-300 group cursor-pointer"
              >
                {/* Photo box */}
                <div className="w-full aspect-4/3 overflow-hidden bg-gray-50 border-b border-border select-none relative">
                  <img 
                    src={dest.img} 
                    alt={dest.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  <Badge variant="primary" className="absolute top-3 left-3 text-[9px] font-extrabold px-2 py-0.5 tracking-wider uppercase leading-none shadow-sm">
                    {dest.category}
                  </Badge>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="text-sm font-bold text-text-primary truncate">
                      {dest.name}
                    </h3>
                    <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span className="text-xs font-bold">{dest.rating}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-text-secondary select-none font-medium">
                    <span className="flex items-center gap-0.5 truncate max-w-[65%]">
                      <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                      {dest.region}
                    </span>
                    <span className="text-[10px] text-text-secondary/80 font-bold shrink-0">
                      ({dest.reviews} reviews)
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* PAGINATION AFFORDANCE ROW */}
        {filteredDestinations.length > 0 && (
          <div className="flex justify-between items-center border-t border-border pt-6 select-none">
            <span className="text-xs font-bold text-text-secondary">
              Showing {Math.min(filteredDestinations.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredDestinations.length, currentPage * itemsPerPage)} of {filteredDestinations.length} results
            </span>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="h-8 w-8 p-0 border border-border bg-white cursor-pointer shadow-2xs flex items-center justify-center rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="h-8 w-8 p-0 border border-border bg-white cursor-pointer shadow-2xs flex items-center justify-center rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* FILTER OPTIONS MODAL */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Destinations"
      >
        <div className="space-y-5 text-left">
          
          {/* Price Range Filter */}
          <div className="space-y-2 select-none">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Budget / Price Range
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Any Budget' },
                { id: 'low', label: 'Budget-friendly' },
                { id: 'medium', label: 'Mid-range' },
                { id: 'high', label: 'Luxury' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilterPrice(item.id)}
                  className={clsx(
                    "py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                    filterPrice === item.id 
                      ? "bg-primary text-white border-primary" 
                      : "bg-white text-text-secondary border-border hover:bg-gray-50/50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trip Duration Filter */}
          <div className="space-y-2 select-none">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Trip Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Any Duration' },
                { id: 'short', label: 'Short (1-4 Days)' },
                { id: 'long', label: 'Long (5+ Days)' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilterDuration(item.id)}
                  className={clsx(
                    "py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                    filterDuration === item.id 
                      ? "bg-primary text-white border-primary" 
                      : "bg-white text-text-secondary border-border hover:bg-gray-50/50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Star Rating Filter */}
          <div className="space-y-2 select-none">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Minimum Rating
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'Any' },
                { id: '4.5', label: '4.5+ ★' },
                { id: '4.7', label: '4.7+ ★' },
                { id: '4.9', label: '4.9+ ★' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilterRating(item.id)}
                  className={clsx(
                    "py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                    filterRating === item.id 
                      ? "bg-primary text-white border-primary" 
                      : "bg-white text-text-secondary border-border hover:bg-gray-50/50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="flex gap-3 pt-4 justify-end select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={handleResetFilters}
              className="h-10 text-xs font-bold border border-border shadow-2xs cursor-pointer"
            >
              Reset Filters
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowFilterModal(false)}
              className="h-10 text-xs font-bold shadow-md shadow-primary-500/10 cursor-pointer"
            >
              Apply Filters
            </Button>
          </div>

        </div>
      </Modal>

    </AppShell>
  );
}
