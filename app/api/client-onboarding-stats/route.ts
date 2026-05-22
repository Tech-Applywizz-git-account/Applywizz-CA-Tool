import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { clientIds } = await request.json()
    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ counts: {}, onboardingDates: {} })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server missing Supabase credentials" },
        { status: 500 }
      )
    }

    // Create client with service role key to bypass RLS
    const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const counts: Record<string, number> = {}
    const onboardingDates: Record<string, string> = {}

    // Process clientIds in chunks of 50 to prevent query limits/URL length limits
    const chunkSize = 50
    for (let i = 0; i < clientIds.length; i += chunkSize) {
      const chunk = clientIds.slice(i, i + chunkSize)
      
      let hasMore = true
      let page = 0
      const pageSize = 1000

      while (hasMore) {
        const { data, error } = await supabaseServer
          .from("work_history_profiles")
          .select("client_id, date_assigned")
          .in("client_id", chunk)
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
          console.error("API client-onboarding-stats query error:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!data || data.length === 0) {
          hasMore = false
        } else {
          data.forEach((item) => {
            const cid = item.client_id
            if (cid) {
              counts[cid] = (counts[cid] || 0) + 1
              
              if (item.date_assigned) {
                if (!onboardingDates[cid] || item.date_assigned < onboardingDates[cid]) {
                  onboardingDates[cid] = item.date_assigned
                }
              }
            }
          })
          
          if (data.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        }
      }
    }

    return NextResponse.json({ counts, onboardingDates })
  } catch (error: any) {
    console.error("API client-onboarding-stats error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
