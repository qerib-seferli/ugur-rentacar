/**
 * UĞUR RENTACAR - SUPABASE KONFIGURASIYA
 * Bu fayl Supabase client-ini ilkinləşdirir
 */

// ==========================================
// BURAYA ÖZ SUPABASE MƏLUMATLARINIZI YAZIN
// ==========================================
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Supabase client yaratmaq
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth state dəyişikliklərini izləmək üçün
let currentUser = null;
let currentSession = null;

// İlkin session yoxlanışı
async function initializeAuth() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentSession = session;
        currentUser = session.user;
    }
    
    // Auth dəyişikliklərini izlə
    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentSession = session;
        currentUser = session?.user || null;
        
        if (event === 'SIGNED_OUT') {
            // Çıxış edəndə local storage təmizlə
            localStorage.removeItem('userRole');
        }
    });
    
    return { session, error };
}

// İstifadəçi rolunu yoxla (admin və ya user)
async function checkUserRole(userId) {
    try {
        // Əvvəlcə admin yoxla
        const { data: adminData, error: adminError } = await supabaseClient
            .from('admins')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (adminData) {
            return { role: 'admin', data: adminData };
        }
        
        // User yoxla
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (profileData) {
            return { role: 'user', data: profileData };
        }
        
        return { role: null, data: null };
    } catch (error) {
        console.error('Rol yoxlanışı xətası:', error);
        return { role: null, data: null };
    }
}

// Export funksiyalar
window.supabaseClient = supabaseClient;
window.initializeAuth = initializeAuth;
window.checkUserRole = checkUserRole;
window.getCurrentUser = () => currentUser;
window.getCurrentSession = () => currentSession;
