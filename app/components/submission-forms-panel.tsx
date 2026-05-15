import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Download, ExternalLink, Loader2, FileText, Calendar, DollarSign, Briefcase, Eye } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function SubmissionFormsPanel() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sales_success_submissions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
         if (error.code === '42P01') {
            console.warn("Table sales_success_submissions does not exist yet. Please run the SQL setup.")
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

  const generatePDF = (sub: any) => {
    // Intelligently generate a neat html template and open it in a new window to print/save as PDF.
    const printWindow = window.open('', '', 'width=800,height=900')
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Sales Submission - ${sub.awl_id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
            body { font-family: 'Outfit', system-ui, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #f8fafc; }
            .page { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); margin-bottom: 10px; border: 1px solid #e2e8f0; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; }
            .title { font-size: 24px; font-weight: 900; margin: 0; color: #1e1b4b; text-transform: uppercase; letter-spacing: -0.02em; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 600; }
            .section { margin-bottom: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 0.05em; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .field { margin-bottom: 8px; }
            .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 2px; letter-spacing: 0.05em; }
            .value { font-size: 13px; font-weight: 600; color: #0f172a; }
            .screenshot { margin-top: 10px; max-width: 100%; max-height: 400px; object-fit: contain; border: 2px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .page-break { page-break-before: always; }
            @media print {
              body { background: white; padding: 0; }
              .page { box-shadow: none; border: none; padding: 0; margin-bottom: 0; border-radius: 0; }
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
              <div class="field" style="grid-column: span 2;"><div class="label">Was the client clearly informed about: Delivery timelines of resume and start of process, Job market realities, No guaranteed placement policy, Account management process</div><div class="value">${sub.client_informed || 'N/A'}</div></div>
              <div class="field"><div class="label">Were any special promises made?</div><div class="value">${sub.special_promises || 'N/A'}</div></div>
              ${sub.special_promises === 'Yes' ? `<div class="field" style="grid-column: span 2;"><div class="label">If yes, specify:</div><div class="value">${sub.special_promises_specify || 'N/A'}</div></div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Onboarding</div>
            <div class="grid">
              <div class="field" style="grid-column: span 2;"><div class="label">Has the client completed the onboarding form?</div><div class="value">${sub.onboarding_completed ? 'Yes' : 'No'}</div></div>
              <div class="field" style="grid-column: span 2;"><div class="label">Onboarding completed after follow-up?</div><div class="value">${sub.onboarding_after_followup || 'N/A'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Additional Info & Signature</div>
            <div class="grid">
              <div class="field" style="grid-column: span 2;"><div class="label">Additional notes for account manager</div><div class="value">${sub.additional_notes || 'None'}</div></div>
              <div class="field"><div class="label">Full Name (Signature)</div><div class="value">${sub.rep_signature || 'N/A'}</div></div>
            </div>
          </div>
          </div>

          ${(sub.payment_screenshot_url || sub.onboarding_screenshot_url) ? `
          <div class="page page-break">
            <div class="header">
              <h1 class="title">Attachments</h1>
              <p class="subtitle">Sales Success Record - ${sub.awl_id}</p>
            </div>
            
            ${sub.payment_screenshot_url ? `
            <div class="section">
              <div class="section-title">Payment Screenshot</div>
              <img class="screenshot" src="${sub.payment_screenshot_url}" alt="Payment Screenshot" />
            </div>
            ` : ''}

            ${sub.onboarding_screenshot_url ? `
            <div class="section">
              <div class="section-title">Onboarding Screenshot</div>
              <img class="screenshot" src="${sub.onboarding_screenshot_url}" alt="Onboarding Screenshot" />
            </div>
            ` : ''}
          </div>
          ` : ''}

          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const filteredSubmissions = submissions.filter(s => 
    (s.rep_name?.toLowerCase().includes(search.toLowerCase())) ||
    (s.awl_id?.toLowerCase().includes(search.toLowerCase())) ||
    (s.client_name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Sales Success Submissions
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-12">View and manage form submissions from BDA reps.</p>
        </div>
      </div>

      <Card className="border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-slate-800">Submission Records</CardTitle>
            <Badge variant="secondary" className="font-black bg-indigo-50 text-indigo-700">{filteredSubmissions.length} Forms</Badge>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search by Rep, Client, or AWL-ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500 font-semibold">Loading submissions...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Sales Rep</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Details</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Sale Info</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Financials</TableHead>
                  <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-400">No submissions found matching your search.</TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((sub, idx) => (
                    <TableRow key={sub.id || idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                      <TableCell className="pl-6 py-4">
                        <div className="font-bold text-slate-800">{sub.rep_name}</div>
                        <div className="text-xs text-slate-400">{sub.rep_email}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{new Date(sub.created_at).toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-800">{sub.client_name}</div>
                        <div className="text-xs font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded inline-block mt-1">{sub.awl_id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> {new Date(sub.sale_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mt-1">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {sub.job_market}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-black text-emerald-600">
                          <DollarSign className="h-4 w-4" /> {sub.sale_value}
                        </div>
                        <Badge variant="outline" className="mt-1 text-[9px] uppercase font-bold text-slate-500 bg-white">
                          {sub.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {sub.payment_screenshot_url && (
                            <Button variant="outline" size="sm" onClick={() => setPreviewUrl(sub.payment_screenshot_url)} className="h-8 gap-1.5 text-slate-600 hover:text-indigo-600">
                              <Eye className="h-3.5 w-3.5" /> Payment
                            </Button>
                          )}
                          {sub.onboarding_screenshot_url && (
                            <Button variant="outline" size="sm" onClick={() => setPreviewUrl(sub.onboarding_screenshot_url)} className="h-8 gap-1.5 text-slate-600 hover:text-indigo-600">
                              <Eye className="h-3.5 w-3.5" /> Onboarding
                            </Button>
                          )}
                          <Button size="sm" onClick={() => generatePDF(sub)} className="h-8 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-none gap-1.5">
                            <Download className="h-3.5 w-3.5" /> PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
    </div>
  )
}
