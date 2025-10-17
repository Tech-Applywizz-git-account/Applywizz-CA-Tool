import { NextResponse } from "next/server";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs"; // Run on Node runtime (not edge)

// --- Initialize Supabase client (admin privileges) ---
const supabaseAdmin: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

// --- Simple API key authentication ---
function isAuthorized(req: Request): boolean {
  const expected = process.env.SYNC_API_KEY;
  if (!expected) return true; // allow all in dev if key missing
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return false;
  const apiKey = authHeader.slice(7);
  return apiKey === expected;
}

// --- Schema validation for body ---
const ClientSchema = z.object({
  applywizz_id: z.string().regex(/^AWL-\d{1,4}$/).optional(),
  awl_id: z.string().regex(/^AWL-\d{1,4}$/).optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  status: z.string().optional(),
  assigned_ca_id: z.string().uuid().optional(),
  assigned_ca_name: z.string().optional(),
  team_id: z.string().uuid().optional(),
  team_lead_name: z.string().optional(),
  emails_required: z.number().optional(),
  emails_submitted: z.number().optional(),
  jobs_applied: z.number().optional(),
  remarks: z.string().optional(),
  work_done_ca_name: z.string().optional(),
  work_auth_details: z.string().optional(),
  sponsorship: z.boolean().optional(),
  visa_type: z.string().optional(),
  experience: z.number().optional(),
});

// --- POST handler ---
export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const applywizz_id = data.applywizz_id || data.awl_id;
    if (!applywizz_id) {
      return NextResponse.json(
        { error: "applywizz_id (or awl_id) is required" },
        { status: 400 }
      );
    }

    // Prepare the data for upsert
    const upsertData = {
      ...data,
      applywizz_id,
      last_update: new Date().toISOString(),
    };

    // Perform UPSERT (insert if not exists, else update)
    const { data: result, error } = await supabaseAdmin
      .from("clients")
      .upsert(upsertData, { onConflict: "applywizz_id" })
      .select("id, applywizz_id, email, status, assigned_ca_name, last_update")
      .limit(1);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Supabase upsert failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Client synced successfully",
      applywizz_id,
      client: result?.[0] ?? null,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// --- OPTIONS handler for CORS preflight (optional) ---
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
