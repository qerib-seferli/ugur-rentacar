(function () {
  // ================================
  // UĞUR RENTACAR - SUPABASE CLIENT
  // Global supabase client yaradılır
  // ================================
  const config = window.SUPABASE_CONFIG || {};
  const isReady = config.url && config.anonKey &&
    config.url !== "https://vytmnkywcpeyahgbvjdi.supabase.co" &&
    config.anonKey !== "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dG1ua3l3Y3BleWFoZ2J2amRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mzg2NTQsImV4cCI6MjA5MTUxNDY1NH0.gBqTbzaCwXKQr132Gfzp8SGjpOr9cmiYwGl8Srw221Y";

  window.supabaseClient = isReady
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

  window.isSupabaseConfigured = isReady;
})();
