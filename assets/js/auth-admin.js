/**
 * UĞUR RENTACAR - ADMIN AUTH MƏNTİQİ
 * Email və şifrə ilə admin giriş sistemi
 */

class AdminAuth {
    constructor() {
        this.init();
    }
    
    init() {
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;
        const messageEl = document.getElementById('admin-message');
        const loadingEl = document.getElementById('admin-loading');
        
        // Validasiya
        if (!email || !password) {
            this.showMessage('Email və şifrə mütləqdir', 'error');
            return;
        }
        
        // Loading göstər
        if (loadingEl) loadingEl.style.display = 'flex';
        
        try {
            // 1. Auth ilə login
            const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (authError) throw authError;
            
            // 2. Admin yoxlanışı - BU ÇOX VACİBDİR!
            const { data: adminData, error: adminError } = await supabaseClient
                .from('admins')
                .select('*')
                .eq('id', authData.user.id)
                .single();
            
            if (adminError || !adminData) {
                // Admin deyil - çıxış et
                await supabaseClient.auth.signOut();
                throw new Error('Bu hesab admin hüquqlarına malik deyil');
            }
            
            // Admin rolunu localStorage-da saxla (UI üçün)
            localStorage.setItem('userRole', 'admin');
            
            // Uğurlu giriş
            this.showMessage('Giriş uğurlu oldu! Yönləndirilir...', 'success');
            
            // Admin panelə yönləndir
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
            
        } catch (error) {
            console.error('Admin giriş xətası:', error);
            this.showMessage(error.message || 'Giriş uğursuz oldu', 'error');
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }
    
    showMessage(text, type) {
        const messageEl = document.getElementById('admin-message');
        if (messageEl) {
            messageEl.textContent = text;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }
}

// Admin səhifə qorunması - HƏR ADMIN SƏHİFƏSİNDƏ OLMALIDIR
class AdminGuard {
    constructor() {
        this.checkAdmin();
    }
    
    async checkAdmin() {
        try {
            // 1. Session yoxla
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (!session) {
                // Login olmayıbsa, admin login səhifəsinə yönləndir
                window.location.href = 'admin-login.html';
                return false;
            }
            
            // 2. Admin rolunu yoxla (database-dən)
            const { data: adminData, error } = await supabaseClient
                .from('admins')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (error || !adminData) {
                // Admin deyil
                await supabaseClient.auth.signOut();
                alert('Bu səhifəyə giriş icazəniz yoxdur');
                window.location.href = 'admin-login.html';
                return false;
            }
            
            // Admin təsdiqləndi
            window.currentAdmin = adminData;
            return true;
            
        } catch (error) {
            console.error('Admin yoxlanışı xətası:', error);
            window.location.href = 'admin-login.html';
            return false;
        }
    }
    
    // Çıxış funksiyası
    static async logout() {
        try {
            await supabaseClient.auth.signOut();
            localStorage.removeItem('userRole');
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error('Çıxış xətası:', error);
        }
    }
}

// İlkinləşdir
document.addEventListener('DOMContentLoaded', () => {
    // Əgər admin login səhifəsindirsə
    if (document.getElementById('admin-login-form')) {
        new AdminAuth();
    }
});

// Export
window.AdminGuard = AdminGuard;
window.adminLogout = AdminGuard.logout;
