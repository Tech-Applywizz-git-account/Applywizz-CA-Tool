import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // service key
);

export async function POST(req: Request) {
    const { email, password } = await req.json();
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        // "http://localhost:3000/reset-password"
        redirectTo: "https://applywizz-ca-management.vercel.app//reset-password"
    });


    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data });
}
