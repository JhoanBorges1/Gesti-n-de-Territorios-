/* ARCHIVO: js/app.js - MOTOR LÓGICO, SINCRONIZACIÓN Y EQUIDAD VISTA AL MAR */

// --- 1. ESTADO GLOBAL Y CONFIGURACIÓN ---
let conductores = [];
let territorios = [];
let grupos = [];
let agendasMaestras = {}; // Agendas generadas en la sesión actual
let historialAgendas = {}; // Agendas guardadas oficialmente en la nube

// Matriz de horarios oficiales (Incluyendo la mejora de las 11:00 AM)
const MATRIZ_HORARIOS = { 
    'LUN': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'MAR': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'MIÉ': ['07:00 AM', '09:00 AM'], 
    'JUE': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'VIE': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'SÁB': ['07:00 AM', '09:00 AM'], 
    'DOM': ['07:00 AM', '09:00 AM', '11:00 AM'] // Aquí está la mejora solicitada
};

// --- 2. INICIALIZACIÓN Y SINCRONIZACIÓN (SISTEMA ANTIPÉRDIDA) ---

async function initApp() {
    console.log("Iniciando motor Vista Al Mar...");
    
    // 1. Cargamos lo que haya en LocalStorage para no mostrar la pantalla vacía
    const local = JSON.parse(localStorage.getItem('vdm_data') || '{}');
    conductores = local.conductores || [];
    territorios = local.territorios || [];
    grupos = local.grupos || [];
    historialAgendas = local.historial || {};

    // 2. Sincronizamos con Supabase para traer los datos más recientes
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            const { data, error } = await supabaseClient
                .from('registros_tablas')
                .select('datos')
                .eq('user_id', session.user.id)
                .maybeSingle();
            
            if (data && data.datos) {
                const d = data.datos;
                // La nube tiene la última palabra para evitar inconsistencias
                conductores = d.conductores || conductores;
                territorios = d.territorios || territorios;
                grupos = d.grupos || grupos;
                historialAgendas = d.historial || historialAgendas;
                
                // Actualizamos el local con lo de la nube
                guardarLocal();
            }
        }
    } catch (e) { 
        console.warn("Fallo de conexión. Trabajando en modo offline.", e); 
    }
    
    // 3. Renderizamos todas las listas con los datos actualizados
    renderListaConductores(); 
    renderListaTerritorios(); 
    renderListaGrupos(); 
    renderHistorial(); 
    
    // 4. Restauramos la última pestaña y sugerencias
    const lastTab = localStorage.getItem('vdm_active_tab') || 'tab-agenda';
    switchTab(lastTab);
    actualizarDatalists();
}

// --- 3. PERSISTENCIA DE DATOS ---

function guardarLocal() { 
    const payload = { 
        conductores, 
        territorios, 
        grupos, 
        historial: historialAgendas 
    };
    localStorage.setItem('vdm_data', JSON.stringify(payload)); 
}

async function guardarSincronizar() {
    const btn = document.getElementById('btn-sync-save'); 
    if (btn) btn.innerText = "⏳ Sincronizando...";
    
    guardarLocal(); // Respaldo local inmediato
    
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) throw new Error("No hay sesión activa");

        const payload = { 
            conductores, 
            territorios, 
            grupos, 
            historial: historialAgendas 
        };
        
        const { error } = await supabaseClient
            .from('registros_tablas')
            .upsert([{ 
                user_id: session.user.id, 
                datos: payload,
                updated_at: new Date()
            }]);

        if (error) throw error;
        if (btn) btn.innerText = "✅ ¡En la Nube!";
    } catch (e) { 
        console.error(e);
        if (btn) btn.innerText = "❌ Error Nube"; 
    }
    
    setTimeout(() => { 
        if (btn) btn.innerText = "Sincronizar Nube"; 
    }, 3000);
}

// --- 4. MOTOR DE GENERACIÓN INTELIGENTE (VERSIÓN VISTA AL MAR PRO) ---

function generarNuevaAgenda() {
    const mes = document.getElementById('mesAgenda').value;
    const nombreMes = document.getElementById('mesAgenda').options[document.getElementById('mesAgenda').selectedIndex].text;
    const anio = 2026; // Ciclo operativo configurado
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const diasSemana = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
    let nuevaAgenda = [];

    for (let i = 1; i <= diasEnMes; i++) {
        const fechaObj = new Date(anio, mes - 1, i);
        const diaNombre = diasSemana[fechaObj.getDay()];
        const fechaIso = fechaObj.toISOString().split('T')[0];
        
        // Obtenemos los horarios definidos en tu MATRIZ_HORARIOS
        const horariosDelDia = MATRIZ_HORARIOS[diaNombre] || [];
        let territoriosUsadosHoy = [];

        horariosDelDia.forEach(hora => {
            // 1. Filtramos conductores que pueden y quieren ese día/hora
            const condsDisponibles = conductores.filter(c => {
                const cumpleDiaHora = c.disponibilidadDias?.includes(diaNombre) && c.disponibilidadHoras?.includes(hora);
                const noDisponible = c.fechaNoDisponible === fechaIso;
                const forzadoDisponible = c.fechaDisponible === fechaIso;
                return (cumpleDiaHora && !noDisponible) || forzadoDisponible;
            });

            // 2. Filtramos territorios aptos para este momento
            const terrsDisponibles = territorios.filter(t => 
                (t.disponibilidadDias?.includes(diaNombre) && t.disponibilidadHoras?.includes(hora)) ||
                (t.subDias?.includes(diaNombre) && t.subHoras?.includes(hora))
            ).filter(t => !territoriosUsadosHoy.includes(t.nombre));
            
            // 3. Aplicamos Motor de Equidad para elegir al conductor
            const c = obtenerConductorMenosAsignado(condsDisponibles, nuevaAgenda);
            const t = terrsDisponibles.length > 0 ? terrsDisponibles[Math.floor(Math.random() * terrsDisponibles.length)] : null;

            if (t) territoriosUsadosHoy.push(t.nombre);

            nuevaAgenda.push({
                diaSemana: diaNombre, diaMes: i, hora: hora,
                conductor: c ? `${c.nombre} ${c.apellido}` : "Sin Asignar",
                territorio: t ? `${t.numero}. ${t.nombre}${t.subNombre ? ' ('+t.subNombre+')' : ''}` : "Sin Territorio",
                lugar: t ? t.lugar : (hora === "06:30 PM" ? "Vía Telegram" : "Por Definir"),
                grupos: (hora === "06:30 PM") ? "Telegram" : "Todos",
                avisado: false
            });
        });
    }
    
    agendasMaestras[mes] = nuevaAgenda;
    guardarLocal(); 
    renderAgenda(nuevaAgenda, nombreMes);
    document.getElementById('resultadoAgenda').classList.remove('hidden');
    
    // Feedback visual para el administrador
    console.log(`✅ Agenda de ${nombreMes} generada con éxito.`);
}


// --- 5. SISTEMA DE HISTORIAL OFICIAL ---

function guardarEnHistorial() {
    const mes = document.getElementById('mesAgenda').value;
    if (!agendasMaestras[mes]) {
        alert("Primero debes generar una agenda para poder guardarla oficialmente.");
        return;
    }
    
    // Clonamos la agenda de trabajo al historial permanente
    historialAgendas[mes] = JSON.parse(JSON.stringify(agendasMaestras[mes]));
    
    // Sincronizamos de inmediato con la nube
    guardarSincronizar();
    renderHistorial();
}

function cargarDeHistorial(m) {
    if (!historialAgendas[m]) return;
    
    // Pasamos del historial a la memoria de trabajo
    agendasMaestras[m] = JSON.parse(JSON.stringify(historialAgendas[m]));
    document.getElementById('mesAgenda').value = m;
    
    const mesSelect = document.getElementById('mesAgenda');
    const nombreMes = mesSelect.options[mesSelect.selectedIndex].text;
    
    renderAgenda(agendasMaestras[m], nombreMes);
    document.getElementById('resultadoAgenda').classList.remove('hidden');
    closeModal('modalHistorial');
}

function borrarDeHistorial(m) {
    if (confirm("¿Estás seguro de que quieres eliminar esta agenda del historial oficial? Esto no se puede deshacer.")) {
        delete historialAgendas[m];
        guardarSincronizar();
        renderHistorial();
    }
}

// --- 6. UTILIDADES DE MOTOR ---

function obtenerConductorMenosAsignado(disponibles, agendaActual) {
    if (disponibles.length === 0) return null;
    
    const conteo = {};
    disponibles.forEach(c => {
        const nom = `${c.nombre} ${c.apellido}`;
        conteo[nom] = agendaActual.filter(a => a.conductor === nom).length;
    });

    // Ordenamos para que los que tienen menos asignaciones queden arriba
    disponibles.sort((a, b) => {
        const nomA = `${a.nombre} ${a.apellido}`;
        const nomB = `${b.nombre} ${b.apellido}`;
        return conteo[nomA] - conteo[nomB];
    });

    return disponibles[0];
}

function actualizarDatalists() {
    const dlCond = document.getElementById('listaSugerenciasConductores');
    const dlTerr = document.getElementById('listaSugerenciasTerritorios');
    
    if (dlCond) {
        dlCond.innerHTML = conductores.map(c => `<option value="${c.nombre} ${c.apellido}">`).join('');
    }
    if (dlTerr) {
        dlTerr.innerHTML = territorios.map(t => `<option value="${t.numero}. ${t.nombre}">`).join('');
    }
}

function actualizarCelda(idx, campo, valor) { 
    const mes = document.getElementById('mesAgenda').value; 
    if (agendasMaestras[mes]) { 
        agendasMaestras[mes][idx][campo] = valor.trim(); 
        // No guardamos local aquí para evitar sobrecarga, se hace al oficializar
        renderContactos(); 
    } 
}

function cargarAgendaDelMes() { 
    const mes = document.getElementById('mesAgenda').value; 
    const mesSelect = document.getElementById('mesAgenda');
    const n = mesSelect.options[mesSelect.selectedIndex].text; 
    
    if (agendasMaestras[mes]) { 
        renderAgenda(agendasMaestras[mes], n); 
        document.getElementById('resultadoAgenda').classList.remove('hidden'); 
    } else {
        document.getElementById('resultadoAgenda').classList.add('hidden'); 
    }
}

function obtenerAnioTrabajo() { return 2026; }

