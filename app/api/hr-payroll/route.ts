export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// GET: Fetch payroll data for a given period
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period");

        if (!period) {
            return NextResponse.json({ error: "period is required (e.g., 'April 2026')" }, { status: 400 });
        }

        // Fetch ALL active users + those with payroll entries for this period
        const [usersRes, allPayrollRes, settingsRes] = await Promise.all([
            supabaseAdmin.from("users").select("id, name, email, role, designation, department, isactive, employee_code, incentive_amount, base_salary").order("name"),
            supabaseAdmin.from("hr_payroll").select("*").order("updated_at", { ascending: false }),
            supabaseAdmin.from("hr_settings").select("key, value")
        ]);

        if (usersRes.error) throw usersRes.error;

        const users = usersRes.data || [];
        const allPayrollEntries = allPayrollRes.data || [];
        const settings = settingsRes.data || [];

        // Build settings map
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => { settingsMap[s.key] = s.value; });

        const defaultFoodAllowance = parseFloat(settingsMap["food_allowance_default"] || "0");

        // Merge users with their payroll data
        const currentPayrollMap = new Map<string, any>();
        const latestPreviousPayrollMap = new Map<string, any>();

        allPayrollEntries.forEach(p => {
            if (p.period === period) {
                currentPayrollMap.set(p.user_id, p);
            } else {
                if (!latestPreviousPayrollMap.has(p.user_id)) {
                    latestPreviousPayrollMap.set(p.user_id, p);
                }
            }
        });

        const mergedData = users.map(user => {
            const payroll = currentPayrollMap.get(user.id) || null;
            const prevPayroll = latestPreviousPayrollMap.get(user.id) || null;
            const incentiveAmount = user.incentive_amount || {};
            let productivityIncentive = Number(incentiveAmount[period]) || 0;

            // If not found, try short format (e.g., "nov2025")
            if (productivityIncentive === 0 && period.includes(" ")) {
                try {
                    const [mName, year] = period.split(" ");
                    const shortKey = `${mName.toLowerCase().substring(0, 3)}${year}`;
                    productivityIncentive = Number(incentiveAmount[shortKey]) || 0;
                } catch (e) {
                    // Ignore parsing errors for malformed periods
                }
            }

            return {
                user_id: user.id,
                employee_code: user.employee_code || "",
                employee_name: user.name || "",
                email: user.email,
                role: user.role || user.designation || "",
                department: user.department || "",
                is_active: user.isactive,
                base_salary: user.base_salary || 0,
                productivity_incentive: productivityIncentive,
                unpaid_leave: payroll?.unpaid_leave ?? 0,
                company_contribution: payroll ? payroll.company_contribution : (prevPayroll?.company_contribution ?? 0),
                attendance_incentive: payroll?.attendance_incentive ?? 0,
                food_allowance: payroll ? payroll.food_allowance : (prevPayroll?.food_allowance ?? defaultFoodAllowance),
                cab_deduction: payroll ? payroll.cab_deduction : (prevPayroll?.cab_deduction ?? 0),
                escalation_deduction: payroll?.escalation_deduction ?? 0,
                food_allowance_deduction: payroll ? payroll.food_allowance_deduction : (prevPayroll?.food_allowance_deduction ?? 0),
                company_contribution_deduction: payroll ? payroll.company_contribution_deduction : (prevPayroll?.company_contribution_deduction ?? 0),
                is_saved: !!payroll,
                payroll_id: payroll?.id || null,
            };
        });

        return NextResponse.json({
            success: true,
            period,
            data: mergedData,
            settings: settingsMap,
            defaultFoodAllowance,
        });

    } catch (error: any) {
        console.error("HR Payroll GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Save/update payroll entries in batch (also handles name edits)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { period, entries, nameEdits } = body;

        if (!period || !entries || !Array.isArray(entries)) {
            return NextResponse.json({ error: "period and entries[] are required" }, { status: 400 });
        }

        const upsertPayloads: any[] = [];

        for (const entry of entries) {
            if (!entry.user_id) continue;

            upsertPayloads.push({
                user_id: entry.user_id,
                period,
                unpaid_leave: Number(entry.unpaid_leave) || 0,
                company_contribution: Number(entry.company_contribution) || 0,
                attendance_incentive: Number(entry.attendance_incentive) || 0,
                food_allowance: Number(entry.food_allowance) || 0,
                cab_deduction: Number(entry.cab_deduction) || 0,
                escalation_deduction: Number(entry.escalation_deduction) || 0,
                food_allowance_deduction: Number(entry.food_allowance_deduction) || 0,
                company_contribution_deduction: Number(entry.company_contribution_deduction) || 0,
                updated_at: new Date().toISOString(),
            });
        }

        if (upsertPayloads.length > 0) {
            const { error } = await supabaseAdmin
                .from("hr_payroll")
                .upsert(upsertPayloads, { onConflict: "user_id,period" });

            if (error) throw error;
        }

        // Also handle any name edits that came along with the save
        if (nameEdits && Array.isArray(nameEdits)) {
            for (const ne of nameEdits) {
                if (ne.user_id && ne.name) {
                    await supabaseAdmin.from("users").update({ name: ne.name }).eq("id", ne.user_id);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Saved ${upsertPayloads.length} payroll entries for ${period}`,
            savedCount: upsertPayloads.length
        });

    } catch (error: any) {
        console.error("HR Payroll POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update employee code or add manual employee
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === "assign_code") {
            const { user_id, employee_code } = body;
            if (!user_id || !employee_code) {
                return NextResponse.json({ error: "user_id and employee_code required" }, { status: 400 });
            }

            // Check for duplicate employee codes
            const { data: existing } = await supabaseAdmin
                .from("users")
                .select("id, name")
                .eq("employee_code", employee_code)
                .neq("id", user_id)
                .maybeSingle();

            if (existing) {
                return NextResponse.json({
                    error: `Employee code "${employee_code}" is already assigned to ${existing.name}`,
                    duplicate: true
                }, { status: 409 });
            }

            const { error } = await supabaseAdmin
                .from("users")
                .update({ employee_code })
                .eq("id", user_id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: "Employee code assigned" });

        } else if (action === "add_employee") {
            const { name, email, employee_code, department, designation } = body;
            if (!name || !email) {
                return NextResponse.json({ error: "name and email are required" }, { status: 400 });
            }

            // Check for duplicate emails
            const { data: existingEmail } = await supabaseAdmin
                .from("users")
                .select("id")
                .ilike("email", email)
                .maybeSingle();

            if (existingEmail) {
                return NextResponse.json({ error: "An employee with this email already exists", duplicate: true }, { status: 409 });
            }

            // Check for duplicate employee code if provided
            if (employee_code) {
                const { data: existingCode } = await supabaseAdmin
                    .from("users")
                    .select("id")
                    .eq("employee_code", employee_code)
                    .maybeSingle();

                if (existingCode) {
                    return NextResponse.json({ error: `Employee code "${employee_code}" is already in use`, duplicate: true }, { status: 409 });
                }
            }

            const { data, error } = await supabaseAdmin
                .from("users")
                .insert({
                    name,
                    email: email.toLowerCase(),
                    employee_code: employee_code || null,
                    department: department || null,
                    designation: designation || "Trainee",
                    role: designation || "Trainee",
                    isactive: true,
                    incentive_amount: {},
                })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, employee: data });

        } else if (action === "edit_employee") {
            const { user_id, name, department, designation, isactive } = body;
            if (!user_id || !name) {
                return NextResponse.json({ error: "user_id and name are required" }, { status: 400 });
            }

            const { error } = await supabaseAdmin
                .from("users")
                .update({ 
                    name,
                    department: department || null,
                    designation: designation || null,
                    role: designation || null,
                    isactive: typeof isactive === 'boolean' ? isactive : true
                })
                .eq("id", user_id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: "Employee details updated" });

        } else if (action === "update_settings") {
            const { settings } = body;
            if (!settings || typeof settings !== "object") {
                return NextResponse.json({ error: "settings object required" }, { status: 400 });
            }

            const upserts = Object.entries(settings).map(([key, value]) => ({
                key,
                value: String(value),
                updated_at: new Date().toISOString(),
            }));

            const { error } = await supabaseAdmin
                .from("hr_settings")
                .upsert(upserts, { onConflict: "key" });

            if (error) throw error;
            return NextResponse.json({ success: true, message: "Settings updated" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("HR Payroll PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
