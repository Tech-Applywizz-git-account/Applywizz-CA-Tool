// "use client"

// import type React from "react"

// import { useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"

// const demoCredentials = [
//   { role: "CA", email: "ca1@applywizz.com", password: "password123", name: "Rama Krishna" },
//   { role: "TL", email: "teamlead1@applywizz.com", password: "password123", name: "Team Lead" },
//   { role: "CRO", email: "cro@applywizz.com", password: "password123", name: "CRO" },
//   { role: "COO", email: "coo@applywizz.com", password: "password123", name: "COO" },
//   { role: "CEO", email: "ceo@applywizz.com", password: "password123", name: "CEO" },
//   { role: "SYSTEM", email: "admin@applywizz.com", password: "admin123", name: "System Admin" },
// ]

// interface LoginPageProps {
//   onLogin: (user: any) => void
// }

// const LoginPage = ({ onLogin }: LoginPageProps) => {
//   const [email, setEmail] = useState("ca1@applywizz.com")
//   const [password, setPassword] = useState("password123")

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     const user = demoCredentials.find((cred) => cred.email === email && cred.password === password)
//     if (user) {
//       onLogin(user)
//     } else {
//       alert("Invalid credentials")
//     }
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <CardTitle className="text-2xl font-bold text-blue-600">ApplyWizz</CardTitle>
//           <p className="text-slate-600">Career Associate Management Platform</p>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="bg-blue-50"
//                 required
//               />
//             </div>
//             <div>
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="bg-blue-50"
//                 required
//               />
//             </div>
//             <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
//               Sign In
//             </Button>
//           </form>

//           <div className="mt-6">
//             <p className="text-sm font-medium text-slate-700 mb-2">Demo Credentials:</p>
//             <div className="space-y-1 text-xs text-slate-600">
//               <p>
//                 <strong>CA:</strong> ca1@applywizz.com / password123
//               </p>
//               <p>
//                 <strong>Team Lead:</strong> teamlead1@applywizz.com / password123
//               </p>
//               <p>
//                 <strong>CRO:</strong> cro@applywizz.com / password123
//               </p>
//               <p>
//                 <strong>COO:</strong> coo@applywizz.com / password123
//               </p>
//               <p>
//                 <strong>CEO:</strong> ceo@applywizz.com / password123
//               </p>
//               <p>
//                 <strong>System Admin:</strong> admin@applywizz.com / admin123
//               </p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// export default LoginPage
// export { LoginPage }


"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

interface LoginPageProps {
  onLogin: (user: any) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // <-- Added

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Check static demo password
    // if (password !== "created@123") {
    //   alert("Invalid password. Use created@123 for demo login.")
    //   setLoading(false)
    //   return
    // }

    // Fetch user from Supabase users table
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (error || !user) {
      alert("User not found. Please use a valid demo email.")
      setLoading(false)
      return
    }

    // Save user to localStorage for session persistence
    localStorage.setItem("loggedInUser", JSON.stringify(user))

    // Trigger parent onLogin to update state
    onLogin(user)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">ApplyWizz</h1>
        <p className="text-center text-gray-600 mb-6">Career Associate Management Platform</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="created@123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded p-2 pr-12"
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-sm text-blue-600 cursor-pointer select-none"
              >
                {showPassword ? "Hide" : "Show"}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500">
          <p className="font-semibold mb-1">Demo Credentials:</p>
          <p>CA: ca1@applywizz.com / created@123</p>
          <p>Team Lead: teamlead1@applywizz.com / created@123</p>
          <p>CRO: cro@applywizz.com / created@123</p>
          <p>COO: coo@applywizz.com / created@123</p>
          <p>CEO: ceo@applywizz.com / created@123</p>
          <p>Admin: admin@applywizz.com / created@123</p>
        </div>
      </div>
    </div>
  )
}
