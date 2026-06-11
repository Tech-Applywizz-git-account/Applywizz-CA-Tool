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
        // 1. Get CA dashboard rows to calculate metrics
        const { data: dashboard, error: dashError } = await supabaseServer
            .from('ca_capacity_dashboard')
            .select('min_capacity, effective_load, utilization_percentage');

        if (dashError) {
            console.error("[Stats API] Dashboard query error:", dashError);
            return NextResponse.json({ success: false, error: dashError.message }, { status: 500 });
        }

        const activeCAs = dashboard || [];
        const totalActiveCAs = activeCAs.length;

        let totalUtilization = 0;
        let casBelowMin = 0;

        activeCAs.forEach(ca => {
            totalUtilization += ca.utilization_percentage || 0;
            if (ca.effective_load < ca.min_capacity) {
                casBelowMin++;
            }
        });

        const avgUtilization = totalActiveCAs > 0 ? Math.round(totalUtilization / totalActiveCAs) : 0;

        // 2. Count pending assignments from client_assignment_queue
        const { count: pendingCount, error: countError } = await supabaseServer
            .from('client_assignment_queue')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING');

        if (countError) {
            console.error("[Stats API] Pending count query error:", countError);
            return NextResponse.json({ success: false, error: countError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            totalActiveCAs,
            totalPendingAssignments: pendingCount || 0,
            averageUtilization: avgUtilization,
            casBelowMinCapacity: casBelowMin
        });
    } catch (err: any) {
        console.error("[Stats API Error]:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
