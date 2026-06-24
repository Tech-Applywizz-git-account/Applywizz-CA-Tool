import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Send, Loader2, UploadCloud, Download } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface SalesSubmissionFormProps {
  user: any;
  viewerMode?: boolean;
  initialEditSub?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SalesSubmissionForm({ user, viewerMode = false, initialEditSub, onSuccess, onCancel }: SalesSubmissionFormProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [onboardingFile, setOnboardingFile] = useState<File | null>(null)
  const [submittedAwls, setSubmittedAwls] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [existingPaymentUrl, setExistingPaymentUrl] = useState("")
  const [existingOnboardingUrl, setExistingOnboardingUrl] = useState("")
  const [filterMonth, setFilterMonth] = useState<string>("All")
  const [blinkSection, setBlinkSection] = useState<string | null>(null)

  const triggerBlink = (sectionId: string) => {
    setBlinkSection(sectionId)
    setTimeout(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 100)
    setTimeout(() => {
      setBlinkSection(null)
    }, 2000)
  }

  const fetchSubmittedAwls = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_success_submissions')
        .select('*')
        .eq('rep_email', user.email)
        .order('created_at', { ascending: false })
      if (!error && data) {
        setSubmittedAwls(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (user?.email) {
      fetchSubmittedAwls()
    }
  }, [user?.email])

  const generatePDF = (sub: any) => {
    const printWindow = window.open('', '', 'width=800,height=900')
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Sales Submission - ${sub.awl_id}</title>
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
              <h1 class="title">Sales Success Record</h1>
              <p class="subtitle">Submitted by ${sub.rep_name} (${sub.rep_email}) on ${new Date(sub.created_at).toLocaleString()}</p>
            </div>

            <div class="section">
              <div class="section-title">Client Identity & Contact</div>
              <div class="grid">
                <div class="field"><div class="label">AWL-ID</div><div class="value">${sub.awl_id}</div></div>
                <div class="field"><div class="label">Client Full Name</div><div class="value">${sub.client_name}</div></div>
                <div class="field"><div class="label">Phone Number</div><div class="value">${sub.phone}</div></div>
                <div class="field"><div class="label">WhatsApp Number</div><div class="value">${sub.whatsapp}</div></div>
                <div class="field"><div class="label">Primary Email Address</div><div class="value">${sub.primary_email}</div></div>
                <div class="field"><div class="label">Applications Email Address</div><div class="value">${sub.apps_email || 'N/A'}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Sale Specifics</div>
              <div class="grid">
                <div class="field"><div class="label">Date of Sale</div><div class="value">${new Date(sub.sale_date).toLocaleDateString()}</div></div>
                <div class="field"><div class="label">Preferred Job Market</div><div class="value">${sub.job_market}</div></div>
                <div class="field"><div class="label">Digital Resume Needed?</div><div class="value">${sub.digital_resume || 'N/A'}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Financials & Payment</div>
              <div class="grid">
                <div class="field"><div class="label">Total Sale Value</div><div class="value">$${sub.sale_value}</div></div>
                <div class="field"><div class="label">Resume Amount</div><div class="value">$${sub.resume_amount || '0'}</div></div>
                <div class="field"><div class="label">Subscription Amount</div><div class="value">$${sub.subscription_amount || '0'}</div></div>
                <div class="field"><div class="label">Subscription Duration</div><div class="value">${sub.subscription_duration || 'N/A'}</div></div>
                <div class="field"><div class="label">Payment Method</div><div class="value">${sub.payment_method}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Roles & Promises</div>
              <div class="grid">
                <div class="field"><div class="label">Primary Role</div><div class="value">${sub.primary_role || 'N/A'}</div></div>
                <div class="field"><div class="label">Alternate Roles</div><div class="value">${sub.alternate_roles || 'N/A'}</div></div>
                <div class="field"><div class="label">Were any special promises made?</div><div class="value">${sub.special_promises || 'N/A'}</div></div>
                ${sub.special_promises === 'Yes' ? `<div class="field full-width"><div class="label">If yes, specify:</div><div class="value">${sub.special_promises_specify || 'N/A'}</div></div>` : ''}
                <div class="field full-width"><div class="label">Was the client clearly informed about: Delivery timelines of resume and start of process, Job market realities, No guaranteed placement policy, Account management process</div><div class="value">${sub.client_informed || 'N/A'}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Onboarding</div>
              <div class="grid">
                <div class="field"><div class="label">Has the client completed the onboarding form?</div><div class="value">${sub.onboarding_completed ? 'Yes' : 'No'}</div></div>
                <div class="field"><div class="label">Onboarding completed after follow-up?</div><div class="value">${sub.onboarding_after_followup || 'N/A'}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Additional Info & Signature</div>
              <div class="grid">
                <div class="field full-width"><div class="label">Additional notes for account manager</div><div class="value">${sub.additional_notes || 'None'}</div></div>
              </div>
              <div class="signature-block">
                <div class="signature-field">
                  <div class="signature-value">${sub.rep_signature || 'N/A'}</div>
                  <div class="signature-label">Full Name (Signature)</div>
                </div>
              </div>
            </div>

            ${(sub.payment_screenshot_url || sub.onboarding_screenshot_url) ? `
              ${sub.payment_screenshot_url ? `
              <div class="page-break"></div>
              <div class="section" style="margin-top:20px;">
                <div class="section-title">Payment Screenshot</div>
                <img class="screenshot" src="${sub.payment_screenshot_url}" alt="Payment Screenshot" />
              </div>
              ` : ''}

              ${sub.onboarding_screenshot_url ? `
              <div class="page-break"></div>
              <div class="section" style="margin-top:20px;">
                <div class="section-title">Onboarding Screenshot</div>
                <img class="screenshot" src="${sub.onboarding_screenshot_url}" alt="Onboarding Screenshot" />
              </div>
              ` : ''}
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

  const [formData, setFormData] = useState({
    awl_id: "",
    client_name: "",
    phone: "",
    whatsapp: "",
    primary_email: "",
    apps_email: "",
    sale_date: new Date().toISOString().split('T')[0],
    job_market: "",
    sale_value: "",
    digital_resume: "",
    resume_amount: "",
    subscription_amount: "",
    subscription_duration: "",
    subscription_duration_other: "",
    payment_method: "",
    payment_method_other: "",
    onboarding_completed: "", // changed to string for Yes/No Choice
    onboarding_after_followup: "",
    primary_role: "",
    alternate_roles: "",
    client_informed: "",
    special_promises: "",
    special_promises_specify: "",
    additional_notes: "",
    rep_signature: ""
  })
  const [jobMarketOther, setJobMarketOther] = useState("")

  const handleChange = (field: string, value: any) => {
    let finalValue = value;
    if (field === "awl_id" && typeof value === "string") {
      finalValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }))
  }

  const availableMonths = Array.from(new Set(submittedAwls.map(sub => {
    return new Date(sub.created_at).toLocaleString('default', { month: 'long', year: 'numeric' })
  }))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const filteredSubmissions = submittedAwls.filter(sub => {
    if (filterMonth === "All") return true
    return new Date(sub.created_at).toLocaleString('default', { month: 'long', year: 'numeric' }) === filterMonth
  })

  const handleEdit = (sub: any) => {
    if (sub.is_edited) {
      alert("This submission has already been edited once and cannot be edited again.");
      return;
    }
    setEditId(sub.id);
    setExistingPaymentUrl(sub.payment_screenshot_url || "");
    setExistingOnboardingUrl(sub.onboarding_screenshot_url || "");

    setFormData({
      awl_id: sub.awl_id || "",
      client_name: sub.client_name || "",
      phone: sub.phone || "",
      whatsapp: sub.whatsapp || "",
      primary_email: sub.primary_email || "",
      apps_email: sub.apps_email || "",
      sale_date: sub.sale_date || new Date().toISOString().split('T')[0],
      job_market: ["USA", "Canada", "Europe"].includes(sub.job_market) ? sub.job_market : "Other",
      sale_value: sub.sale_value?.toString() || "",
      digital_resume: sub.digital_resume || "",
      resume_amount: sub.resume_amount?.toString() || "",
      subscription_amount: sub.subscription_amount?.toString() || "",
      subscription_duration: ["1 Month", "2 Months", "3 Months"].includes(sub.subscription_duration) ? sub.subscription_duration : "Other",
      subscription_duration_other: ["1 Month", "2 Months", "3 Months"].includes(sub.subscription_duration) ? "" : (sub.subscription_duration || ""),
      payment_method: ["Nas io", "PayPal", "Amex", "Zelle", "Razorpay"].includes(sub.payment_method) ? sub.payment_method : "Other",
      payment_method_other: ["Nas io", "PayPal", "Amex", "Zelle", "Razorpay"].includes(sub.payment_method) ? "" : (sub.payment_method || ""),
      onboarding_completed: sub.onboarding_completed ? "Yes" : "No",
      onboarding_after_followup: sub.onboarding_after_followup || "",
      primary_role: sub.primary_role || "",
      alternate_roles: sub.alternate_roles || "",
      client_informed: sub.client_informed || "",
      special_promises: sub.special_promises || "",
      special_promises_specify: sub.special_promises_specify || "",
      additional_notes: sub.additional_notes || "",
      rep_signature: sub.rep_signature || ""
    });

    if (!["USA", "Canada", "Europe"].includes(sub.job_market)) {
      setJobMarketOther(sub.job_market || "");
    } else {
      setJobMarketOther("");
    }

    setFile(null);
    setOnboardingFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (initialEditSub) {
      handleEdit(initialEditSub)
    }
  }, [initialEditSub])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Section 1: Client Identity & Contact Validation
    const awlRegex = /^AWL-\d+$/
    if (!awlRegex.test(formData.awl_id.trim())) {
      alert("Validation Error in Client Identity & Contact: AWL-ID must be in the format AWL-1234 (must be capitalized)")
      triggerBlink("sec-client-identity")
      return
    }
    if (!formData.client_name.trim()) {
      alert("Validation Error in Client Identity & Contact: Please enter the Client Full Name")
      triggerBlink("sec-client-identity")
      return
    }
    const phoneRegex = /^[+]?[\d\s-]{7,15}$/
    if (!phoneRegex.test(formData.phone)) {
      alert("Validation Error in Client Identity & Contact: Please enter a valid Phone Number (7-15 digits, optional + prefix)")
      triggerBlink("sec-client-identity")
      return
    }
    if (!phoneRegex.test(formData.whatsapp)) {
      alert("Validation Error in Client Identity & Contact: Please enter a valid WhatsApp Number (7-15 digits, optional + prefix)")
      triggerBlink("sec-client-identity")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.primary_email.trim())) {
      alert("Validation Error in Client Identity & Contact: Please enter a valid Primary Email Address")
      triggerBlink("sec-client-identity")
      return
    }
    if (formData.apps_email && formData.apps_email.trim() && !emailRegex.test(formData.apps_email.trim())) {
      alert("Validation Error in Client Identity & Contact: Please enter a valid Dedicated Applications Email Address")
      triggerBlink("sec-client-identity")
      return
    }

    // Section 2: Sale Specifics Validation
    if (!formData.sale_date) {
      alert("Validation Error in Sale Specifics: Please select a Date of Sale")
      triggerBlink("sec-sale-specifics")
      return
    }
    if (!formData.job_market) {
      alert("Validation Error in Sale Specifics: Please select a Preferred Job Market")
      triggerBlink("sec-sale-specifics")
      return
    }
    if (formData.job_market === "Other" && !jobMarketOther.trim()) {
      alert("Validation Error in Sale Specifics: Please specify the Preferred Job Market")
      triggerBlink("sec-sale-specifics")
      return
    }
    if (Number(formData.sale_value) <= 0) {
      alert("Validation Error in Sale Specifics: Total Sale Value must be greater than 0")
      triggerBlink("sec-sale-specifics")
      return
    }
    if (!formData.digital_resume) {
      alert("Validation Error in Sale Specifics: Please select whether a Digital Resume is needed")
      triggerBlink("sec-sale-specifics")
      return
    }

    // Section 3: Financials & Payment Validation
    if (Number(formData.resume_amount) < 0 || formData.resume_amount === "") {
      alert("Validation Error in Financials & Payment: Please enter a valid Resume Amount (can be 0)")
      triggerBlink("sec-financials")
      return
    }
    if (Number(formData.subscription_amount) < 0 || formData.subscription_amount === "") {
      alert("Validation Error in Financials & Payment: Please enter a valid Subscription Amount (can be 0)")
      triggerBlink("sec-financials")
      return
    }
    if (!formData.subscription_duration) {
      alert("Validation Error in Financials & Payment: Please select a Subscription Duration")
      triggerBlink("sec-financials")
      return
    }
    if (formData.subscription_duration === "Other" && !formData.subscription_duration_other.trim()) {
      alert("Validation Error in Financials & Payment: Please specify Subscription Duration")
      triggerBlink("sec-financials")
      return
    }
    if (!formData.payment_method) {
      alert("Validation Error in Financials & Payment: Please select a Payment Method")
      triggerBlink("sec-financials")
      return
    }
    if (formData.payment_method === "Other" && !formData.payment_method_other.trim()) {
      alert("Validation Error in Financials & Payment: Please specify Payment Method")
      triggerBlink("sec-financials")
      return
    }
    if (!file && !existingPaymentUrl) {
      alert("Validation Error in Financials & Payment: Please upload a Payment Screenshot")
      triggerBlink("sec-financials")
      return
    }

    // Section 4: Onboarding Validation
    if (!formData.onboarding_completed) {
      alert("Validation Error in Onboarding: Please specify if onboarding is completed")
      triggerBlink("sec-onboarding")
      return
    }
    if (formData.onboarding_completed === "No" && !formData.onboarding_after_followup) {
      alert("Validation Error in Onboarding: Please specify if onboarding was completed after follow-up")
      triggerBlink("sec-onboarding")
      return
    }
    const needsScreenshot = formData.onboarding_completed === "Yes" || formData.onboarding_after_followup === "Yes"
    if (needsScreenshot && !onboardingFile && !existingOnboardingUrl) {
      alert("Validation Error in Onboarding: Please upload Onboarding Screenshot")
      triggerBlink("sec-onboarding")
      return
    }

    // Section 5: Roles & Promises Validation
    if (!formData.primary_role.trim()) {
      alert("Validation Error in Roles & Promises: Please enter Primary Role")
      triggerBlink("sec-roles-promises")
      return
    }
    if (!formData.alternate_roles.trim()) {
      alert("Validation Error in Roles & Promises: Please enter Alternate Roles")
      triggerBlink("sec-roles-promises")
      return
    }
    if (!formData.client_informed) {
      alert("Validation Error in Roles & Promises: Please specify if client was informed")
      triggerBlink("sec-roles-promises")
      return
    }
    if (!formData.special_promises) {
      alert("Validation Error in Roles & Promises: Please specify if special promises were made")
      triggerBlink("sec-roles-promises")
      return
    }
    if (formData.special_promises === "Yes" && !formData.special_promises_specify.trim()) {
      alert("Validation Error in Roles & Promises: Please specify the special promises made")
      triggerBlink("sec-roles-promises")
      return
    }

    // Section 6: Additional Info & Signature Validation
    if (!formData.additional_notes.trim()) {
      alert("Validation Error in Additional Info & Signature: Please enter additional notes for account manager")
      triggerBlink("sec-additional-info")
      return
    }
    if (!formData.rep_signature.trim()) {
      alert("Validation Error in Additional Info & Signature: Please provide your Full Name as signature")
      triggerBlink("sec-additional-info")
      return
    }

    setLoading(true)

    try {
      let fileUrl = existingPaymentUrl
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `payment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('sales_submissions').upload(fileName, file)
        if (uploadError) {
          console.error("Upload error:", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage.from('sales_submissions').getPublicUrl(fileName)
          fileUrl = publicUrl
        }
      }

      let onboardingFileUrl = existingOnboardingUrl
      if (onboardingFile) {
        const fileExt = onboardingFile.name.split('.').pop()
        const fileName = `onboarding-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('sales_submissions').upload(fileName, onboardingFile)
        if (uploadError) {
          console.error("Upload error:", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage.from('sales_submissions').getPublicUrl(fileName)
          onboardingFileUrl = publicUrl
        }
      }

      const submission = {
        rep_email: user.email,
        rep_name: user.name,
        awl_id: formData.awl_id,
        client_name: formData.client_name,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        primary_email: formData.primary_email,
        apps_email: formData.apps_email,
        sale_date: formData.sale_date,
        job_market: formData.job_market === "Other" ? jobMarketOther : formData.job_market,
        sale_value: Number(formData.sale_value) || 0,
        digital_resume: formData.digital_resume,
        resume_amount: Number(formData.resume_amount) || 0,
        subscription_amount: Number(formData.subscription_amount) || 0,
        subscription_duration: formData.subscription_duration === "Other" ? formData.subscription_duration_other : formData.subscription_duration,
        payment_method: formData.payment_method === "Other" ? formData.payment_method_other : formData.payment_method,
        payment_screenshot_url: fileUrl,
        onboarding_completed: formData.onboarding_completed === "Yes",
        onboarding_after_followup: formData.onboarding_after_followup,
        onboarding_screenshot_url: onboardingFileUrl,
        primary_role: formData.primary_role,
        alternate_roles: formData.alternate_roles,
        client_informed: formData.client_informed,
        special_promises: formData.special_promises,
        special_promises_specify: formData.special_promises_specify,
        additional_notes: formData.additional_notes,
        rep_signature: formData.rep_signature
      }

      if (editId) {
        const { error } = await supabase.from('sales_success_submissions')
          .update({ ...submission, is_edited: true })
          .eq('id', editId)
        if (error) throw error
        alert("Sales Success Form Updated Successfully!")
        if (onSuccess) onSuccess()
      } else {
        const { error } = await supabase.from('sales_success_submissions').insert([submission])
        if (error) throw error
        alert("Sales Success Form Submitted Successfully!")
      }

      fetchSubmittedAwls()

      setFormData({
        awl_id: "", client_name: "", phone: "", whatsapp: "", primary_email: "", apps_email: "",
        sale_date: new Date().toISOString().split('T')[0], job_market: "", sale_value: "", digital_resume: "",
        resume_amount: "", subscription_amount: "", subscription_duration: "", subscription_duration_other: "", payment_method: "", payment_method_other: "",
        onboarding_completed: "", onboarding_after_followup: "", primary_role: "", alternate_roles: "", client_informed: "", special_promises: "", special_promises_specify: "", additional_notes: "", rep_signature: ""
      })
      setJobMarketOther("")
      setFile(null)
      setOnboardingFile(null)
      setEditId(null)
      setExistingPaymentUrl("")
      setExistingOnboardingUrl("")

    } catch (err: any) {
      console.error(err)
      alert("Error submitting form: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes section-blink {
          0%, 100% {
            outline: 2px solid transparent;
            outline-offset: 2px;
            background-color: rgba(239, 68, 68, 0);
          }
          50% {
            outline: 3px solid rgb(239, 68, 68);
            outline-offset: 2px;
            background-color: rgba(239, 68, 68, 0.05);
          }
        }
        .animate-section-blink {
          animation: section-blink 0.8s ease-in-out 2;
        }
      `}} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            {editId ? "Edit Sales Success Submission" : "Sales Success Submission Form"}
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">
            {editId ? "You can only edit this submission once." : "Submit your successful sale details directly to the Head Dashboard."}
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Section 1: Client Info */}
            <div
              id="sec-client-identity"
              className={`space-y-4 p-4 rounded-xl border border-slate-100 transition-all duration-300 ${blinkSection === "sec-client-identity" ? "animate-section-blink bg-red-50/20" : "bg-slate-50/30"
                }`}
            >
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Client Identity & Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">AWL-ID *</label>
                  <Input disabled={viewerMode} required placeholder="e.g. AWL-12345" value={formData.awl_id} onChange={e => handleChange("awl_id", e.target.value)} />
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Primary Email Address *</label>
                  <Input disabled={viewerMode} required type="email" placeholder="client@example.com" value={formData.primary_email} onChange={e => handleChange("primary_email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Applications Email Address</label>
                  <Input disabled={viewerMode} type="email" placeholder="apps@example.com" value={formData.apps_email} onChange={e => handleChange("apps_email", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section 2: Sale Details */}
            <div
              id="sec-sale-specifics"
              className={`space-y-4 p-4 rounded-xl border border-slate-100 transition-all duration-300 ${blinkSection === "sec-sale-specifics" ? "animate-section-blink bg-red-50/20" : "bg-slate-50/30"
                }`}
            >
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Sale Specifics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Date of Sale *</label>
                  <Input disabled={viewerMode} required type="date" value={formData.sale_date} onChange={e => handleChange("sale_date", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Preferred Job Market *</label>
                  <Select disabled={viewerMode} value={formData.job_market} onValueChange={v => handleChange("job_market", v)}>
                    <SelectTrigger className="[&>svg]:hidden"><SelectValue placeholder="Select Market" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.job_market === "Other" && (
                    <Input disabled={viewerMode} className="mt-2" placeholder="Specify Job Market" value={jobMarketOther} onChange={e => setJobMarketOther(e.target.value)} />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Total Sale Value (USD) *</label>
                  <Input disabled={viewerMode} required type="number" step="0.01" placeholder="0.00" value={formData.sale_value} onChange={e => handleChange("sale_value", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Digital Resume Needed? *</label>
                  <Select disabled={viewerMode} value={formData.digital_resume} onValueChange={v => handleChange("digital_resume", v)}>
                    <SelectTrigger className="[&>svg]:hidden"><SelectValue placeholder="Yes / No" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 3: Financial Breakdowns & Payment */}
            <div
              id="sec-financials"
              className={`space-y-4 p-4 rounded-xl border border-slate-100 transition-all duration-300 ${blinkSection === "sec-financials" ? "animate-section-blink bg-red-50/20" : "bg-slate-50/30"
                }`}
            >
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Financials & Payment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Resume Amount (USD) *</label>
                  <Input disabled={viewerMode} required type="number" step="0.01" placeholder="0.00" value={formData.resume_amount} onChange={e => handleChange("resume_amount", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Subscription Amount (Only Enter Per month) *</label>
                  <Input disabled={viewerMode} required type="number" step="0.01" placeholder="0.00" value={formData.subscription_amount} onChange={e => handleChange("subscription_amount", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Subscription Duration *</label>
                  <Select disabled={viewerMode} value={formData.subscription_duration} onValueChange={v => handleChange("subscription_duration", v)}>
                    <SelectTrigger className="[&>svg]:hidden"><SelectValue placeholder="Duration" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Month">1 Month</SelectItem>
                      <SelectItem value="2 Months">2 Months</SelectItem>
                      <SelectItem value="3 Months">3 Months</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.subscription_duration === "Other" && (
                    <Input disabled={viewerMode} className="mt-2" placeholder="Specify Duration" value={formData.subscription_duration_other} onChange={e => handleChange("subscription_duration_other", e.target.value)} />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Payment Method *</label>
                  <Select disabled={viewerMode} required value={formData.payment_method} onValueChange={v => handleChange("payment_method", v)}>
                    <SelectTrigger className="[&>svg]:hidden"><SelectValue placeholder="Select Method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nas io">Nas io</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Amex">Amex</SelectItem>
                      <SelectItem value="Zelle">Zelle</SelectItem>
                      <SelectItem value="Razorpay">Razorpay</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.payment_method === "Other" && (
                    <Input disabled={viewerMode} className="mt-2" placeholder="Specify Method" value={formData.payment_method_other} onChange={e => handleChange("payment_method_other", e.target.value)} />
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">Payment Screenshot (Max 10MB) *</label>
                  <div className="flex items-center gap-3">
                    <Input disabled={viewerMode}
                      id="screenshot-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0] || null;
                        if (selectedFile && !selectedFile.type.startsWith("image/")) {
                          alert("Please upload image files only.");
                          e.target.value = "";
                          setFile(null);
                        } else if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
                          alert("File size exceeds 10MB limit.");
                          e.target.value = "";
                          setFile(null);
                        } else {
                          setFile(selectedFile);
                        }
                      }}
                    />
                    <label htmlFor="screenshot-upload" className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-sm font-semibold text-slate-600 transition-colors w-full">
                      <UploadCloud className="h-4 w-4" /> {file ? file.name : "Upload Receipt/Screenshot"}
                    </label>
                  </div>
                  {existingPaymentUrl && (
                    <div className="mt-1 text-xs text-indigo-600 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Current screenshot uploaded. <a href={existingPaymentUrl} target="_blank" rel="noreferrer" className="underline font-bold hover:text-indigo-800">View Screenshot</a></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Onboarding */}
            <div
              id="sec-onboarding"
              className={`space-y-4 p-4 rounded-xl border border-slate-100 transition-all duration-300 ${blinkSection === "sec-onboarding" ? "animate-section-blink bg-red-50/20" : "bg-slate-50/30"
                }`}
            >
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Onboarding</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Has the client completed the onboarding form? *</label>
                  <Select disabled={viewerMode} value={formData.onboarding_completed} onValueChange={v => handleChange("onboarding_completed", v)}>
                    <SelectTrigger className="[&>svg]:hidden"><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.onboarding_completed === "No" && (
                  <div className="space-y-2 bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-600 mb-2">⚠️ Client must complete onboarding immediately before submission proceeds</p>
                    <label className="text-xs font-bold text-slate-600">Onboarding completed after follow-up? *</label>
                    <Select disabled={viewerMode} value={formData.onboarding_after_followup} onValueChange={v => handleChange("onboarding_after_followup", v)}>
                      <SelectTrigger className="bg-white [&>svg]:hidden"><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(formData.onboarding_completed === "Yes" || formData.onboarding_after_followup === "Yes") && (
                  <div className="space-y-2 mt-2">
                    <label className="text-xs font-bold text-slate-600">Onboarding form completion screenshot uploaded? (Max 10MB) *</label>
                    <div className="flex items-center gap-3">
                      <Input disabled={viewerMode}
                        id="onboarding-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0] || null;
                          if (selectedFile && !selectedFile.type.startsWith("image/")) {
                            alert("Please upload image files only.");
                            e.target.value = "";
                            setOnboardingFile(null);
                          } else if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
                            alert("File size exceeds 10MB limit.");
                            e.target.value = "";
                            setOnboardingFile(null);
                          } else {
                            setOnboardingFile(selectedFile);
                          }
                        }}
                      />
                      <label htmlFor="onboarding-upload" className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-sm font-semibold text-slate-600 transition-colors w-full md:w-1/2">
                        <UploadCloud className="h-4 w-4" /> {onboardingFile ? onboardingFile.name : "Upload File"}
                      </label>
                    </div>
                    {existingOnboardingUrl && (
                      <div className="mt-1 text-xs text-indigo-600 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Current screenshot uploaded. <a href={existingOnboardingUrl} target="_blank" rel="noreferrer" className="underline font-bold hover:text-indigo-800">View Screenshot</a></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Roles & Promises */}
            <div
              id="sec-roles-promises"
              className={`space-y-4 p-4 rounded-xl border border-slate-100 transition-all duration-300 ${blinkSection === "sec-roles-promises" ? "animate-section-blink bg-red-50/20" : "bg-slate-50/30"
                }`}
            >
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Roles & Promises</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Primary Role *</label>
                  <Input disabled={viewerMode} required placeholder="Enter primary role" value={formData.primary_role} onChange={e => handleChange("primary_role", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Alternate Roles *</label>
                  <Input disabled={viewerMode} required placeholder="Enter alternate roles" value={formData.alternate_roles} onChange={e => handleChange("alternate_roles", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600">Was the client clearly informed about: Delivery timelines of resume and start of process, Job market realities, No guaranteed placement policy, Account management process *</label>
                  <Select disabled={viewerMode} value={formData.client_informed} onValueChange={v => handleChange("client_informed", v)}>
                    <SelectTrigger className="[&>svg]:hidden"><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Were any special promises made? *</label>
                  <Select disabled={viewerMode} value={formData.special_promises} onValueChange={v => handleChange("special_promises", v)}>
                    <SelectTrigger className="[&>svg]:hidden"><SelectValue placeholder="Select Yes/No" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.special_promises === "Yes" && (
                    <Input disabled={viewerMode} className="mt-2" placeholder="Specify special promises" value={formData.special_promises_specify} onChange={e => handleChange("special_promises_specify", e.target.value)} />
                  )}
                </div>
              </div>
            </div>

            {/* Section 6: Additional Info & Signature */}
            <div
              id="sec-additional-info"
              className={`space-y-4 p-4 rounded-xl border border-slate-100 transition-all duration-300 ${blinkSection === "sec-additional-info" ? "animate-section-blink bg-red-50/20" : "bg-slate-50/30"
                }`}
            >
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Additional Info & Signature</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Additional notes for account manager: *</label>
                  <Input disabled={viewerMode} placeholder="Enter any additional notes" value={formData.additional_notes} onChange={e => handleChange("additional_notes", e.target.value)} />
                </div>
                <div className="space-y-2 md:w-1/2">
                  <label className="text-xs font-bold text-slate-600">Full Name (Signature) *</label>
                  <Input disabled={viewerMode} required placeholder="Enter your full name" value={formData.rep_signature} onChange={e => handleChange("rep_signature", e.target.value)} />
                </div>
              </div>
            </div>

            {!viewerMode && (
              <div className="pt-4 flex justify-end gap-3">
                {editId && (
                  <Button type="button" onClick={() => {
                    setEditId(null);
                    if (onCancel) onCancel();
                    setExistingPaymentUrl("");
                    setExistingOnboardingUrl("");
                    setFormData({
                      awl_id: "", client_name: "", phone: "", whatsapp: "", primary_email: "", apps_email: "",
                      sale_date: new Date().toISOString().split('T')[0], job_market: "", sale_value: "", digital_resume: "",
                      resume_amount: "", subscription_amount: "", subscription_duration: "", subscription_duration_other: "", payment_method: "", payment_method_other: "",
                      onboarding_completed: "", onboarding_after_followup: "", primary_role: "", alternate_roles: "", client_informed: "", special_promises: "", special_promises_specify: "", additional_notes: "", rep_signature: ""
                    });
                    setJobMarketOther("");
                    setFile(null);
                    setOnboardingFile(null);
                  }} disabled={loading} className="bg-slate-200 text-slate-700 font-bold h-12 px-8 rounded-xl hover:bg-slate-300 transition-all">
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                  {loading ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Sales Record" : "Submit Sales Record")}
                </Button>
              </div>
            )}
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
