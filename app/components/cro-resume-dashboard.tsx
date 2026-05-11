"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Users, ChevronLeft, ChevronRight, Download, Edit2, Save, Eye, Globe, Settings2, AlertTriangle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface CROResumeDashboardProps {
    basePath: string;
    user: any;
    onLogout: () => void;
}

export function CROResumeDashboard({ basePath, user, onLogout }: CROResumeDashboardProps) {
    const [resumeReps, setResumeReps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const [monthOffset, setMonthOffset] = useState<number>(0)

    const [configMode, setConfigMode] = useState<"resume" | "forage">("resume")
    
    // Rate config
    const [resumeRate, setResumeRate] = useState<string>("80")
    const [forageBaseUsd, setForageBaseUsd] = useState<string>("3")
    const [forageTeamUsd, setForageTeamUsd] = useState<string>("2")
    const [forageUsdInr, setForageUsdInr] = useState<string>("85")
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

    const [targetBaseline, setTargetBaseline] = useState<number>(0)
    const [workingDays, setWorkingDays] = useState<number>(0)

    const [editingRate, setEditingRate] = useState(false)
    const [savingRate, setSavingRate] = useState(false)

    const getMonthName = () => {
        const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
        return targetDate.toLocaleString("default", { month: "long", year: "numeric" })
    }

    const fetchAllData = async () => {
        setLoading(true)
        const targetMonthStr = getMonthName();
        const period = targetMonthStr;

        const settingsKeys = [
            "resume_rate", `resume_rate_${period}`,
            "forage_base_incentive_usd", `forage_base_incentive_usd_${period}`,
            "forage_team_split_usd", `forage_team_split_usd_${period}`,
            "forage_usd_to_inr", `forage_usd_to_inr_${period}`,
            "forage_milestone_1_usd", `forage_milestone_1_usd_${period}`,
            "forage_milestone_1_inr", `forage_milestone_1_inr_${period}`,
            "forage_milestone_2_usd", `forage_milestone_2_usd_${period}`,
            "forage_milestone_2_inr", `forage_milestone_2_inr_${period}`,
            "forage_milestone_3_usd", `forage_milestone_3_usd_${period}`,
            "forage_milestone_3_inr", `forage_milestone_3_inr_${period}`,
            "forage_base_1_usd", `forage_base_1_usd_${period}`,
            "forage_base_2_usd", `forage_base_2_usd_${period}`,
            "forage_base_3_usd", `forage_base_3_usd_${period}`,
            "forage_base_4_usd", `forage_base_4_usd_${period}`
        ];

        try {
            // Parallelize: API calculation + Users fetch + Settings fetch
            const [calcRes, usersRes, settingsRes] = await Promise.all([
                fetch(`/api/calculate-resume-incentives?period=${encodeURIComponent(targetMonthStr)}&t=${Date.now()}`),
                supabase.from("users").select("id, name, email, role, designation, isactive, department, created_at").eq("department", "Resume"),
                supabase.from("resume_settings").select("key, value").in("key", settingsKeys)
            ]);

            // 1. Process Calculation API response
            if (calcRes.ok) {
                const data = await calcRes.json();
                setTargetBaseline(data.baselineTarget || 0);
                setWorkingDays(data.workingDays || 0);
            }

            // 2. Process Users + Incentives
            if (!usersRes.error && usersRes.data) {
                const targetDateForEnd = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0, 23, 59, 59);

                const normalizedData = usersRes.data
                    .filter((u: any) => {
                        const userJoinDate = u.created_at ? new Date(u.created_at) : new Date("2000-01-01");
                        const r = (u.role || "").toLowerCase();
                        const d = (u.designation || "").toLowerCase();
                        const isHead = r === "resume head" || d === "resume head" || r === "resume header" || d === "resume header";
                        return userJoinDate <= targetDateForEnd && !isHead;
                    })
                    .map((u: any) => ({
                        id: u.id,
                        name: u.name || u.email,
                        email: u.email,
                        role: u.role,
                        designation: u.designation,
                        isactive: u.isactive === true
                    }));

                const emails = normalizedData.map((u: any) => u.email);

                // Fetch incentives (depends on user emails)
                const { data: incentivesData } = await supabase
                    .from("resume_incentives")
                    .select("*")
                    .eq("period", targetMonthStr)
                    .in("email", emails);

                const repDataWithIncentives = normalizedData.map((rep: any) => {
                    const incn = incentivesData?.find((i: any) => i.email === rep.email);
                    const r = (rep.role || "").toLowerCase();
                    const d = (rep.designation || "").toLowerCase();
                    const isTraineeRep = r.includes("trainee") || d.includes("trainee") || r === "bdt-p" || d === "bdt-p";
                    
                    return {
                        ...rep,
                        target_resumes: incn?.target_resumes || 0,
                        completed_resumes: incn?.completed_resumes || 0,
                        extra_resumes: incn?.extra_resumes || 0,
                        incentive_inr: isTraineeRep ? 0 : incn?.incentive_inr || 0,
                        forage_sales_usd: incn?.forage_sales_usd || 0,
                        forage_direct_incentive_inr: isTraineeRep ? 0 : incn?.forage_direct_incentive_inr || 0,
                        forage_team_split_inr: isTraineeRep ? 0 : incn?.forage_team_split_inr || 0,
                        forage_bonus_inr: isTraineeRep ? 0 : incn?.forage_bonus_inr || 0,
                        total_incentive_inr: isTraineeRep ? 0 : incn?.total_incentive_inr || 0,
                    };
                });

                setResumeReps(repDataWithIncentives);
            }

            // 3. Process Settings
            if (!settingsRes.error && settingsRes.data) {
                const map = settingsRes.data.reduce((acc: Record<string, string>, curr: any) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {} as Record<string, string>);

                setResumeRate(map[`resume_rate_${period}`] || map["resume_rate"] || "80");
                setForageBaseUsd(map[`forage_base_incentive_usd_${period}`] || map["forage_base_incentive_usd"] || "3");
                setForageTeamUsd(map[`forage_team_split_usd_${period}`] || map["forage_team_split_usd"] || "2");
                setForageUsdInr(map[`forage_usd_to_inr_${period}`] || map["forage_usd_to_inr"] || "85");
                setForageMs1Usd(map[`forage_milestone_1_usd_${period}`] || map["forage_milestone_1_usd"] || "1000");
                setForageMs1Inr(map[`forage_milestone_1_inr_${period}`] || map["forage_milestone_1_inr"] || "1500");
                setForageMs2Usd(map[`forage_milestone_2_usd_${period}`] || map["forage_milestone_2_usd"] || "1500");
                setForageMs2Inr(map[`forage_milestone_2_inr_${period}`] || map["forage_milestone_2_inr"] || "3000");
                setForageMs3Usd(map[`forage_milestone_3_usd_${period}`] || map["forage_milestone_3_usd"] || "2000");
                setForageMs3Inr(map[`forage_milestone_3_inr_${period}`] || map["forage_milestone_3_inr"] || "4500");
                setForageBase1Usd(map[`forage_base_1_usd_${period}`] || map["forage_base_1_usd"] || "30");
                setForageBase2Usd(map[`forage_base_2_usd_${period}`] || map["forage_base_2_usd"] || "50");
                setForageBase3Usd(map[`forage_base_3_usd_${period}`] || map["forage_base_3_usd"] || "100");
                setForageBase4Usd(map[`forage_base_4_usd_${period}`] || map["forage_base_4_usd"] || "120");
            }

        } catch (e) {
            console.error("Fetch Data Error:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAllData()
    }, [monthOffset])

    const saveSettings = async () => {
        setSavingRate(true)

        const settingsArr: { key: string, value: string }[] = []

        for (let i = monthOffset; i <= monthOffset + 18; i++) {
            const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + i, 1)
            const periodStr = targetDate.toLocaleString("default", { month: "long", year: "numeric" })

            settingsArr.push(
                { key: `resume_rate_${periodStr}`, value: resumeRate },
                { key: `forage_base_incentive_usd_${periodStr}`, value: forageBaseUsd },
                { key: `forage_team_split_usd_${periodStr}`, value: forageTeamUsd },
                { key: `forage_usd_to_inr_${periodStr}`, value: forageUsdInr },
                { key: `forage_milestone_1_usd_${periodStr}`, value: forageMs1Usd },
                { key: `forage_milestone_1_inr_${periodStr}`, value: forageMs1Inr },
                { key: `forage_milestone_2_usd_${periodStr}`, value: forageMs2Usd },
                { key: `forage_milestone_2_inr_${periodStr}`, value: forageMs2Inr },
                { key: `forage_milestone_3_usd_${periodStr}`, value: forageMs3Usd },
                { key: `forage_milestone_3_inr_${periodStr}`, value: forageMs3Inr },
                { key: `forage_base_1_usd_${periodStr}`, value: forageBase1Usd },
                { key: `forage_base_2_usd_${periodStr}`, value: forageBase2Usd },
                { key: `forage_base_3_usd_${periodStr}`, value: forageBase3Usd },
                { key: `forage_base_4_usd_${periodStr}`, value: forageBase4Usd }
            )
        }

        const { error } = await supabase
            .from("resume_settings")
            .upsert(settingsArr, { onConflict: "key" })

        if (!error) {
            setEditingRate(false)
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
            alert("Failed to toggle active state: " + error.message)
            return
        }

        setResumeReps((prev) => prev.map((r) => (r.id === repId ? { ...r, isactive: data.isactive } : r)))
    }

    const handlePromoteTrainee = async (repId: string) => {
        const { error } = await supabase.from("users").update({ role: "Resume Associate", designation: "Resume Associate" }).eq("id", repId);
        if (!error) {
            await handleRecalculate(true);
        } else {
            alert("Failed to promote trainee: " + error.message);
        }
    }

    const handleDemoteToTrainee = async (repId: string) => {
        const { error } = await supabase.from("users").update({ role: "Resume Trainee", designation: "Resume Trainee", incentive_amount: 0 }).eq("id", repId);
        if (!error) {
            await handleRecalculate(true);
        } else {
            alert("Failed to change to trainee: " + error.message);
        }
    }

    const isTrainee = (rep: any) => {
        const r = (rep.role || "").toLowerCase();
        const d = (rep.designation || "").toLowerCase();
        return r.includes("trainee") || d.includes("trainee") || r === "bdt-p" || d === "bdt-p";
    }

    const filteredReps = useMemo(() => {
        return resumeReps.filter(rep => {
            if (!searchTerm.trim()) return true
            const t = searchTerm.toLowerCase()
            return rep.name?.toLowerCase().includes(t) || rep.email?.toLowerCase().includes(t) || rep.role?.toLowerCase().includes(t)
        })
    }, [resumeReps, searchTerm]);

    const { activeReps, activeTrainees } = useMemo(() => ({
        activeReps: filteredReps.filter(rep => rep.isactive && !isTrainee(rep)),
        activeTrainees: filteredReps.filter(rep => rep.isactive && isTrainee(rep))
    }), [filteredReps]);

    const { totalIncentivesINR, totalResumeIncentivesINR, totalForageIncentivesINR, totalCompletedResumes, totalExtraResumes, totalJobSimulationsUSD } = useMemo(() => ({
        totalIncentivesINR: activeReps.reduce((sum, rep) => sum + (rep.total_incentive_inr || 0), 0),
        totalResumeIncentivesINR: activeReps.reduce((sum, rep) => sum + (rep.incentive_inr || 0), 0),
        totalForageIncentivesINR: activeReps.reduce((sum, rep) => sum + ((rep.forage_direct_incentive_inr || 0) + (rep.forage_team_split_inr || 0) + (rep.forage_bonus_inr || 0)), 0),
        totalCompletedResumes: activeReps.reduce((sum, rep) => sum + (rep.completed_resumes || 0), 0),
        totalExtraResumes: activeReps.reduce((sum, rep) => sum + (rep.extra_resumes || 0), 0),
        totalJobSimulationsUSD: activeReps.reduce((sum, rep) => sum + (rep.forage_sales_usd || 0), 0)
    }), [activeReps]);

    const exportToCSV = () => {
        const headers = ["Name", "Email", "Designation", "Status", "Working Days", "Required Target", "Completed", "Extra Resumes", "Incentive (INR)"];
        const csvRows = [headers.join(",")];

        filteredReps.forEach(rep => {
            const name = `"${(rep.name || "").replace(/"/g, '""')}"`;
            const email = `"${(rep.email || "").replace(/"/g, '""')}"`;
            const role = `"${(rep.role || "").replace(/"/g, '""')}"`;
            const status = `"${rep.isactive ? "Active" : "Inactive"}"`;
            
            csvRows.push([name, email, role, status, workingDays, rep.target_resumes, rep.completed_resumes, rep.extra_resumes, rep.incentive_inr].join(","));
        });

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Resume_Team_Incentives_${getMonthName().replace(" ", "_")}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleRecalculate = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`/api/calculate-resume-incentives?period=${encodeURIComponent(getMonthName())}&t=${Date.now()}`, {
                cache: "no-store",
                headers: { "Pragma": "no-cache" }
            });
            if (res.ok) {
                await fetchAllData();
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
            {loading && (
                <div className="fixed inset-0 z-50 bg-slate-100/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-300 border border-slate-100">
                        <div className="relative flex items-center justify-center w-20 h-20 mb-6">
                            <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-[spin_1s_linear_infinite]"></div>
                            <div className="absolute inset-2 rounded-full border-r-4 border-blue-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
                            <div className="absolute inset-4 rounded-full border-b-4 border-emerald-400 animate-[spin_2s_linear_infinite]"></div>
                            <Users className="h-5 w-5 text-indigo-600 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Synchronizing Data</h3>
                        <p className="text-sm text-slate-500 mt-2 text-center">Processing operational metrics...</p>
                    </div>
                </div>
            )}
            
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-start mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Resume Team Dashboard</h1>
                        <p className="text-slate-600">Track and manage complete Resume Team performances</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <Button variant="outline" className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={exportToCSV}>
                            <Download className="h-4 w-4" /> Export CSV
                        </Button>
                        <Button onClick={onLogout}>Logout</Button>
                    </div>
                </div>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5" />
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
                            <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Team Size</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="relative z-10 pt-2 pb-5">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-slate-800 tracking-tight">{activeReps.length}</div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Reps</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-3 font-medium flex items-center gap-1.5">
                                Required monthly baseline limit: <span className="text-slate-700 font-bold">{targetBaseline}</span> copies/rep
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden group border-slate-200/60 bg-white">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-1.5 bg-slate-50/40 border-b border-slate-100/50">
                            <CardTitle className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Delivery Output</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4 pb-5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 font-bold">Total Resumes Processed</span>
                                <span className="font-black text-slate-800 text-lg">{totalCompletedResumes}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-emerald-700 font-bold">Job Simulations Target Volume</span>
                                <span className="font-black text-emerald-600 border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 rounded text-lg">${totalJobSimulationsUSD.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-indigo-700 font-bold">Resumes Exceeding Quota</span>
                                <span className="font-black text-indigo-600 border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded text-sm">{totalExtraResumes}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/50 border-blue-100">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-1 bg-transparent relative z-10">
                            <CardTitle className="text-[11px] font-extrabold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                                Paid Out Incentive Pool
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3 relative z-10 pb-5">
                            <div className="flex flex-col mb-2">
                                <span className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-800 tracking-tighter leading-none drop-shadow-sm mt-1">
                                    ₹{totalIncentivesINR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                <div className="bg-white/60 rounded p-2 border border-slate-200/60 shadow-sm">
                                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Resume Yield</p>
                                    <p className="text-indigo-700 font-bold text-sm">₹{totalResumeIncentivesINR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                                <div className="bg-white/60 rounded p-2 border border-emerald-200/60 shadow-sm">
                                    <p className="text-[9px] uppercase font-bold text-emerald-600 tracking-widest">Forage Yield</p>
                                    <p className="text-emerald-700 font-bold text-sm">₹{totalForageIncentivesINR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>

                            {/* Transparent Financial Engine Calculation Breakdown */}
                            <div className="mt-4 pt-4 border-t border-blue-200/50">
                                <p className="text-[9px] font-bold text-blue-800/70 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                                    Financial Engine Global Math
                                </p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] text-blue-900/70 font-medium font-mono">
                                        <span>Total Team Resume Overshoot ({totalExtraResumes} items × ₹{resumeRate})</span>
                                        <span>₹{totalResumeIncentivesINR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-blue-900/70 font-medium font-mono">
                                        <span>Total Forage Distributed Sum (Base + Slab + Pool)</span>
                                        <span>₹{totalForageIncentivesINR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="text-[9px] text-blue-800/50 italic mt-2 border-t border-blue-100 pt-2 leading-relaxed">
                                        * Note: Slabs scale directly based on aggregated USD volume milestones dynamically hit by the team. Team split pools are divided via active placement counts.
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className={`mb-8 border-0 shadow-xl overflow-hidden ring-1 transition-all duration-500 ${editingRate ? 'ring-indigo-500/30' : 'ring-slate-200/50 hover:ring-indigo-300'}`}>
                    <CardHeader className={`transition-all duration-500 relative overflow-hidden ${editingRate ? 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white py-8' : 'bg-white hover:bg-slate-50/80 py-6'}`}>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-2xl shadow-inner transition-colors duration-500 ${editingRate ? 'bg-white/10 border border-white/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                                    <Settings2 className={`h-7 w-7 ${editingRate ? 'text-indigo-100' : 'text-indigo-600'}`} />
                                </div>
                                <div>
                                    <CardTitle className={`text-2xl font-black tracking-tight flex items-center gap-3 ${editingRate ? 'text-white' : 'text-slate-800'}`}>
                                        Department Financial Engine
                                    </CardTitle>
                                    <p className={`text-sm mt-1.5 font-medium max-w-lg leading-relaxed ${editingRate ? 'text-indigo-200/90' : 'text-slate-500'}`}>
                                        Configure flat rates for extra volume output for {getMonthName()}.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setEditingRate(!editingRate)}
                                size="lg"
                                className={`font-bold transition-all duration-300 shadow-md ${!editingRate ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                variant={editingRate ? "outline" : "default"}
                            >
                                {editingRate ? "Hide Board" : "Launch Configuration Panel"}
                            </Button>
                        </div>
                    </CardHeader>

                    {editingRate && (
                        <div className="bg-slate-50/50 animate-in slide-in-from-top-8 fade-in duration-500 ease-out border-t border-slate-200 p-6 md:p-8">
                            <div className="flex bg-slate-200/60 p-1 w-fit rounded-lg mb-8 mx-auto">
                                <button className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${configMode === "resume" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => setConfigMode("resume")}>Resume Pricing</button>
                                <button className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${configMode === "forage" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => setConfigMode("forage")}>Job Simulation Details</button>
                            </div>

                            {configMode === "resume" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                    <Card className="border border-indigo-100 shadow-sm w-full">
                                        <div className="h-1 w-full bg-indigo-500"></div>
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rate Per Extra Resume</label>
                                            </div>
                                            <div className="relative group">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                                                <Input value={resumeRate} onChange={(e) => setResumeRate(e.target.value)} className="pl-7 h-11 border-indigo-200 bg-indigo-50/30 font-bold" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="border border-emerald-100 shadow-sm md:col-span-3">
                                        <div className="h-1 w-full bg-emerald-500"></div>
                                        <CardContent className="p-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pricing Matrix Bases</label>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">1 Cert</span>
                                                            <Input value={forageBase1Usd} onChange={(e) => setForageBase1Usd(e.target.value)} className="h-8 text-xs" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">2 Certs</span>
                                                            <Input value={forageBase2Usd} onChange={(e) => setForageBase2Usd(e.target.value)} className="h-8 text-xs" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">3 Certs</span>
                                                            <Input value={forageBase3Usd} onChange={(e) => setForageBase3Usd(e.target.value)} className="h-8 text-xs" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">4+ Certs</span>
                                                            <Input value={forageBase4Usd} onChange={(e) => setForageBase4Usd(e.target.value)} className="h-8 text-xs" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">5+ Certs</span>
                                                            <Input value={forageBase5Usd} onChange={(e) => setForageBase5Usd(e.target.value)} className="h-8 text-xs" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Baseline Split Configuration</label>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Seller ($)</span>
                                                            <Input value={forageBaseUsd} onChange={(e) => setForageBaseUsd(e.target.value)} className="h-9 border-emerald-200 bg-emerald-50/30 text-sm" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Team Pool ($)</span>
                                                            <Input value={forageTeamUsd} onChange={(e) => setForageTeamUsd(e.target.value)} className="h-9 border-emerald-200 bg-emerald-50/30 text-sm" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border border-blue-100 shadow-sm w-full">
                                        <div className="h-1 w-full bg-blue-500"></div>
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">USD to INR Forex Rate</label>
                                            </div>
                                            <div className="relative group mt-5">
                                                <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">₹</span>
                                                <Input value={forageUsdInr} onChange={(e) => setForageUsdInr(e.target.value)} className="pl-7 h-9 border-blue-200 bg-blue-50/30 text-sm" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="border border-violet-100 shadow-sm w-full">
                                        <div className="h-1 w-full bg-violet-500"></div>
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Volume Threshold Bonuses</label>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 bg-violet-50/50 rounded-lg p-2.5 border border-violet-100">
                                                    <span className="text-[10px] font-bold text-violet-500 uppercase w-14 shrink-0">Tier 1</span>
                                                    <span className="text-xs text-slate-500">Hit</span>
                                                    <div className="relative flex-1"><span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span><Input value={forageMs1Usd} onChange={(e) => setForageMs1Usd(e.target.value)} className="h-7 pl-5 text-xs" /></div>
                                                    <span className="text-xs text-slate-500">→ Get</span>
                                                    <div className="relative flex-1"><span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span><Input value={forageMs1Inr} onChange={(e) => setForageMs1Inr(e.target.value)} className="h-7 pl-5 text-xs" /></div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-violet-50/50 rounded-lg p-2.5 border border-violet-100">
                                                    <span className="text-[10px] font-bold text-violet-500 uppercase w-14 shrink-0">Tier 2</span>
                                                    <span className="text-xs text-slate-500">Hit</span>
                                                    <div className="relative flex-1"><span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span><Input value={forageMs2Usd} onChange={(e) => setForageMs2Usd(e.target.value)} className="h-7 pl-5 text-xs" /></div>
                                                    <span className="text-xs text-slate-500">→ Get</span>
                                                    <div className="relative flex-1"><span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span><Input value={forageMs2Inr} onChange={(e) => setForageMs2Inr(e.target.value)} className="h-7 pl-5 text-xs" /></div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-violet-50/50 rounded-lg p-2.5 border border-violet-100">
                                                    <span className="text-[10px] font-bold text-violet-500 uppercase w-14 shrink-0">Tier 3</span>
                                                    <span className="text-xs text-slate-500">Hit</span>
                                                    <div className="relative flex-1"><span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span><Input value={forageMs3Usd} onChange={(e) => setForageMs3Usd(e.target.value)} className="h-7 pl-5 text-xs" /></div>
                                                    <span className="text-xs text-slate-500">→ Get</span>
                                                    <div className="relative flex-1"><span className="absolute left-2 top-1.5 text-slate-400 text-xs">₹</span><Input value={forageMs3Inr} onChange={(e) => setForageMs3Inr(e.target.value)} className="h-7 pl-5 text-xs" /></div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                            
                            <div className="flex flex-col flex-row justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-8">
                                <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" onClick={saveSettings} disabled={savingRate}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {savingRate ? "Committing Sync..." : "Commit Setting"}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="mb-8 overflow-hidden shadow-sm">
                    <CardHeader className="bg-white border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
                            <div className="flex items-center gap-4">
                                <CardTitle className="text-lg">Resume Team Performance Registry</CardTitle>
                                <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Working Days:</span>
                                    <Badge variant="secondary" className="bg-white text-slate-700 shadow-sm">{workingDays}</Badge>
                                </div>
                                <div className="hidden md:flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                    <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Required Quota:</span>
                                    <Badge variant="outline" className="bg-white text-indigo-700 shadow-sm border-indigo-200">{targetBaseline}</Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <Button variant="secondary" onClick={() => handleRecalculate(false)}>Sync CRM Data</Button>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
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
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-blue-700">Total Completed</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-emerald-700">Extra Volume</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-wider text-emerald-700 text-center">Job Simulation Yield</TableHead>
                                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-indigo-700">Total Compensation</TableHead>
                                        <TableHead className="text-right pr-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeReps.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Users className="h-8 w-8 text-slate-300" />
                                                    <p>No active resume representatives found for this month.</p>
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
                                                <TableCell>
                                                    <div className="font-bold text-blue-700 bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-100">
                                                        {rep.completed_resumes}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {rep.extra_resumes > 0 ? (
                                                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-100">
                                                            <span>+{rep.extra_resumes}</span>
                                                            <TrendingUp className="h-3 w-3" />
                                                        </div>
                                                    ) : (
                                                        <div className="font-semibold text-slate-400">-</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {rep.forage_sales_usd > 0 ? (
                                                        <div className="flex flex-col items-center">
                                                            <div className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">${rep.forage_sales_usd}</div>
                                                            <div className="text-[10px] text-emerald-500/70 mt-0.5 font-bold">Split + Bonus</div>
                                                        </div>
                                                    ) : (
                                                        <div className="font-semibold text-slate-400">-</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="font-black text-lg text-indigo-700 tracking-tight">
                                                        ₹{(rep.total_incentive_inr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="outline" size="sm" className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200 text-xs h-7" onClick={() => handleDemoteToTrainee(rep.id)}>
                                                            Change to Trainee
                                                        </Button>
                                                        <Link href={`${basePath}/resume/${rep.id}?month=${encodeURIComponent(getMonthName())}`}>
                                                            <Button variant="outline" size="sm" className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 text-xs h-7">
                                                                <Eye className="h-3.5 w-3.5" /> View Dashboard
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs h-7" onClick={() => handleToggleActive(rep.id, rep.isactive)}>
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

                {/* Trainees Table */}
                <Card className="mb-8 overflow-hidden shadow-sm">
                    <CardHeader className="bg-white border-b border-slate-100">
                        <CardTitle className="text-lg">Active Resume Trainees</CardTitle>
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
                                                No active resume trainees found.
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
                                                        <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 shadow-sm italic">
                                                            Trainee (No Dashboard)
                                                        </div>
                                                        <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 text-xs h-7" onClick={() => handlePromoteTrainee(rep.id)}>
                                                            Promote to Associate
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs h-7" onClick={() => handleToggleActive(rep.id, rep.isactive)}>
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
            </div>
        </div>
    )
}
