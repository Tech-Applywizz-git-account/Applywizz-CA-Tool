"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Users, ChevronLeft, ChevronRight, Eye, ArrowUpCircle, Download } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CROSalesDashboardProps {
  basePath: string;
  user: any;
  onLogout: () => void;
}

export function CROSalesDashboard({ basePath, user, onLogout }: CROSalesDashboardProps) {
  const [salesReps, setSalesReps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Promotion Controls
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [targetRep, setTargetRep] = useState<any>(null);
  const [promoteRole, setPromoteRole] = useState("");
  // Derive a quick current month default
  const [promoteMonth, setPromoteMonth] = useState(new Date().toISOString().substring(0, 7));
  const [promoteLoading, setPromoteLoading] = useState(false);

  // Status Toggle Controls
  const [confirmRep, setConfirmRep] = useState<{ id: string, isActive: boolean, name: string } | null>(null);

  // Month toggles identical to CA logic
  const [monthOffset, setMonthOffset] = useState<number>(0)

  const fetchSalesUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, isactive, incentive_amount")
      .in("role", ["BDT-P", "BDT", "BDA", "SBDA"])

    if (!error && data) {
      setSalesReps(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSalesUsers()
  }, [])

  const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
  const getMonthName = () => targetDate.toLocaleString("default", { month: "long", year: "numeric" })

  const getIncentiveForMonth = (incentiveRaw: any) => {
    if (!incentiveRaw) return 0;
    try {
      const parsed = typeof incentiveRaw === 'string' ? JSON.parse(incentiveRaw) : incentiveRaw;
      return parsed[getMonthName()] || 0;
    } catch (e) {
      return 0;
    }
  }

  const handlePromote = async () => {
    if (!targetRep || !promoteRole || !promoteMonth) return;
    setPromoteLoading(true);
    try {
      const response = await fetch("/api/promote-sales-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetRep.id, newRole: promoteRole, effectiveMonth: promoteMonth })
      });
      const resData = await response.json();
      if (resData.success) {
        setPromoteOpen(false);
        fetchSalesUsers(); // Re-fetch all to sync view
      } else {
        alert(resData.error || "Failed to promote employee.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPromoteLoading(false);
    }
  }

  const handleToggleActive = async (repId: string, currentIsActive: boolean) => {
    const { data, error } = await supabase
      .from("users")
      .update({ isactive: !currentIsActive })
      .eq("id", repId)
      .select("id, isactive")
      .single()

    if (error) {
      alert("Failed to toggle active state: " + error.message)
      return
    }

    setSalesReps((prev) => prev.map((r) => (r.id === repId ? { ...r, isactive: data.isactive } : r)))
  }

  const filteredReps = salesReps.filter(rep => {
    if (!searchTerm.trim()) return true
    const t = searchTerm.toLowerCase()
    return rep.name?.toLowerCase().includes(t) || rep.email?.toLowerCase().includes(t) || rep.role?.toLowerCase().includes(t)
  })

  // Global totals based on filtered month
  const totalIncentives = filteredReps.reduce((sum, rep) => sum + getIncentiveForMonth(rep.incentive_amount), 0)

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Designation", "Status", `${getMonthName()} Incentives`];
    const csvRows = [headers.join(",")];

    filteredReps.forEach(rep => {
      const name = `"${(rep.name || "").replace(/"/g, '""')}"`;
      const email = `"${(rep.email || "").replace(/"/g, '""')}"`;
      const role = `"${(rep.role || "").replace(/"/g, '""')}"`;
      const status = `"${rep.isactive ? "Active" : "Inactive"}"`;
      const incentive = `"${getIncentiveForMonth(rep.incentive_amount)}"`;

      csvRows.push([name, email, role, status, incentive].join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Sales_Incentives_${getMonthName().replace(" ", "_")}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Toggle Status Context Modal */}
        <Dialog open={!!confirmRep} onOpenChange={() => setConfirmRep(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to{" "}
              <span className="font-semibold">
                {confirmRep?.isActive ? "set this representative as Inactive" : "set this representative as Active"}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setConfirmRep(null)}>Cancel</Button>
              <Button
                className={confirmRep?.isActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"}
                onClick={() => {
                  if (confirmRep) {
                    handleToggleActive(confirmRep.id, confirmRep.isActive)
                    setConfirmRep(null)
                  }
                }}
              >
                {confirmRep?.isActive ? "Yes, Set Inactive" : "Yes, Set Active"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Promotion Dialog Context Modal */}
        <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promote {targetRep?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-slate-500">Current active classification: <strong>{targetRep?.role}</strong></p>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Role Assignment</label>
                <Select value={promoteRole} onValueChange={setPromoteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BDT-P">BDT-P</SelectItem>
                    <SelectItem value="BDT">BDT</SelectItem>
                    <SelectItem value="BDA">BDA</SelectItem>
                    <SelectItem value="SBDA">SBDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Effective Boundary (YYYY-MM)</label>
                <Input
                  type="month"
                  value={promoteMonth}
                  onChange={(e) => setPromoteMonth(e.target.value)}
                />
                <p className="text-xs text-slate-500">The specific month when this role strictly inherits rules & evaluations from. Past periods will intelligently calculate securely off the older roles.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPromoteOpen(false)} disabled={promoteLoading}>Cancel</Button>
              <Button onClick={handlePromote} disabled={promoteLoading}>Apply Promotion</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex justify-between items-start mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sales Dashboard (Admin)</h1>
            <p className="text-slate-600">Track and manage complete Sales Team performances</p>
          </div>
          <div className="flex gap-4 items-center">
            <Button variant="outline" className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={exportToCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline">Profile</Button>
            <Button onClick={onLogout}>Logout</Button>
          </div>
        </div>

        {/* Month Filter */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Sales Period Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-4 items-center">
              <h2 className="text-md font-semibold text-slate-800 w-48">
                Month: <span className="text-blue-600">{getMonthName()}</span>
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMonthOffset((prev) => prev - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous Month
                </Button>
                <Button variant="default" onClick={() => setMonthOffset(0)}>
                  This Month
                </Button>
                <Button variant="outline" onClick={() => setMonthOffset((prev) => prev + 1)}>
                  Next Month <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Sales Reps</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{salesReps.length}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Reps</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{salesReps.filter(r => r.isactive).length}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Incentives ({getMonthName()})</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">₹{totalIncentives.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* User Search & Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <CardTitle className="text-lg">Sales Representatives Overview</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search reps by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>{getMonthName()} Incentives</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                          No sales representatives found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReps.map((rep) => (
                        <TableRow key={rep.id}>
                          <TableCell className="font-medium text-slate-800">{rep.name}</TableCell>
                          <TableCell className="text-slate-600">{rep.email}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800 border-none">{rep.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {rep.isactive ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-none mr-2">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="mr-2">Inactive</Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-300 text-xs py-0 h-6"
                              onClick={() => setConfirmRep({ id: rep.id, isActive: rep.isactive, name: rep.name })}
                            >
                              {rep.isactive ? "Set Inactive" : "Set Active"}
                            </Button>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-700">
                            ₹{getIncentiveForMonth(rep.incentive_amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => {
                                setTargetRep(rep);
                                setPromoteRole(rep.role);
                                setPromoteOpen(true);
                              }}
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-2" /> Promote
                            </Button>
                            <Link href={`${basePath}/sales/${rep.id}`}>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" /> View Board
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
