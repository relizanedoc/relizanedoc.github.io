const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// تهيئة الاتصال بـ Supabase عبر متغيرات البيئة
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateAppMeta() {
  try {
    // نجلب جميع الأعمدة (*) لضمان الحصول على Phone و Phone2 وكل التفاصيل للتطبيق
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // مسار حفظ الملف الجديد المخصص للتطبيق
    const outputPath = path.join(__dirname, '../doctors-app-meta.json');
    
    // كتابة البيانات في الملف بصيغة JSON
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`✅ تم توليد ملف التطبيق بنجاح! عدد الأطباء: ${data.length}`);
  } catch (error) {
    console.error('❌ خطأ أثناء توليد ملف التطبيق:', error.message);
    process.exit(1);
  }
}

generateAppMeta();
