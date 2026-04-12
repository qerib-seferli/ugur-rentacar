/**
 * UĞUR RENTACAR - PROFIL MƏNTİQİ
 * İstifadəçi profilinin idarə edilməsi (Yenilənmiş Versiya)
 */

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.profileData = null;
        this.init();
    }
    
    async init() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        
        this.currentUser = session.user;
        await this.loadProfile();
        this.attachEventListeners();
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
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
    
    populateForm(data) {
        const fields = ['first_name', 'last_name', 'email', 'address', 'city', 'bio', 'phone'];
        
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input && data[field]) {
                input.value = data[field];
            }
        });
        
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.readOnly = true;
            phoneInput.classList.add('readonly');
        }
        
        if (data.avatar_url) {
            this.displayAvatar(data.avatar_url);
        }
        
        const regDateEl = document.getElementById('registration-date');
        if (regDateEl && data.created_at) {
            const date = new Date(data.created_at);
            regDateEl.textContent = date.toLocaleDateString('az-AZ');
        }
    }
    
    displayAvatar(url) {
        const avatarImg = document.getElementById('avatar-preview');
        const avatarPlaceholder = document.getElementById('avatar-placeholder');
        
        if (avatarImg) {
            // Şəklin linkinin sonuna timestamp əlavə edirik ki, brauzer keşindən (cache) köhnə şəkli göstərməsin
            avatarImg.src = `${url}?t=${new Date().getTime()}`;
            avatarImg.style.display = 'block';
            if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
        }
    }
    
    attachEventListeners() {
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }
        
        const avatarInput = document.getElementById('avatar-input');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }
        
        const idCardInput = document.getElementById('id-card-input');
        if (idCardInput) {
            idCardInput.addEventListener('change', (e) => this.handleDocumentUpload(e, 'id_card'));
        }
        
        const licenseInput = document.getElementById('license-input');
        if (licenseInput) {
            licenseInput.addEventListener('change', (e) => this.handleDocumentUpload(e, 'driver_license'));
        }
    }
    
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
        
        if (!formData.first_name || !formData.last_name) {
            this.showMessage('Ad və soyad mütləqdir', 'error');
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
    
    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showMessage('Yalnız JPG, PNG və ya WebP formatı qəbul edilir', 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}-${Date.now()}.${fileExt}`;
            // Qeyd: 'avatars/' qovluğunu deyil, birbaşa fayl adını istifadə edirik (Bucket daxilində)
            const filePath = fileName;

            // 1. Şəkli Storage-a yüklə
            const { error: uploadError } = await supabaseClient
                .storage
                .from('profile-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Şəklin Public (açıq) Linkini al
            const { data: { publicUrl } } = supabaseClient
                .storage
                .from('profile-images')
                .getPublicUrl(filePath);

            // 3. Əldə olunan Public URL-i profil cədvəlinə yaz
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
    
    async handleDocumentUpload(event, docType) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.showLoading(true);
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}-${docType}-${Date.now()}.${fileExt}`;
            const filePath = fileName;

            // 1. Sənədi yüklə
            const { error: uploadError } = await supabaseClient
                .storage
                .from('user-documents')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Cədvələ qeyd et
            const { error: dbError } = await supabaseClient
                .from('user_documents')
                .upsert({
                    user_id: this.currentUser.id,
                    document_type: docType,
                    document_url: filePath, // Sənədlər private olduğu üçün yalnız yolu saxlayırıq
                    status: 'pending',
                    uploaded_at: new Date().toISOString()
                }, { onConflict: 'user_id,document_type' });

            if (dbError) throw dbError;
            
            this.showMessage('Sənəd uğurla yükləndi və yoxlamaya göndərildi', 'success');
            this.updateDocumentStatus(docType, 'pending');
            
        } catch (error) {
            console.error('Sənəd yükləmə xətası:', error);
            this.showMessage('Sənəd yüklənmədi', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
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
    
    async logout() {
        try {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            this.showMessage('Çıxış zamanı xəta baş verdi', 'error');
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    showMessage(text, type) {
        const messageEl = document.getElementById('profile-message');
        if (messageEl) {
            messageEl.textContent = text;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
            setTimeout(() => { messageEl.style.display = 'none'; }, 5000);
        }
    }
    
    showLoading(show) {
        const loadingEl = document.getElementById('profile-loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'flex' : 'none';
        }
    }
}

// Profil tamamlama səhifəsi
class ProfileCompleteManager extends ProfileManager {
    async init() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        this.currentUser = session.user;
        
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('profile-complete-page')) {
        new ProfileCompleteManager();
    } else {
        new ProfileManager();
    }
});
