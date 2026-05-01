
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

        // Check if 'items' table exists by selecting 1 row
        // If table doesn't exist, this will error with 42P01
        console.log("Checking 'items' table...");
        const { data: itemsData, error: itemsError } = await supabase.from('items').select('*').limit(1);

        if (itemsError) {
            if (itemsError.code === '42P01') {
                console.error("Result: Table 'items' DOES NOT EXIST.");
            } else {
                console.error("Result: Error accessing 'items' table:", itemsError.message);
            }
        } else {
            console.log("Result: Table 'items' exists and is accessible.");
        }

        // Check auth (public check)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error("Auth Error:", sessionError.message);
        } else {
            console.log("Auth Service is reachable.");
        }

    } catch (e) {
        console.error('Script Error:', e);
    }
}

testConnection();
