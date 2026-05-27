"use client"
import { DiscoveryCallForm } from "./discovery-call-form"
import { OrientationCallForm } from "./orientation-call-form"
import { RenewalCallForm } from "./renewal-call-form"
import { ProgressiveCallForm } from "./progressive-call-form"
import { AccountsSubmittedFormsPanel } from "./accounts-submitted-forms-panel"

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign, Calendar, LogOut, Trophy, Sparkles, ChevronLeft, ChevronRight,
  Loader2, Activity, RefreshCw, TrendingUp, Users, CheckCircle2, XCircle,
  Percent, Award, Zap, BarChart3, ArrowUpRight, Flame, Gift, Receipt, Menu, X,
  ClipboardList, Clock, Eye, EyeOff, Search
} from "lucide-react"
import dynamic from "next/dynamic"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, FileText } from "lucide-react"

const AMExpectedRevenuePanel = dynamic(() => import("./am-expected-revenue-panel").then((mod) => mod.AMExpectedRevenuePanel), { ssr: false })


type SidebarTab = "tracker" | "incentive" | "bonuses" | "renewals" | "upcoming" | "submitted-forms" | "discovery-call" | "orientation-call" | "renewal-call" | "progressive-call";

interface AccountsDashboardProps {
  user: any
  onLogout: () => void
  isViewOnly?: boolean
}

export function AccountsDashboard({ user, onLogout, isViewOnly = false }: AccountsDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [amData, setAmData] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  
  const [activeTab, setActiveTab] = useState<SidebarTab>("tracker");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upcomingSearch, setUpcomingSearch] = useState("");

  const [renewalRecordsPage, setRenewalRecordsPage] = useState(1);
  const [renewalRecordsPerPage, setRenewalRecordsPerPage] = useState(10);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingPerPage, setUpcomingPerPage] = useState(10);
  const [openForms, setOpenForms] = useState<SidebarTab[]>([]);
  const [showIncentive, setShowIncentive] = useState(false);

  const targetDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset])
  const monthName = useMemo(() => targetDate.toLocaleString("default", { month: "long", year: "numeric" }), [targetDate])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const month = targetDate.getMonth() + 1
      const year = targetDate.getFullYear()
      const res = await fetch(`/api/accounts-data?email=${encodeURIComponent(user.email)}&month=${month}&year=${year}`)
      const data = await res.json()
      if (data.success && data.accountManagers?.length) {
        setAmData(data.accountManagers[0])
        setConfig(data.config)
      } else {
        setAmData(null)
      }
    } catch (e) {
      console.error("Error fetching accounts data:", e)
    }
    setLoading(false)
  }, [targetDate, user.email])

  const handleRecalculate = async () => {
    if (isViewOnly) return
    setRecalculating(true)
    try {
      const month = targetDate.getMonth() + 1
      const year = targetDate.getFullYear()
      await fetch(`/api/calculate-accounts-incentives?email=${encodeURIComponent(user.email)}&month=${month}&year=${year}`)
      await fetchData()
    } catch (e) {
      console.error("Recalculation error:", e)
    }
    setRecalculating(false)
  }

  useEffect(() => { fetchData() }, [fetchData])

  const am = amData || {
    totalRenewals: 0, successfulRenewals: 0, failedRenewals: 0,
    monthlyRevenueUSD: 0, renewalRate: 0, baseIncentive: 0,
    renewalMultiplier: 0, performanceBonus: 0, finalIncentive: 0,
    dailyRevenue: {}, renewals: [], dueThisMonth: [], dueNextMonth: []
  }

  const dailyEntries = Object.entries(am.dailyRevenue || {}).sort(([a], [b]) => a.localeCompare(b))

  const currentSlabLabel = useMemo(() => {
    if (!config?.slabRules) return "—"
    const sorted = [...config.slabRules].sort((a: any, b: any) => b.threshold - a.threshold)
    for (const rule of sorted) {
      if (am.monthlyRevenueUSD >= rule.threshold) return `$${rule.threshold.toLocaleString()}+ → ₹${rule.incentive.toLocaleString()}`
    }
    return "$0 – $3,999 → ₹0"
  }, [am.monthlyRevenueUSD, config])

  const multiplierLabel = useMemo(() => {
    if (am.renewalMultiplier === 0) return "❌ Below 50%"
    return `${am.renewalMultiplier}x`
  }, [am.renewalMultiplier])

  const navItems: { id: SidebarTab; label: string; icon: any; color: string; gradient: string }[] = [
    {
      id: "tracker",
      label: "Expected Revenue",
      icon: Flame,
      color: "text-orange-500",
      gradient: "linear-gradient(135deg, #f97316, #f59e0b)",
    },
    {
      id: "incentive",
      label: "Incentive Achieved",
      icon: TrendingUp,
      color: "text-indigo-500",
      gradient: "linear-gradient(135deg, #6366f1, #a855f7)",
    },
    {
      id: "bonuses",
      label: "Daily Bonuses & Slabs",
      icon: Gift,
      color: "text-emerald-500",
      gradient: "linear-gradient(135deg, #10b981, #14b8a6)",
    },
    {
      id: "renewals",
      label: "Renewal Records",
      icon: Receipt,
      color: "text-blue-500",
      gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    },
    {
      id: "upcoming",
      label: "Upcoming Renewals",
      icon: ClipboardList,
      color: "text-rose-500",
      gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
    },
    {
      id: "submitted-forms",
      label: "Submitted Forms",
      icon: ClipboardList,
      color: "text-pink-500",
      gradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
    }
  ];

  const formTabs = [
    { id: "discovery-call", label: "Discovery Call Form", icon: FileText, color: "text-slate-500", gradient: "linear-gradient(135deg, #64748b, #475569)" },
    { id: "orientation-call", label: "Orientation Call Form", icon: FileText, color: "text-slate-500", gradient: "linear-gradient(135deg, #64748b, #475569)" },
    { id: "renewal-call", label: "Renewal Call form", icon: FileText, color: "text-slate-500", gradient: "linear-gradient(135deg, #64748b, #475569)" },
    { id: "progressive-call", label: "Progressive Call", icon: FileText, color: "text-slate-500", gradient: "linear-gradient(135deg, #64748b, #475569)" },
  ];

  const allNavItems = [...navItems, ...formTabs.filter(f => openForms.includes(f.id as SidebarTab))];

  const MonthBar = () => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 font-semibold h-8 px-2"
        onClick={() => setMonthOffset((p) => p - 1)}>
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 px-3 text-sm shadow-sm min-w-[100px] flex items-center gap-2"
        onClick={() => setMonthOffset(0)}>
        {recalculating && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />}
        {monthName}
      </Button>
      <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 font-semibold h-8 px-2"
        onClick={() => setMonthOffset((p) => p + 1)}>
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  const renderIncentivePanel = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const thisMonthRenewals = am.dueThisMonth || [];
    
    const todayWork = thisMonthRenewals.filter((d: any) => {
      if (!d.expected_renewal_date) return false;
      const dateStr = new Date(d.expected_renewal_date).toISOString().split('T')[0];
      return !d.renewed && dateStr <= todayStr;
    });

    const tomorrowWork = thisMonthRenewals.filter((d: any) => {
      if (!d.expected_renewal_date) return false;
      const dateStr = new Date(d.expected_renewal_date).toISOString().split('T')[0];
      return !d.renewed && dateStr === tomorrowStr;
    });

    const sortedMonthRenewals = [...thisMonthRenewals]
      .filter((d: any) => !d.renewed)
      .sort((a: any, b: any) => {
        return (a.expected_renewal_date || "").localeCompare(b.expected_renewal_date || "");
      });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Incentive Achieved
            </h2>
            <p className="text-sm text-slate-500 mt-1 ml-12">Breakdown of your incentive for {monthName}</p>
          </div>
          <div className="flex gap-4 items-center">
            {!isViewOnly && (
              <Button onClick={handleRecalculate} disabled={recalculating} className="bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                 {recalculating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                 Recalculate
              </Button>
            )}
            <MonthBar />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="backdrop-blur-md bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-400" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Renewals</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">{am.totalRenewals}</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-100/80"><Users className="h-5 w-5 text-blue-600" /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✓ {am.successfulRenewals} Paid</span>
                <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">✗ {am.failedRenewals} Unpaid</span>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Renewal Revenue</p>
                  <p className="text-3xl font-black text-emerald-700 mt-1">${am.monthlyRevenueUSD.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-100/80"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mt-3">Slab: {currentSlabLabel}</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-purple-400" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Renewal Rate</p>
                  <p className="text-3xl font-black text-violet-700 mt-1">{am.renewalRate}%</p>
                </div>
                <div className="p-2 rounded-xl bg-violet-100/80"><Percent className="h-5 w-5 text-violet-600" /></div>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mt-3">Multiplier: {multiplierLabel}</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-indigo-50 border border-indigo-100 shadow-sm overflow-hidden transition-all duration-300">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-500">Final Incentive</p>
                    <button 
                      onClick={() => setShowIncentive(!showIncentive)} 
                      className="p-1 rounded hover:bg-indigo-100/80 text-indigo-500 hover:text-indigo-700 transition-colors"
                      title={showIncentive ? "Hide Incentive" : "Show Incentive"}
                    >
                      {showIncentive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-3xl font-black text-indigo-700 mt-1">
                    {showIncentive ? `₹${am.finalIncentive.toLocaleString()}` : "••••••"}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-indigo-100/80"><Trophy className="h-5 w-5 text-indigo-600" /></div>
              </div>
              <p className="text-[10px] font-semibold text-indigo-600 mt-3">
                {showIncentive ? (
                  `Base ₹${am.baseIncentive.toLocaleString()} × ${am.renewalMultiplier}x + Bonus ₹${am.performanceBonus.toLocaleString()}`
                ) : (
                  "Base ₹•••••• × •x + Bonus ₹••••••"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Renewals Schedule */}
        <Card className="backdrop-blur-md bg-white border border-slate-200 shadow-sm overflow-hidden mt-6">
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-purple-500 to-indigo-500" />
          <CardHeader>
            <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5">
              <ClipboardList className="h-5 w-5 text-indigo-500" /> Renewals Work Schedule
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-500">Clients to work on for renewals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Today's Work */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] uppercase tracking-widest font-bold text-orange-500 mb-3 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> Today's Renewals ({todayWork.length})
                </div>
                {todayWork.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto p-1">
                    {todayWork.map((d: any, i: number) => {
                      const dateStr = d.expected_renewal_date ? new Date(d.expected_renewal_date).toISOString().split('T')[0] : '';
                      const isDelayed = dateStr < todayStr;
                      
                      return (
                        <div key={i} className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white px-4 py-3 rounded-xl border border-slate-200 hover:border-orange-300 transition-all shadow-sm relative overflow-hidden">
                          {/* Priority indicator */}
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${isDelayed ? 'bg-gradient-to-b from-red-500 to-orange-500' : 'bg-gradient-to-b from-orange-400 to-amber-500'}`} />
                          
                          <div className="flex items-center gap-4 flex-1">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{d.lead_name || "—"}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-indigo-600 font-mono text-[11px] font-bold">{d.awl_id || d.lead_id}</p>
                                {isDelayed && (
                                  <Badge className="bg-red-50 text-red-600 border border-red-100 text-[9px] px-1 py-0 font-bold">
                                    Delayed
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold">
                              ⏳ Pending
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between gap-4 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg max-w-2xl w-full">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-400">Expected:</span>
                              <span className={`font-bold ${isDelayed ? 'text-red-600' : 'text-slate-700'}`}>
                                {d.expected_renewal_date ? new Date(d.expected_renewal_date).toLocaleDateString() : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-400">Service Start:</span>
                              <span className="font-bold text-slate-700">{d.service_start_date ? new Date(d.service_start_date).toLocaleDateString() : "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-400">Cycle:</span>
                              <span className="font-bold text-slate-700">{d.subscription_cycle || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-400">Ext. Days:</span>
                              <span className="font-bold text-slate-700">{d.renewal_extension_days || "0"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No renewals scheduled for today.</p>
                )}
              </div>

              {/* Tomorrow's Work */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] uppercase tracking-widest font-bold text-purple-500 mb-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tomorrow's Renewals ({tomorrowWork.length})
                </div>
                {tomorrowWork.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto p-1">
                    {tomorrowWork.map((d: any, i: number) => (
                      <div key={i} className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white px-4 py-3 rounded-xl border border-slate-200 hover:border-purple-300 transition-all shadow-sm relative overflow-hidden">
                        {/* Priority indicator */}
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 to-indigo-500" />
                        
                        <div className="flex items-center gap-4 flex-1">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{d.lead_name || "—"}</p>
                            <p className="text-indigo-600 font-mono text-[11px] font-bold mt-0.5">{d.awl_id || d.lead_id}</p>
                          </div>
                          
                          <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold">
                            ⏳ Pending
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-4 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg max-w-2xl w-full">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-400">Expected:</span>
                            <span className="font-bold text-slate-700">
                              {d.expected_renewal_date ? new Date(d.expected_renewal_date).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-400">Service Start:</span>
                            <span className="font-bold text-slate-700">{d.service_start_date ? new Date(d.service_start_date).toLocaleDateString() : "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-400">Cycle:</span>
                            <span className="font-bold text-slate-700">{d.subscription_cycle || "—"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-400">Ext. Days:</span>
                            <span className="font-bold text-slate-700">{d.renewal_extension_days || "0"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No renewals scheduled for tomorrow.</p>
                )}
              </div>
            </div>

            {/* Full Month Schedule */}
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Current Month Schedule</p>
              <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Date</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Lead Name</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">AWL ID</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Service Start</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Cycle</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Ext. Days</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMonthRenewals.map((d: any, i: number) => (
                      <TableRow key={i} className={d.renewed ? "bg-emerald-50/20" : ""}>
                        <TableCell className="text-xs font-bold text-slate-600">
                          {d.expected_renewal_date ? new Date(d.expected_renewal_date).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700">{d.lead_name || "—"}</TableCell>
                        <TableCell className="text-xs font-mono text-indigo-600 font-bold">{d.awl_id || d.lead_id}</TableCell>
                        <TableCell className="text-xs text-slate-500">{d.service_start_date ? new Date(d.service_start_date).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-xs text-center text-slate-500 font-semibold">{d.subscription_cycle || "—"}</TableCell>
                        <TableCell className="text-xs text-center text-slate-500 font-semibold">{d.renewal_extension_days || "0"}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`border-none text-[10px] ${d.renewed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {d.renewed ? "Renewed" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedMonthRenewals.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">No renewals found for this month</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderBonusesPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Gift className="h-5 w-5 text-white" />
            </div>
            Daily Bonuses & Slab Rules
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">Your performance metrics for {monthName}</p>
        </div>
        <MonthBar />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="shadow-md border-slate-200 overflow-hidden bg-white">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Daily Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              {dailyEntries.length > 0 ? (
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar px-4 pb-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-bold text-[10px] uppercase text-slate-400">Date</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-right">Revenue (USD)</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-center">Bonus Qualified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyEntries.map(([date, revenue]: [string, any]) => {
                        const bonusThresholds = config?.performanceBonuses || []
                        const minThreshold = bonusThresholds.length > 0 ? Math.min(...bonusThresholds.map((b: any) => b.threshold)) : Infinity
                        const qualified = revenue >= minThreshold
                        return (
                          <TableRow key={date} className={qualified ? "bg-emerald-50/30" : ""}>
                            <TableCell className="font-bold text-sm text-slate-700">{new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-700">${Number(revenue).toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              {qualified ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-slate-300 mx-auto" />}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 rounded-xl m-4 bg-slate-50/50">
                  <Activity className="h-10 w-10 text-slate-200 mb-3" />
                  <p className="text-slate-400 font-medium">No daily revenue recorded.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {config && (
             <Card className="shadow-md border-slate-200 overflow-hidden">
               <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-pink-400" />
               <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
                 <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                   <Award className="h-4 w-4 text-rose-500" /> Performance Bonuses
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                 <Table>
                   <TableBody>
                     {(config.performanceBonuses || []).sort((a: any, b: any) => a.bonus - b.bonus).map((b: any, i: number) => (
                       <TableRow key={i}>
                         <TableCell className="text-xs font-bold text-slate-600">{b.days}+ days @ ${b.threshold}+</TableCell>
                         <TableCell className="text-xs font-bold text-rose-700 text-right">₹{b.bonus.toLocaleString()}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
          )}
        </div>

        <div className="space-y-6">
          {config && (
            <>
              <Card className="shadow-md border-slate-200 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-purple-400" />
                <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <Sparkles className="h-4 w-4 text-violet-500" /> Revenue Slabs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {(config.slabRules || []).sort((a: any, b: any) => a.min - b.min).map((s: any, i: number) => (
                        <TableRow key={i} className={(am.monthlyRevenueUSD >= s.min && am.monthlyRevenueUSD <= s.max) ? "bg-violet-50/50" : ""}>
                          <TableCell className="text-xs font-bold text-slate-600">
                            {s.max >= 999999 
                              ? `$${s.min.toLocaleString()}+` 
                              : `$${s.min.toLocaleString()} - $${s.max.toLocaleString()}`}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-violet-700 text-right">₹{s.incentive.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="shadow-md border-slate-200 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-400" />
                <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <ArrowUpRight className="h-4 w-4 text-amber-500" /> Renewal Multipliers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {(config.multipliers || []).sort((a: any, b: any) => a.min - b.min).map((m: any, i: number) => (
                        <TableRow key={i} className={am.renewalRate >= m.min && am.renewalRate <= m.max ? "bg-amber-50/50" : ""}>
                          <TableCell className="text-xs font-bold text-slate-600">{m.min}%–{m.max}%</TableCell>
                          <TableCell className="text-xs font-bold text-amber-700 text-right">{m.multiplier === 0 ? "❌ No incentive" : `${m.multiplier}x`}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderRenewalsPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            Successful Renewal Records
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">{am.renewals?.length || 0} successful renewals for {monthName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(renewalRecordsPerPage)} onValueChange={(v: string) => { setRenewalRecordsPerPage(Number(v)); setRenewalRecordsPage(1); }}>
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
          <MonthBar />
        </div>
      </div>

      <Card className="shadow-md border-slate-200 overflow-hidden bg-white">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">#</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Lead</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">AWL ID</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-right">Renewal Value ($)</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Closed At</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const sortedRenewals = (am.renewals || []).sort((a: any, b: any) => (b.closed_at || "").localeCompare(a.closed_at || ""));
                  const paginatedRenewals = sortedRenewals.slice((renewalRecordsPage - 1) * renewalRecordsPerPage, renewalRecordsPage * renewalRecordsPerPage);
                  
                  return paginatedRenewals.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No successful renewal records for this month</TableCell></TableRow>
                  ) : paginatedRenewals.map((r: any, i: number) => (
                    <TableRow key={r.id || i} className="bg-emerald-50/20">
                      <TableCell className="text-xs font-bold text-slate-400">{(renewalRecordsPage - 1) * renewalRecordsPerPage + i + 1}</TableCell>
                      <TableCell className="font-bold text-sm text-slate-700">{r.lead_name || "—"}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{r.lead_id || r.awl_id || "—"}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">${Number(r.application_sale_value || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-slate-500">{r.closed_at ? new Date(r.closed_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-xs text-slate-500">{r.payment_mode || "—"}</TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {(am.renewals || []).length > renewalRecordsPerPage && (
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                Showing {(renewalRecordsPage - 1) * renewalRecordsPerPage + 1} to {Math.min(renewalRecordsPage * renewalRecordsPerPage, (am.renewals || []).length)} of {(am.renewals || []).length} records
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => setRenewalRecordsPage(p => Math.max(1, p - 1))} disabled={renewalRecordsPage === 1}>Previous</Button>
                <div className="text-xs font-bold text-slate-600 px-3 h-8 flex items-center bg-white border border-slate-200 rounded-lg">{renewalRecordsPage} / {Math.ceil((am.renewals || []).length / renewalRecordsPerPage) || 1}</div>
                <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => setRenewalRecordsPage(p => Math.min(Math.ceil((am.renewals || []).length / renewalRecordsPerPage), p + 1))} disabled={renewalRecordsPage === Math.ceil((am.renewals || []).length / renewalRecordsPerPage)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const nextMonthName = useMemo(() => {
    const d = new Date(targetDate);
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  }, [targetDate]);

  const renderUpcomingPanel = () => {
    const thisMonth = am.dueThisMonth || [];
    const nextMonth = am.dueNextMonth || [];
    const renewedThisMonth = thisMonth.filter((d: any) => d.renewed);
    const pendingThisMonth = thisMonth.filter((d: any) => !d.renewed);
    const pendingNextMonth = nextMonth.filter((d: any) => !d.renewed);

    const filteredThisMonth = pendingThisMonth.filter((d: any) => 
      (d.lead_name || "").toLowerCase().includes(upcomingSearch.toLowerCase()) ||
      (d.awl_id || d.lead_id || "").toLowerCase().includes(upcomingSearch.toLowerCase())
    );

    const filteredNextMonth = pendingNextMonth.filter((d: any) => 
      (d.lead_name || "").toLowerCase().includes(upcomingSearch.toLowerCase()) ||
      (d.awl_id || d.lead_id || "").toLowerCase().includes(upcomingSearch.toLowerCase())
    );

    const RenewalTable = ({ items, showStatus }: { items: any[]; showStatus: boolean }) => {
      const [currentPage, setCurrentPage] = useState(1);
      const totalPages = Math.ceil(items.length / upcomingPerPage) || 1;
      const paginatedItems = items.slice((currentPage - 1) * upcomingPerPage, currentPage * upcomingPerPage);

      return (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">#</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Lead Name</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">AWL ID</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Service Start</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Cycle</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Ext. Days</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Expected Date</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Closed At</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-right">Original Value ($)</TableHead>
                  {showStatus && <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Status</TableHead>}
                  {showStatus && <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-right">Renewal Value ($)</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((d: any, i: number) => (
                  <TableRow key={d.lead_id + i} className={d.renewed ? "bg-emerald-50/30" : ""}>
                    <TableCell className="text-xs font-bold text-slate-400">{(currentPage - 1) * upcomingPerPage + i + 1}</TableCell>
                <TableCell className="font-bold text-sm text-slate-700">{d.lead_name || "—"}</TableCell>
                <TableCell className="text-xs font-mono text-indigo-600 font-bold">{d.awl_id || d.lead_id}</TableCell>
                <TableCell className="text-xs text-slate-500">{d.service_start_date ? new Date(d.service_start_date).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-xs text-center text-slate-500 font-semibold">{d.subscription_cycle || "—"}</TableCell>
                <TableCell className="text-xs text-center text-slate-500 font-semibold">{d.renewal_extension_days || "0"}</TableCell>
                <TableCell className="text-xs text-slate-500">{new Date(d.expected_renewal_date).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs text-slate-500">{d.renewal_closed_at ? new Date(d.renewal_closed_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-right font-bold text-slate-600">${d.original_sale_value.toLocaleString()}</TableCell>
                {showStatus && (
                  <TableCell className="text-center">
                    <Badge className={`border-none text-[10px] ${d.renewed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {d.renewed ? "✓ Renewed" : "⏳ Pending"}
                    </Badge>
                  </TableCell>
                )}
                {showStatus && (
                  <TableCell className="text-right font-bold text-emerald-700">
                    {d.renewed ? `$${d.renewal_sale_value.toLocaleString()}` : "—"}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={showStatus ? 7 : 5} className="text-center text-slate-400 py-8">No renewals found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {items.length > upcomingPerPage && (
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            Showing {(currentPage - 1) * upcomingPerPage + 1} to {Math.min(currentPage * upcomingPerPage, items.length)} of {items.length} records
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <div className="text-xs font-bold text-slate-600 px-3 h-8 flex items-center bg-white border border-slate-200 rounded-lg">{currentPage} / {totalPages}</div>
            <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>
      )}
      </>
    );
  };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/20">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              Upcoming Renewals
            </h2>
            <p className="text-sm text-slate-500 mt-1 ml-12">Clients due for renewal this month & next month</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search lead or AWL ID..."
                value={upcomingSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpcomingSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-white"
              />
            </div>
            <Select value={String(upcomingPerPage)} onValueChange={(v: string) => { setUpcomingPerPage(Number(v)); }}>
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
            <MonthBar />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-400" />
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Due This Month</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{thisMonth.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Renewed ✓</p>
              <p className="text-3xl font-black text-emerald-700 mt-1">{renewedThisMonth.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-400" />
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Pending ⏳</p>
              <p className="text-3xl font-black text-amber-700 mt-1">{pendingThisMonth.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-purple-400" />
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Due Next Month</p>
              <p className="text-3xl font-black text-violet-700 mt-1">{nextMonth.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* This Month Table */}
        <Card className="shadow-md border-slate-200 overflow-hidden bg-white">
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-pink-500" />
          <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <Calendar className="h-4 w-4 text-rose-500" /> Due This Month — {monthName}
              <Badge className="ml-2 bg-slate-100 text-slate-600 border-none text-[10px]">{filteredThisMonth.length} clients</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RenewalTable items={filteredThisMonth} showStatus={true} />
          </CardContent>
        </Card>

        {/* Next Month Table */}
        <Card className="shadow-md border-slate-200 overflow-hidden bg-white">
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-purple-500" />
          <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <Clock className="h-4 w-4 text-violet-500" /> Due Next Month — {nextMonthName}
              <Badge className="ml-2 bg-slate-100 text-slate-600 border-none text-[10px]">{filteredNextMonth.length} clients</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RenewalTable items={filteredNextMonth} showStatus={false} />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-[#f5f6fa] flex flex-col">
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
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Accounts Portal</p>
                  <p className="text-sm font-black text-slate-800 leading-tight">My Dashboard</p>
                </div>
              </div>
            </div>

            {/* Center: user info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-xs text-slate-400 leading-tight">{user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md text-white font-black text-base border-2 border-white">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm font-semibold text-xs px-2.5">
                {user.role || 'Accounts Associate'}
              </Badge>
            </div>

            {/* Right: logout / Viewing Badge / Forms */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="h-9 font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm"
                onClick={() => window.open(process.env.NEXT_PUBLIC_SEND_INVOICE_LINK || "#", "_blank")}
              >
                Send Invoice
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
                    <FileText className="h-4 w-4 mr-2" /> Forms <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-bold text-sm text-slate-700">
                  <DropdownMenuItem onClick={() => {
                    if (!openForms.includes("discovery-call")) setOpenForms([...openForms, "discovery-call"]);
                    setActiveTab("discovery-call");
                  }}>
                    Discovery Call Form
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    if (!openForms.includes("orientation-call")) setOpenForms([...openForms, "orientation-call"]);
                    setActiveTab("orientation-call");
                  }}>
                    Orientation Call Form
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    if (!openForms.includes("renewal-call")) setOpenForms([...openForms, "renewal-call"]);
                    setActiveTab("renewal-call");
                  }}>
                    Renewal Call form
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    if (!openForms.includes("progressive-call")) setOpenForms([...openForms, "progressive-call"]);
                    setActiveTab("progressive-call");
                  }}>
                    Progressive Call Form
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isViewOnly ? (
                <Badge variant="outline" className="h-9 px-4 rounded-xl border-amber-200 bg-amber-50 text-amber-700 font-bold border-2">
                  <Eye className="h-4 w-4 mr-2" /> Viewing Mode
                </Badge>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={onLogout} className="h-9 rounded-xl hover:bg-slate-100 text-red-500 font-bold hidden sm:flex">
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onLogout} className="h-9 w-9 rounded-xl hover:bg-slate-100 text-red-500 sm:hidden">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
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
                  <p className="text-sm font-bold text-slate-700">Accounts Tools</p>
                </div>
              </div>
            </div>

          {/* Nav items */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {allNavItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as SidebarTab); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                    isActive ? 'shadow-md' : 'hover:bg-slate-50'
                  }`}
                  style={isActive ? { background: item.gradient } : {}}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={isActive ? { background: 'rgba(255,255,255,0.22)' } : {}}
                  >
                    <Icon className={isActive ? 'text-white' : item.color} style={{ width: '1.1rem', height: '1.1rem' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-700 group-hover:text-slate-800'}`}>
                      {item.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Active</span>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-5 lg:p-8 overflow-auto">
          {/* Page title bar with gradient */}
          <div className={`mb-6 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden ${
            activeTab === 'tracker' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
            activeTab === 'incentive' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' :
            activeTab === 'bonuses' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
            activeTab === 'upcoming' ? 'bg-gradient-to-r from-rose-500 to-pink-600' :
            activeTab === 'submitted-forms' ? 'bg-gradient-to-r from-pink-500 to-rose-600' :
            'bg-gradient-to-r from-blue-500 to-cyan-600'
          }`}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-20 w-24 h-24 rounded-full bg-white/5 translate-y-8" />

            <div className="relative">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-0.5">Accounts Management</p>
              <h1 className="text-2xl font-black tracking-tight">
                {activeTab === 'tracker' ? '🔥 Expected Revenue Tracker' :
                 activeTab === 'incentive' ? '📈 Incentive Achieved' :
                 activeTab === 'bonuses' ? '🎁 Daily Bonuses & Slabs' :
                 activeTab === 'upcoming' ? '📋 Upcoming Renewals' :
                 activeTab === 'submitted-forms' ? '📝 Submitted Forms' :
                 '🧾 Renewal Records'}
              </h1>
              <p className="text-white/70 text-sm mt-1 font-medium">
                Welcome back, <strong className="text-white">{user.name}</strong>
              </p>
            </div>
          </div>

          {loading && activeTab !== 'tracker' ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-5" />
              <p className="text-slate-500 font-semibold">Loading accounts data...</p>
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
                  <AMExpectedRevenuePanel user={user} calMonthOverride={monthOffset} viewerMode={isViewOnly} />
                </Suspense>
              )}
              {activeTab === 'incentive' && renderIncentivePanel()}
              {activeTab === 'bonuses' && renderBonusesPanel()}
              {activeTab === 'renewals' && renderRenewalsPanel()}
              {activeTab === 'upcoming' && renderUpcomingPanel()}
              {activeTab === 'submitted-forms' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/20">
                          <ClipboardList className="h-5 w-5 text-white" />
                        </div>
                        Submitted Forms
                      </h2>
                      <p className="text-sm text-slate-500 mt-1 ml-12">Your submitted form records for {monthName}</p>
                    </div>
                    <MonthBar />
                  </div>
                  <AccountsSubmittedFormsPanel repEmail={user.email} monthOffset={monthOffset} viewerMode={isViewOnly} />
                </div>
              )}
              {activeTab === 'discovery-call' && <DiscoveryCallForm user={user} viewerMode={isViewOnly} />}
              {activeTab === 'orientation-call' && <OrientationCallForm user={user} viewerMode={isViewOnly} />}
              {activeTab === 'renewal-call' && <RenewalCallForm user={user} viewerMode={isViewOnly} />}
              {activeTab === 'progressive-call' && <ProgressiveCallForm user={user} viewerMode={isViewOnly} />}
            </>
          )}
        </main>
      </div>
    </div>
    </>
  )
}
