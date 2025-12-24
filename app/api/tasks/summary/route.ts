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

        // Fetch data from 'clients' table with joins for emails
        // Filter by status='Completed' and last_update=dateParam
        const { data: clients, error } = await supabaseAdmin
            .from("clients")
            .select(`
                applywizz_id, 
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

        // Create the response object keyed by applywizz_id
        const by_lead: Record<string, any> = {};

        if (clients) {
            for (const client of (clients as any[])) {
                if (client.applywizz_id) {
                    // Extract emails from nested join results
                    const ca_email = client.ca?.email || null;
                    const tl_email = client.team?.lead?.email || null;

                    by_lead[client.applywizz_id] = {
                        work_done_ca_name: client.work_done_ca_name,
                        ca_mail: ca_email,
                        team_lead_name: client.team_lead_name,
                        tl_email: tl_email,
                        emails_submitted: client.emails_submitted,
                    };
                }
            }
        }

        const response = NextResponse.json({
            date: dateParam,
            by_lead: by_lead,
        });

        // Add CORS headers for "all origins"
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        return response;

    } catch (err: any) {
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
