// --- ELEMENTOS DEL DOM ---
const authContainer = document.getElementById('auth-container');
const appContent = document.getElementById('app-content');
const loginForm = document.getElementById('login-form');
const authMsg = document.getElementById('auth-msg');
const btnLogout = document.getElementById('btn-logout');

// --- MANEJADOR DE LOGIN (Lógica probada) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Usamos el cliente definido en db.js
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
        authMsg.innerText = "Acceso denegado. Revisa tus datos.";
        authMsg.style.color = "var(--google-red)";
    }
});

// --- ESCUCHADOR DE ESTADO (El que hace la magia) ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        authContainer.classList.add('hidden');
        appContent.classList.remove('hidden');
        initApp(); // Función en db.js (o la definimos aquí abajo)
    } else {
        authContainer.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
});

// --- INICIALIZACIÓN DE LA APP ---
async function initApp() {
    console.log("Cargando sistema...");
    
    // 1. Cargar datos locales primero
    cargarLocal();
    
    // 2. Intentar traer lo más nuevo de la nube
    await descargarNube();
    
    // 3. Renderizar (Esto lo haremos cuando metamos la lógica de conductores)
    actualizarDatalists();
    
    // 4. Restaurar última pestaña
    const lastTab = localStorage.getItem('vdm_active_tab') || 'tab-agenda';
    activarPestaña(lastTab);
}

// --- GESTIÓN DE PESTAÑAS ---
function activarPestaña(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('hidden', content.id !== tabId);
        content.classList.toggle('active', content.id === tabId);
    });
    
    localStorage.setItem('vdm_active_tab', tabId);
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        activarPestaña(tabId);
    });
});

// --- LOGOUT ---
btnLogout.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.reload();
});

// --- FUNCIONES DE APOYO (Vacías por ahora) ---
function actualizarDatalists() {
    console.log("Datalists listos para recibir datos");
}
