-- SUPABASE SCHEMA & RPC FUNCTIONS

-- 1. Create/Update run_reset_button RPC
CREATE OR REPLACE FUNCTION run_reset_button()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_processed integer := 0;
  rec_ca record;
  v_incent numeric := 0;
  v_is_completed boolean := true;
  v_curr_xp integer;
  v_curr_coins integer;
  v_curr_streak integer;
  v_new_xp integer;
  v_new_coins integer;
  v_new_streak integer;
  v_completed_profiles jsonb := '[]'::jsonb;
begin
   
  for rec_ca in
    select id, name, role
    from users
    where role in ('Junior CA', 'CA', 'Career Associative Trainee')
  loop
 
    v_incent := 0;
    v_is_completed := true;
 
    -- Aggregating work for the user
    with logs as (
      select
        c.id, c.name, c.status, c.end_time, c.start_time,
        coalesce(c.jobs_applied,0) as jobs_applied,
        c.work_done_by,
        c.date as date_assigned,
        c.emails_required as emails_required,
        coalesce(c.emails_submitted,0) as emails_submitted,
        c.client_designation, c.job_urls, c.company_names, c.screenshots
      from clients c
      where c.work_done_by = rec_ca.id
    )
    select
      coalesce(jsonb_agg(
          jsonb_build_object(
            'id', id, 'name', name, 'status', status,
            'end_time', end_time, 'start_time', start_time,
            'jobs_applied', jobs_applied, 'work_done_by', work_done_by,
            'date_assigned', date_assigned, 'emails_required', emails_required,
            'emails_submitted', emails_submitted, 'client_designation', client_designation,
            'job_urls', job_urls, 'company_names', company_names, 'screenshots', screenshots
          )
        ), '[]'::jsonb)
    into v_completed_profiles
    from logs;
 
    -- Penalty Logic if no work was done
    if v_completed_profiles = '[]'::jsonb then
      select xp, coins, streak
        into v_curr_xp, v_curr_coins, v_curr_streak
      from game_stats
      where ca_id = rec_ca.id
      for update;
 
      v_curr_xp := coalesce(v_curr_xp, 0);
      v_curr_coins := coalesce(v_curr_coins, 0);
      v_curr_streak := coalesce(v_curr_streak, 0);
 
      v_new_coins := greatest(0, v_curr_coins - 50);
      v_new_xp := v_curr_xp;
      v_new_streak := 0;
 
      insert into game_stats (ca_id, xp, coins, streak)
      values (rec_ca.id, v_new_xp, v_new_coins, v_new_streak)
      on conflict (ca_id) do update
      set xp = excluded.xp,
          coins = excluded.coins,
          streak = excluded.streak;
 
      v_is_completed := false;
 
    else
      -- Incentive Calculation (Skip for Trainees)
      if rec_ca.role = 'Career Associative Trainee' then
        v_incent := 0;
      else
        with j as (
          select
            (elem->>'emails_required')::int as req,
            (elem->>'emails_submitted')::int as sub
          from jsonb_array_elements(v_completed_profiles) elem
        )
        select
          sum(
            case
              when req = 50 then
                case
                  when sub >= 46 then 2.0  
                  when sub between 41 and 45 then 1.7
                  when sub between 36 and 40 then 1.5
                  when sub between 31 and 35 then 1.3
                  when sub between 26 and 30 then 1.2
                  when sub between 21 and 25 then 1.0
                  when sub between 16 and 20 then 0.8
                  when sub between 10 and 15 then 0.5
                  when sub between 1 and 9 then 0.3
                  else 0
                end
              when req = 40 then
                case
                  when sub >= 36 then 1.5  
                  when sub between 31 and 35 then 1.3
                  when sub between 26 and 30 then 1.2
                  when sub between 21 and 25 then 1.0
                  when sub between 16 and 20 then 0.8
                  when sub between 10 and 15 then 0.5
                  when sub between 1 and 9 then 0.3
                  else 0.0
                end
              else
                case
                  when sub >= 21 then 1.0
                  when sub between 16 and 20 then 0.8
                  when sub between 10 and 15 then 0.5
                  when sub between 1 and 9 then 0.3
                  else 0.0
                end
            end
          )
        into v_incent
        from j;
 
        -- Applying role-based mandatory profile deductions
        if rec_ca.role = 'Junior CA' then
          v_incent := greatest(v_incent - 2, 0);
        else
          v_incent := greatest(v_incent - 4, 0);
        end if;
      end if;
    end if;
 
    -- Record work history
    insert into work_history (date, ca_id, ca_name, completed_profiles, incentives)
    values (current_date - interval '1 day', rec_ca.id, rec_ca.name, v_completed_profiles, v_incent);
    
    v_processed := v_processed + 1;
  end loop;
 
  -- Global Reset of Client Data
  update clients
  set emails_submitted = 0,
      jobs_applied = 0,
      start_time = null,
      end_time = null,
      status = 'Not Started',
      job_urls = null,
      company_names = null,
      screenshots = null,
      work_done_by = null,
      work_done_ca_name = null,
      remarks = null,
      date = current_date
  where 1 = 1;
 
  -- Cleanup and Utilities
  delete from rewards where day < current_date - interval '30 days';
  refresh materialized view public.mv_profile_emails;
 
  return jsonb_build_object(
    'day', current_date,
    'processed', v_processed,
    'status', 'success'
  );
end;
$$;
