// ==========================================
// app.js - المايسترو (الرابط الأساسي للتطبيق)
// ==========================================
import { supabaseClient } from './api.js';
import { state, i18n } from './state.js';
import { t, escapeHtml, formatPhoneNumber, showToast, setLoading } from './utils.js';
import { updateUserUI, updateToggleText, updateSEOMetaTags, renderDoctors, openDoctorProfileModal, renderDashboardUI, generateTimeSlots, displayTimeSlots, openScheduleModal } from './ui.js';
import { isAccountLocked, recordFailedAttempt, resetLoginAttempts, getCurrentUser } from './auth.js';
import { initChatbot } from './chatbot.js'; // 🆕 استيراد الشات بوت من الملف المنفصل

const REVIEWS_PER_PAGE = 11;
let currentReviewPage = 0;
let currentReviewsDoctorId = null;

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
// ✅ التحقق من الجلسة الحالية عند تحميل الصفحة
window.addEventListener('load', async () => {
    console.log('🔍 التحقق من الجلسة الحالية...');
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

  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-btn[data-nav="${viewName}"]`);
  if (activeNav) activeNav.classList.add('active');

  if (pushHistory) history.pushState({ view: viewName }, '', '#' + viewName);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewName === 'home') window.loadDoctors();
  if (viewName === 'user-dashboard') window.loadUserBookings();

  const pill = document.getElementById('userPill');
  if (viewName === 'dashboard') {
    if (pill) pill.classList.add('hidden');
  } else {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      updateUserUI(session ? session.user : null);
    }).catch(err => console.error("Error fetching session:", err));
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
  }
  if (currentReviewsDoctorId) {
      fetchReviewStats(currentReviewsDoctorId);
      currentReviewPage = 0; // إعادة عداد الصفحات للصفر ليجلب الصفحة الأولى باللغة الجديدة
      fetchReviewsPage(currentReviewsDoctorId, 0);
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
      window.tsAddSpecialty.clearOptions();
      Array.from(addSpecSel.options).forEach(opt => window.tsAddSpecialty.addOption({value: opt.value, text: opt.text}));
      if(val) window.tsAddSpecialty.setValue(val);
    }
    if (window.tsAddMunicipality && addMunSel) {
      const val = window.tsAddMunicipality.getValue();
      window.tsAddMunicipality.clearOptions();
      Array.from(addMunSel.options).forEach(opt => window.tsAddMunicipality.addOption({value: opt.value, text: opt.text}));
      if(val) window.tsAddMunicipality.setValue(val);
    }
  }, 50);
};

// ==========================================
// 2. جلب الأطباء والبحث (Directory)
// ==========================================
window.loadDoctors = async function() {
  const container = document.getElementById('doctorsList');
  let skeletonHtml = '';
  for(let i=0; i<6; i++) {
    skeletonHtml += `<div class="skeleton-card"><div class="s-header"><div class="s-avatar"></div><div style="flex:1;"><div class="s-line s-w-75" style="height: 16px;"></div><div class="s-line s-w-50"></div></div></div><div class="s-line s-w-100"></div><div class="s-line s-w-100"></div><div class="s-line s-w-100" style="height: 40px; margin-top: 1.5rem;"></div></div>`;
  }
  container.innerHTML = skeletonHtml;

  try {
    const { data, error } = await supabaseClient.from('doctors').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    state.allDoctors = data || [];
    window.handleSEOAndRender();
  } catch (err) {
    console.error('Failed to load doctors:', err);
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>' + t('loadingError') + '</div></div>';
    showToast(t('toastLoadError'), 'error');
  }
};

window.handleSEOAndRender = function() {
  const urlParams = new URLSearchParams(window.location.search);
  let targetDocId = urlParams.get('doc');
  
  if (targetDocId) {
      targetDocId = targetDocId.trim().toLowerCase(); 
      const targetDoc = state.allDoctors.find(d => String(d.id).trim().toLowerCase() === targetDocId);
      
      if (targetDoc) {
          updateSEOMetaTags(targetDoc);
          renderDoctors([targetDoc]);
          window.populateFilters();
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
                 document.title = state.currentLang === 'ar' ? 'دليل أطباء ولاية غليزان' : 'Relizane Medical Directory';
                 renderDoctors(state.allDoctors);
                 backBtn.remove();
             };
             document.getElementById('doctorsList').insertAdjacentElement('beforebegin', backBtn);
          }
          return; 
      }
  }
  renderDoctors(state.allDoctors);
  window.populateFilters();
};

window.populateFilters = function() {
  const specs = [...new Set(state.allDoctors.map(d => d.specialty).filter(Boolean))].sort();
  const muns = [...new Set(state.allDoctors.map(d => d.municipality).filter(Boolean))].sort();
  const specSel = document.getElementById('specialtyFilter');
  const munSel = document.getElementById('municipalityFilter');
  const prevSpec = specSel.value;
  const prevMun = munSel.value;
  
  specSel.innerHTML = '<option value="">' + t('allSpecialties') + '</option>';
  munSel.innerHTML = '<option value="">' + t('allMunicipalities') + '</option>';
  
  specs.forEach(s => { const opt = document.createElement('option'); opt.value = s; opt.textContent = t(s); specSel.appendChild(opt); });
  muns.forEach(m => { const opt = document.createElement('option'); opt.value = m; opt.textContent = t(m); munSel.appendChild(opt); });
  
  if (prevSpec && specs.includes(prevSpec)) specSel.value = prevSpec;
  if (prevMun && muns.includes(prevMun)) munSel.value = prevMun;
  
  if (window.tsSpecialtyFilter) { window.tsSpecialtyFilter.clearOptions(); Array.from(specSel.options).forEach(opt => window.tsSpecialtyFilter.addOption({value: opt.value, text: opt.text})); window.tsSpecialtyFilter.setValue(prevSpec); }
  if (window.tsMunicipalityFilter) { window.tsMunicipalityFilter.clearOptions(); Array.from(munSel.options).forEach(opt => window.tsMunicipalityFilter.addOption({value: opt.value, text: opt.text})); window.tsMunicipalityFilter.setValue(prevMun); }
  
  window.filterDoctors();
};

window.filterDoctors = function() {
  const searchInput = document.getElementById('searchInput');
  const search = searchInput.value.toLowerCase().trim();
  const spec = document.getElementById('specialtyFilter').value;
  const mun = document.getElementById('municipalityFilter').value;
  const suggestionsDropdown = document.getElementById('searchSuggestions');
  
  const filtered = state.allDoctors.filter(doc => {
      const text = `${doc.first_name||''} ${doc.last_name||''} ${doc.specialty||''} ${doc.municipality||''} ${doc.exact_location||''}`.toLowerCase();
      return (!search || text.includes(search)) && (!spec || doc.specialty === spec) && (!mun || doc.municipality === mun);
  });
  
  renderDoctors(filtered);
  
  if (!suggestionsDropdown) return;
  if (search.length < 2) { suggestionsDropdown.classList.add('hidden'); return; }
  
  const suggestionsHtml = filtered.slice(0, 5).map(doc => {
      const avatarText = (doc.first_name?.[0] || '') + (doc.last_name?.[0] || '');
const rawName = state.currentLang === 'en' && doc.first_name_en && doc.last_name_en 
    ? `${doc.first_name_en} ${doc.last_name_en}` 
    : `${doc.first_name} ${doc.last_name}`;
const doctorName = escapeHtml(rawName);
      return `
      <div class="suggestion-item" onclick="window.selectSuggestion('${doc.id}')">
          <div class="sugg-avatar">${avatarText}</div>
          <div style="flex: 1; min-width: 0;">
              <div style="font-weight: bold; font-size: 0.95rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${state.currentLang === 'ar' ? 'د.' : 'Dr.'} ${doctorName}
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${escapeHtml(t(doc.specialty))} - ${escapeHtml(t(doc.municipality))}
              </div>
          </div>
      </div>`;
  }).join('');
  
  if (suggestionsHtml) { 
      suggestionsDropdown.innerHTML = suggestionsHtml; 
      suggestionsDropdown.classList.remove('hidden'); 
  } else { 
      suggestionsDropdown.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">${t('noDoctorsFound')}</div>`; 
      suggestionsDropdown.classList.remove('hidden'); 
  }
};

window.selectSuggestion = function(doctorId) {
  const doc = state.allDoctors.find(d => d.id === doctorId);
  if (doc) {
      document.getElementById('searchInput').value = doc.first_name + ' ' + doc.last_name;
      document.getElementById('searchSuggestions').classList.add('hidden');
      renderDoctors([doc]);
  }
};

// ==========================================
// 3. نظام التقييمات (Pagination & Stats)
// ==========================================
window.openFullReviewsPage = async function(doctorId) {
  currentReviewsDoctorId = doctorId;
  currentReviewPage = 0;
  document.getElementById('reviewDoctorId').value = doctorId; 
  
  window.router('doctor-reviews');
  
  const user = await getCurrentUser();
  if (user) {
      document.getElementById('addReviewSectionFull').classList.remove('hidden');
      document.getElementById('loginToReviewMsgFull').classList.add('hidden');
  } else {
      document.getElementById('addReviewSectionFull').classList.add('hidden');
      document.getElementById('loginToReviewMsgFull').classList.remove('hidden');
  }

  const container = document.getElementById('fullReviewsContainer');
  container.innerHTML = `<div class="text-center p-4 text-gray"><div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--primary);"></div>جاري التحميل...</div>`;
  document.getElementById('loadMoreReviewsBtn').classList.add('hidden');

  await Promise.all([ fetchReviewStats(doctorId), fetchReviewsPage(doctorId, currentReviewPage) ]);
};

async function fetchReviewStats(doctorId) {
  try {
      const { data: stats, error } = await supabaseClient.from('reviews').select('rating').eq('doctor_id', doctorId);
      if (error) throw error;
      const totalReviews = stats.length;
      document.getElementById('fullTotalReviews').textContent = totalReviews;
      if (totalReviews === 0) {
          document.getElementById('fullAvgRating').textContent = "0.0";
          document.getElementById('fullStarDisplay').innerHTML = '<span style="color:#e2e8f0;">★★★★★</span>';
          document.getElementById('ratingBarsContainer').innerHTML = '';
          return;
      }
      const sum = stats.reduce((acc, curr) => acc + curr.rating, 0);
      const avg = (sum / totalReviews).toFixed(1);
      document.getElementById('fullAvgRating').textContent = avg;
      const fullStars = Math.floor(avg);
      const emptyStars = 5 - fullStars;
      document.getElementById('fullStarDisplay').innerHTML = '★'.repeat(fullStars) + '<span style="color:#e2e8f0;">' + '★'.repeat(emptyStars) + '</span>';
      
      const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      stats.forEach(r => ratingCounts[r.rating]++);
      let barsHtml = '';
      for (let i = 5; i >= 1; i--) {
          const percentage = ((ratingCounts[i] / totalReviews) * 100).toFixed(0);
barsHtml += `<div class="rating-bar-row"><span style="width: 45px;">${i} ${t('starsText')}</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width: ${percentage}%;"></div></div><span style="width: 35px; text-align: right;" dir="ltr">${percentage}%</span></div>`;
      }
      document.getElementById('ratingBarsContainer').innerHTML = barsHtml;
  } catch (err) { console.error("خطأ الإحصائيات:", err); }
}

async function fetchReviewsPage(doctorId, pageIndex) {
  const container = document.getElementById('fullReviewsContainer');
  const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
  const start = pageIndex * REVIEWS_PER_PAGE;
  const end = start + (REVIEWS_PER_PAGE - 1);

  try {
      const { data: reviews, error } = await supabaseClient.from('reviews').select('*').eq('doctor_id', doctorId).order('created_at', { ascending: false }).range(start, end);
      if (error) throw error;
      if (pageIndex === 0) container.innerHTML = '';
      if (!reviews || reviews.length === 0) {
          if (pageIndex === 0) container.innerHTML = `<div class="card text-center text-gray" style="padding: 2rem;">لا توجد تقييمات حتى الآن.</div>`;
          loadMoreBtn.classList.add('hidden');
          return;
      }
      const currentUser = await getCurrentUser();
      const reviewsHtml = reviews.map(r => {
          const isPending = r.status === 'pending';
          const pendingBadge = isPending ? `<span style="font-size: 0.7rem; background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; margin-inline-start: 8px;">قيد المراجعة</span>` : '';
          const dateStr = new Date(r.created_at).toLocaleDateString(state.currentLang === 'ar' ? 'ar-DZ' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          const avatarChar = (r.patient_name ? r.patient_name.charAt(0) : 'U').toUpperCase();
          
          return `
          <div class="review-card" id="review-${r.id}" style="${isPending ? 'opacity: 0.8;' : ''}">
              <div class="review-card-header">
                  <div class="review-user-info">
                      <div class="review-avatar">${avatarChar}</div>
                      <div>
                          <div style="font-weight: 900; color: #0f172a; font-size: 1.05rem;">${escapeHtml(r.patient_name || 'مستخدم')} ${pendingBadge}</div>
                          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                              <div style="color: #f59e0b; font-size: 0.95rem; letter-spacing: 1px;">${'★'.repeat(r.rating)}<span style="color:#e2e8f0">${'★'.repeat(5 - r.rating)}</span></div>
                              <span style="color: #cbd5e1; font-size: 0.8rem;">•</span>
                              <div style="font-size: 0.8rem; color: #64748b; font-weight: 500;">${dateStr}</div>
                          </div>
                      </div>
                  </div>
                  ${currentUser && r.user_id === currentUser.UserID ? `<button onclick="window.deleteReview('${r.id}', '${doctorId}')" class="delete-review-btn" title="حذف التقييم"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg></button>` : ''}
              </div>
              <div class="review-content-text">${escapeHtml(r.comment)}</div>
          </div>`;
      }).join('');
      container.insertAdjacentHTML('beforeend', reviewsHtml);
      if (reviews.length === REVIEWS_PER_PAGE) {
          loadMoreBtn.classList.remove('hidden');
setLoading(loadMoreBtn, false, t('loadMoreReviewsText') + ' (11) ↓');
      } else {
          loadMoreBtn.classList.add('hidden');
      }
  } catch (err) { console.error("خطأ جلب التقييمات:", err); }
}

window.loadNextReviewsPage = function() {
  currentReviewPage++;
  const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
setLoading(loadMoreBtn, true, state.currentLang === 'en' ? 'Loading...' : 'جاري التحميل...');
    fetchReviewsPage(currentReviewsDoctorId, currentReviewPage);
};

window.deleteReview = async function(reviewId, doctorId) {
  if (!confirm(state.currentLang === 'ar' ? 'هل أنت متأكد أنك تريد حذف تقييمك بشكل نهائي؟' : 'Are you sure you want to delete your review?')) return;
  try {
    const reviewDiv = document.getElementById('review-' + reviewId);
    if(reviewDiv) reviewDiv.style.opacity = '0.5';
    const { error } = await supabaseClient.from('reviews').update({ status: 'deleted' }).eq('id', reviewId);
    if (error) throw error;
    showToast(state.currentLang === 'ar' ? 'تم حذف التقييم بنجاح' : 'Review deleted successfully', 'success');
    window.openFullReviewsPage(doctorId);
  } catch (err) {
    console.error('❌ خطأ في حذف التقييم:', err);
    showToast((state.currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + err.message, 'error');
    const reviewDiv = document.getElementById('review-' + reviewId);
    if(reviewDiv) reviewDiv.style.opacity = '1';
  }
};

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
    showToast(state.currentLang === 'ar' ? 'خطأ في جلب الأوقات: ' + err.message : 'Error fetching available times', 'error');
    container.innerHTML = `<div class="text-sm text-danger">خطأ: ${err.message}</div>`;
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
    const { data: { user } } = await supabaseClient.auth.getUser();
    const finalEmail = data.PatientEmail ? data.PatientEmail.trim() : (user ? user.email : null);
    
    // 1. التقاط رمز Turnstile المخفي الذي ولده Cloudflare
    const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
    const turnstileToken = turnstileResponse ? turnstileResponse.value : null;

    if (!turnstileToken) {
      throw new Error("يرجى إكمال التحقق الأمني (الكابتشا).");
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    const finalEmail = data.PatientEmail ? data.PatientEmail.trim() : (user ? user.email : null);
    
    // 2. تجهيز بيانات الحجز
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
    
    // الحصول على بيانات الحجز بعد نجاح الإدخال
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
    showToast(t('toastBookingError') + err.message, 'error');
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
      if (b.status === 'confirmed') { statusStyle = 'background: #ecfdf5; color: #10b981; border: 1px solid #a7f3d0;'; statusIndicator = '#10b981'; displayStatus = t('statusConfirmed'); } 
      else if (b.status === 'cancelled') { statusStyle = 'background: #fef2f2; color: #ef4444; border: 1px solid #fecaca;'; statusIndicator = '#ef4444'; displayStatus = t('statusCancelled'); }
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
              <h4 style="font-size: 1.15rem; font-weight: bold; color: var(--text); margin-bottom: 0.25rem;">${state.currentLang === 'ar' ? 'د.' : 'Dr.'} ${doctorName}</h4>
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">${t('patientLabel')}<span style="color: var(--text); font-weight: 500;">${b.patient_name}</span></p>
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

window.handleDashboardLogin = async function(e) {
  if (e) e.preventDefault();
  if (isAccountLocked()) return;
  const btn = document.getElementById('dashboardLoginBtn');
  setLoading(btn, true);
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginDoctorPassword').value.trim();
  if (!phone || !password) { setLoading(btn, false); showToast('يرجى ملء جميع الحقول', 'error'); return; }

  try {
    const { data: responseData, error: rpcError } = await supabaseClient.rpc('login_doctor_secure', { p_phone: phone, p_raw_password: password });
    if (rpcError) throw new Error('خطأ في الاتصال بقاعدة البيانات');
    if (!responseData || !responseData.success) throw new Error(responseData?.error || 'بيانات الدخول غير صحيحة');

    const { data: fullDoctorData } = await supabaseClient.from('doctors').select('*').eq('id', responseData.doctor.id).single();
    const doctor = fullDoctorData ? { ...fullDoctorData, session_token: responseData.doctor.session_token } : responseData.doctor;        
    const { data: appointments, error: apptError } = await supabaseClient.rpc('get_doctor_appointments_secure', { p_doctor_id: doctor.id, p_session_token: doctor.session_token });

    resetLoginAttempts();
    localStorage.setItem('doctorSession', JSON.stringify({ doctorId: doctor.id, phone: doctor.phone, sessionToken: doctor.session_token }));
    
    const dashboardData = {
      doctorName: `${doctor.first_name} ${doctor.last_name}`,
      workingDays: typeof doctor.working_days === 'object' ? JSON.stringify(doctor.working_days) : (doctor.working_days || '{}'),
      bookingEnabled: doctor.booking_enabled, appointments: appointments || [], doctorDetails: doctor
    };
    
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    renderDashboardUI(dashboardData, doctor.id);
    showToast('تم تسجيل الدخول بنجاح', 'success');
  } catch (err) {
    recordFailedAttempt();
    showToast(t('toastLoginError') + (err.message || 'تحقق من البيانات المدخلة'), 'error');
  } finally { setLoading(btn, false); }
};

window.logoutDashboard = async function() {
  const sessionStr = localStorage.getItem('doctorSession');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      await supabaseClient.from('doctors').update({ session_token: null }).eq('id', session.doctorId);
    } catch (err) {}
  }
  localStorage.removeItem('doctorSession');
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('dashboardSection').classList.add('hidden');
  document.getElementById('loginPhone').value = '';
  document.getElementById('loginDoctorPassword').value = '';
  showToast('تم تسجيل الخروج بنجاح', 'success');
  window.router('home');
};

window.handleToggleBooking = async function(e) {
  const isChecked = e.target.checked;
  const sessionStr = localStorage.getItem('doctorSession');
  if (!sessionStr) { showToast('يرجى تسجيل الدخول', 'error'); return; }
  const session = JSON.parse(sessionStr);
  const toggleSwitch = document.getElementById('bookingToggleSwitch');
  toggleSwitch.disabled = true;

  try {
    const { error } = await supabaseClient.rpc('update_doctor_settings_secure', { p_doctor_id: session.doctorId, p_session_token: session.sessionToken, p_booking_enabled: isChecked });
    if (error) throw error;
    showToast(t('toastToggleSuccess'), 'success');
    updateToggleText(isChecked);
    const docIndex = state.allDoctors.findIndex(d => d.id === session.doctorId);
    if (docIndex > -1) state.allDoctors[docIndex].booking_enabled = isChecked;
  } catch (err) {
    e.target.checked = !isChecked;
    showToast(t('toastToggleError') + ': ' + err.message, 'error');
  } finally { toggleSwitch.disabled = false; }
};

window.saveWorkingHours = async function() {
  const sessionStr = localStorage.getItem('doctorSession');
  if (!sessionStr) return;
  const session = JSON.parse(sessionStr);
  const btn = document.getElementById('saveHoursBtn');
  setLoading(btn, true, 'حفظ الأوقات');
  const workingDaysData = {};
  for (let i = 0; i <= 6; i++) {
    workingDaysData[i.toString()] = { 
      active: document.getElementById(`day_active_${i}`).checked, 
      start: document.getElementById(`day_start_${i}`).value, 
      end: document.getElementById(`day_end_${i}`).value 
    };
  }
  try {
    const { error } = await supabaseClient.rpc('update_doctor_settings_secure', { p_doctor_id: session.doctorId, p_session_token: session.sessionToken, p_working_days: workingDaysData });
    if (error) throw error;
    showToast('تم حفظ أوقات وأيام العمل بنجاح', 'success');
    const docIndex = state.allDoctors.findIndex(d => d.id === session.doctorId);
    if(docIndex > -1) state.allDoctors[docIndex].working_days = workingDaysData;
  } catch(err) { showToast('خطأ: ' + err.message, 'error'); } 
  finally { setLoading(btn, false, 'حفظ الأوقات'); }
};

window.saveClinicProfile = async function() {
  const sessionStr = localStorage.getItem('doctorSession');
  if (!sessionStr) return;
  const session = JSON.parse(sessionStr);
  const btn = document.getElementById('saveProfileBtn');
  setLoading(btn, true, 'جاري الحفظ...');

  try {
    const formattedServices = [];
    document.querySelectorAll('.service-row').forEach(row => {
      const category = row.querySelector('.svc-category').value.trim();
      const itemsStr = row.querySelector('.svc-items').value.trim();
      if (category || itemsStr) formattedServices.push({ category: category || 'خدمات عامة', items: itemsStr ? itemsStr.split(/[,،]/).map(i => i.trim()).filter(Boolean) : [] });
    });

    const certificatesText = document.getElementById('dash_certificates') ? document.getElementById('dash_certificates').value.trim() : '';
    let finalImageUrls = [...window.dashboardCurrentImages]; 
    const fileInput = document.getElementById('dash_clinic_images');
    
    if (fileInput && fileInput.files.length > 0) {
      const filesToUpload = Array.from(fileInput.files).slice(0, 3);
      const base64Images = await Promise.all(filesToUpload.map(async file => {
        return { name: file.name, base64: await new Promise(resolve => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(file); }) };
      }));
      const { data, error } = await supabaseClient.functions.invoke('upload-github-images', { body: { doctorId: session.doctorId, images: base64Images } });
      if (error) throw new Error("فشل رفع الصور: " + error.message);
      if (data && data.urls) finalImageUrls = [...finalImageUrls, ...data.urls];
    }
// 🔴 قراءة الأسماء من الحقول
const firstNameAr = document.getElementById('dash_first_name_ar').value.trim();
const lastNameAr = document.getElementById('dash_last_name_ar').value.trim();
const firstNameEn = document.getElementById('dash_first_name_en') ? document.getElementById('dash_first_name_en').value.trim() : '';
const lastNameEn = document.getElementById('dash_last_name_en') ? document.getElementById('dash_last_name_en').value.trim() : '';

// التحقق من أن الاسم العربي ليس فارغاً (لأنه إجباري)
if (!firstNameAr || !lastNameAr) {
    showToast(state.currentLang === 'ar' ? 'الاسم واللقب بالعربية إجباريان' : 'Arabic First and Last names are required', 'error');
    setLoading(btn, false);
    return;
}
    const contactEmail = document.getElementById('dash_contact_email').value.trim();
    const whatsapp = document.getElementById('dash_whatsapp').value.trim();
    const facebook = document.getElementById('dash_facebook').value.trim();
    const mapLink = document.getElementById('dash_map_link').value.trim();

   // إرسال البيانات المحدثة إلى Supabase (13 متغيراً بالتمام)
        const { error: dbError } = await supabaseClient.rpc('update_clinic_profile_secure', {
            p_doctor_id: session.doctorId,
            p_session_token: session.sessionToken,
            p_first_name: firstNameAr,
            p_last_name: lastNameAr,
            p_first_name_en: firstNameEn,
            p_last_name_en: lastNameEn,
            p_contact_email: contactEmail,
            p_whatsapp_number: whatsapp,
            p_facebook_link: facebook,
            p_map_link: mapLink,
            p_services: formattedServices,
            p_certificates: certificatesText,
            p_clinic_images: finalImageUrls
        });

        if (dbError) throw dbError;

        // تحديث المصفوفة المحلية
        const docIndex = state.allDoctors.findIndex(d => d.id === session.doctorId);
        if (docIndex > -1) {
            state.allDoctors[docIndex] = { 
                ...state.allDoctors[docIndex], 
                first_name: firstNameAr,
                last_name: lastNameAr,
                first_name_en: firstNameEn,
                last_name_en: lastNameEn,
                contact_email: contactEmail, 
                whatsapp_number: whatsapp, 
                facebook_link: facebook, 
                map_link: mapLink, 
                services: formattedServices, 
                certificates: certificatesText, 
                clinic_images: finalImageUrls 
            };
            window.createDoctorGitHubPageAsync(state.allDoctors[docIndex], session.doctorId);
        }
    setTimeout(() => location.reload(), 1000);
  } catch (err) { showToast('خطأ: ' + err.message, 'error'); } 
  finally { setLoading(btn, false, 'حفظ التغييرات'); if (document.getElementById('dash_clinic_images')) document.getElementById('dash_clinic_images').value = ''; }
};

window.changeBookingStatus = async function(bookingId, newStatus, userEmail, doctorName, appointmentDate) {
  const confirmMsg = newStatus === 'confirmed' ? (state.currentLang === 'ar' ? 'هل أنت متأكد من تأكيد هذا الموعد؟' : 'Are you sure you want to confirm this appointment?') : (state.currentLang === 'ar' ? 'هل أنت متأكد من إلغاء هذا الموعد؟' : 'Are you sure you want to cancel this appointment?');
  if (!confirm(confirmMsg)) return;

  try {
    const sessionStr = localStorage.getItem('doctorSession');
    if (!sessionStr) throw new Error('يرجى تسجيل الدخول مجدداً');
    const session = JSON.parse(sessionStr);

    const { error } = await supabaseClient.rpc('update_booking_status_secure', { p_booking_id: bookingId, p_new_status: newStatus, p_doctor_id: session.doctorId, p_session_token: session.sessionToken });
    if (error) throw error;

    if (newStatus === 'confirmed' && userEmail && userEmail.trim() !== '' && userEmail !== 'null' && userEmail !== 'undefined') {
      supabaseClient.functions.invoke('send-booking-email', { body: { userEmail, doctorName, appointmentDate } })
      .then(({ error: funcError }) => {
        if (funcError) showToast('حدث خطأ أثناء إرسال إيميل التأكيد.', 'error');
        else showToast('تم تأكيد الموعد وإرسال إيميل للمريض.', 'success');
      });
    }

    showToast(state.currentLang === 'ar' ? 'تم تحديث حالة الحجز بنجاح' : 'Booking status updated successfully', 'success');
    const { data: updatedAppointments, error: fetchError } = await supabaseClient.rpc('get_doctor_appointments_secure', { p_doctor_id: session.doctorId, p_session_token: session.sessionToken });
    if (fetchError) throw fetchError;
    if (state.globalDashboardData) {
      state.globalDashboardData.appointments = updatedAppointments || [];
      renderDashboardUI(state.globalDashboardData, state.globalDashboardDoctorId);
    }
  } catch (err) { showToast(state.currentLang === 'ar' ? 'خطأ في تحديث الحالة: ' + err.message : 'Error updating status: ' + err.message, 'error'); }
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
    const defaultPassword = data.Phone.replace(/\s/g, '');
    const { data: responseData, error } = await supabaseClient.rpc('register_doctor_secure', {
      p_first_name: data.FirstName.trim(), p_last_name: data.LastName.trim(), p_phone: defaultPassword,
      p_exact_location: data.ExactLocation.trim(), p_specialty: data.Specialty.trim(), p_municipality: data.Municipality.trim(),
      p_extra_info: data.ExtraInfo ? data.ExtraInfo.trim() : '', p_raw_password: defaultPassword
    });
    if (error) throw error;
    if (!responseData || !responseData.id) throw new Error(responseData?.error || 'فشل في جلب معرف الطبيب الجديد');
    
    showToast(t('toastRegisterSuccess') + responseData.id, 'success');
    window.createDoctorGitHubPageAsync({ first_name: data.FirstName.trim(), last_name: data.LastName.trim(), phone: defaultPassword, exact_location: data.ExactLocation.trim(), specialty: data.Specialty.trim(), municipality: data.Municipality.trim(), extra_info: data.ExtraInfo ? data.ExtraInfo.trim() : '' }, responseData.id);
    
    e.target.reset();
    await window.loadDoctors();
    setTimeout(() => window.router('home'), 1500);
  } catch (err) { showToast(t('toastRegisterError') + err.message, 'error'); } 
  finally { setLoading(btn, false); }
};

window.createDoctorGitHubPageAsync = function(doctorData, doctorId) {
  supabaseClient.functions.invoke('create-github-page', { body: { doctorData, doctorId } })
  .then(({ data, error }) => {
    if (!error && data && data.success) showToast('تم إنشاء صفحة الطبيب للـ SEO!', 'success');
  }).catch(err => console.error('Edge Function Error:', err));
};

// ==========================================
// 5. تهيئة التطبيق عند التحميل (Initialization)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('apptDateInput');
  if (dateInput) {
      const currentDate = new Date();
      const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
      dateInput.min = new Date(currentDate.getTime() - timezoneOffset).toISOString().split('T')[0];
  }

  const hash = window.location.hash.replace('#', '');
  const startView = ['home', 'add-doctor', 'booking', 'dashboard', 'login', 'track', 'user-dashboard'].includes(hash) ? hash : 'home';
  window.setLang(localStorage.getItem('appLanguage') || 'ar');

  document.getElementById('logoHomeBtn').onclick = () => window.router('home');
  document.getElementById('btn-en').onclick = () => window.setLang('en');
  document.getElementById('btn-ar').onclick = () => window.setLang('ar');
  document.getElementById('googleSignInBtn').onclick = window.handleGoogleSignIn;
  document.getElementById('authSubmitBtn').onclick = window.handleEmailAuth;
  document.getElementById('authToggleText').onclick = window.toggleAuthMode;
  document.getElementById('backToHomeBtn').onclick = () => window.router('home');
  document.getElementById('backToDirBtn').onclick = () => window.router('home');

  const tsSettings = { create: false, sortField: { field: "text", direction: "asc" }, render: { no_results: function(data, escape) { return '<div class="no-results">' + (state.currentLang === 'ar' ? 'لا توجد نتائج' : 'No results found') + '</div>'; } } };
  window.tsSpecialtyFilter = new TomSelect("#specialtyFilter", tsSettings);
  window.tsMunicipalityFilter = new TomSelect("#municipalityFilter", tsSettings);
  window.tsAddSpecialty = new TomSelect('select[name="Specialty"]', tsSettings);
  window.tsAddMunicipality = new TomSelect('select[name="Municipality"]', tsSettings);

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
          else if (booking.status === 'cancelled') { statusStyle = 'background: #fef2f2; color: #ef4444;'; displayStatus = state.currentLang === 'ar' ? 'ملغى' : 'Cancelled'; } 
          else displayStatus = state.currentLang === 'ar' ? 'قيد الانتظار' : 'Pending';

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
  document.querySelectorAll('.nav-btn[data-nav]').forEach(btn => { btn.onclick = () => window.router(btn.getAttribute('data-nav')); });

  const addDoctorForm = document.getElementById('addDoctorForm'); if (addDoctorForm) addDoctorForm.onsubmit = window.handleAddDoctor;
  const bookingBtn = document.getElementById('bookingBtn'); if (bookingBtn) bookingBtn.onclick = window.confirmBooking;
  const confirmDialogOkBtn = document.getElementById('confirmDialogOkBtn'); if (confirmDialogOkBtn) confirmDialogOkBtn.onclick = window.submitBooking;
  const cancelDialogBtn = document.getElementById('cancelDialogBtn'); if (cancelDialogBtn) cancelDialogBtn.onclick = window.closeConfirmDialog;
  const dashboardLoginForm = document.getElementById('dashboardLoginForm'); if (dashboardLoginForm) dashboardLoginForm.onsubmit = window.handleDashboardLogin;
  const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn'); if (dashboardLogoutBtn) dashboardLogoutBtn.onclick = window.logoutDashboard;
  const bookingToggleSwitch = document.getElementById('bookingToggleSwitch'); if (bookingToggleSwitch) bookingToggleSwitch.onchange = window.handleToggleBooking;
  const logoutBtn = document.getElementById('logoutBtn'); if (logoutBtn) logoutBtn.onclick = window.logoutUser;
  const searchInput = document.getElementById('searchInput'); if (searchInput) searchInput.oninput = window.filterDoctors;
  const specialtyFilter = document.getElementById('specialtyFilter'); if (specialtyFilter) specialtyFilter.onchange = window.filterDoctors;
  const municipalityFilter = document.getElementById('municipalityFilter'); if (municipalityFilter) municipalityFilter.onchange = window.filterDoctors;

  window.onscroll = () => { const btn = document.getElementById('backToTop'); if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) btn.classList.remove('hidden'); else btn.classList.add('hidden'); };
  document.getElementById('backToTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  window.onpopstate = (e) => { const view = (e.state && e.state.view) ? e.state.view : 'home'; window.router(view, false); };

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

  // ✅ ✅ ✅ الكود المفقود: تفعيل النجوم في التقييمات
  let currentReviewRating = 0;
  document.querySelectorAll('#starRatingInput .star').forEach(star => {
      star.addEventListener('mouseover', function() {
          let val = parseInt(this.getAttribute('data-val'));
          document.querySelectorAll('#starRatingInput .star').forEach(s => {
              s.style.color = parseInt(s.getAttribute('data-val')) <= val ? '#f59e0b' : 'var(--border)';
          });
      });
      star.addEventListener('mouseout', function() {
          document.querySelectorAll('#starRatingInput .star').forEach(s => {
              s.style.color = parseInt(s.getAttribute('data-val')) <= currentReviewRating ? '#f59e0b' : 'var(--border)';
          });
      });
      star.addEventListener('click', function() {
          currentReviewRating = parseInt(this.getAttribute('data-val'));
          document.getElementById('ratingValue').value = currentReviewRating;
      });
  });

  // --- إعداد فورم التقييمات ---
  document.addEventListener('submit', async function(e) {
    if (e.target && e.target.id === 'reviewForm') {
      e.preventDefault();
      const btn = document.getElementById('submitReviewBtn');
      const doctorId = document.getElementById('reviewDoctorId').value;
      const rating = document.getElementById('ratingValue').value;
      const comment = document.getElementById('reviewComment').value;

      if (!rating || rating === "0") { showToast(state.currentLang === 'ar' ? 'الرجاء اختيار التقييم بالنجوم' : 'Please select a star rating', 'error'); return; }
      if (!comment.trim()) { showToast(state.currentLang === 'ar' ? 'الرجاء كتابة تجربتك' : 'Please write your review', 'error'); return; }

      setLoading(btn, true);
      try {
        const user = await getCurrentUser();
        if (!user) { showToast(state.currentLang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first', 'error'); setLoading(btn, false); return; }
        const { error } = await supabaseClient.from('reviews').insert([{ doctor_id: doctorId, user_id: user.UserID, patient_name: user.Name || user.Email.split('@')[0], rating: parseInt(rating), comment: comment.trim(), status: 'pending' }]).select().single();
        if (error) {
          if (error.code === '23505') showToast(state.currentLang === 'ar' ? 'لقد قمت بتقييم هذا الطبيب مسبقاً!' : 'You have already reviewed this doctor!', 'error');
          else throw error;
        } else {
          showToast(state.currentLang === 'ar' ? 'تم إرسال تقييمك بنجاح. سيتم نشره بعد المراجعة.' : 'Review submitted successfully.', 'success');
          e.target.reset();
          currentReviewRating = 0;
          document.getElementById('ratingValue').value = '';
          document.querySelectorAll('#starRatingInput .star').forEach(s => s.style.color = 'var(--border)');
          window.openFullReviewsPage(doctorId);
        }
      } catch (err) { showToast(state.currentLang === 'ar' ? 'خطأ: ' + err.message : 'Error: ' + err.message, 'error'); } 
      finally { setLoading(btn, false, state.currentLang === 'ar' ? 'نشر التقييم' : 'Submit Review'); }
    }
  });

  // ==========================================
  // 🤖 تهيئة الشات بوت من الملف المنفصل
  // ==========================================
  initChatbot(); // 🆕 استدعاء دالة تهيئة الشات بوت

});
