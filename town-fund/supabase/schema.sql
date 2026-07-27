-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste all > Run

-- One row per signed-up person, linked to Supabase's built-in auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_initial text,
  avatar_url text,
  stripe_customer_id text,
  subscription_status text not null default 'inactive', -- 'active' | 'past_due' | 'canceled' | 'inactive'
  created_at timestamptz not null default now()
);

-- A curated wishlist of ideas members can nominate straight from (photo, price range, type)
create table if not exists catalog_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  photo_url text,
  price_low numeric,
  price_high numeric,
  item_type text not null default 'equipment', -- 'equipment' | 'event'
  note text, -- e.g. "requires a fishing permit", "needs a storage spot"
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Things members have proposed to buy for the town
create table if not exists nominations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles(id) on delete cascade,
  catalog_item_id uuid references catalog_items(id),
  title text not null,
  description text,
  estimated_cost numeric,
  status text not null default 'open', -- 'open' | 'winner' | 'purchased' | 'archived'
  created_at timestamptz not null default now()
);

-- A voting round. Keep it simple: one open round at a time.
create table if not exists voting_cycles (
  id uuid primary key default gen_random_uuid(),
  opens_at timestamptz not null default now(),
  closes_at timestamptz not null,
  status text not null default 'open', -- 'open' | 'closed'
  winner_nomination_id uuid references nominations(id)
);

-- One vote per member per cycle (their single top pick among all nominations)
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references voting_cycles(id) on delete cascade,
  member_id uuid not null references profiles(id) on delete cascade,
  nomination_id uuid not null references nominations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cycle_id, member_id)
);

-- Ledger of money in (from Stripe) and money out (purchases), so balance is always auditable
create table if not exists fund_ledger (
  id uuid primary key default gen_random_uuid(),
  kind text not null, -- 'contribution' | 'purchase' | 'adjustment'
  amount numeric not null, -- positive for money in, negative for money out
  member_id uuid references profiles(id),
  nomination_id uuid references nominations(id),
  stripe_event_id text unique,
  note text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table catalog_items enable row level security;
alter table nominations enable row level security;
alter table voting_cycles enable row level security;
alter table votes enable row level security;
alter table fund_ledger enable row level security;

-- Catalog: public read (it's the town's idea board), writes are done by you directly in SQL Editor for now
create policy "catalog is publicly readable" on catalog_items
  for select using (active = true);

-- Profiles: everyone signed in can see names (for "nominated by"), only owner can edit their own row
create policy "profiles are readable by any member" on profiles
  for select using (auth.role() = 'authenticated');
create policy "members can update their own profile" on profiles
  for update using (auth.uid() = id);
create policy "members can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

-- Nominations: public (this is a civic fund — transparency builds trust); only active subscribers can create
create policy "nominations are publicly readable" on nominations
  for select using (true);
create policy "active members can nominate" on nominations
  for insert with check (
    auth.uid() = member_id
    and exists (select 1 from profiles p where p.id = auth.uid() and p.subscription_status = 'active')
  );

-- Voting cycles: public
create policy "cycles are publicly readable" on voting_cycles
  for select using (true);

-- Votes: public tallies (for transparency), only active subscribers can cast their own
create policy "votes are publicly readable" on votes
  for select using (true);
create policy "active members can vote" on votes
  for insert with check (
    auth.uid() = member_id
    and exists (select 1 from profiles p where p.id = auth.uid() and p.subscription_status = 'active')
  );

-- Ledger: public (full transparency on the fund's balance and history), writes only via server (service role)
create policy "ledger is publicly readable" on fund_ledger
  for select using (true);

-- Convenience view: current fund balance
create or replace view fund_balance as
  select coalesce(sum(amount), 0) as balance from fund_ledger;

-- Convenience view: live vote tally for the current open cycle
create or replace view current_tally as
  select v.cycle_id, v.nomination_id, n.title, count(*) as vote_count
  from votes v
  join nominations n on n.id = v.nomination_id
  join voting_cycles c on c.id = v.cycle_id and c.status = 'open'
  group by v.cycle_id, v.nomination_id, n.title
  order by vote_count desc;

-- Public ledger view: shows a display name ("Maria G.") and avatar alongside every
-- contribution and purchase, so the full history is safe to show to anyone —
-- members or not — without leaking anyone's email address or full legal name.
create or replace view public_ledger as
  select
    fl.id,
    fl.kind,
    fl.amount,
    fl.created_at,
    fl.note,
    case
      when p.first_name is not null then p.first_name || coalesce(' ' || p.last_initial || '.', '')
      else 'A member'
    end as member_name,
    p.avatar_url as member_avatar_url,
    n.title as nomination_title
  from fund_ledger fl
  left join profiles p on p.id = fl.member_id
  left join nominations n on n.id = fl.nomination_id
  order by fl.created_at desc;

-- Storage bucket for profile pictures — public so avatars can be shown on the ledger
-- without needing a signed URL for every visitor.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars are publicly readable" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "members can upload their own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "members can replace their own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Seed catalog with starter ideas. Swap in real photos of La Ventana/La Tuna when you have them —
-- these are placeholder images so the layout has something to show right away.
insert into catalog_items (title, description, photo_url, price_low, price_high, item_type, note) values
  ('Two beach volleyball courts at La Tuna', 'Regulation net posts and boundary lines set up right on the sand at La Tuna — no excavation needed, the beach is already there.', 'https://placehold.co/800x600/1a5a52/f1e6cf?text=Volleyball+Courts', 800, 2700, 'equipment', null),
  ('Floating dock for the bay', 'An inflatable floating platform anchored in the bay for swimming, sunbathing, and jumping off of.', 'https://placehold.co/800x600/1a5a52/f1e6cf?text=Floating+Dock', 400, 700, 'equipment', null),
  ('Beach tennis courts', 'Same idea as the volleyball courts — a lower net and boundary lines set up on the sand.', 'https://placehold.co/800x600/1a5a52/f1e6cf?text=Beach+Tennis', 400, 1000, 'equipment', null),
  ('Community pig roast', 'A town gathering — whole pig, sides, and setup. This is a one-time event, not a lasting purchase, so a "win" here means picking a date rather than buying something permanent.', 'https://placehold.co/800x600/c1502f/faf3e2?text=Pig+Roast', 400, 800, 'event', 'This is an event, not equipment — funds are spent once and not reusable.'),
  ('Beach kayak', 'A shared kayak for anyone in the fund to use.', 'https://placehold.co/800x600/1a5a52/f1e6cf?text=Kayak', 300, 600, 'equipment', 'Needs a storage spot and a simple way to sign it out.'),
  ('Stand-up paddleboard', 'A shared SUP for anyone in the fund to use.', 'https://placehold.co/800x600/1a5a52/f1e6cf?text=SUP', 400, 1200, 'equipment', 'Needs a storage spot and a simple way to sign it out.'),
  ('Spearfishing equipment', 'A shared spearfishing set — speargun or pole spear, mask, fins, wetsuit, weight belt.', 'https://placehold.co/800x600/1a5a52/f1e6cf?text=Spearfishing+Gear', 250, 500, 'equipment', 'Spearfishing requires an individual fishing permit in Mexico, and only freediving is legal (no scuba). Check current CONAPESCA rules before use.');
