"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TrendingUp, Users, DollarSign, Calendar, ChevronLeft, ChevronRight, User, Eye, EyeOff, FileText, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react"
import { AssessmentAnalyticsPage } from "./assessment-analytics-page"

interface MarketingDashboardProps {
    user: any;
    onLogout: () => void;
    viewerMode?: boolean;
}

export function MarketingDashboard({ user, onLogout, viewerMode }: MarketingDashboardProps) {
    const [loading, setLoading] = useState(true)
    const [incentiveData, setIncentiveData] = useState<any>(null)
    const [isEligible, setIsEligible] = useState<boolean>(true)
    const isFirstLoad = useRef(true);

    // Scrolled header state
    const [isScrolled, setIsScrolled] = useState(false)
    const [activeTab, setActiveTab] = useState<"incentives" | "invites">("incentives")

    // Month toggles
    const [monthOffset, setMonthOffset] = useState<number>(0)

    const [jobBoardSales, setJobBoardSales] = useState<any[]>([])
    const [skillPassportSales, setSkillPassportSales] = useState<any[]>([])
    const [influencerPaidSales, setInfluencerPaidSales] = useState<any[]>([])
    const [influencerUnpaidSales, setInfluencerUnpaidSales] = useState<any[]>([])

    // Rates state
    const [rates, setRates] = useState<any>({
        conversionRate: 85,
        jbTier1: 30,
        jbTier2: 35,
        jbTier3: 40,
        spRate: 30
    })

    const [jbPage, setJbPage] = useState<number>(1)
    const [spPage, setSpPage] = useState<number>(1)
    const [infPage, setInfPage] = useState<number>(1)
    const itemsPerPage = 10

    // Payout viewing toggle
    const [showIncentives, setShowIncentives] = useState(false)

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
            await fetch(`/api/calculate-marketing-incentives?period=${encodeURIComponent(periodStr)}`, { cache: 'no-store' });

            const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            const res = await fetch(`/api/marketing-data?email=${encodeURIComponent(user.email)}&month=${monthStr}`);
            const data = await res.json();
            if (data.success) {
                setIsEligible(data.eligible);
                setJobBoardSales(data.jobBoardSales || []);
                setSkillPassportSales(data.skillPassportSales || []);
                setInfluencerPaidSales(data.influencerPaidSales || []);
                setInfluencerUnpaidSales(data.influencerUnpaidSales || []);
                setIncentiveData(data.incentiveData);
                if (data.rates) setRates(data.rates);
            }
        } catch (e) {
            console.error("Failed to fetch marketing data:", e);
        }
        setLoading(false);
        isFirstLoad.current = false;
    }, [user.email, monthOffset]);

    useEffect(() => {
        isFirstLoad.current = true;
        fetchData();
        setJbPage(1);
        setSpPage(1);
        setInfPage(1);
    }, [fetchData])


    const renderMonthControls = (isCompact: boolean) => (
        <div className={`flex items-center transition-all duration-500 ${isCompact ? 'scale-95 origin-right gap-1.5' : 'scale-100 justify-between w-full gap-4'}`}>
            {!isCompact && (
                <h2 className="text-md font-bold text-slate-800 w-48 tracking-tight">
                    Analyzing: <span className="text-indigo-600">{getMonthName()}</span>
                </h2>
            )}
            <div className="flex gap-1.5 md:gap-2">
                <Button variant="outline" size={isCompact ? "sm" : "default"} className="border-slate-300 hover:bg-slate-100 transition-all font-semibold" onClick={() => setMonthOffset((prev) => prev - 1)}>
                    <ChevronLeft className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4 mr-1'}`} /> {!isCompact && "Previous Month"}
                </Button>
                <Button variant="default" size={isCompact ? "sm" : "default"} className="bg-indigo-600 hover:bg-indigo-700 shadow-md whitespace-nowrap font-bold" onClick={() => setMonthOffset(0)}>
                    {isCompact ? getMonthName() : "This Month"}
                </Button>
                <Button variant="outline" size={isCompact ? "sm" : "default"} className="border-slate-300 hover:bg-slate-100 transition-all font-semibold" onClick={() => setMonthOffset((prev) => prev + 1)}>
                    {!isCompact && "Next Month"} <ChevronRight className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4 ml-1'}`} />
                </Button>
            </div>
        </div>
    );

    const totalJbPages = Math.ceil(jobBoardSales.length / itemsPerPage) || 1;
    const paginatedJbSales = jobBoardSales.slice((jbPage - 1) * itemsPerPage, jbPage * itemsPerPage);

    const totalSpPages = Math.ceil(skillPassportSales.length / itemsPerPage) || 1;
    const paginatedSpSales = skillPassportSales.slice((spPage - 1) * itemsPerPage, spPage * itemsPerPage);

    const allInfluencerSales = [...influencerPaidSales, ...influencerUnpaidSales];
    const totalInfPages = Math.ceil(allInfluencerSales.length / itemsPerPage) || 1;
    const paginatedInfSales = allInfluencerSales.slice((infPage - 1) * itemsPerPage, infPage * itemsPerPage);

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 relative">

                {/* Animated Sticky Native Header */}
                <div className={`flex justify-between items-center bg-white rounded-xl shadow-md border border-slate-200 bg-gradient-to-r from-white to-slate-50/50 sticky top-2 z-50 transition-all duration-500 overflow-hidden backdrop-blur-lg ${isScrolled ? 'p-3 px-6 bg-white/95 shadow-lg' : 'p-6 items-start'}`}>
                    <div className="flex items-center gap-4 transition-all duration-500">
                        <div className="flex flex-col justify-center">
                            <p className={`text-xs text-indigo-500 font-black uppercase tracking-widest shrink-0 transition-all duration-500 ease-in-out ${isScrolled ? 'h-0 opacity-0 m-0' : 'mb-1.5 h-4 opacity-100'}`}>
                                {viewerMode ? "Auditing Mode Active" : "Marketing Incentive System"}
                            </p>
                            <div className="flex items-center gap-3">
                                <h1 className={`font-extrabold text-slate-900 tracking-tight transition-all duration-500 ease-in-out ${isScrolled ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl mb-3'}`}>
                                    {viewerMode ? (isScrolled ? "Viewing:" : "Viewing Layout: ") : (isScrolled ? "Welcome, " : "Welcome back, ")}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 drop-shadow-sm">
                                        {user.name || "Colleague"}
                                    </span>
                                </h1>
                                <Badge className={`bg-gradient-to-r transition-all duration-500 from-emerald-500 to-teal-500 text-white border-0 shadow-sm font-semibold tracking-wide ${isScrolled ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
                                    {user.role}
                                </Badge>
                            </div>

                            <div className={`flex items-center gap-3 transition-all duration-500 ${isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>
                                {user.isactive && <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex gap-1 items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Authorized Network</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row items-center gap-3 justify-end">
                        <div className={`transition-all duration-500 ease-in-out flex items-center justify-end ${isScrolled ? 'max-w-[400px] opacity-100 mr-2 scale-100 visible' : 'max-w-0 opacity-0 mr-0 scale-95 invisible'}`}>
                            {renderMonthControls(true)}
                        </div>

                        {!viewerMode && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center p-0 hover:bg-slate-200 transition-colors shadow-sm border border-slate-200">
                                        <User className="h-6 w-6 text-indigo-700" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 border-slate-200">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-semibold leading-none text-slate-800">{user.name}</p>
                                            <p className="text-xs leading-none text-slate-500">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onLogout} className="text-red-600 font-medium cursor-pointer flex items-center gap-2">
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Tabs Selector for Marketing Associate */}
                <div className="flex border-b border-slate-200 mb-4 bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
                    <button
                        onClick={() => setActiveTab("incentives")}
                        className={`py-2 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-colors mr-2 flex items-center gap-1.5 ${activeTab === "incentives" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
                    >
                        <TrendingUp className="h-3.5 w-3.5" />
                        Incentives Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("invites")}
                        className={`py-2 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "invites" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
                    >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Approved Invites
                    </button>
                </div>

               {activeTab === "incentives" ? (
                    <>
                        
                        {/* Global Controls - Month Filter (Animating out!) */}
                        <div className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden w-full ${isScrolled ? 'max-h-0 opacity-0 transform -translate-y-8 mb-0 invisible' : 'max-h-[300px] opacity-100 transform translate-y-0 mb-6 visible'}`}>
                            <Card className="shadow-md border-slate-200 overflow-hidden bg-white">
                                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg text-slate-800 tracking-tight">
                                        <Calendar className="h-5 w-5 text-indigo-600" />
                                        Tracking Period Scope
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    {renderMonthControls(false)}
                                </CardContent>
                            </Card>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : !isEligible ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-200 mt-8">
                                <Calendar className="h-16 w-16 text-slate-300 mb-4" />
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center">Not Eligible for {getMonthName()}</h2>
                                <p className="text-slate-500 mt-2 text-center max-w-md">Your joining date is after this period. You do not have access to verified sales leads or incentive distributions for months prior to your employment.</p>
                            </div>
                        ) : (
                            <>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                            <TrendingUp className="h-6 w-6 text-indigo-600" />
                            Incentive Achievements ({getMonthName()})
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50">
                                    <CardTitle className="text-sm font-medium text-slate-600">Global Sales Volume</CardTitle>
                                    <Users className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent className="pt-4 space-y-2">

                                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                        <span className="text-slate-600 font-medium">Influencer Referrals:</span>
                                        <span className="font-bold text-pink-600">{(incentiveData?.influencer_paid_count || 0) + (incentiveData?.influencer_unpaid_count || 0)} Leads</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                        <span className="text-slate-600 font-medium">Job Board:</span>
                                        <span className="font-bold text-emerald-600">{incentiveData?.job_board_fresh_sales || 0} Leads</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">Skill Passport:</span>
                                        <span className="font-bold text-orange-500">{incentiveData?.skill_passport_fresh_sales || 0} Sales</span>
                                    </div>
                                    <p className="text-xs text-slate-500 pt-2 font-medium">Total verified successful leads generated by the whole team globally.</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider uppercase z-10">Locked In</div>
                                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50">
                                    <CardTitle className="text-sm font-medium text-slate-600">Your Share Breakdown (INR)</CardTitle>
                                    <button onClick={() => setShowIncentives(!showIncentives)} className="text-emerald-500 hover:text-emerald-600 transition-colors">
                                        {showIncentives ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-2">

                                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                        <span className="text-slate-600 font-medium">Influencer Referrals:</span>
                                        <span className="font-bold text-pink-600">{showIncentives ? `₹${(incentiveData?.influencer_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '****'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                        <span className="text-slate-600 font-medium">Job Board:</span>
                                        <span className="font-bold text-emerald-600">{showIncentives ? `₹${(incentiveData?.job_board_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '****'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                        <span className="text-slate-600 font-medium">Skill Passport:</span>
                                        <span className="font-bold text-orange-500">{showIncentives ? `₹${(incentiveData?.skill_passport_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '****'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-slate-800 font-black">Total Combine:</span>
                                        <span className="text-xl font-black text-indigo-700 tracking-tight">
                                            {showIncentives ? `₹${(
                                                (incentiveData?.applywizz_incentive_inr || 0) +
                                                (incentiveData?.job_board_incentive_inr || 0) +
                                                (incentiveData?.skill_passport_incentive_inr || 0) +
                                                (incentiveData?.influencer_incentive_inr || 0)
                                            ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '****'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>



                        {/* Influencer Sales Table */}
                        <Card className="shadow-sm border-slate-200 mt-8">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">Verified Influencer Sales ({getMonthName()})</CardTitle>
                                <div className="text-sm text-slate-500 pt-1">Total: {allInfluencerSales.length} Leads ({influencerPaidSales.length} Paid, {influencerUnpaidSales.length} Unpaid)</div>
                            </CardHeader>
                            <CardContent>
                                {allInfluencerSales.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">No influencer sales recorded for this month.</div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="overflow-x-auto rounded-md border border-slate-200">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                        <TableHead className="font-semibold">Lead Track ID</TableHead>
                                                        <TableHead className="font-semibold">Lead Name</TableHead>
                                                        <TableHead className="font-semibold">Closing Date</TableHead>
                                                        <TableHead className="font-semibold">Influencer Status</TableHead>
                                                        <TableHead className="font-semibold text-right">Incentive Trigger</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginatedInfSales.map((sale: any, i: number) => (
                                                        <TableRow key={sale.id || `inf-${i}`} className="hover:bg-pink-50/50 transition-colors">
                                                            <TableCell className="font-medium text-slate-600">{sale.lead_id}</TableCell>
                                                            <TableCell className="text-slate-800">{sale.lead_name || sale.email}</TableCell>
                                                            <TableCell className="text-slate-600">{new Date(sale.closed_at).toLocaleDateString()}</TableCell>
                                                            <TableCell>
                                                                <Badge className={
                                                                    (sale.influencer_paid_status || '').toLowerCase() === 'paid'
                                                                        ? 'bg-emerald-100 text-emerald-800 border-transparent'
                                                                        : 'bg-amber-100 text-amber-800 border-transparent'
                                                                }>
                                                                    {(sale.influencer_paid_status || 'Unknown').charAt(0).toUpperCase() + (sale.influencer_paid_status || 'Unknown').slice(1)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Badge className="bg-pink-100 text-pink-800 border-none font-bold">
                                                                    +${(sale.influencer_paid_status || '').toLowerCase() === 'paid' ? '1.50' : '3.00'} to Pool
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {totalInfPages > 1 && (
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-slate-500">
                                                    Showing {(infPage - 1) * itemsPerPage + 1} to {Math.min(infPage * itemsPerPage, allInfluencerSales.length)} of {allInfluencerSales.length} entries
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => setInfPage(p => Math.max(1, p - 1))} disabled={infPage === 1}>
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <div className="text-sm font-medium px-2 text-slate-700">
                                                        Page {infPage} of {totalInfPages}
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => setInfPage(p => Math.min(totalInfPages, p + 1))} disabled={infPage === totalInfPages}>
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200 mt-8">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">Verified Job Board Sales ({getMonthName()})</CardTitle>
                                <div className="text-sm text-slate-500 pt-1">Total: {jobBoardSales.length} Transactions</div>
                            </CardHeader>
                            <CardContent>
                                {jobBoardSales.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">No Job Board sales accurately recorded for this month.</div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="overflow-x-auto rounded-md border border-slate-200">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                        <TableHead className="font-semibold">JB Auth ID</TableHead>
                                                        <TableHead className="font-semibold">Customer Email</TableHead>
                                                        <TableHead className="font-semibold">Transaction Date</TableHead>
                                                        <TableHead className="font-semibold">Plan</TableHead>
                                                        <TableHead className="font-semibold">Amount generated</TableHead>
                                                        <TableHead className="font-semibold text-right">Incentive Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginatedJbSales.map((sale: any, i: number) => (
                                                        <TableRow key={sale.jb_id || `jb-${i}`} className="hover:indigo-50/50 transition-colors">
                                                            <TableCell className="font-medium text-slate-600">{sale.jb_id}</TableCell>
                                                            <TableCell className="text-slate-800">{sale.email}</TableCell>
                                                            <TableCell className="text-slate-600">{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                                                            <TableCell>
                                                                <Badge className="bg-slate-100 text-slate-800 border-transparent">
                                                                    {sale.plan_id || "Unknown"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-slate-700">${sale.amount}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Incentive Valid</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalJbPages > 1 && (
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-slate-500">
                                                    Showing {(jbPage - 1) * itemsPerPage + 1} to {Math.min(jbPage * itemsPerPage, jobBoardSales.length)} of {jobBoardSales.length} entries
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => setJbPage(p => Math.max(1, p - 1))} disabled={jbPage === 1}>
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <div className="text-sm font-medium px-2 text-slate-700">
                                                        Page {jbPage} of {totalJbPages}
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => setJbPage(p => Math.min(totalJbPages, p + 1))} disabled={jbPage === totalJbPages}>
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200 mt-8">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">Verified Skill Passport Sales ({getMonthName()})</CardTitle>
                                <div className="text-sm text-slate-500 pt-1">Total: {skillPassportSales.length} Transactions</div>
                            </CardHeader>
                            <CardContent>
                                {skillPassportSales.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">No Skill Passport sales accurately recorded for this month.</div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="overflow-x-auto rounded-md border border-slate-200">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                        <TableHead className="font-semibold">Lead Reference</TableHead>
                                                        <TableHead className="font-semibold">Customer Name</TableHead>
                                                        <TableHead className="font-semibold">Transaction Date</TableHead>
                                                        <TableHead className="font-semibold">Amount</TableHead>
                                                        <TableHead className="font-semibold text-right">Incentive Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginatedSpSales.map((sale: any, i: number) => (
                                                        <TableRow key={sale.lead_ref || `sp-${i}`} className="hover:indigo-50/50 transition-colors">
                                                            <TableCell className="font-medium text-slate-600">{sale.lead_ref}</TableCell>
                                                            <TableCell className="text-slate-800">{sale.full_name}</TableCell>
                                                            <TableCell className="text-slate-600">{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                                                            <TableCell className="text-slate-700">{sale.currency === 'USD' ? '$' : sale.currency}{sale.amount}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Incentive Valid</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalSpPages > 1 && (
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-slate-500">
                                                    Showing {(spPage - 1) * itemsPerPage + 1} to {Math.min(spPage * itemsPerPage, skillPassportSales.length)} of {skillPassportSales.length} entries
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => setSpPage(p => Math.max(1, p - 1))} disabled={spPage === 1}>
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <div className="text-sm font-medium px-2 text-slate-700">
                                                        Page {spPage} of {totalSpPages}
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => setSpPage(p => Math.min(totalSpPages, p + 1))} disabled={spPage === totalSpPages}>
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>



                        {/* Rules Matrix */}
                        <Card className="mt-8 shadow-sm overflow-hidden border-slate-200">
                            <div className="h-1 w-full bg-slate-300"></div>
                            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800 tracking-tight">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                    Marketing & Incentive Operations Matrix
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <p className="text-slate-700 leading-relaxed font-medium">As a distinguished member of the Marketing team, your efforts synergize dynamically with company-wide sales generation. To incentivize driving high-quality inbound traffic, we strictly calculate incentives across three pivotal channels:</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div className="bg-pink-50 rounded-xl p-5 border border-pink-100 shadow-sm relative overflow-hidden">
                                            <div className="absolute left-0 top-0 w-1.5 h-full bg-pink-500"></div>
                                            <h3 className="font-bold text-pink-800 mb-2 flex items-center justify-between">
                                                <span>1. Influencer Referrals</span>
                                                <span className="text-pink-600 font-black">{showIncentives ? `₹${(incentiveData?.influencer_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '****'}</span>
                                            </h3>
                                            <p className="text-sm text-pink-700 italic">
                                                Sales attributed through influencer channels are split into two categories:
                                            </p>
                                            <div className="mt-2 space-y-1.5">
                                                <div className="bg-white p-2.5 rounded-md text-xs border border-pink-200 text-slate-600">
                                                    <strong className="text-emerald-700">Paid Influencer:</strong> Each verified sale from a <strong>paid</strong> influencer contributes <strong>$1.50 USD</strong> to the Global Marketing Pool.
                                                </div>
                                                <div className="bg-white p-2.5 rounded-md text-xs border border-pink-200 text-slate-600">
                                                    <strong className="text-amber-700">Unpaid Influencer:</strong> Each verified sale from an <strong>unpaid</strong> influencer contributes <strong>$3.00 USD</strong> to the Global Marketing Pool.
                                                </div>
                                            </div>
                                            <div className="mt-3 bg-white p-3 rounded-md text-xs border border-pink-200 text-slate-600 italic">
                                                <strong>Rule:</strong> The entire accumulated USD pool is converted to INR and split equally amongst all authorized Marketing team members active during that month.
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <Badge variant="outline" className="bg-white text-emerald-600">Paid: {incentiveData?.influencer_paid_count || 0}</Badge>
                                                <Badge variant="outline" className="bg-white text-amber-600">Unpaid: {incentiveData?.influencer_unpaid_count || 0}</Badge>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                                            <div className="absolute left-0 top-0 w-1.5 h-full bg-slate-400"></div>
                                            <h3 className="font-bold text-slate-700 mb-2 flex items-center justify-between">
                                                <span>2. The Job Board Targets</span>
                                                <span className="text-indigo-600 font-black">{showIncentives ? `₹${(incentiveData?.job_board_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '****'}</span>
                                            </h3>
                                            <p className="text-sm text-slate-500 italic">
                                                Job board sales structure an INR direct pool scaling against total global sales:
                                                (0-499: ₹{rates.jbTier1}, 500-999: ₹{rates.jbTier2}, 1000+: ₹{rates.jbTier3}
                                                {rates.customTiers?.length > 0 && rates.customTiers.sort((a: any, b: any) => parseInt(a.threshold) - parseInt(b.threshold)).map((t: any) => `, ${t.threshold}+: ₹${t.rate}`)}
                                                ). The team shares this pool evenly!
                                            </p>
                                            <div className="mt-3 flex gap-2">
                                                <Badge variant="outline" className="bg-white text-slate-600">Fresh Sales: {incentiveData?.job_board_fresh_sales || 0}</Badge>
                                                <Badge variant="outline" className="bg-white text-slate-600 text-xs">Total: ${incentiveData?.job_board_revenue_usd || 0}</Badge>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                                            <div className="absolute left-0 top-0 w-1.5 h-full bg-slate-400"></div>
                                            <h3 className="font-bold text-slate-700 mb-2 flex items-center justify-between">
                                                <span>3. The Skill Passport Targets</span>
                                                <span className="text-orange-500 font-black">{showIncentives ? `₹${(incentiveData?.skill_passport_incentive_inr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '****'}</span>
                                            </h3>
                                            <p className="text-sm text-slate-500 italic">
                                                Every uniquely completed Skill Passport check generates a fixed ₹{rates.spRate} into the communal incentive pool, which is ultimately divided evenly amongst the entire marketing team!
                                            </p>
                                            <div className="mt-3 flex gap-2">
                                                <Badge variant="outline" className="bg-white text-slate-600">Fresh Sales: {incentiveData?.skill_passport_fresh_sales || 0}</Badge>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 md:p-6">
                        <AssessmentAnalyticsPage scope="executive" />
                    </div>
                )}
            </div>
        </div>
    )
}
