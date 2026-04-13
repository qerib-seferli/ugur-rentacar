document.addEventListener("DOMContentLoaded", async () => {
  const profileForm = document.getElementById("profileForm");
  const profileCompleteForm = document.getElementById("profileCompleteForm");

  if (profileForm) {
    const session = await window.UR.requireUser();
    if (!session) return;
    const user = session.user;

    const { data: profile } = await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      document.getElementById("profileFirstName").value = profile.first_name || "";
      document.getElementById("profileLastName").value = profile.last_name || "";
      document.getElementById("profilePhone").value = profile.phone || user.phone || "";
      document.getElementById("profileEmail").value = profile.email || "";
      document.getElementById("profileCity").value = profile.city || "";
      document.getElementById("profileAddress").value = profile.address || "";
      document.getElementById("profileBio").value = profile.bio || "";
      if (profile.avatar_url) {
        document.getElementById("profileAvatarPreview").src = profile.avatar_url;
      }
    }

    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const payload = {
        id: user.id,
        phone: user.phone || "",
        first_name: document.getElementById("profileFirstName").value.trim(),
        last_name: document.getElementById("profileLastName").value.trim(),
        email: document.getElementById("profileEmail").value.trim(),
        city: document.getElementById("profileCity").value.trim(),
        address: document.getElementById("profileAddress").value.trim(),
        bio: document.getElementById("profileBio").value.trim(),
        updated_at: new Date().toISOString()
      };

      const { error } = await window.supabaseClient.from("profiles").upsert(payload);
      if (error) {
        window.UR.setMessage("profileMessage", error.message, true);
        return;
      }
      window.UR.setMessage("profileMessage", "Profil məlumatları uğurla yadda saxlanıldı.");
    });

    document.getElementById("logoutUserBtn")?.addEventListener("click", async () => {
      await window.supabaseClient.auth.signOut();
      location.href = "login.html";
    });

    document.getElementById("uploadAvatarBtn")?.addEventListener("click", async () => {
      const fileInput = document.getElementById("profileAvatarInput");
      const file = fileInput.files?.[0];
      if (!file) {
        window.UR.setMessage("profileMessage", "Əvvəl şəkil seçin.", true);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await window.supabaseClient.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        window.UR.setMessage("profileMessage", uploadError.message, true);
        return;
      }

      const { data: publicData } = window.supabaseClient.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      const avatarUrl = publicData.publicUrl;

      await window.supabaseClient.from("profiles").upsert({
        id: user.id,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      });

      document.getElementById("profileAvatarPreview").src = avatarUrl;
      window.UR.setMessage("profileMessage", "Profil şəkli yeniləndi.");
    });
  }

  if (profileCompleteForm) {
    const session = await window.UR.requireUser();
    if (!session) return;
    const user = session.user;

    document.getElementById("completePhone").value = user.phone || "";

    profileCompleteForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const payload = {
        id: user.id,
        phone: user.phone || "",
        first_name: document.getElementById("completeFirstName").value.trim(),
        last_name: document.getElementById("completeLastName").value.trim(),
        email: document.getElementById("completeEmail").value.trim(),
        city: document.getElementById("completeCity").value.trim(),
        address: document.getElementById("completeAddress").value.trim(),
        updated_at: new Date().toISOString()
      };

      const { error } = await window.supabaseClient.from("profiles").upsert(payload);

      if (error) {
        window.UR.setMessage("profileCompleteMessage", error.message, true);
        return;
      }

      window.UR.setMessage("profileCompleteMessage", "Profil tamamlandı. Yönləndirilirsiniz...");
      setTimeout(() => location.href = "profile.html", 700);
    });
  }
});
