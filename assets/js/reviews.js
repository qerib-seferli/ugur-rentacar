/**
 * UĞUR RENTACAR - RƏYLƏR SİSTEMİ
 * Maşınlara rəy yazma və reytinq sistemi
 */

class ReviewsManager {
    constructor() {
        this.carId = null;
        this.userCanReview = false;
        this.init();
    }
    
    async init() {
        const params = getUrlParams();
        this.carId = params.car_id;
        
        if (!this.carId) return;
        
        await this.checkCanReview();
        this.setupEventListeners();
        this.loadCarReviews();
    }
    
    // İstifadəçi bu maşını kirayə götürübmu? (yalnız o zaman rəy yaza bilər)
    async checkCanReview() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            this.userCanReview = false;
            return;
        }
        
        // Tamamlanmış rezervasiya varmı?
        const { data: reservations } = await supabaseClient
            .from('reservations')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('car_id', this.carId)
            .eq('status', 'completed');
        
        // Artıq rəy yazıbmı?
        const { data: existingReview } = await supabaseClient
            .from('reviews')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('car_id', this.carId)
            .single();
        
        this.userCanReview = reservations?.length > 0 && !existingReview;
        
        // Rəy formunu göstər/gizlə
        const reviewForm = document.getElementById('review-form-container');
        if (reviewForm) {
            reviewForm.style.display = this.userCanReview ? 'block' : 'none';
            
            if (!this.userCanReview && reservations?.length > 0) {
                reviewForm.innerHTML = '<p class="already-reviewed">✅ Bu maşın üçün artıq rəy yazmısınız</p>';
                reviewForm.style.display = 'block';
            }
        }
    }
    
    setupEventListeners() {
        const form = document.getElementById('review-form');
        if (form) {
            form.addEventListener('submit', (e) => this.submitReview(e));
        }
        
        // Ulduz reytinqi
        const stars = document.querySelectorAll('.star-input');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = star.dataset.rating;
                document.getElementById('rating-value').value = rating;
                this.updateStarDisplay(rating);
            });
            
            star.addEventListener('mouseenter', () => {
                this.updateStarDisplay(star.dataset.rating, true);
            });
        });
        
        document.querySelector('.star-rating')?.addEventListener('mouseleave', () => {
            const currentRating = document.getElementById('rating-value')?.value || 0;
            this.updateStarDisplay(currentRating);
        });
    }
    
    updateStarDisplay(rating, isHover = false) {
        const stars = document.querySelectorAll('.star-input');
        stars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            if (starRating <= rating) {
                star.textContent = '⭐';
                star.classList.add('active');
            } else {
                star.textContent = '☆';
                star.classList.remove('active');
            }
        });
    }
    
    async submitReview(e) {
        e.preventDefault();
        
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            showToast('Rəy yazmaq üçün daxil olun', 'warning');
            return;
        }
        
        const rating = document.getElementById('rating-value').value;
        const comment = document.getElementById('review-comment').value;
        
        if (!rating || rating < 1 || rating > 5) {
            showToast('Zəhmət olmasa reytinq seçin', 'error');
            return;
        }
        
        // Tamamlanmış rezervasiya tap
        const { data: reservation } = await supabaseClient
            .from('reservations')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('car_id', this.carId)
            .eq('status', 'completed')
            .order('return_date', { ascending: false })
            .limit(1)
            .single();
        
        try {
            const { error } = await supabaseClient
                .from('reviews')
                .insert({
                    user_id: session.user.id,
                    car_id: this.carId,
                    reservation_id: reservation?.id,
                    rating: parseInt(rating),
                    comment: comment,
                    is_approved: false, // Admin təsdiqi gözləyir
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            showToast('Rəyiniz göndərildi! Təsdiqdən sonra dərc olunacaq.', 'success');
            
            // Formu təmizlə və gizlə
            document.getElementById('review-form').reset();
            document.getElementById('review-form-container').style.display = 'none';
            
            // Siyahını yenilə
            this.loadCarReviews();
            
        } catch (error) {
            console.error('Rəy göndərmə xətası:', error);
            showToast('Rəy göndərilmədi: ' + error.message, 'error');
        }
    }
    
    async loadCarReviews() {
        if (!this.carId) return;
        
        try {
            const { data: reviews, error } = await supabaseClient
                .from('reviews')
                .select(`
                    *,
                    profiles (first_name, last_name, avatar_url)
                `)
                .eq('car_id', this.carId)
                .eq('is_approved', true)
                .eq('is_visible', true)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.renderReviewsList(reviews || []);
            this.updateAverageRating(reviews || []);
            
        } catch (error) {
            console.error('Rəylər yükləmə xətası:', error);
        }
    }
    
    renderReviewsList(reviews) {
        const container = document.getElementById('reviews-list');
        if (!container) return;
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="no-reviews">Hələ rəy yoxdur. İlk rəy siz yazın!</p>';
            return;
        }
        
        container.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <img src="${review.profiles?.avatar_url || 'assets/img/default-avatar.png'}" 
                             alt="" class="reviewer-avatar">
                        <div>
                            <div class="reviewer-name">
                                ${review.profiles?.first_name || ''} ${review.profiles?.last_name || ''}
                            </div>
                            <div class="review-date">${formatDate(review.created_at)}</div>
                        </div>
                    </div>
                    <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                </div>
                <p class="review-text">${review.comment || ''}</p>
            </div>
        `).join('');
    }
    
    updateAverageRating(reviews) {
        if (reviews.length === 0) return;
        
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        const avgEl = document.getElementById('average-rating-display');
        if (avgEl) {
            avgEl.innerHTML = `
                <div class="avg-rating-large">${avg.toFixed(1)}</div>
                <div class="avg-stars">${'⭐'.repeat(Math.round(avg))}</div>
                <div class="total-reviews">${reviews.length} rəy əsasında</div>
            `;
        }
    }
    
    // İstifadəçinin öz rəylərini yüklə (profil səhifəsi üçün)
    async loadUserReviews() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) return;
        
        try {
            const { data: reviews, error } = await supabaseClient
                .from('reviews')
                .select(`
                    *,
                    cars (brand, model, main_image)
                `)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.renderUserReviews(reviews || []);
            
        } catch (error) {
            console.error('İstifadəçi rəyləri yükləmə xətası:', error);
        }
    }
    
    renderUserReviews(reviews) {
        const container = document.getElementById('user-reviews-list');
        if (!container) return;
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="no-data">Hələ rəy yazmamısınız</p>';
            return;
        }
        
        const statusLabels = {
            true: '✅ Təsdiqləndi',
            false: '⏳ Gözləmədə'
        };
        
        container.innerHTML = reviews.map(review => `
            <div class="user-review-card">
                <div class="reviewed-car">
                    <img src="${review.cars?.main_image || ''}" alt="">
                    <div>
                        <h4>${review.cars?.brand} ${review.cars?.model}</h4>
                        <div class="user-rating">${'⭐'.repeat(review.rating)}</div>
                    </div>
                </div>
                <p>${review.comment || ''}</p>
                <div class="review-footer">
                    <span class="review-status">${statusLabels[review.is_approved]}</span>
                    <span class="review-date">${formatDate(review.created_at)}</span>
                </div>
            </div>
        `).join('');
    }
}

// İlkinləşdir
let reviewsManager;
document.addEventListener('DOMContentLoaded', () => {
    reviewsManager = new ReviewsManager();
});
