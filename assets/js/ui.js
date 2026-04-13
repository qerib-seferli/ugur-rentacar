window.UR = window.UR || {};

window.UR.renderHeader = function() {
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
        <img src="foto/logo.png" alt="Uğur RentaCar logo" />
        <div class="brand__text">
          <strong>Uğur RentaCar</strong>
          <span>Premium avtomobil icarəsi</span>
        </div>
      </a>
      <nav class="nav-links">
        ${navItems.map(([href, label]) => `<a class="nav-link ${current === href ? "is-active" : ""}" href="${href}">${label}</a>`).join("")}
      </nav>
      <div class="nav-actions">
        <a class="pill" href="tel:+994519500002">+994 51 950 00 02</a>
        <a class="btn btn-gold" href="login.html">Giriş</a>
      </div>
    </header>
  `;
};

window.UR.renderFooter = function() {
  const mount = document.getElementById("app-footer");
  if (!mount) return;
  mount.innerHTML = `
    <footer class="footer glass-panel">
      <div class="footer-grid">
        <div>
          <div class="eyebrow">Uğur RentaCar</div>
          <h3>Premium avtomobil icarəsi və rahat rezervasiya sistemi</h3>
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
      </div>
    </footer>
  `;
};

window.UR.setMessage = function(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message || "";
  el.style.color = isError ? "#ff9dae" : "#9aadc9";
};

window.UR.createCarCard = function(car) {
  const isVip = !!car.is_vip;
  return `
    <article class="car-card">
      <div class="car-card__media">
        <img src="${car.cover_image_url || "foto/default-car.webp"}" alt="${car.brand} ${car.model}" />
        <div class="car-card__overlay">
          ${isVip ? `<span class="vip-flag">👑 VIP</span>` : `<span class="badge ${window.UR.getStatusBadgeClass(car.status)}">${window.UR.getStatusLabel(car.status)}</span>`}
          <button class="favorite-btn" type="button" data-favorite-id="${car.id}" aria-label="Sevimliyə əlavə et">♥</button>
        </div>
      </div>
      <div class="car-card__body">
        <h3>${car.brand} ${car.model}</h3>
        <div class="car-card__meta">
          <span>${car.year}</span>
          <span>${car.transmission}</span>
          <span>${car.fuel_type}</span>
          <span>${car.seat_count} yer</span>
        </div>
        <div class="car-card__footer">
          <div class="car-price">
            <small>Günlük</small>
            <strong>${window.UR.formatCurrency(car.price_daily)}</strong>
          </div>
          <a class="btn btn-gold" href="car-details.html?id=${encodeURIComponent(car.id)}">Ətraflı bax</a>
        </div>
      </div>
    </article>
  `;
};

window.UR.renderTable = function(columns, rows) {
  const head = columns.map((c) => `<th>${c}</th>`).join("");
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
};
