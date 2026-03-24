// Configuración de Supabase
const supabaseUrl = 'sb_publishable_3MQOwq5YleBWlTapPiEWaw_okOxDHLv';
const supabaseKey = 'sb_publishable_3MQOwq5YleBWlTapPiEWaw_okOxDHLv';
export const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Objeto principal de la aplicación (Estructura según Informe 2)
export let data_app = {
    conductores: [],
    territorios: [],
    grupos: [],
    historial: []
};

// --- PERSISTENCIA LOCAL ---
export function guardarLocal() {
    localStorage.setItem('data_app_v1', JSON.stringify(data_app));
}

export function cargarLocal() {
    const localData = localStorage.getItem('data_app_v1');
    if (localData) {
        data_app = JSON.parse(localData);
        return true;
    }
    return false;
}

// --- SINCRONIZACIÓN NUBE ---
export async function guardarSincronizar() {
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
        console.log("Sincronización exitosa con la nube");
    } catch (err) {
        console.error("Error de sincronización:", err);
    }
}

export async function descargarNube() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await _supabase
            .from('registros_tablas')
            .select('datos_json')
            .eq('user_id', session.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 es "no hay filas"
        
        if (data && data.datos_json) {
            data_app = data.datos_json;
            guardarLocal();
            return true;
        }
    } catch (err) {
        console.error("Error al descargar de la nube:", err);
    }
    return false;
}
