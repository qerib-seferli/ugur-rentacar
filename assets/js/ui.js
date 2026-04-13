window.UR = window.UR || {};

// ========================================
// UĞUR RENTACAR - UI KÖMƏKÇİLƏRİ
// Bu faylda ümumi UI funksiyaları saxlanılır
// ========================================

// -----------------------------
// Sadə fallback constants
// Əgər başqa faylda constants yoxdursa belə sayt qırılmasın
// -----------------------------
window.UR.constants = window.UR.constants || {
  address1:
    "https://www.google.com/maps/place/40%C2%B022'21.0%22N+47%C2%B007'33.1%22E/@40.372494,47.125861,672m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d40.372494!4d47.125861?entry=ttu",
  address2:
    "https://www.google.com/maps/place/40%C2%B023'59.0%22N+47%C2%B007'21.9%22E/@40.399715,47.1220923,168m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d40.399714!4d47.122736?entry=ttu",
  whatsappNumber: "994519500002",
  whatsappMessage:
    "Salam, Uğur RentaCar. Maşın icarəsi ilə bağlı məlumat almaq istəyirəm."
};

// -----------------------------
// Mətn təhlükəsizliyi üçün sadə escape
// -----------------------------
window.UR.escapeHtml = function (value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

// -----------------------------
// Valyuta formatı
// -----------------------------
window.UR.formatCurrency = function (value) {
  const numericValue = Number(value || 0);
  return `${numericValue.toLocaleString("az-AZ")} AZN`;
};

// -----------------------------
// Status label-lər
// -----------------------------
window.UR.getStatusLabel = function (status) {
  const map = {
    available: "Mövcuddur",
    pending_review: "Yoxlanılır",
    reserved: "Rezervasiya olunub",
    future_booked: "Gələcək bron var",
    in_service: "Servisdədir",
    inactive: "Passivdir",
    approved: "Təsdiqlənib",
    rejected: "Rədd edilib"
  };

  return map[status] || "Məlum deyil";
};

// -----------------------------
// Status badge class-ları
// -----------------------------
window.UR.getStatusBadgeClass = function (status) {
  const map = {
    available: "badge badge--success",
    pending_review: "badge badge--warning",
    reserved: "badge badge--danger",
    future_booked: "badge badge--info",
    in_service: "badge badge--muted",
    inactive: "badge badge--muted",
    approved: "badge badge--success",
    rejected: "badge badge--danger"
  };

  return map[status] || "badge";
};

// -----------------------------
// WhatsApp link generator
// -----------------------------
window.UR.getWhatsAppUrl = function (customMessage = "") {
  const message = customMessage || window.UR.constants.whatsappMessage;
  return `https://wa.me/${window.UR.constants.whatsappNumber}?text=${encodeURIComponent(message)}`;
};

// -----------------------------
// Header render
// -----------------------------
window.UR.renderHeader = function () {
  const mount = document.getElementById("app-header");
  if (!mount) return;

  const current = location.pathname.split("/").pop() || "index.html";

  const navItems = [
    ["index.html", "Ana səhifə"],
    ["cars.html", "Maşınlar"],
    ["reservation.html", "Rezervasiya"],
    ["favorites.html", "Sevimlilər"],
    ["about.html", "Haqqımızda"]
  ];

  mount.innerHTML = `
    <header class="site-header glass-panel">
      <a class="brand" href="index.html" aria-label="Uğur RentaCar ana səhifə">
        <img
          src="foto/logo.png"
          alt="Uğur RentaCar logo"
          onerror="this.src='foto/favicon.png'"
        />
        <div class="brand__text">
          <strong>Uğur RentaCar</strong>
          <span>Premium avtomobil icarəsi</span>
        </div>
      </a>

      <nav class="nav-links" aria-label="Əsas menyu">
        ${navItems
          .map(
            ([href, label]) => `
              <a class="nav-link ${current === href ? "is-active" : ""}" href="${href}">
                ${label}
              </a>
            `
          )
          .join("")}
      </nav>

      <div class="nav-actions">
        <a class="pill" href="tel:+994519500002">+994 51 950 00 02</a>
        <a class="btn btn-gold" href="login.html">Giriş</a>
      </div>
    </header>
  `;
};

// -----------------------------
// Footer render
// -----------------------------
window.UR.renderFooter = function () {
  const mount = document.getElementById("app-footer");
  if (!mount) return;

  mount.innerHTML = `
    <footer class="footer glass-panel">
      <div class="footer-grid">
        <div>
          <div class="eyebrow">Uğur RentaCar</div>
          <h3>Premium avtomobil icarəsi və rahat rezervasiya sistemi</h3>
          <p class="footer-text">
            VIP və gündəlik avtomobil icarəsi üçün etibarlı, rahat və müasir xidmət təqdim edirik.
          </p>
          <small>(</> Senior Full Stack Developer: Qərib Səfərli)</small>
        </div>

        <div>
          <strong>Telefonlar</strong>
          <div class="stack-md mt-3">
            <a href="tel:+994519500002">+994 51 950 00 02</a>
            <a href="tel:+994503092626">+994 50 309 26 26</a>
            <a href="tel:+994103092626">+994 10 309 26 26</a>
          </div>
        </div>

        <div>
          <strong>Ünvanlar</strong>
          <div class="stack-md mt-3">
            <a href="${window.UR.constants.address1}" target="_blank" rel="noopener">Ünvan 1 xəritədə aç</a>
            <a href="${window.UR.constants.address2}" target="_blank" rel="noopener">Ünvan 2 xəritədə aç</a>
          </div>
        </div>

        <div>
          <strong>WhatsApp</strong>
          <div class="stack-md mt-3">
            <a href="${window.UR.getWhatsAppUrl()}" target="_blank" rel="noopener">
              WhatsApp ilə yaz
            </a>
          </div>
        </div>
      </div>
    </footer>
  `;
};

// -----------------------------
// Mesaj göstərmək
// -----------------------------
window.UR.setMessage = function (elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.textContent = message || "";
  el.classList.remove("message-error", "message-success");
  el.style.color = "";

  if (!message) return;

  if (isError) {
    el.classList.add("message-error");
    el.style.color = "#ff9dae";
  } else {
    el.classList.add("message-success");
    el.style.color = "#9aadc9";
  }
};

// -----------------------------
// Maşın kartı render
// -----------------------------
window.UR.createCarCard = function (car) {
  const brand = window.UR.escapeHtml(car?.brand || "Marka");
  const model = window.UR.escapeHtml(car?.model || "Model");
  const transmission = window.UR.escapeHtml(car?.transmission || "Məlum deyil");
  const fuelType = window.UR.escapeHtml(car?.fuel_type || "Məlum deyil");
  const bodyType = window.UR.escapeHtml(car?.body_type || "Ban növü qeyd edilməyib");
  const year = window.UR.escapeHtml(car?.year || "-");
  const seatCount = window.UR.escapeHtml(car?.seat_count || "-");
  const image = car?.cover_image_url || "foto/default-car.webp";
  const isVip = !!car?.is_vip;
  const status = car?.status || "available";
  const statusClass = window.UR.getStatusBadgeClass(status);
  const statusLabel = window.UR.getStatusLabel(status);

  return `
    <article class="car-card">
      <div class="car-card__media">
        <img
          src="${image}"
          alt="${brand} ${model}"
          loading="lazy"
          onerror="this.src='foto/default-car.webp'"
        />

        <div class="car-card__overlay">
          <div class="card-badges">
            ${
              isVip
                ? `<span class="vip-flag">👑 VIP</span>`
                : ""
            }
            <span class="${statusClass}">${statusLabel}</span>
          </div>

          <button
            class="favorite-btn"
            type="button"
            data-favorite-id="${car.id}"
            aria-label="Sevimliyə əlavə et"
            title="Sevimliyə əlavə et"
          >
            ♡
          </button>
        </div>
      </div>

      <div class="car-card__body">
        <h3 class="car-card__title">${brand} ${model}</h3>

        <div class="car-card__meta">
          <span>${year}</span>
          <span>${transmission}</span>
          <span>${fuelType}</span>
          <span>${seatCount} yer</span>
          <span>${bodyType}</span>
        </div>

        <div class="car-card__footer">
          <div class="car-price">
            <small>Günlük</small>
            <strong>${window.UR.formatCurrency(car?.price_daily || 0)}</strong>
          </div>

          <a class="btn btn-gold" href="car-details.html?id=${encodeURIComponent(car.id)}">
            Ətraflı bax
          </a>
        </div>
      </div>
    </article>
  `;
};

// -----------------------------
// Sadə cədvəl helper
// -----------------------------
window.UR.renderTable = function (columns, rows) {
  const head = columns.map((c) => `<th>${c}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("");

  return `
    <table>
      <thead>
        <tr>${head}</tr>
      </thead>
      <tbody>
        ${body}
      </tbody>
    </table>
  `;
};

// -----------------------------
// Mock maşınlar
// Supabase boş olsa fallback kimi işləsin
// -----------------------------
window.UR.mockCars = window.UR.mockCars || [
  {
    id: "mock-1",
    brand: "Mercedes-Benz",
    model: "E-Class",
    year: 2022,
    transmission: "automatic",
    fuel_type: "petrol",
    seat_count: 5,
    body_type: "Sedan",
    price_daily: 140,
    price_monthly: 2600,
    deposit_amount: 300,
    description: "Premium sedan, rahat sürüş və yüksək komfort.",
    cover_image_url: "foto/default-car.webp",
    gallery: ["foto/default-car.webp"],
    is_vip: true,
    status: "available"
  },
  {
    id: "mock-2",
    brand: "BMW",
    model: "520",
    year: 2021,
    transmission: "automatic",
    fuel_type: "diesel",
    seat_count: 5,
    body_type: "Sedan",
    price_daily: 130,
    price_monthly: 2400,
    deposit_amount: 300,
    description: "Şəhər və uzun yol üçün ideal premium seçim.",
    cover_image_url: "foto/default-car.webp",
    gallery: ["foto/default-car.webp"],
    is_vip: false,
    status: "future_booked"
  },
  {
    id: "mock-3",
    brand: "Kia",
    model: "Sportage",
    year: 2023,
    transmission: "automatic",
    fuel_type: "petrol",
    seat_count: 5,
    body_type: "SUV",
    price_daily: 110,
    price_monthly: 2100,
    deposit_amount: 250,
    description: "Rahat ailə SUV modeli.",
    cover_image_url: "foto/default-car.webp",
    gallery: ["foto/default-car.webp"],
    is_vip: false,
    status: "available"
  }
];
