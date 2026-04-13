document.addEventListener("DOMContentLoaded", () => {
  const requestForm = document.getElementById("otpRequestForm");
  const verifyForm = document.getElementById("otpVerifyForm");
  const phoneInput = document.getElementById("otpPhone");
  const codeInput = document.getElementById("otpCode");

  if (!requestForm || !verifyForm) return;

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!window.supabaseClient) {
      window.UR.setMessage("otpMessage", "Supabase config daxil edilməyib.", true);
      return;
    }

    const phone = phoneInput.value.trim();

    const { error } = await window.supabaseClient.auth.signInWithOtp({
      phone
    });

    if (error) {
      window.UR.setMessage("otpMessage", error.message, true);
      return;
    }

    localStorage.setItem("ur_last_phone", phone);
    window.UR.setMessage("otpMessage", "OTP kod göndərildi. Kodu daxil edin.");
  });

  verifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!window.supabaseClient) {
      window.UR.setMessage("otpMessage", "Supabase config daxil edilməyib.", true);
      return;
    }

    const phone = phoneInput.value.trim() || localStorage.getItem("ur_last_phone");
    const token = codeInput.value.trim();

    const { error } = await window.supabaseClient.auth.verifyOtp({
      phone,
      token,
      type: "sms"
    });

    if (error) {
      window.UR.setMessage("otpMessage", error.message, true);
      return;
    }

    const { data: sessionData } = await window.supabaseClient.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      window.UR.setMessage("otpMessage", "Session tapılmadı.", true);
      return;
    }

    // İlk girişdirsə profiles cədvəlində minimal sətr yaradırıq
    const { data: profile } = await window.supabaseClient
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      await window.supabaseClient.from("profiles").insert({
        id: user.id,
        phone: user.phone || phone,
        created_at: new Date().toISOString()
      });
      location.href = "profile-complete.html";
      return;
    }

    if (!profile.first_name || !profile.last_name) {
      location.href = "profile-complete.html";
      return;
    }

    location.href = "profile.html";
  });
});
