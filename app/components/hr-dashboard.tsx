"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Users, Download, Save, Search, ChevronLeft, ChevronRight, User,
  LogOut, Building2, FileSpreadsheet, Settings2, Plus, CheckCircle2,
  AlertCircle, Briefcase, Shield, UserPlus, Filter, Pencil,
  Bus, UtensilsCrossed, AlertTriangle, TrendingUp, Eye, EyeOff, LayoutDashboard, X, Check, Zap, ArrowUp, ArrowDown
} from "lucide-react"

interface HRDashboardProps {
  user: any
  onLogout: () => void
}

// Column definitions for bulk-apply and reference
const PAYROLL_COLUMNS = [
  { key: "unpaid_leave", label: "UnPaid Leave", icon: "📋", defaultValue: 0, prefix: "" },
  { key: "company_contribution", label: "Company Contribution", icon: "🏢", defaultValue: 800, prefix: "₹" },
  { key: "attendance_incentive", label: "Attendance Incentive", icon: "✅", defaultValue: 500, prefix: "₹" },
  { key: "food_allowance", label: "Food Allowance", icon: "🍽️", defaultValue: 0, prefix: "₹" },
  { key: "cab_deduction", label: "CAB Deduction", icon: "🚌", defaultValue: 500, prefix: "₹" },
  { key: "escalation_deduction", label: "Escalation Deduction", icon: "⚠️", defaultValue: 0, prefix: "₹" },
  { key: "food_allowance_deduction", label: "Food Allow. Deduction", icon: "🍽️❌", defaultValue: 0, prefix: "₹" },
  { key: "company_contribution_deduction", label: "Company Contr. Deduction", icon: "🏢❌", defaultValue: 800, prefix: "₹" },
]

export function HRDashboard({ user, onLogout }: HRDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [payrollData, setPayrollData] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [defaultFoodAllowance, setDefaultFoodAllowance] = useState(0)

  const [monthOffset, setMonthOffset] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active")

  const [isScrolled, setIsScrolled] = useState(false)
  const [showIncentives, setShowIncentives] = useState(false)
  const [activeTab, setActiveTab] = useState<"payroll" | "employees" | "settings">("payroll")

  // Incentive Breakdown Modal
  const [incentiveDetailsOpen, setIncentiveDetailsOpen] = useState(false)

  // Add Employee Dialog
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", employee_code: "", department: "", designation: "Trainee" })

  // Assign Code Dialog
  const [assignCodeOpen, setAssignCodeOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<any>(null)
  const [assignCodeValue, setAssignCodeValue] = useState("")

  // Edit employee dialog
  const [editEmpOpen, setEditEmpOpen] = useState(false)
  const [editEmpTarget, setEditEmpTarget] = useState<any>(null)
  const [editEmpData, setEditEmpData] = useState({ name: "", department: "", designation: "", is_active: true })

  // CSV Preview Dialog
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false)

  // Bulk Apply State
  const [bulkColumn, setBulkColumn] = useState("")
  const [bulkValue, setBulkValue] = useState("")
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set())
  const [bulkSortOrder, setBulkSortOrder] = useState<"emptyFirst" | "filledFirst">("emptyFirst")
  const [bulkDeptFilter, setBulkDeptFilter] = useState("all")
  const [bulkSearch, setBulkSearch] = useState("")

  // Settings
  const [tempFoodAllowance, setTempFoodAllowance] = useState("0")

  // Department-to-designation mapping
  const DEPT_DESIGNATIONS: Record<string, string[]> = {
    Sales: ["BDT-P", "BDT", "BDA", "SBDA", "Sales Head"],
    Marketing: ["Marketing", "Marketing Associate", "Trainee"],
    Resume: ["Resume Header", "Resume Associate", "Trainee"],
    Tech: ["Technical Head", "Technical Associate", "Trainee"],
    "Client Operations": ["CA", "Junior CA", "Team Lead", "Trainee"],
  }

  // Excluded departments (executives & IT have no salaries)
  const EXCLUDED_ROLES = ["CEO", "COO", "CRO", "CPO", "Admin", "SYSTEM", "HR"]
  const EXCLUDED_DEPARTMENTS_RAW = ["IT", "Executive"]

  // Unsaved changes tracking
  const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set())

  const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
  const getMonthName = () => targetDate.toLocaleString("default", { month: "long", year: "numeric" })

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const period = getMonthName()
      const res = await fetch(`/api/hr-payroll?period=${encodeURIComponent(period)}`)
      const data = await res.json()
      if (data.success) {
        setPayrollData(data.data || [])
        setSettings(data.settings || {})
        setDefaultFoodAllowance(data.defaultFoodAllowance || 0)
        setTempFoodAllowance(String(data.defaultFoodAllowance || 0))
        setDirtyRows(new Set())
      }
    } catch (e) {
      console.error("Failed to fetch HR data:", e)
    }
    setLoading(false)
  }, [monthOffset])

  useEffect(() => { fetchData() }, [fetchData])

  // Derived data — exclude executive/IT departments
  const departments = useMemo(() => {
    const deps = new Set<string>()
    payrollData.forEach(p => { if (p.department && !EXCLUDED_DEPARTMENTS_RAW.includes(p.department)) deps.add(p.department) })
    return Array.from(deps).sort()
  }, [payrollData])

  // Filter out executive/IT employees from payroll view and sort by Employee Code (Alphanumeric Ascending)
  const eligiblePayrollData = useMemo(() => {
    return payrollData
      .filter(row => {
        if (EXCLUDED_ROLES.includes(row.role)) return false
        if (EXCLUDED_DEPARTMENTS_RAW.includes(row.department)) return false
        return true
      })
      .sort((a, b) => {
        const codeA = a.employee_code || ""
        const codeB = b.employee_code || ""
        // Alphanumeric natural sort
        return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: "base" })
      })
  }, [payrollData])

  const filteredData = useMemo(() => {
    return eligiblePayrollData.filter(row => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!row.employee_name.toLowerCase().includes(q) &&
            !row.email.toLowerCase().includes(q) &&
            !(row.employee_code || "").toLowerCase().includes(q)) return false
      }
      if (departmentFilter !== "all" && row.department !== departmentFilter) return false
      if (statusFilter === "active" && !row.is_active) return false
      if (statusFilter === "inactive" && row.is_active) return false
      return true
    })
  }, [eligiblePayrollData, searchQuery, departmentFilter, statusFilter])

  // Bulk Apply: employees filtered by department and search for selection
  const bulkEmployees = useMemo(() => {
    const filtered = eligiblePayrollData.filter(r => {
      if (!r.is_active) return false

      // Deductions only make sense if the employee has the corresponding allowance/contribution
      if (bulkColumn === "food_allowance_deduction" && (!r.food_allowance || r.food_allowance <= 0)) return false;
      if (bulkColumn === "company_contribution_deduction" && (!r.company_contribution || r.company_contribution <= 0)) return false;

      if (bulkDeptFilter !== "all") {
        if (bulkDeptFilter === "Trainee") {
          const isTrainee = r.role === "BDT-P" || r.role.toLowerCase().includes("trainee")
          if (!isTrainee) return false
        } else {
          if (r.department !== bulkDeptFilter) return false
        }
      }
      if (bulkSearch) {
        const q = bulkSearch.toLowerCase()
        if (!r.employee_name.toLowerCase().includes(q) && !(r.employee_code || "").toLowerCase().includes(q)) return false
      }
      return true
    });

    if (!bulkColumn) return filtered;

    // Sort logically based on selected order toggle
    return filtered.sort((a, b) => {
      const valA = Number(a[bulkColumn]) || 0;
      const valB = Number(b[bulkColumn]) || 0;
      
      const aEmpty = valA <= 0;
      const bEmpty = valB <= 0;

      if (bulkSortOrder === "emptyFirst") {
        if (aEmpty && !bEmpty) return -1; // Empty bubbles to the top
        if (!aEmpty && bEmpty) return 1;  // Filled pushes to the bottom
      } else {
        if (!aEmpty && bEmpty) return -1; // Filled bubbles to the top
        if (aEmpty && !bEmpty) return 1;  // Empty pushes to the bottom
      }

      if (!aEmpty && !bEmpty) {
        if (valA !== valB) return valA - valB; // Ascending order among filled
      }
      
      return 0; // Maintain existing alphanumeric sorting for ties or empties
    });
  }, [eligiblePayrollData, bulkDeptFilter, bulkSearch, bulkColumn, bulkSortOrder])

  // Stats — use eligible data (excludes executives/IT)
  const totalEmployees = eligiblePayrollData.filter(r => r.is_active).length
  const savedCount = eligiblePayrollData.filter(r => r.is_saved).length
  const missingCodes = eligiblePayrollData.filter(r => r.is_active && !r.employee_code).length
  const totalIncentives = useMemo(() => {
    return eligiblePayrollData.reduce((s, r) => {
      const val = Number(r.productivity_incentive) || 0
      return s + Number(val.toFixed(2))
    }, 0)
  }, [eligiblePayrollData])

  // CSV preview data — uses eligible data
  const csvRows = useMemo(() => {
    return eligiblePayrollData.filter(r => r.is_active && r.employee_code).map(row => ({
      "Employee Code": row.employee_code,
      "Employee Name": row.employee_name,
      "UnPaid Leave": row.unpaid_leave,
      "Productivity Incentives": Number((row.productivity_incentive || 0).toFixed(2)),
      "Company Contribution": row.company_contribution,
      "Attendence Incentives": row.attendance_incentive,
      "FOOD ALLOWANCES": row.food_allowance,
      "CAB DEDUCTION": row.cab_deduction,
      "Escalation Policy Deduction": row.escalation_deduction,
      "FOOD ALLOWANCES DEDUCTION": row.food_allowance_deduction,
      "COMPANY CONTRIBUTION DEDUCTIONS": row.company_contribution_deduction,
    }))
  }, [eligiblePayrollData])

  // Inline edit handler — for number fields
  const updateField = (userId: string, field: string, value: string) => {
    const targetRow = payrollData.find(r => r.user_id === userId);
    if (!targetRow) return;
    const numVal = Number(value) || 0;

    // Safety validations
    if (field === "food_allowance_deduction" && numVal > (targetRow.food_allowance || 0)) {
      alert(`Deduction (₹${numVal}) cannot exceed Food Allowance (₹${targetRow.food_allowance || 0}).`);
      // Update cell back to old value to revert the local input state on blur
      setPayrollData([...payrollData]); 
      return;
    }
    if (field === "company_contribution_deduction" && numVal > (targetRow.company_contribution || 0)) {
      alert(`Deduction (₹${numVal}) cannot exceed Company Contribution (₹${targetRow.company_contribution || 0}).`);
      setPayrollData([...payrollData]);
      return;
    }
    if (field === "food_allowance" && numVal < (targetRow.food_allowance_deduction || 0)) {
      alert(`Food Allowance (₹${numVal}) cannot be less than its existing Deduction (₹${targetRow.food_allowance_deduction || 0}). Please lower the deduction first.`);
      setPayrollData([...payrollData]);
      return;
    }
    if (field === "company_contribution" && numVal < (targetRow.company_contribution_deduction || 0)) {
      alert(`Company Contribution (₹${numVal}) cannot be less than its existing Deduction (₹${targetRow.company_contribution_deduction || 0}).`);
      setPayrollData([...payrollData]);
      return;
    }

    if (targetRow[field] !== numVal) {
      setPayrollData(prev => prev.map(row => row.user_id === userId ? { ...row, [field]: numVal } : row));
      setDirtyRows(prev => new Set(prev).add(userId));
    }
  }

  // Inline edit handler — for text fields (employee_name)
  const updateTextField = (userId: string, field: string, value: string) => {
    setPayrollData(prev => prev.map(row => {
      if (row.user_id === userId) {
        return { ...row, [field]: value }
      }
      return row
    }))
    setDirtyRows(prev => new Set(prev).add(userId))
  }

  // Save all dirty rows
  const savePayroll = async () => {
    setSaving(true)
    try {
      const period = getMonthName()

      // 1. Save payroll numeric entries
      const entries = payrollData
        .filter(row => dirtyRows.has(row.user_id))
        .map(row => ({
          user_id: row.user_id,
          unpaid_leave: row.unpaid_leave,
          company_contribution: row.company_contribution,
          attendance_incentive: row.attendance_incentive,
          food_allowance: row.food_allowance,
          cab_deduction: row.cab_deduction,
          escalation_deduction: row.escalation_deduction,
          food_allowance_deduction: row.food_allowance_deduction,
          company_contribution_deduction: row.company_contribution_deduction,
        }))

      // 2. Save name edits (now handled via Edit Employee Dialog, so removed from bulk save)

      if (entries.length > 0) {
        const res = await fetch("/api/hr-payroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period, entries, nameEdits: [] })
        })
        const data = await res.json()
        if (!data.success) {
          alert("Save failed: " + (data.error || "Unknown error"))
          setSaving(false)
          return
        }
      }

      await fetchData()
    } catch (e: any) {
      alert("Save failed: " + e.message)
    }
    setSaving(false)
  }

  // Assign employee code
  const assignEmployeeCode = async () => {
    if (!assignTarget || !assignCodeValue.trim()) return
    try {
      const res = await fetch("/api/hr-payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_code", user_id: assignTarget.user_id, employee_code: assignCodeValue.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setAssignCodeOpen(false)
        setAssignCodeValue("")
        await fetchData()
      } else {
        alert(data.error || "Failed to assign code")
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    }
  }

  // Save employee details edit via API
  const saveEmployeeDetails = async () => {
    if (!editEmpTarget || !editEmpData.name.trim()) return
    try {
      const res = await fetch("/api/hr-payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "edit_employee", 
          user_id: editEmpTarget.user_id, 
          name: editEmpData.name.trim(),
          department: editEmpData.department,
          designation: editEmpData.designation,
          isactive: editEmpData.is_active
        })
      })
      const data = await res.json()
      if (data.success) {
        setEditEmpOpen(false)
        await fetchData()
      } else {
        alert(data.error || "Failed to update employee")
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    }
  }

  // Add employee
  const addEmployee = async () => {
    if (!newEmployee.name.trim() || !newEmployee.email.trim()) {
      alert("Name and email are required")
      return
    }
    try {
      const res = await fetch("/api/hr-payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_employee", ...newEmployee })
      })
      const data = await res.json()
      if (data.success) {
        setAddEmployeeOpen(false)
        setNewEmployee({ name: "", email: "", employee_code: "", department: "", designation: "Trainee" })
        await fetchData()
      } else {
        alert(data.error || "Failed to add employee")
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    }
  }

  // Save settings
  const saveSettings = async () => {
    try {
      const res = await fetch("/api/hr-payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          settings: { food_allowance_default: tempFoodAllowance }
        })
      })
      const data = await res.json()
      if (data.success) {
        await fetchData()
      } else {
        alert(data.error || "Failed to save settings")
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    }
  }

  // Bulk apply
  const executeBulkApply = () => {
    if (!bulkColumn || bulkValue === "" || bulkSelectedIds.size === 0) return
    const numVal = Number(bulkValue) || 0

    let hasErrors = false;
    let newDirtyRows = new Set(dirtyRows);

    setPayrollData(prev => prev.map(row => {
      if (bulkSelectedIds.has(row.user_id)) {
        // Run validations
        if (bulkColumn === "food_allowance_deduction" && numVal > (row.food_allowance || 0)) {
          hasErrors = true; return row;
        }
        if (bulkColumn === "company_contribution_deduction" && numVal > (row.company_contribution || 0)) {
          hasErrors = true; return row;
        }
        if (bulkColumn === "food_allowance" && numVal < (row.food_allowance_deduction || 0)) {
          hasErrors = true; return row;
        }
        if (bulkColumn === "company_contribution" && numVal < (row.company_contribution_deduction || 0)) {
          hasErrors = true; return row;
        }

        newDirtyRows.add(row.user_id);
        return { ...row, [bulkColumn]: numVal }
      }
      return row
    }))

    setDirtyRows(newDirtyRows);

    if (hasErrors) {
      alert("Some entries were skipped because the inputted value violates the rule: Allowances/Contributions must be greater than or equal to their Deductions.");
    } else {
      setBulkSelectedIds(new Set())
      setBulkValue("")
    }
  }

  // Toggle bulk select all for visible employees
  const toggleBulkSelectAll = (checked: boolean) => {
    if (checked) {
      const next = new Set(bulkSelectedIds);
      bulkEmployees.forEach(e => next.add(e.user_id));
      setBulkSelectedIds(next);
    } else {
      const next = new Set(bulkSelectedIds);
      bulkEmployees.forEach(e => next.delete(e.user_id));
      setBulkSelectedIds(next);
    }
  }

  // Toggle individual bulk select
  const toggleBulkSelect = (userId: string) => {
    const next = new Set(bulkSelectedIds)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    setBulkSelectedIds(next)
  }

  // CSV Export — Digisme format
  const exportToCSV = () => {
    const headers = [
      "Employee Code", "Employee Name", "UnPaid Leave", "Productivity Incentives",
      "Company Contribution", "Attendence Incentives", "FOOD ALLOWANCES",
      "CAB DEDUCTION", "Escalation Policy Deduction", "FOOD ALLOWANCES DEDUCTION",
      "COMPANY CONTRIBUTION DEDUCTIONS"
    ]
    const rows = csvRows.map(row => Object.values(row))
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Digisme_Payroll_${getMonthName().replace(/ /g, "_")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30">
      {/* ========== HEADER ========== */}
      <div className={`bg-white border-b border-slate-200 sticky top-0 z-50 transition-all duration-500 ${isScrolled ? 'shadow-lg' : 'shadow-sm'}`}>
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-2.5 rounded-xl shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`font-extrabold text-slate-900 tracking-tight transition-all ${isScrolled ? 'text-lg' : 'text-2xl'}`}>
                    HR Command Center
                  </h1>
                  <Badge className="bg-blue-100 text-blue-700 border-0 font-bold text-[10px]">{getMonthName()}</Badge>
                </div>
                {!isScrolled && <p className="text-xs text-slate-500 mt-0.5">Payroll Management & Digisme CSV Export</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-slate-300 font-semibold h-8" onClick={() => setMonthOffset(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button variant="default" size="sm" className="bg-slate-800 hover:bg-slate-900 shadow-md font-bold h-8" onClick={() => setMonthOffset(0)}>
                  This Month
                </Button>
                <Button variant="outline" size="sm" className="border-slate-300 font-semibold h-8" onClick={() => setMonthOffset(p => p + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 border-slate-200 h-9">
                    <div className="bg-slate-100 p-1 rounded-md"><User className="h-3.5 w-3.5 text-slate-600" /></div>
                    <span className="font-bold text-xs text-slate-700 hidden sm:block">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={onLogout} className="text-red-600 font-bold cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 py-6 space-y-6">
        {/* ========== KPI CARDS ========== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-slate-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2"><Users className="h-3.5 w-3.5 text-blue-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Employees</span></div>
              <p className="text-3xl font-black text-slate-800">{totalEmployees}</p>
              <p className="text-[10px] text-slate-400 mt-1">{departments.length} departments</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-slate-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entries Saved</span></div>
              <p className="text-3xl font-black text-emerald-600">{savedCount}<span className="text-lg text-slate-400">/{totalEmployees}</span></p>
              <p className="text-[10px] text-slate-400 mt-1">{Math.round((savedCount / Math.max(1, totalEmployees)) * 100)}% complete</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-slate-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Missing Codes</span></div>
              <p className="text-3xl font-black text-amber-600">{missingCodes}</p>
              <p className="text-[10px] text-slate-400 mt-1">employees without ID</p>
            </CardContent>
          </Card>
          <Card 
            className="border-0 shadow-sm bg-white rounded-2xl ring-1 ring-slate-100 overflow-hidden cursor-pointer hover:ring-violet-300 hover:bg-violet-50/30 transition-all group"
            onClick={() => setIncentiveDetailsOpen(true)}
          >
            <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-600 group-hover:from-violet-600 group-hover:to-violet-700" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-3.5 w-3.5 text-violet-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Incentive Pool</span></div>
              <p className={`text-3xl font-black text-violet-600 transition-all ${showIncentives ? '' : 'blur-md select-none'}`}>₹{totalIncentives.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-slate-400">productivity total</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowIncentives(!showIncentives); }} 
                  className="text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showIncentives ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========== TAB BAR ========== */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 w-fit">
            {(["payroll", "employees", "settings"] as const).map(tab => (
              <button key={tab} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} onClick={() => setActiveTab(tab)}>
                {tab === "payroll" && <><FileSpreadsheet className="h-3.5 w-3.5" /> Payroll Sheet</>}
                {tab === "employees" && <><Users className="h-3.5 w-3.5" /> Employee Registry</>}
                {tab === "settings" && <><Settings2 className="h-3.5 w-3.5" /> Controls</>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {dirtyRows.size > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold text-xs animate-pulse">
                {dirtyRows.size} unsaved
              </Badge>
            )}
            <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 h-9 shadow-sm" onClick={savePayroll} disabled={dirtyRows.size === 0 || saving}>
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2 h-9 border-slate-300 font-bold" onClick={() => setCsvPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5" /> Preview & Export CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse min-h-[400px]">
            <LayoutDashboard className="h-16 w-16 text-slate-300 mb-6" />
            <h3 className="text-xl font-bold text-slate-500">Loading Payroll Data...</h3>
          </div>
        ) : (
          <>
            {/* ========== PAYROLL TAB ========== */}
            {activeTab === "payroll" && (
              <Card className="border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
                {/* Toolbar */}
                <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-[350px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input placeholder="Search name, email, or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm border-slate-200" />
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[160px] h-9 text-xs font-bold">
                      <Filter className="h-3 w-3 mr-1 text-slate-400" /><SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-[130px] h-9 text-xs font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-slate-400 font-medium ml-auto">{filteredData.length} records</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800 hover:bg-slate-800">
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider py-3 pl-4 sticky left-0 bg-slate-800 z-10 w-[44px]">#</TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider sticky left-[44px] bg-slate-800 z-10 w-[70px]">Code</TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider sticky left-[114px] bg-slate-800 z-10 min-w-[200px]">Employee Name</TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider text-center w-[90px]"><div className="flex flex-col items-center leading-tight"><span>UnPaid</span><span className="text-slate-400 text-[8px]">Leave</span></div></TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider text-center w-[110px]"><div className="flex flex-col items-center leading-tight"><span>Productivity</span><span className="text-emerald-400 text-[8px]">Auto-Pulled</span></div></TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider text-center w-[110px]"><div className="flex flex-col items-center leading-tight"><span>Company</span><span className="text-slate-400 text-[8px]">Contribution</span></div></TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider text-center w-[110px]"><div className="flex flex-col items-center leading-tight"><span>Attendance</span><span className="text-slate-400 text-[8px]">Incentive</span></div></TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider text-center w-[110px]"><div className="flex flex-col items-center leading-tight"><UtensilsCrossed className="h-3 w-3 text-green-400 mx-auto" /><span>Food Allow.</span></div></TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider text-center w-[100px]"><div className="flex flex-col items-center leading-tight"><Bus className="h-3 w-3 text-blue-400 mx-auto" /><span>CAB Ded.</span></div></TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider text-center w-[110px]"><div className="flex flex-col items-center leading-tight"><AlertTriangle className="h-3 w-3 text-red-400 mx-auto" /><span>Escalation</span><span className="text-slate-400 text-[8px]">Deduction</span></div></TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider text-center w-[110px]"><div className="flex flex-col items-center leading-tight"><span>Food Allow.</span><span className="text-red-400 text-[8px]">Deduction</span></div></TableHead>
                        <TableHead className="text-white font-bold text-[10px] uppercase tracking-wider text-center pr-4 w-[120px]"><div className="flex flex-col items-center leading-tight"><span>Company Contr.</span><span className="text-red-400 text-[8px]">Deduction</span></div></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-16 text-slate-400">
                            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                            <p className="font-bold text-slate-500">No employees found</p>
                            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredData.map((row, idx) => {
                        const isDirty = dirtyRows.has(row.user_id)
                        return (
                          <TableRow key={row.user_id} className={`transition-colors border-b border-slate-50 ${isDirty ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'}`}>
                            <TableCell className="pl-4 text-xs text-slate-400 font-bold sticky left-0 bg-inherit z-10">{idx + 1}</TableCell>
                            <TableCell className="sticky left-[44px] bg-inherit z-10">
                              {row.employee_code ? (
                                <Badge className="bg-slate-100 text-slate-700 border-0 font-mono text-[10px] tracking-wide">{row.employee_code}</Badge>
                              ) : (
                                <button onClick={() => { setAssignTarget(row); setAssignCodeValue(""); setAssignCodeOpen(true) }} className="text-[10px] text-amber-600 font-bold hover:underline flex items-center gap-1">
                                  <Plus className="h-2.5 w-2.5" /> Assign
                                </button>
                              )}
                            </TableCell>
                            <TableCell className="sticky left-[114px] bg-inherit z-10">
                              <div className="flex items-center gap-2 group">
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-bold text-slate-800 text-xs leading-tight truncate">{row.employee_name}</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <Badge className={`text-[8px] border-0 font-bold ${
                                      row.department === 'Sales' ? 'bg-blue-50 text-blue-600' :
                                      row.department === 'Marketing' ? 'bg-pink-50 text-pink-600' :
                                      row.department === 'Resume' ? 'bg-indigo-50 text-indigo-600' :
                                      row.department === 'Tech' ? 'bg-cyan-50 text-cyan-600' :
                                      'bg-slate-50 text-slate-600'
                                    }`}>{row.department || 'N/A'}</Badge>
                                    {row.is_saved && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />}
                                  </div>
                                </div>
                                <button
                                  onClick={() => { setEditEmpTarget(row); setEditEmpData({ name: row.employee_name, department: row.department, designation: row.role, is_active: row.is_active }); setEditEmpOpen(true) }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500 shrink-0"
                                  title="Edit name"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="text-center"><EditCell value={row.unpaid_leave} userId={row.user_id} field="unpaid_leave" onUpdate={updateField} isDirty={isDirty} /></TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <span className={`text-sm font-black px-3 py-1 rounded-lg ${row.productivity_incentive > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-300 bg-slate-50'}`}>
                                  ₹{row.productivity_incentive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center"><EditCell value={row.company_contribution} userId={row.user_id} field="company_contribution" prefix="₹" onUpdate={updateField} isDirty={isDirty} /></TableCell>
                            <TableCell className="text-center"><EditCell value={row.attendance_incentive} userId={row.user_id} field="attendance_incentive" prefix="₹" onUpdate={updateField} isDirty={isDirty} /></TableCell>
                            <TableCell className="text-center"><EditCell value={row.food_allowance} userId={row.user_id} field="food_allowance" prefix="₹" onUpdate={updateField} isDirty={isDirty} /></TableCell>
                            <TableCell className="text-center"><EditCell value={row.cab_deduction} userId={row.user_id} field="cab_deduction" prefix="₹" onUpdate={updateField} isDirty={isDirty} /></TableCell>
                            <TableCell className="text-center"><EditCell value={row.escalation_deduction} userId={row.user_id} field="escalation_deduction" prefix="₹" onUpdate={updateField} isDirty={isDirty} /></TableCell>
                            <TableCell className="text-center"><EditCell value={row.food_allowance_deduction} userId={row.user_id} field="food_allowance_deduction" prefix="₹" onUpdate={updateField} isDirty={isDirty} /></TableCell>
                            <TableCell className="text-center pr-4"><EditCell value={row.company_contribution_deduction} userId={row.user_id} field="company_contribution_deduction" prefix="₹" onUpdate={updateField} isDirty={isDirty} /></TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Footer */}
                <div className="border-t border-slate-200 bg-slate-50/80 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-xs">
                    <span className="text-slate-500 font-medium">Showing <span className="font-black text-slate-700">{filteredData.length}</span></span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 font-medium">Missing Codes: <span className="font-black text-amber-600">{missingCodes}</span></span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 font-medium">Unsaved: <span className="font-black text-amber-600">{dirtyRows.size}</span></span>
                  </div>
                </div>
              </Card>
            )}

            {/* ========== EMPLOYEES TAB ========== */}
            {activeTab === "employees" && (
              <Card className="border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
                <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" /> Employee Registry
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black border-none ml-2">{payrollData.length}</Badge>
                  </CardTitle>
                  <Button size="sm" className="gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold h-8" onClick={() => setAddEmployeeOpen(true)}>
                    <UserPlus className="h-3.5 w-3.5" /> Add Employee
                  </Button>
                </CardHeader>
                <div className="p-4 bg-white border-b border-slate-50">
                  <div className="relative max-w-[350px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="py-3 pl-6 text-xs font-bold uppercase tracking-wider text-slate-400">#</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Code</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Employee</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Department</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Role</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row, idx) => (
                      <TableRow key={row.user_id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                        <TableCell className="pl-6 text-xs text-slate-400 font-bold">{idx + 1}</TableCell>
                        <TableCell>
                          {row.employee_code ? (
                            <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">{row.employee_code}</span>
                          ) : (
                            <span className="text-xs text-amber-500 font-bold">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">{row.employee_name}</span>
                            <span className="text-[10px] text-slate-400">{row.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] border-0 font-bold ${
                            row.department === 'Sales' ? 'bg-blue-50 text-blue-600' :
                            row.department === 'Marketing' ? 'bg-pink-50 text-pink-600' :
                            row.department === 'Resume' ? 'bg-indigo-50 text-indigo-600' :
                            row.department === 'Tech' ? 'bg-cyan-50 text-cyan-600' :
                            'bg-slate-50 text-slate-500'
                          }`}>{row.department || "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-center"><span className="text-xs font-bold text-slate-600">{row.role || "—"}</span></TableCell>
                        <TableCell className="text-center">
                          <Badge className={`border-0 text-[10px] font-bold ${row.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{row.is_active ? "Active" : "Inactive"}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setEditEmpTarget(row); setEditEmpData({ name: row.employee_name, department: row.department, designation: row.role, is_active: row.is_active }); setEditEmpOpen(true) }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            {!row.employee_code && (
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 font-bold" onClick={() => { setAssignTarget(row); setAssignCodeValue(""); setAssignCodeOpen(true) }}>
                                <Shield className="h-3 w-3" /> Assign Code
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* ========== CONTROLS TAB ========== */}
            {activeTab === "settings" && (
              <div className="space-y-6">

                {/* Bulk Apply Section */}
                <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2.5">
                      <div className="bg-gradient-to-br from-blue-500 to-violet-600 p-2 rounded-lg"><Zap className="h-4 w-4 text-white" /></div>
                      Bulk Apply — Batch Fill Column Data
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Select a column, enter the default value, pick employees, then apply. Changes appear instantly in the Payroll Sheet.</p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Step 1: Pick column and value */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Step 1 — Select Column</label>
                        <Select value={bulkColumn} onValueChange={(v) => { setBulkColumn(v); const col = PAYROLL_COLUMNS.find(c => c.key === v); if (col) setBulkValue(String(col.defaultValue)) }}>
                          <SelectTrigger className="h-11 font-bold border-slate-200"><SelectValue placeholder="Choose column..." /></SelectTrigger>
                          <SelectContent>
                            {PAYROLL_COLUMNS.map(col => (
                              <SelectItem key={col.key} value={col.key}>
                                <span className="mr-2">{col.icon}</span> {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Step 2 — Enter Value</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">{PAYROLL_COLUMNS.find(c => c.key === bulkColumn)?.prefix || ""}</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={bulkValue}
                            onChange={(e) => setBulkValue(e.target.value.replace(/[^0-9.]/g, ""))}
                            placeholder="0"
                            className="w-full h-11 rounded-md border border-slate-200 pl-7 pr-4 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
                          />
                        </div>
                        {bulkColumn && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {(() => { 
                              const presets: Record<string, number[]> = {
                                attendance_incentive: [0, 500],
                                company_contribution: [0, 800],
                                food_allowance: [0, 660, 4000],
                                cab_deduction: [0, 500],
                                food_allowance_deduction: [0, 660, 4000],
                                company_contribution_deduction: [0, 800],
                                escalation_deduction: [0, 599],
                                unpaid_leave: [0, 1, 2, 3],
                              }
                              return (presets[bulkColumn] || [0]).map(v => (
                                <button key={v} onClick={() => setBulkValue(String(v))} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${String(v) === bulkValue ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                                  {PAYROLL_COLUMNS.find(c => c.key === bulkColumn)?.prefix}{v.toLocaleString()}
                                </button>
                              ))
                            })()}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Filter by Dept</label>
                        <Select value={bulkDeptFilter} onValueChange={v => setBulkDeptFilter(v)}>
                          <SelectTrigger className="h-11 font-bold border-slate-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            <SelectItem value="Trainee">🎓 Trainees Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Step 3: Select employees */}
                    {bulkColumn && (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Step 3 — Select Employees
                            <Badge className="bg-blue-100 text-blue-600 border-0 font-black text-[10px]">{bulkSelectedIds.size} selected</Badge>
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-slate-200 rounded-md bg-white overflow-hidden shadow-sm">
                               <button 
                                 onClick={() => setBulkSortOrder("emptyFirst")} 
                                 className={`px-2 py-1 flex items-center justify-center transition-colors ${bulkSortOrder === "emptyFirst" ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                                 title="Empty Data First"
                               >
                                 <ArrowDown className="h-3.5 w-3.5" />
                               </button>
                               <div className="w-px h-4 bg-slate-200" />
                               <button 
                                 onClick={() => setBulkSortOrder("filledFirst")} 
                                 className={`px-2 py-1 flex items-center justify-center transition-colors ${bulkSortOrder === "filledFirst" ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                                 title="Filled Data First"
                               >
                                 <ArrowUp className="h-3.5 w-3.5" />
                               </button>
                            </div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                              <Checkbox checked={bulkEmployees.length > 0 && bulkEmployees.every(emp => bulkSelectedIds.has(emp.user_id))} onCheckedChange={(v) => toggleBulkSelectAll(!!v)} />
                              Select All ({bulkEmployees.length})
                            </label>
                          </div>
                        </div>
                        {/* Search box for employees */}
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search employees by name or code..."
                            value={bulkSearch}
                            onChange={(e) => setBulkSearch(e.target.value)}
                            className="w-full h-9 rounded-md border border-slate-200 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-2">
                          {bulkEmployees.map(emp => (
                            <label
                              key={emp.user_id}
                              className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                                bulkSelectedIds.has(emp.user_id) ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-slate-100 hover:border-blue-200'
                              }`}
                            >
                              <Checkbox checked={bulkSelectedIds.has(emp.user_id)} onCheckedChange={() => toggleBulkSelect(emp.user_id)} />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-slate-700 truncate">{emp.employee_name}</p>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[9px] text-slate-400 truncate">{emp.employee_code || emp.email}</p>
                                  {bulkColumn === "food_allowance_deduction" && (
                                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">Allowance: ₹{emp.food_allowance}</span>
                                  )}
                                  {bulkColumn === "company_contribution_deduction" && (
                                    <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 rounded">Contr: ₹{emp.company_contribution}</span>
                                  )}
                                </div>
                              </div>
                              {bulkColumn && (
                                <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap flex items-center gap-1 border ${emp[bulkColumn] > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                  {emp[bulkColumn] > 0 ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
                                  <span>{emp[bulkColumn] > 0 ? `${PAYROLL_COLUMNS.find(c => c.key === bulkColumn)?.prefix}${emp[bulkColumn].toLocaleString()}` : "To Fill"}</span>
                                </div>
                              )}
                            </label>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-400">
                            Will set <span className="font-bold text-slate-600">{PAYROLL_COLUMNS.find(c => c.key === bulkColumn)?.label}</span> to <span className="font-bold text-blue-600">{PAYROLL_COLUMNS.find(c => c.key === bulkColumn)?.prefix}{Number(bulkValue || 0).toLocaleString()}</span> for <span className="font-bold text-slate-600">{bulkSelectedIds.size}</span> employees
                          </p>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-sm"
                            onClick={executeBulkApply}
                            disabled={!bulkColumn || bulkValue === "" || bulkSelectedIds.size === 0}
                          >
                            <Zap className="h-3.5 w-3.5" /> Apply to {bulkSelectedIds.size} Employees
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Common Patterns Card */}
                <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600" /> Common Patterns (from CSV)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {[
                        { label: "Attendance Incentive", values: "₹0 or ₹500", color: "text-emerald-600" },
                        { label: "Company Contribution", values: "₹0 or ₹800", color: "text-blue-600" },
                        { label: "Food Allowance", values: "₹0, ₹660, or ₹4,000", color: "text-green-600" },
                        { label: "CAB Deduction", values: "₹0 or ₹500", color: "text-amber-600" },
                        { label: "Escalation Deduction", values: "₹0 or ₹599", color: "text-red-600" },
                        { label: "Food Allow. Deduction", values: "Mirrors Food Allowance", color: "text-slate-600" },
                        { label: "Company Contr. Deduction", values: "Mirrors Company Contribution", color: "text-slate-600" },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <span className="text-xs font-bold text-slate-600">{p.label}</span>
                          <span className={`text-xs font-black ${p.color}`}>{p.values}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-violet-600" /> Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button onClick={() => setAddEmployeeOpen(true)} className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-4 text-left transition-all group">
                        <UserPlus className="h-5 w-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-bold text-blue-800">Add New Employee</p>
                        <p className="text-[10px] text-blue-600 mt-0.5">Add trainees or new hires</p>
                      </button>
                      <button onClick={() => setCsvPreviewOpen(true)} className="bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl p-4 text-left transition-all group">
                        <Eye className="h-5 w-5 text-violet-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-bold text-violet-800">Preview & Export CSV</p>
                        <p className="text-[10px] text-violet-600 mt-0.5">Review data before downloading</p>
                      </button>
                      <button onClick={() => setActiveTab("payroll")} className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl p-4 text-left transition-all group">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-bold text-emerald-800">Open Payroll Sheet</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">Manually enter data per employee</p>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========== DIALOGS ========== */}

      {/* Assign Employee Code */}
      <Dialog open={assignCodeOpen} onOpenChange={setAssignCodeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black"><Shield className="h-5 w-5 text-slate-600" /> Assign Employee Code</DialogTitle>
            <DialogDescription>This code will be permanently linked to <span className="font-bold text-slate-900">{assignTarget?.employee_name}</span>.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Employee Code</label>
              <input placeholder="e.g. AW-001" value={assignCodeValue} onChange={(e) => setAssignCodeValue(e.target.value)} className="w-full h-12 text-lg font-mono font-bold text-center uppercase rounded-md border border-slate-200 outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400" />
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Duplicate codes will be rejected.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignCodeOpen(false)}>Cancel</Button>
            <Button className="bg-slate-800 text-white font-bold" onClick={assignEmployeeCode} disabled={!assignCodeValue.trim()}>Assign Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee */}
      <Dialog open={editEmpOpen} onOpenChange={setEditEmpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black"><Pencil className="h-5 w-5 text-blue-600" /> Edit Employee</DialogTitle>
            <DialogDescription>Update the employee's name, department, role, or active status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Employee Name *</label>
              <Input value={editEmpData.name} onChange={(e) => setEditEmpData(p => ({ ...p, name: e.target.value }))} className="w-full text-sm font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Department</label>
                <Select value={editEmpData.department} onValueChange={(v) => setEditEmpData(p => ({ ...p, department: v, designation: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Sales", "Marketing", "Resume", "Tech", "Client Operations"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Designation</label>
                <Select value={editEmpData.designation} onValueChange={(v) => setEditEmpData(p => ({ ...p, designation: v }))} disabled={!editEmpData.department}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {(DEPT_DESIGNATIONS[editEmpData.department] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2 pb-1">
              <Checkbox id="isActiveCheck" checked={editEmpData.is_active} onCheckedChange={(v) => setEditEmpData(p => ({ ...p, is_active: !!v }))} />
              <label htmlFor="isActiveCheck" className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Active Employee
              </label>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex justify-between items-center mt-2">
              <div>
                <p className="text-[10px] text-slate-500">Email: <span className="font-bold text-slate-700">{editEmpTarget?.email}</span></p>
                <p className="text-[10px] text-slate-500">Code: <span className="font-bold text-slate-700">{editEmpTarget?.employee_code || "Unassigned"}</span></p>
              </div>
              <Badge className={editEmpData.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                {editEmpData.is_active ? 'Status: Active' : 'Status: Inactive'}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmpOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 text-white font-bold" onClick={saveEmployeeDetails} disabled={!editEmpData.name.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employee */}
      <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black"><UserPlus className="h-5 w-5 text-blue-600" /> Add New Employee</DialogTitle>
            <DialogDescription>Add a trainee or new hire who isn't currently in the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Full Name *</label>
                <Input placeholder="John Doe" value={newEmployee.name} onChange={(e) => setNewEmployee(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Email *</label>
                <Input type="email" placeholder="john@company.com" value={newEmployee.email} onChange={(e) => setNewEmployee(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Employee Code</label>
                <Input placeholder="AW-001" value={newEmployee.employee_code} onChange={(e) => setNewEmployee(p => ({ ...p, employee_code: e.target.value }))} className="font-mono uppercase" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Department *</label>
                <Select value={newEmployee.department} onValueChange={(v) => setNewEmployee(p => ({ ...p, department: v, designation: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Sales", "Marketing", "Resume", "Tech", "Client Operations"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Designation *</label>
                <Select value={newEmployee.designation} onValueChange={(v) => setNewEmployee(p => ({ ...p, designation: v }))} disabled={!newEmployee.department}>
                  <SelectTrigger><SelectValue placeholder={newEmployee.department ? "Select role" : "Select dept first"} /></SelectTrigger>
                  <SelectContent>
                    {(DEPT_DESIGNATIONS[newEmployee.department] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEmployeeOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 text-white font-bold" onClick={addEmployee} disabled={!newEmployee.name.trim() || !newEmployee.email.trim()}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Preview Dialog */}
      <Dialog open={csvPreviewOpen} onOpenChange={setCsvPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <FileSpreadsheet className="h-5 w-5 text-violet-600" /> CSV Preview — {getMonthName()}
            </DialogTitle>
            <DialogDescription>
              Review {csvRows.length} records before downloading. Only active employees with codes are included.
              {missingCodes > 0 && <span className="text-amber-600 font-bold ml-1">({missingCodes} employees excluded — no code assigned)</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-xl border-slate-200 mt-2">
            <table className="w-full text-xs">
              <thead className="bg-slate-800 text-white sticky top-0 z-10">
                <tr>
                  {["#", "Employee Code", "Employee Name", "UnPaid Leave", "Prod. Incentives", "Company Contr.", "Attend. Incentives", "Food Allow.", "CAB Ded.", "Escalation Ded.", "Food Allow. Ded.", "Company Contr. Ded."].map((h, i) => (
                    <th key={i} className="py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-2 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2 px-2 font-mono font-bold text-slate-700">{row["Employee Code"]}</td>
                    <td className="py-2 px-2 font-bold text-slate-800">{row["Employee Name"]}</td>
                    <td className="py-2 px-2 text-center">{row["UnPaid Leave"]}</td>
                    <td className="py-2 px-2 text-center font-bold text-emerald-600">{Number(row["Productivity Incentives"]).toFixed(2)}</td>
                    <td className="py-2 px-2 text-center">{row["Company Contribution"]}</td>
                    <td className="py-2 px-2 text-center">{row["Attendence Incentives"]}</td>
                    <td className="py-2 px-2 text-center">{row["FOOD ALLOWANCES"]}</td>
                    <td className="py-2 px-2 text-center">{row["CAB DEDUCTION"]}</td>
                    <td className="py-2 px-2 text-center">{row["Escalation Policy Deduction"]}</td>
                    <td className="py-2 px-2 text-center">{row["FOOD ALLOWANCES DEDUCTION"]}</td>
                    <td className="py-2 px-2 text-center">{row["COMPANY CONTRIBUTION DEDUCTIONS"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">{csvRows.length} records ready for export</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCsvPreviewOpen(false)}>Close</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2" onClick={() => { exportToCSV(); setCsvPreviewOpen(false) }}>
                <Download className="h-4 w-4" /> Download Digisme CSV
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Incentive Breakdown Dialog */}
      <Dialog open={incentiveDetailsOpen} onOpenChange={setIncentiveDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <TrendingUp className="h-6 w-6 text-violet-600" /> Incentive Breakdown
            </DialogTitle>
            <DialogDescription>
              Employee-wise earned productivity incentives for {getMonthName()}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4 pr-1 custom-scrollbar">
            <div className="space-y-2">
              {eligiblePayrollData
                .filter(emp => emp.productivity_incentive > 0)
                .sort((a, b) => b.productivity_incentive - a.productivity_incentive)
                .map((emp, i) => (
                  <div key={emp.user_id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm leading-tight">{emp.employee_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{emp.employee_code || "No Code"}</span>
                          <Badge className="text-[8px] py-0 px-1 border-0 bg-slate-100 text-slate-500">{emp.department}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-violet-600">₹{emp.productivity_incentive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
              {eligiblePayrollData.filter(emp => emp.productivity_incentive > 0).length === 0 && (
                <div className="py-20 text-center space-y-3">
                  <LayoutDashboard className="h-12 w-12 text-slate-200 mx-auto" />
                  <p className="text-slate-400 font-bold">No incentives earned yet for this period.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pool</span>
                <span className="text-lg font-black text-violet-700">₹{totalIncentives.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <Button size="lg" className="bg-slate-800 hover:bg-slate-900 font-bold px-8" onClick={() => setIncentiveDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

/**
 * FIXED: Moved EditCell OUTSIDE of HRDashboard component.
 * Defining it inside was causing the component to be re-created on every render,
 * killing focus after only one character was entered.
 */
const EditCell = ({ 
  value, 
  userId, 
  field, 
  prefix = "", 
  onUpdate, 
  isDirty 
}: { 
  value: number; 
  userId: string; 
  field: string; 
  prefix?: string; 
  onUpdate: (id: string, f: string, v: string) => void;
  isDirty: boolean;
}) => (
  <div className="relative group">
    {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">{prefix}</span>}
    <input
      type="text"
      inputMode="numeric"
      value={value || ""}
      onFocus={(e) => { if (e.target.value === "0") e.target.value = "" }}
      onBlur={(e) => { if (e.target.value === "") onUpdate(userId, field, "0") }}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9.]/g, "")
        onUpdate(userId, field, v)
      }}
      className={`h-8 text-xs font-bold text-center w-[85px] rounded-md border transition-all outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 ${prefix ? 'pl-5' : ''} ${isDirty ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}
    />
  </div>
)
