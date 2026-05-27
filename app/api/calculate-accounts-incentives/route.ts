export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const month = searchParams.get("month") || String(new Date().getMonth() + 1);
        const year = searchParams.get("year") || String(new Date().getFullYear());

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const periodStr = new Date(yearNum, monthNum - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });

        // Call the accounts-data route to get computed metrics
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const dataRes = await fetch(
            `${baseUrl}/api/accounts-data?email=${encodeURIComponent(email)}&month=${month}&year=${year}`,
            { cache: 'no-store' }
        );

        if (!dataRes.ok) {
            const errBody = await dataRes.json().catch(() => ({}));
            return NextResponse.json({
                success: false,
                error: "ACCOUNTS_DATA_FETCH_FAILED",
                details: errBody
            }, { status: 502 });
        }

        const data = await dataRes.json();
        if (!data.success || !data.accountManagers?.length) {
            return NextResponse.json({
                success: true,
                message: "No data found for this account manager",
                period: periodStr,
                incentive: null,
            });
        }

        const am = data.accountManagers[0];

        // Upsert into accounts_incentives table
        const { error: upsertError } = await supabaseAdmin
            .from("accounts_incentives")
            .upsert({
                email: am.email.toLowerCase(),
                period: periodStr,
                total_renewals: am.totalRenewals,
                successful_renewals: am.successfulRenewals,
                renewal_rate: am.renewalRate,
                monthly_revenue_usd: am.monthlyRevenueUSD,
                base_incentive_inr: am.baseIncentive,
                renewal_multiplier: am.renewalMultiplier,
                performance_bonus_inr: am.performanceBonus,
                final_incentive_inr: am.finalIncentive,
                last_updated: new Date().toISOString(),
            }, { onConflict: "email, period" });

        if (upsertError) {
            console.error("Accounts incentive upsert error:", upsertError);
        }

        // Update user.incentive_amount JSONB with monthly totals
        const { data: userData } = await supabaseAdmin
            .from("users")
            .select("id, incentive_amount")
            .eq("email", email)
            .single();

        if (userData?.id) {
            const updatedIncentives = {
                ...(userData.incentive_amount || {}),
                [periodStr]: am.finalIncentive,
            };
            await supabaseAdmin.from("users").update({ incentive_amount: updatedIncentives }).eq("id", userData.id);
        }

        return NextResponse.json({
            success: true,
            period: periodStr,
            incentive: {
                totalRenewals: am.totalRenewals,
                successfulRenewals: am.successfulRenewals,
                renewalRate: am.renewalRate,
                monthlyRevenueUSD: am.monthlyRevenueUSD,
                baseIncentive: am.baseIncentive,
                renewalMultiplier: am.renewalMultiplier,
                performanceBonus: am.performanceBonus,
                finalIncentive: am.finalIncentive,
                dailyRevenue: am.dailyRevenue,
            },
        });
    } catch (error: any) {
        console.error("Calculate Accounts Incentives Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
