/**
 * UĞUR RENTACAR - ÜMUMİ TƏTBİQ MƏNTİQİ
 * Bütün səhifələrdə ortaq istifadə olunan funksiyalar
 */

class App {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupMobileMenu();
        this.setupAuthStateListener();
        this.updateNavigation();
        this.setupSmoothScroll();
        this.setupLazyLoading();
    }
    
    // Mobil menyu
    setupMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        
        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                menuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
            });
            
            // Link klikləndikdə menyu bağlansın
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    menuBtn.textContent = '☰';
                });
            });
        }
    }
    
    // Auth state dəyişikliklərini izlə
    setupAuthStateListener() {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            this.updateNavigation();
            
            // Əgər çıxış edibsə və qorunan səhifədədirsə
            if (event === 'SIGNED_OUT') {
                const protectedPages = ['profile.html', 'reservations.html', 'favorites.html', 'reservation-create.html'];
                const currentPage = window.location.pathname.split('/').pop();
                
                if (protectedPages.includes(currentPage)) {
                    window.location.href = 'login.html';
                }
            }
        });
    }
    
    // Navigasiyanı yenilə (login olub-olmamasına görə)
    async updateNavigation() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const navLinks = document.querySelector('.nav-links');
        
        if (!navLinks) return;
        
        const loginBtn = navLinks.querySelector('.btn-primary');
        
        if (session) {
            // Login olubsa - çıxış düyməsi göstər
            if (loginBtn) {
                loginBtn.textContent = 'Çıxış';
                loginBtn.href = '#';
                loginBtn.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                };
            }
        } else {
            // Login olmayıbsa - giriş düyməsi göstər
            if (loginBtn) {
                loginBtn.textContent = 'Giriş';
                loginBtn.href = 'login.html';
                loginBtn.onclick = null;
            }
        }
    }
    
    // Çıxış funksiyası
    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            
            localStorage.removeItem('userRole');
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Çıxış xətası:', error);
            showToast('Çıxış zamanı xəta baş verdi', 'error');
        }
    }
    
    // Smooth scroll
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    // Lazy loading üçün
    setupLazyLoading() {
        // Şəkillər üçün Intersection Observer
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Səhifə scroll zamanı header effekti
    setupHeaderScroll() {
        const header = document.querySelector('.main-nav');
        if (!header) return;
        
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }
}

// Dark mode dəstəyi
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        this.setupToggle();
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
    
    setupToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
                this.applyTheme(this.currentTheme);
            });
        }
    }
}

// İlkinləşdir
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.themeManager = new ThemeManager();
});
