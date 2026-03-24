// Configuración de Supabase
const SUPABASE_URL = 'https://gbuqjbuwpdovuxzuysml.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3MQOwq5YleBWlTapPiEWaw_okOxDHLv';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Objeto de datos global (Iniciado según Informe 2)
let data_app = {
    conductores: [],
    territorios: [],
    grupos: [],
    historial: {}
};

// --- PERSISTENCIA LOCAL ---
function guardarLocal() {
    localStorage.setItem('data_app_v1', JSON.stringify(data_app));
}

function cargarLocal() {
    const localData = localStorage.getItem('data_app_v1');
    if (localData) {
        data_app = JSON.parse(localData);
        return true;
    }
    return false;
}

// --- SINCRONIZACIÓN NUBE ---
async function guardarSincronizar() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) return;

        const { error } = await _supabase
            .from('registros_tablas')
            .upsert({ 
                user_id: session.user.id, 
                datos_json: data_app 
            }, { onConflict: 'user_id' });

        if (error) throw error;
        console.log("Sincronización exitosa");
    } catch (err) {
        console.error("Error de sincronización:", err);
    }
}

async function descargarNube() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await _supabase
            .from('registros_tablas')
            .select('datos_json')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (error) throw error;
        
        if (data && data.datos_json) {
            data_app = data.datos_json;
            guardarLocal();
            return true;
        }
    } catch (err) {
        console.error("Error al descargar:", err);
    }
    return false;
}
