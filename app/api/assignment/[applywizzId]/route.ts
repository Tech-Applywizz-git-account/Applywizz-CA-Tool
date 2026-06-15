// app\api\assignment\[applywizzId]\route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAssignmentByApplyWizzId } from "@/lib/services/assignmentService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export async function GET(req: Request, { params }: { params: { applywizzId: string } }) {
    try {
        const { applywizzId } = params;

        // Defensive check for route collision
        if (!applywizzId || applywizzId === "suggest" || applywizzId === "approve") {
            return NextResponse.json(
                { success: false, error: "Resource not found" },
                { status: 404 }
            );
        }

        const assignment = await getAssignmentByApplyWizzId(supabaseServer, applywizzId);

        if (!assignment) {
            return NextResponse.json(
                { success: false, error: `Assignment details not found for ApplyWizz ID: ${applywizzId}` },
                { status: 404 }
            );
        }

        // Resolve team lead info for the suggested CA
        let team_lead_data: { email: string | null; name: string | null } | null = null;

        const { data: caUser } = await supabaseServer
            .from("users")
            .select("team_id")
            .eq("email", assignment.suggested_ca_email)
            .maybeSingle();

        if (caUser?.team_id) {
            const { data: tlData } = await supabaseServer
                .from("teams")
                .select("email, name")
                .eq("id", caUser.team_id)
                .maybeSingle();
            team_lead_data = tlData ?? null;
        }

        const response = NextResponse.json({
            applywizz_id: assignment.applywizz_id,
            suggested_ca_email: assignment.suggested_ca_email,
            final_ca_email: assignment.final_ca_email,
            status: assignment.status,
            team_lead_email: team_lead_data?.email ?? null,
            team_lead_name: team_lead_data?.name ?? null
        });

        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return response;
    } catch (err: any) {
        console.error("[API getAssignment] Get Assignment Error:", err);
        const errorResponse = NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
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
