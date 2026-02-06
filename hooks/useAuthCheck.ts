"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export function useAuthCheck(requiredRole?: string | string[]) {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let subscription: any = null

        const checkUser = async () => {
            const storedUser = localStorage.getItem("loggedInUser")
            if (!storedUser) {
                router.push("/login")
                setLoading(false)
                return
            }

            const parsedUser = JSON.parse(storedUser)

            // Initial verify with database
            const { data: dbUser, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", parsedUser.id)
                .single()

            if (error) {
                console.error("Auth check error:", error)
                // On network error, we trust the local storage user for now to avoid accidental logouts
                setUser(parsedUser)
                setLoading(false)
            } else if (!dbUser || dbUser.isactive === false) {
                console.log("User is inactive or deleted, logging out...")
                localStorage.removeItem("loggedInUser")
                router.push("/login")
                setLoading(false)
                return
            } else {
                // Update local session with latest DB data
                localStorage.setItem("loggedInUser", JSON.stringify(dbUser))
                setUser(dbUser)
                setLoading(false)
            }

            // Role check if applicable
            if (dbUser && requiredRole) {
                const rawRole = dbUser.designation || dbUser.role || ""
                const userRole = rawRole.trim().toUpperCase()
                const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
                const normalizedRoles = roles.map(r => r.trim().toUpperCase())

                if (!normalizedRoles.includes(userRole)) {
                    console.error(`Unauthorized role access: expected ${normalizedRoles}, got ${userRole}`)
                    router.push("/login")
                    return
                }
            }

            // Listen for status changes via Realtime
            subscription = supabase
                .channel(`user-status-${parsedUser.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users',
                        filter: `id=eq.${parsedUser.id}`
                    },
                    (payload) => {
                        if (payload.new.isactive === false) {
                            console.log("Realtime: User deactivated, logging out...")
                            localStorage.removeItem("loggedInUser")
                            router.push("/login")
                        }
                    }
                )
                .subscribe()
        }

        checkUser()

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription)
            }
        }
    }, [router, requiredRole])

    return { user, loading }
}
