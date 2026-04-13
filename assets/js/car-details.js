function safeGalleryArray(car) {
  if (Array.isArray(car?.gallery) && car.gallery.length) return car.gallery;

  if (typeof car?.gallery === "string") {
    try {
      const parsed = JSON.parse(car.gallery);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (error) {
      console.warn("Gallery parse xətası:", error);
    }
  }

  return [car?.cover_image_url || "foto/default-car.webp"];
}

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.getElementById("carDetailsPage");
  if (!page) return;

  const feedbackEl = document.getElementById("detailFeedback");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  if (!id) {
    if (feedbackEl) {
      feedbackEl.innerHTML = `
        <div class="glass-panel feedback feedback--error">
          Maşın ID tapılmadı. Zəhmət olmasa kataloqdan yenidən seçim edin.
        </div>
      `;
    }
    return;
  }

  let car = null;

  if (window.supabaseClient) {
    const { data, error } = await window.supabaseClient
      .from("cars")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Car details yüklənmə xətası:", error);
    } else {
      car = data;
    }
  }

  if (!car) {
    car = (window.UR.mockCars || []).find((item) => String(item.id) === String(id)) || null;
  }

  if (!car) {
    if (feedbackEl) {
      feedbackEl.innerHTML = `
        <div class="glass-panel feedback feedback--error">
          Bu maşın tapılmadı və ya silinib.
        </div>
      `;
    }
    return;
  }

  document.title = `${car.brand} ${car.model} | Uğur RentaCar`;

  const mainImageEl = document.getElementById("detailMainImage");
  const titleEl = document.getElementById("detailTitle");
  const dailyPriceEl = document.getElementById("detailDailyPrice");
  const monthlyPriceEl = document.getElementById("detailMonthlyPrice");
  const descriptionEl = document.getElementById("detailDescription");
  const badgesEl = document.getElementById("detailBadges");
  const specsEl = document.getElementById("detailSpecs");
  const thumbsEl = document.getElementById("detailThumbs");
  const reserveBtn = document.getElementById("detailReserveBtn");
  const reviewsEl = document.getElementById("detailReviews");

  titleEl.textContent = `${car.brand} ${car.model}`;
  mainImageEl.src = car.cover_image_url || "foto/default-car.webp";
  mainImageEl.alt = `${car.brand} ${car.model}`;

  dailyPriceEl.textContent = window.UR.formatCurrency(car.price_daily || 0);
  monthlyPriceEl.textContent = window.UR.formatCurrency(car.price_monthly || 0);
  descriptionEl.textContent = car.description || "Bu maşın üçün əlavə açıqlama hələ daxil edilməyib.";

  const badges = [];
  badges.push(
    `<span class="badge ${window.UR.getStatusBadgeClass(car.status)}">${window.UR.getStatusLabel(car.status)}</span>`
  );
  if (car.is_vip) {
    badges.push(`<span class="badge badge--vip">👑 VIP</span>`);
  }
  badgesEl.innerHTML = badges.join("");

  specsEl.innerHTML = [
    ["İl", car.year],
    ["Yanacaq", car.fuel_type],
    ["Sürətlər qutusu", car.transmission],
    ["Oturacaq", car.seat_count ? `${car.seat_count} yer` : "-"],
    ["Ban növü", car.body_type],
    ["Depozit", window.UR.formatCurrency(car.deposit_amount || 0)]
  ]
    .map(
      ([label, value]) => `
        <div class="spec">
          <small>${label}</small>
          <strong>${value || "-"}</strong>
        </div>
      `
    )
    .join("");

  const gallery = safeGalleryArray(car);

  thumbsEl.innerHTML = gallery
    .map(
      (src, index) => `
        <button type="button" data-src="${src}" aria-label="Şəkil ${index + 1}">
          <img src="${src}" alt="${car.brand} ${car.model} şəkil ${index + 1}" />
        </button>
      `
    )
    .join("");

  thumbsEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      mainImageEl.src = btn.dataset.src;
    });
  });

  reserveBtn.href = `reservation.html?car_id=${encodeURIComponent(car.id)}`;

  reviewsEl.innerHTML = `
    <article class="glass-panel review-card">
      <strong>Premium xidmət</strong>
      <div class="text-gold mt-2">★★★★★</div>
      <p>Maşın təmiz, rahat və vaxtında təqdim edildi. Xidmət səviyyəsi çox yüksək idi.</p>
    </article>
    <article class="glass-panel review-card">
      <strong>Rahat bron prosesi</strong>
      <div class="text-gold mt-2">★★★★★</div>
      <p>Rezervasiya hissəsi rahat işləyir, maşın məlumatları aydın göstərilir.</p>
    </article>
  `;
});
