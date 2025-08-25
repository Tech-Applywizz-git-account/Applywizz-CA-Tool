//app/components/system-admin-dashboard.tsx

"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, UserCheck, UserX, Users, Shield, Building, Mail } from "lucide-react";
import { User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SystemAdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export function SystemAdminDashboard({ user, onLogout }: SystemAdminDashboardProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any | null>(null);




  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    isactive: true, // lowercase field
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "",
      department: "",
      isactive: true,
    });
    setSelectedTeamId(null); // ✅ Clear selected team
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Error fetching users:", error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchTeams(); // 🔥 call team fetch here
  }, []);


  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select(`
      id,
      name,
      lead:users!teams_lead_id_fkey (
        id,
        name
      )
    `);

    if (error) {
      console.error("Error fetching teams:", error.message);
    } else {
      setTeams(data || []);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) Invite auth user (keeps your existing flow)
    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: "Temp@123", // default temporary password
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      alert(`Error: ${result.error}`);
      setSubmitting(false); // stop loading

      return;
    }

    // 2) Insert into your public.users table AND return the inserted row (need the id)
    const { data: insertedUser, error: insertErr } = await supabase
      .from("users")
      .insert({
        name: formData.name,
        email: formData.email.toLowerCase(),
        role: formData.role,
        designation: formData.role,
        department: formData.department,
        isactive: true,
        created_at: new Date().toISOString(),
        base_salary: null,
        team_id:
          formData.role === "CA" || formData.role === "Junior CA"
            ? selectedTeamId
            : null,
      })
      .select("id, name, role")   // <-- IMPORTANT: return id
      .single();

    if (insertErr || !insertedUser) {
      alert(`Error adding user: ${insertErr?.message || "Unknown error"}`);
      return;
    }

    // 3) If the new user is a Team Lead, create a team for them
    if (insertedUser.role === "Team Lead") {
      const teamName = insertedUser.name
        ? `${insertedUser.name} Team`
        : "New Team";

      const { error: teamErr } = await supabase
        .from("teams")
        .insert({
          name: teamName,
          lead_id: insertedUser.id, // <-- ties the team to this Team Lead
        });

      if (teamErr) {
        alert(`User created, but failed to create team: ${teamErr.message}`);
        // carry on; user is created, only team creation failed
      } else {
        // refresh teams so the new Team Lead is available in the CA/JCA dropdown immediately
        await fetchTeams();
      }
    }

    alert("User created successfully!");
    await fetchUsers();
    setAddUserOpen(false);
    resetForm();
    setSubmitting(false); // back to normal

  };


  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("users")
      .update({
        name: formData.name,
        email: formData.email.toLowerCase(),
        role: formData.role,
        department: formData.department,
        designation: formData.role,
        isactive: formData.isactive,
      })
      .eq("id", selectedUser.id);
    if (error) alert(`Error updating user: ${error.message}`);
    else {
      fetchUsers();
      setEditUserOpen(false);
      setSelectedUser(null);
      resetForm();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) alert(`Error deleting user: ${error.message}`);
    else fetchUsers();
  };

  const handleToggleStatus = async (userId: string, isactive: boolean) => {
    const { error } = await supabase.from("users").update({ isactive: !isactive }).eq("id", userId);
    if (error) alert(`Error updating status: ${error.message}`);
    else fetchUsers();
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isactive: user.isactive,
    });
    setEditUserOpen(true);
  };

  const lc = (s: unknown) => (typeof s === "string" ? s.toLowerCase() : "");
  const q = lc(searchTerm);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = lc(u?.name).includes(q) || lc(u?.email).includes(q);
    const matchesRole = filterRole === "all" || u?.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "Active" && !!u?.isactive) ||
      (filterStatus === "Inactive" && !u?.isactive);
    return matchesSearch && matchesRole && matchesStatus;
  });


  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isactive).length,
    inactiveUsers: users.filter((u) => !u.isactive).length,
    totalDepartments: [...new Set(users.map((u) => u.department))].length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">System Admin Dashboard</h1>
            <p className="text-slate-600">User Management & System Administration</p>
          </div>
          {/* <div className="flex items-center gap-4">
            <Button variant="outline">Profile</Button>
            <Button onClick={onLogout}>Logout</Button>
          </div> */}

          <div className="flex items-center gap-4">
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Bulk Import CSV</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Import Users (CSV)</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="text-sm text-slate-600">
                    Upload a CSV with headers:
                    <code className="ml-1 bg-slate-100 px-1 rounded">
                      name,email,role,department,isactive,team_lead_email
                    </code>
                    <div className="mt-1 text-xs">
                      • <b>email</b> is required and will be lowercased
                      <br />• <b>department</b> is optional (auto-set from role if empty)
                      <br />• <b>isactive</b> defaults to true
                      <br />• For CA/JCA, you may provide <b>team_lead_email</b> to auto-assign
                    </div>
                  </div>

                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        if (!bulkFile) {
                          alert("Please choose a CSV file.");
                          return;
                        }
                        setBulkLoading(true);
                        setBulkResult(null);

                        const fd = new FormData();
                        fd.append("file", bulkFile);

                        const res = await fetch("/api/bulk-invite", {
                          method: "POST",
                          body: fd,
                        });

                        const json = await res.json();
                        setBulkLoading(false);

                        if (!res.ok) {
                          alert(json.error || "Bulk import failed");
                          return;
                        }

                        setBulkResult(json);
                        await fetchUsers(); // refresh table
                      }}
                      disabled={bulkLoading}
                    >
                      {bulkLoading ? "Importing..." : "Import & Send Invites"}
                    </Button>

                    <Button variant="outline" onClick={() => setBulkOpen(false)}>
                      Close
                    </Button>
                  </div>

                  {bulkResult && (
                    <div className="max-h-64 overflow-auto border rounded p-2">
                      <div className="text-sm font-medium mb-2">
                        Processed: {bulkResult.count}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Message</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkResult.results.map((r: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{r.email}</TableCell>
                              <TableCell className="capitalize">{r.status}</TableCell>
                              <TableCell className="text-xs text-slate-600">{r.message || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 rounded-full h-10 w-10 flex items-center justify-center bg-black">
                  <User className="h-6 w-6 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <p className="font-medium">{user.name}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-sm text-slate-600">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <div className="text-sm text-slate-600">Active Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserX className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</div>
              <div className="text-sm text-slate-600">Inactive Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{stats.totalDepartments}</div>
              <div className="text-sm text-slate-600">Departments</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <div>
                  <Label className="text-sm font-medium">Search Users</Label>
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Filter by Role</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="CA">Career Associate</SelectItem>
                      <SelectItem value="Junior CA">Junior Career Associate</SelectItem>
                      <SelectItem value="Team Lead">Team Lead</SelectItem>
                      <SelectItem value="CRO">CRO</SelectItem>
                      <SelectItem value="COO">COO</SelectItem>
                      <SelectItem value="CEO">CEO</SelectItem>
                      <SelectItem value="Admin">System Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Filter by Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CA">Career Associate</SelectItem>
                            <SelectItem value="Junior CA">Junior Career Associate</SelectItem>
                            <SelectItem value="Team Lead">Team Lead</SelectItem>
                            <SelectItem value="CRO">CRO</SelectItem>
                            <SelectItem value="COO">COO</SelectItem>
                            <SelectItem value="CEO">CEO</SelectItem>
                            <SelectItem value="Admin">System Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Client Operations">Client Operations</SelectItem>
                            <SelectItem value="Executive">Executive</SelectItem>
                            <SelectItem value="HR">Human Resources</SelectItem>
                            <SelectItem value="IT">Information Technology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      {(formData.role === "CA" || formData.role === "Junior CA") && (
                        <div>
                          <Label htmlFor="team-lead">Assign to Team Lead</Label>
                          <Select
                            value={selectedTeamId || ""}
                            onValueChange={(value) => setSelectedTeamId(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Team Lead" />
                            </SelectTrigger>
                            {/* <SelectContent>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.users?.name || "Unnamed Team Lead"}
                                </SelectItem>
                              ))}
                            </SelectContent> */}
                            <SelectContent>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.lead?.name ? `${team.lead.name}${team.name ? ` (${team.name})` : ""}` : (team.name || "Unnamed Team")}
                                </SelectItem>
                              ))}
                            </SelectContent>

                          </Select>
                        </div>
                      )}

                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.isactive ? "Active" : "Inactive"}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, isactive: value === "Active" }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      {/* <Button type="submit" className="flex-1">
                        Add User
                      </Button> */}
                      <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? "Adding user..." : "Add User"}
                      </Button>

                      <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management ({filteredUsers.length} users)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Shield className="h-3 w-3" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-400" />
                          {user.department || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isactive ? "default" : "secondary"}
                          className={
                            user.isactive
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-red-100 text-red-800 border-red-300"
                          }
                        >
                          {user.isactive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {user.date_created ? new Date(user.date_created).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(user.id, user.isactive)}
                            className={user.isactive ? "text-red-600" : "text-green-600"}
                          >
                            {user.isactive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">Career Associate</SelectItem>
                      <SelectItem value="Junior CA">Junior Career Associate</SelectItem>
                      <SelectItem value="Team Lead">Team Lead</SelectItem>
                      <SelectItem value="CRO">CRO</SelectItem>
                      <SelectItem value="COO">COO</SelectItem>
                      <SelectItem value="CEO">CEO</SelectItem>
                      <SelectItem value="Admin">System Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Client Operations">Client Operations</SelectItem>
                      <SelectItem value="Executive">Executive</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="IT">Information Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.isactive ? "Active" : "Inactive"}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, isactive: value === "Active" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Update User
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditUserOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Bulk Import CSV</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Import Users (CSV)</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="text-sm text-slate-600">
                Upload a CSV with headers:
                <code className="ml-1 bg-slate-100 px-1 rounded">
                  name,email,role,department,isactive,team_lead_email
                </code>
                <div className="mt-1 text-xs">
                  • <b>email</b> is required and will be lowercased
                  <br />• <b>department</b> is optional (auto-set from role if empty)
                  <br />• <b>isactive</b> defaults to true
                  <br />• For CA/JCA, you may provide <b>team_lead_email</b> to auto-assign
                </div>
              </div>

              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
              />

              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    if (!bulkFile) {
                      alert("Please choose a CSV file.");
                      return;
                    }
                    setBulkLoading(true);
                    setBulkResult(null);

                    const fd = new FormData();
                    fd.append("file", bulkFile);

                    const res = await fetch("/api/bulk-invite", {
                      method: "POST",
                      body: fd,
                    });

                    const json = await res.json();
                    setBulkLoading(false);

                    if (!res.ok) {
                      alert(json.error || "Bulk import failed");
                      return;
                    }

                    setBulkResult(json);
                    await fetchUsers(); // refresh table
                  }}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? "Importing..." : "Import & Send Invites"}
                </Button>

                <Button variant="outline" onClick={() => setBulkOpen(false)}>
                  Close
                </Button>
              </div>

              {bulkResult && (
                <div className="max-h-64 overflow-auto border rounded p-2">
                  <div className="text-sm font-medium mb-2">
                    Processed: {bulkResult.count}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkResult.results.map((r: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{r.email}</TableCell>
                          <TableCell className="capitalize">{r.status}</TableCell>
                          <TableCell className="text-xs text-slate-600">{r.message || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog> */}

      </div>
    </div>
  );
}

// app/components/system-admin-dashboard.tsx

// "use client";

// import type React from "react";
// import { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabaseClient";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Plus, Edit, Trash2, UserCheck, UserX, Users, Shield, Building, Mail } from "lucide-react";
// import { User } from "lucide-react";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// interface SystemAdminDashboardProps {
//   user: any;
//   onLogout: () => void;
// }

// export function SystemAdminDashboard({ user, onLogout }: SystemAdminDashboardProps) {
//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [addUserOpen, setAddUserOpen] = useState(false);
//   const [editUserOpen, setEditUserOpen] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<any>(null);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterRole, setFilterRole] = useState("all");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [teams, setTeams] = useState<any[]>([]);
//   const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
//   const [submitting, setSubmitting] = useState(false);

//   const [bulkOpen, setBulkOpen] = useState(false);
//   const [bulkFile, setBulkFile] = useState<File | null>(null);
//   const [bulkLoading, setBulkLoading] = useState(false);
//   const [bulkResult, setBulkResult] = useState<any | null>(null);

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     role: "",
//     department: "",
//     isactive: true, // lowercase field
//   });

//   const resetForm = () => {
//     setFormData({
//       name: "",
//       email: "",
//       role: "",
//       department: "",
//       isactive: true,
//     });
//     setSelectedTeamId(null); // ✅ Clear selected team
//   };

//   const fetchUsers = async () => {
//     setLoading(true);
//     const { data, error } = await supabase.from("users").select("*");
//     if (error) {
//       console.error("Error fetching users:", error.message);
//     } else {
//       setUsers(data || []);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchUsers();
//     fetchTeams(); // 🔥 call team fetch here
//   }, []);

//   const fetchTeams = async () => {
//     const { data, error } = await supabase
//       .from("teams")
//       .select(`
//       id,
//       name,
//       lead:users!teams_lead_id_fkey (
//         id,
//         name
//       )
//     `);

//     if (error) {
//       console.error("Error fetching teams:", error.message);
//     } else {
//       setTeams(data || []);
//     }
//   };

//   const handleAddUser = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // 1) Invite auth user (keeps your existing flow)
//     const res = await fetch("/api/create-user", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         email: formData.email,
//         password: "Temp@123", // default temporary password
//       }),
//     });

//     const result = await res.json();
//     if (!res.ok) {
//       alert(`Error: ${result.error}`);
//       setSubmitting(false); // stop loading
//       return;
//     }

//     // 2) Insert into your public.users table AND return the inserted row (need the id)
//     const { data: insertedUser, error: insertErr } = await supabase
//       .from("users")
//       .insert({
//         name: formData.name,
//         email: formData.email.toLowerCase(),
//         role: formData.role,
//         designation: formData.role,
//         department: formData.department,
//         isactive: true,
//         created_at: new Date().toISOString(),
//         base_salary: null,
//         team_id:
//           formData.role === "CA" || formData.role === "Junior CA"
//             ? selectedTeamId
//             : null,
//       })
//       .select("id, name, role") // <-- IMPORTANT: return id
//       .single();

//     if (insertErr || !insertedUser) {
//       alert(`Error adding user: ${insertErr?.message || "Unknown error"}`);
//       return;
//     }

//     // 3) If the new user is a Team Lead, create a team for them
//     if (insertedUser.role === "Team Lead") {
//       const teamName = insertedUser.name
//         ? `${insertedUser.name} Team`
//         : "New Team";

//       const { error: teamErr } = await supabase
//         .from("teams")
//         .insert({
//           name: teamName,
//           lead_id: insertedUser.id, // <-- ties the team to this Team Lead
//         });

//       if (teamErr) {
//         alert(`User created, but failed to create team: ${teamErr.message}`);
//         // carry on; user is created, only team creation failed
//       } else {
//         // refresh teams so the new Team Lead is available in the CA/JCA dropdown immediately
//         await fetchTeams();
//       }
//     }

//     alert("User created successfully!");
//     await fetchUsers();
//     setAddUserOpen(false);
//     resetForm();
//     setSubmitting(false); // back to normal
//   };

//   const handleEditUser = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const { error } = await supabase
//       .from("users")
//       .update({
//         name: formData.name,
//         email: formData.email.toLowerCase(),
//         role: formData.role,
//         department: formData.department,
//         designation: formData.role,
//         isactive: formData.isactive,
//       })
//       .eq("id", selectedUser.id);
//     if (error) alert(`Error updating user: ${error.message}`);
//     else {
//       fetchUsers();
//       setEditUserOpen(false);
//       setSelectedUser(null);
//       resetForm();
//     }
//   };

//   const handleDeleteUser = async (userId: string) => {
//     if (!window.confirm("Are you sure you want to delete this user?")) return;
//     const { error } = await supabase.from("users").delete().eq("id", userId);
//     if (error) alert(`Error deleting user: ${error.message}`);
//     else fetchUsers();
//   };

//   const handleToggleStatus = async (userId: string, isactive: boolean) => {
//     const { error } = await supabase.from("users").update({ isactive: !isactive }).eq("id", userId);
//     if (error) alert(`Error updating status: ${error.message}`);
//     else fetchUsers();
//   };

//   const openEditDialog = (user: any) => {
//     setSelectedUser(user);
//     setFormData({
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       department: user.department,
//       isactive: user.isactive,
//     });
//     setEditUserOpen(true);
//   };

//   const lc = (s: unknown) => (typeof s === "string" ? s.toLowerCase() : "");
//   const q = lc(searchTerm);

//   const filteredUsers = users.filter((u) => {
//     const matchesSearch = lc(u?.name).includes(q) || lc(u?.email).includes(q);
//     const matchesRole = filterRole === "all" || u?.role === filterRole;
//     const matchesStatus =
//       filterStatus === "all" ||
//       (filterStatus === "Active" && !!u?.isactive) ||
//       (filterStatus === "Inactive" && !u?.isactive);
//     return matchesSearch && matchesRole && matchesStatus;
//   });

//   const stats = {
//     totalUsers: users.length,
//     activeUsers: users.filter((u) => u.isactive).length,
//     inactiveUsers: users.filter((u) => !u.isactive).length,
//     totalDepartments: [...new Set(users.map((u) => u.department))].length,
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 p-3 sm:p-4">
//       <div className="max-w-7xl mx-auto px-0 sm:px-0">
//         <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">System Admin Dashboard</h1>
//             <p className="text-slate-600">User Management & System Administration</p>
//           </div>

//           <div className="flex flex-wrap items-center gap-3 sm:gap-4">
//             <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
//               <DialogTrigger asChild>
//                 <Button variant="outline" className="w-full sm:w-auto">Bulk Import CSV</Button>
//               </DialogTrigger>
//               <DialogContent className="sm:max-w-[520px] w-[95vw] p-4">
//                 <DialogHeader>
//                   <DialogTitle>Bulk Import Users (CSV)</DialogTitle>
//                 </DialogHeader>

//                 <div className="space-y-3">
//                   <div className="text-sm text-slate-600">
//                     Upload a CSV with headers:
//                     <code className="ml-1 bg-slate-100 px-1 rounded">
//                       name,email,role,department,isactive,team_lead_email
//                     </code>
//                     <div className="mt-1 text-xs">
//                       • <b>email</b> is required and will be lowercased
//                       <br />• <b>department</b> is optional (auto-set from role if empty)
//                       <br />• <b>isactive</b> defaults to true
//                       <br />• For CA/JCA, you may provide <b>team_lead_email</b> to auto-assign
//                     </div>
//                   </div>

//                   <Input
//                     type="file"
//                     accept=".csv"
//                     onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
//                     className="w-full"
//                   />

//                   <div className="flex flex-col sm:flex-row gap-2">
//                     <Button
//                       onClick={async () => {
//                         if (!bulkFile) {
//                           alert("Please choose a CSV file.");
//                           return;
//                         }
//                         setBulkLoading(true);
//                         setBulkResult(null);

//                         const fd = new FormData();
//                         fd.append("file", bulkFile);

//                         const res = await fetch("/api/bulk-invite", {
//                           method: "POST",
//                           body: fd,
//                         });

//                         const json = await res.json();
//                         setBulkLoading(false);

//                         if (!res.ok) {
//                           alert(json.error || "Bulk import failed");
//                           return;
//                         }

//                         setBulkResult(json);
//                         await fetchUsers(); // refresh table
//                       }}
//                       disabled={bulkLoading}
//                       className="w-full sm:w-auto"
//                     >
//                       {bulkLoading ? "Importing..." : "Import & Send Invites"}
//                     </Button>

//                     <Button variant="outline" onClick={() => setBulkOpen(false)} className="w-full sm:w-auto">
//                       Close
//                     </Button>
//                   </div>

//                   {bulkResult && (
//                     <div className="max-h-64 overflow-auto border rounded p-2">
//                       <div className="text-sm font-medium mb-2">
//                         Processed: {bulkResult.count}
//                       </div>
//                       <Table>
//                         <TableHeader>
//                           <TableRow>
//                             <TableHead>Email</TableHead>
//                             <TableHead>Status</TableHead>
//                             <TableHead>Message</TableHead>
//                           </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                           {bulkResult.results.map((r: any, idx: number) => (
//                             <TableRow key={idx}>
//                               <TableCell>{r.email}</TableCell>
//                               <TableCell className="capitalize">{r.status}</TableCell>
//                               <TableCell className="text-xs text-slate-600">{r.message || "-"}</TableCell>
//                             </TableRow>
//                           ))}
//                         </TableBody>
//                       </Table>
//                     </div>
//                   )}
//                 </div>
//               </DialogContent>
//             </Dialog>

//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" className="p-0 rounded-full h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center bg-black">
//                   <User className="h-6 w-6 text-white" />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-48">
//                 <DropdownMenuLabel>
//                   <div className="flex flex-col">
//                     <p className="font-medium">{user.name}</p>
//                   </div>
//                 </DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuLabel>
//                   <div className="flex flex-col">
//                     <p className="text-xs text-muted-foreground">{user.email}</p>
//                   </div>
//                 </DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={onLogout}>
//                   Logout
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </div>

//         {/* Statistics Cards */}
//         <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
//           <Card>
//             <CardContent className="p-3 sm:p-4 text-center">
//               <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
//               <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
//               <div className="text-sm text-slate-600">Total Users</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-3 sm:p-4 text-center">
//               <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
//               <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
//               <div className="text-sm text-slate-600">Active Users</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-3 sm:p-4 text-center">
//               <UserX className="h-6 w-6 mx-auto mb-2 text-red-600" />
//               <div className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</div>
//               <div className="text-sm text-slate-600">Inactive Users</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-3 sm:p-4 text-center">
//               <Building className="h-6 w-6 mx-auto mb-2 text-purple-600" />
//               <div className="text-2xl font-bold text-purple-600">{stats.totalDepartments}</div>
//               <div className="text-sm text-slate-600">Departments</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Controls */}
//         <Card className="mb-6">
//           <CardContent className="p-4">
//             <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-center justify-between">
//               <div className="flex gap-4 items-stretch sm:items-center flex-1">
//                 <div className="flex-1 min-w-0">
//                   <Label className="text-sm font-medium">Search Users</Label>
//                   <Input
//                     placeholder="Search by name or email..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full sm:w-64"
//                   />
//                 </div>
//                 <div className="w-full sm:w-auto">
//                   <Label className="text-sm font-medium">Filter by Role</Label>
//                   <Select value={filterRole} onValueChange={setFilterRole}>
//                     <SelectTrigger className="w-full sm:w-40">
//                       <SelectValue placeholder="All Roles" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Roles</SelectItem>
//                       <SelectItem value="CA">Career Associate</SelectItem>
//                       <SelectItem value="Junior CA">Junior Career Associate</SelectItem>
//                       <SelectItem value="Team Lead">Team Lead</SelectItem>
//                       <SelectItem value="CRO">CRO</SelectItem>
//                       <SelectItem value="COO">COO</SelectItem>
//                       <SelectItem value="CEO">CEO</SelectItem>
//                       <SelectItem value="Admin">System Admin</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="w-full sm:w-auto">
//                   <Label className="text-sm font-medium">Filter by Status</Label>
//                   <Select value={filterStatus} onValueChange={setFilterStatus}>
//                     <SelectTrigger className="w-full sm:w-40">
//                       <SelectValue placeholder="All Status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Status</SelectItem>
//                       <SelectItem value="Active">Active</SelectItem>
//                       <SelectItem value="Inactive">Inactive</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
//                 <DialogTrigger asChild>
//                   <Button className="w-full sm:w-auto">
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add New User
//                   </Button>
//                 </DialogTrigger>
//                 <DialogContent className="sm:max-w-[520px] w-[95vw] p-4">
//                   <DialogHeader>
//                     <DialogTitle>Add New User</DialogTitle>
//                   </DialogHeader>

//                   <form onSubmit={handleAddUser} className="space-y-4">
//                     <div>
//                       <Label htmlFor="name">Full Name</Label>
//                       <Input
//                         id="name"
//                         value={formData.name}
//                         onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
//                         placeholder="Enter full name"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <Label htmlFor="email">Email Address</Label>
//                       <Input
//                         id="email"
//                         type="email"
//                         value={formData.email}
//                         onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
//                         placeholder="Enter email address"
//                         required
//                       />
//                     </div>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <Label htmlFor="role">Role</Label>
//                         <Select
//                           value={formData.role}
//                           onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select role" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="CA">Career Associate</SelectItem>
//                             <SelectItem value="Junior CA">Junior Career Associate</SelectItem>
//                             <SelectItem value="Team Lead">Team Lead</SelectItem>
//                             <SelectItem value="CRO">CRO</SelectItem>
//                             <SelectItem value="COO">COO</SelectItem>
//                             <SelectItem value="CEO">CEO</SelectItem>
//                             <SelectItem value="Admin">System Admin</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                       <div>
//                         <Label htmlFor="department">Department</Label>
//                         <Select
//                           value={formData.department}
//                           onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select department" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="Client Operations">Client Operations</SelectItem>
//                             <SelectItem value="Executive">Executive</SelectItem>
//                             <SelectItem value="HR">Human Resources</SelectItem>
//                             <SelectItem value="IT">Information Technology</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>
//                     <div>
//                       {(formData.role === "CA" || formData.role === "Junior CA") && (
//                         <div>
//                           <Label htmlFor="team-lead">Assign to Team Lead</Label>
//                           <Select
//                             value={selectedTeamId || ""}
//                             onValueChange={(value) => setSelectedTeamId(value)}
//                           >
//                             <SelectTrigger className="w-full">
//                               <SelectValue placeholder="Select Team Lead" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               {teams.map((team) => (
//                                 <SelectItem key={team.id} value={team.id}>
//                                   {team.lead?.name ? `${team.lead.name}${team.name ? ` (${team.name})` : ""}` : (team.name || "Unnamed Team")}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                         </div>
//                       )}

//                       <div className="space-y-2 mt-4">
//                         <Label htmlFor="status">Status</Label>
//                         <Select
//                           value={formData.isactive ? "Active" : "Inactive"}
//                           onValueChange={(value) =>
//                             setFormData((prev) => ({ ...prev, isactive: value === "Active" }))
//                           }
//                         >
//                           <SelectTrigger>
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="Active">Active</SelectItem>
//                             <SelectItem value="Inactive">Inactive</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>
//                     <div className="flex flex-col sm:flex-row gap-2">
//                       <Button type="submit" className="w-full sm:flex-1" disabled={submitting}>
//                         {submitting ? "Adding user..." : "Add User"}
//                       </Button>

//                       <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)} className="w-full sm:w-auto">
//                         Cancel
//                       </Button>
//                     </div>
//                   </form>
//                 </DialogContent>
//               </Dialog>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Users Table */}
//         <Card>
//           <CardHeader>
//             <CardTitle>User Management ({filteredUsers.length} users)</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <div>Loading users...</div>
//             ) : filteredUsers.length === 0 ? (
//               <div className="text-center text-sm text-slate-600 py-8">No users match your filters.</div>
//             ) : (
//               <div className="overflow-x-auto -mx-3 sm:mx-0">
//                 <Table className="min-w-[720px] sm:min-w-0">
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Name</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>Role</TableHead>
//                       <TableHead className="hidden md:table-cell">Department</TableHead>
//                       <TableHead>Status</TableHead>
//                       <TableHead className="hidden md:table-cell">Created</TableHead>
//                       <TableHead className="hidden lg:table-cell">Last Login</TableHead>
//                       <TableHead>Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredUsers.map((user) => (
//                       <TableRow key={user.id}>
//                         <TableCell className="font-medium">{user.name}</TableCell>
//                         <TableCell>
//                           <div className="flex items-center gap-2">
//                             <Mail className="h-4 w-4 text-slate-400" />
//                             {user.email}
//                           </div>
//                         </TableCell>
//                         <TableCell>
//                           <Badge variant="outline" className="flex items-center gap-1 w-fit text-xs sm:text-sm">
//                             <Shield className="h-3 w-3" />
//                             {user.role}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="hidden md:table-cell">
//                           <div className="flex items-center gap-2">
//                             <Building className="h-4 w-4 text-slate-400" />
//                             {user.department || "N/A"}
//                           </div>
//                         </TableCell>
//                         <TableCell>
//                           <Badge
//                             variant={user.isactive ? "default" : "secondary"}
//                             className={`${user.isactive ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"} text-xs sm:text-sm`}
//                           >
//                             {user.isactive ? "Active" : "Inactive"}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="hidden md:table-cell text-sm text-slate-600">
//                           {user.date_created ? new Date(user.date_created).toLocaleDateString() : "N/A"}
//                         </TableCell>
//                         <TableCell className="hidden lg:table-cell text-sm text-slate-600">
//                           {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
//                         </TableCell>
//                         <TableCell>
//                           <div className="flex items-center gap-2">
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               onClick={() => openEditDialog(user)}
//                               className="h-8 w-8 p-0 sm:h-9 sm:w-9"
//                             >
//                               <Edit className="h-3 w-3" />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               onClick={() => handleToggleStatus(user.id, user.isactive)}
//                               className={`h-8 w-8 p-0 sm:h-9 sm:w-9 ${user.isactive ? "text-red-600" : "text-green-600"}`}
//                             >
//                               {user.isactive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               onClick={() => handleDeleteUser(user.id)}
//                               className="h-8 w-8 p-0 sm:h-9 sm:w-9 text-red-600"
//                             >
//                               <Trash2 className="h-3 w-3" />
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Edit User Dialog */}
//         <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
//           <DialogContent className="sm:max-w-[520px] w-[95vw] p-4">
//             <DialogHeader>
//               <DialogTitle>Edit User</DialogTitle>
//             </DialogHeader>
//             <form onSubmit={handleEditUser} className="space-y-4">
//               <div>
//                 <Label htmlFor="edit-name">Full Name</Label>
//                 <Input
//                   id="edit-name"
//                   value={formData.name}
//                   onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
//                   placeholder="Enter full name"
//                   required
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="edit-email">Email Address</Label>
//                 <Input
//                   id="edit-email"
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
//                   placeholder="Enter email address"
//                   required
//                 />
//               </div>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="edit-role">Role</Label>
//                   <Select
//                     value={formData.role}
//                     onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select role" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="CA">Career Associate</SelectItem>
//                       <SelectItem value="Junior CA">Junior Career Associate</SelectItem>
//                       <SelectItem value="Team Lead">Team Lead</SelectItem>
//                       <SelectItem value="CRO">CRO</SelectItem>
//                       <SelectItem value="COO">COO</SelectItem>
//                       <SelectItem value="CEO">CEO</SelectItem>
//                       <SelectItem value="Admin">System Admin</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label htmlFor="edit-department">Department</Label>
//                   <Select
//                     value={formData.department}
//                     onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select department" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Client Operations">Client Operations</SelectItem>
//                       <SelectItem value="Executive">Executive</SelectItem>
//                       <SelectItem value="HR">Human Resources</SelectItem>
//                       <SelectItem value="IT">Information Technology</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="edit-status">Status</Label>
//                 <Select
//                   value={formData.isactive ? "Active" : "Inactive"}
//                   onValueChange={(value) => setFormData((prev) => ({ ...prev, isactive: value === "Active" }))}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="Active">Active</SelectItem>
//                     <SelectItem value="Inactive">Inactive</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="flex flex-col sm:flex-row gap-2">
//                 <Button type="submit" className="w-full sm:flex-1">
//                   Update User
//                 </Button>
//                 <Button type="button" variant="outline" onClick={() => setEditUserOpen(false)} className="w-full sm:w-auto">
//                   Cancel
//                 </Button>
//               </div>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </div>
//   );
// }
