// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = 'https://gbuqjbuwpdovuxzuysml.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3MQOwq5YleBWlTapPiEWaw_okOxDHLv';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- VARIABLES GLOBALES DE DATOS ---
let conductores = [], territorios = [], grupos = [], agendasMaestras = {}, historialAgendas = {};

// --- PERSISTENCIA LOCAL ---
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

function cargarLocal() {
    const local = JSON.parse(localStorage.getItem('vdm_data') || '{}');
    conductores = local.conductores || [];
    territorios = local.territorios || [];
    grupos = local.grupos || [];
    agendasMaestras = local.registros || {};
    historialAgendas = local.historial || {};
}

// --- SINCRONIZACIÓN NUBE ---
async function descargarNube() {
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
                guardarLocal();
                return true;
            }
        }
    } catch (e) { 
        console.warn("Error descargando de la nube:", e); 
    }
    return false;
}

async function guardarSincronizar() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const payload = { 
            registros: agendasMaestras, 
            conductores, 
            territorios, 
            grupos, 
            historial: historialAgendas 
        };

        const { error } = await supabaseClient
            .from('registros_tablas')
            .upsert([{ 
                user_id: session.user.id, 
                datos: payload 
            }]);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error al sincronizar:", e);
        return false;
    }
}
