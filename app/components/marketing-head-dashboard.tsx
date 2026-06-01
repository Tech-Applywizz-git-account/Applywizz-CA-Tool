"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AssessmentAnalyticsPage } from "./assessment-analytics-page"
import {
  Users, DollarSign, Calendar, Search, LogOut, LayoutDashboard, Target,
  Trophy, Eye, ChevronLeft, ChevronRight, FileText, Loader2, Activity,
  Database, EyeOff, IndianRupee, Megaphone, TrendingUp, CheckCircle2,
  Globe, Briefcase, Award, Info, Scale, ShieldCheck, Calculator, ArrowLeft,
  ChevronLast, ChevronFirst, ExternalLink, Settings2
} from "lucide-react"
import Link from "next/link"
import { MarketingDashboard } from "./marketing-dashboard"

interface MarketingHeadDashboardProps {
  user: any;
  onLogout: () => void;
}

type TabType = "overview" | "tracker" | "roster" | "rules" | "invites";
type TrackerTabType = "jobboard" | "skillpassport" | "influencer";



export function MarketingHeadDashboard({ user, onLogout }: MarketingHeadDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [trackerTab, setTrackerTab] = useState<TrackerTabType>("jobboard")
  const [marketers, setMarketers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [trackerSearchQuery, setTrackerSearchQuery] = useState("")
  const [confirmUser, setConfirmUser] = useState<{ id: string, isActive: boolean, name: string } | null>(null)
  const [showYield, setShowYield] = useState(false)
  const [viewingMarketer, setViewingMarketer] = useState<any | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingRate, setEditingRate] = useState(false)
  const [activeConfigTab, setActiveConfigTab] = useState<'jobboard' | 'skillpassport' | 'influencer'>('jobboard')
  const [conversionRate, setConversionRate] = useState("85.00")
  const [jbTier1, setJbTier1] = useState("30")
  const [jbTier2, setJbTier2] = useState("35")
  const [jbTier3, setJbTier3] = useState("40")
  const [spRate, setSpRate] = useState("30")
  const [influencerPaidRate, setInfluencerPaidRate] = useState("1.5")
  const [influencerUnpaidRate, setInfluencerUnpaidRate] = useState("3")
  const [customJobBoardTiers, setCustomJobBoardTiers] = useState<any[]>([])
  const [savingRate, setSavingRate] = useState(false)

  // Reset page when tracker tab or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [trackerTab, trackerSearchQuery])

  // Month navigation
  const [monthOffset, setMonthOffset] = useState(0)
  const targetDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset])
  const monthName = useMemo(() => targetDate.toLocaleString("en-US", { month: "long", year: "numeric" }), [targetDate])

  // Marketing Stats
  const [globalStats, setGlobalStats] = useState({
    teamSize: 0,
    jobBoardSales: 0,
    skillPassportSales: 0,
    totalIndividualInr: 0,
    jobBoardInr: 0,
    skillPassportInr: 0,
    influencerPaidCount: 0,
    influencerUnpaidCount: 0,
    influencerInr: 0,
  })

  const [jobBoardSales, setJobBoardSales] = useState<any[]>([])
  const [skillPassportSales, setSkillPassportSales] = useState<any[]>([])
  const [influencerPaidSales, setInfluencerPaidSales] = useState<any[]>([])
  const [influencerUnpaidSales, setInfluencerUnpaidSales] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [calcRes, usersRes] = await Promise.all([
        fetch(`/api/calculate-marketing-incentives?period=${encodeURIComponent(monthName)}&t=${Date.now()}`),
        supabase.from("users").select("id, name, email, role, designation, isactive, department, created_at, incentive_amount").or("department.eq.Marketing,role.ilike.%Marketing%")
      ])

      if (calcRes.ok) {
        const data = await calcRes.json()
        setGlobalStats({
          teamSize: data.teamSize || 0,
          jobBoardSales: data.jobBoard?.salesCount || 0,
          skillPassportSales: data.skillPassport?.salesCount || 0,
          totalIndividualInr: data.totalIndividualInr || 0,
          jobBoardInr: data.jobBoard?.individualInr || 0,
          skillPassportInr: data.skillPassport?.individualInr || 0,
          influencerPaidCount: data.influencer?.paidCount || 0,
          influencerUnpaidCount: data.influencer?.unpaidCount || 0,
          influencerInr: data.influencer?.individualInr || 0,
        })

        // Fetch detailed logs for the tracker
        const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        const detailRes = await fetch(`/api/marketing-data?email=${encodeURIComponent(user.email)}&month=${monthStr}`);
        const detailData = await detailRes.json();
        if (detailData.success) {
          setJobBoardSales(detailData.jobBoardSales || []);
          setSkillPassportSales(detailData.skillPassportSales || []);
          setInfluencerPaidSales(detailData.influencerPaidSales || []);
          setInfluencerUnpaidSales(detailData.influencerUnpaidSales || []);
        }
      }

      if (!usersRes.error && usersRes.data) {
        const targetDateForEnd = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0, 23, 59, 59)
        const normalizedData = usersRes.data
          .filter((u: any) => {
            const userJoinDate = u.created_at ? new Date(u.created_at) : new Date("2000-01-01")
            const roleLower = (u.role || "").toLowerCase()
            const desigLower = (u.designation || "").toLowerCase()
            const isMarketingHead = roleLower.includes("marketing head") || desigLower.includes("marketing head")
            return userJoinDate <= targetDateForEnd && !isMarketingHead
          })
          .map((u: any) => {
            const isTraineeRep = (u.designation || "").toLowerCase().includes("trainee") || (u.role || "").toLowerCase().includes("trainee")
            return {
              id: u.id,
              name: u.name || u.email,
              email: u.email,
              role: u.role,
              designation: u.designation,
              isactive: u.isactive === true,
              isTrainee: isTraineeRep,
            }
          })

        // Fetch incentives for these users for the current month
        const emails = normalizedData.map((u: any) => u.email)
        const { data: incentivesData, error: incentivesError } = await supabase
          .from("marketing_incentives")
          .select("*")
          .eq("period", monthName)
          .in("email", emails)

        const dataWithIncentives = normalizedData.map((rep: any) => {
          const incn = incentivesData?.find((i: any) => i.email === rep.email)
          return {
            ...rep,
            job_board_incentive_inr: incn?.job_board_incentive_inr || 0,
            skill_passport_incentive_inr: incn?.skill_passport_incentive_inr || 0,
            influencer_incentive_inr: incn?.influencer_incentive_inr || 0,
            total_incentive_inr: (incn?.job_board_incentive_inr || 0) + (incn?.skill_passport_incentive_inr || 0) + (incn?.influencer_incentive_inr || 0)
          }
        })

        setMarketers(dataWithIncentives)
      }
    } catch (e) {
      console.error("Fetch Data Error:", e)
    } finally {
      setLoading(false)
    }
  }, [monthName, monthOffset, targetDate, user.email])

  const fetchSettings = async () => {
    const period = monthName;
    const keys = [
      "usd_to_inr_rate", "jb_rate_tier1", "jb_rate_tier2", "jb_rate_tier3", "sp_rate", "influencer_paid_rate", "influencer_unpaid_rate",
      `usd_to_inr_rate_${period}`, `jb_rate_tier1_${period}`, `jb_rate_tier2_${period}`, `jb_rate_tier3_${period}`, `sp_rate_${period}`, `influencer_paid_rate_${period}`, `influencer_unpaid_rate_${period}`
    ];

    const { data: rawData, error } = await supabase
      .from("marketing_settings")
      .select("key, value")
      .in("key", keys)

    if (!error && rawData) {
      const map = rawData.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>)

      setConversionRate(map[`usd_to_inr_rate_${period}`] || map["usd_to_inr_rate"] || "85.00")
      setJbTier1(map[`jb_rate_tier1_${period}`] || map["jb_rate_tier1"] || "30")
      setJbTier2(map[`jb_rate_tier2_${period}`] || map["jb_rate_tier2"] || "35")
      setJbTier3(map[`jb_rate_tier3_${period}`] || map["jb_rate_tier3"] || "40")
      setSpRate(map[`sp_rate_${period}`] || map["sp_rate"] || "30")
      setInfluencerPaidRate(map[`influencer_paid_rate_${period}`] || map["influencer_paid_rate"] || "1.5")
      setInfluencerUnpaidRate(map[`influencer_unpaid_rate_${period}`] || map["influencer_unpaid_rate"] || "3")

      const customTiersStr = map[`jb_custom_tiers_${period}`] || map["jb_custom_tiers"] || "[]"
      try {
        setCustomJobBoardTiers(JSON.parse(customTiersStr))
      } catch (e) {
        setCustomJobBoardTiers([])
      }
    }
  }

  const saveSettings = async () => {
    setSavingRate(true)
    const settingsArr: { key: string, value: string }[] = []

    for (let i = monthOffset; i <= monthOffset + 18; i++) {
      const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + i, 1)
      const periodStr = targetDate.toLocaleString("default", { month: "long", year: "numeric" })

      settingsArr.push(
        { key: `usd_to_inr_rate_${periodStr}`, value: conversionRate },
        { key: `jb_rate_tier1_${periodStr}`, value: jbTier1 },
        { key: `jb_rate_tier2_${periodStr}`, value: jbTier2 },
        { key: `jb_rate_tier3_${periodStr}`, value: jbTier3 },
        { key: `sp_rate_${periodStr}`, value: spRate },
        { key: `jb_custom_tiers_${periodStr}`, value: JSON.stringify(customJobBoardTiers) },
        { key: `influencer_paid_rate_${periodStr}`, value: influencerPaidRate },
        { key: `influencer_unpaid_rate_${periodStr}`, value: influencerUnpaidRate }
      )
    }

    const { error } = await supabase
      .from("marketing_settings")
      .upsert(settingsArr, { onConflict: "key" })

    if (!error) {
      setEditingRate(false)
      await fetchData()
    } else {
      alert("Failed to save Period-Specific settings: " + error.message)
    }
    setSavingRate(false)
  }

  const addCustomTier = () => {
    setCustomJobBoardTiers([...customJobBoardTiers, { threshold: "", rate: "" }])
  }

  const removeCustomTier = (index: number) => {
    setCustomJobBoardTiers(customJobBoardTiers.filter((_, i) => i !== index))
  }

  const updateCustomTier = (index: number, field: string, value: string) => {
    const updated = [...customJobBoardTiers]
    updated[index][field] = value
    setCustomJobBoardTiers(updated)
  }

  useEffect(() => {
    fetchData()
    fetchSettings()
  }, [fetchData, monthOffset])

  const handleToggleActive = async (repId: string, currentIsActive: boolean) => {
    const { error } = await supabase.from("users").update({ isactive: !currentIsActive }).eq("id", repId)
    if (!error) {
      setMarketers(prev => prev.map(r => r.id === repId ? { ...r, isactive: !currentIsActive } : r))
    } else {
      alert("Failed to toggle active state: " + error.message)
    }
  }

  const handlePromoteTrainee = async (repId: string) => {
    const { error } = await supabase.from("users").update({ role: "Marketing Associate", designation: "Marketing Associate" }).eq("id", repId)
    if (!error) {
      setMarketers(prev => prev.map(r => r.id === repId ? { ...r, role: "Marketing Associate", designation: "Marketing Associate", isTrainee: false } : r))
    } else {
      alert("Failed to promote trainee: " + error.message)
    }
  }

  const handleDemoteToTrainee = async (repId: string) => {
    const { error } = await supabase.from("users").update({ role: "Marketing Trainee", designation: "Marketing Trainee", incentive_amount: 0 }).eq("id", repId)
    if (!error) {
      setMarketers(prev => prev.map(r => r.id === repId ? { ...r, role: "Marketing Trainee", designation: "Marketing Trainee", isTrainee: true } : r))
    } else {
      alert("Failed to demote trainee: " + error.message)
    }
  }

  // --- Filtered Data ---
  const filteredMarketers = useMemo(() => {
    if (!searchQuery.trim()) return marketers
    const q = searchQuery.toLowerCase()
    return marketers.filter(r => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q))
  }, [marketers, searchQuery])

  const activeMarketers = filteredMarketers.filter(r => r.isactive && !r.isTrainee)
  const activeTrainees = filteredMarketers.filter(r => r.isactive && r.isTrainee)
  const inactiveMarketers = filteredMarketers.filter(r => !r.isactive)

  // Search in tables
  const filteredJbSales = jobBoardSales.filter(s => !trackerSearchQuery || s.jb_id?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))
  const filteredSpSales = skillPassportSales.filter(s => !trackerSearchQuery || s.lead_ref?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))
  const allInfluencerSales = [...influencerPaidSales, ...influencerUnpaidSales];
  const filteredInfSales = allInfluencerSales.filter(s => !trackerSearchQuery || s.lead_id?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))

  // --- Pagination Logic ---
  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }

  const activeTableData = useMemo(() => {
    if (trackerTab === "jobboard") return filteredJbSales
    if (trackerTab === "influencer") return filteredInfSales
    return filteredSpSales
  }, [trackerTab, filteredJbSales, filteredSpSales, filteredInfSales])

  const totalPages = Math.ceil(activeTableData.length / itemsPerPage)

  const combinedRecentSales = useMemo(() => {
    const jb = jobBoardSales.map((s: any) => ({ ...s, type: "Job Board", date: s.created_at, displayAmount: `$${s.amount}` }));
    const sp = skillPassportSales.map((s: any) => ({ ...s, type: "Skill Passport", date: s.created_at, displayAmount: `${s.currency} ${s.amount}` }));
    const infPaid = influencerPaidSales.map((s: any) => ({ ...s, type: "Influencer (Paid)", date: s.closed_at, displayAmount: "+$1.50" }));
    const infUnpaid = influencerUnpaidSales.map((s: any) => ({ ...s, type: "Influencer (Unpaid)", date: s.closed_at, displayAmount: "+$3.00" }));

    return [...jb, ...sp, ...infPaid, ...infUnpaid]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [jobBoardSales, skillPassportSales, influencerPaidSales, influencerUnpaidSales]);

  // --- Navigation Tabs ---
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "tracker", label: "Marketing Tracker", icon: Database },
    { id: "roster", label: "Marketers", icon: Users },
    { id: "rules", label: "Financial & Rate Policies", icon: Scale },
    { id: "invites", label: "Approved Invites", icon: ShieldCheck },
  ] as const

  // --- UI Components ---
  const overviewStatCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <Card
        onClick={() => setActiveTab("roster")}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer h-full"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-1 relative z-10">
          <CardTitle className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Active Team</CardTitle>
          <Users className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-1 pb-4">
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-black text-slate-800 tracking-tight">{globalStats.teamSize}</div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">Marketers</span>
          </div>
        </CardContent>
      </Card>



      <Card
        onClick={() => {
          setActiveTab("tracker")
          setTrackerTab("influencer")
        }}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer h-full"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-1 relative z-10">
          <CardTitle className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Influencer Referrals</CardTitle>
          <TrendingUp className="h-3.5 w-3.5 text-pink-500 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-1 pb-4">
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-black text-slate-800 tracking-tight">{globalStats.influencerPaidCount + globalStats.influencerUnpaidCount}</div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">Leads</span>
          </div>
        </CardContent>
      </Card>

      <Card
        onClick={() => {
          setActiveTab("tracker")
          setTrackerTab("jobboard")
        }}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer h-full"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-1 relative z-10">
          <CardTitle className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Job Board Sales</CardTitle>
          <Briefcase className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-1 pb-4">
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-black text-slate-800 tracking-tight">{globalStats.jobBoardSales}</div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">Transactions</span>
          </div>
        </CardContent>
      </Card>

      <Card
        onClick={() => {
          setActiveTab("tracker")
          setTrackerTab("skillpassport")
        }}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer h-full"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-1 relative z-10">
          <CardTitle className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Skill Passport</CardTitle>
          <Award className="h-3.5 w-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-1 pb-4">
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-black text-slate-800 tracking-tight">{globalStats.skillPassportSales}</div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">Transactions</span>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group bg-gradient-to-br from-indigo-500 to-violet-700 border-indigo-400 h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-1 relative z-10">
          <CardTitle className="text-[10px] font-extrabold text-indigo-100 uppercase tracking-widest">Master Pool Yield</CardTitle>
          <button
            onClick={() => setShowYield(!showYield)}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          >
            {showYield ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </CardHeader>
        <CardContent className="relative z-10 pt-1 pb-4">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-white tracking-tight leading-none">
              {showYield
                ? `₹${(globalStats.totalIndividualInr * globalStats.teamSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "••••••"}
            </span>
            <div className="flex flex-col mt-1">
              <p className="text-[9px] text-indigo-100 font-black uppercase tracking-tighter">Total Team Incentives</p>
              {showYield && (
                <p className="text-[8px] text-indigo-100/50 font-bold mt-0.5 animate-in fade-in slide-in-from-top-1 duration-300">
                  Calculated: ₹{globalStats.totalIndividualInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {globalStats.teamSize} Members
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 opacity-50">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-semibold">Synchronizing Marketing Strategic Ecosystem...</p>
      </div>
    )
  }

  // --- Viewer Mode Overlay ---
  if (viewingMarketer) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-[60] bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setViewingMarketer(null)} className="flex items-center gap-2 font-bold text-slate-600 hover:text-indigo-600">
              <ArrowLeft className="h-4 w-4" /> Back to Strategic Oversight
            </Button>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="flex flex-col">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Inspecting Associate</p>
              <p className="text-sm font-black text-slate-800 leading-none">{viewingMarketer.name}</p>
            </div>
          </div>
          <Badge className="bg-indigo-100 text-indigo-700 border-0 font-bold px-3 py-1">VIEWER MODE</Badge>
        </div>
        <div className="max-w-[1600px] mx-auto">
          <MarketingDashboard user={{ email: viewingMarketer.email, name: viewingMarketer.name }} onLogout={() => setViewingMarketer(null)} viewerMode={true} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/10">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-600 shadow-lg shadow-indigo-500/25">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Marketing Strategic Oversight</h1>
              <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-500" />
                Performance Audit for {globalStats.teamSize} Authorized Marketers
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-1.5 py-1 rounded-xl border border-slate-200/60 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => setMonthOffset(p => p - 1)}>
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </Button>
            <div className="flex items-center gap-1.5 px-3 min-w-[160px] justify-center">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-sm font-black text-slate-700">{monthName}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => setMonthOffset(p => p + 1)}>
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-1.5 rounded-full border border-indigo-200/50">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-black text-[10px] uppercase shadow-sm">
                {user.name?.substring(0, 2)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-tight">{user.name}</p>
                <p className="text-[9px] text-indigo-500 font-bold">Marketing Head</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 pb-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] border border-b-0 border-slate-200/60'
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

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6 animate-in fade-in duration-500">

        {/* Toggle Modal */}
        <Dialog open={!!confirmUser} onOpenChange={() => setConfirmUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
              <DialogDescription>Toggle the active status of this marketing associate.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Are you sure you want to{" "}
              <span className="font-semibold text-slate-800">
                {confirmUser?.isActive ? "set this associate as Inactive" : "set this associate as Active"}
              </span>
              ?
            </p>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setConfirmUser(null)}>Cancel</Button>
              <Button
                className={confirmUser?.isActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-white hover:bg-emerald-600"}
                onClick={() => {
                  if (confirmUser) {
                    handleToggleActive(confirmUser.id, confirmUser.isActive)
                    setConfirmUser(null)
                  }
                }}
              >
                {confirmUser?.isActive ? "Yes, Set Inactive" : "Yes, Set Active"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {overviewStatCards}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl ring-1 ring-slate-200/50 bg-white overflow-hidden lg:col-span-1 h-fit">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-indigo-500" />
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-indigo-500" /> Pool Share & Breakdown (INR)
                  </CardTitle>
                  <button
                    onClick={() => setShowYield(!showYield)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-indigo-50"
                  >
                    {showYield ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">


                  <div className="relative pl-4 border-l-2 border-pink-500">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-[10px] font-black uppercase text-pink-600 tracking-widest text-left">Influencer Referrals Channel</p>
                        <p className="text-[10px] text-slate-500 font-bold">({influencerPaidSales.length} Paid / {influencerUnpaidSales.length} Unpaid)</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-pink-300" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-black text-pink-800">
                        {showYield
                          ? `₹${(globalStats.influencerInr * globalStats.teamSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "••••••"}
                        <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">(Total)</span>
                      </p>
                    </div>
                    {showYield && (
                      <p className="text-[10px] text-slate-500 font-bold mt-1 bg-pink-50/50 px-2 py-1 rounded inline-block animate-in fade-in duration-300">
                        Math: ₹{(globalStats.influencerInr * globalStats.teamSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ {globalStats.teamSize} Marketers = <span className="text-pink-700">₹{globalStats.influencerInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </p>
                    )}
                  </div>

                  <div className="relative pl-4 border-l-2 border-emerald-500">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest text-left">Job Board Channel</p>
                      <Briefcase className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-black text-emerald-800">
                        {showYield
                          ? `₹${(globalStats.jobBoardInr * globalStats.teamSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "••••••"}
                        <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">(Total)</span>
                      </p>
                    </div>
                    {showYield && (
                      <p className="text-[10px] text-slate-500 font-bold mt-1 bg-emerald-50/50 px-2 py-1 rounded inline-block animate-in fade-in duration-300">
                        Math: ₹{(globalStats.jobBoardInr * globalStats.teamSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ {globalStats.teamSize} Marketers = <span className="text-emerald-700">₹{globalStats.jobBoardInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </p>
                    )}
                  </div>

                  <div className="relative pl-4 border-l-2 border-purple-500">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest text-left">Skill Passport Channel</p>
                      <Award className="h-4 w-4 text-purple-300" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-black text-purple-800">
                        {showYield
                          ? `₹${(globalStats.skillPassportInr * globalStats.teamSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "••••••"}
                        <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">(Total)</span>
                      </p>
                    </div>
                    {showYield && (
                      <p className="text-[10px] text-slate-500 font-bold mt-1 bg-purple-50/50 px-2 py-1 rounded inline-block animate-in fade-in duration-300">
                        Math: ₹{(globalStats.skillPassportInr * globalStats.teamSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ {globalStats.teamSize} Marketers = <span className="text-purple-700">₹{globalStats.skillPassportInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Combined Individual</p>
                    <p className="text-lg font-black text-indigo-700">
                      {showYield
                        ? `₹${globalStats.totalIndividualInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "••••••"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white lg:col-span-2 flex flex-col">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-500" /> Recent Team Activity
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-700 font-black">Latest 10 Hits</Badge>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("tracker")} className="text-indigo-600 font-bold text-xs">View More</Button>
                  </div>
                </CardHeader>
                <div className="flex-1 p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6 text-xs font-bold uppercase tracking-wider text-slate-400">Channel</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Lead ID</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Lead Name</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</TableHead>
                        <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combinedRecentSales.map((sale, i) => (
                        <TableRow key={`recent-${i}`} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                          <TableCell className="pl-6">
                            <Badge
                              variant="outline"
                              className={`${sale.type === "Job Board" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                sale.type === "Skill Passport" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                  "bg-pink-50 text-pink-700 border-pink-200"
                                } text-[10px] font-bold`}
                            >
                              {sale.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-slate-700">
                            {sale.lead_id ? (
                              <Link
                                href={`https://applywizz-crm-tool.vercel.app/leads/${sale.lead_id}`}
                                target="_blank"
                                className="text-indigo-600 hover:underline flex items-center gap-1"
                              >
                                {sale.lead_id}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              sale.jb_id || sale.lead_ref || "N/A"
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-600">
                            {sale.email || sale.full_name || sale.lead_name || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(sale.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right pr-6 font-black text-slate-700">
                            {sale.displayAmount}
                          </TableCell>
                        </TableRow>
                      ))}
                      {combinedRecentSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-20 text-slate-400 italic font-semibold">
                            Awaiting monthly activity data...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>


            </div>
          </div>
        )}

        {activeTab === "tracker" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="relative flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-hidden">
                {/* Animated Background Slider */}
                <div
                  className="absolute top-1 bottom-1 left-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out"
                  style={{
                    width: 'calc(33.33% - 4px)',
                    transform: `translateX(${trackerTab === "influencer" ? '0%' : trackerTab === "jobboard" ? '100%' : '200%'})`
                  }}
                />


                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTrackerTab("influencer")}
                  className={`relative z-10 text-xs font-bold flex-1 md:w-32 transition-colors duration-300 ${trackerTab === "influencer" ? 'text-pink-600' : 'text-slate-500'}`}
                >
                  <TrendingUp className={`h-3.5 w-3.5 mr-2 transition-transform duration-300 ${trackerTab === "influencer" ? 'scale-110' : 'scale-100'}`} /> Influencer Referrals
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTrackerTab("jobboard")}
                  className={`relative z-10 text-xs font-bold flex-1 md:w-32 transition-colors duration-300 ${trackerTab === "jobboard" ? 'text-amber-600' : 'text-slate-500'}`}
                >
                  <Briefcase className={`h-3.5 w-3.5 mr-2 transition-transform duration-300 ${trackerTab === "jobboard" ? 'scale-110' : 'scale-100'}`} /> Job Board
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTrackerTab("skillpassport")}
                  className={`relative z-10 text-xs font-bold flex-1 md:w-32 transition-colors duration-300 ${trackerTab === "skillpassport" ? 'text-purple-600' : 'text-slate-500'}`}
                >
                  <Award className={`h-3.5 w-3.5 mr-2 transition-transform duration-300 ${trackerTab === "skillpassport" ? 'scale-110' : 'scale-100'}`} /> Skill Passport
                </Button>
              </div>
              <div className="flex items-center gap-3 w-full max-w-md justify-end">
                {/* Rows per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rows:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1); // Reset to page 1
                    }}
                    className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Filter identifiers..." value={trackerSearchQuery} onChange={(e) => setTrackerSearchQuery(e.target.value)} className="pl-9 h-9 bg-slate-50 border-slate-200" />
                </div>
              </div>
            </div>

            {/* Tab-wise Table Display with Pagination */}
            <Card className="border border-slate-200/60 shadow-md rounded-2xl overflow-hidden bg-white">
              <CardHeader className={`${trackerTab === 'jobboard' ? 'bg-amber-50/50 border-amber-100' : trackerTab === 'influencer' ? 'bg-pink-50/50 border-pink-100' : 'bg-purple-50/50 border-purple-100'} border-b py-4 px-6 flex flex-row items-center justify-between transition-colors duration-500`}>
                <CardTitle className={`text-lg font-bold flex items-center gap-2 ${trackerTab === 'jobboard' ? 'text-amber-800' : trackerTab === 'influencer' ? 'text-pink-800' : 'text-purple-800'}`}>
                  {trackerTab === 'jobboard' && <><Briefcase className="h-5 w-5" /> Job Board Transaction Logs</>}
                  {trackerTab === 'skillpassport' && <><Award className="h-5 w-5" /> Skill Passport Sales Logs</>}
                  {trackerTab === 'influencer' && <><TrendingUp className="h-5 w-5" /> Influencer Referral Logs</>}
                </CardTitle>
                <Badge className={`${trackerTab === 'jobboard' ? 'bg-amber-100 text-amber-700' : trackerTab === 'influencer' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'} font-black transition-colors duration-500`}>
                  {trackerTab === 'influencer'
                    ? `${influencerPaidSales.length} Paid / ${influencerUnpaidSales.length} Unpaid`
                    : `${activeTableData.length} Total Records`
                  }
                </Badge>
              </CardHeader>
              <div className="overflow-x-auto min-h-[400px]">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead className="pl-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {trackerTab === 'jobboard' ? 'Transaction ID' : trackerTab === 'influencer' ? 'Lead ID' : 'Lead Ref'}
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {trackerTab === 'skillpassport' ? 'Full Name' : trackerTab === 'influencer' ? 'Lead Name' : 'User Email'}
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {trackerTab === 'jobboard' ? 'Amount' : trackerTab === 'skillpassport' ? 'Amount' : trackerTab === 'influencer' ? 'Influencer Status' : 'Closed Date'}
                      </TableHead>
                      <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {trackerTab === 'influencer' ? 'Pool Contribution' : 'Date'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedData(activeTableData).map((sale) => (
                      <TableRow key={sale.id || sale.lead_id || sale.jb_id || sale.lead_ref} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                        <TableCell className="pl-6 font-mono text-xs font-black text-slate-700">
                          {sale.lead_id ? (
                            <Link
                              href={`https://applywizz-crm-tool.vercel.app/leads/${sale.lead_id}`}
                              target="_blank"
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              {sale.lead_id}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            sale.jb_id || sale.lead_ref
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-600">
                          {sale.email || sale.full_name || sale.lead_name}
                        </TableCell>
                        <TableCell className="text-xs font-black">
                          {trackerTab === 'jobboard' ? <span className="text-amber-700">${sale.amount}</span> :
                            trackerTab === 'skillpassport' ? <span className="text-purple-700">{sale.currency} {sale.amount}</span> :
                              trackerTab === 'influencer' ? <Badge className={(sale.influencer_paid_status || '').toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-800 border-transparent' : 'bg-amber-100 text-amber-800 border-transparent'}>{(sale.influencer_paid_status || 'Unknown').charAt(0).toUpperCase() + (sale.influencer_paid_status || 'Unknown').slice(1)}</Badge> :
                                <span className="text-slate-500 font-medium">{new Date(sale.closed_at).toLocaleDateString()}</span>}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {trackerTab === 'influencer' ? <Badge className="bg-pink-100 text-pink-800 border-0 font-black">+${(sale.influencer_paid_status || '').toLowerCase() === 'paid' ? '1.50' : '3.00'} Pool</Badge> :
                            <span className="text-xs text-slate-500 font-medium">{new Date(sale.created_at).toLocaleDateString()}</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeTableData.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 italic">No records found matching your criteria.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Showing <span className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-700">{Math.min(currentPage * itemsPerPage, activeTableData.length)}</span> of <span className="text-slate-700">{activeTableData.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-slate-200"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronFirst className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-slate-200"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1 mx-2">
                      <span className="text-xs font-black text-slate-700 px-2 py-1 bg-white rounded border border-slate-200 shadow-sm">{currentPage}</span>
                      <span className="text-xs font-bold text-slate-400">/</span>
                      <span className="text-xs font-bold text-slate-500">{totalPages}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-slate-200"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-slate-200"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronLast className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === "roster" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Search marketers by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>

            <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" /> Authorized Marketing Network
                </CardTitle>
                <Badge variant="secondary" className="font-black bg-indigo-50 text-indigo-700">{activeMarketers.length} Active</Badge>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Name</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Designation</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-400">Job Board (INR)</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-400">Skill Passport</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-400">Influencer (INR)</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-400">Total Combine</TableHead>
                      <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMarketers.map((rep) => (
                      <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                        <TableCell className="pl-6 py-4 font-medium text-slate-800">{rep.name}</TableCell>
                        <TableCell className="text-slate-600">{rep.email}</TableCell>
                        <TableCell><Badge className="bg-blue-100 text-blue-800 border-none">{rep.role}</Badge></TableCell>
                        <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-800 border-0 font-bold">Active</Badge></TableCell>
                        <TableCell className="text-right font-bold text-slate-700">₹{(rep.job_board_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-bold text-slate-700">₹{(rep.skill_passport_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-bold text-slate-700">₹{(rep.influencer_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-black text-indigo-700">₹{(rep.total_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:bg-amber-50 text-xs h-7 font-bold flex items-center gap-1.5"
                              onClick={() => handleDemoteToTrainee(rep.id)}
                            >
                              Change to Trainee
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-indigo-600 hover:bg-indigo-50 text-xs h-7 font-bold flex items-center gap-1.5"
                              onClick={() => setViewingMarketer(rep)}
                            >
                              <Eye className="h-3.5 w-3.5" /> View Dashboard
                            </Button>
                            <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs h-7 font-bold" onClick={() => setConfirmUser({ id: rep.id, isActive: true, name: rep.name })}>
                              Set Inactive
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeMarketers.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400 italic">No active marketing associates found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {activeTrainees.length > 0 && (
              <Card className="border border-amber-200/60 shadow-sm rounded-2xl overflow-hidden bg-white opacity-90 mt-6">
                <CardHeader className="bg-amber-50 border-b border-amber-100 py-4 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-amber-700 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-500" /> Marketing Trainees
                  </CardTitle>
                </CardHeader>
                <Table>
                  <TableBody>
                    {activeTrainees.map((rep) => (
                      <TableRow key={rep.id} className="hover:bg-amber-50/30 transition-colors border-b border-slate-50">
                        <TableCell className="pl-6 py-3 font-semibold text-slate-700">{rep.name}</TableCell>
                        <TableCell className="text-xs text-slate-400">{rep.email}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:bg-emerald-50 text-xs h-7 font-bold flex items-center gap-1.5"
                              onClick={() => handlePromoteTrainee(rep.id)}
                            >
                              Promote to Associate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:bg-amber-50 text-xs h-7 font-bold flex items-center gap-1.5"
                              onClick={() => setViewingMarketer(rep)}
                            >
                              <Eye className="h-3.5 w-3.5" /> View Dashboard
                            </Button>
                            <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-[10px] h-6 font-bold" onClick={() => setConfirmUser({ id: rep.id, isActive: true, name: rep.name })}>
                              Set Inactive
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {inactiveMarketers.length > 0 && (
              <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white opacity-80 mt-6">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                    <EyeOff className="h-4 w-4" /> Inactive Registry
                  </CardTitle>
                </CardHeader>
                <Table>
                  <TableBody>
                    {inactiveMarketers.map((rep) => (
                      <TableRow key={rep.id} className="hover:bg-slate-100 transition-colors border-b border-slate-100/50">
                        <TableCell className="pl-6 py-3 font-semibold text-slate-500">{rep.name}</TableCell>
                        <TableCell className="text-xs text-slate-400">{rep.email}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="outline" size="sm" className="text-emerald-600 hover:bg-emerald-50 border-emerald-200 text-[10px] h-6 font-bold" onClick={() => setConfirmUser({ id: rep.id, isActive: false, name: rep.name })}>
                            Reactivate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {/* RULES TAB */}
        {activeTab === "rules" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* Premium Financial Configuration System */}
            <Card className={`mb-8 border-0 shadow-xl overflow-hidden ring-1 transition-all duration-500 ${editingRate ? 'ring-indigo-500/30' : 'ring-slate-200/50 hover:ring-indigo-300'}`}>
              {/* Header */}
              <CardHeader className={`transition-all duration-500 relative overflow-hidden ${editingRate ? 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white py-8' : 'bg-white hover:bg-slate-50/80 py-6'}`}>
                {editingRate && (
                  <>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
                    <div className="absolute top-0 right-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                  </>
                )}
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl shadow-inner transition-colors duration-500 ${editingRate ? 'bg-white/10 border border-white/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                      <Settings2 className={`h-7 w-7 ${editingRate ? 'text-indigo-100' : 'text-indigo-600'}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-2xl font-black tracking-tight flex items-center gap-3 ${editingRate ? 'text-white' : 'text-slate-800'}`}>
                        Marketing Financial Engine
                        {editingRate && <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-widest text-[10px]">Active Controls</Badge>}
                      </CardTitle>
                      <p className={`text-sm mt-1.5 font-medium max-w-lg leading-relaxed ${editingRate ? 'text-indigo-200/90' : 'text-slate-500'}`}>
                        Revenue multipliers for {monthName}. Changes implicitly propagate to future cycles.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setEditingRate(!editingRate)}
                    size="lg"
                    className={`font-bold transition-all duration-300 shadow-md ${!editingRate ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg hover:shadow-indigo-600/20' : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm'}`}
                    variant={editingRate ? "outline" : "default"}
                  >
                    {editingRate ? "Hide Control Panel" : "Launch Control Panel"}
                  </Button>
                </div>
              </CardHeader>

              {editingRate && (
                <div className="bg-slate-50/50 animate-in slide-in-from-top-8 fade-in duration-500 ease-out border-t border-slate-200">
                  {/* Tabs */}
                  <div className="flex flex-wrap gap-2 px-6 pt-6 md:px-8 md:pt-8 border-b border-slate-200/50 pb-4">
                    <Button
                      variant={activeConfigTab === 'jobboard' ? "default" : "outline"}
                      onClick={() => setActiveConfigTab('jobboard')}
                      className={`rounded-full transition-all ${activeConfigTab === 'jobboard' ? 'bg-blue-600 hover:bg-blue-700 shadow-sm text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      <Briefcase className="h-4 w-4 mr-2" /> Job Board Matrices
                    </Button>
                    <Button
                      variant={activeConfigTab === 'skillpassport' ? "default" : "outline"}
                      onClick={() => setActiveConfigTab('skillpassport')}
                      className={`rounded-full transition-all ${activeConfigTab === 'skillpassport' ? 'bg-orange-600 hover:bg-orange-700 shadow-sm text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      <Award className="h-4 w-4 mr-2" /> Skill Passport Config
                    </Button>
                    <Button
                      variant={activeConfigTab === 'influencer' ? "default" : "outline"}
                      onClick={() => setActiveConfigTab('influencer')}
                      className={`rounded-full transition-all ${activeConfigTab === 'influencer' ? 'bg-pink-600 hover:bg-pink-700 shadow-sm text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" /> Influencer Referrals Config
                    </Button>
                  </div>

                  <div className="p-6 md:p-8 pt-6">
                    {/* Job Board Section */}
                    {activeConfigTab === 'jobboard' && (
                      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100/50 p-2 rounded-lg"><Briefcase className="h-5 w-5 text-blue-600" /></div>
                            <h3 className="font-bold text-slate-800 tracking-tight text-lg">Job Board Matrices</h3>
                          </div>
                          <Button variant="outline" size="sm" onClick={addCustomTier} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                            + Add Custom Tier
                          </Button>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Card className="border border-blue-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow max-w-sm w-full">
                              <div className="h-1 w-full bg-blue-500"></div>
                              <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Base Rate (1-4 Sales)</label>
                                </div>
                                <div className="relative group flex items-center">
                                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                  <Input value={jbTier1} onChange={(e) => setJbTier1(e.target.value)} className="pl-7 h-11 w-full border-blue-200 focus-visible:ring-blue-500 bg-blue-50/30 text-lg font-bold text-slate-800" />
                                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold uppercase">/sale</span>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border border-indigo-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow max-w-sm w-full">
                              <div className="h-1 w-full bg-indigo-500"></div>
                              <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mid Rate (5-9 Sales)</label>
                                </div>
                                <div className="relative group flex items-center">
                                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                  <Input value={jbTier2} onChange={(e) => setJbTier2(e.target.value)} className="pl-7 h-11 w-full border-indigo-200 focus-visible:ring-indigo-500 bg-indigo-50/30 text-lg font-bold text-slate-800" />
                                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold uppercase">/sale</span>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border border-violet-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow max-w-sm w-full">
                              <div className="h-1 w-full bg-violet-500"></div>
                              <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">High Rate (10+ Sales)</label>
                                </div>
                                <div className="relative group flex items-center">
                                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                  <Input value={jbTier3} onChange={(e) => setJbTier3(e.target.value)} className="pl-7 h-11 w-full border-violet-200 focus-visible:ring-violet-500 bg-violet-50/30 text-lg font-bold text-slate-800" />
                                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold uppercase">/sale</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {customJobBoardTiers.length > 0 && (
                            <div className="space-y-4 border-t border-slate-100 pt-6">
                              <h4 className="text-sm font-bold text-slate-700">Custom Volume Overrides</h4>
                              {customJobBoardTiers.map((tier, index) => (
                                <div key={index} className="flex gap-4 items-center">
                                  <Input placeholder="Sales Threshold" value={tier.threshold} onChange={(e) => updateCustomTier(index, 'threshold', e.target.value)} className="w-1/3" />
                                  <Input placeholder="Rate in INR" value={tier.rate} onChange={(e) => updateCustomTier(index, 'rate', e.target.value)} className="w-1/3" />
                                  <Button variant="ghost" size="sm" onClick={() => removeCustomTier(index)} className="text-red-500">Remove</Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skill Passport Section */}
                    {activeConfigTab === 'skillpassport' && (
                      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                          <div className="bg-orange-100/50 p-2 rounded-lg"><Award className="h-5 w-5 text-orange-600" /></div>
                          <h3 className="font-bold text-slate-800 tracking-tight text-lg">Skill Passport Config</h3>
                        </div>
                        <div className="p-6">
                          <Card className="border border-orange-100 shadow-sm overflow-hidden max-w-sm w-full">
                            <div className="h-1 w-full bg-orange-500"></div>
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Flat Rate</label>
                              </div>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                <Input value={spRate} onChange={(e) => setSpRate(e.target.value)} className="pl-7 h-11 w-full border-orange-200 focus-visible:ring-orange-500 bg-orange-50/30 text-lg font-bold text-slate-800" />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Influencer Section */}
                    {activeConfigTab === 'influencer' && (
                      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                          <div className="bg-pink-100/50 p-2 rounded-lg"><TrendingUp className="h-5 w-5 text-pink-600" /></div>
                          <h3 className="font-bold text-slate-800 tracking-tight text-lg">Influencer Referrals Config</h3>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border border-emerald-100 shadow-sm overflow-hidden max-w-sm w-full">
                              <div className="h-1 w-full bg-emerald-500"></div>
                              <CardContent className="p-5">
                                <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 block">Paid Rate</label>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">$</span>
                                  <Input value={influencerPaidRate} onChange={(e) => setInfluencerPaidRate(e.target.value)} className="pl-7 h-11 border-emerald-200 bg-emerald-50/30 text-lg font-bold text-slate-800" />
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border border-amber-100 shadow-sm overflow-hidden max-w-sm w-full">
                              <div className="h-1 w-full bg-amber-500"></div>
                              <CardContent className="p-5">
                                <label className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 block">Unpaid Rate</label>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">$</span>
                                  <Input value={influencerUnpaidRate} onChange={(e) => setInfluencerUnpaidRate(e.target.value)} className="pl-7 h-11 border-amber-200 bg-amber-50/30 text-lg font-bold text-slate-800" />
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border border-indigo-100 shadow-sm overflow-hidden max-w-sm w-full">
                              <div className="h-1 w-full bg-indigo-500"></div>
                              <CardContent className="p-5">
                                <label className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-3 block">USD to INR Rate</label>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                  <Input value={conversionRate} onChange={(e) => setConversionRate(e.target.value)} className="pl-7 h-11 border-indigo-200 bg-indigo-50/30 text-lg font-bold text-slate-800" />
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save Block */}
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-8">
                      <div className="mb-4 sm:mb-0">
                        <h4 className="text-sm font-bold text-slate-800">Pending Changes Overview</h4>
                        <p className="text-xs text-slate-500">Ensure values are correct. These multipliers instantly reflect across the dashboard upon clicking save.</p>
                      </div>
                      <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" onClick={saveSettings} disabled={savingRate}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {savingRate ? "Committing Sync..." : "Commit Financial Engine"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-pink-50 border-b border-pink-100">
                  <CardTitle className="text-lg font-bold text-pink-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-pink-600" /> Influencer Policy Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-pink-50 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-4 w-4 text-pink-600" /></div>
                      <div>
                        <p className="font-bold text-slate-800">Paid Influencer Sales</p>
                        <p className="text-sm text-slate-500 mt-0.5">Each verified sale from a <b>paid</b> influencer contributes <b>${influencerPaidRate} USD</b> to the Global Marketing Pool.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-pink-50 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-4 w-4 text-pink-600" /></div>
                      <div>
                        <p className="font-bold text-slate-800">Unpaid Influencer Sales</p>
                        <p className="text-sm text-slate-500 mt-0.5">Each verified sale from an <b>unpaid</b> influencer contributes <b>${influencerUnpaidRate} USD</b> to the Global Marketing Pool.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-pink-50 flex items-center justify-center shrink-0 mt-0.5"><Users className="h-4 w-4 text-pink-600" /></div>
                      <div>
                        <p className="font-bold text-slate-800">Equity Distribution</p>
                        <p className="text-sm text-slate-500 mt-0.5">The total USD pool generated from influencer sales is converted to INR and split <b>equally</b> among all active, non-trainee marketing members.</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-amber-50 border-b border-amber-100">
                  <CardTitle className="text-lg font-bold text-amber-900 flex items-center gap-2">
                    <Scale className="h-5 w-5 text-amber-600" /> Job Board Slab Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-amber-800 font-medium mb-4 bg-amber-100/50 p-3 rounded-lg border border-amber-200 flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0" /> Incentives are calculated per transaction based on the total monthly volume.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Slab 01</p>
                        <p className="font-bold text-slate-800">0 - 499 Sales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Rate</p>
                        <p className="font-black text-amber-600">₹{jbTier1} / Sale</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/30">
                      <div>
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1 text-left">Slab 02</p>
                        <p className="font-bold text-slate-800">500 - 999 Sales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Rate</p>
                        <p className="font-black text-emerald-600">₹{jbTier2} / Sale</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-indigo-50/30">
                      <div>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1 text-left">Slab 03</p>
                        <p className="font-bold text-slate-800">1000+ Sales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Rate</p>
                        <p className="font-black text-indigo-600">₹{jbTier3} / Sale</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-purple-50 border-b border-purple-100">
                  <CardTitle className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" /> Skill Passport Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/30">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0"><IndianRupee className="h-5 w-5 text-purple-600" /></div>
                    <div>
                      <div className="font-bold text-purple-900 text-lg leading-tight">Fixed Incentive: ₹{spRate}</div>
                      <div className="text-sm text-purple-700/70 mt-1 font-medium italic">Applied to every completed verification transaction globally.</div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="text-sm text-slate-500 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-purple-400" /> No volume thresholds or caps apply.</div>
                    <div className="text-sm text-slate-500 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Contributions are added instantly to the monthly unified pool.</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        {activeTab === "invites" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 md:p-6">
            <AssessmentAnalyticsPage scope="executive" />
          </div>
        )}
      </div>
    </div>
  )
}
