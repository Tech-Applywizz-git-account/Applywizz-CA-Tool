// app\api\assignment\recommendation\[applywizzId]\route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    getAssignmentByApplyWizzId,
    getCADashboardRowByEmail, 
    getAssignmentCandidates, 
    calculateBestCA 
} from "@/lib/services/assignmentService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export async function GET(req: Request, { params }: { params: { applywizzId: string } }) {
    try {
        const { applywizzId } = params;

        if (!applywizzId || !applywizzId.trim()) {
            return NextResponse.json(
                { success: false, error: "Missing applywizzId parameter" },
                { status: 400 }
            );
        }

        const normalizedId = applywizzId.trim().toUpperCase();

        // 1. Check if assignment exists in the database
        const assignment = await getAssignmentByApplyWizzId(supabaseServer, normalizedId);

        let recommendedCaEmail: string;
        let method = "database_record";

        if (assignment) {
            recommendedCaEmail = assignment.suggested_ca_email;
        } else {
            // Calculate on the fly without database mutation
            method = "on_the_fly_calculation";
            const candidates = await getAssignmentCandidates(supabaseServer);
            if (candidates.length === 0) {
                return NextResponse.json(
                    { success: false, error: "No assignable candidates found to calculate preview." },
                    { status: 404 }
                );
            }
            const bestCa = calculateBestCA(candidates, normalizedId);
            recommendedCaEmail = bestCa.email;
        }

        // 2. Load metrics from the ca_capacity_dashboard view
        const caMetrics = await getCADashboardRowByEmail(supabaseServer, recommendedCaEmail);

        if (!caMetrics) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: `Metrics not found in capacity dashboard for CA email: ${recommendedCaEmail}` 
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            applywizz_id: normalizedId,
            preview_method: method,
            recommended_ca: {
                name: caMetrics.name,
                email: caMetrics.email,
                system_name: caMetrics.system_name ?? null,
                team_name: caMetrics.team_name ?? null,
                effective_load: caMetrics.effective_load,
                min_capacity: caMetrics.min_capacity,
                max_capacity: caMetrics.max_capacity,
                utilization_percentage: caMetrics.utilization_percentage
            }
        });
    } catch (err: any) {
        console.error("[API recommendationPreview] Preview API Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
