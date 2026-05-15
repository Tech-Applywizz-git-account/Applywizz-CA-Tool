export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// CRM Supabase Client for direct sales data
const supabaseCRM = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_CRM || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY_CRM || 'placeholder'
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const periodParam = searchParams.get("period");
        const targetDate = periodParam ? new Date(`1 ${periodParam}`) : new Date();
        const startTargetMonth = startOfMonth(targetDate);
        const endTargetMonth = endOfMonth(targetDate);
        const startISO = startTargetMonth.toISOString();
        const endISO = endTargetMonth.toISOString();
        const periodStr = format(startTargetMonth, "MMMM yyyy"); // e.g. "March 2026"

        const keysToFetch = [
            "usd_to_inr_rate", "jb_rate_tier1", "jb_rate_tier2", "jb_rate_tier3", "sp_rate", "jb_custom_tiers", "influencer_paid_rate", "influencer_unpaid_rate",
            `usd_to_inr_rate_${periodStr}`, `jb_rate_tier1_${periodStr}`, `jb_rate_tier2_${periodStr}`, `jb_rate_tier3_${periodStr}`, `sp_rate_${periodStr}`, `jb_custom_tiers_${periodStr}`, `influencer_paid_rate_${periodStr}`, `influencer_unpaid_rate_${periodStr}`
        ];

        const supabaseJobBoard = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL_JOB_BOARD || 'https://placeholder.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY_JOB_BOARD || 'placeholder'
        );

        const supabaseSkillPassport = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL_SKILL_PASSPORT || 'https://placeholder.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY_SKILL_PASSPORT || 'placeholder'
        );

        // --- 1. PARALLEL CORE FETCHING ---
        const startDateStr = `${format(startTargetMonth, 'yyyy-MM-dd')}`;
        const endDateStr = `${format(endTargetMonth, 'yyyy-MM-dd')}`;
        const crmApiUrl = process.env.NEXT_PUBLIC_CRM_API_URL;

        const [
            settingsResult,
            usersResult,
            crmSalesResult,
            jbMonthTransactions,
            spMonthPayments
        ] = await Promise.all([
            // Settings
            supabaseAdmin.from("marketing_settings").select("key, value").in("key", keysToFetch),

            // Users from main DB
            supabaseAdmin.from("users").select("id, email, role, isactive, department, created_at, incentive_amount, designation"),

            // CRM Month Sales (Fetch from external CRM API)
            fetch(`${crmApiUrl}/api/incentive-data/all-sales?startDate=${startDateStr}T00:00:00&endDate=${endDateStr}T23:59:59&includeHistorical=true`, { cache: 'no-store' })
                .then(res => res.json())
                .then(data => ({ data: Array.isArray(data) ? data : data?.data || [] }))
                .catch(() => ({ data: [] })),

            // Job Board Month Sales (Database Level Filter)
            supabaseJobBoard.from("jobboard_transactions").select("jb_id, amount, created_at").eq("payment_status", "success").gte("created_at", startISO).lte("created_at", endISO),

            // Skill Passport Month Sales (Database Level Filter)
            supabaseSkillPassport.from("paymentssupertable").select("lead_ref, created_at").eq("payment_status", "completed").gte("created_at", startISO).lte("created_at", endISO)
        ]);

        if (usersResult.error || !usersResult.data) throw new Error("Failed to fetch marketing users");
        if (settingsResult.error) throw new Error("Failed to fetch settings");

        const settingsMap = settingsResult.data.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const conversionRate = parseFloat(settingsMap[`usd_to_inr_rate_${periodStr}`] || settingsMap["usd_to_inr_rate"] || "85");
        const jbTier1Rate = parseFloat(settingsMap[`jb_rate_tier1_${periodStr}`] || settingsMap["jb_rate_tier1"] || "30");
        const jbTier2Rate = parseFloat(settingsMap[`jb_rate_tier2_${periodStr}`] || settingsMap["jb_rate_tier2"] || "35");
        const jbTier3Rate = parseFloat(settingsMap[`jb_rate_tier3_${periodStr}`] || settingsMap["jb_rate_tier3"] || "40");
        const spRateInr = parseFloat(settingsMap[`sp_rate_${periodStr}`] || settingsMap["sp_rate"] || "30");
        const influencerPaidRate = parseFloat(settingsMap[`influencer_paid_rate_${periodStr}`] || settingsMap["influencer_paid_rate"] || "1.5");
        const influencerUnpaidRate = parseFloat(settingsMap[`influencer_unpaid_rate_${periodStr}`] || settingsMap["influencer_unpaid_rate"] || "3");

        // Filter valid marketing users
        const marketingTeam = usersResult.data.filter(u => {
            const isMarketingDept = u.department?.toLowerCase() === 'marketing';
            const hasMarketingRole = u.role?.toLowerCase().includes('marketing');
            const isActive = u.isactive === true;
            if (!isActive || (!isMarketingDept && !hasMarketingRole)) return false;

            // Strictly filter out trainees and HEADS from the shared equity pool
            const r = (u.role || "").toLowerCase();
            const d = (u.designation || "").toLowerCase();
            const isTrainee = r.includes("trainee") || d.includes("trainee") || r === "bdt-p" || d === "bdt-p";
            const isHead = r.includes("marketing head") || d.includes("marketing head");

            if (isTrainee || isHead) return false;

            const userJoinDate = u.created_at ? new Date(u.created_at) : new Date("2000-01-01");
            return userJoinDate <= endTargetMonth;
        });

        const teamSize = marketingTeam.length;
        if (teamSize === 0) {
            return NextResponse.json({ success: true, message: "No active marketing users found.", data: [] });
        }

        // --- 2. FRESH SALES VERIFICATION ---
        // A sale is "fresh" if it's the FIRST sale for that lead_id ever.
        const allFetchedSales = crmSalesResult.data || [];
        const currentMonthSales = allFetchedSales.filter((s: any) => parseFloat(s.sale_value || s.application_sale_value || '0') > 0);
        const uniqueLeadIdsInMonth = Array.from(new Set(currentMonthSales.map((s: any) => s.lead_id)));

        // Historical Audit: Check for ANY prior sales for these lead_ids
        let leadsWithPriorHistory = new Set<string>();
        if (uniqueLeadIdsInMonth.length > 0) {
            const { data: historicalData } = await supabaseCRM.from("sales_closure")
                .select("lead_id")
                .in("lead_id", uniqueLeadIdsInMonth)
                .lt("closed_at", startISO);

            if (historicalData) {
                historicalData.forEach(h => leadsWithPriorHistory.add(h.lead_id));
            }
        }

        // Count as fresh if no prior history
        let freshSalesCount = 0;
        const processedLeadsInBatch = new Set();
        currentMonthSales.forEach((sale: any) => {
            if (!leadsWithPriorHistory.has(sale.lead_id) && !processedLeadsInBatch.has(sale.lead_id)) {
                freshSalesCount++;
                processedLeadsInBatch.add(sale.lead_id);
            }
        });

        // --- 3. JB SALES CALCULATION ---
        const jbRaw = jbMonthTransactions.data || [];
        const uniqueJbSales = new Map();
        let totalJbRevenueUsd = 0;
        jbRaw.forEach((sale: any) => {
            if (!sale.jb_id) return;
            if (!uniqueJbSales.has(sale.jb_id)) {
                uniqueJbSales.set(sale.jb_id, sale);
                totalJbRevenueUsd += parseFloat(sale.amount || "0");
            }
        });
        const jobBoardSalesCount = uniqueJbSales.size;

        // Custom Tiers
        const customTiersStr = settingsMap[`jb_custom_tiers_${periodStr}`] || settingsMap["jb_custom_tiers"] || "[]";
        let customTiers: any[] = [];
        try { customTiers = JSON.parse(customTiersStr); } catch (e) { }

        const allTiers = [
            { threshold: 0, rate: jbTier1Rate },
            { threshold: 500, rate: jbTier2Rate },
            { threshold: 1000, rate: jbTier3Rate },
            ...customTiers.map(t => ({ threshold: parseInt(t.threshold), rate: parseFloat(t.rate) }))
        ].sort((a, b) => b.threshold - a.threshold);

        let jbSlabRateInr = jbTier1Rate;
        for (const tier of allTiers) {
            if (jobBoardSalesCount >= tier.threshold) {
                jbSlabRateInr = tier.rate;
                break;
            }
        }

        const totalJobBoardPoolInr = jobBoardSalesCount * jbSlabRateInr;
        const individualJobBoardInr = totalJobBoardPoolInr / teamSize;

        // --- 4. SKILL PASSPORT CALCULATION ---
        const spRaw = spMonthPayments.data || [];
        const uniqueSpSales = new Set(spRaw.map((s: any) => s.lead_ref).filter(Boolean));
        const skillPassportSalesCount = uniqueSpSales.size;
        const totalSkillPassportPoolInr = skillPassportSalesCount * spRateInr;
        const individualSkillPassportInr = totalSkillPassportPoolInr / teamSize;

        // --- 5. INFLUENCER SALES CALCULATION ---
        let influencerPaidCount = 0;
        let influencerUnpaidCount = 0;
        const influencerAllSales = allFetchedSales;
        const seenPaid = new Set<string>();
        const seenUnpaid = new Set<string>();
        for (const sale of influencerAllSales) {
            if (!sale.lead_id) continue;
            const status = (sale.influencer_paid_status || '').toLowerCase();
            if (status === 'paid' && !seenPaid.has(sale.lead_id)) {
                seenPaid.add(sale.lead_id);
                influencerPaidCount++;
            } else if (status === 'unpaid' && !seenUnpaid.has(sale.lead_id)) {
                seenUnpaid.add(sale.lead_id);
                influencerUnpaidCount++;
            }
        }

        const influencerPoolUsd = (influencerPaidCount * influencerPaidRate) + (influencerUnpaidCount * influencerUnpaidRate);
        const influencerPoolInr = influencerPoolUsd * conversionRate;
        const individualInfluencerInr = influencerPoolInr / teamSize;

        // --- 6. CLEANUP STALE RECORDS ---
        // Delete any existing records for this period that are NOT in the current marketingTeam
        const activeEmails = marketingTeam.map(u => u.email);
        if (activeEmails.length > 0) {
            await supabaseAdmin
                .from("marketing_incentives")
                .delete()
                .eq("period", periodStr)
                .not("email", "in", activeEmails);
        } else {
            await supabaseAdmin
                .from("marketing_incentives")
                .delete()
                .eq("period", periodStr);
        }

        // --- 7. SUMMARIZE & SAVE ---
        const totalPoolUsd = freshSalesCount * 3;
        const individualShareUsd = totalPoolUsd / teamSize;
        const individualShareInr = individualShareUsd * conversionRate;

        const upsertData = marketingTeam.map(user => ({
            email: user.email,
            period: periodStr,
            total_fresh_sales: freshSalesCount,
            marketing_team_size: teamSize,
            applywizz_incentive_usd: individualShareUsd,
            conversion_rate: conversionRate,
            applywizz_incentive_inr: individualShareInr,
            job_board_fresh_sales: jobBoardSalesCount,
            job_board_revenue_usd: totalJbRevenueUsd,
            job_board_pool_inr: totalJobBoardPoolInr,
            job_board_incentive_inr: individualJobBoardInr,
            skill_passport_fresh_sales: skillPassportSalesCount,
            skill_passport_pool_inr: totalSkillPassportPoolInr,
            skill_passport_incentive_inr: individualSkillPassportInr,
            influencer_paid_count: influencerPaidCount,
            influencer_unpaid_count: influencerUnpaidCount,
            influencer_pool_usd: influencerPoolUsd,
            influencer_pool_inr: influencerPoolInr,
            influencer_incentive_inr: individualInfluencerInr,
            last_updated: new Date().toISOString()
        }));

        // Batch upsert incentives
        const { error: upsertError } = await supabaseAdmin
            .from("marketing_incentives")
            .upsert(upsertData, { onConflict: "email, period" });

        if (upsertError) throw new Error("Upsert Failed: " + upsertError.message);

        // Parallel update user profiles
        await Promise.all(marketingTeam.map(user => {
            const totalMktIncentive = individualShareInr + individualJobBoardInr + individualSkillPassportInr + individualInfluencerInr;
            const updatedIncentives = {
                ...(user.incentive_amount || {}),
                [periodStr]: totalMktIncentive
            };
            return supabaseAdmin.from("users").update({ incentive_amount: updatedIncentives }).eq("id", user.id);
        }));

        return NextResponse.json({
            success: true,
            period: periodStr,
            teamSize,
            applyWizz: { freshSalesCount, individualInr: individualShareInr },
            jobBoard: { salesCount: jobBoardSalesCount, individualInr: individualJobBoardInr },
            skillPassport: { salesCount: skillPassportSalesCount, individualInr: individualSkillPassportInr },
            influencer: { paidCount: influencerPaidCount, unpaidCount: influencerUnpaidCount, poolUsd: influencerPoolUsd, poolInr: influencerPoolInr, individualInr: individualInfluencerInr, paidRate: influencerPaidRate, unpaidRate: influencerUnpaidRate },
            totalIndividualInr: individualShareInr + individualJobBoardInr + individualSkillPassportInr + individualInfluencerInr
        });

    } catch (error: any) {
        console.error("Marketing Calculation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
