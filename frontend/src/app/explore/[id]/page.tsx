"use client";

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Star, MapPin, Calendar, Sparkles, Check, Info, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { usePersonas } from '@/hooks/usePersonas';
import { AppShell, Card, Button, Badge } from '@/components/ui';

// Structured details database
const DETAILS_DB: Record<string, {
  name: string;
  region: string;
  category: string;
  rating: number;
  reviews: number;
  overview: string;
  attractions: string[];
  bestTime: string;
  image: string;
  gallery: string[];
}> = {
  manali: {
    name: "Manali",
    region: "Himachal Pradesh",
    category: "Mountains",
    rating: 4.8,
    reviews: 220,
    overview: "Nestled in the Beas River valley, Manali is a high-altitude Himalayan resort town known as a backpacking center and honeymoon destination. It serves as the gateway for skiing in the Solang Valley and trekking in Parvati Valley.",
    attractions: ["Solang Valley Adventure", "Rohtang Pass Snow Excursion", "Jogini Waterfalls Trek", "Hidimba Temple Visit"],
    bestTime: "October to June (Pleasant weather & Snow seasons)",
    image: "/swiss_alps.png",
    gallery: ["/swiss_alps.png", "/kyoto.png", "/paris.png"]
  },
  coorg: {
    name: "Coorg",
    region: "Karnataka",
    category: "Mountains",
    rating: 4.7,
    reviews: 180,
    overview: "Coorg (also known as Kodagu) is a mountainous district in Karnataka, famous for its coffee plantations, lush forests, misty hills, and rich culture. Often referred to as the 'Scotland of India'.",
    attractions: ["Abbey Falls Scenic View", "Raja's Seat Sunset View", "Dubare Elephant Camp", "Nagarhole National Park Safari"],
    bestTime: "October to March (Great sightseeing conditions)",
    image: "/kyoto.png",
    gallery: ["/kyoto.png", "/bali.png", "/swiss_alps.png"]
  },
  goa: {
    name: "Goa",
    region: "India",
    category: "Beaches",
    rating: 4.9,
    reviews: 450,
    overview: "Goa is a state in western India with coastlines stretching along the Arabian Sea. It is famous for its gorgeous beaches, 17th-century Portuguese churches, spice plantations, and vibrant nightlife.",
    attractions: ["Calangute & Baga Beaches", "Dudhsagar Waterfalls Trek", "Basilica of Bom Jesus", "Anjuna Flea Market Shopping"],
    bestTime: "November to February (Cool breeze dry season)",
    image: "/bali.png",
    gallery: ["/bali.png", "/paris.png", "/kyoto.png"]
  },
  kerala: {
    name: "Kerala",
    region: "God's Own Country",
    category: "Wildlife",
    rating: 4.8,
    reviews: 310,
    overview: "Kerala is a state on India's tropical Malabar Coast, famous for its palm-lined beaches, tea plantations, wildlife sanctuaries, and network of canals known as the backwaters.",
    attractions: ["Alappuzha Houseboat Cruise", "Munnar Tea Estates Walk", "Periyar National Park Safari", "Wayanad Bamboo Rafting"],
    bestTime: "September to March (Monsoon aftermath green seasons)",
    image: "/kyoto.png",
    gallery: ["/kyoto.png", "/swiss_alps.png", "/bali.png"]
  },
  ladakh: {
    name: "Ladakh",
    region: "Jammu & Kashmir",
    category: "Adventure",
    rating: 4.9,
    reviews: 150,
    overview: "Ladakh is a region administered by India as a union territory, extending from the Kunlun mountain range to the main Great Himalayas. Known for its high mountain passes, monasteries, and pristine Pangong Lake.",
    attractions: ["Pangong Tso Lake Excursion", "Kardung La High Pass", "Diskit Monastery Visit", "Magnetic Hill Experience"],
    bestTime: "May to September (Road passes open season)",
    image: "/swiss_alps.png",
    gallery: ["/swiss_alps.png", "/kyoto.png", "/paris.png"]
  },
  rajasthan: {
    name: "Rajasthan",
    region: "The Royal State",
    category: "Heritage",
    rating: 4.7,
    reviews: 280,
    overview: "Rajasthan is a state in northern India. It is known for its majestic palaces, historic hill forts, colorful culture, and the vast Thar Desert, evoking the romance of royalty.",
    attractions: ["Amer Fort Palace Tour", "Jaisalmer Desert Safari", "Udaipur Lake Palace Boat Ride", "Hawa Mahal Visit"],
    bestTime: "October to March (Winter heritage festivals)",
    image: "/paris.png",
    gallery: ["/paris.png", "/bali.png", "/swiss_alps.png"]
  },
  uttarakhand: {
    name: "Uttarakhand",
    region: "Devbhoomi",
    category: "Pilgrimage",
    rating: 4.8,
    reviews: 210,
    overview: "Uttarakhand is a state in northern India crossed by the Himalayas. It is known for its Hindu pilgrimage sites, national parks, glacial valleys, and the spiritual city of Rishikesh.",
    attractions: ["Rishikesh Ganga Aarti Ceremony", "Valley of Flowers Trek", "Nainital Lake Boating", "Kedarnath Temple Trek"],
    bestTime: "March to June / October to November",
    image: "/swiss_alps.png",
    gallery: ["/swiss_alps.png", "/kyoto.png", "/bali.png"]
  },
  andaman: {
    name: "Andaman",
    region: "Andaman & Nicobar",
    category: "Beaches",
    rating: 4.9,
    reviews: 140,
    overview: "Andaman and Nicobar Islands is a union territory of India consisting of 572 islands. Known for its white sand beaches, coral reefs, diving reefs, and colonial cellular jail history.",
    attractions: ["Radhanagar Beach Sunset Walk", "Scuba Diving in Havelock", "Ross Island Historic Tour", "Baratang Limestone Caves"],
    bestTime: "October to May (Best scuba clear visibility)",
    image: "/bali.png",
    gallery: ["/bali.png", "/paris.png", "/kyoto.png"]
  }
};

export default function DestinationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { createTrip } = useTrips();
  const { personas } = usePersonas();
  const router = useRouter();

  const [planning, setPlanning] = useState(false);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const destDetails = DETAILS_DB[id.toLowerCase()] || DETAILS_DB.manali;

  const handlePlanTrip = async () => {
    setPlanning(true);
    try {
      const activePersonaId = personas.length > 0 ? personas[0].id : undefined;
      const seedPrompt = `Plan a 5 day trip to ${destDetails.name} for a couple under ₹1,50,000`;

      // Call API to create new trip
      const newTrip = await createTrip.mutateAsync({
        destination: destDetails.name,
        persona_id: activePersonaId,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: 'planning'
      });

      // Redirect directly to generating screen seeding the query
      router.push(
        `/trips/${newTrip.id}/generating?destination=${encodeURIComponent(destDetails.name)}&days=5&budget=150,000&groupType=couple`
      );
    } catch (err) {
      console.error('Failed to quick-plan destination trip', err);
    } finally {
      setPlanning(false);
    }
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
      activeItem="Explore"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* Back navigation link */}
        <div className="flex items-center gap-2 select-none">
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explore listing</span>
          </Link>
        </div>

        {/* DETAILS GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONTENT BLOCK: Overview, Attractions, Best Season (7 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header info card */}
            <div className="space-y-3 select-none">
              <div className="flex items-center gap-3.5 flex-wrap">
                <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
                  {destDetails.name}
                </h1>
                <Badge variant="primary" className="text-[10px] font-extrabold px-2.5 py-1 uppercase tracking-wider h-auto leading-none">
                  {destDetails.category}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {destDetails.region}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-extrabold text-text-primary">{destDetails.rating}</span>
                </div>
                <span>({destDetails.reviews} reviews)</span>
              </div>
            </div>

            {/* Photo Gallery boxes */}
            <div className="grid grid-cols-3 gap-3.5 select-none">
              <div className="col-span-2 aspect-video rounded-2xl overflow-hidden border border-border bg-gray-50">
                <img 
                  src={destDetails.gallery[0]} 
                  alt={destDetails.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-3.5">
                <div className="flex-1 rounded-2xl overflow-hidden border border-border bg-gray-50">
                  <img 
                    src={destDetails.gallery[1]} 
                    alt={destDetails.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 rounded-2xl overflow-hidden border border-border bg-gray-50">
                  <img 
                    src={destDetails.gallery[2]} 
                    alt={destDetails.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Overview */}
            <div className="space-y-2 border-t border-border pt-6">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                Overview Description
              </h3>
              <p className="text-sm text-text-primary leading-relaxed font-medium select-text">
                {destDetails.overview}
              </p>
            </div>

            {/* Attractions */}
            <div className="space-y-3 border-t border-border pt-6">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                Top Visited Attractions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 select-none">
                {destDetails.attractions.map((spot) => (
                  <div 
                    key={spot}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-gray-50 text-xs font-bold text-text-primary"
                  >
                    <div className="w-5 h-5 rounded-full bg-success-bg text-success-text flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                    <span>{spot}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN INFO PANEL: Quick Info card, Best time to visit, and CTA Plan (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick stats and CTA card */}
            <Card className="p-6 border border-border bg-white shadow-2xs rounded-2xl space-y-6">
              
              <div className="space-y-1.5 border-b border-border pb-4 text-left">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Quick Details
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-text-primary">Recommended stay: 5 Days</span>
                </div>
              </div>

              {/* Best time to visit */}
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  <Info className="w-4.5 h-4.5 text-primary" />
                  <span>Best Season to Visit</span>
                </div>
                <p className="text-xs text-text-primary leading-relaxed font-bold">
                  {destDetails.bestTime}
                </p>
              </div>

              {/* Action Plan Button */}
              <Button
                type="button"
                variant="primary"
                onClick={handlePlanTrip}
                loading={planning}
                className="w-full h-11 text-xs font-bold gap-2 cursor-pointer shadow-md shadow-primary-500/10 justify-center"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Plan a trip here</span>
              </Button>

            </Card>

            {/* Travel advisory banner note */}
            <div className="border border-red-200/50 bg-red-50/30 rounded-2xl p-4.5 flex gap-3 text-left items-start select-none">
              <ShieldAlert className="w-4.5 h-4.5 text-error shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-text-primary">Travel Advisory Note</h5>
                <p className="text-[10px] text-text-secondary font-medium leading-normal">
                  Always verify local route conditions, permit guidelines, and dynamic mountain weather notices prior to travels.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}
