"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import {
  Users, TrendingUp, DollarSign, Calendar, Search, LogOut, Medal, BarChart3,
  LayoutDashboard, Target, Flame, Trophy, Sparkles, Eye, ChevronLeft, ChevronRight,
  FileText, Loader2, Crown, Activity, ArrowUpRight, Zap, Receipt, Download, Filter
} from "lucide-react"

// Import existing reusable modules
import { ExpectedRevenueOverview } from "./expected-revenue-overview"
import { GlobalAwlTracker } from "./global-awl-tracker"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface SalesHeadDashboardProps {
  user: any;
  onLogout: () => void;
}

type TabType = "overview" | "leaderboard" | "awl-tracker" | "roster" | "sales-records";

export function SalesHeadDashboard({ user, onLogout }: SalesHeadDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [salesReps, setSalesReps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [confirmRep, setConfirmRep] = useState<{ id: string, isActive: boolean, name: string } | null>(null)

  // Sales Records state
  const [allSalesRecords, setAllSalesRecords] = useState<any[]>([])
  const [salesRecordsLoading, setSalesRecordsLoading] = useState(false)
  const [salesPersonFilter, setSalesPersonFilter] = useState("All")
  const [salesStatusFilter, setSalesStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [salesSearchQuery, setSalesSearchQuery] = useState("")
  const [salesStartDate, setSalesStartDate] = useState("")
  const [salesEndDate, setSalesEndDate] = useState("")
  const [salesPage, setSalesPage] = useState(1)
  const salesPerPage = 15

  // Month navigation
  const [monthOffset, setMonthOffset] = useState(0)
  const targetDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset])
  const monthName = useMemo(() => targetDate.toLocaleString("default", { month: "long", year: "numeric" }), [targetDate])

  // Performance data
  const [streaksMap, setStreaksMap] = useState<Record<string, number>>({})
  const [incentiveBreakdown, setIncentiveBreakdown] = useState<Record<string, { dailyBonus: number; slabIncentive: number; targetAmount: number; achievedAmount: number }>>({})
  const [incentivesByPeriod, setIncentivesByPeriod] = useState<any[]>([])
  const [monthlyExpData, setMonthlyExpData] = useState<Record<string, { dailySalesCount: number; totalSalesCount: number; overAchieverCount: number; details: any[] }>>({})
  const [biWeeklyCycle, setBiWeeklyCycle] = useState<1 | 2>(new Date().getDate() <= 15 ? 1 : 2)

  // Role configs for target reference
  const [roleConfigs, setRoleConfigs] = useState<Record<string, { target: number; daily_bonus: number; slabs: any[] }>>({})

  const fetchSalesUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, isactive, incentive_amount, designation, employee_code")
      .in("role", ["BDT-P", "BDT", "BDA", "SBDA"])

    if (!error && data) {
      setSalesReps(data)
    }
    setLoading(false)
  }, [])

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

  const fetchAllSalesRecords = useCallback(async (start: string, end: string) => {
    setSalesRecordsLoading(true)
    try {
      const crmBase = (process.env.NEXT_PUBLIC_CRM_SYNC_URL || process.env.NEXT_PUBLIC_CRM_API_URL || "").replace(/^"|"$/g, '')
      const res = await fetch(`${crmBase}/api/incentive-data/all-sales?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`)
      const json = await res.json()
      if (json.success) {
        setAllSalesRecords(json.data || [])
      }
    } catch (e) {
      console.error("Failed to fetch sales records:", e)
    }
    setSalesRecordsLoading(false)
  }, [])

  const handleApplyDateFilter = () => {
    if (salesStartDate && salesEndDate) {
      fetchAllSalesRecords(salesStartDate + "T20:00:00", salesEndDate + "T19:59:59")
      setSalesPage(1)
    }
  }

  const fetchFinancialSettings = useCallback(async () => {
    const { data, error } = await supabase.from("sales_settings").select("key, value")
    if (!error && data) {
      const map = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>)
      const getVal = (baseKey: string) => map[`${baseKey}_${monthName}`] || map[baseKey]

      const ROLES = ["BDT-P", "BDT", "BDA", "SBDA"]
      const newConfigs: Record<string, { target: number; daily_bonus: number; slabs: any[] }> = {}
      ROLES.forEach(role => {
        const rKey = role.toLowerCase()
        const tVal = getVal(`${rKey}_target`)
        const target = tVal ? Number(tVal) : (role === "SBDA" ? 2000 : role === "BDA" ? 1000 : 500)
        const dVal = getVal(`${rKey}_daily_bonus`)
        const daily_bonus = dVal ? Number(dVal) : (role === "SBDA" ? 700 : role === "BDA" ? 400 : 0)
        let slabs: any[] = []
        const sVal = getVal(`${rKey}_slab_rules`)
        if (sVal) { try { slabs = JSON.parse(sVal) } catch { } }
        newConfigs[role] = { target, daily_bonus, slabs }
      })
      setRoleConfigs(newConfigs)
    }
  }, [monthName])

  const fetchStreakCounts = useCallback(async () => {
    const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
    try {
      const res = await fetch(`/api/expected-revenue?mode=executive&month=${monthStr}&skipSync=true`)
      if (!res.ok) return
      const data = await res.json()
      if (data.success && data.entries) {
        const counts: Record<string, number> = {}
        data.entries.forEach((entry: any) => {
          const sc = Number(entry.streak) || 0
          if (sc > 0) counts[entry.email] = (counts[entry.email] || 0) + sc
        })
        setStreaksMap(counts)

        const expMetrics: Record<string, { dailySalesCount: number; totalSalesCount: number; overAchieverCount: number; details: any[] }> = {}
        data.entries.forEach((entry: any) => {
          const em = entry.email
          if (!expMetrics[em]) expMetrics[em] = { dailySalesCount: 0, totalSalesCount: 0, overAchieverCount: 0, details: [] }
          const actualSales = entry.actual_awl_ids?.length || 0
          if (actualSales > 0) {
            expMetrics[em].dailySalesCount += 1
            expMetrics[em].totalSalesCount += actualSales
            expMetrics[em].details.push(entry)
          }
          if (entry.has_revenue && entry.sales?.length > 0) {
            const expectedRev = (entry.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0)
            const actualRev = Number(entry.actual_revenue) || 0
            if (actualRev > expectedRev && expectedRev > 0) expMetrics[em].overAchieverCount += 1
          }
        })
        setMonthlyExpData(expMetrics)
      }
    } catch (e) {
      console.error("Error fetching streaks:", e)
    }
  }, [targetDate])

  const fetchIncentiveBreakdown = useCallback(async () => {
    const mStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
    try {
      const { data, error } = await supabase
        .from("sales_incentives")
        .select("email, role, target_amount, achieved_amount, booster_revenue, daily_bonus, slab_incentive, total_incentive, period")
        .like("period", `${mStr}%`)
      if (!error && data) {
        setIncentivesByPeriod(data)
        // Build role map: email -> current role, to filter out stale records from prior roles
        const repRoleMap: Record<string, string> = {}
        salesReps.forEach(r => { if (r.email) repRoleMap[r.email.toLowerCase()] = r.role })
        const breakdown: Record<string, { dailyBonus: number; slabIncentive: number; targetAmount: number; achievedAmount: number }> = {}
        data.forEach((row: any) => {
          const em = row.email?.toLowerCase()
          if (!em) return
          if (!repRoleMap[em]) return // Skip anyone not in active salesReps list
          if (row.role !== repRoleMap[em]) return // Skip records from past roles
          if (!breakdown[em]) breakdown[em] = { dailyBonus: 0, slabIncentive: 0, targetAmount: 0, achievedAmount: 0 }
          breakdown[em].dailyBonus += Number(row.daily_bonus) || 0
          breakdown[em].slabIncentive += Number(row.slab_incentive) || 0
          breakdown[em].targetAmount = Math.max(breakdown[em].targetAmount, Number(row.target_amount) || 0)
          breakdown[em].achievedAmount += Number(row.achieved_amount) || 0
        })
        setIncentiveBreakdown(breakdown)
      }
    } catch (e) {
      console.error("Error fetching incentive breakdown:", e)
    }
  }, [targetDate, salesReps])

  useEffect(() => { fetchSalesUsers() }, [fetchSalesUsers])

  useEffect(() => {
    fetchFinancialSettings()
    fetchStreakCounts()
    fetchIncentiveBreakdown()
    const interval = setInterval(() => { fetchStreakCounts(); fetchIncentiveBreakdown() }, 300000)
    return () => clearInterval(interval)
  }, [monthOffset, fetchFinancialSettings, fetchStreakCounts, fetchIncentiveBreakdown])

  // Sales Records: auto-fetch when month changes
  useEffect(() => {
    const y = targetDate.getFullYear()
    const m = String(targetDate.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(y, targetDate.getMonth() + 1, 0).getDate()
    const sd = `${y}-${m}-01`
    const ed = `${y}-${m}-${lastDay}`
    setSalesStartDate(sd)
    setSalesEndDate(ed)
    fetchAllSalesRecords(sd + "T20:00:00", ed + "T19:59:59")
    setSalesPage(1)
  }, [targetDate, fetchAllSalesRecords])

  useEffect(() => { setSalesPage(1) }, [salesPersonFilter, salesStatusFilter, salesSearchQuery])

  // Bi-weekly helper
  const getPeriodHalf = (periodStr: string): 1 | 2 => {
    const startDateStr = periodStr.split(" to ")[0]
    const day = parseInt(startDateStr.split("-")[2], 10)
    return day <= 15 ? 1 : 2
  }

  const getCycleLabel = (half: 1 | 2) => {
    const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate()
    return half === 1 ? `1st – 15th` : `16th – ${lastDay}th`
  }

  // Active reps only
  const activeReps = salesReps.filter(r => r.isactive)

  // Leaderboard data computation
  const leaderboardReps = useMemo(() => {
    return [...activeReps].map(rep => {
      const email = rep.email
      const em = monthlyExpData[email] || { dailySalesCount: 0, totalSalesCount: 0, overAchieverCount: 0, details: [] }
      const streaks = streaksMap[email] || 0

      const userIncs = incentivesByPeriod.filter(r => r.email === email && r.role === rep.role)
      const fullMonthAchievedAmount = userIncs.reduce((sum, r) => sum + (Number(r.achieved_amount) || 0), 0)
      const fullMonthBoosterRevenue = userIncs.reduce((sum, r) => sum + (Number(r.booster_revenue) || 0), 0)
      const fullMonthDailyBonus = userIncs.reduce((sum, r) => sum + (Number(r.daily_bonus) || 0), 0)
      const fullMonthSlabIncentive = userIncs.reduce((sum, r) => sum + (Number(r.slab_incentive) || 0), 0)

      const fallbackRow = userIncs[0] || null
      let cycleRow = null
      if (rep.role === "BDT-P") {
        cycleRow = userIncs[0] || null
      } else {
        cycleRow = userIncs.find(r => getPeriodHalf(r.period) === biWeeklyCycle) || null
      }

      const cycleAchievedAmount = cycleRow ? Number(cycleRow.achieved_amount) || 0 : 0
      const cycleBoosterRevenue = cycleRow ? Number(cycleRow.booster_revenue) || 0 : 0
      const liveConfigTarget = roleConfigs[rep.role]?.target || 0
      const cycleTargetAmount = liveConfigTarget > 0
        ? liveConfigTarget
        : (cycleRow ? (Number(cycleRow.target_amount) || 0) : (fallbackRow ? (Number(fallbackRow.target_amount) || 0) : 0))
      const cycleSlabIncentive = cycleRow ? Number(cycleRow.slab_incentive) || 0 : 0
      const cycleDailyBonus = cycleRow ? Number(cycleRow.daily_bonus) || 0 : 0
      const targetCompleted = (cycleAchievedAmount + cycleBoosterRevenue) >= cycleTargetAmount && cycleTargetAmount > 0

      const validDetails = em.details.filter((detail: any) => {
        const [_y, _m, dstr] = detail.shift_date.split("-")
        const day = Number(dstr)
        if (biWeeklyCycle === 1 && day > 15) return false
        if (biWeeklyCycle === 2 && day <= 15) return false
        return true
      })

      let cycleDailySalesCount = 0
      let cycleTotalSalesCount = 0
      let cycleOverAchieverCount = 0
      validDetails.forEach((entry: any) => {
        const actualSales = entry.actual_awl_ids?.length || 0
        if (actualSales > 0) { cycleDailySalesCount += 1; cycleTotalSalesCount += actualSales }
        if (entry.has_revenue && entry.sales?.length > 0) {
          const expectedRev = (entry.sales || []).reduce((s: number, sale: any) => s + (Number(sale.expected_revenue) || 0), 0)
          const actualRev = Number(entry.actual_revenue) || 0
          if (actualRev > expectedRev && expectedRev > 0) cycleOverAchieverCount += 1
        }
      })

      let cycleStreaks = 0
      const streakDetails = em.details.filter((detail: any) => {
        const [_y, _m, dstr] = detail.shift_date.split("-")
        const day = Number(dstr)
        if (biWeeklyCycle === 1 && day > 15) return false
        return true
      })
      streakDetails.forEach((entry: any) => { cycleStreaks += Number(entry.streak) || 0 })

      return {
        ...rep,
        targetCompleted,
        achievedAmount: cycleAchievedAmount,
        boosterRevenue: cycleBoosterRevenue,
        targetAmount: cycleTargetAmount,
        totalRevenue: fullMonthAchievedAmount,
        totalBoosterRevenue: fullMonthBoosterRevenue,
        dailySalesCount: cycleDailySalesCount,
        totalSalesCount: cycleTotalSalesCount,
        streaks: cycleStreaks,
        overAchieverCount: cycleOverAchieverCount,
        slabIncentive: cycleSlabIncentive,
        dailyBonus: cycleDailyBonus,
        fullMonthSlabIncentive,
        fullMonthDailyBonus
      }
    }).sort((a, b) => {
      if (a.totalRevenue !== b.totalRevenue) return b.totalRevenue - a.totalRevenue
      if (a.dailySalesCount !== b.dailySalesCount) return b.dailySalesCount - a.dailySalesCount
      if (a.streaks !== b.streaks) return b.streaks - a.streaks
      if (a.totalSalesCount !== b.totalSalesCount) return b.totalSalesCount - a.totalSalesCount
      return b.overAchieverCount - a.overAchieverCount
    })
  }, [activeReps, monthlyExpData, streaksMap, incentivesByPeriod, biWeeklyCycle, roleConfigs])

  // Summary stats
  const totalActiveReps = activeReps.length
  const activeEmails = new Set(activeReps.map(r => r.email?.toLowerCase()).filter(Boolean))
  const totalRevenue = Object.entries(incentiveBreakdown).reduce((sum, [email, ib]) => sum + (activeEmails.has(email) ? (ib.achievedAmount || 0) : 0), 0)
  const totalStreaks = Object.entries(streaksMap).reduce((sum, [email, s]) => sum + (activeEmails.has(email.toLowerCase()) ? s : 0), 0)
  const overviewTotalSales = allSalesRecords.filter(s => activeEmails.has(s.account_assigned_email?.toLowerCase())).length
  const topPerformer = leaderboardReps.length > 0 ? leaderboardReps[0] : null

  // Sales Records computed values
  const repEmailToName = useMemo(() => {
    const map: Record<string, string> = {}
    salesReps.forEach(r => { if (r.email) map[r.email.toLowerCase()] = r.name || r.email })
    return map
  }, [salesReps])

  const filteredAllSales = useMemo(() => {
    // Build set of known sales rep emails
    const knownRepEmails = new Set(salesReps.map(r => r.email?.toLowerCase()).filter(Boolean))
    let records = [...allSalesRecords]
    // Always scope to known sales reps unless a specific non-rep person is selected
    if (salesPersonFilter === "All") {
      records = records.filter(s => knownRepEmails.has(s.account_assigned_email?.toLowerCase()))
    } else {
      records = records.filter(s => s.account_assigned_email?.toLowerCase() === salesPersonFilter.toLowerCase())
    }
    if (salesStatusFilter !== "all") {
      const targetEmails = new Set(
        salesReps
          .filter(r => salesStatusFilter === "active" ? r.isactive : !r.isactive)
          .map(r => r.email?.toLowerCase())
      )
      records = records.filter(s => targetEmails.has(s.account_assigned_email?.toLowerCase()))
    }
    if (salesSearchQuery.trim()) {
      const q = salesSearchQuery.toLowerCase()
      records = records.filter(s =>
        (s.lead_name || "").toLowerCase().includes(q) ||
        (s.lead_id || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.account_assigned_email || "").toLowerCase().includes(q)
      )
    }
    return records.sort((a, b) => (b.closed_at || "").localeCompare(a.closed_at || ""))
  }, [allSalesRecords, salesPersonFilter, salesStatusFilter, salesSearchQuery, salesReps])

  const totalSalesPages = Math.ceil(filteredAllSales.length / salesPerPage) || 1
  const paginatedAllSales = filteredAllSales.slice((salesPage - 1) * salesPerPage, salesPage * salesPerPage)
  const totalSalesRevenue = filteredAllSales.reduce((sum, s) => sum + (Number(s.sale_value) || 0), 0)
  const uniqueSalesRepsCount = salesPersonFilter === "All" ? salesReps.length : 1

  const handleExportCSV = () => {
    const headers = ["#", "Lead Name", "Lead ID", "Lead Email", "Sale Value ($)", "Sales Rep", "Closed At", "Payment Mode", "Finance Status"]
    const rows = filteredAllSales.map((s: any, i: number) => [
      i + 1,
      s.lead_name || "",
      s.lead_id || "",
      s.email || "",
      s.sale_value || "0",
      repEmailToName[s.account_assigned_email?.toLowerCase()] || s.account_assigned_email || "",
      s.closed_at ? new Date(s.closed_at).toLocaleString() : "",
      s.payment_mode || "",
      s.finance_status || ""
    ])
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales_ledger_${salesStartDate}_to_${salesEndDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter roster
  const filteredRoster = salesReps.filter(m => {
    let match = true
    if (searchQuery.trim()) {
      const t = searchQuery.toLowerCase()
      match = match && !!(m.name?.toLowerCase().includes(t) || m.email?.toLowerCase().includes(t))
    }
    if (roleFilter !== "All") match = match && m.role === roleFilter
    return match
  }).sort((a, b) => {
    const weight: Record<string, number> = { "SBDA": 4, "BDA": 3, "BDT": 2, "BDT-P": 1 }
    const wa = weight[a.role] || 0
    const wb = weight[b.role] || 0
    if (wa !== wb) return wb - wa
    return (a.name || "").localeCompare(b.name || "")
  })

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: LayoutDashboard },
    { id: "leaderboard" as TabType, label: "Leaderboard", icon: Trophy },
    { id: "awl-tracker" as TabType, label: "AWL Tracker", icon: FileText },
    { id: "roster" as TabType, label: "Sales Force Directory", icon: Users },
    { id: "sales-records" as TabType, label: "Sales Ledger", icon: Receipt },
  ]

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case "BDT-P": return "bg-slate-100 text-slate-600 font-medium"
      case "BDT": return "bg-blue-100 text-blue-700 font-bold"
      case "BDA": return "bg-indigo-100 text-indigo-700 font-black tracking-wide"
      case "SBDA": return "bg-violet-100 text-violet-800 font-black tracking-widest"
      default: return "bg-slate-100 text-slate-600"
    }
  }

  const overviewStatCards = (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Active Reps */}
      <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.06)] overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-pink-400" />
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Active Reps</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{totalActiveReps}</p>
            </div>
            <div className="p-2 rounded-xl bg-rose-100/80 group-hover:bg-rose-200/80 transition-colors">
              <Users className="h-5 w-5 text-rose-600" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {["SBDA", "BDA", "BDT"].map(r => (
              <span key={r} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {activeReps.filter(rep => rep.role === r).length} {r}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.06)] overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Revenue</p>
              <p className="text-3xl font-black text-emerald-700 mt-1">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-100/80 group-hover:bg-emerald-200/80 transition-colors">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-3">
            Only active sales persons total revenue, not included inactive revenue.
          </p>
        </CardContent>
      </Card>

      {/* Total Sales */}
      <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.06)] overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-400" />
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Sales</p>
              <p className="text-3xl font-black text-blue-700 mt-1">{overviewTotalSales.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-100/80 group-hover:bg-blue-200/80 transition-colors">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-3">Closures this month</p>
        </CardContent>
      </Card>

      {/* Streak Points */}
      <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.06)] overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-amber-400" />
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Streak Points</p>
              <p className="text-3xl font-black text-orange-600 mt-1 flex items-center gap-1.5">
                <Flame className="h-6 w-6" /> {totalStreaks}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-orange-100/80 group-hover:bg-orange-200/80 transition-colors">
              <Sparkles className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-3">Team-wide accuracy</p>
        </CardContent>
      </Card>

      {/* Top Performer */}
      <Card className="backdrop-blur-md bg-gradient-to-br from-violet-500/10 to-rose-500/10 border border-violet-200/40 shadow-[0_8px_32px_rgba(31,38,135,0.06)] overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-rose-400" />
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-violet-500">Top Performer</p>
              {topPerformer ? (
                <>
                  <p className="text-sm font-black text-slate-800 mt-1 truncate">{topPerformer.name}</p>
                  <p className="text-[10px] font-bold text-violet-600 mt-0.5">${topPerformer.totalRevenue.toLocaleString()} revenue</p>
                </>
              ) : (
                <p className="text-sm font-bold text-slate-400 mt-1">—</p>
              )}
            </div>
            <div className="p-2 rounded-xl bg-violet-100/80 group-hover:bg-violet-200/80 transition-colors shrink-0">
              <Crown className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-violet-50/20">
      {/* ==================== HEADER ==================== */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-violet-600 shadow-lg shadow-rose-500/25">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Sales Head Command Center</h1>
              <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-500" />
                Monitoring {totalActiveReps} active representative{totalActiveReps !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-1.5 py-1 rounded-xl border border-slate-200/60 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => setMonthOffset(p => p - 1)}>
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </Button>
            <div className="flex items-center gap-1.5 px-3 min-w-[160px] justify-center">
              <Calendar className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-sm font-black text-slate-700">{monthName}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => setMonthOffset(p => p + 1)}>
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </Button>
            {monthOffset !== 0 && (
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black text-rose-600 hover:bg-rose-50 px-2" onClick={() => setMonthOffset(0)}>
                Today
              </Button>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-rose-50 to-violet-50 px-3 py-1.5 rounded-full border border-rose-200/50">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center text-white font-black text-[10px] uppercase shadow-sm">
                {user.name?.substring(0, 2)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-tight">{user.name}</p>
                <p className="text-[9px] text-rose-500 font-bold">Sales Head</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1600px] mx-auto px-6 pb-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-white text-rose-600 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] border border-b-0 border-slate-200/60'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
                  }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6 animate-in fade-in duration-500">

        {/* Toggle Status Context Modal */}
        <Dialog open={!!confirmRep} onOpenChange={() => setConfirmRep(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
              <DialogDescription>Toggle the active status of this sales representative.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Are you sure you want to{" "}
              <span className="font-semibold text-slate-800">
                {confirmRep?.isActive ? "set this representative as Inactive" : "set this representative as Active"}
              </span>
              ?
            </p>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setConfirmRep(null)}>Cancel</Button>
              <Button
                className={confirmRep?.isActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-white hover:bg-emerald-600"}
                onClick={() => {
                  if (confirmRep) {
                    handleToggleActive(confirmRep.id, confirmRep.isActive)
                    setConfirmRep(null)
                  }
                }}
              >
                {confirmRep?.isActive ? "Yes, Set Inactive" : "Yes, Set Active"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== TAB: OVERVIEW ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary Stat Cards */}
            {overviewStatCards}

            {/* Expected Revenue Tracker */}
            <ExpectedRevenueOverview monthName={monthName} targetDate={targetDate} />
          </div>
        )}

        {/* ==================== TAB: LEADERBOARD ==================== */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            {overviewStatCards}

            {/* Cycle Toggle */}
            <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                      <Trophy className="h-5 w-5 text-amber-500" /> Performance Leaderboard
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold text-slate-500 mt-1">
                      Rankings for {monthName} • Cycle: {getCycleLabel(biWeeklyCycle)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                    <button
                      onClick={() => setBiWeeklyCycle(1)}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${biWeeklyCycle === 1 ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      1st Half
                    </button>
                    <button
                      onClick={() => setBiWeeklyCycle(2)}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${biWeeklyCycle === 2 ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      2nd Half
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-rose-500 mr-3" />
                    <span className="text-slate-500 font-medium text-sm">Loading leaderboard...</span>
                  </div>
                ) : leaderboardReps.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-medium">No active representatives found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead className="w-12 text-center font-bold text-[10px] uppercase tracking-wider text-slate-400">Rank</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 pl-4">Sales Rep</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Role</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Sales</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Target</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">
                            <div className="flex items-center justify-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> Streaks</div>
                          </TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Slab ₹</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Daily Bonus ₹</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center bg-slate-50 border-l border-slate-100">Month Rev</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center bg-slate-50">Month Inc</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-right pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboardReps.map((rep, index) => {
                          const progressPct = rep.targetAmount > 0 ? Math.min(100, Math.round((rep.achievedAmount / rep.targetAmount) * 100)) : 0
                          return (
                            <TableRow key={rep.id} className={`transition-colors ${index < 3 ? 'bg-amber-50/20' : ''} hover:bg-rose-50/30`}>
                              <TableCell className="text-center">
                                {index === 0 ? <span className="text-lg">🥇</span> : index === 1 ? <span className="text-lg">🥈</span> : index === 2 ? <span className="text-lg">🥉</span> : <span className="text-xs font-bold text-slate-400">#{index + 1}</span>}
                              </TableCell>
                              <TableCell className="pl-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${index < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {rep.name?.substring(0, 2)?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-slate-800 leading-tight">{rep.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{rep.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`border-none text-[10px] ${getRoleBadgeClasses(rep.role)}`}>{rep.role}</Badge>
                              </TableCell>
                              <TableCell className="text-center font-bold text-indigo-700">{rep.totalSalesCount}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${rep.targetCompleted ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${progressPct}%` }} />
                                  </div>
                                  <span className={`text-[9px] font-bold ${rep.targetCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    ${rep.achievedAmount.toLocaleString()} / ${rep.targetAmount.toLocaleString()}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${rep.streaks > 0 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'text-slate-300'}`}>
                                  <Flame className="h-3 w-3" /> {rep.streaks}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-bold text-violet-700">₹{rep.slabIncentive.toLocaleString()}</TableCell>
                              <TableCell className="text-center font-bold text-blue-600">₹{rep.dailyBonus.toLocaleString()}</TableCell>
                              <TableCell className="text-center font-bold text-slate-500 bg-slate-50/80 border-l border-slate-100/60">
                                <span>${rep.totalRevenue.toLocaleString()}</span>
                                {rep.totalBoosterRevenue > 0 && (
                                  <span className="block text-[10px] font-bold text-orange-600 mt-0.5 animate-pulse">🚀 +${rep.totalBoosterRevenue.toLocaleString()} Boost</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-bold text-slate-500 bg-slate-50/80">₹{rep.fullMonthSlabIncentive.toLocaleString()}</TableCell>
                              <TableCell className="text-right pr-6">
                                <Link href={`/sales-head-dashboard/${rep.id}`}>
                                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
                                    <Eye className="h-3.5 w-3.5" /> View
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== TAB: AWL TRACKER ==================== */}
        {activeTab === "awl-tracker" && (
          <GlobalAwlTracker
            monthName={monthName}
            targetDate={targetDate}
            salesReps={salesReps}
            basePath="/sales-head-dashboard"
          />
        )}

        {/* ==================== TAB: TEAM ROSTER -> Sales Team ==================== */}
        {activeTab === "roster" && (
          <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
            <CardHeader className="pb-3 bg-gradient-to-b from-violet-50/50 to-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                    <Users className="h-5 w-5 text-violet-600" /> Sales Team
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 mt-1">
                    {salesReps.filter(r => r.isactive).length} active • {salesReps.filter(r => !r.isactive).length} inactive
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search reps..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-[220px] h-9 pl-9 bg-white/80 text-sm"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[130px] h-9 bg-white/80 text-sm">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Roles</SelectItem>
                      <SelectItem value="SBDA">SBDA</SelectItem>
                      <SelectItem value="BDA">BDA</SelectItem>
                      <SelectItem value="BDT">BDT</SelectItem>
                      <SelectItem value="BDT-P">BDT-P</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="w-12 font-bold text-[10px] uppercase tracking-wider text-slate-400 pl-6">#</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Representative</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Role</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Employee Code</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">
                        <div className="flex items-center justify-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> Streaks</div>
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16">
                          <Loader2 className="h-6 w-6 animate-spin text-violet-500 mx-auto mb-3" />
                          <span className="text-sm text-slate-400 font-medium">Loading roster...</span>
                        </TableCell>
                      </TableRow>
                    ) : filteredRoster.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16 text-slate-400 font-medium">No representatives found.</TableCell>
                      </TableRow>
                    ) : (
                      filteredRoster.map((member, idx) => (
                        <TableRow key={member.id} className={`transition-colors ${!member.isactive ? 'opacity-50 grayscale-[0.4]' : 'hover:bg-violet-50/20'}`}>
                          <TableCell className="text-slate-400 text-xs font-bold pl-6">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black uppercase shrink-0 ${member.isactive
                                  ? 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700'
                                  : 'bg-slate-100 text-slate-400'
                                }`}>
                                {member.name?.substring(0, 2) || '--'}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-800">{member.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{member.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`border-none text-[10px] ${getRoleBadgeClasses(member.role)}`}>{member.role}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold text-slate-500 font-mono">
                            {member.employee_code || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${(streaksMap[member.email] || 0) > 0 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'text-slate-300'}`}>
                              <Flame className="h-3 w-3" /> {streaksMap[member.email] || 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {member.isactive ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold mr-2">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] font-bold mr-2">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6 flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-7 px-2 font-bold"
                              onClick={() => setConfirmRep({ id: member.id, isActive: member.isactive, name: member.name })}
                            >
                              {member.isactive ? "Set Inactive" : "Set Active"}
                            </Button>
                            <Link href={`/sales-head-dashboard/${member.id}`}>
                              <Button variant="outline" size="sm" className="gap-1.5 text-[10px] h-7 px-2 font-bold hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all">
                                <Eye className="h-3 w-3" /> Dashboard
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== TAB: SALES LEDGER ==================== */}
        {activeTab === "sales-records" && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Records", value: filteredAllSales.length.toLocaleString(), icon: Receipt, color: "from-blue-500 to-cyan-500", accent: "text-blue-600" },
                { label: "Total Revenue", value: `$${totalSalesRevenue.toLocaleString()}`, icon: DollarSign, color: "from-emerald-500 to-teal-500", accent: "text-emerald-600", subtitle: "All active + inactive sales persons revenue." },
                { label: "Total Reps", value: uniqueSalesRepsCount, icon: Users, color: "from-violet-500 to-purple-500", accent: "text-violet-600" },
                { label: "Avg Deal Size", value: `$${filteredAllSales.length > 0 ? Math.round(totalSalesRevenue / filteredAllSales.length).toLocaleString() : 0}`, icon: TrendingUp, color: "from-amber-500 to-orange-500", accent: "text-amber-600" },
              ].map(card => (
                <Card key={card.label} className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                  <div className={`h-1 w-full bg-gradient-to-r ${card.color}`} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                        <p className={`text-2xl font-black ${card.accent} mt-1`}>{card.value}</p>
                      </div>
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                        <card.icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    {card.subtitle && (
                      <p className="text-[9px] font-semibold text-slate-400 mt-2">{card.subtitle}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filter Bar */}
            <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-3 items-end">
                  {/* Search */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Lead name, ID, email..."
                        className="pl-9 h-9 text-xs bg-white/80 border-slate-200 rounded-lg"
                        value={salesSearchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalesSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Sales Person */}
                  <div className="min-w-[180px]">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Sales Person</label>
                    <Select value={salesPersonFilter} onValueChange={(v) => { setSalesPersonFilter(v); setSalesPage(1) }}>
                      <SelectTrigger className="h-9 text-xs bg-white/80 border-slate-200 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Reps</SelectItem>
                        {salesReps
                          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                          .map(r => (
                            <SelectItem key={r.id} value={r.email}>{r.name} ({r.role})</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="min-w-[130px]">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Status</label>
                    <Select value={salesStatusFilter} onValueChange={(v: string) => { setSalesStatusFilter(v as "all" | "active" | "inactive"); setSalesPage(1) }}>
                      <SelectTrigger className="h-9 text-xs bg-white/80 border-slate-200 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="inactive">Inactive Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="min-w-[130px]">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">From</label>
                    <Input type="date" className="h-9 text-xs bg-white/80 border-slate-200 rounded-lg" value={salesStartDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalesStartDate(e.target.value)} />
                  </div>
                  <div className="min-w-[130px]">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">To</label>
                    <Input type="date" className="h-9 text-xs bg-white/80 border-slate-200 rounded-lg" value={salesEndDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalesEndDate(e.target.value)} />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button size="sm" className="h-9 px-4 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all" onClick={handleApplyDateFilter}>
                      <Filter className="h-3 w-3 mr-1.5" /> Apply
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 px-4 text-xs font-bold rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all" onClick={handleExportCSV}>
                      <Download className="h-3 w-3 mr-1.5" /> CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Table */}
            <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />
              <CardHeader className="pb-2 bg-gradient-to-b from-blue-50/50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-blue-600" /> Sales Ledger
                    </CardTitle>
                    <CardDescription className="text-[10px] font-semibold text-slate-500 mt-0.5">
                      {filteredAllSales.length} records &bull; {salesStartDate} to {salesEndDate}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {salesRecordsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-3" />
                    <span className="text-slate-500 font-medium text-sm">Loading sales records...</span>
                  </div>
                ) : filteredAllSales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Receipt className="h-10 w-10 mb-3 opacity-30" />
                    <p className="font-bold">No sales records found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or date range</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80">
                            <TableHead className="w-10 text-center font-bold text-[10px] uppercase tracking-wider text-slate-400">#</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Lead Name</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Lead ID</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Email</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Value</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Sales Rep</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Closed At</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Payment</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedAllSales.map((sale: any, idx: number) => {
                            const repName = repEmailToName[sale.account_assigned_email?.toLowerCase()] || sale.account_assigned_email || "\u2014"
                            const rowNum = (salesPage - 1) * salesPerPage + idx + 1
                            return (
                              <TableRow key={sale.id || idx} className="hover:bg-blue-50/30 transition-colors">
                                <TableCell className="text-center text-xs font-bold text-slate-400">{rowNum}</TableCell>
                                <TableCell className="font-semibold text-sm text-slate-800">{sale.lead_name || "\u2014"}</TableCell>
                                <TableCell>
                                  {sale.lead_id ? (
                                    <a href={`https://applywizz-crm-tool.vercel.app/leads/${sale.lead_id.trim()}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                                      {sale.lead_id}
                                    </a>
                                  ) : <span className="text-slate-400 text-xs">N/A</span>}
                                </TableCell>
                                <TableCell className="text-slate-500 text-xs">{sale.email || "\u2014"}</TableCell>
                                <TableCell className="text-center font-black text-emerald-700">${Number(sale.sale_value || 0).toLocaleString()}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[9px] font-black text-indigo-700 shrink-0">
                                      {repName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{repName}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-xs text-slate-500">
                                  <div className="flex flex-col items-center">
                                    <span>{sale.closed_at ? new Date(sale.closed_at).toLocaleDateString() : "\u2014"}</span>
                                    {sale.closed_at && <span className="text-[9px] text-slate-400 font-medium">{new Date(sale.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="text-[9px] font-bold">{sale.payment_mode || "\u2014"}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={`text-[9px] font-bold border-0 ${sale.finance_status === "Paid" ? "bg-emerald-100 text-emerald-700" : sale.finance_status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                                    {sale.finance_status || "\u2014"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400">
                        Showing {(salesPage - 1) * salesPerPage + 1}\u2013{Math.min(salesPage * salesPerPage, filteredAllSales.length)} of {filteredAllSales.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={salesPage <= 1} onClick={() => setSalesPage(p => p - 1)}>
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-xs font-bold text-slate-600 mx-2">{salesPage} / {totalSalesPages}</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={salesPage >= totalSalesPages} onClick={() => setSalesPage(p => p + 1)}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
