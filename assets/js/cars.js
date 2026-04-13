async function loadCarsData() {
  if (!window.supabaseClient) return window.UR.mockCars;

  const { data, error } = await window.supabaseClient
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return window.UR.mockCars;
  return data;
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

  if (carsGrid) {
    const countEl = document.getElementById("catalogCount");
    const searchInput = document.getElementById("catalogSearch");
    const filterForm = document.getElementById("catalogFilterForm");

    const render = (items) => {
      carsGrid.innerHTML = items.map(window.UR.createCarCard).join("");
      if (countEl) countEl.textContent = String(items.length);
    };

    render(cars);

    searchInput?.addEventListener("input", () => {
      const value = searchInput.value.trim().toLowerCase();
      const filtered = cars.filter((car) =>
        [car.brand, car.model, car.body_type, car.transmission, car.fuel_type]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(value)
      );
      render(filtered);
    });

    filterForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const brand = document.getElementById("filterBrand").value.trim().toLowerCase();
      const model = document.getElementById("filterModel").value.trim().toLowerCase();
      const maxPrice = Number(document.getElementById("filterMaxPrice").value || 0);
      const onlyVip = document.getElementById("filterVip").checked;

      const filtered = cars.filter((car) => {
        const brandOk = !brand || (car.brand || "").toLowerCase().includes(brand);
        const modelOk = !model || (car.model || "").toLowerCase().includes(model);
        const priceOk = !maxPrice || Number(car.price_daily || 0) <= maxPrice;
        const vipOk = !onlyVip || !!car.is_vip;
        return brandOk && modelOk && priceOk && vipOk;
      });

      render(filtered);
    });
  }

  if (favoriteCarsGrid) {
    favoriteCarsGrid.innerHTML = cars.filter((car) => car.is_vip).map(window.UR.createCarCard).join("");
  }

  if (resCarSelect) {
    resCarSelect.innerHTML = cars.map((car) => `<option value="${car.id}">${car.brand} ${car.model}</option>`).join("");
  }

  document.getElementById("homeQuickSearch")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const brand = document.getElementById("homeBrand").value.trim();
    const start = document.getElementById("homePickup").value;
    const end = document.getElementById("homeDropoff").value;
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    location.href = `cars.html?${params.toString()}`;
  });
});
