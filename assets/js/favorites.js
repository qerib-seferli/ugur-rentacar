/**
 * UĞUR RENTACAR - SEVİMLİLƏR SİSTEMİ
 * İstifadəçinin sevdiyi maşınların idarə edilməsi
 */

class FavoritesManager {
    constructor() {
        this.favorites = [];
        this.init();
    }
    
    async init() {
        // Auth yoxla
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'login.html?redirect=favorites.html';
            return;
        }
        
        await this.loadFavorites();
        this.setupEventListeners();
    }
    
    async loadFavorites() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            const { data: favorites, error } = await supabaseClient
                .from('favorites')
                .select(`
                    id,
                    created_at,
                    cars (
                        id,
                        brand,
                        model,
                        year,
                        daily_price,
                        main_image,
                        is_vip,
                        is_active
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Yalnız aktiv maşınları göstər
            this.favorites = favorites?.filter(f => f.cars?.is_active) || [];
            
            this.renderFavorites();
            
        } catch (error) {
            console.error('Sevimlilər yükləmə xətası:', error);
            this.showError('Sevimlilər yüklənmədi');
        }
    }
    
    renderFavorites() {
        const container = document.getElementById('favorites-grid');
        const countEl = document.getElementById('favorites-count');
        
        if (!container) return;
        
        if (countEl) {
            countEl.textContent = `${this.favorites.length} maşın`;
        }
        
        if (this.favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🤍</div>
                    <h3>Hələ sevimli maşınınız yoxdur</h3>
                    <p>Sevdiyiniz maşınları bura əlavə edin, sonra asanlıqla rezervasiya edə bilərsiniz.</p>
                    <a href="cars.html" class="btn btn-primary btn-lg">Maşınlara bax</a>
                </div>
            `;
            return;
        }
        
        let html = '<div class="cars-grid">';
        
        this.favorites.forEach(fav => {
            const car = fav.cars;
            const vipBadge = car.is_vip ? '<span class="vip-badge">⭐ VIP</span>' : '';
            
            html += `
                <article class="car-card favorite-card" data-favorite-id="${fav.id}">
                    <div class="car-image">
                        <img src="${car.main_image || 'assets/img/car-placeholder.jpg'}" 
                             alt="${car.brand} ${car.model}" loading="lazy">
                        ${vipBadge}
                        <button class="remove-favorite-btn" onclick="favoritesManager.removeFavorite('${fav.id}')" title="Sevimlilərdən çıxar">
                            ✕
                        </button>
                    </div>
                    
                    <div class="car-info">
                        <h3 class="car-title">${car.brand} ${car.model}</h3>
                        <p class="car-meta">${car.year} • Günlük ${car.daily_price} ₼</p>
                        
                        <div class="favorite-actions">
                            <a href="car-details.html?id=${car.id}" class="btn btn-outline btn-full">
                                Ətraflı
                            </a>
                            <a href="reservation-create.html?car_id=${car.id}" class="btn btn-primary btn-full">
                                Rezervasiya et
                            </a>
                        </div>
                    </div>
                </article>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    async removeFavorite(favoriteId) {
        if (!confirm('Bu maşını sevimlilərdən çıxarmaq istədiyinizə əminsiniz?')) {
            return;
        }
        
        try {
            const { error } = await supabaseClient
                .from('favorites')
                .delete()
                .eq('id', favoriteId);
            
            if (error) throw error;
            
            // UI-dən sil
            const card = document.querySelector(`[data-favorite-id="${favoriteId}"]`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    this.loadFavorites(); // Siyahını yenilə
                }, 300);
            }
            
            showToast('Sevimlilərdən çıxarıldı', 'success');
            
        } catch (error) {
            console.error('Sevimli silmə xətası:', error);
            showToast('Əməliyyat uğursuz oldu', 'error');
        }
    }
    
    setupEventListeners() {
        // Bütün sevimliləri təmizlə
        const clearAllBtn = document.getElementById('clear-all-favorites');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllFavorites());
        }
        
        // Real-time dəyişikliklər
        supabaseClient
            .channel('favorites-changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'favorites',
                    filter: `user_id=eq.${this.getCurrentUserId()}`
                },
                () => {
                    this.loadFavorites();
                }
            )
            .subscribe();
    }
    
    async clearAllFavorites() {
        if (!confirm('Bütün sevimliləri silmək istədiyinizə əminsiniz?')) {
            return;
        }
        
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            const { error } = await supabaseClient
                .from('favorites')
                .delete()
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            this.loadFavorites();
            showToast('Bütün sevimlilər silindi', 'success');
            
        } catch (error) {
            console.error('Təmizləmə xətası:', error);
            showToast('Əməliyyat uğursuz oldu', 'error');
        }
    }
    
    async getCurrentUserId() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user?.id;
    }
    
    showError(message) {
        const container = document.getElementById('favorites-grid');
        if (container) {
            container.innerHTML = `<div class="error-message">❌ ${message}</div>`;
        }
    }
}

// İlkinləşdir
let favoritesManager;
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.favorites-page')) {
        favoritesManager = new FavoritesManager();
    }
});
