/**
 * UĞUR RENTACAR - MAŞIN KATALOQU
 * Maşınların siyahısı, filter və axtarış
 */

class CarCatalog {
    constructor() {
        this.cars = [];
        this.filters = {
            brand: '',
            minPrice: '',
            maxPrice: '',
            bodyType: '',
            transmission: '',
            fuelType: '',
            seats: '',
            isVip: false,
            availableOnly: false
        };
        
        this.init();
    }
    
    async init() {
        await this.loadCars();
        this.setupEventListeners();
        this.setupFilters();
    }
    
    async loadCars() {
        try {
            let query = supabaseClient
                .from('cars')
                .select(`
                    *,
                    car_images (image_url, is_main),
                    reviews (rating)
                `)
                .eq('is_active', true);
            
            // Filter-ləri tətbiq et
            if (this.filters.brand) {
                query = query.ilike('brand', `%${this.filters.brand}%`);
            }
            
            if (this.filters.bodyType) {
                query = query.eq('body_type', this.filters.bodyType);
            }
            
            if (this.filters.transmission) {
                query = query.eq('transmission', this.filters.transmission);
            }
            
            if (this.filters.fuelType) {
                query = query.eq('fuel_type', this.filters.fuelType);
            }
            
            if (this.filters.seats) {
                query = query.eq('seats', parseInt(this.filters.seats));
            }
            
            if (this.filters.isVip) {
                query = query.eq('is_vip', true);
            }
            
            const { data, error } = await query.order('is_vip', { ascending: false });
            
            if (error) throw error;
            
            // Qiymət filteri (client-side çünki range lazımdır)
            this.cars = this.filterByPrice(data || []);
            
            // Reytinq hesabla
            this.cars = this.cars.map(car => {
                const ratings = car.reviews?.map(r => r.rating) || [];
                const avgRating = ratings.length > 0 
                    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
                    : 0;
                return { ...car, avgRating: Math.round(avgRating) };
            });
            
            this.renderCars();
            
        } catch (error) {
            console.error('Maşın yükləmə xətası:', error);
            this.showError('Maşınlar yüklənmədi');
        }
    }
    
    filterByPrice(cars) {
        return cars.filter(car => {
            const price = car.daily_price;
            const minOk = !this.filters.minPrice || price >= parseFloat(this.filters.minPrice);
            const maxOk = !this.filters.maxPrice || price <= parseFloat(this.filters.maxPrice);
            return minOk && maxOk;
        });
    }
    
    renderCars() {
        const container = document.getElementById('cars-grid');
        const countEl = document.getElementById('cars-count');
        
        if (!container) return;
        
        if (countEl) {
            countEl.textContent = `${this.cars.length} maşın tapıldı`;
        }
        
        if (this.cars.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <p>😕 Axtarışınıza uyğun maşın tapılmadı</p>
                    <button onclick="carCatalog.clearFilters()" class="btn btn-outline">Filterləri təmizlə</button>
                </div>
            `;
            return;
        }
        
        let html = '<div class="cars-grid">';
        
        this.cars.forEach(car => {
            const mainImage = car.car_images?.find(img => img.is_main)?.image_url 
                || car.car_images?.[0]?.image_url 
                || 'assets/img/car-placeholder.jpg';
            
            const vipBadge = car.is_vip ? '<span class="vip-badge">⭐ VIP</span>' : '';
            const stars = '⭐'.repeat(car.avgRating || 0);
            
            html += `
                <article class="car-card" data-car-id="${car.id}">
                    <div class="car-image">
                        <img src="${mainImage}" alt="${car.brand} ${car.model}" loading="lazy">
                        ${vipBadge}
                        <button class="favorite-btn" onclick="toggleFavorite('${car.id}', event)">
                            🤍
                        </button>
                    </div>
                    
                    <div class="car-info">
                        <h3 class="car-title">${car.brand} ${car.model}</h3>
                        <p class="car-meta">${car.year} • ${car.transmission} • ${car.fuel_type}</p>
                        
                        <div class="car-features">
                            <span>👥 ${car.seats} oturacaq</span>
                            <span>🎨 ${car.color || 'Rəng qeyd edilməyib'}</span>
                        </div>
                        
                        ${car.avgRating > 0 ? `<div class="car-rating">${stars}</div>` : ''}
                        
                        <div class="car-footer">
                            <div class="car-price">
                                <span class="price-value">${car.daily_price} ₼</span>
                                <span class="price-period">/gün</span>
                            </div>
                            <a href="car-details.html?id=${car.id}" class="btn btn-primary">
                                Ətraflı
                            </a>
                        </div>
                    </div>
                </article>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Sevimliləri yoxla və işarələ
        this.checkFavorites();
    }
    
    setupEventListeners() {
        // Axtarış
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.brand = searchInput.value;
                this.loadCars();
            }, 500));
        }
        
        // Filter dəyişiklikləri
        const filterElements = [
            'filter-brand', 'filter-min-price', 'filter-max-price',
            'filter-body-type', 'filter-transmission', 'filter-fuel', 'filter-seats'
        ];
        
        filterElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.applyFilters());
            }
        });
        
        // VIP filter
        const vipCheck = document.getElementById('filter-vip');
        if (vipCheck) {
            vipCheck.addEventListener('change', () => this.applyFilters());
        }
        
        // Sıralama
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.sortCars(sortSelect.value));
        }
    }
    
    setupFilters() {
        // Uniq dəyərləri yüklə (marka, ban növü və s.)
        this.loadFilterOptions();
    }
    
    async loadFilterOptions() {
        try {
            const { data: cars } = await supabaseClient
                .from('cars')
                .select('brand, body_type, fuel_type, transmission')
                .eq('is_active', true);
            
            // Uniq markalar
            const brands = [...new Set(cars.map(c => c.brand))].sort();
            const brandSelect = document.getElementById('filter-brand');
            if (brandSelect) {
                brands.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand;
                    option.textContent = brand;
                    brandSelect.appendChild(option);
                });
            }
            
        } catch (error) {
            console.error('Filter options yükləmə xətası:', error);
        }
    }
    
    applyFilters() {
        this.filters.brand = document.getElementById('filter-brand')?.value || '';
        this.filters.minPrice = document.getElementById('filter-min-price')?.value || '';
        this.filters.maxPrice = document.getElementById('filter-max-price')?.value || '';
        this.filters.bodyType = document.getElementById('filter-body-type')?.value || '';
        this.filters.transmission = document.getElementById('filter-transmission')?.value || '';
        this.filters.fuelType = document.getElementById('filter-fuel')?.value || '';
        this.filters.seats = document.getElementById('filter-seats')?.value || '';
        this.filters.isVip = document.getElementById('filter-vip')?.checked || false;
        
        this.loadCars();
    }
    
    sortCars(sortType) {
        switch(sortType) {
            case 'price-asc':
                this.cars.sort((a, b) => a.daily_price - b.daily_price);
                break;
            case 'price-desc':
                this.cars.sort((a, b) => b.daily_price - a.daily_price);
                break;
            case 'year-desc':
                this.cars.sort((a, b) => b.year - a.year);
                break;
            case 'rating':
                this.cars.sort((a, b) => b.avgRating - a.avgRating);
                break;
        }
        this.renderCars();
    }
    
    clearFilters() {
        this.filters = {
            brand: '',
            minPrice: '',
            maxPrice: '',
            bodyType: '',
            transmission: '',
            fuelType: '',
            seats: '',
            isVip: false,
            availableOnly: false
        };
        
        // Form elementlərini təmizlə
        document.querySelectorAll('.filter-form select, .filter-form input').forEach(el => {
            if (el.type === 'checkbox') el.checked = false;
            else el.value = '';
        });
        
        this.loadCars();
    }
    
    async checkFavorites() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;
        
        const { data: favorites } = await supabaseClient
            .from('favorites')
            .select('car_id')
            .eq('user_id', session.user.id);
        
        const favoriteIds = favorites?.map(f => f.car_id) || [];
        
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const card = btn.closest('.car-card');
            const carId = card.dataset.carId;
            
            if (favoriteIds.includes(carId)) {
                btn.textContent = '❤️';
                btn.classList.add('active');
            }
        });
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    showError(message) {
        const container = document.getElementById('cars-grid');
        if (container) {
            container.innerHTML = `<div class="error-message">❌ ${message}</div>`;
        }
    }
}

// Sevimlilərə əlavə/çıxar
window.toggleFavorite = async (carId, event) => {
    if (event) event.preventDefault();
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        alert('Sevimlilərə əlavə etmək üçün daxil olun');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Əvvəlcə yoxla əlavə edilibmi
        const { data: existing } = await supabaseClient
            .from('favorites')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('car_id', carId)
            .single();
        
        if (existing) {
            // Sil
            await supabaseClient
                .from('favorites')
                .delete()
                .eq('id', existing.id);
            
            event.target.textContent = '🤍';
            event.target.classList.remove('active');
        } else {
            // Əlavə et
            await supabaseClient
                .from('favorites')
                .insert({
                    user_id: session.user.id,
                    car_id: carId
                });
            
            event.target.textContent = '❤️';
            event.target.classList.add('active');
        }
        
    } catch (error) {
        console.error('Sevimlilər xətası:', error);
    }
};

// İlkinləşdir
let carCatalog;
document.addEventListener('DOMContentLoaded', () => {
    carCatalog = new CarCatalog();
});
