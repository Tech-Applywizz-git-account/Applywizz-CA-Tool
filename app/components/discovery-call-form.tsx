"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, UploadCloud, Send, FileText, Edit } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface DiscoveryCallFormProps {
  user: any;
  viewerMode?: boolean;
  initialEditSub?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DiscoveryCallForm({ user, viewerMode = false, initialEditSub, onSuccess, onCancel }: DiscoveryCallFormProps) {
  const [loading, setLoading] = useState(false)
  const [altRoleScreenshot, setAltRoleScreenshot] = useState<File | null>(null)
  const [emailScreenshot, setEmailScreenshot] = useState<File | null>(null)
  const [submittedForms, setSubmittedForms] = useState<any[]>([])

  const [editId, setEditId] = useState<string | null>(null)
  const [existingAltScreenshotUrl, setExistingAltScreenshotUrl] = useState("")
  const [existingEmailScreenshotUrl, setExistingEmailScreenshotUrl] = useState("")

  const isFormEdited = (sub: any) => {
    if (sub.is_edited === true) return true
    if (typeof sub.rep_signature === 'string' && sub.rep_signature.endsWith(' [EDITED]')) return true
    if (typeof sub.rep_name === 'string' && sub.rep_name.endsWith(' [EDITED]')) return true
    return false
  }

  const startEdit = (sub: any) => {
    setEditId(sub.id)
    setExistingAltScreenshotUrl(sub.alt_roles_screenshot_url || "")
    setExistingEmailScreenshotUrl(sub.email_screenshot_url || "")
    setFormData({
      awl_id: sub.awl_id || "",
      client_name: sub.client_name || "",
      phone: sub.phone || "",
      whatsapp: sub.whatsapp || "",
      primary_email: sub.primary_email || "",
      payment_mode: ["Bank Transfer", "Credit Card", "PayPal", "Stripe", "Wise"].includes(sub.payment_mode) ? sub.payment_mode : "Other",
      subscription_plan: ["10+ applications", "20+ applications", "30+ applications"].includes(sub.subscription_plan) ? sub.subscription_plan : "Other",
      onboarding_completed: sub.onboarding_completed || "",
      has_application_email: sub.has_application_email || "",
      new_app_email_created: sub.new_app_email_created || "",
      app_email_address: sub.app_email_address || "",
      app_email_key: sub.app_email_key || "",
      visa_type: ["F1-OPT", "F1-STEM EXT", "H1B", "H4 EAD", "L2 EAD", "Green Card", "US Citizen"].includes(sub.visa_type) ? sub.visa_type : "Other",
      security_measures_instructed: sub.security_measures_instructed || "",
      volume_policy_explained: sub.volume_policy_explained || "",
      digital_resume: sub.digital_resume || "",
      digital_resume_explained: sub.digital_resume_explained || "",
      primary_target_role: sub.primary_target_role || "",
      alt_roles_shared: sub.alt_roles_shared || "",
      alt_roles_share_method: sub.alt_roles_share_method || "",
      roles_summary: sub.roles_summary || "",
      resume_process_explained: sub.resume_process_explained || "",
      resume_process_understood: sub.resume_process_understood || "",
      experience_accurate_asked: sub.experience_accurate_asked || "",
      experience_change_requested: sub.experience_change_requested || "",
      additional_experience_requested: sub.additional_experience_requested || "",
      additional_projects_requested: sub.additional_projects_requested || "",
      additional_projects_details: sub.additional_projects_details || "",
      resume_instructions: sub.resume_instructions || "",
      experience_validation_completed: sub.experience_validation_completed || "",
      escalation_required: ["Yes", "No"].includes(sub.escalation_required) ? sub.escalation_required : "Other",
      escalation_details: sub.escalation_details || "",
      completion_email_sent: sub.completion_email_sent || "",
      next_steps_included: sub.next_steps_included || "",
      timeline_included: sub.timeline_included || "",
      support_contact_included: sub.support_contact_included || "",
      submission_date: sub.submission_date || new Date().toISOString().split('T')[0],
      sop_confirmation: sub.sop_confirmation || "",
      rep_name: sub.rep_name || ""
    })
    setOtherFields({
      payment_mode: ["Bank Transfer", "Credit Card", "PayPal", "Stripe", "Wise"].includes(sub.payment_mode) ? "" : (sub.payment_mode || ""),
      subscription_plan: ["10+ applications", "20+ applications", "30+ applications"].includes(sub.subscription_plan) ? "" : (sub.subscription_plan || ""),
      visa_type: ["F1-OPT", "F1-STEM EXT", "H1B", "H4 EAD", "L2 EAD", "Green Card", "US Citizen"].includes(sub.visa_type) ? "" : (sub.visa_type || ""),
      escalation_required: ["Yes", "No"].includes(sub.escalation_required) ? "" : (sub.escalation_required || "")
    })
    setAltRoleScreenshot(null)
    setEmailScreenshot(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    if (initialEditSub) {
      startEdit(initialEditSub)
    }
  }, [initialEditSub])

  const cancelEdit = () => {
    setEditId(null)
    setExistingAltScreenshotUrl("")
    setExistingEmailScreenshotUrl("")
    setFormData({
      awl_id: "", client_name: "", phone: "", whatsapp: "", primary_email: "",
      payment_mode: "", subscription_plan: "", onboarding_completed: "",
      has_application_email: "", new_app_email_created: "", app_email_address: "",
      app_email_key: "", visa_type: "", security_measures_instructed: "",
      volume_policy_explained: "", digital_resume: "", digital_resume_explained: "",
      primary_target_role: "", alt_roles_shared: "", alt_roles_share_method: "",
      roles_summary: "", resume_process_explained: "", resume_process_understood: "",
      experience_accurate_asked: "", experience_change_requested: "",
      additional_experience_requested: "", additional_projects_requested: "", additional_projects_details: "",
      resume_instructions: "", experience_validation_completed: "",
      escalation_required: "", escalation_details: "", completion_email_sent: "", next_steps_included: "",
      timeline_included: "", support_contact_included: "",
      submission_date: new Date().toISOString().split('T')[0],
      sop_confirmation: "", rep_name: ""
    })
    setOtherFields({ payment_mode: "", subscription_plan: "", visa_type: "", escalation_required: "" })
    setAltRoleScreenshot(null)
    setEmailScreenshot(null)
    if (onCancel) onCancel()
  }

  const [formData, setFormData] = useState({
    awl_id: "",
    client_name: "",
    phone: "",
    whatsapp: "",
    primary_email: "",
    payment_mode: "",
    subscription_plan: "",
    onboarding_completed: "",
    has_application_email: "",
    new_app_email_created: "",
    app_email_address: "",
    app_email_key: "",
    visa_type: "",
    security_measures_instructed: "",
    volume_policy_explained: "",
    digital_resume: "",
    digital_resume_explained: "",
    primary_target_role: "",
    alt_roles_shared: "",
    alt_roles_share_method: "",
    roles_summary: "",
    resume_process_explained: "",
    resume_process_understood: "",
    experience_accurate_asked: "",
    experience_change_requested: "",
    additional_experience_requested: "",
    additional_projects_requested: "",
    additional_projects_details: "",
    resume_instructions: "",
    experience_validation_completed: "",
    escalation_required: "",
    escalation_details: "",
    completion_email_sent: "",
    next_steps_included: "",
    timeline_included: "",
    support_contact_included: "",
    submission_date: new Date().toISOString().split('T')[0],
    sop_confirmation: "",
    rep_name: ""
  })

  const [otherFields, setOtherFields] = useState({
    payment_mode: "",
    subscription_plan: "",
    visa_type: "",
    escalation_required: ""
  })

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('account_discovery_calls')
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
      fetchSubmissions()
    }
  }, [user?.email])

  const handleChange = (field: string, value: any) => {
    let finalValue = value;
    if (field === "awl_id" && typeof value === "string") {
      finalValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }))
  }

  const handleOtherChange = (field: string, value: string) => {
    setOtherFields(prev => ({ ...prev, [field]: value }))
  }

  const generatePDF = (sub: any) => {
    const printWindow = window.open('', '', 'width=800,height=900')
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Discovery Call Form - ${sub.awl_id}</title>
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
              <h1 class="title">Discovery Call Record</h1>
              <p class="subtitle">Submitted by ${sub.rep_name} (${sub.rep_email}) on ${new Date(sub.created_at).toLocaleString()}</p>
            </div>

            <div class="section">
              <div class="section-title">Client Identity & Contact</div>
              <div class="grid">
                <div class="field"><div class="label">1. AWL-ID</div><div class="value">${sub.awl_id}</div></div>
                <div class="field"><div class="label">2. Client Full Name</div><div class="value">${sub.client_name}</div></div>
                <div class="field"><div class="label">3. Phone Number</div><div class="value">${sub.phone}</div></div>
                <div class="field"><div class="label">4. WhatsApp Number</div><div class="value">${sub.whatsapp}</div></div>
                <div class="field full-width"><div class="label">5. Primary Email Address</div><div class="value">${sub.primary_email}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Account & Plan</div>
              <div class="grid">
                <div class="field"><div class="label">6. Payment Mode</div><div class="value">${sub.payment_mode}</div></div>
                <div class="field"><div class="label">7. Subscription Plan</div><div class="value">${sub.subscription_plan}</div></div>
                <div class="field"><div class="label">8. Onboarding Form Completed?</div><div class="value">${sub.onboarding_completed}</div></div>
                <div class="field full-width"><div class="label">9. Does client already have a dedicated application email?</div><div class="value">${sub.has_application_email}</div></div>
                <div class="field"><div class="label">10. If Yes → (Enter email address)</div><div class="value">${sub.app_email_address || 'N/A'}</div></div>
                <div class="field"><div class="label">11. Key for applications</div><div class="value">${sub.app_email_key || 'N/A'}</div></div>
                <div class="field"><div class="label">12. Visa Type</div><div class="value">${sub.visa_type}</div></div>
                <div class="field full-width"><div class="label">13. Was client instructed to add: Recovery Email, Phone Number Verification, Secure Password Storage, Login Credential Backup</div><div class="value">${sub.security_measures_instructed || 'N/A'}</div></div>
                <div class="field full-width"><div class="label">14. Was application volume policy clearly explained?</div><div class="value">${sub.volume_policy_explained || 'N/A'}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Roles & Resume</div>
              <div class="grid">
                <div class="field"><div class="label">15. Digital Resume</div><div class="value">${sub.digital_resume}</div></div>
                <div class="field"><div class="label">16. Digital Resume Explained (How it Works?)</div><div class="value">${sub.digital_resume_explained}</div></div>
                <div class="field full-width"><div class="label">17. Client’s Primary Target Role</div><div class="value">${sub.primary_target_role}</div></div>
                <div class="field"><div class="label">18. Were alternate role options shared and explained ?</div><div class="value">${sub.alt_roles_shared}</div></div>
                <div class="field"><div class="label">19. Method used to share alternate roles</div><div class="value">${sub.alt_roles_share_method || 'N/A'}</div></div>
              </div>
              <div class="field full-width" style="margin-top: 4px;"><div class="label">21. Summary on primary and alternate roles discussion</div><div class="value">${sub.roles_summary || 'N/A'}</div></div>
            </div>

            <div class="section">
              <div class="section-title">Resume Process Details</div>
              <div class="grid">
                <div class="field full-width"><div class="label">22. Was resume process explained? Resume optimization call explained, Dedicated resume writer assigned, ATS optimization benefits explained, Resume customization process explained, Timeline explained</div><div class="value">${sub.resume_process_explained}</div></div>
                <div class="field"><div class="label">23. Did client understand resume process?</div><div class="value">${sub.resume_process_understood}</div></div>
                <div class="field"><div class="label">24. Did you ask if current resume experience is accurate?</div><div class="value">${sub.experience_accurate_asked}</div></div>
                <div class="field"><div class="label">25. Does client want existing experience changed?</div><div class="value">${sub.experience_change_requested}</div></div>
                <div class="field"><div class="label">26. Does client want additional experience added?</div><div class="value">${sub.additional_experience_requested}</div></div>
                <div class="field"><div class="label">27. Does client want additional projects added?</div><div class="value">${sub.additional_projects_requested}</div></div>
                ${sub.additional_projects_requested === "Yes" ? `<div class="field full-width"><div class="label">28. If yes, provide details</div><div class="value">${sub.additional_projects_details || 'N/A'}</div></div>` : ''}
                <div class="field full-width" style="margin-top: 4px;"><div class="label">29. Additional resume instructions for resume team</div><div class="value">${sub.resume_instructions || 'N/A'}</div></div>
                <div class="field"><div class="label">30. Experience validation completed successfully?</div><div class="value">${sub.experience_validation_completed}</div></div>
                <div class="field"><div class="label">31. Any escalation required? To Sales person</div><div class="value">${sub.escalation_required}</div></div>
                ${sub.escalation_required === "Yes" ? `<div class="field full-width"><div class="label">32. If escalation required, explain</div><div class="value">${sub.escalation_details || 'N/A'}</div></div>` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Next Steps & Completion</div>
              <div class="grid">
                <div class="field"><div class="label">33. Was discovery call completion email sent?</div><div class="value">${sub.completion_email_sent}</div></div>
                <div class="field"><div class="label">34. Was next steps process included?</div><div class="value">${sub.next_steps_included}</div></div>
                <div class="field"><div class="label">35. Was timeline included?</div><div class="value">${sub.timeline_included}</div></div>
                <div class="field"><div class="label">36. Was support contact information included?</div><div class="value">${sub.support_contact_included}</div></div>
                <div class="field"><div class="label">38. Submission Date</div><div class="value">${sub.submission_date || 'N/A'}</div></div>
              </div>
              <div class="field full-width" style="margin-top: 4px;"><div class="label">39. I confirm that all onboarding, discovery, and compliance steps were completed as per ApplyWizz SOP</div><div class="value">I Agree</div></div>
              <div class="signature-block">
                <div class="signature-field">
                  <div class="signature-value">${sub.rep_name || 'N/A'}</div>
                  <div class="signature-label">40. Full Name (Signature)</div>
                </div>
              </div>
            </div>

            ${sub.alt_roles_screenshot_url ? `<div class="section"><div class="section-title">20. Screenshot of alternate roles shared to customer?</div><img src="${sub.alt_roles_screenshot_url}" class="screenshot" /></div>` : ''}
            ${sub.email_screenshot_url ? `<div class="section"><div class="section-title">37. Email screenshot uploaded?</div><img src="${sub.email_screenshot_url}" class="screenshot" /></div>` : ''}

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
    if (!awlRegex.test(formData.awl_id.trim())) return alert("AWL-ID must be in the format AWL-1234 (must be capitalized)")

    const phoneRegex = /^[+]?[\d\s-]{7,15}$/
    if (!phoneRegex.test(formData.phone.trim())) return alert("Please enter a valid Phone Number (7-15 digits, optional + prefix)")
    if (!phoneRegex.test(formData.whatsapp.trim())) return alert("Please enter a valid WhatsApp Number (7-15 digits, optional + prefix)")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.primary_email.trim())) return alert("Please enter a valid Primary Email Address")
    if (formData.app_email_address && formData.app_email_address.trim() && !emailRegex.test(formData.app_email_address.trim())) {
      return alert("Please enter a valid Dedicated Application Email Address")
    }

    if (!formData.alt_roles_share_method || !formData.alt_roles_share_method.trim()) {
      return alert("Please select the Method used to share alternate roles (WhatsApp, Email, or Both).")
    }
    if (formData.sop_confirmation !== "I Agree") {
      return alert("Please check the confirmation box: 'I confirm that all onboarding, discovery, and compliance steps were completed as per ApplyWizz SOP'.")
    }

    if (!formData.client_name || !formData.client_name.trim()) return alert("Please enter the Client Full Name")
    if (!formData.payment_mode) return alert("Please select the Payment Mode")
    if (formData.payment_mode === "Other" && (!otherFields.payment_mode || !otherFields.payment_mode.trim())) return alert("Please specify the Payment Mode")
    if (!formData.subscription_plan) return alert("Please select the Subscription Plan")
    if (formData.subscription_plan === "Other" && (!otherFields.subscription_plan || !otherFields.subscription_plan.trim())) return alert("Please specify the Subscription Plan")
    if (!formData.onboarding_completed) return alert("Please specify if onboarding form is completed")
    if (!formData.has_application_email) return alert("Please specify if the client has a dedicated application email")
    if (formData.has_application_email === "No" && !formData.new_app_email_created) {
      return alert("Please specify if a new application email was created during the call")
    }

    const needsAppEmail = formData.has_application_email === "Yes" || formData.new_app_email_created === "Yes"
    if (needsAppEmail && (!formData.app_email_address || !formData.app_email_address.trim())) return alert("Please enter the Dedicated Application Email Address")
    if (needsAppEmail && (!formData.app_email_key || !formData.app_email_key.trim())) return alert("Please enter the App Email Key / App Password")

    if (!formData.visa_type) return alert("Please select the Client’s Visa Type")
    if (formData.visa_type === "Other" && (!otherFields.visa_type || !otherFields.visa_type.trim())) return alert("Please specify the Visa Type")
    if (!formData.security_measures_instructed) return alert("Please specify if security measures were instructed")
    if (!formData.volume_policy_explained) return alert("Please specify if the application volume policy was explained")

    if (!formData.digital_resume) return alert("Please specify if a digital resume is needed")
    if (!formData.digital_resume_explained) return alert("Please specify if the digital resume details were explained")
    if (!formData.primary_target_role || !formData.primary_target_role.trim()) return alert("Please enter the Client’s Primary Target Role")
    if (!formData.alt_roles_shared) return alert("Please specify if alternate roles were shared and explained")
    if (!formData.roles_summary || !formData.roles_summary.trim()) return alert("Please enter the Summary on primary and alternate roles discussion")

    if (!formData.resume_process_explained) return alert("Please specify if the resume process was explained")
    if (!formData.resume_process_understood) return alert("Please specify if the client understood the resume process")
    if (!formData.experience_accurate_asked) return alert("Please specify if the client was asked if their experience in CV is accurate")
    if (!formData.experience_change_requested) return alert("Please specify if the client requested any changes in experience")
    if (!formData.additional_experience_requested) return alert("Please specify if additional experience was requested")
    if (!formData.additional_projects_requested) return alert("Please specify if additional projects were requested")
    if (formData.additional_projects_requested === "Yes" && (!formData.additional_projects_details || !formData.additional_projects_details.trim())) {
      return alert("Please enter the details of additional projects requested")
    }

    if (!formData.resume_instructions) return alert("Please specify if you explained the resume optimization call instructions")
    if (!formData.experience_validation_completed) return alert("Please specify if experience validation was completed")

    if (!formData.escalation_required) return alert("Please specify if escalation to the senior team is required")
    if (formData.escalation_required === "Yes" && (!formData.escalation_details || !formData.escalation_details.trim())) {
      return alert("Please enter the escalation details")
    }
    if (formData.escalation_required === "Other" && (!otherFields.escalation_required || !otherFields.escalation_required.trim())) {
      return alert("Please specify the escalation details")
    }

    if (!formData.completion_email_sent) return alert("Please specify if the Discovery Call Completion Email was sent")
    if (!formData.next_steps_included) return alert("Please specify if the completion email includes Next Steps")
    if (!formData.timeline_included) return alert("Please specify if the completion email includes Timeline details")
    if (!formData.support_contact_included) return alert("Please specify if the completion email includes Support Team contact details")

    if (!formData.submission_date) return alert("Please select the Submission Date")
    if (!formData.rep_name || !formData.rep_name.trim()) return alert("Please provide your signature (Full Name)")

    setLoading(true)
    try {
      if (!altRoleScreenshot && !existingAltScreenshotUrl) {
        setLoading(false)
        return alert("Please upload the Alternate Roles Screenshot (Question 26/Screenshot)")
      }
      if (!emailScreenshot && !existingEmailScreenshotUrl) {
        setLoading(false)
        return alert("Please upload the Email Screenshot (Question 35/Email)")
      }

      let altScreenshotUrl = existingAltScreenshotUrl
      let emailScreenshotUrl = existingEmailScreenshotUrl

      if (altRoleScreenshot) {
        const fileExt = altRoleScreenshot.name.split('.').pop()
        const fileName = `alt-roles-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('sales_submissions').upload(fileName, altRoleScreenshot)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('sales_submissions').getPublicUrl(fileName)
        altScreenshotUrl = publicUrl
      }

      if (emailScreenshot) {
        const fileExt = emailScreenshot.name.split('.').pop()
        const fileName = `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('sales_submissions').upload(fileName, emailScreenshot)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('sales_submissions').getPublicUrl(fileName)
        emailScreenshotUrl = publicUrl
      }

      const submission = {
        rep_email: user.email,
        ...formData,
        new_app_email_created: formData.has_application_email === "Yes" ? null : formData.new_app_email_created,
        payment_mode: formData.payment_mode === "Other" ? otherFields.payment_mode : formData.payment_mode,
        subscription_plan: formData.subscription_plan === "Other" ? otherFields.subscription_plan : formData.subscription_plan,
        visa_type: formData.visa_type === "Other" ? otherFields.visa_type : formData.visa_type,
        escalation_required: formData.escalation_required === "Other" ? otherFields.escalation_required : formData.escalation_required,
        alt_roles_screenshot_url: altScreenshotUrl,
        email_screenshot_url: emailScreenshotUrl
      }

      if (editId) {
        const { error } = await supabase
          .from("account_discovery_calls")
          .update({
            ...submission,
            is_edited: true
          })
          .eq('id', editId)
        if (error) throw error
        alert("Discovery Call Form updated successfully!")
        if (onSuccess) onSuccess()
      } else {
        const { error } = await supabase.from("account_discovery_calls").insert([submission])
        if (error) throw error
        alert("Discovery Call Form submitted successfully!")
      }

      // Reset form
      setFormData({
        awl_id: "", client_name: "", phone: "", whatsapp: "", primary_email: "",
        payment_mode: "", subscription_plan: "", onboarding_completed: "",
        has_application_email: "", new_app_email_created: "", app_email_address: "",
        app_email_key: "", visa_type: "", security_measures_instructed: "",
        volume_policy_explained: "", digital_resume: "", digital_resume_explained: "",
        primary_target_role: "", alt_roles_shared: "", alt_roles_share_method: "",
        roles_summary: "", resume_process_explained: "", resume_process_understood: "",
        experience_accurate_asked: "", experience_change_requested: "",
        additional_experience_requested: "", additional_projects_requested: "", additional_projects_details: "",
        resume_instructions: "", experience_validation_completed: "",
        escalation_required: "", escalation_details: "", completion_email_sent: "", next_steps_included: "",
        timeline_included: "", support_contact_included: "",
        submission_date: new Date().toISOString().split('T')[0],
        sop_confirmation: "", rep_name: ""
      })
      setOtherFields({ payment_mode: "", subscription_plan: "", visa_type: "", escalation_required: "" })
      setAltRoleScreenshot(null)
      setEmailScreenshot(null)
      setEditId(null)
      setExistingAltScreenshotUrl("")
      setExistingEmailScreenshotUrl("")
      window.scrollTo({ top: 0, behavior: "smooth" })

      fetchSubmissions()

    } catch (err: any) {
      console.error(err)
      alert(err.message || "Submission failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <Card className="border-0 shadow-xl overflow-hidden bg-white">
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
          <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex flex-col">
            <span>Account Management Discovery Call</span>
            <span className="text-xs font-semibold text-slate-500 mt-2 tracking-normal">Hi, {user.email}. When you submit this form, the owner will see your name and email address.</span>
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Section 1: Client Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">1. Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">AWL-ID *</label>
                <Input disabled={viewerMode} required placeholder="e.g. AWL-1234" value={formData.awl_id} onChange={e => handleChange("awl_id", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Client Full Name *</label>
                <Input disabled={viewerMode} required placeholder="John Doe" value={formData.client_name} onChange={e => handleChange("client_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Phone Number *</label>
                <Input disabled={viewerMode} required placeholder="+1 234 567 8900" value={formData.phone} onChange={e => handleChange("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">WhatsApp Number *</label>
                <Input disabled={viewerMode} required placeholder="+1 234 567 8900" value={formData.whatsapp} onChange={e => handleChange("whatsapp", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Primary Email Address *</label>
                <Input disabled={viewerMode} required type="email" placeholder="client@example.com" value={formData.primary_email} onChange={e => handleChange("primary_email", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 2: Account Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">2. Account & Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Payment Mode *</label>
                <Select disabled={viewerMode} required value={formData.payment_mode} onValueChange={v => handleChange("payment_mode", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nas lo">Nas lo</SelectItem>
                    <SelectItem value="Razarpay">Razarpay</SelectItem>
                    <SelectItem value="Paypal">Paypal</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formData.payment_mode === "Other" && (
                  <Input disabled={viewerMode} className="mt-2" placeholder="Specify Payment Mode" value={otherFields.payment_mode} onChange={e => handleOtherChange("payment_mode", e.target.value)} />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Subscription Plan *</label>
                <Select disabled={viewerMode} required value={formData.subscription_plan} onValueChange={v => handleChange("subscription_plan", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20+ Applications">20+ Applications</SelectItem>
                    <SelectItem value="40+ Applications">40+ Applications</SelectItem>
                    <SelectItem value="10+ Applications">10+ Applications</SelectItem>
                    <SelectItem value="5+ Applications">5+ Applications</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formData.subscription_plan === "Other" && (
                  <Input disabled={viewerMode} className="mt-2" placeholder="Specify Subscription Plan" value={otherFields.subscription_plan} onChange={e => handleOtherChange("subscription_plan", e.target.value)} />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Onboarding Form Completed? *</label>
                <Select disabled={viewerMode} required value={formData.onboarding_completed} onValueChange={v => handleChange("onboarding_completed", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 3: Applications Setup */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">3. Applications Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Does client already have a dedicated application email? *</label>
                <Select disabled={viewerMode} required value={formData.has_application_email} onValueChange={v => handleChange("has_application_email", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.has_application_email === "No" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">If no, was a new application email created during the call? *</label>
                  <Select disabled={viewerMode} required value={formData.new_app_email_created} onValueChange={v => handleChange("new_app_email_created", v)}>
                    <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Enter email address *</label>
                <Input disabled={viewerMode} required type="email" placeholder="apps@example.com" value={formData.app_email_address} onChange={e => handleChange("app_email_address", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Key for applications *</label>
                <Input disabled={viewerMode} required placeholder="Enter Key" value={formData.app_email_key} onChange={e => handleChange("app_email_key", e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Visa Type *</label>
                <Select disabled={viewerMode} required value={formData.visa_type} onValueChange={v => handleChange("visa_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Visa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F1 - CPT">F1 - CPT</SelectItem>
                    <SelectItem value="F1 - OPT">F1 - OPT</SelectItem>
                    <SelectItem value="H1B">H1B</SelectItem>
                    <SelectItem value="Green Card">Green Card</SelectItem>
                    <SelectItem value="Citizen">Citizen</SelectItem>
                    <SelectItem value="H4EAD">H4EAD</SelectItem>
                    <SelectItem value="L1">L1</SelectItem>
                    <SelectItem value="J1">J1</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formData.visa_type === "Other" && (
                  <Input disabled={viewerMode} required className="mt-2" placeholder="Specify Visa Type" value={otherFields.visa_type} onChange={e => handleOtherChange("visa_type", e.target.value)} />
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Was client instructed to add Security Measures? (Recovery Email, 2FA, etc.) *</label>
                <Select disabled={viewerMode} required value={formData.security_measures_instructed} onValueChange={v => handleChange("security_measures_instructed", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Was application volume policy clearly explained? *</label>
                <Select disabled={viewerMode} required value={formData.volume_policy_explained} onValueChange={v => handleChange("volume_policy_explained", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 4: Target Roles & Resume */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">4. Roles & Resume</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Digital Resume needed? *</label>
                <Select disabled={viewerMode} required value={formData.digital_resume} onValueChange={v => handleChange("digital_resume", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Digital Resume Explained (How it Works?) *</label>
                <Select disabled={viewerMode} required value={formData.digital_resume_explained} onValueChange={v => handleChange("digital_resume_explained", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Client’s Primary Target Role *</label>
                <Input disabled={viewerMode} required placeholder="e.g. Software Engineer" value={formData.primary_target_role} onChange={e => handleChange("primary_target_role", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Were alternate role options shared and explained? *</label>
                <Select disabled={viewerMode} required value={formData.alt_roles_shared} onValueChange={v => handleChange("alt_roles_shared", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Method used to share alternate roles *</label>
                <div className="flex flex-wrap gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" disabled={viewerMode}
                      checked={formData.alt_roles_share_method.includes("WhatsApp")}
                      onChange={e => {
                        let methods = formData.alt_roles_share_method.split(", ").map(x => x.trim()).filter(Boolean);
                        if (e.target.checked) {
                          if (!methods.includes("WhatsApp")) methods.push("WhatsApp");
                        } else {
                          methods = methods.filter(x => x !== "WhatsApp" && x !== "Both");
                        }
                        handleChange("alt_roles_share_method", methods.join(", "));
                      }} />
                    WhatsApp
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" disabled={viewerMode}
                      checked={formData.alt_roles_share_method.includes("Email")}
                      onChange={e => {
                        let methods = formData.alt_roles_share_method.split(", ").map(x => x.trim()).filter(Boolean);
                        if (e.target.checked) {
                          if (!methods.includes("Email")) methods.push("Email");
                        } else {
                          methods = methods.filter(x => x !== "Email" && x !== "Both");
                        }
                        handleChange("alt_roles_share_method", methods.join(", "));
                      }} />
                    Email
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" disabled={viewerMode}
                      checked={formData.alt_roles_share_method.includes("Both") || (formData.alt_roles_share_method.includes("WhatsApp") && formData.alt_roles_share_method.includes("Email"))}
                      onChange={e => {
                        if (e.target.checked) {
                          handleChange("alt_roles_share_method", "WhatsApp, Email, Both");
                        } else {
                          handleChange("alt_roles_share_method", "");
                        }
                      }} />
                    Both (WhatsApp & Email)
                  </label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Screenshot of alternate roles shared to customer? (Max 10MB) *</label>
                <div className="flex items-center gap-3">
                  <Input disabled={viewerMode}
                    id="alt-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && !file.type.startsWith("image/")) {
                        alert("Please upload image files only.");
                        e.target.value = "";
                        setAltRoleScreenshot(null);
                      } else if (file && file.size > 10 * 1024 * 1024) {
                        alert("File size exceeds 10MB limit.");
                        e.target.value = "";
                        setAltRoleScreenshot(null);
                      } else {
                        setAltRoleScreenshot(file);
                      }
                    }}
                  />
                  <label htmlFor="alt-upload" className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-sm font-semibold text-slate-600 transition-colors w-full">
                    <UploadCloud className="h-4 w-4" /> {altRoleScreenshot ? altRoleScreenshot.name : "Upload Alternate Roles Screenshot"}
                  </label>
                </div>
                {existingAltScreenshotUrl && (
                  <div className="mt-1 text-xs text-indigo-650 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Current screenshot uploaded. <a href={existingAltScreenshotUrl} target="_blank" rel="noreferrer" className="underline font-bold hover:text-indigo-800">View Screenshot</a></span>
                  </div>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Summary on primary and alternate roles discussion *</label>
                <Textarea disabled={viewerMode} required placeholder="Enter details" value={formData.roles_summary} onChange={e => handleChange("roles_summary", e.target.value)} />
              </div>
            </div>

            {/* Resume Continuation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Was resume process explained? (Resume optimization call explained, Dedicated resume writer assigned, ATS optimization benefits explained, Resume customization process explained, Timeline explained) *</label>
                <Select disabled={viewerMode} required value={formData.resume_process_explained} onValueChange={v => handleChange("resume_process_explained", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Did client understand resume process? *</label>
                <Select disabled={viewerMode} required value={formData.resume_process_understood} onValueChange={v => handleChange("resume_process_understood", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Did you ask if current resume experience is accurate? *</label>
                <Select disabled={viewerMode} required value={formData.experience_accurate_asked} onValueChange={v => handleChange("experience_accurate_asked", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Does client want existing experience changed? *</label>
                <Select disabled={viewerMode} required value={formData.experience_change_requested} onValueChange={v => handleChange("experience_change_requested", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Does client want additional experience added? *</label>
                <Select disabled={viewerMode} required value={formData.additional_experience_requested} onValueChange={v => handleChange("additional_experience_requested", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Does client want additional projects added? *</label>
                <Select disabled={viewerMode} required value={formData.additional_projects_requested} onValueChange={v => handleChange("additional_projects_requested", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
                {formData.additional_projects_requested === "Yes" && (
                  <Textarea disabled={viewerMode} required className="mt-2" placeholder="Provide details" value={formData.additional_projects_details} onChange={e => handleChange("additional_projects_details", e.target.value)} />
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Additional resume instructions for resume team</label>
                <Textarea disabled={viewerMode} placeholder="Enter instructions" value={formData.resume_instructions} onChange={e => handleChange("resume_instructions", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Experience validation completed successfully? *</label>
                <Select disabled={viewerMode} required value={formData.experience_validation_completed} onValueChange={v => handleChange("experience_validation_completed", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Any escalation required? *</label>
                <Select disabled={viewerMode} required value={formData.escalation_required} onValueChange={v => handleChange("escalation_required", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
                {formData.escalation_required === "Yes" && (
                  <Textarea disabled={viewerMode} required className="mt-2" placeholder="If escalation required, explain" value={formData.escalation_details} onChange={e => handleChange("escalation_details", e.target.value)} />
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Closing */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">5. Next Steps & Confirmation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Was discovery call completion email sent? *</label>
                <Select disabled={viewerMode} required value={formData.completion_email_sent} onValueChange={v => handleChange("completion_email_sent", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Was next steps process included? *</label>
                <Select disabled={viewerMode} required value={formData.next_steps_included} onValueChange={v => handleChange("next_steps_included", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Was timeline included? *</label>
                <Select disabled={viewerMode} required value={formData.timeline_included} onValueChange={v => handleChange("timeline_included", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Was support contact information included? *</label>
                <Select disabled={viewerMode} required value={formData.support_contact_included} onValueChange={v => handleChange("support_contact_included", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Email screenshot uploaded? (Max 10MB) *</label>
                <div className="flex items-center gap-3">
                  <Input disabled={viewerMode}
                    id="email-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && !file.type.startsWith("image/")) {
                        alert("Please upload image files only.");
                        e.target.value = "";
                        setEmailScreenshot(null);
                      } else if (file && file.size > 10 * 1024 * 1024) {
                        alert("File size exceeds 10MB limit.");
                        e.target.value = "";
                        setEmailScreenshot(null);
                      } else {
                        setEmailScreenshot(file);
                      }
                    }}
                  />
                  <label htmlFor="email-upload" className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-sm font-semibold text-slate-600 transition-colors w-full">
                    <UploadCloud className="h-4 w-4" /> {emailScreenshot ? emailScreenshot.name : "Upload Email Screenshot"}
                  </label>
                </div>
                {existingEmailScreenshotUrl && (
                  <div className="mt-1 text-xs text-indigo-655 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Current screenshot uploaded. <a href={existingEmailScreenshotUrl} target="_blank" rel="noreferrer" className="underline font-bold hover:text-indigo-800">View Screenshot</a></span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Submission Date *</label>
                <Input disabled={viewerMode} required type="date" value={formData.submission_date} onChange={e => handleChange("submission_date", e.target.value)} />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" disabled={viewerMode} checked={formData.sop_confirmation === "I Agree"} onCheckedChange={(c) => handleChange("sop_confirmation", c ? "I Agree" : "")} />
                <label htmlFor="terms" className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-900 cursor-pointer">
                  I confirm that all onboarding, discovery, and compliance steps were completed as per ApplyWizz SOP *
                </label>
              </div>
            </div>

            <div className="space-y-2 md:w-1/2">
              <label className="text-xs font-bold text-slate-600">Full Name (Signature) *</label>
              <Input disabled={viewerMode} required placeholder="Enter your full name" value={formData.rep_name} onChange={e => handleChange("rep_name", e.target.value)} />
            </div>
          </div>

          {!viewerMode && (
            <div className="pt-4 flex justify-end gap-3">
              {editId && (
                <Button type="button" onClick={cancelEdit} disabled={loading} className="bg-slate-200 text-slate-700 font-bold h-12 px-8 rounded-xl hover:bg-slate-300 transition-all">
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {loading ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Call Record" : "Submit Discovery Call Form")}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  )
}
