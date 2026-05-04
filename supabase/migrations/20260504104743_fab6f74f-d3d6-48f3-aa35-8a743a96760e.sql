-- =========================================================
-- PROFILES (1:1 with auth.users)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =========================================================
-- BOOKINGS
-- =========================================================
create type public.booking_status as enum ('held', 'confirmed', 'completed', 'cancelled');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.booking_status not null default 'held',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 45,
  calendly_event_uri text,
  calendly_invitee_uri text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent the same user from holding two bookings for the same slot
create unique index bookings_unique_active_slot
  on public.bookings (user_id, scheduled_at)
  where status in ('held', 'confirmed');

-- Calendly event reference is unique when present (no double-import)
create unique index bookings_unique_calendly_event
  on public.bookings (calendly_event_uri)
  where calendly_event_uri is not null;

create index bookings_user_id_idx on public.bookings (user_id);
create index bookings_status_idx on public.bookings (status);

alter table public.bookings enable row level security;

create policy "Users view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users create own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users update own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- =========================================================
-- PAYMENTS (1:1 with bookings, never unlinked)
-- =========================================================
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  -- NOT NULL + UNIQUE => every payment is tied to exactly one booking,
  -- and a booking can have at most one payment.
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'pending',
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_provider_payment_id_idx
  on public.payments (provider_payment_id)
  where provider_payment_id is not null;

create index payments_user_id_idx on public.payments (user_id);
create index payments_status_idx on public.payments (status);

alter table public.payments enable row level security;

-- Users can read their own payment records.
-- INSERT/UPDATE happen server-side (admin client) after Razorpay verification —
-- no client policy is granted for those.
create policy "Users view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- =========================================================
-- RESOURCES (unlocked after completed session)
-- =========================================================
create type public.resource_kind as enum ('video', 'pdf', 'link', 'note');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind public.resource_kind not null default 'link',
  url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resources_is_public_idx on public.resources (is_public);

alter table public.resources enable row level security;

-- Helper: does this user have at least one completed booking?
create or replace function public.has_completed_booking(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings
    where user_id = _user_id
      and status = 'completed'
  );
$$;

create policy "Public resources are visible to everyone"
  on public.resources for select
  using (is_public = true);

create policy "Restricted resources unlock after a completed session"
  on public.resources for select
  using (
    is_public = false
    and auth.uid() is not null
    and public.has_completed_booking(auth.uid())
  );

create trigger resources_set_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();