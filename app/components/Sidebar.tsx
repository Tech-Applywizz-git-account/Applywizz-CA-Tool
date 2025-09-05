//app/components/Sidebar.tsx

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils" // if you don’t have this, replace cn(...) with a template string
import { LayoutDashboard, Users } from "lucide-react"

type SidebarProps = {
  basePath: "/cro-dashboard" | "/ceo-dashboard" | "/coo-dashboard" | "/cpo-dashboard"
}

export default function Sidebar({ basePath }: SidebarProps) {
  const pathname = usePathname()
  const links = [
    { href: `${basePath}`, label: "My Dashboard", icon: LayoutDashboard },
    { href: `${basePath}/clients`, label: "Clients Information", icon: Users },
  ]

  return (
    <aside className="w-64 shrink-0 border-r bg-white/70 backdrop-blur">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Navigation</h2>
      </div>
      <nav className="px-2 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
