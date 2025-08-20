// "use client"

// import type React from "react"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// const mockTeamMembers = [
//   { id: "ca1", name: "Rama Krishna", email: "rama@applywizz.com" },
//   { id: "ca2", name: "Priya Sharma", email: "priya@applywizz.com" },
//   { id: "ca3", name: "Arjun Patel", email: "arjun@applywizz.com" },
//   { id: "ca4", name: "Sneha Kumar", email: "sneha@applywizz.com" },
// ]

// interface NewClientFormProps {
//   onSubmit: (data: any) => void
// }

// export function NewClientForm({ onSubmit }: NewClientFormProps) {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     assignedCA: "",
//     designation: "Junior CA",
//     salary: 6000,
//     emailsRequired: 50,
//     status: "Not Started",
//   })

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     onSubmit(formData)
//     setFormData({
//       name: "",
//       email: "",
//       assignedCA: "",
//       designation: "Junior CA",
//       salary: 6000,
//       emailsRequired: 50,
//       status: "Not Started",
//     })
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <Label htmlFor="name">Client Name</Label>
//         <Input
//           id="name"
//           value={formData.name}
//           onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
//           placeholder="Enter client name"
//           required
//         />
//       </div>

//       <div>
//         <Label htmlFor="email">Client Email</Label>
//         <Input
//           id="email"
//           type="email"
//           value={formData.email}
//           onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
//           placeholder="Enter client email"
//           required
//         />
//       </div>

//       <div>
//         <Label htmlFor="assignedCA">Assigned CA</Label>
//         <Select
//           value={formData.assignedCA}
//           onValueChange={(value) => setFormData((prev) => ({ ...prev, assignedCA: value }))}
//         >
//           <SelectTrigger>
//             <SelectValue placeholder="Select CA" />
//           </SelectTrigger>
//           <SelectContent>
//             {mockTeamMembers.map((member) => (
//               <SelectItem key={member.id} value={member.email}>
//                 {member.name}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <Label htmlFor="designation">Designation</Label>
//           <Select
//             value={formData.designation}
//             onValueChange={(value) => setFormData((prev) => ({ ...prev, designation: value }))}
//           >
//             <SelectTrigger>
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="Junior CA">Junior CA</SelectItem>
//               <SelectItem value="CA">CA</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         <div>
//           <Label htmlFor="salary">Salary</Label>
//           <Input
//             id="salary"
//             type="number"
//             value={formData.salary}
//             onChange={(e) => setFormData((prev) => ({ ...prev, salary: Number.parseInt(e.target.value) }))}
//           />
//         </div>
//       </div>

//       <div>
//         <Label htmlFor="emailsRequired">Number of Emails Required</Label>
//         <Input
//           id="emailsRequired"
//           type="number"
//           value={formData.emailsRequired}
//           onChange={(e) => setFormData((prev) => ({ ...prev, emailsRequired: Number.parseInt(e.target.value) }))}
//           min="1"
//           required
//         />
//       </div>

//       <div>
//         <Label htmlFor="status">Client Status</Label>
//         <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
//           <SelectTrigger>
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="Not Started">Not Started</SelectItem>
//             <SelectItem value="Started">Started</SelectItem>
//             <SelectItem value="Paused">Paused</SelectItem>
//             <SelectItem value="Completed">Completed</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <Button type="submit" className="w-full">
//         Add Client
//       </Button>
//     </form>
//   )
// }


// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// interface NewClientFormProps {
//   onSubmit: (data: any) => void
//   caOptions: Array<{ id: string; name: string; email: string }>  // <-- Dynamic CAs
// }

// export function NewClientForm({ onSubmit, caOptions }: NewClientFormProps) {
//   const [name, setName] = useState("")
//   const [email, setEmail] = useState("")
//   const [assignedCA, setAssignedCA] = useState("")
//   const [status, setStatus] = useState("Not Started")

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     onSubmit({
//       name,
//       email,
//       assigned_ca_id: assignedCA,
//       status,
//     })
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <Label>Client Name</Label>
//         <Input
//           placeholder="Enter client name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           required
//         />
//       </div>

//       <div>
//         <Label>Client Email</Label>
//         <Input
//           type="email"
//           placeholder="Enter client email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//       </div>

//       {/* --- Dynamic Assigned CA Dropdown --- */}
//       <div>
//         <Label>Assigned CA</Label>
//         <Select value={assignedCA} onValueChange={setAssignedCA}>
//           <SelectTrigger>
//             <SelectValue placeholder="Select CA" />
//           </SelectTrigger>
//           <SelectContent>
//             {caOptions.map((ca) => (
//               <SelectItem key={ca.id} value={ca.id}>
//                 {ca.name}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       <div>
//         <Label>Client Status</Label>
//         <Select value={status} onValueChange={setStatus}>
//           <SelectTrigger>
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="Not Started">Not Started</SelectItem>
//             <SelectItem value="Started">Started</SelectItem>
//             <SelectItem value="Paused">Paused</SelectItem>
//             <SelectItem value="Completed">Completed</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
//         Add Client
//       </Button>
//     </form>
//   )
// }

// "use client"

// import { useEffect, useState } from "react"
// import { supabase } from "@/lib/supabaseClient"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Label } from "@/components/ui/label"
// import { toast } from "react-hot-toast"

// export function NewClientForm({ onSubmit }: { onSubmit?: (data: any) => void }) {
//   const [teamMembers, setTeamMembers] = useState<any[]>([])
//   const [selectedCA, setSelectedCA] = useState("")
//   const [designation, setDesignation] = useState("Junior CA")
//   const [salary, setSalary] = useState<number>(6000)
//   const [name, setName] = useState("")
//   const [email, setEmail] = useState("")
//   const [status, setStatus] = useState("Not Started")
//   const [emailsRequired, setEmailsRequired] = useState(50)
//   const [loading, setLoading] = useState(false)

//   // Fetch team members (CA & Junior CA)
//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       const { data, error } = await supabase
//         .from("users")
//         .select("id, name, designation, team_id")
//         .in("role", ["CA", "Junior CA"])

//       if (!error && data) setTeamMembers(data)
//     }
//     fetchTeamMembers()
//   }, [])

//   // Auto-adjust salary on designation change
//   useEffect(() => {
//     if (designation === "Junior CA") setSalary(6000)
//     else if (designation === "CA") setSalary(10000)
//   }, [designation])

//   const resetForm = () => {
//     setName("")
//     setEmail("")
//     setSelectedCA("")
//     setDesignation("Junior CA")
//     setSalary(6000)
//     setEmailsRequired(50)
//     setStatus("Not Started")
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!selectedCA) {
//       toast.error("Please select a CA")
//       return
//     }

//     const ca = teamMembers.find((m) => m.id === selectedCA)
//     if (!ca) {
//       toast.error("Invalid CA selection")
//       return
//     }

//     setLoading(true)

//     // Insert into Supabase
//     const { data, error } = await supabase.from("clients").insert([
//       {
//         name,
//         email,
//         assigned_ca_id: selectedCA,
//         team_id: ca.team_id,
//         status,
//         eamils_required: emailsRequired, // DB column is spelled like this
//         emails_submitted: 0,
//         jobs_applied: 0,
//         date_assigned: new Date().toISOString().split("T")[0],
//         last_update: new Date().toISOString().split("T")[0],
//         created_at: new Date().toISOString(),
//         designation,
//         salary,
//       },
//     ])

//     setLoading(false)

//     if (error) {
//       toast.error(`Error adding client: ${error.message}`)
//     } else {
//       toast.success("Client added successfully!")
//       resetForm()
//       if (onSubmit) onSubmit(data)
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <Label>Client Name</Label>
//         <Input value={name} onChange={(e) => setName(e.target.value)} required />
//       </div>
//       <div>
//         <Label>Client Email</Label>
//         <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
//       </div>
//       <div>
//         <Label>Assigned CA</Label>
//         <Select value={selectedCA} onValueChange={setSelectedCA}>
//           <SelectTrigger><SelectValue placeholder="Select CA" /></SelectTrigger>
//           <SelectContent>
//             {teamMembers.map((ca) => (
//               <SelectItem key={ca.id} value={ca.id}>{ca.name}</SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <Label>Designation</Label>
//           <Select value={designation} onValueChange={setDesignation}>
//             <SelectTrigger><SelectValue /></SelectTrigger>
//             <SelectContent>
//               <SelectItem value="Junior CA">Junior CA</SelectItem>
//               <SelectItem value="CA">CA</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//         <div>
//           <Label>Salary</Label>
//           <Input
//             type="number"
//             value={salary}
//             onChange={(e) => setSalary(Number(e.target.value))}
//           />
//         </div>
//       </div>

//       <div>
//         <Label>Number of Emails Required</Label>
//         <Input
//           type="number"
//           value={emailsRequired}
//           onChange={(e) => setEmailsRequired(Number(e.target.value))}
//         />
//       </div>

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

"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function NewClientForm({ fetchClients }: { fetchClients: () => void }) {
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [selectedCA, setSelectedCA] = useState("")
  // const [designation, setDesignation] = useState("Junior CA")
  const [role, setRole] = useState("Junior CA")

  const [salary, setSalary] = useState<number>(6000)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [clientDesignation, setClientDesignation] = useState("")
  const [status, setStatus] = useState("Not Started")
  const [emailsRequired, setEmailsRequired] = useState(50)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data } = await supabase.from("users").select("id, name, role, team_id").in("role", ["CA", "Junior CA"]).order('name', { ascending: true })
      setTeamMembers(data || [])
    }
    fetchTeamMembers()
  }, [])

  useEffect(() => {
    if (role === "Junior CA") setSalary(6000)
    else if (role === "CA") setSalary(10000)
  }, [role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCA) return alert("Please select a CA")
    const ca = teamMembers.find((m) => m.id === selectedCA)
    if (!ca) return alert("Invalid CA selected")

    setLoading(true)
    const { error } = await supabase.from("clients").insert([
      {
        name,
        email,
        assigned_ca_id: selectedCA,
        assigned_ca_name: ca.name,
        team_id: ca.team_id,
        // team_lead_name: ca.team_id,
        client_designation: clientDesignation,
        status,
        emails_required: emailsRequired,
        emails_submitted: 0,
        jobs_applied: 0,
        date_assigned: new Date().toISOString().split("T")[0],
        last_update: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      },
    ])
    setLoading(false)

    if (error) {
      alert(`Error adding client: ${error.message}`)
    } else {
      alert("Client added successfully!")
      fetchClients()
      setName("")
      setEmail("")
      setSelectedCA("")
      setRole("Junior CA")
      setSalary(6000)
      setEmailsRequired(50)
      setStatus("Not Started")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Client Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div><Label>Client Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div>
        <Label>Client Designation</Label>
        <Input
          value={clientDesignation}
          onChange={(e) => setClientDesignation(e.target.value)}
          placeholder="e.g., Software Engineer"
          required
        />
      </div>
      <div>
        <Label>Assigned CA</Label>
        <Select value={selectedCA} onValueChange={setSelectedCA}>
          <SelectTrigger><SelectValue placeholder="Select CA" /></SelectTrigger>
          <SelectContent>{teamMembers.map((ca) => (<SelectItem key={ca.id} value={ca.id}>{ca.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Designation</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Junior CA">Junior CA</SelectItem>
              <SelectItem value="CA">CA</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Salary</Label>
          <Input type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} />
        </div>
      </div>
      <div><Label>Number of Emails Required</Label><Input type="number" value={emailsRequired} onChange={(e) => setEmailsRequired(Number(e.target.value))} /></div>
      <div>
        <Label>Client Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="Started">Started</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
        {loading ? "Adding..." : "Add Client"}
      </Button>
    </form>
  )
}
