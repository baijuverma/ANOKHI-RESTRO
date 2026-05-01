
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testSignup() {
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

        console.log(`Checking Email Auth on ${url}...`);
        const supabase = createClient(url, key);

        // Random email to avoid conflict
        const randomEmail = `test_auth_${Date.now()}@example.com`;
        const password = 'password123';

        console.log(`Attempting signup with ${randomEmail}...`);
        const { data, error } = await supabase.auth.signUp({
            email: randomEmail,
            password: password
        });

        if (error) {
            console.error("Signup Failed:", error.message, error.code);
            console.log("Full Error:", JSON.stringify(error, null, 2));
            if (error.code === 'validation_failed' || error.message.includes('not enabled')) {
                console.log("CONCLUSION: Email Auth provider is DISABLED.");
            }
        } else {
            console.log("Signup Success or Confirmation Sent.");
            console.log("User ID:", data.user?.id);
            console.log("CONCLUSION: Email Auth provider is ENABLED.");
        }

    } catch (e) {
        console.error('Script Error:', e);
    }
}

testSignup();
