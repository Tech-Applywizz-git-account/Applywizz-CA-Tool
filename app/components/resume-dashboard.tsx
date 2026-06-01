"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TrendingUp, Users, DollarSign, Calendar, ChevronLeft, ChevronRight, User, Eye, EyeOff, FileText, CheckCircle2, LogOut, LayoutDashboard, BrainCircuit, Info, ClipboardCheck, Menu, X } from "lucide-react"
import { ResumeCompletionForm } from "./resume-completion-form"

interface ResumeDashboardProps {
    user: any;
    onLogout: () => void;
    viewerMode?: boolean;
}

export function ResumeDashboard({ user, onLogout, viewerMode }: ResumeDashboardProps) {
    const [loading, setLoading] = useState(true)
    const [incentiveData, setIncentiveData] = useState<any>(null)
    const [isEligible, setIsEligible] = useState<boolean>(true)
    const isFirstLoad = useRef(true);

    const [isScrolled, setIsScrolled] = useState(false)
    const [monthOffset, setMonthOffset] = useState<number>(0)
    const [completedResumes, setCompletedResumes] = useState<any[]>([])
    const [forageSales, setForageSales] = useState<any[]>([])
    const [rates, setRates] = useState<any>({ resumeRate: 80, milestones: [], baseTiers: [] })

    const [resumePage, setResumePage] = useState<number>(1)
    const [foragePage, setForagePage] = useState<number>(1)
    const itemsPerPage = 10

    const [showIncentives, setShowIncentives] = useState(false)
    const [activeTab, setActiveTab] = useState<"overview" | "resumes" | "forage" | "completion">("overview")
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
    const getMonthName = () => targetDate.toLocaleString("default", { month: "long", year: "numeric" })

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 40)
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const fetchData = useCallback(async () => {
        if (isFirstLoad.current) setLoading(true);
        try {
            const periodStr = targetDate.toLocaleString("default", { month: "long", year: "numeric" });
            await fetch(`/api/calculate-resume-incentives?period=${encodeURIComponent(periodStr)}`, { cache: 'no-store' });

            const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            const res = await fetch(`/api/resume-data?email=${encodeURIComponent(user.email)}&month=${monthStr}`);
            const data = await res.json();
            if (data.success) {
                setIsEligible(data.eligible);
                setCompletedResumes(data.completedResumesList || []);
                setForageSales(data.forageSalesList || []);
                setIncentiveData(data.incentiveData);
                if (data.rates) setRates(data.rates);
            }
        } catch (e) {
            console.error("Failed to fetch resume data:", e);
        }
        setLoading(false);
        isFirstLoad.current = false;
    }, [user.email, monthOffset]);

    useEffect(() => {
        isFirstLoad.current = true;
        fetchData();
        setResumePage(1);
        setForagePage(1);
    }, [fetchData])

    const totalResumePages = Math.ceil(completedResumes.length / itemsPerPage) || 1;
    const paginatedResumes = completedResumes.slice((resumePage - 1) * itemsPerPage, resumePage * itemsPerPage);

    const totalForagePages = Math.ceil(forageSales.length / itemsPerPage) || 1;
    const paginatedForage = forageSales.slice((foragePage - 1) * itemsPerPage, foragePage * itemsPerPage);

    const renderMonthControls = () => (
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-100 transition-all font-semibold" onClick={() => setMonthOffset((prev) => prev - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-md whitespace-nowrap font-bold" onClick={() => setMonthOffset(0)}>
                {getMonthName()}
            </Button>
            <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-100 transition-all font-semibold" onClick={() => setMonthOffset((prev) => prev + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            {isEligible && !loading && (
                <aside className={`
                    fixed top-0 bottom-0 left-0 z-40 w-64 h-screen shrink-0
                    bg-white border-r border-slate-200 p-4 shadow-xl lg:shadow-none
                    flex flex-col transition-transform duration-300
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    overflow-y-auto
                `}>
                    {/* Sidebar header */}
                    <div className="p-3 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                                <Users className="h-4.5 w-4.5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Associate Portal</p>
                                <p className="text-xs font-bold text-slate-700 leading-tight">Resume & Forage</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav items */}
                    <nav className="flex-1 space-y-1">
                        {[
                            { id: "overview", label: "Overview Dashboard", icon: LayoutDashboard, color: "text-indigo-500", gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" },
                            { id: "resumes", label: "Resume Registry", icon: FileText, color: "text-blue-500", gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)" },
                            { id: "forage", label: "Forage Sales", icon: TrendingUp, color: "text-emerald-500", gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)" },
                            { id: "completion", label: "Submit Completion", icon: ClipboardCheck, color: "text-teal-500", gradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)" }
                        ].map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${isActive ? 'shadow-sm text-white' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                                        }`}
                                    style={isActive ? { background: item.gradient } : {}}
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                                        style={isActive ? { background: 'rgba(255,255,255,0.2)' } : {}}
                                    >
                                        <Icon className={isActive ? 'text-white' : item.color} style={{ width: '1rem', height: '1rem' }} />
                                    </div>
                                    <span className="text-xs font-bold truncate">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>
            )}

            {/* Overlay for mobile sidebar */}
            {isEligible && !loading && sidebarOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main Content Area */}
            <div className={`flex-1 min-w-0 flex flex-col p-4 lg:p-8 ${isEligible && !loading ? 'lg:ml-64' : ''}`}>
                <div className="max-w-7xl mx-auto w-full space-y-6 relative">

                    {/* Header */}
                    <div className={`flex justify-between items-center bg-white rounded-xl shadow-md border border-slate-200 bg-gradient-to-r from-white to-slate-50/50 sticky top-2 z-30 transition-all duration-500 overflow-hidden backdrop-blur-lg ${isScrolled ? 'p-3 px-6 bg-white/95 shadow-lg' : 'p-6 items-start'}`}>
                        <div className="flex items-center gap-4 transition-all duration-500">
                            {/* Mobile sidebar toggle button */}
                            {isEligible && !loading && (
                                <button
                                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors mr-1 shrink-0"
                                    onClick={() => setSidebarOpen(o => !o)}
                                >
                                    {sidebarOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
                                </button>
                            )}
                            <div className="flex flex-col justify-center">
                                <p className={`text-xs text-indigo-500 font-black uppercase tracking-widest shrink-0 transition-all duration-500 ease-in-out ${isScrolled ? 'h-0 opacity-0 m-0' : 'mb-1.5 h-4 opacity-100'}`}>
                                    Resume & Forage Performance
                                </p>
                                <div className="flex items-center gap-3">
                                    <h1 className={`font-extrabold text-slate-900 tracking-tight transition-all duration-500 ease-in-out ${isScrolled ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl mb-3'}`}>
                                        {isScrolled ? "Hello, " : "Welcome back, "}
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 drop-shadow-sm">
                                            {user.name || "Associate"}
                                        </span>
                                    </h1>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row items-center gap-3 justify-end">
                            <div className="bg-slate-100/50 p-1.5 rounded-lg border border-slate-200 hidden md:block">
                                {renderMonthControls()}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className={`rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all duration-300 shadow-sm flex items-center gap-3 ${isScrolled ? 'px-2 h-9' : 'px-4 h-12'}`}>
                                        <div className="bg-indigo-100 p-1.5 rounded-lg">
                                            <User className={`text-indigo-600 ${isScrolled ? 'h-3.5 w-3.5' : 'h-5 w-5'}`} />
                                        </div>
                                        <span className={`font-bold text-slate-700 hidden sm:block ${isScrolled ? 'text-xs' : 'text-sm'}`}>Profile</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 border-slate-200 shadow-xl rounded-xl p-2 mt-2">
                                    <DropdownMenuLabel className="font-normal p-3 bg-slate-50 rounded-lg mb-2">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                            <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    {!viewerMode && (
                                        <DropdownMenuItem onClick={onLogout} className="text-red-600 font-bold cursor-pointer p-3 rounded-lg hover:bg-red-50 focus:bg-red-100 transition-colors">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Disconnect System</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse min-h-[400px]">
                            <LayoutDashboard className="h-16 w-16 text-indigo-400 mb-6" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Syncing Performance Data</h3>
                        </div>
                    ) : !isEligible ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
                            <Calendar className="h-20 w-20 text-slate-400 mb-6" />
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">Not Placed in System</h2>
                            {renderMonthControls()}
                        </div>
                    ) : (
                        <div className="flex-1 w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Active Tab Banner */}
                            <div className={`p-5 rounded-2xl text-white shadow-md relative overflow-hidden ${activeTab === 'overview' ? 'bg-gradient-to-r from-indigo-600 to-violet-600' :
                                activeTab === 'resumes' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
                                    activeTab === 'forage' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' :
                                        'bg-gradient-to-r from-teal-600 to-cyan-600'
                                }`}>
                                <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
                                <div className="relative">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">Resume Associate Portal</p>
                                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                                        {activeTab === 'overview' && <><LayoutDashboard className="h-5 w-5" /> Performance Overview</>}
                                        {activeTab === 'resumes' && <><FileText className="h-5 w-5" /> Completed Resumes Registry</>}
                                        {activeTab === 'forage' && <><TrendingUp className="h-5 w-5" /> Forage Simulation Sales</>}
                                        {activeTab === 'completion' && <><ClipboardCheck className="h-5 w-5" /> Submit Resume Completion</>}
                                    </h2>
                                </div>
                            </div>

                            {activeTab === "overview" && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* Summary View */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <Card className="lg:col-span-2 border-0 shadow-sm rounded-2xl ring-1 ring-slate-200/50 p-6 bg-white overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-50 to-violet-500"></div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                                    <LayoutDashboard className="h-4 w-4 text-indigo-500" /> {getMonthName()} Performance
                                                </h3>
                                                <div className="md:hidden">{renderMonthControls()}</div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-4 transition-all hover:bg-white hover:shadow-md group">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FileText className="h-3 w-3 text-indigo-400" />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed Resumes</p>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-3xl font-black text-slate-800">{incentiveData?.completed_resumes || 0}</span>
                                                        <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-600 border-0 font-bold">Target: {incentiveData?.target_resumes || 0}</Badge>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-indigo-500 mt-2 flex items-center gap-1 opacity-70">
                                                        ₹{rates.resumeRate} per extra unit
                                                    </p>
                                                </div>
                                                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 mb-4 transition-all hover:bg-emerald-50 hover:shadow-md">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <BrainCircuit className="h-3 w-3 text-emerald-500" />
                                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Simulation Yield (INR)</p>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={`text-3xl font-black text-emerald-700 transition-all ${showIncentives ? '' : 'blur-md'}`}>
                                                            ₹{(Math.max(0, (incentiveData?.forage_direct_incentive_inr || 0) + (incentiveData?.forage_team_split_inr || 0))).toLocaleString()}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-emerald-500">Incentive Pool</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1 opacity-70">
                                                        Direct + Team Split
                                                    </p>
                                                </div>
                                                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 mb-4 transition-all hover:bg-blue-50 hover:shadow-md">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <TrendingUp className="h-3 w-3 text-blue-500" />
                                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Total USD Volume</p>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-3xl font-black text-blue-700">${(incentiveData?.forage_sales_usd || 0).toLocaleString()}</span>
                                                        <span className="text-[10px] font-bold text-blue-500">Sales Value</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-blue-600 mt-2 flex items-center gap-1 opacity-70">
                                                        Contributes to Slab Targets
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Combined Payout Card */}
                                        <Card className="bg-slate-900 border-0 shadow-xl rounded-2xl p-6 flex flex-col relative overflow-hidden ring-1 ring-white/10 group">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500"></div>
                                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                                            <div className="flex justify-between items-center mb-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-white/10 p-2 rounded-lg border border-white/5">
                                                        <DollarSign className="h-5 w-5 text-emerald-400" />
                                                    </div>
                                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Global Rewards Pool</span>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 text-slate-400 rounded-lg" onClick={() => setShowIncentives(!showIncentives)}>
                                                    {showIncentives ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>

                                            <div className="flex flex-col space-y-1 mb-8">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Compensation (Combined)</p>
                                                <div className={`text-5xl font-black tracking-tighter transition-all duration-500 ${showIncentives ? 'text-white' : 'text-white blur-lg select-none'}`}>
                                                    ₹{(incentiveData?.total_incentive_inr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Resume Yield</p>
                                                    <p className={`text-lg font-black transition-all ${showIncentives ? 'text-indigo-300' : 'text-indigo-300/20 blur-[2px]'}`}>₹{(incentiveData?.incentive_inr || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Forage Yield</p>
                                                    <p className={`text-lg font-black transition-all ${showIncentives ? 'text-emerald-300' : 'text-emerald-300/20 blur-[2px]'}`}>
                                                        ₹{((incentiveData?.forage_direct_incentive_inr || 0) + (incentiveData?.forage_team_split_inr || 0) + (incentiveData?.forage_bonus_inr || 0)).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Transparent Financial Engine Calculation Breakdown */}
                                            <div className={`mt-5 pt-5 border-t border-white/10 transition-opacity duration-300 ${showIncentives ? 'opacity-70 hover:opacity-100' : 'opacity-0 select-none pointer-events-none blur-md h-0 overflow-hidden'}`}>
                                                <p className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5 hover:text-emerald-400">
                                                    <BrainCircuit className="h-3 w-3" /> Financial Engine Math
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] text-slate-300/70 font-medium font-mono">
                                                        <span>Resume Over-Target Yield ({Math.max(0, (incentiveData?.completed_resumes || 0) - (incentiveData?.target_resumes || 0))} extra units × ₹{rates.resumeRate})</span>
                                                        <span>₹{(incentiveData?.incentive_inr || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-slate-300/70 font-medium font-mono">
                                                        <span>Forage Personal Sum (Direct Comms + Team Split Pool + Slab Bonuses)</span>
                                                        <span>₹{((incentiveData?.forage_direct_incentive_inr || 0) + (incentiveData?.forage_team_split_inr || 0) + (incentiveData?.forage_bonus_inr || 0)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px] font-bold text-emerald-300/90 mt-2 pt-2 border-t border-white/10 font-mono">
                                                        <span>Total System Payout</span>
                                                        <span>₹{(incentiveData?.total_incentive_inr || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Slab Rule Suggestions Table */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Job Simulation Bonus Slab Matrix</h4>
                                            </div>
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
                                                Current Volume: ${(incentiveData?.forage_sales_usd || 0).toLocaleString()}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                            {(rates.milestones || []).map((ms: any, idx: number) => {
                                                const currentUsd = incentiveData?.forage_sales_usd || 0;
                                                const isHit = currentUsd >= ms.targetUsd;
                                                return (
                                                    <div key={idx} className={`p-6 flex flex-col justify-center items-center text-center transition-all ${isHit ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                                                        <div className={`p-2 rounded-full mb-3 ${isHit ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                            {isHit ? <CheckCircle2 className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                                                        </div>
                                                        <p className={`text-[10px] font-black uppercase mb-1 tracking-tighter ${isHit ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                            {isHit ? 'Milestone Reached' : `Milestone ${idx + 1}`}
                                                        </p>
                                                        <p className={`text-lg font-black ${isHit ? 'text-emerald-800' : 'text-slate-700'}`}>Target ${ms.targetUsd.toLocaleString()}</p>
                                                        <div className="flex items-center gap-2 mt-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                                            <span className={`text-[10px] font-bold ${isHit ? 'text-emerald-500' : 'text-indigo-400'}`}>BONUS</span>
                                                            <span className={`text-xl font-black ${isHit ? 'text-emerald-700' : 'text-indigo-600'}`}>₹{ms.bonusInr.toLocaleString()}</span>
                                                        </div>

                                                        {!isHit && currentUsd > 0 && (
                                                            <div className="w-full mt-4 space-y-1.5">
                                                                <div className="flex justify-between text-[10px] font-bold transition-all">
                                                                    <span className="text-slate-400">{Math.round((currentUsd / ms.targetUsd) * 100)}%</span>
                                                                    <span className="text-indigo-500">-${(ms.targetUsd - currentUsd).toLocaleString()} to target</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                                                                    <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (currentUsd / ms.targetUsd) * 100)}%` }}></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Rules & Information Sections */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                                        {/* Resume Rules */}
                                        <Card className="border-0 shadow-sm bg-indigo-50/50 rounded-2xl p-5 ring-1 ring-indigo-100 flex flex-col">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide">Resume Incentives</h4>
                                            </div>
                                            <div className="space-y-3 flex-grow">
                                                <div className="flex items-start gap-2 text-[11px] text-indigo-900/70 leading-relaxed font-medium">
                                                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                                                    <p>Base quota is dynamically calculated based on working days and team size for {getMonthName()}.</p>
                                                </div>
                                                <div className="flex items-start gap-2 text-[11px] text-indigo-900/70 leading-relaxed font-medium">
                                                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                                                    <p>Every successfully completed resume exceeding your base quota pays out a flat rate of <span className="font-bold text-indigo-700">₹{rates.resumeRate} per unit</span>.</p>
                                                </div>
                                                <div className="flex items-start gap-2 text-[11px] text-indigo-900/70 leading-relaxed font-medium">
                                                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                                                    <p>Payment is processed only for 'Fully Completed' statuses verified via CRM logs.</p>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Job Simulation Rules */}
                                        <Card className="border-0 shadow-sm bg-emerald-50/50 rounded-2xl p-5 ring-1 ring-emerald-100 flex flex-col">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                                                    <BrainCircuit className="h-4 w-4" />
                                                </div>
                                                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide">Forage Simulation</h4>
                                            </div>
                                            <div className="space-y-3 flex-grow">
                                                <div className="flex items-start gap-2 text-[11px] text-emerald-900/70 leading-relaxed font-medium">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                                                    <p>Sales must meet or exceed the certificate base target ($30/1, $50/2, etc.) to qualify for direct incentives.</p>
                                                </div>
                                                <div className="flex items-start gap-2 text-[11px] text-emerald-900/70 leading-relaxed font-medium">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                                                    <p>Direct payouts include <span className="font-bold text-emerald-700">$3 Base + $1 for every $10 premium</span> over the target price.</p>
                                                </div>
                                                <div className="flex items-start gap-2 text-[11px] text-emerald-900/70 leading-relaxed font-medium">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                                                    <p>A dedicated <span className="font-bold text-emerald-700">$2 per sale</span> is pooled and distributed equally among all other active Resume associates.</p>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Slab Rules */}
                                        <Card className="border-0 shadow-sm bg-violet-50/50 rounded-2xl p-5 ring-1 ring-violet-100 flex flex-col">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-violet-100 rounded-lg text-violet-600">
                                                    <TrendingUp className="h-4 w-4" />
                                                </div>
                                                <h4 className="text-xs font-black text-violet-900 uppercase tracking-wide">Monthly Slab Bonuses</h4>
                                            </div>
                                            <div className="space-y-3 flex-grow">
                                                <div className="flex items-start gap-2 text-[11px] text-violet-900/70 leading-relaxed font-medium">
                                                    <div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 shrink-0"></div>
                                                    <p>Bonuses are calculated based on your total USD revenue generated within the current {getMonthName()} cycle.</p>
                                                </div>
                                                <div className="flex items-start gap-2 text-[11px] text-violet-900/70 leading-relaxed font-medium">
                                                    <div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 shrink-0"></div>
                                                    <p>Milestones (e.g., $1000, $1500, $2000) unlock tier-specific INR payouts (₹1500, ₹3000, ₹4500).</p>
                                                </div>
                                                <div className="flex items-start gap-2 text-[11px] text-violet-900/70 leading-relaxed font-medium">
                                                    <div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 shrink-0"></div>
                                                    <p>Discounted leads do not earn direct commission but <span className="font-bold text-violet-700">do contribute</span> to your total USD volume for slabs.</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {activeTab === "resumes" && (
                                <Card className="border border-slate-200 overflow-hidden rounded-2xl shadow-sm bg-white animate-in fade-in duration-300">
                                    <CardHeader className="bg-white border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 font-black border-none">{completedResumes.length}</Badge> Valid Completions
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 px-2 font-bold" onClick={() => setResumePage(p => Math.max(1, p - 1))} disabled={resumePage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                            <span className="text-xs font-bold text-slate-400">{resumePage}/{totalResumePages}</span>
                                            <Button variant="ghost" size="sm" className="h-8 px-2 font-bold" onClick={() => setResumePage(p => Math.min(totalResumePages, p + 1))} disabled={resumePage === totalResumePages}><ChevronRight className="h-4 w-4" /></Button>
                                        </div>
                                    </CardHeader>
                                    <Table>
                                        <TableHeader className="bg-slate-50/30">
                                            <TableRow>
                                                <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-slate-400">Lead ID</TableHead>
                                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                                                <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Completion Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedResumes.length === 0 ? (
                                                <TableRow><TableCell colSpan={3} className="text-center py-10 text-slate-400">No completions found.</TableCell></TableRow>
                                            ) : (
                                                paginatedResumes.map((rcrd) => (
                                                    <TableRow key={rcrd.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                                        <TableCell className="pl-6 py-4 font-mono font-bold text-slate-700 text-xs tracking-wider uppercase">{rcrd.lead_id}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge className="bg-emerald-50 text-emerald-600 border-0 font-bold hover:bg-emerald-100">COMPLETED</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6 text-slate-500 text-xs font-semibold">{new Date(rcrd.updated_at).toLocaleDateString()}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            )}

                            {activeTab === "forage" && (
                                <Card className="border border-emerald-100 overflow-hidden rounded-2xl shadow-sm bg-white animate-in fade-in duration-300">
                                    <CardHeader className="bg-white border-b border-emerald-50 py-4 px-6 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 font-black border-none">{forageSales.length}</Badge> Paid Forage Deals
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 px-2 font-bold" onClick={() => setForagePage(p => Math.max(1, p - 1))} disabled={foragePage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                            <span className="text-xs font-bold text-slate-400">{foragePage}/{totalForagePages}</span>
                                            <Button variant="ghost" size="sm" className="h-8 px-2 font-bold" onClick={() => setForagePage(p => Math.min(totalForagePages, p + 1))} disabled={foragePage === totalForagePages}><ChevronRight className="h-4 w-4" /></Button>
                                        </div>
                                    </CardHeader>
                                    <Table>
                                        <TableHeader className="bg-emerald-50/30">
                                            <TableRow>
                                                <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-emerald-600">Lead Details</TableHead>
                                                <TableHead className="text-xs font-bold uppercase tracking-wider text-emerald-600 text-center">Cert Level</TableHead>
                                                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-emerald-600">Sale Value</TableHead>
                                                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-emerald-600">My Incentive</TableHead>
                                                <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-emerald-600">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedForage.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">No forage sales found.</TableCell></TableRow>
                                            ) : (
                                                paginatedForage.map((sale) => (
                                                    <TableRow key={sale.id} className="hover:bg-emerald-50/50 transition-colors border-b border-emerald-50">
                                                        <TableCell className="pl-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-700 text-xs">{sale.lead_name}</span>
                                                                <span className="font-mono text-[10px] text-slate-400 uppercase">{sale.lead_id}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className="font-bold text-emerald-600 border-emerald-200 bg-white">
                                                                {sale.certs} Certificate{sale.certs > 1 ? 's' : ''}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-slate-500 text-xs">${sale.sold_value_usd.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className={`font-black text-sm ${sale.earned_incentive_usd > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                                                    ${sale.earned_incentive_usd.toLocaleString()}
                                                                </span>
                                                                {sale.earned_incentive_usd > 3 && (
                                                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter flex items-center gap-0.5">
                                                                        <TrendingUp className="h-2 w-2" /> Upsell Bonus
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            {sale.is_discounted ? (
                                                                <div className="flex flex-col items-end">
                                                                    <Badge className="bg-amber-50 text-amber-600 border-0 font-bold mb-0.5 text-[9px]">DISCOUNTED</Badge>
                                                                    <span className="text-[8px] font-bold text-amber-500 uppercase tracking-tighter">Below Base ${sale.base_price_usd}</span>
                                                                </div>
                                                            ) : (
                                                                <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold text-[9px]">QUALIFIED</Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 italic text-[10px] text-slate-400 flex items-center gap-2">
                                        <Info className="h-3 w-3" /> Note: Sales below the base tier target ($30 for 1 cert, $50 for 2, etc.) generate $0 direct incentive but still count towards your team volume pool.
                                    </div>
                                </Card>
                            )}

                            {activeTab === "completion" && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-in fade-in duration-300">
                                    <ResumeCompletionForm user={user} viewerMode={viewerMode} monthOffset={monthOffset} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
