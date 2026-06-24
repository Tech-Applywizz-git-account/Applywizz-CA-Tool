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

interface RenewalCallFormProps {
  user: any;
  viewerMode?: boolean;
  initialEditSub?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CONCERN_OPTIONS = [
  "Budget",
  "Delayed results",
  "Personal circumstances",
  "Offer secured",
  "Service understanding",
  "Other"
];

export function RenewalCallForm({ user, viewerMode = false, initialEditSub, onSuccess, onCancel }: RenewalCallFormProps) {
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
    
    // Parse primary concerns from comma-separated string back to array of options
    let parsedConcerns: string[] = []
    if (sub.primary_concern) {
      if (Array.isArray(sub.primary_concern)) {
        parsedConcerns = sub.primary_concern
      } else if (typeof sub.primary_concern === 'string') {
        parsedConcerns = sub.primary_concern.split(',').map((c: string) => c.trim()).filter(Boolean)
      }
    }

    // Determine package choice
    let packageChoice = ""
    let otherPackageDetails = ""
    const standardPackages = ["1 Month Renewal", "2 Months Renewal (Special Offer)", "3 Months Renewal", "Declined (No Renewal)"]
    if (sub.renewal_package_selected) {
      if (standardPackages.includes(sub.renewal_package_selected)) {
        packageChoice = sub.renewal_package_selected
      } else {
        packageChoice = "Other"
        otherPackageDetails = sub.renewal_package_selected
      }
    }

    setFormData({
      awl_id: sub.awl_id || "",
      subscription_start_date: sub.subscription_start_date ? sub.subscription_start_date.substring(0, 10) : "",
      renewal_date: sub.renewal_date ? sub.renewal_date.substring(0, 10) : "",
      total_applications_completed: sub.total_applications_completed !== undefined && sub.total_applications_completed !== null ? String(sub.total_applications_completed) : "",
      customized_resumes_created: sub.customized_resumes_created !== undefined && sub.customized_resumes_created !== null ? String(sub.customized_resumes_created) : "",
      assessments_generated: sub.assessments_generated !== undefined && sub.assessments_generated !== null ? String(sub.assessments_generated) : "",
      interviews_generated: sub.interviews_generated !== undefined && sub.interviews_generated !== null ? String(sub.interviews_generated) : "",
      progress_explained: sub.progress_explained || "",
      key_metrics_discussed: sub.key_metrics_discussed || "",
      key_success_points: sub.key_success_points || "",
      actively_seeking: sub.actively_seeking || "",
      primary_goal: sub.primary_goal || "",
      interested_in_renewing: sub.interested_in_renewing || "",
      primary_concern: parsedConcerns,
      other_concern_details: sub.other_concern_details || "",
      final_decision: sub.final_decision || "",
      package_choice: packageChoice,
      other_package_details: otherPackageDetails,
      renewal_package_selected: sub.renewal_package_selected || "",
      client_sentiment: sub.client_sentiment || "",
      am_remarks: sub.am_remarks || "",
      escalation_required: sub.escalation_required || "",
      escalation_details: sub.escalation_details || "",
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
      subscription_start_date: "",
      renewal_date: "",
      total_applications_completed: "",
      customized_resumes_created: "",
      assessments_generated: "",
      interviews_generated: "",
      progress_explained: "",
      key_metrics_discussed: "",
      key_success_points: "",
      actively_seeking: "",
      primary_goal: "",
      interested_in_renewing: "",
      primary_concern: [],
      other_concern_details: "",
      final_decision: "",
      package_choice: "",
      other_package_details: "",
      renewal_package_selected: "",
      client_sentiment: "",
      am_remarks: "",
      escalation_required: "",
      escalation_details: "",
      rep_signature: user.name || ""
    })
  }

  const fetchSubmittedForms = async () => {
    try {
      const { data, error } = await supabase
        .from('account_renewal_calls')
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
    subscription_start_date: "",
    renewal_date: "",
    total_applications_completed: "",
    customized_resumes_created: "",
    assessments_generated: "",
    interviews_generated: "",
    progress_explained: "",
    key_metrics_discussed: "",
    key_success_points: "",
    actively_seeking: "",
    primary_goal: "",
    interested_in_renewing: "",
    primary_concern: [] as string[],
    other_concern_details: "",
    final_decision: "",
    package_choice: "",
    other_package_details: "",
    renewal_package_selected: "",
    client_sentiment: "",
    am_remarks: "",
    escalation_required: "",
    escalation_details: "",
    rep_signature: user.name || ""
  })

  const handleChange = (field: string, value: any) => {
    let finalValue = value;
    if (field === "awl_id" && typeof value === "string") {
      finalValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }))
  }

  const toggleConcern = (concern: string) => {
    setFormData(prev => {
      const current = prev.primary_concern;
      if (current.includes(concern)) {
        return { ...prev, primary_concern: current.filter(c => c !== concern) }
      } else {
        return { ...prev, primary_concern: [...current, concern] }
      }
    })
  }

  const generatePDF = (sub: any) => {
    const printWindow = window.open('', '', 'width=800,height=900')
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Renewal Call Form - ${sub.awl_id}</title>
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
              <h1 class="title">Renewal Call Record</h1>
              <p class="subtitle">Submitted by ${sub.rep_name} (${sub.rep_email}) on ${new Date(sub.created_at).toLocaleString()}</p>
            </div>

            <div class="section">
              <div class="section-title">Client Basics</div>
              <div class="grid">
                <div class="field"><div class="label">AWL-ID</div><div class="value">${sub.awl_id}</div></div>
                <div class="field"><div class="label">Subscription Start Date</div><div class="value">${new Date(sub.subscription_start_date).toLocaleDateString()}</div></div>
                <div class="field"><div class="label">Renewal Date</div><div class="value">${new Date(sub.renewal_date).toLocaleDateString()}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Progress & Metrics</div>
              <div class="grid">
                <div class="field"><div class="label">How many total job applications were completed?</div><div class="value">${sub.total_applications_completed || '0'}</div></div>
                <div class="field"><div class="label">How many customized resumes were created/optimized?</div><div class="value">${sub.customized_resumes_created || '0'}</div></div>
                <div class="field"><div class="label">How many assessments were generated?</div><div class="value">${sub.assessments_generated || '0'}</div></div>
                <div class="field"><div class="label">How many interviews were generated?</div><div class="value">${sub.interviews_generated || '0'}</div></div>
                <div class="field"><div class="label">Did the account manager clearly explain all completed work and progress?</div><div class="value">${sub.progress_explained}</div></div>
                <div class="field"><div class="label">Were the key metrics discussed with the client? (Total apps, Resume improvements, Market expansion, Interview opps)</div><div class="value">${sub.key_metrics_discussed}</div></div>
              </div>
              <div class="field full-width" style="margin-top: 4px;"><div class="label">What key success points were highlighted to encourage renewal?</div><div class="value">${sub.key_success_points || 'None'}</div></div>
            </div>

            <div class="section">
              <div class="section-title">Discussion & Insights</div>
              <div class="grid">
                <div class="field"><div class="label">Is the client still actively seeking employment opportunities?</div><div class="value">${sub.actively_seeking}</div></div>
                <div class="field"><div class="label">What is the client's current primary goal?</div><div class="value">${sub.primary_goal || 'N/A'}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Renewal Decision</div>
              <div class="grid">
                <div class="field"><div class="label">Was the client interested in renewing?</div><div class="value">${sub.interested_in_renewing}</div></div>
                <div class="field"><div class="label">If hesitant, what was the primary concern?</div><div class="value">${sub.primary_concern || 'None'}</div></div>
                <div class="field"><div class="label">Other concern details</div><div class="value">${sub.other_concern_details || 'N/A'}</div></div>
                <div class="field"><div class="label">Final renewal decision</div><div class="value">${sub.final_decision}</div></div>
                <div class="field"><div class="label">Renewal package selected</div><div class="value">${sub.renewal_package_selected || 'N/A'}</div></div>
                <div class="field"><div class="label">Client sentiment after renewal discussion</div><div class="value">${sub.client_sentiment || 'N/A'}</div></div>
              </div>
              <div class="field full-width" style="margin-top: 4px;"><div class="label">Account Manager remarks</div><div class="value">${sub.am_remarks || 'None'}</div></div>
            </div>

            <div class="section">
              <div class="section-title">Escalation & Signature</div>
              <div class="grid">
                <div class="field"><div class="label">Escalation to senior team required?</div><div class="value">${sub.escalation_required || 'No'}</div></div>
                <div class="field"><div class="label">If yes, explain</div><div class="value">${sub.escalation_details || 'N/A'}</div></div>
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

    if (!formData.subscription_start_date) return alert("Please select the Subscription Start Date")
    if (!formData.renewal_date) return alert("Please select the Renewal Date")
    if (formData.total_applications_completed === "") return alert("Please enter the Total Applications Completed")
    if (formData.customized_resumes_created === "") return alert("Please enter the Customized Resumes Created/Optimized")
    if (formData.assessments_generated === "") return alert("Please enter the Assessments Generated")
    if (formData.interviews_generated === "") return alert("Please enter the Interviews Generated")

    if (!formData.progress_explained) return alert("Please specify if progress was clearly explained")
    if (!formData.key_metrics_discussed) return alert("Please specify if key metrics were discussed")
    if (!formData.key_success_points || !formData.key_success_points.trim()) return alert("Please enter the key success points highlighted")

    if (!formData.actively_seeking) return alert("Please specify if the client is actively seeking opportunities")
    if (!formData.primary_goal || !formData.primary_goal.trim()) return alert("Please enter the client’s current primary goal")
    if (!formData.interested_in_renewing) return alert("Please specify if the client was interested in renewing")

    if (formData.interested_in_renewing === "Hesitant" && formData.primary_concern.length === 0) {
      return alert("Please select at least one primary concern because the client is Hesitant.")
    }
    if (formData.primary_concern.includes("Other") && !formData.other_concern_details.trim()) {
      return alert("Please provide details for the 'Other' concern.")
    }
    if (formData.package_choice === "Other" && !formData.other_package_details.trim()) {
      return alert("Please specify the custom renewal package.")
    }
    if (formData.escalation_required === "Yes" && !formData.escalation_details.trim()) {
      return alert("Please provide details for the senior team escalation.")
    }

    if (!formData.final_decision) return alert("Please select the Final Renewal Decision")
    if (!formData.package_choice) return alert("Please select the Renewal Package Selected")
    if (!formData.client_sentiment) return alert("Please select the Client Sentiment")
    if (!formData.am_remarks || !formData.am_remarks.trim()) return alert("Please enter your Remarks")
    if (!formData.escalation_required) return alert("Please specify if escalation is required")
    if (!formData.rep_signature || !formData.rep_signature.trim()) return alert("Please enter your Signature (Full Name)")

    setLoading(true)

    try {
      const submission = {
        rep_email: user.email,
        rep_name: user.name,
        awl_id: formData.awl_id,
        subscription_start_date: formData.subscription_start_date || null,
        renewal_date: formData.renewal_date || null,
        total_applications_completed: formData.total_applications_completed ? parseInt(formData.total_applications_completed as string) : 0,
        customized_resumes_created: formData.customized_resumes_created ? parseInt(formData.customized_resumes_created as string) : 0,
        assessments_generated: formData.assessments_generated ? parseInt(formData.assessments_generated as string) : 0,
        interviews_generated: formData.interviews_generated ? parseInt(formData.interviews_generated as string) : 0,
        progress_explained: formData.progress_explained,
        key_metrics_discussed: formData.key_metrics_discussed,
        key_success_points: formData.key_success_points,
        actively_seeking: formData.actively_seeking,
        primary_goal: formData.primary_goal,
        interested_in_renewing: formData.interested_in_renewing,
        primary_concern: formData.primary_concern.join(", "),
        other_concern_details: formData.other_concern_details,
        final_decision: formData.final_decision,
        renewal_package_selected: formData.package_choice === "Other" ? formData.other_package_details : formData.package_choice,
        client_sentiment: formData.client_sentiment,
        am_remarks: formData.am_remarks,
        escalation_required: formData.escalation_required,
        escalation_details: formData.escalation_details,
        rep_signature: formData.rep_signature
      }

      if (editId) {
        const { error } = await supabase
          .from('account_renewal_calls')
          .update({
            ...submission,
            is_edited: true
          })
          .eq('id', editId)
        if (error) throw error
        alert("Renewal Call Form Updated Successfully!")
        if (onSuccess) onSuccess()
      } else {
        const { error } = await supabase.from('account_renewal_calls').insert([submission])
        if (error) throw error
        alert("Renewal Call Form Submitted Successfully!")
      }

      fetchSubmittedForms()
      
      setFormData({
        awl_id: "",
        subscription_start_date: "",
        renewal_date: "",
        total_applications_completed: "",
        customized_resumes_created: "",
        assessments_generated: "",
        interviews_generated: "",
        progress_explained: "",
        key_metrics_discussed: "",
        key_success_points: "",
        actively_seeking: "",
        primary_goal: "",
        interested_in_renewing: "",
        primary_concern: [],
        other_concern_details: "",
        final_decision: "",
        package_choice: "",
        other_package_details: "",
        renewal_package_selected: "",
        client_sentiment: "",
        am_remarks: "",
        escalation_required: "",
        escalation_details: "",
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
            Renewal Call Form
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">
            Record details from the client renewal discussion.
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
              
              <div className="space-y-2"></div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Subscription Start Date *</label>
                <Input disabled={viewerMode} required type="date" value={formData.subscription_start_date} onChange={e => handleChange("subscription_start_date", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Renewal Date *</label>
                <Input disabled={viewerMode} required type="date" value={formData.renewal_date} onChange={e => handleChange("renewal_date", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">How many total job applications were completed? *</label>
                <Input disabled={viewerMode} required type="number" placeholder="0" value={formData.total_applications_completed} onChange={e => handleChange("total_applications_completed", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">How many customized resumes were created/optimized? *</label>
                <Input disabled={viewerMode} required type="number" placeholder="0" value={formData.customized_resumes_created} onChange={e => handleChange("customized_resumes_created", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">How many assessments were generated? *</label>
                <Input disabled={viewerMode} required type="number" placeholder="0" value={formData.assessments_generated} onChange={e => handleChange("assessments_generated", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">How many interviews were generated? *</label>
                <Input disabled={viewerMode} required type="number" placeholder="0" value={formData.interviews_generated} onChange={e => handleChange("interviews_generated", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Did the account manager clearly explain all completed work and progress achieved? *</label>
                <Select disabled={viewerMode} required value={formData.progress_explained} onValueChange={v => handleChange("progress_explained", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Were the following discussed? (Total apps, Resume improvements, Market expansion, Interview opps, Momentum, Risk of stopping) *</label>
                <Select disabled={viewerMode} required value={formData.key_metrics_discussed} onValueChange={v => handleChange("key_metrics_discussed", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes, all points">Yes, all points</SelectItem>
                    <SelectItem value="Partial">Partial / Some points</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">What key success points were highlighted to encourage renewal? *</label>
                <Textarea disabled={viewerMode} required placeholder="Sample text..." value={formData.key_success_points} onChange={e => handleChange("key_success_points", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Is the client still actively seeking employment opportunities? *</label>
                <Select disabled={viewerMode} required value={formData.actively_seeking} onValueChange={v => handleChange("actively_seeking", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Received Job Offer">Received Job Offer</SelectItem>
                    <SelectItem value="Exploring Different Markets">Exploring Different Markets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">What is the client’s current primary goal? *</label>
                <Input disabled={viewerMode} required placeholder="e.g. More interviews, Switch careers..." value={formData.primary_goal} onChange={e => handleChange("primary_goal", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Was the client interested in renewing? *</label>
                <Select disabled={viewerMode} required value={formData.interested_in_renewing} onValueChange={v => handleChange("interested_in_renewing", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interested">Interested</SelectItem>
                    <SelectItem value="Considering">Considering</SelectItem>
                    <SelectItem value="Hesitant">Hesitant</SelectItem>
                    <SelectItem value="Not Interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Final renewal decision *</label>
                <Select disabled={viewerMode} required value={formData.final_decision} onValueChange={v => handleChange("final_decision", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Successfully Renewed">Successfully Renewed</SelectItem>
                    <SelectItem value="Payment Pending">Payment Pending</SelectItem>
                    <SelectItem value="Follow-Up Required">Follow-Up Required</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 mb-2 block">If hesitant, what was the primary concern? (Required if Hesitant)</label>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {CONCERN_OPTIONS.map(c => (
                    <div key={c} className="flex items-center space-x-2">
                      <Checkbox 
                        disabled={viewerMode}
                        id={`concern-${c}`} 
                        checked={formData.primary_concern.includes(c)}
                        onCheckedChange={() => toggleConcern(c)}
                      />
                      <label htmlFor={`concern-${c}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {c}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {formData.primary_concern.includes("Other") && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">Other concern details *</label>
                  <Input disabled={viewerMode} required placeholder="Specify other concern" value={formData.other_concern_details} onChange={e => handleChange("other_concern_details", e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Renewal package selected: *</label>
                <Select disabled={viewerMode} required value={formData.package_choice} onValueChange={v => handleChange("package_choice", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Package" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20+">20+</SelectItem>
                    <SelectItem value="40+">40+</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.package_choice === "Other" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">Specify other renewal package: *</label>
                  <Input disabled={viewerMode} required placeholder="Specify custom package details" value={formData.other_package_details} onChange={e => handleChange("other_package_details", e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Client sentiment after renewal discussion: *</label>
                <Select disabled={viewerMode} required value={formData.client_sentiment} onValueChange={v => handleChange("client_sentiment", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Account Manager remarks: *</label>
                <Textarea disabled={viewerMode} required placeholder="Enter your remarks here..." value={formData.am_remarks} onChange={e => handleChange("am_remarks", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Escalation to senior team required? *</label>
                <Select disabled={viewerMode} required value={formData.escalation_required} onValueChange={v => handleChange("escalation_required", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.escalation_required === "Yes" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">If yes? (Explain) *</label>
                  <Textarea disabled={viewerMode} required placeholder="Reason for escalation..." value={formData.escalation_details} onChange={e => handleChange("escalation_details", e.target.value)} />
                </div>
              )}

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
                  {loading ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Renewal Record" : "Submit Renewal Record")}
                </Button>
              </div>
            )}
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
