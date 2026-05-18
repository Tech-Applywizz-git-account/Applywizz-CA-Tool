"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { LayoutDashboard, Users, UserPlus, LogOut, DollarSign, Calendar, ChevronLeft, ChevronRight, Eye, RefreshCw, FileText, CheckCircle2, CircleDollarSign, Target, Code2, Database, Loader2, EyeOff } from "lucide-react"
import Link from "next/link"

interface CroTechDashboardProps {
    basePath: string;
    user: any;
    onLogout: () => void;
}

export function CroTechDashboard({ basePath, user, onLogout }: CroTechDashboardProps) {
    const [techReps, setTechReps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const [monthOffset, setMonthOffset] = useState<number>(0)

    // Configuration states
    const [editingRate, setEditingRate] = useState(false)
    const [savingRate, setSavingRate] = useState(false)
    const [activeConfigTab, setActiveConfigTab] = useState<string>("portfolio")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])
    const [portfolioUsdValue, setPortfolioUsdValue] = useState<string>("2")
    const [githubUsdValue, setGithubUsdValue] = useState<string>("20")
    const [usdInrRate, setUsdInrRate] = useState<string>("85")
    const [gitRepoBaseSale, setGitRepoBaseSale] = useState<string>("140")
    const [gitRepoBaseInc, setGitRepoBaseInc] = useState<string>("7")
    const [gitRepoStep, setGitRepoStep] = useState<string>("10")
    const [gitRepoStepInc, setGitRepoStepInc] = useState<string>("2")
    const [portfolioRateUSD, setPortfolioRateUSD] = useState<number>(2)
    const [githubRateUSD, setGithubRateUSD] = useState<number>(20)

    const [totalPortfolios, setTotalPortfolios] = useState<number>(0)
    const [totalGithubs, setTotalGithubs] = useState<number>(0)
    const [portfolioPoolUsd, setPortfolioPoolUsd] = useState<number>(0)
    const [githubPoolUsd, setGithubPoolUsd] = useState<number>(0)
    const [totalPoolUsd, setTotalPoolUsd] = useState<number>(0)
    const [globalGitSalesYieldUsd, setGlobalGitSalesYieldUsd] = useState<number>(0)
    const [globalGitSalesCount, setGlobalGitSalesCount] = useState<number>(0)
    const [globalActiveRepsCount, setGlobalActiveRepsCount] = useState<number>(0)
    const [individualShareInr, setIndividualShareInr] = useState<number>(0)
    const [individualShareUsd, setIndividualShareUsd] = useState<number>(0)
    const [conversionRate, setConversionRate] = useState<number>(85)

    const getMonthName = () => {
        const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
        const m = targetDate.toLocaleString("en-US", { month: "long" });
        const y = targetDate.getFullYear();
        return `${m} ${y}`;
    }

    const fetchTechUsers = async () => {
        setLoading(true)
        const targetMonthStr = getMonthName();

        try {
            // Parallelize all primary data fetches
            const [calcRes, usersRes, settingsRes] = await Promise.all([
                fetch(`/api/calculate-tech-incentives?period=${encodeURIComponent(targetMonthStr)}&t=${Date.now()}`),
                supabase.from("users").select("id, name, email, role, designation, isactive, department, created_at, incentive_amount").eq("department", "Tech"),
                supabase.from("marketing_settings").select("key, value").in("key", [
                    "usd_to_inr_rate", `usd_to_inr_rate_${targetMonthStr}`,
                    "tech_portfolio_usd", `tech_portfolio_usd_${targetMonthStr}`,
                    "tech_github_usd", `tech_github_usd_${targetMonthStr}`,
                    "tech_gitrepo_base_sale", `tech_gitrepo_base_sale_${targetMonthStr}`,
                    "tech_gitrepo_base_inc", `tech_gitrepo_base_inc_${targetMonthStr}`,
                    "tech_gitrepo_step", `tech_gitrepo_step_${targetMonthStr}`,
                    "tech_gitrepo_step_inc", `tech_gitrepo_step_inc_${targetMonthStr}`
                ])
            ]);

            // 1. Process Calculation Data
            let backendInsights: Record<string, any> = {};
            if (calcRes.ok) {
                const data = await calcRes.json();
                setTotalPortfolios(data.totalPortfolios || 0);
                setTotalGithubs(data.totalGithubs || 0);
                setPortfolioRateUSD(data.portfolioRateUSD || 2);
                setGithubRateUSD(data.githubRateUSD || 20);
                setTotalPoolUsd(data.totalPoolUSD || 0);
                setPortfolioPoolUsd(data.portfolioPoolUSD || 0);
                setGithubPoolUsd(data.githubPoolUSD || 0);
                setIndividualShareUsd(data.individualShareUSD || 0);
                setIndividualShareInr(data.individualShareINR || 0);
                setConversionRate(data.conversionRate || 85);
                setGlobalActiveRepsCount(data.processedCount || 0);
                setGlobalGitSalesCount(data.totalGlobalGitSalesCount || 0);
                setGlobalGitSalesYieldUsd(data.totalGlobalGitSalesYieldUsd || 0);
                backendInsights = data.personalSalesInsights || {};
            }

            // 2. Process Users Data
            if (!usersRes.error && usersRes.data) {
                const targetDateForEnd = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0, 23, 59, 59);
                const normalizedData = usersRes.data
                    .filter((u: any) => {
                        const userJoinDate = u.created_at ? new Date(u.created_at) : new Date("2000-01-01");
                        const isTechHead = (u.role || "").toLowerCase() === "technical head" || (u.designation || "").toLowerCase() === "technical head";
                        return userJoinDate <= targetDateForEnd && !isTechHead;
                    })
                    .map((u: any) => {
                        const incentives = u.incentive_amount || {};
                        const emailKey = u.email ? u.email.toLowerCase() : "";
                        const insight = backendInsights[emailKey] || {};
                        const periodIncentive = insight.poolIncentiveInr || incentives[targetMonthStr] || 0;
                        const isTraineeRep = (u.designation || "").toLowerCase().includes("trainee") || (u.role || "").toLowerCase().includes("trainee");
                        
                        return {
                            id: u.id,
                            name: u.name || u.email,
                            email: u.email,
                            role: u.role,
                            designation: u.designation,
                            isactive: u.isactive === true,
                            periodIncentive: isTraineeRep ? 0 : periodIncentive,
                            portfolioPoolInr: isTraineeRep ? 0 : insight.portfolioPoolInr || 0,
                            githubPoolInr: isTraineeRep ? 0 : insight.githubPoolInr || 0,
                            gitSalesInr: isTraineeRep ? 0 : insight.salesIncentiveInr || 0,
                            totalCombinedInr: isTraineeRep ? 0 : insight.totalCombinedInr || periodIncentive
                        };
                    });
                setTechReps(normalizedData);
            }

            // 3. Process Settings Data
            if (settingsRes.data) {
                const getVal = (prefix: string, fallback: string) => {
                    const specific = settingsRes.data.find((s: any) => s.key === `${prefix}_${targetMonthStr}`);
                    const global = settingsRes.data.find((s: any) => s.key === prefix);
                    return specific?.value || global?.value || fallback;
                };

                setUsdInrRate(getVal("usd_to_inr_rate", "85"));
                setPortfolioUsdValue(getVal("tech_portfolio_usd", "2"));
                setGithubUsdValue(getVal("tech_github_usd", "20"));
                setGitRepoBaseSale(getVal("tech_gitrepo_base_sale", "140"));
                setGitRepoBaseInc(getVal("tech_gitrepo_base_inc", "7"));
                setGitRepoStep(getVal("tech_gitrepo_step", "10"));
                setGitRepoStepInc(getVal("tech_gitrepo_step_inc", "2"));
            }

        } catch (e) {
            console.error("Fetch Data Error:", e);
        } finally {
            setLoading(false);
        }
    }


    const saveSettings = async () => {
        setSavingRate(true)
        const periodStr = getMonthName();

        const settingsArr = [
            { key: `tech_portfolio_usd_${periodStr}`, value: portfolioUsdValue },
            { key: `tech_github_usd_${periodStr}`, value: githubUsdValue },
            { key: `usd_to_inr_rate_${periodStr}`, value: usdInrRate },
            { key: `tech_gitrepo_base_sale_${periodStr}`, value: gitRepoBaseSale },
            { key: `tech_gitrepo_base_inc_${periodStr}`, value: gitRepoBaseInc },
            { key: `tech_gitrepo_step_${periodStr}`, value: gitRepoStep },
            { key: `tech_gitrepo_step_inc_${periodStr}`, value: gitRepoStepInc }
        ]

        const { error } = await supabase.from("marketing_settings").upsert(settingsArr, { onConflict: "key" })

        if (!error) {
            setEditingRate(false)
            await handleRecalculate()
        } else {
            alert("Failed to save configuration: " + error.message)
        }
        setSavingRate(false)
    }

    useEffect(() => {
        fetchTechUsers()
    }, [monthOffset])

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        const { error } = await supabase.from("users").update({ isactive: !currentStatus }).eq("id", userId);
        if (!error) {
            await handleRecalculate();
        } else {
            alert("Failed to toggle active state: " + error.message);
        }
    }

    const handlePromoteTrainee = async (repId: string) => {
        const { error } = await supabase.from("users").update({ role: "Technical Associate", designation: "Technical Associate" }).eq("id", repId);
        if (!error) {
            await handleRecalculate();
        } else {
            alert("Failed to promote trainee: " + error.message);
        }
    }

    const handleDemoteToTrainee = async (repId: string) => {
        const { error } = await supabase.from("users").update({ role: "Tech Trainee", designation: "Tech Trainee", incentive_amount: 0 }).eq("id", repId);
        if (!error) {
            await handleRecalculate();
        } else {
            alert("Failed to change to trainee: " + error.message);
        }
    }

    const filteredReps = useMemo(() => {
        return techReps.filter(rep => {
            if (!searchTerm.trim()) return true
            const t = searchTerm.toLowerCase()
            return rep.name?.toLowerCase().includes(t) || rep.email?.toLowerCase().includes(t) || rep.role?.toLowerCase().includes(t)
        })
    }, [techReps, searchTerm]);

    const isTrainee = (rep: any) => (rep.designation || "").toLowerCase().includes("trainee") || (rep.role || "").toLowerCase().includes("trainee") || rep.role === "BDT-P"

    const { activeReps, activeTrainees, inactiveReps, inactiveTrainees } = useMemo(() => {
        return {
            activeReps: filteredReps.filter(rep => rep.isactive && !isTrainee(rep)),
            activeTrainees: filteredReps.filter(rep => rep.isactive && isTrainee(rep)),
            inactiveReps: filteredReps.filter(rep => !rep.isactive && !isTrainee(rep)),
            inactiveTrainees: filteredReps.filter(rep => !rep.isactive && isTrainee(rep))
        };
    }, [filteredReps]);

    // Explicitly sync the Master INR Pool to the backend unified math
    const sumIncentives = totalPoolUsd * conversionRate;

    const exportToCSV = () => {
        const headers = ["Name", "Email", "Designation", "Status", "Individual Base USD", "Incentive (INR)"];
        const csvRows = [headers.join(",")];

        filteredReps.forEach(rep => {
            const name = `"${(rep.name || "").replace(/"/g, '""')}"`;
            const email = `"${(rep.email || "").replace(/"/g, '""')}"`;
            const role = `"${(rep.role || "").replace(/"/g, '""')}"`;
            const status = `"${rep.isactive ? "Active" : "Inactive"}"`;

            csvRows.push([name, email, role, status, individualShareUsd, rep.periodIncentive].join(","));
        });

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Tech_Team_Incentives_${getMonthName().replace(" ", "_")}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleRecalculate = async () => {
        setLoading(true);
        await fetchTechUsers();
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-8 relative">
            {loading && (
                <div className="fixed inset-0 z-50 bg-slate-100/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-300 border border-slate-100">
                        <div className="relative flex items-center justify-center w-20 h-20 mb-6">
                            <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-[spin_1s_linear_infinite]"></div>
                            <div className="absolute inset-2 rounded-full border-r-4 border-blue-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
                            <div className="absolute inset-4 rounded-full border-b-4 border-emerald-400 animate-[spin_2s_linear_infinite]"></div>
                            <LayoutDashboard className="h-5 w-5 text-indigo-600 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Synchronizing Progress</h3>
                        <p className="text-sm text-slate-500 mt-2 text-center">Crunching portfolio output metrics...</p>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-start mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Tech Team Dashboard</h1>
                        <p className="text-slate-600">Track and manage complete Tech Team performances</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <Button variant="outline" className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={exportToCSV}>
                            <FileText className="h-4 w-4" /> Export CSV
                        </Button>
                        <Button onClick={onLogout}>Logout</Button>
                    </div>
                </div>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5" />
                            Performance Period Filter
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Active Pool Size</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="relative z-10 pt-2 pb-5">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-slate-800 tracking-tight">{globalActiveRepsCount}</div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Members</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-3 font-medium flex items-center gap-1.5">
                                Divisor for the global portfolio split.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 bg-slate-50/40 border-b border-slate-100/50">
                            <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Portfolio Analytics</CardTitle>
                            <Code2 className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4 pb-5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 font-bold">Total Portfolios</span>
                                <span className="font-black text-slate-800 text-lg border border-slate-200 px-2 rounded bg-slate-100">{totalPortfolios}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 font-bold">Total Github Projects</span>
                                <span className="font-black text-slate-800 text-lg border border-slate-200 px-2 rounded bg-slate-100">{totalGithubs}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-3">
                                <span className="text-amber-700 font-bold">Total Git Repo Sales</span>
                                <span className="font-black text-amber-800 text-lg border border-amber-200 px-2 rounded bg-amber-50">{globalGitSalesCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                                <span className="text-emerald-700 font-bold">Generated Combined USD Pool</span>
                                <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded text-lg border border-emerald-200">${totalPoolUsd.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/50 border-blue-100">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-1 bg-transparent relative z-10">
                            <CardTitle className="text-[11px] font-extrabold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                                Shared Equity Pool Payout
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3 relative z-10 pb-5">
                            <div className="flex flex-col mb-2">
                                <span className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-800 tracking-tighter leading-none drop-shadow-sm mt-1">
                                    ₹{sumIncentives.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="bg-white/60 rounded p-2 border border-emerald-200/60 shadow-sm flex flex-col justify-center">
                                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Portfolio Payout</p>
                                    <p className="text-indigo-700 font-bold text-sm">₹{(portfolioPoolUsd * conversionRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                                <div className="bg-white/60 rounded p-2 border border-indigo-200/60 shadow-sm flex flex-col justify-center">
                                    <p className="text-[9px] uppercase font-bold text-indigo-600 tracking-widest">Github Payout</p>
                                    <p className="text-indigo-700 font-bold text-sm">₹{(githubPoolUsd * conversionRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                                <div className="bg-amber-50/60 rounded p-2 border border-amber-200/60 shadow-sm flex flex-col justify-center">
                                    <p className="text-[9px] uppercase font-bold text-amber-600 tracking-widest">Git Repo Sales</p>
                                    <p className="text-amber-700 font-bold text-sm">₹{(globalGitSalesYieldUsd * conversionRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>

                            {/* Transparent Financial Engine Calculation Breakdown */}
                            <div className="mt-4 pt-4 border-t border-blue-200/50">
                                <p className="text-[9px] font-bold text-blue-800/70 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                                    <Database className="h-3 w-3" /> Financial Engine Average Unit Math
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] text-blue-900/70 font-medium font-mono">
                                        <span>Global Master Pool ({totalPortfolios} Ports × ${portfolioRateUSD}) + ({totalGithubs} Git × ${githubRateUSD})</span>
                                        <span>${totalPoolUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-blue-900/70 font-medium font-mono">
                                        <span>Base Equal Split (${totalPoolUsd.toLocaleString()} ÷ {globalActiveRepsCount || 1} Active Reps) × ₹{conversionRate}</span>
                                        <span>₹{individualShareInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="text-[9px] text-blue-800/50 italic mt-2 border-t border-blue-100 pt-2 leading-relaxed">
                                        * Note: The base equal split represents the guaranteed yield for placed members. Individual Git Repo Commissions are layered continuously on top per-rep dynamically.
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Configuration Panel */}
                <Card className={`mb-8 border-0 shadow-xl overflow-hidden ring-1 transition-all duration-500 ${editingRate ? 'ring-indigo-500/30' : 'ring-slate-200/50 hover:ring-indigo-300'}`}>
                    <CardHeader className={`transition-all duration-500 relative overflow-hidden ${editingRate ? 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white py-8' : 'bg-white hover:bg-slate-50/80 py-6'}`}>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-2xl shadow-inner transition-colors duration-500 ${editingRate ? 'bg-white/10 border border-white/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                                    <Database className={`h-7 w-7 ${editingRate ? 'text-indigo-100' : 'text-indigo-600'}`} />
                                </div>
                                <div>
                                    <CardTitle className={`text-2xl font-black tracking-tight flex items-center gap-3 ${editingRate ? 'text-white' : 'text-slate-800'}`}>
                                        Department Financial Engine
                                    </CardTitle>
                                    <p className={`text-sm mt-1.5 font-medium max-w-lg leading-relaxed ${editingRate ? 'text-indigo-200/90' : 'text-slate-500'}`}>
                                        Configure exact variables that output the split metrics for {getMonthName()}.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setEditingRate(!editingRate)}
                                size="lg"
                                className={`font-bold transition-all duration-300 shadow-md ${!editingRate ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                variant={editingRate ? "outline" : "default"}
                            >
                                {editingRate ? "Hide Configuration" : "Launch Financial Matrix"}
                            </Button>
                        </div>
                    </CardHeader>

                    {editingRate && (
                        <div className="bg-slate-50/50 animate-in slide-in-from-top-8 fade-in duration-500 ease-out border-t border-slate-200 p-6 md:p-8">
                            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap gap-2 justify-center">
                                {[
                                    { id: "portfolio", label: "Portfolio Rates", color: "emerald" },
                                    { id: "github", label: "Github Rates", color: "indigo" },
                                    { id: "gitrepo", label: "Git Repo Logic", color: "amber" },
                                    { id: "system", label: "System FX Exchange", color: "blue" }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveConfigTab(tab.id)}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm ${activeConfigTab === tab.id
                                            ? `bg-white text-${tab.color}-700 border-${tab.color}-200 ring-2 ring-${tab.color}-400/20`
                                            : "bg-slate-100/50 text-slate-500 border-transparent hover:bg-slate-100"
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-center max-w-4xl mx-auto transition-all">
                                {activeConfigTab === "portfolio" && (
                                    <Card className="border border-emerald-100 shadow-sm w-full animate-in fade-in">
                                        <div className="h-1 w-full bg-emerald-500"></div>
                                        <CardContent className="p-8">
                                            <div className="flex items-center gap-2 mb-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Portfolio Matrix</label>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold mb-4">Payout amount mapping into Master Pool per 1 successful completion.</p>
                                            <div className="relative group">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">$</span>
                                                <Input value={portfolioUsdValue} onChange={(e) => setPortfolioUsdValue(e.target.value)} className="pl-7 h-11 border-emerald-200 bg-emerald-50/30 font-bold text-lg text-emerald-800" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeConfigTab === "github" && (
                                    <Card className="border border-indigo-100 shadow-sm w-full animate-in fade-in">
                                        <div className="h-1 w-full bg-indigo-500"></div>
                                        <CardContent className="p-8">
                                            <div className="flex items-center gap-2 mb-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Github Matrix</label>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold mb-4">Payout amount mapping into Master Pool per 1 successful completion.</p>
                                            <div className="relative group">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">$</span>
                                                <Input value={githubUsdValue} onChange={(e) => setGithubUsdValue(e.target.value)} className="pl-7 h-11 border-indigo-200 bg-indigo-50/30 font-bold text-lg text-indigo-800" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeConfigTab === "gitrepo" && (
                                    <Card className="border border-amber-100 shadow-sm w-full animate-in fade-in">
                                        <div className="h-1 w-full bg-amber-500"></div>
                                        <CardContent className="p-8">
                                            <div className="flex items-center gap-2 mb-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Git Repo Independent Matrix</label>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold mb-4">Configure the logic thresholds for individual Git Repo sales dynamically.</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 mb-1">Base Sale ($)</p>
                                                    <div className="relative group">
                                                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                                                        <Input value={gitRepoBaseSale} onChange={(e) => setGitRepoBaseSale(e.target.value)} className="pl-6 h-9 border-amber-200 bg-amber-50/30 font-bold text-slate-800" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 mb-1">Base Gen ($)</p>
                                                    <div className="relative group">
                                                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                                                        <Input value={gitRepoBaseInc} onChange={(e) => setGitRepoBaseInc(e.target.value)} className="pl-6 h-9 border-amber-200 bg-amber-50/30 font-bold text-slate-800" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 mb-1">Scale Step ($)</p>
                                                    <div className="relative group">
                                                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                                                        <Input value={gitRepoStep} onChange={(e) => setGitRepoStep(e.target.value)} className="pl-6 h-9 border-amber-200 bg-amber-50/30 font-bold text-slate-800" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 mb-1">Scale Multiplier ($)</p>
                                                    <div className="relative group">
                                                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                                                        <Input value={gitRepoStepInc} onChange={(e) => setGitRepoStepInc(e.target.value)} className="pl-6 h-9 border-amber-200 bg-amber-50/30 font-bold text-slate-800" />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeConfigTab === "system" && (
                                    <Card className="border border-blue-100 shadow-sm w-full animate-in fade-in">
                                        <div className="h-1 w-full bg-blue-500"></div>
                                        <CardContent className="p-8">
                                            <div className="flex items-center gap-2 mb-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">USD to INR Forex Rate</label>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold mb-4">Exchange multiplier mapping $ to exact ₹.</p>
                                            <div className="relative group">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                                <Input value={usdInrRate} onChange={(e) => setUsdInrRate(e.target.value)} className="pl-7 h-11 border-blue-200 bg-blue-50/30 font-bold text-lg text-blue-800" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            <div className="flex flex-col flex-row justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-8 max-w-4xl mx-auto">
                                <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" onClick={saveSettings} disabled={savingRate}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {savingRate ? "Committing Sync..." : "Commit Mathematical Mapping"}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="mb-8 overflow-hidden shadow-sm">
                    <CardHeader className="bg-white border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
                            <div className="flex items-center gap-4">
                                <CardTitle className="text-lg">Tech Team Performance Registry</CardTitle>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <Button variant="secondary" onClick={() => handleRecalculate()}><RefreshCw className="h-4 w-4 mr-2" /> Live Fetch Resync</Button>
                                <div className="relative w-full sm:w-64">
                                    <Input placeholder="Search reps..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-slate-50/50" />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Identity Details</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-emerald-600">Portfolio</TableHead>
                                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-blue-600">Github Comp.</TableHead>
                                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-amber-600">Git Sales</TableHead>
                                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-indigo-700">Total Valid INR</TableHead>
                                        <TableHead className="text-right pr-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeReps.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                                                        <Code2 className="h-6 w-6 text-slate-400" />
                                                        Technical Head Dashboard
                                                    </h1>
                                                    <p>No active tech representatives found for this month.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activeReps.map((rep) => (
                                            <TableRow key={rep.id} className="hover:bg-blue-50/30 transition-colors border-b border-slate-100/50">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <div className="font-bold text-slate-800">{rep.name}</div>
                                                        <div className="text-xs text-slate-400">{rep.email}</div>
                                                        <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">{rep.role}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-100 text-emerald-800 shadow-none hover:bg-emerald-200">Active</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="font-bold text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50 w-fit ml-auto">
                                                        ₹{(rep.portfolioPoolInr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/50 w-fit ml-auto">
                                                        ₹{(rep.githubPoolInr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="font-bold text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50 w-fit ml-auto">
                                                        ₹{(rep.gitSalesInr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="font-black text-base text-indigo-700 tracking-tight">
                                                        ₹{(rep.totalCombinedInr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs h-7" onClick={() => toggleUserStatus(rep.id, rep.isactive)}>
                                                            Deactivate
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200 text-xs h-7" onClick={() => handleDemoteToTrainee(rep.id)}>
                                                            Change to Trainee
                                                        </Button>
                                                        <Link href={`${basePath}/tech/${rep.id}?month=${encodeURIComponent(getMonthName())}`}>
                                                            <Button variant="outline" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 text-xs h-7">
                                                                <Eye className="h-3.5 w-3.5" /> View Pool Share
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Trainees Table */}
                <Card className="mb-8 overflow-hidden shadow-sm">
                    <CardHeader className="bg-white border-b border-slate-100">
                        <CardTitle className="text-lg">Active Tech Trainees</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Identity Details</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                                        <TableHead className="text-right pr-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeTrainees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-12 text-slate-500">
                                                No active tech trainees found for this month.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activeTrainees.map((rep) => (
                                            <TableRow key={rep.id} className="hover:bg-blue-50/30 transition-colors border-b border-slate-100/50">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <div className="font-bold text-slate-800">{rep.name}</div>
                                                        <div className="text-xs text-slate-400">{rep.email}</div>
                                                        <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">{rep.role}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-100 text-emerald-800 shadow-none hover:bg-emerald-200">Active</Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                         <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 italic">
                                                             Trainee (No Dashboard)
                                                         </div>
                                                        <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 text-xs h-7" onClick={() => handlePromoteTrainee(rep.id)}>
                                                            Promote to Associate
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs h-7" onClick={() => toggleUserStatus(rep.id, rep.isactive)}>
                                                            Deactivate
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Inactive Tech Team Card */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-8 opacity-75">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                    <EyeOff className="h-5 w-5 text-slate-400" /> Inactive Tech Performance Registry
                                </CardTitle>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Historical or Deactivated Representatives</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Identity Details</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Last Pool Share</TableHead>
                                        <TableHead className="text-right pr-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inactiveReps.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-slate-400 text-sm font-medium">
                                                No inactive tech members found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        inactiveReps.map((rep) => (
                                            <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100/50">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <div className="font-bold text-slate-600">{rep.name}</div>
                                                        <div className="text-xs text-slate-400">{rep.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-slate-100 text-slate-500 shadow-none border-0">Inactive</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="font-bold text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100/50 w-fit ml-auto">
                                                        ₹{(rep.totalCombinedInr || 0).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="outline" size="sm" className="bg-white text-emerald-600 hover:bg-emerald-50 border-emerald-100 text-xs h-7" onClick={() => toggleUserStatus(rep.id, rep.isactive)}>
                                                        Reactivate Rep
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
