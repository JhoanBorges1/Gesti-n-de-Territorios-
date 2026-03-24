/* ARCHIVO: js/app.js - EL MOTOR LÓGICO DE VISTA AL MAR */

// --- 1. ESTADO GLOBAL ---
let conductores = [];
let territorios = [];
let grupos = [];
let agendasMaestras = {};
let historialAgendas = {};

// Matriz de horarios fija para Vista Al Mar
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
    
    // Carga rápida local
    const local = JSON.parse(localStorage.getItem('vdm_data') || '{}');
    conductores = local.conductores || [];
    territorios = local.territorios || [];
    grupos = local.grupos || [];
    agendasMaestras = local.registros || {};
    historialAgendas = local.historial || {};

    // Sincronización con Supabase (Nube)
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
                conductores = d.conductores || conductores;
                territorios = d.territorios || territorios;
                grupos = d.grupos || grupos;
                agendasMaestras = d.registros || agendasMaestras;
                historialAgendas = d.historial || historialAgendas;
            }
        }
    } catch (e) {
        console.warn("Modo Offline: Usando datos locales.");
    }
    
    // Una vez cargados los datos, le decimos a ui.js que los dibuje
    if (typeof renderAll === 'function') {
        renderAll();
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
    };
    localStorage.setItem('vdm_data', JSON.stringify(payload)); 
}

async function guardarSincronizar() {
    const btn = document.getElementById('btn-sync-save');
    if (btn) btn.innerText = "⏳ Sincronizando...";
    
    guardarLocal();
    
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) throw new Error("No hay sesión");

        const payload = { 
            registros: agendasMaestras, 
            conductores, 
            territorios, 
            grupos, 
            historial: historialAgendas 
        };

        await supabaseClient.from('registros_tablas').upsert([
            { user_id: session.user.id, datos: payload }
        ]);

        if (btn) btn.innerText = "✅ ¡En la Nube!";
    } catch (e) {
        if (btn) btn.innerText = "❌ Error Nube";
        console.error(e);
    }
    
    setTimeout(() => { if(btn) btn.innerText = "Sincronizar Nube"; }, 3000);
}

// --- 4. MOTOR DE ASIGNACIÓN (EL CEREBRO) ---
function generarNuevaAgenda() {
    const mesSelect = document.getElementById('mesAgenda');
    const mes = mesSelect.value;
    const nombreMes = mesSelect.options[mesSelect.selectedIndex].text;
    const anio = obtenerAnioTrabajo();
    
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const diasSemanaNombres = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
    let nuevaAgenda = [];

    for (let i = 1; i <= diasEnMes; i++) {
        const fechaObj = new Date(anio, mes - 1, i);
        const diaNombre = diasSemanaNombres[fechaObj.getDay()];
        const fechaIso = fechaObj.toISOString().split('T')[0];
        const horariosDelDia = MATRIZ_HORARIOS[diaNombre] || [];
        
        let territoriosUsadosHoy = [];

        horariosDelDia.forEach(hora => {
            // Buscamos conductores disponibles para este día y hora
            const disponibles = conductores.filter(c => {
                const cumpleNormal = c.disponibilidadDias?.includes(diaNombre) && c.disponibilidadHoras?.includes(hora);
                const esFechaForzada = c.fechaDisponible === fechaIso;
                const esFechaBloqueada = c.fechaNoDisponible === fechaIso;
                return (cumpleNormal || esFechaForzada) && !esFechaBloqueada;
            });

            // Buscamos territorios disponibles
            const terrDisponibles = territorios.filter(t => 
                t.disponibilidadDias?.includes(diaNombre) && 
                t.disponibilidadHoras?.includes(hora) &&
                !territoriosUsadosHoy.includes(t.nombre)
            );

            const condElegido = obtenerConductorEquitativo(disponibles, nuevaAgenda);
            const terrElegido = terrDisponibles.length > 0 ? terrDisponibles[Math.floor(Math.random() * terrDisponibles.length)] : null;

            if (terrElegido) territoriosUsadosHoy.push(terrElegido.nombre);

            nuevaAgenda.push({
                diaSemana: diaNombre,
                diaMes: i,
                hora: hora,
                conductor: condElegido ? `${condElegido.nombre} ${condElegido.apellido}` : "Sin Asignar",
                territorio: terrElegido ? `${terrElegido.numero}. ${terrElegido.nombre}` : "Sin Territorio",
                lugar: terrElegido ? terrElegido.lugar : (hora === "06:30 PM" ? "Vía Telegram" : "Por Definir"),
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

// Función para que no siempre salgan los mismos hermanos
function obtenerConductorEquitativo(disponibles, agendaActual) {
    if (disponibles.length === 0) return null;
    
    const conteo = {};
    disponibles.forEach(c => {
        const nombre = `${c.nombre} ${c.apellido}`;
        conteo[nombre] = agendaActual.filter(a => a.conductor === nombre).length;
    });

    disponibles.sort((a, b) => {
        return conteo[`${a.nombre} ${a.apellido}`] - conteo[`${b.nombre} ${b.apellido}`];
    });

    const minVal = conteo[`${disponibles[0].nombre} ${disponibles[0].apellido}`];
    const mejoresCandidatos = disponibles.filter(c => conteo[`${c.nombre} ${c.apellido}`] === minVal);

    return mejoresCandidatos[Math.floor(Math.random() * mejoresCandidatos.length)];
}

function obtenerAnioTrabajo() { return 2026; }

function guardarEnHistorial() {
    const mes = document.getElementById('mesAgenda').value;
    if (!agendasMaestras[mes]) return;
    historialAgendas[mes] = JSON.parse(JSON.stringify(agendasMaestras[mes]));
    guardarLocal();
    if (typeof renderHistorial === 'function') renderHistorial();
    alert("¡Agenda guardada en el historial!");
}
 
