/* ARCHIVO: js/app.js - PARTE 1: MOTOR LÓGICO Y SINCRONIZACIÓN */

// --- 1. ESTADO GLOBAL ---
let conductores = [];
let territorios = [];
let grupos = [];
let agendasMaestras = {}; // Memoria de trabajo (volátil)
let historialAgendas = {}; // Memoria oficial (permanente)

const MATRIZ_HORARIOS = { 
    'LUN': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'MAR': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'MIÉ': ['07:00 AM', '09:00 AM'], 
    'JUE': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'VIE': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'SÁB': ['07:00 AM', '09:00 AM'], 
    'DOM': ['07:00 AM', '09:00 AM', '11:00 AM'] // Agregado el horario de las 11am
};

// --- 2. INICIALIZACIÓN (Sincronización Multi-dispositivo) ---
async function initApp() {
    // Carga inicial de LocalStorage (Rapidez)
    const local = JSON.parse(localStorage.getItem('vdm_data') || '{}');
    conductores = local.conductores || [];
    territorios = local.territorios || [];
    grupos = local.grupos || [];
    historialAgendas = local.historial || {};

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            const { data } = await supabaseClient
                .from('registros_tablas')
                .select('datos')
                .eq('user_id', session.user.id)
                .maybeSingle();
            
            if (data && data.datos) {
                const d = data.datos;
                // La NUBE manda: sincronizamos los dispositivos
                conductores = d.conductores || conductores;
                territorios = d.territorios || territorios;
                grupos = d.grupos || grupos;
                historialAgendas = d.historial || historialAgendas;
                guardarLocal(); // Actualizamos el local con lo nuevo
            }
        }
    } catch (e) { console.warn("Error de sincronización:", e); }
    
    // Dibujar todo
    renderListaConductores(); 
    renderListaTerritorios(); 
    renderListaGrupos(); 
    renderHistorial(); 
    
    const lastTab = localStorage.getItem('vdm_active_tab') || 'tab-agenda';
    switchTab(lastTab);
    actualizarDatalists();
}

// --- 3. PERSISTENCIA Y SINCRONIZACIÓN ---

function guardarLocal() { 
    const payload = { conductores, territorios, grupos, historial: historialAgendas };
    localStorage.setItem('vdm_data', JSON.stringify(payload)); 
}

async function guardarSincronizar() {
    const btn = document.getElementById('btn-sync-save'); 
    if (btn) btn.innerText = "⏳ Guardando...";
    guardarLocal();
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const payload = { conductores, territorios, grupos, historial: historialAgendas };
        await supabaseClient.from('registros_tablas').upsert([{ user_id: session.user.id, datos: payload }]);
        if (btn) btn.innerText = "✅ Sincronizado";
    } catch (e) { if (btn) btn.innerText = "❌ Error Nube"; }
    setTimeout(() => { if (btn) btn.innerText = "Sincronizar Nube"; }, 3000);
}

/* ARCHIVO: js/app.js - PARTE 2: MOTOR DE GENERACIÓN Y OFICIALIZACIÓN */

// --- 4. MOTOR DE GENERACIÓN INTELIGENTE (Incluye 11:00 AM y Subterritorios) ---

function generarNuevaAgenda() {
    const mesSelect = document.getElementById('mesAgenda');
    const mes = mesSelect.value;
    const nombreMes = mesSelect.options[mesSelect.selectedIndex].text;
    const anio = 2026;
    
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
            // Lógica AM/PM: 11:00 AM cuenta como bloque AM
            const esTarde = hora.includes("PM");
            const bloqueBuscado = `${diaNombre}-${esTarde ? 'PM' : 'AM'}`;

            // Filtrar conductores por bloque
            const disponibles = conductores.filter(c => {
                const cumpleBloque = (c.disponibilidadDias || []).includes(bloqueBuscado);
                const forzado = c.fechaDisponible === fechaIso;
                const bloqueado = c.fechaNoDisponible === fechaIso;
                return (cumpleBloque || forzado) && !bloqueado;
            });

            // Filtrar territorios (Priorizando Subterritorios si coinciden día/hora)
            const terrDisponibles = territorios.filter(t => {
                const cumplePrincipal = (t.disponibilidadDias || []).includes(diaNombre) && (t.disponibilidadHoras || []).includes(hora);
                const cumpleSub = (t.subDias || []).includes(diaNombre) && (t.subHoras || []).includes(hora);
                return (cumplePrincipal || cumpleSub) && !territoriosUsadosHoy.includes(t.nombre);
            });
            
            const cond = obtenerConductorEquitativo(disponibles, nuevaAgenda);
            const t = terrDisponibles.length > 0 ? terrDisponibles[Math.floor(Math.random() * terrDisponibles.length)] : null;

            let nombreTerritorio = "Sin Territorio";
            if (t) {
                const esMomentoSub = (t.subDias || []).includes(diaNombre) && (t.subHoras || []).includes(hora);
                nombreTerritorio = (esMomentoSub && t.subNombre) ? `${t.numero}. ${t.nombre} (${t.subNombre})` : `${t.numero}. ${t.nombre}`;
                territoriosUsadosHoy.push(t.nombre);
            }

            nuevaAgenda.push({
                diaSemana: diaNombre, diaMes: i, hora: hora,
                conductor: cond ? `${cond.nombre} ${cond.apellido}` : "Sin Asignar",
                territorio: nombreTerritorio,
                lugar: t ? t.lugar : (hora === "06:30 PM" ? "Vía Telegram" : "Por Definir"),
                grupos: (hora === "06:30 PM") ? "Telegram" : "Todos",
                avisado: false
            });
        });
    }

    // Guardamos en memoria volátil para vista previa
    agendasMaestras[mes] = nuevaAgenda;
    renderAgenda(nuevaAgenda, nombreMes);
    document.getElementById('resultadoAgenda').classList.remove('hidden');
}

// --- 5. SISTEMA DE HISTORIAL (Oficialización de Agendas) ---

function guardarEnHistorial() {
    const mes = document.getElementById('mesAgenda').value;
    if (!agendasMaestras[mes]) {
        alert("Primero genera una agenda para poder guardarla.");
        return;
    }
    
    // Pasamos de volátil a Permanente
    historialAgendas[mes] = JSON.parse(JSON.stringify(agendasMaestras[mes]));
    
    // Sincronización inmediata
    guardarSincronizar();
    renderHistorial();
    alert("¡Agenda oficializada y guardada en la nube!");
}

function cargarDeHistorial(m) {
    if (!historialAgendas[m]) return;
    
    // Cargamos a memoria de trabajo
    agendasMaestras[m] = JSON.parse(JSON.stringify(historialAgendas[m]));
    document.getElementById('mesAgenda').value = m;
    
    const nombreMes = document.getElementById('mesAgenda').options[document.getElementById('mesAgenda').selectedIndex].text;
    renderAgenda(agendasMaestras[m], nombreMes);
    
    document.getElementById('resultadoAgenda').classList.remove('hidden');
    closeModal('modalHistorial');
}

function borrarDeHistorial(m) {
    if (confirm("¿Seguro que quieres borrar esta agenda del historial oficial?")) {
        delete historialAgendas[m];
        guardarSincronizar();
        renderHistorial();
    }
}

// --- 6. UTILIDADES FINALES ---

function obtenerConductorEquitativo(disponibles, agendaActual) {
    if (disponibles.length === 0) return null;
    const conteo = {};
    disponibles.forEach(c => {
        const nom = `${c.nombre} ${c.apellido}`;
        conteo[nom] = agendaActual.filter(a => a.conductor === nom).length;
    });
    disponibles.sort((a, b) => conteo[`${a.nombre} ${a.apellido}`] - conteo[`${b.nombre} ${b.apellido}`]);
    return disponibles[0];
}

function actualizarDatalists() {
    const dlCond = document.getElementById('listaSugerenciasConductores');
    const dlTerr = document.getElementById('listaSugerenciasTerritorios');
    if (dlCond) dlCond.innerHTML = conductores.map(c => `<option value="${c.nombre} ${c.apellido}">`).join('');
    if (dlTerr) dlTerr.innerHTML = territorios.map(t => `<option value="${t.numero}. ${t.nombre}">`).join('');
}

function obtenerAnioTrabajo() { return 2026; }

