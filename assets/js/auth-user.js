/**
 * UĞUR RENTACAR - USER AUTH MƏNTİQİ (OTP ilə)
 * Telefon nömrəsi ilə bir dəfəlik şifrə (OTP) giriş sistemi
 */

class UserAuth {
    constructor() {
        this.phoneInput = document.getElementById('phone-input');
        this.otpInput = document.getElementById('otp-input');
        this.sendOtpBtn = document.getElementById('send-otp-btn');
        this.verifyOtpBtn = document.getElementById('verify-otp-btn');
        this.otpSection = document.getElementById('otp-section');
        this.messageEl = document.getElementById('auth-message');
        this.loadingEl = document.getElementById('loading');
        
        this.init();
    }
    
    init() {
        if (this.sendOtpBtn) {
            this.sendOtpBtn.addEventListener('click', () => this.sendOTP());
        }
        
        if (this.verifyOtpBtn) {
            this.verifyOtpBtn.addEventListener('click', () => this.verifyOTP());
        }
        
        // Enter düyməsi ilə göndərmə
        if (this.phoneInput) {
            this.phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendOTP();
            });
        }
        
        if (this.otpInput) {
            this.otpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.verifyOTP();
            });
        }
        
        // Əgər artıq login olubsa, profil səhifəsinə yönləndir
        this.checkExistingSession();
    }
    
    // Telefon nömrəsini formatla ( Azərbaycan formatı: +994XXXXXXXXX)
    formatPhone(phone) {
        // Boşluqları və xüsusi simvolları təmizlə
        let cleaned = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
        
        // Əgər +994 ilə başlamırsa, əlavə et
        if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('994')) {
                cleaned = '+' + cleaned;
            } else if (cleaned.startsWith('0')) {
                cleaned = '+994' + cleaned.substring(1);
            } else {
                cleaned = '+994' + cleaned;
            }
        }
        
        return cleaned;
    }
    
    // OTP göndər
    async sendOTP() {
        const phone = this.formatPhone(this.phoneInput.value);
        
        // Validasiya
        if (!phone || phone.length < 12) {
            this.showMessage('Zəhmət olmasa düzgün telefon nömrəsi daxil edin', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const { data, error } = await supabaseClient.auth.signInWithOtp({
                phone: phone,
                options: {
                    // SMS göndəriləndə göstəriləcək mətn (ixtiyari)
                    data: {
                        app_name: 'Uğur RentaCar'
                    }
                }
            });
            
            if (error) throw error;
            
            // OTP bölməsini göstər
            this.otpSection.style.display = 'block';
            this.phoneInput.disabled = true;
            this.sendOtpBtn.disabled = true;
            this.showMessage('SMS kod göndərildi. Zəhmət olmasa telefonunuzu yoxlayın.', 'success');
            
            // 60 saniyə sonra təkrar göndərmə icazəsi
            this.startResendTimer();
            
        } catch (error) {
            console.error('OTP göndərmə xətası:', error);
            this.showMessage('Kod göndərilmədi: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    // OTP təsdiqlə
    async verifyOTP() {
        const phone = this.formatPhone(this.phoneInput.value);
        const token = this.otpInput.value.trim();
        
        if (!token || token.length !== 6) {
            this.showMessage('Zəhmət olmasa 6 rəqəmli kodu daxil edin', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const { data, error } = await supabaseClient.auth.verifyOtp({
                phone: phone,
                token: token,
                type: 'sms'
            });
            
            if (error) throw error;
            
            // Uğurlu giriş
            this.showMessage('Giriş uğurlu oldu!', 'success');
            
            // İstifadəçi profili varmı yoxla
            await this.handlePostLogin(data.user);
            
        } catch (error) {
            console.error('OTP təsdiqləmə xətası:', error);
            this.showMessage('Yanlış kod və ya vaxt bitib', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Girişdən sonrakı əməliyyatlar
    async handlePostLogin(user) {
        try {
            // Profil yoxla
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (!profile) {
                // Yeni istifadəçi - profil yarat
                await supabaseClient.from('profiles').insert({
                    id: user.id,
                    phone: user.phone,
                    created_at: new Date().toISOString()
                });
                
                // Profil tamamlama səhifəsinə yönləndir
                window.location.href = 'profile-complete.html';
            } else if (!profile.first_name || !profile.last_name) {
                // Profil natamamdır - tamamlama səhifəsinə yönləndir
                window.location.href = 'profile-complete.html';
            } else {
                // Profil tamdır - ana səhifəyə və ya profilə yönləndir
                window.location.href = 'profile.html';
            }
            
        } catch (error) {
            console.error('Post-login xətası:', error);
            // Xəta olsa belə profil tamamlamaya yönləndir
            window.location.href = 'profile-complete.html';
        }
    }
    
    // Mövcud session yoxla
    async checkExistingSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            // Artıq login olubsa, profil səhifəsinə yönləndir
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', session.user.id)
                .single();
            
            if (profile && profile.first_name && profile.last_name) {
                window.location.href = 'profile.html';
            } else {
                window.location.href = 'profile-complete.html';
            }
        }
    }
    
    // Çıxış et
    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            
            localStorage.removeItem('userRole');
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Çıxış xətası:', error);
            alert('Çıxış zamanı xəta baş verdi');
        }
    }
    
    // Yardımçı funksiyalar
    showMessage(text, type) {
        if (this.messageEl) {
            this.messageEl.textContent = text;
            this.messageEl.className = `message ${type}`;
            this.messageEl.style.display = 'block';
            
            setTimeout(() => {
                this.messageEl.style.display = 'none';
            }, 5000);
        }
    }
    
    showLoading(show) {
        if (this.loadingEl) {
            this.loadingEl.style.display = show ? 'block' : 'none';
        }
        
        if (this.sendOtpBtn) this.sendOtpBtn.disabled = show;
        if (this.verifyOtpBtn) this.verifyOtpBtn.disabled = show;
    }
    
    startResendTimer() {
        let seconds = 60;
        const originalText = this.sendOtpBtn.textContent;
        
        const timer = setInterval(() => {
            seconds--;
            this.sendOtpBtn.textContent = `Təkrar göndər (${seconds}s)`;
            
            if (seconds <= 0) {
                clearInterval(timer);
                this.sendOtpBtn.textContent = originalText;
                this.sendOtpBtn.disabled = false;
                this.phoneInput.disabled = false;
            }
        }, 1000);
    }
}

// İlkinləşdir
document.addEventListener('DOMContentLoaded', () => {
    new UserAuth();
});
