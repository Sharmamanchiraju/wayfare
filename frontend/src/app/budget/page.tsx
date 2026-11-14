"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, Edit2, Check, HelpCircle, AlertCircle, Sparkles, BookOpen, 
  TrendingDown, TrendingUp, Info, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppShell, Card, Button, Input, Modal, Badge } from '@/components/ui';
import { useTrips } from '@/hooks/useTrips';
import api from '../../utils/api';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector 
} from 'recharts';
import { clsx } from 'clsx';

// Initial categories dataset
const INITIAL_CATEGORIES = [
  { name: 'Stay', amount: 9500, color: '#4F46E5' },       // Indigo
  { name: 'Transport', amount: 6000, color: '#06B6D4' },  // Teal
  { name: 'Food', amount: 4500, color: '#F59E0B' },       // Amber
  { name: 'Activities', amount: 2500, color: '#10B981' }, // Green
  { name: 'Shopping', amount: 1500, color: '#EC4899' },   // Pink
  { name: 'Others', amount: 500, color: '#6B7280' }       // Gray
];

const BUDGET_TIPS = [
  "Book in advance to get better deals",
  "Use public transport to save money",
  "Try local restaurants for authentic food",
  "Look for combo packages for activities"
];

export default function BudgetPage() {
  const { user, logout } = useAuth();
  const { trips } = useTrips();
  const router = useRouter();

  const activeTrip = trips && trips.length > 0 
    ? trips.find(t => t.destination && t.status?.toLowerCase() !== 'draft') 
    : null;

  const getCurrencySymbol = (currencyCode?: string) => {
    switch (currencyCode?.toUpperCase()) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'INR': return '₹';
      case 'AED': return 'AED ';
      case 'USD': return '$';
      default: return '₹';
    }
  };
  const activeCurrency = activeTrip?.trip_data?.currency || 'INR';
  const cSymbol = getCurrencySymbol(activeCurrency);
  
  // Budget categories state
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Sync budget from active trip if loaded
  useEffect(() => {
    if (activeTrip?.trip_data?.budget_breakdown) {
      const saved = activeTrip.trip_data.budget_breakdown.map((c: any, idx: number) => ({
        name: c.name,
        amount: parseFloat(c.amount) || 0,
        color: INITIAL_CATEGORIES[idx % INITIAL_CATEGORIES.length].color
      }));
      setCategories(saved);
    }
  }, [activeTrip]);

  // Editing state
  const [editingCategory, setEditingCategory] = useState<{ name: string; amount: number } | null>(null);
  const [editAmountVal, setEditAmountVal] = useState("");

  // Total budget calculation
  const totalBudget = useMemo(() => {
    return categories.reduce((sum, item) => sum + item.amount, 0);
  }, [categories]);

  // Transform categories to include percentages for Recharts
  const chartData = useMemo(() => {
    return categories.map(item => ({
      ...item,
      value: item.amount,
      percentage: totalBudget > 0 ? ((item.amount / totalBudget) * 100).toFixed(1) : '0'
    }));
  }, [categories, totalBudget]);

  // Conditional returns for empty states (placed after all hooks)
  if (!activeTrip) {
    return (
      <AppShell activeItem="Budget" userName={user?.username} userEmail={user?.email} onLogout={logout}>
        <div className="max-w-md mx-auto py-16 text-center space-y-6 select-none text-left">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <CreditCard className="w-7 h-7 text-text-secondary" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold tracking-tight text-text-primary">No Active Trips Found</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-medium">
              Create a new trip plan on the dashboard to view your budget splits!
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const hasBudget = activeTrip.trip_data && activeTrip.trip_data.budget_breakdown && Array.isArray(activeTrip.trip_data.budget_breakdown) && activeTrip.trip_data.budget_breakdown.length > 0;

  if (!hasBudget) {
    return (
      <AppShell activeItem="Budget" userName={user?.username} userEmail={user?.email} onLogout={logout}>
        <div className="max-w-md mx-auto py-16 text-center space-y-6 select-none text-left">
          <div className="w-16 h-16 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto shadow-2xs">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Budget Estimation In Progress</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-medium">
              We haven't generated a budget breakdown for your trip to <strong>{activeTrip.destination}</strong> yet. Finish slot validations in the chat to create your cost breakdown!
            </p>
          </div>
          <Button
            onClick={() => router.push(`/trips/${activeTrip.id}/chat`)}
            variant="primary"
            className="w-full h-11 text-xs font-bold gap-2 cursor-pointer shadow-md justify-center"
          >
            <span>Open Chat Assistant</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </AppShell>
    );
  }

  const handleEditClick = (category: typeof INITIAL_CATEGORIES[0]) => {
    setEditingCategory(category);
    setEditAmountVal(category.amount.toString());
  };

  const handleSaveAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    const parsedAmount = parseFloat(editAmountVal);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    const updatedCategories = categories.map(item => 
      item.name === editingCategory.name 
        ? { ...item, amount: parsedAmount } 
        : item
    );
    setCategories(updatedCategories);
    setEditingCategory(null);

    if (activeTrip) {
      try {
        await api.put(`/trips/${activeTrip.id}/budget`, {
          categories: updatedCategories.map(c => ({
            name: c.name,
            amount: c.amount
          }))
        });
      } catch (err) {
        console.error('Failed to sync budget calculations to server', err);
      }
    }
  };

  // Render customized active shape in center of PieChart
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 3}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <AppShell
      activeItem="Budget"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      <div className="space-y-8 text-left">
        
        {/* Header Title */}
        <div className="space-y-1 select-none">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
            Trip Budget
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Manage spending limits, edit categories, and track cost breakdowns
          </p>
        </div>

        {/* Donut and budget list split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Interactive Donut & Legend List (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-border rounded-2xl p-6 md:p-8 shadow-2xs space-y-8 flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
            
            {/* Donut Chart visual container */}
            <div className="relative w-64 h-64 shrink-0 flex items-center justify-center select-none">
              
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2.5}
                    dataKey="value"
                    animationDuration={800}
                    animationEasing="ease-out"
                    onMouseEnter={(_, index) => {
                      if (chartData[index]) {
                        setHoveredCategory(chartData[index].name);
                      }
                    }}
                    onMouseLeave={() => setHoveredCategory(null)}
                    {...({
                      activeIndex: chartData.findIndex(d => d.name === hoveredCategory),
                      activeShape: renderActiveShape
                    } as any)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${cSymbol}${Number(value || 0).toLocaleString()}`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none">
                  Total Budget
                </span>
                <span className="text-2xl font-extrabold text-text-primary mt-1.5 leading-none font-mono tracking-tight">
                  {cSymbol}{totalBudget.toLocaleString()}
                </span>
              </div>

            </div>

            {/* Legend categories list */}
            <div className="flex-grow w-full space-y-3.5">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider select-none mb-4">
                Categories Cost Breakdown
              </h3>

              <div className="space-y-2">
                {chartData.map((item) => {
                  const isHighlighted = hoveredCategory === item.name;
                  
                  return (
                    <div
                      key={item.name}
                      onMouseEnter={() => setHoveredCategory(item.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={clsx(
                        "p-3 rounded-xl border flex items-center justify-between gap-4 transition-all duration-150 select-none",
                        isHighlighted 
                          ? "border-primary bg-primary-50/15 scale-[1.01]" 
                          : "border-border bg-white"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Color swatch */}
                        <div 
                          className="w-3.5 h-3.5 rounded-md shrink-0" 
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate leading-none">
                            {item.name}
                          </p>
                          <span className="text-xs text-text-secondary font-bold leading-none mt-1 block">
                            <span className="font-mono tracking-tight">{item.percentage}</span>% of total
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-extrabold text-text-primary font-mono tracking-tight">
                          {cSymbol}{item.amount.toLocaleString()}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-text-secondary hover:text-primary transition-colors cursor-pointer"
                          title={`Edit ${item.name} budget`}
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT: Budget Tips Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Tips Card */}
            <Card className="p-6 border border-border bg-white shadow-2xs rounded-2xl space-y-4">
              
              <div className="flex items-center gap-2 select-none border-b border-border pb-3.5 text-left">
                <BookOpen className="w-4.5 h-4.5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">
                  Budget Tips
                </h3>
              </div>

              {/* Bullet checklist */}
              <div className="space-y-3.5 text-left select-none">
                {BUDGET_TIPS.map((tip) => (
                  <div key={tip} className="flex items-start gap-2.5 text-xs text-text-primary font-semibold leading-relaxed">
                    <div className="w-4.5 h-4.5 rounded-full bg-success-bg text-success-text flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

            </Card>

            {/* Saving warning banner */}
            <div className="border border-primary-200/50 bg-primary-50/15 rounded-2xl p-4.5 flex gap-3 text-left items-start select-none">
              <Info className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-text-primary">Eco-Traveler Option</h5>
                <p className="text-[10px] text-text-secondary font-medium leading-normal">
                  Adjust Stay and Transportation budgets to fit budget preferences. Donut calculations recalculate instantly.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* EDIT BUDGET MODAL */}
      <Modal
        isOpen={editingCategory !== null}
        onClose={() => setEditingCategory(null)}
        title={editingCategory ? `Edit ${editingCategory.name} Budget` : "Edit Budget"}
      >
        {editingCategory && (
          <form onSubmit={handleSaveAmount} className="space-y-4 text-left">
            
            <Input
              label={`Budget Amount (${activeCurrency})`}
              type="number"
              value={editAmountVal}
              onChange={(e) => setEditAmountVal(e.target.value)}
              placeholder="e.g. 5000"
              required
              autoFocus
            />

            <div className="flex gap-3 pt-4 border-t border-border justify-end select-none">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingCategory(null)}
                className="h-10 text-xs font-bold border border-border shadow-2xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="h-10 text-xs font-bold shadow-md shadow-primary-500/10 cursor-pointer"
              >
                Save Category
              </Button>
            </div>

          </form>
        )}
      </Modal>

    </AppShell>
  );
}
