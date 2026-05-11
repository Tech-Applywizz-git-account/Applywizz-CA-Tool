export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("tech_incentives")
            .select("*")
            .eq("email", email.toLowerCase())
            .order("period", { ascending: false });

        if (error) {
            // It might fail if the table isn't created yet
            return NextResponse.json({ data: [] }, { status: 200 });
        }

        return NextResponse.json({ data: data || [] }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
