export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("incentive_visibility_settings")
      .select("*")
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is empty result
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Default settings if empty
    const settings = data || {
      ca_incentive_visibility: false,
      team_lead_incentive_visibility: true,
      visible_months: []
    };

    let updaterName = null;
    if (settings.updated_by) {
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("name")
        .eq("id", settings.updated_by)
        .single();
      updaterName = userData?.name;
    }

    return NextResponse.json({ success: true, settings, updaterName });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ca_incentive_visibility, team_lead_incentive_visibility, visible_months, updated_by } = body;

    if (!updated_by) {
      return NextResponse.json({ success: false, error: "updated_by is required" }, { status: 400 });
    }

    // Get current record ID if exists
    const { data: existing } = await supabaseAdmin
      .from("incentive_visibility_settings")
      .select("id")
      .single();

    let result;
    if (existing?.id) {
      result = await supabaseAdmin
        .from("incentive_visibility_settings")
        .update({
          ca_incentive_visibility,
          team_lead_incentive_visibility,
          visible_months: visible_months || [],
          updated_by,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from("incentive_visibility_settings")
        .insert({
          ca_incentive_visibility: ca_incentive_visibility ?? false,
          team_lead_incentive_visibility: team_lead_incentive_visibility ?? true,
          visible_months: visible_months || [],
          updated_by,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
    }

    let updaterName = null;
    if (result.data?.updated_by) {
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("name")
        .eq("id", result.data.updated_by)
        .single();
      updaterName = userData?.name;
    }

    return NextResponse.json({ success: true, settings: result.data, updaterName });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
