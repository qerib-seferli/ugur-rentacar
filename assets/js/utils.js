window.UR = window.UR || {};

window.UR.constants = {
  phones: ["+994519500002", "+994503092626", "+994103092626"],
  whatsappPhone: "994519500002",
  whatsappText: "Salam, Uğur RentaCar. Maşın icarəsi ilə bağlı məlumat almaq istəyirəm.",
  address1: "https://www.google.com/maps/place/40%C2%B022'21.0%22N+47%C2%B007'33.1%22E/@40.372494,47.125861,672m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d40.372494!4d47.125861?entry=ttu&g_ep=EgoyMDI2MDQwOC4wIKXMDSoASAFQAw%3D%3D",
  address2: "https://www.google.com/maps/place/40%C2%B023'59.0%22N+47%C2%B007'21.9%22E/@40.399715,47.1220923,168m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d40.399714!4d47.122736?entry=ttu&g_ep=EgoyMDI2MDQwOC4wIKXMDSoASAFQAw%3D%3D"
};

window.UR.mockCars = [
  {
    id: "car-1",
    brand: "Mercedes-Benz",
    model: "E 220",
    year: 2023,
    transmission: "Avtomat",
    fuel_type: "Benzin",
    seat_count: 5,
    body_type: "Sedan",
    color: "Qara",
    price_daily: 150,
    price_monthly: 3200,
    deposit_amount: 300,
    description: "Premium sürüş hissi, rahat salon və işgüzar görünüş.",
    is_vip: true,
    status: "available",
    cover_image_url: "foto/default-car.webp",
    gallery: ["foto/default-car.webp", "foto/default-car.webp", "foto/default-car.webp"],
  },
  {
    id: "car-2",
    brand: "BMW",
    model: "530i",
    year: 2022,
    transmission: "Avtomat",
    fuel_type: "Benzin",
    seat_count: 5,
    body_type: "Sedan",
    color: "Ağ",
    price_daily: 145,
    price_monthly: 3100,
    deposit_amount: 300,
    description: "Sport və komfort bir arada.",
    is_vip: true,
    status: "future_booked",
    cover_image_url: "foto/default-car.webp",
    gallery: ["foto/default-car.webp", "foto/default-car.webp"],
  },
  {
    id: "car-3",
    brand: "Kia",
    model: "Sportage",
    year: 2024,
    transmission: "Avtomat",
    fuel_type: "Benzin",
    seat_count: 5,
    body_type: "SUV",
    color: "Boz",
    price_daily: 95,
    price_monthly: 2200,
    deposit_amount: 200,
    description: "Ailə və şəhər istifadəsi üçün ideal SUV.",
    is_vip: false,
    status: "available",
    cover_image_url: "foto/default-car.webp",
    gallery: ["foto/default-car.webp", "foto/default-car.webp"],
  },
  {
    id: "car-4",
    brand: "Toyota",
    model: "Camry",
    year: 2021,
    transmission: "Avtomat",
    fuel_type: "Benzin",
    seat_count: 5,
    body_type: "Sedan",
    color: "Gümüşü",
    price_daily: 110,
    price_monthly: 2450,
    deposit_amount: 220,
    description: "Etibarlı və rahat sürüş üçün ideal seçim.",
    is_vip: false,
    status: "reserved",
    cover_image_url: "foto/default-car.webp",
    gallery: ["foto/default-car.webp"],
  }
];

window.UR.formatCurrency = function(amount) {
  const value = Number(amount || 0);
  return `${value.toLocaleString("az-AZ")} AZN`;
};

window.UR.formatDate = function(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("az-AZ");
};

window.UR.qs = (selector, scope = document) => scope.querySelector(selector);
window.UR.qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
window.UR.safe = (value, fallback = "") => value ?? fallback;
window.UR.isLoggedIn = async function () {
  if (!window.supabaseClient) return false;
  const { data } = await window.supabaseClient.auth.getSession();
  return !!data?.session;
};

window.UR.openWhatsapp = function() {
  const url = `https://wa.me/${window.UR.constants.whatsappPhone}?text=${encodeURIComponent(window.UR.constants.whatsappText)}`;
  window.open(url, "_blank", "noopener");
};

window.UR.getStatusBadgeClass = function(status) {
  switch (status) {
    case "available": return "badge--available";
    case "reserved": return "badge--reserved";
    case "future_booked": return "badge--future";
    default: return "";
  }
};

window.UR.getStatusLabel = function(status) {
  switch (status) {
    case "available": return "Boşdur";
    case "reserved": return "Rezervasiya olunub";
    case "future_booked": return "Gələcək bron var";
    case "under_review": return "Yoxlanılır";
    case "approved": return "Təsdiqlənib";
    case "rejected": return "Rədd edilib";
    default: return status || "Status yoxdur";
  }
};
