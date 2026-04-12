/**
 * UĞUR RENTACAR - YARDIMÇI FUNKSİYALAR
 */

// Tarix formatlaşdırma
function formatDate(dateString, options = {}) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    return date.toLocaleDateString('az-AZ', { ...defaultOptions, ...options });
}

// Pul formatlaşdırma
function formatMoney(amount, currency = 'AZN') {
    return new Intl.NumberFormat('az-AZ', {
        style: 'currency',
        currency: currency
    }).format(amount || 0);
}

// Telefon nömrəsi formatlaşdırma
function formatPhone(phone) {
    // +994519500002 -> +994 51 950 00 02
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('994')) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
    }
    return phone;
}

// Debounce funksiyası
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Local storage ilə təhlükəsiz iş
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },
    
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage error:', e);
        }
    }
};

// Form validasiyası
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    // Azərbaycan nömrəsi: +994XXXXXXXXX
    return /^\+994\d{9}$/.test(phone.replace(/\s/g, ''));
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}

// URL parametrlərini oxu
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// Toast bildirişləri
function showToast(message, type = 'info', duration = 3000) {
    // Əgər toast container yoxdursa yarat
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    // Toast elementi yarat
    const toast = document.createElement('div');
    toast.style.cssText = `
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    // Rənglər
    const colors = {
        success: '#34a853',
        error: '#ea4335',
        warning: '#fbbc04',
        info: '#4285f4'
    };
    
    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    
    // Animasyon üçün CSS əlavə et (əgər yoxdursa)
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    container.appendChild(toast);
    
    // Sil
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Export
window.formatDate = formatDate;
window.formatMoney = formatMoney;
window.formatPhone = formatPhone;
window.debounce = debounce;
window.storage = storage;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validateRequired = validateRequired;
window.getUrlParams = getUrlParams;
window.showToast = showToast;
