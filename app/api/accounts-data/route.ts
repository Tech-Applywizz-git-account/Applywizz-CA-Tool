export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Default slab rules
const defaultSlabRules = [
    { min: 20000, max: 999999, incentive: 74000 },
    { min: 18000, max: 19999, incentive: 58000 },
    { min: 16000, max: 17999, incentive: 47000 },
    { min: 14000, max: 15999, incentive: 38000 },
    { min: 12000, max: 13999, incentive: 31000 },
    { min: 10000, max: 11999, incentive: 25000 },
    { min: 7000, max: 9999, incentive: 18000 },
    { min: 5000, max: 6999, incentive: 14000 },
    { min: 4000, max: 4999, incentive: 9000 },
    { min: 0, max: 3999, incentive: 0 },
];

const defaultMultipliers = [
    { min: 100, max: 999, multiplier: 2 },
    { min: 90, max: 99, multiplier: 1.75 },
    { min: 80, max: 89, multiplier: 1.5 },
    { min: 70, max: 79, multiplier: 1.2 },
    { min: 60, max: 69, multiplier: 1 },
    { min: 50, max: 59, multiplier: 0.75 },
    { min: 0, max: 49, multiplier: 0 },
];

const defaultPerformanceBonuses = [
    { days: 3, threshold: 2000, bonus: 10000 },
    { days: 7, threshold: 1000, bonus: 5000 },
    { days: 10, threshold: 500, bonus: 2000 },
];

const calculateBaseIncentive = (revenue: number, slabs: any[]) => {
    for (const rule of slabs) {
        if (revenue >= rule.min && revenue <= rule.max) return rule.incentive;
    }
    return 0;
};

const getRenewalMultiplier = (rate: number, multipliers: any[]) => {
    const sorted = [...multipliers].sort((a, b) => b.min - a.min);
    for (const m of sorted) {
        if (rate >= m.min && rate <= m.max) return m.multiplier;
    }
    return 0;
};

const calculatePerformanceBonus = (dailyRevenue: Record<string, number>, bonusRules: any[]) => {
    let totalBonus = 0;
    // Sort by bonus descending so highest applies first
    const sorted = [...bonusRules].sort((a, b) => b.bonus - a.bonus);
    for (const rule of sorted) {
        const qualifyingDays = Object.values(dailyRevenue).filter(v => v >= rule.threshold).length;
        if (qualifyingDays >= rule.days) {
            totalBonus = Math.max(totalBonus, rule.bonus);
        }
    }
    return totalBonus;
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email"); // Optional: filter for single AM
        const month = searchParams.get("month") || String(new Date().getMonth() + 1);
        const year = searchParams.get("year") || String(new Date().getFullYear());

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
        const periodStr = new Date(yearNum, monthNum - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });

        // Next month info for "upcoming renewals" section
        const nextMonthDate = new Date(yearNum, monthNum, 1); // monthNum is already 1-based, so this = next month
        const nextMonthNum = nextMonthDate.getMonth() + 1;
        const nextYearNum = nextMonthDate.getFullYear();

        const crmApiUrl = (process.env.NEXT_PUBLIC_CRM_API_URL || "").replace(/^"|"$/g, '');
        if (!crmApiUrl) {
            return NextResponse.json({ success: false, error: "CRM API URL not configured" }, { status: 500 });
        }

        // Date range: 2025-01-01 to current date + 140 days
        const fetchStartDate = "2025-01-01T00:00:00";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 140);
        const fetchEndDate = futureDate.toISOString().split("T")[0] + "T23:59:59";

        // Fetch in parallel: users, settings, CRM renewals
        const [usersResult, settingsResult, crmResponse] = await Promise.all([
            supabaseAdmin.from("users").select("id, email, name, role, isactive, incentive_amount, designation")
                .in("role", ["Accounts Associate"]),
            supabaseAdmin.from("accounts_settings").select("key, value"),
            fetch(`${crmApiUrl}/api/renewals?startDate=${fetchStartDate}&endDate=${fetchEndDate}`, { cache: 'no-store' })
                .then(res => res.json())
                .catch(() => ({ success: false, data: [] })),
        ]);

        if (usersResult.error) throw new Error("Failed to fetch accounts users");

        const users = usersResult.data || [];
        const allRecords = crmResponse?.success ? (crmResponse.data || []) : [];

        // Parse settings
        const settingsMap: Record<string, string> = {};
        (settingsResult.data || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

        let slabRules = defaultSlabRules;
        let multipliers = defaultMultipliers;
        let performanceBonuses = defaultPerformanceBonuses;

        // Check for period-specific overrides first, then global
        const getSettingValue = (baseKey: string) => {
            return settingsMap[`${baseKey}_${periodStr}`] || settingsMap[baseKey];
        };

        try {
            const sr = getSettingValue("am_slab_rules");
            if (sr) slabRules = JSON.parse(sr);
        } catch { }
        try {
            const mr = getSettingValue("am_renewal_multipliers");
            if (mr) multipliers = JSON.parse(mr);
        } catch { }
        try {
            const pb = getSettingValue("am_performance_bonuses");
            if (pb) performanceBonuses = JSON.parse(pb);
        } catch { }

        // ─── STEP 1: Group all CRM records by lead_id ───
        // Each lead_id is a unique client. Multiple records = first purchase + subsequent renewals.
        const recordsByLeadId: Record<string, any[]> = {};
        allRecords.forEach((record: any) => {
            const leadId = (record.lead_id || record.awl_id || "").trim();
            if (!leadId) return;
            if (!recordsByLeadId[leadId]) recordsByLeadId[leadId] = [];
            recordsByLeadId[leadId].push(record);
        });

        // Sort each client's records chronologically by closed_at
        Object.values(recordsByLeadId).forEach((records) => {
            records.sort((a: any, b: any) => new Date(a.closed_at || 0).getTime() - new Date(b.closed_at || 0).getTime());
        });

        // ─── STEP 2: Build renewal targets for each AM ───
        // For each client record, calculate the Expected Renewal Date.
        // If that date falls in our target month → the client is "Due for Renewal".
        // Then check if the SAME lead_id has a newer record → "Successful Renewal".

        const amMetrics: Record<string, any> = {};

        users.forEach((user: any) => {
            amMetrics[user.email.toLowerCase()] = {
                email: user.email,
                name: user.name,
                id: user.id,
                isactive: user.isactive,
                role: user.role,
                incentive_amount: user.incentive_amount,
                totalRenewals: 0,         // Total clients due for renewal this month
                successfulRenewals: 0,     // Clients who actually renewed (have a newer record)
                failedRenewals: 0,         // Clients who haven't renewed yet
                monthlyRevenueUSD: 0,      // Revenue from successful renewals only
                renewalRate: 0,
                dailyRevenue: {} as Record<string, number>,
                baseIncentive: 0,
                renewalMultiplier: 0,
                performanceBonus: 0,
                finalIncentive: 0,
                renewals: [] as any[],                    // Successful renewal records
                dueThisMonth: [] as any[],                // All clients due this month (with status)
                dueNextMonth: [] as any[],                // All clients due next month (preview)
            };
        });

        // Process each lead_id's record chain
        Object.entries(recordsByLeadId).forEach(([leadId, records]) => {
            // Walk through each record and calculate expected renewal date
            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                const amEmail = (record.account_manager_email || "").toLowerCase();
                if (!amMetrics[amEmail]) continue;

                const serviceStart = record.service_start_date ? new Date(record.service_start_date) : (record.closed_at ? new Date(record.closed_at) : null);
                if (!serviceStart) continue;

                const cycleDays = Number(record.subscription_cycle) || 0;
                const extDays = Number(record.renewal_extension_days) || 0;

                if (cycleDays === 0) continue; // Skip records without a subscription cycle

                const expectedRenewalDate = new Date(serviceStart.getTime() + (cycleDays + extDays) * 24 * 60 * 60 * 1000);
                const expMonth = expectedRenewalDate.getMonth() + 1;
                const expYear = expectedRenewalDate.getFullYear();

                // Check if this record's renewal falls in the TARGET month
                const isDueThisMonth = (expMonth === monthNum && expYear === yearNum);
                // Check if this record's renewal falls in the NEXT month
                const isDueNextMonth = (expMonth === nextMonthNum && expYear === nextYearNum);

                // Does this lead_id have a NEWER record after this one? That means they renewed.
                const hasRenewalRecord = (i + 1) < records.length;
                const renewalRecord = hasRenewalRecord ? records[i + 1] : null;

                // Check if the renewal record's closed_at falls within the TARGET month
                // A renewal only counts as "successful" for this month if the payment was made this month
                let renewedInTargetMonth = false;
                if (hasRenewalRecord && renewalRecord?.closed_at) {
                    const closedDate = new Date(renewalRecord.closed_at);
                    renewedInTargetMonth = (closedDate.getMonth() + 1 === monthNum && closedDate.getFullYear() === yearNum);
                }

                // Build the due entry info
                const dueEntry = {
                    lead_id: leadId,
                    lead_name: record.lead_name || "",
                    awl_id: record.awl_id || leadId,
                    account_manager_email: record.account_manager_email,
                    service_start_date: record.service_start_date,
                    subscription_cycle: cycleDays,
                    renewal_extension_days: extDays,
                    expected_renewal_date: expectedRenewalDate.toISOString(),
                    original_sale_value: Number(record.application_sale_value) || 0,
                    renewed: renewedInTargetMonth,
                    renewal_sale_value: renewalRecord ? (Number(renewalRecord.application_sale_value) || 0) : 0,
                    renewal_closed_at: renewalRecord ? renewalRecord.closed_at : null,
                };

                if (isDueThisMonth) {
                    amMetrics[amEmail].dueThisMonth.push(dueEntry);
                    amMetrics[amEmail].totalRenewals += 1;

                    if (renewedInTargetMonth) {
                        // Successful renewal — closed_at is in the target month, so revenue counts
                        amMetrics[amEmail].successfulRenewals += 1;
                        const renewalValue = Number(renewalRecord!.application_sale_value) || 0;
                        amMetrics[amEmail].monthlyRevenueUSD += renewalValue;
                        amMetrics[amEmail].renewals.push({
                            ...renewalRecord,
                            _renewalOf: leadId,
                            _expectedDate: expectedRenewalDate.toISOString(),
                        });

                        // Track daily revenue based on when the renewal payment was closed
                        const dayKey = new Date(renewalRecord!.closed_at).toISOString().split("T")[0];
                        amMetrics[amEmail].dailyRevenue[dayKey] = (amMetrics[amEmail].dailyRevenue[dayKey] || 0) + renewalValue;
                    } else {
                        amMetrics[amEmail].failedRenewals += 1;
                    }
                }

                if (isDueNextMonth) {
                    amMetrics[amEmail].dueNextMonth.push(dueEntry);
                }
            }
        });

        // ─── STEP 3: Calculate incentives for each AM ───
        Object.values(amMetrics).forEach((am: any) => {
            // Deduplicate due lists by lead_id (keep renewed if any)
            const deduplicate = (items: any[]) => {
                const unique: Record<string, any> = {};
                items.forEach((d: any) => {
                    const existing = unique[d.lead_id];
                    if (!existing || (!existing.renewed && d.renewed)) {
                        unique[d.lead_id] = d;
                    }
                });
                return Object.values(unique);
            };
            
            am.dueThisMonth = deduplicate(am.dueThisMonth);
            am.dueNextMonth = deduplicate(am.dueNextMonth);
            
            // Recalculate counts
            am.totalRenewals = am.dueThisMonth.length;
            am.successfulRenewals = am.dueThisMonth.filter((d: any) => d.renewed).length;
            am.failedRenewals = am.totalRenewals - am.successfulRenewals;

            // Renewal rate
            am.renewalRate = am.totalRenewals > 0
                ? parseFloat(((am.successfulRenewals / am.totalRenewals) * 100).toFixed(2))
                : 0;

            // Base incentive from revenue slab
            am.baseIncentive = calculateBaseIncentive(am.monthlyRevenueUSD, slabRules);

            // Renewal multiplier
            am.renewalMultiplier = getRenewalMultiplier(am.renewalRate, multipliers);

            // Performance bonus
            am.performanceBonus = calculatePerformanceBonus(am.dailyRevenue, performanceBonuses);

            // Final incentive
            if (am.renewalMultiplier === 0) {
                am.finalIncentive = 0; // No incentive below 50% renewal rate
                am.performanceBonus = 0; // No bonus either
            } else {
                am.finalIncentive = Math.round((am.baseIncentive * am.renewalMultiplier) + am.performanceBonus);
            }
        });

        // If single email requested, filter
        let result = Object.values(amMetrics);
        if (email) {
            result = result.filter((am: any) => am.email.toLowerCase() === email.toLowerCase());
        }

        return NextResponse.json({
            success: true,
            period: periodStr,
            startDate,
            endDate,
            accountManagers: result,
            config: { slabRules, multipliers, performanceBonuses },
        });
    } catch (error: any) {
        console.error("Accounts Data Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
