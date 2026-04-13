document.addEventListener("DOMContentLoaded", () => {
  window.UR.renderHeader();
  window.UR.renderFooter();

  const whatsappBtn = document.getElementById("floatingWhatsapp");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", window.UR.openWhatsapp);
  }

  if (!window.isSupabaseConfigured) {
    console.warn("Supabase config hələ doldurulmayıb.");
  }
});
