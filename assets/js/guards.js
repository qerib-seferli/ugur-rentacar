window.UR = window.UR || {};

window.UR.requireUser = async function(redirectTo = "login.html") {
  if (!window.supabaseClient) return false;
  const { data } = await window.supabaseClient.auth.getSession();
  if (!data?.session) {
    location.href = redirectTo;
    return false;
  }
  return data.session;
};

window.UR.requireAdmin = async function() {
  if (!window.supabaseClient) {
    location.href = "admin-login.html";
    return false;
  }

  const { data: sessionData } = await window.supabaseClient.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    location.href = "admin-login.html";
    return false;
  }

  const { data: adminRow, error } = await window.supabaseClient
    .from("admins")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !adminRow) {
    location.href = "admin-login.html";
    return false;
  }

  return { session: sessionData.session, admin: adminRow };
};
