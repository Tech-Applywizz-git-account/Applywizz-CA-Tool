export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Default slab rules (combined revenue)
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
    { min: 3000, max: 3999, incentive: 5500 },
    { min: 0, max: 2999, incentive: 0 },
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
    // Sort descending by min to create a continuous step function, ignoring gaps in 'max'
    const sorted = [...slabs].sort((a, b) => b.min - a.min);
    for (const rule of sorted) {
        if (revenue >= rule.min) return rule.incentive;
    }
    return 0;
};

const getRenewalMultiplier = (rate: number, multipliers: any[]) => {
    // Math.round fixes near-boundary decimal issues (e.g. 68.97% becomes 69% if needed, but rounding normally helps match user intuition)
    const roundedRate = Math.round(rate);
    // Sort descending by min to create a continuous step function
    const sorted = [...multipliers].sort((a, b) => b.min - a.min);
    for (const m of sorted) {
        if (roundedRate >= m.min) return m.multiplier;
    }
    return 0;
};

const calculatePerformanceBonus = (dailyRevenue: Record<string, number>, bonusRules: any[]) => {
    let totalBonus = 0;
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
        const email = searchParams.get("email");
        const month = searchParams.get("month") || String(new Date().getMonth() + 1);
        const year = searchParams.get("year") || String(new Date().getFullYear());

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
        const periodStr = new Date(yearNum, monthNum - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });

        // Next month info for "upcoming renewals" section
        const nextMonthDate = new Date(yearNum, monthNum, 1);
        const nextMonthNum = nextMonthDate.getMonth() + 1;
        const nextYearNum = nextMonthDate.getFullYear();

        const crmApiUrl = (process.env.NEXT_PUBLIC_CRM_API_URL || "").replace(/^"|"$/g, '');
        if (!crmApiUrl) {
            return NextResponse.json({ success: false, error: "CRM API URL not configured" }, { status: 500 });
        }

        // Date range for renewals: 2025-01-01 to current date + 140 days
        const fetchStartDate = "2025-01-01T00:00:00";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 140);
        const fetchEndDate = futureDate.toISOString().split("T")[0] + "T23:59:59";

        // Sales date range for the target month
        const salesStartDate = `${startDate}T00:00:00`;
        const salesEndDate = `${endDate}T23:59:59`;

        // Fetch in parallel: users, settings, CRM renewals, CRM all-sales
        const [usersResult, settingsResult, crmRenewalsResponse, crmSalesResponse] = await Promise.all([
            supabaseAdmin.from("users").select("id, email, name, role, isactive, incentive_amount, designation")
                .in("role", ["Accounts Associate"]),
            supabaseAdmin.from("accounts_settings").select("key, value"),
            fetch(`${crmApiUrl}/api/renewals?startDate=${fetchStartDate}&endDate=${fetchEndDate}`, { cache: 'no-store' })
                .then(res => res.json())
                .catch(() => ({ success: false, data: [] })),
            fetch(`${crmApiUrl}/api/incentive-data/all-sales?startDate=${salesStartDate}&endDate=${salesEndDate}`, { cache: 'no-store' })
                .then(res => res.json())
                .then(data => ({ success: true, data: Array.isArray(data) ? data : data?.data || [] }))
                .catch(() => ({ success: false, data: [] })),
        ]);

        if (usersResult.error) throw new Error("Failed to fetch accounts users");

        const users = usersResult.data || [];
        const allRenewalRecords = crmRenewalsResponse?.success ? (crmRenewalsResponse.data || []) : [];
        const allSalesRecords = crmSalesResponse?.data || [];

        // Parse settings
        const settingsMap: Record<string, string> = {};
        (settingsResult.data || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

        let slabRules = defaultSlabRules;
        let multipliers = defaultMultipliers;
        let performanceBonuses = defaultPerformanceBonuses;

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

        // ─── STEP 1: Group all CRM renewal records by lead_id ───
        const recordsByLeadId: Record<string, any[]> = {};
        allRenewalRecords.forEach((record: any) => {
            const leadId = (record.lead_id || record.awl_id || "").trim().toUpperCase();
            if (!leadId) return;
            if (!recordsByLeadId[leadId]) recordsByLeadId[leadId] = [];
            recordsByLeadId[leadId].push(record);
        });

        // Sort each client's records chronologically by closed_at
        Object.values(recordsByLeadId).forEach((records) => {
            records.sort((a: any, b: any) => new Date(a.closed_at || 0).getTime() - new Date(b.closed_at || 0).getTime());
        });

        // ─── STEP 2: Build metrics for each AM ───
        const amMetrics: Record<string, any> = {};

        users.forEach((user: any) => {
            amMetrics[user.email.toLowerCase()] = {
                email: user.email,
                name: user.name,
                id: user.id,
                isactive: user.isactive,
                role: user.role,
                incentive_amount: user.incentive_amount,
                // Renewal metrics
                totalRenewals: 0,
                successfulRenewals: 0,
                failedRenewals: 0,
                dueRenewalsPaid: 0,
                dueRenewalsUnpaid: 0,
                renewalRevenueUSD: 0,
                renewalRate: 0,
                dailyRenewalRevenue: {} as Record<string, number>,
                renewals: [] as any[],
                dueThisMonth: [] as any[],
                dueNextMonth: [] as any[],
                // Sales metrics
                salesRevenueUSD: 0,
                salesCount: 0,
                salesRecords: [] as any[],
                dailySalesRevenue: {} as Record<string, number>,
                // Combined metrics
                monthlyRevenueUSD: 0,
                dailyRevenue: {} as Record<string, number>,
                // Incentive
                baseIncentive: 0,
                renewalMultiplier: 0,
                performanceBonus: 0,
                finalIncentive: 0,
            };
        });

        // Helper functions for date matching
        const isTargetMonth = (dateStr: string | null | undefined) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && (d.getMonth() + 1 === monthNum) && (d.getFullYear() === yearNum);
        };

        const isNextMonth = (dateStr: string | null | undefined) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return !isNaN(d.getTime()) && (d.getMonth() + 1 === nextMonthNum) && (d.getFullYear() === nextYearNum);
        };

        const checkRenewed = (renewalRec: any, limitMonth: number, limitYear: number) => {
            if (!renewalRec || !renewalRec.closed_at) return false;
            const closedDate = new Date(renewalRec.closed_at);
            if (isNaN(closedDate.getTime())) return false;
            const closedYear = closedDate.getFullYear();
            const closedMonth = closedDate.getMonth() + 1;
            if (closedYear < limitYear) return true;
            if (closedYear === limitYear && closedMonth <= limitMonth) return true;
            return false;
        };

        // ─── STEP 2a (i): Process COMPLETED Renewals (closed_at in target month) ───
        allRenewalRecords.forEach((record: any) => {
            const closedAt = record.closed_at;
            if (!closedAt || !isTargetMonth(closedAt)) return;

            const amEmail = (record.account_manager_email || "").toLowerCase();
            if (!amMetrics[amEmail]) return;

            const renewalValue = Number(record.sale_value || record.application_sale_value) || 0;

            // Add to completed renewals array and revenue
            amMetrics[amEmail].renewalRevenueUSD += renewalValue;
            amMetrics[amEmail].renewals.push({
                ...record,
                application_sale_value: record.application_sale_value || record.sale_value || 0
            });

            // Track daily renewal revenue
            const dayKey = new Date(closedAt).toISOString().split("T")[0];
            amMetrics[amEmail].dailyRenewalRevenue[dayKey] = (amMetrics[amEmail].dailyRenewalRevenue[dayKey] || 0) + renewalValue;
        });

        // ─── STEP 2a (ii): Process DUE Renewals (extended_renewal_at in target/next month) ───
        Object.entries(recordsByLeadId).forEach(([leadId, records]) => {
            records.forEach((record, i) => {
                const amEmail = (record.account_manager_email || "").toLowerCase();
                if (!amMetrics[amEmail]) return;

                const extendedRenewalAt = record.extended_renewal_at;
                if (!extendedRenewalAt) return;

                const expectedRenewalDate = new Date(extendedRenewalAt);
                if (isNaN(expectedRenewalDate.getTime())) return;

                const isDueThisMonth = isTargetMonth(extendedRenewalAt);
                const isDueNextMonth = isNextMonth(extendedRenewalAt);

                if (!isDueThisMonth && !isDueNextMonth) return;

                // A renewal is completed if there is a subsequent record in the sorted array
                const renewalRecord = (i + 1) < records.length ? records[i + 1] : null;

                const cycleDays = Number(record.subscription_cycle) || 0;
                const extDays = Number(record.renewal_extension_days) || 0;

                if (isDueThisMonth) {
                    const renewedThis = checkRenewed(renewalRecord, monthNum, yearNum);
                    const dueEntry = {
                        lead_id: leadId,
                        lead_name: record.lead_name || "",
                        awl_id: record.awl_id || leadId,
                        account_manager_email: record.account_manager_email,
                        amName: amMetrics[amEmail].name,
                        service_start_date: record.service_start_date,
                        subscription_cycle: cycleDays,
                        renewal_extension_days: extDays,
                        expected_renewal_date: expectedRenewalDate.toISOString(),
                        original_sale_value: Number(record.sale_value || record.application_sale_value) || 0,
                        renewed: renewedThis,
                        renewal_sale_value: renewalRecord && renewedThis
                            ? (Number(renewalRecord.sale_value || renewalRecord.application_sale_value) || 0)
                            : 0,
                        renewal_closed_at: renewalRecord && renewedThis ? renewalRecord.closed_at : null,
                    };
                    amMetrics[amEmail].dueThisMonth.push(dueEntry);
                }

                if (isDueNextMonth) {
                    const renewedNext = checkRenewed(renewalRecord, nextMonthNum, nextYearNum);
                    const dueEntry = {
                        lead_id: leadId,
                        lead_name: record.lead_name || "",
                        awl_id: record.awl_id || leadId,
                        account_manager_email: record.account_manager_email,
                        service_start_date: record.service_start_date,
                        subscription_cycle: cycleDays,
                        amName: amMetrics[amEmail].name,
                        renewal_extension_days: extDays,
                        expected_renewal_date: expectedRenewalDate.toISOString(),
                        original_sale_value: Number(record.sale_value || record.application_sale_value) || 0,
                        renewed: renewedNext,
                        renewal_sale_value: renewalRecord && renewedNext
                            ? (Number(renewalRecord.sale_value || renewalRecord.application_sale_value) || 0)
                            : 0,
                        renewal_closed_at: renewalRecord && renewedNext ? renewalRecord.closed_at : null,
                    };
                    amMetrics[amEmail].dueNextMonth.push(dueEntry);
                }
            });
        });

        // ─── STEP 2b: Process SALES from all-sales API ───
        // Filter sales where the assigned AM (via renewals lead_id lookup or fallback to account_assigned_email) matches an AM and closed_at is in target month
        allSalesRecords.forEach((sale: any) => {
            const leadId = (sale.lead_id || sale.awl_id || "").trim().toUpperCase();
            let amEmail = "";

            // Try to resolve the Account Manager email from renewals records grouped by lead_id
            if (leadId && recordsByLeadId[leadId]) {
                const matchingRecord = recordsByLeadId[leadId].find(r => r.account_manager_email);
                if (matchingRecord) {
                    amEmail = matchingRecord.account_manager_email.toLowerCase().trim();
                }
            }

            // Fallback to account_assigned_email if not found in renewals database lookup
            if (!amEmail) {
                amEmail = (sale.account_assigned_email || "").toLowerCase().trim();
            }

            if (!amMetrics[amEmail]) return;

            // Check if this sale's closed_at (or sales_closure) falls in the target month
            const closedAt = sale.closed_at || sale.sales_closure;
            if (!closedAt) return;

            const closedDate = new Date(closedAt);
            if (isNaN(closedDate.getTime())) return;

            const closedMonth = closedDate.getMonth() + 1;
            const closedYear = closedDate.getFullYear();

            if (closedMonth !== monthNum || closedYear !== yearNum) return;

            const saleValue = Number(sale.sale_value || sale.application_sale_value) || 0;

            amMetrics[amEmail].salesRevenueUSD += saleValue;
            amMetrics[amEmail].salesCount += 1;
            amMetrics[amEmail].salesRecords.push({
                lead_id: sale.lead_id || sale.awl_id || "",
                lead_name: sale.lead_name || "",
                awl_id: sale.awl_id || sale.lead_id || "",
                email: sale.email || sale.lead_email || "",
                sale_value: saleValue,
                closed_at: closedAt,
                payment_mode: sale.payment_mode || "",
                finance_status: sale.finance_status || "",
            });

            // Track daily SALES revenue
            const dayKey = closedDate.toISOString().split("T")[0];
            amMetrics[amEmail].dailySalesRevenue[dayKey] = (amMetrics[amEmail].dailySalesRevenue[dayKey] || 0) + saleValue;
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

            // Recalculate renewal counts
            am.successfulRenewals = am.renewals.length; // Completed renewals this month
            am.failedRenewals = am.dueThisMonth.filter((d: any) => !d.renewed).length; // Pending due renewals
            am.totalRenewals = am.successfulRenewals + am.failedRenewals; // Completed + Pending

            am.dueRenewalsPaid = am.dueThisMonth.filter((d: any) => d.renewed).length;
            am.dueRenewalsUnpaid = am.failedRenewals;

            // Renewal rate
            am.renewalRate = am.totalRenewals > 0
                ? parseFloat(((am.successfulRenewals / am.totalRenewals) * 100).toFixed(2))
                : 0;

            // Combined revenue (renewal + sales)
            am.monthlyRevenueUSD = am.renewalRevenueUSD + am.salesRevenueUSD;

            // Combined daily revenue (for display purposes)
            am.dailyRevenue = { ...am.dailyRenewalRevenue };
            Object.entries(am.dailySalesRevenue).forEach(([day, val]: [string, any]) => {
                am.dailyRevenue[day] = (am.dailyRevenue[day] || 0) + val;
            });

            // Base incentive from COMBINED revenue slab
            am.baseIncentive = calculateBaseIncentive(am.monthlyRevenueUSD, slabRules);

            // Renewal multiplier based on renewal rate
            am.renewalMultiplier = getRenewalMultiplier(am.renewalRate, multipliers);

            // Performance bonus based on RENEWAL revenue only
            am.performanceBonus = calculatePerformanceBonus(am.dailyRenewalRevenue, performanceBonuses);

            // Final incentive = (Base Incentive × Renewal Multiplier) + Performance Bonus
            if (am.renewalMultiplier === 0) {
                am.finalIncentive = 0; // No incentive below 50% renewal rate
                am.performanceBonus = 0;
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
