(function () {
  // ================================
  // UĞUR RENTACAR - SUPABASE CLIENT
  // Global supabase client yaradılır
  // ================================
  const config = window.SUPABASE_CONFIG || {};
  const isReady = config.url && config.anonKey &&
    config.url !== "SUPABASE_URL_BURAYA_YAZ" &&
    config.anonKey !== "SUPABASE_ANON_KEY_BURAYA_YAZ";

  window.supabaseClient = isReady
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

  window.isSupabaseConfigured = isReady;
})();
