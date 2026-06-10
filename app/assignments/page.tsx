"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AssignmentShell from "../components/AssignmentShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Inbox,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientAssignment {
  id: string;
  applywizz_id: string;
  suggested_ca_email: string;
  suggested_ca_name: string | null;
  suggested_ca_team: string | null;
  final_ca_email: string | null;
  recommendation_accepted: boolean | null;
  status: 'PENDING' | 'APPROVED' | 'REASSIGNED';
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  remarks: string | null;
}

interface TeamEntry {
  id: string;
  name: string;
}

export default function AssignmentQueue() {
  const [queue, setQueue] = useState<ClientAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamEntry[]>([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/assignment");
      if (!res.ok) throw new Error("Failed to load assignment queue");
      const json = await res.json();
      setQueue(json || []);
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/assignment/teams");
      if (res.ok) {
        const json = await res.json();
        setTeams(Array.isArray(json) ? json : []);
      }
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchTeams();
  }, []);

  // Derive unique teams from the queue data as fallback
  const uniqueTeams = teams.length > 0
    ? teams
    : Array.from(new Set(queue.map(q => q.suggested_ca_team).filter(Boolean)))
        .map(n => ({ id: n!, name: n! }));

  const processedData = queue.filter(item => {
    const matchesSearch = 
      (item.applywizz_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.suggested_ca_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.final_ca_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.suggested_ca_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === "all" || 
      (item.status || "").toLowerCase() === filterStatus.toLowerCase();

    const matchesTeam =
      filterTeam === "all" ||
      (item.suggested_ca_team || "") === filterTeam;

    return matchesSearch && matchesStatus && matchesTeam;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">Approved</Badge>;
      case "REASSIGNED":
        return <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">Reassigned</Badge>;
      default:
        return <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Pending</Badge>;
    }
  };

  const getAcceptedBadge = (accepted: boolean | null) => {
    if (accepted === null) return <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>;
    return accepted ? (
      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
        <CheckCircle className="h-3.5 w-3.5" /> Yes
      </span>
    ) : (
      <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 text-xs font-semibold">
        <XCircle className="h-3.5 w-3.5" /> No
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return <span className="text-slate-300 dark:text-slate-600">—</span>;
    return (
      <span className="flex items-center gap-1.5 font-mono text-slate-500 dark:text-slate-400 text-xs">
        <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        {new Date(dateStr).toLocaleString()}
      </span>
    );
  };

  return (
    <AssignmentShell>
      <div className="space-y-8">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Client Assignment Queue</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Review recommendations, confirm status updates, and view history.
          </p>
        </div>

        {/* Filter Controls Panel */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end justify-between">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              {/* Search */}
              <div>
                <Label htmlFor="search" className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Search</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="search"
                    placeholder="Search ID, name, or email..."
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

              {/* Status Filter */}
              <div>
                <Label htmlFor="status" className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</Label>
                <div className="mt-1.5">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger id="status" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="reassigned">Reassigned</SelectItem>
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
                  setFilterStatus("all");
                  setFilterTeam("all");
                }}
                className="w-full md:w-auto border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Queue Table */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Recommendations List ({processedData.length} records)</h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 dark:text-indigo-400 mb-2" />
                <p className="text-slate-400 dark:text-slate-500 text-sm">Loading assignment queue...</p>
              </div>
            ) : error ? (
              <div className="p-16 text-center">
                <p className="text-rose-500 font-medium">Failed to load assignment queue</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{error}</p>
                <Button onClick={fetchQueue} size="sm" variant="outline" className="mt-4 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Retry
                </Button>
              </div>
            ) : processedData.length === 0 ? (
              <div className="p-16 text-center">
                <Inbox className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No records found</p>
                <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Assignment engine suggestions will appear here.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/60 dark:bg-slate-900/60">
                  <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">ApplyWizz ID</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Suggested CA</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Team</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Final CA Email</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Status</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium text-center">Accepted</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Created At</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Reviewed At</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.map((row) => (
                    <TableRow key={row.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-100">
                        <Link 
                          href={`/assignments/${row.applywizz_id}`}
                          className="hover:underline flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          {row.applywizz_id}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                      </TableCell>
                      {/* Suggested CA: name + email */}
                      <TableCell>
                        <div>
                          {row.suggested_ca_name && (
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.suggested_ca_name}</div>
                          )}
                          <div className="font-mono text-xs text-slate-400 dark:text-slate-500">{row.suggested_ca_email}</div>
                        </div>
                      </TableCell>
                      {/* Team */}
                      <TableCell>
                        {row.suggested_ca_team ? (
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            {row.suggested_ca_team}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-200">{row.final_ca_email || <span className="text-slate-300 dark:text-slate-600">Pending approval</span>}</TableCell>
                      <TableCell>{getStatusBadge(row.status)}</TableCell>
                      <TableCell className="text-center">{getAcceptedBadge(row.recommendation_accepted)}</TableCell>
                      <TableCell>{formatDate(row.created_at)}</TableCell>
                      <TableCell>{formatDate(row.reviewed_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/assignments/${row.applywizz_id}`} passHref legacyBehavior>
                          <Button size="sm" variant="ghost" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800">
                            Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </AssignmentShell>
  );
}
