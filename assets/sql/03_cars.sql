-- Maşınlar
create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  year integer,
  color text,
  transmission text,
  fuel_type text,
  seat_count integer,
  body_type text,
  price_daily numeric(10,2) not null default 0,
  price_monthly numeric(10,2) default 0,
  deposit_amount numeric(10,2) default 0,
  description text,
  is_vip boolean default false,
  status text default 'available',
  cover_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cars enable row level security;
