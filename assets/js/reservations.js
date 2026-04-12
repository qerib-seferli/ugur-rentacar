/**
 * UĞUR RENTACAR - REZERVASIYA SİSTEMİ
 */

class ReservationSystem {
    constructor() {
        this.init();
    }
    
    async init() {
        // Auth yoxla
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        
        this.setupEventListeners();
        this.loadUserReservations();
    }
    
    setupEventListeners() {
        // Rezervasiya formu
        const form = document.getElementById('reservation-form');
        if (form) {
            form.addEventListener('submit', (e) => this.createReservation(e));
        }
        
        // Tarix dəyişəndə qiymət hesabla
        const pickupDate = document.getElementById('pickup-date');
        const returnDate = document.getElementById('return-date');
        
        if (pickupDate && returnDate) {
            pickupDate.addEventListener('change', () => this.calculatePrice());
            returnDate.addEventListener('change', () => this.calculatePrice());
        }
    }
    
    async createReservation(e) {
        e.preventDefault();
        
        const carId = new URLSearchParams(window.location.search).get('car_id');
        if (!carId) {
            alert('Maşın seçilməyib');
            return;
        }
        
        const formData = {
            car_id: carId,
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            phone: document.getElementById('phone').value,
            whatsapp: document.getElementById('whatsapp').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            id_card_number: document.getElementById('id_card').value,
            fin_code: document.getElementById('fin_code').value,
            pickup_date: document.getElementById('pickup-date').value,
            return_date: document.getElementById('return-date').value,
            pickup_time: document.getElementById('pickup-time').value,
            notes: document.getElementById('notes').value
        };
        
        // Validasiya
        if (!formData.first_name || !formData.last_name || !formData.phone) {
            alert('Ad, soyad və telefon mütləqdir');
            return;
        }
        
        if (!formData.pickup_date || !formData.return_date) {
            alert('Tarixləri seçin');
            return;
        }
        
        // Tarixləri yoxla
        if (new Date(formData.pickup_date) > new Date(formData.return_date)) {
            alert('Qaytarma tarixi götürmə tarixindən əvvəl ola bilməz');
            return;
        }
        
        try {
            // 1. Tarix toqquşmasını yoxla (backend funksiyası ilə)
            const { data: isAvailable, error: availError } = await supabaseClient
                .rpc('check_car_availability', {
                    p_car_id: carId,
                    p_pickup_date: formData.pickup_date,
                    p_return_date: formData.return_date
                });
            
            if (availError || !isAvailable) {
                alert('Seçilmiş tarixlərdə maşın mövcud deyil');
                return;
            }
            
            // 2. Qiymət hesabla
            const { data: totalPrice, error: priceError } = await supabaseClient
                .rpc('calculate_rental_price', {
                    p_car_id: carId,
                    p_pickup_date: formData.pickup_date,
                    p_return_date: formData.return_date
                });
            
            if (priceError) throw priceError;
            
            // 3. Rezervasiya yarat
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            const { data: reservation, error } = await supabaseClient
                .from('reservations')
                .insert({
                    user_id: user.id,
                    ...formData,
                    total_price: totalPrice,
                    status: 'awaiting_receipt'
                })
                .select()
                .single();
            
            if (error) throw error;
            
            // Uğurlu - ödəniş səhifəsinə yönləndir
            window.location.href = `payment.html?reservation_id=${reservation.id}`;
            
        } catch (error) {
            console.error('Rezervasiya xətası:', error);
            alert('Rezervasiya yaradılmadı: ' + error.message);
        }
    }
    
    async loadUserReservations() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            const { data: reservations, error } = await supabaseClient
                .from('reservations')
                .select(`
                    *,
                    cars (brand, model, main_image)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.renderReservations(reservations);
            
        } catch (error) {
            console.error('Rezervasiya yükləmə xətası:', error);
        }
    }
    
    renderReservations(reservations) {
        const container = document.getElementById('reservations-list');
        if (!container) return;
        
        if (!reservations || reservations.length === 0) {
            container.innerHTML = '<p class="no-data">Hələ rezervasiyanız yoxdur</p>';
            return;
        }
        
        const statusLabels = {
            'new': 'Yeni',
            'awaiting_receipt': 'Çek gözlənilir',
            'receipt_uploaded': 'Çek yükləndi',
            'under_review': 'Yoxlanılır',
            'approved': 'Təsdiqləndi',
            'rejected': 'Rədd edildi',
            'active_rental': 'Aktiv kirayə',
            'completed': 'Tamamlandı'
        };
        
        let html = '<div class="reservations-list">';
        
        reservations.forEach(res => {
            html += `
                <div class="reservation-card">
                    <div class="reservation-car">
                        <img src="${res.cars?.main_image || 'assets/img/car-placeholder.jpg'}" alt="">
                        <div>
                            <h4>${res.cars?.brand} ${res.cars?.model}</h4>
                            <p>${formatDate(res.pickup_date)} - ${formatDate(res.return_date)}</p>
                        </div>
                    </div>
                    <div class="reservation-info">
                        <span class="status-badge status-${res.status}">${statusLabels[res.status]}</span>
                        <p class="reservation-price">${formatMoney(res.total_price)}</p>
                    </div>
                    <div class="reservation-actions">
                        <a href="reservation-details.html?id=${res.id}" class="btn btn-outline btn-sm">Detallar</a>
                        ${res.status === 'awaiting_receipt' ? `
                            <a href="payment.html?reservation_id=${res.id}" class="btn btn-primary btn-sm">Ödəniş et</a>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    async calculatePrice() {
        const carId = new URLSearchParams(window.location.search).get('car_id');
        const pickupDate = document.getElementById('pickup-date')?.value;
        const returnDate = document.getElementById('return-date')?.value;
        
        if (!carId || !pickupDate || !returnDate) return;
        
        try {
            const { data: price, error } = await supabaseClient
                .rpc('calculate_rental_price', {
                    p_car_id: carId,
                    p_pickup_date: pickupDate,
                    p_return_date: returnDate
                });
            
            if (error) throw error;
            
            const priceEl = document.getElementById('calculated-price');
            if (priceEl) {
                priceEl.textContent = formatMoney(price);
            }
            
        } catch (error) {
            console.error('Qiymət hesablama xətası:', error);
        }
    }
}

// İlkinləşdir
document.addEventListener('DOMContentLoaded', () => {
    new ReservationSystem();
});
