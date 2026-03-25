"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DollarSign, FileText, Phone, Users, User, ArrowRight, TrendingUp, Calendar, Gift, ChevronLeft, ChevronRight, Eye, EyeOff, Target, LockOpen, CheckCircle2, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Helper to render the rules table depending on role
const renderSlabRules = (role: string) => {
    if (role === "BDT-P" || role === "BDT") {
       return (
           <Card className="mt-8 border-indigo-100 shadow-sm bg-indigo-50/50">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2 text-indigo-800">
                 <FileText className="h-5 w-5" /> Base Compensation Rules
               </CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed">Trainee roles operate on a fixed target of <strong>$500</strong>. You rely primarily on your fixed base salary. Complete your targets efficiently to qualify for progression, official title promotion, and access to the extremely lucrative Spot Bonus and Tiered Slab incentives!</p>
             </CardContent>
           </Card>
       )
    }

    const isBDA = role === "BDA";
    const minDaily = isBDA ? "$400" : "$700";

    return (
        <Card className="mt-8 shadow-sm overflow-hidden border-slate-200">
            <div className="h-1 w-full bg-slate-300"></div>
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800 tracking-tight">
                    <FileText className="h-5 w-5 text-indigo-600" /> 
                    {role} Official Incentive & Daily Bonus Matrix
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 bg-slate-100 px-3 py-1.5 rounded-md text-sm w-fit">
                            <Gift className="h-4 w-4 text-indigo-500" /> Biweekly Slab Rules
                        </h3>
                        <Table className="border rounded-md shadow-sm">
                            <TableHeader>
                                <TableRow className="bg-slate-50/80">
                                    <TableHead className="font-semibold text-slate-700">Revenue Bracket</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Payout Incentive</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isBDA && (
                                    <TableRow className="hover:bg-indigo-50/50 transition-colors">
                                        <TableCell className="font-medium text-slate-600">$1,000 – $1,999</TableCell>
                                        <TableCell className="text-right text-indigo-600 font-extrabold">₹4,000</TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="hover:bg-indigo-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-600">$2,000 – $2,499</TableCell>
                                    <TableCell className="text-right text-indigo-600 font-extrabold">₹5,500</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-indigo-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-600">$2,500 – $3,499</TableCell>
                                    <TableCell className="text-right text-indigo-600 font-extrabold">₹8,500</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-indigo-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-600">$3,500 – $4,999</TableCell>
                                    <TableCell className="text-right text-indigo-600 font-extrabold">₹10,500</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-indigo-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-600">$5,000 – $5,999</TableCell>
                                    <TableCell className="text-right text-indigo-600 font-extrabold">₹15,500</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-indigo-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-600">$6,000 – $6,999</TableCell>
                                    <TableCell className="text-right text-indigo-600 font-extrabold">₹19,000</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-indigo-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-600">$7,000 – $7,999</TableCell>
                                    <TableCell className="text-right text-indigo-600 font-extrabold">₹23,000</TableCell>
                                </TableRow>
                                 <TableRow className="hover:bg-indigo-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-600">$8,000 – $8,999</TableCell>
                                    <TableCell className="text-right text-indigo-600 font-extrabold">₹28,000</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-indigo-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-600">$9,000 – $9,999</TableCell>
                                    <TableCell className="text-right text-indigo-600 font-extrabold">₹34,000</TableCell>
                                </TableRow>
                                <TableRow className="bg-emerald-50/50 hover:bg-emerald-100 transition-colors">
                                    <TableCell className="font-bold text-emerald-800">$10,000+ MAX</TableCell>
                                    <TableCell className="text-right text-emerald-700 font-black">Scale to ₹40,000</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                    <div>
                         <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 bg-slate-100 px-3 py-1.5 rounded-md text-sm w-fit">
                            <Target className="h-4 w-4 text-emerald-500" /> Daily Bonus Operations
                        </h3>
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm space-y-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                            <p className="text-slate-700 text-base">For every single specified <strong>24-hour shift timeframe</strong>, you have access to infinitely stackable spot bonuses!</p>
                            
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                                <span className="font-bold block text-slate-500 uppercase tracking-widest text-xs mb-1">Shift Threshold Required</span>
                                <span className="text-3xl text-emerald-600 font-black tracking-tight">{minDaily} USD <span className="text-lg font-bold text-slate-400">Total Sales</span></span>
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-slate-600 font-medium">If you cross {minDaily} in a single continuous 24-hr shift, you receive a direct <strong className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">1:1 payout match (in ₹)</strong> on top of your final biweekly block incentive!</p>
                                <p className="text-xs text-slate-600 bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <span><strong>Example:</strong> Secure ${isBDA ? "410" : "720"} today? We instantly add ₹{isBDA ? "410" : "720"} safely into your final take-home tracking for this exact period. This can happen every single day of the month!</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface BDADashboardProps {
  user: any;
  onLogout: () => void;
  viewerMode?: boolean;
}

// Next Slab Prediction Engine
const getNextSlab = (role: string, currentRevenue: number) => {
    if (role === 'BDT-P' || role === 'BDT') {
        if (currentRevenue < 500) return { nextTarget: 500, nextIncentive: 0, label: "Base Target" };
        return { nextTarget: null, label: "Target Cleared!" };
    }
    
    const slabs = [
        { rev: 1000, inc: 4000, roles: ['BDA'] },
        { rev: 2000, inc: 5500, roles: ['BDA', 'SBDA'] },
        { rev: 2500, inc: 8500, roles: ['BDA', 'SBDA'] },
        { rev: 3500, inc: 10500, roles: ['BDA', 'SBDA'] },
        { rev: 5000, inc: 15500, roles: ['BDA', 'SBDA'] },
        { rev: 6000, inc: 19000, roles: ['BDA', 'SBDA'] },
        { rev: 7000, inc: 23000, roles: ['BDA', 'SBDA'] },
        { rev: 8000, inc: 28000, roles: ['BDA', 'SBDA'] },
        { rev: 9000, inc: 34000, roles: ['BDA', 'SBDA'] },
        { rev: 10000, inc: 40000, roles: ['BDA', 'SBDA'] },
    ];
    
    for (const slab of slabs) {
        if (slab.roles.includes(role) && currentRevenue < slab.rev) {
            return { nextTarget: slab.rev, nextIncentive: slab.inc };
        }
    }
    return { nextTarget: null }; // maxed out entirely
}

const isCurrentPeriod = (periodStr: string) => {
    // Expected "YYYY-MM-DD to YYYY-MM-DD"
    const parts = periodStr.split(" to ");
    if(parts.length < 2) return false;
    const start = new Date(parts[0] + "T00:00:00Z");
    const end = new Date(parts[1] + "T23:59:59Z");
    const now = new Date();
    return now >= start && now <= end;
}

const isPastPeriod = (periodStr: string) => {
    const parts = periodStr.split(" to ");
    if(parts.length < 2) return false;
    const end = new Date(parts[1] + "T23:59:59Z");
    return new Date() > end;
}

export function BDADashboard({ user, onLogout, viewerMode }: BDADashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  
  // Month toggles
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Pagination for Sales table
  const [salesPage, setSalesPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  // Incentive privacy toggles
  const [showIncentives, setShowIncentives] = useState<Record<string, boolean>>({});

  const toggleIncentiveView = (periodName: string) => {
    setShowIncentives((prev) => ({ ...prev, [periodName]: !prev[periodName] }));
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/calculate-sales-incentives?email=${encodeURIComponent(user.email)}&role=${encodeURIComponent(user.role || user.designation)}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || "Failed to load sales report");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email && user?.role) {
      fetchData();
    }
  }, [user]);

  // Derived state for Month filtering
  const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const targetPrefix = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}`;
  
  const getMonthName = () => {
    return targetDate.toLocaleString("default", { month: "long", year: "numeric" });
  }

  // Filter periods based on month offset and sort chronologically 
  const filteredPeriods = data?.periods 
      ? Object.entries(data.periods)
          .filter(([periodName]) => periodName.startsWith(targetPrefix))
          .sort((a, b) => a[0].localeCompare(b[0]))
      : [];
      
  const filteredSales = data?.crmSales?.filter((sale: any) => sale.closed_at?.startsWith(targetPrefix)) || [];
  
  const totalSalesPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = filteredSales.slice((salesPage - 1) * itemsPerPage, salesPage * itemsPerPage);

  useEffect(() => {
    setSalesPage(1);
  }, [monthOffset]);

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 relative">
      
        {/* Animated Sticky Native Header */}
        <div className={`flex justify-between items-center bg-white rounded-xl shadow-md border border-slate-200 bg-gradient-to-r from-white to-slate-50/50 sticky top-2 z-50 transition-all duration-500 overflow-hidden backdrop-blur-lg ${isScrolled ? 'p-3 px-6 bg-white/95 shadow-lg' : 'p-6 items-start'}`}>
          <div className="flex items-center gap-4 transition-all duration-500">
             <div className="flex flex-col justify-center">
                <p className={`text-xs text-indigo-500 font-black uppercase tracking-widest shrink-0 transition-all duration-500 ease-in-out ${isScrolled ? 'h-0 opacity-0 m-0' : 'mb-1.5 h-4 opacity-100'}`}>
                   {viewerMode ? "Auditing Mode Active" : "Sales Management System"}
                </p>
                <div className="flex items-center gap-3">
                    <h1 className={`font-extrabold text-slate-900 tracking-tight transition-all duration-500 ease-in-out ${isScrolled ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl mb-3'}`}>
                      {viewerMode ? (isScrolled ? "Viewing:" : "Viewing Layout: ") : (isScrolled ? "Welcome, " : "Welcome back, ")}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 drop-shadow-sm">
                        {user.name}
                      </span>
                    </h1>
                     <Badge className={`bg-gradient-to-r transition-all duration-500 from-emerald-500 to-teal-500 text-white border-0 shadow-sm font-semibold tracking-wide ${isScrolled ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
                        {user.role} {user.designation && !isScrolled && user.designation !== user.role ? `— ${user.designation}` : ""}
                    </Badge>
                </div>
                
                <div className={`flex items-center gap-3 transition-all duration-500 ${isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>
                    {user.isactive && <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex gap-1 items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Authorized Network</span>}
                </div>
             </div>
          </div>

          <div className="flex flex-row items-center gap-3 justify-end">
              {/* Animated Hidden Scrolled Menu Space */}
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        )}

        {/* Global Controls - Month Filter (Animating out!) */}
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden w-full ${isScrolled ? 'max-h-0 opacity-0 transform -translate-y-8 mb-0 invisible' : 'max-h-[300px] opacity-100 transform translate-y-0 mb-6 visible'}`}>
            <Card className="shadow-md border-slate-200 overflow-hidden bg-white">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
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
        ) : data ? (
          <>
            {/* Real-time calculated incentive periods! */}
            {filteredPeriods.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                  Incentive Achieved (Shift Evaluates at {data.shiftStartTime})
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredPeriods.map(([periodName, pData]: [string, any]) => {
                     const isCurrent = isCurrentPeriod(periodName);
                     const isPast = isPastPeriod(periodName);
                     
                     const rev = pData.total_revenue;
                     const target = pData.target_amount;
                     const hasPassedTarget = rev >= target;
                     
                     const slabInfo = getNextSlab(user.role, rev);
                     
                     // Progress Bar Calc
                     let displayMax = slabInfo.nextTarget || Math.max(rev, target);
                     if (displayMax === 0) displayMax = 1; // safety
                     const percentage = Math.min(100, Math.round((rev / displayMax) * 100));

                     return (
                        <Card key={periodName} className={`relative overflow-hidden shadow-md transition-all ${isCurrent ? 'border-2 border-indigo-500 shadow-lg scale-[1.01]' : 'border-slate-200 opacity-90'}`}>
                          {/* Active Indicator Strip */}
                          {isCurrent && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider uppercase z-10">Active Period</div>}
                          
                          <CardHeader className="pb-3 bg-slate-50/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-md text-slate-800 flex items-center gap-2 font-bold">
                                  <Calendar className="h-4 w-4 text-indigo-500" /> {periodName}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="font-semibold text-slate-600 border-slate-300">Target: ${target}</Badge>
                                </div>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-transform hover:scale-105 shadow-sm border-none text-white ${isCurrent ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-700'}`} 
                                onClick={() => toggleIncentiveView(periodName)}
                              >
                                <span className="text-sm font-bold tracking-wide">Payout: {showIncentives[periodName] ? `₹${pData.total_incentive.toLocaleString()}` : "****"}</span>
                                {showIncentives[periodName] ? <EyeOff className="h-4 w-4 opacity-80" /> : <Eye className="h-4 w-4 opacity-80" />}
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-4">
                            {/* Gamified Progress Bar Section */}
                            <div className="mb-6 space-y-2">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span className="text-indigo-700 flex items-center gap-1"><DollarSign className="h-4 w-4"/> {rev.toLocaleString()} Recorded</span>
                                    {slabInfo.nextTarget ? (
                                        <span className="text-slate-500">Goal: ${slabInfo.nextTarget.toLocaleString()}</span>
                                    ) : (
                                        <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> Slabs Maxed!</span>
                                    )}
                                </div>
                                
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                                    <div 
                                        className={`h-full bg-gradient-to-r transition-all duration-1000 ease-out ${hasPassedTarget ? 'from-emerald-400 to-teal-500' : 'from-indigo-400 to-purple-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                
                                <div className="text-xs font-medium flex justify-between items-center">
                                    {/* Motivation Messages */}
                                    {isPast ? (
                                        hasPassedTarget 
                                          ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Target Successfully Achieved!</span>
                                          : <span className="text-rose-500 font-bold">Target Missed for this Period.</span>
                                    ) : (
                                        hasPassedTarget ? (
                                            slabInfo.nextTarget ? (
                                                <span className="text-teal-600 font-semibold flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-full"><LockOpen className="h-3 w-3"/> Unlock ₹{slabInfo.nextIncentive?.toLocaleString()} at ${slabInfo.nextTarget}</span>
                                            ) : (
                                                <span className="text-slate-500">Incredible work! Maximum limits reached.</span>
                                            )
                                        ) : (
                                            <span className="text-indigo-600 font-semibold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full"><Target className="h-3 w-3" /> ${(target - rev).toLocaleString()} more to qualify!</span>
                                        )
                                    )}
                                </div>
                            </div>
                            
                            {/* Calculation Breakdown Grid */}
                            <div className="grid grid-cols-3 gap-3 text-sm mt-4">
                              <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100 shadow-sm flex flex-col justify-center">
                                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Total Rev</p>
                                <p className="font-extrabold text-slate-800 text-lg">${pData.total_revenue}</p>
                              </div>
                              <div className={`p-3 rounded-xl text-center border shadow-sm flex flex-col justify-center ${pData.daily_bonus > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                <p className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${pData.daily_bonus > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>Daily Bonus</p>
                                <p className={`font-extrabold text-lg ${pData.daily_bonus > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>{showIncentives[periodName] ? (pData.daily_bonus > 0 ? `₹${pData.daily_bonus}` : "-") : "****"}</p>
                              </div>
                               <div className={`p-3 rounded-xl text-center border shadow-sm flex flex-col justify-center ${pData.slab_incentive > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                                <p className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${pData.slab_incentive > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>Slab Bonus</p>
                                <p className={`font-extrabold text-lg ${pData.slab_incentive > 0 ? 'text-indigo-700' : 'text-slate-300'}`}>{showIncentives[periodName] ? (pData.slab_incentive > 0 ? `₹${pData.slab_incentive}` : "-") : "****"}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                     )
                  })}
                </div>
              </div>
            ) : (
               <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500">
                  No incentive periods found for {getMonthName()}.
               </div>
            )}

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Sales for {getMonthName()}</CardTitle>
                <div className="text-sm text-slate-500 pt-1">Total: {filteredSales.length} Deals</div>
              </CardHeader>
              <CardContent>
                {filteredSales.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No sales recorded this month.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-md border border-slate-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-semibold">Lead Name</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Value</TableHead>
                            <TableHead className="font-semibold">Date Closed</TableHead>
                            <TableHead className="font-semibold">Payment Mode</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedSales.map((sale: any) => (
                            <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell className="font-medium">{sale.lead_name}</TableCell>
                              <TableCell className="text-slate-600">{sale.email}</TableCell>
                              <TableCell className="text-emerald-600 font-semibold">${sale.sale_value}</TableCell>
                              <TableCell className="text-slate-600">{new Date(sale.closed_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-slate-600 bg-white">{sale.payment_mode || "N/A"}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  sale.finance_status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-transparent' :
                                  sale.finance_status === 'Paused' ? 'bg-amber-100 text-amber-800 border-transparent' :
                                  'bg-slate-100 text-slate-800 border-transparent'
                                }>
                                  {sale.finance_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalSalesPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                          Showing {(salesPage - 1) * itemsPerPage + 1} to {Math.min(salesPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} entries
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                            disabled={salesPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="text-sm font-medium px-2 text-slate-700">
                            Page {salesPage} of {totalSalesPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSalesPage(p => Math.min(totalSalesPages, p + 1))}
                            disabled={salesPage === totalSalesPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dynamic Role-Based Guidelines & Motivation Panel */}
            {renderSlabRules(user.role)}
            
          </>
        ) : null}
      </div>
    </div>
  );
}
