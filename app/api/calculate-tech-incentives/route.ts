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

        // Standardized period string helper (No commas, consistent across platforms)
        const formatPeriod = (date: Date) => {
            const m = date.toLocaleString("en-US", { month: "long" });
            const y = date.getFullYear();
            return `${m} ${y}`;
        };

        periodStr = formatPeriod(targetDate);
        const startDate = new Date(year, month, 1, 0, 0, 0);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        // API Fetch helper for CRM data
        const crmApiUrl = (process.env.NEXT_PUBLIC_CRM_SYNC_URL || process.env.NEXT_PUBLIC_CRM_API_URL || "").replace(/^"|"$/g, '');
        const fetchCrmData = async (endpoint: string) => {
            try {
                const url = `${crmApiUrl}/api/${endpoint}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`;
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    return { data: json.data || [], error: null };
                }
                return { data: [], error: new Error(`Failed to fetch ${endpoint}`) };
            } catch (e: any) {
                return { data: [], error: e };
            }
        };

        // Parallel Fetch all required data to slash loading time
        const [settingsRes, usersRes, portfolioRes, githubRes, salesRes] = await Promise.all([
            supabaseAdmin.from("marketing_settings").select("key, value").in("key", [
                "usd_to_inr_rate", `usd_to_inr_rate_${periodStr}`,
                "tech_portfolio_usd", `tech_portfolio_usd_${periodStr}`,
                "tech_github_usd", `tech_github_usd_${periodStr}`,
                "tech_gitrepo_base_sale", `tech_gitrepo_base_sale_${periodStr}`,
                "tech_gitrepo_base_inc", `tech_gitrepo_base_inc_${periodStr}`,
                "tech_gitrepo_step", `tech_gitrepo_step_${periodStr}`,
                "tech_gitrepo_step_inc", `tech_gitrepo_step_inc_${periodStr}`
            ]),
            supabaseAdmin.from("users").select("id, email, isactive, department, incentive_amount, created_at, role, designation")
                .eq("department", "Tech").eq("isactive", true).lte("created_at", endDate.toISOString()),
            fetchCrmData("portfolio-progress"),
            fetchCrmData("github-progress"),
            fetchCrmData("incentive-data/all-sales")
        ]);

        if (usersRes.error || !usersRes.data) {
            return NextResponse.json({ error: "Failed to fetch tech users" }, { status: 500 });
        }

        const settingsData = settingsRes.data;
        let usersData = usersRes.data || [];

        // Strictly filter out trainees and Technical Head from the shared equity pool
        usersData = usersData.filter((u: any) => {
            const r = (u.role || "").toLowerCase();
            const d = (u.designation || "").toLowerCase();
            const isTrainee = r.includes("trainee") || d.includes("trainee") || r === "bdt-p" || d === "bdt-p";
            const isTechHead = r === "technical head" || d === "technical head";
            return !isTrainee && !isTechHead;
        });
        const portfolioData = portfolioRes.data;
        const githubData = githubRes.data;
        const salesClosureData = salesRes.data;

        let conversionRate = 85;
        let portfolioRateUSD = 2;
        let githubRateUSD = 20;
        let gitRepoBaseSale = 140;
        let gitRepoBaseInc = 7;
        let gitRepoStep = 10;
        let gitRepoStepInc = 2;

        if (settingsData) {
            const getVal = (prefix: string) => {
                const specific = settingsData.find(s => s.key === `${prefix}_${periodStr}`);
                const global = settingsData.find(s => s.key === prefix);
                return specific?.value || global?.value;
            };

            const cRate = getVal("usd_to_inr_rate");
            if (cRate) conversionRate = parseFloat(cRate);

            const pRate = getVal("tech_portfolio_usd");
            if (pRate) portfolioRateUSD = parseFloat(pRate);

            const gRate = getVal("tech_github_usd");
            if (gRate) githubRateUSD = parseFloat(gRate);

            const sBase = getVal("tech_gitrepo_base_sale");
            if (sBase) gitRepoBaseSale = parseFloat(sBase);

            const sInc = getVal("tech_gitrepo_base_inc");
            if (sInc) gitRepoBaseInc = parseFloat(sInc);

            const sStep = getVal("tech_gitrepo_step");
            if (sStep) gitRepoStep = parseFloat(sStep);

            const sSInc = getVal("tech_gitrepo_step_inc");
            if (sSInc) gitRepoStepInc = parseFloat(sSInc);
        }

        const N = usersData.length;
        if (N === 0) {
            return NextResponse.json({ message: "No active tech members", period: periodStr, processedCount: 0 });
        }

        const totalSuccessfulPortfolios = portfolioData ? portfolioData.length : 0;
        const totalSuccessfulGithubs = githubData ? githubData.length : 0;

        const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

        // 4. Math: Dynamic Per Output, split equally
        const portfolioPoolUSD = round2(totalSuccessfulPortfolios * portfolioRateUSD);
        const githubPoolUSD = round2(totalSuccessfulGithubs * githubRateUSD);
        const totalPoolUSD = round2(portfolioPoolUSD + githubPoolUSD);

        // Split share per head
        const portfolioShareUSD = round2(portfolioPoolUSD / N);
        const githubShareUSD = round2(githubPoolUSD / N);

        const individualShareUSD = round2(totalPoolUSD / N);
        const individualShareINR = round2(individualShareUSD * conversionRate);

        const portfolioShareINR = round2(portfolioShareUSD * conversionRate);
        const githubShareINR = round2(githubShareUSD * conversionRate);

        // 5. Map personal sales
        const validUserEmails = new Set(usersData.map((u: any) => u.email.toLowerCase()));

        const personalSalesLog: Record<string, Array<any>> = {};
        const personalSalesUsd: Record<string, number> = {};
        let totalGlobalGitSalesYieldUsd = 0;
        let totalGlobalGitSalesCount = 0;

        if (salesClosureData) {
            for (const sale of salesClosureData) {
                const githubInfo = Array.isArray(sale.github_info) ? sale.github_info : [];
                if (githubInfo.length > 0) {
                    const project = githubInfo[0];
                    let saleValue = parseFloat(project?.github_sold_value || sale.github_sale_value || "0");
                    const emailObj = project?.github_sold_by_email;
                    const email = typeof emailObj === "string" ? emailObj.toLowerCase() : null;

                    if (email && validUserEmails.has(email) && saleValue >= gitRepoBaseSale) {
                        let incentiveUsd = gitRepoBaseInc;
                        const extras = Math.floor((saleValue - gitRepoBaseSale) / gitRepoStep);
                        if (extras > 0) {
                            incentiveUsd += extras * gitRepoStepInc;
                        }

                        if (!personalSalesLog[email]) {
                            personalSalesLog[email] = [];
                            personalSalesUsd[email] = 0;
                        }
                        personalSalesLog[email].push({
                            lead_id: sale.lead_id,
                            sale_value: saleValue,
                            incentive_usd: incentiveUsd,
                            closed_at: sale.closed_at || project.github_sold_ts
                        });
                        personalSalesUsd[email] += incentiveUsd;
                        totalGlobalGitSalesYieldUsd += incentiveUsd;
                        totalGlobalGitSalesCount += 1;
                    }
                }
            }
        }

        // 6. Batch Store the JSON and metrics
        const upsertPayloads = [];
        const userUpdates = [];
        const finalSalesMap: Record<string, any> = {};

        for (const user of usersData) {
            const email = user.email.toLowerCase();
            const repSalesUsd = round2(personalSalesUsd[email] || 0);
            const repSalesInr = round2(repSalesUsd * conversionRate);
            const absoluteTotalInr = round2(individualShareINR + repSalesInr);

            finalSalesMap[email] = {
                poolIncentiveUsd: individualShareUSD,
                poolIncentiveInr: individualShareINR,
                portfolioPoolInr: portfolioShareINR,
                githubPoolInr: githubShareINR,
                salesIncentiveUsd: repSalesUsd,
                salesIncentiveInr: repSalesInr,
                totalCombinedInr: absoluteTotalInr,
                salesLog: personalSalesLog[email] || []
            };

            upsertPayloads.push({
                email: email,
                period: periodStr,
                completed_portfolios: totalSuccessfulPortfolios,
                pool_usd: totalPoolUSD,
                incentive_usd: individualShareUSD + repSalesUsd,
                incentive_inr: absoluteTotalInr,
                updated_at: new Date().toISOString()
            });

            const updatedIncentives = {
                ...(user.incentive_amount || {}),
                [periodStr]: absoluteTotalInr
            };

            userUpdates.push(
                supabaseAdmin.from("users").update({ incentive_amount: updatedIncentives }).eq("id", user.id)
            );
        }

        // 7. Commit to DB
        if (upsertPayloads.length > 0) {
            await supabaseAdmin.from("tech_incentives").upsert(upsertPayloads, { onConflict: "email,period" });

            if (userUpdates.length > 0) {
                await Promise.all(userUpdates);
            }
        }

        return NextResponse.json({
            message: "Success",
            period: periodStr,
            conversionRate,
            totalPortfolios: totalSuccessfulPortfolios,
            totalGithubs: totalSuccessfulGithubs,
            portfolioRateUSD,
            githubRateUSD,
            portfolioPoolUSD,
            githubPoolUSD,
            totalPoolUSD,
            gitRepoBaseSale,
            gitRepoBaseInc,
            gitRepoStep,
            gitRepoStepInc,
            totalGlobalGitSalesYieldUsd,
            totalGlobalGitSalesCount,
            individualShareUSD,
            individualShareINR,
            processedCount: usersData.length,
            personalSalesInsights: finalSalesMap,
            portfoliosData: portfolioRes.data || [],
            githubData: githubRes.data || []
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
