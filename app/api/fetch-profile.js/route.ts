import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = "nodejs";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const awl_id = searchParams.get("AWL-id");
    const dateParam = searchParams.get("date");

    if (!awl_id) {
        return NextResponse.json({ error: "Missing AWL-id parameter" }, { status: 400 });
    }

    try {
        // 1. Fetch client UUID from 'clients' table using applywizz_id
        const { data: client, error: clientError } = await supabase
            .from("clients")
            .select("id")
            .eq("applywizz_id", awl_id)
            .maybeSingle();

        if (clientError) {
            return NextResponse.json({ error: "Database error while fetching client", details: clientError.message }, { status: 500 });
        }

        if (!client) {
            return NextResponse.json({ error: `Client with AWL-id ${awl_id} not found` }, { status: 404 });
        }

        const clientUuid = client.id;

        // 2. Search in 'work_history' table
        // We do NOT filter by ca_name because the client might have been reassigned.
        // We find the work history based solely on the client's unique UUID.
        let query = supabase
            .from("work_history")
            .select("completed_profiles, date, ca_name, ca_id");

        // If date is provided, use it to filter
        if (dateParam && dateParam.trim() !== "" && dateParam !== "{}") {
            query = query.eq("date", dateParam);
        }

        const { data: history, error: historyError } = await query;

        if (historyError) {
            return NextResponse.json({ error: "Database error while fetching work history", details: historyError.message }, { status: 500 });
        }

        if (!history || history.length === 0) {
            return NextResponse.json({ error: "No work history found" }, { status: 404 });
        }

        // 3. Find the record where the client's UUID exists in the completed_profiles JSON array
        const matchingRecords = history.filter((record: any) => {
            let profiles = record.completed_profiles;
            if (!profiles) return false;

            // Handle potential string-encoded JSON or double-encoding
            let parsedProfiles = profiles;
            if (typeof profiles === "string") {
                try {
                    parsedProfiles = JSON.parse(profiles);
                    if (typeof parsedProfiles === "string") {
                        parsedProfiles = JSON.parse(parsedProfiles);
                    }
                } catch {
                    return false;
                }
            }

            if (Array.isArray(parsedProfiles)) {
                const targetId = clientUuid.trim().toLowerCase();
                return parsedProfiles.some((p: any) =>
                    String(p?.id || "").trim().toLowerCase() === targetId
                );
            }
            return false;
        });

        if (matchingRecords.length === 0) {
            return NextResponse.json({ error: "No matching record found for this client in work history" }, { status: 404 });
        }

        // Sort by date descending to get the latest match
        matchingRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const finalRecord = matchingRecords[0];

        // Process the profiles to find the exact one for the client
        let profiles = finalRecord.completed_profiles;
        if (typeof profiles === "string") {
            try {
                profiles = JSON.parse(profiles);
                if (typeof profiles === "string") {
                    profiles = JSON.parse(profiles);
                }
            } catch {
                profiles = [];
            }
        }

        if (Array.isArray(profiles)) {
            const targetId = clientUuid.trim().toLowerCase();
            const clientProfile = profiles.find((p: any) =>
                String(p?.id || "").trim().toLowerCase() === targetId
            );

            if (!clientProfile) {
                return NextResponse.json({ error: "Client data not found in the matched history record" }, { status: 404 });
            }

            // Map to only requested fields
            const filteredResult = {
                id: clientProfile.id,
                job_url: clientProfile.job_urls || clientProfile.job_url || null,
                company_names: clientProfile.company_names || null,
                screenshots: clientProfile.screenshots || null,
                jobs_applied: clientProfile.jobs_applied || 0
            };

            const prettyJson = JSON.stringify(filteredResult, null, 2);

            return new Response(prettyJson, {
                headers: {
                    "Content-Type": "application/json",
                    "X-Matching-Date": finalRecord.date,
                    "X-Matching-CA": finalRecord.ca_name
                },
            });
        }

        return NextResponse.json({ error: "Invalid data format in work history" }, { status: 500 });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
    }
}
