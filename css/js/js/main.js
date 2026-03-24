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
    
    console.log("Datos cargados correctamente.");
    // Aquí es donde en el próximo paso inyectaremos la lógica de los conductores
}

// --- EVENTOS DE AUTENTICACIÓN ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authMsg.textContent = "Acceso denegado: " + error.message;
    } else {
        showApp();
    }
});

btnLogout.addEventListener('click', async () => {
    await _supabase.auth.signOut();
    localStorage.removeItem('data_app_v1'); 
    location.reload();
});

// --- GESTIÓN DE PESTAÑAS ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Desactivar todos
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => {
            c.classList.remove('active');
            c.classList.add('hidden');
        });
        
        // Activar seleccionado
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
            targetTab.classList.remove('hidden');
        }
    });
});

// Arrancar el motor
initApp();
