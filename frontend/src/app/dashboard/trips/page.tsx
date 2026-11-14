"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Plus, User as UserIcon, LayoutDashboard, History, Settings, 
  Map, Heart, Bell, ChevronRight, MessageSquare, Compass, Pencil, 
  MapPin, Plane, Trash2, Edit2, Share2, Download, Eye, Grid, List as ListIcon, 
  Search, Check, X, AlertTriangle, Calendar, RefreshCw, AlertCircle
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useTrips, Trip } from '@/hooks/useTrips';
import { useDeleteTrip } from '@/hooks/useDeleteTrip';
import { useEditTrip } from '@/hooks/useEditTrip';
import { useChatHistory } from '@/hooks/useChatHistory';
import { Button, Card, CardContent, Badge, Input, Alert } from '@/components/ui';
import DarkModeToggle from '@/components/DarkModeToggle';
import { useStartOrResumeTrip } from '@/hooks/useStartOrResumeTrip';
import { CardSkeleton } from '@/components/ui/Skeleton';

export default function TripsIndexPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { trips, isLoading: tripsLoading } = useTrips();
  const { startOrResumeTrip, isPending, error } = useStartOrResumeTrip();
  const deleteTripMutation = useDeleteTrip();
  const editTripMutation = useEditTrip();
  const { history } = useChatHistory();
  const router = useRouter();

  // Sidebar controls
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Layout & Filtering states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'saved' | 'draft'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'upcoming' | 'recently_updated'>('newest');

  // Expanded Trip details mapping
  const [expandedTripIds, setExpandedTripIds] = useState<number[]>([]);

  // Bulk actions states
  const [selectedTripIds, setSelectedTripIds] = useState<number[]>([]);

  // Modal states
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trip>>({});
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);

  // Authenticate user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const toggleTripExpand = (id: number) => {
    setExpandedTripIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleSelectTrip = (id: number) => {
    setSelectedTripIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filteredTrips: Trip[]) => {
    if (selectedTripIds.length === filteredTrips.length) {
      setSelectedTripIds([]);
    } else {
      setSelectedTripIds(filteredTrips.map(t => t.id));
    }
  };

  const handleOpenEditModal = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setEditForm({
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      budget: trip.budget,
      status: trip.status
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    try {
      const budgetVal = editForm.budget ? parseFloat(editForm.budget.toString()) : undefined;
      await editTripMutation.mutateAsync({
        id: editingTrip.id,
        data: {
          destination: editForm.destination,
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          budget: budgetVal,
          status: editForm.status
        }
      });
      setEditingTrip(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDeleteModal = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    setDeletingTrip(trip);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTrip) return;
    try {
      await deleteTripMutation.mutateAsync(deletingTrip.id);
      setDeletingTrip(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedTripIds.length} trips?`)) {
      try {
        for (const id of selectedTripIds) {
          await deleteTripMutation.mutateAsync(id);
        }
        setSelectedTripIds([]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkExport = () => {
    alert(`Exporting ${selectedTripIds.length} trips as ZIP passbook archive!`);
    setSelectedTripIds([]);
  };

  const handleShareTrip = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`http://localhost:3000/trips/${id}/chat`);
    alert("Share link copied to clipboard!");
  };

  // NavItems definition
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'trips', label: 'Trips', icon: Map, path: '/dashboard/trips' },
    { id: 'chat', label: 'Chat History', icon: MessageSquare, path: '/dashboard' },
    { id: 'saved', label: 'Saved Places', icon: Heart, path: '/dashboard' },
    { id: 'personas', label: 'Personas', icon: UserIcon, path: '/dashboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard' },
  ] as const;

  // Sorting & Filtering logic
  const filteredTrips = trips.filter(trip => {
    if (!trip.destination || trip.status?.toLowerCase() === 'draft') return false;
    const matchesSearch = trip.destination?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = trip.status?.toLowerCase() === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortOption === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortOption === 'upcoming') {
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    }
    if (sortOption === 'recently_updated') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    // Default: Newest first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
        return 'bg-blue-600/10 text-blue-600 border border-blue-500/25';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25';
      case 'saved':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/25';
      case 'draft':
      default:
        return 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/25';
    }
  };

  const getCoverGradient = (destination?: string) => {
    const dest = destination?.toLowerCase() || '';
    if (dest.includes('tokyo') || dest.includes('japan')) {
      return 'from-red-500 via-pink-600 to-indigo-700';
    }
    if (dest.includes('paris') || dest.includes('france')) {
      return 'from-blue-600 via-indigo-600 to-purple-700';
    }
    if (dest.includes('swiss') || dest.includes('alps')) {
      return 'from-sky-400 via-blue-500 to-emerald-700';
    }
    return 'from-slate-700 via-slate-800 to-slate-900';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-foreground flex overflow-hidden relative">
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <aside className={`w-[260px] bg-slate-900 border-r border-border/40 shrink-0 hidden lg:flex flex-col justify-between p-5 select-none relative z-30`}>
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shadow-md shrink-0">
              <Plane size={20} className="text-accent-foreground transform rotate-45" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">TripPlanner AI</h1>
              <p className="text-xs text-accent font-bold uppercase tracking-widest mt-1">
                Travel Planner
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 pt-4">
            {navItems.map((item) => {
              const isActive = item.id === 'trips';
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Panel */}
        <div className="border-t border-border/40 pt-4 relative">
          <button 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="w-full flex items-center gap-4 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm uppercase">
              {user?.email?.slice(0, 2) || "S"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate uppercase">Sharma</p>
              <p className="text-xs text-slate-500 font-semibold truncate leading-none mt-1">{user?.email}</p>
            </div>
          </button>
          
          <AnimatePresence>
            {isUserDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-border rounded-lg shadow-xl overflow-hidden py-1 z-30"
              >
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={14} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* 2. MAIN CONTENT SCREEN */}
      <main className="flex-grow flex flex-col h-screen overflow-y-auto custom-scrollbar p-6 sm:p-10 select-text">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          
          {/* Header Row */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5 select-none text-left">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Your Trips</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage and review all your customized itineraries.</p>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <Button
                onClick={startOrResumeTrip}
                disabled={isPending}
                loading={isPending}
                variant="solid"
                className="h-10 px-4 text-xs font-bold gap-1.5 shadow-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <Plus size={14} />
                <span>New Trip</span>
              </Button>
            </div>
          </header>

          {error && (
            <Alert variant="error" className="py-2.5 px-3">
              <div className="flex gap-2 items-center text-xs font-bold text-red-500">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            </Alert>
          )}

          {/* Filters Bar */}
          <section className="bg-slate-900/50 border border-border/40 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center select-none">
            {/* Search Input */}
            <div className="w-full md:w-64 relative">
              <span className="absolute left-3 top-2.5 text-slate-500">
                <Search size={14} />
              </span>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by destination..."
                className="h-8.5 text-xs pl-8.5"
              />
            </div>

            {/* Status Pills */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar text-xs font-bold">
              {['all', 'in_progress', 'completed', 'saved', 'draft'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st as any)}
                  className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap uppercase ${
                    statusFilter === st 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-slate-900 text-slate-400 border-border/50 hover:bg-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* View & Sort */}
            <div className="flex gap-3 items-center w-full md:w-auto justify-end">
              <select
                value={sortOption}
                onChange={(e: any) => setSortOption(e.target.value)}
                className="h-8.5 px-3 rounded-lg border border-border text-xs bg-slate-900 text-foreground font-semibold"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="upcoming">Upcoming first</option>
                <option value="recently_updated">Recently updated</option>
              </select>

              <div className="flex rounded-lg border border-border bg-slate-900 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 cursor-pointer ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 cursor-pointer ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <ListIcon size={14} />
                </button>
              </div>
            </div>
          </section>

          {/* Bulk Action Header bar */}
          {selectedTripIds.length > 0 && (
            <Alert className="bg-slate-900 border border-blue-600/30 p-4 flex justify-between items-center rounded-xl animate-fade-in select-none">
              <span className="text-sm font-bold text-white">{selectedTripIds.length} trips selected</span>
              <div className="flex gap-2">
                <Button onClick={handleBulkExport} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 cursor-pointer">
                  <Download size={12} /> Export passbook
                </Button>
                <Button onClick={handleBulkDelete} variant="solid" size="sm" className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1 cursor-pointer">
                  <Trash2 size={12} /> Delete selected
                </Button>
              </div>
            </Alert>
          )}

          {/* Empty State */}
          {tripsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4 select-none">
              <div className="w-16 h-16 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shadow-md animate-pulse">
                <Plane size={28} className="transform rotate-45" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white tracking-tight">No trips found</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Adjust filters or create your first customized itinerary to begin!
                </p>
              </div>
              <Button
                onClick={startOrResumeTrip}
                disabled={isPending}
                loading={isPending}
                variant="solid"
                className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none"
              >
                Create Trip
              </Button>
            </div>
          ) : (
            
            /* VIEW MODE SWITCH */
            viewMode === 'grid' ? (
              
              /* GRID VIEW DISPLAY */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {filteredTrips.map((trip) => {
                  const isExpanded = expandedTripIds.includes(trip.id);
                  const isSelected = selectedTripIds.includes(trip.id);

                  return (
                    <Card 
                      key={trip.id}
                      onClick={() => toggleTripExpand(trip.id)}
                      className={`border-[0.5px] border-card-border hover:border-slate-700 bg-slate-900 shadow-md rounded-xl overflow-hidden group cursor-pointer transition-all flex flex-col ${
                        isSelected ? 'ring-2 ring-blue-600' : ''
                      }`}
                    >
                      {/* Cover Photo */}
                      <div className={`h-40 bg-gradient-to-tr ${getCoverGradient(trip.destination)} relative p-4 flex flex-col justify-between shrink-0 select-none`}>
                        <div className="flex justify-between items-start">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectTrip(trip.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4.5 h-4.5 rounded border-slate-500 accent-blue-600 cursor-pointer"
                          />
                          <Badge variant="primary" className={`${getStatusBadgeVariant(trip.status)} font-bold tracking-wide py-1 px-2 uppercase text-xs`}>
                            {trip.status || "Draft"}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-black text-white tracking-tight truncate leading-tight">
                            {trip.destination}
                          </h4>
                          <p className="text-xs text-white/80 font-bold flex items-center gap-1.5 mt-1 leading-none">
                            <Calendar size={10} /> May 15 - May 22, 2026
                          </p>
                        </div>
                      </div>

                      {/* Content details */}
                      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-400">
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase block">Budget Limit</span>
                            <span className="text-white font-extrabold mt-0.5 block">${trip.budget || 2000}</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase block">Est. spending</span>
                            <span className="text-white font-extrabold mt-0.5 block">$1,850</span>
                          </div>
                        </div>

                        {/* Expander list block */}
                        {isExpanded && (
                          <div className="pt-4 border-t border-border/40 text-sm text-slate-400 space-y-3 animate-fade-in">
                            <p className="text-xs leading-relaxed">
                              💡 Plan includes Shibuya Crossing, Meiji Shrine, and Tokyo Senso-ji temple with Ippudo ramen dinners.
                            </p>
                            <div className="pt-2 flex justify-between items-center text-xs font-bold text-slate-500 select-none">
                              <span>Last updated: 3 days ago</span>
                              <span>Duration: 7 Days</span>
                            </div>
                          </div>
                        )}

                        {/* Actions overlay buttons row */}
                        <div className="pt-3 border-t border-border/40 flex items-center justify-between select-none">
                          <Link 
                            href={`/trips/${trip.id}/chat`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                          >
                            <Eye size={12} /> View chat
                          </Link>

                          <div className="flex gap-1.5">
                            <button 
                              onClick={(e) => handleOpenEditModal(e, trip)}
                              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Edit trip"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={(e) => handleShareTrip(e, trip.id)}
                              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Copy link"
                            >
                              <Share2 size={13} />
                            </button>
                            <button 
                              onClick={(e) => handleOpenDeleteModal(e, trip)}
                              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete trip"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              
              /* LIST VIEW (TABLE FORMAT) */
              <div className="border border-border/40 rounded-xl bg-slate-900 shadow-md overflow-hidden animate-fade-in select-none text-left">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-400">
                    <thead className="bg-slate-850 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border/40">
                      <tr>
                        <th className="py-4 px-5 w-10">
                          <input
                            type="checkbox"
                            checked={selectedTripIds.length === filteredTrips.length}
                            onChange={() => handleSelectAll(filteredTrips)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                        </th>
                        <th className="py-4 px-5">Destination</th>
                        <th className="py-4 px-5">Dates</th>
                        <th className="py-4 px-5">Duration</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5">Budget</th>
                        <th className="py-4 px-5">Est. spending</th>
                        <th className="py-4 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30 font-semibold text-slate-300">
                      {filteredTrips.map((trip) => {
                        const isSelected = selectedTripIds.includes(trip.id);
                        return (
                          <tr 
                            key={trip.id}
                            className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                              isSelected ? 'bg-blue-600/5' : ''
                            }`}
                            onClick={() => router.push(`/trips/${trip.id}/chat`)}
                          >
                            <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectTrip(trip.id)}
                                className="w-4 h-4 rounded cursor-pointer"
                              />
                            </td>
                            <td className="py-4 px-5 font-black text-white">{trip.destination}</td>
                            <td className="py-4 px-5">May 15 - May 22, 2026</td>
                            <td className="py-4 px-5">7 Days</td>
                            <td className="py-4 px-5">
                              <Badge variant="primary" className={`${getStatusBadgeVariant(trip.status)} py-1 px-2 h-auto font-bold uppercase text-xs`}>
                                {trip.status || "Draft"}
                              </Badge>
                            </td>
                            <td className="py-4 px-5 font-extrabold text-white">${trip.budget || 2000}</td>
                            <td className="py-4 px-5 font-extrabold text-white">$1,850</td>
                            <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <button onClick={(e) => handleOpenEditModal(e, trip)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors cursor-pointer">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={(e) => handleOpenDeleteModal(e, trip)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            )
          )}

        </div>
      </main>

      {/* 3. EDIT TRIP MODAL */}
      <AnimatePresence>
        {editingTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTrip(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-slate-900 border-[0.5px] border-card-border rounded-xl shadow-xl p-6 z-10 text-left"
            >
              <h3 className="text-lg font-bold text-white tracking-tight select-none">Edit Trip details</h3>
              <p className="text-xs text-muted-foreground select-none mt-1">Modify the metadata variables of this trip record.</p>

              <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-4 text-xs font-semibold text-foreground">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Destination</label>
                  <Input
                    type="text"
                    required
                    value={editForm.destination || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, destination: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Departure</label>
                    <input
                      type="date"
                      required
                      value={editForm.start_date ? editForm.start_date.toString() : ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-border focus:border-blue-600 rounded-lg p-2.5 text-xs text-foreground outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Return</label>
                    <input
                      type="date"
                      required
                      value={editForm.end_date ? editForm.end_date.toString() : ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-border focus:border-blue-600 rounded-lg p-2.5 text-xs text-foreground outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Budget Limit ($)</label>
                    <Input
                      type="number"
                      value={editForm.budget || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status</label>
                    <select
                      value={editForm.status || 'draft'}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-border bg-slate-950 px-2 text-xs"
                    >
                      <option value="draft">Draft</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="saved">Saved</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <Button
                    type="button"
                    onClick={() => setEditingTrip(null)}
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
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. DELETE TRIP CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingTrip(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-slate-900 border-[0.5px] border-card-border rounded-xl shadow-xl p-6 z-10 text-left select-none"
            >
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Delete this trip?</h3>
                  <p className="text-xs text-red-400 font-semibold mt-1">⚠️ Warning: This action cannot be undone.</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-950/50 border border-border/40 rounded-lg text-xs font-semibold space-y-1 text-slate-300">
                <p>Destination: <span className="text-white font-black">{deletingTrip.destination}</span></p>
                <p>Dates: May 15 - May 22, 2026</p>
              </div>

              <div className="flex gap-2 justify-end pt-5">
                <Button
                  onClick={() => setDeletingTrip(null)}
                  variant="outline"
                  className="h-9 font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  variant="solid"
                  className="h-9 font-bold text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
