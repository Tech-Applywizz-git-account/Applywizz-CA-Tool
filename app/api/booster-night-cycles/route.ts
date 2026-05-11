export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

// GET: Fetch booster night cycles for a given month
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2026-04"
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query = supabaseAdmin
      .from("booster_night_cycles")
      .select("*")
      .order("created_at", { ascending: false });

    if (month) {
      query = query.eq("month", month);
    }

    if (activeOnly) {
      query = query.eq("status", "active");
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cycles: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Create a new booster night cycle
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { start_time, end_time, multiplier, target, month, created_by } = body;

    if (!start_time || !end_time || !month) {
      return NextResponse.json(
        { success: false, error: "start_time, end_time, and month are required" },
        { status: 400 }
      );
    }

    // Ensure times are stored as IST (append +05:30 if no timezone info)
    const toIST = (t: string) => {
      if (!t) return t;
      // datetime-local gives "2026-04-28T20:00" — no timezone info, treat as IST
      if (!t.includes('+') && !t.includes('Z') && !t.match(/\d{2}:\d{2}:\d{2}\.\d+$/)) {
        return t + ':00+05:30';
      }
      return t;
    };

    const { data, error } = await supabaseAdmin
      .from("booster_night_cycles")
      .insert({
        start_time: toIST(start_time),
        end_time: toIST(end_time),
        multiplier: multiplier || 1.5,
        target: target || "both",
        month,
        status: "active",
        created_by: created_by || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cycle: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: Revert (undo) a booster night cycle
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Cycle id is required" }, { status: 400 });
    }

    if (action === "revert") {
      const { data, error } = await supabaseAdmin
        .from("booster_night_cycles")
        .update({ status: "reverted", reverted_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, cycle: data });
    }

    if (action === "restore") {
      const { data, error } = await supabaseAdmin
        .from("booster_night_cycles")
        .update({ status: "active", reverted_at: null })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, cycle: data });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
