export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCapacityDashboard } from "@/lib/services/assignmentService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sortBy = searchParams.get("sortBy") || undefined;
        let order = searchParams.get("order") || "asc";

        // Normalize order parameter
        if (order !== "asc" && order !== "desc") {
            order = "asc";
        }

        const data = await getCapacityDashboard(supabaseServer, sortBy, order as "asc" | "desc");

        return NextResponse.json(data);
    } catch (err: any) {
        console.error("[API capacityDashboard] Capacity Dashboard Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
