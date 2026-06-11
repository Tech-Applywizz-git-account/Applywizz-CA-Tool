"use client";

import { useEffect, useState } from "react";
import AssignmentShell from "../../components/AssignmentShell";
import MetricInfoTooltip, { METRIC_TOOLTIPS } from "../../components/MetricInfoTooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  User,
  Inbox,
  Loader2,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CACapacity {
  ca_id: string;
  name: string;
  email: string;
  designation: string;
  system_name: string | null;
  team_name: string | null;
  min_capacity: number;
  max_capacity: number;
}

interface TeamEntry {
  id: string;
  name: string;
}

interface RowUpdate {
  system_name: string;
  min_capacity: number;
  max_capacity: number;
}

export default function CapacityManagement() {
  const [cas, setCas] = useState<CACapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamEntry[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");

  // Tracks modified values: ca_id -> { system_name, min_capacity, max_capacity }
  const [edits, setEdits] = useState<Record<string, RowUpdate>>({});
  // Tracks validation errors: ca_id -> error message
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Tracks rows currently saving
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  // Tracks individual success notifications
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});

  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchCapacity = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/capacity");
      if (!res.ok) throw new Error("Failed to load Career Associates");
      const json = await res.json();
      setCas(json || []);
      setEdits({});
      setValidationErrors({});
    } catch (err: any) {
      setError(err.message || "Error occurred");
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
    fetchCapacity();
    fetchTeams();
  }, []);

  // Handle value change for min/max capacity and system_name
  const handleValueChange = (
    caId: string,
    field: 'min_capacity' | 'max_capacity' | 'system_name',
    rawValue: string,
    originalRow: CACapacity
  ) => {
    const currentEdits = edits[caId] || {
      system_name: originalRow.system_name || "",
      min_capacity: originalRow.min_capacity,
      max_capacity: originalRow.max_capacity,
    };

    let updatedEdits: RowUpdate;

    if (field === 'system_name') {
      updatedEdits = { ...currentEdits, system_name: rawValue };
    } else {
      const value = parseInt(rawValue, 10);
      updatedEdits = {
        ...currentEdits,
        [field]: isNaN(value) ? 0 : value,
      };
    }

    // Validation
    let validationMsg = "";
    if (updatedEdits.min_capacity < 0) {
      validationMsg = "Min Capacity cannot be negative.";
    } else if (updatedEdits.max_capacity < updatedEdits.min_capacity) {
      validationMsg = "Max Capacity must be ≥ Min Capacity.";
    }

    setValidationErrors(prev => {
      const next = { ...prev };
      if (validationMsg) {
        next[caId] = validationMsg;
      } else {
        delete next[caId];
      }
      return next;
    });

    setEdits(prev => ({
      ...prev,
      [caId]: updatedEdits,
    }));
  };

  // Submit update for a single row
  const saveRowChange = async (caId: string) => {
    const updatedValues = edits[caId];
    if (!updatedValues || validationErrors[caId]) return;

    try {
      setSavingRows(prev => ({ ...prev, [caId]: true }));
      
      const res = await fetch("/api/admin/capacity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: caId,
          system_name: updatedValues.system_name,
          min_capacity: updatedValues.min_capacity,
          max_capacity: updatedValues.max_capacity,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to save capacity");
      }

      setSaveSuccess(prev => ({ ...prev, [caId]: true }));
      setTimeout(() => {
        setSaveSuccess(prev => ({ ...prev, [caId]: false }));
      }, 3000);

      setEdits(prev => {
        const next = { ...prev };
        delete next[caId];
        return next;
      });

      setCas(prev => prev.map(ca => {
        if (ca.ca_id === caId) {
          return {
            ...ca,
            system_name: updatedValues.system_name || null,
            min_capacity: updatedValues.min_capacity,
            max_capacity: updatedValues.max_capacity,
          };
        }
        return ca;
      }));

    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingRows(prev => ({ ...prev, [caId]: false }));
    }
  };

  // Submit updates for all modified rows
  const saveAllChanges = async () => {
    const modifiedIds = Object.keys(edits);
    if (modifiedIds.length === 0) return;

    const hasErrors = modifiedIds.some(id => !!validationErrors[id]);
    if (hasErrors) {
      alert("Please resolve all validation errors before saving all changes.");
      return;
    }

    try {
      setBulkSaving(true);

      for (const caId of modifiedIds) {
        const updatedValues = edits[caId];
        if (!updatedValues) continue;

        const res = await fetch("/api/admin/capacity", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: caId,
            system_name: updatedValues.system_name,
            min_capacity: updatedValues.min_capacity,
            max_capacity: updatedValues.max_capacity,
          }),
        });

        if (!res.ok) {
          console.error(`Failed bulk save for ${caId}`);
        }
      }

      alert("All changes saved successfully!");
      await fetchCapacity();
    } catch (err: any) {
      alert(`Bulk update error: ${err.message}`);
    } finally {
      setBulkSaving(false);
    }
  };

  const modifiedCount = Object.keys(edits).length;

  // Unique team names for filter
  const uniqueTeams = teams.length > 0
    ? teams
    : Array.from(new Set(cas.map(c => c.team_name).filter(Boolean))).map(n => ({ id: n!, name: n! }));

  // Filtered data
  const filteredCas = cas.filter(row => {
    const matchesSearch =
      (row.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam =
      filterTeam === "all" || (row.team_name || "") === filterTeam;
    return matchesSearch && matchesTeam;
  });

  return (
    <AssignmentShell>
      <div className="space-y-8">
        {/* Page header controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Capacity Management</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Configure minimum and maximum client allocations and system names for Career Associates.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchCapacity} 
              disabled={loading || bulkSaving}
              className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button 
              onClick={saveAllChanges} 
              disabled={bulkSaving || modifiedCount === 0 || Object.keys(validationErrors).length > 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <Save className="h-4 w-4 mr-2" /> Save All ({modifiedCount})
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Search</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <Label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Team</Label>
              <div className="mt-1.5">
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
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
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => { setSearchTerm(""); setFilterTeam("all"); }}
                className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Manager Table Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 dark:text-indigo-400 mb-2" />
                <p className="text-slate-400 dark:text-slate-500 text-sm">Loading capacity configuration...</p>
              </div>
            ) : error ? (
              <div className="p-16 text-center">
                <p className="text-rose-500 font-medium">Failed to load capacity baseline</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{error}</p>
                <Button onClick={fetchCapacity} size="sm" variant="outline" className="mt-4 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Retry
                </Button>
              </div>
            ) : filteredCas.length === 0 ? (
              <div className="p-16 text-center">
                <Inbox className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No Career Associates found</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/60 dark:bg-slate-900/60">
                  <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium w-52">Name</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Email</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Team</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium">Designation</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium w-44">
                      System Name
                    </TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium text-center w-32">
                      <div className="flex items-center justify-center gap-1">
                        <span>Min Cap</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.minCapacity} />
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium text-center w-32">
                      <div className="flex items-center justify-center gap-1">
                        <span>Max Cap</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.maxCapacity} />
                      </div>
                    </TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-medium text-right w-44">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCas.map((row) => {
                    const caId = row.ca_id;
                    const isSaving = savingRows[caId] || false;
                    const hasSucceeded = saveSuccess[caId] || false;
                    const errorMsg = validationErrors[caId];

                    const editValues = edits[caId] || {
                      system_name: row.system_name || "",
                      min_capacity: row.min_capacity,
                      max_capacity: row.max_capacity,
                    };
                    const isModified = edits[caId] !== undefined;

                    return (
                      <TableRow 
                        key={caId} 
                        className={cn(
                          "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors",
                          isModified && !errorMsg && "bg-indigo-50/50 dark:bg-indigo-500/[0.02] border-l-2 border-l-indigo-400 dark:border-l-indigo-500",
                          errorMsg && "bg-rose-50/50 dark:bg-rose-500/[0.02] border-l-2 border-l-rose-400 dark:border-l-rose-500"
                        )}
                      >
                        {/* Name */}
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                              <User className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <span>{row.name || "N/A"}</span>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{row.email}</TableCell>

                        {/* Team Name */}
                        <TableCell>
                          {row.team_name ? (
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                              {row.team_name}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Designation */}
                        <TableCell>
                          <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 text-[10px] uppercase font-bold py-0.5">
                            {row.designation || "N/A"}
                          </Badge>
                        </TableCell>

                        {/* System Name (editable) */}
                        <TableCell>
                          <Input
                            type="text"
                            placeholder="e.g. System-A"
                            value={editValues.system_name}
                            onChange={(e) => handleValueChange(caId, 'system_name', e.target.value, row)}
                            className="w-36 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-8 text-xs font-mono"
                            disabled={isSaving || bulkSaving}
                          />
                        </TableCell>

                        {/* Min Capacity (editable) */}
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            value={editValues.min_capacity}
                            onChange={(e) => handleValueChange(caId, 'min_capacity', e.target.value, row)}
                            className="w-20 text-center bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-8 font-semibold"
                            disabled={isSaving || bulkSaving}
                          />
                        </TableCell>

                        {/* Max Capacity (editable) */}
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            value={editValues.max_capacity}
                            onChange={(e) => handleValueChange(caId, 'max_capacity', e.target.value, row)}
                            className="w-20 text-center bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-8 font-semibold"
                            disabled={isSaving || bulkSaving}
                          />
                        </TableCell>

                        {/* Row Actions & Validation Errors */}
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1 justify-center">
                            <div className="flex items-center gap-2">
                              {hasSucceeded && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4 shrink-0 animate-pulse" /> Saved
                                </span>
                              )}
                              {isModified && !errorMsg && (
                                <Button 
                                  size="sm" 
                                  onClick={() => saveRowChange(caId)}
                                  disabled={isSaving || bulkSaving}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                                >
                                  {isSaving ? "Saving..." : "Save"}
                                </Button>
                              )}
                            </div>
                            
                            {errorMsg && (
                              <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 mt-0.5 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-500/20 max-w-[240px] text-left">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500 dark:text-rose-400" />
                                {errorMsg}
                              </span>
                            )}
                          </div>
                        </TableCell>
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
