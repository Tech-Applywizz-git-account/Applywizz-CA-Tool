"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, BarChart2, PanelLeftClose, PanelLeftOpen } from "lucide-react"

type SidebarProps = {
  basePath: "/cro-dashboard" | "/ceo-dashboard" | "/coo-dashboard" | "/cpo-dashboard" | "/team-lead-dashboard"
}

const EXEC_PATHS = ["/cro-dashboard", "/ceo-dashboard", "/coo-dashboard", "/team-lead-dashboard"]

export default function Sidebar({ basePath }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const links = [
    { href: `${basePath}`, label: "My Dashboard", icon: LayoutDashboard },
    { href: `${basePath}/clients`, label: "Clients Information", icon: Users },
    ...(EXEC_PATHS.includes(basePath)
      ? [{ href: `${basePath}/reports`, label: "Performance Report", icon: BarChart2 }]
      : []),
  ]

  return (
    <aside 
      className={cn(
        "sticky top-0 h-screen transition-all duration-300 border-r bg-white/70 backdrop-blur flex flex-col",
        isCollapsed ? "w-16 cursor-pointer hover:bg-slate-50" : "w-64"
      )}
      onClick={() => {
        if (isCollapsed) setIsCollapsed(false)
      }}
    >
      <div className={cn(
        "p-4 flex items-center justify-between",
        isCollapsed && "justify-center px-0"
      )}>
        {!isCollapsed && <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide truncate">Navigation</h2>}
        {!isCollapsed ? (
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed(true)
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        ) : (
          <div className="text-slate-400">
             <PanelLeftOpen className="h-5 w-5" />
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (pathname.startsWith(href + "/") && href !== basePath)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg py-2 transition-all duration-200",
                isCollapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              )}
              title={isCollapsed ? label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-slate-500")} />
              {!isCollapsed && (
                <span className="truncate font-medium text-sm transition-opacity duration-300 opacity-100">
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
