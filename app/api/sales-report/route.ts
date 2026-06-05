// import { NextRequest, NextResponse } from 'next/server';
// import { supabaseAdmin } from '@/lib/supabaseAdmin';

// /**
//  * GET /api/sales-report?email=salesperson@example.com
//  * 
//  * Fetches comprehensive sales, revenue, client details, and activity
//  * for a specific salesperson identified by their email ID.
//  */

// const ALLOWED_ORIGINS = [
//     'http://localhost:3000',
//     'http://localhost:8000',
//     'http://localhost:5173',
//     '*',
// ];

// export async function OPTIONS(request: NextRequest) {
//     const origin = request.headers.get('origin');

//     if (origin && ALLOWED_ORIGINS.includes(origin)) {
//         return new NextResponse(null, {
//             status: 204,
//             headers: {
//                 'Access-Control-Allow-Origin': origin,
//                 'Access-Control-Allow-Methods': 'GET, OPTIONS',
//                 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//             },
//         });
//     }

//     return new NextResponse(null, { status: 204 });
// }

// export async function GET(request: NextRequest) {
//     const origin = request.headers.get('origin');
//     const corsHeaders: Record<string, string> = {};

//     if (origin && ALLOWED_ORIGINS.includes(origin)) {
//         corsHeaders['Access-Control-Allow-Origin'] = origin;
//     }

//     try {
//         const { searchParams } = new URL(request.url);
//         const emailInput = searchParams.get('email');

//         if (!emailInput) {
//             return NextResponse.json(
//                 { error: 'Salesperson email is required' },
//                 { 
//                     status: 400,
//                     headers: corsHeaders
//                 }
//             );
//         }

//         const email = emailInput.trim().toLowerCase();

//         // 1. Fetch Salesperson Profile
//         const { data: profile, error: profileError } = await supabaseAdmin
//             .from('profiles')
//             .select('full_name, user_email, roles, user_id')
//             .ilike('user_email', email)
//             .maybeSingle();

//         if (profileError) {
//             console.error('Profile fetch error:', profileError);
//         }

//         const fullName = profile?.full_name || email.split('@')[0];

//         // 2. Fetch Sales Closures (Revenue & Sales Data)
//         // We check both email and name for consistency in case one was used over the other
//         const { data: sales, error: salesError } = await supabaseAdmin
//             .from('sales_closure')
//             .select('*')
//             .or(`account_assigned_email.ilike.${email},account_assigned_name.ilike.${fullName}`)
//             .order('closed_at', { ascending: false });

//         if (salesError) {
//             console.error('Sales fetch error:', salesError);
//             throw salesError;
//         }

//         // 3. Fetch Assigned Clients (Leads)
//         const { data: leads, error: leadsError } = await supabaseAdmin
//             .from('leads')
//             .select('*')
//             .or(`assigned_to_email.ilike.${email},assigned_to.ilike.${fullName}`)
//             .order('assigned_at', { ascending: false });

//         if (leadsError) {
//             console.error('Leads fetch error:', leadsError);
//             throw leadsError;
//         }

//         // 4. Fetch Activity (Call History)
//         const { data: activity, error: activityError } = await supabaseAdmin
//             .from('call_history')
//             .select('*')
//             .or(`assigned_to.ilike.${fullName},assigned_to.ilike.${email}`)
//             .order('call_started_at', { ascending: false });

//         if (activityError) {
//             console.error('Activity fetch error:', activityError);
//             // Don't throw here, just log
//         }

//         // 5. Calculate Aggregated Metrics
//         const totalRevenue = sales?.reduce((acc, s) => acc + (Number(s.sale_value) || 0), 0) || 0;
//         const totalSalesCount = sales?.length || 0;
//         const totalLeadsCount = leads?.length || 0;
//         const totalCallsCount = activity?.length || 0;

//         // Breakdown by product
//         const productBreakdown = {
//             resumes: sales?.filter(s => Number(s.resume_sale_value) > 0).length || 0,
//             portfolios: sales?.filter(s => Number(s.portfolio_sale_value) > 0).length || 0,
//             linkedin: sales?.filter(s => Number(s.linkedin_sale_value) > 0).length || 0,
//             github: sales?.filter(s => Number(s.github_sale_value) > 0).length || 0,
//             courses: sales?.filter(s => Number(s.courses_sale_value) > 0).length || 0,
//         };

//         // Grouping sales by status (if applicable)
//         const leadsByStage = leads?.reduce((acc: any, lead) => {
//             const stage = lead.current_stage || 'Unknown';
//             acc[stage] = (acc[stage] || 0) + 1;
//             return acc;
//         }, {});

//         return NextResponse.json({
//             success: true,
//             salesperson: {
//                 email: profile?.user_email || email,
//                 name: fullName,
//                 role: profile?.roles || 'Unknown',
//                 uid: profile?.user_id || 'Unknown'
//             },
//             summary: {
//                 totalRevenue,
//                 totalSalesCount,
//                 totalLeadsCount,
//                 totalCallsCount,
//                 averageDealValue: totalSalesCount > 0 ? (totalRevenue / totalSalesCount) : 0,
//                 productBreakdown,
//                 leadsByStage
//             },
//             data: {
//                 sales: sales || [],
//                 clients: leads || [],
//                 activity: activity || []
//             }
//         }, {
//             headers: corsHeaders
//         });

//     } catch (error: any) {
//         console.error('API Error in sales-report:', error);
//         return NextResponse.json(
//             { error: error.message || 'Internal server error' },
//             { 
//                 status: 500,
//                 headers: corsHeaders
//             }
//         );
//     }
// }

// import { NextRequest, NextResponse } from 'next/server';
// import { supabaseAdmin } from '@/lib/supabaseAdmin';

// // ✅ Global CORS headers (allow all origins)
// const CORS_HEADERS = {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Methods': 'GET, OPTIONS',
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
// };

// // ✅ Handle preflight request
// export async function OPTIONS() {
//     return new NextResponse(null, {
//         status: 204,
//         headers: CORS_HEADERS,
//     });
// }

// export async function GET(request: NextRequest) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const emailInput = searchParams.get('email');

//         if (!emailInput) {
//             return NextResponse.json(
//                 { error: 'Salesperson email is required' },
//                 { status: 400, headers: CORS_HEADERS }
//             );
//         }

//         const email = emailInput.trim().toLowerCase();

//         // 1. Fetch Salesperson Profile
//         const { data: profile, error: profileError } = await supabaseAdmin
//             .from('profiles')
//             .select('full_name, user_email, roles, user_id')
//             .ilike('user_email', email)
//             .maybeSingle();

//         if (profileError) {
//             console.error('Profile fetch error:', profileError);
//         }

//         const fullName = profile?.full_name || email.split('@')[0];

//         // 2. Fetch Sales Closures
//         const { data: sales, error: salesError } = await supabaseAdmin
//             .from('sales_closure')
//             .select('*')
//             .or(`account_assigned_email.ilike.${email},account_assigned_name.ilike.${fullName}`)
//             .order('closed_at', { ascending: false });

//         if (salesError) {
//             console.error('Sales fetch error:', salesError);
//             throw salesError;
//         }

//         // 3. Fetch Leads
//         const { data: leads, error: leadsError } = await supabaseAdmin
//             .from('leads')
//             .select('*')
//             .or(`assigned_to_email.ilike.${email},assigned_to.ilike.${fullName}`)
//             .order('assigned_at', { ascending: false });

//         if (leadsError) {
//             console.error('Leads fetch error:', leadsError);
//             throw leadsError;
//         }

//         // 4. Fetch Activity
//         const { data: activity, error: activityError } = await supabaseAdmin
//             .from('call_history')
//             .select('*')
//             .or(`assigned_to.ilike.${fullName},assigned_to.ilike.${email}`)
//             .order('call_started_at', { ascending: false });

//         if (activityError) {
//             console.error('Activity fetch error:', activityError);
//         }

//         // 5. Aggregations
//         const totalRevenue = sales?.reduce((acc, s) => acc + (Number(s.sale_value) || 0), 0) || 0;
//         const totalSalesCount = sales?.length || 0;
//         const totalLeadsCount = leads?.length || 0;
//         const totalCallsCount = activity?.length || 0;

//         const productBreakdown = {
//             resumes: sales?.filter(s => Number(s.resume_sale_value) > 0).length || 0,
//             portfolios: sales?.filter(s => Number(s.portfolio_sale_value) > 0).length || 0,
//             linkedin: sales?.filter(s => Number(s.linkedin_sale_value) > 0).length || 0,
//             github: sales?.filter(s => Number(s.github_sale_value) > 0).length || 0,
//             courses: sales?.filter(s => Number(s.courses_sale_value) > 0).length || 0,
//         };

//         const leadsByStage = leads?.reduce((acc: any, lead) => {
//             const stage = lead.current_stage || 'Unknown';
//             acc[stage] = (acc[stage] || 0) + 1;
//             return acc;
//         }, {});

//         return NextResponse.json({
//             success: true,
//             salesperson: {
//                 email: profile?.user_email || email,
//                 name: fullName,
//                 role: profile?.roles || 'Unknown',
//                 uid: profile?.user_id || 'Unknown'
//             },
//             summary: {
//                 totalRevenue,
//                 totalSalesCount,
//                 totalLeadsCount,
//                 totalCallsCount,
//                 averageDealValue: totalSalesCount > 0 ? (totalRevenue / totalSalesCount) : 0,
//                 productBreakdown,
//                 leadsByStage
//             },
//             data: {
//                 sales: sales || [],
//                 clients: leads || [],
//                 activity: activity || []
//             }
//         }, {
//             headers: CORS_HEADERS
//         });

//     } catch (error: any) {
//         console.error('API Error in sales-report:', error);

//         return NextResponse.json(
//             { error: error.message || 'Internal server error' },
//             { status: 500, headers: CORS_HEADERS }
//         );
//     }
// }


export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// ✅ Global CORS headers (allow all origins)
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ✅ Handle preflight request
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const emailInput = searchParams.get("email");
        const month = searchParams.get("month");
        const year = searchParams.get("year");
        const startDate = searchParams.get("start_date");
        const endDate = searchParams.get("end_date");

        let query = supabaseAdmin
            .from("sales_closure")
            .select("*")
            .eq("sale_status", 1)
            .order("closed_at", { ascending: false });

        if (emailInput) {
            // Filter by salesperson's email (account_assigned_email) across both domains, case-insensitive
            const email = emailInput.trim().toLowerCase();
            const altEmail = email.includes('@applywizz.com') 
                ? email.replace('@applywizz.com', '@applywizz.ai') 
                : email.replace('@applywizz.ai', '@applywizz.com');
            
            query = query.or(`account_assigned_email.ilike.${email},account_assigned_email.ilike.${altEmail}`);
        }

        // Support for custom date ranges
        if (startDate && endDate) {
            query = query.gte("closed_at", startDate).lte("closed_at", endDate);
        }
        // Support for month and year parameters (like the old CRM API)
        else if (month && year) {
            const m = parseInt(month);
            const y = parseInt(year);
            if (!isNaN(m) && !isNaN(y)) {
                // ISO strings are better for comparison in Postgres
                const startObj = new Date(Date.UTC(y, m - 1, 1));
                const endObj = new Date(Date.UTC(y, m, 1));
                query = query.gte("closed_at", startObj.toISOString()).lt("closed_at", endObj.toISOString());
            }
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json(
            { success: true, data: { sales: data } },
            { headers: CORS_HEADERS }
        );

    } catch (e: any) {
        console.error("Sales Closure API Error:", e);
        return NextResponse.json(
            { success: false, error: e.message },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}