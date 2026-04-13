document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!window.supabaseClient) {
      window.UR.setMessage("adminLoginMessage", "Supabase config daxil edilməyib.", true);
      return;
    }

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    // Admin login
    const { error: loginError } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      console.error("Admin login xətası:", loginError);
      window.UR.setMessage("adminLoginMessage", loginError.message, true);
      return;
    }

    // Session götür
    const { data: sessionData, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (sessionError) {
      console.error("Session xətası:", sessionError);
      window.UR.setMessage("adminLoginMessage", sessionError.message, true);
      return;
    }

    const user = sessionData?.session?.user;

    if (!user) {
      window.UR.setMessage("adminLoginMessage", "Admin session yaradılmadı.", true);
      return;
    }

    console.log("Login olmuş user:", user);

    // Admin cədvəlində yoxlayırıq
    const { data: adminRow, error: adminError } = await window.supabaseClient
      .from("admins")
      .select("id, email, role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("Admin yoxlama nəticəsi:", adminRow);
    console.error("Admin yoxlama xətası:", adminError);

    if (adminError) {
      await window.supabaseClient.auth.signOut();
      window.UR.setMessage(
        "adminLoginMessage",
        `Admin yoxlama xətası: ${adminError.message}`,
        true
      );
      return;
    }

    if (!adminRow) {
      await window.supabaseClient.auth.signOut();
      window.UR.setMessage("adminLoginMessage", "Bu hesab admin deyil.", true);
      return;
    }

    location.href = "admin.html";
  });
});
