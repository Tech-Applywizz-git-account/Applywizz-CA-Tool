import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GET as calculateIncentives } from "@/app/api/calculate-sales-incentives/route";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getNextSlab = (role: string, currentRevenue: number) => {
    if (role === 'BDT-P' || role === 'BDT') {
        if (currentRevenue < 500) return { nextTarget: 500, nextIncentive: 0, label: "Base Target" };
        return { nextTarget: null, label: "Target Cleared!" };
    }

    const slabs = [
        { rev: 1000, inc: 4000, roles: ['BDA'] },
        { rev: 2000, inc: 5500, roles: ['BDA', 'SBDA'] },
        { rev: 2500, inc: 8500, roles: ['BDA', 'SBDA'] },
        { rev: 3500, inc: 10500, roles: ['BDA', 'SBDA'] },
        { rev: 5000, inc: 15500, roles: ['BDA', 'SBDA'] },
        { rev: 6000, inc: 19000, roles: ['BDA', 'SBDA'] },
        { rev: 7000, inc: 23000, roles: ['BDA', 'SBDA'] },
        { rev: 8000, inc: 28000, roles: ['BDA', 'SBDA'] },
        { rev: 9000, inc: 34000, roles: ['BDA', 'SBDA'] },
        { rev: 10000, inc: 40000, roles: ['BDA', 'SBDA'] },
    ];

    for (const slab of slabs) {
        if (slab.roles.includes(role) && currentRevenue < slab.rev) {
            return { nextTarget: slab.rev, nextIncentive: slab.inc };
        }
    }
    return { nextTarget: null };
};

const isCurrentPeriod = (periodStr: string) => {
    const parts = periodStr.split(" to ");
    if (parts.length < 2) return false;
    const start = new Date(parts[0] + "T00:00:00Z");
    const end = new Date(parts[1] + "T23:59:59Z");
    const now = new Date();
    return now >= start && now <= end;
};

// Azure MS Graph Auth Helper
async function getGraphToken() {
    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) return null;

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
        client_id: clientId,
        scope: "https://graph.microsoft.com/.default",
        client_secret: clientSecret,
        grant_type: "client_credentials",
    });

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
    });
    const data = await res.json();
    return data.access_token;
}

// MS Graph Sender Helper
async function sendGraphEmail(token: string, toEmail: string, subject: string, htmlContent: string) {
    const sender = process.env.SENDER_EMAIL;
    const url = `https://graph.microsoft.com/v1.0/users/${sender}/sendMail`;

    return fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: {
                subject: subject,
                body: { contentType: "HTML", content: htmlContent },
                toRecipients: [{ emailAddress: { address: toEmail } }]
            },
            saveToSentItems: "false"
        })
    });
}

function buildEmailTemplate(user: any, pData: any, role: string) {
    const rev = pData?.total_revenue || 0;
    const target = pData?.target_amount || 0;
    const slabInfo = getNextSlab(role, rev);

    let subject = "";
    let colorClass = "#4f46e5"; // Indigo
    let message = "";
    let motivationalQuote = "";

    // Template 1: Zero Output
    if (rev === 0) {
        subject = "🔥 Today is Your Day! Let's Ignite Your Sales Engine!";
        colorClass = "#6366f1"; // Deep Indigo
        message = `We haven't seen any sales recorded for you in this active period yet. The absolute best time to make your first strike is right now! Jump on the phones, connect with the clients, and unlock your first milestone today.`;
        motivationalQuote = "“The secret of getting ahead is getting started.” – Mark Twain";
    }
    // Template 2: Trudging Forward (Below Target)
    else if (rev < target) {
        subject = "🚀 You're On The Board! Time to Hit That Target!";
        colorClass = "#0284c7"; // Sky Blue
        message = `Incredible work putting numbers on the board! You currently have <strong>$${rev.toLocaleString()}</strong> secured. You are only <strong>$${(target - rev).toLocaleString()}</strong> away from crossing your required base target. Keep pushing hard!`;
        motivationalQuote = "“Quality performance starts with a positive attitude.” – Jeffrey Gitomer";
    }
    // Template 3 & 4 & 5: Above Target, Grinding Slabs
    else if (rev >= target && slabInfo.nextTarget) {
        subject = `💰 Milestone Achieved! Next Target: ₹${slabInfo.nextIncentive?.toLocaleString()}!`;
        colorClass = "#059669"; // Emerald
        message = `Congratulations! You have crossed your base target and sit at an amazing <strong>$${rev.toLocaleString()}</strong> in active period sales.<br/><br/>
        You are incredibly close to your next massive payout slab! <br/><br/>
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; font-size: 16px; margin: 20px 0;">
            <strong>🔥 UNLOCK ₹${slabInfo.nextIncentive?.toLocaleString()}!</strong><br/>
            Just secure <strong>$${(slabInfo.nextTarget - rev).toLocaleString()}</strong> more to reach the $${slabInfo.nextTarget.toLocaleString()} goal line.
        </div>`;
        motivationalQuote = "“Don’t stop when you’re tired. Stop when you’re done.” – David Goggins";
    }
    // Template 6: Maximum Slabs
    else {
        subject = "🏆 UNSTOPPABLE! Maximum Incentives Mastered!";
        colorClass = "#d97706"; // Amber/Gold
        message = `You are a literal legend. You have shattered every single expected metric and secured <strong>$${rev.toLocaleString()}</strong> this period reaching the maximum tier ceiling.<br/><br/>
        Your momentum is carrying the whole team. Take a bow!`;
        motivationalQuote = "“Success is not final; failure is not fatal: It is the courage to continue that counts.” – Winston S. Churchill";
    }

    const html = `
    <div style="font-family: 'Inter', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: ${colorClass}; font-size: 24px; margin-top: 0;">Hi ${user.name},</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            ${message}
        </p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 30px;">
            <h3 style="margin-top: 0; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Current Period Snapshot</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Current Role:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #0f172a;">${role}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #64748b;">Total Confirmed Sales:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #10b981; font-size: 18px;">$${rev.toLocaleString()}</td>
                </tr>
            </table>
        </div>

        <p style="margin-top: 30px; color: #64748b; font-style: italic; text-align: center; font-size: 14px;">
            ${motivationalQuote}
        </p>

        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
            <a href="https://incentive-dashboard-iota.vercel.app" style="display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">Login to Dashboard</a>
        </div>
    </div>
    `;

    return { subject, html };
}

export async function GET(req: Request) {
    try {
        // Enforce basic auth check if needed for cron security 
        // Example: if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", {status: 401});

        const token = await getGraphToken();
        if (!token) return NextResponse.json({ error: "MS Graph authentication failed. Missing keys." }, { status: 500 });

        // 1. Fetch Sales Personnel
        const { data: users, error: userErr } = await supabaseAdmin
            .from("users")
            .select("id, name, email, role, designation, isactive")
            .in("role", ["BDT-P", "BDT", "BDA", "SBDA"])
            .eq("isactive", true);

        if (userErr || !users) throw new Error("Failed to load users");

        const reports = [];

        // 2. Loop Through Users and compute
        for (const user of users) {
            // Spoof the GET Request URL to reuse your incredible existing calculation logic!
            const fakeReq = new Request(`http://localhost:3000/api/calculate-sales-incentives?email=${encodeURIComponent(user.email)}&role=${encodeURIComponent(user.role || user.designation)}`);

            try {
                const res = await calculateIncentives(fakeReq);
                const data = await res.json();

                if (!data.success || !data.periods) continue;

                // Find Active Period
                let activeData = null;
                for (const [pName, pData] of Object.entries(data.periods)) {
                    if (isCurrentPeriod(pName)) {
                        activeData = pData;
                        break;
                    }
                }

                // Prepare zero-base fallback if period exactly started today and has no sales array registered yet
                if (!activeData) {
                    activeData = {
                        total_revenue: 0,
                        target_amount: user.role.startsWith("BDT") ? 500 : (user.role === "BDA" ? 1000 : 2000)
                    };
                }

                const { subject, html } = buildEmailTemplate(user, activeData, user.role);

                await sendGraphEmail(token, user.email, subject, html);
                reports.push({ email: user.email, status: "Sent", subject });

            } catch (e: any) {
                reports.push({ email: user.email, status: "Failed", error: e.message });
            }
        }

        return NextResponse.json({ success: true, processed: reports.length, reports });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
