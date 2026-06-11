"use client";

import { useEffect, useState, useMemo } from "react";
import AssignmentShell from "../components/AssignmentShell";
import MetricInfoTooltip, { METRIC_TOOLTIPS } from "../components/MetricInfoTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Activity,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientAssignment {
  id: string;
  applywizz_id: string;
  suggested_ca_email: string;
  suggested_ca_team: string | null;
  final_ca_email: string | null;
  recommendation_accepted: boolean | null;
  status: 'PENDING' | 'APPROVED' | 'REASSIGNED';
  created_at: string;
}

interface CACapacity {
  ca_id: string;
  name: string;
  team_name: string | null;
  utilization_percentage: number;
}

interface TeamEntry {
  id: string;
  name: string;
}

export default function AssignmentAnalytics() {
  const [queue, setQueue] = useState<ClientAssignment[]>([]);
  const [capacities, setCapacities] = useState<CACapacity[]>([]);
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTeam, setFilterTeam] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [queueRes, capacityRes, teamsRes] = await Promise.all([
        fetch("/api/assignment"),
        fetch("/api/dashboard/capacity"),
        fetch("/api/assignment/teams"),
      ]);

      if (!queueRes.ok) throw new Error("Failed to load analytics queue data");
      if (!capacityRes.ok) throw new Error("Failed to load analytics capacity data");

      const [queueJson, capacityJson, teamsJson] = await Promise.all([
        queueRes.json(),
        capacityRes.json(),
        teamsRes.ok ? teamsRes.json() : Promise.resolve([]),
      ]);

      setQueue(queueJson || []);
      setCapacities(capacityJson || []);
      setTeams(Array.isArray(teamsJson) ? teamsJson : []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique team names
  const uniqueTeams = useMemo(() => {
    if (teams.length > 0) return teams;
    return Array.from(new Set(capacities.map(c => c.team_name).filter(Boolean)))
      .map(n => ({ id: n!, name: n! }));
  }, [teams, capacities]);

  // Filter data by selected team
  const filteredQueue = useMemo(() =>
    filterTeam === "all"
      ? queue
      : queue.filter(q => (q.suggested_ca_team || "") === filterTeam),
    [queue, filterTeam]
  );

  const filteredCapacities = useMemo(() =>
    filterTeam === "all"
      ? capacities
      : capacities.filter(c => (c.team_name || "") === filterTeam),
    [capacities, filterTeam]
  );

  // Summary Metrics
  const totalRecommendations = filteredQueue.length;
  const approvedCount = filteredQueue.filter(item => item.status === 'APPROVED').length;
  const reassignedCount = filteredQueue.filter(item => item.status === 'REASSIGNED').length;
  const pendingCount = filteredQueue.filter(item => item.status === 'PENDING').length;

  const accuracyPercentage = totalRecommendations > 0
    ? Math.round((approvedCount / (approvedCount + reassignedCount || 1)) * 100)
    : 0;

  // Pie Chart Data: Status distribution
  const statusData = [
    { name: "Approved", value: approvedCount, color: "#10b981" },
    { name: "Reassigned", value: reassignedCount, color: "#f59e0b" },
    { name: "Pending", value: pendingCount, color: "#64748b" }
  ].filter(item => item.value > 0);

  // Bar Chart Data: CA workloads
  const utilizationChartData = filteredCapacities
    .map(ca => ({
      name: ca.name || "N/A",
      utilization: ca.utilization_percentage || 0,
    }))
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 10);

  // Line Chart Data: Trend over time
  const trendChartData = useMemo(() => {
    const countsMap: Record<string, number> = {};
    const sortedQueue = [...filteredQueue].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    sortedQueue.forEach(item => {
      const dateKey = new Date(item.created_at).toLocaleDateString('default', {
        month: 'short',
        day: 'numeric',
      });
      countsMap[dateKey] = (countsMap[dateKey] || 0) + 1;
    });
    return Object.entries(countsMap).map(([date, count]) => ({ date, recommendations: count }));
  }, [filteredQueue]);

  const tooltipStyle = {
    contentStyle: { backgroundColor: "#fff", borderColor: "#e2e8f0", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
    labelStyle: { color: "#64748b", fontWeight: "bold" },
  };

  return (
    <AssignmentShell>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Assignment Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Performance metrics, recommendation accuracy, and capacity distribution analytics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Team Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Team</Label>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-44 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 h-9 text-sm">
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
            <Button onClick={loadData} variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 h-9">
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400 mb-4" />
            <p className="text-slate-400 dark:text-slate-400 text-sm">Aggregating analytics data...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950 p-8 rounded-2xl text-center shadow-xl">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-rose-500">Loading Error</h2>
            <p className="text-slate-400 dark:text-slate-400 text-sm mt-1">{error}</p>
            <Button onClick={loadData} variant="outline" className="mt-6 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active team filter badge */}
            {filterTeam !== "all" && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>Showing data for:</span>
                <Badge className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  {filterTeam}
                </Badge>
                <button onClick={() => setFilterTeam("all")} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline">Clear</button>
              </div>
            )}

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Recommendations</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{totalRecommendations}</h3>
                    </div>
                    <Badge variant="outline" className="border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400">Vol</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Approved</p>
                      <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{approvedCount}</h3>
                    </div>
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Reassigned</p>
                      <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{reassignedCount}</h3>
                    </div>
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Recommendation Accuracy</p>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.recommendationAccuracy} />
                      </div>
                      <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{accuracyPercentage}%</h3>
                    </div>
                    <TrendingUp className="h-4 w-4 text-indigo-400 mt-0.5" />
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    Ratio of Approved suggestions over processed evaluations.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart: Status Distribution */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 lg:col-span-1 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignment Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                  {statusData.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-sm">No assignment records to display.</p>
                  ) : (
                    <div className="w-full h-64 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip {...tooltipStyle} />
                          <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{value}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Line Chart: Trend */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 lg:col-span-2 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignment Creation Trend</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {trendChartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No timeline trend data.</div>
                  ) : (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "10px" }} />
                          <YAxis stroke="#94a3b8" style={{ fontSize: "10px" }} />
                          <Tooltip {...tooltipStyle} />
                          <Line type="monotone" dataKey="recommendations" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} name="Assignments" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bar Chart: CA Utilization */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  Workload Utilization Distribution (Top 10 CAs)
                  {filterTeam !== "all" && (
                    <span className="text-indigo-400 dark:text-indigo-500 text-[11px] normal-case font-normal ml-1">— {filterTeam}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {utilizationChartData.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No Career Associate utilization data.</div>
                ) : (
                  <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={utilizationChartData} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          angle={-15} 
                          textAnchor="end"
                          style={{ fontSize: "10px", fontWeight: "bold" }} 
                        />
                        <YAxis stroke="#94a3b8" style={{ fontSize: "10px" }} unit="%" />
                        <Tooltip {...tooltipStyle} formatter={(value) => [`${value}%`, "Utilization"]} />
                        <Bar dataKey="utilization" fill="#6366f1" radius={[4, 4, 0, 0]}>
                          {utilizationChartData.map((entry, index) => {
                            let cellColor = "#10b981";
                            if (entry.utilization >= 60 && entry.utilization <= 85) {
                              cellColor = "#f59e0b";
                            } else if (entry.utilization > 85) {
                              cellColor = "#f43f5e";
                            }
                            return <Cell key={`cell-${index}`} fill={cellColor} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AssignmentShell>
  );
}
