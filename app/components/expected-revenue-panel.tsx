"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import {
  Flame, CalendarDays, Calendar, ChevronLeft, ChevronRight, PlusCircle, CheckCircle2,
  XCircle, Clock, Edit3, DollarSign, TrendingUp, Sparkles, AlertCircle,
  ArrowRight, Loader2, Ban, BarChart3, ListChecks, Trophy, ChevronDown, ChevronUp,
  X, Plus
} from "lucide-react"
import { supabaseCRM } from "@/lib/supabaseClient"

interface ExpectedRevenuePanelProps {
  user: any;
  viewerMode?: boolean;
  isCompactBtn?: boolean;
  hideCrmLinks?: boolean;
  calMonthOverride?: number; // monthOffset from parent dashboard
}

interface SaleEntry {
  awl_id: string;
  expected_revenue: string;
}

interface DayEntry {
  shift_date: string;
  has_revenue: boolean;
  sales: SaleEntry[];
  verified: boolean;
  streak: number;
  matched_awl_ids: string[];
  actual_awl_ids?: string[];
  actual_revenue?: number;
  actual_sales_data?: { awl_id: string; revenue: number }[];
  submitted_at: string;
  first_submitted_at?: string;
  edit_count?: number;
}

// IST helpers
const getISTDate = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
const getISTDateStr = () => {
  const ist = getISTDate();
  const hours = ist.getHours();
  // Strictly enforce 8:00 PM to 8:00 PM shift. Anything before 20:00 belongs to the previous day's shift.
  if (hours < 20) {
    ist.setDate(ist.getDate() - 1);
  }
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
};
const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

export function ExpectedRevenuePanel({ user, viewerMode, isCompactBtn, hideCrmLinks, calMonthOverride }: ExpectedRevenuePanelProps) {
  const [isMainDialogOpen, setIsMainDialogOpen] = useState(false);
  // Tab state: "calendar" | "history"
  const [activeTab, setActiveTab] = useState<"calendar" | "history">("calendar");
  const [isExpanded, setIsExpanded] = useState(isCompactBtn ? true : false);
  const isFirstLoad = useRef(true);

  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Live countdown for edit lock
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000); // refresh every 30s
    return () => clearInterval(t);
  }, []);

  // Calendar month — synced with parent's calMonthOverride if provided
  const [calMonth, setCalMonth] = useState(() => {
    const ist = getISTDate();
    if (calMonthOverride !== undefined) {
      const d = new Date(ist.getFullYear(), ist.getMonth() + calMonthOverride, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    return { year: ist.getFullYear(), month: ist.getMonth() };
  });

  // Sync calMonth when calMonthOverride changes
  useEffect(() => {
    if (calMonthOverride === undefined) return;
    const ist = getISTDate();
    const d = new Date(ist.getFullYear(), ist.getMonth() + calMonthOverride, 1);
    setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
  }, [calMonthOverride]);

  // Form state
  const [hasRevenue, setHasRevenue] = useState<boolean | null>(null);
  const [numSales, setNumSales] = useState<number>(0);
  const [salesEntries, setSalesEntries] = useState<SaleEntry[]>([]);

  // Day detail dialog
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null);

  const todayStr = getISTDateStr();
  const todayEntry = Array.isArray(entries) ? entries.find(e => e?.shift_date === todayStr) : null;
  const todayIsWeekend = isWeekend(getISTDate());

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    if (isFirstLoad.current) setLoading(true);
    try {
      const monthStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/expected-revenue?email=${encodeURIComponent(user.email)}&month=${monthStr}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
      }
    } catch (e) {
      console.error("Failed to fetch expected revenue:", e);
    }
    setLoading(false);
    isFirstLoad.current = false;
  }, [user.email, calMonth]);

  useEffect(() => {
    isFirstLoad.current = true;
    fetchEntries();
    const interval = setInterval(fetchEntries, 300000); // 5m auto-refresh
    return () => clearInterval(interval);
  }, [fetchEntries]);

  // Open form
  const openForm = () => {
    const todayEntry = entries.find(e => e.shift_date === todayStr);
    if (todayEntry) {
      setHasRevenue(todayEntry.has_revenue);
      setNumSales(todayEntry.sales?.length || 0);
      setSalesEntries(todayEntry.sales || []);
    } else {
      setHasRevenue(null);
      setNumSales(0);
      setSalesEntries([]);
    }
    setFormOpen(true);
  };

  const handleNumSalesChange = (n: number) => {
    const num = Math.max(0, Math.min(50, n));
    setNumSales(num);
    const newEntries = [...salesEntries];
    while (newEntries.length < num) newEntries.push({ awl_id: "", expected_revenue: "" });
    setSalesEntries(newEntries.slice(0, num));
  };

  const handleSave = async () => {
    setSaving(true);
    if (hasRevenue) {
      for (const s of salesEntries) {
        const trimmedAwlId = s.awl_id.trim().toUpperCase();
        if (!trimmedAwlId) {
          alert("Please fill in all AWL IDs.");
          setSaving(false);
          return;
        }
        if (!/^AWL-\d+$/i.test(trimmedAwlId)) {
          alert(`"${s.awl_id}" is not a valid format. Please use "AWL-1234" style.`);
          setSaving(false);
          return;
        }
        if (/^AWL-0+$/i.test(trimmedAwlId)) {
          alert(`"${s.awl_id}" is invalid. AWL ID cannot be AWL-0.`);
          setSaving(false);
          return;
        }
        const revNum = Number(s.expected_revenue);
        if (isNaN(revNum) || revNum <= 0) {
          alert(`The revenue for "${s.awl_id}" must be a positive number.`);
          setSaving(false);
          return;
        }

        // Verification Rule 1: Verify from CRM leads table
        try {
          const { data: leadData, error: leadError } = await supabaseCRM
            .from('leads')
            .select('business_id')
            .eq('business_id', trimmedAwlId)
            .maybeSingle();

          if (leadError) {
            console.error("Lead verification error:", leadError);
            alert(`Error verifying AWL-ID "${trimmedAwlId}" in CRM. Please try again.`);
            setSaving(false);
            return;
          }

          if (!leadData) {
            alert(`❌ Invalid AWL-ID: "${trimmedAwlId}" does not exist in the CRM system.`);
            setSaving(false);
            return;
          }

          // Verification Rule 2: Check if already in sales_closure
          const { data: closureData, error: closureError } = await supabaseCRM
            .from('sales_closure')
            .select('lead_id')
            .eq('lead_id', trimmedAwlId)
            .maybeSingle();

          if (closureError) {
            console.error("Closure verification error:", closureError);
            alert(`Error checking closure status for "${trimmedAwlId}". Please try again.`);
            setSaving(false);
            return;
          }

          if (closureData) {
            alert(`⛔ Access Denied: AWL-ID "${trimmedAwlId}" is already closed in CRM. You cannot log expected revenue for closed deals.`);
            setSaving(false);
            return;
          }
        } catch (err) {
          console.error("Database connection error:", err);
          alert("Connection error while verifying AWL-ID. Please check your network.");
          setSaving(false);
          return;
        }
      }
    }
    try {
      const res = await fetch("/api/expected-revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email, name: user.name, shift_date: todayStr,
          has_revenue: hasRevenue, sales: hasRevenue ? salesEntries : []
        })
      });
      const data = await res.json();
      if (data.success) { setFormOpen(false); fetchEntries(); }
      else alert(data.error || "Failed to save.");
    } catch (e: any) { alert("Error saving: " + e.message); }
    setSaving(false);
  };

  // Calendar logic
  const calMonthName = new Date(calMonth.year, calMonth.month).toLocaleString("default", { month: "long", year: "numeric" });
  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(calMonth.year, calMonth.month, 1).getDay();

  const prevMonth = () => setCalMonth(p => { const d = new Date(p.year, p.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const nextMonth = () => setCalMonth(p => { const d = new Date(p.year, p.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const goToToday = () => { const ist = getISTDate(); setCalMonth({ year: ist.getFullYear(), month: ist.getMonth() }); };

  const getEntryForDay = (day: number) => {
    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.find(e => e.shift_date === dateStr);
  };

  const getDayStatus = (day: number): string => {
    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(calMonth.year, calMonth.month, day);
    if (isWeekend(date)) return "weekend";
    const entry = getEntryForDay(day);
    const isToday = dateStr === todayStr;
    const isFuture = date > getISTDate();

    if (entry) {
      const sc = Number(entry.streak) || 0;
      const submitted = entry.sales?.length || 0;
      
      if (sc > 0 && sc === submitted) return "streak";
      if (sc > 0 && sc < submitted) return "partial_streak";
      
      // If the shift is from a previous day (past), it can no longer be "Pending"
      if (entry.shift_date < todayStr) {
        return "not_achieved";
      }
      
      if (isToday) return "today";
      return "submitted";
    }
    if (isToday) return "today_empty";
    if (isFuture) return "future";
    return "past";
  };

  // Stats - streak is now a count of matched AWL IDs
  const totalStreaks = entries.reduce((sum, e) => sum + (Number(e.streak) || 0), 0);
  const totalSubmittedAWLs = entries.reduce((sum, e) => sum + (e.has_revenue ? (e.sales?.length || 0) : 0), 0);
  const totalSubmitted = entries.filter(e => e.has_revenue).length;
  const totalVerified = entries.filter(e => e.verified).length;
  const totalMissed = entries.filter(e => e.verified && (Number(e.streak) || 0) === 0 && e.has_revenue).length;
  const accuracy = totalSubmittedAWLs > 0 ? Math.round((totalStreaks / totalSubmittedAWLs) * 100) : 0;

  // Verification prompt
  const yesterday = new Date(getISTDate());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  const yesterdayEntry = entries.find(e => e.shift_date === yesterdayStr);
  const showVerifyPrompt = yesterdayEntry && !yesterdayEntry.verified && yesterdayEntry.has_revenue;

  // removed: if (viewerMode) return null;

  // ---------- 2-HOUR EDIT LOCK FROM SHIFT START ----------
  // Edit window is strictly 8:00 PM to 10:00 PM IST on the day the shift starts.
  const getEditLockInfo = () => {
    const ist = getISTDate();
    const hours = ist.getHours();
    
    // Check if we are currently in the 2-hour window after 8:00 PM
    const isAfterShiftStart = hours >= 20;
    const isBeforeLockTime = hours < 22; // 10:00 PM
    
    // If it's before 8:00 PM, we are either in the previous shift or waiting for the new one.
    // If it's after 10:00 PM, today's window is closed.
    
    // For a smoother UI, if we haven't reached 8 PM yet, we aren't "locked" for the *future* shift,
    // but the getISTDateStr() would point to yesterday.
    
    if (hours >= 22) {
      return { locked: true, minutesLeft: 0 };
    }
    
    if (hours < 20) {
      // In the middle of a shift (e.g., 2 AM), but well past the 10 PM lock of that shift's start.
      return { locked: true, minutesLeft: 0 };
    }

    // Between 8:00 PM and 10:00 PM
    const lockTime = new Date(ist);
    lockTime.setHours(22, 0, 0, 0);
    const minutesLeft = Math.ceil((lockTime.getTime() - ist.getTime()) / 60000);
    
    return { locked: false, minutesLeft };
  };
  const editLock = getEditLockInfo();
  // -------------------------------------------------------


  // Calculate total expected revenue for the month
  const totalExpectedRevenue = entries.reduce((sum, e) => {
    if (!e.has_revenue || !e.sales) return sum;
    return sum + (e.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0);
  }, 0);

  const todayExpected = todayEntry?.sales?.reduce((s: number, x: any) => s + (Number(x.expected_revenue) || 0), 0) || 0;
  const todayActual = todayEntry?.actual_revenue || 0;


  const content = (
    <>
      <style jsx global>{`
        @keyframes flicker {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 4px rgba(249,115,22,0.4)); }
          25% { transform: scale(1.05) rotate(-1deg); opacity: 0.9; filter: drop-shadow(0 0 8px rgba(249,115,22,0.6)); }
          50% { transform: scale(0.95) rotate(1deg); opacity: 1; filter: drop-shadow(0 0 4px rgba(249,115,22,0.3)); }
          75% { transform: scale(1.02) rotate(-0.5deg); opacity: 0.85; filter: drop-shadow(0 0 10px rgba(249,115,22,0.7)); }
        }
        .animate-flicker {
          animation: flicker 1.2s infinite ease-in-out;
        }
      `}</style>
      {/* Main Premium Card with Glassmorphism */}
      <Card className={`backdrop-blur-md bg-white/80 shadow-[0_20px_50px_rgba(31,38,135,0.08)] overflow-hidden border border-white/40 ring-1 ring-orange-200/20 ${isCompactBtn ? 'rounded-3xl h-full' : 'rounded-[2.5rem]'}`}>
        {/* Glowing Gradient Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-orange-500 to-amber-400 opacity-80"></div>

        <CardHeader
          className={`cursor-pointer transition-all duration-500 relative overflow-hidden ${isExpanded ? 'bg-gradient-to-br from-orange-50/80 via-amber-50/40 to-white pb-3' : 'bg-white hover:bg-orange-50/30 py-5'}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Expected Revenue Tracker
                  {totalStreaks > 0 && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-sm font-bold text-xs gap-1">
                      <Flame className="h-3 w-3" /> {totalStreaks}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-slate-500 mt-0.5">Predict your shifts & earn streak points</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Stats Row */}
              <div className="hidden md:flex items-center gap-2">
                <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Accuracy</p>
                  <p className={`text-lg font-black ${accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>{totalVerified > 0 ? `${accuracy}%` : '—'}</p>
                </div>
                <div className="text-center px-3 py-1.5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 shadow-sm">
                  <p className="text-[9px] uppercase tracking-widest text-orange-500 font-bold">Streaks</p>
                  <p className="text-lg font-black text-orange-600 flex items-center justify-center gap-1">
                    <Flame className="h-4 w-4" /> {totalStreaks}
                  </p>
                </div>
                <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Expected (Today)</p>
                  <p className="text-lg font-black text-indigo-600">${todayExpected.toLocaleString()}</p>
                </div>
                <div className="text-center px-3 py-1.5 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                  <p className="text-[9px] uppercase tracking-widest text-violet-500 font-bold">Actual (Today)</p>
                  <p className="text-lg font-black text-violet-600">${todayActual.toLocaleString()}</p>
                </div>
              </div>
            </div>
            {!isCompactBtn && (
              <Button
                variant={isExpanded ? "outline" : "default"}
                size="sm"
                className={`font-bold gap-2 transition-all ${isExpanded
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md'
                  }`}
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isExpanded ? "Collapse" : "Open Tracker"}
              </Button>
            )}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="p-0 animate-in slide-in-from-top-4 fade-in duration-500">
            {/* Premium Segmented Control Tabs */}
            <div className="flex p-1.5 bg-slate-900/5 backdrop-blur-sm rounded-2xl mx-5 mt-4 border border-white/40 shadow-inner">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-400 ${activeTab === "calendar"
                  ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/30'
                  }`}
              >
                <CalendarDays className="h-4 w-4" /> Calendar
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-400 ${activeTab === "history"
                  ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/30'
                  }`}
              >
                <ListChecks className="h-4 w-4" /> History & Details
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Verification Prompt */}              {/* Today's Action Bar */}
              {!todayIsWeekend && (
                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${editLock.locked
                  ? 'bg-slate-50 border-slate-200'
                  : todayEntry
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 shadow-lg shadow-orange-100'
                  }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${editLock.locked ? 'bg-slate-200' :
                        todayEntry ? 'bg-emerald-100' : 'bg-orange-100 animate-pulse'
                        }`}>
                        {editLock.locked
                          ? <Ban className="h-5 w-5 text-slate-500" />
                          : todayEntry
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            : <Edit3 className="h-5 w-5 text-orange-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm">
                          {editLock.locked
                            ? "Shift Edit Window Closed 🔒"
                            : todayEntry
                              ? "Today's Prediction Submitted ✓"
                              : viewerMode ? "No Prediction Submitted" : "Fill Your Prediction!"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {editLock.locked
                            ? "The 2-hour shift start window (8 PM - 10 PM IST) has passed. No further edits allowed."
                            : todayEntry
                              ? `${todayEntry.sales?.length || 0} sale(s) • $${todayEntry.sales?.reduce((s, x) => s + (Number(x.expected_revenue) || 0), 0) || 0} expected${editLock.minutesLeft > 0 ? ` • ✏️ ${editLock.minutesLeft}m left to edit` : ''
                              }`
                              : viewerMode ? "Representative has not submitted a prediction for this shift." : "Predict your closures and earn streak points"}
                        </p>
                      </div>
                    </div>
                    {!editLock.locked && !viewerMode && (
                      <Button
                        className={`gap-2 font-bold shadow-md transition-all hover:-translate-y-0.5 shrink-0 ${todayEntry
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30'
                          }`}
                        onClick={openForm}
                      >
                        {todayEntry ? <Edit3 className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                        {todayEntry ? "Edit Expected Revenue" : "Fill Expected Revenue"}
                      </Button>
                    )}
                    {editLock.locked && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg shrink-0">
                        <AlertCircle className="h-3.5 w-3.5" /> Locked
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== PREMIUM STYLISH GLASSMORPISM CALENDAR ===== */}
              {activeTab === "calendar" && (
                <div className="relative group/calendar">
                  {/* Decorative Background Elements */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl group-hover/calendar:bg-orange-400/20 transition-all duration-700"></div>
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl group-hover/calendar:bg-indigo-400/20 transition-all duration-700"></div>

                  <div className="relative overflow-hidden backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl transition-all duration-500 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]">
                    {/* Glassmorphism Header */}
                    <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-white/40 via-orange-50/20 to-indigo-50/20 border-b border-white/40">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={prevMonth}
                          className="h-9 w-9 rounded-full bg-white/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                        >
                          <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-1">Performance Track</span>
                        <h3 className="font-extrabold text-slate-800 text-xl tracking-tight flex items-center gap-2 drop-shadow-sm">
                          {calMonthName}
                        </h3>
                      </div>

                      <div className="flex gap-2 items-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={goToToday} 
                          className="hidden sm:flex text-[11px] font-bold h-8 px-4 rounded-full bg-indigo-600 text-white border-none hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
                        >
                          Today
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={nextMonth}
                          className="h-9 w-9 rounded-full bg-white/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                        >
                          <ChevronRight className="h-5 w-5 text-slate-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Day Labels - Materialized */}
                    <div className="grid grid-cols-7 px-4 pt-4 pb-2 bg-white/30">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                        <div key={d} className="text-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d}</span>
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid - Modern Cells */}
                    {loading ? (
                      <div className="flex flex-col items-center justify-center p-24 bg-white/20">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
                          <CalendarDays className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
                        </div>
                        <p className="mt-4 text-xs font-bold text-slate-400 animate-pulse">Synchronizing Data...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 p-4 gap-2 bg-white/10">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                          <div key={`e-${i}`} className="h-20 sm:h-24 rounded-2xl bg-slate-50/30 border border-slate-100/30 opacity-40"></div>
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const status = getDayStatus(day);
                          const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isToday = dateStr === todayStr;
                          const entry = getEntryForDay(day);
                          const canFill = isToday && !todayIsWeekend && !editLock.locked;

                          const getCellStyles = () => {
                            if (isToday) return "bg-gradient-to-br from-indigo-50 to-white ring-2 ring-indigo-500/30 shadow-[0_4px_12px_rgba(99,102,241,0.12)]";
                            if (status === 'streak') return "bg-gradient-to-br from-orange-50/60 to-white border-orange-100/50";
                            if (status === 'weekend') return "bg-slate-50/40 border-transparent opacity-60";
                            if (status === 'today_empty') return "bg-white/80 border-slate-100 border-dashed hover:border-orange-300";
                            return "bg-white/40 border-slate-100";
                          };

                          return (
                            <div
                              key={day}
                              onClick={() => {
                                if (viewerMode) {
                                  if (entry) setSelectedDay(entry);
                                  return;
                                }
                                if (canFill) openForm();
                                else if (entry) setSelectedDay(entry);
                              }}
                              className={`h-20 sm:h-24 rounded-2xl border p-2 relative transition-all duration-300 group/cell select-none flex flex-col justify-between ${
                                !viewerMode && canFill ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100/50 hover:bg-white' :
                                entry ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md hover:bg-white' : 'hover:bg-slate-50/50'
                              } ${getCellStyles()}`}
                            >
                              {/* Day number with subtle floating look */}
                              <div className="flex items-center justify-between pointer-events-none">
                                <span className={`text-[13px] font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                                  isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' :
                                  status === 'weekend' ? 'text-slate-300' :
                                  status === 'future' ? 'text-slate-300' : 'text-slate-600'
                                }`}>
                                  {day}
                                </span>
                                
                                {/* Modern status lights */}
                                {status === "streak" && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>}
                                {status === "submitted" && <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>}
                              </div>

                              {/* Central Indicator */}
                              <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
                                {status === "streak" && (
                                  <div className="flex flex-col items-center scale-90 sm:scale-100">
                                    <div className="relative group-hover/cell:scale-110 transition-transform">
                                      <Flame className="h-7 w-7 text-orange-500 filter drop-shadow-[0_4px_8px_rgba(249,115,22,0.5)] animate-flicker" />
                                    </div>
                                    <span className="text-[9px] font-black text-orange-600 tracking-tighter mt-1">{Number(entry?.streak) || 0}/{entry?.sales?.length || 0}</span>
                                  </div>
                                )}
                                {status === "partial_streak" && (
                                  <div className="flex flex-col items-center scale-90 sm:scale-100">
                                    <Flame className="h-6 w-6 text-amber-500 opacity-80" />
                                    <span className="text-[8px] font-bold text-amber-600 mt-0.5">{Number(entry?.streak) || 0}/{entry?.sales?.length || 0}</span>
                                  </div>
                                )}
                                {status === "not_achieved" && (
                                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                    <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                                      <X className="h-3.5 w-3.5 text-red-400" />
                                    </div>
                                    <span className="text-[7px] font-bold text-red-400/80 mt-1 uppercase tracking-tighter">Missed</span>
                                  </div>
                                )}
                                {status === "submitted" && (
                                  <div className="flex flex-col items-center">
                                    <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center">
                                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                                    </div>
                                    <span className="text-[7px] font-bold text-amber-500/80 mt-1 uppercase tracking-tighter">Pending</span>
                                  </div>
                                )}
                                {status === "today_empty" && !todayIsWeekend && (
                                  <div className="flex flex-col items-center group-hover/cell:scale-110 transition-transform duration-300">
                                    {canFill && !viewerMode ? (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-200">
                                        <Plus className="h-5 w-5 text-white" />
                                      </div>
                                    ) : (
                                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></div>
                                    )}
                                  </div>
                                )}
                                {status === "today" && entry && (
                                  <div className="flex flex-col items-center">
                                    {(Number(entry.streak) || 0) > 0 && (Number(entry.streak) || 0) === (entry.sales?.length || 0) ? (
                                      <Flame className="h-7 w-7 text-orange-500 animate-flicker cursor-default filter drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]" />
                                    ) : (Number(entry.streak) || 0) > 0 ? (
                                      <Flame className="h-6 w-6 text-amber-500 filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.2)]" />
                                    ) : (
                                      <div className="p-1.5 rounded-full bg-emerald-100/50">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Revenue chip - Repositioned to Bottom Right Badge */}
                              {entry && entry.has_revenue && entry.sales?.length > 0 && (
                                <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5">
                                  <div className="px-1.5 py-0.5 rounded-md bg-slate-900/10 backdrop-blur-sm border border-white/50 flex items-center gap-0.5">
                                    <span className="text-[6px] font-bold text-slate-400 tracking-tighter uppercase">Total</span>
                                    <span className="text-[8px] font-black text-slate-700 tracking-tight">${entry.sales.reduce((s, x) => s + (Number(x.expected_revenue) || 0), 0)}</span>
                                  </div>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Premium Legend */}
                    <div className="px-6 py-4 bg-white/40 backdrop-blur-md border-t border-white/60 flex items-center justify-center flex-wrap gap-x-6 gap-y-2">
                       {[
                         { icon: Flame, color: "text-orange-500", label: "Streak Hit" },
                         { icon: X, color: "text-red-500", label: "Missed" },
                         { icon: Clock, color: "text-amber-500", label: "Syncing" },
                         { icon: CheckCircle2, color: "text-emerald-500", label: "Verified" }
                       ].map((item, idx) => (
                         <div key={idx} className="flex items-center gap-2">
                            <item.icon className={`h-3 w-3 ${item.color}`} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}


              {/* ===== HISTORY TAB ===== */}
              {activeTab === "history" && (
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    </div>
                  ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <BarChart3 className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">No predictions yet for {calMonthName}.</p>
                      <p className="text-xs text-slate-400 mt-1">Start filling your expected revenue during shift hours!</p>
                    </div>
                  ) : (
                    <>
                      {/* Stats Bar */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Submitted</p>
                          <p className="text-xl font-black text-indigo-600">{totalSubmitted}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified</p>
                          <p className="text-xl font-black text-emerald-600">{totalVerified}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-xl border border-orange-100 shadow-sm text-center">
                          <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Streaks</p>
                          <p className="text-xl font-black text-orange-600 flex items-center justify-center gap-1"><Flame className="h-4 w-4" /> {totalStreaks}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Missed</p>
                          <p className="text-xl font-black text-red-500">{totalMissed}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</p>
                          <p className={`text-xl font-black ${accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                            {totalVerified > 0 ? `${accuracy}%` : '—'}
                          </p>
                        </div>
                      </div>

                      {/* History List */}
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {entries.sort((a, b) => b.shift_date.localeCompare(a.shift_date)).map((entry, idx) => {
                          const sc = Number(entry.streak) || 0;
                          const sub = entry.sales?.length || 0;
                          const allMatched = sc > 0 && sc === sub;
                          const partial = sc > 0 && sc < sub;
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedDay(entry)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${allMatched ? 'bg-gradient-to-r from-orange-50/80 to-amber-50/50 border-orange-200 hover:border-orange-300' :
                                partial ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300' :
                                  entry.verified && sc === 0 && entry.has_revenue ? 'bg-red-50/40 border-red-200 hover:border-red-300' :
                                    !entry.verified && entry.has_revenue ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300' :
                                      'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${allMatched ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/20' :
                                    partial ? 'bg-amber-100' :
                                      entry.verified && sc === 0 && entry.has_revenue ? 'bg-red-100' :
                                        !entry.verified && entry.has_revenue ? 'bg-amber-100' :
                                          'bg-slate-100'
                                    }`}>
                                    {allMatched ? <Flame className="h-5 w-5 text-white" /> :
                                      partial ? <Flame className="h-5 w-5 text-amber-600" /> :
                                        entry.verified && sc === 0 && entry.has_revenue ? <XCircle className="h-5 w-5 text-red-500" /> :
                                          !entry.verified && entry.has_revenue ? <Clock className="h-5 w-5 text-amber-500" /> :
                                            <CheckCircle2 className="h-5 w-5 text-slate-400" />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800">
                                      {(() => {
                                        const [y, m, d] = entry.shift_date.split("-").map(Number);
                                        const shiftDay = new Date(y, m - 1, d);
                                        return shiftDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                      })()}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Shift: 8PM - 8PM (Next Day)</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {allMatched && <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-[10px] font-bold gap-0.5"><Flame className="h-2.5 w-2.5" /> {sc}/{sub}</Badge>}
                                  {partial && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] font-bold gap-0.5"><Flame className="h-2.5 w-2.5" /> {sc}/{sub}</Badge>}
                                  {entry.verified && sc === 0 && entry.has_revenue && <Badge className="bg-red-100 text-red-600 border-0 text-[10px] font-bold">Missed</Badge>}
                                  {!entry.verified && sc === 0 && entry.has_revenue && (
                                    <Badge className="bg-amber-100 text-amber-600 border-0 text-[10px] gap-1">
                                      <Clock className="h-2.5 w-2.5" />
                                      {entry.matched_awl_ids?.length > 0
                                        ? `${entry.matched_awl_ids.length}/${sub}`
                                        : 'Syncing...'}
                                    </Badge>
                                  )}
                                  {!entry.has_revenue && <Badge variant="secondary" className="text-[10px]">No Rev</Badge>}
                                  <ArrowRight className="h-4 w-4 text-slate-300" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </>
  );

  return (
    <>
      {isCompactBtn ? (
        <Dialog open={isMainDialogOpen} onOpenChange={setIsMainDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold gap-1 shadow-md border-0 transition-all hover:scale-105">
              <Flame className="h-4 w-4" /> Expected Revenue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
            <DialogHeader className="sr-only">
              <DialogTitle>Expected Revenue Dashboard</DialogTitle>
              <DialogDescription>View and manage your expected revenue predictions and streaks.</DialogDescription>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      ) : content}

      {/* ===== FILL FORM DIALOG ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Expected Revenue — {todayStr}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Predict your sales for tonight's shift. Accurate predictions earn streak points 🔥
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Step 1 */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-indigo-500" /> Do you expect any revenue today?
              </label>
              <div className="flex gap-3">
                <Button
                  variant={hasRevenue === true ? "default" : "outline"}
                  className={`flex-1 h-14 text-md font-bold transition-all ${hasRevenue === true ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'}`}
                  onClick={() => { setHasRevenue(true); if (numSales === 0) handleNumSalesChange(1); }}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Yes, I Do!
                </Button>
                <Button
                  variant={hasRevenue === false ? "default" : "outline"}
                  className={`flex-1 h-14 text-md font-bold transition-all ${hasRevenue === false ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'hover:bg-slate-50'}`}
                  onClick={() => { setHasRevenue(false); setNumSales(0); setSalesEntries([]); }}
                >
                  <XCircle className="h-5 w-5 mr-2" /> No Revenue
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            {hasRevenue === true && (
              <div className="space-y-3 animate-in slide-in-from-top-4 fade-in duration-300">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-orange-500" /> How many sales?
                </label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => handleNumSalesChange(numSales - 1)} disabled={numSales <= 1} className="h-10 w-10 p-0">-</Button>
                  <Input type="number" value={numSales} onChange={e => handleNumSalesChange(Number(e.target.value))} className="w-20 text-center text-lg font-bold" min={1} max={50} />
                  <Button variant="outline" size="sm" onClick={() => handleNumSalesChange(numSales + 1)} className="h-10 w-10 p-0">+</Button>
                  <span className="text-sm text-slate-500">Predictions</span>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {hasRevenue === true && numSales > 0 && (
              <div className="space-y-3 animate-in slide-in-from-top-4 fade-in duration-300">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Sales Details
                </label>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {salesEntries.map((entry, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 transition-all hover:border-indigo-200">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-black text-sm shrink-0">{idx + 1}</div>
                      <div className="flex-1 space-y-2">
                        <Input placeholder="AWL ID (e.g., AWL-10234)" value={entry.awl_id}
                          onChange={e => { const u = [...salesEntries]; u[idx] = { ...u[idx], awl_id: e.target.value }; setSalesEntries(u); }}
                          className="bg-white font-semibold text-sm" />
                        <Input placeholder="Expected Revenue (USD)" type="number" value={entry.expected_revenue}
                          onChange={e => { const u = [...salesEntries]; u[idx] = { ...u[idx], expected_revenue: e.target.value }; setSalesEntries(u); }}
                          className="bg-white font-semibold text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || hasRevenue === null}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2 font-bold shadow-lg shadow-orange-500/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? "Saving..." : "Submit Prediction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DAY DETAIL DIALOG ===== */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 leading-none">
                    {selectedDay && (() => {
                      const [y, m, d] = selectedDay.shift_date.split("-").map(Number);
                      const shiftDay = new Date(y, m - 1, d);
                      return shiftDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                    })()}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Shift Day Analysis (8PM - 8PM Next Day)</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-3 font-bold text-xs bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
                onClick={() => {
                  const tStr = getISTDateStr();
                  // Reset month view
                  goToToday();
                  
                  // Find today's entry
                  const entry = entries.find(e => e.shift_date === tStr);
                  if (entry) {
                    setSelectedDay(entry);
                  } else {
                    // Close detail and check if we can open the fill form
                    setSelectedDay(null);
                    const lock = getEditLockInfo();
                    if (!lock.locked && !viewerMode && !isWeekend(getISTDate())) {
                      openForm();
                    }
                  }
                }}
              >
                Go to Today
              </Button>
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of your expected revenue and verification status for this shift.
            </DialogDescription>
          </DialogHeader>

          {selectedDay && (() => {
            const sc = Number(selectedDay.streak) || 0;
            const sub = selectedDay.sales?.length || 0;
            const allMatched = sc > 0 && sc === sub;
            const partial = sc > 0 && sc < sub;
            const hasMissing = sub > 0 && sc < sub && !allMatched;
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={`border-0 font-bold text-sm px-3 py-1 ${allMatched ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' :
                    partial ? 'bg-amber-100 text-amber-700' :
                      selectedDay.verified && sc === 0 && selectedDay.has_revenue ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                    }`}>
                    {allMatched ? `🔥 All Matched (${sc}/${sub})` :
                      partial ? `🔥 Partial Match (${sc}/${sub})` :
                        selectedDay.verified && sc === 0 && selectedDay.has_revenue ? "❌ AWL IDs Not Matched" :
                          selectedDay.verified && !selectedDay.has_revenue ? "✓ No Revenue Predicted" :
                            "⏳ Pending Verification"}
                  </Badge>
                </div>

                {selectedDay.has_revenue && selectedDay.sales?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-500" /> Your Predictions
                    </h4>
                    <div className="space-y-2">
                      {selectedDay.sales.map((s: SaleEntry, idx: number) => {
                        const isMatched = selectedDay.matched_awl_ids?.includes(s.awl_id.trim().toUpperCase());
                        return (
                          <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${isMatched ? 'bg-emerald-50 border-emerald-200' : selectedDay.verified ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isMatched ? 'bg-emerald-200 text-emerald-800' : selectedDay.verified ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-600'}`}>{idx + 1}</div>
                              <div>
                                {hideCrmLinks ? (
                                  <span className="font-bold text-sm text-slate-800 block font-mono">{s.awl_id}</span>
                                ) : (
                                  <a
                                    href={`https://applywizz-crm-tool.vercel.app/leads/${s.awl_id?.trim()}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-sm text-slate-800 hover:text-indigo-600 hover:underline transition-colors block"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {s.awl_id}
                                  </a>
                                )}
                                <p className="text-xs text-slate-500">Expected: ${s.expected_revenue}</p>
                              </div>
                            </div>
                            {(selectedDay.verified || isMatched) && (isMatched ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-400" />)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actual Revenue Section — shown when any actual sales exist in CRM */}
                {(selectedDay.actual_awl_ids && selectedDay.actual_awl_ids.length > 0) && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-violet-500" /> All Actual Sales (8PM - 8PM)
                    </h4>
                    <div className="p-3 rounded-xl bg-violet-50/50 border border-violet-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-violet-600 uppercase">CRM Revenue</span>
                        <span className="text-lg font-black text-violet-700">${Number(selectedDay.actual_revenue || 0).toLocaleString()}</span>
                      </div>
                      <div className="space-y-1">
                        {selectedDay.actual_awl_ids.map((id: string, idx: number) => {
                          const isPredicted = selectedDay.matched_awl_ids?.includes(id);
                          const revData = selectedDay.actual_sales_data?.find(s => s.awl_id === id);
                          return (
                          <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-violet-100">
                            <div className="flex items-center gap-2">
                              {isPredicted ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Sparkles className="h-3 w-3 text-indigo-400" />}
                              {hideCrmLinks ? (
                                <span className="font-mono font-bold text-slate-700">{id}</span>
                              ) : (
                                <a
                                  href={`https://applywizz-crm-tool.vercel.app/leads/${id.trim()}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono font-bold text-slate-700 hover:text-indigo-600 hover:underline transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {id}
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {revData && <span className="font-bold text-slate-500">${revData.revenue}</span>}
                              <Badge className={`${isPredicted ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'} border-0 text-[9px] font-bold`}>
                                {isPredicted ? 'Predicted' : 'Unpredicted Sale'}
                              </Badge>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Show verification pending only when there are missing AWL IDs */}
                {hasMissing && !selectedDay.verified && selectedDay.has_revenue && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <Clock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-700">Pending CRM Verification</p>
                    <p className="text-xs text-amber-600 mt-1">{sub - sc} AWL ID(s) still awaiting verification from CRM.</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}

