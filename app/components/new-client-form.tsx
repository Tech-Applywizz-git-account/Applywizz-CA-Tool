// //app/components/new-client-form.tsx

// "use client"

// import { useEffect, useMemo, useState } from "react"
// import { supabase } from "@/lib/supabaseClient"
// import { Label } from "@/components/ui/label"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// type NewClientFormProps = {
//   fetchClients: () => Promise<void> | void
//   mode?: "create" | "edit"
//   initialClient?: any | null
//   onClose?: () => void
// }

// type CAUser = { id: string; name: string; team_id: string | null }


// export function NewClientForm({
//   fetchClients,
//   mode = "create",
//   initialClient = null,
//   onClose,
// }: NewClientFormProps) {
//   const isEdit = mode === "edit"

//   const [name, setName] = useState("")
//   const [email, setEmail] = useState("")
//   const [clientDesignation, setClientDesignation] = useState("")
//   const [status, setStatus] = useState("Not Started")

//   // CA selection
//   const [cas, setCAs] = useState<CAUser[]>([])
//   const [selectedCA, setSelectedCA] = useState<string>("")

//   // metrics
//   const [emailsRequired, setEmailsRequired] = useState<number>(50)
//   const [emailsSubmitted, setEmailsSubmitted] = useState<number>(0)
//   const [jobsApplied, setJobsApplied] = useState<number>(0)

//   const [teamMembers, setTeamMembers] = useState<any[]>([])
//   // const [selectedCA, setSelectedCA] = useState("")
//   // const [designation, setDesignation] = useState("Junior CA")
//   const [role, setRole] = useState("Junior CA")

//   const [salary, setSalary] = useState<number>(6000)
//   // const [emailsRequired, setEmailsRequired] = useState(50)
//   const [loading, setLoading] = useState(false)
//   const [experience, setExperience] = useState<string>("");   // years, keep as string then cast
//   const [visaType, setVisaType] = useState<string>("");       // e.g., "F1-OPT", "H1B", etc.
//   const [sponsorship, setSponsorship] = useState<string>("no"); // "yes" | "no" -> boolean at insert
//   const [submitting, setSubmitting] = useState(false)

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       const { data } = await supabase.from("users").select("id, name, role, team_id").in("role", ["CA", "Junior CA"]).order('name', { ascending: true })
//       setTeamMembers(data || [])
//     }
//     fetchTeamMembers()
//   }, [])

//   useEffect(() => {
//     if (role === "Junior CA") setSalary(6000)
//     else if (role === "CA") setSalary(10000)
//   }, [role])

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!selectedCA) return alert("Please select a CA")
//     const ca = teamMembers.find((m) => m.id === selectedCA)
//     if (!ca) return alert("Invalid CA selected")

//     setLoading(true)
//     const { error } = await supabase.from("clients").insert([
//       {
//         name,
//         email,
//         assigned_ca_id: selectedCA,
//         assigned_ca_name: ca.name,
//         team_id: ca.team_id,
//         client_designation: clientDesignation,
//         status,
//         experience: experience === "" ? null : Number(experience),
//         visa_type: visaType || null,
//         sponsorship: sponsorship === "yes",
//         emails_required: emailsRequired,
//         emails_submitted: 0,
//         jobs_applied: 0,
//         date_assigned: new Date().toISOString().split("T")[0],
//         last_update: new Date().toISOString().split("T")[0],
//         created_at: new Date().toISOString(),
//         date: new Date().toISOString().split("T")[0],
//       },
//     ])
//     setLoading(false)

//     if (error) {
//       alert(`Error adding client: ${error.message}`)
//     } else {
//       alert("Client added successfully!")
//       fetchClients()
//       setName("")
//       setEmail("")
//       setSelectedCA("")
//       setClientDesignation("")
//       setExperience("")
//       setVisaType("")
//       setRole("Junior CA")
//       setSalary(6000)
//       setEmailsRequired(50)
//       setStatus("Not Started")
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[600px] p-4">
//       <div><Label>Client Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
//       <div><Label>Client Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
//       <div>
//         <Label>Client Designation</Label>
//         <Input
//           value={clientDesignation}
//           onChange={(e) => setClientDesignation(e.target.value)}
//           placeholder="e.g., Software Engineer"
//           required
//         />
//       </div>
//       <div>
//         <Label>Assigned CA</Label>
//         <Select value={selectedCA} onValueChange={setSelectedCA}>
//           <SelectTrigger><SelectValue placeholder="Select CA" /></SelectTrigger>
//           <SelectContent>{teamMembers.map((ca) => (<SelectItem key={ca.id} value={ca.id}>{ca.name}</SelectItem>))}</SelectContent>
//         </Select>
//       </div>
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <Label>Designation</Label>
//           <Select value={role} onValueChange={setRole}>
//             <SelectTrigger><SelectValue /></SelectTrigger>
//             <SelectContent>
//               <SelectItem value="Junior CA">Junior CA</SelectItem>
//               <SelectItem value="CA">CA</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//         <div>
//           <Label>Salary</Label>
//           <Input type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} />
//         </div>
//       </div>
//         {/* --- NEW: Experience (years) --- */}
//         <div className="space-y-2">
//           <Label htmlFor="experience">Experience (years)</Label>
//           <Input
//             id="experience"
//             type="number"
//             inputMode="numeric"
//             min={0}
//             step={1}
//             placeholder="e.g., 2"
//             value={experience}
//             onChange={(e) => setExperience(e.target.value)}
//           />
//         </div>

//         {/* --- NEW: Visa Type --- */}
//         <div className="space-y-2">
//           <Label>Visa Type</Label>
//           <Select value={visaType} onValueChange={setVisaType}>
//             <SelectTrigger>
//               <SelectValue placeholder="Select visa type" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="F1-OPT">F1-OPT</SelectItem>
//               <SelectItem value="STEM-OPT">STEM-OPT</SelectItem>
//               <SelectItem value="H1B">H1B</SelectItem>
//               <SelectItem value="H4-EAD">H4-EAD</SelectItem>
//               <SelectItem value="L2-EAD">L2-EAD</SelectItem>
//               <SelectItem value="Other">Other</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* --- NEW: Sponsorship required? --- */}
//         <div className="space-y-2">
//           <Label>Requires Visa Sponsorship?</Label>
//           <Select value={sponsorship} onValueChange={setSponsorship}>
//             <SelectTrigger>
//               <SelectValue placeholder="Select Yes / No" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="no">No</SelectItem>
//               <SelectItem value="yes">Yes</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       <div><Label>Number of Emails Required</Label><Input type="number" value={emailsRequired} onChange={(e) => setEmailsRequired(Number(e.target.value))} /></div>
//       <div>
//         <Label>Client Status</Label>
//         <Select value={status} onValueChange={setStatus}>
//           <SelectTrigger><SelectValue /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="Not Started">Not Started</SelectItem>
//             <SelectItem value="Started">Started</SelectItem>
//             <SelectItem value="Paused">Paused</SelectItem>
//             <SelectItem value="Completed">Completed</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//       <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
//         {loading ? "Adding..." : "Add Client"}
//       </Button>
//     </form>
//   )
// }

// app/components/new-client-form.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ClientStatus = "Not Started" | "Started" | "Paused" | "Completed"

type NewClientFormProps = {
  fetchClients: () => Promise<void> | void
  mode?: "create" | "edit"
  initialClient?: any | null
  onClose?: () => void
}

type CAUser = { id: string; name: string; team_id: string | null }

export function NewClientForm({
  fetchClients,
  mode = "create",
  initialClient = null,
  onClose,
}: NewClientFormProps) {
  const isEdit = mode === "edit"

  // core fields (clients table)
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [clientDesignation, setClientDesignation] = useState<string>("")
  const [status, setStatus] = useState<ClientStatus>("Not Started")

  // CA (users table, roles CA/Junior CA)
  const [teamMembers, setTeamMembers] = useState<CAUser[]>([])
  const [selectedCA, setSelectedCA] = useState<string>("")

  // metrics in clients
  const [emailsRequired, setEmailsRequired] = useState<number>(50)

  // extra fields in clients (as per schema)
  const [experience, setExperience] = useState<number | "">("") // integer or blank
  const [visaType, setVisaType] = useState<string>("")
  const [sponsorship, setSponsorship] = useState<"yes" | "no">("no")

  // UI-only fields (not written to clients table)
  const [role, setRole] = useState<"Junior CA" | "CA">("Junior CA")
  const [salary, setSalary] = useState<number>(6000)

  const [submitting, setSubmitting] = useState<boolean>(false)

  // Load CA list
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role, team_id")
        .in("role", ["CA", "Junior CA"])
        .order("name", { ascending: true })

      if (!error && data) {
        setTeamMembers(data.map((u: any) => ({ id: u.id, name: u.name, team_id: u.team_id ?? null })))
      }
    })()
  }, [])

  // Auto salary by role (UI only)
  useEffect(() => {
    setSalary(role === "CA" ? 10000 : 6000)
  }, [role])

  // Pre-fill in edit mode
  useEffect(() => {
    if (!isEdit || !initialClient) return
    setName(initialClient.name ?? "")
    setEmail(initialClient.email ?? "")
    setClientDesignation(initialClient.client_designation ?? "")
    setStatus((initialClient.status as ClientStatus) ?? "Not Started")
    setSelectedCA(initialClient.assigned_ca_id ?? "")
    setEmailsRequired(
      typeof initialClient.emails_required === "number" ? initialClient.emails_required : 50
    )
    setExperience(
      typeof initialClient.experience === "number" ? initialClient.experience : ""
    )
    setVisaType(initialClient.visa_type ?? "")
    setSponsorship(initialClient.sponsorship ? "yes" : "no")
  }, [isEdit, initialClient])

  const selectedCAObj = useMemo(
    () => teamMembers.find((m) => m.id === selectedCA) || null,
    [teamMembers, selectedCA]
  )

  const todayDateStr = () => new Date().toISOString().split("T")[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    // basic validation
    if (!name.trim()) return alert("Please enter client name")
    if (!email.trim()) return alert("Please enter client email")
    if (!selectedCA) return alert("Please select a CA")
    if (emailsRequired < 0) return alert("Emails required cannot be negative")
    if (experience !== "" && (experience as number) < 0) return alert("Experience cannot be negative")

    setSubmitting(true)

    // normalize
    const normalizedEmail = email.trim().toLowerCase()

    // payload aligned to DB types
    const base: Record<string, any> = {
      name: name.trim(),
      email: normalizedEmail,
      client_designation: clientDesignation.trim() || null,
      status,
      assigned_ca_id: selectedCA || null,
      assigned_ca_name: selectedCAObj?.name ?? null,
      team_id: selectedCAObj?.team_id ?? null,
      emails_required: Number.isFinite(emailsRequired) ? emailsRequired : 50,
      last_update: todayDateStr(),
      experience: experience === "" ? null : Number(experience), // integer or null
      visa_type: visaType || null,
      sponsorship: sponsorship === "yes", // boolean
    }

    let error
    if (isEdit && initialClient?.id) {
      // UPDATE only changed fields
      ; ({ error } = await supabase.from("clients").update(base).eq("id", initialClient.id))
    } else {
      // CREATE (fill server-managed dates)
      const createPayload = {
        ...base,
        date_assigned: todayDateStr(),
        is_active: true,
        emails_submitted: 0,
        jobs_applied: 0,
        // Optional: if you intentionally use this generic "date" field
        date: todayDateStr(),
      }
        ; ({ error } = await supabase.from("clients").insert([createPayload]))
    }

    setSubmitting(false)

    if (error) {
      alert(`Error: ${error.message}`)
      return
    }

    await fetchClients?.()
    if (isEdit) {
      onClose?.()
      return
    }

    // Clear after create
    setName("")
    setEmail("")
    setClientDesignation("")
    setSelectedCA("")
    setRole("Junior CA")
    setSalary(6000)
    setStatus("Not Started")
    setEmailsRequired(50)
    setExperience("")
    setVisaType("")
    setSponsorship("no")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[600px] p-4">
      <div>
        <Label htmlFor="name">Client Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="email">Client Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="cdesig">Client Designation</Label>
        <Input
          id="cdesig"
          value={clientDesignation}
          onChange={(e) => setClientDesignation(e.target.value)}
          placeholder="e.g., Software Engineer"
        />
      </div>

      <div>
        <Label>Assigned CA</Label>
        <Select value={selectedCA} onValueChange={setSelectedCA}>
          <SelectTrigger>
            <SelectValue placeholder="Select CA" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((ca) => (
              <SelectItem key={ca.id} value={ca.id}>
                {ca.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* UI-only controls (not written to DB) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Designation</Label>
          <Select value={role} onValueChange={(v: "Junior CA" | "CA") => setRole(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Junior CA">Junior CA</SelectItem>
              <SelectItem value="CA">CA</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Salary</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Schema-backed fields */}
      <div className="space-y-2">
        <Label htmlFor="experience">Experience (years)</Label>
        <Input
          id="experience"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="e.g., 2"
          value={experience === "" ? "" : String(experience)}
          onChange={(e) => {
            const v = e.target.value
            setExperience(v === "" ? "" : Number(v))
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Visa Type</Label>
        <Select value={visaType} onValueChange={setVisaType}>
          <SelectTrigger>
            <SelectValue placeholder="Select visa type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="F1-OPT">F1-OPT</SelectItem>
            <SelectItem value="STEM-OPT">STEM-OPT</SelectItem>
            <SelectItem value="H1B">H1B</SelectItem>
            <SelectItem value="H4-EAD">H4-EAD</SelectItem>
            <SelectItem value="L2-EAD">L2-EAD</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Requires Visa Sponsorship?</Label>
        <Select value={sponsorship} onValueChange={(v: "yes" | "no") => setSponsorship(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Yes / No" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no">No</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Number of Emails Required</Label>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={emailsRequired}
          onChange={(e) => setEmailsRequired(Number(e.target.value || 0))}
        />
      </div>

      <div>
        <Label>Client Status</Label>
        <Select value={status} onValueChange={(v: ClientStatus) => setStatus(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="Started">Started</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
        {submitting ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Add Client")}
      </Button>
    </form>
  )
}

