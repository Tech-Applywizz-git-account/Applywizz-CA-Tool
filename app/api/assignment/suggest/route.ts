// app\api\assignment\suggest\route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { suggestBestCA } from "@/lib/services/assignmentService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { applywizz_id } = body;

        if (!applywizz_id || typeof applywizz_id !== 'string' || !applywizz_id.trim()) {
            const errorResponse = NextResponse.json(
                { success: false, error: "Missing or invalid applywizz_id in request body" },
                { status: 400 }
            );
            errorResponse.headers.set("Access-Control-Allow-Origin", "*");
            return errorResponse;
        }

        const result = await suggestBestCA(supabaseServer, applywizz_id);

        const response = NextResponse.json({
            success: true,
            applywizz_id: result.applywizz_id,
            ca_email: result.final_ca_email || result.suggested_ca_email,
            status: result.status
        });
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return response;
    } catch (err: any) {
        console.error("[API suggest] Suggest API Error:", err);
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
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
}
