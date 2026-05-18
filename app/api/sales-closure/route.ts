export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const month = searchParams.get("month"); // e.g. "4" or "04"
        const year = searchParams.get("year");   // e.g. "2026"
        const startDate = searchParams.get("start_date"); // YYYY-MM-DD
        const endDate = searchParams.get("end_date");     // YYYY-MM-DD

        let query = supabaseAdmin
            .from("sales_closure")
            .select("*")
            .order("closed_at", { ascending: false });

        if (email) {
            query = query.eq("email", email);
        }

        // Support for custom date ranges
        if (startDate && endDate) {
            query = query.gte("closed_at", startDate).lte("closed_at", endDate);
        } 
        // Support for month and year parameters (like the old CRM API)
        else if (month && year) {
            const m = parseInt(month);
            const y = parseInt(year);
            if (!isNaN(m) && !isNaN(y)) {
                const startObj = new Date(Date.UTC(y, m - 1, 1));
                const endObj = new Date(Date.UTC(y, m, 1));
                query = query.gte("closed_at", startObj.toISOString()).lt("closed_at", endObj.toISOString());
            }
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, data: { sales: data } });

    } catch (e: any) {
        console.error("Sales Closure API Error:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
