"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Settings, CreditCard, Users, Bell, Shield, HelpCircle, LogOut, 
  MapPin, Camera, Sparkles, Star, Calendar, Bookmark, Landmark, 
  ShieldAlert, Check, TrendingUp, Info, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useTrips } from '@/hooks/useTrips';
import { AppShell, Card, Button, Input, Modal, Badge } from '@/components/ui';
import { clsx } from 'clsx';

export default function ProfilePage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { profile, updateProfile, isLoading: profileLoading } = useUser();
  const { trips } = useTrips();
  const router = useRouter();

  // Active section inside the profile settings panel
  const [activeMenuSection, setActiveMenuSection] = useState<'profile' | 'preferences' | 'other'>('profile');
  const [otherSectionTitle, setOtherSectionTitle] = useState('Payment Methods');

  // Modal edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states bound to user/profile state
  const [fullName, setFullName] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [homeCity, setHomeCity] = useState("San Francisco, CA");

  // Preferences form state
  const [prefTravelStyle, setPrefTravelStyle] = useState("Adventure");
  const [prefCurrency, setPrefCurrency] = useState("INR");
  const [prefEmailNotifs, setPrefEmailNotifs] = useState(true);
  const [prefSmsNotifs, setPrefSmsNotifs] = useState(false);

  // Sync state once profile loads
  useEffect(() => {
    if (profile || user) {
      const name = profile?.username || user?.username || "Traveler";
      const email = profile?.email || user?.email || "traveler@email.com";
      setFullName(name);
      setEmailVal(email);
      setEditName(name);
      setEditEmail(email);
    }
  }, [profile, user]);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateProfile.mutateAsync({
        username: editName,
        email: editEmail
      });
      setFullName(editName);
      setEmailVal(editEmail);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update profile values', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfileInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateProfile.mutateAsync({
        username: fullName,
        email: emailVal
      });
      alert("Profile information saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Travel preferences saved successfully!");
  };

  const handleLogoutClick = () => {
    logout();
    router.push('/login');
  };

  const handleMenuClick = (section: 'profile' | 'preferences' | 'other', title?: string) => {
    setActiveMenuSection(section);
    if (title) setOtherSectionTitle(title);
  };

  const userInitials = fullName.slice(0, 2).toUpperCase();

  if (authLoading || profileLoading) {
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
      activeItem="Profile"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="max-w-5xl mx-auto space-y-8 text-left">
        
        {/* Header */}
        <div className="space-y-1 select-none">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
            Profile Settings
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Manage account attributes, preferences, billing methods, and travel stats
          </p>
        </div>

        {/* Split profile workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Profile Card & Menu List (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Profile Avatar Card */}
            <Card className="p-6 border border-border bg-white shadow-2xs rounded-2xl flex flex-col items-center text-center space-y-4">
              <div className="relative group select-none cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-extrabold shadow-sm">
                  {userInitials}
                </div>
                <div className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={18} />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary">
                  {fullName}
                </h3>
                <p className="text-xs text-text-secondary font-medium truncate max-w-[220px]">
                  {emailVal}
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="h-8 px-4 text-xs font-bold border border-border bg-white shadow-2xs cursor-pointer select-none"
              >
                Edit Profile
              </Button>
            </Card>

            {/* Menu List of Settings Sections */}
            <Card className="p-3.5 border border-border bg-white shadow-2xs rounded-2xl select-none">
              <div className="space-y-1">
                
                {[
                  { id: 'profile', label: 'Profile Information', icon: User },
                  { id: 'preferences', label: 'Preferences', icon: Settings },
                  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
                  { id: 'companions', label: 'Travel Companions', icon: Users },
                  { id: 'notifs', label: 'Notifications', icon: Bell },
                  { id: 'security', label: 'Privacy & Security', icon: Shield },
                  { id: 'help', label: 'Help & Support', icon: HelpCircle }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSectionActive = activeMenuSection === item.id || (activeMenuSection === 'other' && otherSectionTitle === item.label);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id === 'profile' || item.id === 'preferences' ? item.id : 'other', item.label)}
                      className={clsx(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer text-xs font-extrabold",
                        isSectionActive 
                          ? "bg-primary-50 text-primary" 
                          : "text-text-secondary hover:bg-gray-50/50 hover:text-text-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={clsx("w-4.5 h-4.5", isSectionActive ? "text-primary" : "text-text-secondary")} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={14} className="opacity-65" />
                    </button>
                  );
                })}

                {/* Separator */}
                <div className="h-px bg-border my-2" />

                {/* Log Out distinctly styled */}
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-xs font-extrabold text-error hover:bg-error-bg/30 cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5 text-error" />
                  <span>Log Out</span>
                </button>

              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN: Functional form forms OR statistics card (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {activeMenuSection === 'profile' && (
              /* PROFILE INFORMATION FORM */
              <Card className="p-6 md:p-8 border border-border bg-white shadow-2xs rounded-2xl space-y-6">
                <div className="border-b border-border pb-4 select-none text-left">
                  <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-tight">
                    Profile Information
                  </h3>
                </div>

                <form onSubmit={handleProfileInfoSave} className="space-y-4 text-left">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={emailVal}
                    onChange={(e) => setEmailVal(e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <Input
                      label="Home City"
                      value={homeCity}
                      onChange={(e) => setHomeCity(e.target.value)}
                    />
                  </div>
                  <div className="pt-2 select-none">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isUpdating}
                      className="h-10 text-xs font-bold shadow-md shadow-primary-500/10 cursor-pointer"
                    >
                      Save Information
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeMenuSection === 'preferences' && (
              /* PREFERENCES FORM */
              <Card className="p-6 md:p-8 border border-border bg-white shadow-2xs rounded-2xl space-y-6">
                <div className="border-b border-border pb-4 select-none text-left">
                  <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-tight">
                    Travel Preferences
                  </h3>
                </div>

                <form onSubmit={handlePreferencesSave} className="space-y-4 text-left">
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider select-none">
                      Default Travel Style
                    </label>
                    <select
                      value={prefTravelStyle}
                      onChange={(e) => setPrefTravelStyle(e.target.value)}
                      className="w-full h-11 bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-3.5 text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Adventure">Adventure</option>
                      <option value="Relaxation">Relaxation</option>
                      <option value="Family">Family Trips</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Solo">Solo Traveler</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider select-none">
                      Preferred Currency
                    </label>
                    <select
                      value={prefCurrency}
                      onChange={(e) => setPrefCurrency(e.target.value)}
                      className="w-full h-11 bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-3.5 text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div className="space-y-3.5 border-t border-border pt-5 select-none">
                    <span className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Notification channels
                    </span>
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setPrefEmailNotifs(!prefEmailNotifs)}
                        className="flex items-center gap-2.5 text-xs text-text-primary font-semibold cursor-pointer"
                      >
                        <div className={clsx(
                          "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                          prefEmailNotifs ? "bg-primary border-primary text-white" : "border-border bg-white"
                        )}>
                          {prefEmailNotifs && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                        <span>Email Notifications (Weekly summary updates)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrefSmsNotifs(!prefSmsNotifs)}
                        className="flex items-center gap-2.5 text-xs text-text-primary font-semibold cursor-pointer"
                      >
                        <div className={clsx(
                          "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                          prefSmsNotifs ? "bg-primary border-primary text-white" : "border-border bg-white"
                        )}>
                          {prefSmsNotifs && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                        <span>SMS text alerts (Trip dates itinerary reminders)</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 select-none">
                    <Button
                      type="submit"
                      variant="primary"
                      className="h-10 text-xs font-bold shadow-md shadow-primary-500/10 cursor-pointer"
                    >
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeMenuSection === 'other' && (
              /* COMING SOON SUB-SECTION PLACEHOLDER */
              <Card className="p-6 md:p-8 border border-border bg-white shadow-2xs rounded-2xl space-y-6 text-center select-none py-16">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-text-secondary border border-border animate-pulse">
                  <Sparkles size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-text-primary">
                    {otherSectionTitle} is Coming Soon!
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto font-medium">
                    We are currently building this settings panel. It will be available in future releases.
                  </p>
                </div>
              </Card>
            )}

            {/* TRAVEL STATISTICS CARD */}
            <Card className="p-6 md:p-8 border border-border bg-white shadow-2xs rounded-2xl space-y-5 text-left">
              
              <div className="border-b border-border pb-4 select-none">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">
                  Travel Statistics
                </h3>
              </div>

              {/* Stats values rows */}
              <div className="grid grid-cols-2 gap-4.5 select-none">
                
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-gray-50/50">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0 border border-primary-100">
                    <Calendar className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Trips Plan Taken</span>
                    <h4 className="text-base font-extrabold text-text-primary mt-0.5 leading-none">
                      <span className="font-mono tracking-tight">{trips.length}</span> trips
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-gray-50/50">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                    <MapPin className="w-4.5 h-4.5 text-teal-600" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Places Visited</span>
                    <h4 className="text-base font-extrabold text-text-primary mt-0.5 leading-none">
                      <span className="font-mono tracking-tight">12</span> spots
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-gray-50/50">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                    <Star className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Reviews Shared</span>
                    <h4 className="text-base font-extrabold text-text-primary mt-0.5 leading-none">
                      <span className="font-mono tracking-tight">8</span> reviews
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-gray-50/50">
                  <div className="w-9 h-9 rounded-lg bg-success-bg text-success-text flex items-center justify-center shrink-0 border border-success/20">
                    <TrendingUp className="w-4.5 h-4.5 text-success-text" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Total Money Saved</span>
                    <h4 className="text-base font-extrabold text-text-primary mt-0.5 leading-none font-mono tracking-tight">
                      ₹12,400
                    </h4>
                  </div>
                </div>

              </div>

              {/* View stats trigger CTA */}
              <div className="pt-2 select-none">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => alert("Detailed stats and analytics are coming soon in next builds!")}
                  className="w-full h-10 text-xs font-bold bg-white border border-border shadow-2xs cursor-pointer justify-center"
                >
                  View All Statistics
                </Button>
              </div>

            </Card>

          </div>

        </div>

      </div>

      {/* EDIT PROFILE DETAILS MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile Attributes"
      >
        <form onSubmit={handleEditProfileSubmit} className="space-y-4 text-left">
          
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Sharma"
            required
            autoFocus
          />

          <Input
            label="Email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="e.g. sharma@email.com"
            required
          />

          <div className="flex gap-3 pt-4 border-t border-border justify-end select-none">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              className="h-10 text-xs font-bold border border-border shadow-2xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isUpdating}
              className="h-10 text-xs font-bold shadow-md shadow-primary-500/10 cursor-pointer"
            >
              Update Profile
            </Button>
          </div>

        </form>
      </Modal>

    </AppShell>
  );
}
