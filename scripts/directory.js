// ==========================================
// directory.js - جلب الأطباء، الفلاتر، والبحث
// ==========================================
import { supabaseClient } from './api.js';
import { state } from './state.js';
import { t, showToast, setLoading } from './utils.js';

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
        if(typeof window.handleSEOAndRender === 'function') window.handleSEOAndRender(reset); 
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
        const today = new Date().toISOString().slice(0, 10);
        const response = await fetch(`./doctors-meta.json?v=${today}`);

        if (!response.ok) {
            throw new Error('لم يتم العثور على ملف meta');
        }

        const data = await response.json();

        state.globalDirectory = data || [];
        globalSpecs = [...new Set(data.map(d => d.specialty).filter(Boolean))].sort();
        globalMuns = [...new Set(data.map(d => d.municipality).filter(Boolean))].sort();

        window.populateFilters();
        filterOptionsLoaded = true;

    } catch (e) {
        console.warn("⚠️ فشل جلب ملف meta، تفعيل الخطة البديلة عبر Supabase...", e);
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

  if (window.tsSpecialtyFilter) {
    const prevSpec = window.tsSpecialtyFilter.getValue();
    window.tsSpecialtyFilter.clear(true);
    window.tsSpecialtyFilter.clearOptions();
    window.tsSpecialtyFilter.addOption({value: "", text: t('allSpecialties')});
    globalSpecs.forEach(s => window.tsSpecialtyFilter.addOption({value: s, text: t(s)}));
    window.tsSpecialtyFilter.setValue(prevSpec || "");
  } else {
    specSel.innerHTML = '<option value="">' + t('allSpecialties') + '</option>';
    globalSpecs.forEach(s => specSel.insertAdjacentHTML('beforeend', `<option value="${s}">${t(s)}</option>`));
  }

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

let searchTimeout;
window.filterDoctors = function() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const suggestionsDropdown = document.getElementById('searchSuggestions');
    if (suggestionsDropdown) suggestionsDropdown.classList.add('hidden'); 
    window.loadDoctors(true); 
  }, 500); 
};
