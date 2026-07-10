const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// تهيئة الاتصال بـ Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateAppMeta() {
  try {
    // 1. جلب بيانات الأطباء (مع الحفاظ على التحديث الأمني وتحديد الأعمدة)
    console.log('جاري جلب بيانات الأطباء...');
    const { data: doctors, error: doctorsError } = await supabase
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
        working_days,
        booking_enabled
      `)
      .order('created_at', { ascending: false });

    if (doctorsError) throw doctorsError;

    // 2. جلب التقييمات من جدول reviews
    console.log('جاري جلب تقييمات المرضى...');
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*'); 
      // ملاحظة: إذا كان لديك عمود للموافقة على التقييمات في الداتابيز، يمكنك استخدام:
      // .select('*').eq('approved', true);

    if (reviewsError) throw reviewsError;

    // 3. الدمج الذكي: ربط كل تقييم بالطبيب الخاص به
    console.log('جاري دمج التقييمات مع بيانات الأطباء...');
    const finalData = doctors.map(doctor => {
      // نبحث عن التقييمات الخاصة بهذا الطبيب (سواء كان الربط عبر slug أو id)
      const doctorReviews = reviews.filter(review => 
        review.doctor_slug === doctor.slug || review.doctor_id === doctor.id
      );
      
      return {
        ...doctor,
        reviews: doctorReviews // إضافة التقييمات كنطاق جديد داخل الطبيب
      };
    });

    // 4. مسار حفظ الملف
    const outputPath = path.join(__dirname, '../doctors-app-meta.json');
    
    // كتابة البيانات المدمجة في الملف
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');
    
    console.log(`✅ تم توليد ملف التطبيق الآمن والمدمج بالتقييمات بنجاح! عدد الأطباء: ${finalData.length}`);
  } catch (error) {
    console.error('❌ خطأ أثناء توليد ملف التطبيق:', error.message);
    process.exit(1);
  }
}

generateAppMeta();
