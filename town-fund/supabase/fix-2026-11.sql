-- Run once in Supabase: SQL Editor > New query > paste > Run

-- 1) Let members remove their own vote, so "change my vote" works
--    (the app deletes the old vote, then inserts the new one).
drop policy if exists "members can delete their own vote" on votes;
create policy "members can delete their own vote" on votes
  for delete using (auth.uid() = member_id);

-- 2) Make sure there is an open voting round to test against.
--    Does nothing if one is already open.
insert into voting_cycles (status, opens_at, closes_at)
select 'open', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 second'
where not exists (select 1 from voting_cycles where status = 'open');

-- 3) Quick health check — you should see exactly one 'open' row.
select id, status, opens_at, closes_at from voting_cycles order by opens_at desc limit 3;
