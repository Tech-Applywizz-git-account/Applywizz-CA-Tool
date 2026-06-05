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
  Trophy, Eye, ChevronLeft, ChevronRight, FileText, Loader2, Crown, Activity,
  Database, FileEdit, EyeOff, IndianRupee, ClipboardList
} from "lucide-react"
import Link from "next/link"
import { ResumeCompletionPanel } from "./resume-completion-panel"
import { WorkingDaysCalendar } from "./working-days-calendar"

interface ResumeHeadDashboardProps {
  user: any;
  onLogout: () => void;
}

type TabType = "overview" | "leaderboard" | "tracker" | "roster" | "rules" | "submitted-forms" | "calendar-config";

export function ResumeHeadDashboard({ user, onLogout }: ResumeHeadDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [resumeReps, setResumeReps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [trackerSearchQuery, setTrackerSearchQuery] = useState("")
  const [confirmRep, setConfirmRep] = useState<{ id: string, isActive: boolean, name: string } | null>(null)
  const [selectedRepSales, setSelectedRepSales] = useState<{ repName: string; sales: any[] } | null>(null)
  const [showYield, setShowYield] = useState(false)

  // Month navigation
  const [monthOffset, setMonthOffset] = useState(0)
  const targetDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset])
  const monthName = useMemo(() => targetDate.toLocaleString("en-US", { month: "long", year: "numeric" }), [targetDate])

  // Financial Engine & API Data
  const [totalResumes, setTotalResumes] = useState<number>(0)
  const [totalForageUsd, setTotalForageUsd] = useState<number>(0)
  const [totalIncentiveInr, setTotalIncentiveInr] = useState<number>(0)
  const [globalActiveRepsCount, setGlobalActiveRepsCount] = useState<number>(0)

  const [resumeData, setResumeData] = useState<any[]>([])
  const [forageSalesData, setForageSalesData] = useState<any[]>([])
  const [backendInsights, setBackendInsights] = useState<any[]>([])

  // Rules
  const [resumeRate, setResumeRate] = useState<string>("80")
  const [baselineTarget, setBaselineTarget] = useState<number>(0)
  const [forageUsdInr, setForageUsdInr] = useState<string>("85")
  const [forageBaseUsd, setForageBaseUsd] = useState<string>("3")
  const [forageTeamUsd, setForageTeamUsd] = useState<string>("2")
  const [forageMs1Usd, setForageMs1Usd] = useState<string>("1000")
  const [forageMs1Inr, setForageMs1Inr] = useState<string>("1500")
  const [forageMs2Usd, setForageMs2Usd] = useState<string>("1500")
  const [forageMs2Inr, setForageMs2Inr] = useState<string>("3000")
  const [forageMs3Usd, setForageMs3Usd] = useState<string>("2000")
  const [forageMs3Inr, setForageMs3Inr] = useState<string>("4500")
  const [forageBase1Usd, setForageBase1Usd] = useState<string>("30")
  const [forageBase2Usd, setForageBase2Usd] = useState<string>("50")
  const [forageBase3Usd, setForageBase3Usd] = useState<string>("100")
  const [forageBase4Usd, setForageBase4Usd] = useState<string>("120")
  const [forageBase5Usd, setForageBase5Usd] = useState<string>("150")

  const fetchResumeUsersAndData = useCallback(async () => {
    setLoading(true)
    try {
      const [calcRes, usersRes, settingsRes] = await Promise.all([
        fetch(`/api/calculate-resume-incentives?period=${encodeURIComponent(monthName)}&t=${Date.now()}`),
        supabase.from("users").select("id, name, email, role, designation, isactive, department, created_at, incentive_amount").eq("department", "Resume"),
        supabase.from("resume_settings").select("key, value")
      ])

      let insightsData: any[] = []
      if (calcRes.ok) {
        const data = await calcRes.json()
        setTotalResumes(data.totalResumes || 0)
        setTotalForageUsd(data.totalForageUsd || 0)
        setTotalIncentiveInr(data.totalIncentiveInr || 0)
        setGlobalActiveRepsCount(data.processedCount || 0)
        insightsData = data.insights || []
        setBackendInsights(insightsData)
        setResumeData(data.resumeData || [])
        setForageSalesData(data.forageSalesData || [])
      }

      if (!usersRes.error && usersRes.data) {
        const targetDateForEnd = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0, 23, 59, 59)
        const normalizedData = usersRes.data
          .filter((u: any) => {
            const userJoinDate = u.created_at ? new Date(u.created_at) : new Date("2000-01-01")
            const isResumeHead = (u.role || "").toLowerCase() === "resume head" || (u.designation || "").toLowerCase() === "resume head"
            return userJoinDate <= targetDateForEnd && !isResumeHead
          })
          .map((u: any) => {
            const emailKey = u.email ? u.email.toLowerCase() : ""
            const insight = insightsData.find((ins: any) => ins.email === emailKey) || {}
            const isTraineeRep = (u.designation || "").toLowerCase().includes("trainee") || (u.role || "").toLowerCase().includes("trainee")

            return {
              id: u.id,
              name: u.name || u.email,
              email: u.email,
              role: u.role,
              designation: u.designation,
              isactive: u.isactive === true,
              isTrainee: isTraineeRep,
              completedResumes: insight.completed_resumes || 0,
              extraResumes: insight.extra_resumes || 0,
              forageSalesUsd: insight.forage_sales_usd || 0,
              totalCombinedInr: isTraineeRep ? 0 : (insight.total_incentive_inr || 0),
              resumeIncentiveInr: isTraineeRep ? 0 : (insight.incentive_inr || 0),
              forageIncentiveInr: isTraineeRep ? 0 : ((insight.forage_direct_incentive_inr || 0) + (insight.forage_team_split_inr || 0) + (insight.forage_bonus_inr || 0)),
            }
          })
        setResumeReps(normalizedData)
      }

      if (!settingsRes.error && settingsRes.data) {
        const map = settingsRes.data.reduce((acc: Record<string, string>, curr: any) => {
          acc[curr.key] = curr.value
          return acc
        }, {} as Record<string, string>)
        const period = monthName
        setResumeRate(map[`resume_rate_${period}`] || map["resume_rate"] || "80")
        setBaselineTarget(map[`resume_baseline_target_${period}`] ? parseInt(map[`resume_baseline_target_${period}`]) : parseInt(map["resume_baseline_target"] || "0"))
        setForageBaseUsd(map[`forage_base_incentive_usd_${period}`] || map["forage_base_incentive_usd"] || "3")
        setForageTeamUsd(map[`forage_team_split_usd_${period}`] || map["forage_team_split_usd"] || "2")
        setForageUsdInr(map[`forage_usd_to_inr_${period}`] || map["forage_usd_to_inr"] || "85")
        setForageMs1Usd(map[`forage_milestone_1_usd_${period}`] || map["forage_milestone_1_usd"] || "1000")
        setForageMs1Inr(map[`forage_milestone_1_inr_${period}`] || map["forage_milestone_1_inr"] || "1500")
        setForageMs2Usd(map[`forage_milestone_2_usd_${period}`] || map["forage_milestone_2_usd"] || "1500")
        setForageMs2Inr(map[`forage_milestone_2_inr_${period}`] || map["forage_milestone_2_inr"] || "3000")
        setForageMs3Usd(map[`forage_milestone_3_usd_${period}`] || map["forage_milestone_3_usd"] || "2000")
        setForageMs3Inr(map[`forage_milestone_3_inr_${period}`] || map["forage_milestone_3_inr"] || "4500")
        setForageBase1Usd(map[`forage_base_1_usd_${period}`] || map["forage_base_1_usd"] || "30")
        setForageBase2Usd(map[`forage_base_2_usd_${period}`] || map["forage_base_2_usd"] || "50")
        setForageBase3Usd(map[`forage_base_3_usd_${period}`] || map["forage_base_3_usd"] || "100")
        setForageBase4Usd(map[`forage_base_4_usd_${period}`] || map["forage_base_4_usd"] || "120")
        setForageBase5Usd(map[`forage_base_5_usd_${period}`] || map["forage_base_5_usd"] || "150")
      }
    } catch (e) {
      console.error("Fetch Data Error:", e)
    } finally {
      setLoading(false)
    }
  }, [monthName, monthOffset])

  useEffect(() => {
    fetchResumeUsersAndData()
  }, [fetchResumeUsersAndData])

  const handleToggleActive = async (repId: string, currentIsActive: boolean) => {
    const { error } = await supabase.from("users").update({ isactive: !currentIsActive }).eq("id", repId)
    if (!error) {
      setResumeReps(prev => prev.map(r => r.id === repId ? { ...r, isactive: !currentIsActive } : r))
    } else {
      alert("Failed to toggle active state: " + error.message)
    }
  }

  const getJobSimulationsCount = (email: string) => {
    const targetEmail = email.toLowerCase();
    return forageSalesData.filter((s: any) => {
      if (!s.forage_info || !s.forage_info[0]) return false;
      const sellerEmailRaw = s.forage_info[0].forage_sold_by_email?.toLowerCase();
      if (!sellerEmailRaw) return false;
      return sellerEmailRaw === targetEmail ||
        sellerEmailRaw === targetEmail.replace('@applywizz.com', '@applywizz.ai') ||
        sellerEmailRaw === targetEmail.replace('@applywizz.ai', '@applywizz.com');
    }).length;
  };

  const handleShowSalesDetails = (repName: string, email: string) => {
    const targetEmail = email.toLowerCase();
    const repSales = forageSalesData.filter((s: any) => {
      if (!s.forage_info || !s.forage_info[0]) return false;
      const sellerEmailRaw = s.forage_info[0].forage_sold_by_email?.toLowerCase();
      if (!sellerEmailRaw) return false;
      return sellerEmailRaw === targetEmail ||
        sellerEmailRaw === targetEmail.replace('@applywizz.com', '@applywizz.ai') ||
        sellerEmailRaw === targetEmail.replace('@applywizz.ai', '@applywizz.com');
    }).map((s: any) => {
      const fInfo = s.forage_info[0];
      return {
        id: s.id,
        lead_name: s.lead_name || s.lead_id || "Unknown Client",
        certs: parseInt(s.forage_internship_certification || fInfo.forage_internship_certification || "0"),
        sold_value: parseFloat(fInfo.forage_sold_value || s.forage_internship_sale_value || "0")
      };
    });
    setSelectedRepSales({ repName, sales: repSales });
  };

  const handlePromoteTrainee = async (repId: string) => {
    const { error } = await supabase.from("users").update({ role: "Resume Associate", designation: "Resume Associate" }).eq("id", repId)
    if (!error) {
      setResumeReps(prev => prev.map(r => r.id === repId ? { ...r, role: "Resume Associate", designation: "Resume Associate", isTrainee: false } : r))
    } else {
      alert("Failed to promote trainee: " + error.message)
    }
  }

  const handleDemoteToTrainee = async (repId: string) => {
    const { error } = await supabase.from("users").update({ role: "Resume Trainee", designation: "Resume Trainee", incentive_amount: 0 }).eq("id", repId)
    if (!error) {
      setResumeReps(prev => prev.map(r => r.id === repId ? { ...r, role: "Resume Trainee", designation: "Resume Trainee", isTrainee: true } : r))
    } else {
      alert("Failed to demote trainee: " + error.message)
    }
  }

  // --- Filtered & Organized Data ---
  const filteredReps = useMemo(() => {
    if (!searchQuery.trim()) return resumeReps
    const q = searchQuery.toLowerCase()
    return resumeReps.filter(r => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q))
  }, [resumeReps, searchQuery])

  const activeReps = filteredReps.filter(r => r.isactive && !r.isTrainee)
  const activeTrainees = filteredReps.filter(r => r.isactive && r.isTrainee)
  const inactiveReps = filteredReps.filter(r => !r.isactive && !r.isTrainee)
  const totalActiveReps = activeReps.length

  // --- Leaderboard Calculation ---
  const leaderboardReps = useMemo(() => {
    return [...activeReps].sort((a, b) => {
      if (b.totalCombinedInr !== a.totalCombinedInr) return b.totalCombinedInr - a.totalCombinedInr
      return b.completedResumes - a.completedResumes
    })
  }, [activeReps])

  const topPerformer = leaderboardReps.length > 0 && leaderboardReps[0].totalCombinedInr > 0 ? leaderboardReps[0] : null

  const [trackerSubTab, setTrackerSubTab] = useState<"resumes" | "forage">("resumes")

  const filteredResumes = useMemo(() => {
    return resumeData.filter(p => !trackerSearchQuery || p.assigned_to_email?.toLowerCase().includes(trackerSearchQuery.toLowerCase()))
  }, [resumeData, trackerSearchQuery])

  const filteredForageSales = useMemo(() => {
    return forageSalesData.filter(g => {
      const email = g.forage_info?.[0]?.forage_sold_by_email || "";
      return !trackerSearchQuery || email.toLowerCase().includes(trackerSearchQuery.toLowerCase());
    })
  }, [forageSalesData, trackerSearchQuery])

  const totalCertifications = useMemo(() => {
    return filteredForageSales.reduce((sum, sale: any) => {
      const certs = parseInt(sale.forage_info?.[0]?.forage_internship_certification || sale.forage_internship_certification || "0")
      return sum + certs;
    }, 0);
  }, [filteredForageSales])

  // --- Navigation Tabs ---
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "tracker", label: "Resume Tracker", icon: Database },
    { id: "submitted-forms", label: "Submitted Forms", icon: ClipboardList },
    { id: "calendar-config", label: "Working Calendar", icon: Calendar },
    { id: "roster", label: "Resume Associates", icon: Users },
    { id: "rules", label: "Incentive Rules", icon: FileText },
  ] as const

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "Completed Resumes", "Forage Sales (USD)", "Total Incentive (INR)"]
    const csvRows = [headers.join(",")]

    leaderboardReps.forEach(rep => {
      csvRows.push([
        `"${(rep.name || "").replace(/"/g, '""')}"`,
        `"${(rep.email || "").replace(/"/g, '""')}"`,
        `"${(rep.role || "").replace(/"/g, '""')}"`,
        `"${rep.isactive ? "Active" : "Inactive"}"`,
        rep.completedResumes,
        rep.forageSalesUsd,
        rep.totalCombinedInr
      ].join(","))
    })

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Resume_Team_Report_${monthName.replace(" ", "_")}.csv`
    link.click()
  }

  // --- UI Components ---
  const overviewStatCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        onClick={() => setActiveTab("roster")}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Active Associates</CardTitle>
          <Users className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-2 pb-5">
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-slate-800 tracking-tight">{globalActiveRepsCount}</div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Members</span>
          </div>
        </CardContent>
      </Card>

      <Card
        onClick={() => {
          setActiveTab("tracker")
          setTimeout(() => document.getElementById("resumes-log")?.scrollIntoView({ behavior: "smooth" }), 100)
        }}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Total Resumes</CardTitle>
          <FileEdit className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-2 pb-5">
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-slate-800 tracking-tight">{totalResumes}</div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Completed</span>
          </div>
        </CardContent>
      </Card>

      <Card
        onClick={() => {
          setActiveTab("tracker")
          setTimeout(() => document.getElementById("forage-log")?.scrollIntoView({ behavior: "smooth" }), 100)
        }}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Forage Sales</CardTitle>
          <DollarSign className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="relative z-10 pt-2 pb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black text-slate-800 tracking-tight">${totalForageUsd}</div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Generated</span>
            </div>
            <p className="text-[10px] text-indigo-600/80 font-bold uppercase tracking-wider">{totalCertifications} Certifications</p>
          </div>
        </CardContent>
      </Card>

      <Card
        onClick={() => setActiveTab("leaderboard")}
        className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group bg-gradient-to-br from-indigo-50 via-white to-blue-50/50 border-blue-200 cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-1 bg-transparent relative z-10">
          <CardTitle className="text-[11px] font-extrabold text-blue-800 uppercase tracking-widest">Master Pool Yield</CardTitle>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowYield(!showYield);
            }}
            className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
          >
            {showYield ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </CardHeader>
        <CardContent className="pt-3 relative z-10 pb-5">
          <div className="flex flex-col mb-2">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-800 tracking-tighter leading-none">
              {showYield ? `₹${totalIncentiveInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••"}
            </span>
          </div>
          <p className="text-[10px] text-blue-800/70 font-semibold mt-1">Shared among active members</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/10">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-600 shadow-lg shadow-indigo-500/25">
                <FileEdit className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Resume Head Command Center</h1>
              <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-500" />
                Monitoring {activeReps.length + activeTrainees.length} active member{(activeReps.length + activeTrainees.length) !== 1 ? 's' : ''}
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
            {monthOffset !== 0 && (
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-2" onClick={() => setMonthOffset(0)}>
                Today
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-1.5 rounded-full border border-indigo-200/50">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-black text-[10px] uppercase shadow-sm">
                {user.name?.substring(0, 2) || "RH"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-tight">{user.name}</p>
                <p className="text-[9px] text-indigo-500 font-bold">Resume Head</p>
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
        <Dialog open={!!confirmRep} onOpenChange={() => setConfirmRep(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
              <DialogDescription>Toggle the active status of this resume associate.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Are you sure you want to{" "}
              <span className="font-semibold text-slate-800">
                {confirmRep?.isActive ? "set this associate as Inactive" : "set this associate as Active"}
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 font-semibold">Synchronizing Resume Metrics...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {overviewStatCards}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-xl ring-1 ring-slate-200/50 bg-white overflow-hidden lg:col-span-1">
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-indigo-500" />
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Target className="h-5 w-5 text-indigo-500" /> Top Performer Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 flex flex-col items-center text-center">
                      {topPerformer && topPerformer.totalCombinedInr > 0 ? (
                        <>
                          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4 relative">
                            <Crown className="h-10 w-10 text-white" />
                          </div>
                          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{topPerformer.name}</h2>
                          <p className="text-slate-500 font-medium mt-1">{topPerformer.email}</p>
                          <div className="flex items-center gap-4 mt-6">
                            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Completed</p>
                              <p className="text-2xl font-black text-emerald-700">{topPerformer.completedResumes}</p>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl">
                              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Incentive Yield</p>
                              <p className="text-2xl font-black text-indigo-700">₹{topPerformer.totalCombinedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-slate-400 italic">No incentives recorded yet for {monthName}.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white lg:col-span-2 flex flex-col">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" /> Leaderboard Snippet
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("leaderboard")} className="text-indigo-600 text-xs h-7">View Full</Button>
                    </CardHeader>
                    <div className="flex-1 p-0 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16 text-center text-xs">Rank</TableHead>
                            <TableHead className="text-xs">Associate</TableHead>
                            <TableHead className="text-center text-xs">Completed Resumes</TableHead>
                            <TableHead className="text-center text-xs">Forage Sales</TableHead>
                            <TableHead className="text-right pr-6 text-xs">Yield</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboardReps.slice(0, 4).map((rep, idx) => (
                            <TableRow key={rep.id}>
                              <TableCell className="text-center font-bold text-slate-500">{idx + 1}</TableCell>
                              <TableCell className="font-semibold text-slate-700">{rep.name}</TableCell>
                              <TableCell className="text-center"><Badge variant="secondary" className="shadow-none">{rep.completedResumes}</Badge></TableCell>
                              <TableCell className="text-center"><Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 shadow-none">${rep.forageSalesUsd}</Badge></TableCell>
                              <TableCell className="text-right pr-6 font-bold text-indigo-600">₹{rep.totalCombinedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                          ))}
                          {leaderboardReps.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No active members yet.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-500" /> Resume Associates Breakdown
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("roster")} className="text-indigo-600 text-xs h-7">Manage Associates</Button>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center"><Users className="h-4 w-4 text-indigo-600" /></div>
                            <span className="font-bold text-indigo-900">Active Associates</span>
                          </div>
                          <span className="text-2xl font-black text-indigo-600">{activeReps.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><Activity className="h-4 w-4 text-emerald-600" /></div>
                            <span className="font-bold text-emerald-900">Active Trainees</span>
                          </div>
                          <span className="text-2xl font-black text-emerald-600">{activeTrainees.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center"><EyeOff className="h-4 w-4 text-slate-500" /></div>
                            <span className="font-bold text-slate-700">Inactive Members</span>
                          </div>
                          <span className="text-2xl font-black text-slate-500">{inactiveReps.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="space-y-6">
                {overviewStatCards}

                <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" /> Resume Leaderboard
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2 font-semibold">
                      <FileText className="h-4 w-4" /> Export Leaders
                    </Button>
                  </CardHeader>
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Rank</TableHead>
                        <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Associate</TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Resumes Completed</TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Forage Sales (USD)</TableHead>
                        <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Incentive Yield</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardReps.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">No active resume reps found.</TableCell></TableRow>
                      ) : (
                        leaderboardReps.map((rep, idx) => (
                          <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                            <TableCell className="text-center">
                              {idx === 0 ? (
                                <div className="h-8 w-8 mx-auto rounded-full bg-amber-100 flex items-center justify-center"><Crown className="h-4 w-4 text-amber-600" /></div>
                              ) : idx === 1 ? (
                                <div className="h-8 w-8 mx-auto rounded-full bg-slate-100 flex items-center justify-center"><span className="text-slate-500 font-black">2</span></div>
                              ) : idx === 2 ? (
                                <div className="h-8 w-8 mx-auto rounded-full bg-orange-50 flex items-center justify-center"><span className="text-orange-600 font-black">3</span></div>
                              ) : (
                                <span className="font-bold text-slate-400">{idx + 1}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-bold text-slate-800">{rep.name}</div>
                              <div className="text-xs text-slate-400">{rep.email}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-slate-100 text-slate-700 shadow-none hover:bg-slate-200 border-0">{rep.completedResumes}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-amber-50 text-amber-700 shadow-none hover:bg-amber-100 border border-amber-200">${rep.forageSalesUsd}</Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="font-black text-base text-slate-800">₹{rep.totalCombinedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* TRACKER */}
            {activeTab === "tracker" && (
              <div className="space-y-6">
                {overviewStatCards}

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setTrackerSubTab("resumes")}
                      className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${trackerSubTab === "resumes"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                      Resume Registry
                    </button>
                    <button
                      onClick={() => setTrackerSubTab("forage")}
                      className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${trackerSubTab === "forage"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                      Forage Certificates
                    </button>
                  </div>
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search records by email..." value={trackerSearchQuery} onChange={(e) => setTrackerSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                </div>

                {trackerSubTab === "resumes" ? (
                  <Card id="resumes-log" className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white scroll-mt-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileEdit className="h-5 w-5 text-emerald-500" /> Completed Resumes Log
                      </CardTitle>
                      <Badge variant="secondary" className="font-black bg-emerald-50 text-emerald-700">{filteredResumes.length} Records</Badge>
                    </CardHeader>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                      <Table>
                        <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="pl-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Assigned To</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                            <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Completed At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResumes.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">No resumes logged for {monthName}.</TableCell></TableRow>
                          ) : (
                            filteredResumes.map((row, i) => (
                              <TableRow key={i} className="hover:bg-slate-50 border-b border-slate-50">
                                <TableCell className="pl-6 text-sm font-semibold text-slate-700">{row.assigned_to_email || 'Unassigned'}</TableCell>
                                <TableCell><Badge className="bg-emerald-50 text-emerald-600 border-0">{row.status}</Badge></TableCell>
                                <TableCell className="text-right pr-6 text-xs text-slate-500">{new Date(row.updated_at).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                ) : (
                  <Card id="forage-log" className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white scroll-mt-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-indigo-500" /> Forage Sales Log
                      </CardTitle>
                      <Badge variant="secondary" className="font-black bg-indigo-50 text-indigo-700">{filteredForageSales.length} Records</Badge>
                    </CardHeader>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                      <Table>
                        <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="pl-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Sold By</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Certifications</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Sale Value (USD)</TableHead>
                            <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Closed At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredForageSales.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No forage sales logged for {monthName}.</TableCell></TableRow>
                          ) : (
                            filteredForageSales.map((row, i) => {
                              const fInfo = row.forage_info?.[0] || {};
                              const certs = row.forage_internship_certification || fInfo.forage_internship_certification || '0';
                              const soldValue = fInfo.forage_sold_value || row.forage_internship_sale_value || '0';
                              return (
                                <TableRow key={i} className="hover:bg-slate-50 border-b border-slate-50">
                                  <TableCell className="pl-6 text-sm font-semibold text-slate-700">{fInfo.forage_sold_by_email || 'Unknown'}</TableCell>
                                  <TableCell><Badge className="bg-indigo-50 text-indigo-600 border-0">{certs} Certs</Badge></TableCell>
                                  <TableCell className="text-sm font-bold text-slate-700">${soldValue}</TableCell>
                                  <TableCell className="text-right pr-6 text-xs text-slate-500">{new Date(row.closed_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ROSTER */}
            {activeTab === "roster" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search reps by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                </div>

                <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" /> Active Resume Associates
                    </CardTitle>
                    <Badge variant="secondary" className="font-black bg-indigo-50 text-indigo-700 hover:bg-indigo-100">{activeReps.length} Active</Badge>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Identity Details</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 text-blue-700">Resumes Completed</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-emerald-700 text-center">Job Simulations</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-blue-700 text-right">Incentive on Resumes</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-emerald-700 text-right">Incentive on Job Sim</TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-400">Total Yield</TableHead>
                          <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeReps.length === 0 ? (
                          <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">No active members found.</TableCell></TableRow>
                        ) : (
                          activeReps.map((rep) => (
                            <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                              <TableCell className="pl-6 py-4">
                                <div className="font-bold text-slate-800">{rep.name}</div>
                                <div className="text-xs text-slate-400">{rep.email}</div>
                              </TableCell>
                              <TableCell><Badge className="bg-emerald-100 text-emerald-800 shadow-none border-0">Active</Badge></TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <div className="font-bold text-blue-700 bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-100">
                                    {rep.completedResumes}
                                  </div>
                                  {rep.extraResumes > 0 && (
                                    <div className="text-[10px] text-emerald-600 font-bold mt-1">+{rep.extraResumes} Extra</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div
                                  className="flex flex-col items-center cursor-pointer hover:scale-105 transition-all"
                                  onClick={() => handleShowSalesDetails(rep.name || rep.email, rep.email)}
                                >
                                  <div className="font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 w-fit px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                                    {getJobSimulationsCount(rep.email)}
                                  </div>
                                  {rep.forageSalesUsd > 0 && (
                                    <div className="text-[10px] text-emerald-500/70 mt-1 font-bold">${rep.forageSalesUsd.toLocaleString()}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-bold text-slate-700">
                                  ₹{(rep.resumeIncentiveInr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-bold text-slate-700">
                                  ₹{(rep.forageIncentiveInr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-black text-indigo-700">₹{rep.totalCombinedInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="outline" size="sm" className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200 text-xs h-7" onClick={() => handleDemoteToTrainee(rep.id)}>
                                    Change to Trainee
                                  </Button>
                                  <Link href={`/resume-head-dashboard/resume/${rep.id}?month=${encodeURIComponent(monthName)}`}>
                                    <Button variant="outline" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 text-xs h-7">
                                      <Eye className="h-3.5 w-3.5" /> View Dashboard
                                    </Button>
                                  </Link>
                                  <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs h-7" onClick={() => setConfirmRep({ id: rep.id, isActive: true, name: rep.name })}>
                                    Set Inactive
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
                {/* Trainees Table */}
                <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white mt-8">
                  <CardHeader className="bg-white border-b border-slate-100 py-4 px-6">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-500" /> Active Resume Trainees
                    </CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Identity Details</TableHead>
                          <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Resumes</TableHead>
                          <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Forage (USD)</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                          <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTrainees.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">No active trainees found.</TableCell></TableRow>
                        ) : (
                          activeTrainees.map((rep) => (
                            <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                              <TableCell className="pl-6 py-4">
                                <div className="font-bold text-slate-800">{rep.name}</div>
                                <div className="text-xs text-slate-400">{rep.email}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold border-0">{rep.completedResumes}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 font-bold">${rep.forageSalesUsd}</Badge>
                              </TableCell>
                              <TableCell><Badge className="bg-emerald-100 text-emerald-800 shadow-none border-0">Active</Badge></TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 shadow-sm italic">
                                    Trainee (No Dashboard)
                                  </div>
                                  <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 text-xs h-7" onClick={() => handlePromoteTrainee(rep.id)}>
                                    Promote to Associate
                                  </Button>
                                  <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs h-7" onClick={() => setConfirmRep({ id: rep.id, isActive: true, name: rep.name })}>
                                    Set Inactive
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            )}

            {/* RULES */}
            {activeTab === "rules" && (
              <div className="space-y-6">
                <Card className="border border-indigo-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-blue-500" />
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8">
                    <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                      <FileText className="h-7 w-7 text-indigo-600" /> Resume Compensation Matrix
                    </CardTitle>
                    <p className="text-slate-500 mt-2">Currently applied rates for {monthName}.</p>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-700 border-b border-slate-100 pb-2">Resume Processing</h3>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex justify-between items-center">
                          <span className="font-semibold text-slate-600">Base Quota (No Incentive)</span>
                          <span className="text-2xl font-black text-slate-800">{baselineTarget}</span>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 flex justify-between items-center">
                          <span className="font-semibold text-indigo-900">Per Extra Resume Rate</span>
                          <span className="text-2xl font-black text-indigo-700">₹{resumeRate}</span>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex justify-between items-center mt-4">
                          <span className="font-semibold text-blue-900">USD to INR Forex Rate</span>
                          <span className="text-2xl font-black text-blue-700">₹{forageUsdInr}</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-emerald-700 border-b border-emerald-100 pb-2">Job Simulation (Forage) Splits</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                            <span className="text-xs font-bold text-emerald-600 uppercase">Seller Direct</span>
                            <div className="text-2xl font-black text-emerald-700 mt-1">${forageBaseUsd}</div>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                            <span className="text-xs font-bold text-emerald-600 uppercase">Team Pool</span>
                            <div className="text-2xl font-black text-emerald-700 mt-1">${forageTeamUsd}</div>
                          </div>
                        </div>

                        <div className="bg-violet-50 rounded-xl p-5 border border-violet-100">
                          <span className="text-xs font-bold text-violet-600 uppercase block mb-3">Volume Bonus Tiers</span>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm font-semibold text-violet-900">
                              <span>Tier 1 (${forageMs1Usd})</span>
                              <span>+₹{forageMs1Inr}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold text-violet-900">
                              <span>Tier 2 (${forageMs2Usd})</span>
                              <span>+₹{forageMs2Inr}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold text-violet-900">
                              <span>Tier 3 (${forageMs3Usd})</span>
                              <span>+₹{forageMs3Inr}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SUBMITTED FORMS */}
            {activeTab === "submitted-forms" && (
              <ResumeCompletionPanel monthOffset={monthOffset} />
            )}

            {/* CALENDAR CONFIG */}
            {activeTab === "calendar-config" && (
              <WorkingDaysCalendar
                monthOffset={monthOffset}
                periodName={monthName}
                onRecalculateNeeded={async () => {
                  await fetchResumeUsersAndData();
                }}
              />
            )}

          </>
        )}
      </div>

      <Dialog open={!!selectedRepSales} onOpenChange={() => setSelectedRepSales(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800">
              Job Simulations for {selectedRepSales?.repName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Detailed list of all forage certifications sold in {monthName}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto border border-slate-100 rounded-xl mt-4">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-xs">Client Name</TableHead>
                  <TableHead className="font-bold text-xs text-center">Certifications</TableHead>
                  <TableHead className="font-bold text-xs text-right pr-6">Sale Value (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRepSales?.sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-slate-400 text-sm">
                      No qualified job simulation sales found.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {selectedRepSales?.sales.map((sale: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-700 text-sm">{sale.lead_name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-bold text-indigo-600 bg-indigo-50 border-indigo-100">
                            {sale.certs} Cert{sale.certs > 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-bold text-slate-800 text-sm">
                          ${sale.sold_value.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-50/80 font-black border-t border-slate-200">
                      <TableCell className="text-slate-800 text-sm font-bold pl-6">Total</TableCell>
                      <TableCell className="text-center font-bold">
                        <Badge className="font-black text-indigo-700 bg-indigo-100 border-indigo-200 hover:bg-indigo-150">
                          {selectedRepSales?.sales.reduce((sum, s) => sum + s.certs, 0)} Certs
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-indigo-700 text-sm font-black">
                        ${selectedRepSales?.sales.reduce((sum, s) => sum + s.sold_value, 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
