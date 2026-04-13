# Uğur RentaCar

Bu paket GitHub Pages + Supabase əsaslı statik frontend scaffold layihəsidir.

## Quraşdırma
1. `assets/js/supabase-config.js` faylında `SUPABASE_URL` və `SUPABASE_ANON_KEY` dəyərlərini yazın.
2. Supabase dashboard-da:
   - Phone auth aktiv edin
   - Email/password auth aktiv edin
   - `profile-images`, `payment-receipts`, `contracts` bucket-larını yaradın
3. `assets/sql/` içindəki SQL fayllarını sıra ilə run edin.
4. Admin istifadəçisi yaratdıqdan sonra onun `auth.users.id` dəyərini `admins` cədvəlinə əlavə edin.
5. Layihəni GitHub repository içinə yükləyin və GitHub Pages aktiv edin.

## Vacib qeyd
Bu paket production-a yaxın scaffold kimidir. Real SMS provider, real OTP göndərilməsi, private contract PDF generasiyası və biznes qaydaları üçün əlavə konfiqurasiya lazımdır.

## Struktur
- HTML səhifələr kök qovluqdadır
- CSS `assets/css/`
- JS `assets/js/`
- SEO faylları `assets/seo/`
- SQL faylları `assets/sql/`
- Şəkillər `foto/`
