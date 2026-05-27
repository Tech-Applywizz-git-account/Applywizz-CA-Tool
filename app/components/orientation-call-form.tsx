"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Send, FileText, Download, Edit } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface OrientationCallFormProps {
  user: any;
  viewerMode?: boolean;
  initialEditSub?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OrientationCallForm({ user, viewerMode = false, initialEditSub, onSuccess, onCancel }: OrientationCallFormProps) {
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
      plan_start_date: sub.plan_start_date ? sub.plan_start_date.substring(0, 10) : new Date().toISOString().split('T')[0],
      spoc_explained: sub.spoc_explained || "",
      client_preferred_name: sub.client_preferred_name || "",
      dashboard_login_success: sub.dashboard_login_success || "",
      dashboard_navigation_shown: sub.dashboard_navigation_shown || "",
      easy_apply_guided: sub.easy_apply_guided || "",
      staffing_agencies_explained: sub.staffing_agencies_explained || "",
      w2_jobs_explained: sub.w2_jobs_explained || "",
      client_confidence_scale: sub.client_confidence_scale || "",
      specific_preferences: sub.specific_preferences || "",
      next_call_informed: sub.next_call_informed || "",
      additional_updates_promised: sub.additional_updates_promised || "",
      client_concerns: sub.client_concerns || "",
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
      plan_start_date: new Date().toISOString().split('T')[0],
      spoc_explained: "",
      client_preferred_name: "",
      dashboard_login_success: "",
      dashboard_navigation_shown: "",
      easy_apply_guided: "",
      staffing_agencies_explained: "",
      w2_jobs_explained: "",
      client_confidence_scale: "",
      specific_preferences: "",
      next_call_informed: "",
      additional_updates_promised: "",
      client_concerns: "",
      rep_signature: user.name || ""
    })
  }

  const fetchSubmittedForms = async () => {
    try {
      const { data, error } = await supabase
        .from('account_orientation_calls')
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
    plan_start_date: new Date().toISOString().split('T')[0],
    spoc_explained: "",
    client_preferred_name: "",
    dashboard_login_success: "",
    dashboard_navigation_shown: "",
    easy_apply_guided: "",
    staffing_agencies_explained: "",
    w2_jobs_explained: "",
    client_confidence_scale: "",
    specific_preferences: "",
    next_call_informed: "",
    additional_updates_promised: "",
    client_concerns: "",
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
          <title>Orientation Call Form - ${sub.awl_id}</title>
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
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; }
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
              <h1 class="title">Orientation Call Record</h1>
              <p class="subtitle">Submitted by ${sub.rep_name} (${sub.rep_email}) on ${new Date(sub.created_at).toLocaleString()}</p>
            </div>

            <div class="section">
              <div class="section-title">Client Basics</div>
              <div class="grid">
                <div class="field"><div class="label">AWL-ID</div><div class="value">${sub.awl_id}</div></div>
                <div class="field"><div class="label">Plan start date</div><div class="value">${new Date(sub.plan_start_date).toLocaleDateString()}</div></div>
                <div class="field"><div class="label">What name should we use to address the client (including correct pronunciation or nickname if any)?</div><div class="value">${sub.client_preferred_name || 'N/A'}</div></div>
                <div class="field"><div class="label">Did you clearly explain that you are the client's single point of contact for everything related to their account?</div><div class="value">${sub.spoc_explained}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Dashboard & Operations</div>
              <div class="grid">
                <div class="field"><div class="label">Did the client successfully log in to their dashboard during the call?</div><div class="value">${sub.dashboard_login_success}</div></div>
                <div class="field"><div class="label">Did you show the client where to see: Number of jobs applied, Status of each application</div><div class="value">${sub.dashboard_navigation_shown}</div></div>
                <div class="field"><div class="label">Did you guide the client on how to initiate Easy Apply applications?</div><div class="value">${sub.easy_apply_guided}</div></div>
                <div class="field"><div class="label">On a scale of 1–5, how confident did the client seem in using the dashboard without help?</div><div class="value">${sub.client_confidence_scale}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Education & Expectations</div>
              <div class="grid">
                <div class="field"><div class="label">Did you explain to the client what staffing agencies are and how those jobs work for their job search?</div><div class="value">${sub.staffing_agencies_explained}</div></div>
                <div class="field"><div class="label">Did you explain W2 jobs to the client?</div><div class="value">${sub.w2_jobs_explained}</div></div>
                <div class="field"><div class="label">Did you clearly inform the client that the next scheduled review call (Progressive Call) will happen?</div><div class="value">${sub.next_call_informed}</div></div>
              </div>
              <div class="field full-width" style="margin-top: 4px;"><div class="label">Did the client mention any specific preferences? (Location, Salary range, Visa type, Remote / on-site, Company type)</div><div class="value">${sub.specific_preferences || 'None'}</div></div>
              <div class="field full-width" style="margin-top: 4px;"><div class="label">Did you promise any additional updates? If yes, mention exactly what was promised.</div><div class="value">${sub.additional_updates_promised || 'None'}</div></div>
              <div class="field full-width" style="margin-top: 4px;"><div class="label">Did the client raise any concerns, fears, or expectations that the internal team should track?</div><div class="value">${sub.client_concerns || 'None'}</div></div>
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

    if (!formData.plan_start_date) return alert("Please select the Plan Start Date")
    if (!formData.spoc_explained) return alert("Please specify if SPOC was explained")
    if (!formData.client_preferred_name || !formData.client_preferred_name.trim()) return alert("Please enter Client's Preferred Name")
    if (!formData.dashboard_login_success) return alert("Please specify if dashboard login was successful")
    if (!formData.dashboard_navigation_shown) return alert("Please specify if dashboard navigation was shown")
    if (!formData.easy_apply_guided) return alert("Please specify if easy apply was guided")
    if (!formData.staffing_agencies_explained) return alert("Please specify if staffing agencies policy was explained")
    if (!formData.w2_jobs_explained) return alert("Please specify if W2 jobs were explained")
    if (!formData.client_confidence_scale) return alert("Please select the Client Confidence Scale")
    if (!formData.specific_preferences || !formData.specific_preferences.trim()) return alert("Please enter Client's Specific Preferences")
    if (!formData.next_call_informed) return alert("Please specify if client was informed about the next review call")
    if (!formData.additional_updates_promised || !formData.additional_updates_promised.trim()) return alert("Please enter Details of Promised Updates")
    if (!formData.client_concerns || !formData.client_concerns.trim()) return alert("Please enter Client Concerns")
    if (!formData.rep_signature || !formData.rep_signature.trim()) return alert("Please enter your Signature (Full Name)")

    setLoading(true)

    try {
      const submission = {
        rep_email: user.email,
        rep_name: user.name,
        ...formData,
        plan_start_date: formData.plan_start_date || null
      }

      if (editId) {
        const { error } = await supabase
          .from('account_orientation_calls')
          .update({
            ...submission,
            is_edited: true
          })
          .eq('id', editId)
        if (error) throw error
        alert("Orientation Call Form Updated Successfully!")
        if (onSuccess) onSuccess()
      } else {
        const { error } = await supabase.from('account_orientation_calls').insert([submission])
        if (error) throw error
        alert("Orientation Call Form Submitted Successfully!")
      }

      fetchSubmittedForms()
      
      setFormData({
        awl_id: "",
        plan_start_date: new Date().toISOString().split('T')[0],
        spoc_explained: "",
        client_preferred_name: "",
        dashboard_login_success: "",
        dashboard_navigation_shown: "",
        easy_apply_guided: "",
        staffing_agencies_explained: "",
        w2_jobs_explained: "",
        client_confidence_scale: "",
        specific_preferences: "",
        next_call_informed: "",
        additional_updates_promised: "",
        client_concerns: "",
        rep_signature: user.name || ""
      })
      setEditId(null)
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Orientation Call Form
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">
            Record details from the client orientation process.
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
                <label className="text-xs font-bold text-slate-600">Plan Start Date *</label>
                <Input disabled={viewerMode} required type="date" value={formData.plan_start_date} onChange={e => handleChange("plan_start_date", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Did you clearly explain that you are the client’s single point of contact for everything related to their account? *</label>
                <Select disabled={viewerMode} required value={formData.spoc_explained} onValueChange={v => handleChange("spoc_explained", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">What name should we use to address the client (including correct pronunciation or nickname if any)? *</label>
                <Input disabled={viewerMode} required placeholder="Client's preferred name" value={formData.client_preferred_name} onChange={e => handleChange("client_preferred_name", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Did the client successfully log in to their dashboard during the call? *</label>
                <Select disabled={viewerMode} required value={formData.dashboard_login_success} onValueChange={v => handleChange("dashboard_login_success", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Did you show the client where to see: Number of jobs applied, Status of each application? *</label>
                <Select disabled={viewerMode} required value={formData.dashboard_navigation_shown} onValueChange={v => handleChange("dashboard_navigation_shown", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Did you guide the client on how to initiate Easy Apply applications? *</label>
                <Select disabled={viewerMode} required value={formData.easy_apply_guided} onValueChange={v => handleChange("easy_apply_guided", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Did you explain to the client what staffing agencies are and how those jobs work for their job search? *</label>
                <Select disabled={viewerMode} required value={formData.staffing_agencies_explained} onValueChange={v => handleChange("staffing_agencies_explained", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Did you explain W2 jobs to the client? *</label>
                <Select disabled={viewerMode} required value={formData.w2_jobs_explained} onValueChange={v => handleChange("w2_jobs_explained", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">On a scale of 1–5, how confident did the client seem in using the dashboard without help? *</label>
                <Select disabled={viewerMode} required value={formData.client_confidence_scale} onValueChange={v => handleChange("client_confidence_scale", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Extremely confident">Extremely confident</SelectItem>
                    <SelectItem value="Somewhat confident">Somewhat confident</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                    <SelectItem value="Somewhat not confident">Somewhat not confident</SelectItem>
                    <SelectItem value="Extremely not confident">Extremely not confident</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Did the client mention any specific preferences: Location, Salary range, Visa type, Remote / on-site, Company type (startup / MNC, etc.)? *</label>
                <Textarea disabled={viewerMode} required placeholder="Enter details..." value={formData.specific_preferences} onChange={e => handleChange("specific_preferences", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Did you clearly inform the client that the next scheduled review call (Progressive Call)? *</label>
                <Select disabled={viewerMode} required value={formData.next_call_informed} onValueChange={v => handleChange("next_call_informed", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Did you promise any additional updates (for example: weekly WhatsApp summary, only email updates, etc.)? If yes, mention exactly what was promised. *</label>
                <Textarea disabled={viewerMode} required placeholder="Enter details..." value={formData.additional_updates_promised} onChange={e => handleChange("additional_updates_promised", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Did the client raise any concerns, fears, or expectations that the internal team should track? *</label>
                <Textarea disabled={viewerMode} required placeholder="Enter details..." value={formData.client_concerns} onChange={e => handleChange("client_concerns", e.target.value)} />
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
                  {loading ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Call Record" : "Submit Orientation Record")}
                </Button>
              </div>
            )}
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
