export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const monthParam = searchParams.get("month"); // e.g. "2026-06-01T00:00:00.000Z"
    const requesterId = searchParams.get("requesterId");

    if (!requesterId) {
      return NextResponse.json({ success: false, error: "requesterId is required" }, { status: 400 });
    }

    // 1. Look up the requester's role from the users table
    const { data: requesterUser, error: reqUserErr } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", requesterId)
      .single();

    if (reqUserErr || !requesterUser) {
      return NextResponse.json({ success: false, error: "Requester user not found" }, { status: 404 });
    }

    const requesterRole = requesterUser.role;

    // 2. Load visibility settings
    const { data: settingsData } = await supabaseAdmin
      .from("incentive_visibility_settings")
      .select("*")
      .single();

    const settings = settingsData || {
      ca_incentive_visibility: false,
      team_lead_incentive_visibility: true,
      visible_months: []
    };

    const isCA = ["CA", "Junior CA", "Trainee", "Career Associative Trainee"].includes(requesterRole);
    const isTeamLead = requesterRole === "Team Lead";
    const isAdmin = ["CRO", "CEO", "COO", "CPO", "System Admin"].includes(requesterRole);

    // 3. Enforce general role-based visibility toggles
    if (isCA && !settings.ca_incentive_visibility) {
      return NextResponse.json({ success: true, data: [] });
    }
    if (isTeamLead && !settings.team_lead_incentive_visibility) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 4. Query incentives table using admin client
    let query = supabaseAdmin.from("incentives").select("*");

    if (userIdParam) {
      const ids = userIdParam.split(",");
      if (ids.length > 1) {
        query = query.in("user_id", ids);
      } else {
        query = query.eq("user_id", ids[0]);
      }
    }

    if (monthParam) {
      query = query.eq("month", monthParam);
    }

    const { data: incentives, error: incError } = await query;
    if (incError) {
      return NextResponse.json({ success: false, error: incError.message }, { status: 500 });
    }

    if (!incentives || incentives.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 5. If user is admin (CRO/CEO/etc), skip month checks
    if (isAdmin) {
      return NextResponse.json({ success: true, data: incentives });
    }

    // 6. Otherwise filter returned records to visible_months only
    const allowedMonths = new Set(settings.visible_months || []);
    const filteredIncentives = incentives.filter((item: any) => {
      // item.month is typically a date string like "2026-06-01T00:00:00" or similar
      try {
        const itemMonthKey = item.month.substring(0, 7); // Extracts "YYYY-MM"
        return allowedMonths.has(itemMonthKey);
      } catch {
        return false;
      }
    });

    return NextResponse.json({ success: true, data: filteredIncentives });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
