/**
 * UĞUR RENTACAR - PROFIL MƏNTİQİ
 * Tam təkmilləşdirilmiş və şəkil problemi həll edilmiş versiya
 */

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.profileData = null;
        this.init();
    }
    
    async init() {
        // Supabase sessiyasını yoxla
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        
        this.currentUser = session.user;
        
        // Məlumatları yüklə
        await this.loadProfile();
        
        // Event listener-ləri qoş
        this.attachEventListeners();
        
        // Çıxış düyməsi
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
        const fields = ['first_name', 'last_name', 'email', 'address', 'city', 'bio'];
        
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input && data[field]) {
                input.value = data[field];
            }
        });
        
        // Telefon nömrəsini göstər (Auth-dan və ya profildən)
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.value = data.phone || this.currentUser.phone || '';
        }
        
        // Şəkli göstər
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
    
    displayAvatar(url) {
        const avatarImg = document.getElementById('avatar-preview');
        const avatarPlaceholder = document.getElementById('avatar-placeholder');
        
        if (avatarImg && url) {
            // Cache probleminin qarşısını almaq üçün timestamp əlavə edirik
            avatarImg.src = `${url}?t=${new Date().getTime()}`;
            avatarImg.onload = () => {
                avatarImg.style.display = 'block';
                if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
            };
            avatarImg.onerror = () => {
                avatarImg.style.display = 'none';
                if (avatarPlaceholder) avatarPlaceholder.style.display = 'flex';
            };
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
        
        // Sənəd yükləmələri
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
            console.error('Yeniləmə xətası:', error);
            this.showMessage('Xəta baş verdi', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showLoading(true);
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}/${Date.now()}.${fileExt}`;
            const filePath = fileName;

            // 1. Storage-a yüklə
            const { error: uploadError } = await supabaseClient
                .storage
                .from('profile-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Public URL-i tam al (Əsas düzəliş buradadır)
            const { data: { publicUrl } } = supabaseClient
                .storage
                .from('profile-images')
                .getPublicUrl(filePath);

            // 3. Bazada avatar_url sütununu tam URL ilə yenilə
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
            const fileName = `${this.currentUser.id}/${docType}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabaseClient
                .storage
                .from('user-documents')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabaseClient
                .from('user_documents')
                .upsert({
                    user_id: this.currentUser.id,
                    document_type: docType,
                    document_url: fileName,
                    status: 'pending',
                    uploaded_at: new Date().toISOString()
                });

            if (dbError) throw dbError;
            
            this.updateDocumentStatus(docType, 'pending');
            this.showMessage('Sənəd yükləndi', 'success');
            
        } catch (error) {
            console.error('Sənəd xətası:', error);
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
            statusEl.textContent = statusText[status] || 'Yükləndi';
            statusEl.className = `doc-status ${status}`;
        }
    }
    
    async logout() {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
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

document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});
