export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseMain = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// const supabaseCRM = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL_CRM || 'https://placeholder.supabase.co',
//     process.env.SUPABASE_SERVICE_ROLE_KEY_CRM || 'placeholder'
// );

const supabaseJobBoard = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_JOB_BOARD || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_JOB_BOARD || 'placeholder'
);

const supabaseSkillPassport = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_SKILL_PASSPORT || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_SKILL_PASSPORT || 'placeholder'
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const month = searchParams.get("month"); // format: "2026-04"

        if (!email || !month) {
            return NextResponse.json({ error: "email and month are required" }, { status: 400 });
        }

        // Build month boundaries
        const [yearStr, monthStr] = month.split("-");
        const year = parseInt(yearStr);
        const mon = parseInt(monthStr);

        // Build exact IST timezone boundaries (+05:30) to prevent UTC Vercel spillover
        const startOfMonth = new Date(year, mon - 1, 1);
        const endOfMonth = new Date(year, mon, 0, 23, 59, 59, 999);
        const lastDay = endOfMonth.getDate();
        const startISO = `${year}-${String(mon).padStart(2, '0')}-01T00:00:00.000+05:30`;
        const endISO = `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:30`;

        // Period string like "April 2026"
        const periodStr = startOfMonth.toLocaleString("default", { month: "long", year: "numeric" });

        const startDateStr = `${year}-${String(mon).padStart(2, '0')}-01`;
        const endDateStr = `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const crmApiUrl = process.env.NEXT_PUBLIC_CRM_API_URL;

        // Run ALL queries in parallel
        const [
            userResult,
            settingsResult,
            incentiveResult,
            crmMonthSales,
            jbResult,
            spResult
        ] = await Promise.all([
            // 1. User joining date and role
            supabaseMain.from("users").select("created_at, role, designation").eq("email", email).single(),

            // 2. Marketing settings (rates)
            supabaseMain.from("marketing_settings").select("key, value").in("key", [
                "usd_to_inr_rate", "jb_rate_tier1", "jb_rate_tier2", "jb_rate_tier3", "sp_rate", "jb_custom_tiers", "influencer_paid_rate", "influencer_unpaid_rate",
                `usd_to_inr_rate_${periodStr}`, `jb_rate_tier1_${periodStr}`, `jb_rate_tier2_${periodStr}`, `jb_rate_tier3_${periodStr}`, `sp_rate_${periodStr}`, `jb_custom_tiers_${periodStr}`, `influencer_paid_rate_${periodStr}`, `influencer_unpaid_rate_${periodStr}`
            ]),

            // 3. Incentive record for this period
            supabaseMain.from("marketing_incentives").select("*").eq("email", email).eq("period", periodStr).single(),

            // 4. CRM Month Sales (Fetch from external CRM API)
            fetch(`${crmApiUrl}/api/incentive-data/all-sales?startDate=${startDateStr}T00:00:00&endDate=${endDateStr}T23:59:59&includeHistorical=true`, { cache: 'no-store' })
                .then(res => res.json())
                .then(data => ({ data: Array.isArray(data) ? data : data?.data || [] }))
                .catch(() => ({ data: [] })),

            // 5. Job Board — filter by created_at within the month at DB level
            supabaseJobBoard.from("jobboard_transactions")
                .select("jb_id, email, amount, payment_status, created_at, plan_id")
                .eq("payment_status", "success")
                .gte("created_at", startISO)
                .lte("created_at", endISO)
                .order("created_at", { ascending: false }),

            // 6. Skill Passport — filter by created_at within the month at DB level
            supabaseSkillPassport.from("paymentssupertable")
                .select("lead_ref, full_name, email, amount, currency, payment_status, created_at")
                .eq("payment_status", "completed")
                .gte("created_at", startISO)
                .lte("created_at", endISO)
                .order("created_at", { ascending: false })
        ]);

        // 7. Process Influencer Sales from already fetched CRM data
        let influencerPaidSales: any[] = [];
        let influencerUnpaidSales: any[] = [];
        const influencerAllSales = crmMonthSales.data || [];
        const seenPaid = new Set<string>();
        const seenUnpaid = new Set<string>();
        for (const sale of influencerAllSales) {
            if (!sale.lead_id) continue;
            const status = (sale.influencer_paid_status || '').toLowerCase();
            if (status === 'paid') {
                if (!seenPaid.has(sale.lead_id)) {
                    seenPaid.add(sale.lead_id);
                    influencerPaidSales.push(sale);
                }
            } else if (status === 'unpaid') {
                if (!seenUnpaid.has(sale.lead_id)) {
                    seenUnpaid.add(sale.lead_id);
                    influencerUnpaidSales.push(sale);
                }
            }
        }
        influencerPaidSales.sort((a, b) => new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime());
        influencerUnpaidSales.sort((a, b) => new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime());

        // Check user eligibility (Exclude heads from PAYOUTS, but allow viewing if they are a Head)
        const uRole = (userResult.data?.role || "").toLowerCase();
        const uDesig = (userResult.data?.designation || "").toLowerCase();
        const isHead = uRole.includes("marketing head") || uDesig.includes("marketing head");
        const userJoinDate = userResult.data?.created_at ? new Date(userResult.data.created_at) : new Date("2000-01-01");

        // Payout eligibility (heads don't get payouts)
        const payoutEligible = userJoinDate <= endOfMonth && !isHead;

        // If not payout eligible AND not a head, return empty (standard user check)
        if (!payoutEligible && !isHead) {
            return NextResponse.json({
                success: true,
                eligible: false,
                freshSales: [],
                jobBoardSales: [],
                skillPassportSales: [],
                incentiveData: null,
                rates: null
            });
        }

        // Process settings/rates
        let rates = {
            conversionRate: 85,
            jbTier1: 30,
            jbTier2: 35,
            jbTier3: 40,
            spRate: 30,
            influencerPaidRate: 1.5,
            influencerUnpaidRate: 3,
            customTiers: [] as any[]
        };

        if (settingsResult.data) {
            const map = settingsResult.data.reduce((acc: any, curr: any) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, string>);

            const customTiersStr = map[`jb_custom_tiers_${periodStr}`] || map["jb_custom_tiers"] || "[]";
            let customTiers: any[] = [];
            try { customTiers = JSON.parse(customTiersStr); } catch (e) { }

            rates = {
                conversionRate: parseFloat(map[`usd_to_inr_rate_${periodStr}`] || map["usd_to_inr_rate"] || "85"),
                jbTier1: parseFloat(map[`jb_rate_tier1_${periodStr}`] || map["jb_rate_tier1"] || "30"),
                jbTier2: parseFloat(map[`jb_rate_tier2_${periodStr}`] || map["jb_rate_tier2"] || "35"),
                jbTier3: parseFloat(map[`jb_rate_tier3_${periodStr}`] || map["jb_rate_tier3"] || "40"),
                spRate: parseFloat(map[`sp_rate_${periodStr}`] || map["sp_rate"] || "30"),
                influencerPaidRate: parseFloat(map[`influencer_paid_rate_${periodStr}`] || map["influencer_paid_rate"] || "1.5"),
                influencerUnpaidRate: parseFloat(map[`influencer_unpaid_rate_${periodStr}`] || map["influencer_unpaid_rate"] || "3"),
                customTiers
            };
        }

        // Process CRM fresh sales — logic removed as per user request
        const freshSales: any[] = [];

        // Process Job Board — deduplicate by jb_id
        const jbRaw = jbResult.data || [];
        const uniqueJb = new Map<string, any>();
        jbRaw.forEach((sale: any) => {
            if (!sale.jb_id) return;
            if (!uniqueJb.has(sale.jb_id)) {
                uniqueJb.set(sale.jb_id, sale);
            }
        });
        const jobBoardSales = Array.from(uniqueJb.values());

        // Process Skill Passport — deduplicate by lead_ref
        const spRaw = spResult.data || [];
        const uniqueSp = new Map<string, any>();
        spRaw.forEach((sale: any) => {
            if (!sale.lead_ref) return;
            if (!uniqueSp.has(sale.lead_ref)) {
                uniqueSp.set(sale.lead_ref, sale);
            }
        });
        const skillPassportSales = Array.from(uniqueSp.values());

        return NextResponse.json({
            success: true,
            eligible: payoutEligible,
            freshSales,
            jobBoardSales,
            skillPassportSales,
            influencerPaidSales,
            influencerUnpaidSales,
            incentiveData: incentiveResult.data || null,
            rates
        });

    } catch (error: any) {
        console.error("Marketing data error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
