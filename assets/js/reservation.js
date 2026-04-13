document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("reservationForm");
  if (!form) return;

  const session = await window.supabaseClient?.auth.getSession();
  const user = session?.data?.session?.user || null;

  if (user && window.supabaseClient) {
    const { data: profile } = await window.supabaseClient.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (profile) {
      document.getElementById("resFullName").value = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      document.getElementById("resPhone").value = profile.phone || user.phone || "";
      document.getElementById("resEmail").value = profile.email || "";
      document.getElementById("resAddress").value = profile.address || "";
    }
  }

  const carIdParam = new URLSearchParams(location.search).get("car_id");
  if (carIdParam) {
    const select = document.getElementById("resCarId");
    if (select) select.value = carIdParam;
  }

  function calculateSummary() {
    const carId = document.getElementById("resCarId").value;
    const start = document.getElementById("resStartDate").value;
    const end = document.getElementById("resEndDate").value;
    const car = (window.UR.mockCars || []).find((item) => String(item.id) === String(carId));
    if (!car || !start || !end) return;
    const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000));
    const amount = days * Number(car.price_daily || 0);
    document.getElementById("reservationDays").textContent = `${days} gün`;
    document.getElementById("reservationAmount").textContent = window.UR.formatCurrency(amount);
    document.getElementById("reservationDeposit").textContent = window.UR.formatCurrency(car.deposit_amount || 0);
  }

  document.getElementById("resCarId").addEventListener("change", calculateSummary);
  document.getElementById("resStartDate").addEventListener("change", calculateSummary);
  document.getElementById("resEndDate").addEventListener("change", calculateSummary);

  document.getElementById("checkAvailabilityBtn").addEventListener("click", () => {
    calculateSummary();
    document.getElementById("reservationStatusBox").textContent = "Tarix yoxlanıldı";
    window.UR.setMessage("reservationMessage", "Tarix aralığı backend yoxlamasına hazırdır.");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const carId = document.getElementById("resCarId").value;
    const start = document.getElementById("resStartDate").value;
    const end = document.getElementById("resEndDate").value;
    const car = (window.UR.mockCars || []).find((item) => String(item.id) === String(carId));
    const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000));
    const total = days * Number(car?.price_daily || 0);

    const payload = {
      user_id: user?.id || null,
      car_id: carId,
      full_name: document.getElementById("resFullName").value.trim(),
      phone: document.getElementById("resPhone").value.trim(),
      email: document.getElementById("resEmail").value.trim(),
      whatsapp: document.getElementById("resWhatsapp").value.trim(),
      fin_code: document.getElementById("resFin").value.trim(),
      address: document.getElementById("resAddress").value.trim(),
      start_date: start,
      end_date: end,
      note: document.getElementById("resNote").value.trim(),
      total_amount: total,
      deposit_amount: Number(car?.deposit_amount || 0),
      status: "new"
    };

    if (!window.supabaseClient) {
      window.UR.setMessage("reservationMessage", "Supabase qurulmayıb. Bu rezervasiya mock rejimində görünəcək.");
      document.getElementById("reservationStatusBox").textContent = "Mock yaradıldı";
      return;
    }

    const { error } = await window.supabaseClient.from("reservations").insert(payload);
    if (error) {
      window.UR.setMessage("reservationMessage", error.message, true);
      return;
    }

    document.getElementById("reservationStatusBox").textContent = "Yaradıldı";
    window.UR.setMessage("reservationMessage", "Rezervasiya uğurla yaradıldı.");
    form.reset();
  });

  document.getElementById("uploadReceiptBtn").addEventListener("click", async () => {
    const file = document.getElementById("receiptFile").files?.[0];
    if (!file) {
      window.UR.setMessage("reservationMessage", "Əvvəl çek faylı seçin.", true);
      return;
    }

    if (!window.supabaseClient || !user) {
      window.UR.setMessage("reservationMessage", "Receipt upload üçün giriş edin və Supabase config əlavə edin.", true);
      return;
    }

    const filePath = `${user.id}/receipt-${Date.now()}-${file.name}`;
    const { error } = await window.supabaseClient.storage
      .from("payment-receipts")
      .upload(filePath, file, { upsert: true });

    if (error) {
      window.UR.setMessage("reservationMessage", error.message, true);
      return;
    }

    window.UR.setMessage("reservationMessage", "Çek faylı uğurla yükləndi.");
  });
});
