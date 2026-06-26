// ==========================================
// app.js - المايسترو (الرابط الأساسي للتطبيق)
// ==========================================
import { supabaseClient } from './api.js';
import { state, i18n } from './state.js';
import { t, escapeHtml, formatPhoneNumber, showToast, setLoading } from './utils.js';
import { updateUserUI, updateToggleText, updateSEOMetaTags, renderDoctors, openDoctorProfileModal, renderDashboardUI, generateTimeSlots, displayTimeSlots, openScheduleModal } from './ui.js';
import { isAccountLocked, recordFailedAttempt, resetLoginAttempts, getCurrentUser } from './auth.js';
import { initChatbot } from './chatbot.js'; 
import './gallery.js';
import './reviews.js';
import './booking.js';
import './dashboard.js';

// ✅ ✅ ✅ الاستماع لتغيير حالة المصادقة
let isAuthInitialized = false;
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('🔄 حدث المصادقة:', event);

    // 🔴 التقاط حدث استعادة كلمة المرور
    if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ تم التقاط حدث استعادة كلمة المرور');
        setTimeout(() => {
            window.handleChangePassword();
        }, 500);
    }

    if (['INITIAL_SESSION', 'SIGNED_IN', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
        if (session) {
            console.log('✅ جلسة نشطة:', session.user);
            updateUserUI(session.user);

            // 🟢 التعديل لحل مشكلة التحديث (Refresh Bug):
            if (event === 'SIGNED_IN') {
                const hash = window.location.hash;
                // نوجه للوحة التحكم فقط إذا كان الدخول للتو عبر حساب Google (يوجد توكن في الرابط)
                if (hash.includes('access_token')) {
                    window.router('user-dashboard');
                    window.history.replaceState(null, '', window.location.pathname + '#user-dashboard');
                }
            }
        } else if (event === 'INITIAL_SESSION') {
            updateUserUI(null);
        }
    } else if (event === 'SIGNED_OUT') {
        console.log('❌ تم تسجيل الخروج');
        updateUserUI(null);
    }

    if (!isAuthInitialized) {
        const hash = window.location.hash;
        if (!hash.includes('access_token') && !hash.includes('error=')) {
            const cleanHash = hash.replace('#', '');
const startView = ['home', 'add-doctor', 'booking', 'dashboard', 'login', 'track', 'user-dashboard', 'doctor-profile'].includes(cleanHash) ? cleanHash : 'home';
            window.router(startView, false); // هذا السطر هو الذي يبقيك في صفحتك الحالية
        }
        isAuthInitialized = true;
    }
});
// ✅ التحقق من الجلسة الحالية واللغة عند تحميل الصفحة
window.addEventListener('load', async () => {
    console.log('🔍 التحقق من الجلسة الحالية واللغة...');

    // 🟢 الكود الجديد: استرجاع اللغة المحفوظة أو تعيين العربية كافتراضي
    const savedLang = localStorage.getItem('appLanguage') || 'ar';

    // تأخير بسيط جداً لضمان تحميل عناصر DOM قبل تغيير اللغة
    setTimeout(() => {
        if(typeof window.setLang === 'function') {
            window.setLang(savedLang);
        }
    }, 10);

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        console.log('✅ جلسة موجودة، تحديث الواجهة');
        updateUserUI(session.user);
    } else {
        console.log('❌ لا توجد جلسة');
        updateUserUI(null);
    }
});

// ✅ الدالة المفقودة: تحديث نص زر التبديل
function updateAuthToggle() { 
    document.getElementById('authToggleText').textContent = t(state.isSignUp ? 'hasAccount' : 'noAccount'); 
}

// ==========================================
// 1. نظام التوجيه (Router) واللغة
// ==========================================
window.router = async function(viewName, pushHistory = true) {
  if (viewName === 'add-doctor') {
    const user = await getCurrentUser();
    if (!user) {
      showToast(t('loginRequired'), 'error');
      return window.router('login');
    }
  }
  
  // 1. إخفاء جميع الواجهات وإظهار الواجهة المطلوبة
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.remove('hidden');

  // 2. تحديث حالة أزرار التنقل (Active State)
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-btn[data-nav="${viewName}"]`);
  if (activeNav) activeNav.classList.add('active');

  // ==========================================
  // 🌟 التعديل الهندسي الصارم: تنظيف مسار الرابط (URL Sanitization)
  // ==========================================
  let basePath = window.location.pathname;
  
  // القاعدة: إذا كان المستخدم داخل مسار طبيب (/doctors/...) وطلب الانتقال لأي قسم آخر
  if (basePath.includes('/doctors/') && viewName !== 'doctor-profile') {
      basePath = '/'; // إجبار العودة للمسار الجذري النظيف
      
      // تنظيف الـ DOM من زر العودة الخاص بالـ SEO لتجنب التكرار
      const seoBtn = document.getElementById('seoBackBtn');
      if (seoBtn) seoBtn.remove();
  }

  // بناء الرابط النهائي
  let finalUrl = basePath;
  if (viewName === 'home') {
      // إذا كانت الوجهة هي الرئيسية، نجعل الرابط جذرياً ونظيفاً تماماً
      finalUrl = basePath; 
  } else {
      // لأي قسم آخر، نستخدم نظام الـ Hash المعياري للتطبيق
      finalUrl = basePath + '#' + viewName;
  }

  // تحديث شريط المتصفح بشكل صامت (بدون Refresh)
  if (pushHistory) {
      history.pushState({ view: viewName }, '', finalUrl);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // ==========================================

  // 3. تنفيذ الإجراءات الخاصة بكل صفحة
  if (viewName === 'home') {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = ''; 
      window.loadDoctors(true); 
  }
  
  if (viewName === 'user-dashboard') window.loadUserBookings();

  const pill = document.getElementById('userPill');
  if (viewName === 'dashboard') {
    if (pill) pill.classList.add('hidden');
  } else {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      updateUserUI(session ? session.user : null);
    }).catch(err => console.error("Error fetching session:", err));
  }
  
  // تفعيل لوحة الإدارة 
  if (viewName === 'admin') {
      if (typeof window.loadAdminDashboard === 'function') {
          window.loadAdminDashboard();
      }
  }
};

window.setLang = function(lang) {
  state.currentLang = lang;
  localStorage.setItem('appLanguage', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-ar').classList.toggle('active', lang === 'ar');

  document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (i18n[lang][key]) el.innerHTML = i18n[lang][key]; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const key = el.getAttribute('data-i18n-placeholder'); if (i18n[lang][key]) el.placeholder = i18n[lang][key]; });

  const navMap = { 'home': 'navHome', 'track': 'navTrack', 'add-doctor': 'navAdd', 'dashboard': 'navDashboard', 'login': 'navLogin' };
  document.querySelectorAll('[data-nav]').forEach(btn => { const view = btn.getAttribute('data-nav'); if (navMap[view] && i18n[lang][navMap[view]]) btn.textContent = i18n[lang][navMap[view]]; });

  const specSel = document.getElementById('specialtyFilter');
  if (specSel && specSel.options[0]) specSel.options[0].text = t('allSpecialties');
  const munSel = document.getElementById('municipalityFilter');
  if (munSel && munSel.options[0]) munSel.options[0].text = t('allMunicipalities');

  const addSpecSel = document.querySelector('select[name="Specialty"]');
  if (addSpecSel && addSpecSel.options[0]) addSpecSel.options[0].text = t('selectSpec');
  const addMunSel = document.querySelector('select[name="Municipality"]');
  if (addMunSel && addMunSel.options[0]) addMunSel.options[0].text = t('selectMun');

  if (window.toggleAuthMode) window.toggleAuthMode(true);
  updateUserUI();

  if (state.allDoctors.length > 0) {
    window.populateFilters();
    renderDoctors(state.allDoctors);
  }

if (state.globalDashboardData && state.globalDashboardDoctorId) {
    renderDashboardUI(state.globalDashboardData, state.globalDashboardDoctorId);
    window.renderDoctorAnalytics(state.globalDashboardData.appointments);
  }
 if (typeof window.refreshReviewsLanguage === 'function') {
      window.refreshReviewsLanguage();
  }
  // 🟢 الكود الجديد: إعادة رسم صفحة الطبيب باللغة الجديدة إذا كانت مفتوحة
  const profileView = document.getElementById('view-doctor-profile');
  if (profileView && !profileView.classList.contains('hidden') && window.activeProfileDoctor) {
      const rawName = state.currentLang === 'en' && window.activeProfileDoctor.first_name_en && window.activeProfileDoctor.last_name_en 
          ? `${window.activeProfileDoctor.first_name_en} ${window.activeProfileDoctor.last_name_en}` 
          : `${window.activeProfileDoctor.first_name} ${window.activeProfileDoctor.last_name}`;
      const translatedDocName = (state.currentLang === 'ar' ? 'د. ' : 'Dr. ') + rawName;

      openDoctorProfileModal(window.activeProfileDoctor, translatedDocName);
  }

  setTimeout(() => {
    if (window.tsAddSpecialty && addSpecSel) {
      const val = window.tsAddSpecialty.getValue();
      window.tsAddSpecialty.clear(true); // السطر الجديد
      window.tsAddSpecialty.clearOptions();
      Array.from(addSpecSel.options).forEach(opt => window.tsAddSpecialty.addOption({value: opt.value, text: opt.text}));
      window.tsAddSpecialty.setValue(val || ""); // إزالة if(val) وتعديل هذا السطر
    }
 if (window.tsAddMunicipality && addMunSel) {
      const val = window.tsAddMunicipality.getValue();
      window.tsAddMunicipality.clear(true);
      window.tsAddMunicipality.clearOptions();
      Array.from(addMunSel.options).forEach(opt => window.tsAddMunicipality.addOption({value: opt.value, text: opt.text}));
      window.tsAddMunicipality.setValue(val || "");
    }
  }, 50);
};

// ==========================================
// 2. جلب الأطباء والبحث (Directory)
// ==========================================
const DOCS_PER_PAGE = 12; // عدد الأطباء في كل دفعة
let currentDocPage = 0;
let isFetchingDocs = false;
let filterOptionsLoaded = false;
let globalSpecs = []; // تخزين الاختصاصات
let globalMuns = [];  // تخزين البلديات

window.loadDoctors = async function(reset = true) {
  if (isFetchingDocs) return;
  isFetchingDocs = true;

  const container = document.getElementById('doctorsList');
  let loadMoreBtn = document.getElementById('loadMoreDocsBtn');

  // 1. إنشاء زر "عرض المزيد" ديناميكياً إذا لم يكن موجوداً
  if (!loadMoreBtn) {
    loadMoreBtn = document.createElement('button');
    loadMoreBtn.id = 'loadMoreDocsBtn';
    loadMoreBtn.className = 'btn btn-secondary hidden';
    loadMoreBtn.style = 'margin: 2rem auto; display: block; padding: 0.75rem 2.5rem; font-weight: bold; border-radius: 50px;';
    loadMoreBtn.onclick = () => window.loadDoctors(false);
    container.parentNode.insertBefore(loadMoreBtn, container.nextSibling);
  }

  if (reset) {
    currentDocPage = 0;
    let skeletonHtml = '';
    for(let i=0; i<6; i++) skeletonHtml += `<div class="skeleton-card"><div class="s-header"><div class="s-avatar"></div><div style="flex:1;"><div class="s-line s-w-75" style="height: 16px;"></div><div class="s-line s-w-50"></div></div></div><div class="s-line s-w-100"></div><div class="s-line s-w-100"></div><div class="s-line s-w-100" style="height: 40px; margin-top: 1.5rem;"></div></div>`;
    container.innerHTML = skeletonHtml;
    loadMoreBtn.classList.add('hidden');
  } else {
    currentDocPage++;
    setLoading(loadMoreBtn, true, state.currentLang === 'en' ? 'Loading...' : 'جاري التحميل...');
  }

  try {
    // 2. جلب الفلاتر مرة واحدة فقط لتخفيف الضغط
if (!filterOptionsLoaded) await window.fetchGlobalDirectory();
    const searchQ = (document.getElementById('searchInput')?.value || '').trim();
    const specQ = document.getElementById('specialtyFilter')?.value || '';
    const munQ = document.getElementById('municipalityFilter')?.value || '';

    // 3. بناء الاستعلام المعماري (Server-side Filtering)
    let query = supabaseClient.from('doctors').select('*', { count: 'exact' });

    if (specQ) query = query.eq('specialty', specQ);
    if (munQ) query = query.eq('municipality', munQ);
    if (searchQ) {
      // بحث متقدم في جميع أعمدة الأسماء والموقع
      query = query.or(`first_name.ilike.%${searchQ}%,last_name.ilike.%${searchQ}%,first_name_en.ilike.%${searchQ}%,last_name_en.ilike.%${searchQ}%,exact_location.ilike.%${searchQ}%`);
    }

    // 4. تطبيق الترقيم (Pagination)
    const start = currentDocPage * DOCS_PER_PAGE;
    const end = start + DOCS_PER_PAGE - 1;
    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    // 5. التحديث والرسم
    if (reset) {
        state.allDoctors = data || [];
    } else {
        // إضافة الأطباء الجدد للقائمة الموجودة
        state.allDoctors = [...state.allDoctors, ...(data || [])];
    }

    if (reset && state.allDoctors.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div>${t('noDoctorsFound')}</div></div>`;
    } else {
        window.handleSEOAndRender(reset); 
    }

    // إظهار/إخفاء زر المزيد بناءً على العدد الكلي في السيرفر
    if (count > (currentDocPage + 1) * DOCS_PER_PAGE) {
        loadMoreBtn.classList.remove('hidden');
        setLoading(loadMoreBtn, false, state.currentLang === 'ar' ? 'عرض المزيد ↓' : 'Load More ↓');
    } else {
        loadMoreBtn.classList.add('hidden');
    }

  } catch (err) {
    console.error('Failed to load doctors:', err);
    if (reset) container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>' + t('loadingError') + '</div></div>';
    showToast(t('toastLoadError'), 'error');
  } finally {
    isFetchingDocs = false;
  }
};

window.fetchGlobalDirectory = async function() {
    try {
        // حيلة برمجية: نستخدم تاريخ اليوم لضمان جلب أحدث نسخة من الملف مرة واحدة يومياً
        // مما يقلل استهلاك باقة الإنترنت للمستخدم ويسرع الموقع
        const today = new Date().toISOString().slice(0, 10);

        // جلب الملف الثابت من مسار المشروع
        const response = await fetch(`./doctors-meta.json?v=${today}`);

        if (!response.ok) {
            throw new Error('لم يتم العثور على ملف meta');
        }

        const data = await response.json();

        // تغذية متغيرات النظام بالبيانات المجانية
        state.globalDirectory = data || [];
        globalSpecs = [...new Set(data.map(d => d.specialty).filter(Boolean))].sort();
        globalMuns = [...new Set(data.map(d => d.municipality).filter(Boolean))].sort();

        window.populateFilters();
        filterOptionsLoaded = true;

    } catch (e) {
        console.warn("⚠️ فشل جلب ملف meta، تفعيل الخطة البديلة عبر Supabase...", e);

        // الخطة البديلة (Fallback): الاتصال بقاعدة البيانات في حال فشل الملف
        try {
const { data, error } = await supabaseClient.from('doctors').select('id, slug, first_name, last_name, first_name_en, last_name_en, specialty, municipality, exact_location');
            if (error) throw error;

            state.globalDirectory = data || [];
            globalSpecs = [...new Set(data.map(d => d.specialty).filter(Boolean))].sort();
            globalMuns = [...new Set(data.map(d => d.municipality).filter(Boolean))].sort();

            window.populateFilters();
            filterOptionsLoaded = true;
        } catch (fallbackError) {
            console.error("❌ فشل الخطة البديلة أيضاً:", fallbackError);
        }
    }
};
window.populateFilters = function() {
  const specSel = document.getElementById('specialtyFilter');
  const munSel = document.getElementById('municipalityFilter');

  if (!specSel || !munSel) return;

  // 1. تحديث قائمة التخصصات (Search Specialty)
  if (window.tsSpecialtyFilter) {
    const prevSpec = window.tsSpecialtyFilter.getValue();
    window.tsSpecialtyFilter.clear(true);
    window.tsSpecialtyFilter.clearOptions();
    window.tsSpecialtyFilter.addOption({value: "", text: t('allSpecialties')});
    globalSpecs.forEach(s => window.tsSpecialtyFilter.addOption({value: s, text: t(s)}));
    window.tsSpecialtyFilter.setValue(prevSpec || "");
  } else {
    // في حالة التحميل الأولي قبل عمل TomSelect
    specSel.innerHTML = '<option value="">' + t('allSpecialties') + '</option>';
    globalSpecs.forEach(s => specSel.insertAdjacentHTML('beforeend', `<option value="${s}">${t(s)}</option>`));
  }

  // 2. تحديث قائمة البلديات (Search Municipality)
  if (window.tsMunicipalityFilter) {
    const prevMun = window.tsMunicipalityFilter.getValue();
    window.tsMunicipalityFilter.clear(true);
    window.tsMunicipalityFilter.clearOptions();
    window.tsMunicipalityFilter.addOption({value: "", text: t('allMunicipalities')});
    globalMuns.forEach(m => window.tsMunicipalityFilter.addOption({value: m, text: t(m)}));
    window.tsMunicipalityFilter.setValue(prevMun || "");
  } else {
    munSel.innerHTML = '<option value="">' + t('allMunicipalities') + '</option>';
    globalMuns.forEach(m => munSel.insertAdjacentHTML('beforeend', `<option value="${m}">${t(m)}</option>`));
  }
};

// نمط (Debounce) لحماية السيرفر من الطلبات المتكررة السريعة
let searchTimeout;
window.filterDoctors = function() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const suggestionsDropdown = document.getElementById('searchSuggestions');
    if (suggestionsDropdown) suggestionsDropdown.classList.add('hidden'); // لم نعد بحاجة للاقتراحات المحلية
    window.loadDoctors(true); // جلب البيانات المفلترة الحقيقية من السيرفر
  }, 500); 
};

// ==========================================
// دالة معالجة الروابط وفتح نافذة الطبيب (محدثة لدعم الروابط النظيفة والبحث العميق)
// ==========================================
window.handleSEOAndRender = async function(reset = true) { // 👈 تم تحويلها لـ async
  const urlParams = new URLSearchParams(window.location.search);
  let targetDocId = urlParams.get('doc');
  let targetSlug = null;

  // 🌟 استخراج الـ Slug من الرابط النظيف
  const pathname = window.location.pathname;
  if (pathname.includes('/doctors/') && pathname.endsWith('.html')) {
      const parts = pathname.split('/');
      const filename = parts[parts.length - 1];
      targetSlug = filename.replace('.html', '').toLowerCase();
  }

  // إذا وجدنا هدفاً (سواء عبر الـ Slug النظيف أو الـ ID القديم)
  if ((targetDocId || targetSlug) && reset) {
      let targetDoc = null;

      // 1. البحث أولاً في الذاكرة المحلية (أول 12 طبيب)
      if (targetSlug) {
          targetDoc = state.allDoctors.find(d => 
              (d.slug && String(d.slug).toLowerCase() === targetSlug) || 
              (String(d.id).toLowerCase() === targetSlug)
          );
      } else if (targetDocId) {
          targetDocId = targetDocId.trim().toLowerCase();
          targetDoc = state.allDoctors.find(d => String(d.id).trim().toLowerCase() === targetDocId);
      }

      // 🚨 2. الحل الجذري: إذا لم نجده محلياً، نجلبه من السيرفر مباشرة 🚨
      if (!targetDoc) {
          try {
              const searchTerm = targetSlug || targetDocId;

              // البحث بواسطة Slug أولاً
              let { data: fetchedDoc, error } = await supabaseClient
                  .from('doctors')
                  .select('*')
                  .ilike('slug', searchTerm)
                  .maybeSingle();

              // إذا لم نعثر عليه، قد يكون الرابط القديم يستخدم الـ ID
              if (!fetchedDoc) {
                  const { data: idDoc } = await supabaseClient
                      .from('doctors')
                      .select('*')
                      .eq('id', searchTerm)
                      .maybeSingle();
                  fetchedDoc = idDoc;
              }

              if (fetchedDoc) {
                  targetDoc = fetchedDoc;
                  // حقن الطبيب في الذاكرة المحلية لضمان عمل دالة الحجوزات (openBooking)
                  if (!state.allDoctors.find(d => d.id === targetDoc.id)) {
                      state.allDoctors.push(targetDoc);
                  }
              }
          } catch (err) {
              console.error("❌ خطأ في جلب بيانات الطبيب من الرابط:", err);
          }
      }

      // 3. عرض الطبيب إذا تم العثور عليه (محلياً أو من السيرفر)
      if (targetDoc) {
          updateSEOMetaTags(targetDoc);
          renderDoctors([targetDoc]); // رسم بطاقة هذا الطبيب فقط في الخلفية
          
          const rawName = state.currentLang === 'en' && targetDoc.first_name_en && targetDoc.last_name_en 
              ? `${targetDoc.first_name_en} ${targetDoc.last_name_en}` 
              : `${targetDoc.first_name} ${targetDoc.last_name}`;
          const doctorName = (state.currentLang === 'ar' ? 'د. ' : 'Dr. ') + rawName;
          
          // تأخير بسيط لضمان رسم الواجهة قبل فتح النافذة
          setTimeout(() => {
              try { openDoctorProfileModal(targetDoc, doctorName); } 
              catch(e) { console.error("Error opening modal:", e); }
          }, 300);
          
          // إعداد زر العودة للرئيسية
          let backBtn = document.getElementById('seoBackBtn');
          if(!backBtn) {
             backBtn = document.createElement('button');
             backBtn.id = 'seoBackBtn';
             backBtn.className = 'btn btn-secondary btn-block mb-4';
             backBtn.innerHTML = state.currentLang === 'ar' ? '→ عرض جميع الأطباء المتاحين' : '← View All Available Doctors';
             backBtn.onclick = () => {
                 window.history.pushState({}, document.title, window.location.pathname);
                 // 🌟 عند العودة، نمسح الرابط الخاص بالطبيب من المتصفح لنعود للرئيسية حقاً
                 window.history.pushState({}, document.title, '/');
                 document.title = state.currentLang === 'ar' ? 'دليل أطباء ولاية غليزان' : 'Relizane Medical Directory';
                 renderDoctors(state.allDoctors);
                 window.loadDoctors(true); // إعادة تحميل جميع الأطباء
                 backBtn.remove();
             };
             document.getElementById('doctorsList').insertAdjacentElement('beforebegin', backBtn);
          }
          return; 
      }
  }
  
  // إذا لم يكن هناك طبيب محدد في الرابط، أو لم يتم العثور عليه نهائياً
  renderDoctors(state.allDoctors);
};

// إبقاء الدالة فارغة لتجنب أخطاء المتصفح إذا كانت مربوطة بأحداث قديمة
window.selectSuggestion = function(doctorId) {};

// ==========================================
// 4. نظام الحجوزات ولوحة التحكم (Dashboard)
// ==========================================
window.openBooking = function(doctorId) {
  state.currentDoctor = state.allDoctors.find(d => d.id === doctorId);
  if (!state.currentDoctor) { showToast(state.currentLang === 'ar' ? 'الطبيب غير موجود' : 'Doctor not found', 'error'); return; }

  document.getElementById('bookingDoctorId').value = doctorId;
  const docPrefix = state.currentLang === 'ar' ? 'د.' : 'Dr.';
const rawName = state.currentLang === 'en' && state.currentDoctor.first_name_en && state.currentDoctor.last_name_en 
    ? `${state.currentDoctor.first_name_en} ${state.currentDoctor.last_name_en}` 
    : `${state.currentDoctor.first_name} ${state.currentDoctor.last_name}`;
const doctorName = `${docPrefix} ${escapeHtml(rawName)}`;  
  let infoHtml = `<div class="doctor-header"><div class="avatar">${(state.currentDoctor.first_name?.[0]||'')+(state.currentDoctor.last_name?.[0]||'')}</div><div><div class="font-bold text-lg">${doctorName}</div><div class="text-sm text-gray">${escapeHtml(t(state.currentDoctor.specialty))} • ${escapeHtml(t(state.currentDoctor.municipality))}</div></div></div>`;

  let scheduleHtml = '';
  let wd = {};
  if (state.currentDoctor.working_days) {
    try {
      wd = typeof state.currentDoctor.working_days === 'string' ? JSON.parse(state.currentDoctor.working_days) : state.currentDoctor.working_days;
      const daysKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      let activeDaysHtml = '';
      for(let i=0; i<=6; i++) {
        if(wd[i] && wd[i].active) {
          activeDaysHtml += `<div style="display:flex; justify-content:space-between; padding: 0.375rem 0; border-bottom: 1px dashed var(--border); font-size: 0.875rem;"><span class="font-semibold" style="color: var(--text);">${t(daysKeys[i])}</span><span dir="ltr" style="color: var(--primary); font-weight: 600;">${wd[i].start} - ${wd[i].end}</span></div>`;
        }
      }
      if(activeDaysHtml !== '') scheduleHtml = `<div style="margin-top: 1.25rem; padding: 1rem; background: var(--bg); border-radius: var(--radius); border: 1px solid var(--border);"><div style="display:flex; align-items:center; gap:0.5rem; margin-bottom: 0.75rem;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><h4 style="font-size: 0.95rem; font-weight: bold; color: var(--text); margin:0;">${t('scheduleTitle')}</h4></div>${activeDaysHtml}</div>`;
    } catch(e) {}
  }

  if (scheduleHtml === '') {
    const st = state.currentDoctor.working_days ? '08:00' : '08:00';
    const et = state.currentDoctor.working_days ? '16:00' : '16:00';
    scheduleHtml = `<div style="margin-top: 1.25rem; padding: 1rem; background: var(--bg); border-radius: var(--radius); border: 1px solid var(--border);"><h4 style="font-size: 0.95rem; font-weight: bold; color: var(--text); margin-bottom: 0.5rem;">${t('fallbackTitle')}</h4><div style="font-size: 0.875rem; color: var(--primary); font-weight: 600;" dir="ltr"><span>${t('dailyTxt')}</span> ${st} - ${et}</div></div>`;
  }

  document.getElementById('bookingDoctorInfo').innerHTML = infoHtml + scheduleHtml;
  const dateInput = document.getElementById('apptDateInput');
  const timeContainer = document.getElementById('timeSlotsContainer');
  let timeInputHidden = document.getElementById('apptTimeInput');
  if (!timeInputHidden) {
    timeInputHidden = document.createElement('input');
    timeInputHidden.type = 'hidden';
    timeInputHidden.id = 'apptTimeInput';
    timeInputHidden.name = 'AppointmentTime';
    timeInputHidden.required = true;
    document.querySelector('#bookingForm .grid').appendChild(timeInputHidden);
  }

  dateInput.value = '';
  if (timeContainer) timeContainer.innerHTML = `<div class="text-sm text-gray" style="grid-column: 1 / -1;">${t('selectDateFirst')}</div>`;
  timeInputHidden.value = '';

  dateInput.onchange = function() { window.handleDateSelection(this.value, wd); };

  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
  dateInput.min = new Date(currentDate.getTime() - timezoneOffset).toISOString().split('T')[0];

  window.router('booking');
};

window.handleDateSelection = async function(selectedDateStr, workingDays) {
  const container = document.getElementById('timeSlotsContainer');
  const timeInput = document.getElementById('apptTimeInput');
  if (!container) return;
  container.innerHTML = '';
  if (timeInput) timeInput.value = '';

  if (!selectedDateStr) { container.innerHTML = `<div class="text-sm text-gray" style="grid-column: 1 / -1;">${t('selectDateFirst')}</div>`; return; }
  const selectedDate = new Date(selectedDateStr);
  if (isNaN(selectedDate.getTime())) { container.innerHTML = `<div class="text-sm text-gray" style="grid-column: 1 / -1;">${t('invalidDate')}</div>`; return; }

  const dayNum = selectedDate.getDay();
  let isWorking = true, shiftStart = '08:00', shiftEnd = '16:00';
  if (workingDays && Object.keys(workingDays).length > 0) {
    if (!workingDays[dayNum] || !workingDays[dayNum].active) isWorking = false;
    else { shiftStart = workingDays[dayNum].start; shiftEnd = workingDays[dayNum].end; }
  }

  if (!isWorking) {
    showToast(t('doctorOff'), 'error');
    document.getElementById('apptDateInput').value = '';
    container.innerHTML = `<div class="text-sm text-danger" style="grid-column: 1 / -1; color: var(--danger);">${t('doctorOff')}</div>`;
    return;
  }

  try {
    const { data: bookedSlots, error } = await supabaseClient.from('appointments').select('appointment_time').eq('doctor_id', state.currentDoctor.id).eq('appointment_date', selectedDateStr).neq('status', 'cancelled');
    if (error) throw error;
    const bookedTimes = bookedSlots.map(s => s.appointment_time);
    const allShiftSlots = generateTimeSlots(shiftStart, shiftEnd, 30);
    const finalAvailableSlots = allShiftSlots.filter(slot => !bookedTimes.includes(slot));
    if (finalAvailableSlots.length === 0) {
      container.innerHTML = `<div class="text-sm text-danger" style="grid-column: 1 / -1; color: var(--danger);">${t('noSlots')}</div>`;
      return;
    }
    displayTimeSlots(container, finalAvailableSlots, timeInput);
 } catch (err) {
    showToast(state.currentLang === 'ar' ? 'خطأ في جلب الأوقات: ' + escapeHtml(err.message) : 'Error fetching available times', 'error');
    container.innerHTML = `<div class="text-sm text-danger">خطأ: ${escapeHtml(err.message)}</div>`;
}
};

window.confirmBooking = function() {
  const form = document.getElementById('bookingForm');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const patientName = form.elements['PatientName'].value.trim();
  const apptDate = form.elements['AppointmentDate'].value;
  const apptTime = form.elements['AppointmentTime'].value;

  if (!apptTime) { showToast(state.currentLang === 'ar' ? 'يرجى اختيار وقت الموعد' : 'Please select appointment time', 'error'); return; }

  const doctorName = state.currentDoctor ? `${state.currentDoctor.first_name} ${state.currentDoctor.last_name}` : '';
  document.getElementById('confirmDialogBody').textContent = (state.currentLang === 'ar' ? `المريض: ${patientName} | الطبيب: د. ${doctorName} | التاريخ: ${apptDate} ${apptTime}` : `Patient: ${patientName} | Doctor: Dr. ${doctorName} | Date: ${apptDate} at ${apptTime}`);
  document.getElementById('confirmDialog').classList.remove('hidden');
};

window.closeConfirmDialog = function() { document.getElementById('confirmDialog').classList.add('hidden'); };

window.submitBooking = async function() {
  window.closeConfirmDialog();
  const btn = document.getElementById('bookingBtn');
  setLoading(btn, true);
  const form = document.getElementById('bookingForm');
  const data = Object.fromEntries(new FormData(form));

  try {
    // 1. التقاط رمز Turnstile المخفي الذي ولده Cloudflare
    const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
    const turnstileToken = turnstileResponse ? turnstileResponse.value : null;

    if (!turnstileToken) {
      throw new Error("يرجى إكمال التحقق الأمني (الكابتشا).");
    }

    // 2. جلب بيانات المستخدم وتجهيز البيانات
    const { data: authData } = await supabaseClient.auth.getUser();
    const user = authData ? authData.user : null;
    const finalEmail = data.PatientEmail ? data.PatientEmail.trim() : (user ? user.email : null);

    const bookingPayload = {
      doctor_id: data.DoctorID, 
      patient_name: data.PatientName.trim(), 
      patient_phone: data.PatientPhone.trim(),
      appointment_date: data.AppointmentDate, 
      appointment_time: data.AppointmentTime, 
      status: 'pending',
      user_id: user ? user.id : null, 
      user_email: finalEmail
    };

    // 3. إرسال الطلب إلى Edge Function الآمنة
    const { data: functionResponse, error: functionError } = await supabaseClient.functions.invoke('verify-booking', {
      body: { 
        turnstileToken: turnstileToken, 
        bookingData: bookingPayload 
      }
    });

    if (functionError) throw new Error("خطأ في الاتصال بالخادم الداخلي.");
    if (functionResponse && functionResponse.error) throw new Error(functionResponse.error);

    // 4. الحصول على بيانات الحجز بعد نجاح الإدخال
    const booking = functionResponse.booking;

    form.reset();
    document.getElementById('timeSlotsContainer').innerHTML = `<div class="text-sm text-gray" style="grid-column: 1 / -1;">${t('selectDateFirst')}</div>`;

    const bId = booking.id;
    const shortId = bId.substring(0, 8).toUpperCase();
    const targetDoctorData = state.allDoctors.find(d => d.id === data.DoctorID);
    const bDoctor = targetDoctorData ? `${targetDoctorData.first_name} ${targetDoctorData.last_name}` : '';

    const qrText = state.currentLang === 'ar' 
      ? `تفاصيل الحجز:\nرقم الحجز: ${shortId}\nالمريض: ${data.PatientName}\nالطبيب: د. ${bDoctor}\nالتاريخ: ${data.AppointmentDate}\nالوقت: ${data.AppointmentTime}`
      : `Booking Details:\nID: ${shortId}\nPatient: ${data.PatientName}\nDoctor: Dr. ${bDoctor}\nDate: ${data.AppointmentDate}\nTime: ${data.AppointmentTime}`;

    document.getElementById('eTicketContainer').innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 1.25rem 1rem; text-align: center; color: white; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 290px; margin: 0 auto;">
        <div style="background: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem auto; color: #10b981;">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 style="margin: 0 0 0.25rem 0; font-size: 1.2rem; font-weight: bold;">${state.currentLang === 'ar' ? 'تم تأكيد الحجز' : 'Booking Confirmed'}</h3>
        <div style="font-size: 0.85rem; opacity: 0.95; margin-bottom: 1rem;">${state.currentLang === 'ar' ? 'د.' : 'Dr.'} ${escapeHtml(bDoctor)}</div>
        
        <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7rem; padding-bottom: 0.7rem; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <span style="opacity: 0.9; font-size: 0.85rem;">${state.currentLang === 'ar' ? 'رقم الحجز' : 'Booking ID'}</span>
            <span style="font-family: monospace; font-weight: bold; letter-spacing: 1px; font-size: 1rem;">${shortId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7rem; padding-bottom: 0.7rem; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <span style="opacity: 0.9; font-size: 0.85rem;">${state.currentLang === 'ar' ? 'المريض' : 'Patient'}</span>
            <span style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(data.PatientName)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="opacity: 0.9; font-size: 0.85rem;">${state.currentLang === 'ar' ? 'الوقت' : 'Time'}</span>
            <span dir="ltr" style="font-weight: 600; font-size: 0.85rem;">${data.AppointmentDate} | ${data.AppointmentTime}</span>
          </div>
        </div>
        
        <div style="background: white; padding: 0.4rem; border-radius: 8px; display: inline-block;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrText)}&color=667eea" alt="QR" style="width: 85px; height: 85px; display: block;" />
        </div>
      </div>
    `;
    document.getElementById('successDialog').classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  } finally { setLoading(btn, false); }
};

window.closeSuccessDialog = function() {
  document.getElementById('successDialog').classList.add('hidden');
  window.router('home');
};

window.loadUserBookings = async function() {
  const container = document.getElementById('userBookingsContainer');
  container.innerHTML = `<div class="text-center p-4"><div class="spinner" style="border-top-color: var(--primary); margin: 0 auto; width: 24px; height: 24px;"></div><p class="mt-2 text-gray text-sm">${t('fetchingBookings')}</p></div>`;
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const { data: bookings, error } = await supabaseClient.from('appointments').select(`id, patient_name, appointment_date, appointment_time, status, doctors (first_name, last_name)`).eq('user_id', user.UserID).order('appointment_date', { ascending: false });
    if (error) throw error;
    if (!bookings || bookings.length === 0) {
      container.innerHTML = `<div class='empty-state' style='padding: 2rem 1rem; background: var(--bg); border-radius: var(--radius); border: 1px dashed var(--border);'><div class='empty-state-icon' style='color: var(--primary); opacity: 0.7; margin-bottom: 0.5rem;'><svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div><p style='color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1rem;'>${t('noUserBookings')}</p><button class='btn btn-primary' style='padding: 0.5rem 1rem; font-size: 0.875rem;' onclick="window.router('home')">${t('bookFirstAppt')}</button></div>`;
      return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
    bookings.forEach(b => {
    let statusStyle = 'background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;';
      let statusIndicator = '#f59e0b';
      let displayStatus = t('statusPending');

      if (b.status === 'confirmed') { 
          statusStyle = 'background: #ecfdf5; color: #10b981; border: 1px solid #a7f3d0;'; 
          statusIndicator = '#10b981'; 
          displayStatus = t('statusConfirmed'); 
      } 
      else if (b.status === 'completed') { 
          statusStyle = 'background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe;'; 
          statusIndicator = '#3b82f6'; 
          displayStatus = state.currentLang === 'ar' ? 'مكتمل' : 'Completed'; 
      }
      else if (b.status === 'cancelled') { 
          statusStyle = 'background: #fef2f2; color: #ef4444; border: 1px solid #fecaca;'; 
          statusIndicator = '#ef4444'; 
          displayStatus = t('statusCancelled'); 
      }
      const doctorName = b.doctors 
    ? (state.currentLang === 'en' && b.doctors.first_name_en && b.doctors.last_name_en 
        ? `${b.doctors.first_name_en} ${b.doctors.last_name_en}` 
        : `${b.doctors.first_name} ${b.doctors.last_name}`) 
    : 'طبيب';
      const shortId = b.id.substring(0, 8).toUpperCase();

      html += `
        <div class="card-hover" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
          <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 4px; background: ${statusIndicator};"></div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-right: 0.5rem;">
            <div style="flex: 1; min-width: 250px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <span style="font-family: monospace; font-size: 0.85rem; color: var(--primary); background: var(--bg); padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid var(--border); font-weight: bold;">${shortId}</span>
                <span class="badge" style="${statusStyle}">${displayStatus}</span>
              </div>
<h4 style="font-size: 1.15rem; font-weight: bold; color: var(--text); margin-bottom: 0.25rem;">${state.currentLang === 'ar' ? 'د.' : 'Dr.'} ${escapeHtml(doctorName)}</h4>
<p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">${t('patientLabel')}<span style="color: var(--text); font-weight: 500;">${escapeHtml(b.patient_name)}</span></p>
              <div style="display: flex; align-items: center; gap: 1.5rem; font-size: 0.9rem; border-top: 1px dashed var(--border); padding-top: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-secondary);"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><span dir="ltr" style="font-weight: 600;">${b.appointment_date}</span></div>
                <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-secondary);"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span dir="ltr" style="font-weight: 600;">${b.appointment_time}</span></div>
              </div>
            </div>
          </div>
        </div>`;
    });
    html += `</div><div style="margin-top: 1.5rem; text-align: center;"><button class='btn btn-primary' style='padding: 0.6rem 1.5rem; font-size: 0.95rem; border-radius: 50px;' onclick="window.router('home')"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-inline-end: 0.4rem; vertical-align: middle;"><path d="M12 5v14M5 12h14"></path></svg>${t('bookNewAppointment')}</button></div>`;
    container.innerHTML = html;
  } catch(err) { container.innerHTML = `<div class="text-center p-4 text-danger">خطأ في الاتصال: تعذر جلب المواعيد.</div>`; }
};

window.handleAddDoctor = async function(e) {
  e.preventDefault();
  const user = await getCurrentUser();
  if (!user) { showToast(t('loginRequired'), 'error'); window.router('login'); return; }

  const btn = document.getElementById('addDoctorBtn');
  setLoading(btn, true);
  const data = Object.fromEntries(new FormData(e.target));

  if (!data.Specialty || !data.Municipality) { showToast(state.currentLang === 'ar' ? 'الرجاء اختيار الاختصاص والبلدية.' : 'Please select specialty and municipality.', 'error'); setLoading(btn, false); return; }

  try {
    // 1. التقاط رمز التحقق الخاص بـ Cloudflare
    // نحدد النموذج بدقة (#view-add-doctor) حتى لا يتلخبط مع الرمز الموجود في نموذج الحجز
    const turnstileResponse = document.querySelector('#view-add-doctor [name="cf-turnstile-response"]');
    const turnstileToken = turnstileResponse ? turnstileResponse.value : null;

    if (!turnstileToken) {
      throw new Error("يرجى إكمال التحقق الأمني (الكابتشا).");
    }

  const defaultPassword = data.Phone.replace(/\s/g, '');

    // 2. تجميع بيانات الطبيب بشكل سليم 🌟
    const phone1 = data.Phone ? data.Phone.replace(/\s/g, '') : '';
    const phone2 = data.Phone2 ? data.Phone2.replace(/\s/g, '') : null;

    const payload = {
      p_first_name: data.FirstName.trim(), 
      p_last_name: data.LastName.trim(), 
      p_phone: phone1,      
      p_phone_2: phone2,
      p_exact_location: data.ExactLocation.trim(), 
      p_specialty: data.Specialty.trim(), 
      p_municipality: data.Municipality.trim(),
      p_extra_info: data.ExtraInfo ? data.ExtraInfo.trim() : '', 
      p_raw_password: defaultPassword
    };

    // 3. إرسال الطلب عبر الدالة السحابية الآمنة
    const { data: functionResponse, error: functionError } = await supabaseClient.functions.invoke('verify-add-doctor', {
      body: { turnstileToken: turnstileToken, doctorData: payload }
    });

    if (functionError) throw new Error("خطأ في الاتصال بالخادم الداخلي.");
    if (functionResponse && functionResponse.error) throw new Error(functionResponse.error);

   const responseData = functionResponse.data;
    if (!responseData || !responseData.id) throw new Error(responseData?.error || 'فشل في جلب معرف الطبيب الجديد');

    showToast(t('toastRegisterSuccess') + responseData.id, 'success');

    // نمرر الـ slug المرتجع من السيرفر مباشرة ل دالة الرفع ليكون هو اسم ملف الـ HTML
    window.createDoctorGitHubPageAsync({ 
      first_name: data.FirstName.trim(), 
      last_name: data.LastName.trim(), 
      phone: defaultPassword, 
      exact_location: data.ExactLocation.trim(), 
      specialty: data.Specialty.trim(), 
      municipality: data.Municipality.trim(), 
      extra_info: data.ExtraInfo ? data.ExtraInfo.trim() : '',
      slug: responseData.slug // 🌟 تمرير الرابط النظيف
    }, responseData.id);

    e.target.reset();
    await window.loadDoctors();
    setTimeout(() => window.router('home'), 1500);
  } catch (err) { 
    showToast((state.currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + err.message, 'error'); 
  } 
  finally { setLoading(btn, false); }
};
window.createDoctorGitHubPageAsync = function(doctorData, doctorId) {
  // 🌟 إرسال الرابط النظيف للدالة السحابية
  const finalSlug = doctorData.slug || doctorId; 

  supabaseClient.functions.invoke('create-github-page', { body: { doctorData, doctorId, slug: finalSlug } })
  .then(({ data, error }) => {
    if (!error && data && data.success) showToast('تم إنشاء صفحة الطبيب للـ SEO!', 'success');
  }).catch(err => console.error('Edge Function Error:', err));
};

// ==========================================
// 5. تهيئة التطبيق عند التحميل (Initialization)
// ==========================================
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

          if (booking.status === 'confirmed') { 
              statusStyle = 'background: #ecfdf5; color: #10b981;'; 
              displayStatus = state.currentLang === 'ar' ? 'مؤكد' : 'Confirmed'; 
          } 
          else if (booking.status === 'completed') { 
              statusStyle = 'background: #eff6ff; color: #3b82f6;'; 
              displayStatus = state.currentLang === 'ar' ? 'مكتمل' : 'Completed'; 
          }
          else if (booking.status === 'cancelled') { 
              statusStyle = 'background: #fef2f2; color: #ef4444;'; 
              displayStatus = state.currentLang === 'ar' ? 'ملغى' : 'Cancelled'; 
          } 
          else {
              displayStatus = state.currentLang === 'ar' ? 'قيد الانتظار' : 'Pending';
          }

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

  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', function() { this.value = this.value.replace(/\D/g, ''); if (this.value.length > 10) this.value = this.value.slice(0, 10); });
  });

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');
  if (hamburgerBtn && navLinks) hamburgerBtn.addEventListener('click', () => navLinks.classList.toggle('show'));
  document.querySelectorAll('.nav-btn').forEach(btn => { btn.addEventListener('click', () => { if (window.innerWidth <= 768) navLinks.classList.remove('show'); }); });
// إغلاق القائمة المنسدلة عند النقر خارجها في شاشات الهاتف
document.addEventListener('click', (event) => {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');

  // التحقق مما إذا كانت القائمة مفتوحة والشاشة بحجم الهاتف
  if (navLinks && navLinks.classList.contains('show') && window.innerWidth <= 768) {
    // إذا كان مكان النقر ليس داخل القائمة نفسها، وليس على زر الهامبرغر
    if (!navLinks.contains(event.target) && !hamburgerBtn.contains(event.target)) {
      navLinks.classList.remove('show');
    }
  }
});
  document.querySelectorAll('.nav-btn[data-nav]').forEach(btn => { btn.onclick = () => window.router(btn.getAttribute('data-nav')); });
document.getElementById('btn-en').onclick = () => window.setLang('en');
document.getElementById('btn-ar').onclick = () => window.setLang('ar');
  const addDoctorForm = document.getElementById('addDoctorForm'); if (addDoctorForm) addDoctorForm.onsubmit = window.handleAddDoctor;
  const logoutBtn = document.getElementById('logoutBtn'); if (logoutBtn) logoutBtn.onclick = window.logoutUser;
// --- أزرار صفحة تسجيل دخول الأعضاء ---

  // 1. زر العودة للدليل (يعيدك للصفحة الرئيسية)
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  if (backToHomeBtn) {
      backToHomeBtn.onclick = () => window.router('home');
  }

  // 2. زر تبديل حالة الفورم (لديك حساب بالفعل؟ / إنشاء حساب جديد)
  const authToggleText = document.getElementById('authToggleText');
  if (authToggleText) {
      authToggleText.onclick = window.toggleAuthMode; // دالة موجودة في auth.js
  }

  // 3. زر الدخول باستخدام جوجل
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  if (googleSignInBtn) {
      googleSignInBtn.onclick = window.handleGoogleSignIn; // دالة موجودة في auth.js
  }

  // 4. إرسال فورم تسجيل الدخول/إنشاء الحساب (الزر الأساسي الأزرق)
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  if (authSubmitBtn) {
      authSubmitBtn.onclick = (e) => {
          e.preventDefault(); 
          window.handleEmailAuth(); // دالة موجودة في auth.js
      };
  }
  const searchInput = document.getElementById('searchInput'); if (searchInput) searchInput.oninput = window.filterDoctors;
  const specialtyFilter = document.getElementById('specialtyFilter'); if (specialtyFilter) specialtyFilter.onchange = window.filterDoctors;
  const municipalityFilter = document.getElementById('municipalityFilter'); if (municipalityFilter) municipalityFilter.onchange = window.filterDoctors;

  window.onscroll = () => { const btn = document.getElementById('backToTop'); if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) btn.classList.remove('hidden'); else btn.classList.add('hidden'); };
  document.getElementById('backToTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  window.onpopstate = (e) => { const view = (e.state && e.state.view) ? e.state.view : 'home'; window.router(view, false); };
const logoHomeBtn = document.getElementById('logoHomeBtn');
  if (logoHomeBtn) {
    logoHomeBtn.addEventListener('click', () => window.router('home'));
  }
  // تسجيل الدخول التلقائي للطبيب
  const savedSession = localStorage.getItem('doctorSession');
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      const loginPhone = document.getElementById('loginPhone');
      if (loginPhone) loginPhone.value = session.phone || '';
      const btn = document.getElementById('dashboardLoginBtn');
      if (btn) setLoading(btn, true);

      (async () => {
        try {
          const { data: doctor, error } = await supabaseClient.from('doctors').select('*').eq('id', session.doctorId).eq('session_token', session.sessionToken).maybeSingle();
          if (error) throw error;
          if (doctor && doctor.session_token === session.sessionToken) {
            const { data: appointments } = await supabaseClient.rpc('get_doctor_appointments_secure', { p_doctor_id: doctor.id, p_session_token: doctor.session_token });
            const dashboardData = { doctorName: `${doctor.first_name} ${doctor.last_name}`, workingDays: typeof doctor.working_days === 'object' ? JSON.stringify(doctor.working_days) : (doctor.working_days || '{}'), bookingEnabled: doctor.booking_enabled, appointments: appointments || [], doctorDetails: doctor };
            const loginSection = document.getElementById('loginSection');
            const dashboardSection = document.getElementById('dashboardSection');
            if (loginSection) loginSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.remove('hidden');
            renderDashboardUI(dashboardData, doctor.id);
          } else localStorage.removeItem('doctorSession');
          if (btn) setLoading(btn, false);
        } catch (err) { localStorage.removeItem('doctorSession'); if (btn) setLoading(btn, false); }
      })();
    } catch(e) { localStorage.removeItem('doctorSession'); }
  }

  // ==========================================
  // 🤖 تهيئة الشات بوت من الملف المنفصل
  // ==========================================
  initChatbot(); // 🆕 استدعاء دالة تهيئة الشات بوت

// ==========================================
//   (منع صارم لاختصارات المطور)
// ==========================================

window.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    } 
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);

window.migrateOldDoctors = async function() {
    console.log("🚀 بدء تحديث ملفات GitHub لجميع الأطباء القدامى...");
    try {
        // جلب جميع الأطباء من قاعدة البيانات
        const { data: doctors, error } = await supabaseClient.from('doctors').select('*');
        if (error) throw error;

        console.log(`تم العثور على ${doctors.length} طبيب. جاري إنشاء الملفات التلقائية...`);

        let count = 0;
        for (const doc of doctors) {
            const finalSlug = doc.slug || doc.id; 
            await supabaseClient.functions.invoke('create-github-page', { 
                body: { doctorData: doc, doctorId: doc.id, slug: finalSlug } 
            });
            console.log(`✅ تم بناء ملف: ${finalSlug}.html`);
            count++;
        }
        console.log(`🎉 اكتمل التحديث بنجاح! تم رفع ${count} ملف إلى GitHub.`);
        alert('تمت ترقية جميع ملفات الأطباء القدامى بنجاح!');
    } catch (err) {
        console.error("❌ حدث خطأ أثناء التحديث:", err);
    }
};
// دالة تشغيل الشريط الإخباري
async function initNewsTicker() {
    try {
        // نستخدم تاريخ اليوم لضمان جلب الملف المحدث يومياً
        const today = new Date().toISOString().slice(0, 10);

        // 🌟 السحر هنا: جلب البيانات من ملف JSON المجاني والسريع بدلاً من قاعدة البيانات
        const response = await fetch(`./doctors-meta.json?v=${today}`);

        // إذا لم يكن الملف موجوداً، لا نفعل شيئاً (يظل الشريط مخفياً)
        if (!response.ok) return; 

        const doctorsData = await response.json();

        // 1. حساب عدد الأطباء الكلي
        const totalDoctors = doctorsData.length;

        // 2. حساب عدد البلديات المغطاة (عبر استخراج البلديات الفريدة فقط)
        const uniqueMunicipalities = new Set(doctorsData.map(d => d.municipality).filter(Boolean)).size;

        const tickerTrack = document.getElementById('dynamicNewsTicker');
        const tickerContainer = document.getElementById('news-ticker-container');

        if (!tickerTrack || !tickerContainer) return;

        // 3. تجهيز الجمل الإخبارية
        const messages = [
            `<span class="ticker-item">🌟 انضم إلينا أكثر من <strong style="color: #ea580c; margin: 0 4px; font-size: 1.1rem;">${totalDoctors}</strong> طبيب وطبيبة من مختلف التخصصات.</span>`,
            `<span class="ticker-item">📍 نغطي الآن <strong style="color: #0ea5e9; margin: 0 4px; font-size: 1.1rem;">${uniqueMunicipalities}</strong> بلدية في ولاية غليزان لخدمتكم.</span>`,
            `<span class="ticker-item">📅 احجز موعدك أونلاين أو تواصل مع العيادة مباشرة بكل سهولة وبشكل مجاني.</span>`
        ];

        // 4. تكرار الرسائل لضمان استمرارية دوران الشريط دون انقطاع
        const separator = '<span style="color:#cbd5e1; margin:0 10px;">|</span>';
        const content = messages.join(` ${separator} `) + ` ${separator} ` + messages.join(` ${separator} `);

        tickerTrack.innerHTML = content;

        // 5. إظهار الشريط بعد اكتمال تجهيز المحتوى
        tickerContainer.style.display = 'block'; 

    } catch (error) {
        console.error("فشل تحميل الشريط الإخباري:", error);
    }
}

// تشغيل الدالة فور تحميل الصفحة
document.addEventListener('DOMContentLoaded', initNewsTicker);
