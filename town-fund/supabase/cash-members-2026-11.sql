-- Cash members + security fix (Nov 2026)
-- Run once in Supabase: SQL Editor > New query > paste all > Run

-- 1) SECURITY FIX: members could edit ANY column of their own profile
--    (including subscription_status). Now they can only edit name, initial and photo.
revoke update on profiles from anon, authenticated;
grant update (first_name, last_initial, avatar_url) on profiles to authenticated;
revoke insert on profiles from anon, authenticated;
grant insert (id, email) on profiles to authenticated;

-- 2) New columns for cash members and admin access
alter table profiles add column if not exists paid_through date;
alter table profiles add column if not exists is_admin boolean not null default false;

alter table fund_ledger add column if not exists original_amount numeric;
alter table fund_ledger add column if not exists original_currency text;
alter table fund_ledger add column if not exists exchange_rate numeric;

-- 3) One shared rule for "is this person a member right now?"
--    Active Stripe subscription OR paid in cash through today or later.
create or replace function is_active_member(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p
    where p.id = uid
      and (p.subscription_status = 'active' or p.paid_through >= current_date)
  );
$$;

-- 4) Nominating and voting now use that rule
drop policy if exists "active members can nominate" on nominations;
create policy "active members can nominate" on nominations
  for insert with check (auth.uid() = member_id and is_active_member(auth.uid()));

drop policy if exists "active members can vote" on votes;
create policy "active members can vote" on votes
  for insert with check (auth.uid() = member_id and is_active_member(auth.uid()));

-- 5) Make yourself admin — CHANGE THE EMAIL to the one you sign in with
update profiles set is_admin = true where email = 'YOUR-EMAIL@example.com';

-- 6) Check: you should see your row with is_admin = true
select email, is_admin, subscription_status, paid_through from profiles where is_admin;
