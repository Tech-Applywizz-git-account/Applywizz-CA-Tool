// app/api/bulk-invite/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role
);

const PUBLIC_SUPABASE = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // for public table ops
);

type CsvRow = {
  name?: string;
  email: string;
  password?: string; // <-- NEW (optional)
  role: "CA" | "Junior CA" | "Team Lead" | "CRO" | "COO" | "CEO" | "Admin";
  department?: string;
  isactive?: string | boolean;
  team_lead_email?: string;
};

export async function POST(req: Request) {
  try {
    // Expect multipart form-data with a 'file' part
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "CSV file is required (key: file)" }, { status: 400 });
    }

    // Read CSV
    // const csvBuffer = Buffer.from(await file.arrayBuffer());
    // const rows = parse(csvBuffer, {
    //   columns: true,
    //   skip_empty_lines: true,
    //   trim: true,
    // }) as CsvRow[];
const csvBuffer = Buffer.from(await file.arrayBuffer());

  const rows = parse(csvBuffer, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true, // handles BOM in CSV headers
}) as CsvRow[];


    // Normalize + basic validation
    // const normalized: CsvRow[] = rows.map((r) => {
    //   const email = (r.email || "").toLowerCase().trim();
    //   const role = (r.role || "").trim() as CsvRow["role"];

    //   // auto department by role if not provided
    //   let department = r.department?.trim();
    //   if (!department) {
    //     department =
    //       role === "CA" || role === "Junior CA" || role === "Team Lead"
    //         ? "Client Operations"
    //         : "Executive";
    //   }

    //   // isactive default true
    //   const isActive =
    //     typeof r.isactive === "boolean"
    //       ? r.isactive
    //       : String(r.isactive ?? "true").toLowerCase() !== "false";

    //   return {
    //     name: r.name?.trim() || "",
    //     email,
    //     role,
    //     department,
    //     isactive: isActive,
    //     team_lead_email: r.team_lead_email ? r.team_lead_email.toLowerCase().trim() : undefined,
    //   };
    // });

    const toTitle = (s: string) =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const nameFromEmail = (email: string) => {
  const user = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return toTitle(user);
};

//     const normalized: CsvRow[] = rows.map((r) => {
//   const email = (r.email || "").toLowerCase().trim();
//   const role  = (r.role  || "").trim() as CsvRow["role"];

//   let department = r.department?.trim();
//   if (!department) {
//     department = role === "CA" || role === "Junior CA" || role === "Team Lead"
//       ? "Client Operations"
//       : "Executive";
//   }

//   const isActive =
//     typeof r.isactive === "boolean"
//       ? r.isactive
//       : String(r.isactive ?? "true").toLowerCase() !== "false";

//   return {
//     name: r.name?.trim(), // keep undefined if absent
//     email,
//     role,
//     department,
//     isactive: isActive,
//     team_lead_email: r.team_lead_email ? r.team_lead_email.toLowerCase().trim() : undefined,
//   };
// });

const normalized: CsvRow[] = rows.map((r) => {
  const email = (r.email || "").toLowerCase().trim();
  const role  = (r.role  || "").trim() as CsvRow["role"];

  let department = r.department?.trim();
  if (!department) {
    department =
      role === "CA" || role === "Junior CA" || role === "Team Lead"
        ? "Client Operations"
        : "Executive";
  }

  const isActive =
    typeof r.isactive === "boolean"
      ? r.isactive
      : String(r.isactive ?? "true").toLowerCase() !== "false";

  // password: take CSV or fallback
  const password = (r.password?.trim() || "Temp@123"); // <-- you can change the default

  return {
    name: r.name?.trim(),
    email,
    password, // <-- include
    role,
    department,
    isactive: isActive,
    team_lead_email: r.team_lead_email ? r.team_lead_email.toLowerCase().trim() : undefined,
  };
});



    // Deduplicate incoming by email (keep first occurrence)
    const seen = new Set<string>();
    const deduped = normalized.filter((r) => {
      if (!r.email) return false;
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    // Preload teams + users we might need
    // Map: leadEmail -> team { id, name }
    const leadEmails = Array.from(
      new Set(
        deduped
          .filter((r) => r.team_lead_email)
          .map((r) => r.team_lead_email!)
      )
    );

    // let leadEmailToTeamId = new Map<string, string>();
    let leadEmailToTeamId = new Map<string, string | null>();


    if (leadEmails.length) {
      // find lead user ids by email
      const { data: leadUsers, error: leadUsersErr } = await PUBLIC_SUPABASE
        .from("users")
        .select("id,email")
        .in("email", leadEmails);

      if (!leadUsersErr && leadUsers?.length) {
        const leadIds = leadUsers.map((u) => u.id);

        const { data: teams, error: teamsErr } = await PUBLIC_SUPABASE
          .from("teams")
          .select("id, lead_id");

        if (!teamsErr && teams) {
          // Build email -> team_id
          const leadIdToTeam = new Map(teams.map((t) => [t.lead_id, t.id]));
          for (const u of leadUsers) {
            const teamId = leadIdToTeam.get(u.id);
            if (teamId) leadEmailToTeamId.set(u.email, teamId);
          }
        }
      }
    }

    // To avoid re-creating teams per lead, cache leadId -> teamId we create now
    const leadIdToTeamIdCache = new Map<string, string>();

    // Results
    const results: Array<{
      email: string;
      status: "invited" | "skipped" | "error";
      message?: string;
    }> = [];

    // Helper: ensure a Team exists for a Team Lead (create if missing)
    const ensureTeamForLead = async (leadId: string, leadName: string | null) => {
      // Check cached
      if (leadIdToTeamIdCache.has(leadId)) return leadIdToTeamIdCache.get(leadId)!;

      // Check DB
      const { data: existing, error: existErr } = await PUBLIC_SUPABASE
        .from("teams")
        .select("id")
        .eq("lead_id", leadId)
        .limit(1);

      if (!existErr && existing && existing.length) {
        leadIdToTeamIdCache.set(leadId, existing[0].id);
        return existing[0].id;
      }

      // Create new
      const teamName = leadName ? `${leadName} Team` : "New Team";
      const { data: created, error: teamErr } = await PUBLIC_SUPABASE
        .from("teams")
        .insert({ name: teamName, lead_id: leadId })
        .select("id")
        .single();

      if (teamErr) throw new Error(teamErr.message);
      leadIdToTeamIdCache.set(leadId, created!.id);
      return created!.id;
    };

    // Process each row sequentially (10 users → fine; keeps rate under control)
    for (const row of deduped) {
      const email = row.email;

      // Skip if already in public.users
      const { data: existingUser, error: existErr } = await PUBLIC_SUPABASE
        .from("users")
        .select("id, role, name")
        .eq("email", email)
        .maybeSingle();

      if (existErr) {
        results.push({ email, status: "error", message: `Lookup failed: ${existErr.message}` });
        continue;
      }
      if (existingUser) {
        results.push({ email, status: "skipped", message: "Already exists in users table" });
        continue;
      }

      // 1) Send invite (verification email)
    //   const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    //     email,
    //     {
    //       // Use env var to make this work on prod and preview
    //       redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    //     }
    //   );

    //   if (inviteErr) {
    //     // Common case: already registered — we’ll still try to insert profile if needed
    //     results.push({ email, status: "error", message: inviteErr.message });
    //     continue;
    //   }

    // 1) Send invite (verification email)
// 1) Create auth user with password and mark email as verified
// 1) Create account and send verification email
const tempPassword = "Created@123"; // Generate random temp password
const { data: signUpData, error: signUpErr } = await PUBLIC_SUPABASE.auth.signUp({
  email,
  password: tempPassword, // Required for signUp
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  },
});

if (signUpErr) {
  results.push({ email, status: "error", message: signUpErr.message });
  continue;
}




      // 2) Insert into public.users
      // Resolve department already computed; set designation = role
      const finalName =
  (row.name && row.name.trim().length > 0 ? row.name.trim() : nameFromEmail(email));
      let team_id: string | null = null;

      // If Team Lead → ensure a team
      if (row.role === "Team Lead") {
        // The newly invited auth user has an id only after they finish sign-up.
        // We create the public.users row now; team will be created after we know this row's id.
        // But since you want the team right away, we'll do: insert public.users first → get id → create team.
      }

    //   const { data: inserted, error: insertErr } = await PUBLIC_SUPABASE
    //     .from("users")
    //     .insert({
    //       name: row.name || null,
    //       email: email,
    //       role: row.role,
    //       designation: row.role,
    //       department: row.department,
    //       isactive: row.isactive === true,
    //       created_at: new Date().toISOString(),
    //       base_salary: null,
    //       team_id: null, // set after if CA/JCA
    //     })
    //     .select("id, name, role, email")
    //     .single();

    const { data: inserted, error: insertErr } = await PUBLIC_SUPABASE
  .from("users")
  .insert({
    name: finalName,                 // <— use computed name
    email: email,
    role: row.role,
    designation: row.role,
    department: row.department,
    isactive: row.isactive === true,
    created_at: new Date().toISOString(),
    base_salary: null,
    team_id: null,
  })
  .select("id, name, role, email")
  .single();


      if (insertErr || !inserted) {
        results.push({
          email,
          status: "error",
          message: insertErr?.message || "Failed to insert user row",
        });
        continue;
      }

      // If Team Lead → ensure a team exists
      if (inserted.role === "Team Lead") {
        try {
          await ensureTeamForLead(inserted.id, inserted.name || null);
        } catch (e: any) {
          // not fatal to the 'invite' step
          results.push({
            email,
            status: "error",
            message: `User invited; team creation failed: ${e.message}`,
          });
          continue;
        }
      }

      // If CA/JCA + team_lead_email provided → assign team_id
      if ((inserted.role === "CA" || inserted.role === "Junior CA") && row.team_lead_email) {
        // Do we already have a team for that team_lead_email?
        let targetTeamId = leadEmailToTeamId.get(row.team_lead_email) || null;

        // If we don't, try to find/create by fetching the lead
        if (!targetTeamId) {
          const { data: leadUser, error: leadErr } = await PUBLIC_SUPABASE
            .from("users")
            .select("id, name, email, role")
            .eq("email", row.team_lead_email)
            .maybeSingle();

          if (!leadErr && leadUser && leadUser.role === "Team Lead") {
            try {
              targetTeamId = await ensureTeamForLead(leadUser.id, leadUser.name || null);
              leadEmailToTeamId.set(row.team_lead_email, targetTeamId);
            } catch (e: any) {
              // couldn't ensure team, continue without assignment
              targetTeamId = null;
            }
          }
        }

        if (targetTeamId) {
          await PUBLIC_SUPABASE.from("users").update({ team_id: targetTeamId }).eq("id", inserted.id);
        }
      }

      results.push({ email, status: "invited" });
    }

    return NextResponse.json({ count: results.length, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Bulk invite failed" }, { status: 500 });
  }
}
