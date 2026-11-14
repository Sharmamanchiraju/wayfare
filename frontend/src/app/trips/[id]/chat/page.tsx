"use client";

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Send, Paperclip, Sparkles, AlertCircle, Calendar, 
  MapPin, Check, Sliders, ChevronRight, ChevronDown, Navigation, Globe,
  Wallet, Users, Plane, Hotel, Utensils, FileText, Loader2,
  AlertTriangle, X, CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { AppShell, Card, Button, Modal } from '@/components/ui';
import { clsx } from 'clsx';

export default function TripChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = parseInt(resolvedParams.id, 10);

  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const { trip, messages, isLoading: chatLoading, isSending, error, sendMessage } = useChat(tripId);
  const router = useRouter();

  const [inputValue, setInputValue] = useState('');
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // Inline edit state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // Live geocode verification state (optimistic UI)
  const [verifyingDest, setVerifyingDest] = useState<string | null>(null);

  // Parameter states for customizing preferences modal
  const [prefDestination, setPrefDestination] = useState('');
  const [prefDays, setPrefDays] = useState('5');
  const [prefBudget, setPrefBudget] = useState('150,000');
  const [prefGroup, setPrefGroup] = useState('couple');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottomRef = useRef(true);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 150;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    isAtBottomRef.current = isAtBottom;
    if (isAtBottom) {
      setShowScrollButton(false);
    }
  };

  // Auto-scroll chat list
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (isAtBottomRef.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      setShowScrollButton(true);
    }
  }, [messages, isSending]);

  // Pre-populate modal preferences once trip loads
  useEffect(() => {
    if (trip) {
      setPrefDestination(trip.destination || '');
    }
  }, [trip]);

  // Clear verifying state when sending finishes
  useEffect(() => {
    if (!isSending) {
      setVerifyingDest(null);
    }
  }, [isSending]);

  // Parse parameters dynamically from the latest user message
  const getLatestUserParams = () => {
    const defaultParams = {
      destination: trip?.trip_data?.destination || trip?.destination || prefDestination || 'Manali',
      days: String(trip?.trip_data?.duration_days || prefDays),
      budget: String(trip?.trip_data?.budget || prefBudget),
      groupType: String(trip?.trip_data?.group_size || prefGroup)
    };
    return defaultParams;
  };

  const detectDestination = (text: string) => {
    const match = text.match(/set\s+destination\s+to\s+(.*)/i) || 
                  text.match(/plan\s+a\s+trip\s+to\s+(.*)/i) ||
                  text.match(/go\s+to\s+(.*)/i) ||
                  text.match(/visit\s+(.*)/i) ||
                  text.match(/change\s+destination\s+to\s+(.*)/i);
    return match ? match[1].trim() : null;
  };

  const handleSend = (text: string) => {
    if (!text.trim() || isSending) return;
    
    // Optimistic geocode pending check
    const dest = detectDestination(text);
    if (dest) {
      setVerifyingDest(dest);
    }
    
    sendMessage(text);
    setInputValue('');
  };

  const handleYesPlease = () => {
    const params = getLatestUserParams();
    router.push(
      `/trips/${tripId}/generating?destination=${encodeURIComponent(params.destination)}&days=${params.days}&budget=${encodeURIComponent(params.budget)}&groupType=${params.groupType}`
    );
  };

  const handleCustomizeClick = () => {
    const parsed = getLatestUserParams();
    setPrefDestination(parsed.destination);
    setPrefDays(parsed.days);
    setPrefBudget(parsed.budget);
    setPrefGroup(parsed.groupType);
    setShowPreferencesModal(true);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreferencesModal(false);
    const promptMessage = `Plan a ${prefDays} day trip to ${prefDestination} for a ${prefGroup} under ₹${prefBudget}`;
    handleSend(promptMessage);
  };

  const getCurrencySymbol = (code?: string) => {
    switch (code?.toUpperCase()) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'INR': return '₹';
      case 'USD': return '$';
      default: return '₹';
    }
  };

  const handleEditClick = (key: string, currentValue: any) => {
    setEditingField(key);
    setTempValue(currentValue !== undefined && currentValue !== null ? String(currentValue) : '');
  };

  const handleSaveField = (key: string) => {
    setEditingField(null);
    if (tempValue.trim() === '') return;
    
    let message = "";
    if (key === "destination") message = `Set destination to ${tempValue}`;
    else if (key === "origin_city") message = `Set departure city to ${tempValue}`;
    else if (key === "trip_type") message = `Set trip type to ${tempValue}`;
    else if (key === "budget") message = `Set budget to ${tempValue}`;
    else if (key === "group_size") message = `Set group size to ${tempValue}`;
    else if (key === "duration_days") message = `Set duration to ${tempValue} days`;
    else if (key === "transport_mode") message = `Set transport preference to ${tempValue}`;
    else if (key === "accommodation_preference") message = `Set accommodation preference to ${tempValue}`;
    else if (key === "food_preference") message = `Set food preference to ${tempValue}`;
    else if (key === "custom_preferences") message = `Set custom notes to ${tempValue}`;
    
    handleSend(message);
  };

  if (authLoading || chatLoading) {
    return (
      <div className="h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary text-xs tracking-wider uppercase font-bold">Loading…</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="h-screen bg-app-bg flex flex-col items-center justify-center p-6 text-center select-none">
        <AlertCircle className="text-error mb-3" size={40} />
        <h1 className="text-xl font-bold text-text-primary">Trip Plan Not Found</h1>
        <Link href="/dashboard" className="text-primary hover:text-primary-hover hover:underline mt-4 text-sm font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const displayMessages = messages;
  const tripData = trip.trip_data || {};
  const status = tripData.status || 'collecting';
  const destVerified = tripData.destination_verified || false;
  const isReadyToGenerate = status === 'ready_to_generate';

  const slots = [
    { key: 'destination', label: 'Destination', icon: MapPin, type: 'text', verifiedKey: 'destination_verified' },
    { key: 'origin_city', label: 'Origin City', icon: Navigation, type: 'text' },
    { key: 'trip_type', label: 'Trip Type', icon: Globe, type: 'select', options: ['domestic', 'international'] },
    { key: 'budget', label: 'Budget', icon: Wallet, type: 'number' },
    { key: 'group_size', label: 'Group Size', icon: Users, type: 'number' },
    { key: 'duration_days', label: 'Duration (days)', icon: Calendar, type: 'number' },
    { key: 'transport_mode', label: 'Transport Mode', icon: Plane, type: 'select', options: ['flight', 'train', 'road', 'no preference'] },
    { key: 'accommodation_preference', label: 'Accommodation', icon: Hotel, type: 'select', options: ['budget', 'mid-range', 'luxury', 'no preference'] },
    { key: 'food_preference', label: 'Food Preference', icon: Utensils, type: 'text' },
    { key: 'custom_preferences', label: 'Custom Notes', icon: FileText, type: 'textarea' }
  ];

  const renderSlotValue = (slot: typeof slots[0]) => {
    const val = tripData[slot.key];
    if (val === undefined || val === null || val === '') {
      return <span className="text-text-secondary/50 italic text-xs font-semibold">Not set yet</span>;
    }
    if (slot.key === 'budget') {
      const symbol = getCurrencySymbol(tripData.budget_currency || 'INR');
      return <span className="text-text-primary font-bold">{symbol}{Number(val).toLocaleString()}</span>;
    }
    return <span className="text-text-primary font-bold">{String(val)}</span>;
  };

  const renderSidePanelContent = () => (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Trip Parameters
          </h2>
          <span className={clsx(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            isReadyToGenerate ? "bg-success-bg text-success-text" : "bg-primary-50 text-primary"
          )}>
            {status === 'ready_to_generate' ? 'Ready' : status === 'collecting' ? 'Collecting' : status === 'clarifying' ? 'Clarifying' : status}
          </span>
        </div>

        {/* Slots rows */}
        <div className="space-y-2 max-h-[calc(100vh-290px)] overflow-y-auto pr-1">
          {slots.map((slot) => {
            const isEditing = editingField === slot.key;
            const Icon = slot.icon;
            const rawVal = tripData[slot.key];

            // Value or Verifying optimistic state
            let displayVal: React.ReactNode = renderSlotValue(slot);
            const isVerifyingThisField = slot.key === 'destination' && isSending && verifyingDest;
            
            if (isVerifyingThisField) {
              displayVal = (
                <span className="text-primary font-bold flex items-center gap-1.5 animate-pulse text-xs">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  Verifying "{verifyingDest}"...
                </span>
              );
            }

            return (
              <div 
                key={slot.key}
                className={clsx(
                  "p-3 rounded-xl border transition-all text-left",
                  isEditing 
                    ? "border-primary bg-white shadow-xs" 
                    : "border-border hover:border-primary/40 bg-white/60 hover:bg-white cursor-pointer"
                )}
                onClick={() => !isEditing && handleEditClick(slot.key, rawVal)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Icon className="w-4 h-4 text-text-secondary/70 shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {slot.label}
                    </span>
                  </div>
                  
                  {/* Status Indicator for Destination */}
                  {slot.key === 'destination' && (rawVal || isVerifyingThisField) && (
                    <div className="flex items-center shrink-0">
                      {isVerifyingThisField ? (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      ) : status === 'clarifying' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                      ) : !destVerified ? (
                        <AlertCircle className="w-3.5 h-3.5 text-error" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-success" />
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-1.5 min-h-[22px] flex items-center">
                  {isEditing ? (
                    <div className="w-full flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {slot.type === 'select' ? (
                        <select
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => handleSaveField(slot.key)}
                          autoFocus
                          className="w-full h-8 px-2 border border-border focus:border-primary rounded-lg text-xs font-semibold text-text-primary outline-none"
                        >
                          <option value="">Select option...</option>
                          {slot.options?.map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : slot.type === 'textarea' ? (
                        <textarea
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => handleSaveField(slot.key)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveField(slot.key);
                            }
                          }}
                          autoFocus
                          className="w-full min-h-[60px] p-2 border border-border focus:border-primary rounded-lg text-xs font-semibold text-text-primary outline-none resize-none"
                        />
                      ) : (
                        <input
                          type={slot.type}
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => handleSaveField(slot.key)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveField(slot.key);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border border-border focus:border-primary rounded-lg text-xs font-semibold text-text-primary outline-none"
                        />
                      )}
                    </div>
                  ) : (
                    displayVal
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action button */}
      <div className="pt-4 border-t border-border mt-3 select-none">
        <Button
          onClick={handleYesPlease}
          disabled={!isReadyToGenerate}
          variant="primary"
          className="w-full h-11 text-xs font-bold justify-center shadow-md disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Generate Itinerary</span>
        </Button>
        {!isReadyToGenerate && (
          <p className="text-[10.5px] text-text-secondary text-center mt-2.5 font-bold animate-pulse">
            {!tripData.destination ? "Enter a destination to start..." :
             (isSending && verifyingDest) ? `Verifying "${verifyingDest}"...` :
             !destVerified ? "Waiting on destination verification..." :
             !(
               tripData.destination &&
               tripData.origin_city &&
               tripData.trip_type &&
               tripData.budget &&
               tripData.group_size &&
               tripData.duration_days
             ) ? "Fill all required parameters (marked with icons) to proceed." :
             "Checking details with AI expert..."}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <AppShell
      activeItem="AI Assistant"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="h-[calc(100vh-140px)] grid grid-cols-1 lg:grid-cols-12 bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        
        {/* LEFT COLUMN: CHAT INTERFACE */}
        <div className="lg:col-span-8 flex flex-col justify-between h-full border-r border-border relative">
          
          {/* HEADER BAR */}
          <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 shrink-0 z-10 select-none">
            <div className="flex items-center gap-3.5 min-w-0">
              <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors shrink-0">
                <ArrowLeft size={18} />
              </Link>
              <div className="h-4 w-px bg-border shrink-0" />
              
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-white" />
                </div>

                <div className="text-left min-w-0">
                  <h1 className="text-sm font-bold text-text-primary leading-none truncate">
                    TripPlanner
                  </h1>
                  <p className="text-[10px] text-text-secondary font-bold tracking-tight mt-1 leading-none">
                    AI Travel Expert
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-border text-[11px] font-bold text-text-secondary select-none">
                <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                Planning: {trip.destination || "New Adventure"}
              </div>

              {/* Mobile sliders view button */}
              <button 
                onClick={() => setShowMobilePanel(true)}
                className="lg:hidden p-2 rounded-lg bg-gray-50 border border-border hover:bg-gray-100 text-text-secondary transition-colors cursor-pointer"
                title="View Parameters"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* MESSAGES LOG WINDOW */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6 bg-gray-50/30"
          >
            {displayMessages.map((msg) => {
              const isUser = msg.role === 'user';
              
              return (
                <div
                  key={msg.id || Math.random()}
                  className={clsx(
                    "flex gap-3 max-w-[80%] select-text animate-fade-in",
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0 shadow-2xs select-none">
                      <Sparkles className="w-4.5 h-4.5 text-primary" />
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <div
                      className={clsx(
                        "p-4 md:p-5 rounded-2xl text-sm leading-relaxed font-medium shadow-2xs relative",
                        isUser 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-white text-text-primary border border-border rounded-tl-none"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {!isUser && msg.id !== 9999 && (
                        <div className="mt-5 pt-4 border-t border-border/80 space-y-4">
                          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                            Ready to produce for you:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-primary font-semibold select-none">
                            {[
                              "Best time to visit",
                              "Day-wise itinerary",
                              "Budget breakdown",
                              "Hotel recommendations",
                              "Things to do & places to visit",
                              "Transportation options"
                            ].map((checkItem) => (
                              <div key={checkItem} className="flex items-center gap-2">
                                <div className="w-4.5 h-4.5 rounded-full bg-success-bg text-success-text flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3" strokeWidth={3} />
                                </div>
                                <span>{checkItem}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2.5 pt-2 select-none">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={handleYesPlease}
                              className="h-9 px-4.5 text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Yes, please!
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={handleCustomizeClick}
                              className="h-9 px-4.5 text-xs font-bold cursor-pointer border border-border shadow-2xs"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              Customize preferences
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <span className={clsx(
                      "text-[10px] text-text-secondary/70 font-semibold block select-none",
                      isUser ? "text-right" : "text-left"
                    )}>
                      {msg.created_at || 'Just now'}
                    </span>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex gap-3 max-w-[80%] mr-auto animate-fade-in select-none">
                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="space-y-1.5 text-left">
                  <div className="p-4 rounded-2xl rounded-tl-none border border-border bg-white text-text-primary shadow-2xs">
                    {verifyingDest ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary pr-4 py-1">
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                        <span>Verifying "{verifyingDest}" via live geocoding...</span>
                      </div>
                    ) : (
                      <div className="flex gap-1 items-center justify-center py-1 px-2.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-text-secondary/70 font-semibold block">
                    {verifyingDest ? "AI Travel expert is geocoding location..." : "AI Travel expert is typing..."}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              type="button"
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                  });
                  isAtBottomRef.current = true;
                  setShowScrollButton(false);
                }
              }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 transition-all select-none z-30 cursor-pointer animate-bounce border border-white/10"
            >
              <span>New messages</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* BOTTOM FIXED INPUT BAR */}
          <footer className="p-4 bg-white border-t border-border shrink-0 select-none">
            <div className="max-w-3xl mx-auto space-y-2">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
                className="flex gap-2.5 items-center"
              >
                <button
                  type="button"
                  onClick={() => alert("Attachments are a mock demonstration in this version.")}
                  className="h-11 w-11 border border-border bg-white hover:bg-gray-50 text-text-secondary hover:text-text-primary rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-2xs"
                  title="Upload attachment"
                >
                  <Paperclip size={16} />
                </button>

                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full h-11 bg-white border border-border focus:border-primary rounded-xl px-4 pr-12 text-sm font-semibold outline-none text-left text-text-primary placeholder:text-text-secondary/70 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                    disabled={isSending}
                  />
                  
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isSending}
                    className="absolute right-2.5 w-7.5 h-7.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  >
                    <Send size={12} className="transform -rotate-12" />
                  </button>
                </div>
              </form>

              <p className="text-[10px] text-text-secondary/80 font-medium text-center pt-1 leading-none">
                AI can make mistakes. Please verify important details.
              </p>
            </div>
          </footer>

        </div>

        {/* RIGHT COLUMN: PERSISTENT SLOT-STATE PANEL (DESKTOP) */}
        <div className="hidden lg:block lg:col-span-4 h-full bg-gray-50/50 p-6 overflow-y-auto border-l border-border">
          {renderSidePanelContent()}
        </div>

      </div>

      {/* MOBILE PANEL COLLAPSIBLE DRAWER */}
      {showMobilePanel && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 lg:hidden flex justify-end">
          <div className="w-[85vw] max-w-sm h-full bg-white p-6 shadow-2xl overflow-y-auto flex flex-col justify-between relative animate-slide-in">
            <button 
              onClick={() => setShowMobilePanel(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-full pt-6">
              {renderSidePanelContent()}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZE PREFERENCES MODAL */}
      <Modal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        title="Customize Travel Preferences"
      >
        <form onSubmit={handleSavePreferences} className="space-y-4 text-left">
          
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Destination</label>
            <input
              type="text"
              value={prefDestination}
              onChange={(e) => setPrefDestination(e.target.value)}
              placeholder="e.g. Manali, India"
              required
              className="w-full h-11 bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-3.5 text-sm font-semibold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Duration (days)</label>
              <input
                type="number"
                value={prefDays}
                onChange={(e) => setPrefDays(e.target.value)}
                placeholder="e.g. 5"
                required
                className="w-full h-11 bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-3.5 text-sm font-semibold outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Budget (INR)</label>
              <input
                type="text"
                value={prefBudget}
                onChange={(e) => setPrefBudget(e.target.value)}
                placeholder="e.g. 150,000"
                required
                className="w-full h-11 bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-3.5 text-sm font-semibold outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
              Group Type
            </label>
            <select
              value={prefGroup}
              onChange={(e) => setPrefGroup(e.target.value)}
              className="w-full h-11 bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-3.5 text-sm font-semibold text-text-primary outline-none"
            >
              <option value="solo">Solo Traveler</option>
              <option value="couple">Couple</option>
              <option value="family">Family Group</option>
              <option value="friends">Friends Group</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 justify-end select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPreferencesModal(false)}
              className="h-10 text-xs font-bold border border-border shadow-2xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="h-10 text-xs font-bold shadow-md shadow-primary-500/10"
            >
              Save & Generate
            </Button>
          </div>

        </form>
      </Modal>

    </AppShell>
  );
}
