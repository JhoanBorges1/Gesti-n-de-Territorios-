/* ARCHIVO: js/app.js - EL MOTOR LÓGICO DE VISTA AL MAR */

// --- 1. ESTADO GLOBAL ---
let conductores = [];
let territorios = [];
let grupos = [];
let agendasMaestras = {};
let historialAgendas = {};

// Matriz de horarios fija para Vista Al Mar (Restaurada)
const MATRIZ_HORARIOS = { 
    'LUN': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'MAR': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'MIÉ': ['07:00 AM', '09:00 AM'], 
    'JUE': ['07:00 AM', '09:00 AM', '04:00 PM'], 
    'VIE': ['07:00 AM', '09:00 AM', '04:00 PM', '06:30 PM'], 
    'SÁB': ['07:00 AM', '09:00 AM'], 
    'DOM': ['11:00 AM'] 
};

// --- 2. INICIALIZACIÓN ---
async function initApp() {
    console.log("Cargando base de datos...");
    
    // 1. Carga rápida local (LocalStorage)
    const local = JSON.parse(localStorage.getItem('vdm_data') || '{}');
    conductores = local.conductores || [];
    territorios = local.territorios || [];
    grupos = local.grupos || [];
    agendasMaestras = local.registros || {};
    historialAgendas = local.historial || {};

    // 2. Sincronización con la Nube (Supabase)
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
                agendasMaestras = d.registros || agendasMaestras;
                historialAgendas = d.historial || historialAgendas;
            }
        }
    } catch (e) { 
        console.warn("Sincronización fallida: Usando datos locales."); 
    }
    
    // 3. Dibujamos la interfaz una vez que los datos están listos
    if (typeof renderAll === 'function') {
        renderAll();
    }
    
    actualizarDatalists(); // Activa sugerencias en las tablas
}

// --- 3. PERSISTENCIA ---
function guardarLocal() { 
    const payload = { conductores, territorios, grupos, registros: agendasMaestras, historial: historialAgendas };
    localStorage.setItem('vdm_data', JSON.stringify(payload)); 
}

async function guardarSincronizar() {
    const btn = document.getElementById('btn-sync-save'); 
    if (btn) btn.innerText = "⏳ Sincronizando...";
    
    guardarLocal();
    
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;
        
        const payload = { registros: agendasMaestras, conductores, territorios, grupos, historial: historialAgendas };
        await supabaseClient.from('registros_tablas').upsert([{ user_id: session.user.id, datos: payload }]);
        
        if (btn) btn.innerText = "✅ ¡En la Nube!";
    } catch (e) { 
        if (btn) btn.innerText = "❌ Error"; 
    }
    
    setTimeout(() => { if (btn) btn.innerText = "Sincronizar Nube"; }, 3000);
}

// --- 4. MOTOR DE ASIGNACIÓN INTELIGENTE ---
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
            // Filtro de conductores disponibles
            const disponibles = conductores.filter(c => {
                const cumpleDiaHora = c.disponibilidadDias?.includes(diaNombre) && c.disponibilidadHoras?.includes(hora);
                const noDisponible = c.fechaNoDisponible === fechaIso;
                const forzadoDisponible = c.fechaDisponible === fechaIso;
                return (cumpleDiaHora && !noDisponible) || forzadoDisponible;
            });

            // Filtro de territorios disponibles (No repetir hoy)
            const terrDisponibles = territorios.filter(t => 
                t.disponibilidadDias?.includes(diaNombre) && 
                t.disponibilidadHoras?.includes(hora) && 
                !territoriosUsadosHoy.includes(t.nombre)
            );
            
            const cond = obtenerConductorMenosAsignado(disponibles, nuevaAgenda);
            const terr = terrDisponibles.length > 0 ? terrDisponibles[Math.floor(Math.random() * terrDisponibles.length)] : null;

            if (terr) territoriosUsadosHoy.push(terr.nombre);

            nuevaAgenda.push({
                diaSemana: diaNombre, 
                diaMes: i, 
                hora: hora,
                conductor: cond ? `${cond.nombre} ${cond.apellido}` : "Sin Asignar",
                territorio: terr ? `${terr.numero}. ${terr.nombre}${terr.subNombre ? ' ('+terr.subNombre+')' : ''}` : "Sin Territorio",
                lugar: terr ? terr.lugar : (hora === "06:30 PM" ? "Vía Telegram" : "Por Definir"),
                grupos: (hora === "06:30 PM") ? "Telegram" : "Todos",
                avisado: false
            });
        });
    }

    agendasMaestras[mes] = nuevaAgenda;
    guardarLocal();
    
    if (typeof renderAgenda === 'function') {
        renderAgenda(nuevaAgenda, nombreMes);
        document.getElementById('resultadoAgenda').classList.remove('hidden');
    }
}

// Motor de equidad (Para que todos trabajen por igual)
function obtenerConductorMenosAsignado(disponibles, agendaActual) {
    if (disponibles.length === 0) return null;
    
    const conteo = {};
    disponibles.forEach(c => {
        const nombreCompleto = `${c.nombre} ${c.apellido}`;
        conteo[nombreCompleto] = agendaActual.filter(a => a.conductor === nombreCompleto).length;
    });

    disponibles.sort((a, b) => {
        return conteo[`${a.nombre} ${a.apellido}`] - conteo[`${b.nombre} ${b.apellido}`];
    });

    const minAsignaciones = conteo[`${disponibles[0].nombre} ${disponibles[0].apellido}`];
    const candidatosFinales = disponibles.filter(c => conteo[`${c.nombre} ${c.apellido}`] === minAsignaciones);

    return candidatosFinales[Math.floor(Math.random() * candidatosFinales.length)];
}

// --- 5. UTILIDADES ---
function obtenerAnioTrabajo() { return 2026; }

function actualizarDatalists() {
    // Sugerencias para cuando editas la tabla manualmente
    const dlCond = document.getElementById('listaSugerenciasConductores');
    const dlTerr = document.getElementById('listaSugerenciasTerritorios');
    if (!dlCond || !dlTerr) return;

    dlCond.innerHTML = ''; dlTerr.innerHTML = '';
    conductores.forEach(c => dlCond.innerHTML += `<option value="${c.nombre} ${c.apellido}">`);
    territorios.forEach(t => dlTerr.innerHTML += `<option value="${t.numero}. ${t.nombre}">`);
}

function actualizarCelda(idx, campo, valor) { 
    const mes = document.getElementById('mesAgenda').value; 
    if (agendasMaestras[mes]) { 
        agendasMaestras[mes][idx][campo] = valor.trim(); 
        guardarLocal(); 
        if (typeof renderContactos === 'function') renderContactos(); 
    } 
}
