document.addEventListener("DOMContentLoaded", async () => {
  const page = document.getElementById("carDetailsPage");
  if (!page) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  let car = null;

  if (window.supabaseClient) {
    const { data } = await window.supabaseClient.from("cars").select("*").eq("id", id).maybeSingle();
    car = data;
  }

  if (!car) {
    car = (window.UR.mockCars || []).find((item) => String(item.id) === String(id)) || window.UR.mockCars[0];
  }

  if (!car) return;

  document.getElementById("detailTitle").textContent = `${car.brand} ${car.model}`;
  document.getElementById("detailMainImage").src = car.cover_image_url || "foto/default-car.webp";
  document.getElementById("detailDailyPrice").textContent = window.UR.formatCurrency(car.price_daily);
  document.getElementById("detailMonthlyPrice").textContent = window.UR.formatCurrency(car.price_monthly);
  document.getElementById("detailDescription").textContent = car.description || "Məlumat əlavə edilməyib.";

  const badges = [];
  badges.push(`<span class="badge ${window.UR.getStatusBadgeClass(car.status)}">${window.UR.getStatusLabel(car.status)}</span>`);
  if (car.is_vip) badges.push(`<span class="badge badge--vip">👑 VIP</span>`);
  document.getElementById("detailBadges").innerHTML = badges.join("");

  document.getElementById("detailSpecs").innerHTML = [
    ["İl", car.year],
    ["Yanacaq", car.fuel_type],
    ["Sürətlər qutusu", car.transmission],
    ["Oturacaq", `${car.seat_count} yer`],
    ["Ban növü", car.body_type],
    ["Depozit", window.UR.formatCurrency(car.deposit_amount)]
  ].map(([label, value]) => `<div class="spec"><small>${label}</small><strong>${value || "-"}</strong></div>`).join("");

  const gallery = car.gallery || [car.cover_image_url || "foto/default-car.webp"];
  document.getElementById("detailThumbs").innerHTML = gallery.map((src) => `
    <button type="button" data-src="${src}">
      <img src="${src}" alt="Maşın əlavə şəkil" />
    </button>
  `).join("");

  document.querySelectorAll("#detailThumbs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("detailMainImage").src = btn.dataset.src;
    });
  });

  document.getElementById("detailReserveBtn").href = `reservation.html?car_id=${encodeURIComponent(car.id)}`;

  const detailReviews = document.getElementById("detailReviews");
  detailReviews.innerHTML = [1,2].map((i) => `
    <article class="glass-panel review-card">
      <strong>Müştəri ${i}</strong>
      <div class="text-gold mt-2">★★★★★</div>
      <p>Bu maşın həm görünüş, həm rahatlıq, həm də sürüş keyfiyyətinə görə çox bəyənildi.</p>
    </article>
  `).join("");
});
