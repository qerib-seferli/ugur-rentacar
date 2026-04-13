-- Admin cədvəli
create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'superadmin',
  created_at timestamptz default now()
);

alter table public.admins enable row level security;
