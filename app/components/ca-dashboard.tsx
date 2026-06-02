//app/components/ca-dashboard.tsx

"use client"

import type React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Users, UserCheck, TrendingUp, Award, Calendar, User, Upload, FileCheck, X, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState, useMemo, useRef } from "react"
import Papa from "papaparse"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CADashboardProps {
  user: any
  onLogout: () => void
  viewerMode?: boolean
  forceCAId?: string
  clientLinkPrefix?: string
}

function PermissionOverlay({
  show,
  message = "You don't have permission to view",
  children,
}: {
  show: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        className={show ? "pointer-events-none select-none blur-sm" : ""}
        aria-hidden={show}
        {...(show ? { inert: '' as any } : {})}
      >
        {children}
      </div>
      {show && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-sm text-slate-800">
          <div className="rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-sm font-medium shadow-sm">
            {message}
          </div>
        </div>
      )}
    </div>
  );
}


export function CADashboard({ user, onLogout, viewerMode = false, forceCAId, clientLinkPrefix }: CADashboardProps) {
  const [currentView, setCurrentView] = useState<"myself" | "onbehalf">("myself")
  const [selectedCA, setSelectedCA] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [actionClient, setActionClient] = useState<any>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionEmail, setActionEmail] = useState("")
  const [assessmentType, setAssessmentType] = useState<string>("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [jobRole, setJobRole] = useState("")
  const [appliedDate, setAppliedDate] = useState("")
  const [assessmentReceivedDate, setAssessmentReceivedDate] = useState("")
  const [emailUrl, setEmailUrl] = useState("")
  const [roundsCount, setRoundsCount] = useState<number>(0)
  const [rounds, setRounds] = useState<{ type: string; file: File | null }[]>([])
  const [trackingMode, setTrackingMode] = useState<"daily" | "monthly">("daily")
  const today = new Date().toISOString().split("T")[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [clients, setClients] = useState<any[]>([]) // fetch from Supabase
  const [incentive, setIncentive] = useState<any>(null) // fetch from Supabase
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [Loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvRows, setCsvRows] = useState<CSVRow[]>([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importNote, setImportNote] = useState<string>("")
  const [totalWorkingDays, setTotalWorkingDays] = useState<number>(0);
  const [showEarnings, setShowEarnings] = useState(false)
  const [monthOffset, setMonthOffset] = useState<number>(0)
  const [visSettings, setVisSettings] = useState<any>(null)

  const shouldShowOverlay = useMemo(() => {
    const loggedInUserStr = typeof window !== "undefined" ? localStorage.getItem("loggedInUser") : null
    const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : user
    const role = loggedInUser?.role || "CA"

    const isAdmin = ["CRO", "CEO", "COO", "CPO", "System Admin"].includes(role)
    if (isAdmin) return false // Admins bypass everything

    if (!visSettings) return true // Hide until settings load

    if (role === "Team Lead") {
      if (!visSettings.team_lead_incentive_visibility) return true
    } else {
      if (!visSettings.ca_incentive_visibility) return true
    }

    const now = new Date()
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const monthKey = targetDate.toISOString().substring(0, 7) // "YYYY-MM"

    const allowedMonths = visSettings.visible_months || []
    if (!allowedMonths.includes(monthKey)) {
      return true
    }

    return false
  }, [visSettings, monthOffset, user])

  useEffect(() => {
    const channel = supabase
      .channel("realtime-visibility-settings-ca")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incentive_visibility_settings",
        },
        async () => {
          try {
            const visRes = await fetch("/api/incentive-visibility")
            const visData = await visRes.json()
            if (visData.success) {
              setVisSettings(visData.settings)
            }
          } catch (err) {
            console.error("Failed to refetch settings in realtime:", err)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  const fmtDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }
  const [workHistory, setWorkHistory] = useState<any[]>([])

  const [datePage, setDatePage] = useState(0);   // which date “page” you’re on
  const [daysPerPage, setDaysPerPage] = useState(1); // how many dates per page (default 1)
  const effectiveCaId = currentView === "myself" ? user.id : (selectedCA || user.id);
  const isOnBehalfMode = !viewerMode && currentView === "onbehalf" && effectiveCaId !== user.id;

  useEffect(() => {
    if (viewerMode && forceCAId) {
      setCurrentView("onbehalf")
      setSelectedCA(forceCAId)
    }
  }, [viewerMode, forceCAId])

  // --- Work history flat rows (for the table) ---
  type FlatWHRow = {
    date: string
    name: string
    designation: string
    emails: number
    jobs: number
    start: string | null
    end: string | null
    durationMin: number | null
    status: string
    client_id?: string
  }

  const flatWHRows = useMemo<FlatWHRow[]>(() => {
    const rows: FlatWHRow[] = []

    for (const wh of workHistory || []) {
      // completed_profiles can be JSON or text-JSON; normalize to array
      let completed = wh?.completed_profiles
      if (typeof completed === "string") {
        try { completed = JSON.parse(completed) } catch { completed = [] }
      }
      if (!Array.isArray(completed)) continue

      for (const p of completed) {
        const startISO = p?.start_time || null
        const endISO = p?.end_time || null

        let durationMin: number | null = null
        if (startISO && endISO) {
          const st = new Date(startISO).getTime()
          const et = new Date(endISO).getTime()
          if (!isNaN(st) && !isNaN(et)) durationMin = Math.max(0, Math.round((et - st) / 60000))
        }

        rows.push({
          date: wh?.date, // yyyy-mm-dd from DB
          name: p?.name ?? "-",
          designation: p?.client_designation ?? "-",
          emails: Number(p?.emails_submitted ?? 0),
          jobs: Number(p?.jobs_applied ?? 0),
          start: startISO,
          end: endISO,
          durationMin,
          status: p?.status ?? "-",
          client_id: p?.client_id || p?.id
        })
      }
    }

    // Sort: newest date first, then latest end time
    rows.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      const ae = a.end ? new Date(a.end).getTime() : 0
      const be = b.end ? new Date(b.end).getTime() : 0
      return ae < be ? 1 : -1
    })

    return rows
  }, [workHistory])

  // Incentives summed per date for the effective CA
  const incentivesByDate = useMemo(() => {
    const map = new Map<string, number>();
    if (shouldShowOverlay) return map;
    for (const wh of workHistory || []) {
      // ensure we only count the effective CA
      if (wh?.ca_id !== effectiveCaId) continue;

      const d = wh?.date as string | undefined;
      const v = Number(wh?.incentives ?? 0);
      if (!d || Number.isNaN(v) || !Number.isFinite(v)) continue;

      map.set(d, (map.get(d) ?? 0) + v);
    }
    return map;
  }, [workHistory, effectiveCaId, shouldShowOverlay]);

  // Total incentives for the dates currently visible on the page
  
  // Unique dates in desc order (newest first)
  const uniqueDatesDesc = useMemo(() => {
    const s = new Set((flatWHRows || []).map(r => r.date));
    return Array.from(s).sort((a, b) => (a < b ? 1 : -1));
  }, [flatWHRows]);
  
  // Total pages (each page shows N dates)
  const totalDatePages = useMemo(() => {
    if (!uniqueDatesDesc.length) return 1;
    return Math.ceil(uniqueDatesDesc.length / Math.max(1, daysPerPage));
  }, [uniqueDatesDesc, daysPerPage]);
  
  // Clamp page when deps change
  useEffect(() => {
    setDatePage(p => Math.min(Math.max(0, p), Math.max(0, totalDatePages - 1)));
  }, [totalDatePages]);
  
  
  // Dates visible on the current page
  const datesOnPage = useMemo(() => {
    const start = datePage * Math.max(1, daysPerPage);
    const end = Math.min(start + Math.max(1, daysPerPage), uniqueDatesDesc.length);
    return uniqueDatesDesc.slice(start, end);
  }, [uniqueDatesDesc, datePage, daysPerPage]);
  
  const pageIncentiveTotal = useMemo(() => {
    let sum = 0;
    for (const d of datesOnPage) {
      sum += incentivesByDate.get(d) ?? 0;
    }
    return sum;
  }, [datesOnPage, incentivesByDate]);
  // Rows visible for those dates (keeps original sort)
  const visibleRows = useMemo(() => {
    const set = new Set(datesOnPage);
    return flatWHRows.filter(r => set.has(r.date));
  }, [flatWHRows, datesOnPage]);

  // time/date formatters (IST)
  const fmtDateLabel = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })

  const fmtTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString("en-IN", { hour12: true, hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "-"

  // Pretty “page label”, e.g. “26 Aug 2025” or “26–25 Aug 2025”
  const pageLabel = useMemo(() => {
    if (datesOnPage.length === 0) return "—";
    const nice = (d: string) => fmtDateLabel(d);
    if (datesOnPage.length === 1) return nice(datesOnPage[0]);
    return `${nice(datesOnPage[0])} → ${nice(datesOnPage[datesOnPage.length - 1])}`;
  }, [datesOnPage]);

  // Given an offset, return [startOfMonth, startOfNextMonth] as YYYY-MM-DD
  const getMonthRange = (offset: number) => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const next = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
    return { start: fmtDate(start), end: fmtDate(next) }
  }

  function chunk<T>(arr: T[], size = 400): T[][] {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }

  type CSVRow = {
    email: string
    name?: string | null
    status?: string | null
    assigned_ca_name?: string | null
    assigned_ca_id?: string | null
    team_id?: string | null
    team_lead_name?: string | null
    client_designation?: string | null
  }

  const handlePickCSV = () => fileInputRef.current?.click()


  const handleCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    setImportNote("Parsing CSV…")

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors?.length) console.warn("CSV parse warnings:", errors)

        // Normalize + dedupe by email
        const clean = data
          .map((r) => ({
            email: (r.email || "").trim().toLowerCase(),
            name: r.name?.trim() || null,
            status: r.status?.trim() || "Not Started",
            assigned_ca_name: r.assigned_ca_name?.trim() || null,
            assigned_ca_id: r.assigned_ca_id?.trim() || null,
            team_id: r.team_id?.trim() || null,
            team_lead_name: r.team_lead_name?.trim() || null,
            client_designation: r.client_designation?.trim() || null,
          }))
          .filter((r) => r.email) // must have email

        const seen = new Set<string>()
        const deduped: CSVRow[] = []
        for (const row of clean) {
          if (!seen.has(row.email)) {
            deduped.push(row)
            seen.add(row.email)
          }
        }

        setCsvFile(file)
        setCsvRows(deduped)
        setParsing(false)
        setImportNote(`Parsed ${deduped.length} row(s).`)
      },
    })
  }

  const clearCSV = () => {
    setCsvFile(null)
    setCsvRows([])
    setImportNote("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleImportSubmit = async () => {
    if (!csvRows.length) return
    setImporting(true)
    setImportNote("Importing…")

    // Build payload — omit fields when empty (avoid null overwrites)
    const payload = csvRows.map((r) => {
      const row: any = {
        email: r.email,
        status: r.status ?? "Not Started",
        assigned_ca_id: r.assigned_ca_id || user.id,
      }
      if (r.name) row.name = r.name
      if (r.assigned_ca_name) row.assigned_ca_name = r.assigned_ca_name
      if (r.team_id) row.team_id = r.team_id
      if (r.team_lead_name) row.team_lead_name = r.team_lead_name
      if (r.client_designation) row.client_designation = r.client_designation
      // IMPORTANT: we do NOT set date_assigned at all
      return row
    })

    let ok = 0, fail = 0
    for (const slice of chunk(payload, 400)) {
      const { error } = await supabase
        .from("clients")
        .upsert(slice, { onConflict: "email" }) // uses your unique(email)
        .select("id")

      console.log(slice);
      if (error) {
        console.error("Upsert error:", error)
        fail += slice.length
      } else {
        ok += slice.length
      }
    }

    setImportNote(`Done. Upserted: ${ok}, failed: ${fail}.`)
    setImporting(false)

    // Refresh current list for the visible CA
    const caId = currentView === "myself" ? user.id : (selectedCA || user.id)
    const { data: refreshed, error: refreshErr } = await supabase
      .from("clients")
      .select("*")
      .eq("assigned_ca_id", caId)
    if (!refreshErr) setClients(refreshed || [])
  }

  // Fetch clients for the effective CA and the current month offset
  const fetchClientsForView = async () => {
    const caId = currentView === "myself" ? user.id : (selectedCA || user.id)
    const { start, end } = getMonthRange(monthOffset)
    // console.log("bhanu",start,end)
    // const { data, error } = await supabase
    //   .from("clients")
    //   .select("*")
    //   .eq("assigned_ca_id", caId)
const { data, error } = await supabase
  .from("clients")
  .select("*")
  .eq("assigned_ca_id", caId)
  .order("is_active", { ascending: false });  // ACTIVE FIRST



    if (!error) setClients(data || [])
  }

  // Fetch work history for the effective CA and active month window
  const fetchWorkHistory = async () => {
    try {
      const caId = currentView === "myself" ? user.id : (selectedCA || user.id)
      const { start, end } = getMonthRange(monthOffset) // uses the helpers above

      const { data, error } = await supabase
        .from("work_history")
        .select("*, completed_profiles:work_history_profiles(*)")
        .eq("ca_id", caId)
        .gte("date", start)   // date is a DATE column
        .lt("date", end)      // end-exclusive

      if (error) {
        console.error("work_history fetch error:", error)
        return
      }

      const workingDays = [...new Set(data?.map(item => item.date))].length;
      setTotalWorkingDays(workingDays)
      console.log('working days', workingDays)
      console.log("work_history fetch:", monthlyWHIncentive)

      // Save to state and also log to console for verification
      setWorkHistory(data || [])
      // console.log("[work_history] monthOffset:", monthOffset, "range:", start, "→", end)
      // console.table(data || [])
    } catch (e) {
      console.error("work_history fetch exception:", e)
    }
  }

  // --- Total emails_submitted for the month (from work_history.completed_profiles) ---
  const monthlyEmailsSubmitted = useMemo(() => {
    let total = 0;

    for (const wh of workHistory || []) {
      let arr = wh?.completed_profiles;

      // Normalize text-JSON to array
      if (typeof arr === "string") {
        try { arr = JSON.parse(arr); } catch { arr = []; }
      }
      if (!Array.isArray(arr)) continue;

      for (const p of arr) {
        const n = Number(p?.emails_submitted);
        if (!Number.isNaN(n) && Number.isFinite(n) && n > 0) {
          total += n;
        }
      }
    }

    return total;
  }, [workHistory]);


  useEffect(() => {
    const bootstrap = async () => {
      const userId = user.id

      // Fetch visibility settings first
      try {
        const visRes = await fetch("/api/incentive-visibility")
        const visData = await visRes.json()
        if (visData.success) {
          setVisSettings(visData.settings)
        }
      } catch (err) {
        console.error(err)
      }

      // Incentive (current user, current calendar month) via secure backend API
      const startOfMonthISO = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const loggedInUserStr = typeof window !== "undefined" ? localStorage.getItem("loggedInUser") : null
      const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : user

      try {
        const incRes = await fetch(`/api/incentives?userId=${userId}&month=${encodeURIComponent(startOfMonthISO)}&requesterId=${loggedInUser.id}`)
        const incData = await incRes.json()
        if (incData.success && incData.data && incData.data.length > 0) {
          setIncentive(incData.data[0])
        } else {
          setIncentive(null)
        }
      } catch (err) {
        console.error("Failed to fetch incentives via secure API:", err)
        setIncentive(null)
      }

      // Team members in same team (excluding self)
      const { data: teamData } = await supabase
        .from("users")
        .select("id, name, email")
        .or("role.eq.Junior CA,role.eq.CA,role.eq.Trainee,role.eq.Career Associative Trainee")
        .order("name", { ascending: true })
      // .eq("team_id", user.team_id)
      // .neq("id", user.id)
      setTeamMembers(teamData || [])
      await fetchClientsForView?.()  // <-- if you have it; otherwise ignore this line

      // Initial month-scoped work history
      await fetchWorkHistory()
    }

    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.team_id])

  useEffect(() => {
    // Month-aware refetch for clients and work history
    fetchClientsForView()
    fetchWorkHistory()

    const fetchIncentiveForMonth = async () => {
      const caId = currentView === "myself" ? user.id : (selectedCA || user.id)
      const now = new Date()
      const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
      const targetMonthISO = targetDate.toISOString()
      const loggedInUserStr = typeof window !== "undefined" ? localStorage.getItem("loggedInUser") : null
      const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : user

      try {
        const incRes = await fetch(`/api/incentives?userId=${caId}&month=${encodeURIComponent(targetMonthISO)}&requesterId=${loggedInUser.id}`)
        const incData = await incRes.json()
        if (incData.success && incData.data && incData.data.length > 0) {
          setIncentive(incData.data[0])
        } else {
          setIncentive(null)
        }
      } catch (err) {
        console.error("Failed to fetch monthly incentive:", err)
        setIncentive(null)
      }
    }
    fetchIncentiveForMonth()
  }, [selectedCA, currentView, monthOffset])

  useEffect(() => {
    const fetchBaseSalary = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('base_salary')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setBaseSalary(data.base_salary || 0);
      }
    };
    fetchBaseSalary();
  }, [user.id]);

  const handleStatusUpdate = async (
    clientId: string,
    newStatus: string,
    reason?: string,
    emailsSent?: number,
    jobsApplied?: number,
  ) => {
    // Shared fields for any status change
    const baseUpdate: any = {
      status: newStatus,
      emails_submitted: emailsSent ?? 0,
      jobs_applied: jobsApplied ?? 0,
      last_update: new Date().toISOString().split("T")[0],
      work_done_by: user.id,
      work_done_ca_name: user.name,
      remarks: reason || "",
    };

    // 1) Persist shared fields
    const { error: updateError } = await supabase
      .from("clients")
      .update(baseUpdate)
      .eq("id", clientId);

    if (updateError) {
      alert(`Error updating client: ${updateError.message}`);
      return;
    }

    // 2) Time control branches
    if (newStatus === "Started") {
      // Set start_time only if it's not already set; also clear any stale end_time
      const { error: startErr } = await supabase
        .from("clients")
        .update({
          start_time: new Date().toISOString(),
          end_time: null,
        })
        .eq("id", clientId)
        .is("start_time", null); // <- protects existing start

      if (startErr) {
        alert(`Error setting start time: ${startErr.message}`);
        return;
      }
    }

    if (newStatus === "Paused" || newStatus === "Completed") {
      // Freeze the clock on Pause or Completed
      const { error: endErr } = await supabase
        .from("clients")
        .update({ end_time: new Date().toISOString() })
        .eq("id", clientId);

      if (endErr) {
        alert(`Error setting end time: ${endErr.message}`);
        return;
      }
    }

    // 3) Update local state so UI reflects start/end right away
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;

        // Start with the base updates we already wrote to DB
        const next = {
          ...client,
          ...baseUpdate,
        } as any;

        if (newStatus === "Started") {
          // Only set start_time locally if it wasn't already set
          if (!client.start_time) {
            next.start_time = new Date().toISOString();
            next.end_time = null;
          }
        }

        if (newStatus === "Paused" || newStatus === "Completed") {
          next.end_time = new Date().toISOString();
        }

        return next;
      })
    );

    setStatusUpdateOpen(false);
    alert("Status updated successfully!");
  };

  const isSubmitDisabled = useMemo(() => {
    if (isSubmittingAction) return true;
    
    // Core fields required for all assessment types
    if (
      !actionEmail ||
      !assessmentType ||
      !companyName ||
      !jobRole ||
      !appliedDate ||
      !assessmentReceivedDate ||
      !screenshotFile
    ) {
      return true;
    }

    // Subject, body, and URL are required for all types except offer_letter
    if (assessmentType !== "offer_letter") {
      if (!emailSubject || !emailBody || !emailUrl) {
        return true;
      }
    }

    if (assessmentType === "offer_letter") {
      if (rounds.length !== roundsCount) return true;
    }
    return false;
  }, [
    isSubmittingAction,
    actionEmail,
    assessmentType,
    companyName,
    jobRole,
    appliedDate,
    emailSubject,
    emailBody,
    assessmentReceivedDate,
    screenshotFile,
    emailUrl,
    rounds,
    roundsCount
  ]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionClient) return;
    if (isSubmitDisabled) {
      alert("Please fill all the required fields.");
      return;
    }

    setIsSubmittingAction(true);
    let screenshotUrl = "";

    try {
      if (screenshotFile) {
        const fileExt = screenshotFile.name.split(".").pop();
        const fileName = `${actionClient.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("assessment-screenshots")
          .upload(fileName, screenshotFile);

        if (uploadError) {
          throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("assessment-screenshots")
          .getPublicUrl(fileName);

        screenshotUrl = publicUrlData.publicUrl;
      }

      // Insert record into client_assessments table
      const { data: offerData, error: insertError } = await supabase
        .from("client_assessments")
        .insert({
          client_id: actionClient.id,
          applywizz_id: actionClient.applywizz_id || null,
          client_email: actionEmail,
          assessment_type: assessmentType,
          email_subject: emailSubject,
          email_body: emailBody,
          screenshot_url: screenshotUrl || null,
          company_name: companyName || null,
          job_role: jobRole || null,
          applied_date: appliedDate || null,
          assessment_received_date: assessmentReceivedDate || null,
          email_url: emailUrl || null,
          created_by: user.id,
          ca_name: user.name,
          ca_email: user.email
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(`Failed to save action record: ${insertError.message}`);
      }

      // If assessmentType is offer_letter, insert rounds mapping back to parent
      if (assessmentType === "offer_letter" && roundsCount > 0 && offerData) {
        const parentId = offerData.id;
        for (let i = 0; i < rounds.length; i++) {
          const round = rounds[i];
          let roundScreenshotUrl = "";
          if (round.file) {
            const rFileExt = round.file.name.split(".").pop();
            const rFileName = `${actionClient.id}-round-${i + 1}-${Date.now()}.${rFileExt}`;
            
            const { error: rUploadError } = await supabase.storage
              .from("assessment-screenshots")
              .upload(rFileName, round.file);

            if (rUploadError) {
              throw new Error(`Failed to upload round ${i + 1} screenshot: ${rUploadError.message}`);
            }

            const { data: rPublicUrlData } = supabase.storage
              .from("assessment-screenshots")
              .getPublicUrl(rFileName);

            roundScreenshotUrl = rPublicUrlData.publicUrl;
          }

          const { error: rInsertError } = await supabase
            .from("client_assessments")
            .insert({
              client_id: actionClient.id,
              applywizz_id: actionClient.applywizz_id || null,
              client_email: actionEmail,
              assessment_type: round.type || "assessment",
              email_subject: `Round ${i + 1}${round.type ? ` (${round.type})` : ""}: ${companyName} - ${jobRole}`,
              email_body: `Assessment record for Round ${i + 1} of selection process.`,
              screenshot_url: roundScreenshotUrl || null,
              company_name: companyName || null,
              job_role: jobRole || null,
              applied_date: appliedDate || null,
              assessment_received_date: assessmentReceivedDate || null,
              email_url: emailUrl || null,
              created_by: user.id,
              ca_name: user.name,
              ca_email: user.email,
              parent_id: parentId
            });

          if (rInsertError) {
            throw new Error(`Failed to save round ${i + 1} record: ${rInsertError.message}`);
          }
        }
      }

      alert("Client action recorded successfully!");
      setActionDialogOpen(false);
      // Reset form state
      setAssessmentType("");
      setEmailSubject("");
      setEmailBody("");
      setScreenshotFile(null);
      setCompanyName("");
      setJobRole("");
      setAppliedDate("");
      setAssessmentReceivedDate("");
      setEmailUrl("");
      setRoundsCount(0);
      setRounds([]);
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Sum of incentives from work_history for the active CA and month
  const rawMonthlyWHIncentive = (workHistory || []).reduce((sum, r) => {
    const v = Number(r?.incentives ?? 0)
    return sum + (isNaN(v) ? 0 : v)
  }, 0)
  const monthlyWHIncentive = shouldShowOverlay ? 0 : rawMonthlyWHIncentive;
  // console.log('viv3',monthlyWHIncentive)
  const computedEarnings = useMemo(() => {
    if (!totalWorkingDays || totalWorkingDays <= 0) return null
    const perDay = monthlyWHIncentive / totalWorkingDays

    if (user.designation === "CA") {
      if (perDay <= 0) return null
      if (perDay <= 1) return (Math.round(perDay * 100) * 4500) / 100
      return (((Math.round((perDay - 1) * 100)) * 4000) / 100) + 4500
    } else {
      if (perDay <= 0) return null
      if (perDay <= 1) return (Math.round(perDay * 100) * 2000) / 100
      if (perDay <= 2) return (((Math.round((perDay - 1) * 100)) * 2500) / 100) + 2000
      if (perDay <= 3) return (((Math.round((perDay - 1) * 100)) * 3500) / 100) + 4500
      return (((Math.round((perDay - 1) * 100)) * 3000) / 100) + 8000
    }
  }, [monthlyWHIncentive, totalWorkingDays, user.designation])

  // Get the month name based on monthOffset
  const getMonthName = () => {
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    return target.toLocaleString("default", { month: "long" })
  }

  // ---- Time helpers (IST) ----
  const fmtIST = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-IN", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
      : "—";

  const calcDurationLabel = (startISO?: string | null, endISO?: string | null) => {
    if (!startISO) return "—";
    const st = new Date(startISO).getTime();
    if (Number.isNaN(st)) return "—";

    // If there's no end, show "In progress (Xm)" relative to now
    if (!endISO) {
      const now = Date.now();
      const mins = Math.max(0, Math.round((now - st) / 60000));
      return `In progress (${mins} min)`;
    }

    const et = new Date(endISO).getTime();
    if (Number.isNaN(et) || et < st) return "—";

    const mins = Math.round((et - st) / 60000);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">CA Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user.name}!</p>
          </div>

          {isOnBehalfMode && (
            <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-3 py-1.5 text-sm inline-block">
              Viewing On Behalf — restricted sections will be hidden.
            </div>
          )}

          {!viewerMode && (
            <div className="flex items-center gap-3">
              {/* Hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                title="CSV file input"
                placeholder="Choose a CSV file"
                onChange={handleCSVChange}
              />

              {/* Import CSV control */}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handlePickCSV} disabled={parsing || importing}>
                  <Upload className="h-4 w-4 mr-2" />
                  {csvFile ? "Choose another CSV" : "Import CSV"}
                </Button>

                {csvFile && (
                  <>
                    <Badge variant="secondary" className="px-2 py-1">
                      <FileCheck className="h-3.5 w-3.5 mr-1" />
                      {csvRows.length} record{csvRows.length !== 1 ? "s" : ""}
                    </Badge>
                    {/* console.log(csv) */}
                    <Button size="sm" onClick={handleImportSubmit} disabled={importing || parsing || csvRows.length === 0}>
                      {importing ? "Submitting…" : "Submit"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={clearCSV} aria-label="Clear selected CSV">
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 rounded-full h-10 w-10 flex items-center justify-center bg-black">
                      <User className="h-6 w-6 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar & Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2"></div>
              <h2 className="text-lg font-semibold mb-2">
                Month: {getMonthName()}
              </h2>
              <div>
                <Button
                  onClick={() => setMonthOffset((prev) => prev - 1)}
                  disabled={parsing || importing}
                >
                  Previous Month
                </Button>
              </div>
              <div>
                <Button
                  onClick={() => setMonthOffset(0)}
                  disabled={parsing || importing}
                >
                  This Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toggle View */}
        {!viewerMode && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Work Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <Button
                  variant={currentView === "myself" ? "default" : "outline"}
                  onClick={() => {
                    setCurrentView("myself")
                    setSelectedCA("")   // <-- Reset to empty so self-fetch triggers
                  }}
                >
                  🌟 Myself
                </Button>

                <Button
                  variant={currentView === "onbehalf" ? "default" : "outline"}
                  onClick={() => setCurrentView("onbehalf")}
                >
                  👥 On Behalf of Someone
                </Button>
                {currentView === "onbehalf" && (
                  <div className="flex items-center gap-2">
                    <Select value={selectedCA} onValueChange={setSelectedCA}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Choose team member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={user.id}>🌟 {user.name} (Myself)</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Badge variant="secondary">Performance credit goes to selected CA</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">

          {/* top Card: Performance Snapshot */}
          <PermissionOverlay show={shouldShowOverlay || isOnBehalfMode}>
            <Card>
              {user.role !== 'Career Associative Trainee' && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getMonthName()} Month: Total Incentive
                    </CardTitle>

                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-green-600">
                        ₹
                        {showEarnings ? (
                          user.designation === 'CA' ? (
                            (0 >= (monthlyWHIncentive / totalWorkingDays)) ? (
                              <span className="text-red-600">No Earnings</span>
                            ) : (
                              (1 >= (monthlyWHIncentive / totalWorkingDays)) ? (
                                <span>{(Math.round((monthlyWHIncentive / totalWorkingDays) * 100) * 4500) / 100}</span>
                              ) : (
                                <span>{(((Math.round(((monthlyWHIncentive / totalWorkingDays) - 1) * 100)) * 4000) / 100) + 4500}</span>
                              )
                            )
                          ) : (
                            (0 >= (monthlyWHIncentive / totalWorkingDays)) ? (
                              <span className="text-red-600">No Earnings</span>
                            ) : (
                              (1 >= (monthlyWHIncentive / totalWorkingDays)) ? (
                                <span>{(Math.round((monthlyWHIncentive / totalWorkingDays) * 100) * 2000) / 100}</span>
                              ) : (
                                (2 >= (monthlyWHIncentive / totalWorkingDays)) ? (
                                  <span>{(((Math.round(((monthlyWHIncentive / totalWorkingDays) - 1) * 100)) * 2500) / 100) + 2000}</span>
                                ) : (
                                  (3 >= (monthlyWHIncentive / totalWorkingDays)) ? (
                                    <span>{(((Math.round(((monthlyWHIncentive / totalWorkingDays) - 2) * 100)) * 3500) / 100) + 4500}</span>
                                  ) : (
                                    <span>{(((Math.round(((monthlyWHIncentive / totalWorkingDays) - 3) * 100)) * 3000) / 100) + 8000}</span>
                                  )
                                )
                              )
                            )
                          )
                        ) : (
                          <span className="select-none">•••••</span>
                        )}
                      </p>
                      {/* Toggle button */}
                      <button
                        type="button"
                        onClick={() => setShowEarnings((v) => !v)}
                        className="ml-2 text-slate-600 hover:text-slate-800"
                        title={showEarnings ? "Hide earnings" : "Show earnings"}
                      >
                        {showEarnings ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </CardContent>
                  <hr className="border-slate-900 m-2" />
                </>
              )}

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm text-slate-600">Base Salary</Label>
                    <p className="text-2xl font-bold text-green-600">₹{user.role === 'Career Associative Trainee' ? '5,000' : baseSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">Designation</Label>
                    <p className="text-lg font-semibold">{user.designation}</p>
                  </div>
                   {user.role !== 'Career Associative Trainee' && (
                    <div>
                      <Label className="text-sm text-slate-600">Badge</Label>
                      <p className="text-lg">{incentive ? incentive.badge : "No Badge"}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-slate-600">Total Profile Count <br /> <span className="text-xs text-slate-400">(sum of profile count - This month)</span> </Label>
                    <p className="text-lg font-semibold text-green-600">{flatWHRows.length}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600"> Average profile count <br /> <span className="text-xs text-slate-400">(sum of profile count / total working days={totalWorkingDays})</span></Label>
                    <p className="text-lg font-semibold text-green-600">{((flatWHRows.length) / totalWorkingDays).toFixed(2)}</p>
                  </div>
                  {user.role !== 'Career Associative Trainee' && (
                    <div>
                      <Label className="text-sm text-slate-600">Incentive profile count <br /> <span className="text-xs text-slate-400">(sum of incentive profile count - Mandatory profiles ({user.designation === "CA" ? "4" : "2"}))</span></Label>
                      <p className="text-xl font-bold text-blue-600">
                        {(monthlyWHIncentive / totalWorkingDays).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-slate-600">
                      Emails Submitted (This Month)
                      <br />
                      <span className="text-xs text-slate-400">
                        (sum of emails_submitted from completed profiles in Work History)
                      </span>
                    </Label>
                    <p className="text-xl font-bold text-indigo-600">
                      {monthlyEmailsSubmitted.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600">
                      Average Emails Submitted (This Month)
                      <br />
                      <span className="text-xs text-slate-400">
                        (sum of emails_submitted from completed profiles in Work History/ total working days={totalWorkingDays})
                      </span>
                    </Label>
                    <p className="text-xl font-bold text-indigo-600">
                      {(monthlyEmailsSubmitted / totalWorkingDays).toLocaleString()}
                    </p>
                  </div>
                </div>

                {user.role !== 'Career Associative Trainee' && incentive?.badge && (
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      🏅 {incentive.badge}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </PermissionOverlay>
          {/* bottom Card: Client List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Is Active</TableHead>
                    {/* NEW */}
                    <TableHead>Start (IST)</TableHead>
                    <TableHead>End (IST)</TableHead>
                    <TableHead className="text-right">Total</TableHead>

                    {/* <TableHead>Action</TableHead> */}
                    {!viewerMode && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {clientLinkPrefix ? (
                          <Link
                            href={`${clientLinkPrefix}${client.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {client.name}
                          </Link>
                        ) : (
                          client.name
                        )}
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.status === "Completed"
                              ? "default"
                              : client.status === "Started"
                                ? "secondary"
                                : client.status === "Paused"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {client.status}
                        </Badge>

                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            client.is_active
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }
                        >
                          {client.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell>{fmtIST(client.start_time)}</TableCell>
                      <TableCell>{fmtIST(client.end_time)}</TableCell>
                      <TableCell className="text-right">
                        {calcDurationLabel(client.start_time, client.end_time)}
                      </TableCell>
                      {!viewerMode ? (
                        <TableCell className="space-x-2">
                          <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedClient(client)}
                                disabled={client.is_active === false}
                                title={client.is_active === false ? "Client is inactive. Contact your Team Lead." : ""}
                              >
                                {client.is_active === false ? "Inactive" : "Update Status"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white">
                              <DialogHeader>
                                <DialogTitle>Update Client Status</DialogTitle>
                              </DialogHeader>
                              <StatusUpdateForm client={selectedClient} onUpdate={handleStatusUpdate} />
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                            onClick={() => {
                              setActionClient(client)
                              setActionEmail(client.email || "")
                              setAssessmentType("")
                              setEmailSubject("")
                              setEmailBody("")
                              setScreenshotFile(null)
                              setEmailUrl("")
                              setRoundsCount(0)
                              setRounds([])
                              setActionDialogOpen(true)
                            }}
                            title="Manage Assessments/Interviews/Offer Letters"
                          >
                            Action
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        {/* Work History Table */}
        <PermissionOverlay show={isOnBehalfMode}>
          <Card className="mb-6">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                Daily Work History
                <Badge variant="secondary">{flatWHRows.length} record{flatWHRows.length !== 1 ? "s" : ""}</Badge>
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDatePage(p => Math.max(0, p - 1))}
                  disabled={datePage === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>

                <div className="px-2 text-sm text-slate-600">
                  Page <span className="font-medium">{Math.min(datePage + 1, totalDatePages)}</span> of{" "}
                  <span className="font-medium">{totalDatePages}</span> • <span className="font-medium">{pageLabel}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDatePage(p => Math.min(totalDatePages - 1, p + 1))}
                  disabled={datePage >= totalDatePages - 1}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                <Select value={String(daysPerPage)} onValueChange={(v) => setDaysPerPage(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Days/page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day / page</SelectItem>
                    <SelectItem value="3">3 days / page</SelectItem>
                    <SelectItem value="7">7 days / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-slate-700">
                Incentive {pageLabel}:{" "}
                <span className="font-semibold text-green-700">
                  {user.role === 'Career Associative Trainee' ? '0' : pageIncentiveTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Date</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead className="text-right">Emails Received</TableHead>
                      <TableHead className="text-right">Jobs Applied</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-slate-500">
                          No work history found for this selection.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleRows.map((r, idx) => (
                        <TableRow key={`${r.date}-${idx}`}>
                          <TableCell>
                            <div className="font-medium">{fmtDateLabel(r.date)}</div>
                            <div className="text-xs text-muted-foreground">{r.date}</div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {clientLinkPrefix && r.client_id ? (
                              <Link href={`${clientLinkPrefix}${r.client_id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                {r.name}
                              </Link>
                            ) : (
                              r.name
                            )}
                          </TableCell>
                          <TableCell>{r.designation}</TableCell>
                          <TableCell className="text-right">{r.emails}</TableCell>
                          <TableCell className="text-right">{r.jobs}</TableCell>
                          <TableCell>{fmtTime(r.start)}</TableCell>
                          <TableCell>{fmtTime(r.end)}</TableCell>
                          <TableCell className="text-right">
                            {r.durationMin !== null ? `${r.durationMin} min` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                r.status === "Completed"
                                  ? "default"
                                  : r.status === "Started"
                                    ? "secondary"
                                    : r.status === "Paused"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </PermissionOverlay>
      </div>

      {/* Action Dialog Form */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Client Action</DialogTitle>
          </DialogHeader>
          {actionClient && (
            <form onSubmit={handleActionSubmit} className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label htmlFor="action-email" className="text-sm font-medium">
                  Client Email
                </Label>
                <Input
                  id="action-email"
                  type="email"
                  value={actionEmail}
                  onChange={(e) => setActionEmail(e.target.value)}
                  placeholder="Enter client email"
                  className="mt-1"
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="assessment-type" className="text-sm font-medium">
                  Assessment Type
                </Label>
                <Select value={assessmentType} onValueChange={setAssessmentType}>
                  <SelectTrigger className="w-full mt-1" id="assessment-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="screening_call">Screening call</SelectItem>
                    <SelectItem value="offer_letter">Offer letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {assessmentType && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-name" className="text-sm font-medium">
                        Company Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="company-name"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Google"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="job-role" className="text-sm font-medium">
                        Job Role <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="job-role"
                        type="text"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="applied-date" className="text-sm font-medium">
                        Applied Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="applied-date"
                        type="date"
                        value={appliedDate}
                        onChange={(e) => setAppliedDate(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="assessment-date" className="text-sm font-medium">
                        {assessmentType === "offer_letter" ? "Date of Offer Letter Received" : "Date of Assessment Received"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="assessment-date"
                        type="date"
                        value={assessmentReceivedDate}
                        onChange={(e) => setAssessmentReceivedDate(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  {assessmentType === "offer_letter" && (
                    <div className="border border-indigo-100 rounded-md p-4 bg-slate-50 space-y-4">
                      <div>
                        <Label htmlFor="num-rounds" className="text-sm font-medium text-slate-800">
                          How many rounds to achieve the offer letter?
                        </Label>
                        <Input
                          id="num-rounds"
                          type="number"
                          min={1}
                          value={roundsCount || ""}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0)
                            setRoundsCount(val)
                            setRounds((prev) => {
                              const next = [...prev]
                              if (val > prev.length) {
                                for (let i = prev.length; i < val; i++) {
                                  next.push({ type: "", file: null })
                                }
                              } else {
                                next.splice(val)
                              }
                              return next
                            })
                          }}
                          placeholder="e.g. 3"
                          className="mt-1 bg-white"
                        />
                      </div>

                      {rounds.map((round, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-md bg-white space-y-3">
                          <h4 className="text-xs font-bold text-indigo-700">Round {idx + 1}</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium">Round Assessment Type</Label>
                              <Select
                                value={round.type}
                                onValueChange={(val) => {
                                  setRounds((prev) => {
                                    const next = [...prev]
                                    next[idx].type = val
                                    return next
                                  })
                                }}
                              >
                                <SelectTrigger className="w-full mt-1">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="interview">Interview</SelectItem>
                                  <SelectItem value="assessment">Assessment</SelectItem>
                                  <SelectItem value="screening_call">Screening call</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Upload Screenshot</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null
                                  setRounds((prev) => {
                                    const next = [...prev]
                                    next[idx].file = file
                                    return next
                                  })
                                }}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="email-subject" className="text-sm font-medium">
                      {assessmentType === "offer_letter" ? "Offer Email Subject" : (
                        <>Email Subject <span className="text-red-500">*</span></>
                      )}
                    </Label>
                    <Input
                      id="email-subject"
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder={assessmentType === "offer_letter" ? "Enter offer email subject" : "Enter email subject"}
                      className="mt-1"
                      required={assessmentType !== "offer_letter"}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-body" className="text-sm font-medium">
                      {assessmentType === "offer_letter" ? "Offer Email Body" : (
                        <>Email Body <span className="text-red-500">*</span></>
                      )}
                    </Label>
                    <Textarea
                      id="email-body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder={assessmentType === "offer_letter" ? "Enter offer email body details..." : "Enter email body details..."}
                      className="mt-1"
                      rows={4}
                      required={assessmentType !== "offer_letter"}
                    />
                  </div>

                  <div>
                    <Label htmlFor="screenshot" className="text-sm font-medium">
                      {assessmentType === "offer_letter" ? "Offer Letter Screenshot" : "Screenshot"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-url" className="text-sm font-medium">
                      {assessmentType === "offer_letter" ? "Offer Email URL" : (
                        <>Email URL <span className="text-red-500">*</span></>
                      )}
                    </Label>
                    <Input
                      id="email-url"
                      type="url"
                      value={emailUrl}
                      onChange={(e) => setEmailUrl(e.target.value)}
                      placeholder={assessmentType === "offer_letter" ? "Enter offer email URL" : "Enter email URL"}
                      className="mt-1"
                      required={assessmentType !== "offer_letter"}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4"
              >
                {isSubmittingAction ? "Submitting..." : "Submit Action"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Status Update Form Component (Unchanged)
function StatusUpdateForm({
  client,
  onUpdate,
}: { client: any; onUpdate: (id: string, status: string, reason?: string, emails?: number, jobs?: number) => void }) {
  const [status, setStatus] = useState(client?.status || "")
  const [reason, setReason] = useState("")
  const [emailsSent, setEmailsSent] = useState(client?.emails_submitted?.toString() || "")
  const [jobsApplied, setJobsApplied] = useState(client?.jobs_applied?.toString() || "")

  if (!client) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(
      client.id,
      status,
      reason,
      emailsSent ? Number.parseInt(emailsSent) : undefined,
      jobsApplied ? Number.parseInt(jobsApplied) : undefined,
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Client: {client.name}</Label>
      </div>

      <div>
        <Label htmlFor="status" className="text-sm font-medium">
          New Status
        </Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {client?.status === "Started" ? (
              <>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="Started">Started</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

      </div>
      {(status === "Paused" || status === "Completed") && ( // Add this condition
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emails" className="text-sm font-medium">
                Number of Emails Recieved
              </Label>
              <Input
                id="emails"
                type="number"
                value={emailsSent}
                onChange={(e) => setEmailsSent(e.target.value)}
                placeholder="Enter email count"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="jobs" className="text-sm font-medium">
                Number of Jobs Applied
              </Label>
              <Input
                id="jobs"
                type="number"
                value={jobsApplied}
                onChange={(e) => setJobsApplied(e.target.value)}
                placeholder="Enter job applications"
                className="mt-1"
                required
              />
            </div>
          </div>

          {status === "Paused" && (
            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for Pause
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for pausing..."
                className="mt-1"
                rows={3}
              />
            </div>
          )}
        </>
      )}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        Update Status
      </Button>
    </form>
  )
}
