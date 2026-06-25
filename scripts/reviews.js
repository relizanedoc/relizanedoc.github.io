// ==========================================
// reviews.js - نظام التقييمات والمراجعات
// ==========================================
import { supabaseClient } from './api.js';
import { state } from './state.js';
import { t, escapeHtml, showToast, setLoading } from './utils.js';
import { getCurrentUser } from './auth.js';

const REVIEWS_PER_PAGE = 11;
let currentReviewPage = 0;
let currentReviewsDoctorId = null;
let currentReviewRating = 0;

window.openFullReviewsPage = async function(doctorId) {
  currentReviewsDoctorId = doctorId;
  currentReviewPage = 0;
  const reviewDocInput = document.getElementById('reviewDoctorId');
  if (reviewDocInput) reviewDocInput.value = doctorId; 

  window.router('doctor-reviews');

  const user = await getCurrentUser();
  const addSection = document.getElementById('addReviewSectionFull');
  const loginMsg = document.getElementById('loginToReviewMsgFull');
  
  if (user) {
      if (addSection) addSection.classList.remove('hidden');
      if (loginMsg) loginMsg.classList.add('hidden');
  } else {
      if (addSection) addSection.classList.add('hidden');
      if (loginMsg) loginMsg.classList.remove('hidden');
  }

  const container = document.getElementById('fullReviewsContainer');
  const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
  
  if (container) container.innerHTML = `<div class="text-center p-4 text-gray"><div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--primary);"></div>جاري التحميل...</div>`;
  if (loadMoreBtn) loadMoreBtn.classList.add('hidden');

  await Promise.all([ fetchReviewStats(doctorId), fetchReviewsPage(doctorId, currentReviewPage) ]);
};

async function fetchReviewStats(doctorId) {
  try {
      const { data: stats, error } = await supabaseClient.from('reviews').select('rating').eq('doctor_id', doctorId).neq('status', 'deleted');
      if (error) throw error;
      
      const totalReviews = stats.length;
      const totalEl = document.getElementById('fullTotalReviews');
      if (totalEl) totalEl.textContent = totalReviews;
      
      if (totalReviews === 0) {
          const avgEl = document.getElementById('fullAvgRating');
          const starEl = document.getElementById('fullStarDisplay');
          const barsContainer = document.getElementById('ratingBarsContainer');
          
          if (avgEl) avgEl.textContent = "0.0";
          if (starEl) starEl.innerHTML = '<span style="color:#e2e8f0;">★★★★★</span>';
          if (barsContainer) barsContainer.innerHTML = '';
          return;
      }
      
      const sum = stats.reduce((acc, curr) => acc + curr.rating, 0);
      const avg = (sum / totalReviews).toFixed(1);
      
      const avgEl = document.getElementById('fullAvgRating');
      if (avgEl) avgEl.textContent = avg;
      
      const fullStars = Math.floor(avg);
      const emptyStars = 5 - fullStars;
      const starEl = document.getElementById('fullStarDisplay');
      if (starEl) starEl.innerHTML = '★'.repeat(fullStars) + '<span style="color:#e2e8f0;">' + '★'.repeat(emptyStars) + '</span>';

      const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      stats.forEach(r => ratingCounts[r.rating]++);
      let barsHtml = '';
      for (let i = 5; i >= 1; i--) {
          const percentage = ((ratingCounts[i] / totalReviews) * 100).toFixed(0);
          barsHtml += `<div class="rating-bar-row"><span style="width: 45px;">${i} ${t('starsText')}</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width: ${percentage}%;"></div></div><span style="width: 35px; text-align: right;" dir="ltr">${percentage}%</span></div>`;
      }
      
      const barsContainer = document.getElementById('ratingBarsContainer');
      if (barsContainer) barsContainer.innerHTML = barsHtml;
  } catch (err) { console.error("خطأ الإحصائيات:", err); }
}

async function fetchReviewsPage(doctorId, pageIndex) {
  const container = document.getElementById('fullReviewsContainer');
  const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
  if (!container) return;

  const start = pageIndex * REVIEWS_PER_PAGE;
  const end = start + (REVIEWS_PER_PAGE - 1);

  try {
      const { data: reviews, error } = await supabaseClient.from('reviews').select('*').eq('doctor_id', doctorId).neq('status', 'deleted').order('created_at', { ascending: false }).range(start, end);
      if (error) throw error;
      
      if (pageIndex === 0) container.innerHTML = '';
      
      if (!reviews || reviews.length === 0) {
          if (pageIndex === 0) container.innerHTML = `<div class="card text-center text-gray" style="padding: 2rem;">لا توجد تقييمات حتى الآن.</div>`;
          if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
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
          if (loadMoreBtn) {
              loadMoreBtn.classList.remove('hidden');
              setLoading(loadMoreBtn, false, t('loadMoreReviewsText') + ' (11) ↓');
          }
      } else {
          if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
      }
  } catch (err) { console.error("خطأ جلب التقييمات:", err); }
}

window.loadNextReviewsPage = function() {
  currentReviewPage++;
  const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
  if (loadMoreBtn) setLoading(loadMoreBtn, true, state.currentLang === 'en' ? 'Loading...' : 'جاري التحميل...');
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

// الدالة التي تسمح لـ app.js بتحديث لغة التقييمات عند تغيير اللغة
window.refreshReviewsLanguage = function() {
    if (currentReviewsDoctorId) {
        fetchReviewStats(currentReviewsDoctorId);
        currentReviewPage = 0; 
        fetchReviewsPage(currentReviewsDoctorId, 0);
    }
};

// تهيئة الأحداث (تفعيل النجوم وإرسال التقييم) عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
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

    document.addEventListener('submit', async function(e) {
        if (e.target && e.target.id === 'reviewForm') {
            e.preventDefault();
            const btn = document.getElementById('submitReviewBtn');
            const doctorId = document.getElementById('reviewDoctorId').value;
            const ratingInput = document.getElementById('ratingValue');
            const commentInput = document.getElementById('reviewComment');
            
            const rating = ratingInput ? ratingInput.value : 0;
            const comment = commentInput ? commentInput.value : '';

            if (!rating || rating === "0") { showToast(state.currentLang === 'ar' ? 'الرجاء اختيار التقييم بالنجوم' : 'Please select a star rating', 'error'); return; }
            if (!comment.trim()) { showToast(state.currentLang === 'ar' ? 'الرجاء كتابة تجربتك' : 'Please write your review', 'error'); return; }

            setLoading(btn, true);
            try {
                const user = await getCurrentUser();
                if (!user) { showToast(state.currentLang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first', 'error'); setLoading(btn, false); return; }

                const { data: existingReview, error: checkError } = await supabaseClient
                    .from('reviews')
                    .select('id, status')
                    .eq('doctor_id', doctorId)
                    .eq('user_id', user.UserID)
                    .maybeSingle();

                if (checkError) throw checkError;

                let operationError = null;

                if (existingReview) {
                    if (existingReview.status === 'deleted') {
                        const { error: updateError } = await supabaseClient
                            .from('reviews')
                            .update({ 
                                rating: parseInt(rating), 
                                comment: comment.trim(), 
                                status: 'pending',
                                patient_name: user.Name || user.Email.split('@')[0]
                            })
                            .eq('id', existingReview.id);
                        operationError = updateError;
                    } else {
                        operationError = { code: '23505' };
                    }
                } else {
                    const { error: insertError } = await supabaseClient
                        .from('reviews')
                        .insert([{ 
                            doctor_id: doctorId, 
                            user_id: user.UserID, 
                            patient_name: user.Name || user.Email.split('@')[0], 
                            rating: parseInt(rating), 
                            comment: comment.trim(), 
                            status: 'pending' 
                        }]);
                    operationError = insertError;
                }

                if (operationError) {
                    if (operationError.code === '23505') showToast(state.currentLang === 'ar' ? 'لقد قمت بتقييم هذا الطبيب مسبقاً!' : 'You have already reviewed this doctor!', 'error');
                    else throw operationError;
                } else {
                    showToast(state.currentLang === 'ar' ? 'تم إرسال تقييمك بنجاح. سيتم نشره بعد المراجعة.' : 'Review submitted successfully.', 'success');
                    e.target.reset();
                    currentReviewRating = 0;
                    if (ratingInput) ratingInput.value = '';
                    document.querySelectorAll('#starRatingInput .star').forEach(s => s.style.color = 'var(--border)');
                    window.openFullReviewsPage(doctorId);
                }
            } catch (err) { showToast(state.currentLang === 'ar' ? 'خطأ: ' + err.message : 'Error: ' + err.message, 'error'); } 
            finally { setLoading(btn, false, state.currentLang === 'ar' ? 'نشر التقييم' : 'Submit Review'); }
        }
    });
});
