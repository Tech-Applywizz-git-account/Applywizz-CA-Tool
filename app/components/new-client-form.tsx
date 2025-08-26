//app/components/new-client-form.tsx

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
