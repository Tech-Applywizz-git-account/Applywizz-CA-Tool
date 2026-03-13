import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // service key
);

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        
        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: "https://applywizz-ca-management.vercel.app/reset-password"
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error("Create User Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}
