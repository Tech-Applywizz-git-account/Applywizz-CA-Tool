export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseISO, isAfter, isBefore, addDays, subDays, startOfMonth, format, getDate, endOfMonth, setHours, setMinutes, setSeconds } from "date-fns";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// Fallback Slab Rules for SBDA
const defaultSBDASlab = [
    { threshold: 10000, incentive: 40000 },
    { threshold: 9000, incentive: 34000 },
    { threshold: 8000, incentive: 28000 },
    { threshold: 7000, incentive: 23000 },
    { threshold: 6000, incentive: 19000 },
    { threshold: 5000, incentive: 15500 },
    { threshold: 3500, incentive: 10500 },
    { threshold: 2500, incentive: 8500 },
    { threshold: 2000, incentive: 5500 }
];

// Fallback Slab Rules for BDA
const defaultBDASlab = [
    { threshold: 10000, incentive: 40000 },
    { threshold: 9000, incentive: 34000 },
    { threshold: 8000, incentive: 28000 },
    { threshold: 7000, incentive: 23000 },
    { threshold: 6000, incentive: 19000 },
    { threshold: 5000, incentive: 15500 },
    { threshold: 3500, incentive: 10500 },
    { threshold: 2500, incentive: 8500 },
    { threshold: 2000, incentive: 5500 },
    { threshold: 1000, incentive: 4000 }
];

const calculateSlabIncentive = (revenue: number, slabRules: any[]) => {
    // Ensure slab rules are sorted descending by threshold
    const sortedRules = [...slabRules].sort((a, b) => b.threshold - a.threshold);
    for (const rule of sortedRules) {
        if (revenue >= rule.threshold) return rule.incentive;
    }
    return 0;
};

// Determine the shift date for a given sale time and shift start time (e.g. "20:00" IST)
// A shift starting at X date 20:00 belongs to Shift X. X date 15:00 belongs to Shift (X-1).
// IMPORTANT: closedAtStr is already in IST — do NOT convert via new Date() which applies timezone shifts.
const getShiftDate = (closedAtStr: string, shiftTimeStr: string) => {
    try {
        let year, month, day, hours, minutes;

        const str = String(closedAtStr).trim();

        if (str.includes('T') || (str.includes('-') && str.includes(':'))) {
            // ISO-like: "2026-04-10T07:56:00" or "2026-04-10 07:56:00"
            const [datePart, timePart] = str.split(/[T\s]/);
            const dateParts = datePart.split('-').map(Number);
            year = dateParts[0];
            month = dateParts[1];
            day = dateParts[2];
            const timeParts = timePart.replace(/[Z+].*/, '').split(':').map(Number);
            hours = timeParts[0];
            minutes = timeParts[1] || 0;
        } else if (str.includes('/')) {
            // US format: "4/10/2026 07:56 AM"
            const cleaned = str.replace(',', '');
            const spaceIdx = cleaned.indexOf(' ');
            const datePart = cleaned.substring(0, spaceIdx);
            const rest = cleaned.substring(spaceIdx + 1).trim();
            const dateParts = datePart.split('/').map(Number);
            month = dateParts[0];
            day = dateParts[1];
            year = dateParts[2];
            const timeParts = rest.split(':').map(Number);
            hours = timeParts[0];
            minutes = timeParts[1] || 0;
            if (rest.toUpperCase().includes('PM') && hours < 12) hours += 12;
            if (rest.toUpperCase().includes('AM') && hours === 12) hours = 0;
        } else {
            return "2026-01-01";
        }

        if (!year || !month || !day || isNaN(hours)) return "2026-01-01";

        const [shiftHours, shiftMinutes] = shiftTimeStr.split(":").map(Number);

        if (hours < shiftHours || (hours === shiftHours && minutes < shiftMinutes)) {
            day -= 1;
            if (day < 1) {
                month -= 1;
                if (month < 1) { month = 12; year -= 1; }
                day = new Date(year, month, 0).getDate();
            }
        }

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch (e) {
        console.error("getShiftDate parse failed:", closedAtStr, e);
        return "2026-01-01";
    }
};

// Grouping into Biweekly / Monthly periods
const getPeriodName = (dateStr: string, role: string) => {
    const d = new Date(dateStr);
    const day = getDate(d);

    if (role === "BDT-P") {
        // Monthly
        return `${format(startOfMonth(d), 'yyyy-MM-dd')} to ${format(endOfMonth(d), 'yyyy-MM-dd')}`;
    } else {
        // Biweekly
        if (day <= 15) {
            return `${format(startOfMonth(d), 'yyyy-MM-dd')} to ${format(d, 'yyyy-MM-15')}`;
        } else {
            return `${format(d, 'yyyy-MM-16')} to ${format(endOfMonth(d), 'yyyy-MM-dd')}`;
        }
    }
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        let role = searchParams.get("role")?.toUpperCase();
        const periodStr = searchParams.get("period"); // e.g. "April 2026"
        let month = searchParams.get("month");
        let year = searchParams.get("year");

        if (periodStr && (!month || !year)) {
            const parsedDate = new Date(periodStr);
            if (!isNaN(parsedDate.getTime())) {
                month = String(parsedDate.getMonth() + 1);
                year = String(parsedDate.getFullYear());
            }
        }

        month = month || String(new Date().getMonth() + 1);
        year = year || String(new Date().getFullYear());

        if (!email || !role) {
            return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
        }

        // Handle variations
        if (role === "BDT-P") role = "BDT-P";
        else if (role.startsWith("BDT")) role = "BDT";

        // Fetch everything in parallel to minimize network latency
        // Resilient environment variable check: try new name, then old name
        const crmBase = (process.env.NEXT_PUBLIC_CRM_SYNC_URL || process.env.NEXT_PUBLIC_CRM_API_URL || "").replace(/^"|"$/g, '');

        if (!crmBase) {
            console.error("CRM Base URL is missing in environment variables.");
            return NextResponse.json({
                success: false,
                error: "CRM_CONFIG_MISSING",
                details: "CRM Base URL not found in environment variables."
            }, { status: 500 });
        }

        const [userRes, settingsRes] = await Promise.all([
            supabaseAdmin.from("users").select("id, role, role_history, incentive_amount").eq("email", email).single(),
            supabaseAdmin.from("sales_settings").select("key, value")
        ]);

        const userData = userRes.data;
        const role_history = userData?.role_history || {};
        const rawSettings = settingsRes.data;

        const settingsMap = rawSettings?.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>) || {};

        const shiftStartTime = settingsMap["shift_start_time"] || "20:00"; // Default 8:00 PM

        // Construct shift-aware date range for the target month
        const [shiftHours, shiftMinutes] = shiftStartTime.split(":").map(Number);

        // Month start date (Day 1 of target month)
        // Shift starts on Day 1 at shiftHours:shiftMinutes:00
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1, shiftHours, shiftMinutes, 0);

        // Month end date (Day 1 of next month, at shiftHours:shiftMinutes - 1 second)
        const monthEnd = new Date(parseInt(year), parseInt(month), 1, shiftHours, shiftMinutes, 0);
        monthEnd.setSeconds(monthEnd.getSeconds() - 1);

        const crmRes = await fetch(`${crmBase}/api/incentive-data/all-sales?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`).catch(err => {
            console.error("CRM Fetch Exception:", err);
            return { ok: false, statusText: err.message } as any;
        });

        if (!crmRes.ok) {
            return NextResponse.json({
                success: false,
                error: "CRM_FETCH_FAILED",
                details: `Failed to fetch from CRM at ${crmBase}. Status: ${crmRes.statusText}`
            }, { status: 502 });
        }

        const crmData = await crmRes.json();
        if (!crmData.success || !crmData.data) {
            return NextResponse.json({
                success: false,
                error: "INVALID_CRM_RESPONSE",
                details: "CRM API returned success:false or missing sales data."
            }, { status: 502 });
        }

        // Filter sales for this specific rep by account_assigned_email (handling both .com and .ai domains)
        const allSalesData = crmData.data || [];
        const sales = allSalesData.filter((s: any) => {
            const saleEmail = s.account_assigned_email?.toLowerCase();
            const repEmail = email.toLowerCase();
            if (!saleEmail) return false;
            return saleEmail === repEmail || 
                   saleEmail === repEmail.replace('@applywizz.com', '@applywizz.ai') ||
                   saleEmail === repEmail.replace('@applywizz.ai', '@applywizz.com');
        });

        const getRoleForMonth = (monthStr: string) => {
            if (Object.keys(role_history).length === 0) return role;
            const sortedKeys = Object.keys(role_history).sort();
            let resolvedRole = role; // Default
            for (const k of sortedKeys) {
                if (k <= monthStr) resolvedRole = role_history[k];
            }
            return resolvedRole;
        };

        // Fetch all active booster night cycles for this month from the dedicated table
        const monthKey = `${year}-${String(parseInt(month)).padStart(2, '0')}`;
        const { data: boosterCycles } = await supabaseAdmin
            .from("booster_night_cycles")
            .select("*")
            .eq("month", monthKey)
            .eq("status", "active");

        const activeBoosterWindows = (boosterCycles || []).map((c: any) => ({
            start: new Date(c.start_time).getTime(),
            end: new Date(c.end_time).getTime(),
            multiplier: parseFloat(c.multiplier) || 1,
            target: (c.target || "both").toLowerCase(),
        }));

        // Calculate Periods
        const periodsData: Record<string, {
            total_revenue: number,
            actual_revenue: number,
            boosted_revenue: number,
            daily_sales: Record<string, number>,
            daily_bonus: number,
            slab_incentive: number,
            total_incentive: number,
            target_amount: number,      // To be assigned per period later
            daily_bonus_limit: number   // To be assigned per period later
        }> = {};

        // Aggregate Sales
        sales.forEach((sale: any) => {
            if (!sale.closed_at) return;
            const saleValue = Number(sale.sale_value) || 0;
            const shiftDate = getShiftDate(sale.closed_at, shiftStartTime);
            const periodMonthStr = shiftDate.substring(0, 7);
            const activeRoleForSale = getRoleForMonth(periodMonthStr);
            const period = getPeriodName(shiftDate, activeRoleForSale);

            if (!periodsData[period]) {
                periodsData[period] = {
                    total_revenue: 0,
                    actual_revenue: 0,
                    boosted_revenue: 0,
                    target_amount: 0, // Assigned per period later
                    daily_sales: {},
                    daily_bonus: 0,
                    slab_incentive: 0,
                    total_incentive: 0,
                    daily_bonus_limit: 0
                };
            }

            let slabSaleValue = saleValue;
            let dailySaleValue = saleValue;
            let boostedSlabAddition = 0;

            // Check sale time against ALL active booster windows (all times in IST)
            if (activeBoosterWindows.length > 0 && sale.closed_at) {
                // Parse sale.closed_at as IST — it is stored as IST string
                // Use the same raw parsing approach as getShiftDate for consistency
                const saleISTStr = String(sale.closed_at).trim();
                let saleISTMs: number;

                // If the string looks like ISO with Z or +offset, parse it and add IST offset
                if (saleISTStr.includes('T') && (saleISTStr.includes('Z') || saleISTStr.includes('+'))) {
                    // UTC-based ISO string — convert to IST by using Date parse (which handles TZ)
                    saleISTMs = new Date(saleISTStr).getTime();
                } else {
                    // Raw IST string like "2026-04-10T07:56:00" or "2026-04-10 07:56:00"
                    // Append IST offset so Date.parse treats it correctly
                    const normalized = saleISTStr.replace(/[Z+].*/, '').replace(' ', 'T');
                    saleISTMs = new Date(normalized + '+05:30').getTime();
                }

                for (const bw of activeBoosterWindows) {
                    if (bw.multiplier > 1 && saleISTMs >= bw.start && saleISTMs <= bw.end) {
                        sale.is_booster = true; // Mark it for frontend
                        if (bw.target === 'slab' || bw.target === 'both') {
                            slabSaleValue = saleValue * bw.multiplier;
                            boostedSlabAddition = slabSaleValue - saleValue;
                        }
                        if (bw.target === 'daily' || bw.target === 'both') {
                            dailySaleValue = saleValue * bw.multiplier;
                        }
                        break; // A sale can only match one booster window
                    }
                }
            }

            periodsData[period].total_revenue += slabSaleValue;
            periodsData[period].actual_revenue += saleValue;
            periodsData[period].boosted_revenue += boostedSlabAddition;
            periodsData[period].daily_sales[shiftDate] = (periodsData[period].daily_sales[shiftDate] || 0) + dailySaleValue;
        });

        // Calculate Incentives per Period
        for (const [period, pData] of Object.entries(periodsData)) {
            // Re-identify historical role for correct threshold equations
            const startMonthStr = period.substring(0, 7);
            const dateObj = new Date(startMonthStr + "-01T00:00:00Z");
            const periodStr = format(dateObj, "MMMM yyyy"); // e.g. "March 2026"
            const periodRole = getRoleForMonth(startMonthStr);

            // Fetch dynamically locked parameters for this specific month
            const getVal = (baseKey: string) => settingsMap[`${baseKey}_${periodStr}`] || settingsMap[baseKey];

            const roleKey = periodRole.toLowerCase();

            const targetAmountRaw = parseFloat(getVal(`${roleKey}_target`));
            pData.target_amount = isNaN(targetAmountRaw) ? (periodRole === "Sales Head" || periodRole === "SBDA" ? 2000 : periodRole === "BDA" ? 1000 : 500) : targetAmountRaw;
            const dailyBonusRaw = parseFloat(getVal(`${roleKey}_daily_bonus`));
            const parsedThreshold = isNaN(dailyBonusRaw) ? (periodRole === "Sales Head" || periodRole === "SBDA" ? 700 : periodRole === "BDA" ? 400 : 0) : dailyBonusRaw;

            // If the threshold is 0, it means "Disabled". We set it to Infinity so no sales can pass the threshold.
            const dailyThreshold = parsedThreshold <= 0 ? Infinity : parsedThreshold;

            pData.daily_bonus_limit = dailyThreshold !== Infinity ? dailyThreshold : 0;

            const slabRaw = getVal(`${roleKey}_slab_rules`);
            let slabRules = (periodRole === "Sales Head" || periodRole === "SBDA" ? defaultSBDASlab : periodRole === "BDA" ? defaultBDASlab : []);
            if (slabRaw) {
                try {
                    const parsed = JSON.parse(slabRaw);
                    if (Array.isArray(parsed)) {
                        slabRules = parsed;
                    }
                } catch (e) {
                    console.warn(`Slab rules parse failed for ${periodRole} ${periodStr}:`, e);
                }
            }

            // Calculate Daily Bonus
            let totalDailyBonus = 0;
            for (const [date, dailyTotal] of Object.entries(pData.daily_sales)) {
                if (dailyTotal >= dailyThreshold) {
                    totalDailyBonus += dailyTotal; // 1:1 match numerically in Rs
                }
            }

            pData.daily_bonus = totalDailyBonus;

            // Calculate Slab Incentive dynamically
            pData.slab_incentive = calculateSlabIncentive(pData.total_revenue, slabRules);

            pData.total_incentive = pData.slab_incentive; // Daily bonus is separate, NOT part of incentive

            // Upsert into Supabase
            try {
                const { error: upsertError } = await supabaseAdmin
                    .from("sales_incentives")
                    .upsert({
                        email,
                        role: periodRole,
                        period,
                        target_amount: pData.target_amount,
                        achieved_amount: pData.actual_revenue,
                        booster_revenue: pData.boosted_revenue,
                        daily_bonus: pData.daily_bonus,
                        slab_incentive: pData.slab_incentive,
                        total_incentive: pData.total_incentive,
                        last_updated: new Date().toISOString()
                    }, { onConflict: "email, period" });

                if (upsertError) {
                    console.error("Upsert Error for period", period, upsertError);
                }
            } catch (upsertFail) {
                console.error("Critical Upsert Failure:", upsertFail);
            }
        }

        // Group the calculated period incentives by month to store on the user profile
        const monthTotals: Record<string, number> = {};
        for (const [period, pData] of Object.entries(periodsData)) {
            // period looks like "2026-03-01 to 2026-03-15"
            const startMonthStr = period.substring(0, 7); // extracts "2026-03"
            const dateObj = new Date(startMonthStr + "-01T00:00:00Z");
            const monthName = format(dateObj, "MMMM yyyy"); // "March 2026"
            monthTotals[monthName] = (monthTotals[monthName] || 0) + pData.slab_incentive; // Only slab incentive, daily bonus is NOT incentive
        }

        const updatedIncentives = { ...userData?.incentive_amount, ...monthTotals };
        if (userData?.id) {
            await supabaseAdmin.from("users").update({ incentive_amount: updatedIncentives }).eq("id", userData.id);
        }

        return NextResponse.json({
            success: true,
            shiftStartTime,
            periods: periodsData,
            crmSummary: null,
            crmSales: sales
        });

    } catch (error: any) {
        console.error("Sales Calculation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
