import { NextResponse } from "next/server";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs"; // Run on Node runtime (not edge)

const supabaseAdmin: SupabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: { persistSession: false, autoRefreshToken: false },
    }
);

// --- Simple API key authentication ---
function isAuthorized(req: Request): boolean {
    const expected = process.env.SYNC_API_KEY;
    if (!expected) return true; // allow all in dev if key missing
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return false;
    const apiKey = authHeader.slice(7);
    return apiKey === expected;
}

// --- Schema validation for body ---
const ClientSchema = z.object({
    applywizz_id: z.string().regex(/^AWL-\d{1,4}$/).optional(),
    awl_id: z.string().regex(/^AWL-\d{1,4}$/).optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    status: z.string().optional(),
    assigned_ca_id: z.string().uuid().optional(),
    assigned_ca_name: z.string().optional(),
    team_id: z.string().uuid().optional(),
    team_lead_name: z.string().optional(),
    emails_required: z.number().optional(),
    emails_submitted: z.number().optional(),
    jobs_applied: z.number().optional(),
    remarks: z.string().optional(),
    work_done_ca_name: z.string().optional(),
    work_auth_details: z.string().optional(),
    sponsorship: z.boolean().optional(),
    visa_type: z.string().optional(),
    experience: z.number().optional(),
});

export async function POST(req: Request) {
    try {
        if (!isAuthorized(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow fields you want to update via this endpoint
        const UpdateSchema = z.object({
            applywizz_id: z.string().regex(/^AWL-\d{1,4}$/),
            status: z.string().optional(),
            assigned_ca_id: z.string().uuid().optional(),
            assigned_ca_name: z.string().optional(),
            team_id: z.string().uuid().optional(),
            team_lead_name: z.string().optional(),
            emails_required: z.number().optional(),
            emails_submitted: z.number().optional(),
            jobs_applied: z.number().optional(),
            remarks: z.string().optional(),
            work_done_ca_name: z.string().optional(),
            work_auth_details: z.string().optional(),
            sponsorship: z.boolean().optional(),
            visa_type: z.string().optional(),
            experience: z.number().optional(),
            is_active: z.boolean().optional(),
        }).refine(obj => Object.keys(obj).some(k => k !== "applywizz_id"), {
            message: "Provide at least one field to update"
        });

        const body = await req.json().catch(() => ({}));
        const parsed = UpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid body", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        // Normalize to avoid whitespace/case mismatches
        const applywizz_id = parsed.data.applywizz_id.trim().toUpperCase();
        const { applywizz_id: _, ...updates } = parsed.data;

        // 1) ensure the row exists (in THIS database/env)
        const { data: existing, error: selErr } = await supabaseAdmin
            .from("clients")
            .select("id")
            .eq("applywizz_id", applywizz_id)
            .maybeSingle();

        if (selErr) {
            return NextResponse.json(
                { error: "Lookup failed", details: selErr.message },
                { status: 500 }
            );
        }
        if (!existing) {
            return NextResponse.json(
                { error: "Client not found", details: `No client with applywizz_id ${applywizz_id}` },
                { status: 404 }
            );
        }

        // 2) UPDATE only (stamp last_update as DATE)
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const { data: updated, error: updErr } = await supabaseAdmin
            .from("clients")
            .update({ ...updates, last_update: today })
            .eq("applywizz_id", applywizz_id)
            .select("id, applywizz_id, email, status, assigned_ca_name, jobs_applied, last_update")
            .single();

        if (updErr) {
            return NextResponse.json(
                { error: "Update failed", details: updErr.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: "Client updated", client: updated });
    } catch (err: any) {
        return NextResponse.json(
            { error: "Internal server error", details: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}

// --- OPTIONS handler for CORS preflight (optional) ---
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}
