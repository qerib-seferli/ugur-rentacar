document.addEventListener("DOMContentLoaded", async () => {
  const page = document.querySelector(".page-admin");
  if (!page) return;

  const auth = await window.UR.requireAdmin();
  if (!auth) return;

  const supabase = window.supabaseClient;

  // ================================
  // TAB KEÇİDLƏRİ
  // ================================
  document.querySelectorAll(".admin-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((btn) => btn.classList.remove("is-active"));
      document.querySelectorAll(".admin-panel").forEach((panel) => panel.classList.remove("is-visible"));

      button.classList.add("is-active");
      document.getElementById(`tab-${button.dataset.tab}`)?.classList.add("is-visible");
    });
  });

  // ================================
  // LOGOUT
  // ================================
  document.getElementById("logoutAdminBtn")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.href = "admin-login.html";
  });

  // ================================
  // DOM ELEMENTLƏRİ
  // ================================
  const adminCarsMessage = document.getElementById("adminCarsMessage");
  const adminCarsTable = document.getElementById("adminCarsTable");
  const adminStats = document.getElementById("adminStats");
  const adminUsersTable = document.getElementById("adminUsersTable");
  const adminReservationsTable = document.getElementById("adminReservationsTable");
  const adminReviewsTable = document.getElementById("adminReviewsTable");
  const adminUserSearch = document.getElementById("adminUserSearch");

  const adminCarForm = document.getElementById("adminCarForm");
  const adminCarFormTitle = document.getElementById("adminCarFormTitle");
  const showCarFormBtn = document.getElementById("showCarFormBtn");
  const resetCarFormBtn = document.getElementById("resetCarFormBtn");
  const cancelEditCarBtn = document.getElementById("cancelEditCarBtn");
  const adminRefreshCars = document.getElementById("adminRefreshCars");
  const adminRefreshReservations = document.getElementById("adminRefreshReservations");

  let carsCache = [];
  let usersCache = [];

  // ================================
  // KÖMƏKÇİ FUNKSİYALAR
  // ================================
  function setAdminMessage(message, isError = false) {
    if (!adminCarsMessage) return;
    window.UR.setMessage("adminCarsMessage", message, isError);
  }

  function getCarFormValues() {
    const galleryRaw = document.getElementById("carGallery").value.trim();

    return {
      id: document.getElementById("carId").value.trim(),
      brand: document.getElementById("carBrand").value.trim(),
      model: document.getElementById("carModel").value.trim(),
      year: Number(document.getElementById("carYear").value || 0) || null,
      color: document.getElementById("carColor").value.trim() || null,
      fuel_type: document.getElementById("carFuelType").value || null,
      transmission: document.getElementById("carTransmission").value || null,
      seat_count: Number(document.getElementById("carSeatCount").value || 0) || null,
      body_type: document.getElementById("carBodyType").value.trim() || null,
      price_daily: Number(document.getElementById("carDailyPrice").value || 0),
      price_weekly: Number(document.getElementById("carWeeklyPrice").value || 0),
      price_monthly: Number(document.getElementById("carMonthlyPrice").value || 0),
      deposit_amount: Number(document.getElementById("carDepositAmount").value || 0),
      status: document.getElementById("carStatus").value,
      cover_image_url: document.getElementById("carCoverImage").value.trim() || null,
      description: document.getElementById("carDescription").value.trim() || null,
      is_vip: document.getElementById("carIsVip").checked,
      is_active: document.getElementById("carIsActive").checked,
      gallery: galleryRaw
        ? galleryRaw.split(",").map((item) => item.trim()).filter(Boolean)
        : []
    };
  }

  function resetCarForm() {
    adminCarForm.reset();
    document.getElementById("carId").value = "";
    document.getElementById("carIsActive").checked = true;
    adminCarFormTitle.textContent = "Yeni maşın əlavə et";
    setAdminMessage("");
  }

  function fillCarForm(car) {
    document.getElementById("carId").value = car.id || "";
    document.getElementById("carBrand").value = car.brand || "";
    document.getElementById("carModel").value = car.model || "";
    document.getElementById("carYear").value = car.year || "";
    document.getElementById("carColor").value = car.color || "";
    document.getElementById("carFuelType").value = car.fuel_type || "";
    document.getElementById("carTransmission").value = car.transmission || "";
    document.getElementById("carSeatCount").value = car.seat_count || "";
    document.getElementById("carBodyType").value = car.body_type || "";
    document.getElementById("carDailyPrice").value = car.price_daily || "";
    document.getElementById("carWeeklyPrice").value = car.price_weekly || "";
    document.getElementById("carMonthlyPrice").value = car.price_monthly || "";
    document.getElementById("carDepositAmount").value = car.deposit_amount || "";
    document.getElementById("carStatus").value = car.status || "available";
    document.getElementById("carCoverImage").value = car.cover_image_url || "";
    document.getElementById("carDescription").value = car.description || "";
    document.getElementById("carIsVip").checked = !!car.is_vip;
    document.getElementById("carIsActive").checked = !!car.is_active;

    const gallery = Array.isArray(car.gallery)
      ? car.gallery
      : typeof car.gallery === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(car.gallery);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

    document.getElementById("carGallery").value = gallery.join(", ");
    adminCarFormTitle.textContent = "Maşını redaktə et";

    adminCarForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validateCarForm(values) {
    if (!values.brand) return "Marka daxil edin.";
    if (!values.model) return "Model daxil edin.";
    if (!values.price_daily || values.price_daily < 0) return "Günlük qiyməti düzgün daxil edin.";
    return "";
  }

  // ================================
  // DASHBOARD
  // ================================
  async function loadDashboardStats() {
    let userCount = 0;
    let carCount = 0;
    let reservationCount = 0;
    let reviewCount = 0;

    if (supabase) {
      const [
        usersResult,
        carsResult,
        reservationsResult,
        reviewsResult
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("cars").select("*", { count: "exact", head: true }),
        supabase.from("reservations").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true })
      ]);

      userCount = usersResult.count || 0;
      carCount = carsResult.count || 0;
      reservationCount = reservationsResult.count || 0;
      reviewCount = reviewsResult.count || 0;
    }

    adminStats.innerHTML = [
      ["Aktiv user", String(userCount)],
      ["Maşın sayı", String(carCount)],
      ["Rezervasiya sayı", String(reservationCount)],
      ["Rəy sayı", String(reviewCount)]
    ]
      .map(
        ([label, value]) => `
          <div class="stat-card">
            <small>${label}</small>
            <h3>${value}</h3>
          </div>
        `
      )
      .join("");
  }

  // ================================
  // USERS
  // ================================
  async function loadUsers() {
    let users = [];

    if (supabase) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone, email, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Users yükləmə xətası:", error);
      } else {
        users = data || [];
      }
    }

    usersCache = users;

    if (!users.length) {
      users = [
        {
          first_name: "Demo",
          last_name: "User",
          phone: "+994501112233",
          email: "demo@example.com",
          created_at: new Date().toISOString()
        }
      ];
    }

    renderUsersTable(users);
  }

  function renderUsersTable(users) {
    adminUsersTable.innerHTML = window.UR.renderTable(
      ["Ad", "Telefon", "Email", "Qeydiyyat tarixi"],
      users.map((u) => [
        `${u.first_name || ""} ${u.last_name || ""}`.trim() || "-",
        u.phone || "-",
        u.email || "-",
        window.UR.formatDate ? window.UR.formatDate(u.created_at) : (u.created_at || "-")
      ])
    );
  }

  adminUserSearch?.addEventListener("input", () => {
    const keyword = adminUserSearch.value.trim().toLowerCase();

    const filtered = usersCache.filter((u) =>
      [
        u.first_name,
        u.last_name,
        u.phone,
        u.email
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );

    renderUsersTable(filtered);
  });

  // ================================
  // CARS
  // ================================
  async function loadCars() {
    let cars = [];

    if (supabase) {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Cars yükləmə xətası:", error);
        setAdminMessage(`Maşınlar yüklənmədi: ${error.message}`, true);
      } else {
        cars = data || [];
      }
    }

    carsCache = cars;
    renderCarsTable(carsCache);
  }

  function renderCarsTable(cars) {
    if (!cars.length) {
      adminCarsTable.innerHTML = `
        <div class="glass-subpanel empty-admin-state">
          Hələ maşın əlavə edilməyib.
        </div>
      `;
      return;
    }

    adminCarsTable.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Maşın</th>
              <th>Qiymət</th>
              <th>Status</th>
              <th>VIP</th>
              <th>Aktiv</th>
              <th>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            ${cars
              .map(
                (car) => `
                  <tr>
                    <td>
                      <strong>${car.brand || ""} ${car.model || ""}</strong>
                    </td>
                    <td>${window.UR.formatCurrency(car.price_daily || 0)}</td>
                    <td>${window.UR.getStatusLabel(car.status)}</td>
                    <td>${car.is_vip ? "Bəli" : "Xeyr"}</td>
                    <td>${car.is_active ? "Bəli" : "Xeyr"}</td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-outline btn-sm" type="button" data-edit-car="${car.id}">
                          Redaktə et
                        </button>
                        <button class="btn btn-danger btn-sm" type="button" data-delete-car="${car.id}">
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    adminCarsTable.querySelectorAll("[data-edit-car]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.editCar;
        const car = carsCache.find((item) => String(item.id) === String(id));
        if (car) fillCarForm(car);
      });
    });

    adminCarsTable.querySelectorAll("[data-delete-car]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.deleteCar;
        const yes = confirm("Bu maşını silmək istədiyinizə əminsiniz?");
        if (!yes) return;

        const { error } = await supabase.from("cars").delete().eq("id", id);

        if (error) {
          console.error("Maşın silmə xətası:", error);
          setAdminMessage(`Maşın silinmədi: ${error.message}`, true);
          return;
        }

        setAdminMessage("Maşın uğurla silindi.");
        await loadCars();
        await loadDashboardStats();
      });
    });
  }

  adminCarForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = getCarFormValues();
    const validationError = validateCarForm(values);

    if (validationError) {
      setAdminMessage(validationError, true);
      return;
    }

    const payload = {
      brand: values.brand,
      model: values.model,
      year: values.year,
      color: values.color,
      fuel_type: values.fuel_type,
      transmission: values.transmission,
      seat_count: values.seat_count,
      body_type: values.body_type,
      price_daily: values.price_daily,
      price_weekly: values.price_weekly,
      price_monthly: values.price_monthly,
      deposit_amount: values.deposit_amount,
      status: values.status,
      cover_image_url: values.cover_image_url,
      description: values.description,
      is_vip: values.is_vip,
      is_active: values.is_active,
      gallery: values.gallery
    };

    let error = null;

    if (values.id) {
      const result = await supabase
        .from("cars")
        .update(payload)
        .eq("id", values.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("cars")
        .insert(payload);

      error = result.error;
    }

    if (error) {
      console.error("Maşın save xətası:", error);
      setAdminMessage(`Maşın yadda saxlanmadı: ${error.message}`, true);
      return;
    }

    setAdminMessage(values.id ? "Maşın uğurla yeniləndi." : "Maşın uğurla əlavə edildi.");
    resetCarForm();
    await loadCars();
    await loadDashboardStats();
  });

  showCarFormBtn?.addEventListener("click", () => {
    adminCarForm.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  resetCarFormBtn?.addEventListener("click", resetCarForm);
  cancelEditCarBtn?.addEventListener("click", resetCarForm);
  adminRefreshCars?.addEventListener("click", loadCars);

  // ================================
  // RESERVATIONS
  // ================================
  async function loadReservations() {
    let reservations = [];

    if (supabase) {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, full_name, start_date, end_date, total_amount, status")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Reservations yükləmə xətası:", error);
      } else {
        reservations = data || [];
      }
    }

    if (!reservations.length) {
      reservations = [
        {
          id: "RES-1001",
          full_name: "Demo Müştəri",
          start_date: "2026-04-16",
          end_date: "2026-04-18",
          total_amount: 300,
          status: "under_review"
        }
      ];
    }

    adminReservationsTable.innerHTML = window.UR.renderTable(
      ["ID", "Müştəri", "Müddət", "Məbləğ", "Status"],
      reservations.map((r) => [
        r.id || "-",
        r.full_name || "-",
        `${window.UR.formatDate ? window.UR.formatDate(r.start_date) : r.start_date} - ${window.UR.formatDate ? window.UR.formatDate(r.end_date) : r.end_date}`,
        window.UR.formatCurrency(r.total_amount || 0),
        window.UR.getStatusLabel(r.status)
      ])
    );
  }

  adminRefreshReservations?.addEventListener("click", loadReservations);

  // ================================
  // REVIEWS
  // ================================
  async function loadReviews() {
    let reviews = [];

    if (supabase) {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, reviewer_name, rating, comment")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Reviews yükləmə xətası:", error);
      } else {
        reviews = data || [];
      }
    }

    if (!reviews.length) {
      reviews = [
        {
          reviewer_name: "Demo User",
          rating: 5,
          comment: "Çox rahat və premium xidmət."
        }
      ];
    }

    adminReviewsTable.innerHTML = window.UR.renderTable(
      ["Müştəri", "Reytinq", "Rəy"],
      reviews.map((review) => [
        review.reviewer_name || "Anonim",
        `${review.rating || 0}/5`,
        review.comment || "-"
      ])
    );
  }

  // ================================
  // İLK YÜKLƏNİŞ
  // ================================
  await Promise.all([
    loadDashboardStats(),
    loadUsers(),
    loadCars(),
    loadReservations(),
    loadReviews()
  ]);
});
