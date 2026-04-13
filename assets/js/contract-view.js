document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("contractContent");
  if (!container) return;

  container.innerHTML = `
    <div class="glass-tile">
      <strong>Şirkət:</strong> Uğur RentaCar
    </div>
    <div class="glass-tile">
      <strong>Müştəri:</strong> Demo Müştəri
    </div>
    <div class="glass-tile">
      <strong>Maşın:</strong> Mercedes-Benz E 220
    </div>
    <div class="glass-tile">
      <strong>Müddət:</strong> 16.04.2026 - 18.04.2026
    </div>
    <div class="glass-tile">
      <strong>Qeyd:</strong> Bu səhifə müqavilənin ekranda baxış versiyasıdır.
    </div>
  `;

  document.getElementById("downloadContractBtn")?.addEventListener("click", () => {
    window.print();
  });
});
