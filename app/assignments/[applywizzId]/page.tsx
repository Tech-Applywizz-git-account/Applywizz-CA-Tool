"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssignmentShell from "../../components/AssignmentShell";
import MetricInfoTooltip, { METRIC_TOOLTIPS } from "../../components/MetricInfoTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  UserCheck, 
  ShieldCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendedCAResponse {
  applywizz_id: string;
  preview_method: string;
  recommended_ca: {
    name: string;
    email: string;
    system_name: string | null;
    team_name: string | null;
    effective_load: number;
    min_capacity: number;
    max_capacity: number;
    utilization_percentage: number;
  };
}

interface CACandidate {
  ca_id: string;
  name: string;
  email: string;
  system_name: string | null;
  team_name: string | null;
  effective_load: number;
  min_capacity: number;
  max_capacity: number;
  utilization_percentage: number;
}

export default function RecommendationPreview({ params }: { params: { applywizzId: string } }) {
  const { applywizzId } = params;
  const router = useRouter();

  const [previewData, setPreviewData] = useState<RecommendedCAResponse | null>(null);
  const [candidates, setCandidates] = useState<CACandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedCAEmail, setSelectedCAEmail] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Load preview data and active candidates list
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const previewRes = await fetch(`/api/assignment/recommendation/${applywizzId}`);
      if (!previewRes.ok) {
        throw new Error(
          previewRes.status === 404
            ? `No recommendation details or active client found for ID: ${applywizzId}`
            : "Failed to load recommendation data"
        );
      }
      const previewJson = await previewRes.json();
      setPreviewData(previewJson);
      setSelectedCAEmail(previewJson.recommended_ca.email);

      const capacityRes = await fetch("/api/dashboard/capacity");
      if (capacityRes.ok) {
        const capacityJson = await capacityRes.json();
        setCandidates(capacityJson || []);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [applywizzId]);

  const handleSubmitDecision = async (emailToSubmit: string) => {
    try {
      setSubmitting(true);
      setSubmitSuccess(null);

      const loggedInUserStr = localStorage.getItem("loggedInUser");
      const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;

      const res = await fetch("/api/assignment/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applywizz_id: applywizzId,
          ca_email: emailToSubmit,
          reviewed_by: loggedInUser?.id,
          remarks: remarks.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to submit assignment decision");
      }

      const result = await res.json();
      setSubmitSuccess(result.status);
      setTimeout(() => {
        router.push("/assignments");
      }, 1500);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getRationaleExplanation = () => {
    if (!previewData) return "";
    const ca = previewData.recommended_ca;
    if (ca.effective_load < ca.min_capacity) {
      const deficit = (ca.min_capacity - ca.effective_load).toFixed(1);
      return `This Career Associate was selected because they are currently under their minimum capacity of ${ca.min_capacity} assignments (effective load: ${ca.effective_load}). They have a current deficit of ${deficit} client load, making them the highest priority candidate to receive new assignments to maintain team balance.`;
    } else {
      return `This Career Associate was selected because all available Career Associates have successfully met their minimum workload capacities. Among all eligible candidates who remain under their maximum capacity limits, this candidate has the lowest overall utilization percentage (${ca.utilization_percentage}%).`;
    }
  };

  const getUtilColor = (util: number) => {
    if (util < 60) return "text-emerald-600 dark:text-emerald-400";
    if (util <= 85) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  return (
    <AssignmentShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Back Link */}
        <div>
          <Link href="/assignments" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm transition">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Queue</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400 mb-4" />
            <p className="text-slate-400 dark:text-slate-400 text-sm animate-pulse">Retrieving recommendation details...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950 text-slate-800 dark:text-slate-200 p-8 rounded-2xl text-center shadow-xl">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-rose-500">Loading Error</h2>
            <p className="text-slate-400 dark:text-slate-400 text-sm mt-1">{error}</p>
            <Button onClick={loadData} variant="outline" className="mt-6 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              Retry
            </Button>
          </div>
        ) : !previewData ? null : (
          <div className="space-y-6">
            {/* Success overlay state */}
            {submitSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 dark:text-emerald-400 shrink-0 animate-bounce" />
                <div>
                  <h3 className="text-lg font-bold">Decision Stored Successfully</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                    The client has been assigned to the Career Associate. State updated to: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{submitSuccess}</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Main Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Recommendation Summary */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md md:col-span-2">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Assignment Recommendation</CardTitle>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-indigo-600 dark:text-indigo-300 font-semibold font-mono border border-slate-200 dark:border-slate-700">
                      {previewData.applywizz_id}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Recommended CA display */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                      <UserCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Recommended Career Associate</span>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">{previewData.recommended_ca.name}</h3>
                      <p className="text-sm font-mono text-slate-500 dark:text-slate-400">{previewData.recommended_ca.email}</p>
                      {/* Team and System Name badges */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {previewData.recommended_ca.team_name && (
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {previewData.recommended_ca.team_name}
                          </span>
                        )}
                        {previewData.recommended_ca.system_name && (
                          <span className="text-xs font-mono text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                            {previewData.recommended_ca.system_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation explanation */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Allocation Rationale
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      {getRationaleExplanation()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Recommended CA Metrics */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CA Capacity Profile</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3.5">
                    {/* Effective Load */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Effective Load</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.effectiveLoad} />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{previewData.recommended_ca.effective_load}</span>
                    </div>

                    {/* Min Capacity */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Min Capacity</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.minCapacity} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{previewData.recommended_ca.min_capacity}</span>
                    </div>

                    {/* Max Capacity */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Max Capacity</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.maxCapacity} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{previewData.recommended_ca.max_capacity}</span>
                    </div>

                    {/* Available Capacity */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Available Capacity</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.availableCapacity} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {previewData.recommended_ca.max_capacity - previewData.recommended_ca.effective_load}
                      </span>
                    </div>

                    {/* Utilization */}
                    <div className="flex justify-between items-center pb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Utilization</span>
                        <MetricInfoTooltip content={METRIC_TOOLTIPS.utilizationPercentage} />
                      </div>
                      <span className={cn("text-sm font-bold", getUtilColor(previewData.recommended_ca.utilization_percentage))}>
                        {previewData.recommended_ca.utilization_percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Allocation source</span>
                    <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium capitalize mt-0.5">{previewData.preview_method.replace(/_/g, ' ')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Approval and Reassignment Action Form */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-500 dark:text-indigo-400" /> Decision Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Remarks block */}
                <div>
                  <Label htmlFor="remarks" className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Evaluation Notes (Optional)</Label>
                  <Input
                    id="remarks"
                    placeholder="Enter review notes or explanation for manual reassignment..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="mt-2 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-end border-t border-slate-100 dark:border-slate-800/60 pt-6">
                  {/* Approve Recommended Option */}
                  <div className="flex-1 flex flex-col justify-between p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5">
                    <div>
                      <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Accept Recommendation</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Confirm the automated algorithm recommendation. The client will be assigned to {previewData.recommended_ca.name}.
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleSubmitDecision(previewData.recommended_ca.email)}
                      disabled={submitting}
                      className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition"
                    >
                      {submitting ? "Processing..." : "Approve Suggested CA"}
                    </Button>
                  </div>

                  {/* Dynamic Reassign Option */}
                  <div className="flex-1 flex flex-col justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Override Recommendation</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Select an alternate Career Associate candidate with active available capacity.
                      </p>
                      
                      <div className="mt-3">
                        <Label htmlFor="reassign" className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Select alternate CA</Label>
                        <Select value={selectedCAEmail} onValueChange={setSelectedCAEmail}>
                          <SelectTrigger id="reassign" className="mt-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                            <SelectValue placeholder="Choose CA email..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 max-h-56">
                            {candidates.map(c => (
                              <SelectItem key={c.ca_id} value={c.email}>
                                {c.name} — Load: {c.effective_load}/{c.max_capacity}
                                {c.team_name && <span className="text-slate-400 ml-1">({c.team_name})</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleSubmitDecision(selectedCAEmail)}
                      disabled={submitting || selectedCAEmail === previewData.recommended_ca.email}
                      className="mt-4 w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-medium transition"
                    >
                      {submitting ? "Processing..." : "Confirm Reassignment"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AssignmentShell>
  );
}
