import { _supabase, data_app, cargarLocal, descargarNube, guardarLocal } from './db.js';

// --- ELEMENTOS DE LA INTERFAZ ---
const authContainer = document.getElementById('auth-container');
const appContent = document.getElementById('app-content');
const loginForm = document.getElementById('login-form');
const authMsg = document.getElementById('auth-msg');
const btnLogout = document.getElementById('btn-logout');

// --- INICIO DE LA APP ---
async function initApp() {
    // 1. Revisar sesión
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (session) {
        showApp();
    } else {
        showLogin();
    }
}

function showLogin() {
    authContainer.classList.remove('hidden');
    appContent.classList.add('hidden');
}

async function showApp() {
    authContainer.classList.add('hidden');
    appContent.classList.remove('hidden');
    
    // Cargar datos: Prioridad Nube, luego Local
    const cargoNube = await descargarNube();
    if (!cargoNube) {
        cargarLocal();
    }
    
    console.log("Datos cargados:", data_app);
    // Aquí llamaremos a los renderizadores de cada pestaña más adelante
}

// Eventos de Autenticación
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) {
        document.getElementById('auth-msg').innerText = "Acceso denegado.";
    } else {
        location.reload(); // Recargamos para que el listener de sesión detecte el cambio
    }
});

// Listener de Sesión (Copia exacta de tu código viejo que funciona)
_supabase.auth.onAuthStateChange((event, session) => {
    const auth = document.getElementById('auth-container');
    const app = document.getElementById('app-content');
    if (session) {
        auth.classList.add('hidden');
        app.classList.remove('hidden');
        console.log("Sesión iniciada correctamente");
    } else {
        auth.classList.remove('hidden');
        app.classList.add('hidden');
    }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    await _supabase.auth.signOut();
    location.reload();
});

// Control de Pestañas
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => {
            c.classList.remove('active');
            c.classList.add('hidden');
        });
        btn.classList.add('active');
        const target = btn.getAttribute('data-tab');
        document.getElementById(target).classList.add('active');
        document.getElementById(target).classList.remove('hidden');
    });
});
 

// Arrancar
initApp();
