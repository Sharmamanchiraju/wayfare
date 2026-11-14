"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, MapPin, Calendar, Users, Sliders, Star, ChevronDown, Check, 
  ArrowUpDown, Home, Landmark, Hotel as HotelIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppShell, Card, Button, Input, Modal, Badge } from '@/components/ui';
import { clsx } from 'clsx';

// Hotels mock database
const HOTELS_DB = [
  { id: 'himalayan-resort', name: 'The Himalayan Resort', locality: 'Hadimba Road', price: 7500, rating: 4.9, reviews: 140, isPopular: true, img: '/kyoto.png', distance: 1.2 },
  { id: 'manali-heights', name: 'Manali Heights', locality: 'Old Manali', price: 4500, rating: 4.7, reviews: 95, isPopular: false, img: '/swiss_alps.png', distance: 2.5 },
  { id: 'snow-valley', name: 'Snow Valley Resort', locality: 'Log Huts Area', price: 6000, rating: 4.8, reviews: 120, isPopular: true, img: '/swiss_alps.png', distance: 0.8 },
  { id: 'orchard-greens', name: 'The Orchard Greens', locality: 'Log Huts Area', price: 5000, rating: 4.6, reviews: 88, isPopular: false, img: '/bali.png', distance: 1.5 }
];

export default function HotelsListingPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [searchVal, setSearchVal] = useState("Manali");
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('rating');

  // Popup state management
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showGuestsModal, setShowGuestsModal] = useState(false);

  // Selected parameters
  const [dates, setDates] = useState({ checkIn: "2026-05-20", checkOut: "2026-05-24" });
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });

  // Filters state
  const [priceRange, setPriceRange] = useState(10000);
  const [minRating, setMinRating] = useState("all");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState("all");

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  // Sort and Filter hotels
  const processedHotels = useMemo(() => {
    return HOTELS_DB.filter(hotel => {
      // Search query filter
      if (searchVal.trim() !== "") {
        const query = searchVal.toLowerCase();
        const matchesName = hotel.name.toLowerCase().includes(query);
        const matchesLocality = hotel.locality.toLowerCase().includes(query);
        if (!matchesName && !matchesLocality) return false;
      }

      // Budget filter
      if (hotel.price > priceRange) return false;

      // Rating filter
      if (minRating !== "all") {
        if (hotel.rating < parseFloat(minRating)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'distance') return a.distance - b.distance;
      return 0;
    });
  }, [searchVal, priceRange, minRating, sortBy]);

  const handleCardClick = (id: string) => {
    router.push(`/hotels/${id}`);
  };

  return (
    <AppShell
      activeItem="Bookings"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="space-y-6 text-left">
        
        {/* TOP BAR / CONTROLLERS CONTAINER */}
        <Card className="p-4 border border-border bg-white shadow-2xs rounded-2xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between select-none">
          
          <div className="flex-1 flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
            
            {/* Search Input Box */}
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search hotels in Manali"
                className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-border rounded-xl text-xs font-semibold text-text-primary placeholder:text-text-secondary outline-none focus:bg-white focus:border-primary transition-all"
              />
            </div>

            {/* Selected dates chip button */}
            <button
              onClick={() => setShowDatesModal(true)}
              className="h-10 px-4 rounded-xl border border-border bg-gray-50 hover:bg-white text-xs font-bold text-text-secondary flex items-center justify-between gap-2.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>May 20 - May 24</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Guests selection chip button */}
            <button
              onClick={() => setShowGuestsModal(true)}
              className="h-10 px-4 rounded-xl border border-border bg-gray-50 hover:bg-white text-xs font-bold text-text-secondary flex items-center justify-between gap-2.5 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>{guests.adults} Adults, {guests.rooms} Room</span>
              <ChevronDown className="w-3 h-3" />
            </button>

          </div>

          {/* Filters modal trigger button */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowFiltersModal(true)}
            className="h-10 px-4 text-xs font-bold gap-2 bg-white border border-border cursor-pointer shrink-0 shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-text-secondary" />
            <span>Filters</span>
          </Button>

        </Card>

        {/* LIST METRICS / SORT CONTROLLERS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-3.5 select-none">
          
          <h2 className="text-base font-bold text-text-primary">
            Stays in {searchVal || 'Manali'} ({processedHotels.length} available)
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-secondary" />
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 bg-white border border-border rounded-lg px-2 text-xs font-bold text-text-primary outline-none focus:border-primary"
            >
              <option value="rating">Rating (Highest)</option>
              <option value="price">Price (Lowest)</option>
              <option value="distance">Distance (Nearest)</option>
            </select>
          </div>

        </div>

        {/* HOTEL VERTICAL LIST */}
        <div className="space-y-4">
          {processedHotels.length === 0 ? (
            <div className="text-center py-16 bg-white border border-border rounded-2xl space-y-3 shadow-2xs select-none">
              <Home className="w-10 h-10 text-text-secondary/50 mx-auto animate-pulse" />
              <h3 className="text-sm font-bold text-text-primary">No hotels matched your options</h3>
              <p className="text-xs text-text-secondary">Try widening your price range slider or search queries.</p>
            </div>
          ) : (
            processedHotels.map((hotel) => (
              <Card
                key={hotel.id}
                onClick={() => handleCardClick(hotel.id)}
                className="overflow-hidden border border-border bg-white rounded-2xl flex flex-col sm:flex-row gap-5 p-4 hover:shadow-md transition-all duration-300 group cursor-pointer text-left"
              >
                {/* Thumbnail image */}
                <div className="w-full sm:w-48 aspect-video sm:aspect-square rounded-xl overflow-hidden shrink-0 border border-border relative select-none">
                  <img 
                    src={hotel.img} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  {hotel.isPopular && (
                    <Badge variant="success" className="absolute top-2.5 left-2.5 text-[8px] font-extrabold px-2 py-0.5 tracking-wider uppercase leading-none shadow-sm h-auto select-none">
                      Popular Choice
                    </Badge>
                  )}
                </div>

                {/* Details information column */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-1 flex-wrap">
                      <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors leading-snug">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-extrabold text-text-primary">{hotel.rating}</span>
                        <span className="text-[10px] text-text-secondary/70 font-semibold ml-1">
                          ({hotel.reviews} reviews)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-text-secondary font-medium select-none">
                      <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                      <span>{hotel.locality}</span>
                      <span className="w-1 h-1 rounded-full bg-border mx-1.5" />
                      <span>{hotel.distance} km from center</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-4 sm:pt-0">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider leading-none">
                        Price Per Night
                      </p>
                      <h4 className="text-lg font-extrabold text-text-primary mt-1 leading-none">
                        ₹{hotel.price.toLocaleString()}
                        <span className="text-xs font-medium text-text-secondary lowercase ml-1">
                          / night
                        </span>
                      </h4>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8.5 text-xs font-bold bg-white border border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all cursor-pointer select-none"
                    >
                      View Details
                    </Button>
                  </div>

                </div>
              </Card>
            ))
          )}
        </div>

      </div>

      {/* DATES SELECTION MODAL */}
      <Modal
        isOpen={showDatesModal}
        onClose={() => setShowDatesModal(false)}
        title="Select Check-in / Check-out Dates"
      >
        <div className="space-y-4 text-left select-none">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Check-in Date
              </label>
              <input
                type="date"
                value={dates.checkIn}
                onChange={(e) => setDates(prev => ({ ...prev, checkIn: e.target.value }))}
                className="w-full h-10 px-3 border border-border rounded-xl text-xs font-bold outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Check-out Date
              </label>
              <input
                type="date"
                value={dates.checkOut}
                onChange={(e) => setDates(prev => ({ ...prev, checkOut: e.target.value }))}
                className="w-full h-10 px-3 border border-border rounded-xl text-xs font-bold outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-3">
            <Button variant="primary" size="sm" onClick={() => setShowDatesModal(false)} className="h-9 px-5 text-xs font-bold cursor-pointer">
              Confirm Dates
            </Button>
          </div>
        </div>
      </Modal>

      {/* GUESTS SELECTION MODAL */}
      <Modal
        isOpen={showGuestsModal}
        onClose={() => setShowGuestsModal(false)}
        title="Select Guests & Rooms"
      >
        <div className="space-y-5 text-left select-none">
          
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary">Adults</h4>
              <p className="text-[10px] text-text-secondary">Age 13 years and above</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setGuests(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center">{guests.adults}</span>
              <button 
                onClick={() => setGuests(prev => ({ ...prev, adults: prev.adults + 1 }))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary">Rooms</h4>
              <p className="text-[10px] text-text-secondary">Total booked suites</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setGuests(prev => ({ ...prev, rooms: Math.max(1, prev.rooms - 1) }))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center">{guests.rooms}</span>
              <button 
                onClick={() => setGuests(prev => ({ ...prev, rooms: prev.rooms + 1 }))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setShowGuestsModal(false)} className="h-9 px-5 text-xs font-bold cursor-pointer">
              Apply Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* FILTER STAYS MODAL */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filter Stays"
      >
        <div className="space-y-5 text-left">
          
          {/* Price Range */}
          <div className="space-y-2 select-none">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-secondary">
              <span>Max Budget per Night</span>
              <span className="text-primary font-bold">₹{priceRange.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="2000"
              max="15000"
              step="500"
              value={priceRange}
              onChange={(e) => setPriceRange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Rating */}
          <div className="space-y-2 select-none">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Minimum Star Rating
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'Any' },
                { id: '4.5', label: '4.5+ ★' },
                { id: '4.7', label: '4.7+ ★' },
                { id: '4.8', label: '4.8+ ★' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMinRating(item.id)}
                  className={clsx(
                    "py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                    minRating === item.id 
                      ? "bg-primary text-white border-primary" 
                      : "bg-white text-text-secondary border-border hover:bg-gray-50/50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities checklist */}
          <div className="space-y-2 select-none">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Popular Amenities
            </label>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                "Free Wi-Fi",
                "Swimming Pool",
                "Spa & Wellness",
                "In-house Restaurant",
                "Complimentary Breakfast",
                "Parking Space"
              ].map((amenity) => {
                const isChecked = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    onClick={() => handleAmenityToggle(amenity)}
                    className="flex items-center gap-2.5 text-xs text-text-primary font-semibold text-left cursor-pointer"
                  >
                    <div className={clsx(
                      "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                      isChecked ? "bg-primary border-primary text-white" : "border-border bg-white"
                    )}>
                      {isChecked && <Check className="w-3 h-3" strokeWidth={3} />}
                    </div>
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex gap-3 pt-4 justify-end select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPriceRange(10000);
                setMinRating("all");
                setSelectedAmenities([]);
                setShowFiltersModal(false);
              }}
              className="h-10 text-xs font-bold border border-border shadow-2xs cursor-pointer"
            >
              Reset Filters
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowFiltersModal(false)}
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
