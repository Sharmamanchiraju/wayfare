"use client";

import React, { useState } from 'react';
import { 
  Home, Sparkles, Plane, Compass, Ticket, Map, 
  CreditCard, Calendar, Heart, Bell, User, Settings,
  Search, Menu, X, ChevronRight, LogOut, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './Avatar';
import { SidebarNavItem } from './SidebarNavItem';

import { useRouter } from 'next/navigation';
import { useStartOrResumeTrip } from '@/hooks/useStartOrResumeTrip';

export interface AppShellProps {
  children: React.ReactNode;
  activeItem?: string;
  onNavItemClick?: (itemId: string) => void;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeItem = 'Home',
  onNavItemClick,
  userName = 'Sharma',
  userEmail = 'sharma@email.com',
  onLogout,
  searchQuery,
  onSearchChange,
  searchPlaceholder
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const router = useRouter();
  const { startOrResumeTrip, isPending, error } = useStartOrResumeTrip();

  const navigationItems = [
    { id: 'Home', label: 'Home', icon: Home },
    { id: 'AI Assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'Trips', label: 'Trips', icon: Plane },
    { id: 'Budget', label: 'Budget', icon: CreditCard },
    { id: 'Profile', label: 'Profile', icon: User }
  ];

  const userInitials = userName.slice(0, 2).toUpperCase();

  const handleItemClick = (id: string) => {
    if (onNavItemClick) {
      onNavItemClick(id);
    } else {
      if (id === 'AI Assistant') {
        startOrResumeTrip();
      } else {
        const routeMap: Record<string, string> = {
          'Home': '/dashboard',
          'Trips': '/bookings',
          'Budget': '/budget',
          'Profile': '/profile'
        };
        const path = routeMap[id];
        if (path) {
          router.push(path);
        }
      }
    }
    setIsMobileOpen(false);
  };

  const currentSearchValue = onSearchChange ? (searchQuery || '') : searchVal;

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    } else {
      setSearchVal(e.target.value);
    }
  };

  const handleClearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    } else {
      setSearchVal('');
    }
  };

  // Sidebar logo block
  const BrandLogo = () => (
    <div className="flex flex-col gap-2.5 mb-7 px-2 shrink-0">
      <div className="flex items-center gap-3">
        {/* logo: mountain/compass mark in a rounded indigo-purple square */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md shadow-primary-500/20 text-white shrink-0">
          <Compass className="w-5.5 h-5.5 text-white animate-spin-slow" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-text-primary tracking-tight leading-none">TripPlanner</h1>
        </div>
      </div>
      {/* subtext under the logo */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/70 leading-none pl-1 block">
        AI Travel Companion
      </span>
    </div>
  );

  return (
    <div className="h-screen bg-app-bg text-text-primary flex overflow-hidden">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-[260px] bg-[#FBF8F3] border-r border-border shrink-0 flex-col h-full p-5 justify-between">
        <div className="flex flex-col h-[calc(100%-80px)]">
          <BrandLogo />

          {/* Navigation Items (Scrollable container) */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
            {navigationItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeItem.toLowerCase() === item.id.toLowerCase()}
                onClick={() => handleItemClick(item.id)}
                loading={item.id === 'AI Assistant' && isPending}
                disabled={isPending}
              />
            ))}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold select-none flex items-start gap-2 animate-fade-in">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </nav>
        </div>

        {/* User Footer profile section */}
        <div className="pt-4 border-t border-border shrink-0 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2 py-1">
            <Avatar fallback={userInitials} status="online" size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate leading-none">{userName}</p>
              <p className="text-xs text-text-secondary truncate mt-1 leading-none">{userEmail}</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 text-text-secondary hover:text-error-text hover:bg-error-bg/30 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* 2. MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-text-primary/45 backdrop-blur-sm"
            />
            {/* Sidebar Slide-in */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-64 bg-[#FBF8F3] h-full shadow-2xl flex flex-col p-5 justify-between z-10"
            >
              <button 
                onClick={() => setIsMobileOpen(false)} 
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary cursor-pointer p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col h-[calc(100%-80px)]">
                <BrandLogo />
                <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
                  {navigationItems.map((item) => (
                    <SidebarNavItem
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      active={activeItem.toLowerCase() === item.id.toLowerCase()}
                      onClick={() => handleItemClick(item.id)}
                      loading={item.id === 'AI Assistant' && isPending}
                      disabled={isPending}
                    />
                  ))}
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold select-none flex items-start gap-2 animate-fade-in">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </nav>
              </div>

              {/* User Mobile profile */}
              <div className="pt-4 border-t border-border shrink-0 flex flex-col gap-2">
                <div className="flex items-center gap-3 px-2 py-1">
                  <Avatar fallback={userInitials} status="online" size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate leading-none">{userName}</p>
                    <p className="text-xs text-text-secondary truncate mt-1 leading-none">{userEmail}</p>
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 text-text-secondary hover:text-error-text hover:bg-error-bg/30 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MAIN WORKSPACE CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-[#FBF8F3] border-b border-border flex items-center justify-between px-6 z-10 shrink-0 select-none">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 text-text-secondary rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Menu size={20} />
            </button>

            {/* Search Input Box */}
            <div className="relative max-w-md w-full hidden sm:flex items-center">
              <Search className="absolute left-3.5 h-4.5 w-4.5 text-text-secondary pointer-events-none" />
              <input
                type="text"
                value={currentSearchValue}
                onChange={handleSearchInputChange}
                placeholder={searchPlaceholder || "Search destinations, places, activities..."}
                className="w-full h-10 pl-10 pr-10 bg-gray-50/50 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
              {currentSearchValue !== '' && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3.5 text-text-secondary hover:text-text-primary p-0.5 rounded-full hover:bg-gray-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Notification Bell with Dynamic badge */}
            <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-xl transition-colors cursor-pointer relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
            </button>

            {/* Avatar block with active green dot */}
            <div className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded-lg transition-colors">
              <Avatar fallback={userInitials} status="online" size="md" />
              <span className="hidden lg:block text-xs font-bold text-text-primary truncate max-w-[80px]">
                {userName}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Container (Max width and 24px/6rem gutters) */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-app-bg">
          <div className="max-w-7xl mx-auto p-6 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
