"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Flame, Zap, PlusCircle, Undo2, RotateCcw, Clock, Target, Activity, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface BoosterNightManagerProps {
  monthName: string;
  targetDate: Date;
  userEmail: string;
  onCycleChange?: () => void;
}

type BoosterCycle = {
  id: string;
  start_time: string;
  end_time: string;
  multiplier: number;
  target: string;
  month: string;
  status: string;
  created_by: string | null;
  created_at: string;
  reverted_at: string | null;
}

export function BoosterNightManager({ monthName, targetDate, userEmail, onCycleChange }: BoosterNightManagerProps) {
  const [cycles, setCycles] = useState<BoosterCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [undoConfirmId, setUndoConfirmId] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  // Form state for new booster cycle
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formMultiplier, setFormMultiplier] = useState(1.5);
  const [formTarget, setFormTarget] = useState("both");

  const viewDate = useMemo(() => new Date(targetDate.getFullYear(), targetDate.getMonth() + monthOffset, 1), [targetDate, monthOffset]);
  const monthKey = useMemo(() => `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`, [viewDate]);
  const viewMonthName = useMemo(() => viewDate.toLocaleString("default", { month: "long", year: "numeric" }), [viewDate]);

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/booster-night-cycles?month=${monthKey}`);
      const data = await res.json();
      if (data.success) {
        setCycles(data.cycles || []);
      }
    } catch (e) {
      console.error("Failed to fetch booster cycles:", e);
    }
    setLoading(false);
  }, [monthKey]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const activeCycles = cycles.filter(c => c.status === "active");
  const revertedCycles = cycles.filter(c => c.status === "reverted");

  const handleCreate = async () => {
    if (!formStart || !formEnd) {
      alert("Please specify both start and end times.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/booster-night-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: formStart,
          end_time: formEnd,
          multiplier: formMultiplier,
          target: formTarget,
          month: monthKey,
          created_by: userEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateOpen(false);
        setFormStart("");
        setFormEnd("");
        setFormMultiplier(1.5);
        setFormTarget("both");
        await fetchCycles();
        onCycleChange?.();
      } else {
        alert("Failed to create booster cycle: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setSaving(false);
  };

  const handleRevert = async (id: string) => {
    try {
      const res = await fetch("/api/booster-night-cycles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "revert" }),
      });
      const data = await res.json();
      if (data.success) {
        setUndoConfirmId(null);
        await fetchCycles();
        onCycleChange?.();
      } else {
        alert("Failed to revert: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch("/api/booster-night-cycles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "restore" }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCycles();
        onCycleChange?.();
      } else {
        alert("Failed to restore: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
      timeZone: "Asia/Kolkata",
    }) + " IST";
  };

  const isCurrentlyActive = (cycle: BoosterCycle) => {
    if (cycle.status !== "active") return false;
    const now = Date.now();
    return now >= new Date(cycle.start_time).getTime() && now <= new Date(cycle.end_time).getTime();
  };

  const isUpcoming = (cycle: BoosterCycle) => {
    if (cycle.status !== "active") return false;
    return Date.now() < new Date(cycle.start_time).getTime();
  };

  const isExpired = (cycle: BoosterCycle) => {
    if (cycle.status !== "active") return false;
    return Date.now() > new Date(cycle.end_time).getTime();
  };

  return (
    <Card className="border-0 shadow-xl overflow-hidden ring-1 ring-slate-200/50 bg-white rounded-xl">
      {/* Header */}
      <CardHeader className="bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 text-white py-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        <div className="absolute top-0 right-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl shadow-inner bg-orange-500/20 border border-orange-500/30">
              <Flame className="h-7 w-7 text-orange-300" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-white">
                Incentive Accelerator
                <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold uppercase tracking-widest text-[10px]">Multi-Cycle</Badge>
              </CardTitle>
              <p className="text-sm mt-1.5 font-medium max-w-lg leading-relaxed text-indigo-200/90">
                Manage multiple booster night activations for any month. Each cycle applies its own multiplier independently.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Month navigation */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 border border-white/20">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-white/70 hover:bg-white/10" onClick={() => setMonthOffset(p => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-sm font-bold text-white px-3">{viewMonthName}</span>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-white/70 hover:bg-white/10" onClick={() => setMonthOffset(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/30 gap-2"
              onClick={() => {
                // Default to the 1st of the viewed month at 20:00 IST
                const y = viewDate.getFullYear();
                const m = String(viewDate.getMonth() + 1).padStart(2, '0');
                const defaultStart = `${y}-${m}-01T20:00`;
                const defaultEnd = `${y}-${m}-01T19:59`;
                setFormStart(defaultStart);
                setFormEnd(defaultEnd);
                setCreateOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" /> New Accelerator Window
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 md:p-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-semibold">Loading booster cycles...</p>
          </div>
        ) : (
          <>
            {/* Active Cycles Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Flame className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Active Cycles</p>
                    <p className="text-3xl font-black text-orange-700">{activeCycles.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Undo2 className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reverted</p>
                    <p className="text-3xl font-black text-slate-600">{revertedCycles.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total This Month</p>
                    <p className="text-3xl font-black text-emerald-700">{cycles.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Cycles Table */}
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-orange-500" /> Active Booster Cycles — {viewMonthName}
              </h3>
              {activeCycles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Flame className="h-12 w-12 text-slate-200 mb-4" />
                  <p className="text-slate-500 font-bold text-lg">No Active Booster Cycles</p>
                  <p className="text-slate-400 text-sm mt-1">Click "New Booster Night" to create one for {viewMonthName}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead className="font-bold text-slate-600 text-xs uppercase">#</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase">Status</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase">Start Time</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase">End Time</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase text-center">Multiplier</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase text-center">Target</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase">Created</TableHead>
                        <TableHead className="font-bold text-slate-600 text-xs uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCycles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((cycle, i) => {
                        const live = isCurrentlyActive(cycle);
                        const upcoming = isUpcoming(cycle);
                        const expired = isExpired(cycle);
                        return (
                          <TableRow key={cycle.id} className={`transition-colors ${live ? 'bg-orange-50/60 hover:bg-orange-100/40' : 'hover:bg-slate-50'}`}>
                            <TableCell className="font-black text-slate-500">{i + 1}</TableCell>
                            <TableCell>
                              {live && (
                                <Badge className="bg-orange-500 text-white font-bold text-[10px] gap-1 animate-pulse border-none">
                                  <Zap className="h-2.5 w-2.5" /> LIVE
                                </Badge>
                              )}
                              {upcoming && (
                                <Badge className="bg-blue-100 text-blue-700 font-bold text-[10px] gap-1 border-none">
                                  <Clock className="h-2.5 w-2.5" /> Upcoming
                                </Badge>
                              )}
                              {expired && (
                                <Badge className="bg-slate-100 text-slate-500 font-bold text-[10px] gap-1 border-none">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Completed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-slate-700">{formatDateTime(cycle.start_time)}</TableCell>
                            <TableCell className="text-sm font-semibold text-slate-700">{formatDateTime(cycle.end_time)}</TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-amber-100 text-amber-700 font-black border-none text-sm">{cycle.multiplier}x</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`font-bold text-[10px] uppercase border-none ${
                                cycle.target === 'both' ? 'bg-purple-100 text-purple-700' :
                                cycle.target === 'slab' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>{cycle.target}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-400">{formatDateTime(cycle.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 gap-1 font-bold text-xs"
                                onClick={() => setUndoConfirmId(cycle.id)}
                              >
                                <Undo2 className="h-3 w-3" /> Undo
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Reverted Cycles History */}
            {revertedCycles.length > 0 && (
              <div>
                <h3 className="text-base font-black text-slate-600 flex items-center gap-2 mb-4">
                  <Undo2 className="h-5 w-5 text-slate-400" /> Reverted Cycles History
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/60">
                        <TableHead className="font-bold text-slate-500 text-xs uppercase">#</TableHead>
                        <TableHead className="font-bold text-slate-500 text-xs uppercase">Start</TableHead>
                        <TableHead className="font-bold text-slate-500 text-xs uppercase">End</TableHead>
                        <TableHead className="font-bold text-slate-500 text-xs uppercase text-center">Multiplier</TableHead>
                        <TableHead className="font-bold text-slate-500 text-xs uppercase text-center">Target</TableHead>
                        <TableHead className="font-bold text-slate-500 text-xs uppercase">Reverted At</TableHead>
                        <TableHead className="font-bold text-slate-500 text-xs uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revertedCycles.sort((a, b) => new Date(b.reverted_at || b.created_at).getTime() - new Date(a.reverted_at || a.created_at).getTime()).map((cycle, i) => (
                        <TableRow key={cycle.id} className="opacity-70 hover:opacity-100 transition-opacity">
                          <TableCell className="font-black text-slate-400">{i + 1}</TableCell>
                          <TableCell className="text-sm text-slate-500 line-through">{formatDateTime(cycle.start_time)}</TableCell>
                          <TableCell className="text-sm text-slate-500 line-through">{formatDateTime(cycle.end_time)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-slate-100 text-slate-500 font-bold border-none">{cycle.multiplier}x</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-slate-100 text-slate-500 font-bold text-[10px] uppercase border-none">{cycle.target}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400">{cycle.reverted_at ? formatDateTime(cycle.reverted_at) : "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1 font-bold text-xs"
                              onClick={() => handleRestore(cycle.id)}
                            >
                              <RotateCcw className="h-3 w-3" /> Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Create New Booster Night Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
                <Flame className="h-5 w-5 text-white" />
              </div>
              New Accelerator Window
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Creating for: <span className="text-amber-600">{viewMonthName}</span></p>
                <p className="text-xs mt-1 text-amber-600">Sales made during this window will have their revenue multiplied. Click "Sync Rankings" in the leaderboard after creating to apply.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Start Date & Time <span className="text-orange-500 font-normal normal-case">(IST)</span></label>
                <Input type="datetime-local" value={formStart} onChange={e => setFormStart(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">End Date & Time <span className="text-orange-500 font-normal normal-case">(IST)</span></label>
                <Input type="datetime-local" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Multiplier</label>
                <Input type="number" step="0.1" min="1" value={formMultiplier} onChange={e => setFormMultiplier(Number(e.target.value))} className="h-10 font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Apply To</label>
                <Select value={formTarget} onValueChange={setFormTarget}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Target" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slab">Slab Incentive Only</SelectItem>
                    <SelectItem value="daily">Daily Bonus Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold gap-2 shadow-lg"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...
                </span>
              ) : (
                <><Flame className="h-4 w-4" /> Activate Accelerator Window</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo Confirmation Dialog */}
      <Dialog open={!!undoConfirmId} onOpenChange={() => setUndoConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Undo2 className="h-5 w-5" /> Revert Booster Cycle?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            This will mark this booster night cycle as <strong>reverted</strong>. Sales that fell within this window will no longer receive the multiplier when you next "Sync Rankings".
          </p>
          <p className="text-xs text-slate-400">You can restore it later from the Reverted History section.</p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setUndoConfirmId(null)}>Cancel</Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white font-bold gap-2"
              onClick={() => undoConfirmId && handleRevert(undoConfirmId)}
            >
              <Undo2 className="h-4 w-4" /> Revert Window
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
