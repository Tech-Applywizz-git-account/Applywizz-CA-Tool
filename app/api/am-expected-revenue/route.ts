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
const getShiftDate = (closedAtStr: string, shiftTimeStr: string) => {
    try {
        let year, month, day, hours, minutes;
        const str = String(closedAtStr).trim();

        if (str.includes('T') || (str.includes('-') && str.includes(':'))) {
            const [datePart, timePart] = str.split(/[T\s]/);
            const dateParts = datePart.split('-').map(Number);
            year = dateParts[0];
            month = dateParts[1];
            day = dateParts[2];
            const timeParts = timePart.replace(/[Z+].*/,'').split(':').map(Number);
            hours = timeParts[0];
            minutes = timeParts[1] || 0;
        } else if (str.includes('/')) {
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

// Cache for CRM renewals data: key = "YYYY-MM" => record[]
const crmCache = new Map<string, any[]>();
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
    const raw = process.env.NEXT_PUBLIC_CRM_API_URL || "";
    return raw.replace(/^"|"$/g, '').replace(/\/+$/, '');
}

async function getCrmRenewals(year: number, month: number): Promise<any[]> {
    const crmBase = getCrmBaseUrl();
    if (!crmBase) return [];
    
    const key = `${year}-${month}`;
    if (crmCache.has(key)) return crmCache.get(key)!;
    
    try {
        const lastDay = new Date(year, month, 0).getDate();
        const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}T23:59:59`;
        
        const url = `${crmBase}/api/renewals?startDate=${startDate}&endDate=${endDate}`;
        const crmRes = await fetch(url, { cache: 'no-store' });
        if (crmRes.ok) {
            const crmData = await crmRes.json();
            if (crmData.success && crmData.data) {
                crmCache.set(key, crmData.data);
                return crmData.data;
            }
        }
    } catch (crmErr) {
        console.warn("CRM fetch exception:", crmErr);
    }
    crmCache.set(key, []);
    return [];
}

function getIstTime() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function needsCrmSync(e: any, istNow: Date) {
    const shiftStartTime = new Date(`${e.shift_date}T20:00:00+05:30`);
    const shiftEndTime = new Date(shiftStartTime.getTime() + 24 * 60 * 60 * 1000);
    const nowTime = new Date().getTime();

    if (nowTime < shiftStartTime.getTime()) return false;
    
    if (nowTime > shiftEndTime.getTime() && e.verified) {
        if ((!e.actual_awl_ids || e.actual_awl_ids.length === 0) && e.verified_at) {
            const lastVerified = new Date(e.verified_at).getTime();
            const hoursSinceVerification = (nowTime - lastVerified) / (1000 * 60 * 60);
            if (hoursSinceVerification < 2) return true;
        }
        if (e.streak === 0 && e.has_revenue && e.sales?.length > 0) {
            if (!e.verified_at) return true;
            const lastSync = new Date(e.verified_at).getTime();
            const minsSinceSync = (nowTime - lastSync) / (1000 * 60);
            if (minsSinceSync >= 30) return true;
        }
        return false;
    }

    if (nowTime > shiftEndTime.getTime() && !e.verified) return true;

    if (!e.verified_at) return true;
    const lastSync = new Date(e.verified_at);
    const minsSinceSync = (nowTime - lastSync.getTime()) / (1000 * 60);
    return minsSinceSync >= 5;
}

function isShiftOver(shift_date: string, istNow: Date) {
    const shiftStartTime = new Date(`${shift_date}T20:00:00+05:30`);
    const shiftEndTime = new Date(shiftStartTime.getTime() + 24 * 60 * 60 * 1000); 
    return istNow > shiftEndTime;
}

async function verifyWithCachedCrm(entry: any, cachedRenewals: any[], shiftTime: string, isFinal: boolean) {
    try {
        let matchedAwlIds: string[] = [];
        let actualAwlIds: string[] = [];
        let actualRevenue = 0;
        let lastActualSaleTime: string | null = null;

        for (const record of cachedRenewals) {
            const saleCloseAt = record.closed_at;
            if (!saleCloseAt) continue;

            const saleShiftDate = getShiftDate(saleCloseAt, shiftTime);
            const saleAM = (record.account_manager_email || "").toLowerCase();

            // Match by shift date and AM email
            if (saleShiftDate === entry.shift_date && saleAM === entry.email.toLowerCase()) {
                const id = record.awl_id || record.lead_id;
                if (id) {
                    const val = Number(record.application_sale_value) || 0;
                    actualAwlIds.push(String(id).trim().toUpperCase());
                    actualRevenue += val;
                    
                    if (!lastActualSaleTime || new Date(saleCloseAt) > new Date(lastActualSaleTime)) {
                        lastActualSaleTime = saleCloseAt;
                    }
                }
            }
        }

        const normalizeId = (id: any) => String(id || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
        const expectedAwlIdsRaw = (entry.sales || []).map((s: any) => String(s.awl_id).trim().toUpperCase());
        const expectedAwlIdsNormalized = expectedAwlIdsRaw.map(normalizeId);
        const actualAwlIdsNormalized = actualAwlIds.map(normalizeId);

        matchedAwlIds = expectedAwlIdsRaw.filter((rawId: string) => {
            const normId = normalizeId(rawId);
            return actualAwlIdsNormalized.includes(normId);
        });
        
        const streakCount = matchedAwlIds.length;

        const { data: updated } = await supabaseAdmin
            .from("am_expected_revenue")
            .update({
                verified: isFinal || (matchedAwlIds.length === expectedAwlIdsRaw.length && expectedAwlIdsRaw.length > 0 && entry.has_revenue),
                streak: streakCount,
                matched_awl_ids: matchedAwlIds,
                actual_awl_ids: actualAwlIds,
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

async function batchAutoVerifyEmpty(entries: any[], istNow: Date) {
    const toVerify = entries.filter(e => {
        if (e.verified) return false;
        if (!e.verified_at && !e.has_revenue) return true;
        if (e.actual_awl_ids && e.actual_awl_ids.length > 0) return false;
        
        const shiftStartTime = new Date(`${e.shift_date}T20:00:00+05:30`);
        const shiftEndTime = new Date(shiftStartTime.getTime() + 24 * 60 * 60 * 1000);
        return istNow > shiftEndTime;
    });
    if (toVerify.length === 0) return;

    const byEmail = new Map<string, string[]>();
    toVerify.forEach(e => {
        if (!byEmail.has(e.email)) byEmail.set(e.email, []);
        byEmail.get(e.email)!.push(e.shift_date);
    });

    const updatePromises = Array.from(byEmail.entries()).map(([email, dates]) =>
        supabaseAdmin
            .from("am_expected_revenue")
            .update({ verified: true, streak: 0, verified_at: new Date().toISOString() })
            .eq("email", email)
            .in("shift_date", dates)
    );
    await Promise.all(updatePromises);

    toVerify.forEach(e => { e.verified = true; e.streak = 0; });
}

async function optimizedSync(entries: any[], monthFilter?: string, requestedEmail?: string) {
    const istNow = getIstTime();
    const shiftTime = await getShiftTime();
    const existingKeys = new Set(entries.map(e => `${e.email}|${e.shift_date}`));
    const allEmails = new Set(entries.map(e => e.email));
    
    if (requestedEmail) allEmails.add(requestedEmail);

    const emailToName = new Map<string, string>();
    if (monthFilter && !requestedEmail) {
        try {
            const { data: accountsUsers } = await supabaseAdmin
                .from("users")
                .select("email, name, role")
                .in("role", ["Accounts Associate"]);
            if (accountsUsers) {
                accountsUsers.forEach(u => {
                    allEmails.add(u.email);
                    emailToName.set(u.email.toLowerCase(), u.name);
                });
            }
        } catch (e) {
            console.warn("Failed to fetch accounts users for stub creation:", e);
        }
    }

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

    // Fetch CRM data once for the month
    const renewals = await getCrmRenewals(fetchYear, fetchMonth);

    // Prepare stub entries
    const stubsToUpsert: any[] = [];
    for (const record of renewals) {
        const saleCloseAt = record.closed_at;
        if (!saleCloseAt) continue;

        const saleShiftDate = getShiftDate(saleCloseAt, shiftTime);
        const email = (record.account_manager_email || "").toLowerCase();
        
        if (!email || !allEmails.has(email)) continue;

        const key = `${email}|${saleShiftDate}`;
        const [sy, sm] = saleShiftDate.split("-").map(Number);
        if (sy !== fetchYear || sm !== fetchMonth) continue;

        if (!existingKeys.has(key)) {
            const existingRepEntry = entries.find(e => e.email === email);
            const repName = emailToName.get(email) || existingRepEntry?.name || record.account_assigned_name || email;

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

    if (stubsToUpsert.length > 0) {
        try {
            const { data: upserted } = await supabaseAdmin
                .from("am_expected_revenue")
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
    const toSync = allEntries.filter(e => needsCrmSync(e, istNow));
    if (toSync.length === 0) return allEntries;

    const entryMap = new Map(allEntries.map(e => [`${e.email}|${e.shift_date}`, e]));
    
    const updatePromises: Promise<any>[] = [];
    for (const entry of toSync) {
        const isFinal = isShiftOver(entry.shift_date, istNow);
        updatePromises.push(
            verifyWithCachedCrm(entry, renewals, shiftTime, isFinal).then(updated => {
                entryMap.set(`${entry.email}|${entry.shift_date}`, updated);
            })
        );
    }
    
    await Promise.all(updatePromises);

    return allEntries.map(e => entryMap.get(`${e.email}|${e.shift_date}`) || e);
}

export async function GET(req: Request) {
    try {
        crmCache.clear();
        cachedShiftTime = null;

        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const mode = searchParams.get("mode");
        const month = searchParams.get("month");
        const skipSync = searchParams.get("skipSync") === "true";

        if (mode === "executive") {
            // Fetch all Accounts Associate emails and names to filter out sales persons and fix names
            const { data: accountsUsers } = await supabaseAdmin
                .from("users")
                .select("email, name")
                .eq("role", "Accounts Associate")
                .eq("isactive", true);
            
            const amEmails = accountsUsers?.map(u => u.email.toLowerCase()) || [];
            const nameMap = new Map<string, string>();
            accountsUsers?.forEach(u => nameMap.set(u.email.toLowerCase(), u.name));

            let query = supabaseAdmin
                .from("am_expected_revenue")
                .select("*")
                .order("shift_date", { ascending: false });

            if (month) {
                const lastDay = getLastDayOfMonth(month);
                query = query.gte("shift_date", `${month}-01`)
                    .lte("shift_date", lastDay);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Only include entries for Accounts Associates and override name from users table
            const filteredData = data?.filter(e => amEmails.includes(e.email.toLowerCase())).map(e => ({
                ...e,
                name: nameMap.get(e.email.toLowerCase()) || e.name
            })) || [];

            if (skipSync) {
                return NextResponse.json({ success: true, entries: filteredData });
            }

            const istNow = getIstTime();
            await batchAutoVerifyEmpty(filteredData, istNow);
            const results = await optimizedSync(filteredData, month || undefined);
            return NextResponse.json({ success: true, entries: results });
        }

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        let query = supabaseAdmin
            .from("am_expected_revenue")
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

        if (skipSync) {
            return NextResponse.json({ success: true, entries: data || [] });
        }

        const istNow = getIstTime();
        await batchAutoVerifyEmpty(data || [], istNow);
        const results = await optimizedSync(data || [], month || undefined, email || undefined);
        return NextResponse.json({ success: true, entries: results });

    } catch (error: any) {
        console.error("AM Expected Revenue GET Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, name, shift_date, has_revenue, sales } = body;

        if (!email || !shift_date) {
            return NextResponse.json({ error: "Email and shift_date are required" }, { status: 400 });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(shift_date)) {
            return NextResponse.json({ error: "Invalid shift_date format. Use YYYY-MM-DD." }, { status: 400 });
        }

        const now = new Date();
        const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

        const { data: settingsData } = await supabaseAdmin
            .from("sales_settings")
            .select("key, value")
            .eq("key", "shift_start_time")
            .single();

        const shiftTime = settingsData?.value || "20:00";
        const [shiftHour, shiftMin] = shiftTime.split(":").map(Number);

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

        const hours = istNow.getHours();
        const endHour = shiftHour + 2;
        if (hours < shiftHour || hours >= endHour) {
            return NextResponse.json({
                error: `The edit window (Shift window strictly ${shiftHour}:00 - ${endHour}:00 IST) has closed. You can no longer modify expected revenue for this shift.`,
                locked: true
            }, { status: 403 });
        }

        const { data: existingEntry } = await supabaseAdmin
            .from("am_expected_revenue")
            .select("id, first_submitted_at, edit_count, submitted_at")
            .eq("email", email)
            .eq("shift_date", shift_date)
            .maybeSingle();

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

        const isUpdate = !!existingEntry;
        const firstSubmittedAt = existingEntry?.first_submitted_at || new Date().toISOString();
        const newEditCount = isUpdate ? (existingEntry!.edit_count || 0) + 1 : 0;

        let editHistory: any[] = [];
        if (isUpdate) {
            const { data: fullExisting } = await supabaseAdmin
                .from("am_expected_revenue")
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
            .from("am_expected_revenue")
            .upsert(entry, { onConflict: "email, shift_date" })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, entry: data });

    } catch (error: any) {
        console.error("AM Expected Revenue POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
