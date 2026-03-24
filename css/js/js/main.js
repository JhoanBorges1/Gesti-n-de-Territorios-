// --- CONFIGURACIÓN DIRECTA ---
const SUPABASE_URL = 'https://gbuqjbuwpdovuxzuysml.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3MQOwq5YleBWlTapPiEWaw_okOxDHLv';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authContainer = document.getElementById('auth-container');
const appContent = document.getElementById('app-content');
const loginForm = document.getElementById('login-form');
const authMsg = document.getElementById('auth-msg');

// --- LÓGICA DE LOGIN ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    authMsg.innerText = "⏳ Verificando...";
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
        authMsg.innerText = "Acceso denegado. Revisa tus datos.";
        authMsg.style.color = "var(--google-red)";
    }
});

// --- ESCUCHADOR DE SESIÓN ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        authContainer.classList.add('hidden');
        appContent.classList.remove('hidden');
        console.log("¡Sesión activa!");
        cargarLocal(); // Cargamos lo que haya en el teléfono
    } else {
        authContainer.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
});

// --- LOGOUT ---
document.getElementById('btn-logout').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.reload();
});
