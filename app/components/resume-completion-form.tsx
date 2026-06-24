import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Send, Loader2, UploadCloud, Download, Edit } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"

interface ResumeCompletionFormProps {
  user: any;
  viewerMode?: boolean;
  initialEditSub?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  monthOffset?: number;
}

export function ResumeCompletionForm({ user, viewerMode = false, initialEditSub, onSuccess, onCancel, monthOffset = 0 }: ResumeCompletionFormProps) {
  const [loading, setLoading] = useState(false)
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null)
  const [emailFile, setEmailFile] = useState<File | null>(null)
  const [submittedForms, setSubmittedForms] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [existingLinkedinUrl, setExistingLinkedinUrl] = useState("")
  const [existingEmailUrl, setExistingEmailUrl] = useState("")

  const [formData, setFormData] = useState({
    awl_id: "",
    client_apps_email: "",
    onboarding_form_filled: "",
    discovery_call_completed: "",
    target_role_identified: "",
    goals_documented: "",
    resume_customized: "",
    corrections_completed: "",
    linkedin_optimization_sold: "",
    resume_sent_via_email: "",
    resume_shared_with_onboarding: "",
    additional_notes: "",
    confirmation: false,
    specialist_signature: ""
  })

  const handleChange = (field: string, value: any) => {
    let finalValue = value;
    if (field === "awl_id" && typeof value === "string") {
      finalValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }))
  }

  const fetchSubmittedForms = async () => {
    try {
      const { data, error } = await supabase
        .from('resume_completion_submissions')
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

  useEffect(() => {
    if (initialEditSub) {
      handleEdit(initialEditSub)
    }
  }, [initialEditSub])

  const handleEdit = (sub: any) => {
    if (sub.is_edited) {
      alert("This submission has already been edited once and cannot be edited again.");
      return;
    }
    setEditId(sub.id);
    setExistingLinkedinUrl(sub.linkedin_screenshot_url || "");
    setExistingEmailUrl(sub.email_screenshot_url || "");

    setFormData({
      awl_id: sub.awl_id || "",
      client_apps_email: sub.client_apps_email || "",
      onboarding_form_filled: sub.onboarding_form_filled || "",
      discovery_call_completed: sub.discovery_call_completed || "",
      target_role_identified: sub.target_role_identified || "",
      goals_documented: sub.goals_documented || "",
      resume_customized: sub.resume_customized || "",
      corrections_completed: sub.corrections_completed || "",
      linkedin_optimization_sold: sub.linkedin_optimization_sold || "",
      resume_sent_via_email: sub.resume_sent_via_email || "",
      resume_shared_with_onboarding: sub.resume_shared_with_onboarding || "",
      additional_notes: sub.additional_notes || "",
      confirmation: sub.confirmation === "I Agree",
      specialist_signature: sub.specialist_signature || ""
    });

    setLinkedinFile(null);
    setEmailFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const generatePDF = (sub: any) => {
    const printWindow = window.open('', '', 'width=800,height=900')
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Resume Completion - ${sub.awl_id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
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
            .screenshot { margin-top: 8px; max-width: 100%; max-height: 280px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 4px; }
            .signature-block { display: flex; justify-content: flex-end; margin-top: 15px; page-break-inside: avoid; }
            .signature-field { width: 220px; text-align: center; border-top: 1.5px solid #94a3b8; padding-top: 4px; }
            .signature-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
            .signature-value { font-size: 13px; font-weight: 600; color: #1e1b4b; margin-bottom: 2px; }
            @media print {
              body { background: white; padding: 0; margin: 0; }
              .page { box-shadow: none; border: none; padding: 6px 0; margin: 0; max-width: 100%; }
              .screenshot { max-height: 260px; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <h1 class="title">Resume Completion Record</h1>
              <p class="subtitle">Submitted by ${sub.rep_name} (${sub.rep_email}) on ${new Date(sub.created_at).toLocaleString()}</p>
            </div>

            <div class="section">
              <div class="section-title">Client Identity</div>
              <div class="grid">
                <div class="field"><div class="label">AWL-ID</div><div class="value">${sub.awl_id}</div></div>
                <div class="field"><div class="label">Client Applications Email</div><div class="value">${sub.client_apps_email}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Pre-Resume Verification</div>
              <div class="grid">
                <div class="field"><div class="label">Was the Onboarding Form completely filled?</div><div class="value">${sub.onboarding_form_filled}</div></div>
                <div class="field"><div class="label">Was the Account Management discovery call completed?</div><div class="value">${sub.discovery_call_completed}</div></div>
                <div class="field"><div class="label">Was the client's target job role clearly identified?</div><div class="value">${sub.target_role_identified}</div></div>
                <div class="field"><div class="label">Were client goals and priorities documented?</div><div class="value">${sub.goals_documented}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Resume Quality</div>
              <div class="grid">
                <div class="field"><div class="label">Was the resume customized according to client target roles?</div><div class="value">${sub.resume_customized}</div></div>
                <div class="field"><div class="label">Were all required corrections/revisions completed?</div><div class="value">${sub.corrections_completed}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">LinkedIn Optimization</div>
              <div class="grid">
                <div class="field"><div class="label">LinkedIn optimization Sold?</div><div class="value">${sub.linkedin_optimization_sold}</div></div>
                ${sub.linkedin_optimization_sold === 'Yes' && sub.linkedin_screenshot_url ? `<div class="field"><div class="label">Screenshot</div><div class="value"><a href="${sub.linkedin_screenshot_url}" target="_blank">View Screenshot</a></div></div>` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Delivery</div>
              <div class="grid">
                <div class="field"><div class="label">Was the completed resume sent to the client via Email?</div><div class="value">${sub.resume_sent_via_email}</div></div>
                ${sub.email_screenshot_url ? `<div class="field"><div class="label">Email Screenshot</div><div class="value"><a href="${sub.email_screenshot_url}" target="_blank">View Screenshot</a></div></div>` : ''}
                <div class="field"><div class="label">Was the completed resume shared with onboarding?</div><div class="value">${sub.resume_shared_with_onboarding}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Additional Notes & Confirmation</div>
              <div class="grid">
                <div class="field full-width"><div class="label">Additional Notes</div><div class="value">${sub.additional_notes || 'None'}</div></div>
                <div class="field"><div class="label">Confirmation of Completion</div><div class="value">${sub.confirmation}</div></div>
              </div>
              <div class="signature-block">
                <div class="signature-field">
                  <div class="signature-value">${sub.specialist_signature || 'N/A'}</div>
                  <div class="signature-label">Resume Specialist Signature</div>
                </div>
              </div>
            </div>

            ${sub.linkedin_screenshot_url ? `
            <div class="section" style="margin-top:20px;">
              <div class="section-title">LinkedIn Screenshot</div>
              <img class="screenshot" src="${sub.linkedin_screenshot_url}" alt="LinkedIn Screenshot" />
            </div>
            ` : ''}

            ${sub.email_screenshot_url ? `
            <div class="section" style="margin-top:20px;">
              <div class="section-title">Email Screenshot</div>
              <img class="screenshot" src="${sub.email_screenshot_url}" alt="Email Screenshot" />
            </div>
            ` : ''}
          </div>

          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Explicit validation
    const awlRegex = /^AWL-\d+$/
    if (!awlRegex.test(formData.awl_id.trim())) return alert("AWL-ID must be in the format AWL-1234 (must be capitalized)")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.client_apps_email.trim())) return alert("Please enter a valid Client Applications Email Address")

    if (!formData.onboarding_form_filled) return alert("Please select whether the Onboarding Form was completely filled")
    if (!formData.discovery_call_completed) return alert("Please select whether the Account Management discovery call was completed")
    if (!formData.target_role_identified) return alert("Please select whether the client's target job role was clearly identified")
    if (!formData.goals_documented) return alert("Please select whether client goals and priorities were documented")
    if (!formData.resume_customized) return alert("Please select whether the resume was customized according to client target roles")
    if (!formData.corrections_completed) return alert("Please select whether all required corrections/revisions were completed")
    if (!formData.linkedin_optimization_sold) return alert("Please select whether LinkedIn optimization was sold")
    
    if (formData.linkedin_optimization_sold === "Yes" && !linkedinFile && !existingLinkedinUrl) {
      return alert("Please upload a LinkedIn optimization screenshot")
    }

    if (!formData.resume_sent_via_email) return alert("Please select whether the completed resume was sent to the client via Email")
    if (!emailFile && !existingEmailUrl) return alert("Please upload an Email Screenshot")
    if (!formData.resume_shared_with_onboarding) return alert("Please select whether the completed resume was shared with onboarding")

    if (!formData.confirmation) return alert("Please confirm completion by checking the 'I Agree' checkbox")
    if (!formData.specialist_signature.trim()) return alert("Please provide your Resume Specialist Signature (Full Name)")

    setLoading(true)

    try {
      // Upload LinkedIn screenshot
      let linkedinUrl = existingLinkedinUrl
      if (linkedinFile) {
        const fileExt = linkedinFile.name.split('.').pop()
        const fileName = `linkedin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('resume_submissions').upload(fileName, linkedinFile)
        if (uploadError) {
          console.error("LinkedIn upload error:", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage.from('resume_submissions').getPublicUrl(fileName)
          linkedinUrl = publicUrl
        }
      }

      // Upload Email screenshot
      let emailUrl = existingEmailUrl
      if (emailFile) {
        const fileExt = emailFile.name.split('.').pop()
        const fileName = `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('resume_submissions').upload(fileName, emailFile)
        if (uploadError) {
          console.error("Email upload error:", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage.from('resume_submissions').getPublicUrl(fileName)
          emailUrl = publicUrl
        }
      }

      const submission = {
        rep_email: user.email,
        rep_name: user.name,
        awl_id: formData.awl_id,
        client_apps_email: formData.client_apps_email,
        onboarding_form_filled: formData.onboarding_form_filled,
        discovery_call_completed: formData.discovery_call_completed,
        target_role_identified: formData.target_role_identified,
        goals_documented: formData.goals_documented,
        resume_customized: formData.resume_customized,
        corrections_completed: formData.corrections_completed,
        linkedin_optimization_sold: formData.linkedin_optimization_sold,
        linkedin_screenshot_url: linkedinUrl || null,
        resume_sent_via_email: formData.resume_sent_via_email,
        email_screenshot_url: emailUrl || null,
        resume_shared_with_onboarding: formData.resume_shared_with_onboarding,
        additional_notes: formData.additional_notes,
        confirmation: formData.confirmation ? "I Agree" : "",
        specialist_signature: formData.specialist_signature
      }

      if (editId) {
        const { error } = await supabase.from('resume_completion_submissions')
          .update({ ...submission, is_edited: true })
          .eq('id', editId)
        if (error) throw error
        alert("Resume Completion Form Updated Successfully!")
        if (onSuccess) onSuccess()
      } else {
        const { error } = await supabase.from('resume_completion_submissions').insert([submission])
        if (error) throw error
        alert("Resume Completion Form Submitted Successfully!")
      }

      fetchSubmittedForms()

      // Reset form
      setFormData({
        awl_id: "", client_apps_email: "", onboarding_form_filled: "", discovery_call_completed: "",
        target_role_identified: "", goals_documented: "", resume_customized: "", corrections_completed: "",
        linkedin_optimization_sold: "", resume_sent_via_email: "", resume_shared_with_onboarding: "",
        additional_notes: "", confirmation: false, specialist_signature: ""
      })
      setLinkedinFile(null)
      setEmailFile(null)
      setEditId(null)
      setExistingLinkedinUrl("")
      setExistingEmailUrl("")

    } catch (err: any) {
      console.error(err)
      alert("Error submitting form: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
  const activeMonthStr = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const filteredSubmissions = submittedForms.filter(sub => {
    return new Date(sub.created_at).toLocaleString('default', { month: 'long', year: 'numeric' }) === activeMonthStr
  })

  const isFormEdited = (sub: any) => {
    return sub.is_edited === true
  }

  // Yes/No Select helper
  const YesNoSelect = ({ field, label, disabled }: { field: string; label: string; disabled?: boolean }) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-600">{label} *</label>
      <Select disabled={disabled || viewerMode} value={(formData as any)[field]} onValueChange={v => handleChange(field, v)}>
        <SelectTrigger className="[&>svg]:hidden"><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Yes">Yes</SelectItem>
          <SelectItem value="No">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            {editId ? "Edit Resume Completion Record" : "Resume Completion Form"}
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">
            {editId ? "You can only edit this submission once." : "Submit your completed resume details to the Resume Head Dashboard."}
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Section 1: Client Identity */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Client Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">AWL-ID *</label>
                  <Input disabled={viewerMode} placeholder="e.g. AWL-12345" value={formData.awl_id} onChange={e => handleChange("awl_id", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Client Applications Email *</label>
                  <Input disabled={viewerMode} type="email" placeholder="client@example.com" value={formData.client_apps_email} onChange={e => handleChange("client_apps_email", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section 2: Pre-Resume Verification */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Pre-Resume Verification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <YesNoSelect field="onboarding_form_filled" label="Was the Onboarding Form completely filled?" />
                <YesNoSelect field="discovery_call_completed" label="Was the Account Management discovery call completed?" />
                <YesNoSelect field="target_role_identified" label="Was the client's target job role clearly identified?" />
                <YesNoSelect field="goals_documented" label="Were client goals and priorities documented?" />
              </div>
            </div>

            {/* Section 3: Resume Quality */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Resume Quality</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <YesNoSelect field="resume_customized" label="Was the resume customized according to client target roles?" />
                <YesNoSelect field="corrections_completed" label="Were all required corrections/revisions completed?" />
              </div>
            </div>

            {/* Section 4: LinkedIn Optimization */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">LinkedIn Optimization</h3>
              <div className="grid grid-cols-1 gap-4">
                <YesNoSelect field="linkedin_optimization_sold" label="LinkedIn optimization Sold?" />
                
                {formData.linkedin_optimization_sold === "Yes" && (
                  <div className="space-y-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="text-xs font-bold text-slate-600">Upload LinkedIn Optimization Screenshot (Max 10MB) *</label>
                    <div className="flex items-center gap-3">
                      <Input disabled={viewerMode}
                        id="linkedin-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0] || null;
                          if (selectedFile && !selectedFile.type.startsWith("image/")) {
                            alert("Please upload image files only.");
                            e.target.value = "";
                            setLinkedinFile(null);
                          } else if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
                            alert("File size exceeds 10MB limit.");
                            e.target.value = "";
                            setLinkedinFile(null);
                          } else {
                            setLinkedinFile(selectedFile);
                          }
                        }}
                      />
                      <label htmlFor="linkedin-upload" className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-100 cursor-pointer text-sm font-semibold text-slate-600 transition-colors w-full md:w-1/2">
                        <UploadCloud className="h-4 w-4" /> {linkedinFile ? linkedinFile.name : "Upload Screenshot"}
                      </label>
                    </div>
                    {existingLinkedinUrl && (
                      <div className="mt-1 text-xs text-indigo-600 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Current screenshot uploaded. <a href={existingLinkedinUrl} target="_blank" rel="noreferrer" className="underline font-bold hover:text-indigo-800">View Screenshot</a></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Delivery */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Delivery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <YesNoSelect field="resume_sent_via_email" label="Was the completed resume sent to the client Via Email?" />
                <YesNoSelect field="resume_shared_with_onboarding" label="Was the completed resume shared with onboarding?" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Upload Email Screenshot (Max 10MB) *</label>
                <div className="flex items-center gap-3">
                  <Input disabled={viewerMode}
                    id="email-screenshot-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;
                      if (selectedFile && !selectedFile.type.startsWith("image/")) {
                        alert("Please upload image files only.");
                        e.target.value = "";
                        setEmailFile(null);
                      } else if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
                        alert("File size exceeds 10MB limit.");
                        e.target.value = "";
                        setEmailFile(null);
                      } else {
                        setEmailFile(selectedFile);
                      }
                    }}
                  />
                  <label htmlFor="email-screenshot-upload" className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-sm font-semibold text-slate-600 transition-colors w-full md:w-1/2">
                    <UploadCloud className="h-4 w-4" /> {emailFile ? emailFile.name : "Upload Email Screenshot"}
                  </label>
                </div>
                {existingEmailUrl && (
                  <div className="mt-1 text-xs text-indigo-600 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Current screenshot uploaded. <a href={existingEmailUrl} target="_blank" rel="noreferrer" className="underline font-bold hover:text-indigo-800">View Screenshot</a></span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 6: Notes, Confirmation & Signature */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Notes, Confirmation & Signature</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Additional Notes</label>
                  <textarea
                    disabled={viewerMode}
                    placeholder="Enter any additional notes or observations..."
                    value={formData.additional_notes}
                    onChange={e => handleChange("additional_notes", e.target.value)}
                    className="h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                  />
                </div>

                <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <Checkbox
                    id="confirmation-check"
                    disabled={viewerMode}
                    checked={formData.confirmation}
                    onCheckedChange={(checked) => handleChange("confirmation", checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="confirmation-check" className="text-sm font-bold text-amber-900 cursor-pointer leading-tight">
                    I confirm that all the above details were discussed with the client and recorded accurately. (I Agree) *
                  </label>
                </div>

                <div className="space-y-2 md:w-1/2">
                  <label className="text-xs font-bold text-slate-600">Resume Specialist Signature (Full Name) *</label>
                  <Input disabled={viewerMode} placeholder="Enter your full name" value={formData.specialist_signature} onChange={e => handleChange("specialist_signature", e.target.value)} />
                </div>
              </div>
            </div>

            {!viewerMode && (
              <div className="pt-4 flex justify-end gap-3">
                {editId && (
                  <Button type="button" onClick={() => {
                    setEditId(null);
                    if (onCancel) onCancel();
                    setExistingLinkedinUrl("");
                    setExistingEmailUrl("");
                    setFormData({
                      awl_id: "", client_apps_email: "", onboarding_form_filled: "", discovery_call_completed: "",
                      target_role_identified: "", goals_documented: "", resume_customized: "", corrections_completed: "",
                      linkedin_optimization_sold: "", resume_sent_via_email: "", resume_shared_with_onboarding: "",
                      additional_notes: "", confirmation: false, specialist_signature: ""
                    });
                    setLinkedinFile(null);
                    setEmailFile(null);
                  }} disabled={loading} className="bg-slate-200 text-slate-700 font-bold h-12 px-8 rounded-xl hover:bg-slate-300 transition-all">
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                  {loading ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Resume Record" : "Submit Resume Record")}
                </Button>
              </div>
            )}
          </CardContent>
        </form>
      </Card>

      {/* Previously submitted list (only in non-edit-dialog mode) */}
      {!initialEditSub && submittedForms.length > 0 && (
        <Card className="border border-slate-200 shadow-md">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-500" /> Your Submitted Resume Records
              <Badge variant="secondary" className="font-black bg-teal-50 text-teal-700 ml-2">{filteredSubmissions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">AWL-ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Client Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">LinkedIn</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Submitted</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub, idx) => (
                  <tr key={sub.id || idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-xs">{sub.awl_id}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{sub.client_apps_email}</td>
                    <td className="px-4 py-4">
                      <Badge variant={sub.linkedin_optimization_sold === 'Yes' ? 'default' : 'secondary'} className={sub.linkedin_optimization_sold === 'Yes' ? 'bg-emerald-50 text-emerald-700 border-0' : 'bg-slate-100 text-slate-500 border-0'}>
                        {sub.linkedin_optimization_sold}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{new Date(sub.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isFormEdited(sub) ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full">Edited</span>
                        ) : (
                          !viewerMode && (
                            <Button
                              size="sm"
                              onClick={() => handleEdit(sub)}
                              className="h-8 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-none gap-1.5 border border-indigo-200/50"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </Button>
                          )
                        )}
                        <Button size="sm" onClick={() => generatePDF(sub)} className="h-8 bg-teal-50 text-teal-600 hover:bg-teal-100 hover:text-teal-700 shadow-none gap-1.5">
                          <Download className="h-3.5 w-3.5" /> PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
