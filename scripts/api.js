// ==========================================
// api.js - الاتصال بقاعدة البيانات (Supabase)
// ==========================================

const SUPABASE_URL = 'https://iirjtmobphgmkgwkwumc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpcmp0bW9icGhnbWtnd2t3dW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDA2NjYsImV4cCI6MjA5NjUxNjY2Nn0.Yfa0oEwp_id9tHpSb3h0jf__B4drqXsM-TVs4VTTmp4';

// التأكد من أن مكتبة Supabase تم تحميلها في HTML مسبقاً
const { createClient } = window.supabase;

// تصدير العميل ليتم استخدامه في باقي الملفات
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// تصدير العميل ليتم استخدامه في باقي الملفات
export const RECAPTCHA_SITE_KEY = '6Ld2mAEtAAAAADCb15UwZclk7Yubl-Yh6lyFSlLT';
