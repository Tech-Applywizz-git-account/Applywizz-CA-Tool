// app/api/assignment/batch/route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
    { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * POST /api/assignment/batch
 * Body: { "ids": ["AWL-2415", "AWL-2416", ...] }
 *
 * Returns an array of assignment objects (same shape as the single GET),
 * each augmented with team_lead_email and team_lead_name.
 * Missing IDs are included with a `not_found: true` flag.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const rawIds: unknown = body?.ids;

        if (!Array.isArray(rawIds) || rawIds.length === 0) {
            return NextResponse.json(
                { success: false, error: "Request body must include a non-empty 'ids' array." },
                { status: 400 }
            );
        }

        if (rawIds.length > 100) {
            return NextResponse.json(
                { success: false, error: "Maximum 100 IDs per request." },
                { status: 400 }
            );
        }

        // Normalize IDs
        const ids: string[] = rawIds.map((id) => String(id).trim().toUpperCase());

        // ── 1. Fetch all assignments in one query ────────────────────────────
        const { data: assignments, error: assignErr } = await supabaseServer
            .from("client_assignment_queue")
            .select("applywizz_id, suggested_ca_email, final_ca_email, status")
            .in("applywizz_id", ids);

        if (assignErr) {
            throw new Error(`Failed to fetch assignments: ${assignErr.message}`);
        }

        if (!assignments || assignments.length === 0) {
            // Return not_found entries for all IDs
            return NextResponse.json({
                success: true,
                results: ids.map((id) => ({ applywizz_id: id, not_found: true })),
            });
        }

        // ── 2. Fetch team_ids for all suggested CAs in one query ─────────────
        const caEmails = [...new Set(assignments.map((a) => a.suggested_ca_email).filter(Boolean))];

        const { data: caUsers } = await supabaseServer
            .from("users")
            .select("email, team_id")
            .in("email", caEmails);

        // email → team_id
        const emailToTeamId = new Map<string, string>();
        caUsers?.forEach((u) => {
            if (u.team_id) emailToTeamId.set(u.email, u.team_id);
        });

        // ── 3. Fetch team lead info for all relevant teams in one query ───────
        const teamIds = [...new Set([...emailToTeamId.values()])];
        let teamMap = new Map<string, { email: string | null; name: string | null }>();

        if (teamIds.length > 0) {
            const { data: teams } = await supabaseServer
                .from("teams")
                .select("id, email, name")
                .in("id", teamIds);

            teams?.forEach((t) => teamMap.set(t.id, { email: t.email ?? null, name: t.name ?? null }));
        }

        // ── 4. Assemble results ───────────────────────────────────────────────
        const assignmentMap = new Map(assignments.map((a) => [a.applywizz_id, a]));

        const results = ids.map((id) => {
            const a = assignmentMap.get(id);
            if (!a) return { applywizz_id: id, not_found: true };

            const teamId = emailToTeamId.get(a.suggested_ca_email) ?? null;
            const tl = teamId ? (teamMap.get(teamId) ?? null) : null;

            return {
                applywizz_id: a.applywizz_id,
                suggested_ca_email: a.suggested_ca_email,
                final_ca_email: a.final_ca_email ?? null,
                status: a.status,
                team_lead_email: tl?.email ?? null,
                team_lead_name: tl?.name ?? null,
            };
        });

        const response = NextResponse.json({ success: true, results });
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return response;

    } catch (err: any) {
        console.error("[API batch assignment] Error:", err);
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
