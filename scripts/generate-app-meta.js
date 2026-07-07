const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// تهيئة الاتصال بـ Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateAppMeta() {
  try {
    // 🛡️ التحديث الأمني: تحديد الأعمدة المطلوبة فقط وتجاهل البيانات الحساسة (مثل password و session_token)
    // حرصت على جلب الأسماء بالإنجليزية والعربية كما هو معتمد في هيكلة بياناتك
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        id,
        slug,
        first_name,
        last_name,
        first_name_en,
        last_name_en,
        specialty,
        municipality,
        exact_location,
        phone,
        phone_2,
        whatsapp_number,
        contact_email,
        facebook_link,
        map_link,
        extra_info,
        services,
        certificates,
        clinic_images,
        working_days
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // مسار حفظ الملف
    const outputPath = path.join(__dirname, '../doctors-app-meta.json');
    
    // كتابة البيانات في الملف
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`✅ تم توليد ملف التطبيق الآمن بنجاح! عدد الأطباء: ${data.length}`);
  } catch (error) {
    console.error('❌ خطأ أثناء توليد ملف التطبيق:', error.message);
    process.exit(1);
  }
}

generateAppMeta();
