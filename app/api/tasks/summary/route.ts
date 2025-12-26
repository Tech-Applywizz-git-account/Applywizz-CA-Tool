import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: { persistSession: false, autoRefreshToken: false },
    }
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date");

        if (!dateParam) {
            return NextResponse.json(
                { error: "date parameter is required" },
                { status: 400 }
            );
        }

        const today = new Date().toISOString().slice(0, 10);
        const by_lead: Record<string, any> = {};

        if (dateParam === today) {
            // --- LOGIC FOR TODAY (from clients table) ---
            const { data: clients, error } = await supabaseAdmin
                .from("clients")
                .select(`
                    applywizz_id, 
                    name,
                    work_done_ca_name, 
                    team_lead_name, 
                    emails_submitted,
                    ca:work_done_by (email),
                    team:team_id (
                        lead:lead_id (email)
                    )
                `)
                .eq("status", "Completed")
                .eq("last_update", dateParam);

            if (error) {
                return NextResponse.json(
                    { error: "Database query failed", details: error.message },
                    { status: 500 }
                );
            }

            if (clients) {
                for (const client of (clients as any[])) {
                    if (client.applywizz_id) {
                        by_lead[client.applywizz_id] = {
                            client_name: client.name,
                            work_done_ca_name: client.work_done_ca_name,
                            ca_mail: client.ca?.email || null,
                            team_lead_name: client.team_lead_name,
                            tl_email: client.team?.lead?.email || null,
                            emails_submitted: client.emails_submitted,
                        };
                    }
                }
            }
        } else {
            // --- LOGIC FOR HISTORY (from work_history table) ---
            const { data: history, error: histError } = await supabaseAdmin
                .from("work_history")
                .select("ca_id, ca_name, completed_profiles")
                .eq("date", dateParam);

            if (histError) {
                return NextResponse.json(
                    { error: "History query failed", details: histError.message },
                    { status: 500 }
                );
            }

            if (history && history.length > 0) {
                // 1. Collect all CA IDs and Profile IDs to fetch missing details
                const caIds = [...new Set(history.map(h => h.ca_id))];
                const profileIds: string[] = [];

                history.forEach(h => {
                    const profiles = Array.isArray(h.completed_profiles)
                        ? h.completed_profiles
                        : JSON.parse(h.completed_profiles as string || "[]");
                    profiles.forEach((p: any) => { if (p.id) profileIds.push(p.id); });
                });

                // 2. Fetch CA and TL info in one go
                const { data: userData } = await supabaseAdmin
                    .from("users")
                    .select(`
                        id, 
                        email, 
                        team:team_id (
                            lead:lead_id (name, email)
                        )
                    `)
                    .in("id", caIds);

                const userMap: Record<string, any> = {};
                userData?.forEach(u => { userMap[u.id] = u; });

                // 3. Fetch missing applywizz_ids and names from clients table
                const { data: clientInfo } = await supabaseAdmin
                    .from("clients")
                    .select("id, applywizz_id, name")
                    .in("id", profileIds);

                const applywizzMap: Record<string, { awl_id: string, name: string }> = {};
                clientInfo?.forEach(c => {
                    if (c.applywizz_id) applywizzMap[c.id] = { awl_id: c.applywizz_id, name: c.name || "" };
                });

                // 4. Assemble by_lead response
                history.forEach(h => {
                    const profiles = Array.isArray(h.completed_profiles)
                        ? h.completed_profiles
                        : JSON.parse(h.completed_profiles as string || "[]");

                    const caInfo = userMap[h.ca_id];

                    profiles.forEach((p: any) => {
                        const clientData = applywizzMap[p.id];
                        const awlId = p.applywizz_id || clientData?.awl_id;

                        if (awlId) {
                            by_lead[awlId] = {
                                client_name: p.name || clientData?.name || null,
                                work_done_ca_name: h.ca_name,
                                ca_mail: caInfo?.email || null,
                                team_lead_name: caInfo?.team?.lead?.name || null,
                                tl_email: caInfo?.team?.lead?.email || null,
                                emails_submitted: p.emails_submitted || 0
                            };
                        }
                    });
                });
            }
        }

        const response = NextResponse.json({
            date: dateParam,
            by_lead: by_lead,
            total_leads_count: Object.keys(by_lead).length,
        });

        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        return response;

    } catch (err: any) {
        console.error("Summary API Error:", err);
        const errorResponse = NextResponse.json(
            { error: "Internal server error", details: err?.message ?? String(err) },
            { status: 500 }
        );
        errorResponse.headers.set("Access-Control-Allow-Origin", "*");
        return errorResponse;
    }
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
}
