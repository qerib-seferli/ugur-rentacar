create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_code text generated always as ('RES-' || upper(substr(replace(id::text, '-', ''), 1, 10))) stored,
  user_id uuid references auth.users(id) on delete set null,
  car_id uuid not null references public.cars(id) on delete restrict,
  full_name text not null,
  phone text not null,
  email text,
  whatsapp text,
  fin_code text,
  address text,
  note text,
  start_date date not null,
  end_date date not null,
  total_amount numeric(10,2) default 0,
  deposit_amount numeric(10,2) default 0,
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint reservations_dates_check check (end_date >= start_date)
);

alter table public.reservations enable row level security;
