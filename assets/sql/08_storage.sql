-- Storage bucket-ları dashboard-dan da yarada bilərsiniz:
-- profile-images
-- payment-receipts
-- contracts

insert into storage.buckets (id, name, public)
values
  ('profile-images', 'profile-images', true),
  ('payment-receipts', 'payment-receipts', false),
  ('contracts', 'contracts', false)
on conflict do nothing;

-- Profil şəkilləri - istifadəçi özünə yükləyə bilər
create policy "profile images upload own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile images select public"
on storage.objects for select
to public
using (bucket_id = 'profile-images');

-- Receipt və contracts - yalnız sahibi və admin görə bilər
create policy "payment receipt upload own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "payment receipt read own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-receipts'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

create policy "contracts read own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'contracts'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);
