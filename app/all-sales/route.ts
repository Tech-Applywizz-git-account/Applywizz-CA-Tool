export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
/**
 * GET /api/incentive-data/all-sales
 *
 * Unified API route that returns sales data from the sales_closure table
 * for Marketing, GitHub, and Forage incentives since they share the same table.
 *
 * Query params:
 *  - startDate (ISO string) — start of date range
 *  - endDate (ISO string)   — end of date range
 *  - includeHistorical (optional) — if "true", returns historicalLeadIds for fresh sales deduplication
 *  - paidOnly (optional)    — if "true", only return sales with finance_status="Paid"
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const includeHistorical = searchParams.get("includeHistorical");
        const paidOnly = searchParams.get("paidOnly");

        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: "startDate and endDate are required" },
                { status: 400 }
            );
        }

        let query = supabase
            .from("sales_closure")
            .select(`
                id,
                lead_id,
                lead_name,
                email,
                sale_value,
                closed_at,
                account_assigned_email
            `)
            .gte("closed_at", startDate)
            .lte("closed_at", endDate)
            .order("closed_at", { ascending: true });

        // When paidOnly is true, only return finance_status="Paid" rows
        // (Used specifically by Forage Sales currently)
        if (paidOnly === "true") {
            query = query.eq("finance_status", "Paid");
        }

        const { data: sales, error: salesError } = await query;

        if (salesError) throw new Error("Failed to fetch sales: " + salesError.message);

        let historicalLeadIds: string[] = [];

        // If requested, check for prior sales history (before startDate)
        // Used by Marketing Sales for fresh sales deduplication.
        // IMPORTANT: Only sales with application_sale_value > 0 are eligible as fresh sales.
        if (includeHistorical === "true" && sales && sales.length > 0) {
            // Filter to only leads that have a valid application_sale_value > 0
            const eligibleSales = sales.filter(
                (s: any) => s.application_sale_value != null && parseFloat(s.application_sale_value) > 0
            );

            const leadIds = Array.from(
                new Set(eligibleSales.map((s: any) => s.lead_id).filter(Boolean))
            );

            if (leadIds.length > 0) {
                const { data: priorSales, error: priorError } = await supabase
                    .from("sales_closure")
                    .select("lead_id, application_sale_value")
                    .in("lead_id", leadIds)
                    .lt("closed_at", startDate);

                if (!priorError && priorSales) {
                    const validPriorSales = priorSales.filter(
                        (s: any) => s.application_sale_value != null && parseFloat(s.application_sale_value) > 0
                    );
                    historicalLeadIds = Array.from(
                        new Set(validPriorSales.map((s: any) => s.lead_id))
                    );
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: sales || [],
            historicalLeadIds: includeHistorical === "true" ? historicalLeadIds : undefined
        });

    } catch (error: any) {
        console.error("Unified Sales API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
