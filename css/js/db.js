// Configuración de Supabase
const SUPABASE_URL = 'https://gbuqjbuwpdovuxzuysml.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3MQOwq5YleBWlTapPiEWaw_okOxDHLv';
// Usamos window para que el móvil no se pierda
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Objeto de datos global
let data_app = {
    conductores: [],
    territorios: [],
    grupos: [],
    historial: {}
};

function guardarLocal() {
    localStorage.setItem('vdm_data_v1', JSON.stringify(data_app));
}

function cargarLocal() {
    const localData = localStorage.getItem('vdm_data_v1');
    if (localData) {
        data_app = JSON.parse(localData);
        return true;
    }
    return false;
}

async function guardarSincronizar() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;
        await supabaseClient.from('registros_tablas').upsert({ 
            user_id: session.user.id, 
            datos_json: data_app 
        }, { onConflict: 'user_id' });
    } catch (e) { console.error(e); }
}

async function descargarNube() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;
        const { data, error } = await supabaseClient.from('registros_tablas').select('datos_json').eq('user_id', session.user.id).maybeSingle();
        if (data && data.datos_json) {
            data_app = data.datos_json;
            guardarLocal();
            return true;
        }
    } catch (e) { console.error(e); }
    return false;
}
