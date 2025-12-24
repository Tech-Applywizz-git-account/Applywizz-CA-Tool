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

        // Fetch data from 'clients' table
        // Filter by status='Completed' and last_update=dateParam
        const { data: clients, error } = await supabaseAdmin
            .from("clients")
            .select("applywizz_id, work_done_ca_name, team_lead_name, emails_submitted")
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
            for (const client of clients) {
                if (client.applywizz_id) {
                    by_lead[client.applywizz_id] = {
                        work_done_ca_name: client.work_done_ca_name,
                        team_lead_name: client.team_lead_name,
                        emails_submitted: client.emails_submitted,
                    };
                }
            }
        }

        return NextResponse.json({
            date: dateParam,
            by_lead: by_lead,
        });

    } catch (err: any) {
        return NextResponse.json(
            { error: "Internal server error", details: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}
