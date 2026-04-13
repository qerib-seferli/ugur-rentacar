create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_cars_brand_model on public.cars(brand, model);
create index if not exists idx_cars_status on public.cars(status);
create index if not exists idx_reservations_user_id on public.reservations(user_id);
create index if not exists idx_reservations_car_id on public.reservations(car_id);
create index if not exists idx_reservations_dates on public.reservations(start_date, end_date);
create index if not exists idx_favorites_user_car on public.favorites(user_id, car_id);
