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

/* ARCHIVO: js/app.js - PARTE 3: Motor de Generación y Equidad */

// --- 7. MOTOR DE EQUIDAD (ASIGNACIÓN JUSTA) ---

function obtenerConductorMenosAsignado(disponibles, agendaActual) {
    if (disponibles.length === 0) return null;
    
    // Contamos cuántas veces aparece cada conductor en lo que va de agenda
    const conteo = {};
    disponibles.forEach(c => {
        const nombreCompleto = `${c.nombre} ${c.apellido}`;
        conteo[nombreCompleto] = agendaActual.filter(a => a.conductor === nombreCompleto).length;
    });

    // Ordenamos por quien tiene menos "privilegios" asignados
    disponibles.sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellido}`;
        const nombreB = `${b.nombre} ${b.apellido}`;
        return conteo[nombreA] - conteo[nombreB];
    });

    // Filtramos a los que tienen el número mínimo de asignaciones para darles prioridad
    const minAsignaciones = conteo[`${disponibles[0].nombre} ${disponibles[0].apellido}`];
    const candidatosFinales = disponibles.filter(c => 
        conteo[`${c.nombre} ${c.apellido}`] === minAsignaciones
    );

    // Si hay varios con el mismo número mínimo, elegimos uno al azar entre ellos
    return candidatosFinales[Math.floor(Math.random() * candidatosFinales.length)];
}

// --- 8. GENERACIÓN DE AGENDA MENSUAL ---

function generarNuevaAgenda() {
    const mesSelect = document.getElementById('mesAgenda');
    const mes = mesSelect.value;
    const nombreMes = mesSelect.options[mesSelect.selectedIndex].text;
    const anio = new Date().getFullYear();
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const diasSemana = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
    
    let nuevaAgenda = [];

    for (let i = 1; i <= diasEnMes; i++) {
        const fechaObj = new Date(anio, mes - 1, i);
        const diaNombre = diasSemana[fechaObj.getDay()];
        const fechaIso = fechaObj.toISOString().split('T')[0];
        const horariosDelDia = MATRIZ_HORARIOS[diaNombre] || [];
        
        let territoriosUsadosHoy = [];

        horariosDelDia.forEach(hora => {
            // Filtrar conductores disponibles para este día y hora
            const condsDisponibles = conductores.filter(c => {
                const cumpleDiaHora = c.disponibilidadDias?.includes(diaNombre) && c.disponibilidadHoras?.includes(hora);
                const noDisponible = c.fechaNoDisponible === fechaIso;
                const forzadoDisponible = c.fechaDisponible === fechaIso;
                return (cumpleDiaHora && !noDisponible) || forzadoDisponible;
            });

            // Filtrar territorios disponibles (evitando repetir el mismo nombre el mismo día)
            const terrsDisponibles = territorios.filter(t => 
                t.disponibilidadDias?.includes(diaNombre) && 
                t.disponibilidadHoras?.includes(hora) && 
                !territoriosUsadosHoy.includes(t.nombre)
            );
            
            // Aplicar Motor de Equidad
            const c = obtenerConductorMenosAsignado(condsDisponibles, nuevaAgenda);
            
            // Selección aleatoria de territorio entre los disponibles
            const t = terrsDisponibles.length > 0 ? terrsDisponibles[Math.floor(Math.random() * terrsDisponibles.length)] : null;

            if (t) territoriosUsadosHoy.push(t.nombre);

            nuevaAgenda.push({
                diaSemana: diaNombre, 
                diaMes: i, 
                hora: hora,
                conductor: c ? `${c.nombre} ${c.apellido}` : "Sin Asignar",
                territorio: t ? `${t.numero}. ${t.nombre}${t.subNombre ? ' ('+t.subNombre+')' : ''}` : "Sin Territorio",
                lugar: t ? t.lugar : (hora === "06:30 PM" ? "Vía Telegram" : "Por Definir"),
                grupos: (hora === "06:30 PM") ? "Telegram" : "Todos",
                avisado: false
            });
        });
    }

    // Guardar en el estado global
    agendasMaestras[mes] = nuevaAgenda;
    guardarLocal();
    
    // Renderizado (se definirá en ui.js)
    if (typeof renderAgenda === 'function') {
        renderAgenda(nuevaAgenda, nombreMes);
        document.getElementById('resultadoAgenda').classList.remove('hidden');
    }
}



/* ARCHIVO: js/app.js - PARTE 4: Historial, WhatsApp y Utilidades */

// --- 9. GESTIÓN DE HISTORIAL ---

function guardarEnHistorial() {
    const mes = document.getElementById('mesAgenda').value;
    if (!agendasMaestras[mes]) {
        alert("Primero debes generar una agenda para este mes.");
        return;
    }
    // Clonamos el objeto para que no se altere si seguimos editando la agenda activa
    historialAgendas[mes] = JSON.parse(JSON.stringify(agendasMaestras[mes]));
    guardarLocal();
    if (typeof renderHistorial === 'function') renderHistorial();
    alert("Copia de seguridad guardada en el historial local.");
}

function borrarDeHistorial(m) {
    if (confirm("¿Estás seguro de borrar el historial de este mes?")) {
        delete historialAgendas[m];
        guardarLocal();
        renderHistorial();
    }
}

// --- 10. LÓGICA DE WHATSAPP ---

function marcarComoAvisado(idx) {
    const mes = document.getElementById('mesAgenda').value;
    if (agendasMaestras[mes] && agendasMaestras[mes][idx]) {
        // Marcamos el registro como avisado
        agendasMaestras[mes][idx].avisado = true;
        
        // Guardamos el cambio de estado
        guardarLocal();
        
        // Refrescamos los contactos para mostrar el check verde (Función en ui.js)
        if (typeof renderContactos === 'function') {
            renderContactos();
        }
        
        // Opcional: Sincronizar con la nube automáticamente al avisar
        // guardarSincronizar(); 
    }
}

// --- 11. UTILIDADES AUXILIARES ---

function actualizarCelda(idx, campo, valor) { 
    const mes = document.getElementById('mesAgenda').value; 
    if (agendasMaestras[mes] && agendasMaestras[mes][idx]) { 
        agendasMaestras[mes][idx][campo] = valor.trim(); 
        guardarLocal(); 
        // Si editamos el conductor, refrescamos la lista de WhatsApp
        if (campo === 'conductor' && typeof renderContactos === 'function') {
            renderContactos();
        }
    } 
}

function cargarAgendaDelMes() { 
    const mesSelect = document.getElementById('mesAgenda');
    const mes = mesSelect.value; 
    const nombreMes = mesSelect.options[mesSelect.selectedIndex].text; 
    
    if (agendasMaestras[mes]) { 
        if (typeof renderAgenda === 'function') {
            renderAgenda(agendasMaestras[mes], nombreMes);
            document.getElementById('resultadoAgenda').classList.remove('hidden');
        }
    } else {
        document.getElementById('resultadoAgenda').classList.add('hidden'); 
    }
    
    if (typeof renderContactos === 'function') renderContactos(); 
}

// Función para obtener el año actual dinámicamente
function obtenerAnioTrabajo() {
    return new Date().getFullYear();
}

