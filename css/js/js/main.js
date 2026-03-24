// --- MANEJADOR DE EVENTOS DE LOGIN ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Usamos el cliente que definimos en db.js
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
        document.getElementById('auth-msg').innerText = "Acceso denegado. Revisa tus credenciales.";
    }
});

// --- ESCUCHADOR DE ESTADO (EL SECRETO DEL ÉXITO) ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    const auth = document.getElementById('auth-container');
    const app = document.getElementById('app-content');
    
    if (session) { 
        auth.classList.add('hidden'); 
        app.classList.remove('hidden'); 
        initApp(); // Llama a la carga de datos
    } else { 
        auth.classList.remove('hidden'); 
        app.classList.add('hidden'); 
    }
});

async function initApp() {
    console.log("Iniciando carga de datos...");
    const cargoNube = await descargarNube();
    if (!cargoNube) {
        cargarLocal();
    }
    // Aquí es donde llamaremos a las funciones de renderizado de conductores más adelante
}

document.getElementById('btn-logout').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('vdm_data_v1');
    window.location.reload();
});

// Control de pestañas sencillo
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.remove('hidden');
    });
});
