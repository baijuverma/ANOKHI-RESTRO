
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testConnection() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');

        const env = {};
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });

        const url = env['NEXT_PUBLIC_SUPABASE_URL'];
        const key = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

        if (!url || !key) {
            console.error('Error: Missing Supabase credentials in .env.local');
            return;
        }

        console.log(`Checking connection to ${url}...`);
        const supabase = createClient(url, key);

        // Test database connection
        // We often don't know what tables exist. 'users' is a good guess if it's a custom table,
        // but 'auth.users' is system. We can't query system tables directly with anon key usually.
        // Let's try to get the session/user which hits Auth service.

        /*
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
            console.error('Auth Service Error:', authError.message);
        } else {
            console.log('Auth Service: Reachable');
        }
        */

        // Let's try to fetch from a standard table users as implied by the login page
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Database Error:', error.message, error.code, error.details);
            if (error.code === '42P01') {
                console.log("Table 'users' does not exist. The database connection might be fine, but schema is missing.");
            }
        } else {
            console.log('Database Connection: Success (users table exists)');
        }

    } catch (e) {
        console.error('Script Error:', e);
    }
}

testConnection();
