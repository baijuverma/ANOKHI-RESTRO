
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testInsert() {
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

        // Try inserting a test item
        console.log("Attempting to insert test item...");
        const { data, error } = await supabase.from('items').insert({
            name: 'Test Setup Item',
            category: 'System',
            price: 0,
            is_active: false,
            restaurant_id: 'system-check' // assuming this field is required
        }).select();

        if (error) {
            console.error("Insert Failed:", error.message, error.code);
            console.log("This likely means Row Level Security (RLS) is enabled and blocks anonymous inserts.");
            console.log("You (the user) need to add a policy or use authenticated client.");
        } else {
            console.log("Insert Success:", data);
            // Cleanup
            await supabase.from('items').delete().eq('id', data[0].id);
            console.log("Cleanup Success.");
        }

    } catch (e) {
        console.error('Script Error:', e);
    }
}

testInsert();
