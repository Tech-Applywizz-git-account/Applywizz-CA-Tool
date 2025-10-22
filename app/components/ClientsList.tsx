

// // app/components/ClientsList.tsx
// "use client"

// import { useCallback, useEffect, useMemo, useState } from "react"
// import { supabase } from "@/lib/supabaseClient"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"

// type Client = {
//   id: string
//   name: string | null
//   email: string
//   status: string | null
//   assigned_ca_id: string | null
//   assigned_ca_name: string | null
//   work_done_user?: { id: string | null; name: string | null } | null
//   team_id: string | null
//   emails_required: number | null
//   emails_submitted: number | null
//   jobs_applied: number | null
//   date_assigned: string | null
//   last_update: string | null
//   created_at: string | null
//   team_lead_name: string | null
//   client_designation: string | null
//   is_active: boolean | null
// }

// type ClientsListProps = {
//   title?: string
//   /** Optional role-aware filters */
//   teamId?: string | null              // filter to one team
//   teamIds?: string[] | null          // filter to multiple teams
//   assignedCAId?: string | null        // filter to one CA
//   pageSize?: number                   // default 20
//   initialActive?: "all" | "active" | "inactive"
//   initialStatus?: "all" | "Not Started" | "Started" | "Paused" | "Completed"
// }

// type SortKey = "name" | "status" | "assigned_ca_name" | "emails_submitted" | "jobs_applied" | "date_assigned" | "last_update" | "created_at" | "work_done_ca_name" | "team_lead_name"

// export default function ClientsList({
//   title = "Clients Information",
//   teamId = null,
//   teamIds = null,
//   assignedCAId = null,
//   pageSize = 20,
//   initialActive = "all",
//   initialStatus = "all",
// }: ClientsListProps) {
//   // ---- UI state ----
//   const [loading, setLoading] = useState(false)
//   const [clients, setClients] = useState<Client[]>([])
//   const [total, setTotal] = useState(0)

//   const [q, setQ] = useState("")
//   // const [status, setStatus] = useState<"all" | "Not Started" | "Started" | "Paused" | "Completed">("all")
//   // const [active, setActive] = useState<"all" | "active" | "inactive">("all")
//   const [active, setActive] = useState<"all" | "active" | "inactive">(initialActive ?? "all")
//   const [status, setStatus] = useState<"all" | "Not Started" | "Started" | "Paused" | "Completed">(initialStatus ?? "all")

//   useEffect(() => {
//     if (initialActive) setActive(initialActive)
//   }, [initialActive])

//   useEffect(() => {
//     if (initialStatus) setStatus(initialStatus)
//   }, [initialStatus])

//   // sorting + pagination
//   const [sortKey, setSortKey] = useState<SortKey>("created_at")
//   const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
//   const [page, setPage] = useState(1)

//   const toggleSort = (key: SortKey) => {
//     if (sortKey === key) {
//       setSortDir((d) => (d === "asc" ? "desc" : "asc"))
//     } else {
//       setSortKey(key)
//       setSortDir("asc")
//     }
//     setPage(1)
//   }

//   const from = (page - 1) * pageSize
//   const to = from + pageSize - 1

//   const fetchClients = useCallback(async () => {
//     setLoading(true)

//     // Base select with exact count for pagination
//     let query = supabase
//       .from("clients")
//       .select(`
//     id, name, email, status, assigned_ca_id, assigned_ca_name, work_done_by,
//     team_id, emails_required, emails_submitted, jobs_applied,
//     date_assigned, last_update, team_lead_name, created_at, client_designation, is_active,
//     work_done_user:users!clients_work_done_by_fkey ( id, name )
//   `, { count: "exact" })

//     // role-aware filters
//     // if (teamId) query = query.eq("team_id", teamId)
//     // if (assignedCAId) query = query.eq("assigned_ca_id", assignedCAId)
//     // role-aware filters
//    if (teamIds && teamIds.length > 0) {
//      query = query.in("team_id", teamIds)
//    } else if (teamId) {
//      query = query.eq("team_id", teamId)
//    }
//    if (assignedCAId) query = query.eq("assigned_ca_id", assignedCAId)

//     // status / active filters
//     if (status !== "all") query = query.eq("status", status)
//     if (active !== "all") query = query.eq("is_active", active === "active")

//     // 🔎 server-side text search (APPLIES ACROSS ALL ROWS, then we paginate)
//     const needle = q.trim()
//     if (needle) {
//       const like = `%${needle}%`
//       // match name OR email OR assigned_ca_name (case-insensitive)
//       query = query.or(
//         `name.ilike.${like},email.ilike.${like},assigned_ca_name.ilike.${like}`
//       )
//     }

//     // sort + paginate AFTER all filters/search are applied
//     query = query
//       .order(sortKey, { ascending: sortDir === "asc", nullsFirst: sortDir === "asc" })
//       .range(from, to)

//     const { data, error, count } = await query

//     if (error) {
//       console.error("Error fetching clients:", error.message)
//       setClients([])
//       setTotal(0)
//       setLoading(false)
//       return
//     }

//     setTotal(count || 0)
//     setClients((data as Client[]) || [])
//     setLoading(false)
//   }, [teamId, assignedCAId, status, active, sortKey, sortDir, from, to, q, pageSize])


//   useEffect(() => {
//     fetchClients()
//   }, [fetchClients])

//   const totalPages = Math.max(1, Math.ceil(total / pageSize))

//   // keep page in range if filters change
//   useEffect(() => {
//     if (page > totalPages) setPage(totalPages)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [totalPages])

//   return (
//     <div className="space-y-4">
//       {/* header */}
//       <div className="flex items-end justify-between gap-3 flex-wrap min-w-[1400px]">
//         <div>
//           {/* <h1 className="text-2xl font-bold text-slate-900">{title}</h1> */}
//           <p className="text-slate-600">
//             Showing {clients.length} of {total} clients (page {page}/{totalPages})
//           </p>
//         </div>

//         <div className="flex gap-3">
//           <Input
//             placeholder="Search by name / email / CA…"
//             value={q}
//             onChange={(e) => { setQ(e.target.value); setPage(1); }}
//             className="w-64"
//           />

//           <Select value={status} onValueChange={(v: any) => { setStatus(v); setPage(1); }}>
//             <SelectTrigger className="w-40">
//               <SelectValue placeholder="Status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Statuses</SelectItem>
//               <SelectItem value="Not Started">Not Started</SelectItem>
//               <SelectItem value="Started">Started</SelectItem>
//               <SelectItem value="Paused">Paused</SelectItem>
//               <SelectItem value="Completed">Completed</SelectItem>
//             </SelectContent>
//           </Select>

//           <Select value={active} onValueChange={(v: any) => { setActive(v); setPage(1); }}>
//             <SelectTrigger className="w-40">
//               <SelectValue placeholder="Active" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All</SelectItem>
//               <SelectItem value="active">Active</SelectItem>
//               <SelectItem value="inactive">Inactive</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {/* table */}
//       <div className="rounded-lg border bg-white overflow-x-auto min-w-[1400px]">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-[22%]">
//                 <button className="inline-flex items-center gap-1" onClick={() => toggleSort("name")}>
//                   Client Name<ArrowUpDown className="h-3.5 w-3.5" />
//                 </button>
//               </TableHead>
//               <TableHead className="w-[14%]">
//                 <button className="inline-flex items-center gap-1" onClick={() => toggleSort("status")}>
//                   Status <ArrowUpDown className="h-3.5 w-3.5" />
//                 </button>
//               </TableHead>
//               <TableHead className="w-[18%]">
//                 <button className="inline-flex items-center gap-1" onClick={() => toggleSort("assigned_ca_name")}>
//                   Assigned CA <ArrowUpDown className="h-3.5 w-3.5" />
//                 </button>
//               </TableHead>
//               <TableHead className="w-[16%]">
//                 <button className="inline-flex items-center gap-1" onClick={() => toggleSort("team_lead_name")}>
//                   Team Lead <ArrowUpDown className="h-3.5 w-3.5" />
//                 </button>
//               </TableHead>
//               <TableHead className="w-[10%]">
//                 <button className="inline-flex items-center gap-1" onClick={() => toggleSort("emails_submitted")}>
//                   Emails Submitted/Emails Required <ArrowUpDown className="h-3.5 w-3.5" />
//                 </button>
//               </TableHead>
//               <TableHead className="w-[16%]">
//                 <button className="inline-flex items-center gap-1" onClick={() => toggleSort("jobs_applied")}>
//                   Jobs Applied <ArrowUpDown className="h-3.5 w-3.5" />
//                 </button>
//               </TableHead>
//               <TableHead className="w-[15%]">
//                 <button className="inline-flex items-center gap-1" onClick={() => toggleSort("date_assigned")}>
//                   Assigned On <ArrowUpDown className="h-3.5 w-3.5" />
//                 </button>
//               </TableHead>
//               <TableHead className="w-[22%]">
//                 <button className="inline-flex items-center gap-1" onClick={() => toggleSort("work_done_ca_name")}>
//                   Work Done By <ArrowUpDown className="h-3.5 w-3.5" />
//                 </button>
//               </TableHead>
//             </TableRow>
//           </TableHeader>

//           <TableBody>
//             {!loading && clients.length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={7} className="text-center py-10 text-slate-500">
//                   No clients found.
//                 </TableCell>
//               </TableRow>
//             )}

//             {loading && (
//               <TableRow>
//                 <TableCell colSpan={7} className="text-center py-10 text-slate-500">
//                   Loading…
//                 </TableCell>
//               </TableRow>
//             )}

//             {!loading &&
//               clients.map((c) => (
//                 <TableRow key={c.id}>
//                   <TableCell>
//                     <div className="flex flex-col">
//                       <span className="font-medium text-slate-900">{c.name || "—"}</span>
//                       <span className="text-sm text-slate-600">{c.email}</span>
//                       <div className="mt-1 text-xs text-slate-500">
//                         {c.client_designation ? `(${c.client_designation})` : null}
//                       </div>
//                     </div>
//                   </TableCell>

//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <Badge
//                         className={
//                           c.status === "Not Started"
//                             ? "bg-red-500 text-white"
//                             : c.status === "Started"
//                               ? "bg-orange-500 text-white"
//                               : c.status === "Paused"
//                                 ? "bg-slate-200 text-slate-900"
//                                 : c.status === "Completed"
//                                   ? "bg-green-600 text-white"
//                                   : "bg-slate-200 text-slate-900"
//                         }
//                       >
//                         {c.status || "Not Started"}
//                       </Badge>
//                       <Badge className={c.is_active ? "bg-green-600 text-white" : "bg-red-700 text-white"}>
//                         {c.is_active ? "Active" : "Inactive"}
//                       </Badge>
//                     </div>
//                   </TableCell>

//                   <TableCell>
//                     <div className="flex flex-col">
//                       <span className="text-slate-900">{c.assigned_ca_name || "—"}</span>
//                     </div>
//                   </TableCell>

//                   <TableCell>
//                     <div className="flex flex-col">
//                       <span className="text-slate-900">{c.team_lead_name || "—"}</span>
//                     </div>
//                   </TableCell>

//                   <TableCell>
//                     <div className="text-slate-900">{c.emails_submitted ?? 0} / {c.emails_required ?? 25}</div>
//                   </TableCell>

//                   <TableCell>
//                     <div className="text-slate-900">{c.jobs_applied ?? 0}</div>
//                   </TableCell>

//                   <TableCell>
//                     <div className="text-slate-900">{c.date_assigned ?? "—"}</div>
//                   </TableCell>

//                   {/* <TableCell>
//                     <div className="text-slate-900">{c.last_update ?? "—"}</div>
//                   </TableCell> */}
//                   {/* <TableCell>
//                     <div className="text-slate-900">{c.work_done_ca_name || "—"}</div>
//                   </TableCell> */}
//                   <TableCell>
//                     <div className="text-slate-900">{c.work_done_user?.name || "—"}</div>
//                   </TableCell>

//                 </TableRow>
//               ))}
//           </TableBody>
//         </Table>
//       </div>

//       {/* pagination */}
//       <div className="flex items-center justify-end gap-3 min-w-[1400px]">
//         <span className="text-sm text-slate-600">
//           {from + 1}-{Math.min(to + 1, total)} of {total}
//         </span>
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => setPage((p) => Math.max(1, p - 1))}
//           disabled={page <= 1 || loading}
//         >
//           <ChevronLeft className="h-4 w-4" />
//           Prev
//         </Button>
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//           disabled={page >= totalPages || loading}
//         >
//           Next
//           <ChevronRight className="h-4 w-4" />
//         </Button>
//       </div>
//     </div>
//   )
// }

// app/components/ClientsList.tsx
"use client"
 
import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
 
type Client = {
  id: string
  name: string | null
  email: string
  status: string | null
  assigned_ca_id: string | null
  assigned_ca_name: string | null
  work_done_user?: { id: string | null; name: string | null } | null
  team_id: string | null
  emails_required: number | null
  emails_submitted: number | null
  jobs_applied: number | null
  date_assigned: string | null
  last_update: string | null
  created_at: string | null
  team_lead_name: string | null
  client_designation: string | null
  is_active: boolean | null
  experience: number | null
  visa_type: string | null
  sponsorship: boolean | null
}
 
type ClientsListProps = {
  title?: string
  teamId?: string | null
  teamIds?: string[] | null
  assignedCAId?: string | null
  pageSize?: number
  initialActive?: "all" | "active" | "inactive"
  initialStatus?: "all" | "Not Started" | "Started" | "Paused" | "Completed"
}
 
type SortKey =
  | "name"
  | "status"
  | "assigned_ca_name"
  | "emails_submitted"
  | "jobs_applied"
  | "client_designation"
  | "experience"
  | "visa_type"
  | "sponsorship"
  | "date_assigned"
  | "last_update"
  | "created_at"
  | "work_done_ca_name"
  | "team_lead_name"
 
export default function ClientsList({
  title = "Clients Information",
  teamId = null,
  teamIds = null,
  assignedCAId = null,
  pageSize = 20,
  initialActive = "all",
  initialStatus = "all",
}: ClientsListProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState("")
  const [active, setActive] = useState<"all" | "active" | "inactive">(initialActive ?? "all")
  const [status, setStatus] = useState<"all" | "Not Started" | "Started" | "Paused" | "Completed">(initialStatus ?? "all")
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
 
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(1)
  }
 
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
 
  const fetchClients = useCallback(async () => {
    setLoading(true)
 
    let query = supabase
      .from("clients")
      .select(`
        id, name, email, status, assigned_ca_id, assigned_ca_name, work_done_by,
        team_id, emails_required, emails_submitted, jobs_applied,
        date_assigned, last_update, team_lead_name, created_at, client_designation,
        experience, visa_type, sponsorship, is_active,
        work_done_user:users!clients_work_done_by_fkey ( id, name )
      `, { count: "exact" })
 
    if (teamIds && teamIds.length > 0) {
      query = query.in("team_id", teamIds)
    } else if (teamId) {
      query = query.eq("team_id", teamId)
    }
    if (assignedCAId) query = query.eq("assigned_ca_id", assignedCAId)
 
    if (status !== "all") query = query.eq("status", status)
    if (active !== "all") query = query.eq("is_active", active === "active")
 
    const needle = q.trim()
    if (needle) {
      const like = `%${needle}%`
      query = query.or(
        `name.ilike.${like},email.ilike.${like},assigned_ca_name.ilike.${like}`
      )
    }
 
    query = query
      .order(sortKey, { ascending: sortDir === "asc", nullsFirst: sortDir === "asc" })
      .range(from, to)
 
    const { data, error, count } = await query
 
    if (error) {
      console.error("Error fetching clients:", error.message)
      setClients([])
      setTotal(0)
      setLoading(false)
      return
    }
 
    setTotal(count || 0)
    setClients((data as Client[]) || [])
    setLoading(false)
  }, [teamId, teamIds, assignedCAId, status, active, sortKey, sortDir, from, to, q, pageSize])
 
  useEffect(() => {
    fetchClients()
  }, [fetchClients])
 
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
 
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages])
 
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-600">
            Showing {clients.length} of {total} clients (page {page}/{totalPages})
          </p>
        </div>
 
        <div className="flex gap-3">
          <Input
            placeholder="Search by name / email / CA…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-64"
          />
 
          <Select value={status} onValueChange={(v: any) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="Started">Started</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
 
          <Select value={active} onValueChange={(v: any) => { setActive(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Active" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
 
      {/* Table */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <Table className="min-w-[1600px]">
          <TableHeader>
            <TableRow>
              {/* Client Name */}
              <TableHead className="w-[200px] text-left">
                <button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort("name")}>
                  Client Name
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
 
              {/* Status */}
              <TableHead className="w-[120px] text-center">
                <button className="inline-flex items-center gap-1 justify-center font-medium w-full" onClick={() => toggleSort("status")}>
                  Status
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
 
              {/* Team Level */}
              <TableHead className="w-[120px] text-center">
                <span className="font-medium">Team Level</span>
              </TableHead>
 
              {/* Emails Submitted/Required */}
              <TableHead className="w-[180px] text-center">
                <button className="inline-flex items-center gap-1 justify-center font-medium w-full" onClick={() => toggleSort("emails_submitted")}>
                  Emails Submitted/Emails Required
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
 
              {/* Jobs Applied */}
              <TableHead className="w-[100px] text-center">
                <button className="inline-flex items-center gap-1 justify-center font-medium w-full" onClick={() => toggleSort("jobs_applied")}>
                  Jobs Applied
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
 
              {/* Client Designation */}
              <TableHead className="w-[150px] text-center">
                <button className="inline-flex items-center gap-1 justify-center font-medium w-full" onClick={() => toggleSort("client_designation")}>
                  Client Domain
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
 
              {/* Experience */}
              <TableHead className="w-[100px] text-center">
                <button className="inline-flex items-center gap-1 justify-center font-medium w-full" onClick={() => toggleSort("experience")}>
                  Experience
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
 
              {/* Visa Type */}
              <TableHead className="w-[100px] text-center">
                <button className="inline-flex items-center gap-1 justify-center font-medium w-full" onClick={() => toggleSort("visa_type")}>
                  Visa Type
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
 
              {/* Sponsorship */}
              <TableHead className="w-[100px] text-center">
                <button className="inline-flex items-center gap-1 justify-center font-medium w-full" onClick={() => toggleSort("sponsorship")}>
                  Sponsorship
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
 
              {/* Assigned On */}
              <TableHead className="w-[120px] text-center">
                <button className="inline-flex items-center gap-1 justify-center font-medium w-full" onClick={() => toggleSort("date_assigned")}>
                  Assigned On
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
 
              {/* Work Done By */}
              <TableHead className="w-[150px] text-center">
                <button className="inline-flex items-center gap-1 justify-center font-medium w-full" onClick={() => toggleSort("work_done_ca_name")}>
                  Work Done By
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
 
          <TableBody>
            {!loading && clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10 text-slate-500">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
 
            {loading && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10 text-slate-500">
                  Loading…
                </TableCell>
              </TableRow>
            )}
 
            {!loading &&
              clients.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50">
                  {/* Client Name */}
                  <TableCell className="text-left">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{c.name || "—"}</span>
                      <span className="text-sm text-slate-600">{c.email}</span>
                    </div>
                  </TableCell>
 
                  {/* Status */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge
                        className={
                          c.status === "Not Started"
                            ? "bg-red-500 text-white"
                            : c.status === "Started"
                              ? "bg-orange-500 text-white"
                              : c.status === "Paused"
                                ? "bg-slate-200 text-slate-900"
                                : c.status === "Completed"
                                  ? "bg-green-600 text-white"
                                  : "bg-slate-200 text-slate-900"
                        }
                      >
                        {c.status || "Not Started"}
                      </Badge>
                      <Badge
                        className={
                          c.is_active
                            ? "bg-green-600 text-white text-xs"
                            : "bg-red-700 text-white text-xs"
                        }
                      >
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
 
                  {/* Team Level */}
                  <TableCell className="text-center">
                    <div className="text-slate-900">
                      {c.team_lead_name || "—"}
                    </div>
                  </TableCell>
 
                  {/* Emails Submitted/Required */}
                  <TableCell className="text-center">
                    <div className="text-slate-900 font-medium">
                      {c.emails_submitted ?? 0} / {c.emails_required ?? 25}
                    </div>
                  </TableCell>
 
                  {/* Jobs Applied */}
                  <TableCell className="text-center">
                    <div className="text-slate-900 font-medium">
                      {c.jobs_applied ?? 0}
                    </div>
                  </TableCell>
 
                  {/* Client Designation */}
                  <TableCell className="text-center">
                    <div className="text-slate-900">{c.client_designation ?? "—"}</div>
                  </TableCell>
 
                  {/* Experience */}
                  <TableCell className="text-center">
                    <div className="text-slate-900">{c.experience ?? "—"}</div>
                  </TableCell>
 
                  {/* Visa Type */}
                  <TableCell className="text-center">
                    <div className="text-slate-900">{c.visa_type ?? "—"}</div>
                  </TableCell>
 
                  {/* Sponsorship */}
                  <TableCell className="text-center">
                    <div className="text-slate-900 font-medium">
                      {c.sponsorship === true ? "Yes" : c.sponsorship === false ? "No" : "—"}
                    </div>
                  </TableCell>
 
                  {/* Assigned On */}
                  <TableCell className="text-center">
                    <div className="text-slate-900">{c.date_assigned ?? "—"}</div>
                  </TableCell>
 
                  {/* Work Done By */}
                  <TableCell className="text-center">
                    <div className="text-slate-900">{c.work_done_user?.name || "—"}</div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
 
      {/* Pagination */}
      <div className="flex items-center justify-end gap-3">
        <span className="text-sm text-slate-600">
          {from + 1}-{Math.min(to + 1, total)} of {total}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
 