const { createClient } = require('@supabase/supabase-js');

// Match .env.local values exactly
const url = "https://ojzqwwaebxvpnenkthaw.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qenF3d2FlYnh2cG5lbmt0aGF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM4MjE0MywiZXhwIjoyMDgwOTU4MTQzfQ.IvHe8xsdiIix3XugOHBEEV_ZG1Y0x6KzJF3JL0ByUcQ";

console.log("Testing Key ending in: " + key.slice(-10));
const supabase = createClient(url, key);

async function test() {
    const { data, error } = await supabase.from('target_brokers').select('*').limit(5);
    if (error) {
        console.error("❌ ERROR:", error);
    } else {
        console.log("✅ DATA FOUND:", data ? data.length : 0);
        if (data && data.length > 0) {
            console.log("First row name:", data[0].full_name);
        }
    }
}

test();
