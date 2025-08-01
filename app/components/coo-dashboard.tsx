"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, AlertCircle } from "lucide-react"

interface COODashboardProps {
  user: any
  onLogout: () => void
}

export function COODashboard({ user, onLogout }: COODashboardProps) {
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">COO Dashboard</h1>
            <p className="text-slate-600">Team Level Operations & Performance</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">Profile</Button>
            <Button onClick={onLogout}>Logout</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Select Team</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Leaders</SelectItem>
                <SelectItem value="north">North Team</SelectItem>
                <SelectItem value="south">South Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Today
              </Button>
              <span className="text-sm text-slate-600">July 29th, 2025</span>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Team Alerts - Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-800">North team: 7 clients missed updates</span>
              </div>
              <Badge variant="destructive">HIGH</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-800">North team below 60% submission rate</span>
              </div>
              <Badge variant="destructive">HIGH</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-orange-800">South team: 1 CA late submission</span>
              </div>
              <Badge className="bg-orange-500">MEDIUM</Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-slate-600">Total Teams</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">7</div>
              <div className="text-sm text-slate-600">Total CAs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">29</div>
              <div className="text-sm text-slate-600">Total Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">19</div>
              <div className="text-sm text-slate-600">Submitted Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">10</div>
              <div className="text-sm text-slate-600">Missed Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">65.5%</div>
              <div className="text-sm text-slate-600">Overall Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Team Incentive Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Incentive Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-700">North Team</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    Team Lead: <span className="font-bold">₹2,000</span>
                  </p>
                  <p>
                    CAs Total: <span className="font-bold">₹15,500</span>
                  </p>
                  <p>
                    Performance: <span className="text-red-600 font-bold">53.3%</span>
                  </p>
                  <Badge variant="destructive" className="mt-2">
                    Needs Attention
                  </Badge>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-700">South Team</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    Team Lead: <span className="font-bold">₹3,000</span>
                  </p>
                  <p>
                    CAs Total: <span className="font-bold">₹19,000</span>
                  </p>
                  <p>
                    Performance: <span className="text-green-600 font-bold">75%</span>
                  </p>
                  <Badge className="bg-green-500 mt-2">Good</Badge>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-700">Total Incentives</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    Team Leads: <span className="font-bold">₹5,000</span>
                  </p>
                  <p>
                    All CAs: <span className="font-bold">₹34,500</span>
                  </p>
                  <p>
                    Grand Total: <span className="font-bold text-blue-600">₹39,500</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance - Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* North Team */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    N
                  </div>
                  <div>
                    <h3 className="font-semibold">Team Lead North</h3>
                    <p className="text-sm text-slate-600">North Region • Last update: 02:45 PM</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="destructive">Needs Attention</Badge>
                      <Badge className="bg-orange-500">2 Alerts</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div>
                    <div className="text-lg font-bold">3</div>
                    <div className="text-xs text-slate-600">CAs</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">15</div>
                    <div className="text-xs text-slate-600">Clients</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">8</div>
                    <div className="text-xs text-slate-600">Submitted</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">7</div>
                    <div className="text-xs text-slate-600">Missed</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">4</div>
                    <div className="text-xs text-slate-600">Completed</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">53.3%</div>
                    <div className="text-xs text-slate-600">Rate</div>
                  </div>
                </div>
              </div>

              {/* South Team */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div>
                    <h3 className="font-semibold">Team Lead South</h3>
                    <p className="text-sm text-slate-600">South Region • Last update: 03:20 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div>
                    <div className="text-lg font-bold">2</div>
                    <div className="text-xs text-slate-600">CAs</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">8</div>
                    <div className="text-xs text-slate-600">Clients</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">6</div>
                    <div className="text-xs text-slate-600">Submitted</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
