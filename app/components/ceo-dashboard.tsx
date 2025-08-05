// "use client"

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Progress } from "@/components/ui/progress"
// import { AlertTriangle, Users, Target, TrendingUp, Activity } from "lucide-react"

// interface CEODashboardProps {
//   user: any
//   onLogout: () => void
// }

// export function CEODashboard({ user, onLogout }: CEODashboardProps) {
//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">CEO Dashboard</h1>
//             <p className="text-slate-600">Executive Performance Overview</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button variant="outline">Profile</Button>
//             <Button onClick={onLogout}>Logout</Button>
//           </div>
//         </div>

//         {/* Performance Alert */}
//         <Card className="mb-6 border-red-200 bg-red-50">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-2 text-red-700">
//               <AlertTriangle className="h-5 w-5" />
//               <span className="font-semibold">Team Performance Alert</span>
//             </div>
//             <p className="text-red-800 mt-1">
//               Overall submission rate: 65.5% | Target: 80% | 10 clients missed updates across all teams
//             </p>
//           </CardContent>
//         </Card>

//         {/* KPI Cards */}
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
//           <Card>
//             <CardContent className="p-4 text-center">
//               <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
//               <div className="text-2xl font-bold text-blue-600">3</div>
//               <div className="text-sm text-slate-600">Total Teams</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
//               <div className="text-2xl font-bold text-green-600">7</div>
//               <div className="text-sm text-slate-600">Total CAs</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
//               <div className="text-2xl font-bold text-green-600">19</div>
//               <div className="text-sm text-slate-600">Submitted Today</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
//               <div className="text-2xl font-bold text-red-600">10</div>
//               <div className="text-sm text-slate-600">Missed Today</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <Activity className="h-6 w-6 mx-auto mb-2 text-red-600" />
//               <div className="text-2xl font-bold text-red-600">65.5%</div>
//               <div className="text-sm text-slate-600">Submission Rate</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Executive KPIs with Team Incentives */}
//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle>Executive Key Performance Indicators & Team Incentives</CardTitle>
//           </CardHeader>
//           <CardContent>
            // <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            //   <div className="text-center">
            //     <div className="text-3xl font-bold text-orange-600 mb-2">2/3</div>
            //     <div className="text-sm font-medium text-slate-700">Team Performance</div>
            //     <div className="text-xs text-slate-500 mb-2">Target: 3/3</div>
            //     <Badge className="bg-orange-500">Monitor</Badge>
            //   </div>
            //   <div className="text-center">
            //     <div className="text-3xl font-bold text-red-600 mb-2">65.5%</div>
            //     <div className="text-sm font-medium text-slate-700">Submission Rate</div>
            //     <div className="text-xs text-slate-500 mb-2">Target: 80%</div>
            //     <Badge variant="destructive">Action Needed</Badge>
            //   </div>
            //   <div className="text-center">
            //     <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
            //     <div className="text-sm font-medium text-slate-700">Team Coverage</div>
            //     <div className="text-xs text-slate-500 mb-2">Target: 100%</div>
            //     <Badge className="bg-green-500">On Track</Badge>
            //   </div>
            //   <div className="text-center">
            //     <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
            //     <div className="text-sm font-medium text-slate-700">System Health</div>
            //     <div className="text-xs text-slate-500 mb-2">Target: 99%</div>
            //     <Badge className="bg-green-500">On Track</Badge>
            //   </div>
            // </div>

//             {/* Team Level Incentives */}
//             <div className="border-t pt-6">
//               <h3 className="text-lg font-semibold mb-4">Team Level Incentive Summary</h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <Card className="p-4">
//                   <h4 className="font-semibold text-blue-600">North Team</h4>
//                   <div className="mt-2 space-y-1 text-sm">
//                     <p>
//                       Team Lead Incentive: <span className="font-bold">₹2,000</span>
//                     </p>
//                     <p>
//                       Total CA Incentives: <span className="font-bold">₹15,500</span>
//                     </p>
//                     <p>
//                       Team Performance: <span className="text-red-600 font-bold">53%</span>
//                     </p>
//                   </div>
//                 </Card>
//                 <Card className="p-4">
//                   <h4 className="font-semibold text-green-600">South Team</h4>
//                   <div className="mt-2 space-y-1 text-sm">
//                     <p>
//                       Team Lead Incentive: <span className="font-bold">₹3,000</span>
//                     </p>
//                     <p>
//                       Total CA Incentives: <span className="font-bold">₹19,000</span>
//                     </p>
//                     <p>
//                       Team Performance: <span className="text-green-600 font-bold">75%</span>
//                     </p>
//                   </div>
//                 </Card>
//                 <Card className="p-4">
//                   <h4 className="font-semibold text-green-600">East Team</h4>
//                   <div className="mt-2 space-y-1 text-sm">
//                     <p>
//                       Team Lead Incentive: <span className="font-bold">₹3,000</span>
//                     </p>
//                     <p>
//                       Total CA Incentives: <span className="font-bold">₹22,000</span>
//                     </p>
//                     <p>
//                       Team Performance: <span className="text-green-600 font-bold">82%</span>
//                     </p>
//                   </div>
//                 </Card>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

        // {/* Charts Section */}
        // <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        //   {/* Submission Status Chart */}
        //   <Card>
        //     <CardHeader>
        //       <CardTitle>Today's Submission Status</CardTitle>
        //     </CardHeader>
        //     <CardContent>
        //       <div className="flex items-center justify-center h-48">
        //         <div className="relative">
        //           <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-green-600"></div>
        //           <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-red-500"></div>
        //           <div className="absolute inset-0 flex items-center justify-center">
        //             <div className="text-center">
        //               <div className="text-2xl font-bold">65.5%</div>
        //               <div className="text-sm text-slate-600">Submitted</div>
        //             </div>
        //           </div>
        //         </div>
        //       </div>
        //     </CardContent>
        //   </Card>

        //   {/* Team Performance Comparison */}
        //   <Card>
        //     <CardHeader>
        //       <CardTitle>Team Performance Comparison</CardTitle>
        //     </CardHeader>
        //     <CardContent>
        //       <div className="space-y-4">
        //         <div className="flex items-center justify-between">
        //           <span className="text-sm font-medium">North Team</span>
        //           <div className="flex items-center gap-2">
        //             <Progress value={53} className="w-24" />
        //             <span className="text-sm">53%</span>
        //           </div>
        //         </div>
        //         <div className="flex items-center justify-between">
        //           <span className="text-sm font-medium">South Team</span>
        //           <div className="flex items-center gap-2">
        //             <Progress value={75} className="w-24" />
        //             <span className="text-sm">75%</span>
        //           </div>
        //         </div>
        //         <div className="flex items-center justify-between">
        //           <span className="text-sm font-medium">East Team</span>
        //           <div className="flex items-center gap-2">
        //             <Progress value={82} className="w-24" />
        //             <span className="text-sm">82%</span>
        //           </div>
        //         </div>
        //       </div>
        //     </CardContent>
        //   </Card>
//         </div>
//       </div>
//     </div>
//   )
// }


"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Users, Target, TrendingUp, Activity } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CEODashboardProps {
  user: any
  onLogout: () => void
}

export function CEODashboard({ user, onLogout }: CEODashboardProps) {
  const [totalTeams, setTotalTeams] = useState(0)
  const [totalCAs, setTotalCAs] = useState(0)
  const [submittedToday, setSubmittedToday] = useState(0)
  const [missedToday, setMissedToday] = useState(0)
  const [submissionRate, setSubmissionRate] = useState(0)
  const [teamData, setTeamData] = useState<any[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch total teams
      const { data: teams } = await supabase.from("teams").select("id, name")
      setTotalTeams(teams?.length || 0)

      // Fetch total CAs
      const { data: cas } = await supabase.from("users").select("id").eq("designation", "CA")
      setTotalCAs(cas?.length || 0)

      // Fetch clients submitted today
      const today = new Date().toISOString().split("T")[0]
      const { data: clientsToday } = await supabase
        .from("clients")
        .select("status")
        .eq("date_assigned", today)

      const submitted = clientsToday?.filter((c) => c.status === "Submitted").length || 0
      const missed = clientsToday?.filter((c) => c.status === "Missed").length || 0
      setSubmittedToday(submitted)
      setMissedToday(missed)
      const rate = submitted + missed > 0 ? (submitted / (submitted + missed)) * 100 : 0
      setSubmissionRate(rate)

      // Fetch team incentives & performance
      const { data: incentives } = await supabase.from("incentives").select("*")
      // Combine team incentives with team performance
      const teamInfo = teams?.map((team) => {
        const teamIncentive = incentives?.filter((i) => i.team_id === team.id)
        const teamLeadIncentive = teamIncentive?.find((i) => i.type === "TeamLead")?.amount || 0
        const caIncentives = teamIncentive
          ?.filter((i) => i.type === "CA")
          .reduce((sum, i) => sum + i.amount, 0)
        const teamPerf = Math.floor(Math.random() * (90 - 50) + 50) // Replace with actual calculation
        return {
          teamName: team.name,
          teamLeadIncentive,
          caIncentives,
          performance: teamPerf
        }
      })
      setTeamData(teamInfo || [])
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">CEO Dashboard</h1>
            <p className="text-slate-600">Executive Performance Overview</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">Profile</Button>
            <Button onClick={onLogout}>Logout</Button>
          </div>
        </div>

        {/* Performance Alert */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Team Performance Alert</span>
            </div>
            <p className="text-red-800 mt-1">
              Overall submission rate: {submissionRate.toFixed(1)}% | Target: 80% | {missedToday} clients missed updates across all teams
            </p>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{totalTeams}</div>
              <div className="text-sm text-slate-600">Total Teams</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{totalCAs}</div>
              <div className="text-sm text-slate-600">Total CAs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{submittedToday}</div>
              <div className="text-sm text-slate-600">Submitted Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{missedToday}</div>
              <div className="text-sm text-slate-600">Missed Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">
                {submissionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600">Submission Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Executive KPIs & Incentives */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Executive Key Performance Indicators & Team Incentives</CardTitle>
          </CardHeader>
          <CardContent>
            {/* ... (keep static KPI layout, replace values dynamically if required) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">2/3</div>
                <div className="text-sm font-medium text-slate-700">Team Performance</div>
                <div className="text-xs text-slate-500 mb-2">Target: 3/3</div>
                <Badge className="bg-orange-500">Monitor</Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">65.5%</div>
                <div className="text-sm font-medium text-slate-700">Submission Rate</div>
                <div className="text-xs text-slate-500 mb-2">Target: 80%</div>
                <Badge variant="destructive">Action Needed</Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                <div className="text-sm font-medium text-slate-700">Team Coverage</div>
                <div className="text-xs text-slate-500 mb-2">Target: 100%</div>
                <Badge className="bg-green-500">On Track</Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-sm font-medium text-slate-700">System Health</div>
                <div className="text-xs text-slate-500 mb-2">Target: 99%</div>
                <Badge className="bg-green-500">On Track</Badge>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Team Level Incentive Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {teamData.map((team, idx) => (
                  <Card key={idx} className="p-4">
                    <h4 className="font-semibold text-blue-600">{team.teamName}</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        Team Lead Incentive: <span className="font-bold">₹{team.teamLeadIncentive}</span>
                      </p>
                      <p>
                        Total CA Incentives: <span className="font-bold">₹{team.caIncentives}</span>
                      </p>
                      <p>
                        Team Performance:{" "}
                        <span className={`font-bold ${team.performance < 60 ? "text-red-600" : "text-green-600"}`}>
                          {team.performance}%
                        </span>
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts remain same, just use submissionRate and teamData for dynamic rendering */}
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Submission Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-green-600"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-red-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">65.5%</div>
                      <div className="text-sm text-slate-600">Submitted</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">North Team</span>
                  <div className="flex items-center gap-2">
                    <Progress value={53} className="w-24" />
                    <span className="text-sm">53%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">South Team</span>
                  <div className="flex items-center gap-2">
                    <Progress value={75} className="w-24" />
                    <span className="text-sm">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">East Team</span>
                  <div className="flex items-center gap-2">
                    <Progress value={82} className="w-24" />
                    <span className="text-sm">82%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

