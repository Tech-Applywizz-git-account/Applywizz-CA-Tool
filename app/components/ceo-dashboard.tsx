"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Users, Target, TrendingUp, Activity } from "lucide-react"

interface CEODashboardProps {
  user: any
  onLogout: () => void
}

export function CEODashboard({ user, onLogout }: CEODashboardProps) {
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
              Overall submission rate: 65.5% | Target: 80% | 10 clients missed updates across all teams
            </p>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-slate-600">Total Teams</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">7</div>
              <div className="text-sm text-slate-600">Total CAs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">19</div>
              <div className="text-sm text-slate-600">Submitted Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">10</div>
              <div className="text-sm text-slate-600">Missed Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">65.5%</div>
              <div className="text-sm text-slate-600">Submission Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Executive KPIs with Team Incentives */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Executive Key Performance Indicators & Team Incentives</CardTitle>
          </CardHeader>
          <CardContent>
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

            {/* Team Level Incentives */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Team Level Incentive Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold text-blue-600">North Team</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      Team Lead Incentive: <span className="font-bold">₹2,000</span>
                    </p>
                    <p>
                      Total CA Incentives: <span className="font-bold">₹15,500</span>
                    </p>
                    <p>
                      Team Performance: <span className="text-red-600 font-bold">53%</span>
                    </p>
                  </div>
                </Card>
                <Card className="p-4">
                  <h4 className="font-semibold text-green-600">South Team</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      Team Lead Incentive: <span className="font-bold">₹3,000</span>
                    </p>
                    <p>
                      Total CA Incentives: <span className="font-bold">₹19,000</span>
                    </p>
                    <p>
                      Team Performance: <span className="text-green-600 font-bold">75%</span>
                    </p>
                  </div>
                </Card>
                <Card className="p-4">
                  <h4 className="font-semibold text-green-600">East Team</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      Team Lead Incentive: <span className="font-bold">₹3,000</span>
                    </p>
                    <p>
                      Total CA Incentives: <span className="font-bold">₹22,000</span>
                    </p>
                    <p>
                      Team Performance: <span className="text-green-600 font-bold">82%</span>
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

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
