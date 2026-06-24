"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, AlertCircle, FileText, Search, Loader2, Calendar, ChevronDown, ChevronUp, Users, Sparkles } from "lucide-react"
import Link from "next/link"

interface GlobalAwlTrackerProps {
  monthName: string;
  targetDate: Date;
  salesReps?: any[];
  basePath?: string;
}

export function GlobalAwlTracker({ monthName, targetDate, salesReps = [], basePath = "/cro-dashboard" }: GlobalAwlTrackerProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchRep, setSearchRep] = useState("");
  const [searchAwl, setSearchAwl] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const lastDay = new Date(year, month, 0).getDate();
  const monthStart = `${monthStr}-01`;
  const monthEnd = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(monthEnd);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expected-revenue?mode=executive&month=${monthStr}&skipSync=true`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
      }
    } catch (e) {
      console.error("Failed to fetch AWS ID data:", e);
    }
    setLoading(false);
  }, [monthStr]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Sync dates when month changes
  useEffect(() => {
    setStartDate(monthStart);
    setEndDate(monthEnd);
  }, [monthStart, monthEnd]);

  // Flatten the entries into individual AWL ID records (Unique by ID)
  const awlRecords = useMemo(() => {
    const recordsMap: Record<string, any> = {};

    // First pass: Build a global map of all actual sales that happened in the month
    const actualSalesMonthMap: Record<string, { shiftDate: string; revenue: number }> = {};
    entries.forEach(e => {
      const shiftDate = e.shift_date;

      // Use actual_sales_data if available
      const salesData = e.actual_sales_data || [];
      salesData.forEach((s: any) => {
        const id = String(s.awl_id).trim().toUpperCase();
        if (id && id !== 'NULL') {
          actualSalesMonthMap[id] = { shiftDate, revenue: s.revenue || 0 };
        }
      });

      // Also check actual_awl_ids
      const actualIds = e.actual_awl_ids || [];
      actualIds.forEach((id: string) => {
        const cleanId = String(id).trim().toUpperCase();
        if (cleanId && cleanId !== 'NULL' && !actualSalesMonthMap[cleanId]) {
          actualSalesMonthMap[cleanId] = { shiftDate, revenue: 0 };
        }
      });
    });

    const sortedEntries = [...entries].sort((a, b) => a.shift_date.localeCompare(b.shift_date));

    // Second pass: Process predictions only
    sortedEntries.forEach(e => {
      const repName = e.name || e.email;
      const repEmail = e.email;
      const shiftDate = e.shift_date;

      const predictedIdsData = (e.sales || []).map((s: any) => ({
        id: String(s.awl_id).trim().toUpperCase(),
        expected: s.expected_revenue || 0
      }));

      predictedIdsData.forEach(({ id, expected }: { id: string, expected: number }) => {
        if (!id || id === 'NULL' || id === 'UNDEFINED') return;

        if (!recordsMap[id]) {
          recordsMap[id] = {
            awl_id: id,
            repName,
            repEmail,
            shiftDate, // Prediction date
            type: 'predicted',
            matched: false,
            matchedDate: null,
            expected,
            actual: 0
          };
        } else {
          if (expected > recordsMap[id].expected) recordsMap[id].expected = expected;
        }

        // Check if it hit in any date this month
        if (actualSalesMonthMap[id]) {
          recordsMap[id].matched = true;
          recordsMap[id].matchedDate = actualSalesMonthMap[id].shiftDate;
          recordsMap[id].actual = actualSalesMonthMap[id].revenue || expected;
        }
      });
    });

    const records = Object.values(recordsMap);

    return records.sort((a, b) => b.shiftDate.localeCompare(a.shiftDate)).map(r => {
      // Find the ID for redirection
      const rep = salesReps.find(u => u.email === r.repEmail);
      return { ...r, repId: rep?.id };
    });
  }, [entries, salesReps]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    return awlRecords.filter(r => {
      if (searchRep && !r.repName.toLowerCase().includes(searchRep.toLowerCase()) && !r.repEmail.toLowerCase().includes(searchRep.toLowerCase())) {
        return false;
      }
      if (searchAwl && !r.awl_id.toLowerCase().includes(searchAwl.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "All") {
        if (statusFilter === "Hit" && !r.matched) return false;
        if (statusFilter === "Miss" && r.matched) return false;
      }
      if (startDate && r.shiftDate < startDate) return false;
      if (endDate && r.shiftDate > endDate) return false;
      return true;
    });
  }, [awlRecords, searchRep, searchAwl, statusFilter, startDate, endDate]);

  // Unique dates for filter removed as we now use range


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchRep, searchAwl, statusFilter, startDate, endDate, itemsPerPage]);

  return (
    <Card className="border-0 shadow-xl overflow-hidden ring-1 ring-slate-200/50 mt-6">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
      <CardHeader
        className="bg-white border-b border-slate-100 pb-4 transition-colors"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" /> Global AWL ID Tracker
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-500 mt-1">
              Audit all expected sales vs CRM hits across all representatives for {monthName}.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1" onClick={e => e.stopPropagation()}>
            <div className="relative w-[140px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search AWL ID..." value={searchAwl} onChange={(e) => setSearchAwl(e.target.value)} className="pl-9 bg-slate-50/50 h-9 text-xs font-semibold" />
            </div>
            <div className="relative w-[140px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search Rep..." value={searchRep} onChange={(e) => setSearchRep(e.target.value)} className="pl-9 bg-slate-50/50 h-9 text-xs font-semibold" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-9 bg-slate-50/50 text-xs font-semibold border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Hit">🎯 Hit (Matched)</SelectItem>
                <SelectItem value="Miss">❌ Missed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
              <SelectTrigger className="w-[110px] h-9 bg-slate-50/50 text-xs font-semibold border-slate-200">
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
            <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-md border border-slate-200 h-9">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-100 px-2"
                onClick={() => {
                  const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                  const todayStr = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
                  setStartDate(todayStr);
                  setEndDate(todayStr);
                }}
              >
                Today
              </Button>
              <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />
              <Calendar className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
              <input
                type="date"
                value={startDate}
                min={monthStart}
                max={monthEnd}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-[10px] sm:text-xs font-semibold w-24 sm:w-28 focus:ring-0 p-0"
              />
              <span className="text-slate-400 text-xs font-bold px-0.5">to</span>
              <input
                type="date"
                value={endDate}
                min={monthStart}
                max={monthEnd}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-[10px] sm:text-xs font-semibold w-24 sm:w-28 focus:ring-0 p-0"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 animate-in slide-in-from-top-4 fade-in duration-300">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm font-semibold text-slate-500">Compiling global AWL ID data...</p>
          </div>
        ) : awlRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-400 mb-1">No AWL ID Data Available</p>
            <p className="text-sm text-slate-400">Reps haven't submitted predictions for this month yet.</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">No matching AWL IDs found for the applied filters.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto min-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-24 pl-6">Shift Date</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 min-w-[150px]">Sales Rep</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AWL ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right pr-6">Expected $</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((r, idx) => (
                    <TableRow key={idx} className={`transition-colors ${r.matched ? 'bg-emerald-50/20 hover:bg-emerald-50/50' : r.type === 'unpredicted' ? 'bg-slate-50/40 hover:bg-slate-50' : 'bg-red-50/10 hover:bg-red-50/30'}`}>
                      <TableCell className="text-xs font-semibold text-slate-500 pl-6">{r.shiftDate}</TableCell>
                      <TableCell>
                        {r.repId ? (
                          <Link href={basePath === "/sales-head-dashboard" ? `/sales-head-dashboard/${r.repId}` : `${basePath}/sales/${r.repId}`}>
                            <p className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer">{r.repName}</p>
                          </Link>
                        ) : (
                          <p className="text-xs font-bold text-slate-700">{r.repName}</p>
                        )}
                        <p className="text-[9px] text-slate-400 font-medium">{r.repEmail}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold">
                        <a
                          href={`https://applywizz-crm-tool.vercel.app/leads/${r.awl_id.trim()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 hover:underline decoration-indigo-300 transition-colors"
                        >
                          {r.awl_id}
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[9px] font-bold ${r.type === 'predicted' ? 'bg-indigo-100 text-indigo-700 border-0' : 'bg-blue-100 text-blue-700 border-0'}`}>
                          {r.type === 'predicted' ? 'Predicted' : 'Unpredicted Sale (CRM)'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {r.matched ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold gap-1 shadow-sm">
                              <CheckCircle2 className="h-3 w-3" /> Hit
                            </Badge>
                            {r.matchedDate && (
                              <span className="text-[9px] text-emerald-600 font-black opacity-80">{r.matchedDate}</span>
                            )}
                          </div>
                        ) : r.type === 'predicted' ? (
                          <Badge className="bg-red-100 text-red-600 border-0 text-[10px] font-bold gap-1 shadow-sm">
                            <AlertCircle className="h-3 w-3" /> Miss
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px] font-bold">
                            Unpredicted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-slate-600 pr-6">
                        {r.type === 'predicted' ? `$${Number(r.expected).toLocaleString()}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-2 text-xs font-bold text-slate-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
