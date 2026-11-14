"use client";

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Star, MapPin, Check, Sparkles, Coffee, Wifi, Landmark, 
  BedDouble, Users, ShieldAlert, Award, Calendar 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppShell, Card, Button, Badge } from '@/components/ui';

// Hotels detail database lookup
const HOTEL_DETAILS_DB: Record<string, {
  name: string;
  locality: string;
  price: number;
  rating: number;
  reviews: number;
  isPopular: boolean;
  distance: number;
  description: string;
  image: string;
  gallery: string[];
  amenities: string[];
  rooms: Array<{
    name: string;
    price: number;
    capacity: string;
    bed: string;
  }>;
}> = {
  'himalayan-resort': {
    name: 'The Himalayan Resort',
    locality: 'Hadimba Road, Manali',
    price: 7500,
    rating: 4.9,
    reviews: 140,
    isPopular: true,
    distance: 1.2,
    description: "Built in traditional Victorian Gothic style, The Himalayan Resort is surrounded by orchards and snow-capped peaks. The luxury castle-resort features an outdoor pool, premium spas, and a gym.",
    image: "/kyoto.png",
    gallery: ["/kyoto.png", "/swiss_alps.png", "/bali.png"],
    amenities: ["Free Wi-Fi", "Swimming Pool", "Spa & Wellness", "In-house Restaurant", "Complimentary Breakfast", "Free Parking"],
    rooms: [
      { name: "Deluxe Castle Room", price: 7500, capacity: "2 Adults", bed: "1 King Bed" },
      { name: "Premier Valley Suite", price: 11000, capacity: "3 Adults", bed: "1 King Bed + 1 Sofa Bed" },
      { name: "Luxury 2-Bedroom Chalet", price: 18000, capacity: "4 Adults", bed: "2 King Beds" }
    ]
  },
  'manali-heights': {
    name: 'Manali Heights',
    locality: 'Old Manali, Manali',
    price: 4500,
    rating: 4.7,
    reviews: 95,
    isPopular: false,
    distance: 2.5,
    description: "Located near the scenic cedar forests of Dhungiri, Manali Heights is a cozy boutique stay with scenic valley windows, local wood craft panels, and an in-house Himachali kitchen.",
    image: "/swiss_alps.png",
    gallery: ["/swiss_alps.png", "/bali.png", "/kyoto.png"],
    amenities: ["Free Wi-Fi", "In-house Restaurant", "Complimentary Breakfast", "Free Parking"],
    rooms: [
      { name: "Standard Cozy Room", price: 4500, capacity: "2 Adults", bed: "1 Double Bed" },
      { name: "Deluxe Mountain View", price: 6000, capacity: "2 Adults", bed: "1 Double Bed" },
      { name: "Family Loft Suite", price: 9500, capacity: "4 Adults", bed: "2 Double Beds" }
    ]
  },
  'snow-valley': {
    name: 'Snow Valley Resort',
    locality: 'Log Huts Area, Manali',
    price: 6000,
    rating: 4.8,
    reviews: 120,
    isPopular: true,
    distance: 0.8,
    description: "Manali's largest luxury resort, Snow Valley features top-tier wooden panel suites, multi-cuisine open garden dining, recreation playrooms, and a children's play park.",
    image: "/swiss_alps.png",
    gallery: ["/swiss_alps.png", "/kyoto.png", "/bali.png"],
    amenities: ["Free Wi-Fi", "Spa & Wellness", "In-house Restaurant", "Complimentary Breakfast", "Free Parking"],
    rooms: [
      { name: "Standard Balcony Room", price: 6000, capacity: "2 Adults", bed: "1 Double Bed" },
      { name: "Premium Maharaja Suite", price: 9000, capacity: "3 Adults", bed: "1 King Bed" },
      { name: "Presidential Family Suite", price: 14000, capacity: "4 Adults", bed: "2 King Beds" }
    ]
  },
  'orchard-greens': {
    name: 'The Orchard Greens',
    locality: 'Log Huts Area, Manali',
    price: 5000,
    rating: 4.6,
    reviews: 88,
    isPopular: false,
    distance: 1.5,
    description: "Nestled in dense apple orchards, this eco-friendly stay offers serene views, rooftop open-deck coffee stalls, campfire facilities, and nature-trail walks.",
    image: "/bali.png",
    gallery: ["/bali.png", "/paris.png", "/kyoto.png"],
    amenities: ["Free Wi-Fi", "In-house Restaurant", "Complimentary Breakfast", "Free Parking"],
    rooms: [
      { name: "Orchard Deluxe Room", price: 5000, capacity: "2 Adults", bed: "1 Double Bed" },
      { name: "Apple View Premium Suite", price: 7500, capacity: "3 Adults", bed: "1 King Bed" }
    ]
  }
};

export default function HotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const hotel = HOTEL_DETAILS_DB[id.toLowerCase()] || HOTEL_DETAILS_DB['himalayan-resort'];

  const handleBookNow = () => {
    alert("Booking Confirmed! Enjoy your stay.");
  };

  const handleAddToTrip = (roomName: string) => {
    alert(`Success: ${roomName} added to trip itinerary stays!`);
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary text-xs tracking-wider uppercase font-bold">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      activeItem="Bookings"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* Back Link */}
        <div className="flex items-center gap-2 select-none">
          <Link href="/hotels" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stays list</span>
          </Link>
        </div>

        {/* DETAILS GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Gallery, Description, Rooms (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header info */}
            <div className="space-y-3 select-none">
              <div className="flex items-center gap-3.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
                  {hotel.name}
                </h1>
                {hotel.isPopular && (
                  <Badge variant="success" className="text-[9px] font-extrabold px-2.5 py-1 uppercase tracking-wider leading-none shadow-xs h-auto">
                    Popular Choice
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {hotel.locality}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-extrabold text-text-primary">{hotel.rating}</span>
                </div>
                <span>({hotel.reviews} reviews)</span>
              </div>
            </div>

            {/* Photo Gallery Grid */}
            <div className="grid grid-cols-3 gap-3.5 select-none">
              <div className="col-span-2 aspect-video rounded-2xl overflow-hidden border border-border bg-gray-50">
                <img 
                  src={hotel.gallery[0]} 
                  alt={hotel.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-3.5">
                <div className="flex-1 rounded-2xl overflow-hidden border border-border bg-gray-50">
                  <img 
                    src={hotel.gallery[1]} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 rounded-2xl overflow-hidden border border-border bg-gray-50">
                  <img 
                    src={hotel.gallery[2]} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 border-t border-border pt-6">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                Hotel Overview
              </h3>
              <p className="text-sm text-text-primary leading-relaxed font-medium select-text">
                {hotel.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="space-y-3 border-t border-border pt-6 select-none">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                Popular Amenities Offered
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities.map((amenity) => (
                  <div 
                    key={amenity}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-gray-50 text-xs font-bold text-text-primary"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Options selection list */}
            <div className="space-y-4.5 border-t border-border pt-6">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider select-none">
                Select Room Type
              </h3>
              
              <div className="space-y-3.5">
                {hotel.rooms.map((room) => (
                  <Card 
                    key={room.name}
                    className="p-4.5 border border-border bg-white rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary-200 transition-colors"
                  >
                    <div className="space-y-2 text-left">
                      <h4 className="text-sm font-bold text-text-primary">
                        {room.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs font-semibold text-text-secondary select-none">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-text-secondary" />
                          Capacity: {room.capacity}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5 text-text-secondary" />
                          {room.bed}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-0 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none select-none">
                          Rate
                        </span>
                        <h5 className="text-base font-extrabold text-text-primary mt-0.5 leading-none">
                          ₹{room.price.toLocaleString()}
                          <span className="text-[10px] font-medium text-text-secondary lowercase ml-1">
                            / night
                          </span>
                        </h5>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddToTrip(room.name)}
                        className="h-8 text-xs font-bold bg-white border border-border cursor-pointer select-none"
                      >
                        Add to Trip
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Quick Stats & Booking action (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick booking card */}
            <Card className="p-6 border border-border bg-white shadow-2xs rounded-2xl space-y-6">
              
              <div className="text-left space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider select-none">
                  Starting From
                </span>
                <h3 className="text-2xl font-extrabold text-text-primary leading-none">
                  ₹{hotel.price.toLocaleString()}
                  <span className="text-xs font-semibold text-text-secondary lowercase ml-1">
                    / night
                  </span>
                </h3>
              </div>

              {/* Summary specifications */}
              <div className="space-y-3.5 pt-2 text-left select-none">
                <div className="flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-primary" />
                  <span className="text-xs font-semibold text-text-primary">Free Cancellation anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="w-4.5 h-4.5 text-primary" />
                  <span className="text-xs font-semibold text-text-primary">Breakfast buffet included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-primary" />
                  <span className="text-xs font-semibold text-text-primary">Dates: May 20 - May 24</span>
                </div>
              </div>

              {/* Book Now Primary Button */}
              <Button
                type="button"
                variant="primary"
                onClick={handleBookNow}
                className="w-full h-11 text-xs font-bold justify-center shadow-md shadow-primary-500/10 cursor-pointer select-none"
              >
                Book Stay Now
              </Button>

            </Card>

            {/* Travel warning information */}
            <div className="border border-amber-200/50 bg-amber-50/30 rounded-2xl p-4.5 flex gap-3 text-left items-start select-none">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-text-primary">Booking Advisory</h5>
                <p className="text-[10px] text-text-secondary font-medium leading-normal">
                  Peak holiday seasons in Manali might experience heavy tourists bookings. Lock room allocations early to secure prices.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}
