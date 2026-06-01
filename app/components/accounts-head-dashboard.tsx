"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Flame, DollarSign, Calendar, LogOut, Trophy, ChevronLeft, ChevronRight,
  Loader2, Activity, RefreshCw, TrendingUp, Users, Crown, Percent,
  Award, Zap, BarChart3, Search, Settings, Eye, Sparkles, Download,
  LayoutDashboard, ClipboardList, BookOpen, UserCheck, Plus, Trash2, ExternalLink
} from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AccountsSubmittedFormsPanel } from "./accounts-submitted-forms-panel"
import { AMExpectedRevenueOverview } from "./am-expected-revenue-overview"

interface Props { user: any; onLogout: () => void }
type TabType = "overview" | "leaderboard" | "awl_tracker" | "directory" | "submitted_forms" | "config"

export function AccountsHeadDashboard({ user, onLogout }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [amList, setAmList] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [leaderboardSortBy, setLeaderboardSortBy] = useState("revenue")
  const [leaderboardPerformanceFilter, setLeaderboardPerformanceFilter] = useState("all")
  const [selectedAM, setSelectedAM] = useState<any>(null)
  const [trackerSearch, setTrackerSearch] = useState("")
  const [trackerAM, setTrackerAM] = useState("all")
  const [trackerStatus, setTrackerStatus] = useState("all")
  const [trackerCurrentPage, setTrackerCurrentPage] = useState(1)
  const [trackerItemsPerPage, setTrackerItemsPerPage] = useState(20)

  useEffect(() => {
    setTrackerCurrentPage(1)
  }, [trackerSearch, trackerAM, trackerStatus, trackerItemsPerPage])

  // Config editing — structured arrays instead of raw JSON
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
          setSlabRows((data.config.slabRules || []).map((s: any) => ({ min: String(s.min || ""), max: String(s.max || ""), incentive: String(s.incentive || "") })))
          setMultRows((data.config.multipliers || []).map((m: any) => ({ min: String(m.min || ""), max: String(m.max || ""), multiplier: String(m.multiplier || "") })))
          setBonusRows((data.config.performanceBonuses || []).map((b: any) => ({ days: String(b.days), threshold: String(b.threshold), bonus: String(b.bonus) })))
        }
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [targetDate])

  const handleRecalculateAll = async () => {
    setRecalculating(true)
    const m = targetDate.getMonth() + 1, y = targetDate.getFullYear()
    for (const am of amList) {
      try {
        await fetch(`/api/calculate-accounts-incentives?email=${encodeURIComponent(am.email)}&month=${m}&year=${y}`)
      } catch (e) { console.error(e) }
    }
    await fetchData()
    setRecalculating(false)
  }

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

  const handleToggleAMStatus = async (email: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ isactive: !currentStatus })
        .eq("email", email)

      if (error) throw error

      alert(`Status updated successfully!`)
      await fetchData()
    } catch (e: any) {
      alert("Error updating status: " + e.message)
    }
  }

  useEffect(() => { fetchData() }, [fetchData])

  const activeAMs = amList.filter(a => a.isactive)
  const filteredAMs = useMemo(() => {
    let list = [...activeAMs]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(a => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q))
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

  const totalRevenue = activeAMs.reduce((s, a) => s + (a.monthlyRevenueUSD || 0), 0)
  const totalRenewalRevenue = activeAMs.reduce((s, a) => s + (a.renewalRevenueUSD || 0), 0)
  const totalSalesRevenue = activeAMs.reduce((s, a) => s + (a.salesRevenueUSD || 0), 0)
  const totalRenewals = activeAMs.reduce((s, a) => s + (a.totalRenewals || 0), 0)
  const totalSuccess = activeAMs.reduce((s, a) => s + (a.successfulRenewals || 0), 0)
  const avgRate = totalRenewals > 0 ? ((totalSuccess / totalRenewals) * 100).toFixed(1) : "0"
  const totalIncentive = activeAMs.reduce((s, a) => s + (a.finalIncentive || 0), 0)
  const topPerformer = filteredAMs[0] || null

  const handleExportCSV = () => {
    const headers = ["#", "Name", "Email", "Revenue ($)", "Total", "Paid", "Rate %", "Base ₹", "Multiplier", "Bonus ₹", "Final ₹"]
    const rows = filteredAMs.map((a, i) => [i + 1, a.name, a.email, a.monthlyRevenueUSD, a.totalRenewals, a.successfulRenewals, a.renewalRate, a.baseIncentive, a.renewalMultiplier, a.performanceBonus, a.finalIncentive])
    const csv = [headers.join(","), ...rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `accounts_${monthName.replace(" ", "_")}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "awl_tracker", label: "AWL Tracker", icon: ClipboardList },
    { id: "directory", label: "Accounts Directory", icon: UserCheck },
    { id: "submitted_forms", label: "Submitted Forms", icon: ClipboardList },
    { id: "config", label: "Slab Config", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-cyan-50/20">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 shadow-lg shadow-teal-500/25">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">Accounts Head Command Center</h1>
              <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-500" /> Monitoring {activeAMs.length} Account Manager{activeAMs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-1.5 py-1 rounded-xl border border-slate-200/60 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonthOffset(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-1.5 px-3 min-w-[160px] justify-center">
              <Calendar className="h-3.5 w-3.5 text-teal-500" />
              <span className="text-sm font-black text-slate-700">{monthName}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonthOffset(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            {monthOffset !== 0 && <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black text-teal-600" onClick={() => setMonthOffset(0)}>Today</Button>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-teal-50 to-cyan-50 px-3 py-1.5 rounded-full border border-teal-200/50">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-black text-[10px] uppercase">{user.name?.substring(0, 2)}</div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-700">{user.name}</p>
                <p className="text-[9px] text-teal-500 font-bold">Accounts Head</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 pb-0">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-white text-teal-600 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] border border-b-0 border-slate-200/60" : "text-slate-400 hover:text-slate-600 hover:bg-white/40"}`}>
                <tab.icon className="h-3.5 w-3.5" />{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* AM Detail Modal */}
        <Dialog open={!!selectedAM} onOpenChange={() => setSelectedAM(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{selectedAM?.name} — {monthName}</DialogTitle></DialogHeader>
            {selectedAM && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-400 font-bold">Renewal Revenue</p><p className="font-black text-emerald-700">${(selectedAM.renewalRevenueUSD || 0).toLocaleString()}</p></div>
                  <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-400 font-bold">Sales Revenue</p><p className="font-black text-cyan-700">${(selectedAM.salesRevenueUSD || 0).toLocaleString()}</p></div>
                  <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-400 font-bold">Combined Revenue</p><p className="font-black text-blue-700">${selectedAM.monthlyRevenueUSD.toLocaleString()}</p></div>
                  <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-400 font-bold">Renewal Rate</p><p className="font-black text-violet-700">{selectedAM.renewalRate}%</p></div>
                  <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-400 font-bold">Renewals</p><p className="font-black">{selectedAM.successfulRenewals}/{selectedAM.totalRenewals}</p></div>
                  <div className="bg-teal-50 rounded-lg p-3"><p className="text-[10px] text-teal-500 font-bold">Final Incentive</p><p className="font-black text-teal-700">₹{selectedAM.finalIncentive.toLocaleString()}</p></div>
                </div>
                <p className="text-xs text-slate-500">Base ₹{selectedAM.baseIncentive.toLocaleString()} × {selectedAM.renewalMultiplier}x + Bonus ₹{selectedAM.performanceBonus.toLocaleString()}</p>
                {selectedAM.renewals?.length > 0 && (
                  <Table>
                    <TableHeader><TableRow><TableHead className="text-[10px]">Lead</TableHead><TableHead className="text-[10px]">AWL</TableHead><TableHead className="text-[10px] text-right">Value</TableHead><TableHead className="text-[10px] text-center">Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedAM.renewals.slice(0, 20).map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{r.lead_name || "—"}</TableCell>
                          <TableCell className="text-xs font-mono">{r.lead_id}</TableCell>
                          <TableCell className="text-xs text-right font-bold">${r.application_sale_value || 0}</TableCell>
                          <TableCell className="text-center"><Badge className={`text-[9px] border-none ${(r.finance_status || "").toLowerCase() === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{r.finance_status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {activeTab === "overview" && (
          <>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search account managers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportCSV} className="gap-1.5 text-xs font-bold"><Download className="h-3.5 w-3.5" />Export CSV</Button>
                <Button onClick={handleRecalculateAll} disabled={recalculating} className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white gap-2 shadow-lg">
                  {recalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {recalculating ? "Recalculating..." : "Recalculate All"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Active AMs", value: activeAMs.length, icon: Users, color: "rose", extra: "" },
                { label: "Combined Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "emerald", extra: `Renewals: $${totalRenewalRevenue.toLocaleString()} • Sales: $${totalSalesRevenue.toLocaleString()}` },
                { label: "Renewals", value: `${totalSuccess}/${totalRenewals}`, icon: TrendingUp, color: "blue", extra: "" },
                { label: "Avg Rate", value: `${avgRate}%`, icon: Percent, color: "violet", extra: "" },
              ].map((s, i) => (
                <Card key={i} className="backdrop-blur-md bg-white/70 border border-white/40 overflow-hidden group hover:shadow-lg transition-all">
                  <div className={`h-1 w-full bg-gradient-to-r from-${s.color}-500 to-${s.color}-400`} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div><p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{s.label}</p><p className={`text-xl font-black text-slate-800 mt-1 ${i === 4 ? "text-sm truncate" : ""}`}>{s.value}</p></div>
                      <div className={`p-2 rounded-xl bg-${s.color}-100/80`}><s.icon className={`h-5 w-5 text-${s.color}-600`} /></div>
                    </div>
                    {s.extra && <p className="text-[10px] font-bold text-teal-600 mt-2">{s.extra}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Expected Revenue */}
            <AMExpectedRevenueOverview monthName={monthName} targetDate={targetDate} />
          </>
        )}

        {activeTab === "leaderboard" && (
          <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-teal-500 to-cyan-500" />
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5"><Trophy className="h-5 w-5 text-amber-500" /> Performance Leaderboard — {monthName}</CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 mt-1">Ranked by renewal revenue • Incentive Pool: ₹{totalIncentive.toLocaleString()}</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                  <Select value={leaderboardSortBy} onValueChange={setLeaderboardSortBy}>
                    <SelectTrigger className="w-full sm:w-44 h-8 text-xs bg-white border-slate-200">
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
                    <SelectTrigger className="w-full sm:w-44 h-8 text-xs bg-white border-slate-200">
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
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search managers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-8 text-xs bg-white border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-teal-500 mr-3" /><span className="text-slate-500">Loading...</span></div>
              ) : filteredAMs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-medium">No account managers found.</div>
              ) : (
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
                      {filteredAMs.map((am, i) => {
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
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "awl_tracker" && (() => {
          const allDue: any[] = [];
          amList.forEach(am => {
            // 1. Completed renewals this month (am.renewals)
            (am.renewals || []).forEach((r: any) => {
              allDue.push({
                lead_id: r.lead_id || r.awl_id,
                lead_name: r.lead_name || "",
                awl_id: r.awl_id || r.lead_id || "",
                account_manager_email: r.account_manager_email,
                amName: am.name,
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
                allDue.push({
                  lead_id: d.lead_id,
                  lead_name: d.lead_name || "",
                  awl_id: d.awl_id || d.lead_id || "",
                  account_manager_email: d.account_manager_email,
                  amName: am.name,
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

          const filteredDue = allDue.filter(d => {
            const matchesSearch = trackerSearch ? (
              d.lead_name?.toLowerCase().includes(trackerSearch.toLowerCase()) ||
              (d.awl_id || d.lead_id || "").toLowerCase().includes(trackerSearch.toLowerCase())
            ) : true;

            const matchesAM = trackerAM === "all" || d.amName === trackerAM;

            const matchesStatus = trackerStatus === "all" || (
              trackerStatus === "renewed" ? d.renewed : !d.renewed
            );

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

          const totalPages = Math.ceil(filteredDue.length / trackerItemsPerPage) || 1;
          const paginatedDue = filteredDue.slice((trackerCurrentPage - 1) * trackerItemsPerPage, trackerCurrentPage * trackerItemsPerPage);

          return (
            <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-pink-500" />
              <CardHeader><CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ClipboardList className="h-5 w-5 text-rose-500" /> AWL Tracker — {monthName}</CardTitle>
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
                      <SelectItem value="pending">Pending</SelectItem>
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
                          {paginatedDue.length === 0 ? (
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
                                <TableCell className="text-xs font-mono font-bold text-indigo-600">{d.awl_id || d.lead_id}</TableCell>
                                <TableCell className="text-sm font-bold text-slate-700">{d.lead_name || "—"}</TableCell>
                                <TableCell className="text-xs text-slate-500">{d.amName}</TableCell>
                                <TableCell className="text-xs text-center text-slate-500 font-semibold">{d.subscription_cycle || "—"}</TableCell>
                                <TableCell className="text-xs text-center text-slate-500 font-semibold">{d.renewal_extension_days || "0"}</TableCell>
                                <TableCell className="text-xs text-slate-500">{new Date(d.expected_renewal_date).toLocaleDateString()}</TableCell>
                                <TableCell className="text-xs text-slate-500">{d.renewal_closed_at ? new Date(d.renewal_closed_at).toLocaleDateString() : "—"}</TableCell>
                                <TableCell className="text-center"><Badge className={`border-none text-[10px] ${badgeClass}`}>{statusText}</Badge></TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredDue.length > trackerItemsPerPage && (
                      <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-medium">
                          Showing {(trackerCurrentPage - 1) * trackerItemsPerPage + 1} to {Math.min(trackerCurrentPage * trackerItemsPerPage, filteredDue.length)} of {filteredDue.length} records
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
                            Page {trackerCurrentPage} of {totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold"
                            onClick={() => setTrackerCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={trackerCurrentPage === totalPages}
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
          );
        })()}

        {activeTab === "directory" && (
          <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-blue-500" />
            <CardHeader><CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5"><UserCheck className="h-5 w-5 text-indigo-500" /> Accounts Force Directory</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500">All Account Managers and their status</CardDescription>
            </CardHeader>
            <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50/80">
              <TableHead className="font-bold text-[10px] uppercase text-slate-400">#</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-400">Name</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-400">Email</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-400">Role</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-center">Status</TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-center">Actions</TableHead>
            </TableRow></TableHeader><TableBody>
                {amList.map((am, i) => (
                  <TableRow key={am.email}>
                    <TableCell className="text-xs font-bold text-slate-400">{i + 1}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black">{am.name?.substring(0, 2)?.toUpperCase()}</div><span className="font-bold text-sm text-slate-800">{am.name}</span></div></TableCell>
                    <TableCell className="text-xs text-slate-500">{am.email}</TableCell>
                    <TableCell className="text-xs text-slate-500">{am.role}</TableCell>
                    <TableCell className="text-center"><Badge className={`border-none text-[10px] ${am.isactive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{am.isactive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1.5 justify-center">
                        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => window.open(`/accounts-dashboard?viewAs=${encodeURIComponent(am.email)}&viewName=${encodeURIComponent(am.name)}`, '_blank')}>
                          <ExternalLink className="h-3 w-3" />View
                        </Button>
                        <Button variant="outline" size="sm" className={`gap-1 text-xs font-bold ${am.isactive ? "text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200" : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 border-emerald-200"}`} onClick={() => handleToggleAMStatus(am.email, am.isactive)}>
                          {am.isactive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></div></CardContent>
          </Card>
        )}

        {activeTab === "submitted_forms" && (
          <AccountsSubmittedFormsPanel monthOffset={monthOffset} />
        )}

        {activeTab === "config" && (
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
                  {savingConfig ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
