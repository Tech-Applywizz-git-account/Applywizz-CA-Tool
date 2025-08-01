"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface StatusUpdateFormProps {
  client: any
  onUpdate: (id: string, status: string, reason?: string, emails?: number, jobs?: number) => void
}

export function StatusUpdateForm({ client, onUpdate }: StatusUpdateFormProps) {
  const [status, setStatus] = useState(client?.status || "")
  const [reason, setReason] = useState("")
  const [emailsSent, setEmailsSent] = useState(client?.emailsSubmitted?.toString() || "")
  const [jobsApplied, setJobsApplied] = useState(client?.jobsApplied?.toString() || "")

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
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="Started">Started</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(status === "Paused" || status === "Completed") && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emails" className="text-sm font-medium">
                Emails Sent
              </Label>
              <Input
                id="emails"
                type="number"
                value={emailsSent}
                onChange={(e) => setEmailsSent(e.target.value)}
                placeholder="Number of emails"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="jobs" className="text-sm font-medium">
                Jobs Applied
              </Label>
              <Input
                id="jobs"
                type="number"
                value={jobsApplied}
                onChange={(e) => setJobsApplied(e.target.value)}
                placeholder="Number of applications"
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
