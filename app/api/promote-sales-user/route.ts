import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    try {
        const { userId, newRole, effectiveMonth } = await req.json(); 
        // Example: effectiveMonth "2026-03"
        
        if (!userId || !newRole || !effectiveMonth) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }
        
        const { data: user, error: fetchErr } = await supabaseAdmin.from("users").select("role, role_history, designation").eq("id", userId).single();
        if (fetchErr || !user) throw new Error("User not found");
        
        // Load history or initialize it structurally
        let history = user.role_history || {};
        if (Object.keys(history).length === 0 && user.role) {
            // Anchor their original role from the beginning of time 
            history["2000-01"] = user.role; 
        }
        
        // Append new promotion timestamp tracking map -> period
        history[effectiveMonth] = newRole;
        
        // Determine what the overall current structural system role should be globally right now.
        // E.g., If promoted in 2026-03, and the system clock is 2026-04, their active identity resolves to the new role.
        const currentMonth = new Date().toISOString().substring(0, 7);
        const sortedKeys = Object.keys(history).sort();
        let activeRoleForNow = user.role;
        for (const k of sortedKeys) {
            if (k <= currentMonth) {
                activeRoleForNow = history[k];
            }
        }
        
        const { error: updateErr } = await supabaseAdmin.from("users").update({
            role: activeRoleForNow,
            designation: activeRoleForNow, // Duplicate for sync matching generic backend assumptions
            role_history: history
        }).eq("id", userId);
        
        if (updateErr) throw new Error(updateErr.message);
        
        return NextResponse.json({ success: true, role_history: history, activeRoleForNow });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
