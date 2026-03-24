/* ARCHIVO: js/auth.js */

// 1. Inicialización de Supabase
const SUPABASE_URL = 'https://gbuqjbuwpdovuxzuysml.supabase.co'
const SUPABASE_KEY = 'sb_publishable_3MQOwq5YleBWlTapPiEWaw_okOxDHLv'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// 2. Listener de Estado de Autenticación
// Este bloque es el "vigilante": detecta si el usuario entró o salió
supabaseClient.auth.onAuthStateChange((event, session) => {
    const authContainer = document.getElementById('auth-container')
    const appContent = document.getElementById('app-content')
    
    if (session) {
        // Si hay sesión, escondemos el login y mostramos la app
        authContainer.classList.add('hidden')
        appContent.classList.remove('hidden')
        
        // Ejecutamos la inicialización de los datos si la función existe
        if (typeof initApp === 'function') {
            initApp()
        }
    } else {
        // Si no hay sesión, mostramos el login
        authContainer.classList.remove('hidden')
        appContent.classList.add('hidden')
    }
})

// 3. Lógica del Formulario de Login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form')
    const authMsg = document.getElementById('auth-msg')

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault() // CRÍTICO: Evita que la página se refresque
            
            authMsg.innerText = "Verificando..."
            authMsg.style.color = "var(--google-blue)"

            const email = document.getElementById('email').value.trim()
            const password = document.getElementById('password').value

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                })

                if (error) {
                    authMsg.innerText = "Acceso denegado: " + error.message
                    authMsg.style.color = "var(--google-red)"
                } else {
                    authMsg.innerText = "¡Bienvenido, Jhoan!"
                    authMsg.style.color = "var(--google-green)"
                }
            } catch (err) {
                authMsg.innerText = "Error de conexión"
                console.error("Error en Auth:", err)
            }
        })
    }
})

// 4. Función de Salida
async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut()
    if (!error) {
        window.location.reload()
    } else {
        console.error("Error al cerrar sesión:", error)
    }
}
