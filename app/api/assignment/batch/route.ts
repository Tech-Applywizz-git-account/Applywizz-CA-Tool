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

        // ── 1b. Fetch all clients from clients table in one query ───────────────────
        const { data: clientsData, error: clientErr } = await supabaseServer
            .from("clients")
            .select("applywizz_id, assigned_ca_id")
            .in("applywizz_id", ids);

        if (clientErr) {
            console.error("[API batch assignment] Warning fetching clients table:", clientErr);
        }

        const assignmentsMap = new Map(assignments?.map((a) => [a.applywizz_id, a]) || []);
        const clientsMap = new Map(clientsData?.map((c) => [c.applywizz_id, c]) || []);

        if (assignmentsMap.size === 0 && clientsMap.size === 0) {
            // Return not_found entries for all IDs
            return NextResponse.json({
                success: true,
                results: ids.map((id) => ({ applywizz_id: id, not_found: true })),
            });
        }

        // ── 1c. Resolve CA User Info from UUIDs (from clients table) ────────────
        const caIds = [...new Set(clientsData?.map((c) => c.assigned_ca_id).filter(Boolean))];
        const usersByIdMap = new Map<string, { email: string; team_id: string | null; system_name: string | null }>();
        
        if (caIds.length > 0) {
            const { data: usersById } = await supabaseServer
                .from("users")
                .select("id, email, team_id, system_name")
                .in("id", caIds);
            
            usersById?.forEach((u) => {
                usersByIdMap.set(u.id, {
                    email: u.email,
                    team_id: u.team_id ?? null,
                    system_name: u.system_name ?? null
                });
            });
        }

        // ── 2. Fetch team_ids and system_names for all CAs in one query ─────────────
        const caEmailsFromQueue = [
            ...assignments.map((a) => a.suggested_ca_email).filter(Boolean),
            ...assignments.map((a) => a.final_ca_email).filter(Boolean)
        ];
        
        const caEmailsFromClients = [...usersByIdMap.values()].map((u) => u.email);
        const caEmails = [...new Set([...caEmailsFromQueue, ...caEmailsFromClients])];

        const { data: caUsers } = await supabaseServer
            .from("users")
            .select("email, team_id, system_name")
            .in("email", caEmails);

        // email → team_id and system_name mappings
        const emailToTeamId = new Map<string, string>();
        const emailToSystemName = new Map<string, string | null>();
        
        // Add info from users query by email
        caUsers?.forEach((u) => {
            if (u.team_id) emailToTeamId.set(u.email, u.team_id);
            emailToSystemName.set(u.email, u.system_name ?? null);
        });

        // Also ensure user info from usersByIdMap are in the email mappings
        usersByIdMap.forEach((u) => {
            if (u.team_id) emailToTeamId.set(u.email, u.team_id);
            emailToSystemName.set(u.email, u.system_name);
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
        const results = ids.map((id) => {
            const a = assignmentsMap.get(id);
            const c = clientsMap.get(id);

            if (!a && !c) return { applywizz_id: id, not_found: true };

            // Determine final_ca_email from clients table first, fallback to queue
            let finalCaEmail: string | null = null;
            if (c && c.assigned_ca_id) {
                const userObj = usersByIdMap.get(c.assigned_ca_id);
                if (userObj) {
                    finalCaEmail = userObj.email;
                }
            }
            if (!finalCaEmail && a) {
                finalCaEmail = a.final_ca_email ?? null;
            }

            // Suggested CA Email
            const suggestedCaEmail = a ? a.suggested_ca_email : null;

            // Status: default to "APPROVED" if in clients table but not in queue
            const status = a ? a.status : "APPROVED";

            const activeCaEmail = finalCaEmail || suggestedCaEmail;
            const teamId = activeCaEmail ? (emailToTeamId.get(activeCaEmail) ?? null) : null;
            const tl = teamId ? (teamMap.get(teamId) ?? null) : null;

            return {
                applywizz_id: id,
                suggested_ca_email: suggestedCaEmail,
                final_ca_email: finalCaEmail,
                status: status,
                team_lead_email: tl?.email ?? null,
                team_lead_name: tl?.name ?? null,
                suggested_ca_system_name: suggestedCaEmail ? (emailToSystemName.get(suggestedCaEmail) ?? null) : null,
                final_ca_system_name: finalCaEmail ? (emailToSystemName.get(finalCaEmail) ?? null) : null,
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
