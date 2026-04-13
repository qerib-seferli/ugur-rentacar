-- Admin helper
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admins
    where id = auth.uid()
  );
$$;

-- PROFILES
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own_or_admin"
on public.profiles for insert
with check (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

-- ADMINS
create policy "admins_select_admin_only"
on public.admins for select
using (public.is_admin());

-- CARS
create policy "cars_public_read"
on public.cars for select
using (true);

create policy "cars_admin_write"
on public.cars for all
using (public.is_admin())
with check (public.is_admin());

-- FAVORITES
create policy "favorites_select_own_or_admin"
on public.favorites for select
using (auth.uid() = user_id or public.is_admin());

create policy "favorites_insert_own_or_admin"
on public.favorites for insert
with check (auth.uid() = user_id or public.is_admin());

create policy "favorites_delete_own_or_admin"
on public.favorites for delete
using (auth.uid() = user_id or public.is_admin());

-- RESERVATIONS
create policy "reservations_select_own_or_admin"
on public.reservations for select
using (auth.uid() = user_id or public.is_admin());

create policy "reservations_insert_logged_in"
on public.reservations for insert
with check (auth.uid() = user_id or public.is_admin());

create policy "reservations_update_own_or_admin"
on public.reservations for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

-- CONTRACTS
create policy "contracts_select_own_or_admin"
on public.contracts for select
using (
  public.is_admin() or exists (
    select 1 from public.reservations r
    where r.id = reservation_id and r.user_id = auth.uid()
  )
);

create policy "contracts_admin_write"
on public.contracts for all
using (public.is_admin())
with check (public.is_admin());
