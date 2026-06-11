"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Settings, 
  BarChart3, 
  LogOut, 
  ArrowLeft,
  User,
  ShieldAlert,
  Loader2,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AssignmentShellProps = {
  children: React.ReactNode;
};

export default function AssignmentShell({ children }: AssignmentShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const role = parsedUser.designation || parsedUser.role;
      const allowedRoles = ["CEO", "COO", "CRO", "CPO", "Team Lead", "Admin", "SYSTEM"];
      
      if (!allowedRoles.includes(role)) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setUser(parsedUser);
      setAuthorized(true);
    } catch (err) {
      console.error("Auth check error:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    router.push("/login");
  };

  // Resolve back URL based on user role
  const getBackDashboardUrl = () => {
    if (!user) return "/login";
    const role = user.designation || user.role;
    switch (role) {
      case "CEO": return "/ceo-dashboard";
      case "COO": return "/coo-dashboard";
      case "CRO": return "/cro-dashboard";
      case "CPO": return "/cpo-dashboard";
      case "Team Lead": return "/team-lead-dashboard";
      case "Admin":
      case "SYSTEM": return "/system-admin-dashboard";
      default: return "/login";
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assignments", label: "Assignments", icon: ClipboardList },
    { href: "/admin/capacity", label: "Capacity Management", icon: Settings },
    { href: "/analytics", label: "Analytics", icon: BarChart3 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-900 dark:text-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400 mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Authenticating user...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xl">
          <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access Denied</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            You do not have administrative privileges to access the Career Associate Auto Assignment Dashboard.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200">
      {/* Sidebar navigation */}
      <aside className="w-64 shrink-0 bg-white dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800/80 backdrop-blur sticky top-0 h-screen flex flex-col shadow-sm dark:shadow-none">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Image src="/apply_wizz_logo.jpg" alt="ApplyWizz" width={22} height={22} className="rounded-md" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">CA Assign</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Auto Engine</p>
          </div>
        </div>

        {navLinks.length > 0 && (
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-transform duration-200", active ? "text-indigo-500 dark:text-indigo-400 scale-110" : "text-slate-400 dark:text-slate-500")} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          {/* Back button */}
          <Link href={getBackDashboardUrl()} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200 transition">
            <ArrowLeft className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span>Main Dashboard</span>
          </Link>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-300 transition text-left"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400 dark:text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/40 backdrop-blur px-8 flex justify-between items-center sticky top-0 z-30 shadow-sm dark:shadow-none">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {(pathname.split("/")[1] || "dashboard").toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
                  isDark
                    ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                    : "bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200"
                )}
                aria-label="Toggle theme"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            )}

            {/* User info */}
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.name}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{user?.designation || user?.role}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <User className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
        </header>

        {/* View body */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
