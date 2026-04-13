async function loadCarsData() {
  if (!window.supabaseClient) return window.UR.mockCars || [];

  const { data, error } = await window.supabaseClient
    .from("cars")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Cars yüklənmə xətası:", error);
    return window.UR.mockCars || [];
  }

  return data || [];
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function parseDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateRangeValid(startDate, endDate) {
  if (!startDate || !endDate) return true;
  return startDate <= endDate;
}

function filterCarsList(cars, filters) {
  return cars.filter((car) => {
    const brandOk = !filters.brand || normalizeText(car.brand).includes(filters.brand);
    const modelOk = !filters.model || normalizeText(car.model).includes(filters.model);
    const vipOk = !filters.onlyVip || !!car.is_vip;
    const priceOk = !filters.maxPrice || Number(car.price_daily || 0) <= filters.maxPrice;
    const transmissionOk =
      !filters.transmission || normalizeText(car.transmission) === filters.transmission;
    const fuelOk =
      !filters.fuelType || normalizeText(car.fuel_type) === filters.fuelType;

    const haystack = [
      car.brand,
      car.model,
      car.body_type,
      car.transmission,
      car.fuel_type,
      car.description
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const searchOk = !filters.search || haystack.includes(filters.search);

    return brandOk && modelOk && vipOk && priceOk && transmissionOk && fuelOk && searchOk;
  });
}

function renderCatalogCars(cars, container, countEl, feedbackEl) {
  if (!container) return;

  if (!cars.length) {
    container.innerHTML = `
      <article class="glass-panel empty-state">
        <h3>Uyğun maşın tapılmadı</h3>
        <p>Filterləri dəyişin və ya axtarışı yenidən yoxlayın.</p>
      </article>
    `;
    if (countEl) countEl.textContent = "0";
    if (feedbackEl) feedbackEl.textContent = "";
    return;
  }

  container.innerHTML = cars.map(window.UR.createCarCard).join("");
  if (countEl) countEl.textContent = String(cars.length);
  if (feedbackEl) feedbackEl.textContent = "";
}

function readQueryParamsToFilters() {
  const params = new URLSearchParams(window.location.search);

  return {
    brand: normalizeText(params.get("brand")),
    model: normalizeText(params.get("model")),
    maxPrice: Number(params.get("maxPrice") || 0),
    startDate: params.get("start") || "",
    endDate: params.get("end") || "",
    onlyVip: params.get("vip") === "1",
    transmission: normalizeText(params.get("transmission")),
    fuelType: normalizeText(params.get("fuel")),
    search: normalizeText(params.get("search"))
  };
}

function writeFiltersToInputs(filters) {
  const brandEl = document.getElementById("filterBrand");
  const modelEl = document.getElementById("filterModel");
  const maxPriceEl = document.getElementById("filterMaxPrice");
  const startDateEl = document.getElementById("filterStartDate");
  const endDateEl = document.getElementById("filterEndDate");
  const vipEl = document.getElementById("filterVip");
  const transmissionEl = document.getElementById("filterTransmission");
  const fuelEl = document.getElementById("filterFuelType");
  const searchEl = document.getElementById("catalogSearch");

  if (brandEl) brandEl.value = filters.brand || "";
  if (modelEl) modelEl.value = filters.model || "";
  if (maxPriceEl) maxPriceEl.value = filters.maxPrice || "";
  if (startDateEl) startDateEl.value = filters.startDate || "";
  if (endDateEl) endDateEl.value = filters.endDate || "";
  if (vipEl) vipEl.checked = !!filters.onlyVip;
  if (transmissionEl) transmissionEl.value = filters.transmission || "";
  if (fuelEl) fuelEl.value = filters.fuelType || "";
  if (searchEl) searchEl.value = filters.search || "";
}

document.addEventListener("DOMContentLoaded", async () => {
  const featuredCars = document.getElementById("featuredCars");
  const carsGrid = document.getElementById("carsGrid");
  const favoriteCarsGrid = document.getElementById("favoriteCarsGrid");
  const resCarSelect = document.getElementById("resCarId");

  const cars = await loadCarsData();

  if (featuredCars) {
    featuredCars.innerHTML = cars.slice(0, 3).map(window.UR.createCarCard).join("");
  }

  if (favoriteCarsGrid) {
    favoriteCarsGrid.innerHTML = cars
      .filter((car) => car.is_vip)
      .map(window.UR.createCarCard)
      .join("");
  }

  if (resCarSelect) {
    resCarSelect.innerHTML = `
      <option value="">Maşın seçin</option>
      ${cars
        .map((car) => `<option value="${car.id}">${car.brand} ${car.model}</option>`)
        .join("")}
    `;
  }

  if (carsGrid) {
    const countEl = document.getElementById("catalogCount");
    const searchInput = document.getElementById("catalogSearch");
    const filterForm = document.getElementById("catalogFilterForm");
    const feedbackEl = document.getElementById("catalogFeedback");
    const resetBtn = document.getElementById("resetCatalogFilters");

    let currentFilters = readQueryParamsToFilters();
    writeFiltersToInputs(currentFilters);

    const applyFiltersAndRender = () => {
      const startDate = parseDateValue(currentFilters.startDate);
      const endDate = parseDateValue(currentFilters.endDate);

      if (!isDateRangeValid(startDate, endDate)) {
        if (feedbackEl) {
          feedbackEl.innerHTML = `
            <div class="glass-panel feedback feedback--error">
              Bitmə tarixi başlanğıc tarixindən kiçik ola bilməz.
            </div>
          `;
        }
        renderCatalogCars([], carsGrid, countEl, null);
        return;
      }

      const filteredCars = filterCarsList(cars, currentFilters);
      renderCatalogCars(filteredCars, carsGrid, countEl, feedbackEl);
    };

    applyFiltersAndRender();

    searchInput?.addEventListener("input", () => {
      currentFilters.search = normalizeText(searchInput.value);
      applyFiltersAndRender();
    });

    filterForm?.addEventListener("submit", (event) => {
      event.preventDefault();

      currentFilters = {
        ...currentFilters,
        brand: normalizeText(document.getElementById("filterBrand")?.value),
        model: normalizeText(document.getElementById("filterModel")?.value),
        maxPrice: Number(document.getElementById("filterMaxPrice")?.value || 0),
        startDate: document.getElementById("filterStartDate")?.value || "",
        endDate: document.getElementById("filterEndDate")?.value || "",
        onlyVip: !!document.getElementById("filterVip")?.checked,
        transmission: normalizeText(document.getElementById("filterTransmission")?.value),
        fuelType: normalizeText(document.getElementById("filterFuelType")?.value),
        search: normalizeText(document.getElementById("catalogSearch")?.value)
      };

      applyFiltersAndRender();
    });

    resetBtn?.addEventListener("click", () => {
      currentFilters = {
        brand: "",
        model: "",
        maxPrice: 0,
        startDate: "",
        endDate: "",
        onlyVip: false,
        transmission: "",
        fuelType: "",
        search: ""
      };

      writeFiltersToInputs(currentFilters);
      applyFiltersAndRender();
    });
  }

  document.getElementById("homeQuickSearch")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const brand = document.getElementById("homeBrand")?.value.trim();
    const start = document.getElementById("homePickup")?.value;
    const end = document.getElementById("homeDropoff")?.value;

    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (start) params.set("start", start);
    if (end) params.set("end", end);

    location.href = `cars.html?${params.toString()}`;
  });
});
