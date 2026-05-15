export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// Helper: Get the correct last day of a given YYYY-MM month
const getLastDayOfMonth = (yearMonth: string): string => {
    const [year, month] = yearMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
};



// Determine the shift date for a given sale time and shift start time (e.g. "20:00" IST)
// A shift starting at X date 20:00 belongs to Shift X. X date 15:00 belongs to Shift (X-1).
// IMPORTANT: closedAtStr is already in IST — do NOT convert via new Date() which applies timezone shifts.
const getShiftDate = (closedAtStr: string, shiftTimeStr: string) => {
    // Parse the IST timestamp string directly without Date constructor to avoid timezone conversion
    // Handles formats like: "2026-04-10T07:56:00", "2026-04-10 07:56:00", "4/10/2026 07:56 AM"
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
            const timeParts = timePart.replace(/[Z+].*/,'').split(':').map(Number);
            hours = timeParts[0];
            minutes = timeParts[1] || 0;
        } else if (str.includes('/')) {
            // US format: "4/10/2026 07:56 AM" or "4/10/2026, 07:56:00"
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
            // Handle AM/PM if present
            if (rest.toUpperCase().includes('PM') && hours < 12) hours += 12;
            if (rest.toUpperCase().includes('AM') && hours === 12) hours = 0;
        } else {
            return "2026-01-01";
        }

        if (!year || !month || !day || isNaN(hours)) return "2026-01-01";

        const [shiftHours, shiftMinutes] = shiftTimeStr.split(":").map(Number);

        // If the sale happened before the shift start time, it belongs to the previous day's shift
        if (hours < shiftHours || (hours === shiftHours && minutes < shiftMinutes)) {
            day -= 1;
            if (day < 1) {
                month -= 1;
                if (month < 1) { month = 12; year -= 1; }
                day = new Date(year, month, 0).getDate(); // last day of prev month
            }
        }

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch (e) {
        console.error("getShiftDate parse failed:", closedAtStr, e);
        return "2026-01-01";
    }
};

// ========== OPTIMIZED SYNC PIPELINE ==========
// Key optimization: Fetch CRM sales data ONCE per email+month, then reuse
// across all entries for that rep. This reduces external API calls from
// ~160 (one per entry) to ~8 (one per unique rep).

// Cache for CRM sales data: key = "email|YYYY-MM" => sale[]
const crmCache = new Map<string, any[]>();
// Cache for shift_start_time setting (fetched once per request)
let cachedShiftTime: string | null = null;

async function getShiftTime(): Promise<string> {
    if (cachedShiftTime) return cachedShiftTime;
    try {
        const { data } = await supabaseAdmin
            .from("sales_settings")
            .select("key, value")
            .eq("key", "shift_start_time")
            .single();
        cachedShiftTime = data?.value || "20:00";
    } catch {
        cachedShiftTime = "20:00";
    }
    return cachedShiftTime || "20:00";
}

function getCrmBaseUrl(): string {
    const raw = process.env.NEXT_PUBLIC_CRM_SYNC_URL || process.env.NEXT_PUBLIC_CRM_API_URL || "";
    return raw.replace(/^"|"$/g, '').replace(/\/+$/, '');
}

async function getCrmSales(email: string, year: number, month: number): Promise<any[]> {
    const crmBase = getCrmBaseUrl();
    if (!crmBase) {
        console.error("CRM_BASE_URL is EMPTY. NEXT_PUBLIC_CRM_SYNC_URL:", process.env.NEXT_PUBLIC_CRM_SYNC_URL, "NEXT_PUBLIC_CRM_API_URL:", process.env.NEXT_PUBLIC_CRM_API_URL);
        return [];
    }
    const key = `${email}|${year}-${month}`;
    if (crmCache.has(key)) return crmCache.get(key)!;
    
    try {
        const url = `${crmBase}/api/sales-report?email=${encodeURIComponent(email)}&month=${month}&year=${year}`;
        const crmRes = await fetch(url);
        if (crmRes.ok) {
            const crmData = await crmRes.json();
            if (crmData.success && crmData.data?.sales) {
                crmCache.set(key, crmData.data.sales);
                return crmData.data.sales;
            }
        } else {
            console.warn("CRM fetch failed:", url, "status:", crmRes.status, crmRes.statusText);
        }
    } catch (crmErr) {
        console.warn("CRM fetch exception for", email, crmErr);
    }
    crmCache.set(key, []);
    return [];
}

function getIstTime() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function needsCrmSync(e: any, istNow: Date) {
    const [year, month, day] = e.shift_date.split("-").map(Number);
    
    // Create shift start/end precisely in IST
    const shiftStartTime = new Date(`${e.shift_date}T20:00:00+05:30`);
    const shiftEndTime = new Date(shiftStartTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

    const nowTime = new Date().getTime();

    // If shift hasn't started yet, no need to sync
    if (nowTime < shiftStartTime.getTime()) return false;
    
    // If already verified AND has actual sales data populated, no need to sync again
    // UNLESS granular data is missing
    if (nowTime > shiftEndTime.getTime() && e.verified) {
        // Re-sync if verified with NO actual data — could be a false verification from broken CRM URL
        if ((!e.actual_awl_ids || e.actual_awl_ids.length === 0) && e.verified_at) {
            const lastVerified = new Date(e.verified_at).getTime();
            const hoursSinceVerification = (nowTime - lastVerified) / (1000 * 60 * 60);
            if (hoursSinceVerification < 2) return true;
        }
        // Force re-sync if streak is 0 but there were predictions (might have failed matching or CRM sync)
        if (e.streak === 0 && e.has_revenue && e.sales?.length > 0) {
            if (!e.verified_at) return true;
            const lastSync = new Date(e.verified_at).getTime();
            const minsSinceSync = (nowTime - lastSync) / (1000 * 60);
            if (minsSinceSync >= 30) return true; // Re-check every 30 mins even if verified
        }
        return false;
    }

    // Shift is over and NOT verified — need one final sync
    // This applies to ALL entries: with or without predictions
    if (nowTime > shiftEndTime.getTime() && !e.verified) return true;

    // During active shift: sync every 5 minutes
    // This applies to ALL entries: with or without predictions
    if (!e.verified_at) return true;
    const lastSync = new Date(e.verified_at);
    const minsSinceSync = (nowTime - lastSync.getTime()) / (1000 * 60);
    return minsSinceSync >= 5;
}

function isShiftOver(shift_date: string, istNow: Date) {
    // shift_date is YYYY-MM-DD. Shift starts at 8:00 PM (20:00) IST.
    // Shift ends exactly 24 hours later.
    const shiftStartTime = new Date(`${shift_date}T20:00:00+05:30`);
    const shiftEndTime = new Date(shiftStartTime.getTime() + 24 * 60 * 60 * 1000); 
    return istNow > shiftEndTime;
}

// Process a single entry using CACHED CRM data (no external fetch)
async function verifyWithCachedCrm(entry: any, cachedSales: any[], shiftTime: string, isFinal: boolean) {
    try {
        let crmAwlIds: string[] = [];
        let actualRevenue = 0;
        let lastActualSaleTime: string | null = null;
        let actualSalesData: any[] = [];

        for (const sale of cachedSales) {
            const saleCloseAt = sale.closed_at || sale.closed_date;
            if (!saleCloseAt) continue;

            const saleShiftDate = getShiftDate(saleCloseAt, shiftTime);

            if (saleShiftDate === entry.shift_date) {
                const id = sale.lead_id;
                if (id) {
                    const val = Number(sale.sale_value) || 0;
                    crmAwlIds.push(String(id).trim().toUpperCase());
                    actualRevenue += val;
                    actualSalesData.push({ awl_id: String(id).trim().toUpperCase(), revenue: val });
                    
                    if (!lastActualSaleTime || new Date(saleCloseAt) > new Date(lastActualSaleTime)) {
                        lastActualSaleTime = saleCloseAt;
                    }
                }
            }
        }

        const normalizeId = (id: any) => String(id || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
        const expectedAwlIdsRaw = (entry.sales || []).map((s: any) => String(s.awl_id).trim().toUpperCase());
        const expectedAwlIdsNormalized = expectedAwlIdsRaw.map(normalizeId);
        const crmAwlIdsNormalized = crmAwlIds.map(normalizeId);

        const matchedIds = expectedAwlIdsRaw.filter((rawId: string) => {
            const normId = normalizeId(rawId);
            return crmAwlIdsNormalized.includes(normId);
        });
        
        // Streak count is simply the number of matched predicted sales
        const streakCount = matchedIds.length;

        const { data: updated } = await supabaseAdmin
            .from("expected_revenue")
            .update({
                verified: isFinal || (matchedIds.length === expectedAwlIdsRaw.length && expectedAwlIdsRaw.length > 0 && entry.has_revenue),
                streak: streakCount,
                matched_awl_ids: matchedIds,
                actual_awl_ids: crmAwlIds,
                actual_revenue: actualRevenue,
                last_actual_sale_at: lastActualSaleTime,
                verified_at: new Date().toISOString()
            })
            .eq("email", entry.email)
            .eq("shift_date", entry.shift_date)
            .select()
            .single();

        return updated || entry;
    } catch (e) {
        console.error("Verification failed:", e);
        return entry;
    }
}

// Auto-verify old entries that have been synced but have no predictions and no actual sales
// These are entries where the shift is over and CRM sync found nothing
async function batchAutoVerifyEmpty(entries: any[], istNow: Date) {
    const toVerify = entries.filter(e => {
        if (e.verified) return false;
        // Only auto-verify if already synced at least once (verified_at exists)
        // AND no actual sales were found during that sync
        if (!e.verified_at && !e.has_revenue) return true; // Never synced and no predictions
        if (e.actual_awl_ids && e.actual_awl_ids.length > 0) return false;
        
        const shiftStartTime = new Date(`${e.shift_date}T20:00:00+05:30`);
        const shiftEndTime = new Date(shiftStartTime.getTime() + 24 * 60 * 60 * 1000);
        return istNow > shiftEndTime;
    });
    if (toVerify.length === 0) return;

    // Group by email for efficient batch updates
    const byEmail = new Map<string, string[]>();
    toVerify.forEach(e => {
        if (!byEmail.has(e.email)) byEmail.set(e.email, []);
        byEmail.get(e.email)!.push(e.shift_date);
    });

    const updatePromises = Array.from(byEmail.entries()).map(([email, dates]) =>
        supabaseAdmin
            .from("expected_revenue")
            .update({ verified: true, streak: 0, verified_at: new Date().toISOString() })
            .eq("email", email)
            .in("shift_date", dates)
    );
    await Promise.all(updatePromises);

    // Update local entries in-place
    toVerify.forEach(e => { e.verified = true; e.streak = 0; });
}

// Optimized sync: fetch CRM data ONCE per email, then process all entries
// Also creates stub entries for shift dates where CRM sales exist but no prediction was submitted
async function optimizedSync(entries: any[], monthFilter?: string, requestedEmail?: string) {
    const istNow = getIstTime();
    const shiftTime = await getShiftTime();

    // Build a set of all existing entries for quick lookup
    const existingKeys = new Set(entries.map(e => `${e.email}|${e.shift_date}`));

    // Collect all unique emails from existing entries
    const allEmails = new Set(entries.map(e => e.email));
    if (requestedEmail) allEmails.add(requestedEmail);

    // ONLY fetch team-wide sales reps for stub discovery if in EXECUTIVE mode
    // (monthFilter provided and no single requestedEmail specified)
    if (monthFilter && !requestedEmail) {
        try {
            const { data: salesUsers } = await supabaseAdmin
                .from("users")
                .select("email, name, role")
                .eq("department", "Sales")
                .eq("isactive", true)
                .in("role", ["BDT", "BDA", "SBDA", "Sales Head", "BDT-P"]);
            if (salesUsers) {
                salesUsers.forEach(u => allEmails.add(u.email));
            }
        } catch (e) {
            console.warn("Failed to fetch sales users for stub creation:", e);
        }
    }

    // Determine the year/month range for CRM fetches
    let fetchYear: number, fetchMonth: number;
    if (monthFilter) {
        const [y, m] = monthFilter.split("-").map(Number);
        fetchYear = y;
        fetchMonth = m;
    } else if (entries.length > 0) {
        const [y, m] = entries[0].shift_date.split("-").map(Number);
        fetchYear = y;
        fetchMonth = m;
    } else {
        return entries;
    }

    // Fetch CRM data for ALL emails in parallel
    const emailArr = Array.from(allEmails);
    const crmDataByEmail = new Map<string, any[]>();
    await Promise.all(emailArr.map(async (email) => {
        const sales = await getCrmSales(email, fetchYear, fetchMonth);
        crmDataByEmail.set(email, sales);
    }));

    // Prepare stub entries for shift dates where CRM sales exist but no entry was submitted
    const stubsToUpsert: any[] = [];
    for (const [email, sales] of crmDataByEmail) {
        for (const sale of sales) {
            const saleCloseAt = sale.closed_at || sale.closed_date;
            if (!saleCloseAt) continue;

            const saleShiftDate = getShiftDate(saleCloseAt, shiftTime);
            const key = `${email}|${saleShiftDate}`;

            // Check month bounds
            const [sy, sm] = saleShiftDate.split("-").map(Number);
            if (sy !== fetchYear || sm !== fetchMonth) continue;

            if (!existingKeys.has(key)) {
                const existingRepEntry = entries.find(e => e.email === email);
                const repName = existingRepEntry?.name || sale.account_assigned_name || email;

                stubsToUpsert.push({
                    email,
                    name: repName,
                    shift_date: saleShiftDate,
                    has_revenue: false,
                    sales: [],
                    submitted_at: null,
                    first_submitted_at: null,
                    edit_count: 0,
                    edit_history: [],
                    verified: false,
                    streak: 0,
                    matched_awl_ids: [],
                    actual_awl_ids: [],
                    actual_revenue: 0,
                    last_actual_sale_at: null,
                    verified_at: null
                });
                existingKeys.add(key);
            }
        }
    }

    // Batch upsert stubs if any
    if (stubsToUpsert.length > 0) {
        try {
            const { data: upserted } = await supabaseAdmin
                .from("expected_revenue")
                .upsert(stubsToUpsert, { onConflict: "email, shift_date" })
                .select();
            if (upserted) {
                entries = [...entries, ...upserted];
            }
        } catch (e) {
            console.warn("Batch stub upsert failed:", e);
        }
    }

    const allEntries = entries;

    // 1. Filter entries that actually need CRM sync
    const toSync = allEntries.filter(e => needsCrmSync(e, istNow));
    if (toSync.length === 0) return allEntries;

    // 2. Group entries by email to minimize CRM API calls
    const byEmail = new Map<string, any[]>();
    toSync.forEach(e => {
        if (!byEmail.has(e.email)) byEmail.set(e.email, []);
        byEmail.get(e.email)!.push(e);
    });

    // 3. CRM data is already cached from above — no additional fetches needed

    // 4. Now process each entry using cached CRM data (no more external calls)
    const entryMap = new Map(allEntries.map(e => [`${e.email}|${e.shift_date}`, e]));
    
    // Process entries with concurrency limit for DB updates
    const updatePromises: Promise<any>[] = [];
    for (const [email, repEntries] of byEmail) {
        for (const entry of repEntries) {
            const [y, m] = entry.shift_date.split("-").map(Number);
            const cachedSales = await getCrmSales(email, y, m); // returns from cache instantly
            const isFinal = isShiftOver(entry.shift_date, istNow);
            updatePromises.push(
                verifyWithCachedCrm(entry, cachedSales, shiftTime, isFinal).then(updated => {
                    entryMap.set(`${entry.email}|${entry.shift_date}`, updated);
                })
            );
        }
    }
    
    // Run DB updates with concurrency limit of 5
    const chunks = [];
    for (let i = 0; i < updatePromises.length; i += 5) {
        chunks.push(updatePromises.slice(i, i + 5));
    }
    for (const chunk of chunks) {
        await Promise.all(chunk);
    }

    // 5. Return entries in original order with updated data
    return allEntries.map(e => entryMap.get(`${e.email}|${e.shift_date}`) || e);
}

// GET: Fetch expected revenue entries for a user, or all users (executive mode)
export async function GET(req: Request) {
    try {
        // Clear per-request caches
        crmCache.clear();
        cachedShiftTime = null;

        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const mode = searchParams.get("mode"); // "executive" to get all
        const month = searchParams.get("month"); // "YYYY-MM" format
        const skipSync = searchParams.get("skipSync") === "true"; // Skip CRM sync for read-only

        if (mode === "executive") {
            let query = supabaseAdmin
                .from("expected_revenue")
                .select("*")
                .order("shift_date", { ascending: false });

            if (month) {
                const lastDay = getLastDayOfMonth(month);
                query = query.gte("shift_date", `${month}-01`)
                    .lte("shift_date", lastDay);
            }

            const { data, error } = await query;
            if (error) throw error;

            // skipSync: just return raw DB data (for analytics/read-only views)
            if (skipSync) {
                return NextResponse.json({ success: true, entries: data || [] });
            }

            const istNow = getIstTime();

            // Batch auto-verify empty old entries (single DB call, no CRM)
            await batchAutoVerifyEmpty(data || [], istNow);

            // Optimized sync: fetches CRM data once per rep, then processes all entries
            const results = await optimizedSync(data || [], month || undefined);
            return NextResponse.json({ success: true, entries: results });
        }

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        let query = supabaseAdmin
            .from("expected_revenue")
            .select("*")
            .eq("email", email)
            .order("shift_date", { ascending: false });

        if (month) {
            const lastDay = getLastDayOfMonth(month);
            query = query.gte("shift_date", `${month}-01`)
                .lte("shift_date", lastDay);
        }

        const { data, error } = await query;
        if (error) throw error;

        // skipSync: just return raw DB data (for analytics/read-only views)
        if (skipSync) {
            return NextResponse.json({ success: true, entries: data || [] });
        }

        const istNow = getIstTime();

        // Batch auto-verify empty old entries (single DB call, no CRM)
        await batchAutoVerifyEmpty(data || [], istNow);

        // Optimized sync: fetches CRM data once per rep, then processes all entries
        const results = await optimizedSync(data || [], month || undefined, email || undefined);
        return NextResponse.json({ success: true, entries: results });

    } catch (error: any) {
        console.error("Expected Revenue GET Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Save/Update expected revenue entry
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, name, shift_date, has_revenue, sales } = body;

        if (!email || !shift_date) {
            return NextResponse.json({ error: "Email and shift_date are required" }, { status: 400 });
        }

        // Validate shift_date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(shift_date)) {
            return NextResponse.json({ error: "Invalid shift_date format. Use YYYY-MM-DD." }, { status: 400 });
        }

        // Validate edit window: only editable within 2 hours of shift start (8:00 PM IST)
        const now = new Date();
        const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

        // Fetch shift start time from settings
        const { data: settingsData } = await supabaseAdmin
            .from("sales_settings")
            .select("key, value")
            .eq("key", "shift_start_time")
            .single();

        const shiftTime = settingsData?.value || "20:00";
        const [shiftHour, shiftMin] = shiftTime.split(":").map(Number);

        // Build today's shift start in IST
        const todayShiftStart = new Date(istNow);
        todayShiftStart.setHours(shiftHour, shiftMin, 0, 0);

        // Edit window = shift start to shift start + 2 hours
        const editWindowEnd = new Date(todayShiftStart);
        editWindowEnd.setHours(editWindowEnd.getHours() + 2);

        // Determine current valid shift date based on 8:00 PM boundary
        const istCopy = new Date(istNow);
        if (istCopy.getHours() < shiftHour) {
            istCopy.setDate(istCopy.getDate() - 1);
        }
        const todayStr = `${istCopy.getFullYear()}-${String(istCopy.getMonth() + 1).padStart(2, '0')}-${String(istCopy.getDate()).padStart(2, '0')}`;

        if (shift_date !== todayStr) {
            return NextResponse.json({
                error: "You can only fill expected revenue for today's shift date.",
                editable: false
            }, { status: 403 });
        }



        // Enforce dynamic 2-hour edit window from shift start
        const hours = istNow.getHours();
        
        const endHour = shiftHour + 2;
        if (hours < shiftHour || hours >= endHour) {
            return NextResponse.json({
                error: `The edit window (Shift window strictly ${shiftHour}:00 - ${endHour}:00 IST) has closed. You can no longer modify expected revenue for this shift.`,
                locked: true
            }, { status: 403 });
        }

        // Check if entry already exists (required for edit history/count)

        const { data: existingEntry } = await supabaseAdmin
            .from("expected_revenue")
            .select("id, first_submitted_at, edit_count, submitted_at")
            .eq("email", email)
            .eq("shift_date", shift_date)
            .maybeSingle();

        // Validate sales entries
        const cleanedSales = (sales || []).map((s: any) => {
            const awl_id = String(s.awl_id || "").trim();
            const revenue = Number(s.expected_revenue);

            if (!/^AWL-\d+$/i.test(awl_id)) {
                throw new Error(`Invalid AWL ID format for "${awl_id}". Must be like "AWL-1234".`);
            }
            if (isNaN(revenue) || revenue <= 0) {
                throw new Error(`Invalid revenue for "${awl_id}". Must be a positive number.`);
            }

            return {
                awl_id: awl_id.toUpperCase(),
                expected_revenue: String(revenue)
            };
        });

        // Upsert the entry — preserve first_submitted_at, increment edit_count
        const isUpdate = !!existingEntry;
        const firstSubmittedAt = existingEntry?.first_submitted_at || new Date().toISOString();
        const newEditCount = isUpdate ? (existingEntry!.edit_count || 0) + 1 : 0;

        // Build edit_history: store previous version before overwriting
        let editHistory: any[] = [];
        if (isUpdate) {
            // Fetch full existing entry to capture previous sales
            const { data: fullExisting } = await supabaseAdmin
                .from("expected_revenue")
                .select("sales, has_revenue, submitted_at, edit_history")
                .eq("email", email)
                .eq("shift_date", shift_date)
                .single();
            if (fullExisting) {
                editHistory = fullExisting.edit_history || [];
                editHistory.push({
                    edited_at: new Date().toISOString(),
                    previous_sales: fullExisting.sales,
                    previous_has_revenue: fullExisting.has_revenue,
                    previous_submitted_at: fullExisting.submitted_at
                });
            }
        }

        const entry = {
            email,
            name: name || "",
            shift_date,
            has_revenue: has_revenue ?? false,
            sales: has_revenue ? cleanedSales : [],
            submitted_at: new Date().toISOString(),
            first_submitted_at: firstSubmittedAt,
            edit_count: newEditCount,
            edit_history: editHistory,
            verified: false,
            streak: 0,
            matched_awl_ids: []
        };

        const { data, error } = await supabaseAdmin
            .from("expected_revenue")
            .upsert(entry, { onConflict: "email, shift_date" })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, entry: data });

    } catch (error: any) {
        console.error("Expected Revenue POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH: Verify expected revenue against CRM data (Kept for manual fallback if needed, but UI button removed)
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { email, shift_date } = body;

        if (!email || !shift_date) {
            return NextResponse.json({ error: "Email and shift_date are required" }, { status: 400 });
        }

        const { data: entry } = await supabaseAdmin
            .from("expected_revenue")
            .select("*")
            .eq("email", email)
            .eq("shift_date", shift_date)
            .single();

        if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

        const istNow = getIstTime();
        const shiftTime = await getShiftTime();
        const [y, m] = entry.shift_date.split("-").map(Number);
        const cachedSales = await getCrmSales(email, y, m);

        const updated = await verifyWithCachedCrm(entry, cachedSales, shiftTime, isShiftOver(shift_date, istNow));

        return NextResponse.json({
            success: true,
            entry: updated
        });

    } catch (error: any) {
        console.error("Expected Revenue PATCH (Verify) Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
