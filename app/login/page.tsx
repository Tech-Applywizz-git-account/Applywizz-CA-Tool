"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 👇 ADD these two lines after: const [showPassword, setShowPassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState("")


  const router = useRouter()

  // Auto-redirect if already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("loggedInUser")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      redirectByRole(user)
    }
  }, [])

  // 👇 ADD: keep the resetEmail synced with login email
  useEffect(() => {
    setResetEmail(email)
  }, [email])


  // Role-based redirect function
  const redirectByRole = (user: any) => {
    const role = user.designation || user.role

    switch (role) {
      case "CEO":
        router.push("/ceo-dashboard")
        break
      case "COO":
        router.push("/coo-dashboard")
        break
      case "CRO":
        router.push("/cro-dashboard")
        break
      case "Team Lead":
        router.push("/team-lead-dashboard")
        break
      case "Admin":
      case "SYSTEM":
        router.push("/system-admin-dashboard")
        break
      case "CA":
      case "Junior CA":
        router.push("/ca-dashboard")
        break
      default:
        alert("Unknown role. Cannot redirect.")
        localStorage.removeItem("loggedInUser")
        router.push("/login")
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1) Authenticate against Supabase Auth using the email + typed password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      alert(authError.message || "Invalid email or password.")
      setLoading(false)
      return
    }

    // 2) Fetch your profile from public.users (to get role/designation/team_id)
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email)
      .single()

    if (error || !user) {
      alert("User profile not found. Please contact admin.")
      setLoading(false)
      return
    }

    // 3) Store and redirect by role
    localStorage.setItem("loggedInUser", JSON.stringify(user))
    redirectByRole(user)
    setLoading(false)
  }

  // 👇 ADD: send password reset email via Supabase

  const sendResetEmail = async () => {
    const candidate = resetEmail.trim()
    if (!candidate) {
      alert("Please enter your email.")
      return
    }

    try {
      setLoading(true)

      // 1) Check existence in public.users (case-insensitive exact match)
      const { data: existingUser, error: findErr } = await supabase
        .from("users")
        .select("id")
        .ilike("email", candidate)  // case-insensitive exact match
        .maybeSingle()

      if (findErr) {
        alert(findErr.message || "Could not verify email. Please try again.")
        return
      }
      if (!existingUser) {
        alert("No account found with this email.")
        return
      }

      // 2) Send reset email that lands on /reset-password
      const redirectTo = `${window.location.origin}/reset-password` // allow this in Supabase Auth > URL Configuration
      const { error } = await supabase.auth.resetPasswordForEmail(candidate, { redirectTo })
      if (error) {
        alert(error.message)
        return
      }

      alert("Password reset email sent. Please check your inbox.")
      setShowReset(false)
    } catch (e: any) {
      alert(e?.message || "Something went wrong sending the reset email.")
    } finally {
      setLoading(false)
    }
  }



  return (
    // <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md"> */}
      <div className="bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-xl p-8 w-full max-w-md">
        {/* <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">ApplyWizz</h1>
        <p className="text-center text-gray-600 mb-6">Career Associate Management Platform</p> */}
        <header className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white grid place-items-center">
            <Image src="/apply_wizz_logo.jpg" alt="ApplyWizz" width={28} height={28} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">ApplyWizz</h1>
            <p className="text-sm text-slate-500">Career Associate Management Platform</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-sm text-blue-600 hover:text-blue-700 cursor-pointer select-none"
              >
                {showPassword ? "Hide" : "Show"}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
          <div className="flex items-center justify-end text-sm">
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setShowReset(true)}
            >
              Forgot password?
            </button>
          </div>
          {/* 👇 ADD: Minimal reset modal */}
          {showReset && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                <h2 className="text-lg font-semibold mb-2">Reset your password</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your account email. We’ll send you a reset link.
                </p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full border rounded p-2 mb-4"
                  placeholder="you@example.com"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowReset(false)}
                    className="px-3 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendResetEmail}
                    className="px-3 py-2 rounded bg-blue-600 text-white"
                  >
                    Send link
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
