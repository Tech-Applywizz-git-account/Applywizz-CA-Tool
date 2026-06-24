export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const revalidate = 0;
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const supabaseCrm = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_CRM || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY_CRM || ""
);

function getWorkingDays(year: number, month: number, excludedDatesList: string[] = []) {
    let days = 0;
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!excludedDatesList.includes(dateStr)) {
                days++;
            }
        }
        date.setDate(date.getDate() + 1);
    }
    return days;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let periodStr = searchParams.get("period");

        let targetDate = new Date();
        if (periodStr) {
            targetDate = new Date(periodStr + " 1");
            if (isNaN(targetDate.getTime())) targetDate = new Date();
        } else {
            periodStr = targetDate.toLocaleString("default", { month: "long", year: "numeric" });
        }

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const startDate = new Date(year, month, 1, 0, 0, 0);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        // Fetch settings
        const { data: settingsData } = await supabaseAdmin
            .from("resume_settings")
            .select("key, value");

        const excludedDatesSetting = settingsData?.find(s => s.key === `resume_excluded_dates_${periodStr}`);
        const excludedDatesList: string[] = excludedDatesSetting?.value ? JSON.parse(excludedDatesSetting.value) : [];

        const workingDaysCount = getWorkingDays(year, month, excludedDatesList);
        const baselineTarget = workingDaysCount * 3;

        const getSetting = (key: string, defVal: number) => {
            if (!settingsData) return defVal;
            const specific = settingsData.find(s => s.key === `${key}_${periodStr}`);
            const global = settingsData.find(s => s.key === key);
            if (specific?.value) return parseFloat(specific.value);
            if (global?.value) return parseFloat(global.value);
            return defVal;
        };

        const baseTier1 = getSetting("forage_base_1_usd", 30);
        const baseTier2 = getSetting("forage_base_2_usd", 50);
        const baseTier3 = getSetting("forage_base_3_usd", 100);
        const baseTier4 = getSetting("forage_base_4_usd", 120);

        const extraResumeRate = getSetting("resume_rate", 80);
        const forageBaseUSD = getSetting("forage_base_incentive_usd", 3);
        const forageTeamUSD = getSetting("forage_team_split_usd", 2);
        const forageUSDToINR = getSetting("forage_usd_to_inr", 85);
        const fMS1_USD = getSetting("forage_milestone_1_usd", 1000);
        const fMS1_INR = getSetting("forage_milestone_1_inr", 1500);
        const fMS2_USD = getSetting("forage_milestone_2_usd", 1500);
        const fMS2_INR = getSetting("forage_milestone_2_inr", 3000);
        const fMS3_USD = getSetting("forage_milestone_3_usd", 2000);
        const fMS3_INR = getSetting("forage_milestone_3_inr", 4500);

        // Fetch resume reps
        const { data: usersData, error: usersError } = await supabaseAdmin
            .from("users")
            .select("id, email, isactive, department, incentive_amount, role, designation")
            .eq("department", "Resume")
            .eq("isactive", true);

        if (usersError || !usersData) {
            return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
        }

        // Filter out Resume Head, but KEEP trainees for tracking work (they will have 0 incentive)
        const resumeTeam = (usersData || []).filter((u: any) => {
            const r = (u.role || "").toLowerCase();
            const d = (u.designation || "").toLowerCase();
            const isHead = r === "resume head" || d === "resume head" || r === "resume header" || d === "resume header";
            return !isHead;
        });

        // Separate associates and trainees for precise dashboard counting
        const associates = resumeTeam.filter((u: any) => {
            const r = (u.role || "").toLowerCase();
            const d = (u.designation || "").toLowerCase();
            const isTrainee = r.includes("trainee") || d.includes("trainee") || r === "bdt-p" || d === "bdt-p";
            return !isTrainee;
        });
        const trainees = resumeTeam.filter((u: any) => {
            const r = (u.role || "").toLowerCase();
            const d = (u.designation || "").toLowerCase();
            return r.includes("trainee") || d.includes("trainee") || r === "bdt-p" || d === "bdt-p";
        });

        const activeEmails = resumeTeam.map(u => u.email.toLowerCase());
        const allMemberEmails = activeEmails;

        const crmApiUrl = (process.env.NEXT_PUBLIC_CRM_SYNC_URL || process.env.NEXT_PUBLIC_CRM_API_URL || "").replace(/^"|"$/g, '');

        // Fetch Resumes from CRM API
        let resumeData: any[] = [];
        try {
            const resumeRes = await fetch(`${crmApiUrl}/api/resume-progress?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
            if (resumeRes.ok) {
                const resumeJson = await resumeRes.json();
                if (resumeJson.success) resumeData = resumeJson.data || [];
            }
        } catch (e) {
            console.error("Failed to fetch resume data from CRM", e);
        }

        // Wider query window to capture forage sales where closed_at and forage_sold_ts differ by month boundary
        const queryStartDate = new Date(year, month - 1, 1, 0, 0, 0); // Previous month start
        const queryEndDate = new Date(year, month + 2, 0, 23, 59, 59); // Next month end

        // Fetch sales data from unified all-sales CRM API (contains forage_info)
        let salesData: any[] = [];
        try {
            const salesRes = await fetch(`${crmApiUrl}/api/incentive-data/all-sales?startDate=${queryStartDate.toISOString()}&endDate=${queryEndDate.toISOString()}`);
            if (salesRes.ok) {
                const salesJson = await salesRes.json();
                if (salesJson.success) salesData = salesJson.data || [];
            }
        } catch (e) {
            console.error("Failed to fetch sales data from CRM", e);
        }

        const resumeCountsByEmail: Record<string, number> = {};
        for (const r of resumeData || []) {
            if (r.assigned_to_email) {
                const email = r.assigned_to_email.toLowerCase();
                resumeCountsByEmail[email] = (resumeCountsByEmail[email] || 0) + 1;
            }
        }

        // Job simulation parsing
        const forageStatsByEmail: Record<string, {
            totalUSD: number;
            directIncentiveUSD: number;
        }> = {};
        let totalTeamSplitUSD = 0;

        for (const sale of salesData || []) {
            if (!sale.forage_info || !sale.forage_info[0]) continue;

            const fInfo = sale.forage_info[0];
            const rawSellerEmail = fInfo.forage_sold_by_email?.toLowerCase();
            if (!rawSellerEmail) continue;

            const sellerEmail = activeEmails.find((e: string) =>
                e === rawSellerEmail ||
                e === rawSellerEmail.replace('@applywizz.com', '@applywizz.ai') ||
                e === rawSellerEmail.replace('@applywizz.ai', '@applywizz.com')
            );
            if (!sellerEmail) continue;

            // Determine date of sale based on forage_sold_ts first, falling back to closed_at
            const saleDateRaw = fInfo.forage_sold_ts || sale.closed_at || sale.created_at;
            if (!saleDateRaw) continue;
            const saleDate = new Date(saleDateRaw);
            if (isNaN(saleDate.getTime()) || saleDate < startDate || saleDate > endDate) continue;

            const certs = parseInt(sale.forage_internship_certification || fInfo.forage_internship_certification || "0");
            const soldValue = parseFloat(fInfo.forage_sold_value || sale.forage_internship_sale_value || "0");

            if (certs === 0 || soldValue === 0) continue;

            // Determine base target price for this many certificates
            let baseTargetPrice = baseTier1;
            if (certs === 2) baseTargetPrice = baseTier2;
            else if (certs === 3) baseTargetPrice = baseTier3;
            else if (certs >= 4) baseTargetPrice = baseTier4;

            // QUALIFYING LOGIC: Sale must meet the minimum base price (e.g., $30 for 1 cert)
            if (soldValue >= baseTargetPrice) {
                // Calculation: $3 Base + $1 for every $10 extra
                const extraRevenue = soldValue - baseTargetPrice;
                const upsellIncentive = Math.floor(extraRevenue / 10) * 1;

                const repIncentiveUSD = forageBaseUSD + upsellIncentive;

                if (!forageStatsByEmail[sellerEmail]) {
                    forageStatsByEmail[sellerEmail] = { totalUSD: 0, directIncentiveUSD: 0 };
                }

                forageStatsByEmail[sellerEmail].totalUSD += soldValue;
                forageStatsByEmail[sellerEmail].directIncentiveUSD += repIncentiveUSD;

                totalTeamSplitUSD += forageTeamUSD;
            }
        }

        // Calculate Team Split Per Member
        // The $2 from each sale is pooled and shared among all OTHER members
        const N = activeEmails.length;
        const teamSplitDistribution: Record<string, number> = {};
        if (N > 1) {
            for (const sale of salesData || []) {
                if (!sale.forage_info || !sale.forage_info[0]) continue;
                const fInfo = sale.forage_info[0];
                const rawSellerEmail = fInfo.forage_sold_by_email?.toLowerCase();
                if (!rawSellerEmail) continue;

                const sellerEmail = activeEmails.find((e: string) =>
                    e === rawSellerEmail ||
                    e === rawSellerEmail.replace('@applywizz.com', '@applywizz.ai') ||
                    e === rawSellerEmail.replace('@applywizz.ai', '@applywizz.com')
                );
                if (!sellerEmail) continue;

                // Determine date of sale based on forage_sold_ts first, falling back to closed_at
                const saleDateRaw = fInfo.forage_sold_ts || sale.closed_at || sale.created_at;
                if (!saleDateRaw) continue;
                const saleDate = new Date(saleDateRaw);
                if (isNaN(saleDate.getTime()) || saleDate < startDate || saleDate > endDate) continue;

                const certs = parseInt(sale.forage_internship_certification || fInfo.forage_internship_certification || "0");
                const soldValue = parseFloat(fInfo.forage_sold_value || sale.forage_internship_sale_value || "0");

                let baseTargetPrice = baseTier1;
                if (certs === 2) baseTargetPrice = baseTier2;
                else if (certs === 3) baseTargetPrice = baseTier3;
                else if (certs >= 4) baseTargetPrice = baseTier4;

                if (soldValue >= baseTargetPrice) {
                    const splitPerPerson = forageTeamUSD / (N - 1);
                    for (const email of activeEmails) {
                        if (email !== sellerEmail) {
                            teamSplitDistribution[email] = (teamSplitDistribution[email] || 0) + splitPerPerson;
                        }
                    }
                }
            }
        }

        const upsertPayloads = [];
        const userUpdates = [];

        for (const user of resumeTeam) {
            const email = user.email.toLowerCase();

            // Resume calculation
            const completedResumes = resumeCountsByEmail[email] || 0;
            let extraResumes = completedResumes - baselineTarget;
            if (extraResumes < 0) extraResumes = 0;
            const resumeIncentiveINR = extraResumes * extraResumeRate;

            // Forage calculation
            const fStats = forageStatsByEmail[email] || { totalUSD: 0, directIncentiveUSD: 0 };
            const teamSplitUSD = teamSplitDistribution[email] || 0;

            const r = (user.role || "").toLowerCase();
            const d = (user.designation || "").toLowerCase();
            const isTrainee = r.includes("trainee") || d.includes("trainee") || r === "bdt-p" || d === "bdt-p";

            let bonusINR = 0;
            if (fStats.totalUSD >= fMS3_USD) bonusINR = fMS3_INR;
            else if (fStats.totalUSD >= fMS2_USD) bonusINR = fMS2_INR;
            else if (fStats.totalUSD >= fMS1_USD) bonusINR = fMS1_INR;

            const forageDirectINR = fStats.directIncentiveUSD * forageUSDToINR;
            const forageTeamINR = teamSplitUSD * forageUSDToINR;

            const totalIncentiveINR = isTrainee ? 0 : (resumeIncentiveINR + forageDirectINR + forageTeamINR + bonusINR);
            const finalResumeIncentiveINR = isTrainee ? 0 : resumeIncentiveINR;
            const finalForageDirectINR = isTrainee ? 0 : forageDirectINR;
            const finalForageTeamINR = isTrainee ? 0 : forageTeamINR;
            const finalBonusINR = isTrainee ? 0 : bonusINR;

            upsertPayloads.push({
                email: email,
                period: periodStr,
                target_resumes: baselineTarget,
                completed_resumes: completedResumes,
                extra_resumes: isTrainee ? 0 : extraResumes,
                incentive_inr: finalResumeIncentiveINR, // Legacy column
                forage_sales_usd: fStats.totalUSD,
                forage_direct_incentive_inr: finalForageDirectINR,
                forage_team_split_inr: finalForageTeamINR,
                forage_bonus_inr: finalBonusINR,
                total_incentive_inr: totalIncentiveINR,
                updated_at: new Date().toISOString()
            });

            // Update JSON for users table integration
            const updatedIncentives = {
                ...(user.incentive_amount || {}),
                [periodStr]: totalIncentiveINR
            };

            userUpdates.push(
                supabaseAdmin.from("users").update({ incentive_amount: updatedIncentives }).eq("id", user.id)
            );
        }

        if (upsertPayloads.length > 0) {
            const { error: upsertError } = await supabaseAdmin
                .from("resume_incentives")
                .upsert(upsertPayloads, { onConflict: "email,period" });

            if (upsertError) {
                return NextResponse.json({ error: "Failed to save to database", details: upsertError }, { status: 500 });
            }

            // Parallel update all users JSON payloads
            if (userUpdates.length > 0) {
                await Promise.all(userUpdates);
            }

            // Delete incentives for inactive or ineligible members (like Head)
            await supabaseAdmin.from("resume_incentives").delete().eq("period", periodStr).not("email", "in", `(${activeEmails.join(",")})`);
        }

        const filteredResumeData = (resumeData || []).filter(r => r.assigned_to_email && allMemberEmails.includes(r.assigned_to_email.toLowerCase()));
        const filteredSalesData = (salesData || [])
            .filter(s => {
                if (!s.forage_info || !s.forage_info[0]) return false;
                const rawSellerEmail = s.forage_info[0].forage_sold_by_email?.toLowerCase();
                if (!rawSellerEmail) return false;
                const sellerEmail = allMemberEmails.find((e: string) =>
                    e === rawSellerEmail ||
                    e === rawSellerEmail.replace('@applywizz.com', '@applywizz.ai') ||
                    e === rawSellerEmail.replace('@applywizz.ai', '@applywizz.com')
                );
                if (!sellerEmail) return false;

                const saleDateRaw = s.forage_info[0].forage_sold_ts || s.closed_at || s.created_at;
                if (!saleDateRaw) return false;
                const saleDate = new Date(saleDateRaw);
                return !isNaN(saleDate.getTime()) && saleDate >= startDate && saleDate <= endDate;
            })
            .map(s => {
                return {
                    ...s,
                    closed_at: s.forage_info[0].forage_sold_ts || s.closed_at || s.created_at
                };
            });

        // Global metrics including trainees
        const totalDeptResumes = filteredResumeData.length;
        const totalDeptForageUsd = filteredSalesData.reduce((sum, s) => {
            const val = parseFloat(s.forage_info[0].forage_sold_value || "0");
            return sum + val;
        }, 0);

        return NextResponse.json({
            message: "Success",
            period: periodStr,
            baselineTarget,
            extraResumeRate,
            workingDays: workingDaysCount,
            processedCount: associates.length,
            totalActiveCount: resumeTeam.length,
            // Added for Resume Head Dashboard
            totalResumes: totalDeptResumes,
            totalForageUsd: totalDeptForageUsd,
            totalIncentiveInr: upsertPayloads.reduce((sum, p) => sum + p.total_incentive_inr, 0),
            resumeData: filteredResumeData,
            forageSalesData: filteredSalesData,
            insights: upsertPayloads
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
