-- Checkout leads: one row per browser, saved at every step of the buying
-- journey (cart -> checkout opened -> details typed -> payment shown ->
-- ordered), so a shopper who walks away at any point can still be followed up.
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> Run.
--
-- Security: the table has Row Level Security on and NO policies, so the public
-- anon key cannot read or write it directly. The site writes only through
-- save_checkout_lead() below, which can insert/update one lead by its random id
-- and returns nothing. Read leads in Table Editor (logged in as owner).

create table if not exists public.checkout_leads (
  lead_id      uuid primary key,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  stage        text not null default 'cart',  -- cart | checkout_started | details_entered | payment_shown | ordered
  name         text,
  phone        text,
  email        text,
  address      text,
  city         text,
  state        text,
  pincode      text,
  cart         jsonb,
  cart_total   numeric,
  item_count   integer,
  order_ref    text,
  utm          jsonb,
  referrer     text,
  device       text,
  followed_up  boolean not null default false,
  notes        text
);

alter table public.checkout_leads enable row level security;

create index if not exists checkout_leads_stage_idx   on public.checkout_leads (stage, updated_at desc);
create index if not exists checkout_leads_phone_idx   on public.checkout_leads (phone);

create or replace function public.save_checkout_lead(p_lead_id uuid, p_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_stage text := coalesce(nullif(p_data->>'stage', ''), 'cart');
  stage_rank constant jsonb := '{"cart":1,"checkout_started":2,"details_entered":3,"payment_shown":4,"ordered":5}';
begin
  if p_lead_id is null then return; end if;
  if not (stage_rank ? new_stage) then new_stage := 'cart'; end if;

  insert into public.checkout_leads as l (
    lead_id, stage, name, phone, email, address, city, state, pincode,
    cart, cart_total, item_count, order_ref, utm, referrer, device
  ) values (
    p_lead_id, new_stage,
    left(nullif(p_data->>'name', ''), 120),
    left(nullif(p_data->>'phone', ''), 20),
    left(nullif(p_data->>'email', ''), 160),
    left(nullif(p_data->>'address', ''), 400),
    left(nullif(p_data->>'city', ''), 80),
    left(nullif(p_data->>'state', ''), 80),
    left(nullif(p_data->>'pincode', ''), 10),
    case when jsonb_typeof(p_data->'cart') = 'array' then p_data->'cart' end,
    nullif(p_data->>'cart_total', '')::numeric,
    nullif(p_data->>'item_count', '')::integer,
    left(nullif(p_data->>'order_ref', ''), 40),
    case when jsonb_typeof(p_data->'utm') = 'object' then p_data->'utm' end,
    left(nullif(p_data->>'referrer', ''), 300),
    left(nullif(p_data->>'device', ''), 20)
  )
  on conflict (lead_id) do update set
    updated_at = now(),
    -- the stage only moves forward; a late "cart" save never undoes "ordered"
    stage      = case when (stage_rank->>new_stage)::int >= (stage_rank->>l.stage)::int then new_stage else l.stage end,
    -- empty values never wipe what was already captured
    name       = coalesce(excluded.name, l.name),
    phone      = coalesce(excluded.phone, l.phone),
    email      = coalesce(excluded.email, l.email),
    address    = coalesce(excluded.address, l.address),
    city       = coalesce(excluded.city, l.city),
    state      = coalesce(excluded.state, l.state),
    pincode    = coalesce(excluded.pincode, l.pincode),
    cart       = coalesce(excluded.cart, l.cart),
    cart_total = coalesce(excluded.cart_total, l.cart_total),
    item_count = coalesce(excluded.item_count, l.item_count),
    order_ref  = coalesce(excluded.order_ref, l.order_ref),
    utm        = coalesce(l.utm, excluded.utm),
    referrer   = coalesce(l.referrer, excluded.referrer),
    device     = coalesce(l.device, excluded.device);
end;
$$;

revoke all on function public.save_checkout_lead(uuid, jsonb) from public;
grant execute on function public.save_checkout_lead(uuid, jsonb) to anon, authenticated;

-- Handy view for follow-up: people who left details but never ordered.
create or replace view public.abandoned_leads as
  select lead_id, updated_at, stage, name, phone, email, city, item_count, cart_total, cart, utm, followed_up, notes
  from public.checkout_leads
  where stage <> 'ordered' and (phone is not null or email is not null)
  order by updated_at desc;
