import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, ClipboardList, Loader2, Trash2, Search, ChevronLeft, ChevronRight, Calendar, Edit } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DiscoveryCallForm } from "./discovery-call-form"
import { OrientationCallForm } from "./orientation-call-form"
import { RenewalCallForm } from "./renewal-call-form"
import { ProgressiveCallForm } from "./progressive-call-form"

export function AccountsSubmittedFormsPanel({ 
  repEmail,
  monthOffset,
  viewerMode = false
}: { 
  repEmail?: string;
  monthOffset?: number;
  viewerMode?: boolean;
} = {}) {
  const [activeFormTab, setActiveFormTab] = useState<'discovery' | 'orientation' | 'renewal' | 'progressive'>('discovery')
  const [discoveryForms, setDiscoveryForms] = useState<any[]>([])
  const [orientationForms, setOrientationForms] = useState<any[]>([])
  const [renewalForms, setRenewalForms] = useState<any[]>([])
  const [progressiveForms, setProgressiveForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination State
  const [search, setSearch] = useState("")
  const [amFilter, setAmFilter] = useState("All")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Edit Dialog State
  const [editingSub, setEditingSub] = useState<any>(null)
  const [editingType, setEditingType] = useState<'discovery' | 'orientation' | 'renewal' | 'progressive' | null>(null)

  const handleCloseEdit = () => {
    setEditingSub(null)
    setEditingType(null)
  }

  const isFiltered = !!(search || amFilter !== "All" || startDate || endDate)

  const handleClearFilters = () => {
    setSearch("")
    setAmFilter("All")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeFormTab, search, amFilter, startDate, endDate, itemsPerPage, monthOffset])

  const getActiveFormsList = () => {
    switch (activeFormTab) {
      case 'discovery': return discoveryForms
      case 'orientation': return orientationForms
      case 'renewal': return renewalForms
      case 'progressive': return progressiveForms
      default: return []
    }
  }

  const activeFormsList = getActiveFormsList()

  // Compute unique AMs across the full active raw list
  const uniqueAMs = Array.from(new Set(activeFormsList.map(f => f.rep_email).filter(Boolean))).sort()

  const getFilteredForms = (forms: any[]) => {
    return forms.filter(f => {
      const matchSearch = !search.trim() || (
        (f.awl_id?.toLowerCase().includes(search.toLowerCase())) ||
        (f.client_name?.toLowerCase().includes(search.toLowerCase())) ||
        (f.client_preferred_name?.toLowerCase().includes(search.toLowerCase())) ||
        (f.rep_name?.toLowerCase().includes(search.toLowerCase())) ||
        (f.rep_email?.toLowerCase().includes(search.toLowerCase()))
      )
      
      const matchAM = amFilter === "All" || f.rep_email === amFilter
      
      let matchDate = true
      if (startDate) {
        matchDate = matchDate && new Date(f.created_at) >= new Date(startDate + "T00:00:00")
      }
      if (endDate) {
        matchDate = matchDate && new Date(f.created_at) <= new Date(endDate + "T23:59:59")
      }
      if (monthOffset !== undefined && !startDate && !endDate) {
        const now = new Date()
        const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
        const subDate = new Date(f.created_at)
        matchDate = matchDate && 
          subDate.getFullYear() === targetDate.getFullYear() && 
          subDate.getMonth() === targetDate.getMonth()
      }
      
      return matchSearch && matchAM && matchDate
    })
  }

  const filteredDiscovery = getFilteredForms(discoveryForms)
  const filteredOrientation = getFilteredForms(orientationForms)
  const filteredRenewal = getFilteredForms(renewalForms)
  const filteredProgressive = getFilteredForms(progressiveForms)

  // Get current active filtered list
  const activeFilteredList = (() => {
    switch (activeFormTab) {
      case 'discovery': return filteredDiscovery
      case 'orientation': return filteredOrientation
      case 'renewal': return filteredRenewal
      case 'progressive': return filteredProgressive
      default: return []
    }
  })()

  const totalPages = Math.ceil(activeFilteredList.length / itemsPerPage) || 1
  const paginatedList = activeFilteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const renderPagination = (listLength: number) => {
    if (listLength === 0) return null
    return (
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-[10px] font-bold text-slate-400">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, listLength)} of {listLength}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rows per page:</span>
            <Select value={String(itemsPerPage)} onValueChange={(val) => {
              setItemsPerPage(Number(val))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="h-7 w-[65px] text-[10px] font-bold bg-white border-slate-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map(size => (
                  <SelectItem key={size} value={String(size)} className="text-xs font-semibold">{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-bold text-slate-600 mx-2">{currentPage} / {totalPages}</span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  const isFormEdited = (sub: any) => {
    return sub.is_edited === true || sub.rep_signature?.includes('[EDITED]')
  }

  const handleDelete = async (tableName: string, id: string, awlId: string) => {
    const ok = window.confirm(`Are you absolutely sure you want to delete the record for AWL ID: ${awlId}? This action cannot be undone.`)
    if (!ok) return
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id)
      if (error) throw error
      alert("Record deleted successfully!")
      fetchForms()
    } catch (err: any) {
      console.error(err)
      alert("Failed to delete record: " + err.message)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    setLoading(true)
    try {
      let dQuery = supabase.from('account_discovery_calls').select('*').order('created_at', { ascending: false })
      if (repEmail) dQuery = dQuery.eq('rep_email', repEmail)
      const { data: dData } = await dQuery
      if (dData) setDiscoveryForms(dData)
      
      let oQuery = supabase.from('account_orientation_calls').select('*').order('created_at', { ascending: false })
      if (repEmail) oQuery = oQuery.eq('rep_email', repEmail)
      const { data: oData } = await oQuery
      if (oData) setOrientationForms(oData)

      let rQuery = supabase.from('account_renewal_calls').select('*').order('created_at', { ascending: false })
      if (repEmail) rQuery = rQuery.eq('rep_email', repEmail)
      const { data: rData } = await rQuery
      if (rData) setRenewalForms(rData)

      let pQuery = supabase.from('account_progressive_calls').select('*').order('created_at', { ascending: false })
      if (repEmail) pQuery = pQuery.eq('rep_email', repEmail)
      const { data: pData } = await pQuery
      if (pData) setProgressiveForms(pData)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const generateDiscoveryPDF = (sub: any) => {
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
              <div class="field full-width" style="margin-top: 6px;"><div class="label">21. Summary on primary and alternate roles discussion</div><div class="value">${sub.roles_summary || 'N/A'}</div></div>
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
                ${sub.additional_projects_requested === "Yes" ? `<div class="field full-width" style="margin-top: 6px;"><div class="label">28. If yes, provide details</div><div class="value">${sub.additional_projects_details || 'N/A'}</div></div>` : ''}
                <div class="field full-width" style="margin-top: 6px;"><div class="label">29. Additional resume instructions for resume team</div><div class="value">${sub.resume_instructions || 'N/A'}</div></div>
                <div class="field"><div class="label">30. Experience validation completed successfully?</div><div class="value">${sub.experience_validation_completed}</div></div>
                <div class="field"><div class="label">31. Any escalation required? To Sales person</div><div class="value">${sub.escalation_required}</div></div>
                ${sub.escalation_required === "Yes" ? `<div class="field full-width" style="margin-top: 6px;"><div class="label">32. If escalation required, explain</div><div class="value">${sub.escalation_details || 'N/A'}</div></div>` : ''}
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
              <div class="field full-width" style="margin-top: 6px;"><div class="label">39. I confirm that all onboarding, discovery, and compliance steps were completed as per ApplyWizz SOP</div><div class="value">I Agree</div></div>
              <div class="signature-block">
                <div class="signature-field">
                  <div class="signature-value">${sub.rep_name || 'N/A'}</div>
                  <div class="signature-label">40. Full Name (Signature)</div>
                </div>
              </div>
            </div>

            ${sub.alt_roles_screenshot_url ? `<div class="page-break"></div><div class="section-title" style="margin-top:20px;">20. Screenshot of alternate roles shared to customer?</div><img src="${sub.alt_roles_screenshot_url}" class="screenshot" />` : ''}
            ${sub.email_screenshot_url ? `<div class="page-break"></div><div class="section-title" style="margin-top:20px;">37. Email screenshot uploaded?</div><img src="${sub.email_screenshot_url}" class="screenshot" />` : ''}

          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const generateOrientationPDF = (sub: any) => {
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
                <div class="field"><div class="label">What name should we use to address the client?</div><div class="value">${sub.client_preferred_name || 'N/A'}</div></div>
                <div class="field"><div class="label">Did you clearly explain that you are the client's single point of contact?</div><div class="value">${sub.spoc_explained}</div></div>
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
                <div class="field"><div class="label">Did you explain to the client what staffing agencies are and how those jobs work?</div><div class="value">${sub.staffing_agencies_explained}</div></div>
                <div class="field"><div class="label">Did you explain W2 jobs to the client?</div><div class="value">${sub.w2_jobs_explained}</div></div>
                <div class="field"><div class="label">Did you clearly inform the client that the next scheduled review call (Progressive Call) will happen?</div><div class="value">${sub.next_call_informed}</div></div>
              </div>
              <div class="field full-width" style="margin-top: 4px;"><div class="label">Did the client mention any specific preferences? (Location, Salary range, Visa type, Remote / on-site)</div><div class="value">${sub.specific_preferences || 'None'}</div></div>
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
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const generateRenewalPDF = (sub: any) => {
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
              <div class="section-title">Client Identity & Dates</div>
              <div class="grid">
                <div class="field"><div class="label">1. AWL-ID</div><div class="value">${sub.awl_id}</div></div>
                <div class="field"><div class="label">2. Subscription Start Date</div><div class="value">${new Date(sub.subscription_start_date).toLocaleDateString()}</div></div>
                <div class="field"><div class="label">3. Renewal Date</div><div class="value">${new Date(sub.renewal_date).toLocaleDateString()}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Progress & Metrics</div>
              <div class="grid">
                <div class="field"><div class="label">4. Total job applications completed?</div><div class="value">${sub.total_applications_completed || '0'}</div></div>
                <div class="field"><div class="label">5. Customized resumes created?</div><div class="value">${sub.customized_resumes_created || '0'}</div></div>
                <div class="field"><div class="label">6. Assessments generated?</div><div class="value">${sub.assessments_generated || '0'}</div></div>
                <div class="field"><div class="label">7. Interviews generated?</div><div class="value">${sub.interviews_generated || '0'}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Discussion & Insights</div>
              <div class="grid">
                <div class="field"><div class="label">8. Progress explained?</div><div class="value">${sub.progress_explained}</div></div>
                <div class="field"><div class="label">9. Key metrics discussed?</div><div class="value">${sub.key_metrics_discussed}</div></div>
                <div class="field"><div class="label">11. Still actively seeking?</div><div class="value">${sub.actively_seeking}</div></div>
                <div class="field"><div class="label">12. Current primary goal?</div><div class="value">${sub.primary_goal || 'N/A'}</div></div>
              </div>
              <div class="field full-width" style="margin-top: 6px;"><div class="label">10. Key success points highlighted?</div><div class="value">${sub.key_success_points || 'None'}</div></div>
            </div>

            <div class="section">
              <div class="section-title">Renewal Decision</div>
              <div class="grid">
                <div class="field"><div class="label">13. Interested in renewing?</div><div class="value">${sub.interested_in_renewing}</div></div>
                <div class="field"><div class="label">14. Primary concern (if hesitant)</div><div class="value">${sub.primary_concern || 'None'}</div></div>
                <div class="field"><div class="label">Other Concern Details</div><div class="value">${sub.other_concern_details || 'N/A'}</div></div>
                <div class="field"><div class="label">15. Final renewal decision</div><div class="value">${sub.final_decision}</div></div>
                <div class="field"><div class="label">16. Renewal package selected</div><div class="value">${sub.renewal_package_selected || 'N/A'}</div></div>
                <div class="field"><div class="label">17. Client sentiment after discussion</div><div class="value">${sub.client_sentiment || 'N/A'}</div></div>
              </div>
              <div class="field full-width" style="margin-top: 6px;"><div class="label">18. Account Manager remarks</div><div class="value">${sub.am_remarks || 'None'}</div></div>
            </div>

            <div class="section">
              <div class="section-title">Escalation & Signature</div>
              <div class="grid">
                <div class="field"><div class="label">19. Escalation to senior team required?</div><div class="value">${sub.escalation_required || 'No'}</div></div>
                <div class="field"><div class="label">20. If yes? (Explain)</div><div class="value">${sub.escalation_details || 'N/A'}</div></div>
              </div>
              <div class="signature-block">
                <div class="signature-field">
                  <div class="signature-value">${sub.rep_signature}</div>
                  <div class="signature-label">Full Name (Signature)</div>
                </div>
              </div>
            </div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const generateProgressivePDF = (sub: any) => {
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
              <div class="section-title">Client Identity & Details</div>
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
              <div class="section-title">Feedback & Planning</div>
              <div class="field full-width" style="margin-bottom: 4px;"><div class="label">Client’s overall feedback on current progress:</div><div class="value">${sub.overall_feedback || 'N/A'}</div></div>
              <div class="field full-width" style="margin-bottom: 4px;"><div class="label">Key challenges identified during the call:</div><div class="value">${sub.key_challenges || 'N/A'}</div></div>
              <div class="grid">
                <div class="field"><div class="label">Actions to be taken by Account Manager:</div><div class="value">${sub.am_actions || 'N/A'}</div></div>
                <div class="field"><div class="label">Actions required from client:</div><div class="value">${sub.client_actions || 'N/A'}</div></div>
                <div class="field"><div class="label">Next follow-up date (Renewal Call):</div><div class="value">${sub.next_followup_date ? new Date(sub.next_followup_date).toLocaleDateString() : 'N/A'}</div></div>
                <div class="field"><div class="label">Plan for next phase of applications:</div><div class="value">${sub.next_phase_plan || 'N/A'}</div></div>
                <div class="field full-width" style="margin-top: 4px;"><div class="label">I confirm that all the above details were discussed with the client and recorded accurately. (I Agree)</div><div class="value">${sub.confirmed_details ? "Yes, I Agree" : "No"}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Signature</div>
              <div class="signature-block">
                <div class="signature-field">
                  <div class="signature-value">${sub.rep_signature}</div>
                  <div class="signature-label">Full Name (Signature)</div>
                </div>
              </div>
            </div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  if (loading) return <div className="py-24 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" /></div>

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button variant={activeFormTab === 'discovery' ? 'default' : 'outline'} className={activeFormTab === 'discovery' ? 'bg-indigo-600 text-white' : ''} onClick={() => setActiveFormTab('discovery')}>Discovery Calls</Button>
        <Button variant={activeFormTab === 'orientation' ? 'default' : 'outline'} className={activeFormTab === 'orientation' ? 'bg-indigo-600 text-white' : ''} onClick={() => setActiveFormTab('orientation')}>Orientation Calls</Button>
        <Button variant={activeFormTab === 'renewal' ? 'default' : 'outline'} className={activeFormTab === 'renewal' ? 'bg-indigo-600 text-white' : ''} onClick={() => setActiveFormTab('renewal')}>Renewal Calls</Button>
        <Button variant={activeFormTab === 'progressive' ? 'default' : 'outline'} className={activeFormTab === 'progressive' ? 'bg-indigo-600 text-white' : ''} onClick={() => setActiveFormTab('progressive')}>Progressive Calls</Button>
      </div>

      {/* Premium Filter Controls Bar */}
      <Card className="border border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white mb-4">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Submitted Forms Filter</h3>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md justify-end flex-wrap sm:flex-nowrap">
            {isFiltered && (
              <Button variant="ghost" onClick={handleClearFilters} className="text-xs font-bold text-rose-500 hover:text-rose-750 hover:bg-rose-50 h-9 px-3 rounded-lg shrink-0">
                Clear Filters
              </Button>
            )}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search AWL-ID, Client, Account Manager..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" />
            </div>
          </div>
        </div>
        <CardContent className="p-4 bg-slate-50/20">
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${repEmail ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-3 items-end`}>
            {!repEmail && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Account Manager Email</label>
                <Select value={amFilter} onValueChange={setAmFilter}>
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All AM Emails</SelectItem>
                    {uniqueAMs.map(am => (
                      <SelectItem key={am} value={am}>{am}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">From Date</label>
              <Input type="date" className="h-9 text-xs bg-white border-slate-200 rounded-lg" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">To Date</label>
              <Input type="date" className="h-9 text-xs bg-white border-slate-200 rounded-lg" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

          </div>
        </CardContent>
      </Card>

      {activeFormTab === 'discovery' && (
        <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader><CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ClipboardList className="h-5 w-5 text-blue-500" /> Submitted Discovery Calls</CardTitle></CardHeader>
          <CardContent className="p-0">
            {filteredDiscovery.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-medium">No submissions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Date</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">AWL ID</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Client Name</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Account Manager Email</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedList.map((sub: any) => {
                      const edited = isFormEdited(sub)
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="text-xs font-semibold text-slate-600">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-indigo-600">{sub.awl_id}</TableCell>
                          <TableCell className="text-sm font-bold text-slate-700">{sub.client_name}</TableCell>
                          <TableCell className="text-xs font-bold text-indigo-650">
                            {sub.rep_email || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5 py-1">
                              {edited ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full mr-1.5">Edited</span>
                              ) : (
                                repEmail && !viewerMode && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setEditingSub(sub)
                                      setEditingType('discovery')
                                    }} 
                                    className="h-7 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 border border-indigo-200/50 flex items-center gap-1 shadow-sm mr-1"
                                  >
                                    <Edit className="h-3 w-3" /> Edit
                                  </Button>
                                )
                              )}
                              <Button size="sm" variant="outline" onClick={() => generateDiscoveryPDF(sub)} className="h-7 text-xs flex items-center gap-1"><Download className="h-3 w-3" /> PDF</Button>
                              {!repEmail && <Button size="sm" onClick={() => handleDelete('account_discovery_calls', sub.id, sub.awl_id)} className="h-7 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/50 flex items-center gap-1 shadow-sm"><Trash2 className="h-3 w-3" /> Delete</Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {renderPagination(filteredDiscovery.length)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeFormTab === 'orientation' && (
        <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-emerald-500" />
          <CardHeader><CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ClipboardList className="h-5 w-5 text-teal-500" /> Submitted Orientation Calls</CardTitle></CardHeader>
          <CardContent className="p-0">
            {filteredOrientation.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-medium">No submissions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Date</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">AWL ID</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Client Name</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Account Manager Email</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedList.map((sub: any) => {
                      const edited = isFormEdited(sub)
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="text-xs font-semibold text-slate-600">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-teal-600">{sub.awl_id}</TableCell>
                          <TableCell className="text-sm font-bold text-slate-700">{sub.client_preferred_name || 'N/A'}</TableCell>
                          <TableCell className="text-xs font-bold text-indigo-650">
                            {sub.rep_email || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5 py-1">
                              {edited ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full mr-1.5">Edited</span>
                              ) : (
                                repEmail && !viewerMode && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setEditingSub(sub)
                                      setEditingType('orientation')
                                    }} 
                                    className="h-7 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 border border-indigo-200/50 flex items-center gap-1 shadow-sm mr-1"
                                  >
                                    <Edit className="h-3 w-3" /> Edit
                                  </Button>
                                )
                              )}
                              <Button size="sm" variant="outline" onClick={() => generateOrientationPDF(sub)} className="h-7 text-xs flex items-center gap-1"><Download className="h-3 w-3" /> PDF</Button>
                              {!repEmail && <Button size="sm" onClick={() => handleDelete('account_orientation_calls', sub.id, sub.awl_id)} className="h-7 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/50 flex items-center gap-1 shadow-sm"><Trash2 className="h-3 w-3" /> Delete</Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {renderPagination(filteredOrientation.length)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeFormTab === 'renewal' && (
        <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardHeader><CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ClipboardList className="h-5 w-5 text-purple-500" /> Submitted Renewal Calls</CardTitle></CardHeader>
          <CardContent className="p-0">
            {filteredRenewal.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-medium">No submissions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Date</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">AWL ID</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Final Decision</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Account Manager Email</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedList.map((sub: any) => {
                      const edited = isFormEdited(sub)
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="text-xs font-semibold text-slate-600">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-purple-600">{sub.awl_id}</TableCell>
                          <TableCell className="text-sm font-bold text-slate-700">{sub.final_decision}</TableCell>
                          <TableCell className="text-xs font-bold text-indigo-650">
                            {sub.rep_email || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5 py-1">
                              {edited ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full mr-1.5">Edited</span>
                              ) : (
                                repEmail && !viewerMode && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setEditingSub(sub)
                                      setEditingType('renewal')
                                    }} 
                                    className="h-7 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 border border-indigo-200/50 flex items-center gap-1 shadow-sm mr-1"
                                  >
                                    <Edit className="h-3 w-3" /> Edit
                                  </Button>
                                )
                              )}
                              <Button size="sm" variant="outline" onClick={() => generateRenewalPDF(sub)} className="h-7 text-xs flex items-center gap-1"><Download className="h-3 w-3" /> PDF</Button>
                              {!repEmail && <Button size="sm" onClick={() => handleDelete('account_renewal_calls', sub.id, sub.awl_id)} className="h-7 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/50 flex items-center gap-1 shadow-sm"><Trash2 className="h-3 w-3" /> Delete</Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {renderPagination(filteredRenewal.length)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeFormTab === 'progressive' && (
        <Card className="backdrop-blur-md bg-white/70 border border-white/40 shadow-lg overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />
          <CardHeader><CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2.5"><ClipboardList className="h-5 w-5 text-blue-500" /> Submitted Progressive Calls</CardTitle></CardHeader>
          <CardContent className="p-0">
            {filteredProgressive.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-medium">No submissions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Date</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">AWL ID</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Call Date</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400">Account Manager Email</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedList.map((sub: any) => {
                      const edited = isFormEdited(sub)
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="text-xs font-semibold text-slate-600">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-blue-600">{sub.awl_id}</TableCell>
                          <TableCell className="text-sm font-bold text-slate-700">{sub.date_of_call ? new Date(sub.date_of_call).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="text-xs font-bold text-indigo-650">
                            {sub.rep_email || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5 py-1">
                              {edited ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full mr-1.5">Edited</span>
                              ) : (
                                repEmail && !viewerMode && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setEditingSub(sub)
                                      setEditingType('progressive')
                                    }} 
                                    className="h-7 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 border border-indigo-200/50 flex items-center gap-1 shadow-sm mr-1"
                                  >
                                    <Edit className="h-3 w-3" /> Edit
                                  </Button>
                                )
                              )}
                              <Button size="sm" variant="outline" onClick={() => generateProgressivePDF(sub)} className="h-7 text-xs flex items-center gap-1"><Download className="h-3 w-3" /> PDF</Button>
                              {!repEmail && <Button size="sm" onClick={() => handleDelete('account_progressive_calls', sub.id, sub.awl_id)} className="h-7 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/50 flex items-center gap-1 shadow-sm"><Trash2 className="h-3 w-3" /> Delete</Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {renderPagination(filteredProgressive.length)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Form Dialog */}
      <Dialog open={editingSub !== null} onOpenChange={(open) => { if (!open) handleCloseEdit() }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Edit className="h-5 w-5 text-indigo-500" />
              Edit {editingType === 'discovery' ? 'Discovery' : editingType === 'orientation' ? 'Orientation' : editingType === 'renewal' ? 'Renewal' : 'Progressive'} Call Record ({editingSub?.awl_id})
            </DialogTitle>
          </DialogHeader>
          {editingSub && editingType === 'discovery' && (
            <DiscoveryCallForm 
              user={{ email: editingSub.rep_email, name: editingSub.rep_name || 'Account Manager' }}
              initialEditSub={editingSub}
              onSuccess={() => {
                handleCloseEdit()
                fetchForms()
              }}
              onCancel={handleCloseEdit}
            />
          )}
          {editingSub && editingType === 'orientation' && (
            <OrientationCallForm 
              user={{ email: editingSub.rep_email, name: editingSub.rep_name || 'Account Manager' }}
              initialEditSub={editingSub}
              onSuccess={() => {
                handleCloseEdit()
                fetchForms()
              }}
              onCancel={handleCloseEdit}
            />
          )}
          {editingSub && editingType === 'renewal' && (
            <RenewalCallForm 
              user={{ email: editingSub.rep_email, name: editingSub.rep_name || 'Account Manager' }}
              initialEditSub={editingSub}
              onSuccess={() => {
                handleCloseEdit()
                fetchForms()
              }}
              onCancel={handleCloseEdit}
            />
          )}
          {editingSub && editingType === 'progressive' && (
            <ProgressiveCallForm 
              user={{ email: editingSub.rep_email, name: editingSub.rep_name || 'Account Manager' }}
              initialEditSub={editingSub}
              onSuccess={() => {
                handleCloseEdit()
                fetchForms()
              }}
              onCancel={handleCloseEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
