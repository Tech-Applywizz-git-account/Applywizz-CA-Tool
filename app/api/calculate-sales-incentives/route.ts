import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseISO, isAfter, isBefore, addDays, subDays, startOfMonth, format, getDate, endOfMonth, setHours, setMinutes, setSeconds } from "date-fns";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Slab Rules for SBDA
const getSBDASlabIncentive = (revenue: number) => {
    if (revenue >= 10000) return 40000;
    if (revenue >= 9000) return 34000;
    if (revenue >= 8000) return 28000;
    if (revenue >= 7000) return 23000;
    if (revenue >= 6000) return 19000;
    if (revenue >= 5000) return 15500;
    if (revenue >= 3500) return 10500;
    if (revenue >= 2500) return 8500;
    if (revenue >= 2000) return 5500;
    return 0;
};

// Slab Rules for BDA
const getBDASlabIncentive = (revenue: number) => {
    if (revenue >= 10000) return 40000;
    if (revenue >= 9000) return 34000;
    if (revenue >= 8000) return 28000;
    if (revenue >= 7000) return 23000;
    if (revenue >= 6000) return 19000;
    if (revenue >= 5000) return 15500;
    if (revenue >= 3500) return 10500;
    if (revenue >= 2500) return 8500;
    if (revenue >= 2000) return 5500;
    if (revenue >= 1000) return 4000;
    return 0;
};

// Determine the shift date for a given sale time and shift start time (e.g. "20:00" IST)
// A shift starting at X date 20:00 belongs to Shift X. X date 15:00 belongs to Shift (X-1).
const getShiftDate = (closedAtStr: string, shiftTimeStr: string) => {
    const closedAt = new Date(closedAtStr);
    
    // Safely parse into Asia/Kolkata (IST)
    const istString = closedAt.toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour12: false });
    // Format: "M/D/YYYY, HH:MM:SS" or "MM/DD/YYYY, 24:MM:SS"
    const [datePart, timePart] = istString.split(", ");
    const [month, day, year] = datePart.split("/").map(Number);
    let [hours, minutes] = timePart.split(":").map(Number);
    if (hours === 24) hours = 0; // JS toLocaleString sometimes yields 24 for midnight
    
    const [shiftHours, shiftMinutes] = shiftTimeStr.split(":").map(Number);
    
    let shiftDate = new Date(year, month - 1, day);
    
    // If the sale happened before the shift start time, it belongs to the previous day's shift window
    if (hours < shiftHours || (hours === shiftHours && minutes < shiftMinutes)) {
        shiftDate.setDate(shiftDate.getDate() - 1);
    }
    
    const y = shiftDate.getFullYear();
    const m = String(shiftDate.getMonth() + 1).padStart(2, '0');
    const d = String(shiftDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
        
        if (!email || !role) {
            return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
        }
        
        // Handle variations
        if (role === "BDT-P") role = "BDT-P";
        else if (role.startsWith("BDT")) role = "BDT";

        // Fetch user data early to establish historical promotion rules
        const { data: userData } = await supabaseAdmin.from("users").select("id, role, role_history, incentive_amount").eq("email", email).single();
        const role_history = userData?.role_history || {};
        
        const getRoleForMonth = (monthStr: string) => {
            if (Object.keys(role_history).length === 0) return role;
            const sortedKeys = Object.keys(role_history).sort();
            let resolvedRole = role; // Default
            for (const k of sortedKeys) {
                if (k <= monthStr) resolvedRole = role_history[k];
            }
            return resolvedRole;
        };

        // Fetch shift settings
        const { data: shiftSetting } = await supabaseAdmin
            .from("sales_settings")
            .select("value")
            .eq("key", "shift_start_time")
            .single();
        
        const shiftStartTime = shiftSetting?.value || "20:00"; // Default 8:00 PM
        
        // Fetch CRM Data
        const rawCrmBase = process.env.NEXT_PUBLIC_CRM_API_URL || "https://applywizz-crm-tool.vercel.app";
        const crmBase = rawCrmBase.replace(/^"|"$/g, ''); // Safely strip UI quotes from ENV
        const crmRes = await fetch(`${crmBase}/api/sales-report?email=${encodeURIComponent(email)}`);
        
        if (!crmRes.ok) throw new Error("Failed to fetch from CRM");
        const crmData = await crmRes.json();
        
        if (!crmData.success || !crmData.data?.sales) {
            throw new Error("Invalid CRM data");
        }
        
        const sales = crmData.data.sales;
        
        // Calculate Periods
        const periodsData: Record<string, {
            total_revenue: number,
            target_amount: number,
            daily_sales: Record<string, number>,
            daily_bonus: number,
            slab_incentive: number,
            total_incentive: number
        }> = {};
        
        // Calculate Base Limits
        const getDailyBonusThreshold = (r: string) => {
            if (r === "BDA") return 400;
            if (r === "SBDA") return 700;
            return Infinity; // No bonus for BDT/BDT-P
        };
        const getTargetAmount = (r: string) => {
            if (r === "BDT-P" || r === "BDT") return 500;
            if (r === "BDA") return 1000; // Returns specifically back to 1000
            if (r === "SBDA") return 2000; 
            return 0; 
        };
        
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
                    target_amount: getTargetAmount(activeRoleForSale),
                    daily_sales: {},
                    daily_bonus: 0,
                    slab_incentive: 0,
                    total_incentive: 0
                };
            }
            
            periodsData[period].total_revenue += saleValue;
            periodsData[period].daily_sales[shiftDate] = (periodsData[period].daily_sales[shiftDate] || 0) + saleValue;
        });
        
        // Calculate Incentives per Period
        for (const [period, pData] of Object.entries(periodsData)) {
            // Re-identify historical role for correct threshold equations
            const startMonthStr = period.substring(0, 7); 
            const periodRole = getRoleForMonth(startMonthStr);

            // Calculate Daily Bonus
            let totalDailyBonus = 0;
            const dailyThreshold = getDailyBonusThreshold(periodRole);
            
            for (const [date, dailyTotal] of Object.entries(pData.daily_sales)) {
                if (dailyTotal >= dailyThreshold) {
                    totalDailyBonus += dailyTotal; // 1:1 match numerically in Rs
                }
            }
            
            pData.daily_bonus = totalDailyBonus;
            
            // Calculate Slab Incentive
            if (periodRole === "BDA") {
                pData.slab_incentive = getBDASlabIncentive(pData.total_revenue);
            } else if (periodRole === "SBDA") {
                pData.slab_incentive = getSBDASlabIncentive(pData.total_revenue);
            }
            
            pData.total_incentive = pData.daily_bonus + pData.slab_incentive;
            
            // Upsert into Supabase
            await supabaseAdmin
                .from("sales_incentives")
                .upsert({
                    email,
                    role: periodRole, // Stored accurate to history
                    period,
                    target_amount: pData.target_amount,
                    achieved_amount: pData.total_revenue,
                    daily_bonus: pData.daily_bonus,
                    slab_incentive: pData.slab_incentive,
                    total_incentive: pData.total_incentive,
                    last_updated: new Date().toISOString()
                }, { onConflict: "email, period" });
        }
        
        // Group the calculated period incentives by month to store on the user profile
        const monthTotals: Record<string, number> = {};
        for (const [period, pData] of Object.entries(periodsData)) {
            // period looks like "2026-03-01 to 2026-03-15"
            const startMonthStr = period.substring(0, 7); // extracts "2026-03"
            const dateObj = new Date(startMonthStr + "-01T00:00:00Z");
            const monthName = format(dateObj, "MMMM yyyy"); // "March 2026"
            monthTotals[monthName] = (monthTotals[monthName] || 0) + pData.total_incentive;
        }

        const updatedIncentives = { ...userData?.incentive_amount, ...monthTotals };
        if (userData?.id) {
            await supabaseAdmin.from("users").update({ incentive_amount: updatedIncentives }).eq("id", userData.id);
        }
        
        return NextResponse.json({
            success: true,
            shiftStartTime,
            periods: periodsData,
            crmSummary: crmData.summary,
            crmSales: sales
        });
        
    } catch (error: any) {
        console.error("Sales Calculation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
