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
        const { data, error } = await supabaseServer
            .from('teams')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) {
            console.error("[Teams API] Error fetching teams:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (err: any) {
        console.error("[Teams API Error]:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
