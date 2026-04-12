/**
 * UĞUR RENTACAR - PROFIL MƏNTİQİ
 * İstifadəçi profilinin idarə edilməsi
 */

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.profileData = null;
        this.init();
    }
    
    async init() {
        // Auth yoxla
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            // Login olmayıbsa, login səhifəsinə yönləndir
            window.location.href = 'login.html';
            return;
        }
        
        this.currentUser = session.user;
        
        // Profil məlumatlarını yüklə
        await this.loadProfile();
        
        // Event listener-ləri qoş
        this.attachEventListeners();
        
        // Çıxış düyməsi
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    // Profil məlumatlarını yüklə
    async loadProfile() {
        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();
            
            if (error) throw error;
            
            this.profileData = data;
            this.populateForm(data);
            
        } catch (error) {
            console.error('Profil yükləmə xətası:', error);
            this.showMessage('Profil məlumatları yüklənmədi', 'error');
        }
    }
    
    // Formu məlumatlarla doldur
    populateForm(data) {
        const fields = [
            'first_name', 'last_name', 'email', 'address', 
            'city', 'bio', 'phone'
        ];
        
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input && data[field]) {
                input.value = data[field];
            }
        });
        
        // Telefon readonly olsun (auth ilə bağlı)
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.readOnly = true;
            phoneInput.classList.add('readonly');
        }
        
        // Profil şəkli
        if (data.avatar_url) {
            this.displayAvatar(data.avatar_url);
        }
        
        // Qeydiyyat tarixi
        const regDateEl = document.getElementById('registration-date');
        if (regDateEl && data.created_at) {
            const date = new Date(data.created_at);
            regDateEl.textContent = date.toLocaleDateString('az-AZ');
        }
    }
    
    // Profil şəklini göstər
    displayAvatar(url) {
        const avatarImg = document.getElementById('avatar-preview');
        const avatarPlaceholder = document.getElementById('avatar-placeholder');
        
        if (avatarImg) {
            avatarImg.src = url;
            avatarImg.style.display = 'block';
            if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
        }
    }
    
    // Event listener-lər
    attachEventListeners() {
        // Profil yeniləmə formu
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }
        
        // Şəkil yükləmə
        const avatarInput = document.getElementById('avatar-input');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }
        
        // Sənəd yükləmə
        const idCardInput = document.getElementById('id-card-input');
        if (idCardInput) {
            idCardInput.addEventListener('change', (e) => this.handleDocumentUpload(e, 'id_card'));
        }
        
        const licenseInput = document.getElementById('license-input');
        if (licenseInput) {
            licenseInput.addEventListener('change', (e) => this.handleDocumentUpload(e, 'driver_license'));
        }
    }
    
    // Profili yenilə
    async updateProfile() {
        const formData = {
            first_name: document.getElementById('first_name')?.value?.trim(),
            last_name: document.getElementById('last_name')?.value?.trim(),
            email: document.getElementById('email')?.value?.trim(),
            address: document.getElementById('address')?.value?.trim(),
            city: document.getElementById('city')?.value?.trim(),
            bio: document.getElementById('bio')?.value?.trim(),
            updated_at: new Date().toISOString()
        };
        
        // Validasiya
        if (!formData.first_name || !formData.last_name) {
            this.showMessage('Ad və soyad mütləqdir', 'error');
            return;
        }
        
        // Email validasiyası
        if (formData.email && !this.isValidEmail(formData.email)) {
            this.showMessage('Düzgün email daxil edin', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const { error } = await supabaseClient
                .from('profiles')
                .update(formData)
                .eq('id', this.currentUser.id);
            
            if (error) throw error;
            
            this.showMessage('Profil uğurla yeniləndi', 'success');
            
        } catch (error) {
            console.error('Profil yeniləmə xətası:', error);
            this.showMessage('Yeniləmə zamanı xəta baş verdi', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Profil şəkli yüklə
    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        // Validasiya
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 2 * 1024 * 1024; // 2MB
        
        if (!allowedTypes.includes(file.type)) {
            this.showMessage('Yalnız JPG, PNG və ya WebP formatı qəbul edilir', 'error');
            return;
        }
        
        if (file.size > maxSize) {
            this.showMessage('Şəkil həcmi 2MB-dan böyük ola bilməz', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Fayl adını unikal et
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;
            
            // Storage-a yüklə
            const { error: uploadError } = await supabaseClient
                .storage
                .from('profile-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (uploadError) throw uploadError;
            
            // Public URL al
            const { data: { publicUrl } } = supabaseClient
                .storage
                .from('profile-images')
                .getPublicUrl(filePath);
            
            // Profili yenilə
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', this.currentUser.id);
            
            if (updateError) throw updateError;
            
            this.displayAvatar(publicUrl);
            this.showMessage('Profil şəkli yeniləndi', 'success');
            
        } catch (error) {
            console.error('Şəkil yükləmə xətası:', error);
            this.showMessage('Şəkil yüklənmədi', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Sənəd yüklə (şəxsiyyət vəsiqəsi, sürücülük vəsiqəsi)
    async handleDocumentUpload(event, docType) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        // Validasiya
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!allowedTypes.includes(file.type)) {
            this.showMessage('Yalnız JPG, PNG və ya PDF formatı qəbul edilir', 'error');
            return;
        }
        
        if (file.size > maxSize) {
            this.showMessage('Sənəd həcmi 5MB-dan böyük ola bilməz', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}-${docType}-${Date.now()}.${fileExt}`;
            const filePath = `documents/${fileName}`;
            
            // Storage-a yüklə
            const { error: uploadError } = await supabaseClient
                .storage
                .from('user-documents')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (uploadError) throw uploadError;
            
            // Database-ə qeyd et
            const { error: dbError } = await supabaseClient
                .from('user_documents')
                .upsert({
                    user_id: this.currentUser.id,
                    document_type: docType,
                    document_url: filePath,
                    status: 'pending',
                    uploaded_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,document_type'
                });
            
            if (dbError) throw dbError;
            
            const docName = docType === 'id_card' ? 'Şəxsiyyət vəsiqəsi' : 'Sürücülük vəsiqəsi';
            this.showMessage(`${docName} uğurla yükləndi`, 'success');
            
            // Sənəd statusunu yenilə
            this.updateDocumentStatus(docType, 'pending');
            
        } catch (error) {
            console.error('Sənəd yükləmə xətası:', error);
            this.showMessage('Sənəd yüklənmədi', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Sənəd statusunu yenilə (UI)
    updateDocumentStatus(docType, status) {
        const statusEl = document.getElementById(`${docType}-status`);
        if (statusEl) {
            const statusText = {
                'pending': '⏳ Gözləmədə',
                'approved': '✅ Təsdiqləndi',
                'rejected': '❌ Rədd edildi'
            };
            statusEl.textContent = statusText[status] || status;
            statusEl.className = `doc-status ${status}`;
        }
    }
    
    // Çıxış et
    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Çıxış xətası:', error);
            this.showMessage('Çıxış zamanı xəta baş verdi', 'error');
        }
    }
    
    // Yardımçı funksiyalar
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    showMessage(text, type) {
        const messageEl = document.getElementById('profile-message');
        if (messageEl) {
            messageEl.textContent = text;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }
    
    showLoading(show) {
        const loadingEl = document.getElementById('profile-loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'flex' : 'none';
        }
    }
}

// Profil tamamlama səhifəsi üçün xüsusi sinif
class ProfileCompleteManager extends ProfileManager {
    async init() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        
        this.currentUser = session.user;
        
        // Profil yoxla - əgər tamamlanıbsa profil səhifəsinə yönləndir
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', this.currentUser.id)
            .single();
        
        if (profile?.first_name && profile?.last_name) {
            window.location.href = 'profile.html';
            return;
        }
        
        await this.loadProfile();
        this.attachEventListeners();
    }
}

// Səhifəyə görə uyğun sinifi işə sal
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('profile-complete-page')) {
        new ProfileCompleteManager();
    } else {
        new ProfileManager();
    }
});
