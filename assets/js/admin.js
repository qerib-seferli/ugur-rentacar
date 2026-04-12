/**
 * UĞUR RENTACAR - ADMIN PANEL MƏNTİQİ
 * Admin idarəetmə panelinin funksionallığı
 */

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }
    
    async init() {
        // Admin yoxlanışı
        const isAdmin = await this.checkAdminStatus();
        if (!isAdmin) return;
        
        // Navigation
        this.setupNavigation();
        
        // İlkin məlumatları yüklə
        this.loadDashboard();
        
        // Real-time subscription-lar
        this.setupRealtimeSubscriptions();
    }
    
    async checkAdminStatus() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'admin-login.html';
            return false;
        }
        
        const { data: adminData } = await supabaseClient
            .from('admins')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        if (!adminData) {
            await supabaseClient.auth.signOut();
            window.location.href = 'admin-login.html';
            return false;
        }
        
        // Admin adını göstər
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = adminData.email;
        }
        
        return true;
    }
    
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
    }
    
    switchSection(sectionName) {
        // Aktiv nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            }
        });
        
        // Aktiv section
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Başlığı yenilə
        const titles = {
            'dashboard': 'Dashboard',
            'reservations': 'Rezervasiyalar',
            'cars': 'Maşınlar',
            'users': 'İstifadəçilər',
            'reviews': 'Rəylər',
            'documents': 'Sənədlər'
        };
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[sectionName] || sectionName;
        }
        
        this.currentSection = sectionName;
        
        // Section-a uyğun məlumatları yüklə
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'reservations':
                this.loadReservations();
                break;
            case 'cars':
                this.loadCars();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'reviews':
                this.loadReviews();
                break;
            case 'documents':
                this.loadDocuments();
                break;
        }
    }
    
    // Dashboard məlumatları
    async loadDashboard() {
        try {
            // Statistikalar
            const { count: totalRes } = await supabaseClient
                .from('reservations')
                .select('*', { count: 'exact', head: true });
            
            const { count: activeRes } = await supabaseClient
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active_rental');
            
            const { count: pendingRes } = await supabaseClient
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .in('status', ['new', 'awaiting_receipt', 'under_review']);
            
            // Gəlir hesablama
            const { data: revenueData } = await supabaseClient
                .from('reservations')
                .select('total_price')
                .eq('status', 'completed');
            
            const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;
            
            // UI yenilə
            document.getElementById('total-reservations').textContent = totalRes || 0;
            document.getElementById('active-rentals').textContent = activeRes || 0;
            document.getElementById('pending-count').textContent = pendingRes || 0;
            document.getElementById('total-revenue').textContent = this.formatMoney(totalRevenue);
            
        } catch (error) {
            console.error('Dashboard yükləmə xətası:', error);
        }
    }
    
    // Rezervasiyalar
    async loadReservations() {
        try {
            const { data: reservations, error } = await supabaseClient
                .from('reservations')
                .select(`
                    *,
                    cars (brand, model, daily_price),
                    profiles (first_name, last_name, phone)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.renderReservationsTable(reservations);
            
        } catch (error) {
            console.error('Rezervasiya yükləmə xətası:', error);
        }
    }
    
    renderReservationsTable(reservations) {
        const container = document.getElementById('reservations-table-container');
        
        if (!reservations || reservations.length === 0) {
            container.innerHTML = '<p class="no-data">Rezervasiya tapılmadı</p>';
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
            'completed': 'Tamamlandı',
            'cancelled': 'Ləğv edildi'
        };
        
        const statusClasses = {
            'new': 'status-new',
            'awaiting_receipt': 'status-waiting',
            'approved': 'status-approved',
            'active_rental': 'status-active',
            'rejected': 'status-rejected',
            'completed': 'status-completed'
        };
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Müştəri</th>
                        <th>Maşın</th>
                        <th>Tarix</th>
                        <th>Qiymət</th>
                        <th>Status</th>
                        <th>Əməliyyatlar</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        reservations.forEach(res => {
            const status = res.status;
            const statusClass = statusClasses[status] || '';
            const statusLabel = statusLabels[status] || status;
            
            html += `
                <tr>
                    <td>#${res.id.slice(0, 8)}</td>
                    <td>
                        ${res.profiles?.first_name || ''} ${res.profiles?.last_name || ''}<br>
                        <small>${res.profiles?.phone || res.phone}</small>
                    </td>
                    <td>${res.cars?.brand} ${res.cars?.model}</td>
                    <td>
                        ${this.formatDate(res.pickup_date)} -<br>
                        ${this.formatDate(res.return_date)}
                    </td>
                    <td>${this.formatMoney(res.total_price)}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        <button onclick="viewReservation('${res.id}')" class="btn btn-sm btn-outline">Bax</button>
                        ${status === 'under_review' ? `
                            <button onclick="approveReservation('${res.id}')" class="btn btn-sm btn-success">Təsdiq</button>
                            <button onclick="rejectReservation('${res.id}')" class="btn btn-sm btn-danger">Rədd</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    // Maşınlar
    async loadCars() {
        try {
            const { data: cars, error } = await supabaseClient
                .from('cars')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            this.renderCarsTable(cars);
            
        } catch (error) {
            console.error('Maşın yükləmə xətası:', error);
        }
    }
    
    renderCarsTable(cars) {
        const container = document.getElementById('cars-table-container');
        
        if (!cars || cars.length === 0) {
            container.innerHTML = '<p class="no-data">Maşın tapılmadı</p>';
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Şəkil</th>
                        <th>Maşın</th>
                        <th>İl</th>
                        <th>Qiymət/gün</th>
                        <th>Status</th>
                        <th>VIP</th>
                        <th>Əməliyyatlar</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        cars.forEach(car => {
            html += `
                <tr>
                    <td><img src="${car.main_image || 'assets/img/car-placeholder.jpg'}" alt="" class="car-thumb"></td>
                    <td>${car.brand} ${car.model}</td>
                    <td>${car.year}</td>
                    <td>${this.formatMoney(car.daily_price)}</td>
                    <td>${car.is_active ? 'Aktiv' : 'Passiv'}</td>
                    <td>${car.is_vip ? '⭐' : '-'}</td>
                    <td>
                        <button onclick="editCar('${car.id}')" class="btn btn-sm btn-outline">Redaktə</button>
                        <button onclick="toggleCarStatus('${car.id}', ${!car.is_active})" class="btn btn-sm ${car.is_active ? 'btn-warning' : 'btn-success'}">
                            ${car.is_active ? 'Deaktiv et' : 'Aktiv et'}
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    // İstifadəçilər
    async loadUsers() {
        try {
            const { data: users, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            this.renderUsersTable(users);
            
        } catch (error) {
            console.error('İstifadəçi yükləmə xətası:', error);
        }
    }
    
    renderUsersTable(users) {
        const container = document.getElementById('users-table-container');
        
        if (!users || users.length === 0) {
            container.innerHTML = '<p class="no-data">İstifadəçi tapılmadı</p>';
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Ad Soyad</th>
                        <th>Telefon</th>
                        <th>Email</th>
                        <th>Qeydiyyat tarixi</th>
                        <th>Əməliyyatlar</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        users.forEach(user => {
            html += `
                <tr>
                    <td>${user.first_name || '-'} ${user.last_name || '-'}</td>
                    <td>${user.phone}</td>
                    <td>${user.email || '-'}</td>
                    <td>${this.formatDate(user.created_at)}</td>
                    <td>
                        <button onclick="viewUser('${user.id}')" class="btn btn-sm btn-outline">Bax</button>
                        <button onclick="viewUserDocuments('${user.id}')" class="btn btn-sm btn-outline">Sənədlər</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    // Rəylər
    async loadReviews() {
        try {
            const { data: reviews, error } = await supabaseClient
                .from('reviews')
                .select(`
                    *,
                    profiles (first_name, last_name),
                    cars (brand, model)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            this.renderReviewsTable(reviews);
            
        } catch (error) {
            console.error('Rəy yükləmə xətası:', error);
        }
    }
    
    renderReviewsTable(reviews) {
        const container = document.getElementById('reviews-table-container');
        
        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<p class="no-data">Rəy tapılmadı</p>';
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Müştəri</th>
                        <th>Maşın</th>
                        <th>Reytinq</th>
                        <th>Rəy</th>
                        <th>Status</th>
                        <th>Əməliyyatlar</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        reviews.forEach(review => {
            const stars = '⭐'.repeat(review.rating);
            
            html += `
                <tr>
                    <td>${review.profiles?.first_name || ''} ${review.profiles?.last_name || ''}</td>
                    <td>${review.cars?.brand} ${review.cars?.model}</td>
                    <td>${stars}</td>
                    <td>${review.comment || '-'}</td>
                    <td>${review.is_approved ? '✅ Təsdiqləndi' : '⏳ Gözləmədə'}</td>
                    <td>
                        ${!review.is_approved ? `
                            <button onclick="approveReview('${review.id}')" class="btn btn-sm btn-success">Təsdiq</button>
                        ` : ''}
                        <button onclick="deleteReview('${review.id}')" class="btn btn-sm btn-danger">Sil</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    // Sənədlər
    async loadDocuments() {
        try {
            const { data: documents, error } = await supabaseClient
                .from('user_documents')
                .select(`
                    *,
                    profiles (first_name, last_name, phone)
                `)
                .order('uploaded_at', { ascending: false });
            
            if (error) throw error;
            this.renderDocumentsTable(documents);
            
        } catch (error) {
            console.error('Sənəd yükləmə xətası:', error);
        }
    }
    
    renderDocumentsTable(documents) {
        const container = document.getElementById('documents-table-container');
        
        if (!documents || documents.length === 0) {
            container.innerHTML = '<p class="no-data">Sənəd tapılmadı</p>';
            return;
        }
        
        const typeLabels = {
            'id_card': 'Şəxsiyyət vəsiqəsi',
            'driver_license': 'Sürücülük vəsiqəsi'
        };
        
        const statusLabels = {
            'pending': '⏳ Gözləmədə',
            'approved': '✅ Təsdiqləndi',
            'rejected': '❌ Rədd edildi'
        };
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Müştəri</th>
                        <th>Sənəd növü</th>
                        <th>Yükləmə tarixi</th>
                        <th>Status</th>
                        <th>Əməliyyatlar</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        documents.forEach(doc => {
            html += `
                <tr>
                    <td>${doc.profiles?.first_name || ''} ${doc.profiles?.last_name || ''}</td>
                    <td>${typeLabels[doc.document_type]}</td>
                    <td>${this.formatDate(doc.uploaded_at)}</td>
                    <td>${statusLabels[doc.status]}</td>
                    <td>
                        <button onclick="viewDocument('${doc.document_url}')" class="btn btn-sm btn-outline">Bax</button>
                        ${doc.status === 'pending' ? `
                            <button onclick="approveDocument('${doc.id}')" class="btn btn-sm btn-success">Təsdiq</button>
                            <button onclick="rejectDocument('${doc.id}')" class="btn btn-sm btn-danger">Rədd</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    // Real-time subscription-lar
    setupRealtimeSubscriptions() {
        // Yeni rezervasiyalar
        supabaseClient
            .channel('reservations')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'reservations' },
                (payload) => {
                    if (this.currentSection === 'reservations') {
                        this.loadReservations();
                    }
                    if (this.currentSection === 'dashboard') {
                        this.loadDashboard();
                    }
                }
            )
            .subscribe();
    }
    
    // Yardımçı funksiyalar
    formatMoney(amount) {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN'
        }).format(amount || 0);
    }
    
    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('az-AZ');
    }
}

// Global funksiyalar (HTML-dən çağırılır)
window.viewReservation = (id) => {
    console.log('View reservation:', id);
    // Modal aç və detalları göstər
};

window.approveReservation = async (id) => {
    if (!confirm('Rezervasiyanı təsdiqləmək istədiyinizə əminsiniz?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('reservations')
            .update({ status: 'approved' })
            .eq('id', id);
        
        if (error) throw error;
        
        // Yenilə
        location.reload();
        
    } catch (error) {
        alert('Xəta: ' + error.message);
    }
};

window.rejectReservation = async (id) => {
    const reason = prompt('Rədd səbəbini qeyd edin:');
    if (reason === null) return;
    
    try {
        const { error } = await supabaseClient
            .from('reservations')
            .update({ 
                status: 'rejected',
                admin_notes: reason
            })
            .eq('id', id);
        
        if (error) throw error;
        location.reload();
        
    } catch (error) {
        alert('Xəta: ' + error.message);
    }
};

window.approveReview = async (id) => {
    try {
        await supabaseClient.from('reviews').update({ is_approved: true }).eq('id', id);
        location.reload();
    } catch (error) {
        alert('Xəta: ' + error.message);
    }
};

window.deleteReview = async (id) => {
    if (!confirm('Rəyi silmək istədiyinizə əminsiniz?')) return;
    
    try {
        await supabaseClient.from('reviews').delete().eq('id', id);
        location.reload();
    } catch (error) {
        alert('Xəta: ' + error.message);
    }
};

window.viewDocument = (url) => {
    window.open(url, '_blank');
};

window.approveDocument = async (id) => {
    try {
        await supabaseClient.from('user_documents').update({ status: 'approved' }).eq('id', id);
        location.reload();
    } catch (error) {
        alert('Xəta: ' + error.message);
    }
};

window.rejectDocument = async (id) => {
    try {
        await supabaseClient.from('user_documents').update({ status: 'rejected' }).eq('id', id);
        location.reload();
    } catch (error) {
        alert('Xəta: ' + error.message);
    }
};

// İlkinləşdir
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});
