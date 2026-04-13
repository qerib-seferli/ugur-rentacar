document.addEventListener("DOMContentLoaded", async () => {
  const page = document.querySelector(".page-admin");
  if (!page) return;

  const auth = await window.UR.requireAdmin();
  if (!auth) return;

  document.querySelectorAll(".admin-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((btn) => btn.classList.remove("is-active"));
      document.querySelectorAll(".admin-panel").forEach((panel) => panel.classList.remove("is-visible"));
      button.classList.add("is-active");
      document.getElementById(`tab-${button.dataset.tab}`)?.classList.add("is-visible");
    });
  });

  document.getElementById("logoutAdminBtn")?.addEventListener("click", async () => {
    await window.supabaseClient.auth.signOut();
    location.href = "admin-login.html";
  });

  const statsMount = document.getElementById("adminStats");
  statsMount.innerHTML = [
    ["Aktiv user", "128"],
    ["Maşın sayı", "24"],
    ["Gözləyən rezerv", "7"],
    ["Rəy sayı", "43"]
  ].map(([label, value]) => `
    <div class="stat-card">
      <small>${label}</small>
      <h3>${value}</h3>
    </div>
  `).join("");

  // İstifadəçilər
  let users = [];
  if (window.supabaseClient) {
    const { data } = await window.supabaseClient.from("profiles").select("id, first_name, last_name, phone, email, created_at").limit(50);
    users = data || [];
  }
  if (!users.length) {
    users = [{first_name:"Demo", last_name:"User", phone:"+994501112233", email:"demo@example.com", created_at:new Date().toISOString()}];
  }
  document.getElementById("adminUsersTable").innerHTML = window.UR.renderTable(
    ["Ad", "Telefon", "Email", "Qeydiyyat tarixi"],
    users.map((u) => [`${u.first_name || ""} ${u.last_name || ""}`.trim(), u.phone || "-", u.email || "-", window.UR.formatDate(u.created_at)])
  );

  // Maşınlar
  let cars = [];
  if (window.supabaseClient) {
    const { data } = await window.supabaseClient.from("cars").select("brand, model, price_daily, status, is_vip").limit(50);
    cars = data || [];
  }
  if (!cars.length) cars = window.UR.mockCars;
  document.getElementById("adminCarsTable").innerHTML = window.UR.renderTable(
    ["Maşın", "Günlük qiymət", "Status", "VIP"],
    cars.map((c) => [`${c.brand} ${c.model}`, window.UR.formatCurrency(c.price_daily), window.UR.getStatusLabel(c.status), c.is_vip ? "Bəli" : "Xeyr"])
  );

  // Rezervasiyalar
  let reservations = [];
  if (window.supabaseClient) {
    const { data } = await window.supabaseClient.from("reservations").select("id, full_name, start_date, end_date, total_amount, status").limit(50);
    reservations = data || [];
  }
  if (!reservations.length) {
    reservations = [{id:"RES-1001", full_name:"Demo Müştəri", start_date:"2026-04-16", end_date:"2026-04-18", total_amount:300, status:"under_review"}];
  }
  document.getElementById("adminReservationsTable").innerHTML = window.UR.renderTable(
    ["ID", "Müştəri", "Müddət", "Məbləğ", "Status"],
    reservations.map((r) => [r.id || "-", r.full_name || "-", `${window.UR.formatDate(r.start_date)} - ${window.UR.formatDate(r.end_date)}`, window.UR.formatCurrency(r.total_amount), window.UR.getStatusLabel(r.status)])
  );

  // Rəylər
  document.getElementById("adminReviewsTable").innerHTML = window.UR.renderTable(
    ["Müştəri", "Reytinq", "Rəy"],
    [["Demo User", "5/5", "Çox rahat və premium xidmət."]]
  );
});
