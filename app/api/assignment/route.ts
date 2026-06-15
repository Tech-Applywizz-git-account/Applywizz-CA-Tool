// app/api/assignment/route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export async function GET(req: Request) {
    try {
        // Fetch assignment queue with CA name and team via join on users + teams
        const { data: queueData, error: queueError } = await supabaseServer
            .from('client_assignment_queue')
            .select(`
                *,
                suggested_ca:suggested_ca_id (
                    name,
                    team_id,
                    teams!inner (
                        name
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (queueError) {
            // Fallback: if join fails (e.g. suggested_ca_id is null or foreign key not set),
            // return plain queue data without enrichment
            console.warn("[Assignment List API] Join failed, falling back to plain query:", queueError.message);
            
            const { data: plainData, error: plainError } = await supabaseServer
                .from('client_assignment_queue')
                .select('*')
                .order('created_at', { ascending: false });

            if (plainError) {
                console.error("[Assignment List API] Fallback query error:", plainError);
                return NextResponse.json({ success: false, error: plainError.message }, { status: 500 });
            }

            return NextResponse.json(plainData || []);
        }

        // Enrich with name and team from joined data
        const enriched = (queueData || []).map((row: any) => {
            const caInfo = row.suggested_ca;
            return {
                id: row.id,
                applywizz_id: row.applywizz_id,
                suggested_ca_id: row.suggested_ca_id,
                suggested_ca_email: row.suggested_ca_email,
                suggested_ca_name: caInfo?.name ?? null,
                suggested_ca_team: caInfo?.teams?.name ?? null,
                final_ca_email: row.final_ca_email,
                recommendation_accepted: row.recommendation_accepted,
                status: row.status,
                created_at: row.created_at,
                updated_at: row.updated_at,
                reviewed_by: row.reviewed_by,
                reviewed_at: row.reviewed_at,
                remarks: row.remarks,
            };
        });

        return NextResponse.json(enriched);
    } catch (err: any) {
        console.error("[Assignment List API Error]:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
