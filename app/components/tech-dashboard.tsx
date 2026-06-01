"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Calendar, ChevronRight, ChevronLeft, DollarSign, Code2, User, LayoutDashboard, Database, EyeOff, Eye, Target, ExternalLink } from "lucide-react"

interface TechDashboardProps {
    user: any;
    onLogout: () => void;
    viewerMode?: boolean;
}

export function TechDashboard({ user, onLogout, viewerMode = false }: TechDashboardProps) {
    const [loading, setLoading] = useState(true)
    const [isEligible, setIsEligible] = useState<boolean>(true)
    const isFirstLoad = useRef(true);

    const [isScrolled, setIsScrolled] = useState(false)
    const [monthOffset, setMonthOffset] = useState<number>(0)

    // Global metrics fetched natively from calculation engine
    const [totalPortfolios, setTotalPortfolios] = useState<number>(0)
    const [totalGithubs, setTotalGithubs] = useState<number>(0)
    const [portfolioPoolUsd, setPortfolioPoolUsd] = useState<number>(0)
    const [githubPoolUsd, setGithubPoolUsd] = useState<number>(0)
    const [totalPoolUsd, setTotalPoolUsd] = useState<number>(0)
    const [portfolioRateUSD, setPortfolioRateUSD] = useState<number>(2)
    const [githubRateUSD, setGithubRateUSD] = useState<number>(20)

    // Personal Output Engine logic
    const [individualShareInr, setIndividualShareInr] = useState<number>(0)
    const [individualShareUsd, setIndividualShareUsd] = useState<number>(0)
    const [personalPortfolioInr, setPersonalPortfolioInr] = useState<number>(0)
    const [personalGithubInr, setPersonalGithubInr] = useState<number>(0)
    const [personalSalesInr, setPersonalSalesInr] = useState<number>(0)
    const [personalSalesUsd, setPersonalSalesUsd] = useState<number>(0)
    const [totalCombinedInr, setTotalCombinedInr] = useState<number>(0)
    const [globalGitSalesCount, setGlobalGitSalesCount] = useState<number>(0)
    const [globalGitSalesYieldUsd, setGlobalGitSalesYieldUsd] = useState<number>(0)
    const [gitRepoBaseSale, setGitRepoBaseSale] = useState<number>(140)
    const [gitRepoBaseInc, setGitRepoBaseInc] = useState<number>(7)
    const [gitRepoStep, setGitRepoStep] = useState<number>(10)
    const [gitRepoStepInc, setGitRepoStepInc] = useState<number>(2)

    // Month-specific table data
    const [activeTab, setActiveTab] = useState<"portfolios" | "github" | "sales">("portfolios")
    const [monthPortfolios, setMonthPortfolios] = useState<any[]>([])
    const [monthGithubs, setMonthGithubs] = useState<any[]>([])
    const [monthSalesLogs, setMonthSalesLogs] = useState<any[]>([])
    const [page, setPage] = useState<number>(1)
    const itemsPerPage = 8
    const [isHidden, setIsHidden] = useState<boolean>(true)

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
            const monthStr = getMonthName();

            // Re-fetch global compute logic directly since everyone shares it equally
            const res = await fetch(`/api/calculate-tech-incentives?period=${encodeURIComponent(monthStr)}`);
            if (res.ok) {
                const data = await res.json();
                setTotalPortfolios(data.totalPortfolios || 0);
                setTotalGithubs(data.totalGithubs || 0);
                setPortfolioPoolUsd(data.portfolioPoolUSD || 0);
                setGithubPoolUsd(data.githubPoolUSD || 0);
                setTotalPoolUsd(data.totalPoolUSD || 0);
                setPortfolioRateUSD(data.portfolioRateUSD || 2);
                setGithubRateUSD(data.githubRateUSD || 20);
                setGlobalGitSalesCount(data.totalGlobalGitSalesCount || 0);
                setGlobalGitSalesYieldUsd(data.totalGlobalGitSalesYieldUsd || 0);
                setGitRepoBaseSale(data.gitRepoBaseSale || 140);
                setGitRepoBaseInc(data.gitRepoBaseInc || 7);
                setGitRepoStep(data.gitRepoStep || 10);
                setGitRepoStepInc(data.gitRepoStepInc || 2);

                const email = user.email.toLowerCase();
                if (data.personalSalesInsights && data.personalSalesInsights[email]) {
                    const insights = data.personalSalesInsights[email];
                    setIndividualShareUsd(insights.poolIncentiveUsd || 0);
                    setIndividualShareInr(insights.poolIncentiveInr || 0);
                    setPersonalPortfolioInr(insights.portfolioPoolInr || 0);
                    setPersonalGithubInr(insights.githubPoolInr || 0);
                    setPersonalSalesUsd(insights.salesIncentiveUsd || 0);
                    setPersonalSalesInr(insights.salesIncentiveInr || 0);
                    setTotalCombinedInr(insights.totalCombinedInr || 0);
                    setMonthSalesLogs(insights.salesLog || []);
                } else {
                    setIndividualShareUsd(data.individualShareUSD || 0);
                    setIndividualShareInr(data.individualShareINR || 0);

                    // Approximate splits if not in map but part of global (rare)
                    const portShare = data.portfolioPoolUSD * (data.conversionRate || 85) / Math.max(1, data.techTeamSize || 1);
                    const gitShare = data.githubPoolUSD * (data.conversionRate || 85) / Math.max(1, data.techTeamSize || 1);
                    setPersonalPortfolioInr(portShare || 0);
                    setPersonalGithubInr(gitShare || 0);

                    setPersonalSalesUsd(0);
                    setPersonalSalesInr(0);
                    setTotalCombinedInr(data.individualShareINR || 0);
                    setMonthSalesLogs([]);
                }

                setMonthPortfolios(data.portfoliosData || []);
                setMonthGithubs(data.githubData || []);

                // Eligibility - If the user's email was mapped in the response, they are placed
                // but since the global calculation handles it, we assume eligible if they can load this
                setIsEligible(true);
            }
        } catch (e) {
            console.error("Failed to fetch tech portfolio data:", e);
        }
        setLoading(false);
        isFirstLoad.current = false;
    }, [user.email, monthOffset]);

    useEffect(() => {
        isFirstLoad.current = true;
        setPage(1);
        fetchData();
    }, [fetchData])

    const activeList = activeTab === "portfolios" ? monthPortfolios : (activeTab === "github" ? monthGithubs : monthSalesLogs);
    const totalPages = Math.ceil(activeList.length / itemsPerPage) || 1;
    const paginatedItems = activeList.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const renderMonthControls = () => (
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-100 transition-all font-semibold" onClick={() => setMonthOffset((prev) => prev - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-md whitespace-nowrap font-bold" onClick={() => setMonthOffset(0)}>
                This Month
            </Button>
            <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-100 transition-all font-semibold" onClick={() => setMonthOffset((prev) => prev + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 relative">

                {/* Header */}
                <div className={`flex justify-between items-center bg-white rounded-xl shadow-md border border-slate-200 bg-gradient-to-r from-white to-slate-50/50 sticky top-2 z-50 transition-all duration-500 overflow-hidden backdrop-blur-lg ${isScrolled ? 'p-3 px-6 bg-white/95 shadow-lg' : 'p-6 items-start'}`}>
                    <div className="flex items-center gap-4 transition-all duration-500">
                        <div className="flex flex-col justify-center">
                            <p className={`text-xs text-indigo-500 font-black uppercase tracking-widest shrink-0 transition-all duration-500 ease-in-out ${isScrolled ? 'h-0 opacity-0 m-0' : 'mb-1.5 h-4 opacity-100'}`}>
                                Technical Portfolio Yields
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
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* Summary View */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-0 shadow-sm rounded-2xl ring-1 ring-slate-200/50 p-6 bg-white overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Database className="h-4 w-4 text-emerald-500" /> {getMonthName()} Global Tech Yield
                                    </h3>
                                    <div className="md:hidden">{renderMonthControls()}</div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-4 transition-all hover:bg-white hover:shadow-md group">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Code2 className="h-3 w-3 text-slate-400" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Completed Portfolios</p>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-slate-800">{totalPortfolios}</span>
                                            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 border-0 font-bold">In {getMonthName()}</Badge>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1 opacity-70">
                                            Generated ${portfolioPoolUsd.toLocaleString()} Pool
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 mb-4 transition-all hover:bg-indigo-50 hover:shadow-md">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className="h-3 w-3 text-indigo-500" />
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Total Github Projects</p>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-indigo-700 transition-all">
                                                {totalGithubs}
                                            </span>
                                            <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700 border-0 font-bold">In {getMonthName()}</Badge>
                                        </div>
                                        <p className="text-[10px] font-bold text-indigo-600 mt-2 flex items-center gap-1 opacity-70">
                                            Generated ${githubPoolUsd.toLocaleString()} Pool
                                        </p>
                                    </div>
                                    <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 transition-all hover:bg-emerald-50 hover:shadow-md">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="h-3 w-3 text-emerald-500" />
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Your Git Repo Sales</p>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-emerald-700 transition-all">
                                                {monthSalesLogs.length}
                                            </span>
                                            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 border-0 font-bold">In {getMonthName()}</Badge>
                                        </div>
                                        <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1 opacity-70">
                                            Yielded ${personalSalesUsd.toLocaleString()} in incentives
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-indigo-500" />
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Combined Master Pool:</h4>
                                        <span className="text-lg font-black text-slate-800">${totalPoolUsd.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 italic">Portfolio (${portfolioPoolUsd}) + Github (${githubPoolUsd}) distributions</p>
                                </div>
                            </Card>

                            {/* Combined Payout Card */}
                            <Card className="bg-slate-900 border-0 shadow-xl rounded-2xl p-6 flex flex-col relative overflow-hidden ring-1 ring-white/10 group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500"></div>
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>

                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white/10 p-2 rounded-lg border border-white/5">
                                            <Badge className="bg-emerald-500 text-white border-0 font-black tracking-widest shadow-lg">YOUR CUT</Badge>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsHidden(!isHidden)} className="text-emerald-400 hover:text-white hover:bg-white/10 rounded-xl transition-all shadow-sm">
                                        {isHidden ? <EyeOff strokeWidth={2.5} className="h-5 w-5" /> : <Eye strokeWidth={2.5} className="h-5 w-5" />}
                                    </Button>
                                </div>

                                <div className={`flex flex-col mb-8 transition-all duration-700 ${isHidden ? 'blur-md opacity-60 scale-95 select-none pointer-events-none' : 'blur-0 opacity-100 scale-100'}`}>
                                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Total Payout Yield</p>
                                    <div className="text-5xl font-black tracking-tighter transition-all duration-500 text-emerald-300 drop-shadow-md">
                                        ₹{totalCombinedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 mt-6">
                                        <div className="bg-white/5 px-3 py-2 rounded-xl flex items-center justify-between border border-white/5 group-hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Portfolio Share</p>
                                            </div>
                                            <p className="text-[12px] text-indigo-300 font-black">₹{personalPortfolioInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="bg-white/5 px-3 py-2 rounded-xl flex items-center justify-between border border-white/5 group-hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Github Share</p>
                                            </div>
                                            <p className="text-[12px] text-blue-300 font-black">₹{personalGithubInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="bg-white/5 px-3 py-2 rounded-xl flex items-center justify-between border border-white/5 group-hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Git Sales Commission</p>
                                            </div>
                                            <p className="text-[12px] text-amber-300 font-black">₹{personalSalesInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    {/* Transparent Financial Engine Calculation Breakdown */}
                                    <div className="mt-5 pt-5 border-t border-white/10 opacity-70 hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5 hover:text-emerald-400">
                                            <Database className="h-3 w-3" /> Financial Engine Math
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] text-slate-300/70 font-medium font-mono">
                                                <span>Global Master Pool ({totalPortfolios} Ports × ${portfolioRateUSD}) + ({totalGithubs} Git × ${githubRateUSD})</span>
                                                <span>${totalPoolUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-300/70 font-medium font-mono">
                                                <span>Your Equal Pool Split (${totalPoolUsd.toLocaleString()} ÷ Active Teammates) × Base Rate</span>
                                                <span>₹{individualShareInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-300/70 font-medium font-mono">
                                                <span>Personal Git Repo Yield (${personalSalesUsd.toLocaleString()} × Base Rate)</span>
                                                <span>₹{personalSalesInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-emerald-300/90 mt-2 pt-2 border-t border-white/10 font-mono">
                                                <span>Total System Payout</span>
                                                <span>₹{totalCombinedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="flex bg-slate-200/50 p-1 w-fit rounded-xl border border-slate-200 mt-8 mb-4">
                            <button className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "portfolios" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => { setActiveTab("portfolios"); setPage(1); }}>Portfolio Yields</button>
                            <button className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "github" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => { setActiveTab("github"); setPage(1); }}>Github Completions</button>
                            <button className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "sales" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => { setActiveTab("sales"); setPage(1); }}>Git Repo Sales</button>
                        </div>

                        {/* Month Dynamic Table */}
                        <Card className="border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
                            <CardHeader className="bg-white border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <Database className="h-4 w-4 text-indigo-500" /> {getMonthName()} {activeTab === "portfolios" ? "Distributed Portfolios" : (activeTab === "github" ? "Completed Githubs" : "Independent Git Sales")}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="h-8 px-2 font-bold" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                    <span className="text-xs font-bold text-slate-400">{page}/{totalPages}</span>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 font-bold" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                            </CardHeader>
                            <Table>
                                <TableHeader className="bg-slate-50/30">
                                    {activeTab === "sales" ? (
                                        <TableRow>
                                            <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-slate-400">Lead ID</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Transacted</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Payout Yield</TableHead>
                                            <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Closed At</TableHead>
                                        </TableRow>
                                    ) : (
                                        <TableRow>
                                            <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-slate-400">Lead ID</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Updated By</TableHead>
                                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-400">Created At</TableHead>
                                            <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Updated At</TableHead>
                                        </TableRow>
                                    )}
                                </TableHeader>
                                <TableBody>
                                    {paginatedItems.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">No {activeTab} operations were completed this month.</TableCell></TableRow>
                                    ) : activeTab === "sales" ? (
                                        paginatedItems.map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                                <TableCell className="pl-6 py-4 font-mono font-bold text-slate-700 text-xs tracking-wider uppercase">
                                                    {viewerMode ? (
                                                        <a
                                                            href={`https://applywizz-crm-tool.vercel.app/leads/${row.lead_id?.trim()}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                                                        >
                                                            {row.lead_id}
                                                            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                                        </a>
                                                    ) : (
                                                        row.lead_id
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-slate-100 text-slate-700 border border-slate-200 font-bold">${row.sale_value}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-amber-100 text-amber-700 border-0 font-black">+ ${row.incentive_usd}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6 text-xs text-slate-500 font-semibold">{new Date(row.closed_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        paginatedItems.map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                                <TableCell className="pl-6 py-4 font-mono font-bold text-slate-700 text-xs tracking-wider uppercase">
                                                    {viewerMode ? (
                                                        <a
                                                            href={`https://applywizz-crm-tool.vercel.app/leads/${row.lead_id?.trim()}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                                                        >
                                                            {row.lead_id}
                                                            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                                        </a>
                                                    ) : (
                                                        row.lead_id
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-0 font-bold hover:bg-emerald-100 uppercase">{row.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-slate-500">{row.updated_by || <span className="italic opacity-50">Unassigned</span>}</TableCell>
                                                <TableCell className="text-right text-xs text-slate-500 font-semibold">{new Date(row.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right pr-6 text-xs text-slate-500 font-semibold">{new Date(row.updated_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* Rules & Information Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                            {/* Portfolio Rules */}
                            <Card className="border-0 shadow-sm bg-indigo-50/50 rounded-2xl p-5 ring-1 ring-indigo-100 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                                        <Code2 className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Portfolio Equitable Split Rule</h4>
                                </div>
                                <div className="space-y-3 flex-grow">
                                    <div className="flex items-start gap-2 text-[11px] text-indigo-900/70 leading-relaxed font-medium">
                                        <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                                        <p>A static matrix value (${portfolioRateUSD}) is allocated to the Master Pool for every Portfolio processed completely to 'success'.</p>
                                    </div>
                                    <div className="flex items-start gap-2 text-[11px] text-indigo-900/70 leading-relaxed font-medium">
                                        <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                                        <p>The Master Pool is mathematically <span className="font-black text-indigo-700">distributed evenly</span> among all team members, regardless of who primarily handled the lead.</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Github Rules */}
                            <Card className="border-0 shadow-sm bg-emerald-50/50 rounded-2xl p-5 ring-1 ring-emerald-100 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                                        <Database className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Github Equitable Split Rule</h4>
                                </div>
                                <div className="space-y-3 flex-grow">
                                    <div className="flex items-start gap-2 text-[11px] text-emerald-900/70 leading-relaxed font-medium">
                                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                                        <p>A secondary matrix target (${githubRateUSD}) is placed directly into the combined Master Pool upon pushing any Github lead to 'success'.</p>
                                    </div>
                                    <div className="flex items-start gap-2 text-[11px] text-emerald-900/70 leading-relaxed font-medium">
                                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                                        <p>Calculations trigger uniquely based on the github completion timestamp mapped to the exact calendar month of termination.</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Git Repo Sales Slab Logic */}
                            <Card className="border-0 shadow-sm bg-amber-50/50 rounded-2xl p-5 ring-1 ring-amber-100 flex flex-col md:col-span-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">Git Repo Sales Individual Payout Slab Logic</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em]">Base Threshold</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-amber-700">${gitRepoBaseSale}</span>
                                            <span className="text-[10px] font-bold text-amber-600">Single Sale</span>
                                        </div>
                                        <p className="text-[11px] text-amber-900/60 font-medium leading-relaxed">Sales meeting this base threshold trigger an initial incentive of <span className="font-bold text-amber-700">${gitRepoBaseInc}</span>.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em]">Scale Multiplier</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-amber-700">+${gitRepoStepInc}</span>
                                            <span className="text-[10px] font-bold text-amber-600">Per ${gitRepoStep}</span>
                                        </div>
                                        <p className="text-[11px] text-amber-900/60 font-medium leading-relaxed">For every ${gitRepoStep} transacted above the base, an additional ${gitRepoStepInc} is credited to the seller.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em]">Example Yield</p>
                                        <div className="bg-amber-100/50 rounded-xl p-3 border border-amber-200/50">
                                            <p className="text-[11px] text-amber-900/70 font-bold mb-1">A ${gitRepoBaseSale + (gitRepoStep * 2)} Sale:</p>
                                            <p className="text-sm font-black text-amber-800">${gitRepoBaseInc} (Base) + ${gitRepoStepInc * 2} (Scale) = <span className="text-emerald-600">${gitRepoBaseInc + (gitRepoStepInc * 2)} Total Yield</span></p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-amber-200/30">
                                    <p className="text-[10px] font-bold text-amber-900/40 uppercase tracking-widest text-center italic">Calculated per-transaction based on the strictly considered github_info JSON columns.</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
