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

// --- EVENTOS DE AUTENTICACIÓN ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authMsg.textContent = "Error: " + error.message;
    } else {
        showApp();
    }
});

btnLogout.addEventListener('click', async () => {
    await _supabase.auth.signOut();
    localStorage.removeItem('data_app_v1'); // Limpieza de datos según Informe 2
    location.reload();
});

// --- GESTIÓN DE PESTAÑAS ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Desactivar todos
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        
        // Activar seleccionado
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.remove('hidden');
    });
});

// Arrancar
initApp();
