"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  DollarSign, Calendar, LogOut, Trophy, ChevronLeft, ChevronRight,
  Loader2, Activity, RefreshCw, TrendingUp, Users, Crown, Percent,
  Award, Zap, BarChart3, Search, Settings, Eye, Sparkles, Download,
  LayoutDashboard, ClipboardList, BookOpen, UserCheck, Plus, Trash2, ExternalLink,
  Target, FileText, Settings2, Flame, Save
} from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AMExpectedRevenueOverview } from "./am-expected-revenue-overview"
import { AccountsSubmittedFormsPanel } from "./accounts-submitted-forms-panel"

interface Props {
  user: any;
  onLogout: () => void;
  basePath?: string;
}

export function CROAccountsDashboard({ user, onLogout, basePath = "/cro-dashboard" }: Props) {
  const router = useRouter()
  const leaderboardRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [amList, setAmList] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [trackerSearch, setTrackerSearch] = useState("")
  const [trackerAM, setTrackerAM] = useState("all")
  const [trackerStatus, setTrackerStatus] = useState("all")
  const [leaderboardSortBy, setLeaderboardSortBy] = useState("revenue")
  const [leaderboardPerformanceFilter, setLeaderboardPerformanceFilter] = useState("all")

  // Pagination for AWL Tracker
  const [trackerCurrentPage, setTrackerCurrentPage] = useState(1)
  const [trackerItemsPerPage, setTrackerItemsPerPage] = useState(20)

  useEffect(() => {
    setTrackerCurrentPage(1)
  }, [trackerSearch, trackerAM, trackerStatus, trackerItemsPerPage])

  // Config editing states
  const [slabRows, setSlabRows] = useState<{ min: string; max: string; incentive: string }[]>([])
  const [multRows, setMultRows] = useState<{ min: string; max: string; multiplier: string }[]>([])
  const [bonusRows, setBonusRows] = useState<{ days: string; threshold: string; bonus: string }[]>([])
  const [savingConfig, setSavingConfig] = useState(false)

  const targetDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset])
  const monthName = useMemo(() => targetDate.toLocaleString("default", { month: "long", year: "numeric" }), [targetDate])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const m = targetDate.getMonth() + 1, y = targetDate.getFullYear()
      const res = await fetch(`/api/accounts-data?month=${m}&year=${y}`)
      const data = await res.json()
      if (data.success) {
        setAmList(data.accountManagers || [])
        setConfig(data.config)
        if (data.config) {
          setSlabRows((data.config.slabRules || []).map((s: any) => ({ min: String(s.min || ''), max: String(s.max || ''), incentive: String(s.incentive) })))
          setMultRows((data.config.multipliers || []).map((m: any) => ({ min: String(m.min), max: String(m.max), multiplier: String(m.multiplier) })))
          setBonusRows((data.config.performanceBonuses || []).map((b: any) => ({ days: String(b.days), threshold: String(b.threshold), bonus: String(b.bonus) })))
        }
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [targetDate])

  useEffect(() => { fetchData() }, [fetchData])

  const activeAMs = amList.filter(a => a.isactive)
  const filteredAMs = useMemo(() => {
    let list = [...activeAMs]
    if (searchQuery) {
      list = list.filter(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || a.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Performance filter (Renewal Rate)
    if (leaderboardPerformanceFilter === "high") {
      list = list.filter(a => (a.renewalRate || 0) >= 80)
    } else if (leaderboardPerformanceFilter === "medium") {
      list = list.filter(a => (a.renewalRate || 0) >= 60 && (a.renewalRate || 0) < 80)
    } else if (leaderboardPerformanceFilter === "low") {
      list = list.filter(a => (a.renewalRate || 0) < 60)
    }

    // Sort
    list.sort((a, b) => {
      if (leaderboardSortBy === "revenue") {
        return (b.monthlyRevenueUSD || 0) - (a.monthlyRevenueUSD || 0)
      } else if (leaderboardSortBy === "renewalRate") {
        return (b.renewalRate || 0) - (a.renewalRate || 0)
      } else if (leaderboardSortBy === "completedRenewals") {
        return (b.successfulRenewals || 0) - (a.successfulRenewals || 0)
      } else if (leaderboardSortBy === "salesCount") {
        return (b.salesCount || 0) - (a.salesCount || 0)
      } else if (leaderboardSortBy === "incentive") {
        return (b.finalIncentive || 0) - (a.finalIncentive || 0)
      }
      return 0
    })

    return list
  }, [activeAMs, searchQuery, leaderboardSortBy, leaderboardPerformanceFilter])

  const filteredTrackerRecords = useMemo(() => {
    const allRecords: any[] = [];

    amList.forEach(am => {
      // 1. Completed renewals this month (am.renewals)
      (am.renewals || []).forEach((r: any) => {
        allRecords.push({
          lead_id: r.lead_id || r.awl_id,
          lead_name: r.lead_name || "",
          awl_id: r.awl_id || r.lead_id || "",
          account_manager_email: r.account_manager_email,
          amName: am.name,
          service_start_date: r.service_start_date,
          subscription_cycle: r.subscription_cycle,
          renewal_extension_days: r.renewal_extension_days,
          expected_renewal_date: r.extended_renewal_at || r.expected_renewal_date || r.closed_at,
          renewal_closed_at: r.closed_at,
          original_sale_value: Number(r.application_sale_value || r.sale_value) || 0,
          renewal_sale_value: Number(r.application_sale_value || r.sale_value) || 0,
          renewed: true
        });
      });

      // 2. Pending renewals (due this month but not completed this month)
      (am.dueThisMonth || []).forEach((d: any) => {
        if (!d.renewed) {
          allRecords.push({
            lead_id: d.lead_id,
            lead_name: d.lead_name || "",
            awl_id: d.awl_id || d.lead_id || "",
            account_manager_email: d.account_manager_email,
            amName: am.name,
            service_start_date: d.service_start_date,
            subscription_cycle: d.subscription_cycle,
            renewal_extension_days: d.renewal_extension_days,
            expected_renewal_date: d.expected_renewal_date,
            renewal_closed_at: null,
            original_sale_value: Number(d.original_sale_value) || 0,
            renewal_sale_value: 0,
            renewed: false
          });
        }
      });
    });

    return allRecords.filter(d => {
      const matchesSearch = trackerSearch ? (
        d.lead_name?.toLowerCase().includes(trackerSearch.toLowerCase()) ||
        (d.awl_id || d.lead_id || "").toLowerCase().includes(trackerSearch.toLowerCase())
      ) : true;

      const matchesAM = trackerAM === "all" || d.amName === trackerAM;

      let matchesStatus = false;
      if (trackerStatus === "all") {
        matchesStatus = true;
      } else if (trackerStatus === "renewed") {
        matchesStatus = d.renewed;
      } else if (trackerStatus === "pending") {
        matchesStatus = !d.renewed;
      } else if (!d.renewed && d.expected_renewal_date) {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expected = new Date(d.expected_renewal_date);
          expected.setHours(0, 0, 0, 0);
          const diffTime = expected.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (trackerStatus === "today") {
             matchesStatus = diffDays === 0;
          } else if (trackerStatus === "1-3") {
             matchesStatus = diffDays >= 1 && diffDays <= 3;
          } else if (trackerStatus === "4-7") {
             matchesStatus = diffDays >= 4 && diffDays <= 7;
          } else if (trackerStatus === "7+") {
             matchesStatus = diffDays > 7;
          } else if (trackerStatus === "overdue") {
             matchesStatus = diffDays < 0;
          }
        } catch(e) {}
      }

      return matchesSearch && matchesAM && matchesStatus;
    }).sort((a, b) => {
      if (a.renewed !== b.renewed) {
        return a.renewed ? 1 : -1;
      }
      if (!a.renewed) {
        return new Date(a.expected_renewal_date).getTime() - new Date(b.expected_renewal_date).getTime();
      } else {
        const dateA = a.renewal_closed_at ? new Date(a.renewal_closed_at).getTime() : 0;
        const dateB = b.renewal_closed_at ? new Date(b.renewal_closed_at).getTime() : 0;
        return dateB - dateA;
      }
    });
  }, [amList, trackerSearch, trackerAM, trackerStatus]);

  const totalRevenue = activeAMs.reduce((s, a) => s + a.monthlyRevenueUSD, 0)
  const totalRenewalRevenue = activeAMs.reduce((s, a) => s + (a.renewalRevenueUSD || 0), 0)
  const totalSalesRevenue = activeAMs.reduce((s, a) => s + (a.salesRevenueUSD || 0), 0)
  const totalIncentive = activeAMs.reduce((s, a) => s + a.finalIncentive, 0)
  const totalRenewals = activeAMs.reduce((s, a) => s + a.totalRenewals, 0)
  const totalSuccess = activeAMs.reduce((s, a) => s + a.successfulRenewals, 0)
  const avgRate = totalRenewals > 0 ? Math.round((totalSuccess / totalRenewals) * 100) : 0
  const topPerformer = [...activeAMs].sort((a, b) => b.monthlyRevenueUSD - a.monthlyRevenueUSD)[0]

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      const slabJson = JSON.stringify(slabRows.map(s => ({ min: Number(s.min), max: Number(s.max), incentive: Number(s.incentive) })))
      const multJson = JSON.stringify(multRows.map(m => ({ min: Number(m.min), max: Number(m.max), multiplier: Number(m.multiplier) })))
      const bonusJson = JSON.stringify(bonusRows.map(b => ({ days: Number(b.days), threshold: Number(b.threshold), bonus: Number(b.bonus) })))
      const updates = [
        { key: "am_slab_rules", value: slabJson },
        { key: "am_renewal_multipliers", value: multJson },
        { key: "am_performance_bonuses", value: bonusJson },
      ]
      for (const u of updates) {
        await supabase.from("accounts_settings").upsert(u, { onConflict: "key" })
      }
      alert("Configuration saved successfully!")
      await fetchData()
    } catch (e: any) {
      alert("Error saving: " + e.message)
    }
    setSavingConfig(false)
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Accounts Dashboard (Admin)</h1>
          <p className="text-slate-600">Track and manage complete Accounts Team performances</p>
        </div>
        <div className="flex gap-4 items-center">
          <Button variant="outline">Profile</Button>
          <Button onClick={onLogout}>Logout</Button>
        </div>
      </div>

      {/* Month Filter */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Accounts Period Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-4 items-center">
            <h2 className="text-md font-semibold text-slate-800 w-48">
              Month: <span className="text-blue-600">{monthName}</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 hover:bg-blue-50/10"
          onClick={() => leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active AMs</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{activeAMs.length}</div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/10"
          onClick={() => leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Renewal Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${totalRenewalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer hover:border-cyan-300 hover:bg-cyan-50/10"
          onClick={() => leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Sales Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">${totalSalesRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 hover:bg-blue-50/10"
          onClick={() => leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Combined Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer hover:border-amber-300 hover:bg-amber-50/10"
          onClick={() => leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Incentives</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₹{totalIncentive.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer hover:border-violet-300 hover:bg-violet-50/10"
          onClick={() => leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Renewal Rate</CardTitle>
            <Percent className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{avgRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Tools */}
      <Tabs defaultValue="tracker" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-4 h-14 bg-white border border-slate-200 shadow-sm mb-6 p-1.5 rounded-xl">
          <TabsTrigger value="tracker" className="rounded-lg font-bold transition-all data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">
            <ClipboardList className="h-4 w-4 mr-2" /> AWL Tracker
          </TabsTrigger>
          <TabsTrigger value="expected_revenue" className="rounded-lg font-bold transition-all data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
            <Flame className="h-4 w-4 mr-2" /> Expected Revenue
          </TabsTrigger>
          <TabsTrigger value="slab" className="rounded-lg font-bold transition-all data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
            <Settings2 className="h-4 w-4 mr-2" /> Slab Rules Config
          </TabsTrigger>
          <TabsTrigger value="submitted_forms" className="rounded-lg font-bold transition-all data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4 mr-2" /> Submitted Forms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="mt-0 focus-visible:ring-0">
          <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-pink-500" />
            <CardHeader>
              <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ClipboardList className="h-5 w-5 text-rose-500" /> AWL Tracker — {monthName}</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500">All clients due for renewal across all Account Managers</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center bg-slate-50/50">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search lead or AWL ID..."
                    value={trackerSearch}
                    onChange={e => setTrackerSearch(e.target.value)}
                    className="pl-9 h-9 text-xs bg-white"
                  />
                </div>

                <Select value={trackerAM} onValueChange={setTrackerAM}>
                  <SelectTrigger className="w-full sm:w-48 h-9 text-xs bg-white">
                    <SelectValue placeholder="Account Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                    {Array.from(new Set(amList.map(a => a.name))).map((name: any) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={trackerStatus} onValueChange={setTrackerStatus}>
                  <SelectTrigger className="w-full sm:w-36 h-9 text-xs bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="renewed">Renewed</SelectItem>
                    <SelectItem value="pending">Pending (All)</SelectItem>
                    <SelectItem value="today">Due Today</SelectItem>
                    <SelectItem value="1-3">Due in 1-3 Days</SelectItem>
                    <SelectItem value="4-7">Due in 4-7 Days</SelectItem>
                    <SelectItem value="7+">Due in >7 Days</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={String(trackerItemsPerPage)} onValueChange={(v) => setTrackerItemsPerPage(Number(v))}>
                  <SelectTrigger className="w-full sm:w-36 h-9 text-xs bg-white">
                    <SelectValue placeholder="Per Page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="30">30 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                    <SelectItem value="200">200 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-rose-500 mr-3" /><span className="text-slate-500">Loading...</span></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead className="font-bold text-[10px] uppercase text-slate-400">#</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-slate-400">AWL ID</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-slate-400">Lead Name</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-slate-400">Account Manager</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-center">Cycle</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-center">Ext. Days</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-slate-400">Renewal Date</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-slate-400">Closed At</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const totalPages = Math.ceil(filteredTrackerRecords.length / trackerItemsPerPage) || 1;
                          const paginatedDue = filteredTrackerRecords.slice((trackerCurrentPage - 1) * trackerItemsPerPage, trackerCurrentPage * trackerItemsPerPage);

                          return paginatedDue.length === 0 ? (
                            <TableRow><TableCell colSpan={9} className="text-center py-12 text-slate-400">No renewals found matching filters</TableCell></TableRow>
                          ) : paginatedDue.map((d: any, i: number) => {
                            let rowClass = d.renewed ? "bg-emerald-50/20" : "";
                            let badgeClass = d.renewed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700";
                            let statusText = d.renewed ? "✓ Renewed" : "⏳ Pending";

                            if (!d.renewed && d.expected_renewal_date) {
                              try {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const expected = new Date(d.expected_renewal_date);
                                expected.setHours(0, 0, 0, 0);
                                const diffTime = expected.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                if (diffDays < 0) {
                                  rowClass = "bg-rose-50 border-rose-100 hover:bg-rose-100/50";
                                  badgeClass = "bg-rose-100 text-rose-700 font-black animate-pulse";
                                  statusText = "🚨 Overdue";
                                } else if (diffDays === 0) {
                                  rowClass = "bg-red-50/50 border-red-100 hover:bg-red-100/40";
                                  badgeClass = "bg-red-100 text-red-700 font-bold";
                                  statusText = "⏳ Due Today";
                                } else if (diffDays <= 3) {
                                  rowClass = "bg-amber-50 border-amber-100 hover:bg-amber-100/50";
                                  badgeClass = "bg-amber-100 text-amber-700 font-semibold";
                                  statusText = "⏳ Due 1-3d";
                                } else if (diffDays <= 7) {
                                  rowClass = "bg-yellow-50/40 border-yellow-100/50 hover:bg-yellow-100/30";
                                  badgeClass = "bg-yellow-100 text-yellow-700 font-semibold";
                                  statusText = "⏳ Due 4-7d";
                                }
                              } catch (e) { }
                            }

                            return (
                              <TableRow key={i} className={rowClass}>
                                <TableCell className="text-xs font-bold text-slate-400">{(trackerCurrentPage - 1) * trackerItemsPerPage + i + 1}</TableCell>
                                <TableCell className="text-xs font-mono font-bold">
                                  <a
                                    href={`https://applywizz-crm-tool.vercel.app/leads/${(d.awl_id || d.lead_id || "").trim()}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 hover:underline decoration-indigo-300 transition-colors"
                                  >
                                    {d.awl_id || d.lead_id}
                                  </a>
                                </TableCell>
                                <TableCell className="text-sm font-bold text-slate-700">{d.lead_name || "—"}</TableCell>
                                <TableCell className="text-xs text-slate-500">{d.amName}</TableCell>
                                <TableCell className="text-xs text-center text-slate-500 font-semibold">{d.subscription_cycle || "—"}</TableCell>
                                <TableCell className="text-xs text-center text-slate-500 font-semibold">{d.renewal_extension_days || "0"}</TableCell>
                                <TableCell className="text-xs text-slate-500">{new Date(d.expected_renewal_date).toLocaleDateString()}</TableCell>
                                <TableCell className="text-xs text-slate-500">{d.renewal_closed_at ? new Date(d.renewal_closed_at).toLocaleDateString() : "—"}</TableCell>
                                <TableCell className="text-center"><Badge className={`border-none text-[10px] ${badgeClass}`}>{statusText}</Badge></TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  {filteredTrackerRecords.length > trackerItemsPerPage && (
                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-xs text-slate-400 font-medium">
                        Showing {(trackerCurrentPage - 1) * trackerItemsPerPage + 1} to {Math.min(trackerCurrentPage * trackerItemsPerPage, filteredTrackerRecords.length)} of {filteredTrackerRecords.length} records
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-semibold"
                          onClick={() => setTrackerCurrentPage(p => Math.max(1, p - 1))}
                          disabled={trackerCurrentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center px-2 text-xs font-bold text-slate-600">
                          Page {trackerCurrentPage} of {Math.ceil(filteredTrackerRecords.length / trackerItemsPerPage) || 1}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-semibold"
                          onClick={() => setTrackerCurrentPage(p => Math.min(Math.ceil(filteredTrackerRecords.length / trackerItemsPerPage) || 1, p + 1))}
                          disabled={trackerCurrentPage === (Math.ceil(filteredTrackerRecords.length / trackerItemsPerPage) || 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="expected_revenue" className="mt-0 focus-visible:ring-0">
          <AMExpectedRevenueOverview monthName={monthName} targetDate={targetDate} />
        </TabsContent>

        <TabsContent value="slab" className="mt-0 focus-visible:ring-0">
          <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/40">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <Settings className="h-4 w-4 text-indigo-500" /> Slab Configuration
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500">
                Define revenue slabs and multipliers for Account Managers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-slate-50/20">

              {/* Slabs */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-500" /> Monthly Revenue Slabs
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Base Incentive Rules</p>
                  </div>
                  <Button size="sm" onClick={() => setSlabRows([{ min: "", max: "", incentive: "" }, ...slabRows])} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 h-8 text-xs font-bold shadow-sm transition-all">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Level
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {slabRows.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">No slabs defined. Click "Add Level" to start.</div>
                  ) : (
                    slabRows.map((row, i) => (
                      <div key={i} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-300 hover:shadow-indigo-100 transition-all duration-300 group">
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-1">Min Threshold (USD)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">$</div>
                            <Input type="number" placeholder="0" value={row.min} onChange={e => { const n = [...slabRows]; n[i].min = e.target.value; setSlabRows(n); }} className="h-9 font-semibold pl-6 bg-white group-hover:bg-white transition-colors" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-1">Max Threshold (USD)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">$</div>
                            <Input type="number" placeholder="3999" value={row.max} onChange={e => { const n = [...slabRows]; n[i].max = e.target.value; setSlabRows(n); }} className="h-9 font-semibold pl-6 bg-white group-hover:bg-white transition-colors" />
                          </div>
                        </div>
                        <div className="flex items-center justify-center px-1 opacity-50"><ChevronRight className="h-4 w-4 text-slate-400" /></div>
                        <div className="flex-[1.2] min-w-[140px]">
                          <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest pl-1 block mb-1">Grant (INR)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-600/60 font-bold text-xs">₹</div>
                            <Input type="number" placeholder="0" value={row.incentive} onChange={e => { const n = [...slabRows]; n[i].incentive = e.target.value; setSlabRows(n); }} className="h-9 border-emerald-200 focus-visible:ring-emerald-500 bg-emerald-50/40 text-emerald-800 font-bold pl-6 transition-colors group-hover:bg-emerald-50/80" />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSlabRows(slabRows.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors h-9 w-9 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Multipliers */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Percent className="h-4 w-4 text-indigo-500" /> Renewal Rate Multipliers
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Scale Incentive Based on Performance</p>
                  </div>
                  <Button size="sm" onClick={() => setMultRows([{ min: "", max: "", multiplier: "" }, ...multRows])} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 h-8 text-xs font-bold shadow-sm transition-all">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Multiplier
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {multRows.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">No multipliers defined.</div>
                  ) : (
                    multRows.map((row, i) => (
                      <div key={i} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-300 hover:shadow-indigo-100 transition-all duration-300 group">
                        <div className="flex-1 min-w-[100px]">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-1">Min Rate (%)</label>
                          <Input type="number" placeholder="50" value={row.min} onChange={e => { const n = [...multRows]; n[i].min = e.target.value; setMultRows(n); }} className="h-9 font-semibold bg-white group-hover:bg-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-1">Max Rate (%)</label>
                          <Input type="number" placeholder="59" value={row.max} onChange={e => { const n = [...multRows]; n[i].max = e.target.value; setMultRows(n); }} className="h-9 font-semibold bg-white group-hover:bg-white transition-colors" />
                        </div>
                        <div className="flex items-center justify-center px-1 opacity-50"><ChevronRight className="h-4 w-4 text-slate-400" /></div>
                        <div className="flex-[1.2] min-w-[120px]">
                          <label className="text-[9px] font-bold text-amber-600 uppercase tracking-widest pl-1 block mb-1">Multiplier</label>
                          <div className="relative">
                            <Input type="number" step="0.01" placeholder="0.75" value={row.multiplier} onChange={e => { const n = [...multRows]; n[i].multiplier = e.target.value; setMultRows(n); }} className="h-9 border-amber-200 focus-visible:ring-amber-500 bg-amber-50/40 text-amber-800 font-bold pr-8 transition-colors group-hover:bg-amber-50/80" />
                            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-amber-600/60 font-bold text-xs">x</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setMultRows(multRows.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors h-9 w-9 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bonuses */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Award className="h-4 w-4 text-indigo-500" /> Performance Bonus (Monthly)
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Fixed Bonuses for Consistent Performers</p>
                  </div>
                  <Button size="sm" onClick={() => setBonusRows([{ days: "", threshold: "", bonus: "" }, ...bonusRows])} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 h-8 text-xs font-bold shadow-sm transition-all">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Bonus
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {bonusRows.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">No bonuses defined.</div>
                  ) : (
                    bonusRows.map((row, i) => (
                      <div key={i} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-300 hover:shadow-indigo-100 transition-all duration-300 group">
                        <div className="flex-1 min-w-[100px]">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-1">Condition (Days)</label>
                          <div className="relative">
                            <Input type="number" placeholder="3" value={row.days} onChange={e => { const n = [...bonusRows]; n[i].days = e.target.value; setBonusRows(n); }} className="h-9 font-semibold bg-white group-hover:bg-white pr-8 transition-colors" />
                            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">+ days</div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-1">Daily Threshold (USD)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">$</div>
                            <Input type="number" placeholder="2000" value={row.threshold} onChange={e => { const n = [...bonusRows]; n[i].threshold = e.target.value; setBonusRows(n); }} className="h-9 font-semibold pl-6 bg-white group-hover:bg-white pr-6 transition-colors" />
                            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">+</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center px-1 opacity-50"><ChevronRight className="h-4 w-4 text-slate-400" /></div>
                        <div className="flex-[1.2] min-w-[140px]">
                          <label className="text-[9px] font-bold text-violet-600 uppercase tracking-widest pl-1 block mb-1">Bonus Grant (INR)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-violet-600/60 font-bold text-xs">₹</div>
                            <Input type="number" placeholder="10000" value={row.bonus} onChange={e => { const n = [...bonusRows]; n[i].bonus = e.target.value; setBonusRows(n); }} className="h-9 border-violet-200 focus-visible:ring-violet-500 bg-violet-50/40 text-violet-800 font-bold pl-6 transition-colors group-hover:bg-violet-50/80" />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setBonusRows(bonusRows.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors h-9 w-9 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button onClick={handleSaveConfig} disabled={savingConfig} className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold h-10 px-6 rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5">
                  {savingConfig ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submitted_forms" className="mt-0 focus-visible:ring-0">
          <AccountsSubmittedFormsPanel monthOffset={monthOffset} />
        </TabsContent>
      </Tabs>

      {/* Leaderboard - Always Visible at Bottom */}
      <Card ref={leaderboardRef} className="border-0 shadow-xl overflow-hidden ring-1 ring-slate-200/50 relative scroll-mt-24 bg-white">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500"></div>
        <CardHeader className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-5">
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
            <CardTitle className="text-lg flex items-center gap-3 font-black tracking-tight">
              <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              Accounts Leaderboard — {monthName}
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px] uppercase tracking-widest">Live Rankings</Badge>
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Select value={leaderboardSortBy} onValueChange={setLeaderboardSortBy}>
                <SelectTrigger className="w-full sm:w-44 h-8 bg-white/10 border-white/20 text-white text-xs">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Sort by Combined Rev</SelectItem>
                  <SelectItem value="renewalRate">Sort by Renewal Rate</SelectItem>
                  <SelectItem value="completedRenewals">Sort by Completed Renewals</SelectItem>
                  <SelectItem value="salesCount">Sort by Sales Count</SelectItem>
                  <SelectItem value="incentive">Sort by Final Incentive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={leaderboardPerformanceFilter} onValueChange={setLeaderboardPerformanceFilter}>
                <SelectTrigger className="w-full sm:w-44 h-8 bg-white/10 border-white/20 text-white text-xs">
                  <SelectValue placeholder="Filter performance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Performers</SelectItem>
                  <SelectItem value="high">High Performers (≥80%)</SelectItem>
                  <SelectItem value="medium">Average Performers (60-79%)</SelectItem>
                  <SelectItem value="low">Needs Improvement (&lt;60%)</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search managers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 pl-4">Account Manager</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Total Renewals</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Completed Renewals</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Pending Renewals</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Sales</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Rate</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">
                    <div className="flex items-center justify-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> Streaks</div>
                  </TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Slab ₹</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Multiplier</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Bonus ₹</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center bg-slate-50 border-l border-slate-100">Renewal Rev</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center bg-slate-50">Sales Rev</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center bg-slate-50">Combined</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center bg-slate-50">Final Inc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={13} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /></TableCell></TableRow>
                ) : filteredAMs.length === 0 ? (
                  <TableRow><TableCell colSpan={13} className="text-center py-12 text-slate-400">No account managers found</TableCell></TableRow>
                ) : (
                  filteredAMs.map((am, i) => {
                    const progressPct = Math.min(100, am.renewalRate || 0);
                    return (
                      <TableRow
                        key={am.email}
                        className={`transition-colors cursor-pointer ${i < 3 ? 'bg-amber-50/20' : ''} hover:bg-teal-50/30`}
                        onClick={() => window.open(`/accounts-dashboard?viewAs=${encodeURIComponent(am.email)}&viewName=${encodeURIComponent(am.name)}`, '_blank')}
                      >
                        <TableCell className="text-center">
                          {i === 0 ? <span className="text-lg">🥇</span> : i === 1 ? <span className="text-lg">🥈</span> : i === 2 ? <span className="text-lg">🥉</span> : <span className="text-xs font-bold text-slate-400">#{i + 1}</span>}
                        </TableCell>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${i < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
                              {am.name?.substring(0, 2)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-800 leading-tight">{am.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{am.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-600">{am.totalRenewals}</TableCell>
                        <TableCell className="text-center font-bold text-indigo-700">{am.successfulRenewals}</TableCell>
                        <TableCell className="text-center font-bold text-amber-700">{am.failedRenewals || 0}</TableCell>
                        <TableCell className="text-center font-bold text-cyan-700">{am.salesCount || 0}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${am.renewalRate >= 80 ? 'bg-emerald-500' : am.renewalRate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className={`text-[9px] font-bold ${am.renewalRate >= 80 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {am.renewalRate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${am.streaks > 0 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'text-slate-300'}`}>
                            <Flame className="h-3 w-3" /> {am.streaks || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-violet-700">₹{(am.baseIncentive || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-center font-bold text-amber-700">{am.renewalMultiplier === 0 ? "❌" : `${am.renewalMultiplier}x`}</TableCell>
                        <TableCell className="text-center font-bold text-blue-600">₹{(am.performanceBonus || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-center font-bold text-emerald-700 bg-slate-50/80 border-l border-slate-100/60">
                          ${(am.renewalRevenueUSD || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-bold text-cyan-700 bg-slate-50/80">
                          ${(am.salesRevenueUSD || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-black text-blue-700 bg-slate-50/80">
                          ${(am.monthlyRevenueUSD || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-black text-teal-700 bg-slate-50/80">
                          ₹{(am.finalIncentive || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
