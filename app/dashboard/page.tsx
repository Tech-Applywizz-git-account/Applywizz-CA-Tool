"use client";

import { useEffect, useState } from "react";
import AssignmentShell from "../components/AssignmentShell";
import MetricInfoTooltip, { METRIC_TOOLTIPS } from "../components/MetricInfoTooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Hourglass, 
  Gauge, 
  AlertTriangle,
  Search,
  ArrowUpDown,
  User,
  Inbox,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryStats {
  totalActiveCAs: number;
  totalPendingAssignments: number;
  averageUtilization: number;
  casBelowMinCapacity: number;
}

interface CACapacity {
  ca_id: string;
  name: string;
  email: string;
  designation: string;
  system_name: string | null;
  team_name: string | null;
  min_capacity: number;
  max_capacity: number;
  weighted_active_load: number;
  pending_assignments: number;
  effective_load: number;
  available_capacity: number;
  deficit_to_min: number;
  utilization_percentage: number;
  productivity_average: number;
}

interface TeamEntry {
  id: string;
  name: string;
}

type SortField = 'utilization_percentage' | 'effective_load' | 'available_capacity' | 'productivity_average';
type SortOrder = 'asc' | 'desc';

export default function CapacityDashboard() {
  // Stats state
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Capacity state
  const [capacityData, setCapacityData] = useState<CACapacity[]>([]);
  const [capacityLoading, setCapacityLoading] = useState(true);
  const [capacityError, setCapacityError] = useState<string | null>(null);

  // Teams
  const [teams, setTeams] = useState<TeamEntry[]>([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDesignation, setFilterDesignation] = useState("all");
  const [filterUtilization, setFilterUtilization] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField>('utilization_percentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Load stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch("/api/assignment/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      const json = await res.json();
      if (json.success) {
        setStats({
          totalActiveCAs: json.totalActiveCAs,
          totalPendingAssignments: json.totalPendingAssignments,
          averageUtilization: json.averageUtilization,
          casBelowMinCapacity: json.casBelowMinCapacity
        });
      }
    } catch (err: any) {
      setStatsError(err.message || "Error");
    } finally {
      setStatsLoading(false);
    }
  };

  // Load capacity data
  const fetchCapacity = async () => {
    try {
      setCapacityLoading(true);
      const res = await fetch("/api/dashboard/capacity");
      if (!res.ok) throw new Error("Failed to load capacity details");
      const json = await res.json();
      setCapacityData(json || []);
    } catch (err: any) {
      setCapacityError(err.message || "Error");
    } finally {
      setCapacityLoading(false);
    }
  };

  // Load teams for filter
  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/assignment/teams");
      if (res.ok) {
        const json = await res.json();
        setTeams(Array.isArray(json) ? json : []);
      }
    } catch {
      // teams filter is non-critical
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCapacity();
    fetchTeams();
  }, []);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter & Search processing
  const processedData = capacityData
    .filter(item => {
      const matchesSearch = 
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDesignation = 
        filterDesignation === "all" || 
        (item.designation || "").toLowerCase() === filterDesignation.toLowerCase();

      const matchesTeam =
        filterTeam === "all" ||
        (item.team_name || "") === filterTeam;

      let matchesUtilization = true;
      const util = item.utilization_percentage || 0;
      if (filterUtilization === "low") {
        matchesUtilization = util < 60;
      } else if (filterUtilization === "medium") {
        matchesUtilization = util >= 60 && util <= 85;
      } else if (filterUtilization === "high") {
        matchesUtilization = util > 85;
      }

      return matchesSearch && matchesDesignation && matchesUtilization && matchesTeam;
    })
    .sort((a, b) => {
      let valA = a[sortField] ?? 0;
      let valB = b[sortField] ?? 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  // Get utilization color classes for rows
  const getUtilColorClasses = (util: number) => {
    if (util < 60) return "bg-emerald-50 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/10";
    if (util <= 85) return "bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10 border-amber-200 dark:border-amber-500/10";
    return "bg-rose-50 dark:bg-rose-500/5 hover:bg-rose-100 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/10";
  };

  const getUtilBadgeVariant = (util: number) => {
    if (util < 60) return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30";
    if (util <= 85) return "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30";
    return "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30";
  };

  // Unique team names from capacity data (as fallback if teams API fails)
  const uniqueTeams = teams.length > 0
    ? teams
    : Array.from(new Set(capacityData.map(d => d.team_name).filter(Boolean))).map(n => ({ id: n!, name: n! }));

  return (
    <AssignmentShell>
      <div className="space-y-8">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">CA Workload Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time Career Associate load monitoring, capacity levels, and active queue counts.
          </p>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active CAs Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Active CAs</p>
                {statsLoading ? (
                  <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mt-1" />
                ) : statsError ? (
                  <p className="text-lg font-semibold text-rose-500 mt-1">Error</p>
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{stats?.totalActiveCAs}</h3>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Clients Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                <Hourglass className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Pending Clients</p>
                {statsLoading ? (
                  <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mt-1" />
                ) : statsError ? (
                  <p className="text-lg font-semibold text-rose-500 mt-1">Error</p>
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{stats?.totalPendingAssignments}</h3>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Average Utilization Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <Gauge className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Average Utilization</p>
                  <MetricInfoTooltip content={METRIC_TOOLTIPS.averageUtilization} />
                </div>
                {statsLoading ? (
                  <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mt-1" />
                ) : statsError ? (
                  <p className="text-lg font-semibold text-rose-500 mt-1">Error</p>
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{stats?.averageUtilization}%</h3>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Under Minimum Load Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Under Minimum Load</p>
                {statsLoading ? (
                  <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mt-1" />
                ) : statsError ? (
                  <p className="text-lg font-semibold text-rose-500 mt-1">Error</p>
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{stats?.casBelowMinCapacity}</h3>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls Panel */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end justify-between">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {/* Search */}
              <div>
                <Label htmlFor="search" className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Search</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="search"
                    placeholder="Search name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Team Filter */}
              <div>
                <Label htmlFor="team" className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Team</Label>
                <div className="mt-1.5">
                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger id="team" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                      <SelectItem value="all">All Teams</SelectItem>
                      {uniqueTeams.map(t => (
                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Designation Filter */}
              <div>
                <Label htmlFor="designation" className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Designation</Label>
                <div className="mt-1.5">
                  <Select value={filterDesignation} onValueChange={setFilterDesignation}>
                    <SelectTrigger id="designation" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                      <SelectValue placeholder="All Designations" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                      <SelectItem value="all">All Designations</SelectItem>
                      <SelectItem value="CA">Career Associate</SelectItem>
                      <SelectItem value="Junior CA">Junior CA</SelectItem>
                      <SelectItem value="Career Associative Trainee">CA Trainee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Utilization Filter */}
              <div>
                <Label htmlFor="utilization" className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Utilization Band</Label>
                <div className="mt-1.5">
                  <Select value={filterUtilization} onValueChange={setFilterUtilization}>
                    <SelectTrigger id="utilization" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                      <SelectValue placeholder="All Utilizations" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                      <SelectItem value="all">All Utilizations</SelectItem>
                      <SelectItem value="low">Underload (Below 60%)</SelectItem>
                      <SelectItem value="medium">Target (60% - 85%)</SelectItem>
                      <SelectItem value="high">Overload (Above 85%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterDesignation("all");
                  setFilterUtilization("all");
                  setFilterTeam("all");
                }}
                className="w-full md:w-auto border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Table */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">CA Workload Breakdown ({processedData.length} records)</h2>
            <div className="flex gap-4 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Underload (&lt;60%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Target (60%-85%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Overload (&gt;85%)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {capacityLoading ? (
              <div className="p-16 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 dark:text-indigo-400 mb-2" />
                <p className="text-slate-400 dark:text-slate-500 text-sm">Loading capacity dashboard...</p>
              </div>
            ) : capacityError ? (
              <div className="p-16 text-center">
                <p className="text-rose-500 font-medium">Failed to load capacity details</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{capacityError}</p>
                <Button onClick={fetchCapacity} size="sm" variant="outline" className="mt-4 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Retry
                </Button>
              </div>
            ) : processedData.length === 0 ? (
              <div className="p-16 text-center">
                <Inbox className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No results match filters</p>
                <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Try modifying your query or filters above.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/60 dark:bg-slate-900/60">
                  <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Name / Team</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Email</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">System Name</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Designation</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium text-center">Min</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium text-center">Max</TableHead>
                    
                    {/* Active Load with tooltip */}
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Active Load</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.weightedActiveLoad} />
                      </div>
                    </TableHead>

                    {/* Pending with tooltip */}
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Pending</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.pendingAssignments} />
                      </div>
                    </TableHead>

                    {/* Effective Load with tooltip + sort */}
                    <TableHead 
                      className="text-slate-500 dark:text-slate-400 font-medium text-center cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={() => handleSort('effective_load')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Eff Load</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.effectiveLoad} />
                        <ArrowUpDown className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      </div>
                    </TableHead>

                    {/* Available Capacity with tooltip + sort */}
                    <TableHead 
                      className="text-slate-500 dark:text-slate-400 font-medium text-center cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={() => handleSort('available_capacity')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Avail Cap</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.availableCapacity} />
                        <ArrowUpDown className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      </div>
                    </TableHead>

                    {/* Utilization with tooltip + sort */}
                    <TableHead 
                      className="text-slate-500 dark:text-slate-400 font-medium text-center cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={() => handleSort('utilization_percentage')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Util %</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.utilizationPercentage} />
                        <ArrowUpDown className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      </div>
                    </TableHead>

                    {/* Productivity with tooltip + sort */}
                    <TableHead 
                      className="text-slate-500 dark:text-slate-400 font-medium text-center cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={() => handleSort('productivity_average')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Productivity</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.productivityAverage} />
                        <ArrowUpDown className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.map((row) => {
                    const utilVal = row.utilization_percentage || 0;
                    return (
                      <TableRow 
                        key={row.ca_id} 
                        className={cn("border-b transition-colors", getUtilColorClasses(utilVal))}
                      >
                        {/* Name + Team as secondary text */}
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                              <User className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{row.name || "N/A"}</div>
                              {row.team_name && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{row.team_name}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{row.email}</TableCell>
                        <TableCell>
                          {row.system_name ? (
                            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                              {row.system_name}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold py-0.5">
                            {row.designation || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-700 dark:text-slate-300">{row.min_capacity}</TableCell>
                        <TableCell className="text-center font-semibold text-slate-700 dark:text-slate-300">{row.max_capacity}</TableCell>
                        <TableCell className="text-center text-slate-500 dark:text-slate-400">{row.weighted_active_load}</TableCell>
                        <TableCell className="text-center text-slate-500 dark:text-slate-400">{row.pending_assignments}</TableCell>
                        <TableCell className="text-center font-semibold text-slate-800 dark:text-slate-200">{row.effective_load}</TableCell>
                        <TableCell className="text-center font-semibold text-slate-700 dark:text-slate-300">{row.available_capacity}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn("px-2 py-0.5 text-xs rounded-full font-bold", getUtilBadgeVariant(utilVal))}>
                            {utilVal}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold text-indigo-600 dark:text-indigo-400">{row.productivity_average}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </AssignmentShell>
  );
}
