export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { approveOrReassignCA } from "@/lib/services/assignmentService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { applywizz_id, ca_email, reviewed_by, remarks } = body;

        if (!applywizz_id || typeof applywizz_id !== 'string' || !applywizz_id.trim()) {
            return NextResponse.json(
                { success: false, error: "Missing or invalid applywizz_id in request body" },
                { status: 400 }
            );
        }

        if (!ca_email || typeof ca_email !== 'string' || !ca_email.trim()) {
            return NextResponse.json(
                { success: false, error: "Missing or invalid ca_email in request body" },
                { status: 400 }
            );
        }

        const result = await approveOrReassignCA(
            supabaseServer, 
            applywizz_id, 
            ca_email, 
            reviewed_by, 
            remarks
        );

        return NextResponse.json({
            success: true,
            status: result.status
        });
    } catch (err: any) {
        console.error("[API approve] Approve API Error:", err);
        const status = err.message.includes("not found") ? 404 : 500;
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status }
        );
    }
}
