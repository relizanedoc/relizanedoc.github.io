const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function generateMeta() {
    try {
        console.log('Fetching doctors data from Supabase...');
        // نستخدم REST API المباشر لتجنب الحاجة لتثبيت مكتبات خارجية
        const response = await fetch(`${SUPABASE_URL}/rest/v1/doctors?select=id,first_name,last_name,first_name_en,last_name_en,specialty,municipality,exact_location`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // حفظ الملف في المسار الرئيسي للمشروع
        const filePath = path.join(__dirname, '../doctors-meta.json');
        fs.writeFileSync(filePath, JSON.stringify(data));
        console.log(`✅ Successfully generated doctors-meta.json with ${data.length} records.`);
        
    } catch (error) {
        console.error('❌ Error generating meta file:', error);
        process.exit(1); // إيقاف العملية بوجود خطأ
    }
}

generateMeta();
