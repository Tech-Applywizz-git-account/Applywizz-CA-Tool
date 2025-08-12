//app/api/login/page

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

type AppUser = {
  id: string
  email: string
  name?: string | null
  role?: string | null
  designation?: string | null
  team_id?: string | null
  department?: string | null
  isactive?: boolean | null
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // If we already have a valid Supabase session, fetch profile and redirect
    const checkSession = async () => {
      const { data: sessionRes } = await supabase.auth.getSession()
      if (!sessionRes.session) return

      // Use the authed email to look up profile in public.users
      const userEmail = sessionRes.session.user.email
      if (!userEmail) return

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", userEmail)
        .maybeSingle()

      if (error || !user) return
      redirectByRole(user as AppUser)
    }

    checkSession()
    // Also react to session changes while this page is mounted
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      // optional: could re-check session here if needed
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const redirectByRole = (user: AppUser) => {
    const role = user.designation || user.role
    switch (role) {
      case "CEO":
        router.push("/ceo-dashboard"); break
      case "COO":
        router.push("/coo-dashboard"); break
      case "CRO":
        router.push("/cro-dashboard"); break
      case "Team Lead":
        router.push("/team-lead-dashboard"); break
      case "Admin":
        router.push("/system-admin-dashboard"); break
      case "CA":
      case "Junior CA":
        router.push("/ca-dashboard"); break
      default:
        alert("Unknown role/designation. Please contact an admin.")
    }
  }

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setLoading(true)

  //   // 1) Real Supabase sign-in (no hardcoded password)
  //   const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  //   if (error || !data.session) {
  //     setLoading(false)
  //     alert(error?.message || "Invalid email or password.")
  //     return
  //   }

  //   // 2) Fetch profile row from public.users (source of truth for role/team)
  //   const { data: profile, error: profileErr } = await supabase
  //     .from("users")
  //     .select("*")
  //     .eq("email", email)
  //     .maybeSingle()

  //   setLoading(false)

  //   if (profileErr || !profile) {
  //     // Optional: sign out if we can’t map to a profile row
  //     await supabase.auth.signOut()
  //     alert("No matching user profile found. Please contact an admin.")
  //     return
  //   }

  //   // 3) Role-based redirect
  //   redirectByRole(profile as AppUser)
  // }

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
      .eq("email", email)
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
              placeholder="you@applywizz.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded p-2 pr-12"
                required
                autoComplete="current-password"
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
          <p className="mb-2">
            New user? Please use the invite link from your email to set your password first.
          </p>
        </div>
      </div>
    </div>
  )
}
