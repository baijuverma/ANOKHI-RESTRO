const SUPABASE_URL = 'https://fhshckrdkasopfneujmw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qFlDlQChYsm7WobmTOmc6w_Wkb3XSBl';

let supabaseClient = null;

export const getSupabase = () => {
    if (supabaseClient) return supabaseClient;

    try {
        const _supa = window.supabase || window.Supabase;
        if (_supa && _supa.createClient) {
            supabaseClient = _supa.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return supabaseClient;
        }
    } catch(e) {
        console.warn('Supabase initialization failed:', e);
    }
    return null;
};
export const subscribeToTable = (tableName, callback) => {
    const db = getSupabase();
    if (!db) return null;

    const channel = db.channel(`public:${tableName}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
            console.log(`Realtime change in ${tableName}:`, payload);
            callback(payload);
        })
        .subscribe();

    return channel;
};
