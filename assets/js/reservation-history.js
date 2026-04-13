document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("reservationHistoryList");
  if (!list) return;

  let reservations = [];
  if (window.supabaseClient) {
    const session = await window.UR.requireUser();
    if (!session) return;
    const { data } = await window.supabaseClient
      .from("reservations")
      .select("*")
      .eq("user_id", session.user.id)
      .in("status", ["completed", "rejected", "cancelled"]);
    reservations = data || [];
  }

  if (!reservations.length) {
    reservations = [
      { id: "RES-0901", start_date: "2026-03-10", end_date: "2026-03-12", total_amount: 220, status: "completed" }
    ];
  }

  list.innerHTML = reservations.map((res) => `
    <article class="reservation-card">
      <div class="status-row">
        <span class="badge ${window.UR.getStatusBadgeClass(res.status)}">${window.UR.getStatusLabel(res.status)}</span>
      </div>
      <h3 class="mt-3">Tarixçə ID: ${res.id || "-"}</h3>
      <p>${window.UR.formatDate(res.start_date)} - ${window.UR.formatDate(res.end_date)}</p>
      <strong>${window.UR.formatCurrency(res.total_amount)}</strong>
    </article>
  `).join("");
});
