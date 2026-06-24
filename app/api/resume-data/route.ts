export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseMain = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const supabaseCrm = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_CRM || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY_CRM || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_CRM || ''
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const month = searchParams.get("month"); // format: "2026-04"

        if (!email || !month) {
            return NextResponse.json({ error: "email and month are required" }, { status: 400 });
        }

        const [yearStr, monthStr] = month.split("-");
        const year = parseInt(yearStr);
        const mon = parseInt(monthStr);
        const startOfMonth = new Date(year, mon - 1, 1);
        const endOfMonth = new Date(year, mon, 0, 23, 59, 59, 999);
        const startISO = startOfMonth.toISOString();
        const endISO = endOfMonth.toISOString();

        const periodStr = startOfMonth.toLocaleString("default", { month: "long", year: "numeric" });

        const [userResult, settingsResult, incentiveResult, crmResult] = await Promise.all([
            supabaseMain.from("users").select("created_at").eq("email", email).single(),
            supabaseMain.from("resume_settings").select("key, value"),
            supabaseMain.from("resume_incentives").select("*").eq("email", email).eq("period", periodStr).single(),
            supabaseCrm.from("resume_progress")
                .select("id, lead_id, status, assigned_to_email, assigned_to_name, updated_at")
                .ilike("assigned_to_email", email)
                .gte("updated_at", startISO)
                .lte("updated_at", endISO)
                .eq("status", "completed")
                .order("updated_at", { ascending: false })
        ]);

        const queryStartOfMonth = new Date(year, mon - 2, 1);
        const queryEndOfMonth = new Date(year, mon + 1, 0, 23, 59, 59, 999);
        const queryStartISO = queryStartOfMonth.toISOString();
        const queryEndISO = queryEndOfMonth.toISOString();

        // Fetch forage job simulation sales from CRM via API
        let forageSalesRaw: any[] = [];
        const crmApiUrl = (process.env.NEXT_PUBLIC_CRM_SYNC_URL || process.env.NEXT_PUBLIC_CRM_API_URL || "").replace(/^"|"$/g, '');
        try {
            const forageRes = await fetch(`${crmApiUrl}/api/forage-sales?startDate=${queryStartISO}&endDate=${queryEndISO}&start_date=${queryStartISO}&end_date=${queryEndISO}&paidOnly=true`);
            if (forageRes.ok) {
                const forageJson = await forageRes.json();
                if (forageJson.success) forageSalesRaw = forageJson.data || [];
            }
        } catch (e) {
            console.error("Failed to fetch forage sales from CRM", e);
        }

        const userJoinDate = userResult.data?.created_at ? new Date(userResult.data.created_at) : new Date("2000-01-01");
        const eligible = userJoinDate <= endOfMonth;

        if (!eligible) {
            return NextResponse.json({
                success: true,
                eligible: false,
                completedResumesList: [],
                incentiveData: null,
                rates: null,
            });
        }

        let resumeRate = 80;
        const getSetting = (key: string, defVal: number) => {
            if (!settingsResult.data) return defVal;
            const specific = settingsResult.data.find((s: any) => s.key === `${key}_${periodStr}`);
            const global = settingsResult.data.find((s: any) => s.key === key);
            if (specific?.value) return parseFloat(specific.value);
            if (global?.value) return parseFloat(global.value);
            return defVal;
        };
        resumeRate = getSetting("resume_rate", 80);
        const baseTier1 = getSetting("forage_base_1_usd", 30);
        const baseTier2 = getSetting("forage_base_2_usd", 50);
        const baseTier3 = getSetting("forage_base_3_usd", 100);
        const baseTier4 = getSetting("forage_base_4_usd", 120);
        const forageBaseIncentiveUsd = getSetting("forage_base_incentive_usd", 3);
        const forageTeamSplitUsd = getSetting("forage_team_split_usd", 2);
        const forageUsdToInr = getSetting("forage_usd_to_inr", 85);
        const ms1Usd = getSetting("forage_milestone_1_usd", 1000);
        const ms1Inr = getSetting("forage_milestone_1_inr", 1500);
        const ms2Usd = getSetting("forage_milestone_2_usd", 1500);
        const ms2Inr = getSetting("forage_milestone_2_inr", 3000);
        const ms3Usd = getSetting("forage_milestone_3_usd", 2000);
        const ms3Inr = getSetting("forage_milestone_3_inr", 4500);

        // Filter forage sales for this user
        const forageSalesList = (forageSalesRaw || []).filter((sale: any) => {
            if (!sale.forage_info || !sale.forage_info[0]) return false;
            const sellerEmailRaw = sale.forage_info[0].forage_sold_by_email?.toLowerCase();
            if (!sellerEmailRaw) return false;
            const targetEmail = email.toLowerCase();
            const isMatch = sellerEmailRaw === targetEmail ||
                sellerEmailRaw === targetEmail.replace('@applywizz.com', '@applywizz.ai') ||
                sellerEmailRaw === targetEmail.replace('@applywizz.ai', '@applywizz.com');
            if (!isMatch) return false;

            const saleDateRaw = sale.forage_info[0].forage_sold_ts || sale.closed_at || sale.created_at;
            if (!saleDateRaw) return false;
            const saleDate = new Date(saleDateRaw);
            return !isNaN(saleDate.getTime()) && saleDate >= startOfMonth && saleDate <= endOfMonth;
        }).map((sale: any) => {
            const fInfo = sale.forage_info[0];
            const certs = parseInt(sale.forage_internship_certification || fInfo.forage_internship_certification || "0");
            const soldValue = parseFloat(fInfo.forage_sold_value || sale.forage_internship_sale_value || "0");

            let baseTargetPrice = baseTier1;
            if (certs === 2) baseTargetPrice = baseTier2;
            else if (certs === 3) baseTargetPrice = baseTier3;
            else if (certs >= 4) baseTargetPrice = baseTier4;

            const isDiscounted = soldValue < baseTargetPrice;

            // Calculate incentive for this specific row
            let incentiveUsd = 0;
            if (!isDiscounted && soldValue > 0) {
                const extra = soldValue - baseTargetPrice;
                const upsell = Math.floor(extra / 10) * 1;
                incentiveUsd = forageBaseIncentiveUsd + upsell;
            }

            return {
                id: sale.id,
                lead_id: sale.lead_id,
                lead_name: sale.lead_name || sale.lead_id,
                certs,
                sold_value_usd: soldValue,
                base_price_usd: baseTargetPrice,
                is_discounted: isDiscounted,
                earned_incentive_usd: incentiveUsd,
                closed_at: fInfo.forage_sold_ts || sale.closed_at || sale.created_at,
            };
        });

        return NextResponse.json({
            success: true,
            eligible: true,
            completedResumesList: crmResult.data || [],
            forageSalesList,
            incentiveData: incentiveResult.data || null,
            rates: {
                resumeRate,
                baseTiers: [baseTier1, baseTier2, baseTier3, baseTier4],
                forageBaseIncentiveUsd,
                forageTeamSplitUsd,
                forageUsdToInr,
                milestones: [
                    { targetUsd: ms1Usd, bonusInr: ms1Inr },
                    { targetUsd: ms2Usd, bonusInr: ms2Inr },
                    { targetUsd: ms3Usd, bonusInr: ms3Inr },
                ]
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
