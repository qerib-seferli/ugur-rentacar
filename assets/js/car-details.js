/**
 * UĞUR RENTACAR - MAŞIN DETALLARI
 * Tək maşın səhifəsi üçün məntiq
 */

class CarDetails {
    constructor() {
        this.carId = null;
        this.carData = null;
        this.currentImageIndex = 0;
        this.images = [];
        
        this.init();
    }
    
    async init() {
        // URL-dən maşın ID-sini al
        const params = getUrlParams();
        this.carId = params.id;
        
        if (!this.carId) {
            this.showError('Maşın tapılmadı');
            return;
        }
        
        await this.loadCarDetails();
        this.setupEventListeners();
        this.checkAvailability();
    }
    
    async loadCarDetails() {
        try {
            const { data: car, error } = await supabaseClient
                .from('cars')
                .select(`
                    *,
                    car_images (image_url, is_main),
                    reviews (
                        rating,
                        comment,
                        created_at,
                        profiles (first_name, last_name)
                    )
                `)
                .eq('id', this.carId)
                .eq('is_active', true)
                .single();
            
            if (error || !car) throw new Error('Maşın tapılmadı');
            
            this.carData = car;
            this.images = car.car_images || [];
            
            this.renderCarDetails();
            this.renderGallery();
            this.renderReviews();
            this.updateSEO(car);
            
        } catch (error) {
            console.error('Maşın detalları yükləmə xətası:', error);
            this.showError('Maşın məlumatları yüklənmədi');
        }
    }
    
    renderCarDetails() {
        const car = this.carData;
        
        // Başlıq
        document.title = `${car.brand} ${car.model} ${car.year} | Uğur RentaCar`;
        
        // Əsas məlumatlar
        const mainInfo = document.getElementById('car-main-info');
        if (mainInfo) {
            mainInfo.innerHTML = `
                <h1 class="car-title-large">${car.brand} ${car.model} <span class="car-year">${car.year}</span></h1>
                ${car.is_vip ? '<span class="vip-badge-large">⭐ VIP Avtomobil</span>' : ''}
                <p class="car-subtitle">${car.body_type || ''} • ${car.transmission} • ${car.fuel_type}</p>
            `;
        }
        
        // Xüsusiyyətlər
        const features = document.getElementById('car-features-detailed');
        if (features) {
            features.innerHTML = `
                <div class="feature-item">
                    <span class="feature-label">Rəng</span>
                    <span class="feature-value">${car.color || 'Qeyd edilməyib'}</span>
                </div>
                <div class="feature-item">
                    <span class="feature-label">Oturacaq</span>
                    <span class="feature-value">${car.seats || '-'} nəfərlik</span>
                </div>
                <div class="feature-item">
                    <span class="feature-label">Sürətlər qutusu</span>
                    <span class="feature-value">${car.transmission}</span>
                </div>
                <div class="feature-item">
                    <span class="feature-label">Yanacaq</span>
                    <span class="feature-value">${car.fuel_type}</span>
                </div>
                <div class="feature-item">
                    <span class="feature-label">Ban növü</span>
                    <span class="feature-value">${car.body_type || '-'}</span>
                </div>
                <div class="feature-item">
                    <span class="feature-label">İl</span>
                    <span class="feature-value">${car.year}</span>
                </div>
            `;
        }
        
        // Açıqlama
        const description = document.getElementById('car-description');
        if (description) {
            description.innerHTML = `
                <h3>Açıqlama</h3>
                <p>${car.full_description || car.short_description || 'Açıqlama yoxdur'}</p>
            `;
        }
        
        // Qiymətlər
        const pricing = document.getElementById('car-pricing');
        if (pricing) {
            pricing.innerHTML = `
                <div class="price-box">
                    <div class="price-main">
                        <span class="price-label">Günlük</span>
                        <span class="price-value-large">${car.daily_price} ₼</span>
                    </div>
                    ${car.weekly_price ? `
                        <div class="price-item">
                            <span>Həftəlik</span>
                            <span>${car.weekly_price} ₼</span>
                        </div>
                    ` : ''}
                    ${car.monthly_price ? `
                        <div class="price-item">
                            <span>Aylıq</span>
                            <span>${car.monthly_price} ₼</span>
                        </div>
                    ` : ''}
                    ${car.deposit ? `
                        <div class="price-item deposit">
                            <span>Depozit</span>
                            <span>${car.deposit} ₼</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Rezervasiya düyməsi
        const reserveBtn = document.getElementById('reserve-btn');
        if (reserveBtn) {
            reserveBtn.href = `reservation-create.html?car_id=${car.id}`;
        }
    }
    
    renderGallery() {
        const mainImage = document.getElementById('gallery-main');
        const thumbnails = document.getElementById('gallery-thumbnails');
        
        if (!this.images.length) {
            if (mainImage) {
                mainImage.src = 'assets/img/car-placeholder.jpg';
            }
            return;
        }
        
        // Əsas şəkil
        const primaryImage = this.images.find(img => img.is_main) || this.images[0];
        if (mainImage) {
            mainImage.src = primaryImage.image_url;
        }
        
        // Thumbnails
        if (thumbnails) {
            thumbnails.innerHTML = this.images.map((img, index) => `
                <img 
                    src="${img.image_url}" 
                    alt="" 
                    class="thumbnail ${img.is_main ? 'active' : ''}"
                    onclick="carDetails.setMainImage(${index})"
                >
            `).join('');
        }
    }
    
    setMainImage(index) {
        this.currentImageIndex = index;
        const mainImage = document.getElementById('gallery-main');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        if (mainImage) {
            mainImage.src = this.images[index].image_url;
        }
        
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }
    
    renderReviews() {
        const container = document.getElementById('car-reviews');
        const reviews = this.carData.reviews?.filter(r => r.is_approved) || [];
        
        if (!container) return;
        
        // Ortalama reytinq
        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;
        
        const ratingSummary = document.getElementById('rating-summary');
        if (ratingSummary) {
            ratingSummary.innerHTML = `
                <div class="rating-large">${avgRating.toFixed(1)}</div>
                <div class="stars-large">${'⭐'.repeat(Math.round(avgRating))}</div>
                <div class="review-count">${reviews.length} rəy</div>
            `;
        }
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="no-reviews">Hələ rəy yoxdur</p>';
            return;
        }
        
        container.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-name">
                        ${review.profiles?.first_name || ''} ${review.profiles?.last_name || ''}
                    </div>
                    <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                </div>
                <p class="review-text">${review.comment || ''}</p>
                <div class="review-date">${formatDate(review.created_at)}</div>
            </div>
        `).join('');
    }
    
    async checkAvailability() {
        const calendar = document.getElementById('availability-calendar');
        if (!calendar) return;
        
        // Gələcək rezervasiyaları göstər
        const today = new Date().toISOString().split('T')[0];
        
        const { data: reservations } = await supabaseClient
            .from('reservations')
            .select('pickup_date, return_date')
            .eq('car_id', this.carId)
            .eq('status', 'approved')
            .gte('return_date', today);
        
        // Burada təqvim komponenti əlavə edilə bilər
        // Sadə göstəriş:
        if (reservations && reservations.length > 0) {
            calendar.innerHTML = `
                <h3>📅 Yaxın günlərdə doluluq</h3>
                <p>Bu maşın üçün ${reservations.length} təsdiqlənmiş rezervasiya var.</p>
            `;
        }
    }
    
    setupEventListeners() {
        // Şəkil naviqasiyası
        const prevBtn = document.getElementById('gallery-prev');
        const nextBtn = document.getElementById('gallery-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
                this.setMainImage(newIndex);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = (this.currentImageIndex + 1) % this.images.length;
                this.setMainImage(newIndex);
            });
        }
        
        // Klaviatura naviqasiyası
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') prevBtn?.click();
            if (e.key === 'ArrowRight') nextBtn?.click();
        });
        
        // Sevimlilərə əlavə
        const favBtn = document.getElementById('favorite-btn-large');
        if (favBtn) {
            favBtn.addEventListener('click', () => this.toggleFavorite());
            this.checkFavoriteStatus();
        }
    }
    
    async checkFavoriteStatus() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;
        
        const { data: favorite } = await supabaseClient
            .from('favorites')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('car_id', this.carId)
            .single();
        
        const favBtn = document.getElementById('favorite-btn-large');
        if (favBtn && favorite) {
            favBtn.classList.add('active');
            favBtn.innerHTML = '❤️ Sevimlilərdən çıxar';
        }
    }
    
    async toggleFavorite() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            showToast('Sevimlilərə əlavə etmək üçün daxil olun', 'warning');
            window.location.href = 'login.html';
            return;
        }
        
        const favBtn = document.getElementById('favorite-btn-large');
        const isActive = favBtn.classList.contains('active');
        
        try {
            if (isActive) {
                // Sil
                await supabaseClient
                    .from('favorites')
                    .delete()
                    .eq('user_id', session.user.id)
                    .eq('car_id', this.carId);
                
                favBtn.classList.remove('active');
                favBtn.innerHTML = '🤍 Sevimlilərə əlavə et';
                showToast('Sevimlilərdən çıxarıldı', 'success');
                
            } else {
                // Əlavə et
                await supabaseClient
                    .from('favorites')
                    .insert({
                        user_id: session.user.id,
                        car_id: this.carId
                    });
                
                favBtn.classList.add('active');
                favBtn.innerHTML = '❤️ Sevimlilərdən çıxar';
                showToast('Sevimlilərə əlavə edildi', 'success');
            }
            
        } catch (error) {
            console.error('Sevimlilər xətası:', error);
            showToast('Əməliyyat uğursuz oldu', 'error');
        }
    }
    
    updateSEO(car) {
        // Meta tag-ləri yenilə
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = `${car.brand} ${car.model} ${car.year} - ${car.daily_price} AZN/gün. ${car.short_description || ''}`;
        }
        
        // Open Graph
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');
        
        if (ogTitle) ogTitle.content = `${car.brand} ${car.model} ${car.year} | Uğur RentaCar`;
        if (ogDesc) ogDesc.content = car.short_description || '';
        if (ogImage) {
            const mainImg = this.images.find(img => img.is_main) || this.images[0];
            if (mainImg) ogImage.content = mainImg.image_url;
        }
    }
    
    showError(message) {
        const container = document.getElementById('car-details-container');
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <h2>😕 ${message}</h2>
                    <a href="cars.html" class="btn btn-primary">Kataloqa qayıt</a>
                </div>
            `;
        }
    }
}

// İlkinləşdir
let carDetails;
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.car-details-page')) {
        carDetails = new CarDetails();
    }
});
