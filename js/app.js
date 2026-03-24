/* ARCHIVO: js/app.js - MOTOR LÓGICO, SINCRONIZACIÓN Y AM/PM */

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

// --- 2. INICIALIZACIÓN CON PRIORIDAD NUBE (Sincronización Total) ---
async function initApp() {
    console.log("Sincronizando datos...");
    
    // Carga local rápida
    const local = JSON.parse(localStorage.getItem('vdm_data') || '{}');
    conductores = local.conductores || [];
    territorios = local.territorios || [];
    grupos = local.grupos || [];
    historialAgendas = local.historial || {};
    agendasMaestras = {}; 

    // Descarga forzada de Supabase para actualización multi-dispositivo
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
                
                guardarLocal(); // Actualizamos el local con lo más nuevo de la nube
            }
        }
    } catch (e) { 
        console.warn("Modo offline: No se pudo sincronizar con la nube."); 
    }
    
    if (typeof renderAll === 'function') renderAll();
    actualizarDatalists();
}

// --- 3. PERSISTENCIA ---
function guardarLocal() { 
    const payload = { conductores, territorios, grupos, historial: historialAgendas };
    localStorage.setItem('vdm_data', JSON.stringify(payload)); 
}

async function guardarSincronizar() {
    const btn = document.getElementById('btn-sync-save'); 
    if (btn) btn.innerText = "⏳ Sincronizando...";
    
    guardarLocal();
    
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;
        
        const payload = { conductores, territorios, grupos, historial: historialAgendas };
        await supabaseClient.from('registros_tablas').upsert([{ user_id: session.user.id, datos: payload }]);
        
        if (btn) btn.innerText = "✅ ¡Sincronizado!";
    } catch (e) { 
        if (btn) btn.innerText = "❌ Error Nube"; 
    }
    
    setTimeout(() => { if (btn) btn.innerText = "Sincronizar Nube"; }, 3000);
}

// --- 4. MOTOR DE GENERACIÓN CON LÓGICA AM/PM ---
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
            const esTarde = hora.includes("PM");
            const bloqueBuscado = `${diaNombre}-${esTarde ? 'PM' : 'AM'}`;

            // Filtrar conductores por el nuevo formato AM/PM
            const disponibles = conductores.filter(c => {
                const cumpleBloque = (c.disponibilidadDias || []).includes(bloqueBuscado);
                const forzado = c.fechaDisponible === fechaIso;
                const bloqueado = c.fechaNoDisponible === fechaIso;
                return (cumpleBloque || forzado) && !bloqueado;
            });

            // Filtrar territorios (Principal o Subterritorio)
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

    agendasMaestras[mes] = nuevaAgenda;
    if (typeof renderAgenda === 'function') {
        renderAgenda(nuevaAgenda, nombreMes);
        document.getElementById('resultadoAgenda').classList.remove('hidden');
    }
}

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

// --- 5. UTILIDADES ---
function actualizarDatalists() {
    const dlCond = document.getElementById('listaSugerenciasConductores');
    const dlTerr = document.getElementById('listaSugerenciasTerritorios');
    if (dlCond) dlCond.innerHTML = conductores.map(c => `<option value="${c.nombre} ${c.apellido}">`).join('');
    if (dlTerr) dlTerr.innerHTML = territorios.map(t => `<option value="${t.numero}. ${t.nombre}">`).join('');
}

function actualizarCelda(idx, campo, valor) { 
    const mes = document.getElementById('mesAgenda').value; 
    if (agendasMaestras[mes]) { 
        agendasMaestras[mes][idx][campo] = valor.trim(); 
        guardarLocal(); 
        if (typeof renderContactos === 'function') renderContactos(); 
    } 
}
