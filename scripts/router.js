// ==========================================
// router.js - نظام التوجيه، معالجة الروابط، واللغة
// ==========================================
import { supabaseClient } from './api.js';
import { state, i18n } from './state.js';
import { t, showToast } from './utils.js';
import { updateUserUI, renderDoctors, openDoctorProfileModal, renderDashboardUI } from './ui.js';
import { getCurrentUser } from './auth.js';

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

  // 2. تحديث حالة أزرار التنقل
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-btn[data-nav="${viewName}"]`);
  if (activeNav) activeNav.classList.add('active');

  // 3. تنظيف مسار الرابط (URL Sanitization)
  let basePath = window.location.pathname;
  if (basePath.includes('/doctors/') && viewName !== 'doctor-profile') {
      basePath = '/'; 
      const seoBtn = document.getElementById('seoBackBtn');
      if (seoBtn) seoBtn.remove();
  }

  let finalUrl = basePath;
  if (viewName === 'home') finalUrl = basePath; 
  else finalUrl = basePath + '#' + viewName;

  if (pushHistory) {
      history.pushState({ view: viewName }, '', finalUrl);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 4. تنفيذ الإجراءات الخاصة بالصفحات
  if (viewName === 'home') {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = ''; 
      if(typeof window.loadDoctors === 'function') window.loadDoctors(true); 
  }
  
  if (viewName === 'user-dashboard' && typeof window.loadUserBookings === 'function') window.loadUserBookings();

  const pill = document.getElementById('userPill');
  if (viewName === 'dashboard') {
    if (pill) pill.classList.add('hidden');
  } else {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      updateUserUI(session ? session.user : null);
    }).catch(err => console.error("Error fetching session:", err));
  }
  
  if (viewName === 'admin' && typeof window.loadAdminDashboard === 'function') {
      window.loadAdminDashboard();
  }
};

window.handleSEOAndRender = async function(reset = true) { 
  const urlParams = new URLSearchParams(window.location.search);
  let targetDocId = urlParams.get('doc');
  let targetSlug = null;

  const pathname = window.location.pathname;
  if (pathname.includes('/doctors/') && pathname.endsWith('.html')) {
      const parts = pathname.split('/');
      const filename = parts[parts.length - 1];
      targetSlug = filename.replace('.html', '').toLowerCase();
  }

  if ((targetDocId || targetSlug) && reset) {
      let targetDoc = null;

      if (targetSlug) {
          targetDoc = state.allDoctors.find(d => 
              (d.slug && String(d.slug).toLowerCase() === targetSlug) || 
              (String(d.id).toLowerCase() === targetSlug)
          );
      } else if (targetDocId) {
          targetDocId = targetDocId.trim().toLowerCase();
          targetDoc = state.allDoctors.find(d => String(d.id).trim().toLowerCase() === targetDocId);
      }

      if (!targetDoc) {
          try {
              const searchTerm = targetSlug || targetDocId;
              let { data: fetchedDoc } = await supabaseClient.from('doctors').select('*').ilike('slug', searchTerm).maybeSingle();
              if (!fetchedDoc) {
                  const { data: idDoc } = await supabaseClient.from('doctors').select('*').eq('id', searchTerm).maybeSingle();
                  fetchedDoc = idDoc;
              }
              if (fetchedDoc) {
                  targetDoc = fetchedDoc;
                  if (!state.allDoctors.find(d => d.id === targetDoc.id)) state.allDoctors.push(targetDoc);
              }
          } catch (err) { console.error("❌ خطأ في جلب بيانات الطبيب من الرابط:", err); }
      }

      if (targetDoc) {
          if(typeof window.updateSEOMetaTags === 'function') window.updateSEOMetaTags(targetDoc);
          renderDoctors([targetDoc]); 
          
          const rawName = state.currentLang === 'en' && targetDoc.first_name_en && targetDoc.last_name_en 
              ? `${targetDoc.first_name_en} ${targetDoc.last_name_en}` 
              : `${targetDoc.first_name} ${targetDoc.last_name}`;
          const doctorName = (state.currentLang === 'ar' ? 'د. ' : 'Dr. ') + rawName;
          
          setTimeout(() => {
              try { openDoctorProfileModal(targetDoc, doctorName); } 
              catch(e) { console.error("Error opening modal:", e); }
          }, 300);
          
          let backBtn = document.getElementById('seoBackBtn');
          if(!backBtn) {
             backBtn = document.createElement('button');
             backBtn.id = 'seoBackBtn';
             backBtn.className = 'btn btn-secondary btn-block mb-4';
             backBtn.innerHTML = state.currentLang === 'ar' ? '→ عرض جميع الأطباء المتاحين' : '← View All Available Doctors';
             backBtn.onclick = () => {
                 window.history.pushState({}, document.title, window.location.pathname);
                 window.history.pushState({}, document.title, '/');
                 document.title = state.currentLang === 'ar' ? 'دليل أطباء ولاية غليزان' : 'Relizane Medical Directory';
                 renderDoctors(state.allDoctors);
                 if(typeof window.loadDoctors === 'function') window.loadDoctors(true);
                 backBtn.remove();
             };
             document.getElementById('doctorsList').insertAdjacentElement('beforebegin', backBtn);
          }
          return; 
      }
  }
  renderDoctors(state.allDoctors);
};

window.setLang = function(lang) {
  state.currentLang = lang;
  localStorage.setItem('appLanguage', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  const btnEn = document.getElementById('btn-en'); if (btnEn) btnEn.classList.toggle('active', lang === 'en');
  const btnAr = document.getElementById('btn-ar'); if (btnAr) btnAr.classList.toggle('active', lang === 'ar');

  document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (i18n[lang] && i18n[lang][key]) el.innerHTML = i18n[lang][key]; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const key = el.getAttribute('data-i18n-placeholder'); if (i18n[lang] && i18n[lang][key]) el.placeholder = i18n[lang][key]; });

  const navMap = { 'home': 'navHome', 'track': 'navTrack', 'add-doctor': 'navAdd', 'dashboard': 'navDashboard', 'login': 'navLogin' };
  document.querySelectorAll('[data-nav]').forEach(btn => { const view = btn.getAttribute('data-nav'); if (navMap[view] && i18n[lang] && i18n[lang][navMap[view]]) btn.textContent = i18n[lang][navMap[view]]; });

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
    if(typeof window.populateFilters === 'function') window.populateFilters();
    renderDoctors(state.allDoctors);
  }

  if (state.globalDashboardData && state.globalDashboardDoctorId) {
    renderDashboardUI(state.globalDashboardData, state.globalDashboardDoctorId);
    if(typeof window.renderDoctorAnalytics === 'function') window.renderDoctorAnalytics(state.globalDashboardData.appointments);
  }
  
  if (typeof window.refreshReviewsLanguage === 'function') {
      window.refreshReviewsLanguage();
  }

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
      window.tsAddSpecialty.clear(true); 
      window.tsAddSpecialty.clearOptions();
      Array.from(addSpecSel.options).forEach(opt => window.tsAddSpecialty.addOption({value: opt.value, text: opt.text}));
      window.tsAddSpecialty.setValue(val || ""); 
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
