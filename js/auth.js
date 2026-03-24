/* ARCHIVO: js/auth.js - GESTIÓN DE ACCESO Y SESIÓN */

// 1. Configuración de Supabase (Vista Al Mar)
const SUPABASE_URL = 'https://gbuqjbuwpdovuxzuysml.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3MQOwq5YleBWlTapPiEWaw_okOxDHLv';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Vigilante de Sesión
// Detecta si hay un usuario logueado para mostrar la app o el login
supabaseClient.auth.onAuthStateChange((event, session) => {
    const authContainer = document.getElementById('auth-container');
    const appContent = document.getElementById('app-content');
    
    if (session) {
        // Usuario dentro: Mostramos la App
        if (authContainer) authContainer.classList.add('hidden');
        if (appContent) appContent.classList.remove('hidden');
        
        // Disparamos la carga de datos en app.js
        if (typeof initApp === 'function') {
            initApp();
        }
    } else {
        // Usuario fuera: Mostramos el Login
        if (authContainer) authContainer.classList.remove('hidden');
        if (appContent) appContent.classList.add('hidden');
    }
});

// 3. Lógica del Formulario de Inicio de Sesión
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const authMsg = document.getElementById('auth-msg');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (authMsg) {
                authMsg.innerText = "Validando credenciales...";
                authMsg.style.color = "var(--google-blue)";
            }

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            const { error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                if (authMsg) {
                    authMsg.innerText = "Error: Acceso no autorizado";
                    authMsg.style.color = "var(--google-red)";
                }
            }
        });
    }
});

// 4. Función de Salida
async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        window.location.reload();
    }
}
 
