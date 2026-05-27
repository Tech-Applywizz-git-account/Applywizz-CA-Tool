export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseCRM = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_CRM || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY_CRM || 'placeholder'
);

export async function GET() {
    try {
        // Get today's date in IST (Asia/Kolkata)
        const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
        const formatter = new Intl.DateTimeFormat('en-CA', options);
        const todayStr = formatter.format(new Date()); // returns "YYYY-MM-DD"

        const startOfDay = `${todayStr} 00:00:00`;
        const endOfDay = `${todayStr} 23:59:59`;

        const { data, error } = await supabaseCRM
            .from("leads")
            .select("id, name, phone, email, city, status, current_stage, created_at, business_id")
            .gte("created_at", startOfDay)
            .lte("created_at", endOfDay);

        if (error) {
            console.error("Error fetching leads from CRM:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, leads: data || [] });
    } catch (err: any) {
        console.error("API error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
