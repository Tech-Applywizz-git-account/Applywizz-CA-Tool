"use client"

import React, { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  DollarSign, FileText, Users, User, TrendingUp, Calendar, Gift,
  ChevronLeft, ChevronRight, Eye, EyeOff, Target, LockOpen, CheckCircle2,
  AlertCircle, Flame, BarChart3, Receipt, LayoutDashboard, Menu, X,
  Activity, Crosshair, Zap, Award, ArrowUpRight, ArrowDownRight, Search, LogOut
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts"

// Lazy-load the heavy Expected Revenue Panel — it's only needed when tracker tab is active
const ExpectedRevenuePanel = lazy(() => import("./expected-revenue-panel").then(m => ({ default: m.ExpectedRevenuePanel })));
import { SalesSubmissionForm } from "./sales-submission-form";

// Default slabs as fallback
const defaultBDASlab = [
  { threshold: 10000, incentive: 40000 },
  { threshold: 9000, incentive: 34000 },
  { threshold: 8000, incentive: 28000 },
  { threshold: 7000, incentive: 23000 },
  { threshold: 6000, incentive: 19000 },
  { threshold: 5000, incentive: 15500 },
  { threshold: 3500, incentive: 10500 },
  { threshold: 2500, incentive: 8500 },
  { threshold: 2000, incentive: 5500 },
  { threshold: 1000, incentive: 4000 }
];

const defaultSBDASlab = [
  { threshold: 10000, incentive: 40000 },
  { threshold: 9000, incentive: 34000 },
  { threshold: 8000, incentive: 28000 },
  { threshold: 7000, incentive: 23000 },
  { threshold: 6000, incentive: 19000 },
  { threshold: 5000, incentive: 15500 },
  { threshold: 3500, incentive: 10500 },
  { threshold: 2500, incentive: 8500 },
  { threshold: 2000, incentive: 5500 }
];

interface BDADashboardProps {
  user: any;
  onLogout: () => void;
  viewerMode?: boolean;
}

type SidebarTab = "tracker" | "incentive" | "bonuses" | "sales" | "analytics" | "submission-form";

const getNextSlab = (role: string, currentRevenue: number, bdtTarget: number, slabMap: Record<string, any[]>) => {
  const currentSlab = slabMap[role] || [];
  if (currentSlab.length === 0) {
    if (currentRevenue < bdtTarget) return { nextTarget: bdtTarget, nextIncentive: 0, label: "Base Target" };
    return { nextTarget: null, label: "Target Cleared!" };
  }
  const sorted = [...currentSlab].sort((a, b) => a.threshold - b.threshold);
  for (const slab of sorted) {
    if (currentRevenue < slab.threshold) {
      return { nextTarget: slab.threshold, nextIncentive: slab.incentive };
    }
  }
  return { nextTarget: null };
};

const isCurrentPeriod = (periodStr: string) => {
  const parts = periodStr.split(" to ");
  if (parts.length < 2) return false;
  const start = new Date(parts[0] + "T00:00:00Z");
  const end = new Date(parts[1] + "T23:59:59Z");
  const now = new Date();
  return now >= start && now <= end;
};

const isPastPeriod = (periodStr: string) => {
  const parts = periodStr.split(" to ");
  if (parts.length < 2) return false;
  const end = new Date(parts[1] + "T23:59:59Z");
  return new Date() > end;
};

// Helper to match sales to a shift date (8 PM to 8 PM)
const getShiftDateLocal = (closedAtStr: string, shiftStartTime: string = "20:00") => {
  try {
    const d = new Date(closedAtStr);
    const [sh, sm] = shiftStartTime.split(':').map(Number);
    let shiftDate = new Date(d);
    if (d.getHours() < sh || (d.getHours() === sh && d.getMinutes() < sm)) {
      shiftDate.setDate(d.getDate() - 1);
    }
    return `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}-${String(shiftDate.getDate()).padStart(2, '0')}`;
  } catch (e) { return ""; }
};

export function BDADashboard({ user, onLogout, viewerMode }: BDADashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  // Default to tracker tab for all users
  const [activeTab, setActiveTab] = useState<SidebarTab>("tracker");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBonusDate, setSelectedBonusDate] = useState<string | null>(null);
  const [salesSearchQuery, setSalesSearchQuery] = useState("");
  const [selectedSalesDate, setSelectedSalesDate] = useState<string | null>(null);

  // Month toggles
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Dynamic Settings Cache
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [boosterCycles, setBoosterCycles] = useState<any[]>([]);
  const [slabMap, setSlabMap] = useState<Record<string, any[]>>({
    "BDA": defaultBDASlab,
    "SBDA": defaultSBDASlab,
    "Sales Head": defaultSBDASlab
  });
  const [targetMap, setTargetMap] = useState<Record<string, number>>({});
  const [bonusMap, setBonusMap] = useState<Record<string, number>>({});

  const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const getMonthName = () => targetDate.toLocaleString("default", { month: "long", year: "numeric" });

  const pad = (n: number) => n.toString().padStart(2, '0');
  const targetPrefix = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}`;

  const [salesPage, setSalesPage] = useState<number>(1);
  const itemsPerPage = 10;

  const [showIncentives, setShowIncentives] = useState<Record<string, boolean>>({});
  const toggleIncentiveView = (periodName: string) => {
    setShowIncentives((prev) => ({ ...prev, [periodName]: !prev[periodName] }));
  };

  // Fetch settings and incentive data in PARALLEL on mount
  useEffect(() => {
    const fetchAll = async () => {
      const periodStr = getMonthName();

      // Fire both requests simultaneously
      const [settingsResult, incentiveResult] = await Promise.allSettled([
        supabase.from("sales_settings").select("key, value"),
        user?.email && user?.role
          ? fetch(`/api/calculate-sales-incentives?email=${encodeURIComponent(user.email)}&role=${encodeURIComponent(user.role || user.designation)}&month=${targetDate.getMonth() + 1}&year=${targetDate.getFullYear()}`).then(r => r.json())
          : Promise.resolve(null)
      ]);

      // Process settings
      if (settingsResult.status === 'fulfilled' && !settingsResult.value.error && settingsResult.value.data) {
        const map = settingsResult.value.data.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);
        const getVal = (baseKey: string) => map[`${baseKey}_${periodStr}`] || map[baseKey];
        try {
          const getSlab = (role: string, def: any[]) => {
            const s = getVal(`${role.toLowerCase().replace("-", "")}_slab_rules`);
            return s ? JSON.parse(s) : def;
          };
          setSlabMap({
            "BDT-P": getSlab("bdt-p", []),
            "BDT": getSlab("bdt", []),
            "BDA": getSlab("bda", defaultBDASlab),
            "SBDA": getSlab("sbda", defaultSBDASlab),
            "Sales Head": getSlab("sales head", defaultSBDASlab),
          });
          setTargetMap({
            "BDT-P": Number(getVal("bdt-p_target")) || Number(getVal("bdt_target")) || 500,
            "BDT": Number(getVal("bdt_target")) || 500,
            "BDA": Number(getVal("bda_target")) || 1000,
            "SBDA": Number(getVal("sbda_target")) || 2000,
            "Sales Head": Number(getVal("sales head_target")) || Number(getVal("sbda_target")) || 2000,
          });
          setBonusMap({
            "BDT-P": Number(getVal("bdt-p_daily_bonus")) || Number(getVal("bdt_daily_bonus")) || 0,
            "BDT": Number(getVal("bdt_daily_bonus")) || 0,
            "BDA": Number(getVal("bda_daily_bonus")) || 400,
            "SBDA": Number(getVal("sbda_daily_bonus")) || 700,
            "Sales Head": Number(getVal("sales head_daily_bonus")) || Number(getVal("sbda_daily_bonus")) || 700,
          });
          // Fetch booster cycles from dedicated table
          const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          fetch(`/api/booster-night-cycles?month=${monthKey}&activeOnly=true`)
            .then(r => r.json())
            .then(d => { if (d.success) setBoosterCycles(d.cycles || []); })
            .catch(() => { });
        } catch (e) { console.error("Rules render fault", e); }
      }
      setSettingsLoading(false);

      // Process incentive data
      if (incentiveResult.status === 'fulfilled' && incentiveResult.value) {
        const result = incentiveResult.value;
        if (result.success) setData(result);
        else setError(result.error || "Failed to load sales report");
      } else if (incentiveResult.status === 'rejected') {
        setError(incentiveResult.reason?.message || "Failed to fetch data");
      }
      setLoading(false);
    };

    fetchAll();
  }, [user, monthOffset]);

  // Memoize expensive filtering so it doesn't re-run on every render
  const filteredPeriods = useMemo(() => data?.periods
    ? Object.entries(data.periods)
      .filter(([periodName]) => periodName.startsWith(targetPrefix))
      .sort((a, b) => a[0].localeCompare(b[0]))
    : [], [data, targetPrefix]);

  const filteredSales = useMemo(() => {
    let rawSales = data?.crmSales?.filter((sale: any) => sale.closed_at?.startsWith(targetPrefix)) || [];

    if (salesSearchQuery.trim()) {
      const q = salesSearchQuery.toLowerCase().trim();
      rawSales = rawSales.filter((s: any) =>
        (s.awl_id || "").toLowerCase().includes(q) ||
        (s.lead_id || "").toLowerCase().includes(q) ||
        (s.lead_name || "").toLowerCase().includes(q)
      );
    }

    if (selectedSalesDate) {
      rawSales = rawSales.filter((s: any) => s.closed_at?.startsWith(selectedSalesDate));
    }

    return [...rawSales].sort((a, b) => (b.closed_at || "").localeCompare(a.closed_at || ""));
  }, [data, targetPrefix, salesSearchQuery, selectedSalesDate]);

  const salesDates = useMemo(() => {
    const dates = new Set<string>();
    data?.crmSales?.forEach((s: any) => {
      if (s.closed_at) {
        const d = getShiftDateLocal(s.closed_at, data?.shiftStartTime);
        if (d && d.startsWith(targetPrefix)) dates.add(d);
      }
    });
    return dates;
  }, [data, targetPrefix]);

  const totalSalesPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = filteredSales.slice((salesPage - 1) * itemsPerPage, salesPage * itemsPerPage);

  const activeBooster = useMemo(() => {
    if (!boosterCycles || boosterCycles.length === 0) return null;
    const now = Date.now();
    for (const cycle of boosterCycles) {
      const start = new Date(cycle.start_time).getTime();
      const end = new Date(cycle.end_time).getTime();
      if (now >= start && now <= end) {
        return { start: cycle.start_time, end: cycle.end_time, multiplier: cycle.multiplier, target: cycle.target };
      }
    }
    return null;
  }, [boosterCycles]);

  const [boosterTimeLeft, setBoosterTimeLeft] = useState("");

  useEffect(() => {
    if (!activeBooster) return;

    const updateCountdown = () => {
      const end = new Date(activeBooster.end).getTime();
      const now = new Date().getTime();
      const diff = end - now;
      if (diff <= 0) {
        setBoosterTimeLeft("Ended");
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setBoosterTimeLeft(`${h}h ${m}m ${s}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeBooster]);

  useEffect(() => { setSalesPage(1); }, [monthOffset]);

  // Filter nav items: hide 'tracker' for executive viewers
  const navItems: { id: SidebarTab; label: string; icon: any; badge?: string; color: string; gradient: string }[] = [
    {
      id: "tracker" as SidebarTab,
      label: "Expected Revenue",
      icon: Flame,
      color: "text-orange-500",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      id: "incentive",
      label: "Incentive Achieved",
      icon: TrendingUp,
      color: "text-indigo-500",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      id: "bonuses",
      label: "Daily Bonuses",
      icon: Gift,
      color: "text-emerald-500",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      id: "sales",
      label: "Sales Records",
      icon: Receipt,
      color: "text-blue-500",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "analytics",
      label: "Performance",
      icon: Activity,
      color: "text-violet-500",
      gradient: "from-violet-500 to-fuchsia-500",
    },
    {
      id: "submission-form" as SidebarTab,
      label: "Sales Success Submission",
      icon: FileText,
      color: "text-rose-500",
      gradient: "from-rose-500 to-pink-500",
    },
  ];

  // Month filter bar (shared)
  const MonthBar = () => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 font-semibold h-8 px-2"
        onClick={() => setMonthOffset((p) => p - 1)}>
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 px-3 text-sm shadow-sm min-w-[100px] flex items-center gap-2"
        onClick={() => setMonthOffset(0)}>
        {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />}
        {getMonthName()}
      </Button>
      <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 font-semibold h-8 px-2"
        onClick={() => setMonthOffset((p) => p + 1)}>
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // ===================== PANEL: INCENTIVE ACHIEVED =====================
  const IncentivePanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Incentive Achieved
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">Shift evaluates at {data?.shiftStartTime || "8:00 PM"}</p>
        </div>
        <MonthBar />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-2xl border border-slate-100">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
            <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-400 animate-pulse">Loading {getMonthName()} data...</p>
        </div>
      ) : filteredPeriods.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredPeriods.map(([periodName, pData]: [string, any]) => {
            const isCurrent = isCurrentPeriod(periodName);
            const isPast = isPastPeriod(periodName);
            const rev = pData.total_revenue;
            const target = pData.target_amount;
            const hasPassedTarget = rev >= target;
            const slabInfo = getNextSlab(user.role, rev, targetMap[user.role] || 500, slabMap);
            let displayMax = slabInfo.nextTarget || Math.max(rev, target);
            if (displayMax === 0) displayMax = 1;
            const percentage = Math.min(100, Math.round((rev / displayMax) * 100));

            return (
              <Card key={periodName} className={`relative overflow-hidden transition-all duration-300 ${isCurrent ? 'border-2 border-indigo-400 shadow-xl shadow-indigo-500/10 scale-[1.01]' : 'border-slate-200 shadow-md'}`}>
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                )}
                {isCurrent && (
                  <div className="absolute top-2 right-3 bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-sm">
                    Active
                  </div>
                )}

                <CardHeader className="pb-3 pt-5 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-400" /> {periodName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="font-semibold text-slate-600 border-slate-200 text-xs">
                          Target: ${target}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all hover:scale-105 shadow-sm border-none text-white ${isCurrent ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-700'}`}
                      onClick={() => toggleIncentiveView(periodName)}
                    >
                      <span className="text-sm font-bold">
                        {showIncentives[periodName] ? `₹${pData.total_incentive.toLocaleString()}` : "****"}
                      </span>
                      {showIncentives[periodName] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-indigo-700 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" /> ${(pData.actual_revenue !== undefined ? pData.actual_revenue : pData.total_revenue).toLocaleString()} Recorded
                      </span>
                      {slabInfo.nextTarget ? (
                        <span className="text-slate-500">Goal: ${slabInfo.nextTarget.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Maxed!</span>
                      )}
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r transition-all duration-1000 ease-out rounded-full ${hasPassedTarget ? 'from-emerald-400 to-teal-500' : 'from-indigo-400 to-purple-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium">
                      {isPast ? (
                        hasPassedTarget
                          ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Target Achieved!</span>
                          : <span className="text-rose-500 font-bold">Target Missed</span>
                      ) : (
                        hasPassedTarget ? (
                          slabInfo.nextTarget ? (
                            <span className="text-teal-600 font-semibold flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-full w-fit">
                              <LockOpen className="h-3 w-3" /> Unlock ₹{slabInfo.nextIncentive?.toLocaleString()} at ${slabInfo.nextTarget}
                            </span>
                          ) : (
                            <span className="text-slate-500">Maximum limits reached!</span>
                          )
                        ) : (
                          <span className="text-indigo-600 font-semibold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                            <Target className="h-3 w-3" /> ${(target - rev).toLocaleString()} more to qualify
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Total Rev</p>
                      <p className="font-extrabold text-slate-800 text-base">${pData.actual_revenue !== undefined ? pData.actual_revenue : pData.total_revenue}</p>
                      {pData.boosted_revenue > 0 && (
                        <p className="text-[10px] font-bold text-orange-600 mt-0.5 animate-pulse" title="Booster Revenue">🚀 +${pData.boosted_revenue}</p>
                      )}
                    </div>
                    <div className={`p-3 rounded-xl text-center border ${pData.daily_bonus > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${pData.daily_bonus > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>Daily Bonus</p>
                      <p className={`font-extrabold text-base ${pData.daily_bonus > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>
                        {showIncentives[periodName] ? (pData.daily_bonus > 0 ? `₹${pData.daily_bonus}` : "—") : "****"}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl text-center border ${pData.slab_incentive > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${pData.slab_incentive > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>Slab Bonus</p>
                      <p className={`font-extrabold text-base ${pData.slab_incentive > 0 ? 'text-indigo-700' : 'text-slate-300'}`}>
                        {showIncentives[periodName] ? (pData.slab_incentive > 0 ? `₹${pData.slab_incentive}` : "—") : "****"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-400">
          <BarChart3 className="h-12 w-12 mb-4 opacity-30" />
          <p className="font-bold text-lg">No incentive periods found</p>
          <p className="text-sm mt-1">for {getMonthName()}</p>
        </div>
      )}
    </div>
  );

  // ===================== PANEL: DAILY BONUSES =====================
  const BonusPanel = () => {
    const role = user.role;
    const currentSlab = slabMap[role] || [];
    const minTarget = targetMap[role] || 500;
    const minDailyRaw = bonusMap[role] || 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Gift className="h-5 w-5 text-white" />
              </div>
              Daily Bonuses & Slab Rules
            </h2>
            <p className="text-sm text-slate-500 mt-1 ml-12">Your compensation matrix for {getMonthName()}</p>
          </div>
          <MonthBar />
        </div>

        {settingsLoading ? (
          <div className="flex justify-center p-16">
            <div className="animate-pulse flex items-center text-indigo-500 font-bold gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-300 animate-bounce" />
              Gathering configuration rules...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earned Bonuses List */}
            <div className="space-y-6 lg:order-2">
              <Card className="shadow-md border-slate-200 overflow-hidden bg-gradient-to-br from-white to-emerald-50/20">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Your Earned Daily Bonuses
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {(() => {
                    const earnedBonuses: { date: string; amount: number; threshold: number; isBooster: boolean }[] = [];
                    if (data?.periods) {
                      Object.values(data.periods).forEach((p: any) => {
                        const threshold = p.daily_bonus_limit;
                        if (threshold > 0 && p.daily_sales) {
                          Object.entries(p.daily_sales).forEach(([date, revenue]: [string, any]) => {
                            // Filter by targetPrefix (current month being viewed)
                            if (date.startsWith(targetPrefix) && revenue >= threshold) {
                              const hasBooster = data.crmSales?.some((s: any) => {
                                if (!s.is_booster || !s.closed_at) return false;
                                const sd = getShiftDateLocal(s.closed_at, data?.shiftStartTime);
                                return sd === date;
                              });
                              earnedBonuses.push({ date, amount: revenue, threshold, isBooster: hasBooster });
                            }
                          });
                        }
                      });
                    }

                    if (earnedBonuses.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                          <Gift className="h-10 w-10 text-slate-200 mb-3" />
                          <p className="text-slate-400 font-medium">No daily bonuses earned yet in {getMonthName()}.</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Hit your daily threshold to see your bonuses appear here!</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2 mb-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Shift</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bonus (₹)</span>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                          {earnedBonuses.sort((a, b) => b.date.localeCompare(a.date)).map((bonus, i) => (
                            <div
                              key={i}
                              onClick={() => setSelectedBonusDate(bonus.date)}
                              className="bg-white border border-emerald-100 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all group active:scale-[0.98]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                  {bonus.date.split('-')[2]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-700 text-sm">{new Date(bonus.date).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                  <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded inline-block">Threshold Check Passed</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-base font-black text-emerald-600">
                                    ₹{bonus.amount.toLocaleString()}
                                    {bonus.isBooster && <span className="ml-1.5 text-sm animate-pulse" title="Boosted Bonus!">🚀</span>}
                                  </p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">View Details</p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-3 border-t border-slate-100 mt-2 flex justify-between items-center px-1">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Total Daily Bonus</span>
                          <span className="text-lg font-black text-emerald-700">₹{earnedBonuses.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Daily Bonus Rules Card */}
              <Card className="shadow-md border-slate-200 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <Target className="h-4 w-4 text-emerald-500" /> Daily Spot Bonus System
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {minDailyRaw > 0 ? (
                    <div className="space-y-4 text-sm">
                      <p className="text-slate-700">For every single <strong>24-hour shift</strong>, you have access to infinitely stackable spot bonuses!</p>

                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 text-center shadow-sm">
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-1">Shift Threshold Required</p>
                        <p className="text-3xl font-black text-emerald-700">${minDailyRaw} <span className="text-base font-bold text-slate-400">USD</span></p>
                      </div>

                      <div className="space-y-3">
                        <p className="text-slate-600 font-medium">Cross ${minDailyRaw} in a single 24-hr shift to get a direct <strong className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">1:1 payout (₹)</strong> added to your final bi-weekly incentive!</p>
                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-600">
                            <strong>Example:</strong> Secure ${minDailyRaw + 10} today? We instantly add ₹{minDailyRaw + 10} into your final take-home for this period. This can happen <strong>every single day</strong>!
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">Daily spot bonuses are currently disabled for this role structure.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Slab table */}
            <div className="lg:order-1">
              <Card className="shadow-md border-slate-200 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <BarChart3 className="h-4 w-4 text-indigo-500" /> Biweekly Slab Incentive Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {currentSlab.length === 0 ? (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-sm text-slate-700">
                      Your role operates on a fixed target of <strong>${minTarget}</strong>. Complete targets efficiently to qualify for progression and bonuses!
                    </div>
                  ) : (
                    <Table className="rounded-lg overflow-hidden border border-slate-200">
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-bold text-slate-700">Revenue Range</TableHead>
                          <TableHead className="text-right font-bold text-slate-700">Payout Incentive</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const sorted = [...currentSlab].sort((a, b) => a.threshold - b.threshold);
                          // Add a $0 row if the lowest threshold > 0
                          const rows: { rangeLabel: string; incentive: number; isZero: boolean; isMax: boolean }[] = [];
                          if (sorted.length > 0 && sorted[0].threshold > 0) {
                            rows.push({
                              rangeLabel: `$0 – $${(sorted[0].threshold - 1).toLocaleString()}`,
                              incentive: 0,
                              isZero: true,
                              isMax: false
                            });
                          }
                          sorted.forEach((tier: any, i: number) => {
                            const isMax = i === sorted.length - 1;
                            const nextThreshold = isMax ? null : sorted[i + 1].threshold;
                            const rangeLabel = isMax
                              ? `$${tier.threshold.toLocaleString()}+`
                              : `$${tier.threshold.toLocaleString()} – $${(nextThreshold! - 1).toLocaleString()}`;
                            rows.push({ rangeLabel, incentive: tier.incentive, isZero: false, isMax });
                          });
                          return rows.map((row, i) => (
                            <TableRow key={i} className={`${row.isMax ? 'bg-emerald-50/60 hover:bg-emerald-100' : row.isZero ? 'bg-red-50/30 hover:bg-red-50' : 'hover:bg-indigo-50/40'} transition-colors`}>
                              <TableCell className={row.isMax ? "font-bold text-emerald-800" : row.isZero ? "font-medium text-red-400" : "font-medium text-slate-600"}>
                                {row.rangeLabel}
                              </TableCell>
                              <TableCell className={`text-right font-extrabold ${row.isMax ? 'text-emerald-700' : row.isZero ? 'text-red-300' : 'text-indigo-600'}`}>
                                {row.isZero ? '—' : `₹${row.incentive.toLocaleString()}`}
                              </TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===================== PANEL: SALES RECORDS =====================
  const SalesPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            Sales Records
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">{filteredSales.length} deals recorded in {getMonthName()}</p>
        </div>
        <MonthBar />
      </div>

      {/* Modern Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white/40 backdrop-blur-md p-4 rounded-[2rem] border border-white/60 shadow-sm">
        <div className="relative flex-none md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search Lead ID / AWL ID..."
            className="pl-11 h-12 bg-white/80 border-slate-200 rounded-2xl shadow-inner-sm focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            value={salesSearchQuery}
            onChange={(e) => {
              setSalesSearchQuery(e.target.value);
              setSalesPage(1);
            }}
          />
        </div>

        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 px-2 no-scrollbar scroll-smooth">
          <Button
            variant="ghost"
            size="sm"
            className={`h-12 px-6 rounded-2xl font-bold whitespace-nowrap transition-all ${!selectedSalesDate ? 'bg-slate-900 text-white shadow-lg' : 'bg-white/60 text-slate-500 hover:bg-white border border-slate-100'}`}
            onClick={() => {
              setSelectedSalesDate(null);
              setSalesPage(1);
            }}
          >
            All Month
          </Button>
          <div className="h-8 w-[1px] bg-slate-200 shrink-0 mx-1"></div>
          {/* Day Buttons with Smart Coloring */}
          {(() => {
            const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
            const todayStr = new Date().toISOString().split('T')[0];

            return Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${targetPrefix}-${String(day).padStart(2, '0')}`;
              const isActive = selectedSalesDate === dateStr;
              const isFuture = dateStr > todayStr;
              const isToday = dateStr === todayStr;
              const hasSales = salesDates.has(dateStr);

              return (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedSalesDate(isActive ? null : dateStr);
                    setSalesPage(1);
                  }}
                  disabled={isFuture && !isActive}
                  className={`h-12 w-12 shrink-0 rounded-2xl border flex flex-col items-center justify-center transition-all relative ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 scale-105 z-10' :
                    isToday ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-2 ring-indigo-400/20' :
                      isFuture ? 'bg-slate-50/50 border-dashed border-slate-200 text-slate-300 opacity-60' :
                        'bg-white/80 border-emerald-100 text-slate-600 hover:border-blue-400 hover:bg-blue-50/30'
                    }`}
                >
                  <span className={`text-[9px] font-black uppercase leading-none opacity-60 mb-0.5 ${isActive ? 'text-white' : ''}`}>
                    {new Date(dateStr).toLocaleDateString('default', { weekday: 'short' })}
                  </span>
                  <span className="text-sm font-black leading-none">{day}</span>

                  {/* Sale Indicator Dot */}
                  {hasSales && !isActive && (
                    <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
                  )}
                </button>
              );
            });
          })()}
        </div>
      </div>

      <Card className="shadow-md border-slate-200 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />
        <CardContent className="p-0">
          {filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Receipt className="h-12 w-12 mb-4 opacity-30" />
              <p className="font-bold text-lg">No sales recorded this month</p>
            </div>
          ) : (
            <div className="space-y-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="font-bold text-slate-700">Lead Name</TableHead>
                      <TableHead className="font-bold text-slate-700">Lead ID</TableHead>
                      <TableHead className="font-bold text-slate-700">Email</TableHead>
                      <TableHead className="font-bold text-slate-700">Value</TableHead>
                      <TableHead className="font-bold text-slate-700">Date Closed</TableHead>
                      <TableHead className="font-bold text-slate-700">Payment Mode</TableHead>
                      <TableHead className="font-bold text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSales.map((sale: any) => (
                      <TableRow key={sale.id} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell className="font-semibold text-slate-800">{sale.lead_name}</TableCell>
                        <TableCell>
                          {(() => {
                            const id = sale.awl_id || sale.lead_id;
                            if (!id || id === "N/A") return <span className="text-slate-400">N/A</span>;
                            return (
                              <a
                                href={`https://applywizz-crm-tool.vercel.app/leads/${id.trim()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                              >
                                {id}
                              </a>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{sale.email}</TableCell>
                        <TableCell className="text-emerald-600 font-bold">
                          ${sale.sale_value}
                          {sale.is_booster && <span className="ml-1.5 text-lg" title="Booster Night Sale!">🚀</span>}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          <div className="flex flex-col">
                            <span>{new Date(sale.closed_at).toLocaleDateString()}</span>
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{new Date(sale.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-slate-600 bg-white text-xs">{sale.payment_mode || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            sale.finance_status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-transparent text-xs' :
                              sale.finance_status === 'Paused' ? 'bg-amber-100 text-amber-800 border-transparent text-xs' :
                                'bg-slate-100 text-slate-800 border-transparent text-xs'
                          }>
                            {sale.finance_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalSalesPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-sm text-slate-500">
                    Showing {(salesPage - 1) * itemsPerPage + 1}–{Math.min(salesPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} entries
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSalesPage(p => Math.max(1, p - 1))} disabled={salesPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2 text-slate-700">Page {salesPage} of {totalSalesPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setSalesPage(p => Math.min(totalSalesPages, p + 1))} disabled={salesPage === totalSalesPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ===================== PANEL: PERFORMANCE & ANALYTICS =====================
  const [analyticsEntries, setAnalyticsEntries] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const analyticsFetchedMonth = React.useRef<string>("");
  const analyticsFetching = React.useRef(false);

  // Fetch analytics data — stable deps, no infinite loop
  useEffect(() => {
    if (activeTab !== 'analytics') return;

    const monthStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}`;

    // Already fetched this month's data, or currently fetching
    if (analyticsFetchedMonth.current === monthStr || analyticsFetching.current) return;

    analyticsFetching.current = true;
    setAnalyticsLoading(true);

    fetch(`/api/expected-revenue?email=${encodeURIComponent(user.email)}&month=${monthStr}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAnalyticsEntries(d.entries || []);
          analyticsFetchedMonth.current = monthStr;
        }
      })
      .catch(e => console.error("Analytics load failed:", e))
      .finally(() => {
        setAnalyticsLoading(false);
        analyticsFetching.current = false;
      });
  }, [activeTab, monthOffset, user.email]); // Only primitive/stable deps

  // Reset analytics cache when month changes
  useEffect(() => {
    analyticsFetchedMonth.current = "";
    setAnalyticsEntries([]);
  }, [monthOffset]);

  const CHART_COLORS = ['#8b5cf6', '#d946ef', '#f97316', '#06b6d4', '#10b981', '#f43f5e'];

  const AnalyticsPanel = () => {
    // Compute analytics from entries
    const entries = analyticsEntries.filter(e => e.has_revenue);
    const allEntries = analyticsEntries;

    // Daily Revenue Trend Data
    const dailyRevenueData = allEntries
      .filter(e => e.actual_revenue != null || e.has_revenue)
      .sort((a, b) => a.shift_date.localeCompare(b.shift_date))
      .map(e => {
        const [y, m, d] = e.shift_date.split("-").map(Number);
        const dayLabel = `${m}/${d}`;
        const expectedRev = (e.sales || []).reduce((s: number, x: any) => s + (Number(x.expected_revenue) || 0), 0);
        return {
          date: dayLabel,
          expected: expectedRev,
          actual: Number(e.actual_revenue) || 0,
          shift_date: e.shift_date,
        };
      });

    // Overall AWL stats
    const totalPredicted = entries.reduce((s, e) => s + (e.sales?.length || 0), 0);
    const totalMatched = entries.reduce((s, e) => s + (e.matched_awl_ids?.length || 0), 0);
    const totalActualSales = allEntries.reduce((s, e) => s + (e.actual_awl_ids?.length || 0), 0);
    const totalActualRevenue = allEntries.reduce((s, e) => s + (Number(e.actual_revenue) || 0), 0);
    const totalExpectedRevenue = entries.reduce((s, e) => s + (e.sales || []).reduce((sum: number, x: any) => sum + (Number(x.expected_revenue) || 0), 0), 0);
    const hitRate = totalPredicted > 0 ? Math.round((totalMatched / totalPredicted) * 100) : 0;
    const totalStreaks = entries.reduce((s, e) => s + (Number(e.streak) || 0), 0);
    const daysSubmitted = entries.length;
    const daysFullMatch = entries.filter(e => {
      const sc = Number(e.streak) || 0;
      const sub = e.sales?.length || 0;
      return sc > 0 && sc === sub;
    }).length;

    // AWL accuracy by day (bar chart)
    const awlAccuracyData = useMemo(() => {
      return entries
        .sort((a, b) => a.shift_date.localeCompare(b.shift_date))
        .map(e => {
          const [y, m, d] = e.shift_date.split("-").map(Number);
          return {
            date: `${m}/${d}`,
            predicted: e.sales?.length || 0,
            matched: e.matched_awl_ids?.length || 0,
            actual: e.actual_awl_ids?.length || 0,
          };
        });
    }, [entries]);

    // Hit rate trend (area chart)
    const hitRateTrend = useMemo(() => {
      let cumulativePredicted = 0;
      let cumulativeMatched = 0;
      return entries
        .sort((a, b) => a.shift_date.localeCompare(b.shift_date))
        .map(e => {
          cumulativePredicted += e.sales?.length || 0;
          cumulativeMatched += e.matched_awl_ids?.length || 0;
          const [y, m, d] = e.shift_date.split("-").map(Number);
          return {
            date: `${m}/${d}`,
            hitRate: cumulativePredicted > 0 ? Math.round((cumulativeMatched / cumulativePredicted) * 100) : 0,
          };
        });
    }, [entries]);

    // Pie chart data
    const pieData = useMemo(() => [
      { name: 'Matched', value: totalMatched, color: '#8b5cf6' },
      { name: 'Missed', value: Math.max(0, totalPredicted - totalMatched), color: '#f43f5e' },
      { name: 'Extra Sales', value: Math.max(0, totalActualSales - totalMatched), color: '#3b82f6' },
    ].filter(d => d.value > 0), [totalMatched, totalPredicted, totalActualSales]);

    // AWL ID Detail Table (all individual AWL IDs)
    const [detailPage, setDetailPage] = useState(1);
    const detailsPerPage = 10;

    // Reset pagination when data changes
    useEffect(() => {
      setDetailPage(1);
    }, [allEntries]);

    const awlDetails = useMemo(() => {
      const details: any[] = [];
      allEntries
        .sort((a, b) => a.shift_date.localeCompare(b.shift_date))
        .forEach(e => {
          const predictedIds = (e.sales || []).map((s: any) => String(s.awl_id).trim().toUpperCase());
          const actualIds = (e.actual_awl_ids || []).map((id: string) => String(id).trim().toUpperCase());
          const matchedIds = (e.matched_awl_ids || []).map((id: string) => String(id).trim().toUpperCase());
          const actualSalesMap = (e.actual_sales_data || []).reduce((acc: any, s: any) => {
            acc[String(s.awl_id).trim().toUpperCase()] = s.revenue;
            return acc;
          }, {} as Record<string, number>);

          const [y, m, d] = e.shift_date.split("-").map(Number);
          const dayLabel = `${m}/${d}`;

          // Predicted IDs
          predictedIds.forEach((id: string) => {
            const isMatched = matchedIds.includes(id);
            const expected = (e.sales || []).find((s: any) => String(s.awl_id).trim().toUpperCase() === id)?.expected_revenue || 0;
            let actual = actualSalesMap[id] || 0;

            // Fallback: If matched but no granular actual data, assume expected value for display
            if (isMatched && actual === 0 && expected > 0) {
              actual = expected;
            }

            details.push({
              date: dayLabel,
              shift_date: e.shift_date,
              awl_id: id,
              type: 'predicted',
              matched: isMatched,
              expected,
              actual
            });
          });

          // Unpredicted actual IDs
          actualIds.forEach((id: string) => {
            if (!predictedIds.includes(id)) {
              details.push({
                date: dayLabel,
                shift_date: e.shift_date,
                awl_id: id,
                type: 'unpredicted',
                matched: false,
                expected: 0,
                actual: actualSalesMap[id] || 0
              });
            }
          });
        });
      return details;
    }, [allEntries]);

    const totalDetailPages = Math.ceil(awlDetails.length / detailsPerPage) || 1;
    const paginatedDetails = awlDetails.slice((detailPage - 1) * detailsPerPage, detailPage * detailsPerPage);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Performance & Analytics
            </h2>
            <p className="text-sm text-slate-500 mt-1 ml-12">AWL ID predictions, hit rates, and revenue analysis</p>
          </div>
          <MonthBar />
        </div>

        {analyticsLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-14 h-14 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin mb-5" />
            <p className="text-slate-500 font-semibold">Loading analytics...</p>
          </div>
        ) : (allEntries.length === 0 || awlDetails.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Activity className="h-16 w-16 text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold text-lg">No Performance Data for {getMonthName()}</p>
            <p className="text-slate-400 text-sm mt-1">Submit predictions in the Expected Revenue tracker to see your analytics here.</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { label: "Predictions", value: totalPredicted, icon: Crosshair, color: "from-violet-500 to-purple-600", textColor: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
                { label: "Matched AWLs", value: totalMatched, icon: CheckCircle2, color: "from-emerald-500 to-teal-600", textColor: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                { label: "Hit Rate", value: `${hitRate}%`, icon: Target, color: "from-orange-500 to-amber-600", textColor: hitRate >= 70 ? "text-emerald-600" : hitRate >= 40 ? "text-amber-600" : "text-red-500", bg: hitRate >= 70 ? "bg-emerald-50" : hitRate >= 40 ? "bg-amber-50" : "bg-red-50", border: hitRate >= 70 ? "border-emerald-100" : hitRate >= 40 ? "border-amber-100" : "border-red-100" },
                { label: "Actual Sales", value: totalActualSales, icon: Zap, color: "from-blue-500 to-cyan-600", textColor: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Streak Points", value: totalStreaks, icon: Flame, color: "from-orange-500 to-red-500", textColor: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
                { label: "Full Match Days", value: `${daysFullMatch}/${daysSubmitted}`, icon: Award, color: "from-fuchsia-500 to-pink-600", textColor: "text-fuchsia-600", bg: "bg-fuchsia-50", border: "border-fuchsia-100" },
              ].map((kpi, idx) => (
                <Card key={idx} className={`overflow-hidden border ${kpi.border} shadow-sm hover:shadow-md transition-all duration-300`}>
                  <CardContent className="p-4">
                    <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                      <kpi.icon className={`h-4.5 w-4.5 ${kpi.textColor}`} />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{kpi.label}</p>
                    <p className={`text-2xl font-black ${kpi.textColor} mt-0.5`}>{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row 1: Revenue Trend + Hit Rate Pie */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Daily Revenue Chart */}
              <Card className="xl:col-span-2 border-slate-200 shadow-md overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-violet-50/30">
                  <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-500" /> Daily Revenue: Expected vs Actual
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  {dailyRevenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={dailyRevenueData} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                          formatter={(value: any, name: string) => [`$${Number(value).toLocaleString()}`, name === 'Expected' ? 'Expected' : 'Actual']}
                        />
                        <Bar dataKey="expected" fill="#c4b5fd" radius={[4, 4, 0, 0]} name="Expected" />
                        <Bar dataKey="actual" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Actual" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-400">No revenue data for this month</div>
                  )}
                </CardContent>
              </Card>

              {/* Hit Rate Pie */}
              <Card className="border-slate-200 shadow-md overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-fuchsia-50/30">
                  <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Target className="h-4 w-4 text-fuchsia-500" /> Prediction Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="45%"
                          innerRadius={55} outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-400">No data yet</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2: AWL Accuracy + Hit Rate Trend */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* AWL Accuracy Bar Chart */}
              <Card className="border-slate-200 shadow-md overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-emerald-50/30">
                  <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-emerald-500" /> AWL ID Accuracy by Day
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  {awlAccuracyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={awlAccuracyData} barGap={1}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        <Bar dataKey="predicted" fill="#c4b5fd" name="Predicted" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="matched" fill="#10b981" name="Matched" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="actual" fill="#94a3b8" name="Total Actual" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-slate-400">No predictions this month</div>
                  )}
                </CardContent>
              </Card>

              {/* Hit Rate Trend */}
              <Card className="border-slate-200 shadow-md overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-orange-50/30">
                  <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" /> Cumulative Hit Rate Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  {hitRateTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={hitRateTrend}>
                        <defs>
                          <linearGradient id="hitRateGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={(value: any) => [`${value}%`, 'Hit Rate']} />
                        <Area type="monotone" dataKey="hitRate" stroke="#f97316" strokeWidth={3} fill="url(#hitRateGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-slate-400">No trend data yet</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AWL ID Detail Table */}
            <Card className="border-slate-200 shadow-md overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-violet-50/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-500" /> AWL ID Match Detail
                  </CardTitle>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Matched</span>
                    <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 rounded-full bg-red-400" /> Missed</span>
                    <span className="flex items-center gap-1 text-blue-500"><div className="w-2 h-2 rounded-full bg-blue-400" /> Unpredicted Sales</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {awlDetails.length > 0 ? (
                  <div className="flex flex-col">
                    <div className="overflow-auto max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80">
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20 pl-6">Date</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AWL ID</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Type</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center pr-6">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedDetails.map((d, idx) => (
                            <TableRow key={idx} className={`transition-colors ${d.matched ? 'bg-emerald-50/40 hover:bg-emerald-50' : d.type === 'unpredicted' ? 'bg-slate-50/40 hover:bg-slate-50' : 'bg-red-50/30 hover:bg-red-50'}`}>
                              <TableCell className="text-xs font-medium text-slate-500 pl-6">{d.date}</TableCell>
                              <TableCell className="font-mono text-xs font-bold text-slate-700">
                                {viewerMode ? (
                                  <a
                                    href={`https://applywizz-crm-tool.vercel.app/leads/${d.awl_id.trim()}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 hover:underline decoration-indigo-300 transition-colors"
                                  >
                                    {d.awl_id}
                                  </a>
                                ) : (
                                  d.awl_id
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`text-[9px] font-bold ${d.type === 'predicted' ? 'bg-violet-100 text-violet-700 border-0' : 'bg-blue-100 text-blue-700 border-0'}`}>
                                  {d.type === 'predicted' ? 'Predicted' : 'Unpredicted Sale (CRM)'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center pr-6">
                                {d.matched ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] font-bold gap-1">
                                    <CheckCircle2 className="h-2.5 w-2.5" /> Hit
                                  </Badge>
                                ) : d.type === 'predicted' ? (
                                  <Badge className="bg-red-100 text-red-600 border-0 text-[9px] font-bold gap-1">
                                    <AlertCircle className="h-2.5 w-2.5" /> Miss
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-500 border-0 text-[9px] font-bold">
                                    Unpredicted Sale
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Pagination */}
                    {totalDetailPages > 1 && (
                      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-medium italic">
                          Showing {(detailPage - 1) * detailsPerPage + 1} to {Math.min(detailPage * detailsPerPage, awlDetails.length)} of {awlDetails.length} leads
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline" size="sm" className="h-7 w-7 p-0 rounded-md border-slate-200"
                            onClick={() => setDetailPage(p => Math.max(1, p - 1))}
                            disabled={detailPage === 1}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <div className="flex items-center gap-1 px-1">
                            {Array.from({ length: totalDetailPages }, (_, i) => i + 1)
                              .filter(p => p === 1 || p === totalDetailPages || Math.abs(p - detailPage) <= 1)
                              .map((p, i, arr) => (
                                <React.Fragment key={p}>
                                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-300 text-[10px] px-0.5">...</span>}
                                  <button
                                    className={`h-7 w-7 rounded-md text-[11px] font-bold transition-all ${p === detailPage ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                                    onClick={() => setDetailPage(p)}
                                  >
                                    {p}
                                  </button>
                                </React.Fragment>
                              ))
                            }
                          </div>
                          <Button
                            variant="outline" size="sm" className="h-7 w-7 p-0 rounded-md border-slate-200"
                            onClick={() => setDetailPage(p => Math.min(totalDetailPages, p + 1))}
                            disabled={detailPage === totalDetailPages}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">No AWL ID data for this month</div>
                )}
              </CardContent>
            </Card>


            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="border-slate-200 shadow-md overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 border border-violet-200">
                      <DollarSign className="h-7 w-7 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Expected Revenue</p>
                      <p className="text-3xl font-black text-violet-600">${totalExpectedRevenue.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Sum of all predicted sale values for {getMonthName()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-md overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200">
                      <TrendingUp className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Actual Revenue</p>
                      <p className="text-3xl font-black text-emerald-600">${totalActualRevenue.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {totalActualRevenue >= totalExpectedRevenue && totalExpectedRevenue > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><ArrowUpRight className="h-3 w-3" /> Exceeded predictions</span>
                        ) : totalExpectedRevenue > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-500"><ArrowDownRight className="h-3 w-3" /> {Math.round((totalActualRevenue / totalExpectedRevenue) * 100)}% of expected</span>
                        ) : (
                          <span className="text-xs text-slate-400">CRM verified revenue for {getMonthName()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );

  };

  return (
    <>
      <div className="min-h-screen bg-[#f5f6fa] flex flex-col">
        {activeBooster && (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white px-4 py-3 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 animate-in slide-in-from-top-2 shadow-xl z-[60] border-b-2 border-indigo-400">
            <div className="flex items-center gap-3">
              <Flame className="h-6 w-6 text-orange-400 animate-pulse drop-shadow-md" />
              <p className="font-black text-base md:text-lg tracking-wide uppercase drop-shadow-md">
                Incentive Accelerator Active
              </p>
            </div>
            <div className="bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/30 font-bold text-sm shadow-inner flex items-center gap-2">
              <Target className="h-4 w-4" /> {activeBooster.multiplier}x Multiplier on {activeBooster.target === 'both' ? 'All' : activeBooster.target} Incentives
            </div>
            <div className="flex items-center gap-2 font-black text-sm bg-black/30 px-4 py-1.5 rounded-full shadow-inner border border-black/40">
              <Activity className="h-4 w-4 animate-pulse text-emerald-400" />
              <span className="text-emerald-400 font-mono tracking-widest">{boosterTimeLeft}</span> Remaining
            </div>
            <Zap className="h-6 w-6 text-yellow-400 animate-pulse drop-shadow-md hidden md:block" />
          </div>
        )}
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Left: hamburger + brand */}
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => setSidebarOpen(o => !o)}
              >
                {sidebarOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                  <LayoutDashboard className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Sales Portal</p>
                  <p className="text-sm font-black text-slate-800 leading-tight">
                    {viewerMode ? "Viewer Mode" : "My Dashboard"}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: user info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-xs text-slate-400 leading-tight">{user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md text-white font-black text-base">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm font-semibold text-xs px-2.5">
                {user.role}
              </Badge>
            </div>

            {/* Right: logout */}
            {!viewerMode && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm"
                  onClick={() => window.open(process.env.NEXT_PUBLIC_SEND_INVOICE_LINK || "#", "_blank")}
                >
                  Send Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold shadow-sm"
                  onClick={() => window.open(process.env.NEXT_PUBLIC_REFERRAL_FORM_LINK || "#", "_blank")}
                >
                  Referral Form
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full hover:bg-slate-100 p-0 shadow-sm border border-slate-200">
                      <User className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 border-slate-200">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-red-600 font-medium cursor-pointer gap-2">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </header>

        {/* Body: sidebar + main */}
        <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
          {/* Sidebar */}
          <aside className={`
          fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 shrink-0
          bg-white border-r border-slate-200 shadow-xl lg:shadow-none
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            {/* Sidebar header */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Navigation</p>
                  <p className="text-sm font-bold text-slate-700">Sales Tools</p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                const activeGradients: Record<SidebarTab, string> = {
                  tracker: 'linear-gradient(135deg, #f97316, #f59e0b)',
                  incentive: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  bonuses: 'linear-gradient(135deg, #10b981, #14b8a6)',
                  sales: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  analytics: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                  "submission-form": 'linear-gradient(135deg, #f43f5e, #ec4899)',
                };
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${isActive ? 'shadow-md' : 'hover:bg-slate-50'
                      }`}
                    style={isActive ? { background: activeGradients[item.id] } : {}}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                      style={isActive ? { background: 'rgba(255,255,255,0.22)' } : {}}
                    >
                      <Icon
                        className={isActive ? 'text-white' : item.color}
                        style={{ width: '1.1rem', height: '1.1rem' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-700 group-hover:text-slate-800'}`}>
                        {item.label}
                      </p>
                    </div>
                    {isActive && <div className="w-2 h-2 rounded-full bg-white/60 shrink-0" />}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>System Active</span>
              </div>
            </div>
          </aside>

          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 p-5 lg:p-8 overflow-auto">
            {/* Page title bar with gradient */}
            <div className={`mb-6 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden ${activeTab === 'tracker' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
              activeTab === 'incentive' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' :
                activeTab === 'bonuses' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
                  activeTab === 'analytics' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' :
                    activeTab === 'submission-form' ? 'bg-gradient-to-r from-rose-500 to-pink-600' :
                      'bg-gradient-to-r from-blue-500 to-cyan-600'
              }`}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
              <div className="absolute bottom-0 left-20 w-24 h-24 rounded-full bg-white/5 translate-y-8" />

              <div className="relative">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-0.5">Sales Management</p>
                <h1 className="text-2xl font-black tracking-tight">
                  {activeTab === 'tracker' ? '🔥 Expected Revenue Tracker' :
                    activeTab === 'incentive' ? '📈 Incentive Achieved' :
                      activeTab === 'bonuses' ? '🎁 Daily Bonuses' :
                        activeTab === 'analytics' ? '📊 Performance & Analytics' :
                          activeTab === 'submission-form' ? '📝 Sales Success Submission' :
                            '🧾 Sales Records'}
                </h1>
                <p className="text-white/70 text-sm mt-1 font-medium">
                  Welcome back, <strong className="text-white">{user.name}</strong>
                  {user.isactive && <span className="ml-3 text-xs bg-white/20 px-2 py-0.5 rounded-full">● Active</span>}
                </p>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" /> {error}
              </div>
            )}

            {/* Loading state */}
            {loading && activeTab !== 'tracker' ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-5" />
                <p className="text-slate-500 font-semibold">Loading your data...</p>
              </div>
            ) : (
              <>
                {activeTab === 'tracker' && (
                  <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-24">
                      <div className="w-14 h-14 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin mb-5" />
                      <p className="text-slate-500 font-semibold">Loading tracker...</p>
                    </div>
                  }>
                    <ExpectedRevenuePanel
                      user={user}
                      viewerMode={viewerMode}
                      isCompactBtn={false}
                      hideCrmLinks={true}
                      calMonthOverride={monthOffset}
                    />
                  </Suspense>
                )}
                {activeTab === 'incentive' && IncentivePanel()}
                {activeTab === 'bonuses' && BonusPanel()}
                {activeTab === 'sales' && SalesPanel()}
                {activeTab === 'analytics' && <AnalyticsPanel />}
                {activeTab === 'submission-form' && <SalesSubmissionForm user={user} viewerMode={viewerMode} />}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Daily Bonus Detail Dialog */}
      <Dialog open={!!selectedBonusDate} onOpenChange={(open) => !open && setSelectedBonusDate(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          {selectedBonusDate && (() => {
            const shiftSales = (data?.crmSales || []).filter((s: any) =>
              getShiftDateLocal(s.closed_at, data?.shiftStartTime) === selectedBonusDate
            ).sort((a: any, b: any) => b.sale_value - a.sale_value);
            const totalRev = shiftSales.reduce((sum: number, s: any) => sum + (Number(s.sale_value) || 0), 0);

            return (
              <div className="flex flex-col">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
                  <DialogHeader className="p-0 text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-[10px] uppercase font-black tracking-widest mb-1">Bonus Shift Details</p>
                        <DialogTitle className="text-2xl font-black">{new Date(selectedBonusDate).toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' })}</DialogTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-100 text-[10px] uppercase font-black tracking-widest mb-1">Shift Total</p>
                        <p className="text-2xl font-black">${totalRev.toLocaleString()}</p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                <div className="p-6 bg-slate-50/50 max-h-[60vh] overflow-y-auto">
                  <DialogDescription className="sr-only">Sales breakdown for {selectedBonusDate}</DialogDescription>
                  {shiftSales.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{shiftSales.length} Deals Contributing</p>
                      {shiftSales.map((sale: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-200 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                              <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{sale.lead_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {(() => {
                                  const id = sale.awl_id || sale.lead_id;
                                  if (!id) return null;
                                  return (
                                    <a
                                      href={`https://applywizz-crm-tool.vercel.app/leads/${id.trim()}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded hover:bg-indigo-600 hover:text-white transition-all"
                                    >
                                      {id}
                                    </a>
                                  );
                                })()}
                                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(sale.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-emerald-600">${Number(sale.sale_value).toLocaleString()}</p>
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-400 border-slate-200">
                              {sale.payment_mode || 'Record'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <AlertCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No individual sales found for this shift.</p>
                      <p className="text-[11px] text-slate-400 mt-1">This may happen if the shift summary was recorded but sales records are pending sync.</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                  <Button
                    onClick={() => setSelectedBonusDate(null)}
                    className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold h-10 px-8 transition-all active:scale-95"
                  >
                    Close Breakdown
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
