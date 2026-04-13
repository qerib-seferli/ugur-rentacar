document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-favorite-id]");
  if (!button) return;

  const carId = button.dataset.favoriteId;
  button.classList.toggle("is-active");

  if (!window.supabaseClient) return;

  const { data: sessionData } = await window.supabaseClient.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    alert("Sevimlilər üçün əvvəlcə giriş edin.");
    location.href = "login.html";
    return;
  }

  if (button.classList.contains("is-active")) {
    await window.supabaseClient.from("favorites").insert({ user_id: user.id, car_id: carId });
  } else {
    await window.supabaseClient.from("favorites").delete().eq("user_id", user.id).eq("car_id", carId);
  }
});
