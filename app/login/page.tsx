"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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

    localStorage.setItem("loggedInUser", JSON.stringify(user))

    // Navigate to dashboard (you can make this dynamic later)
    router.push("/")
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
