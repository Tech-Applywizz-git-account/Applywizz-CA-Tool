// app\api\assignment\teams\route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export interface TeamEntry {
    id: string;
    name: string;
}

export async function GET() {
    try {
        // 1. Fetch active team lead IDs from users table
        const { data: activeLeads, error: leadsError } = await supabaseServer
            .from('users')
            .select('id')
            .eq('role', 'Team Lead')
            .eq('isactive', true);

        if (leadsError) {
            console.error("[Teams API] Error fetching active team leads:", leadsError);
            return NextResponse.json({ success: false, error: leadsError.message }, { status: 500 });
        }

        // 2. Fetch all teams
        const { data: allTeams, error: teamsError } = await supabaseServer
            .from('teams')
            .select('id, name, lead_id')
            .order('name', { ascending: true });

        if (teamsError) {
            console.error("[Teams API] Error fetching teams:", teamsError);
            return NextResponse.json({ success: false, error: teamsError.message }, { status: 500 });
        }

        // 3. Filter teams where lead_id is in the set of active lead IDs
        const activeLeadIds = new Set((activeLeads || []).map(u => u.id));
        const filteredTeams = (allTeams || []).filter(t => t.lead_id && activeLeadIds.has(t.lead_id));

        // Return only id and name as expected by the frontend
        const result = filteredTeams.map(t => ({ id: t.id, name: t.name }));

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("[Teams API Error]:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
