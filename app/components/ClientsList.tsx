
// app/components/ClientsList.tsx
"use client"
 
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase, supabaseCRM } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowUpDown, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
 
type Client = {
  id: string
  name: string | null
  email: string | null
  status: string | null
  assigned_ca_id: string | null
  assigned_ca_name: string | null
  work_done_user?: { id: string | null; name: string | null } | { id: string | null; name: string | null }[] | null
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
  renewal_date?: string | null
}
 
type ClientsListProps = {
  title?: string
  teamId?: string | null
  teamIds?: string[] | null
  assignedCAId?: string | null
  pageSize?: number
  initialActive?: "all" | "active" | "inactive"
  initialStatus?: "all" | "Not Started" | "Started" | "Paused" | "Completed"
  clientLinkPrefix?: string
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
  clientLinkPrefix,
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

  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editDesignation, setEditDesignation] = useState("")
  const [editExperience, setEditExperience] = useState<number | "">("")
  const [saving, setSaving] = useState(false)

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client)
    setEditDesignation(client.client_designation ?? "")
    setEditExperience(client.experience ?? "")
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return
    if (editExperience !== "" && Number(editExperience) < 0) {
      alert("Experience cannot be negative")
      return
    }
    setSaving(true)

    const updatedDesignation = editDesignation.trim() || null
    const updatedExperience = editExperience === "" ? null : Number(editExperience)

    const { error } = await supabase
      .from("clients")
      .update({
        client_designation: updatedDesignation,
        experience: updatedExperience,
      })
      .eq("id", editingClient.id)

    setSaving(false)
    if (error) {
      alert("Error updating client: " + error.message)
    } else {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClient.id
            ? { ...c, client_designation: updatedDesignation, experience: updatedExperience }
            : c
        )
      )
      setEditingClient(null)
    }
  }
 
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
    
    let clientsData = data as Client[];

    if (clientsData && clientsData.length > 0) {
      const emails = clientsData.map(c => c.email).filter(Boolean);
      const { data: crmData } = await supabaseCRM
          .from("sales_closure")
          .select("email, extended_renewal_at, closed_at")
          .in("email", emails);
          
      if (crmData) {
        const renewalMap = new Map();
        const closedAtMap = new Map();
        crmData.forEach((r: any) => {
            if (r.extended_renewal_at) {
                const currentClosed = new Date(r.closed_at || 0).getTime();
                if (!renewalMap.has(r.email) || currentClosed > closedAtMap.get(r.email)) {
                    renewalMap.set(r.email, r.extended_renewal_at);
                    closedAtMap.set(r.email, currentClosed);
                }
            }
        });
        clientsData = clientsData.map(c => ({
            ...c,
            renewal_date: renewalMap.get(c.email) || null
        }));
      }
    }
 
    setTotal(count || 0)
    setClients(clientsData || [])
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
 
              {/* Renewal Date */}
              <TableHead className="w-[120px] text-center">
                <span className="font-medium">Renewal Date</span>
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
                      {clientLinkPrefix ? (
                        <Link href={`${clientLinkPrefix}${c.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                          {c.name || "—"}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">{c.name || "—"}</span>
                      )}
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
                    <div className="flex items-center justify-center gap-1 group">
                      <span className="text-slate-900">{c.client_designation ?? "—"}</span>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                        title="Edit client domain"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
 
                  {/* Experience */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 group">
                      <span className="text-slate-900">
                        {c.experience !== null && c.experience !== undefined ? `${c.experience} years` : "—"}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                        title="Edit experience"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
 
                  {/* Renewal Date */}
                  <TableCell className="text-center">
                    <div className="text-slate-900">
                      {c.renewal_date ? new Date(c.renewal_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </div>
                  </TableCell>

                  {/* Work Done By */}
                  <TableCell className="text-center">
                    <div className="text-slate-900">
                      {Array.isArray(c.work_done_user) 
                        ? (c.work_done_user[0]?.name || "—") 
                        : (c.work_done_user?.name || "—")}
                    </div>
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

      {/* Edit Client Domain & Experience Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Client Domain & Experience</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div>
                <Label className="text-slate-500 text-xs">Client Name</Label>
                <div className="text-sm font-semibold text-slate-800 bg-slate-50 p-2 rounded-md border mt-1">
                  {editingClient.name || "—"}
                </div>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Client Email</Label>
                <div className="text-sm font-semibold text-slate-800 bg-slate-50 p-2 rounded-md border mt-1">
                  {editingClient.email || "—"}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-designation" className="text-sm font-medium text-slate-700">
                  Client Domain / Designation
                </Label>
                <Input
                  id="edit-designation"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-experience" className="text-sm font-medium text-slate-700">
                  Experience (years)
                </Label>
                <Input
                  id="edit-experience"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={editExperience === "" ? "" : String(editExperience)}
                  onChange={(e) => {
                    const v = e.target.value
                    setEditExperience(v === "" ? "" : Number(v))
                  }}
                  placeholder="e.g., 5"
                  className="w-full"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingClient(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
 
