"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Users, ChevronLeft, ChevronRight, Eye, ArrowUpCircle, Download, Settings2, Save, Trash2, PlusCircle, Target, CheckCircle2, AlertCircle, ArrowRight, LockOpen, Flame, FileText, Trophy, Sparkles, DollarSign, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExpectedRevenueOverview } from "./expected-revenue-overview"
import { GlobalAwlTracker } from "./global-awl-tracker"
import { BoosterNightManager } from "./booster-night-manager"

interface CROSalesDashboardProps {
  basePath: string;
  user: any;
  onLogout: () => void;
}

export function CROSalesDashboard({ basePath, user, onLogout }: CROSalesDashboardProps) {
  const [salesReps, setSalesReps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [streaksMap, setStreaksMap] = useState<Record<string, number>>({})
  const [incentiveBreakdown, setIncentiveBreakdown] = useState<Record<string, { dailyBonus: number; slabIncentive: number; targetAmount: number; achievedAmount: number }>>({})
  const [incentivesByPeriod, setIncentivesByPeriod] = useState<any[]>([])
  const [biWeeklyCycle, setBiWeeklyCycle] = useState<1 | 2>(new Date().getDate() <= 15 ? 1 : 2)
  const [monthlyExpData, setMonthlyExpData] = useState<Record<string, { dailySalesCount: number; totalSalesCount: number; overAchieverCount: number; details: any[] }>>({})

  // Daily Sales Detail Modal
  const [dailyDetailsOpen, setDailyDetailsOpen] = useState(false);
  const [selectedDailyRep, setSelectedDailyRep] = useState<any>(null);

  // Multi-type Modal state
  const [breakdownType, setBreakdownType] = useState<"daily" | "streaks" | "sales" | "overachiever" | "target" | "payout" | null>(null);

  // Promotion Controls
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [targetRep, setTargetRep] = useState<any>(null);
  const [promoteRole, setPromoteRole] = useState("");
  // Derive a quick current month default
  const [promoteMonth, setPromoteMonth] = useState(new Date().toISOString().substring(0, 7));
  const [promoteLoading, setPromoteLoading] = useState(false);

  // Status Toggle Controls
  const [confirmRep, setConfirmRep] = useState<{ id: string, isActive: boolean, name: string } | null>(null);

  // Month toggles identical to CA logic
  const [monthOffset, setMonthOffset] = useState<number>(0)
  const leaderboardRef = useRef<HTMLDivElement>(null)

  const targetDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset]);
  const getMonthName = useCallback(() => targetDate.toLocaleString("default", { month: "long", year: "numeric" }), [targetDate]);
  const targetMonthName = useMemo(() => getMonthName(), [getMonthName]);

  // Financial Configuration Controls
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)

  const AVAILABLE_ROLES = ["BDT-P", "BDT", "BDA", "SBDA"];
  type RoleConfig = { target: number; daily_bonus: number; slabs: { threshold: number, incentive: number }[]; }

  const [roleConfigs, setRoleConfigs] = useState<Record<string, RoleConfig>>({
    "BDT-P": { target: 500, daily_bonus: 0, slabs: [] },
    "BDT": { target: 500, daily_bonus: 0, slabs: [] },
    "BDA": { target: 1000, daily_bonus: 400, slabs: [] },
    "SBDA": { target: 2000, daily_bonus: 700, slabs: [] },
  });
  const [selectedRoleConfig, setSelectedRoleConfig] = useState<string>("BDA");



  const fetchSalesUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, isactive, incentive_amount, designation")
      .in("role", ["BDT-P", "BDT", "BDA", "SBDA"])

    if (!error && data) {
      setSalesReps(data)
    }
    setLoading(false)
  }

  const fetchFinancialSettings = async () => {
    const periodStr = getMonthName();
    const { data, error } = await supabase.from("sales_settings").select("key, value")
    if (!error && data) {
      const map = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>)
      const getVal = (baseKey: string) => map[`${baseKey}_${periodStr}`] || map[baseKey]

      const newConfigs: Record<string, RoleConfig> = {};
      AVAILABLE_ROLES.forEach(role => {
        const rKey = role.toLowerCase();

        const tVal = getVal(`${rKey}_target`);
        const target = tVal ? Number(tVal) : (role === "SBDA" ? 2000 : role === "BDA" ? 1000 : 500);

        const dVal = getVal(`${rKey}_daily_bonus`);
        const daily_bonus = dVal ? Number(dVal) : (role === "SBDA" ? 700 : role === "BDA" ? 400 : 0);

        let slabs = [];
        const sVal = getVal(`${rKey}_slab_rules`);
        if (sVal) {
          try { slabs = JSON.parse(sVal); } catch (e) { }
        } else {
          slabs = role === "SBDA" ? [
            { threshold: 10000, incentive: 40000 }, { threshold: 9000, incentive: 34000 }, { threshold: 8000, incentive: 28000 }, { threshold: 7000, incentive: 23000 }, { threshold: 6000, incentive: 19000 }, { threshold: 5000, incentive: 15500 }, { threshold: 3500, incentive: 10500 }, { threshold: 2500, incentive: 8500 }, { threshold: 2000, incentive: 5500 }
          ] : role === "BDA" ? [
            { threshold: 10000, incentive: 40000 }, { threshold: 9000, incentive: 34000 }, { threshold: 8000, incentive: 28000 }, { threshold: 7000, incentive: 23000 }, { threshold: 6000, incentive: 19000 }, { threshold: 5000, incentive: 15500 }, { threshold: 3500, incentive: 10500 }, { threshold: 2500, incentive: 8500 }, { threshold: 2000, incentive: 5500 }, { threshold: 1000, incentive: 4000 }
          ] : [];
        }

        newConfigs[role] = { target, daily_bonus, slabs };
      });
      setRoleConfigs(newConfigs);


    }
  }

  const saveFinancialSettings = async () => {
    setConfigSaving(true)
    const baseKeys: { key: string, value: string }[] = [];

    Object.entries(roleConfigs).forEach(([role, config]) => {
      const rKey = role.toLowerCase();
      baseKeys.push({ key: `${rKey}_target`, value: config.target.toString() });
      baseKeys.push({ key: `${rKey}_daily_bonus`, value: config.daily_bonus.toString() });
      baseKeys.push({ key: `${rKey}_slab_rules`, value: JSON.stringify(config.slabs) });
    });



    const updates = []

    // Always update global as a structural fallback
    for (const b of baseKeys) {
      updates.push(b)
    }

    // Now write explicitly period-locked keys for the selected month and 18 months ahead
    let currentFocusDate = new Date(targetDate)
    for (let i = 0; i < 18; i++) {
      const pMonthStr = currentFocusDate.toLocaleString("default", { month: "long", year: "numeric" });
      for (const b of baseKeys) {
        updates.push({ key: `${b.key}_${pMonthStr}`, value: b.value })
      }
      currentFocusDate.setMonth(currentFocusDate.getMonth() + 1);
    }

    for (const update of updates) {
      await supabase.from("sales_settings").upsert(update, { onConflict: "key" })
    }

    // Automatically trigger fresh recalculation with cache busting after saving
    await handleRecalculate(true);

    setConfigSaving(false)
    alert("Sales Configuration Updated Successfully for this and future months!")
  }

  const fetchStreakCounts = async () => {
    const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    try {
      const res = await fetch(`/api/expected-revenue?mode=executive&month=${monthStr}&skipSync=true`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.entries) {
        const counts: Record<string, number> = {};
        data.entries.forEach((entry: any) => {
          const sc = Number(entry.streak) || 0;
          if (sc > 0) {
            counts[entry.email] = (counts[entry.email] || 0) + sc;
          }
        });
        setStreaksMap(counts);

        // Compute monthly metrics for leaderboard
        const expMetrics: Record<string, { dailySalesCount: number; totalSalesCount: number; overAchieverCount: number; details: any[] }> = {};
        data.entries.forEach((entry: any) => {
          const em = entry.email;
          if (!expMetrics[em]) {
            expMetrics[em] = { dailySalesCount: 0, totalSalesCount: 0, overAchieverCount: 0, details: [] };
          }
          const actualSales = entry.actual_awl_ids?.length || 0;
          if (actualSales > 0) {
            expMetrics[em].dailySalesCount += 1;
            expMetrics[em].totalSalesCount += actualSales;
            expMetrics[em].details.push(entry);
          }
          if (entry.has_revenue && entry.sales?.length > 0) {
            const expectedRev = (entry.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0);
            const actualRev = Number(entry.actual_revenue) || 0;
            if (actualRev > expectedRev && expectedRev > 0) {
              expMetrics[em].overAchieverCount += 1;
            }
          }
        });
        setMonthlyExpData(expMetrics);
      }
    } catch (e) {
      console.error("Error fetching streaks:", e);
    }
  }

  const fetchIncentiveBreakdown = useCallback(async () => {
    const mStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    try {
      const { data, error } = await supabase
        .from("sales_incentives")
        .select("email, role, target_amount, achieved_amount, booster_revenue, daily_bonus, slab_incentive, total_incentive, period")
        .like("period", `${mStr}%`);
      if (!error && data) {
        setIncentivesByPeriod(data);

        // Build role map: email -> current role, to filter out stale records from prior roles
        const repRoleMap: Record<string, string> = {}
        salesReps.forEach(r => { if (r.email) repRoleMap[r.email] = r.role })

        const breakdown: Record<string, { dailyBonus: number; slabIncentive: number; targetAmount: number; achievedAmount: number }> = {};
        data.forEach((row: any) => {
          const em = row.email;
          // Only count records matching the rep's current role
          if (repRoleMap[em] && row.role !== repRoleMap[em]) return;

          if (!breakdown[em]) {
            breakdown[em] = { dailyBonus: 0, slabIncentive: 0, targetAmount: 0, achievedAmount: 0 };
          }
          breakdown[em].dailyBonus += Number(row.daily_bonus) || 0;
          breakdown[em].slabIncentive += Number(row.slab_incentive) || 0;
          breakdown[em].targetAmount = Math.max(breakdown[em].targetAmount, Number(row.target_amount) || 0);
          breakdown[em].achievedAmount += Number(row.achieved_amount) || 0;
        });
        setIncentiveBreakdown(breakdown);
      }
    } catch (e) {
      console.error("Error fetching incentive breakdown:", e);
    }
  }, [targetDate, salesReps]);

  const handleRecalculate = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const activeRepsForCalc = salesReps.filter(r => r.isactive);

      if (activeRepsForCalc.length === 0) {
        if (!silent) alert("No active representatives to recalculate.");
        return;
      }

      // Execute all calculations for this period
      const calcPromises = activeRepsForCalc.map(rep =>
        fetch(`/api/calculate-sales-incentives?email=${encodeURIComponent(rep.email)}&role=${encodeURIComponent(rep.role)}&period=${encodeURIComponent(getMonthName())}&t=${new Date().getTime()}`, {
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        })
      );

      const results = await Promise.all(calcPromises);
      const allOk = results.every(res => res.ok);

      if (allOk) {
        await fetchSalesUsers();
        if (!silent) alert("Incentives Recalculated Successfully!");
      } else {
        if (!silent) alert("Some recalculations failed. Check console or CRM connectivity.");
      }
    } catch (e) {
      console.error("Recalculation error:", e);
      if (!silent) alert("Error occurred during recalculation");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchSalesUsers()
  }, [])

  useEffect(() => {
    fetchFinancialSettings()
    fetchStreakCounts()
    fetchIncentiveBreakdown()
    const interval = setInterval(() => { fetchStreakCounts(); fetchIncentiveBreakdown(); }, 300000);
    return () => clearInterval(interval);
  }, [monthOffset, fetchIncentiveBreakdown])

  const getIncentiveForMonth = (incentiveRaw: any) => {
    if (!incentiveRaw) return 0;
    try {
      const parsed = typeof incentiveRaw === 'string' ? JSON.parse(incentiveRaw) : incentiveRaw;
      return parsed[getMonthName()] || 0;
    } catch (e) {
      return 0;
    }
  }

  const handlePromote = async () => {
    if (!targetRep || !promoteRole || !promoteMonth) return;
    setPromoteLoading(true);
    try {
      const response = await fetch("/api/promote-sales-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetRep.id, newRole: promoteRole, effectiveMonth: promoteMonth })
      });
      const resData = await response.json();
      if (resData.success) {
        setPromoteOpen(false);
        await fetchSalesUsers(); // Re-fetch all to sync view

        // Instantly recalculate user target config with the promoted identity
        await fetch(`/api/calculate-sales-incentives?email=${encodeURIComponent(targetRep.email)}&role=${encodeURIComponent(promoteRole)}&period=${encodeURIComponent(getMonthName())}&t=${new Date().getTime()}`, {
          cache: "no-store", headers: { "Pragma": "no-cache", "Cache-Control": "no-cache, no-store, must-revalidate" }
        });

        // Refresh breakdown globally to render the new target dynamically
        await fetchIncentiveBreakdown();
      } else {
        alert(resData.error || "Failed to promote employee.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPromoteLoading(false);
    }
  }

  const handleToggleActive = async (repId: string, currentIsActive: boolean) => {
    const { data, error } = await supabase
      .from("users")
      .update({ isactive: !currentIsActive })
      .eq("id", repId)
      .select("id, isactive")
      .single()

    if (error) {
      alert("Failed to toggle active state: " + error.message)
      return
    }

    setSalesReps((prev) => prev.map((r) => (r.id === repId ? { ...r, isactive: data.isactive } : r)))
  }

  const filteredReps = salesReps.filter(rep => {
    let match = true;
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase()
      match = match && !!(rep.name?.toLowerCase().includes(t) || rep.email?.toLowerCase().includes(t) || rep.role?.toLowerCase().includes(t))
    }
    if (roleFilter !== "All") {
      match = match && (rep.role === roleFilter)
    }
    if (statusFilter !== "All") {
      const wantActive = statusFilter === "Active"
      match = match && (rep.isactive === wantActive)
    }
    return match;
  })

  const activeReps = filteredReps.filter(rep => rep.isactive);
  const inactiveReps = filteredReps.filter(rep => !rep.isactive);

  // Helper: determine which half a period row belongs to by parsing its start date
  const getPeriodHalf = (periodStr: string): 1 | 2 => {
    // period format: "2026-04-01 to 2026-04-15" or "2026-04-16 to 2026-04-30"
    const startDateStr = periodStr.split(" to ")[0];
    const day = parseInt(startDateStr.split("-")[2], 10);
    return day <= 15 ? 1 : 2;
  };

  // Compute the date range label for the chevron UI
  const getCycleLabel = (half: 1 | 2) => {
    const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    if (half === 1) return `1st – 15th`;
    return `16th – ${lastDay}th`;
  };

  // Leaderboard: Compute ranked active reps based on 5 priority criteria
  const leaderboardReps = [...activeReps].map(rep => {
    const email = rep.email;
    const em = monthlyExpData[email] || { dailySalesCount: 0, totalSalesCount: 0, overAchieverCount: 0, details: [] };
    const streaks = streaksMap[email] || 0;

    const userIncs = incentivesByPeriod.filter(r => r.email === email && r.role === rep.role);
    const fullMonthAchievedAmount = userIncs.reduce((sum, r) => sum + (Number(r.achieved_amount) || 0), 0);
    const fullMonthBoosterRevenue = userIncs.reduce((sum, r) => sum + (Number(r.booster_revenue) || 0), 0);
    const fullMonthDailyBonus = userIncs.reduce((sum, r) => sum + (Number(r.daily_bonus) || 0), 0);
    const fullMonthSlabIncentive = userIncs.reduce((sum, r) => sum + (Number(r.slab_incentive) || 0), 0);

    // Base fallback row to extract common persistent settings like Target Amount
    const fallbackRow = userIncs[0] || null;

    let cycleRow = null;
    if (rep.role === "BDT-P") {
      // Monthly role uses the only row
      cycleRow = userIncs[0] || null;
    } else {
      // Match exactly the row that corresponds to the selected half
      cycleRow = userIncs.find(r => getPeriodHalf(r.period) === biWeeklyCycle) || null;
    }

    const cycleAchievedAmount = cycleRow ? Number(cycleRow.achieved_amount) || 0 : 0;
    const cycleBoosterRevenue = cycleRow ? Number(cycleRow.booster_revenue) || 0 : 0;
    // Visually override and enforce the target from the live settings config based on their current role directly.
    const liveConfigTarget = roleConfigs[rep.role]?.target || 0;
    const cycleTargetAmount = liveConfigTarget > 0
      ? liveConfigTarget
      : (cycleRow ? (Number(cycleRow.target_amount) || 0) : (fallbackRow ? (Number(fallbackRow.target_amount) || 0) : 0));
    const cycleSlabIncentive = cycleRow ? Number(cycleRow.slab_incentive) || 0 : 0;
    const cycleDailyBonus = cycleRow ? Number(cycleRow.daily_bonus) || 0 : 0;

    const targetCompleted = (cycleAchievedAmount + cycleBoosterRevenue) >= cycleTargetAmount && cycleTargetAmount > 0;

    // Filter details based on cycle for bi-weekly roles
    const validDetails = em.details.filter((detail: any) => {
      const [_y, _m, dstr] = detail.shift_date.split("-");
      const day = Number(dstr);
      if (biWeeklyCycle === 1 && day > 15) return false;
      if (biWeeklyCycle === 2 && day <= 15) return false;
      return true;
    });

    let cycleDailySalesCount = 0;
    let cycleTotalSalesCount = 0;
    let cycleOverAchieverCount = 0;

    validDetails.forEach((entry: any) => {
      const actualSales = entry.actual_awl_ids?.length || 0;
      if (actualSales > 0) {
        cycleDailySalesCount += 1;
        cycleTotalSalesCount += actualSales;
      }

      if (entry.has_revenue && entry.sales?.length > 0) {
        const expectedRev = (entry.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0);
        const actualRev = Number(entry.actual_revenue) || 0;
        if (actualRev > expectedRev && expectedRev > 0) {
          cycleOverAchieverCount += 1;
        }
      }
    });

    // Progressive Streak calculation: 
    // Cycle 1 only sees days 1-15. Cycle 2 sees days 1-31 (cumulative inclusion of 1st half).
    let cycleStreaks = 0;
    const streakDetails = em.details.filter((detail: any) => {
      const [_y, _m, dstr] = detail.shift_date.split("-");
      const day = Number(dstr);
      if (biWeeklyCycle === 1 && day > 15) return false;
      return true;
    });
    streakDetails.forEach((entry: any) => {
      cycleStreaks += Number(entry.streak) || 0;
    });

    return {
      ...rep,
      targetCompleted,
      achievedAmount: cycleAchievedAmount,     // Active slab revenue
      boosterRevenue: cycleBoosterRevenue,     // Active slab booster addition
      targetAmount: cycleTargetAmount,          // Active slab target
      totalRevenue: fullMonthAchievedAmount,    // Full month actual revenue
      totalBoosterRevenue: fullMonthBoosterRevenue, // Full month booster revenue
      dailySalesCount: cycleDailySalesCount,    // Active slab days
      totalSalesCount: cycleTotalSalesCount,    // Active slab sales
      streaks: cycleStreaks,                    // Progressive cumulative streaks up to cycle
      overAchieverCount: cycleOverAchieverCount,// Active slab over-achiever triggers
      slabIncentive: cycleSlabIncentive,        // Active slab incentive
      dailyBonus: cycleDailyBonus,              // Active slab daily bonus
      fullMonthTotalIncentive: fullMonthSlabIncentive,  // Slab incentive only, NOT daily bonus
      monthIncentive: getIncentiveForMonth(rep.incentive_amount),
      dailyDetails: validDetails,               // Active slab specific granular details
      monthlyDetails: streakDetails             // Progressive streak details for modal
    };
  }).sort((a, b) => {
    // Priority 1: Higher total month revenue first (stable across cycle toggle)
    if (a.totalRevenue !== b.totalRevenue) return b.totalRevenue - a.totalRevenue;
    // Priority 2: More daily sales count
    if (a.dailySalesCount !== b.dailySalesCount) return b.dailySalesCount - a.dailySalesCount;
    // Priority 3: More streak points
    if (a.streaks !== b.streaks) return b.streaks - a.streaks;
    // Priority 4: More total sales in month
    if (a.totalSalesCount !== b.totalSalesCount) return b.totalSalesCount - a.totalSalesCount;
    // Priority 5: More over-achiever days
    return b.overAchieverCount - a.overAchieverCount;
  });

  const totalRevenueActiveReps = leaderboardReps.reduce((sum, rep) => sum + (rep.totalRevenue || 0), 0);

  const renderRepTable = (reps: any[], emptyMsg: string, isInactive: boolean = false) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className={isInactive ? 'bg-slate-100/50' : 'bg-slate-50'}>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Streaks</TableHead>
            <TableHead>{getMonthName()} Incentives</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                {emptyMsg}
              </TableCell>
            </TableRow>
          ) : (
            reps.map((rep) => (
              <TableRow key={rep.id} className={isInactive ? 'opacity-70 grayscale-[0.5]' : ''}>
                <TableCell className="font-medium text-slate-800">{rep.name}</TableCell>
                <TableCell className="text-slate-600">{rep.email}</TableCell>
                <TableCell>
                  <Badge className={`border-none ${rep.role === 'BDT-P' ? 'bg-slate-100 text-slate-600 font-medium' :
                    rep.role === 'BDT' ? 'bg-blue-100 text-blue-700 font-bold' :
                      rep.role === 'BDA' ? 'bg-indigo-100 text-indigo-700 font-black tracking-wide' :
                        'bg-violet-100 text-violet-800 font-black tracking-widest'
                    }`}>{rep.role}</Badge>
                </TableCell>
                <TableCell>
                  {rep.isactive ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-none mr-2">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="mr-2">Inactive</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-300 text-xs py-0 h-6"
                    onClick={() => setConfirmRep({ id: rep.id, isActive: rep.isactive, name: rep.name })}
                  >
                    {rep.isactive ? "Set Inactive" : "Set Active"}
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className={`p-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs ${streaksMap[rep.email] > 0 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-50 text-slate-400 opacity-60'}`}>
                      <Flame className="h-3.5 w-3.5" />
                      {streaksMap[rep.email] || 0}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-emerald-700">
                  ₹{getIncentiveForMonth(rep.incentive_amount).toLocaleString()}
                </TableCell>
                <TableCell className="text-right flex items-center justify-end gap-2">

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                      setTargetRep(rep);
                      setPromoteRole(rep.role);
                      setPromoteOpen(true);
                    }}
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-2" /> Promote
                  </Button>
                  <Link href={`${basePath}/sales/${rep.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" /> View Board
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Global totals based on slab incentive only (daily bonus is NOT incentive)
  const totalIncentives = Object.values(incentiveBreakdown).reduce((sum, ib) => sum + (ib.slabIncentive || 0), 0);
  const totalDailyBonus = Object.values(incentiveBreakdown).reduce((sum, ib) => sum + (ib.dailyBonus || 0), 0);
  const totalCombinedMoney = totalIncentives + totalDailyBonus;

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Designation", "Status", "Streaks", `${getMonthName()} Incentives`];
    const csvRows = [headers.join(",")];

    filteredReps.forEach(rep => {
      const name = `"${(rep.name || "").replace(/"/g, '""')}"`;
      const email = `"${(rep.email || "").replace(/"/g, '""')}"`;
      const role = `"${(rep.role || "").replace(/"/g, '""')}"`;
      const status = `"${rep.isactive ? "Active" : "Inactive"}"`;
      const streaks = `"${streaksMap[rep.email] || 0}"`;
      const incentive = `"${getIncentiveForMonth(rep.incentive_amount)}"`;
      csvRows.push([name, email, role, status, streaks, incentive].join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Sales_Incentives_${getMonthName().replace(" ", "_")}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 relative">
      {/* Full-page loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-100/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="relative flex items-center justify-center w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-[spin_1s_linear_infinite]"></div>
              <div className="absolute inset-2 rounded-full border-r-4 border-emerald-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
              <div className="absolute inset-4 rounded-full border-b-4 border-amber-400 animate-[spin_2s_linear_infinite]"></div>
              <Users className="h-5 w-5 text-indigo-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Synchronizing Data</h3>
            <p className="text-sm text-slate-500 mt-2 text-center">Processing incentive data...</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Toggle Status Context Modal */}
        <Dialog open={!!confirmRep} onOpenChange={() => setConfirmRep(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
              <DialogDescription>Toggle the active status of this sales representative.</DialogDescription>
            </DialogHeader>
            <p>
              Are you sure you want to{" "}
              <span className="font-semibold">
                {confirmRep?.isActive ? "set this representative as Inactive" : "set this representative as Active"}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setConfirmRep(null)}>Cancel</Button>
              <Button
                className={confirmRep?.isActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"}
                onClick={() => {
                  if (confirmRep) {
                    handleToggleActive(confirmRep.id, confirmRep.isActive)
                    setConfirmRep(null)
                  }
                }}
              >
                {confirmRep?.isActive ? "Yes, Set Inactive" : "Yes, Set Active"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Promotion Dialog Context Modal */}
        <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promote {targetRep?.name}</DialogTitle>
              <DialogDescription>Change the role assignment for this representative.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-slate-500">Current active classification: <strong>{targetRep?.role}</strong></p>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Role Assignment</label>
                <Select value={promoteRole} onValueChange={setPromoteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BDT-P">BDT-P</SelectItem>
                    <SelectItem value="BDT">BDT</SelectItem>
                    <SelectItem value="BDA">BDA</SelectItem>
                    <SelectItem value="SBDA">SBDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Effective Boundary (YYYY-MM)</label>
                <Input
                  type="month"
                  value={promoteMonth}
                  onChange={(e) => setPromoteMonth(e.target.value)}
                />
                <p className="text-xs text-slate-500">The specific month when this role strictly inherits rules & evaluations from. Past periods will intelligently calculate securely off the older roles.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPromoteOpen(false)} disabled={promoteLoading}>Cancel</Button>
              <Button onClick={handlePromote} disabled={promoteLoading}>Apply Promotion</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex justify-between items-start mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sales Dashboard (Admin)</h1>
            <p className="text-slate-600">Track and manage complete Sales Team performances</p>
          </div>
          <div className="flex gap-4 items-center">
            <Button variant="outline" className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={exportToCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline">Profile</Button>
            <Button onClick={onLogout}>Logout</Button>
          </div>
        </div>

        {/* Month Filter */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Sales Period Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-4 items-center">
              <h2 className="text-md font-semibold text-slate-800 w-48">
                Month: <span className="text-blue-600">{getMonthName()}</span>
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMonthOffset((prev) => prev - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous Month
                </Button>
                <Button variant="default" onClick={() => setMonthOffset(0)}>
                  This Month
                </Button>
                <Button variant="outline" onClick={() => setMonthOffset((prev) => prev + 1)}>
                  Next Month <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Sales Reps</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{salesReps.length}</div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/10"
            onClick={() => leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Reps</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{salesReps.filter(r => r.isactive).length}</div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/10"
            onClick={() => leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue (Active sales rep only)</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">${totalRevenueActiveReps.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500 min-h-[140px] flex flex-col justify-between overflow-hidden group cursor-pointer hover:bg-emerald-50/10 hover:border-emerald-300"
            onClick={() => leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-tight flex items-center gap-1.5">
                Total Incentives <span className="text-[10px] bg-slate-100 px-1 py-0 rounded text-slate-400 font-normal">{getMonthName()}</span>
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-black text-emerald-600">₹{totalIncentives.toLocaleString()}</div>
                <div className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1 shadow-sm">
                  <Flame className="h-3 w-3" /> ₹{totalDailyBonus.toLocaleString()} Daily Bonus
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Money Payout</span>
                <span className="text-lg font-black text-indigo-700 underline decoration-indigo-200 decoration-2 underline-offset-2">₹{totalCombinedMoney.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expected" className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white border border-slate-200 shadow-sm mb-6 p-1.5 rounded-xl">
            <TabsTrigger value="expected" className="rounded-lg font-bold transition-all data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4 mr-2" /> Expected Revenue Track
            </TabsTrigger>
            <TabsTrigger value="global" className="rounded-lg font-bold transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4 mr-2" /> Global AWL ID Track
            </TabsTrigger>
            <TabsTrigger value="slab" className="rounded-lg font-bold transition-all data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
              <Settings2 className="h-4 w-4 mr-2" /> Slab Rules Config
            </TabsTrigger>
            <TabsTrigger value="booster" className="rounded-lg font-bold transition-all data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
              <Flame className="h-4 w-4 mr-2" /> Incentive Accelerator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expected" className="mt-0 ring-offset-slate-50 focus-visible:ring-0">
            <ExpectedRevenueOverview monthName={targetMonthName} targetDate={targetDate} />
          </TabsContent>

          <TabsContent value="global" className="mt-0 ring-offset-slate-50 focus-visible:ring-0">
            <GlobalAwlTracker monthName={getMonthName()} targetDate={targetDate} salesReps={salesReps} basePath={basePath} />
          </TabsContent>

          <TabsContent value="slab" className="mt-0 ring-offset-slate-50 focus-visible:ring-0">
            <Card className="border-0 shadow-xl overflow-hidden ring-1 ring-slate-200/50 bg-white rounded-xl">
              <CardHeader className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white py-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
                <div className="absolute top-0 right-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl shadow-inner transition-colors duration-500 bg-white/10 border border-white/20">
                      <Settings2 className="h-7 w-7 text-indigo-100" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-white">
                        Edit Slab Rules
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-widest text-[10px]">Active Controls</Badge>
                      </CardTitle>
                      <p className="text-sm mt-1.5 font-medium max-w-lg leading-relaxed text-indigo-200/90">
                        Slab Rules for {getMonthName()}. Changes will implicitly propagate to future cycles.
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  {/* Left Column: Role Selector & Quotas */}
                  <div className="xl:col-span-4 space-y-6">
                    <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
                      <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/40">
                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                          <Users className="h-4 w-4 text-indigo-500" /> Select Role to Configure
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_ROLES.map(role => (
                            <Button
                              key={role}
                              variant={selectedRoleConfig === role ? "default" : "outline"}
                              className={selectedRoleConfig === role ? "bg-indigo-600 text-white" : "text-slate-600"}
                              onClick={() => setSelectedRoleConfig(role)}
                            >
                              {role}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
                      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                      <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/40">
                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                          <Target className="h-4 w-4 text-indigo-500" /> {selectedRoleConfig} Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-5">
                        <div className="space-y-2 group">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                            Revenue Target <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">USD</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">$</div>
                            <Input type="number"
                              value={roleConfigs[selectedRoleConfig]?.target || 0}
                              onChange={e => {
                                setRoleConfigs(prev => ({
                                  ...prev,
                                  [selectedRoleConfig]: { ...prev[selectedRoleConfig], target: Number(e.target.value) }
                                }))
                              }}
                              className="pl-7 bg-slate-50 border-slate-200 font-semibold focus-visible:ring-indigo-500 transition-all" />
                          </div>
                        </div>
                        <div className="space-y-2 group">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                            Daily Bonus Threshold <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">USD</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">$</div>
                            <Input type="number"
                              value={roleConfigs[selectedRoleConfig]?.daily_bonus || 0}
                              onChange={e => {
                                setRoleConfigs(prev => ({
                                  ...prev,
                                  [selectedRoleConfig]: { ...prev[selectedRoleConfig], daily_bonus: Number(e.target.value) }
                                }))
                              }}
                              className="pl-7 bg-slate-50 border-slate-200 font-semibold focus-visible:ring-indigo-500 transition-all" />
                          </div>
                        </div>


                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Dynamic Matrices */}
                  <div className="xl:col-span-8 flex flex-col gap-6">
                    <Card className="border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white flex-1 flex flex-col">
                      <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/40 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                            <TrendingUp className="h-4 w-4 text-indigo-500" /> {selectedRoleConfig} Incentive Matrix
                          </CardTitle>
                        </div>
                        <Button size="sm"
                          onClick={() => {
                            setRoleConfigs(prev => {
                              const conf = prev[selectedRoleConfig];
                              return {
                                ...prev,
                                [selectedRoleConfig]: { ...conf, slabs: [{ threshold: 0, incentive: 0 }, ...(conf.slabs || [])] }
                              }
                            })
                          }}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 h-8 text-xs font-bold shadow-sm transition-all">
                          <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Add Level
                        </Button>
                      </CardHeader>
                      <CardContent className="p-0 flex-1 relative bg-slate-50/20">
                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-5 space-y-3">
                          {(!roleConfigs[selectedRoleConfig]?.slabs || roleConfigs[selectedRoleConfig].slabs.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                              <AlertCircle className="h-10 w-10 text-slate-400 mb-3" />
                              <p className="text-sm font-semibold text-slate-500">No calculation tiers found for {selectedRoleConfig}.</p>
                              <p className="text-xs text-slate-400">Add a level to define rules.</p>
                            </div>
                          ) : (
                            roleConfigs[selectedRoleConfig].slabs.map((slab, index) => (
                              <div key={`slab-${index}`} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-300 hover:shadow-indigo-100 transition-all duration-300 group">
                                <div className="flex-1 min-w-[120px]">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-1">Gate (USD)</label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">$</div>
                                    <Input type="number" value={slab.threshold} onChange={(e) => {
                                      setRoleConfigs(prev => {
                                        const conf = prev[selectedRoleConfig];
                                        const newSlabs = [...conf.slabs];
                                        newSlabs[index].threshold = Number(e.target.value);
                                        return { ...prev, [selectedRoleConfig]: { ...conf, slabs: newSlabs } };
                                      });
                                    }} className="h-9 font-semibold pl-6 bg-slate-50 group-hover:bg-white transition-colors" />
                                  </div>
                                </div>
                                <div className="flex items-center justify-center px-1 opacity-50"><ArrowRight className="h-4 w-4 text-slate-400" /></div>
                                <div className="flex-[1.5] min-w-[140px]">
                                  <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest pl-1 block mb-1">Grant (INR)</label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-600/60 font-bold text-xs">₹</div>
                                    <Input type="number" value={slab.incentive} onChange={(e) => {
                                      setRoleConfigs(prev => {
                                        const conf = prev[selectedRoleConfig];
                                        const newSlabs = [...conf.slabs];
                                        newSlabs[index].incentive = Number(e.target.value);
                                        return { ...prev, [selectedRoleConfig]: { ...conf, slabs: newSlabs } };
                                      });
                                    }} className="h-9 border-emerald-200 focus-visible:ring-emerald-500 bg-emerald-50/40 text-emerald-800 font-bold pl-6 transition-colors group-hover:bg-emerald-50/80" />
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  setRoleConfigs(prev => {
                                    const conf = prev[selectedRoleConfig];
                                    const newSlabs = conf.slabs.filter((_, i) => i !== index);
                                    return { ...prev, [selectedRoleConfig]: { ...conf, slabs: newSlabs } };
                                  });
                                }} className="mt-4 md:mt-0 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors h-9 w-9 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-slate-100/80 border-t border-slate-200 p-5 px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                  <LockOpen className="h-4 w-4 text-emerald-500" />
                  Rule changes instantly lock into <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">{getMonthName()}</span>.
                </div>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-8 h-12 text-md rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
                  onClick={saveFinancialSettings}
                  disabled={configSaving}
                >
                  {configSaving ? <Flame className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {configSaving ? "Committing... it takes some time to change the settings." : "Commit Financial Engine"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="booster" className="mt-0 ring-offset-slate-50 focus-visible:ring-0">
            <BoosterNightManager
              monthName={targetMonthName}
              targetDate={targetDate}
              userEmail={user.email || ""}
              onCycleChange={() => handleRecalculate(true)}
            />
          </TabsContent>
        </Tabs>

        {/* Sales Leaderboard */}
        <Card className="border-0 shadow-xl overflow-hidden ring-1 ring-slate-200/50 relative scroll-mt-24" ref={leaderboardRef}>
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500"></div>
          <CardHeader className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-5">
            <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
              <CardTitle className="text-lg flex items-center gap-3 font-black tracking-tight">
                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <Trophy className="h-5 w-5 text-amber-400" />
                </div>
                Sales Leaderboard — {getMonthName()}
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px] uppercase tracking-widest">Live Rankings</Badge>
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 border border-white/20 mr-2">
                  <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs font-bold rounded-md transition-all ${biWeeklyCycle === 1 ? 'bg-amber-500/30 text-amber-200' : 'text-white/60 hover:bg-white/10'}`} onClick={() => setBiWeeklyCycle(1)}>
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />{getCycleLabel(1)}
                  </Button>
                  <div className="w-px h-5 bg-white/20" />
                  <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs font-bold rounded-md transition-all ${biWeeklyCycle === 2 ? 'bg-amber-500/30 text-amber-200' : 'text-white/60 hover:bg-white/10'}`} onClick={() => setBiWeeklyCycle(2)}>
                    {getCycleLabel(2)}<ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white hover:bg-white/20 border-white/20 shadow-sm transition-colors h-8 text-xs"
                  onClick={() => handleRecalculate(false)}
                >
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" /> Sync Rankings
                </Button>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[130px] bg-white/10 border-white/20 text-white h-8 text-sm">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    <SelectItem value="BDT-P">BDT-P</SelectItem>
                    <SelectItem value="BDT">BDT</SelectItem>
                    <SelectItem value="BDA">BDA</SelectItem>
                    <SelectItem value="SBDA">SBDA</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-52">
                  <Search className="absolute left-2.5 top-2 h-4 w-4 text-white/50" />
                  <Input
                    placeholder="Search reps..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-200">
                    <TableHead className="w-12 text-center font-black text-slate-500">#</TableHead>
                    <TableHead className="font-bold text-slate-600">Representative</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Role</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">
                      <div className="flex items-center justify-center gap-1"><Target className="h-3 w-3 text-emerald-500" /> Target</div>
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-600">
                      <div className="flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3 text-blue-500" /> Daily Consistency Breakdown</div>
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-600">
                      <div className="flex items-center justify-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> Streaks</div>
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-600">
                      <div className="flex items-center justify-center gap-1"><Users className="h-3 w-3 text-indigo-500" /> Sales</div>
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-600">
                      <div className="flex items-center justify-center gap-1"><Sparkles className="h-3 w-3 text-violet-500" /> Over-Achiever</div>
                    </TableHead>
                    <TableHead className="text-center font-bold text-emerald-600">Slab Incentive</TableHead>
                    <TableHead className="text-center font-bold text-amber-600">Daily Bonus</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">
                      <div className="flex items-center justify-center gap-1"><DollarSign className="h-3 w-3 text-emerald-500" /> Total Revenue</div>
                    </TableHead>
                    <TableHead className="text-center font-bold text-indigo-600">Total Incentive</TableHead>
                    <TableHead className="text-right font-bold text-slate-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardReps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-10 text-slate-400 font-medium">
                        No active sales representatives found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboardReps.map((rep, idx) => {
                      const rank = idx + 1;
                      const isGold = rank === 1;
                      const isSilver = rank === 2;
                      const isBronze = rank === 3;
                      const isTopThree = rank <= 3;
                      return (
                        <TableRow
                          key={rep.id}
                          className={`transition-all duration-300 cursor-pointer ${isGold ? 'bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-transparent hover:from-amber-100/80' :
                            isSilver ? 'bg-gradient-to-r from-slate-100/80 via-slate-50/50 to-transparent hover:from-slate-200/50' :
                              isBronze ? 'bg-gradient-to-r from-orange-50/50 via-amber-50/30 to-transparent hover:from-orange-100/50' :
                                'hover:bg-slate-50/50'
                            }`}
                          onClick={() => window.location.href = `${basePath}/sales/${rep.id}`}
                        >
                          <TableCell className="text-center">
                            {isGold ? (
                              <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-sm shadow-lg shadow-amber-200/50">🥇</div>
                            ) : isSilver ? (
                              <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-sm shadow-lg shadow-slate-200/50">🥈</div>
                            ) : isBronze ? (
                              <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-amber-700 flex items-center justify-center text-sm shadow-lg shadow-orange-200/50">🥉</div>
                            ) : (
                              <span className="text-slate-400 font-bold text-sm">{rank}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${isGold ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md' :
                                isSilver ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md' :
                                  isBronze ? 'bg-gradient-to-br from-orange-300 to-amber-400 text-white shadow-md' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {rep.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className={`font-bold leading-tight ${isTopThree ? 'text-slate-900' : 'text-slate-700'}`}>{rep.name}</p>
                                <p className="text-[10px] text-slate-400">{rep.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`border-none text-[10px] ${rep.role === 'BDT-P' ? 'bg-slate-100 text-slate-600' :
                              rep.role === 'BDT' ? 'bg-blue-100 text-blue-700 font-bold' :
                                rep.role === 'BDA' ? 'bg-indigo-100 text-indigo-700 font-black' :
                                  'bg-violet-100 text-violet-800 font-black'
                              }`}>{rep.role}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {rep.targetAmount > 0 ? (
                              <div
                                className="flex flex-col items-center gap-0.5 p-1 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors group"
                                title="View Target Progress Breakdown"
                                onClick={(e) => { e.stopPropagation(); setSelectedDailyRep(rep); setBreakdownType("target"); setDailyDetailsOpen(true); }}
                              >
                                <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">${rep.achievedAmount.toLocaleString()} / ${rep.targetAmount.toLocaleString()}</span>
                                {rep.targetCompleted ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold text-[9px] gap-1 px-1.5 py-0 group-hover:scale-105 transition-transform">
                                    <CheckCircle2 className="h-2.5 w-2.5" /> Target Achieved
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-100 text-amber-700 border-0 font-bold text-[9px] px-1.5 py-0 group-hover:scale-105 transition-transform">
                                    {Math.round((rep.achievedAmount / rep.targetAmount) * 100)}%
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className={`flex flex-col items-center cursor-pointer hover:bg-blue-50 rounded-lg p-1 transition-colors ${rep.dailySalesCount > 0 ? 'group' : ''}`}
                              title="View Daily Consistency Breakdown"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (rep.dailySalesCount > 0) {
                                  setSelectedDailyRep(rep);
                                  setBreakdownType("daily");
                                  setDailyDetailsOpen(true);
                                }
                              }}
                            >
                              <span className={`text-lg font-black ${rep.dailySalesCount > 0 ? 'text-blue-600 group-hover:scale-110 transition-transform' : 'text-slate-300'}`}>
                                {rep.dailySalesCount}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Day Count</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className={`cursor-pointer group flex justify-center`}
                              title="View Streak Performance Bonus Days"
                              onClick={(e) => { e.stopPropagation(); if (rep.streaks > 0) { setSelectedDailyRep(rep); setBreakdownType("streaks"); setDailyDetailsOpen(true); } }}
                            >
                              <Badge className={`border-0 font-bold transition-all group-hover:scale-110 ${rep.streaks > 0 ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                {rep.streaks > 0 && <Flame className="h-3 w-3 mr-1" />}
                                {rep.streaks}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className="flex flex-col items-center cursor-pointer hover:bg-indigo-50 rounded-lg p-1 transition-all group"
                              title="View Individual Global AWL ID Sales"
                              onClick={(e) => { e.stopPropagation(); if (rep.totalSalesCount > 0) { setSelectedDailyRep(rep); setBreakdownType("sales"); setDailyDetailsOpen(true); } }}
                            >
                              <span className={`text-lg font-black ${rep.totalSalesCount > 0 ? 'text-indigo-600 group-hover:scale-110 transition-transform' : 'text-slate-300'}`}>
                                {rep.totalSalesCount}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Total</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className="cursor-pointer group flex justify-center"
                              title="View Days Surpassing Expected Revenue"
                              onClick={(e) => { e.stopPropagation(); if (rep.overAchieverCount > 0) { setSelectedDailyRep(rep); setBreakdownType("overachiever"); setDailyDetailsOpen(true); } }}
                            >
                              {rep.overAchieverCount > 0 ? (
                                <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 font-bold gap-1 shadow-sm group-hover:scale-110 transition-all">
                                  <Sparkles className="h-3 w-3" /> {rep.overAchieverCount}
                                </Badge>
                              ) : (
                                <span className="text-slate-300 font-bold">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className="cursor-pointer hover:bg-emerald-50 p-1 rounded-lg transition-all"
                              title="View Monthly Payout Breakdown"
                              onClick={(e) => { e.stopPropagation(); setSelectedDailyRep(rep); setBreakdownType("payout"); setDailyDetailsOpen(true); }}
                            >
                              <span className={`font-bold ${rep.slabIncentive > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                ₹{rep.slabIncentive.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className="cursor-pointer hover:bg-amber-50 p-1 rounded-lg transition-all"
                              title="View Monthly Payout Breakdown"
                              onClick={(e) => { e.stopPropagation(); setSelectedDailyRep(rep); setBreakdownType("payout"); setDailyDetailsOpen(true); }}
                            >
                              <span className={`font-bold ${rep.dailyBonus > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                                ₹{rep.dailyBonus.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center justify-center p-1 cursor-pointer group" title="Click to view revenue breakdown" onClick={(e) => { e.stopPropagation(); setSelectedDailyRep(rep); setBreakdownType("target"); setDailyDetailsOpen(true); }}>
                              <span className="text-[13px] font-black text-emerald-700">${rep.totalRevenue.toLocaleString()}</span>
                              {rep.totalBoosterRevenue > 0 && (
                                <span className="text-[10px] font-bold text-orange-600 mt-0.5 animate-pulse">🚀 +${rep.totalBoosterRevenue.toLocaleString()}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className="cursor-pointer hover:bg-indigo-50 p-1 rounded-lg transition-all"
                              title="View Monthly Payout Breakdown"
                              onClick={(e) => { e.stopPropagation(); setSelectedDailyRep(rep); setBreakdownType("payout"); setDailyDetailsOpen(true); }}
                            >
                              <span className={`font-black text-xs ${rep.fullMonthTotalIncentive > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                                ₹{rep.fullMonthTotalIncentive.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Promote Rep"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetRep(rep);
                                  setPromoteRole(rep.role);
                                  setPromoteOpen(true);
                                }}
                              >
                                <ArrowUpCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Link href={`${basePath}/sales/${rep.id}`} onClick={(e) => e.stopPropagation()}>
                                <Button variant="outline" size="sm" title="View Dashboard" className="gap-1.5 h-7 px-2 text-xs">
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Leaderboard Footer */}
            <div className="border-t border-slate-200 bg-slate-50/80 p-4 flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs">
                <span className="text-slate-500 font-medium">Total Incentives: <span className="font-black text-emerald-600 text-sm">₹{leaderboardReps.reduce((s, r) => s + r.monthIncentive, 0).toLocaleString()}</span></span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 font-medium">Target Achievers: <span className="font-black text-emerald-600">{leaderboardReps.filter(r => r.targetCompleted).length}/{leaderboardReps.length}</span></span>
              </div>
              <Button variant="outline" size="sm" className="gap-2 h-8" onClick={exportToCSV}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Metric Breakdown Modal */}
      <Dialog open={dailyDetailsOpen} onOpenChange={(open) => { setDailyDetailsOpen(open); if (!open) setBreakdownType(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              {breakdownType === "daily" && <><TrendingUp className="h-5 w-5 text-blue-600" /> {selectedDailyRep?.role === 'BDT-P' ? 'Monthly' : 'Bi-Weekly'} Consistency Breakdown</>}
              {breakdownType === "streaks" && <><Flame className="h-5 w-5 text-orange-500" /> {selectedDailyRep?.role === 'BDT-P' ? 'Monthly' : 'Bi-Weekly'} Streak Victories</>}
              {breakdownType === "sales" && <><Users className="h-5 w-5 text-indigo-600" /> {selectedDailyRep?.role === 'BDT-P' ? 'Monthly' : 'Bi-Weekly'} Sales Inventory</>}
              {breakdownType === "overachiever" && <><Sparkles className="h-5 w-5 text-violet-600" /> {selectedDailyRep?.role === 'BDT-P' ? 'Monthly' : 'Bi-Weekly'} Over-Achievers</>}
              {breakdownType === "target" && <><Target className="h-5 w-5 text-emerald-600" /> Revenue vs Target Progress</>}
              {breakdownType === "payout" && <><DollarSign className="h-5 w-5 text-amber-600" /> {selectedDailyRep?.role === 'BDT-P' ? 'Monthly' : 'Bi-Weekly'} Incentive Breakdown</>}
            </DialogTitle>
            <DialogDescription>
              Detailed logs for <span className="font-bold text-slate-900">{selectedDailyRep?.name}</span>'s performance in {getMonthName()} {selectedDailyRep?.role !== 'BDT-P' ? `(Half ${biWeeklyCycle})` : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">

            {/* Target & Payout Context Card */}
            {(breakdownType === "target" || breakdownType === "payout") && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl ring-1 ring-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Achieved</p>
                  <p className="text-3xl font-black text-emerald-400">${selectedDailyRep?.achievedAmount?.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Current Target</p>
                  <p className="text-3xl font-black text-slate-800">${selectedDailyRep?.targetAmount?.toLocaleString()}</p>
                </div>
              </div>
            )}

            {breakdownType === "payout" && (
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-amber-200 pb-3">
                  <span className="font-bold text-slate-700">{selectedDailyRep?.role === 'BDT-P' ? 'Monthly' : 'Bi-Weekly'} Payout Breakdown</span>
                  <Badge className="bg-amber-600 text-white font-black">₹{((selectedDailyRep?.slabIncentive || 0) + (selectedDailyRep?.dailyBonus || 0)).toLocaleString()}</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Slab Performance Incentive</p>
                      <p className="text-[10px] text-slate-500">Based on ${selectedDailyRep?.achievedAmount?.toLocaleString()} {selectedDailyRep?.role === 'BDT-P' ? 'monthly' : 'bi-weekly'} revenue</p>
                    </div>
                    <span className="font-black text-emerald-600">₹{selectedDailyRep?.slabIncentive?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Total Accumulted Daily Bonus</p>
                      <p className="text-[10px] text-slate-500">Earned across {selectedDailyRep?.dailySalesCount} active days</p>
                    </div>
                    <span className="font-black text-amber-600">₹{selectedDailyRep?.dailyBonus?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Date-wise Daily Bonus Breakdown */}
                {(() => {
                  const roleConfig = roleConfigs[selectedDailyRep?.role];
                  const dailyBonusLimit = roleConfig?.daily_bonus || 0;
                  if (dailyBonusLimit <= 0) return null;

                  const bonusDays = selectedDailyRep?.dailyDetails?.filter((detail: any) => {
                    const actRev = Number(detail.actual_revenue) || 0;
                    return actRev >= dailyBonusLimit;
                  }) || [];

                  return (
                    <div className="mt-4 border-t border-amber-200/60 pt-4">
                      <span className="font-bold text-slate-700 text-sm block mb-3">Date-wise Validated Shifts</span>
                      {bonusDays.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {bonusDays.sort((a: any, b: any) => b.shift_date.localeCompare(a.shift_date)).map((detail: any, i: number) => {
                            const act = Number(detail.actual_revenue) || 0;
                            const [y, m, d] = detail.shift_date.split("-").map(Number);
                            const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                            return (
                              <div key={i} className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-amber-100/50 hover:bg-amber-100/30 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="bg-amber-100/50 text-amber-700 font-bold px-2 py-0.5 rounded text-[11px] border border-amber-200/50 block w-[60px] text-center">{dateStr}</div>
                                  <span className="text-[10px] text-slate-500">Hit threshold of ${dailyBonusLimit}</span>
                                </div>
                                <span className="font-black text-amber-600 text-sm">₹{act.toLocaleString()}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="bg-white/50 border border-amber-100 text-amber-600/60 p-3 rounded-lg text-center text-xs font-semibold">
                          No daily spot bonuses generated yet.
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            )}

            {/* List based rendering for other metrics */}
            {(breakdownType === "daily" || breakdownType === "sales" || breakdownType === "streaks" || breakdownType === "overachiever") && (
              <div className="space-y-3">
                {(breakdownType === "streaks" ? selectedDailyRep?.monthlyDetails : selectedDailyRep?.dailyDetails)?.sort((a: any, b: any) => b.shift_date.localeCompare(a.shift_date)).map((detail: any, i: number) => {

                  // Filter logic based on breakdown type
                  if (breakdownType === "streaks" && (Number(detail.streak) || 0) === 0) return null;
                  if (breakdownType === "overachiever") {
                    const exp = (detail.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0);
                    const act = Number(detail.actual_revenue) || 0;
                    if (act <= exp || exp === 0) return null;
                  }

                  const dayExpected = (detail.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0);
                  const dayActual = Number(detail.actual_revenue) || 0;
                  const [y, m, d] = detail.shift_date.split("-").map(Number);
                  const completionDate = new Date(y, m - 1, d);
                  const dateStr = completionDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                  return (
                    <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800">{dateStr}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Shift Completion</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {breakdownType === "streaks" && <Badge className="bg-orange-500 text-white font-black text-[10px] uppercase gap-1"><Flame className="h-2.5 w-2.5" /> STREAK HIT</Badge>}

                          {breakdownType === "overachiever" ? (
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Expected</p>
                                <p className="text-xs font-bold text-slate-500">${dayExpected.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Actual</p>
                                <p className="text-xs font-black text-emerald-600">${dayActual.toLocaleString()}</p>
                              </div>
                              <Badge className="bg-violet-600 text-white font-black text-[10px] uppercase gap-1">
                                <Sparkles className="h-2.5 w-2.5" /> +${(dayActual - dayExpected).toLocaleString()}
                              </Badge>
                            </div>
                          ) : (
                            (breakdownType === "daily" || breakdownType === "sales") && (
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Day Revenue</p>
                                  <p className="text-xs font-black text-emerald-600">${dayActual.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">SalesCount</p>
                                  <p className="text-xs font-black text-indigo-600">{detail.actual_awl_ids?.length || 0}</p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* AWL List with Clickable Links */}
                      {(breakdownType === "sales" || breakdownType === "streaks" || breakdownType === "overachiever") && detail.actual_awl_ids?.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                          {detail.actual_awl_ids.map((awl: string, ai: number) => (
                            <a
                              key={ai}
                              href={`https://applywizz-crm-tool.vercel.app/leads/${awl.trim()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5"
                            >
                              <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-mono text-[10px] hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer py-1 px-2 group">
                                {awl}
                                <ExternalLink className="h-2 w-2 opacity-30 group-hover:opacity-100" />
                              </Badge>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" className="w-full font-bold h-12 rounded-xl" onClick={() => setDailyDetailsOpen(false)}>Close Breakdown</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
