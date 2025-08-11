// //app/reset-password/page.tsx

// "use client"

// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import { supabase } from "@/lib/supabaseClient"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"

// export default function ResetPasswordPage() {
//   const router = useRouter()

//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [confirmPassword, setConfirmPassword] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState("")

//   useEffect(() => {
//     const extractTokensFromHash = () => {
//       const hash = window.location.hash.substring(1) // remove the '#' character
//       const params = new URLSearchParams(hash)
//       return {
//         access_token: params.get("access_token"),
//         refresh_token: params.get("refresh_token")
//       }
//     }

//     const initSession = async () => {
//       const { access_token, refresh_token } = extractTokensFromHash()
//       if (!access_token || !refresh_token) {
//         setError("Auth session missing!")
//         return
//       }

//       const { error: sessionError } = await supabase.auth.setSession({
//         access_token,
//         refresh_token
//       })

//       if (sessionError) {
//         setError(sessionError.message)
//         return
//       }

//       const { data, error: userError } = await supabase.auth.getUser()
//       if (userError) {
//         setError(userError.message)
//         return
//       }

//       setEmail(data.user?.email || "")
//     }

//     initSession()
//   }, [])

//   const handleReset = async () => {
//     setError("")
//     if (!password || password !== confirmPassword) {
//       setError("Passwords do not match")
//       return
//     }
//     setLoading(true)

//     const { error: updateError } = await supabase.auth.updateUser({ password })
//     if (updateError) {
//       setError(updateError.message)
//       setLoading(false)
//       return
//     }
//     setLoading(false)
//     alert("Password reset successfully!")
//     router.push("/login")
//   }

//   return (
//     <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4">
//       <div className="max-w-md w-full bg-white shadow rounded p-6">
//         <h1 className="text-xl font-bold mb-4">Set New Password</h1>
//         {email && <p className="mb-2 text-slate-600">For user: <b>{email}</b></p>}
//         <Input
//           type="password"
//           placeholder="New password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="mb-2"
//         />
//         <Input
//           type="password"
//           placeholder="Confirm password"
//           value={confirmPassword}
//           onChange={(e) => setConfirmPassword(e.target.value)}
//           className="mb-4"
//         />
//         {error && <p className="text-red-600 mb-2">{error}</p>}
//         <Button onClick={handleReset} disabled={loading}>
//           {loading ? "Updating..." : "Set Password"}
//         </Button>
//       </div>
//     </div>
//   )
// }

// app/reset-password/page.tsx
// app/reset-password/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const [sessionReady, setSessionReady] = useState<"pending" | "ok" | "missing">("pending");

  // Password checks
  const hasMinLen = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  const allValid = useMemo(
    () => hasMinLen && hasUpper && hasLower && hasDigit && hasSpecial,
    [hasMinLen, hasUpper, hasLower, hasDigit, hasSpecial]
  );

  useEffect(() => {
    const extractTokensFromHash = () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      return {
        access_token: params.get("access_token"),
        refresh_token: params.get("refresh_token"),
      };
    };

    const initSession = async () => {
      try {
        setLoading(true);
        setError("");

        const { access_token, refresh_token } = extractTokensFromHash();
        if (!access_token || !refresh_token) {
          setSessionReady("missing");
          return;
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) {
          setError(sessionError.message);
          setSessionReady("missing");
          return;
        }

        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) {
          setError(userError.message);
          setSessionReady("missing");
          return;
        }

        setEmail(data.user?.email || "");
        setSessionReady("ok");
      } catch (e: any) {
        setError(e?.message || "Failed to initialize session");
        setSessionReady("missing");
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const handleReset = async () => {
    try {
      setError("");
      if (!allValid) {
        setError("Please meet all password requirements.");
        return;
      }

      setLoading(true);

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setDialogTitle("✅ Password Updated");
      setDialogMessage("Your password was successfully reset. Redirecting to login…");
      setDialogOpen(true);

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (e: any) {
      setDialogTitle("❌ Update Failed");
      setDialogMessage(e?.message || "Failed to update password");
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading && sessionReady === "pending") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Preparing Reset...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">Please wait while we validate your reset link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionReady === "missing") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-red-600 text-xl">
              Reset Link Invalid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-center">
              This reset link is missing or invalid. Please request a new password reset from the login page.
            </p>
            {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" onClick={() => router.push("/login")} disabled={loading}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-green-600 text-xl">
            Applywizz CA Management
          </CardTitle>
          <CardTitle className="text-center text-blue-600 text-xl">
            Reset Password
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            {email ? (
              <>
                <p>Your Mail:</p>
                <p className="mt-1 font-medium">{email}</p>
              </>
            ) : (
              <p className="text-sm">Your account email will appear here once validated.</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password (min 6 characters)"
                className="pr-16"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error ? <p className="text-red-600 text-sm">{error}</p> : null}

            <Button
              className="w-full mt-4"
              onClick={handleReset}
              disabled={loading || !allValid}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>

            <p className="text-xs text-gray-500 mt-2">
              Password must contain:
              <ul className="list-disc list-inside space-y-0.5 mt-1">
                <li className={hasMinLen ? "text-green-600" : ""}>At least 6 characters</li>
                <li className={hasUpper ? "text-green-600" : ""}>One uppercase letter (A–Z)</li>
                <li className={hasLower ? "text-green-600" : ""}>One lowercase letter (a–z)</li>
                <li className={hasDigit ? "text-green-600" : ""}>One number (0–9)</li>
                <li className={hasSpecial ? "text-green-600" : ""}>
                  One special character (!@#$%^&*)
                </li>
              </ul>
            </p>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600">{dialogMessage}</p>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
