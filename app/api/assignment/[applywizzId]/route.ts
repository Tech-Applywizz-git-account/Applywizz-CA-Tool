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

        return NextResponse.json({
            applywizz_id: assignment.applywizz_id,
            suggested_ca_email: assignment.suggested_ca_email,
            final_ca_email: assignment.final_ca_email,
            status: assignment.status
        });
    } catch (err: any) {
        console.error("[API getAssignment] Get Assignment Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
