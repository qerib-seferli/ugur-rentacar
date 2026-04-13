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

    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      window.UR.setMessage("adminLoginMessage", error.message, true);
      return;
    }

    const { data: sessionData } = await window.supabaseClient.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) {
      window.UR.setMessage("adminLoginMessage", "Admin session yaradılmadı.", true);
      return;
    }

    const { data: adminRow, error: adminError } = await window.supabaseClient
      .from("admins")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      await window.supabaseClient.auth.signOut();
      window.UR.setMessage("adminLoginMessage", "Bu hesab admin deyil.", true);
      return;
    }

    location.href = "admin.html";
  });
});
