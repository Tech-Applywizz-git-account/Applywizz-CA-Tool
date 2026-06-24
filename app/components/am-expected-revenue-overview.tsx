"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Flame, TrendingUp, Users, CheckCircle2, XCircle, Clock, Loader2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Sparkles, Eye, AlertCircle, DollarSign, BarChart3,
  Trophy, Target, Search, History, Calendar, LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

interface AMExpectedRevenueOverviewProps {
  monthName: string;
  targetDate: Date;
}

interface EntryGroup {
  email: string;
  name: string;
  id?: string;
  entries: any[];
  totalStreaks: number;
  totalSubmitted: number;
  totalVerified: number;
  totalActualRevenue: number;
  totalActualSales: number;
  totalExpectedRevenue: number;
  totalEdits: number;
  submittedAt?: string;
  lastSaleAt?: string | null;
  isMissedSubmission?: boolean;
}

export function AMExpectedRevenueOverview({ monthName, targetDate }: AMExpectedRevenueOverviewProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [editHistoryEntry, setEditHistoryEntry] = useState<any>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [allAMs, setAllAMs] = useState<any[]>([]);
  const isFirstLoad = useRef(true);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getISTDate = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const getISTDateStr = () => {
    const ist = getISTDate();
    return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
  };

  const [selectedDayStr, setSelectedDayStr] = useState<string>("");

  useEffect(() => {
    const ist = getISTDate();
    if (targetDate.getMonth() === ist.getMonth() && targetDate.getFullYear() === ist.getFullYear()) {
      setSelectedDayStr(getISTDateStr());
    } else {
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      const endStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
      setSelectedDayStr(endStr);
    }
  }, [targetDate]);

  const changeDay = (offset: number) => {
    if (!selectedDayStr) return;
    const d = new Date(selectedDayStr);
    d.setDate(d.getDate() + offset);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDayStr(dateStr);
  };

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from("users")
      .select("id, email, name, isactive")
      .eq("role", "Accounts Associate")
      .eq("isactive", true);

    if (data) {
      setAllAMs(data);
      const map: Record<string, string> = {};
      data.forEach(u => {
        if (u.email) map[u.email.toLowerCase()] = u.id;
      });
      setUserMap(map);
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    if (isFirstLoad.current) setLoading(true);
    try {
      const res = await fetch(`/api/am-expected-revenue?mode=executive&month=${monthStr}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
      }
    } catch (e) {
      console.error("Failed to fetch AM expected revenue overview:", e);
    }
    setLoading(false);
    isFirstLoad.current = false;
  }, [monthStr]);

  useEffect(() => {
    isFirstLoad.current = true;
    fetchUsers();
    fetchEntries();
    const interval = setInterval(fetchEntries, 300000);
    return () => clearInterval(interval);
  }, [fetchEntries, fetchUsers]);

  const activeRepEmails = useMemo(() => new Set(allAMs.map(r => r.email?.toLowerCase()).filter(Boolean)), [allAMs]);

  const filteredEntries = !selectedDayStr
    ? []
    : entries.filter((e) => {
      const lowerEmail = e.email?.toLowerCase();
      if (!lowerEmail || !activeRepEmails.has(lowerEmail)) return false;

      const [y, m, d] = e.shift_date.split("-").map(Number);
      const shiftCompletionDate = new Date(y, m - 1, d + 1);
      const completionStr = shiftCompletionDate.toISOString().split('T')[0];
      return completionStr === selectedDayStr;
    });

  const dedupedEntries = useMemo(() => {
    const map = new Map<string, any>();
    filteredEntries.forEach(e => {
      const lowerEmail = e.email?.toLowerCase();
      const key = `${lowerEmail}|${e.shift_date}`;
      if (!map.has(key)) {
        map.set(key, e);
      } else {
        const existing = map.get(key);
        if (!existing.has_revenue && e.has_revenue) map.set(key, e);
        else if (existing.has_revenue === e.has_revenue && !existing.verified && e.verified) map.set(key, e);
        else if (existing.has_revenue === e.has_revenue && existing.verified === e.verified && (!existing.submitted_at && e.submitted_at)) map.set(key, e);
      }
    });
    return Array.from(map.values());
  }, [filteredEntries]);

  const grouped: EntryGroup[] = [];
  const emailMap = new Map<string, any[]>();
  dedupedEntries.forEach(e => {
    const lowerEmail = e.email?.toLowerCase();
    if (!lowerEmail) return;
    if (!emailMap.has(lowerEmail)) emailMap.set(lowerEmail, []);
    emailMap.get(lowerEmail)!.push(e);
  });

  emailMap.forEach((userEntries, lowerEmail) => {
    const displayEmail = userEntries[0]?.email || lowerEmail;
    const name = userEntries[0]?.name || displayEmail;
    const totalExpRev = userEntries.reduce((sum: number, e: any) => {
      if (!e.has_revenue || !e.sales) return sum;
      return sum + (e.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0);
    }, 0);

    const totalSubmittedAWLs = userEntries.reduce((sum: number, e: any) => sum + (e.sales ? e.sales.length : 0), 0);
    const totalAchievedAWLs = userEntries.reduce((sum: number, e: any) => sum + (e.matched_awl_ids ? e.matched_awl_ids.length : 0), 0);
    const totalActualRev = userEntries.reduce((sum: number, e: any) => sum + (Number(e.actual_revenue) || 0), 0);
    const totalActualSalesCount = userEntries.reduce((sum: number, e: any) => sum + (e.actual_awl_ids ? e.actual_awl_ids.length : 0), 0);
    const totalStreakPoints = userEntries.reduce((sum: number, e: any) => sum + (Number(e.streak) || 0), 0);
    const lastActualSales = userEntries
      .map(e => e.last_actual_sale_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    grouped.push({
      email: displayEmail, name,
      id: userMap[lowerEmail],
      entries: userEntries.sort((a: any, b: any) => b.shift_date.localeCompare(a.shift_date)),
      totalStreaks: totalStreakPoints,
      totalSubmitted: totalSubmittedAWLs,
      totalVerified: totalAchievedAWLs,
      totalActualRevenue: totalActualRev,
      totalActualSales: totalActualSalesCount,
      totalExpectedRevenue: totalExpRev,
      totalEdits: userEntries.reduce((sum: number, e: any) => sum + (e.edit_count || 0), 0),
      submittedAt: userEntries[0]?.submitted_at || userEntries[0]?.created_at,
      lastSaleAt: lastActualSales.length > 0 ? lastActualSales[0] : null,
    });
  });

  const isShiftDeadlinePassed = () => {
    if (!selectedDayStr) return false;
    if (filteredEntries.length === 0) return false;

    const [y, m, d] = selectedDayStr.split("-").map(Number);
    const lockTime = new Date(y, m - 1, d - 1, 22, 0, 0); // 10 PM IST on shift start day
    const ist = getISTDate();
    return ist.getTime() >= lockTime.getTime();
  };

  if (isShiftDeadlinePassed()) {
    grouped.forEach(g => {
      const entry = g.entries[0];
      const isStub = !entry?.submitted_at && entry?.has_revenue === false;
      if (isStub) g.isMissedSubmission = true;
    });

    allAMs.forEach(rep => {
      const lowerEmail = rep.email?.toLowerCase();
      if (lowerEmail && !emailMap.has(lowerEmail)) {
        grouped.push({
          email: rep.email,
          name: rep.name || rep.email,
          id: rep.id,
          entries: [],
          totalStreaks: 0,
          totalSubmitted: 0,
          totalVerified: 0,
          totalActualRevenue: 0,
          totalActualSales: 0,
          totalExpectedRevenue: 0,
          totalEdits: 0,
          isMissedSubmission: true
        });
      }
    });
  }

  // Apply filters
  let displayGroups = grouped;
  if (searchFilter.trim()) {
    const term = searchFilter.toLowerCase();
    displayGroups = displayGroups.filter(g => g.name.toLowerCase().includes(term) || g.email.toLowerCase().includes(term));
  }
  if (statusFilter !== "All") {
    if (statusFilter === "Streak") displayGroups = displayGroups.filter(g => g.totalStreaks > 0);
    else if (statusFilter === "Pending") displayGroups = displayGroups.filter(g => g.entries.some(e => !e.verified && e.has_revenue));
    else if (statusFilter === "Missed") displayGroups = displayGroups.filter(g => g.entries.some(e => e.verified && (Number(e.streak) || 0) === 0 && e.has_revenue));
    else if (statusFilter === "NoRevenue") displayGroups = displayGroups.filter(g => g.entries.every(e => !e.has_revenue));
  }

  if (sortConfig) {
    displayGroups.sort((a, b) => {
      if (a.isMissedSubmission && !b.isMissedSubmission) return 1;
      if (!a.isMissedSubmission && b.isMissedSubmission) return -1;

      let aVal: any, bVal: any;
      if (sortConfig.key === 'accuracy') {
        aVal = a.totalSubmitted > 0 ? (a.totalVerified / a.totalSubmitted) : 0;
        bVal = b.totalSubmitted > 0 ? (b.totalVerified / b.totalSubmitted) : 0;
      } else if (sortConfig.key === 'submittedAt') {
        aVal = a.submittedAt || "0000-00-00";
        bVal = b.submittedAt || "0000-00-00";
      } else {
        aVal = (a as any)[sortConfig.key];
        bVal = (b as any)[sortConfig.key];
      }

      if (typeof aVal === 'string' && sortConfig.key !== 'submittedAt') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (sortConfig.key === 'submittedAt') {
        return sortConfig.direction === 'asc'
          ? new Date(aVal).getTime() - new Date(bVal).getTime()
          : new Date(bVal).getTime() - new Date(aVal).getTime();
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  } else {
    displayGroups.sort((a, b) => {
      if (a.isMissedSubmission && !b.isMissedSubmission) return 1;
      if (!a.isMissedSubmission && b.isMissedSubmission) return -1;
      return b.totalStreaks - a.totalStreaks;
    });
  }

  const totalStreaksGlobal = dedupedEntries.reduce((sum, e) => sum + (Number(e.streak) || 0), 0);
  const totalPending = dedupedEntries.filter(e => !e.verified && e.has_revenue).length;
  const totalExpRevGlobal = dedupedEntries.reduce((sum, e) => {
    if (!e.has_revenue || !e.sales) return sum;
    return sum + (e.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0);
  }, 0);

  const totalActualSalesGlobal = dedupedEntries.reduce((sum, e) => sum + (e.actual_awl_ids?.length || 0), 0);
  const totalActualRevGlobal = dedupedEntries.reduce((sum, e) => sum + (Number(e.actual_revenue) || 0), 0);

  const submittedRepsCount = grouped.filter(g => !g.isMissedSubmission).length;
  const achievedRepsCount = grouped.filter(g => g.totalStreaks > 0 && !g.isMissedSubmission).length;

  const globalSubmittedAWLs = dedupedEntries.reduce((sum, e) => sum + (e.sales?.length || 0), 0);
  const globalAchievedAWLs = dedupedEntries.reduce((sum, e) => sum + (e.matched_awl_ids?.length || 0), 0);
  const globalAccuracy = globalSubmittedAWLs > 0 ? Math.round((globalAchievedAWLs / globalSubmittedAWLs) * 100) : 0;

  return (
    <Card className="border-0 shadow-xl overflow-hidden ring-1 ring-slate-200/50 hover:ring-orange-300 transition-all duration-500">
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400"></div>
      <CardHeader
        className="transition-all duration-500 relative overflow-hidden bg-gradient-to-br from-orange-900/95 via-amber-900 to-orange-800 text-white py-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        <div className="absolute top-0 right-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl shadow-inner transition-colors duration-500 bg-white/10 border border-white/20">
              <Flame className="h-6 w-6 text-orange-200" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                AM Expected Renewal Tracker
                <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold uppercase tracking-widest text-[10px]">Real-time Audit</Badge>
              </CardTitle>
              <p className="text-sm mt-1.5 font-medium max-w-lg leading-relaxed text-orange-100/80">
                Auditing {monthName} expected vs actual figures. Shift completion boundaries applied.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
              <Button variant="ghost" size="icon" onClick={() => changeDay(-1)} className="h-8 w-8 text-white hover:bg-white/20"><ChevronLeft className="h-4 w-4" /></Button>
              <div className="flex flex-col items-center min-w-[120px]">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-orange-200">Production Day</span>
                <span className="text-sm font-black flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" /> {selectedDayStr}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => changeDay(1)} className="h-8 w-8 text-white hover:bg-white/20"><ChevronRight className="h-4 w-4" /></Button>
              <div className="h-6 w-[1px] bg-white/20 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDayStr(getISTDateStr())}
                className="h-8 text-[10px] font-black uppercase text-amber-200 hover:bg-white/10 px-2"
              >
                Today
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-white">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-3" />
              <span className="text-slate-500 font-medium">Loading prediction data...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 p-5 bg-slate-50/50 border-b border-slate-100">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Business Day</span>
                  <h2 className="text-lg font-black text-indigo-700 tracking-tight">{selectedDayStr}</h2>
                  <p className="text-[8px] text-indigo-300 font-bold uppercase mt-0.5">8PM (Prev) - 8PM (Today)</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Achieved / Submitted AMs</p>
                  <p className="text-2xl font-black text-indigo-600">{achievedRepsCount} / {submittedRepsCount}</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-xl border border-indigo-100 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-tight">Actual Total Renewals</p>
                  <p className="text-2xl font-black text-indigo-700">{totalActualSalesGlobal}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Total Actual Rev</p>
                  <p className="text-2xl font-black text-violet-600">${totalActualRevGlobal.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-xl border border-orange-100 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-tight">Streaks</p>
                  <p className="text-2xl font-black text-orange-600 flex items-center justify-center gap-1">
                    <Flame className="h-5 w-5" /> {totalStreaksGlobal}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Expected Rev</p>
                  <p className="text-2xl font-black text-emerald-600">${totalExpRevGlobal.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-xl border shadow-sm text-center ${globalAccuracy >= 80 ? 'bg-emerald-50 border-emerald-100' : globalAccuracy >= 50 ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Accuracy</p>
                  <p className={`text-2xl font-black ${globalAccuracy >= 80 ? 'text-emerald-600' : globalAccuracy >= 50 ? 'text-amber-600' : 'text-slate-600'}`}>
                    {globalSubmittedAWLs > 0 ? `${globalAccuracy}%` : '—'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100 bg-white">
                <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search by name or email..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-9 bg-white h-9 text-sm" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9 bg-white text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Streak">🔥 Streaks</SelectItem>
                    <SelectItem value="Pending">⏳ Pending</SelectItem>
                    <SelectItem value="Missed">❌ Missed</SelectItem>
                    <SelectItem value="NoRevenue">📭 No Revenue</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-slate-400 font-medium ml-auto">{displayGroups.length} of {grouped.length} AMs</span>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="w-12 text-slate-400 font-bold">#</TableHead>
                      <TableHead className="font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('submittedAt')}>
                        <div className="flex items-center gap-1">Account Manager <div className="text-[10px] text-slate-300">↕</div></div>
                      </TableHead>
                      <TableHead className="text-center font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('totalSubmitted')}>
                        <div className="flex items-center justify-center gap-1">Submitted <div className="text-[10px] text-slate-300">↕</div></div>
                      </TableHead>
                      <TableHead className="text-center font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('totalActualSales')}>
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-indigo-500" /> Sales <div className="text-[10px] text-slate-300">↕</div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('totalStreaks')}>
                        <div className="flex items-center justify-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" /> Streaks <div className="text-[10px] text-slate-300">↕</div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('totalExpectedRevenue')}>
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="h-3 w-3 text-emerald-500" /> Expected <div className="text-[10px] text-slate-300">↕</div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('totalActualRevenue')}>
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3 text-violet-500" /> Actual <div className="text-[10px] text-slate-300">↕</div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('accuracy')}>
                        <div className="flex items-center justify-center gap-1">Accuracy <div className="text-[10px] text-slate-300">↕</div></div>
                      </TableHead>
                      <TableHead className="text-center font-bold cursor-pointer hover:bg-slate-100" onClick={() => requestSort('totalEdits')}>
                        <div className="flex items-center justify-center gap-1">
                          <Target className="h-3 w-3 text-violet-500" /> Edits <div className="text-[10px] text-slate-300">↕</div>
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayGroups.map((g, index) => {
                      const accuracy = g.totalSubmitted > 0 ? Math.round((g.totalVerified / g.totalSubmitted) * 100) : 0;
                      const allMatched = g.totalSubmitted > 0 && g.totalVerified === g.totalSubmitted;
                      const pendingCount = g.entries.filter(e => !e.verified && e.has_revenue).length;
                      return (
                        <TableRow key={g.email} className={`transition-colors ${g.isMissedSubmission ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-orange-50/30'}`}>
                          <TableCell className={`${g.isMissedSubmission ? 'text-red-400' : 'text-slate-400'} text-xs font-bold`}>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${g.isMissedSubmission ? 'bg-red-200 text-red-700' :
                                g.totalStreaks >= 5 ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white' :
                                  g.totalStreaks >= 3 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {g.totalStreaks >= 3 ? <Flame className="h-4 w-4" /> : g.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <p className={`font-bold leading-none ${g.isMissedSubmission ? 'text-red-900' : 'text-slate-900'}`}>{g.name}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <p className={`text-[10px] ${g.isMissedSubmission ? 'text-red-500' : 'text-slate-400'}`}>{g.email}</p>
                                  {g.submittedAt && !g.isMissedSubmission && (
                                    <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1 rounded flex items-center gap-1 shrink-0" title="Submitted at (IST)">
                                      <Clock className="w-2 h-2" />
                                      {(() => {
                                        const d = new Date(g.submittedAt);
                                        if (isNaN(d.getTime())) return '';
                                        return d.toLocaleTimeString('en-IN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true,
                                          timeZone: 'Asia/Kolkata'
                                        });
                                      })()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-slate-700">{g.totalSubmitted}</TableCell>
                          <TableCell className="text-center font-bold text-indigo-600">
                            <div className="flex flex-col items-center">
                              {g.totalActualSales}
                              {g.totalVerified > 0 && (
                                <Badge className="bg-blue-100 text-blue-700 border-0 text-[8px] py-0 px-1 mt-0.5">{g.totalVerified} Matched</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`border-0 font-bold ${g.totalStreaks > 0 ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {g.totalStreaks > 0 && <Flame className="h-3 w-3 mr-1" />}
                              {g.totalStreaks}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-emerald-600">${g.totalExpectedRevenue.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-violet-600">${g.totalActualRevenue.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className={`font-extrabold ${accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-600' : accuracy > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {g.totalSubmitted > 0 ? `${g.totalVerified}/${g.totalSubmitted} (${accuracy}%)` : '—'}
                              </span>
                              {!allMatched && pendingCount > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px] mt-1">{pendingCount} pending</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {g.totalEdits > 0 ? (
                              <Badge
                                className="bg-violet-100 text-violet-700 border-0 font-bold text-xs gap-1 cursor-pointer hover:bg-violet-200 transition-colors"
                                onClick={() => setEditHistoryEntry(g)}
                              >
                                ✏️ {g.totalEdits}
                              </Badge>
                            ) : (
                              <span className="text-slate-300 font-bold text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-1"
                              onClick={() => setSelectedEntry(g)}>
                              <Eye className="h-4 w-4" /> Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        {/* Rep Detail Dialog */}
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-black text-slate-800">
                <Users className="h-5 w-5 text-indigo-500" /> {selectedEntry?.name}'s Performance Detail
              </DialogTitle>
              <DialogDescription>Detailed breakdown of predictions, streaks, and revenue for this account manager.</DialogDescription>
            </DialogHeader>

            {selectedEntry && (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Submitted</p>
                    <p className="text-lg font-black text-indigo-600">{selectedEntry.totalSubmitted}</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-lg text-center border border-orange-100">
                    <p className="text-[9px] text-orange-500 font-bold uppercase">Streaks</p>
                    <p className="text-lg font-black text-orange-600">{selectedEntry.totalStreaks}</p>
                  </div>
                  <div className="bg-violet-50 p-2 rounded-lg text-center border border-violet-100">
                    <p className="text-[9px] text-violet-500 font-bold uppercase">Actual Rev</p>
                    <p className="text-lg font-black text-violet-600">${selectedEntry.totalActualRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg text-center border border-emerald-100">
                    <p className="text-[9px] text-emerald-500 font-bold uppercase">Expected Rev</p>
                    <p className="text-lg font-black text-emerald-600">${selectedEntry.totalExpectedRevenue.toLocaleString()}</p>
                  </div>
                </div>

                {selectedEntry.entries.map((e: any, idx: number) => {
                  const streakCount = Number(e.streak) || 0;
                  const submittedCount = e.sales?.length || 0;
                  const allMatched = submittedCount > 0 && streakCount === submittedCount;
                  return (
                    <div key={idx} className={`p-4 rounded-xl border transition-all ${allMatched ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200' :
                      e.verified && streakCount === 0 && e.has_revenue ? 'bg-red-50/50 border-red-200' :
                        streakCount > 0 && !allMatched ? 'bg-amber-50/30 border-amber-200' :
                          !e.verified && e.has_revenue ? 'bg-amber-50/50 border-amber-200' :
                            'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">
                            {(() => {
                              const [y, m, d] = e.shift_date.split("-").map(Number);
                              const completionDate = new Date(y, m - 1, d + 1);
                              return completionDate.toISOString().split('T')[0];
                            })()}
                          </span>
                          {allMatched && <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-[10px] gap-0.5"><Flame className="h-2.5 w-2.5" /> {streakCount}/{submittedCount}</Badge>}
                          {streakCount > 0 && !allMatched && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] gap-0.5"><Flame className="h-2.5 w-2.5" /> {streakCount}/{submittedCount}</Badge>}
                          {e.verified && streakCount === 0 && e.has_revenue && <Badge className="bg-red-100 text-red-600 border-0 text-[10px]">Missed</Badge>}
                          {!e.verified && streakCount === 0 && e.has_revenue && <Badge className="bg-amber-100 text-amber-600 border-0 text-[10px]">Pending</Badge>}
                          {!e.has_revenue && <Badge variant="secondary" className="text-[10px]">No Revenue</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          {e.has_revenue && e.sales?.length > 0 && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              ${(e.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0)} expected
                            </span>
                          )}
                          {Number(e.actual_revenue) > 0 && (
                            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                              ${Number(e.actual_revenue).toLocaleString()} actual
                            </span>
                          )}
                        </div>
                      </div>

                      {e.has_revenue && e.sales?.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <h4 className="font-bold text-slate-700 text-xs flex items-center gap-2 uppercase tracking-wider">
                            <Target className="h-3 w-3 text-emerald-500" /> Predictions
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {e.sales.map((s: any, si: number) => {
                              const matched = e.matched_awl_ids?.includes(s.awl_id?.trim().toUpperCase());
                              return (
                                <div key={si} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${matched ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                  e.verified ? 'bg-red-50 border-red-200 text-red-600' :
                                    'bg-white border-slate-200 text-slate-600'
                                  }`}>
                                  <a href={`https://applywizz-crm-tool.vercel.app/leads/${s.awl_id?.trim()}`} target="_blank" rel="noopener noreferrer" className="font-mono hover:underline hover:text-indigo-600 transition-colors" onClick={(ev) => ev.stopPropagation()}>
                                    {s.awl_id}
                                  </a>
                                  <span className="text-slate-400">|</span>
                                  <span>${s.expected_revenue}</span>
                                  {(e.verified || matched) && (matched ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {e.actual_awl_ids && e.actual_awl_ids.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-bold text-slate-700 text-xs flex items-center gap-2 uppercase tracking-wider">
                            <Users className="h-3 w-3 text-indigo-500" /> All Actual Sales (8PM - 8PM)
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {e.actual_awl_ids.map((id: string, si: number) => {
                              const isPredicted = e.matched_awl_ids?.includes(id);
                              const revData = e.actual_sales_data?.find((as: any) => as.awl_id === id);
                              return (
                                <div key={si} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${isPredicted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                                  }`}>
                                  {isPredicted ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Sparkles className="h-3 w-3 text-indigo-400" />}
                                  <a href={`https://applywizz-crm-tool.vercel.app/leads/${id.trim()}`} target="_blank" rel="noopener noreferrer" className="font-mono hover:underline hover:text-indigo-600 transition-colors" onClick={(ev) => ev.stopPropagation()}>
                                    {id}
                                  </a>
                                  <div className="flex items-center gap-2 border-l border-slate-200 pl-2 ml-1">
                                    {revData && <span className="text-slate-500">${revData.revenue}</span>}
                                    <Badge className={`${isPredicted ? 'bg-emerald-100/50 text-emerald-700' : 'bg-white/50 text-blue-600'} border-0 text-[10px] px-1 py-0 font-bold`}>
                                      {isPredicted ? 'Predicted' : 'Unpredicted Renewal'}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit History Dialog */}
        <Dialog open={!!editHistoryEntry} onOpenChange={() => setEditHistoryEntry(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg">
                <History className="h-5 w-5 text-violet-500" />
                Edit History — {editHistoryEntry?.name}
              </DialogTitle>
              <DialogDescription>
                All previous edits for {selectedDayStr} with AWL IDs and sale values.
              </DialogDescription>
            </DialogHeader>

            {editHistoryEntry && (
              <div className="space-y-3 mt-2">
                {editHistoryEntry.entries.map((entry: any, idx: number) => {
                  const history = entry.edit_history || [];
                  if (history.length === 0 && (entry.edit_count || 0) === 0) return null;
                  return (
                    <div key={idx} className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {(() => {
                          const [y, m, d] = entry.shift_date.split("-").map(Number);
                          const completionDate = new Date(y, m - 1, d + 1);
                          return completionDate.toISOString().split('T')[0];
                        })()}
                      </p>

                      {/* Current version */}
                      <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px]">Current Version</Badge>
                          <span className="text-[10px] text-slate-500">{new Date(entry.submitted_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                        </div>
                        {entry.has_revenue && entry.sales?.length > 0 ? (
                          <div className="space-y-1">
                            {entry.sales.map((s: any, si: number) => (
                              <div key={si} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                                <a href={`https://applywizz-crm-tool.vercel.app/leads/${s.awl_id?.trim()}`} target="_blank" rel="noopener noreferrer" className="font-mono font-bold text-slate-700 hover:text-indigo-600 hover:underline transition-colors" onClick={(e) => e.stopPropagation()}>
                                  {s.awl_id}
                                </a>
                                <span className="font-bold text-emerald-600">${s.expected_revenue}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No revenue predicted</p>
                        )}
                      </div>

                      {/* Previous versions */}
                      {history.length > 0 && history.slice().reverse().map((h: any, hi: number) => (
                        <div key={hi} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-slate-200 text-slate-600 border-0 text-[10px]">Edit #{history.length - hi}</Badge>
                            <span className="text-[10px] text-slate-500">{new Date(h.edited_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                          </div>
                          {h.previous_has_revenue && h.previous_sales?.length > 0 ? (
                            <div className="space-y-1">
                              {h.previous_sales.map((s: any, si: number) => (
                                <div key={si} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                                  <a href={`https://applywizz-crm-tool.vercel.app/leads/${s.awl_id?.trim()}`} target="_blank" rel="noopener noreferrer" className="font-mono font-bold text-slate-500 hover:text-indigo-600 hover:underline transition-colors" onClick={(e) => e.stopPropagation()}>
                                    {s.awl_id}
                                  </a>
                                  <span className="font-bold text-slate-500">${s.expected_revenue}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No revenue predicted</p>
                          )}
                        </div>
                      ))}

                      {history.length === 0 && (entry.edit_count || 0) > 0 && (
                        <p className="text-xs text-slate-400 italic p-2">Edit history not available for older edits (tracking started recently).</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
