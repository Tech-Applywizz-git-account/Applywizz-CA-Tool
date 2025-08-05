// "use client"

// import type React from "react"

// import { useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Plus, Edit, Trash2, UserCheck, UserX, Users, Shield, Building, Mail } from "lucide-react"

// interface SystemAdminDashboardProps {
//   user: any
//   onLogout: () => void
// }

// // Mock users data
// const initialUsers = [
//   {
//     id: "1",
//     name: "Rama Krishna",
//     email: "ca1@applywizz.com",
//     role: "CA",
//     department: "Operations",
//     status: "Active",
//     dateCreated: "2024-01-15",
//     lastLogin: "2024-01-29",
//   },
//   {
//     id: "2",
//     name: "Team Lead North",
//     email: "teamlead1@applywizz.com",
//     role: "TL",
//     department: "Operations",
//     status: "Active",
//     dateCreated: "2024-01-10",
//     lastLogin: "2024-01-29",
//   },
//   {
//     id: "3",
//     name: "CRO Manager",
//     email: "cro@applywizz.com",
//     role: "CRO",
//     department: "Management",
//     status: "Active",
//     dateCreated: "2024-01-05",
//     lastLogin: "2024-01-28",
//   },
//   {
//     id: "4",
//     name: "COO Executive",
//     email: "coo@applywizz.com",
//     role: "COO",
//     department: "Management",
//     status: "Active",
//     dateCreated: "2024-01-01",
//     lastLogin: "2024-01-29",
//   },
//   {
//     id: "5",
//     name: "CEO Director",
//     email: "ceo@applywizz.com",
//     role: "CEO",
//     department: "Executive",
//     status: "Active",
//     dateCreated: "2024-01-01",
//     lastLogin: "2024-01-29",
//   },
//   {
//     id: "6",
//     name: "Priya Sharma",
//     email: "priya@applywizz.com",
//     role: "CA",
//     department: "Operations",
//     status: "Inactive",
//     dateCreated: "2024-01-20",
//     lastLogin: "2024-01-25",
//   },
// ]

// export function SystemAdminDashboard({ user, onLogout }: SystemAdminDashboardProps) {
//   const [users, setUsers] = useState(initialUsers)
//   const [addUserOpen, setAddUserOpen] = useState(false)
//   const [editUserOpen, setEditUserOpen] = useState(false)
//   const [selectedUser, setSelectedUser] = useState(null)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [filterRole, setFilterRole] = useState("all")
//   const [filterStatus, setFilterStatus] = useState("all")

//   // Form state for adding/editing users
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     role: "",
//     department: "",
//     status: "Active",
//   })

//   const resetForm = () => {
//     setFormData({
//       name: "",
//       email: "",
//       role: "",
//       department: "",
//       status: "Active",
//     })
//   }

//   const handleAddUser = (e: React.FormEvent) => {
//     e.preventDefault()
//     const newUser = {
//       id: Date.now().toString(),
//       ...formData,
//       dateCreated: new Date().toISOString().split("T")[0],
//       lastLogin: "Never",
//     }
//     setUsers((prev) => [...prev, newUser])
//     setAddUserOpen(false)
//     resetForm()
//   }

//   const handleEditUser = (e: React.FormEvent) => {
//     e.preventDefault()
//     setUsers((prev) =>
//       prev.map((u) =>
//         u.id === selectedUser?.id
//           ? {
//               ...u,
//               ...formData,
//             }
//           : u,
//       ),
//     )
//     setEditUserOpen(false)
//     setSelectedUser(null)
//     resetForm()
//   }

//   const handleDeleteUser = (userId: string) => {
//     if (window.confirm("Are you sure you want to delete this user?")) {
//       setUsers((prev) => prev.filter((u) => u.id !== userId))
//     }
//   }

//   const handleToggleStatus = (userId: string) => {
//     setUsers((prev) =>
//       prev.map((u) => (u.id === userId ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u)),
//     )
//   }

//   const openEditDialog = (user: any) => {
//     setSelectedUser(user)
//     setFormData({
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       department: user.department,
//       status: user.status,
//     })
//     setEditUserOpen(true)
//   }

//   // Filter users based on search and filters
//   const filteredUsers = users.filter((user) => {
//     const matchesSearch =
//       user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       user.email.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesRole = filterRole === "all" || user.role === filterRole
//     const matchesStatus = filterStatus === "all" || user.status === filterStatus
//     return matchesSearch && matchesRole && matchesStatus
//   })

//   // Calculate statistics
//   const stats = {
//     totalUsers: users.length,
//     activeUsers: users.filter((u) => u.status === "Active").length,
//     inactiveUsers: users.filter((u) => u.status === "Inactive").length,
//     totalDepartments: [...new Set(users.map((u) => u.department))].length,
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-900">System Admin Dashboard</h1>
//             <p className="text-slate-600">User Management & System Administration</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button variant="outline">Profile</Button>
//             <Button onClick={onLogout}>Logout</Button>
//           </div>
//         </div>

//         {/* Statistics Cards */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//           <Card>
//             <CardContent className="p-4 text-center">
//               <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
//               <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
//               <div className="text-sm text-slate-600">Total Users</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
//               <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
//               <div className="text-sm text-slate-600">Active Users</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <UserX className="h-6 w-6 mx-auto mb-2 text-red-600" />
//               <div className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</div>
//               <div className="text-sm text-slate-600">Inactive Users</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4 text-center">
//               <Building className="h-6 w-6 mx-auto mb-2 text-purple-600" />
//               <div className="text-2xl font-bold text-purple-600">{stats.totalDepartments}</div>
//               <div className="text-sm text-slate-600">Departments</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Controls */}
//         <Card className="mb-6">
//           <CardContent className="p-4">
//             <div className="flex flex-wrap gap-4 items-center justify-between">
//               <div className="flex gap-4 items-center">
//                 <div>
//                   <Label className="text-sm font-medium">Search Users</Label>
//                   <Input
//                     placeholder="Search by name or email..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-64"
//                   />
//                 </div>
//                 <div>
//                   <Label className="text-sm font-medium">Filter by Role</Label>
//                   <Select value={filterRole} onValueChange={setFilterRole}>
//                     <SelectTrigger className="w-32">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Roles</SelectItem>
//                       <SelectItem value="CA">CA</SelectItem>
//                       <SelectItem value="TL">Team Lead</SelectItem>
//                       <SelectItem value="CRO">CRO</SelectItem>
//                       <SelectItem value="COO">COO</SelectItem>
//                       <SelectItem value="CEO">CEO</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label className="text-sm font-medium">Filter by Status</Label>
//                   <Select value={filterStatus} onValueChange={setFilterStatus}>
//                     <SelectTrigger className="w-32">
//                       <SelectValue />
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
//                   <Button>
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add New User
//                   </Button>
//                 </DialogTrigger>
//                 <DialogContent>
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
//                     <div className="grid grid-cols-2 gap-4">
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
//                             <SelectItem value="TL">Team Lead</SelectItem>
//                             <SelectItem value="CRO">CRO</SelectItem>
//                             <SelectItem value="COO">COO</SelectItem>
//                             <SelectItem value="CEO">CEO</SelectItem>
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
//                             <SelectItem value="Operations">Operations</SelectItem>
//                             <SelectItem value="Management">Management</SelectItem>
//                             <SelectItem value="Executive">Executive</SelectItem>
//                             <SelectItem value="HR">Human Resources</SelectItem>
//                             <SelectItem value="IT">Information Technology</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>
//                     <div>
//                       <Label htmlFor="status">Status</Label>
//                       <Select
//                         value={formData.status}
//                         onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
//                       >
//                         <SelectTrigger>
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="Active">Active</SelectItem>
//                           <SelectItem value="Inactive">Inactive</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <div className="flex gap-2">
//                       <Button type="submit" className="flex-1">
//                         Add User
//                       </Button>
//                       <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)}>
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
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Email</TableHead>
//                   <TableHead>Role</TableHead>
//                   <TableHead>Department</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Created</TableHead>
//                   <TableHead>Last Login</TableHead>
//                   <TableHead>Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredUsers.map((user) => (
//                   <TableRow key={user.id}>
//                     <TableCell className="font-medium">{user.name}</TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Mail className="h-4 w-4 text-slate-400" />
//                         {user.email}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant="outline" className="flex items-center gap-1 w-fit">
//                         <Shield className="h-3 w-3" />
//                         {user.role}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Building className="h-4 w-4 text-slate-400" />
//                         {user.department}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <Badge
//                         variant={user.status === "Active" ? "default" : "secondary"}
//                         className={
//                           user.status === "Active"
//                             ? "bg-green-100 text-green-800 border-green-300"
//                             : "bg-red-100 text-red-800 border-red-300"
//                         }
//                       >
//                         {user.status}
//                       </Badge>
//                     </TableCell>
//                     <TableCell className="text-sm text-slate-600">{user.dateCreated}</TableCell>
//                     <TableCell className="text-sm text-slate-600">{user.lastLogin}</TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
//                           <Edit className="h-3 w-3" />
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => handleToggleStatus(user.id)}
//                           className={user.status === "Active" ? "text-red-600" : "text-green-600"}
//                         >
//                           {user.status === "Active" ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => handleDeleteUser(user.id)}
//                           className="text-red-600"
//                         >
//                           <Trash2 className="h-3 w-3" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>

//         {/* Edit User Dialog */}
//         <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
//           <DialogContent>
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
//               <div className="grid grid-cols-2 gap-4">
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
//                       <SelectItem value="TL">Team Lead</SelectItem>
//                       <SelectItem value="CRO">CRO</SelectItem>
//                       <SelectItem value="COO">COO</SelectItem>
//                       <SelectItem value="CEO">CEO</SelectItem>
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
//                       <SelectItem value="Operations">Operations</SelectItem>
//                       <SelectItem value="Management">Management</SelectItem>
//                       <SelectItem value="Executive">Executive</SelectItem>
//                       <SelectItem value="HR">Human Resources</SelectItem>
//                       <SelectItem value="IT">Information Technology</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <div>
//                 <Label htmlFor="edit-status">Status</Label>
//                 <Select
//                   value={formData.status}
//                   onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
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
//               <div className="flex gap-2">
//                 <Button type="submit" className="flex-1">
//                   Update User
//                 </Button>
//                 <Button type="button" variant="outline" onClick={() => setEditUserOpen(false)}>
//                   Cancel
//                 </Button>
//               </div>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </div>
//   )
// }

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
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("users").insert([
      {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        isactive: true,
        date_created: new Date().toISOString(),
        last_login: null,
      },
    ]);
    if (error) alert(`Error adding user: ${error.message}`);
    else {
      fetchUsers();
      setAddUserOpen(false);
      resetForm();
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("users")
      .update({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "Active" && user.isactive) ||
      (filterStatus === "Inactive" && !user.isactive);
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
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">System Admin Dashboard</h1>
            <p className="text-slate-600">User Management & System Administration</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">Profile</Button>
            <Button onClick={onLogout}>Logout</Button>
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
                      <Button type="submit" className="flex-1">
                        Add User
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
      </div>
    </div>
  );
}
