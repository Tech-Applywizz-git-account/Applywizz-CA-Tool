// "use client"

// import { useEffect, useState } from "react"
// import { useSearchParams, useRouter } from "next/navigation"
// import { supabase } from "@/lib/supabaseClient"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"

// export default function ResetPasswordPage() {
//     const router = useRouter()
//     const searchParams = useSearchParams()
//     const access_token = searchParams.get("access_token")

//     const [email, setEmail] = useState("")
//     const [password, setPassword] = useState("")
//     const [confirmPassword, setConfirmPassword] = useState("")
//     const [loading, setLoading] = useState(false)
//     const [error, setError] = useState("")

//     useEffect(() => {
//         // Fetch user email using token
//         const fetchUser = async () => {
//             if (!access_token) return
//             const { data, error } = await supabase.auth.getUser(access_token)
//             if (error) {
//                 setError(error.message)
//                 return
//             }
//             setEmail(data.user?.email || "")
//         }
//         fetchUser()
//     }, [access_token])

//     //   const handleReset = async () => {
//     //     setError("")
//     //     if (!password || password !== confirmPassword) {
//     //       setError("Passwords do not match")
//     //       return
//     //     }
//     //     setLoading(true)

//     //     // Set new password
//     //     const { error: updateError } = await supabase.auth.updateUser(
//     //       { password },
//     //       { accessToken: access_token || undefined }
//     //     )

//     //     if (updateError) {
//     //       setError(updateError.message)
//     //       setLoading(false)
//     //       return
//     //     }

//     //     // Insert user in public.users table if not already present
//     //     await supabase.from("users").upsert({
//     //       email,
//     //       name: email.split("@")[0],
//     //       role: "CA", // default role, change as per your logic
//     //       department: "Client Operations",
//     //       isactive: true,
//     //       date_created: new Date().toISOString(),
//     //       last_login: new Date().toISOString()
//     //     }, { onConflict: "email" })

//     //     setLoading(false)
//     //     alert("Password reset successfully. You can now login.")
//     //     router.push("/") // redirect to login page
//     //   }

//     const handleReset = async () => {
//         setError("")
//         if (!password || password !== confirmPassword) {
//             setError("Passwords do not match")
//             return
//         }
//         setLoading(true)

//         // Use the invite access token to sign in first
//         const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
//             access_token: access_token!,
//             refresh_token: "" // may be empty
//         })

//         if (sessionError) {
//             setError(sessionError.message)
//             setLoading(false)
//             return
//         }

//         // Now update password for current user
//         const { error: updateError } = await supabase.auth.updateUser({ password })
//         if (updateError) {
//             setError(updateError.message)
//             setLoading(false)
//             return
//         }

//         // Insert user into your custom users table
//         await supabase.from("users").upsert({
//             email,
//             name: email.split("@")[0],
//             role: "CA",
//             department: "Client Operations",
//             isactive: true,
//             date_created: new Date().toISOString(),
//             last_login: new Date().toISOString()
//         }, { onConflict: "email" })

//         setLoading(false)
//         alert("Password reset successfully. You can now login.")
//         router.push("/")
//     }

//     return (
//         <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4">
//             <div className="max-w-md w-full bg-white shadow rounded p-6">
//                 <h1 className="text-xl font-bold mb-4">Set New Password</h1>
//                 {email && <p className="mb-2 text-slate-600">For user: <b>{email}</b></p>}
//                 <Input
//                     type="password"
//                     placeholder="New password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="mb-2"
//                 />
//                 <Input
//                     type="password"
//                     placeholder="Confirm password"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     className="mb-4"
//                 />
//                 {error && <p className="text-red-600 mb-2">{error}</p>}
//                 <Button onClick={handleReset} disabled={loading}>
//                     {loading ? "Updating..." : "Set Password"}
//                 </Button>
//             </div>
//         </div>
//     )
// }

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ResetPasswordPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const extractTokensFromHash = () => {
      const hash = window.location.hash.substring(1) // remove the '#' character
      const params = new URLSearchParams(hash)
      return {
        access_token: params.get("access_token"),
        refresh_token: params.get("refresh_token")
      }
    }

    const initSession = async () => {
      const { access_token, refresh_token } = extractTokensFromHash()
      if (!access_token || !refresh_token) {
        setError("Auth session missing!")
        return
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token
      })

      if (sessionError) {
        setError(sessionError.message)
        return
      }

      const { data, error: userError } = await supabase.auth.getUser()
      if (userError) {
        setError(userError.message)
        return
      }

      setEmail(data.user?.email || "")
    }

    initSession()
  }, [])

  const handleReset = async () => {
    setError("")
    if (!password || password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // if (email) {
    //   const { error: insertError } = await supabase.from("users").upsert({
    //     email,
    //     name: email.split("@")[0],
    //     role: "CA",
    //     department: "Client Operations",
    //     isactive: true,
    //     created_at: new Date().toISOString(),
    //     designation: "CA",
    //     base_salary: null,
    //     work_log: null,
    //   }, { onConflict: "email" })

    //   if (insertError) {
    //     setError(`User insert failed: ${insertError.message}`)
    //     setLoading(false)
    //     return
    //   }
    // }

    setLoading(false)
    alert("Password reset successfully!")
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white shadow rounded p-6">
        <h1 className="text-xl font-bold mb-4">Set New Password</h1>
        {email && <p className="mb-2 text-slate-600">For user: <b>{email}</b></p>}
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2"
        />
        <Input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mb-4"
        />
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <Button onClick={handleReset} disabled={loading}>
          {loading ? "Updating..." : "Set Password"}
        </Button>
      </div>
    </div>
  )
}
