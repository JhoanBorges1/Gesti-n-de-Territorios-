/* ARCHIVO: js/app.js - PARTE 1: Gestión de Datos y Nube */

// --- 1. ESTADO GLOBAL ---
// Estas variables mantienen la información viva mientras usas la app
let conductores = []
let territorios = []
let grupos = []
let agendasMaestras = {}
let historialAgendas = {}

// Matriz de horarios fija para Vista Al Mar
const MATRIZ_HORARIOS = { 
    'LUN': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'MAR': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'MIÉ': ['07:00 AM', '09:00 AM'], 
    'JUE': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'VIE': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'SÁB': ['07:00 AM', '09:00 AM'], 
    'DOM': ['11:00 AM'] 
}

// --- 2. INICIALIZACIÓN ---
// Esta función se dispara desde auth.js cuando el login es exitoso
async function initApp() {
    console.log("Iniciando componentes...")
    
    // Carga rápida desde LocalStorage para que el usuario no vea la pantalla vacía
    const local = JSON.parse(localStorage.getItem('vdm_data') || '{}')
    conductores = local.conductores || []
    territorios = local.territorios || []
    grupos = local.grupos || []
    agendasMaestras = local.registros || {}
    historialAgendas = local.historial || {}

    // Sincronización profunda con Supabase
    try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (session) {
            const { data, error } = await supabaseClient
                .from('registros_tablas')
                .select('datos')
                .eq('user_id', session.user.id)
                .maybeSingle()

            if (data && data.datos) {
                const d = data.datos
                // Fusionamos o reemplazamos según prefieras (aquí reemplazamos por la verdad de la nube)
                conductores = d.conductores || conductores
                territorios = d.territorios || territorios
                grupos = d.grupos || grupos
                agendasMaestras = d.registros || agendasMaestras
                historialAgendas = d.historial || historialAgendas
            }
        }
    } catch (e) { 
        console.warn("Modo Offline: No se pudo conectar con la nube.") 
    }
    
    // Disparamos el renderizado inicial de la UI (Funciones que irán en ui.js)
    if (typeof renderAll === 'function') {
        renderAll()
    } else {
        // Si aún no tienes ui.js, al menos cargamos la agenda del mes actual
        cargarAgendaDelMes()
    }
}

// --- 3. PERSISTENCIA ---

function guardarLocal() { 
    const payload = { 
        conductores, 
        territorios, 
        grupos, 
        registros: agendasMaestras, 
        historial: historialAgendas 
    }
    localStorage.setItem('vdm_data', JSON.stringify(payload)) 
}

async function guardarSincronizar() {
    const btn = document.getElementById('btn-sync-save')
    if (btn) btn.innerText = "⏳ Sincronizando..."
    
    guardarLocal() // Siempre guardamos local primero

    try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (!session) throw new Error("Sin sesión activa")

        const payload = { 
            registros: agendasMaestras, 
            conductores, 
            territorios, 
            grupos, 
            historial: historialAgendas 
        }

        const { error } = await supabaseClient
            .from('registros_tablas')
            .upsert([{ user_id: session.user.id, datos: payload }])

        if (error) throw error
        if (btn) btn.innerText = "✅ ¡En la Nube!"

    } catch (e) { 
        console.error(e)
        if (btn) btn.innerText = "❌ Error" 
    }
    
    setTimeout(() => { if (btn) btn.innerText = "Sincronizar Nube" }, 3000)
}

/* ARCHIVO: js/app.js - PARTE 2: Lógica de Conductores y Territorios */

// --- 4. GESTIÓN DE CONDUCTORES ---

function agregarOEditarConductor(datos) {
    // Validación de seguridad
    if (!datos.nombre || datos.nombre.trim().length < 2) {
        alert("El nombre es obligatorio.")
        return false
    }

    const index = document.getElementById('editIndexConductor').value
    
    if (index === "") {
        conductores.push(datos)
    } else {
        conductores[index] = datos
    }

    guardarLocal()
    // Estas funciones las crearemos en ui.js para refrescar la pantalla
    if (typeof renderListaConductores === 'function') renderListaConductores()
    if (typeof actualizarDatalists === 'function') actualizarDatalists()
    if (typeof actualizarSelectAncianos === 'function') actualizarSelectAncianos()
    
    return true
}

function eliminarConductor(i) {
    if (confirm("¿Estás seguro de eliminar a este conductor? Esto no se puede deshacer.")) {
        conductores.splice(i, 1)
        guardarLocal()
        renderListaConductores()
        actualizarDatalists()
    }
}

// --- 5. GESTIÓN DE TERRITORIOS ---

function agregarOEditarTerritorio(datos) {
    const index = document.getElementById('editIndexTerritorio').value
    
    // Aseguramos que el número de territorio sea un entero
    datos.numero = parseInt(datos.numero) || 0

    if (index === "") {
        territorios.push(datos)
    } else {
        territorios[index] = datos
    }

    // Ordenar territorios por número automáticamente
    territorios.sort((a, b) => a.numero - b.numero)

    guardarLocal()
    if (typeof renderListaTerritorios === 'function') renderListaTerritorios()
    if (typeof actualizarDatalists === 'function') actualizarDatalists()
    
    return true
}

function eliminarTerritorio(i) {
    if (confirm("¿Eliminar este territorio de la lista?")) {
        territorios.splice(i, 1)
        guardarLocal()
        renderListaTerritorios()
        actualizarDatalists()
    }
}

// --- 6. GESTIÓN DE GRUPOS ---

function guardarGrupo(g) {
    const index = document.getElementById('editIndexGrupo').value
    
    if (index === "") {
        grupos.push(g)
    } else {
        grupos[index] = g
    }

    grupos.sort((a, b) => parseInt(a.numero) - parseInt(b.numero))
    
    guardarLocal()
    if (typeof renderListaGrupos === 'function') renderListaGrupos()
}

function eliminarGrupo(i) {
    if (confirm("¿Borrar este grupo?")) {
        grupos.splice(i, 1)
        guardarLocal()
        renderListaGrupos()
    }
}
