// ==========================================
// init.js - تهيئة التطبيق، الأحداث العامة، والميزات الإضافية
// ==========================================
import { supabaseClient } from './api.js';
import { state } from './state.js';
import { t, escapeHtml, showToast, setLoading } from './utils.js';
import { updateUserUI } from './ui.js';
import { getCurrentUser } from './auth.js';
import { initChatbot } from './chatbot.js'; 

// 1. الاستماع لتغيير حالة المصادقة
let isAuthInitialized = false;
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        setTimeout(() => { if (typeof window.handleChangePassword === 'function') window.handleChangePassword(); }, 500);
    }
    if (['INITIAL_SESSION', 'SIGNED_IN', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
        if (session) {
            updateUserUI(session.user);
            if (event === 'SIGNED_IN') {
                const hash = window.location.hash;
                if (hash.includes('access_token')) {
                    if (typeof window.router === 'function') window.router('user-dashboard');
                    window.history.replaceState(null, '', window.location.pathname + '#user-dashboard');
                }
            }
        } else if (event === 'INITIAL_SESSION') {
            updateUserUI(null);
        }
    } else if (event === 'SIGNED_OUT') {
        updateUserUI(null);
    }

    if (!isAuthInitialized) {
        const hash = window.location.hash;
        if (!hash.includes('access_token') && !hash.includes('error=')) {
            const cleanHash = hash.replace('#', '');
            const startView = ['home', 'add-doctor', 'booking', 'dashboard', 'login', 'track', 'user-dashboard', 'doctor-profile'].includes(cleanHash) ? cleanHash : 'home';
            if (typeof window.router === 'function') window.router(startView, false); 
        }
        isAuthInitialized = true;
    }
});

// 2. التحقق عند التحميل الأولي
window.addEventListener('load', async () => {
    const savedLang = localStorage.getItem('appLanguage') || 'ar';
    setTimeout(() => { if(typeof window.setLang === 'function') window.setLang(savedLang); }, 10);
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateUserUI(session ? session.user : null);
});

// 3. دوال عامة (تحديث الزر، إضافة طبيب، تحديثات قديمة)
window.updateAuthToggle = function() { 
    const el = document.getElementById('authToggleText');
    if(el) el.textContent = t(state.isSignUp ? 'hasAccount' : 'noAccount'); 
};

window.handleAddDoctor = async function(e) {
  e.preventDefault();
  const user = await getCurrentUser();
  if (!user) { showToast(t('loginRequired'), 'error'); if (typeof window.router === 'function') window.router('login'); return; }

  const btn = document.getElementById('addDoctorBtn');
  setLoading(btn, true);
  const data = Object.fromEntries(new FormData(e.target));

  if (!data.Specialty || !data.Municipality) { showToast(state.currentLang === 'ar' ? 'الرجاء اختيار الاختصاص والبلدية.' : 'Please select specialty and municipality.', 'error'); setLoading(btn, false); return; }

  try {
    const turnstileResponse = document.querySelector('#view-add-doctor [name="cf-turnstile-response"]');
    const turnstileToken = turnstileResponse ? turnstileResponse.value : null;

    if (!turnstileToken) throw new Error("يرجى إكمال التحقق الأمني (الكابتشا).");

    const defaultPassword = data.Phone.replace(/\s/g, '');
    const phone1 = data.Phone ? data.Phone.replace(/\s/g, '') : '';
    const phone2 = data.Phone2 ? data.Phone2.replace(/\s/g, '') : null;

    const payload = {
      p_first_name: data.FirstName.trim(), p_last_name: data.LastName.trim(), p_phone: phone1,      
      p_phone_2: phone2, p_exact_location: data.ExactLocation.trim(), p_specialty: data.Specialty.trim(), 
      p_municipality: data.Municipality.trim(), p_extra_info: data.ExtraInfo ? data.ExtraInfo.trim() : '', 
      p_raw_password: defaultPassword
    };

    const { data: functionResponse, error: functionError } = await supabaseClient.functions.invoke('verify-add-doctor', { body: { turnstileToken: turnstileToken, doctorData: payload } });

    if (functionError) throw new Error("خطأ في الاتصال بالخادم الداخلي.");
    if (functionResponse && functionResponse.error) throw new Error(functionResponse.error);

    const responseData = functionResponse.data;
    if (!responseData || !responseData.id) throw new Error(responseData?.error || 'فشل في جلب معرف الطبيب الجديد');

    showToast(t('toastRegisterSuccess') + responseData.id, 'success');

    if (typeof window.createDoctorGitHubPageAsync === 'function') {
        window.createDoctorGitHubPageAsync({ 
          first_name: data.FirstName.trim(), last_name: data.LastName.trim(), phone: defaultPassword, 
          exact_location: data.ExactLocation.trim(), specialty: data.Specialty.trim(), municipality: data.Municipality.trim(), 
          extra_info: data.ExtraInfo ? data.ExtraInfo.trim() : '', slug: responseData.slug 
        }, responseData.id);
    }

    e.target.reset();
    if(typeof window.loadDoctors === 'function') await window.loadDoctors();
    setTimeout(() => { if (typeof window.router === 'function') window.router('home'); }, 1500);
  } catch (err) { showToast((state.currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + err.message, 'error'); } 
  finally { setLoading(btn, false); }
};

window.createDoctorGitHubPageAsync = function(doctorData, doctorId) {
  const finalSlug = doctorData.slug || doctorId; 
  supabaseClient.functions.invoke('create-github-page', { body: { doctorData, doctorId, slug: finalSlug } })
  .then(({ data, error }) => { if (!error && data && data.success) showToast('تم إنشاء صفحة الطبيب للـ SEO!', 'success'); })
  .catch(err => console.error('Edge Function Error:', err));
};

window.migrateOldDoctors = async function() {
    try {
        const { data: doctors, error } = await supabaseClient.from('doctors').select('*');
        if (error) throw error;
        let count = 0;
        for (const doc of doctors) {
            const finalSlug = doc.slug || doc.id; 
            await supabaseClient.functions.invoke('create-github-page', { body: { doctorData: doc, doctorId: doc.id, slug: finalSlug } });
            count++;
        }
        alert('تمت ترقية جميع ملفات الأطباء القدامى بنجاح!');
    } catch (err) { console.error("❌ حدث خطأ أثناء التحديث:", err); }
};

async function initNewsTicker() {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const response = await fetch(`./doctors-meta.json?v=${today}`);
        if (!response.ok) return; 

        const doctorsData = await response.json();
        const totalDoctors = doctorsData.length;
        const uniqueMunicipalities = new Set(doctorsData.map(d => d.municipality).filter(Boolean)).size;

        const tickerTrack = document.getElementById('dynamicNewsTicker');
        const tickerContainer = document.getElementById('news-ticker-container');
        if (!tickerTrack || !tickerContainer) return;

        const messages = [
            `<span class="ticker-item">🌟 انضم إلينا أكثر من <strong style="color: #ea580c; margin: 0 4px; font-size: 1.1rem;">${totalDoctors}</strong> طبيب وطبيبة من مختلف التخصصات.</span>`,
            `<span class="ticker-item">📍 نغطي الآن <strong style="color: #0ea5e9; margin: 0 4px; font-size: 1.1rem;">${uniqueMunicipalities}</strong> بلدية في ولاية غليزان لخدمتكم.</span>`,
            `<span class="ticker-item">📅 احجز موعدك أونلاين أو تواصل مع العيادة مباشرة بكل سهولة وبشكل مجاني.</span>`
        ];

        const separator = '<span style="color:#cbd5e1; margin:0 10px;">|</span>';
        const content = messages.join(` ${separator} `) + ` ${separator} ` + messages.join(` ${separator} `);

        tickerTrack.innerHTML = content;
        tickerContainer.style.display = 'block'; 
    } catch (error) { console.error("فشل تحميل الشريط الإخباري:", error); }
}

// 4. تهيئة الأحداث (Event Listeners) عند جاهزية الـ DOM
document.addEventListener('DOMContentLoaded', () => {
    // تتبع الحجز
    const trackForm = document.getElementById('trackBookingForm');
    if (trackForm) {
        trackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('trackBtn');
            const bookingId = document.getElementById('trackBookingId').value.trim();
            const phoneStr = document.getElementById('trackPhone').value.trim();
            const resultDiv = document.getElementById('trackResult');
            setLoading(btn, true);
            resultDiv.classList.add('hidden');
            try {
                const { data, error } = await supabaseClient.rpc('track_booking_secure', { p_short_id: bookingId, p_phone: phoneStr });
                if (error) throw error;
                if (data && data.length > 0) {
                    const booking = data[0];
                    let statusStyle = 'background: #f1f5f9; color: #64748b;';
                    let displayStatus = booking.status;
                    if (booking.status === 'confirmed') { statusStyle = 'background: #ecfdf5; color: #10b981;'; displayStatus = state.currentLang === 'ar' ? 'مؤكد' : 'Confirmed'; } 
                    else if (booking.status === 'completed') { statusStyle = 'background: #eff6ff; color: #3b82f6;'; displayStatus = state.currentLang === 'ar' ? 'مكتمل' : 'Completed'; }
                    else if (booking.status === 'cancelled') { statusStyle = 'background: #fef2f2; color: #ef4444;'; displayStatus = state.currentLang === 'ar' ? 'ملغى' : 'Cancelled'; } 
                    else { displayStatus = state.currentLang === 'ar' ? 'قيد الانتظار' : 'Pending'; }

                    resultDiv.innerHTML = `
                        <h4 class="font-bold mb-2">${state.currentLang === 'ar' ? 'تفاصيل الحجز:' : 'Booking Details:'}</h4>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>${state.currentLang === 'ar' ? 'رقم الحجز:' : 'Booking ID:'}</span> <strong style="font-family: monospace;">${escapeHtml(booking.id.substring(0,8).toUpperCase())}</strong></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>${state.currentLang === 'ar' ? 'الاسم:' : 'Patient Name:'}</span> <strong>${escapeHtml(booking.patient_name)}</strong></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>${state.currentLang === 'ar' ? 'التاريخ والوقت:' : 'Date & Time:'}</span> <strong dir="ltr">${escapeHtml(booking.appointment_date)} ${escapeHtml(booking.appointment_time)}</strong></div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; border-top:1px solid var(--border); padding-top:1rem;">
                            <span>${state.currentLang === 'ar' ? 'الحالة الحالية:' : 'Current Status:'}</span> <span class="badge" style="${statusStyle}">${escapeHtml(displayStatus)}</span>
                        </div>`;
                    resultDiv.classList.remove('hidden');
                } else showToast(state.currentLang === 'ar' ? 'لم يتم العثور على الحجز. تأكد من الرقم والهاتف.' : 'Booking not found', 'error');
            } catch (err) { showToast(state.currentLang === 'ar' ? 'خطأ في الاتصال بقاعدة البيانات' : 'Connection Error', 'error'); } 
            finally { setLoading(btn, false, state.currentLang === 'ar' ? 'بحث عن الحجز' : 'Search Booking'); }
        });
    }

    // إعدادات الهاتف والقوائم
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function() { this.value = this.value.replace(/\D/g, ''); if (this.value.length > 10) this.value = this.value.slice(0, 10); });
    });

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.getElementById('navLinks');
    if (hamburgerBtn && navLinks) hamburgerBtn.addEventListener('click', () => navLinks.classList.toggle('show'));
    document.querySelectorAll('.nav-btn').forEach(btn => { btn.addEventListener('click', () => { if (window.innerWidth <= 768) navLinks.classList.remove('show'); }); });
    
    document.addEventListener('click', (event) => {
        if (navLinks && navLinks.classList.contains('show') && window.innerWidth <= 768) {
            if (!navLinks.contains(event.target) && !hamburgerBtn.contains(event.target)) {
                navLinks.classList.remove('show');
            }
        }
    });

    // ربط الأزرار والروابط
    document.querySelectorAll('.nav-btn[data-nav]').forEach(btn => { btn.onclick = () => { if(typeof window.router === 'function') window.router(btn.getAttribute('data-nav')); } });
    const btnEn = document.getElementById('btn-en'); if(btnEn) btnEn.onclick = () => { if(typeof window.setLang === 'function') window.setLang('en'); }
    const btnAr = document.getElementById('btn-ar'); if(btnAr) btnAr.onclick = () => { if(typeof window.setLang === 'function') window.setLang('ar'); }
    const logoHomeBtn = document.getElementById('logoHomeBtn'); if (logoHomeBtn) logoHomeBtn.addEventListener('click', () => { if(typeof window.router === 'function') window.router('home'); });

    // ربط النماذج الأساسية
    const addDoctorForm = document.getElementById('addDoctorForm'); if (addDoctorForm) addDoctorForm.onsubmit = window.handleAddDoctor;
    const logoutBtn = document.getElementById('logoutBtn'); if (logoutBtn) logoutBtn.onclick = window.logoutUser;
    const backToHomeBtn = document.getElementById('backToHomeBtn'); if (backToHomeBtn) backToHomeBtn.onclick = () => { if(typeof window.router === 'function') window.router('home'); };
    const authToggleText = document.getElementById('authToggleText'); if (authToggleText) authToggleText.onclick = window.toggleAuthMode;
    const googleSignInBtn = document.getElementById('googleSignInBtn'); if (googleSignInBtn) googleSignInBtn.onclick = window.handleGoogleSignIn;
    const authSubmitBtn = document.getElementById('authSubmitBtn'); if (authSubmitBtn) authSubmitBtn.onclick = (e) => { e.preventDefault(); window.handleEmailAuth(); };

    // ربط فلاتر البحث
    const searchInput = document.getElementById('searchInput'); if (searchInput) searchInput.oninput = window.filterDoctors;
    const specialtyFilter = document.getElementById('specialtyFilter'); if (specialtyFilter) specialtyFilter.onchange = window.filterDoctors;
    const municipalityFilter = document.getElementById('municipalityFilter'); if (municipalityFilter) municipalityFilter.onchange = window.filterDoctors;

    // زر العودة للأعلى
    const backToTop = document.getElementById('backToTop');
    if(backToTop) {
        window.onscroll = () => { if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) backToTop.classList.remove('hidden'); else backToTop.classList.add('hidden'); };
        backToTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // التنقل بزر المتصفح
    window.onpopstate = (e) => { const view = (e.state && e.state.view) ? e.state.view : 'home'; if(typeof window.router === 'function') window.router(view, false); };
    
    // تشغيل الميزات
    initNewsTicker();
    initChatbot();
});
