"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Send, FileText, Download, Edit } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface ProgressiveCallFormProps {
  user: any;
  viewerMode?: boolean;
  initialEditSub?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProgressiveCallForm({ user, viewerMode = false, initialEditSub, onSuccess, onCancel }: ProgressiveCallFormProps) {
  const [loading, setLoading] = useState(false)
  const [submittedForms, setSubmittedForms] = useState<any[]>([])

  const [editId, setEditId] = useState<string | null>(null)

  const isFormEdited = (sub: any) => {
    if (sub.is_edited === true) return true
    if (typeof sub.rep_signature === 'string' && sub.rep_signature.endsWith(' [EDITED]')) return true
    return false
  }

  const startEdit = (sub: any) => {
    setEditId(sub.id)
    setFormData({
      awl_id: sub.awl_id || "",
      date_of_call: sub.date_of_call ? sub.date_of_call.substring(0, 10) : "",
      total_applications: sub.total_applications !== undefined && sub.total_applications !== null ? String(sub.total_applications) : "",
      applications_last_7_days: sub.applications_last_7_days !== undefined && sub.applications_last_7_days !== null ? String(sub.applications_last_7_days) : "",
      received_assessments: sub.received_assessments || "",
      assessments_details: sub.assessments_details || "",
      attended_interviews: sub.attended_interviews || "",
      interviews_details: sub.interviews_details || "",
      dashboard_issues: sub.dashboard_issues || "",
      dashboard_issues_details: sub.dashboard_issues_details || "",
      dashboard_doubts: sub.dashboard_doubts || "",
      dashboard_doubts_details: sub.dashboard_doubts_details || "",
      application_concerns: sub.application_concerns || "",
      application_concerns_details: sub.application_concerns_details || "",
      overall_feedback: sub.overall_feedback || "",
      key_challenges: sub.key_challenges || "",
      am_actions: sub.am_actions || "",
      client_actions: sub.client_actions || "",
      next_followup_date: sub.next_followup_date ? sub.next_followup_date.substring(0, 10) : "",
      next_phase_plan: sub.next_phase_plan || "",
      confirmed_details: sub.confirmed_details || false,
      rep_signature: sub.rep_signature || ""
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    if (initialEditSub) {
      startEdit(initialEditSub)
    }
  }, [initialEditSub])

  const cancelEdit = () => {
    setEditId(null)
    if (onCancel) onCancel()
    setFormData({
      awl_id: "",
      date_of_call: "",
      total_applications: "",
      applications_last_7_days: "",
      received_assessments: "",
      assessments_details: "",
      attended_interviews: "",
      interviews_details: "",
      dashboard_issues: "",
      dashboard_issues_details: "",
      dashboard_doubts: "",
      dashboard_doubts_details: "",
      application_concerns: "",
      application_concerns_details: "",
      overall_feedback: "",
      key_challenges: "",
      am_actions: "",
      client_actions: "",
      next_followup_date: "",
      next_phase_plan: "",
      confirmed_details: false,
      rep_signature: user.name || ""
    })
  }

  const fetchSubmittedForms = async () => {
    try {
      const { data, error } = await supabase
        .from('account_progressive_calls')
        .select('*')
        .eq('rep_email', user.email)
        .order('created_at', { ascending: false })
      if (!error && data) {
        setSubmittedForms(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (user?.email) {
      fetchSubmittedForms()
    }
  }, [user?.email])

  const [formData, setFormData] = useState({
    awl_id: "",
    date_of_call: "",
    total_applications: "",
    applications_last_7_days: "",
    received_assessments: "",
    assessments_details: "",
    attended_interviews: "",
    interviews_details: "",
    dashboard_issues: "",
    dashboard_issues_details: "",
    dashboard_doubts: "",
    dashboard_doubts_details: "",
    application_concerns: "",
    application_concerns_details: "",
    overall_feedback: "",
    key_challenges: "",
    am_actions: "",
    client_actions: "",
    next_followup_date: "",
    next_phase_plan: "",
    confirmed_details: false,
    rep_signature: user.name || ""
  })

  const handleChange = (field: string, value: any) => {
    let finalValue = value;
    if (field === "awl_id" && typeof value === "string") {
      finalValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }))
  }

  const generatePDF = (sub: any) => {
    const printWindow = window.open('', '', 'width=800,height=900')
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Progressive Call Form - ${sub.awl_id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
            * { box-sizing: border-box; }
            @page { margin: 10mm; size: A4; }
            body { font-family: 'Outfit', system-ui, sans-serif; color: #1e293b; padding: 6px 10px; margin: 0; background: #f8fafc; font-size: 13px; }
            .page { background: white; padding: 10px 14px; border-radius: 8px; margin: 0 auto; border: 1px solid #e2e8f0; max-width: 800px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 16px; font-weight: 900; margin: 0; color: #1e1b4b; text-transform: uppercase; letter-spacing: -0.02em; }
            .subtitle { font-size: 14px; color: #64748b; margin: 0; font-weight: 600; }
            .section { margin-bottom: 4px; background: #f8fafc; padding: 5px 7px; border-radius: 5px; border: 1px solid #e2e8f0; }
            .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #4f46e5; border-bottom: 1px solid #e0e7ff; padding-bottom: 2px; margin-bottom: 3px; letter-spacing: 0.04em; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; }
            .field { margin-bottom: 0; page-break-inside: avoid; }
            .label { font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 1px; line-height: 1.3; display: block; }
            .value { font-size: 12px; font-weight: 400; color: #4338ca; line-height: 1.2; padding: 2px 4px; background: #f1f5f9; border-radius: 3px; display: block; word-break: break-word; }
            .full-width { grid-column: 1 / -1; }
            .signature-block { display: flex; justify-content: flex-end; margin-top: 15px; page-break-inside: avoid; }
            .signature-field { width: 220px; text-align: center; border-top: 1.5px solid #94a3b8; padding-top: 4px; }
            .signature-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
            .signature-value { font-size: 13px; font-weight: 600; color: #1e1b4b; margin-bottom: 2px; }
            @media print {
              body { background: white; padding: 0; margin: 0; }
              .page { box-shadow: none; border: none; padding: 6px 0; margin: 0; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <h1 class="title">Progressive Call Record</h1>
              <p class="subtitle">Submitted by ${sub.rep_name} (${sub.rep_email}) on ${new Date(sub.created_at).toLocaleString()}</p>
            </div>

            <div class="section">
              <div class="section-title">Call Details</div>
              <div class="grid">
                <div class="field"><div class="label">AWL-ID</div><div class="value">${sub.awl_id}</div></div>
                <div class="field"><div class="label">Date of Call</div><div class="value">${new Date(sub.date_of_call).toLocaleDateString()}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Application Progress</div>
              <div class="grid">
                <div class="field"><div class="label">How many applications have been submitted so far?</div><div class="value">${sub.total_applications || '0'}</div></div>
                <div class="field"><div class="label">How many applications were submitted in the last 7 days?</div><div class="value">${sub.applications_last_7_days || '0'}</div></div>
                <div class="field"><div class="label">Has the client received any assessments?</div><div class="value">${sub.received_assessments}</div></div>
                <div class="field"><div class="label">Has the client attended any interviews?</div><div class="value">${sub.attended_interviews}</div></div>
              </div>
              ${sub.received_assessments === 'Yes' ? `<div class="field full-width" style="margin-top: 4px;"><div class="label">If yes, mention details:</div><div class="value">${sub.assessments_details}</div></div>` : ''}
              ${sub.attended_interviews === 'Yes' ? `<div class="field full-width" style="margin-top: 4px;"><div class="label">If yes, mention details:</div><div class="value">${sub.interviews_details}</div></div>` : ''}
            </div>

            <div class="section">
              <div class="section-title">Concerns & Issues</div>
              <div class="grid">
                <div class="field"><div class="label">Is the client facing any issues with the dashboard?</div><div class="value">${sub.dashboard_issues}</div></div>
                <div class="field"><div class="label">Does the client have any doubts regarding dashboard usage?</div><div class="value">${sub.dashboard_doubts}</div></div>
                <div class="field"><div class="label">Has the client raised any concerns regarding applications?</div><div class="value">${sub.application_concerns}</div></div>
              </div>
              ${sub.dashboard_issues === 'Yes' ? `<div class="field full-width" style="margin-top: 4px;"><div class="label">If yes, describe the issue:</div><div class="value">${sub.dashboard_issues_details}</div></div>` : ''}
              ${sub.dashboard_doubts === 'Yes' ? `<div class="field full-width" style="margin-top: 4px;"><div class="label">If yes, specify:</div><div class="value">${sub.dashboard_doubts_details}</div></div>` : ''}
              ${sub.application_concerns === 'Yes' ? `<div class="field full-width" style="margin-top: 4px;"><div class="label">If yes, provide details:</div><div class="value">${sub.application_concerns_details}</div></div>` : ''}
            </div>

            <div class="section">
              <div class="section-title">Feedback & Next Steps</div>
              <div class="field full-width" style="margin-bottom: 4px;"><div class="label">Client’s overall feedback on current progress:</div><div class="value">${sub.overall_feedback || 'N/A'}</div></div>
              <div class="field full-width" style="margin-bottom: 4px;"><div class="label">Key challenges identified during the call:</div><div class="value">${sub.key_challenges || 'N/A'}</div></div>
              <div class="grid">
                <div class="field"><div class="label">Actions to be taken by Account Manager:</div><div class="value">${sub.am_actions || 'N/A'}</div></div>
                <div class="field"><div class="label">Actions required from client:</div><div class="value">${sub.client_actions || 'N/A'}</div></div>
                <div class="field"><div class="label">Next follow-up date (Renewal Call):</div><div class="value">${sub.next_followup_date ? new Date(sub.next_followup_date).toLocaleDateString() : 'N/A'}</div></div>
                <div class="field"><div class="label">Plan for next phase of applications:</div><div class="value">${sub.next_phase_plan || 'N/A'}</div></div>
                <div class="field full-width" style="margin-top: 4px;"><div class="label">I confirm that all the above details were discussed with the client and recorded accurately. (I Agree)</div><div class="value">${sub.confirmed_details ? "Yes, I Agree" : "No"}</div></div>
              </div>
              <div class="signature-block">
                <div class="signature-field">
                  <div class="signature-value">${sub.rep_signature}</div>
                  <div class="signature-label">Full Name (Signature)</div>
                </div>
              </div>
            </div>

          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
          </body>
        </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const awlRegex = /^AWL-\d+$/
    if (!awlRegex.test(formData.awl_id.trim())) return alert("AWL-ID must be in the format AWL-1234")
    if (!formData.date_of_call) return alert("Please select the Date of Call")
    if (formData.total_applications === "") return alert("Please enter the Total Applications submitted so far")
    if (formData.applications_last_7_days === "") return alert("Please enter the Applications submitted in the last 7 days")

    if (!formData.received_assessments) return alert("Please specify if client has received any assessments")
    if (formData.received_assessments === "Yes" && (!formData.assessments_details || !formData.assessments_details.trim())) {
      return alert("Please enter the assessments details")
    }

    if (!formData.attended_interviews) return alert("Please specify if client has attended any interviews")
    if (formData.attended_interviews === "Yes" && (!formData.interviews_details || !formData.interviews_details.trim())) {
      return alert("Please enter the interviews details")
    }

    if (!formData.dashboard_issues) return alert("Please specify if client is facing dashboard issues")
    if (formData.dashboard_issues === "Yes" && (!formData.dashboard_issues_details || !formData.dashboard_issues_details.trim())) {
      return alert("Please enter the dashboard issue details")
    }

    if (!formData.dashboard_doubts) return alert("Please specify if client has doubts regarding dashboard usage")
    if (formData.dashboard_doubts === "Yes" && (!formData.dashboard_doubts_details || !formData.dashboard_doubts_details.trim())) {
      return alert("Please enter the doubts details")
    }

    if (!formData.application_concerns) return alert("Please specify if client has concerns regarding applications")
    if (formData.application_concerns === "Yes" && (!formData.application_concerns_details || !formData.application_concerns_details.trim())) {
      return alert("Please enter the application concern details")
    }

    if (!formData.overall_feedback || !formData.overall_feedback.trim()) return alert("Please enter client’s overall feedback")
    if (!formData.key_challenges || !formData.key_challenges.trim()) return alert("Please enter key challenges identified")
    if (!formData.am_actions || !formData.am_actions.trim()) return alert("Please enter actions to be taken by Account Manager")

    if (!formData.next_followup_date) return alert("Please select the Next follow-up date")
    if (!formData.next_phase_plan || !formData.next_phase_plan.trim()) return alert("Please enter the Plan for next phase of applications")
    if (!formData.confirmed_details) {
      return alert("Please check: 'I confirm that all the above details were discussed with the client and recorded accurately. (I Agree)'")
    }
    if (!formData.rep_signature || !formData.rep_signature.trim()) return alert("Please enter your Signature (Full Name)")

    setLoading(true)

    try {
      const submission = {
        rep_email: user.email,
        rep_name: user.name,
        ...formData,
        date_of_call: formData.date_of_call || null,
        next_followup_date: formData.next_followup_date || null
      }

      if (editId) {
        // Update case
        const { error } = await supabase
          .from('account_progressive_calls')
          .update({ ...submission, is_edited: true })
          .eq('id', editId)

        if (error) {
          const originalSignature = submission.rep_signature || ''
          const signatureWithTag = originalSignature.endsWith(' [EDITED]') 
            ? originalSignature 
            : `${originalSignature} [EDITED]`

          const fallbackData = {
            ...submission,
            rep_signature: signatureWithTag
          }

          const { error: fallbackError } = await supabase
            .from('account_progressive_calls')
            .update(fallbackData)
            .eq('id', editId)

          if (fallbackError) throw fallbackError
        }

        alert("Progressive Call Form Updated Successfully!")
        if (onSuccess) onSuccess()
      } else {
        // Insert case
        const { error } = await supabase.from('account_progressive_calls').insert([submission])
        if (error) throw error
        alert("Progressive Call Form Submitted Successfully!")
      }

      fetchSubmittedForms()
      cancelEdit()
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: any) {
      console.error(err)
      alert("Error submitting form: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Progressive Call Form
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">
            Record regular progress updates and feedback with the client.
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">AWL-ID *</label>
                <Input disabled={viewerMode} required placeholder="AWL-1234" value={formData.awl_id} onChange={e => handleChange("awl_id", e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Date of Call *</label>
                <Input disabled={viewerMode} required type="date" value={formData.date_of_call} onChange={e => handleChange("date_of_call", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">How many applications have been submitted so far? *</label>
                <Input disabled={viewerMode} required type="number" placeholder="0" value={formData.total_applications} onChange={e => handleChange("total_applications", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">How many applications were submitted in the last 7 days? *</label>
                <Input disabled={viewerMode} required type="number" placeholder="0" value={formData.applications_last_7_days} onChange={e => handleChange("applications_last_7_days", e.target.value)} />
              </div>

              {/* ASSESSMENTS */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Has the client received any assessments? *</label>
                <Select disabled={viewerMode} required value={formData.received_assessments} onValueChange={v => handleChange("received_assessments", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.received_assessments === "Yes" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">If yes, mention details: *</label>
                  <Textarea disabled={viewerMode} required placeholder="Details about assessments..." value={formData.assessments_details} onChange={e => handleChange("assessments_details", e.target.value)} />
                </div>
              )}

              {/* INTERVIEWS */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Has the client attended any interviews? *</label>
                <Select disabled={viewerMode} required value={formData.attended_interviews} onValueChange={v => handleChange("attended_interviews", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.attended_interviews === "Yes" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">If yes, mention details: *</label>
                  <Textarea disabled={viewerMode} required placeholder="Details about interviews..." value={formData.interviews_details} onChange={e => handleChange("interviews_details", e.target.value)} />
                </div>
              )}

              {/* DASHBOARD ISSUES */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Is the client facing any issues with the dashboard? *</label>
                <Select disabled={viewerMode} required value={formData.dashboard_issues} onValueChange={v => handleChange("dashboard_issues", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.dashboard_issues === "Yes" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">If yes, describe the issue: *</label>
                  <Textarea disabled={viewerMode} required placeholder="Details about issues..." value={formData.dashboard_issues_details} onChange={e => handleChange("dashboard_issues_details", e.target.value)} />
                </div>
              )}

              {/* DASHBOARD DOUBTS */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Does the client have any doubts regarding dashboard usage? *</label>
                <Select disabled={viewerMode} required value={formData.dashboard_doubts} onValueChange={v => handleChange("dashboard_doubts", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.dashboard_doubts === "Yes" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">If yes, specify: *</label>
                  <Textarea disabled={viewerMode} required placeholder="Specify doubts..." value={formData.dashboard_doubts_details} onChange={e => handleChange("dashboard_doubts_details", e.target.value)} />
                </div>
              )}

              {/* APP CONCERNS */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Has the client raised any concerns regarding applications? *</label>
                <Select disabled={viewerMode} required value={formData.application_concerns} onValueChange={v => handleChange("application_concerns", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.application_concerns === "Yes" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">If yes, provide details: *</label>
                  <Textarea disabled={viewerMode} required placeholder="Application concerns..." value={formData.application_concerns_details} onChange={e => handleChange("application_concerns_details", e.target.value)} />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Client’s overall feedback on current progress: *</label>
                <Textarea disabled={viewerMode} required placeholder="Enter feedback" value={formData.overall_feedback} onChange={e => handleChange("overall_feedback", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Key challenges identified during the call: *</label>
                <Textarea disabled={viewerMode} required placeholder="Enter challenges" value={formData.key_challenges} onChange={e => handleChange("key_challenges", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Actions to be taken by Account Manager: *</label>
                <Textarea disabled={viewerMode} required placeholder="Enter actions for AM" value={formData.am_actions} onChange={e => handleChange("am_actions", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Actions required from client:</label>
                <Textarea disabled={viewerMode} placeholder="Enter actions for client" value={formData.client_actions} onChange={e => handleChange("client_actions", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Next follow-up date (Renewal Call): *</label>
                <Input disabled={viewerMode} required type="date" value={formData.next_followup_date} onChange={e => handleChange("next_followup_date", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Plan for next phase of applications: *</label>
                <Input disabled={viewerMode} required placeholder="Enter plan" value={formData.next_phase_plan} onChange={e => handleChange("next_phase_plan", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    disabled={viewerMode}
                    id="confirmed_details" 
                    checked={formData.confirmed_details}
                    onCheckedChange={(c) => handleChange("confirmed_details", c)}
                  />
                  <label htmlFor="confirmed_details" className="text-sm font-medium leading-none">
                    I confirm that all the above details were discussed with the client and recorded accurately. (I Agree) *
                  </label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Full Name (Signature) *</label>
                <Input disabled={viewerMode} required placeholder="Your Full Name" value={formData.rep_signature} onChange={e => handleChange("rep_signature", e.target.value)} />
              </div>
            </div>

            {!viewerMode && (
              <div className="pt-4 flex justify-end gap-3">
                {editId && (
                  <Button type="button" onClick={cancelEdit} disabled={loading} className="bg-slate-200 text-slate-700 font-bold h-12 px-8 rounded-xl hover:bg-slate-300 transition-all">
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" disabled={loading} className="bg-indigo-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  {loading ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Progressive Record" : "Submit Progressive Record")}
                </Button>
              </div>
            )}
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
