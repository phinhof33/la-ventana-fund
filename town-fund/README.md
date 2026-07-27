# La Ventana Fun Funds

A small website for La Ventana's community fund: members pay $5/month, nominate things
for the pueblo to buy, and vote on their favorite. The fund balance and every
nomination/vote are public, so anyone can see where the money is and where it's going.

Built with Next.js, Supabase (database + login), and Stripe (billing).

## 1. Create a Supabase project

1. Go to https://supabase.com, create a free project.
2. In **SQL Editor**, paste the entire contents of `supabase/schema.sql` and run it.
   This creates all the tables, security rules, and the two summary views
   (`fund_balance`, `current_tally`).
3. In **Authentication > Providers**, make sure **Email** is enabled. This project uses
   passwordless "magic link" sign-in, so no extra provider setup is needed.
4. In **Project Settings > API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — it's only used
     in the Stripe webhook handler, never sent to the browser)

## 2. Set up Stripe

1. Go to https://dashboard.stripe.com (test mode is fine to start).
2. **Product catalog > Add product** — name it something like "Town Fund Membership",
   set it to **Recurring**, **$5.00**, **Monthly**. Save, then copy the **Price ID**
   (starts with `price_...`) into `STRIPE_PRICE_ID`.
3. **Developers > API keys** — copy the **Secret key** into `STRIPE_SECRET_KEY` and the
   **Publishable key** into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
4. **Developers > Webhooks > Add endpoint**:
   - Endpoint URL: `https://YOUR-DEPLOYED-URL/api/stripe/webhook`
   - Events to send: `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.paid`
   - After creating it, copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.
   - Note: you'll need your site deployed first to have a URL for this step — deploy
     once with a placeholder webhook secret, then come back and fill in the real one
     once the endpoint exists.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com, **Add New Project**, import the repo.
3. In the project's **Settings > Environment Variables**, add every variable from
   `.env.example` with your real values (including `NEXT_PUBLIC_SITE_URL` set to your
   final `https://your-project.vercel.app` URL).
4. Deploy. Once it's live, go back to Stripe and finish setting up the webhook
   (step 2.4 above) pointing at your real URL, then redeploy so the real
   `STRIPE_WEBHOOK_SECRET` is picked up.

## 4. Try it out

1. Visit your site, click **Join**, sign in with your email (check your inbox for the
   link).
2. On the dashboard, click **Subscribe** and pay with a
   [Stripe test card](https://docs.stripe.com/testing): `4242 4242 4242 4242`, any future
   expiry, any CVC.
3. Within a few seconds the webhook will mark you active — refresh the dashboard.
4. Submit a nomination.

## 5. The idea board (catalog)

There's a seeded "idea board" at `/catalog` with 7 starter ideas already loaded by the
schema (volleyball courts, a floating dock, beach tennis, a pig roast, a kayak, a
paddleboard, and spearfishing gear) — each with a description, price range, and a
"nominate this" button that sends it straight into the current round.

The seed photos are placeholders (`placehold.co` images with the item name on them) —
swap them for real photos of La Ventana/La Tuna when you have them. Update in Supabase's
**Table Editor > catalog_items**, or with SQL:

```sql
update catalog_items set photo_url = 'https://your-image-url.jpg' where title = 'Beach kayak';
```

To add more catalog items later, insert directly:

```sql
insert into catalog_items (title, description, photo_url, price_low, price_high, item_type, note)
values ('Something new', 'Why the town needs it', 'https://...', 200, 500, 'equipment', null);
```

Members can still submit their own free-form nominations from the dashboard — the
catalog is there for inspiration, not the only path in.

## 6. The public ledger

There's a full ledger at `/ledger` — every contribution and purchase, in order, visible
to anyone (not just members). Contributions show the member's name as "First L." (e.g.
"Maria G.") plus their photo if they added one, instead of their email.

The first time anyone lands on `/dashboard`, they're asked for their first name, last
initial, and (optionally) a profile picture before they can do anything else — that's
the "sign up" moment. The `schema.sql` file also creates a public `avatars` storage
bucket for the photos, so nothing extra to set up there beyond running the schema.

Since you're holding the fund yourself rather than through a bank or nonprofit, this
page is what makes that trustworthy — anyone in town can check the balance and history
at any time without asking you.

## 7. Opening a voting round

There's no admin screen for this yet — the simplest way to open a round is to run this
in Supabase's **SQL Editor** (adjust the closing date):

```sql
insert into voting_cycles (closes_at) values (now() + interval '14 days');
```

To close a round and mark a winner:

```sql
update voting_cycles set status = 'closed' where id = 'THE_CYCLE_ID';
update nominations set status = 'winner' where id = 'THE_WINNING_NOMINATION_ID';
```

When you actually buy the winning item, log the purchase so the ledger stays accurate:

```sql
insert into fund_ledger (kind, amount, nomination_id, note)
values ('purchase', -49.99, 'THE_NOMINATION_ID', 'Bought at Ace Hardware');

update nominations set status = 'purchased' where id = 'THE_NOMINATION_ID';
```

If this project takes off, a natural next step is a small admin page so a trusted
member can open/close rounds and log purchases without touching SQL directly — happy
to build that next.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your real values
npm run dev
```

For Stripe webhooks locally, use the Stripe CLI: `stripe listen --forward-to
localhost:3000/api/stripe/webhook`, and use the signing secret it prints instead of the
dashboard one while testing locally.
