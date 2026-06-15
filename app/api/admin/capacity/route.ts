// app\api\admin\capacity\route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export async function PUT(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { user_id, min_capacity, max_capacity, system_name } = body;

        if (!user_id || typeof user_id !== 'string') {
            return NextResponse.json(
                { success: false, error: "Missing or invalid user_id in request body" },
                { status: 400 }
            );
        }

        if (typeof min_capacity !== 'number' || min_capacity < 0) {
            return NextResponse.json(
                { success: false, error: "Min capacity must be a non-negative number" },
                { status: 400 }
            );
        }

        if (typeof max_capacity !== 'number' || max_capacity < min_capacity) {
            return NextResponse.json(
                { success: false, error: "Max capacity must be a number greater than or equal to min capacity" },
                { status: 400 }
            );
        }

        // Validate system_name (optional: must be string or null/undefined)
        if (system_name !== undefined && system_name !== null && typeof system_name !== 'string') {
            return NextResponse.json(
                { success: false, error: "system_name must be a string or null" },
                { status: 400 }
            );
        }

        // Build the update payload
        const updatePayload: Record<string, any> = {
            min_capacity,
            max_capacity,
        };

        // Include system_name only if explicitly provided in the request
        if (system_name !== undefined) {
            updatePayload.system_name = system_name === "" ? null : system_name;
        }

        // Update the user's capacities and system_name in users table
        const { data: updated, error } = await supabaseServer
            .from('users')
            .update(updatePayload)
            .eq('id', user_id)
            .select('id, name, email, role, designation, system_name, min_capacity, max_capacity')
            .single();

        if (error) {
            console.error("[Capacity API] Update user error:", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            user: updated
        });
    } catch (err: any) {
        console.error("[Capacity API Error]:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
