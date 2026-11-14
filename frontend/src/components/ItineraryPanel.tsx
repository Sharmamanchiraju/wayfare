"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Share2, MoreHorizontal, Calendar, Wallet, Compass, 
  MapPin, Plus, Trash2, Edit2, Check, X, ArrowUpDown, Info, Globe, Clock, 
  Plane, Home, Utensils, Star, Wifi, Eye, RefreshCw 
} from 'lucide-react';
import { Card, CardContent, Button, Badge, Input } from '@/components/ui';

// Load map display dynamically to avoid SSR Leaflet crashes
const MapDisplay = dynamic(() => import('./MapDisplay'), { ssr: false });

interface Activity {
  id: number;
  day: number;
  time: string;
  name: string;
  type: 'flight' | 'hotel' | 'restaurant' | 'landmark' | 'activity' | 'transport' | 'other';
  location: string;
  duration?: string;
  cost: number;
  notes?: string;
  rating?: number;
  amenities?: string[];
  address?: string;
}

interface ItineraryPanelProps {
  tripData: any;
  isLoading?: boolean;
}

export default function ItineraryPanel({ tripData, isLoading }: ItineraryPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'itinerary' | 'details' | 'activities'>('overview');
  
  // Local editable state for activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expandedDays, setExpandedDays] = useState<number[]>([1, 2]);
  
  // Inline editing states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Activity>>({});

  // Add Activity Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormDay, setAddFormDay] = useState(1);
  const [addForm, setAddForm] = useState<Partial<Activity>>({
    type: 'landmark',
    cost: 0,
    time: '10:00 AM'
  });

  // Filters for Activities Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterDay, setFilterDay] = useState('All');
  const [sortField, setSortField] = useState<'day' | 'cost' | 'rating'>('day');

  // Initialize activities from tripData or fallbacks
  useEffect(() => {
    if (tripData && tripData.itinerary) {
      // Map server data structure to our clean Activity interface
      const list: Activity[] = [];
      let index = 1;
      tripData.itinerary.forEach((d: any) => {
        if (d.activities) {
          d.activities.forEach((act: any) => {
            list.push({
              id: index++,
              day: d.day,
              time: act.time || '10:00 AM',
              name: act.name || act.title || 'Sightseeing',
              type: (act.type?.toLowerCase() || 'landmark') as any,
              location: act.location || tripData.destination || 'Tokyo',
              cost: act.cost || 0,
              notes: act.notes || act.description || '',
              rating: act.rating || 4.5,
              duration: act.duration || '1h 30m'
            });
          });
        }
      });
      if (list.length > 0) {
        setActivities(list);
        return;
      }
    }

    // Default mock activities if trip has no schedule yet
    const defaults: Activity[] = [
      { id: 1, day: 1, time: "08:00 AM", name: "Depart from San Francisco", type: "flight", location: "SFO Airport", duration: "10h 30m", cost: 600, notes: "Flight JAL 102" },
      { id: 2, day: 1, time: "10:30 AM", name: "Arrive at Narita Airport", type: "transport", location: "Narita Airport", duration: "1h 30m", cost: 30, notes: "Take Skyliner express train to Shinjuku" },
      { id: 3, day: 1, time: "04:00 PM", name: "Check into Grand Hyatt Tokyo", type: "hotel", location: "Shinjuku, Tokyo", duration: "2 nights", cost: 240, address: "6-10-3 Roppongi, Minato-ku", rating: 5, amenities: ["WiFi", "AC", "Pool", "Gym"] },
      { id: 4, day: 1, time: "07:00 PM", name: "Dinner at Ippudo Ramen", type: "restaurant", location: "Shinjuku", cost: 20, rating: 4.5, notes: "Amazing tonkotsu ramen!" },
      { id: 5, day: 2, time: "09:00 AM", name: "Shibuya Crossing & Hachiko Statue", type: "landmark", location: "Shibuya", duration: "1h", cost: 0, rating: 4.8, notes: "World's busiest pedestrian crossing" },
      { id: 6, day: 2, time: "11:30 AM", name: "Meiji Jingu Shrine stroll", type: "landmark", location: "Harajuku", duration: "2h", cost: 0, rating: 4.7, notes: "Serene forest shrine in the city center" },
      { id: 7, day: 2, time: "01:30 PM", name: "Lunch at Harajuku Gyoza Lou", type: "restaurant", location: "Harajuku", cost: 15, rating: 4.6, notes: "Famous gyoza plates" },
      { id: 8, day: 2, time: "03:30 PM", name: "Takeshita Street shopping", type: "activity", location: "Harajuku", duration: "2h", cost: 50, rating: 4.4, notes: "Quirky styles, crepes, and anime stores" },
      { id: 9, day: 3, time: "10:00 AM", name: "Senso-ji Temple visit", type: "landmark", location: "Asakusa", duration: "2h", cost: 0, rating: 4.9, notes: "Tokyo's oldest and most iconic temple" },
    ];
    setActivities(defaults);
  }, [tripData]);

  const toggleDay = (day: number) => {
    setExpandedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleEditClick = (act: Activity) => {
    setEditingId(act.id);
    setEditForm({ ...act });
  };

  const handleEditSave = () => {
    if (!editingId) return;
    setActivities(prev => prev.map(act => act.id === editingId ? { ...act, ...editForm } as Activity : act));
    setEditingId(null);
  };

  const handleDeleteActivity = (id: number) => {
    if (confirm("Remove this activity from itinerary?")) {
      setActivities(prev => prev.filter(act => act.id !== id));
    }
  };

  const handleAddActivity = () => {
    const newAct: Activity = {
      id: Date.now(),
      day: addFormDay,
      time: addForm.time || '10:00 AM',
      name: addForm.name || 'New Activity',
      type: (addForm.type || 'landmark') as any,
      location: addForm.location || 'Tokyo',
      cost: Number(addForm.cost) || 0,
      notes: addForm.notes || '',
      duration: addForm.duration || '1h'
    };

    setActivities(prev => [...prev, newAct].sort((a, b) => a.day - b.day));
    setIsAddModalOpen(false);
    setAddForm({ type: 'landmark', cost: 0, time: '10:00 AM' });
  };

  // Calculations
  const totalBudget = 2000;
  const estimatedCost = activities.reduce((sum, act) => sum + act.cost, 0);
  const remainingBudget = totalBudget - estimatedCost;

  // Cost splits
  const flightsCost = activities.filter(a => a.type === 'flight').reduce((s, a) => s + a.cost, 0);
  const hotelsCost = activities.filter(a => a.type === 'hotel').reduce((s, a) => s + a.cost, 0);
  const foodCost = activities.filter(a => a.type === 'restaurant').reduce((s, a) => s + a.cost, 0);
  const activitiesCost = activities.filter(a => a.type === 'landmark' || a.type === 'activity').reduce((s, a) => s + a.cost, 0);

  // Group activities by Day number
  const daysList = Array.from(new Set(activities.map(a => a.day))).sort((a, b) => a - b);

  // Map coordinates mapping for Leaflet
  const mapLocations = [
    { id: "1", name: "Grand Hyatt Tokyo", type: "hotel" as const, lat: 35.6595, lng: 139.7291, day: 1, description: "Grand check-in accommodation" },
    { id: "2", name: "Shibuya Crossing", type: "attraction" as const, lat: 35.6595, lng: 139.7006, day: 2, description: "Busiest crossing stroll" },
    { id: "3", name: "Meiji Jingu Shrine", type: "attraction" as const, lat: 35.6764, lng: 139.6993, day: 2, description: "Serene shrine walk" },
    { id: "4", name: "Senso-ji Temple", type: "attraction" as const, lat: 35.7148, lng: 139.7967, day: 3, description: "Historic temple site" },
    { id: "5", name: "Ippudo Ramen Shinjuku", type: "attraction" as const, lat: 35.6905, lng: 139.7015, day: 1, description: "Ramen dining stop" }
  ];

  // Activities panel filtering
  const filteredActivities = activities.filter(act => {
    const matchesSearch = act.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          act.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    let targetType = filterType;
    if (filterType === 'Hotels') targetType = 'hotel';
    if (filterType === 'Restaurants') targetType = 'restaurant';
    if (filterType === 'Landmarks') targetType = 'landmark';
    if (filterType === 'Transport') targetType = 'transport';

    const matchesType = targetType === 'All' || act.type === targetType.toLowerCase();
    const matchesDay = filterDay === 'All' || act.day === parseInt(filterDay, 10);

    return matchesSearch && matchesType && matchesDay;
  }).sort((a, b) => {
    if (sortField === 'cost') return b.cost - a.cost;
    if (sortField === 'rating') return (b.rating || 0) - (a.rating || 0);
    return a.day - b.day;
  });

  const getIconColor = (type: Activity['type']) => {
    switch (type) {
      case 'flight':
      case 'transport':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/15';
      case 'hotel':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15';
      case 'restaurant':
        return 'bg-red-500/10 text-red-500 border-red-500/15';
      case 'landmark':
      case 'activity':
      default:
        return 'bg-amber-500/10 text-amber-500 border-amber-500/15';
    }
  };

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'flight':
        return <Plane size={15} />;
      case 'hotel':
        return <Home size={15} />;
      case 'restaurant':
        return <Utensils size={15} />;
      case 'landmark':
      case 'activity':
      default:
        return <Compass size={15} />;
    }
  };

  return (
    <Card className="w-full h-full overflow-hidden border-[0.5px] border-card-border bg-card shadow-sm rounded-xl flex flex-col relative text-left">
      
      {/* 1. Header (Fixed at top) */}
      <header className="p-5 border-b border-border shrink-0 select-none">
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h2 className="text-xl font-black text-foreground tracking-tight">
              {tripData?.destination || "Trip to Tokyo"}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
              <span>May 15 - May 22, 2026</span>
              <span>•</span>
              <Badge variant="primary" className="py-0 h-auto font-bold">7 Days</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8.5 px-3 font-semibold text-xs gap-1.5 cursor-pointer">
              <Download size={13} /> Export
            </Button>
            <Button variant="outline" size="sm" className="h-8.5 px-3 font-semibold text-xs gap-1.5 cursor-pointer">
              <Share2 size={13} /> Share
            </Button>
            <Button variant="outline" size="sm" className="h-8.5 w-8.5 p-0 justify-center cursor-pointer">
              <MoreHorizontal size={14} />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1.5 mt-5 border-b border-border/40 pb-1 text-xs font-bold">
          {(['overview', 'map', 'itinerary', 'details', 'activities'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 capitalize border-b-2 transition-all cursor-pointer ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Scrollable Body Contents */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-[0.5px] border-card-border bg-muted/20">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Allocated</p>
                  <p className="text-xl font-black text-foreground mt-0.5">${totalBudget}</p>
                </CardContent>
              </Card>
              <Card className="border-[0.5px] border-card-border bg-muted/20">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Est. Cost</p>
                  <p className="text-xl font-black text-foreground mt-0.5">${estimatedCost}</p>
                </CardContent>
              </Card>
              <Card className="border-[0.5px] border-card-border bg-muted/20">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Remaining</p>
                  <p className={`text-xl font-black mt-0.5 ${remainingBudget >= 0 ? 'text-accent' : 'text-red-semantic'}`}>
                    ${remainingBudget}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-[0.5px] border-card-border bg-muted/20">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Activities</p>
                  <p className="text-xl font-black text-foreground mt-0.5">{activities.length} planned</p>
                </CardContent>
              </Card>
            </div>

            {/* Budget Breakdown & Pie Chart */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-card-border bg-card shadow-xs select-none">
              {/* Pure SVG Pie Chart */}
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="16" />
                  {/* Flights slice */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="16" 
                    strokeDasharray={`${(flightsCost / Math.max(estimatedCost, 1)) * 251.2} 251.2`} 
                    strokeDashoffset="0" 
                  />
                  {/* Hotels slice */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="16" 
                    strokeDasharray={`${(hotelsCost / Math.max(estimatedCost, 1)) * 251.2} 251.2`} 
                    strokeDashoffset={`-${(flightsCost / Math.max(estimatedCost, 1)) * 251.2}`} 
                  />
                  {/* Food & Dining slice */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#EF4444" strokeWidth="16" 
                    strokeDasharray={`${(foodCost / Math.max(estimatedCost, 1)) * 251.2} 251.2`} 
                    strokeDashoffset={`-${((flightsCost + hotelsCost) / Math.max(estimatedCost, 1)) * 251.2}`} 
                  />
                  {/* Activities slice */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="16" 
                    strokeDasharray={`${(activitiesCost / Math.max(estimatedCost, 1)) * 251.2} 251.2`} 
                    strokeDashoffset={`-${((flightsCost + hotelsCost + foodCost) / Math.max(estimatedCost, 1)) * 251.2}`} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase leading-none">Cost Split</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3 text-xs w-full">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 shrink-0" />
                  <span className="font-semibold text-foreground">Flights: ${flightsCost}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-accent shrink-0" />
                  <span className="font-semibold text-foreground">Hotels: ${hotelsCost}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-red-500 shrink-0" />
                  <span className="font-semibold text-foreground">Food: ${foodCost}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0" />
                  <span className="font-semibold text-foreground">Activities: ${activitiesCost}</span>
                </div>
              </div>
            </div>

            {/* Collapsible Day Accordions */}
            <div className="space-y-3 text-left select-none">
              <h4 className="font-bold text-foreground text-sm tracking-tight border-b border-border/40 pb-1.5">Days Schedule Summary</h4>
              {daysList.map(dayNum => {
                const dayActs = activities.filter(a => a.day === dayNum);
                const isExpanded = expandedDays.includes(dayNum);
                return (
                  <div key={dayNum} className="border border-border rounded-lg overflow-hidden bg-card">
                    <button
                      onClick={() => toggleDay(dayNum)}
                      className="w-full flex justify-between items-center p-3 bg-muted/20 hover:bg-muted/45 transition-colors cursor-pointer text-xs font-bold text-foreground"
                    >
                      <span>Day {dayNum}: {dayActs[0]?.location || 'Sightseeing'} ({dayActs.length} activities)</span>
                      <span>{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    {isExpanded && (
                      <div className="p-3 border-t border-border space-y-2 text-xs">
                        {dayActs.map(act => (
                          <div key={act.id} className="flex justify-between items-center gap-3 py-1.5 border-b border-border/30 last:border-0">
                            <span className="font-bold text-muted-foreground w-16">{act.time}</span>
                            <span className="flex-1 font-semibold text-foreground truncate">{act.name}</span>
                            <span className="font-bold text-slate-500">${act.cost}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MAP DISPLAY */}
        {activeTab === 'map' && (
          <div className="h-[450px] w-full rounded-xl overflow-hidden border border-border animate-fade-in relative">
            <MapDisplay locations={mapLocations} />
          </div>
        )}

        {/* TAB 3: TIMELINE ITINERARY */}
        {activeTab === 'itinerary' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex justify-between items-center pb-2 border-b border-border/40 select-none">
              <h3 className="font-black text-foreground text-base tracking-tight">Trip Timeline</h3>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add slot
              </Button>
            </div>

            {/* Days list */}
            {daysList.map(dayNum => {
              const dayActs = activities.filter(a => a.day === dayNum);
              return (
                <div key={dayNum} className="space-y-4">
                  {/* Day Header Box */}
                  <div className="bg-blue-600 text-white rounded-lg p-3 flex justify-between items-center shadow-sm select-none">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Day {dayNum}</p>
                      <h4 className="font-black text-base tracking-tight mt-0.5">
                        {dayActs[0]?.location || 'Tokyo'} Exploration
                      </h4>
                    </div>
                    <Badge variant="primary" className="bg-blue-700 text-white font-bold h-auto py-1">
                      May {14 + dayNum}
                    </Badge>
                  </div>

                  {/* Vertical Timeline Activity List */}
                  <div className="relative pl-6 space-y-4 border-l-[1.5px] border-blue-500/25 ml-4">
                    {dayActs.map((act) => {
                      const isEditing = editingId === act.id;
                      const iconConfig = getIconColor(act.type);

                      return (
                        <div key={act.id} className="relative group">
                          {/* Timeline node icon */}
                          <div className={`absolute -left-[35px] top-1.5 w-6.5 h-6.5 rounded-full border border-card flex items-center justify-center shadow-xs text-xs font-black ${iconConfig}`}>
                            {getIcon(act.type)}
                          </div>

                          {/* Activity Card */}
                          <Card className={`border-[0.5px] border-card-border shadow-xs hover:border-border transition-all ${isEditing ? 'bg-amber-500/5 border-amber-300' : 'bg-card'}`}>
                            <CardContent className="p-4 space-y-3">
                              
                              {isEditing ? (
                                /* INLINE EDIT VIEW */
                                <div className="space-y-3 text-xs">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-xs font-bold text-slate-500">Activity Name</label>
                                      <Input
                                        type="text"
                                        value={editForm.name || ''}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="h-8 text-xs bg-amber-500/5 focus:bg-card"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-bold text-slate-500">Time</label>
                                      <Input
                                        type="text"
                                        value={editForm.time || ''}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                                        className="h-8 text-xs bg-amber-500/5 focus:bg-card"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-xs font-bold text-slate-500">Cost ($)</label>
                                      <Input
                                        type="number"
                                        value={editForm.cost || 0}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                                        className="h-8 text-xs bg-amber-500/5 focus:bg-card"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-bold text-slate-500">Location</label>
                                      <Input
                                        type="text"
                                        value={editForm.location || ''}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                        className="h-8 text-xs bg-amber-500/5 focus:bg-card"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Notes / Information</label>
                                    <textarea
                                      value={editForm.notes || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                      className="w-full bg-amber-500/5 focus:bg-card border border-border rounded-md p-2 text-xs outline-none focus:border-blue-600"
                                      rows={2}
                                    />
                                  </div>

                                  <div className="flex gap-2 justify-end pt-1">
                                    <Button
                                      onClick={() => setEditingId(null)}
                                      variant="outline"
                                      size="sm"
                                      className="h-8 font-bold text-xs"
                                    >
                                      <X size={12} className="mr-1" /> Cancel
                                    </Button>
                                    <Button
                                      onClick={handleEditSave}
                                      variant="solid"
                                      size="sm"
                                      className="h-8 font-bold text-xs bg-blue-600 text-white"
                                    >
                                      <Check size={12} className="mr-1" /> Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* STATIC VIEW DISPLAY */
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-xs font-bold text-muted-foreground/80 tracking-wide block uppercase leading-none mb-1">
                                        {act.time}
                                      </span>
                                      <h5 className="font-extrabold text-foreground text-sm tracking-tight leading-snug">
                                        {act.name}
                                      </h5>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-black text-slate-500">${act.cost}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground/85">
                                    <span className="flex items-center gap-1">
                                      <MapPin size={10} /> {act.location}
                                    </span>
                                    {act.duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock size={10} /> {act.duration}
                                      </span>
                                    )}
                                    {act.rating && (
                                      <span className="flex items-center gap-0.5 text-amber-500">
                                        ★ {act.rating}
                                      </span>
                                    )}
                                  </div>

                                  {act.notes && (
                                    <p className="text-xs text-muted-foreground/80 border-t border-border/40 pt-2 font-medium mt-1 leading-relaxed">
                                      💡 {act.notes}
                                    </p>
                                  )}

                                  {act.amenities && (
                                    <div className="flex gap-1.5 pt-1.5 flex-wrap">
                                      {act.amenities.map(am => (
                                        <Badge key={am} variant="secondary" className="text-xs py-0 font-bold tracking-wider capitalize">
                                          {am}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}

                                  {/* Hover Actions Menu */}
                                  <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900 text-white px-2 py-1 rounded-md text-xs shadow-lg select-none z-10 transition-opacity">
                                    <button onClick={() => handleEditClick(act)} className="hover:text-accent p-0.5 cursor-pointer">
                                      <Edit2 size={11} />
                                    </button>
                                    <button onClick={() => handleDeleteActivity(act.id)} className="hover:text-red-semantic p-0.5 cursor-pointer">
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              )}

                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>

                  {/* Day Footer Stats Summary */}
                  <div className="p-3 bg-muted/15 border border-border/60 rounded-lg text-xs font-bold text-muted-foreground/85 flex justify-between items-center select-none ml-4">
                    <span>{dayActs.length} activities scheduled</span>
                    <span>Est. cost: ${dayActs.reduce((s, a) => s + a.cost, 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div>
              <h4 className="font-black text-foreground text-sm tracking-tight pb-1.5 border-b border-border/40 mb-3">Outbound flight specs</h4>
              <Card className="border-[0.5px] border-card-border p-4 bg-muted/20">
                <CardContent className="p-0 text-xs space-y-2">
                  <p className="font-semibold text-foreground">✈ Outbound: JAL Flight 102</p>
                  <p className="text-muted-foreground">Departing May 15, 10:30 AM (SFO) → Arriving Tokyo Narita Airport</p>
                  <p className="text-xs text-muted-foreground font-semibold">Seat coordinates: 24A, 24B (Economy Class)</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="font-black text-foreground text-sm tracking-tight pb-1.5 border-b border-border/40 mb-3">Loding checkouts</h4>
              <Card className="border-[0.5px] border-card-border p-4 bg-muted/20">
                <CardContent className="p-0 text-xs space-y-2">
                  <p className="font-semibold text-foreground">🏨 Grand Hyatt Tokyo</p>
                  <p className="text-muted-foreground">Check-in: May 15, 04:00 PM • Checkout: May 17, 11:00 AM</p>
                  <p className="text-xs text-muted-foreground font-semibold">Total cost: $240 (2 Nights stay)</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 5: ACTIVITIES SEARCHABLE GRID */}
        {activeTab === 'activities' && (
          <div className="space-y-5 animate-fade-in text-left">
            {/* Filters Row */}
            <div className="space-y-3 border-b border-border/40 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search activities..."
                  className="h-8.5 text-xs"
                />
                
                <select
                  value={sortField}
                  onChange={(e: any) => setSortField(e.target.value)}
                  className="h-8.5 px-3 rounded-lg border border-border text-xs bg-card text-foreground"
                >
                  <option value="day">Sort by Day</option>
                  <option value="cost">Sort by Cost (High → Low)</option>
                  <option value="rating">Sort by Rating</option>
                </select>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs font-bold select-none">
                {['All', 'Restaurants', 'Landmarks', 'Hotels', 'Transport'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                      filterType === t 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-card text-muted-foreground border-card-border hover:bg-muted'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {filteredActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 select-none">No matching activities found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredActivities.map((act) => (
                  <Card key={act.id} className="border-[0.5px] border-card-border p-4 bg-card">
                    <CardContent className="p-0 flex justify-between items-start gap-4">
                      <div className="flex gap-3 items-start min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getIconColor(act.type)}`}>
                          {getIcon(act.type)}
                        </div>
                        <div className="min-w-0 text-left">
                          <h5 className="font-bold text-foreground text-xs leading-none mb-1 truncate">{act.name}</h5>
                          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                            <MapPin size={9} /> {act.location} • Day {act.day}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-500">${act.cost}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. ADD SLOT MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-card border-[0.5px] border-card-border rounded-xl shadow-xl p-6 z-10 text-left"
            >
              <h3 className="text-base font-bold text-foreground tracking-tight select-none">Add Activity Slot</h3>
              <p className="text-xs text-muted-foreground select-none">Configure a new element into your trip calendar timeline.</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddActivity();
                }}
                className="space-y-3.5 pt-4 text-xs font-semibold text-foreground"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scheduled Day</label>
                    <select
                      value={addFormDay}
                      onChange={(e) => setAddFormDay(parseInt(e.target.value, 10))}
                      className="w-full h-8.5 rounded-lg border border-border bg-card px-2 text-xs"
                    >
                      {daysList.map(n => <option key={n} value={n}>Day {n}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slot Type</label>
                    <select
                      value={addForm.type}
                      onChange={(e) => setAddForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full h-8.5 rounded-lg border border-border bg-card px-2 text-xs capitalize"
                    >
                      {['flight', 'hotel', 'restaurant', 'landmark', 'activity', 'transport'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Activity Name</label>
                  <Input
                    type="text"
                    required
                    value={addForm.name || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Asakusa Shrine"
                    className="h-8.5 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slot Time</label>
                    <Input
                      type="text"
                      required
                      value={addForm.time || ''}
                      onChange={(e) => setAddForm(prev => ({ ...prev, time: e.target.value }))}
                      placeholder="e.g. 10:00 AM"
                      className="h-8.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cost ($)</label>
                    <Input
                      type="number"
                      value={addForm.cost || 0}
                      onChange={(e) => setAddForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                      placeholder="Cost in USD"
                      className="h-8.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location / City</label>
                    <Input
                      type="text"
                      value={addForm.location || ''}
                      onChange={(e) => setAddForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Shinjuku"
                      className="h-8.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duration</label>
                    <Input
                      type="text"
                      value={addForm.duration || ''}
                      onChange={(e) => setAddForm(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g. 1h 30m"
                      className="h-8.5 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
                  <textarea
                    value={addForm.notes || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter additional details..."
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:border-blue-600"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <Button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    variant="outline"
                    className="h-9 font-bold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="solid"
                    className="h-9 font-bold text-xs bg-blue-600 text-white"
                  >
                    Add Slot
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Card>
  );
}
