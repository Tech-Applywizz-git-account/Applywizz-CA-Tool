import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Download, ExternalLink, Loader2, FileText, Calendar, Eye, Trash2, ChevronLeft, ChevronRight, Filter, Edit } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResumeCompletionForm } from "./resume-completion-form"

export function ResumeCompletionPanel({ 
  repEmail, 
  monthOffset, 
  hideHeader = false,
  viewerMode = false
}: { 
  repEmail?: string; 
  monthOffset?: number; 
  hideHeader?: boolean;
  viewerMode?: boolean;
}) {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Edit Dialog State
  const [editingSub, setEditingSub] = useState<any>(null)

  const handleCloseEdit = () => {
    setEditingSub(null)
  }

  const isFormEdited = (sub: any) => {
    return sub.is_edited === true
  }

  // Filters & Pagination State
  const [repFilter, setRepFilter] = useState("All")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, repFilter, startDate, endDate, monthOffset])

  const handleDelete = async (id: string, awlId: string) => {
    const ok = window.confirm(`Are you absolutely sure you want to delete this submission for AWL ID: ${awlId}? This action cannot be undone.`)
    if (!ok) return
    try {
      const { error } = await supabase.from('resume_completion_submissions').delete().eq('id', id)
      if (error) throw error
      alert("Submission deleted successfully!")
      fetchSubmissions()
    } catch (err: any) {
      console.error(err)
      alert("Failed to delete submission: " + err.message)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [repEmail, monthOffset])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('resume_completion_submissions')
        .select('*')
      
      if (repEmail) {
        query = query.eq('rep_email', repEmail)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
         if (error.code === '42P01') {
            console.warn("Table resume_completion_submissions does not exist yet. Please run the SQL setup.")
            setSubmissions([])
         } else {
            console.error(error)
         }
      } else {
         setSubmissions(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const isFiltered = !!(search || repFilter !== "All" || startDate || endDate)

  const handleClearFilters = () => {
    setSearch("")
    setRepFilter("All")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
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

  const uniqueReps = Array.from(new Set(submissions.map(s => s.rep_email).filter(Boolean))).sort()

  const filteredSubmissions = submissions.filter(s => {
    const matchSearch = !search.trim() || (
      (s.rep_name?.toLowerCase().includes(search.toLowerCase())) ||
      (s.rep_email?.toLowerCase().includes(search.toLowerCase())) ||
      (s.awl_id?.toLowerCase().includes(search.toLowerCase())) ||
      (s.client_apps_email?.toLowerCase().includes(search.toLowerCase()))
    )
    const matchRep = repFilter === "All" || s.rep_email === repFilter
    let matchDate = true
    if (startDate) {
      matchDate = matchDate && new Date(s.created_at) >= new Date(startDate + "T00:00:00")
    }
    if (endDate) {
      matchDate = matchDate && new Date(s.created_at) <= new Date(endDate + "T23:59:59")
    }
    if (monthOffset !== undefined && !startDate && !endDate) {
      const now = new Date()
      const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
      const subDate = new Date(s.created_at)
      matchDate = matchDate && 
        subDate.getFullYear() === targetDate.getFullYear() && 
        subDate.getMonth() === targetDate.getMonth()
    }
    return matchSearch && matchRep && matchDate
  })

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage) || 1
  const paginatedSubmissions = filteredSubmissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Resume Completion Submissions
            </h2>
            <p className="text-sm text-slate-500 mt-1 ml-12">View and manage resume completion form submissions from specialists.</p>
          </div>
        </div>
      )}

      <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-slate-800">Submission Records</CardTitle>
            <Badge variant="secondary" className="font-black bg-teal-50 text-teal-700">{filteredSubmissions.length} Forms</Badge>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md justify-end flex-wrap sm:flex-nowrap">
            {isFiltered && (
              <Button variant="ghost" onClick={handleClearFilters} className="text-xs font-bold text-rose-500 hover:text-rose-750 hover:bg-rose-50 h-9 px-3 rounded-lg shrink-0">
                Clear Filters
              </Button>
            )}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by Specialist, AWL-ID, or Email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" />
            </div>
          </div>
        </CardHeader>

        {/* Filters Grid */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/20">
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${monthOffset !== undefined ? 'lg:grid-cols-2' : (repEmail ? 'lg:grid-cols-3' : 'lg:grid-cols-4')} gap-3 items-end`}>
            {!repEmail && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Resume Specialist</label>
                <Select value={repFilter} onValueChange={setRepFilter}>
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Specialists</SelectItem>
                    {uniqueReps.map(rep => (
                      <SelectItem key={rep} value={rep}>{rep}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {monthOffset === undefined && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">From Date</label>
                  <Input type="date" className="h-9 text-xs bg-white border-slate-200 rounded-lg" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">To Date</label>
                  <Input type="date" className="h-9 text-xs bg-white border-slate-200 rounded-lg" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-teal-500 animate-spin mb-4" />
              <p className="text-slate-500 font-semibold">Loading submissions...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Specialist</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Details</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">LinkedIn</TableHead>
                    <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-slate-400">No submissions found matching your search.</TableCell>
                    </TableRow>
                  ) : (
                    paginatedSubmissions.map((sub, idx) => {
                      const yesCount = [
                        sub.onboarding_form_filled, sub.discovery_call_completed,
                        sub.target_role_identified, sub.goals_documented,
                        sub.resume_customized, sub.corrections_completed,
                        sub.resume_sent_via_email, sub.resume_shared_with_onboarding
                      ].filter(v => v === 'Yes').length
                      return (
                        <TableRow key={sub.id || idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                          <TableCell className="pl-6 py-4">
                            <div className="font-bold text-slate-800">{sub.rep_name}</div>
                            <div className="text-xs text-slate-400">{sub.rep_email}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{new Date(sub.created_at).toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded inline-block text-xs">{sub.awl_id}</div>
                            <div className="text-xs text-slate-500 mt-1">{sub.client_apps_email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.linkedin_optimization_sold === 'Yes' ? 'default' : 'secondary'} className={sub.linkedin_optimization_sold === 'Yes' ? 'bg-emerald-50 text-emerald-700 border-0 font-bold' : 'bg-slate-100 text-slate-500 border-0 font-bold'}>
                              {sub.linkedin_optimization_sold}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              {sub.email_screenshot_url && (
                                <Button variant="outline" size="sm" onClick={() => setPreviewUrl(sub.email_screenshot_url)} className="h-8 gap-1.5 text-slate-600 hover:text-teal-600">
                                  <Eye className="h-3.5 w-3.5" /> Email
                                </Button>
                              )}
                              {sub.linkedin_screenshot_url && (
                                <Button variant="outline" size="sm" onClick={() => setPreviewUrl(sub.linkedin_screenshot_url)} className="h-8 gap-1.5 text-slate-600 hover:text-teal-600">
                                  <Eye className="h-3.5 w-3.5" /> LinkedIn
                                </Button>
                              )}
                              {isFormEdited(sub) ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full">Edited</span>
                              ) : (
                                repEmail && !viewerMode && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => setEditingSub(sub)} 
                                    className="h-8 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-none gap-1.5 border border-indigo-200/50"
                                  >
                                    <Edit className="h-3.5 w-3.5" /> Edit
                                  </Button>
                                )
                              )}
                              <Button size="sm" onClick={() => generatePDF(sub)} className="h-8 bg-teal-50 text-teal-600 hover:bg-teal-100 hover:text-teal-700 shadow-none gap-1.5">
                                <Download className="h-3.5 w-3.5" /> PDF
                              </Button>
                               {!repEmail && (
                                <Button size="sm" onClick={() => handleDelete(sub.id, sub.awl_id)} className="h-8 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 shadow-none gap-1.5 border border-rose-200/50">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {filteredSubmissions.length > 0 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <p className="text-[10px] font-bold text-slate-400">
                      Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length}
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
              )}
            </>
          )}
        </div>
      </Card>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-slate-50 shrink-0">
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4">
            {previewUrl && (
              previewUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-sm border border-slate-200 rounded-md" />
              ) : previewUrl.match(/\.pdf$/i) ? (
                <iframe src={previewUrl} className="w-full h-full border-0 rounded-md" title="PDF Preview" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <FileText className="h-16 w-16 text-slate-400" />
                  <p className="text-slate-600 font-medium">This file type cannot be previewed directly.</p>
                  <Button onClick={() => window.open(previewUrl, '_blank')} className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Open / Download File
                  </Button>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={editingSub !== null} onOpenChange={(open) => { if (!open) handleCloseEdit() }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Edit className="h-5 w-5 text-teal-500" />
              Edit Resume Completion Record ({editingSub?.awl_id})
            </DialogTitle>
          </DialogHeader>
          {editingSub && (
            <ResumeCompletionForm 
              user={{ email: editingSub.rep_email, name: editingSub.rep_name }}
              initialEditSub={editingSub}
              onSuccess={() => {
                handleCloseEdit()
                fetchSubmissions()
              }}
              onCancel={handleCloseEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
