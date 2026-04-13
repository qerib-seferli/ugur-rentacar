create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  contract_url text,
  contract_text text,
  created_at timestamptz default now(),
  unique(reservation_id)
);

alter table public.contracts enable row level security;
