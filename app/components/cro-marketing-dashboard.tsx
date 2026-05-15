"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Users, ChevronLeft, ChevronRight, Download, Edit2, Save, Eye, Globe, Wallet2, BarChart3, Settings2, AlertTriangle, CheckCircle2, Star, Plus, X } from "lucide-react"
import Link from "next/link"

interface CROMarketingDashboardProps {
    basePath: string;
    user: any;
    onLogout: () => void;
}

export function CROMarketingDashboard({ basePath, user, onLogout }: CROMarketingDashboardProps) {
    const [marketingReps, setMarketingReps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const [monthOffset, setMonthOffset] = useState<number>(0)

    // Rate config
    const [conversionRate, setConversionRate] = useState<string>("85.00")

    // Job Board Rate config
    const [jbTier1, setJbTier1] = useState<string>("30")
    const [jbTier2, setJbTier2] = useState<string>("35")
    const [jbTier3, setJbTier3] = useState<string>("40")

    // Skill Passport config
    const [spRate, setSpRate] = useState<string>("30")

    // Influencer config
    const [influencerPaidRate, setInfluencerPaidRate] = useState<string>("1.5")
    const [influencerUnpaidRate, setInfluencerUnpaidRate] = useState<string>("3")

    const [editingRate, setEditingRate] = useState(false)
    const [savingRate, setSavingRate] = useState(false)

    // Sub-UI States for Tab Switching
    const [activeConfigTab, setActiveConfigTab] = useState<'jobboard' | 'skillpassport' | 'influencer'>('jobboard')

    // Dynamic Tiers
    const [customJobBoardTiers, setCustomJobBoardTiers] = useState<any[]>([])

    const addCustomTier = () => {
        setCustomJobBoardTiers([...customJobBoardTiers, { id: Date.now(), threshold: "2000", rate: "45" }])
    }
    const updateCustomTier = (id: number, key: string, value: string) => {
        setCustomJobBoardTiers(prev => prev.map(t => t.id === id ? { ...t, [key]: value } : t))
    }
    const removeCustomTier = (id: number) => {
        setCustomJobBoardTiers(prev => prev.filter(t => t.id !== id))
    }

    const getMonthName = () => {
        const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
        return targetDate.toLocaleString("default", { month: "long", year: "numeric" })
    }

    const fetchMarketingUsers = async () => {
        setLoading(true)
        const targetMonthStr = getMonthName();

        try {
            // 0. Auto-Recalculate silently exactly as it's viewed without needing manual clicks
            await fetch(`/api/calculate-marketing-incentives?period=${encodeURIComponent(targetMonthStr)}`);
        } catch (e) {
            console.error("Silent Recalculation Error:", e);
        }

        // Fetch users whose department is Marketing from Main app users table
        const { data: mainData, error: mainError } = await supabase
            .from("users")
            .select("id, name, email, role, designation, isactive, department, created_at")
            .eq("department", "Marketing")

        if (!mainError && mainData) {
            const targetDateForEnd = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0, 23, 59, 59)

            // Create a normalized list mimicking what the component expects
            // Filter by joining date: only show users created BEFORE or DURING the target month
            // Also explicitly exclude the Marketing Head role/designation
            const normalizedData = mainData
                .filter((u: any) => {
                    const userJoinDate = u.created_at ? new Date(u.created_at) : new Date("2000-01-01")
                    const r = (u.role || "").toLowerCase();
                    const d = (u.designation || "").toLowerCase();
                    const isHead = r.includes("marketing head") || d.includes("marketing head");
                    return userJoinDate <= targetDateForEnd && !isHead
                })
                .map((u: any) => ({
                    id: u.id,
                    name: u.name || u.email,
                    email: u.email,
                    role: u.role,
                    designation: u.designation,
                    isactive: u.isactive === true
                }))

            // For each user, fetch their marketing_incentives for the target month from MAIN DB
            const emails = normalizedData.map((u: any) => u.email)
            const targetMonthStr = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1).toLocaleString("default", { month: "long", year: "numeric" })

            const { data: incentivesData, error: incentivesError } = await supabase
                .from("marketing_incentives")
                .select("*")
                .eq("period", targetMonthStr)
                .in("email", emails)

            const repDataWithIncentives = normalizedData.map((rep: any) => {
                const incn = incentivesData?.find((i: any) => i.email === rep.email)
                const r = (rep.role || "").toLowerCase();
                const d = (rep.designation || "").toLowerCase();
                const isTraineeRep = r.includes("trainee") || d.includes("trainee") || r === "bdt-p" || d === "bdt-p";

                return {
                    ...rep,
                    incentive_inr: isTraineeRep ? 0 : (incn?.applywizz_incentive_inr || 0) + (incn?.job_board_incentive_inr || 0) + (incn?.skill_passport_incentive_inr || 0) + (incn?.influencer_incentive_inr || 0),
                    applywizz_incentive_inr: isTraineeRep ? 0 : incn?.applywizz_incentive_inr || 0,
                    incentive_usd: isTraineeRep ? 0 : incn?.applywizz_incentive_usd || 0,
                    total_fresh_sales: incn?.total_fresh_sales || 0,
                    job_board_fresh_sales: incn?.job_board_fresh_sales || 0,
                    job_board_revenue_usd: incn?.job_board_revenue_usd || 0,
                    job_board_pool_inr: incn?.job_board_pool_inr || 0,
                    job_board_incentive_inr: isTraineeRep ? 0 : incn?.job_board_incentive_inr || 0,
                    skill_passport_fresh_sales: incn?.skill_passport_fresh_sales || 0,
                    skill_passport_pool_inr: incn?.skill_passport_pool_inr || 0,
                    skill_passport_incentive_inr: isTraineeRep ? 0 : incn?.skill_passport_incentive_inr || 0,
                    influencer_paid_count: incn?.influencer_paid_count || 0,
                    influencer_unpaid_count: incn?.influencer_unpaid_count || 0,
                    influencer_pool_inr: incn?.influencer_pool_inr || 0,
                    influencer_incentive_inr: isTraineeRep ? 0 : incn?.influencer_incentive_inr || 0
                }
            })

            setMarketingReps(repDataWithIncentives)
        }
        setLoading(false)
    }

    const fetchSettings = async () => {
        const period = getMonthName();
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

    useEffect(() => {
        fetchMarketingUsers()
        fetchSettings()
    }, [monthOffset])

    const saveSettings = async () => {
        setSavingRate(true)

        const settingsArr: { key: string, value: string }[] = []

        // Apply changes to the currently selected month AND all future months (up to 18 months)
        // This ensures past months remain locked to their historical rates
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
            // Automatically recalculate incentives with the new saved setting to ensure Vercel updates
            await handleRecalculate(true)
        } else {
            alert("Failed to save Period-Specific settings: " + error.message)
        }
        setSavingRate(false)
    }

    const handleToggleActive = async (repId: string, currentIsActive: boolean) => {
        const { data, error } = await supabase
            .from("users")
            .update({ isactive: !currentIsActive })
            .eq("id", repId)
            .select("id, isactive")
            .single()

        if (error) {
            alert("Failed to toggle active state in MAIN users: " + error.message)
            return
        }

        setMarketingReps((prev) => prev.map((r) => (r.id === repId ? { ...r, isactive: data.isactive } : r)))
    }

    const handlePromoteTrainee = async (repId: string) => {
        const { error } = await supabase.from("users").update({ role: "Marketing Associate", designation: "Marketing Associate" }).eq("id", repId);
        if (!error) {
            await handleRecalculate(true);
        } else {
            alert("Failed to promote trainee: " + error.message);
        }
    }

    const handleDemoteToTrainee = async (repId: string) => {
        const { error } = await supabase.from("users").update({ role: "Marketing Trainee", designation: "Marketing Trainee", incentive_amount: 0 }).eq("id", repId);
        if (!error) {
            await handleRecalculate(true);
        } else {
            alert("Failed to change to trainee: " + error.message);
        }
    }

    const filteredReps = marketingReps.filter(rep => {
        if (!searchTerm.trim()) return true
        const t = searchTerm.toLowerCase()
        return rep.name?.toLowerCase().includes(t) || rep.email?.toLowerCase().includes(t) || rep.role?.toLowerCase().includes(t)
    })

    const isTrainee = (rep: any) => {
        const r = (rep.role || "").toLowerCase();
        const d = (rep.designation || "").toLowerCase();
        return r.includes("trainee") || d.includes("trainee") || r === "bdt-p" || d === "bdt-p";
    }

    const activeReps = filteredReps.filter(rep => rep.isactive && !isTrainee(rep));
    const activeTrainees = filteredReps.filter(rep => rep.isactive && isTrainee(rep));
    const inactiveReps = filteredReps.filter(rep => !rep.isactive && !isTrainee(rep));
    const inactiveTrainees = filteredReps.filter(rep => !rep.isactive && isTrainee(rep));

    const activeRepWithPools = activeReps.length > 0 ? activeReps.find(r => r.job_board_pool_inr > 0) || activeReps[0] : null;

    const totalIncentivesINR = activeReps.reduce((sum, rep) => sum + (rep.incentive_inr || 0), 0)
    const totalApplywizzIncentivesGlobal = activeReps.reduce((sum, rep) => sum + (rep.applywizz_incentive_inr || 0), 0)
    const totalJobBoardIncentivesGlobal = activeRepWithPools ? activeRepWithPools.job_board_pool_inr : 0
    const totalSkillPassportIncentivesGlobal = activeRepWithPools ? activeRepWithPools.skill_passport_pool_inr : 0
    const totalInfluencerIncentivesGlobal = activeRepWithPools ? activeRepWithPools.influencer_pool_inr : 0
    const totalInfluencerCountGlobal = activeRepWithPools ? (activeRepWithPools.influencer_paid_count + activeRepWithPools.influencer_unpaid_count) : 0
    const totalInfluencerPaidCountGlobal = activeRepWithPools ? activeRepWithPools.influencer_paid_count : 0
    const totalInfluencerUnpaidCountGlobal = activeRepWithPools ? activeRepWithPools.influencer_unpaid_count : 0

    const totalFreshSalesGlobal = activeRepWithPools ? activeRepWithPools.total_fresh_sales : 0
    const totalJobBoardSalesCountGlobal = activeRepWithPools ? activeRepWithPools.job_board_fresh_sales : 0
    const totalSkillPassportSalesCountGlobal = activeRepWithPools ? activeRepWithPools.skill_passport_fresh_sales : 0
    const totalJobBoardRevenueGlobal = activeRepWithPools ? activeRepWithPools.job_board_revenue_usd : 0

    const exportToCSV = () => {
        const headers = ["Name", "Email", "Designation", "Status", `${getMonthName()} Incentives (INR)`];
        const csvRows = [headers.join(",")];

        filteredReps.forEach(rep => {
            const name = `"${(rep.name || "").replace(/"/g, '""')}"`;
            const email = `"${(rep.email || "").replace(/"/g, '""')}"`;
            const role = `"${(rep.role || "").replace(/"/g, '""')}"`;
            const status = `"${rep.isactive ? "Active" : "Inactive"}"`;
            const incentive = `"${rep.incentive_inr}"`;

            csvRows.push([name, email, role, status, incentive].join(","));
        });

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Marketing_Incentives_${getMonthName().replace(" ", "_")}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleRecalculate = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`/api/calculate-marketing-incentives?period=${encodeURIComponent(getMonthName())}&t=${new Date().getTime()}`, {
                cache: "no-store",
                headers: { "Pragma": "no-cache" }
            });
            if (res.ok) {
                await fetchMarketingUsers();
                if (!silent) alert("Incentives Recalculated Successfully!");
            } else {
                alert("Failed to recalculate");
            }
        } catch (e) {
            console.error(e);
            if (!silent) alert("Error occurred");
        } finally {
            if (!silent) setLoading(false);
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

                {/* Header */}
                <div className="flex justify-between items-start mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Marketing Dashboard (Admin)</h1>
                        <p className="text-slate-600">Track and manage complete Marketing Team performances</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <Button variant="outline" className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={exportToCSV}>
                            <Download className="h-4 w-4" /> Export CSV
                        </Button>
                        <Button onClick={onLogout}>Logout</Button>
                    </div>
                </div>

                {/* Marketing Period Filter */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5" />
                            Marketing Period Filter
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Team Size Card */}
                    <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                        <div className="absolute -right-6 -top-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50/30 w-32 h-32 group-hover:scale-110 transition-transform duration-700 ease-out z-0"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Total Marketing Team</CardTitle>
                            <div className="bg-blue-100/50 p-2 rounded-lg border border-blue-100 group-hover:bg-blue-100 transition-colors">
                                <Users className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-2 pb-5">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-slate-800 tracking-tight">{activeReps.length}</div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Reps</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-3 font-medium flex items-center gap-1.5">
                                <TrendingUp className="h-3 w-3 text-blue-500" />
                                Driving <span className="text-slate-700 font-bold">{totalFreshSalesGlobal + totalJobBoardSalesCountGlobal + totalSkillPassportSalesCountGlobal + totalInfluencerCountGlobal}</span> total global sales
                            </p>
                        </CardContent>
                    </Card>

                    {/* Sales Channels Breakdown Card */}
                    <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 bg-slate-50/40 border-b border-slate-100/50">
                            <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Sales Channel Velocity</CardTitle>
                            <BarChart3 className="h-4 w-4 text-indigo-400" />
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4 pb-5">

                            <div>
                                <div className="flex justify-between items-center text-xs mb-1.5">
                                    <span className="text-slate-600 font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div> Influencer Referrals
                                    </span>
                                    <span className="font-black text-pink-600">{totalInfluencerCountGlobal} <span className="text-[10px] text-slate-400 font-medium">({totalInfluencerUnpaidCountGlobal} Unpaid / {totalInfluencerPaidCountGlobal} Paid)</span></span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-pink-500 h-full rounded-full transition-all duration-1000 ease-out delay-100" style={{ width: `${Math.min(100, (totalInfluencerCountGlobal / (totalFreshSalesGlobal + totalJobBoardSalesCountGlobal + totalSkillPassportSalesCountGlobal + totalInfluencerCountGlobal || 1)) * 100)}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-xs mb-1.5">
                                    <span className="text-slate-600 font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Job Board
                                    </span>
                                    <span className="font-black text-emerald-600">{totalJobBoardSalesCountGlobal}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out delay-200" style={{ width: `${Math.min(100, (totalJobBoardSalesCountGlobal / (totalFreshSalesGlobal + totalJobBoardSalesCountGlobal + totalSkillPassportSalesCountGlobal || 1)) * 100)}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-xs mb-1.5">
                                    <span className="text-slate-600 font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Skill Passport
                                    </span>
                                    <span className="font-black text-orange-500">{totalSkillPassportSalesCountGlobal}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full rounded-full transition-all duration-1000 ease-out delay-300" style={{ width: `${Math.min(100, (totalSkillPassportSalesCountGlobal / (totalFreshSalesGlobal + totalJobBoardSalesCountGlobal + totalSkillPassportSalesCountGlobal || 1)) * 100)}%` }}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Global Distributed Incentives Card */}
                    <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/50 border-emerald-100 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500"></div>
                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                            <Wallet2 className="w-48 h-48 text-emerald-600" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-1 bg-transparent relative z-10">
                            <CardTitle className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Incentive Pool Tracker
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3 relative z-10 pb-5">
                            <div className="flex flex-col mb-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">Total Distributed <Globe className="h-3 w-3" /></span>
                                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-800 tracking-tighter leading-none drop-shadow-sm">
                                    ₹{totalIncentivesINR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>

                            <div className="space-y-3 mt-2 border-t border-emerald-100/60 pt-4 bg-white/40 rounded-b-xl backdrop-blur-sm -mx-2 px-2 pb-1">

                                <div className="flex justify-between items-center text-xs group">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-slate-500 font-bold group-hover:text-pink-700 transition-colors">Influencer Referrals</span>
                                        <span className="text-[10px] text-slate-400 font-medium">({totalInfluencerUnpaidCountGlobal} unpaid × ${influencerUnpaidRate} + {totalInfluencerPaidCountGlobal} paid × ${influencerPaidRate}) = <span className="text-pink-500/70">₹{totalInfluencerIncentivesGlobal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                                    </div>
                                    <span className="font-extrabold text-pink-600">₹{totalInfluencerIncentivesGlobal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs group">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-slate-500 font-bold group-hover:text-emerald-700 transition-colors">Job Board</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{totalJobBoardSalesCountGlobal} × ₹{totalJobBoardSalesCountGlobal > 0 ? (totalJobBoardIncentivesGlobal / totalJobBoardSalesCountGlobal).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0} = <span className="text-emerald-600/70">₹{totalJobBoardIncentivesGlobal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                                    </div>
                                    <span className="font-extrabold text-emerald-600">₹{totalJobBoardIncentivesGlobal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs group">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-slate-500 font-bold group-hover:text-orange-700 transition-colors">Skill Passport</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{totalSkillPassportSalesCountGlobal} × ₹{totalSkillPassportSalesCountGlobal > 0 ? (totalSkillPassportIncentivesGlobal / totalSkillPassportSalesCountGlobal).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0} = <span className="text-orange-500/70">₹{totalSkillPassportIncentivesGlobal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                                    </div>
                                    <span className="font-extrabold text-orange-600">₹{totalSkillPassportIncentivesGlobal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Premium Financial Configuration System */}
                <Card className={`mb-8 border-0 shadow-xl overflow-hidden ring-1 transition-all duration-500 ${editingRate ? 'ring-indigo-500/30' : 'ring-slate-200/50 hover:ring-indigo-300'}`}>
                    <CardHeader className={`transition-all duration-500 relative overflow-hidden ${editingRate ? 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white py-8' : 'bg-white hover:bg-slate-50/80 py-6'}`}>
                        {/* Decorative background curves if open */}
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
                                        Revenue multipliers for {getMonthName()}. Changes implicitly propagate to future cycles.
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

                            {/* Navigation Tabs */}
                            <div className="flex flex-wrap gap-2 px-6 pt-6 md:px-8 md:pt-8 border-b border-slate-200/50 pb-4">

                                <Button
                                    variant={activeConfigTab === 'jobboard' ? "default" : "outline"}
                                    onClick={() => setActiveConfigTab('jobboard')}
                                    className={`rounded-full transition-all ${activeConfigTab === 'jobboard' ? 'bg-blue-600 hover:bg-blue-700 shadow-sm text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                                >
                                    <BarChart3 className="h-4 w-4 mr-2" /> Job Board Matrices
                                </Button>
                                <Button
                                    variant={activeConfigTab === 'skillpassport' ? "default" : "outline"}
                                    onClick={() => setActiveConfigTab('skillpassport')}
                                    className={`rounded-full transition-all ${activeConfigTab === 'skillpassport' ? 'bg-orange-600 hover:bg-orange-700 shadow-sm text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                                >
                                    <Wallet2 className="h-4 w-4 mr-2" /> Skill Passport Config
                                </Button>
                                <Button
                                    variant={activeConfigTab === 'influencer' ? "default" : "outline"}
                                    onClick={() => setActiveConfigTab('influencer')}
                                    className={`rounded-full transition-all ${activeConfigTab === 'influencer' ? 'bg-pink-600 hover:bg-pink-700 shadow-sm text-white' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                                >
                                    <TrendingUp className="h-4 w-4 mr-2" /> Influencer Referral Config
                                </Button>
                            </div>

                            <div className="p-6 md:p-8 pt-6">



                                {/* Job Board Section */}
                                {activeConfigTab === 'jobboard' && (
                                    <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left animate-in fade-in slide-in-from-left-4 duration-300">
                                        <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100/50 p-2 rounded-lg"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
                                                <h3 className="font-bold text-slate-800 tracking-tight text-lg">Job Board Matrices</h3>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={addCustomTier} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                                <Plus className="h-4 w-4 mr-1" /> Add Custom Tier
                                            </Button>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* Job Board T1 */}
                                                <Card className="border border-blue-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow relative">
                                                    <div className="h-1 w-full bg-blue-400"></div>
                                                    <CardContent className="p-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">JobBoard T-1</label>
                                                        </div>
                                                        <div className="relative group flex items-center">
                                                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                                            <Input value={jbTier1} onChange={(e) => setJbTier1(e.target.value)} className="pl-7 h-11 w-full border-blue-200 focus-visible:ring-blue-500 bg-blue-50/30 text-lg font-bold text-slate-800" />
                                                            <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold uppercase">/sale</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-3 font-medium">Sales milestone: &lt; 500 records</p>
                                                    </CardContent>
                                                </Card>

                                                {/* Job Board T2 */}
                                                <Card className="border border-blue-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow relative">
                                                    <div className="h-1 w-full bg-blue-500"></div>
                                                    <CardContent className="p-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">JobBoard T-2</label>
                                                        </div>
                                                        <div className="relative group flex items-center">
                                                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                                            <Input value={jbTier2} onChange={(e) => setJbTier2(e.target.value)} className="pl-7 h-11 w-full border-blue-200 focus-visible:ring-blue-500 bg-blue-50/30 text-lg font-bold text-slate-800" />
                                                            <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold uppercase">/sale</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-3 font-medium">Sales milestone: &lt; 1000 records</p>
                                                    </CardContent>
                                                </Card>

                                                {/* Job Board T3 */}
                                                <Card className="border border-emerald-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow relative">
                                                    <div className="h-1 w-full bg-emerald-500"></div>
                                                    <CardContent className="p-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Star className="h-3 w-3 text-emerald-500" /> JobBoard T-3</label>
                                                        </div>
                                                        <div className="relative group flex items-center">
                                                            <span className="absolute left-3 top-2.5 text-emerald-600 text-sm font-bold">₹</span>
                                                            <Input value={jbTier3} onChange={(e) => setJbTier3(e.target.value)} className="pl-7 h-11 w-full border-emerald-300 focus-visible:ring-emerald-500 bg-emerald-50/50 text-emerald-800 text-lg font-bold" />
                                                            <span className="absolute right-3 top-3 text-xs text-emerald-600/60 font-bold uppercase">/sale</span>
                                                        </div>
                                                        <p className="text-[10px] text-emerald-600/80 mt-3 font-bold uppercase tracking-tight">Sales Milestone: &lt; 2000 records</p>
                                                    </CardContent>
                                                </Card>

                                                {/* Custom Tiers Dynamically Created */}
                                                {customJobBoardTiers.map((tier, index) => (
                                                    <Card key={tier.id} className="border border-violet-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow relative animate-in zoom-in-95 duration-200">
                                                        <div className="h-1 w-full bg-violet-400"></div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 z-10"
                                                            onClick={() => removeCustomTier(tier.id)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                        <CardContent className="p-5 pt-3">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <label className="text-xs font-bold text-violet-600 uppercase tracking-widest flex items-center gap-1.5"><Star className="h-3 w-3" /> Custom Tier {index + 4}</label>
                                                            </div>
                                                            <div className="relative group flex items-center">
                                                                <span className="absolute left-3 top-2.5 text-violet-600 text-sm font-bold">₹</span>
                                                                <Input value={tier.rate} onChange={(e) => updateCustomTier(tier.id, 'rate', e.target.value)} className="pl-7 h-11 w-full border-violet-300 focus-visible:ring-violet-500 bg-violet-50/50 text-violet-800 text-lg font-bold" />
                                                                <span className="absolute right-3 top-3 text-xs text-violet-600/60 font-bold uppercase">/sale</span>
                                                            </div>
                                                            <div className="mt-3 flex items-center gap-2">
                                                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Target &ge;</span>
                                                                <Input
                                                                    value={tier.threshold}
                                                                    onChange={(e) => updateCustomTier(tier.id, 'threshold', e.target.value)}
                                                                    className="h-7 w-20 text-[10px] px-2 py-0 border-slate-200"
                                                                    placeholder="e.g. 2000"
                                                                />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}

                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Skill Passport Section */}
                                {activeConfigTab === 'skillpassport' && (
                                    <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left animate-in fade-in slide-in-from-left-4 duration-300">
                                        <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                                            <div className="bg-orange-100/50 p-2 rounded-lg"><Wallet2 className="h-5 w-5 text-orange-600" /></div>
                                            <h3 className="font-bold text-slate-800 tracking-tight text-lg">Skill Passport Check</h3>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <Card className="border border-orange-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow max-w-sm w-full">
                                                    <div className="h-1 w-full bg-orange-500"></div>
                                                    <CardContent className="p-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Skill Passport Flat Config</label>
                                                        </div>
                                                        <div className="relative group flex items-center">
                                                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                                            <Input value={spRate} onChange={(e) => setSpRate(e.target.value)} className="pl-7 h-11 w-full border-orange-200 focus-visible:ring-orange-500 bg-orange-50/30 text-lg font-bold text-slate-800" />
                                                            <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold uppercase">/sale</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-1.5"><Wallet2 className="h-3 w-3 text-orange-400" /> Flat rate applied across board</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* From Influencer Section */}
                                {activeConfigTab === 'influencer' && (
                                    <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left animate-in fade-in slide-in-from-left-4 duration-300">
                                        <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                                            <div className="bg-pink-100/50 p-2 rounded-lg"><TrendingUp className="h-5 w-5 text-pink-600" /></div>
                                            <h3 className="font-bold text-slate-800 tracking-tight text-lg">From Influencer Incentive Engine</h3>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <Card className="border border-emerald-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow max-w-sm w-full">
                                                    <div className="h-1 w-full bg-emerald-500"></div>
                                                    <CardContent className="p-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Paid Influencer Rate</label>
                                                        </div>
                                                        <div className="relative group flex items-center">
                                                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">$</span>
                                                            <Input value={influencerPaidRate} onChange={(e) => setInfluencerPaidRate(e.target.value)} className="pl-7 h-11 w-full border-emerald-200 focus-visible:ring-emerald-500 bg-emerald-50/30 text-lg font-bold text-slate-800" />
                                                            <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold uppercase">/sale</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-emerald-400" /> Each <strong>paid</strong> influencer sale contributes this USD to pool</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="border border-amber-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow max-w-sm w-full">
                                                    <div className="h-1 w-full bg-amber-500"></div>
                                                    <CardContent className="p-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <label className="text-xs font-bold text-amber-700 uppercase tracking-widest">Unpaid Influencer Rate</label>
                                                        </div>
                                                        <div className="relative group flex items-center">
                                                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">$</span>
                                                            <Input value={influencerUnpaidRate} onChange={(e) => setInfluencerUnpaidRate(e.target.value)} className="pl-7 h-11 w-full border-amber-200 focus-visible:ring-amber-500 bg-amber-50/30 text-lg font-bold text-slate-800" />
                                                            <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold uppercase">/sale</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-amber-400" /> Each <strong>unpaid</strong> influencer sale contributes this USD to pool</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="border border-indigo-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow max-w-sm w-full">
                                                    <div className="h-1 w-full bg-indigo-500"></div>
                                                    <CardContent className="p-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <label className="text-xs font-bold text-indigo-700 uppercase tracking-widest">USD to INR Rate</label>
                                                        </div>
                                                        <div className="relative group flex items-center">
                                                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                                            <Input value={conversionRate} onChange={(e) => setConversionRate(e.target.value)} className="pl-7 h-11 w-full border-indigo-200 focus-visible:ring-indigo-500 bg-indigo-50/30 text-lg font-bold text-slate-800" />
                                                            <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold uppercase">/USD</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-1.5"><Globe className="h-3 w-3 text-indigo-400" /> Rate used to convert USD pool to INR</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            <div className="mt-4 bg-pink-50 p-4 rounded-lg border border-pink-100 text-sm text-pink-800">
                                                <strong>Rule:</strong> The entire accumulated USD pool from influencer sales is converted to INR using the configured forex rate, and then split equally amongst all authorized, active Marketing team members for the given month.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Save Block Footer */}
                                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-8">
                                    <div className="mb-4 sm:mb-0">
                                        <h4 className="text-sm font-bold text-slate-800">Pending Changes Overview</h4>
                                        <p className="text-xs text-slate-500">Ensure values are correct. These multipliers instantly reflect across the dashboard upon clicking save.</p>
                                    </div>
                                    <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20" onClick={saveSettings} disabled={savingRate}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        {savingRate ? "Committing Sync..." : "Commit Financial Engine"}
                                    </Button>
                                </div>

                            </div>
                        </div>
                    )}
                </Card>

                {/* Active User Search & Table */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center w-full">
                            <CardTitle className="text-lg">Active Marketing Representatives</CardTitle>
                            <div className="flex items-center gap-4">
                                <Button variant="secondary" onClick={() => handleRecalculate(false)}>Recalculate Incentives</Button>
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Search reps by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Designation</TableHead>
                                        <TableHead>Status</TableHead>

                                        <TableHead>Job Board (INR)</TableHead>
                                        <TableHead>Skill Passport</TableHead>
                                        <TableHead>Influencer (INR)</TableHead>
                                        <TableHead className="text-right">Total Combine</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeReps.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-6 text-slate-500">
                                                No active marketing representatives found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activeReps.map((rep) => (
                                            <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors">
                                                <TableCell className="font-medium text-slate-800">{rep.name}</TableCell>
                                                <TableCell className="text-slate-600">{rep.email}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-100 text-blue-800 border-none">{rep.role}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-100 text-emerald-800 border-none mr-2">Active</Badge>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-blue-300 text-xs py-0 h-6"
                                                        onClick={() => handleToggleActive(rep.id, rep.isactive)}
                                                    >
                                                        Set Inactive
                                                    </Button>
                                                </TableCell>

                                                <TableCell className="font-semibold text-emerald-600">
                                                    ₹{rep.job_board_incentive_inr.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="font-semibold text-orange-500">
                                                    ₹{(rep.skill_passport_incentive_inr || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="font-semibold text-pink-600">
                                                    ₹{(rep.influencer_incentive_inr || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right font-black text-indigo-700">
                                                    ₹{rep.incentive_inr.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right flex items-center justify-end gap-2">
                                                    <Button variant="outline" size="sm" className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200 text-xs h-7" onClick={() => handleDemoteToTrainee(rep.id)}>
                                                        Change to Trainee
                                                    </Button>
                                                    <Link href={`${basePath}/marketing/${rep.id}?month=${encodeURIComponent(getMonthName())}`}>
                                                        <Button variant="outline" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
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
                    </CardContent>
                </Card>

                {/* Trainees Table */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-lg">Active Marketing Trainees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Designation</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeTrainees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                                                No active marketing trainees found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activeTrainees.map((rep) => (
                                            <TableRow key={rep.id} className="hover:bg-slate-50 transition-colors">
                                                <TableCell className="font-medium text-slate-800">{rep.name}</TableCell>
                                                <TableCell className="text-slate-600">{rep.email}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-100 text-blue-800 border-none">{rep.role}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-100 text-emerald-800 border-none mr-2">Active</Badge>
                                                </TableCell>
                                                <TableCell className="text-right flex items-center justify-end gap-2">
                                                    <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 shadow-sm italic">
                                                        Trainee (No Dashboard)
                                                    </div>
                                                    <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 text-xs h-7" onClick={() => handlePromoteTrainee(rep.id)}>
                                                        Promote to Associate
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs h-7"
                                                        onClick={() => handleToggleActive(rep.id, rep.isactive)}
                                                    >
                                                        Deactivate
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

                {/* Inactive User Table */}
                {inactiveReps.length > 0 && (
                    <Card className="opacity-75 hover:opacity-100 transition-opacity duration-300 mb-8">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-500 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Inactive Marketing Representatives
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Designation</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inactiveReps.map((rep) => (
                                            <TableRow key={rep.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-medium text-slate-500">{rep.name}</TableCell>
                                                <TableCell className="text-slate-400">{rep.email}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-slate-100 text-slate-500 border-none">{rep.role}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="mr-2">Inactive</Badge>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-blue-300 text-xs py-0 h-6"
                                                        onClick={() => handleToggleActive(rep.id, rep.isactive)}
                                                    >
                                                        Set Active
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
