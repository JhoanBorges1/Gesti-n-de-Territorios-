/* ARCHIVO: js/app.js - MOTOR LÓGICO Y SINCRONIZACIÓN NUBE (RESTAURADO COMPLETO) */

// --- 1. ESTADO GLOBAL ---
let conductores = [];
let territorios = [];
let grupos = [];
let agendasMaestras = {};
let historialAgendas = {};

const MATRIZ_HORARIOS = { 
    'LUN': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'MAR': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'MIÉ': ['07:00 AM', '09:00 AM'], 
    'JUE': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'VIE': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'SÁB': ['07:00 AM', '09:00 AM'], 
    'DOM': ['11:00 AM'] 
};

// --- 2. INICIALIZACIÓN Y SINCRONIZACIÓN MULTIDISPOSITIVO ---
async function initApp() {
    const local = JSON.parse(localStorage.getItem('vdm_data') || '{}');
    conductores = local.conductores || [];
    territorios = local.territorios || [];
    grupos = local.grupos || [];
    historialAgendas = local.historial || {};
    agendasMaestras = {}; 

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
                conductores = d.conductores || conductores;
                territorios = d.territorios || territorios;
                grupos = d.grupos || grupos;
                historialAgendas = d.historial || historialAgendas;
                guardarLocal();
            }
        }
    } catch (e) { console.warn("Error de sincronización nube:", e); }
    
    renderListaConductores(); 
    renderListaTerritorios(); 
    renderListaGrupos(); 
    renderHistorial(); 
    cargarAgendaDelMes();
    
    const lastTab = localStorage.getItem('vdm_active_tab') || 'tab-agenda';
    switchTab(lastTab);
    actualizarDatalists();
}

// --- 3. PERSISTENCIA ---
function guardarLocal() { 
    const payload = { conductores, territorios, grupos, historial: historialAgendas };
    localStorage.setItem('vdm_data', JSON.stringify(payload)); 
}

async function guardarSincronizar() {
    const btn = document.getElementById('btn-sync-save'); 
    btn.innerText = "⏳ Sincronizando...";
    guardarLocal();
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const payload = { conductores, territorios, grupos, historial: historialAgendas };
        await supabaseClient.from('registros_tablas').upsert([{ user_id: session.user.id, datos: payload }]);
        btn.innerText = "✅ ¡Sincronizado!";
    } catch (e) { btn.innerText = "❌ Error Nube"; }
    setTimeout(() => btn.innerText = "Sincronizar Nube", 3000);
}

// --- 4. MOTOR DE GENERACIÓN INTELIGENTE (Lógica AM/PM y Subterritorios) ---
function generarNuevaAgenda() {
    const mes = document.getElementById('mesAgenda').value;
    const nombreMes = document.getElementById('mesAgenda').options[document.getElementById('mesAgenda').selectedIndex].text;
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
            const esTarde = hora.includes("PM");
            const bloqueBuscado = `${diaNombre}-${esTarde ? 'PM' : 'AM'}`;

            const condsDisponibles = conductores.filter(c => {
                const cumpleBloque = (c.disponibilidadDias || []).includes(bloqueBuscado);
                const bloqueado = c.fechaNoDisponible === fechaIso;
                const forzado = c.fechaDisponible === fechaIso;
                return (cumpleBloque && !bloqueado) || forzado;
            });

            const terrsDisponibles = territorios.filter(t => {
                const cumplePrincipal = (t.disponibilidadDias || []).includes(diaNombre) && (t.disponibilidadHoras || []).includes(hora);
                const cumpleSub = (t.subDias || []).includes(diaNombre) && (t.subHoras || []).includes(hora);
                return (cumplePrincipal || cumpleSub) && !territoriosUsadosHoy.includes(t.nombre);
            });
            
            const c = obtenerConductorMenosAsignado(condsDisponibles, nuevaAgenda);
            const t = terrsDisponibles.length > 0 ? terrsDisponibles[Math.floor(Math.random() * terrsDisponibles.length)] : null;

            let nombreFinal = "Sin Territorio";
            if (t) {
                const esMomentoSub = (t.subDias || []).includes(diaNombre) && (t.subHoras || []).includes(hora);
                nombreFinal = esMomentoSub && t.subNombre ? `${t.numero}. ${t.nombre} (${t.subNombre})` : `${t.numero}. ${t.nombre}`;
                territoriosUsadosHoy.push(t.nombre);
            }

            nuevaAgenda.push({
                diaSemana: diaNombre, diaMes: i, hora: hora,
                conductor: c ? `${c.nombre} ${c.apellido}` : "Sin Asignar",
                territorio: nombreFinal,
                lugar: t ? t.lugar : (hora === "06:30 PM" ? "Vía Telegram" : "Por Definir"),
                grupos: (hora === "06:30 PM") ? "Telegram" : "Todos",
                avisado: false
            });
        });
    }
    agendasMaestras[mes] = nuevaAgenda;
    renderAgenda(nuevaAgenda, nombreMes);
    document.getElementById('resultadoAgenda').classList.remove('hidden');
}

// --- 5. FUNCIONES DE APOYO ---
function obtenerConductorMenosAsignado(disponibles, agendaActual) {
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
    if(dlCond) dlCond.innerHTML = conductores.map(c => `<option value="${c.nombre} ${c.apellido}">`).join('');
    if(dlTerr) dlTerr.innerHTML = territorios.map(t => `<option value="${t.numero}. ${t.nombre}">`).join('');
}

function actualizarCelda(idx, campo, valor) { 
    const mes = document.getElementById('mesAgenda').value; 
    if(agendasMaestras[mes]) { 
        agendasMaestras[mes][idx][campo] = valor.trim(); 
        renderContactos(); 
    } 
}

function cargarAgendaDelMes() { 
    const mes = document.getElementById('mesAgenda').value; 
    const n = document.getElementById('mesAgenda').options[document.getElementById('mesAgenda').selectedIndex].text; 
    if (agendasMaestras[mes]) { renderAgenda(agendasMaestras[mes], n); document.getElementById('resultadoAgenda').classList.remove('hidden'); }
    else document.getElementById('resultadoAgenda').classList.add('hidden'); 
}

function obtenerAnioTrabajo() { return 2026; }
function validarDatosConductor(c) { return c.nombre && c.nombre.trim().length >= 2; }
