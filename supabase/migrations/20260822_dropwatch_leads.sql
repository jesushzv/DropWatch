-- DropWatch landing-page lead capture.
-- Access model: the public site may only CREATE leads. RLS has no select/
-- update/delete policies, and those grants are revoked outright, so nothing
-- can be read back or changed with the publishable key.

create table if not exists public.dropwatch_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'unknown',
  tier text,
  created_at timestamptz not null default now(),
  constraint dropwatch_leads_email_format check (
    email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and char_length(email) between 5 and 320
  ),
  constraint dropwatch_leads_source_len check (char_length(source) between 1 and 40),
  constraint dropwatch_leads_tier_len check (tier is null or char_length(tier) between 1 and 40)
);

alter table public.dropwatch_leads enable row level security;

create policy "anyone can create a lead"
  on public.dropwatch_leads
  for insert
  to anon
  with check (true);

revoke select, update, delete on public.dropwatch_leads from anon, authenticated;
