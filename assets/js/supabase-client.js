(function () {
  // ================================
  // UĞUR RENTACAR - SUPABASE CLIENT
  // Global supabase client yaradılır
  // ================================

  const config = window.SUPABASE_CONFIG || {};

  // Sadəcə boş olub-olmadığını yoxlayırıq
  const isReady =
    typeof config.url === "string" &&
    config.url.trim() !== "" &&
    typeof config.anonKey === "string" &&
    config.anonKey.trim() !== "";

  // Əgər config varsa client yaradırıq
  window.supabaseClient = isReady
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

  // Digər JS faylları üçün status
  window.isSupabaseConfigured = isReady;

  // Konsolda yoxlama üçün
  if (!isReady) {
    console.error("Supabase config daxil edilməyib və ya boşdur.");
  } else {
    console.log("Supabase client uğurla yaradıldı.");
  }
})();
