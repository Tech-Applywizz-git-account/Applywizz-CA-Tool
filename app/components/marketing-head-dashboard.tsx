"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Users, DollarSign, Calendar, Search, LogOut, LayoutDashboard, Target,
  Trophy, Eye, ChevronLeft, ChevronRight, FileText, Loader2, Activity,
  Database, EyeOff, IndianRupee, Megaphone, TrendingUp, CheckCircle2,
  Globe, Briefcase, Award, Info, Scale, ShieldCheck, Calculator, ArrowLeft,
  ChevronLast, ChevronFirst, ExternalLink
} from "lucide-react"
import Link from "next/link"
import { MarketingDashboard } from "./marketing-dashboard"

interface MarketingHeadDashboardProps {
  user: any;
  onLogout: () => void;
}

type TabType = "overview" | "tracker" | "roster" | "rules";
type TrackerTabType = "applywizz" | "jobboard" | "skillpassport" | "influencer";

const ITEMS_PER_PAGE = 10;

export function MarketingHeadDashboard({ user, onLogout }: MarketingHeadDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [trackerTab, setTrackerTab] = useState<TrackerTabType>("applywizz")
  const [marketers, setMarketers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [trackerSearchQuery, setTrackerSearchQuery] = useState("")
  const [confirmUser, setConfirmUser] = useState<{ id: string, isActive: boolean, name: string } | null>(null)
  const [showYield, setShowYield] = useState(false)
  const [viewingMarketer, setViewingMarketer] = useState<any | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

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
    applyWizzSales: 0,
    jobBoardSales: 0,
    skillPassportSales: 0,
    totalIndividualInr: 0,
    applyWizzInr: 0,
    jobBoardInr: 0,
    skillPassportInr: 0,
    influencerPaidCount: 0,
    influencerUnpaidCount: 0,
    influencerInr: 0,
  })

  const [freshSales, setFreshSales] = useState<any[]>([])
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
          applyWizzSales: data.applyWizz?.freshSalesCount || 0,
          jobBoardSales: data.jobBoard?.salesCount || 0,
          skillPassportSales: data.skillPassport?.salesCount || 0,
          totalIndividualInr: data.totalIndividualInr || 0,
          applyWizzInr: data.applyWizz?.individualInr || 0,
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
          setFreshSales(detailData.freshSales || []);
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
        setMarketers(normalizedData)
      }
    } catch (e) {
      console.error("Fetch Data Error:", e)
    } finally {
      setLoading(false)
    }
  }, [monthName, monthOffset, targetDate, user.email])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
  const filteredFreshSales = freshSales.filter(s => !trackerSearchQuery || s.lead_id?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))
  const filteredJbSales = jobBoardSales.filter(s => !trackerSearchQuery || s.jb_id?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))
  const filteredSpSales = skillPassportSales.filter(s => !trackerSearchQuery || s.lead_ref?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))
  const allInfluencerSales = [...influencerPaidSales, ...influencerUnpaidSales];
  const filteredInfSales = allInfluencerSales.filter(s => !trackerSearchQuery || s.lead_id?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))

  // --- Pagination Logic ---
  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }

  const activeTableData = useMemo(() => {
    if (trackerTab === "applywizz") return filteredFreshSales
    if (trackerTab === "jobboard") return filteredJbSales
    if (trackerTab === "influencer") return filteredInfSales
    return filteredSpSales
  }, [trackerTab, filteredFreshSales, filteredJbSales, filteredSpSales, filteredInfSales])

  const totalPages = Math.ceil(activeTableData.length / ITEMS_PER_PAGE)

  // --- Navigation Tabs ---
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "tracker", label: "Marketing Tracker", icon: Database },
    { id: "roster", label: "Marketers", icon: Users },
    { id: "rules", label: "Incentive Policies", icon: Scale },
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
          setTrackerTab("applywizz")
        }}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer h-full"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-1 relative z-10">
          <CardTitle className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">ApplyWizz Leads</CardTitle>
          <Globe className="h-3.5 w-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-1 pb-4">
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-black text-slate-800 tracking-tight">{globalStats.applyWizzSales}</div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">Verified</span>
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

      <Card 
        onClick={() => {
          setActiveTab("tracker")
          setTrackerTab("influencer")
        }}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer h-full"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-1 relative z-10">
          <CardTitle className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">From Influencer</CardTitle>
          <TrendingUp className="h-3.5 w-3.5 text-pink-500 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-1 pb-4">
          <div className="flex items-baseline gap-1.5">
            <div className="text-3xl font-black text-slate-800 tracking-tight">{globalStats.influencerPaidCount + globalStats.influencerUnpaidCount}</div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">Leads</span>
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
                  <div className="relative pl-4 border-l-2 border-blue-500">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest text-left">ApplyWizz Channel</p>
                      <Globe className="h-4 w-4 text-blue-300" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-black text-blue-800">
                        {showYield 
                          ? `₹${(globalStats.applyWizzInr * globalStats.teamSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : "••••••"} 
                        <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">(Total)</span>
                      </p>
                    </div>
                    {showYield && (
                      <p className="text-[10px] text-slate-500 font-bold mt-1 bg-blue-50/50 px-2 py-1 rounded inline-block animate-in fade-in duration-300">
                        Math: ₹{(globalStats.applyWizzInr * globalStats.teamSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ {globalStats.teamSize} Marketers = <span className="text-blue-700">₹{globalStats.applyWizzInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

                  <div className="relative pl-4 border-l-2 border-pink-500">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase text-pink-600 tracking-widest text-left">From Influencer Channel</p>
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
                    <TrendingUp className="h-5 w-5 text-emerald-500" /> Latest Global Hits
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("tracker")} className="text-indigo-600 font-bold text-xs">View Tracker</Button>
                </CardHeader>
                <div className="flex-1 p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6 text-xs font-bold uppercase tracking-wider text-slate-400">Source</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Lead ID</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</TableHead>
                        <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Pool Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {freshSales.slice(0, 8).map((sale) => (
                        <TableRow key={`hit-${sale.id || sale.lead_id || sale.jb_id || sale.lead_ref}`}>
                          <TableCell className="pl-6"><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">Apply-Wizz</Badge></TableCell>
                          <TableCell className="font-mono text-[11px] font-bold text-slate-600">
                            <Link 
                              href={`https://applywizz-crm-tool.vercel.app/leads/${sale.lead_id}`}
                              target="_blank"
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              {sale.lead_id}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{new Date(sale.closed_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right pr-6"><Badge className="bg-emerald-100 text-emerald-800 border-0 font-black text-[10px]">+$3 USD</Badge></TableCell>
                        </TableRow>
                      ))}
                      {freshSales.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 italic font-semibold">Awaiting monthly sales data...</TableCell></TableRow>
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
                    width: 'calc(25% - 4px)',
                    transform: `translateX(${trackerTab === "applywizz" ? '0%' : trackerTab === "jobboard" ? '100%' : trackerTab === "skillpassport" ? '200%' : '300%'})`
                  }}
                />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTrackerTab("applywizz")}
                  className={`relative z-10 text-xs font-bold flex-1 md:w-32 transition-colors duration-300 ${trackerTab === "applywizz" ? 'text-emerald-600' : 'text-slate-500'}`}
                >
                  <Globe className={`h-3.5 w-3.5 mr-2 transition-transform duration-300 ${trackerTab === "applywizz" ? 'scale-110' : 'scale-100'}`} /> ApplyWizz
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTrackerTab("influencer")}
                  className={`relative z-10 text-xs font-bold flex-1 md:w-32 transition-colors duration-300 ${trackerTab === "influencer" ? 'text-pink-600' : 'text-slate-500'}`}
                >
                  <TrendingUp className={`h-3.5 w-3.5 mr-2 transition-transform duration-300 ${trackerTab === "influencer" ? 'scale-110' : 'scale-100'}`} /> Influencer
                </Button>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Filter identifiers..." value={trackerSearchQuery} onChange={(e) => setTrackerSearchQuery(e.target.value)} className="pl-9 h-9 bg-slate-50 border-slate-200" />
              </div>
            </div>

            {/* Tab-wise Table Display with Pagination */}
            <Card className="border border-slate-200/60 shadow-md rounded-2xl overflow-hidden bg-white">
                <CardHeader className={`${trackerTab === 'applywizz' ? 'bg-emerald-50/50 border-emerald-100' : trackerTab === 'jobboard' ? 'bg-amber-50/50 border-amber-100' : trackerTab === 'influencer' ? 'bg-pink-50/50 border-pink-100' : 'bg-purple-50/50 border-purple-100'} border-b py-4 px-6 flex flex-row items-center justify-between transition-colors duration-500`}>
                  <CardTitle className={`text-lg font-bold flex items-center gap-2 ${trackerTab === 'applywizz' ? 'text-emerald-800' : trackerTab === 'jobboard' ? 'text-amber-800' : trackerTab === 'influencer' ? 'text-pink-800' : 'text-purple-800'}`}>
                    {trackerTab === 'applywizz' && <><Globe className="h-5 w-5" /> ApplyWizz Fresh Sales Logs</>}
                    {trackerTab === 'jobboard' && <><Briefcase className="h-5 w-5" /> Job Board Transaction Logs</>}
                    {trackerTab === 'skillpassport' && <><Award className="h-5 w-5" /> Skill Passport Sales Logs</>}
                    {trackerTab === 'influencer' && <><TrendingUp className="h-5 w-5" /> Influencer Sales Logs</>}
                  </CardTitle>
                  <Badge className={`${trackerTab === 'applywizz' ? 'bg-emerald-100 text-emerald-700' : trackerTab === 'jobboard' ? 'bg-amber-100 text-amber-700' : trackerTab === 'influencer' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'} font-black transition-colors duration-500`}>
                    {activeTableData.length} Total Records
                  </Badge>
                </CardHeader>
                <div className="overflow-x-auto min-h-[400px]">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow>
                        <TableHead className="pl-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {trackerTab === 'applywizz' ? 'Lead Identifier' : trackerTab === 'jobboard' ? 'Transaction ID' : trackerTab === 'influencer' ? 'Lead ID' : 'Lead Ref'}
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {trackerTab === 'skillpassport' ? 'Full Name' : trackerTab === 'influencer' ? 'Lead Name' : 'User Email'}
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {trackerTab === 'jobboard' ? 'Amount' : trackerTab === 'skillpassport' ? 'Amount' : trackerTab === 'influencer' ? 'Influencer Status' : 'Closed Date'}
                        </TableHead>
                        <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {trackerTab === 'applywizz' ? 'Pool Contribution' : trackerTab === 'influencer' ? 'Pool Contribution' : 'Date'}
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
                            {trackerTab === 'applywizz' ? <Badge className="bg-emerald-100 text-emerald-800 border-0 font-black">+$3 USD Pool</Badge> :
                             trackerTab === 'influencer' ? <Badge className="bg-pink-100 text-pink-800 border-0 font-black">+${(sale.influencer_paid_status || '').toLowerCase() === 'paid' ? '1.50' : '3.00'} Pool</Badge> :
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
                      Showing <span className="text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, activeTableData.length)}</span> of <span className="text-slate-700">{activeTableData.length}</span>
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
                      <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Marketing Associate</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-400">Pool Share (INR)</TableHead>
                      <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMarketers.map((rep) => (
                      <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                        <TableCell className="pl-6 py-4">
                          <div className="font-bold text-slate-800">{rep.name}</div>
                          <div className="text-xs text-slate-400">{rep.email}</div>
                        </TableCell>
                        <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-800 border-0 font-bold">Active</Badge></TableCell>
                        <TableCell className="text-right font-black text-indigo-700">₹{globalStats.totalIndividualInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-500" /> ApplyWizz & Fresh Lead Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="h-4 w-4 text-indigo-600" /></div>
                      <div>
                        <p className="font-bold text-slate-800">Verified Sale Attribution</p>
                        <p className="text-sm text-slate-500 mt-0.5">Every uniquely fresh, verified lead closure attributes exactly <b>$3.00 USD</b> to the Unified Global Marketing Pool.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck className="h-4 w-4 text-indigo-600" /></div>
                      <div>
                        <p className="font-bold text-slate-800">Fresh Lead Eligibility</p>
                        <p className="text-sm text-slate-500 mt-0.5">A lead is considered "Fresh" only if it has never had a prior successful sale in the system's history.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5"><Users className="h-4 w-4 text-indigo-600" /></div>
                      <div>
                        <p className="font-bold text-slate-800">Equity Distribution</p>
                        <p className="text-sm text-slate-500 mt-0.5">The total USD pool is converted to INR and split <b>equally</b> among all active, non-trainee marketing members.</p>
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
                        <p className="font-black text-amber-600">₹30 / Sale</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/30">
                      <div>
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1 text-left">Slab 02</p>
                        <p className="font-bold text-slate-800">500 - 999 Sales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Rate</p>
                        <p className="font-black text-emerald-600">₹35 / Sale</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-indigo-50/30">
                      <div>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1 text-left">Slab 03</p>
                        <p className="font-bold text-slate-800">1000+ Sales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Rate</p>
                        <p className="font-black text-indigo-600">₹40 / Sale</p>
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
                       <div className="font-bold text-purple-900 text-lg leading-tight">Fixed Incentive: ₹30.00</div>
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
      </div>
    </div>
  )
}
