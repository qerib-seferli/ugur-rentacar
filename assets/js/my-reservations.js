document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("activeReservationsList");
  if (!list) return;

  let reservations = [];
  if (window.supabaseClient) {
    const session = await window.UR.requireUser();
    if (!session) return;
    const { data } = await window.supabaseClient
      .from("reservations")
      .select("*")
      .eq("user_id", session.user.id)
      .in("status", ["approved", "active_rental", "receipt_uploaded", "under_review"]);
    reservations = data || [];
  }

  if (!reservations.length) {
    reservations = [
      { id: "RES-1001", full_name: "Demo User", start_date: "2026-04-16", end_date: "2026-04-18", total_amount: 300, status: "approved" }
    ];
  }

  list.innerHTML = reservations.map((res) => `
    <article class="reservation-card">
      <div class="status-row">
        <span class="badge ${window.UR.getStatusBadgeClass(res.status)}">${window.UR.getStatusLabel(res.status)}</span>
      </div>
      <h3 class="mt-3">Rezerv ID: ${res.id || "Təyin edilməyib"}</h3>
      <p>${window.UR.formatDate(res.start_date)} - ${window.UR.formatDate(res.end_date)}</p>
      <strong>${window.UR.formatCurrency(res.total_amount)}</strong>
    </article>
  `).join("");
});
