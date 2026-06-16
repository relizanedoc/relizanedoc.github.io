// ==========================================
// utils.js - دوال مساعدة مستقلة
// ==========================================
import { state, i18n } from './state.js';

// دالة الترجمة
export function t(key) { 
    return (i18n[state.currentLang] && i18n[state.currentLang][key]) ? i18n[state.currentLang][key] : (i18n['en'][key] || key); 
}

// دالة تنظيف النصوص من الثغرات (XSS)
export function escapeHtml(str) { 
    if (!str) return ''; 
    return DOMPurify.sanitize(str); 
}

// دالة تنسيق أرقام الهواتف الجزائرية
export function formatPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 10) return cleaned.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    return cleaned || phone; 
}

// دالة إظهار الإشعارات (Toasts)
export function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { 
        toast.style.animation = 'fadeOutDown 0.3s ease-in forwards'; 
        setTimeout(() => toast.remove(), 350); 
    }, 4000);
}

// دالة إظهار وإخفاء حالة التحميل في الأزرار
export function setLoading(btn, isLoading, originalText = null) {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = '<div class="spinner"></div> ' + (state.currentLang === 'ar' ? 'جاري المعالجة...' : 'Processing...');
    } else {
        btn.disabled = false;
        btn.innerHTML = originalText || btn.dataset.originalHtml || (state.currentLang === 'ar' ? 'إرسال' : 'Submit');
    }
}
// دالة مساعدة لاختيار اسم الطبيب حسب لغة الموقع
export function getLocalizedName(doc, currentLang) {
    // إذا كانت لغة الموقع إنجليزية، والطبيب لديه اسم إنجليزي في قاعدة البيانات
    if (currentLang === 'en' && doc.first_name_en && doc.last_name_en) {
        return `${doc.first_name_en} ${doc.last_name_en}`;
    }
    // في كل الحالات الأخرى (الموقع بالعربية، أو الطبيب لم يكتب اسمه الإنجليزي بعد)
    return `${doc.first_name} ${doc.last_name}`;
}
