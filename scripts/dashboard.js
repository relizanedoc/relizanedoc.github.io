// ==========================================
// dashboard.js - لوحة تحكم الطبيب وإدارة العيادة
// ==========================================
import { supabaseClient } from './api.js';
import { state } from './state.js';
import { t, escapeHtml, showToast, setLoading } from './utils.js';
import { renderDashboardUI, updateToggleText } from './ui.js';
import { isAccountLocked, recordFailedAttempt, resetLoginAttempts } from './auth.js';

let doctorChartInstance = null; // متغير لحفظ حالة المخطط

window.renderDoctorAnalytics = function(appointments) {
    const canvas = document.getElementById('appointmentsChart');
    if (!canvas) return; 

    const validAppointments = appointments || [];

    const total = validAppointments.length;
    const confirmed = validAppointments.filter(a => a.status === 'confirmed').length;
    const pending = validAppointments.filter(a => a.status === 'pending').length;
    const completed = validAppointments.filter(a => a.status === 'completed').length; 

    const totalEl = document.getElementById('statTotalAppointments');
    if (totalEl) totalEl.textContent = total;

    const confirmedEl = document.getElementById('statConfirmedAppointments');
    if (confirmedEl) confirmedEl.textContent = confirmed;

    const pendingEl = document.getElementById('statPendingAppointments');
    if (pendingEl) pendingEl.textContent = pending;

    const completedEl = document.getElementById('statCompletedAppointments');
    if (completedEl) completedEl.textContent = completed;

    if (doctorChartInstance) {
        doctorChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const translatedLabels = [
        t('confirmedAppointments') || 'مؤكدة', 
        t('pendingAppointments') || 'قيد الانتظار', 
        t('completedAppointments') || 'مكتملة' 
    ];

    doctorChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: translatedLabels,
            datasets: [{
                data: [confirmed, pending, completed],
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { 
                        color: isDark ? '#f8fafc' : '#0f172a', 
                        font: { family: 'Tajawal', size: 14 } 
                    }
                }
            }
        }
    });
};

window.handleDashboardLogin = async function(e) {
  if (e) e.preventDefault();
  if (isAccountLocked()) return;

  const btn = document.getElementById('dashboardLoginBtn');
  setLoading(btn, true);

  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginDoctorPassword').value.trim();

  if (!phone || !password) { 
    setLoading(btn, false); 
    showToast('يرجى ملء جميع الحقول', 'error'); 
    return; 
  }

  try {
    const turnstileResponse = document.querySelector('#loginSection [name="cf-turnstile-response"]');
    const turnstileToken = turnstileResponse ? turnstileResponse.value : null;

    if (!turnstileToken) throw new Error("يرجى إكمال التحقق الأمني (الكابتشا).");

    const { data: functionResponse, error: functionError } = await supabaseClient.functions.invoke('verify-doctor-login', {
        body: { turnstileToken: turnstileToken, phone: phone, password: password }
    });

    if (functionError) {
      if (functionError instanceof TypeError || functionError.message === 'Failed to fetch') {
          throw new Error("مشكلة في الاتصال بالإنترنت أو أن السيرفر يستغرق وقتاً طويلاً للاستجابة. يرجى المحاولة مرة أخرى.");
      }
      const errorMessage = functionError.message || functionError.context || "حدث خطأ غير متوقع في الخادم.";
      throw new Error(`تعذر الاتصال بالخادم: ${errorMessage}`);
    }

    if (functionResponse && functionResponse.error) throw new Error(functionResponse.error);
    if (!functionResponse || !functionResponse.doctorData) throw new Error("استجابة السيرفر غير مكتملة أو فارغة.");

    const responseData = functionResponse.doctorData;

    const { data: fullDoctorData } = await supabaseClient.from('doctors').select('*').eq('id', responseData.doctor.id).single();
    const doctor = fullDoctorData ? { ...fullDoctorData, session_token: responseData.doctor.session_token } : responseData.doctor;        
    const { data: appointments } = await supabaseClient.rpc('get_doctor_appointments_secure', { p_doctor_id: doctor.id, p_session_token: doctor.session_token });

    resetLoginAttempts();
    localStorage.setItem('doctorSession', JSON.stringify({ doctorId: doctor.id, phone: doctor.phone, sessionToken: doctor.session_token }));

    const dashboardData = {
      doctorName: `${doctor.first_name} ${doctor.last_name}`,
      workingDays: typeof doctor.working_days === 'object' ? JSON.stringify(doctor.working_days) : (doctor.working_days || '{}'),
      bookingEnabled: doctor.booking_enabled, 
      appointments: appointments || [], 
      doctorDetails: doctor
    };

    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    renderDashboardUI(dashboardData, doctor.id);
    window.renderDoctorAnalytics(dashboardData.appointments);
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
  if (window.isSavingProfile) return; 
  window.isSavingProfile = true;

  const sessionStr = localStorage.getItem('doctorSession');
  if (!sessionStr) { window.isSavingProfile = false; return; }
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
    let finalImageUrls = window.dashboardCurrentImages ? [...window.dashboardCurrentImages] : []; 

    const { data: dbDoctor, error: fetchErr } = await supabaseClient.from('doctors').select('clinic_images').eq('id', session.doctorId).single();
    const originalImages = dbDoctor && dbDoctor.clinic_images ? dbDoctor.clinic_images : [];
    const imagesToDelete = originalImages.filter(url => !finalImageUrls.includes(url));

    if (imagesToDelete.length > 0) {
        const pathsToDelete = imagesToDelete.map(url => {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/clinic-images/');
                if (pathParts.length > 1) return decodeURIComponent(pathParts[1]);
            } catch (e) {
                const parts = url.split('/clinic-images/');
                if (parts.length > 1) return decodeURIComponent(parts[1].split('?')[0]);
            }
            return null;
        }).filter(Boolean);

        if (pathsToDelete.length > 0) {
            await supabaseClient.storage.from('clinic-images').remove(pathsToDelete);
        }
    }

    const fileInput = document.getElementById('dash_clinic_images');
    if (fileInput && fileInput.files.length > 0) {
        const maxImages = 4;
        const remainingSlots = maxImages - finalImageUrls.length;

        if (remainingSlots <= 0) {
            showToast('لقد وصلت للحد الأقصى (4 صور). يرجى حذف بعض الصور القديمة أولاً.', 'error');
            setLoading(btn, false, 'حفظ التغييرات');
            if (fileInput) fileInput.value = ''; 
            return; 
        }

        const filesToUpload = Array.from(fileInput.files).slice(0, remainingSlots);
        if (fileInput.files.length > remainingSlots) showToast(`تم اختيار أول ${remainingSlots} صور فقط لعدم تجاوز الحد الأقصى.`, 'warning');

        const compressImage = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const MAX_WIDTH = 1200, MAX_HEIGHT = 1200;
                        let width = img.width, height = img.height;
                        if (width > height) { if (width > MAX_WIDTH) { height = Math.round(height * MAX_WIDTH / width); width = MAX_WIDTH; } } 
                        else { if (height > MAX_HEIGHT) { width = Math.round(width * MAX_HEIGHT / height); height = MAX_HEIGHT; } }
                        const canvas = document.createElement('canvas');
                        canvas.width = width; canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        canvas.toBlob((blob) => { resolve(new File([blob], `${Date.now()}.webp`, { type: 'image/webp', lastModified: Date.now() })); }, 'image/webp', 0.8);
                    };
                    img.onerror = (error) => reject(error);
                };
                reader.onerror = (error) => reject(error);
            });
        };

        for (const originalFile of filesToUpload) {
            try {
                const compressedFile = await compressImage(originalFile);
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;
                const filePath = `clinics/${session.doctorId}/${fileName}`;
                const { error: uploadError } = await supabaseClient.storage.from('clinic-images').upload(filePath, compressedFile);
                if (uploadError) throw new Error("فشل الرفع: " + uploadError.message);
                const { data: publicUrlData } = supabaseClient.storage.from('clinic-images').getPublicUrl(filePath);
                finalImageUrls.push(publicUrlData.publicUrl);
            } catch (imgError) {
                showToast("حدث خطأ أثناء معالجة صورة.", "error");
            }
        }
    }

    const firstNameAr = document.getElementById('dash_first_name_ar').value.trim();
    const lastNameAr = document.getElementById('dash_last_name_ar').value.trim();
    const firstNameEn = document.getElementById('dash_first_name_en') ? document.getElementById('dash_first_name_en').value.trim() : '';
    const lastNameEn = document.getElementById('dash_last_name_en') ? document.getElementById('dash_last_name_en').value.trim() : '';

    if (!firstNameAr || !lastNameAr) {
        showToast(state.currentLang === 'ar' ? 'الاسم واللقب بالعربية إجباريان' : 'Arabic First and Last names are required', 'error');
        setLoading(btn, false);
        return;
    }

    const contactEmail = document.getElementById('dash_contact_email').value.trim();
    const whatsapp = document.getElementById('dash_whatsapp').value.trim();
    const facebook = document.getElementById('dash_facebook').value.trim();
    const mapLink = document.getElementById('dash_map_link').value.trim();
    const phone2 = document.getElementById('dash_phone_2') ? document.getElementById('dash_phone_2').value.trim() : null;

    const { error: dbError } = await supabaseClient.rpc('update_clinic_profile_secure', {
        p_doctor_id: session.doctorId, p_session_token: session.sessionToken, p_first_name: firstNameAr, p_last_name: lastNameAr,
        p_first_name_en: firstNameEn, p_last_name_en: lastNameEn, p_contact_email: contactEmail, p_whatsapp_number: whatsapp,
        p_facebook_link: facebook, p_map_link: mapLink, p_phone_2: phone2, p_services: formattedServices, p_certificates: certificatesText,
        p_clinic_images: finalImageUrls
    });

    if (dbError) throw dbError;

    if (finalImageUrls.length === 0) {
        await supabaseClient.from('doctors').update({ clinic_images: [] }).eq('id', session.doctorId);
    }

    const docIndex = state.allDoctors.findIndex(d => d.id === session.doctorId);
    if (docIndex > -1) {
        state.allDoctors[docIndex] = { 
            ...state.allDoctors[docIndex], 
            first_name: firstNameAr, last_name: lastNameAr, first_name_en: firstNameEn, last_name_en: lastNameEn,
            contact_email: contactEmail, whatsapp_number: whatsapp, facebook_link: facebook, map_link: mapLink, phone_2: phone2,
            services: formattedServices, certificates: certificatesText, clinic_images: finalImageUrls 
        };
        if (typeof window.createDoctorGitHubPageAsync === 'function') window.createDoctorGitHubPageAsync(state.allDoctors[docIndex], session.doctorId);
    }

    showToast('تم حفظ التغييرات بنجاح', 'success');
    setTimeout(() => location.reload(), 1000);
  } catch (err) { 
      showToast('خطأ: ' + err.message, 'error'); 
  } finally { 
      window.isSavingProfile = false; 
      setLoading(btn, false, 'حفظ التغييرات'); 
      if (document.getElementById('dash_clinic_images')) document.getElementById('dash_clinic_images').value = ''; 
  }
};

window.changeBookingStatus = async function(bookingId, newStatus, userEmail, doctorName, appointmentDate) {
  let confirmMsg = '';
  if (newStatus === 'confirmed') confirmMsg = state.currentLang === 'ar' ? 'هل أنت متأكد من تأكيد هذا الموعد؟' : 'Are you sure you want to confirm this appointment?';
  else if (newStatus === 'completed') confirmMsg = state.currentLang === 'ar' ? 'هل تم فحص المريض وتريد إغلاق هذا الموعد؟' : 'Has the patient been examined and you want to complete this?';
  else confirmMsg = state.currentLang === 'ar' ? 'هل أنت متأكد من إلغاء هذا الموعد؟' : 'Are you sure you want to cancel this appointment?';

  if (!confirm(confirmMsg)) return;

  try {
    const sessionStr = localStorage.getItem('doctorSession');
    if (!sessionStr) throw new Error('يرجى تسجيل الدخول مجدداً');
    const session = JSON.parse(sessionStr);

    const { error } = await supabaseClient.rpc('update_booking_status_secure', { 
        p_booking_id: bookingId, p_new_status: newStatus, p_doctor_id: session.doctorId, p_session_token: session.sessionToken 
    });
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
      if(typeof window.renderDoctorAnalytics === 'function') window.renderDoctorAnalytics(updatedAppointments);
    }
  } catch (err) { showToast(state.currentLang === 'ar' ? 'خطأ في تحديث الحالة: ' + err.message : 'Error updating status: ' + err.message, 'error'); }
};

// دوال الأكورديون والصور
window.closeAllDashboardPanels = function(exceptPrefix) {
    const panels = ['analytics', 'workingHours', 'clinicProfile', 'appointments'];
    panels.forEach(prefix => {
        if (prefix !== exceptPrefix) {
            const content = document.getElementById(prefix + 'Content');
            const header = document.getElementById(prefix + 'Toggle');
            if (content) content.classList.remove('open');
            if (header) header.classList.remove('open');
        }
    });
};
window.toggleWorkingHours = function() { window.closeAllDashboardPanels('workingHours'); const c = document.getElementById('workingHoursContent'); const h = document.getElementById('workingHoursToggle'); if (c) c.classList.toggle('open'); if (h) h.classList.toggle('open'); };
window.toggleAppointments = function() { window.closeAllDashboardPanels('appointments'); const c = document.getElementById('appointmentsContent'); const h = document.getElementById('appointmentsToggle'); if (c) c.classList.toggle('open'); if (h) h.classList.toggle('open'); };
window.toggleClinicProfile = function() { window.closeAllDashboardPanels('clinicProfile'); const c = document.getElementById('clinicProfileContent'); const h = document.getElementById('clinicProfileToggle'); if (c) c.classList.toggle('open'); if (h) h.classList.toggle('open'); };
window.toggleAnalytics = function() { window.closeAllDashboardPanels('analytics'); const c = document.getElementById('analyticsContent'); const h = document.getElementById('analyticsToggle'); if (c) c.classList.toggle('open'); if (h) h.classList.toggle('open'); };

window.renderClinicImageThumbnails = function() {
  let container = document.getElementById('currentClinicImagesContainer');
  if (!container) {
      const fileInput = document.getElementById('dash_clinic_images');
      if (fileInput) {
          container = document.createElement('div');
          container.id = 'currentClinicImagesContainer';
          container.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;';
          fileInput.parentNode.insertBefore(container, fileInput.nextSibling);
      } else return;
  }
  container.innerHTML = ''; 
  window.dashboardCurrentImages.forEach((url, index) => {
      const imgDiv = document.createElement('div');
      imgDiv.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid var(--border); box-shadow: 0 2px 5px rgba(0,0,0,0.05);';
      imgDiv.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Clinic Image">
          <button type="button" onclick="window.removeClinicImage(${index})" style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;" onmouseover="this.style.background='red'" onmouseout="this.style.background='rgba(239, 68, 68, 0.9)'" title="حذف الصورة"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`;
      container.appendChild(imgDiv);
  });
};

window.removeClinicImage = function(index) {
  const confirmMsg = state.currentLang === 'ar' ? 'هل أنت متأكد من إزالة هذه الصورة؟' : 'Are you sure you want to remove this image?';
  if (confirm(confirmMsg)) {
      window.dashboardCurrentImages.splice(index, 1); 
      const sessionStr = localStorage.getItem('doctorSession');
      if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const docIndex = state.allDoctors.findIndex(d => d.id === session.doctorId);
          if (docIndex > -1 && state.allDoctors[docIndex].clinic_images) {
              state.allDoctors[docIndex].clinic_images = [...window.dashboardCurrentImages];
          }
      }
      window.renderClinicImageThumbnails(); 
      const fileInput = document.getElementById('dash_clinic_images');
      if (fileInput) fileInput.value = '';
  }
};

window.addServiceCategory = function(category = '', items = '') {
  const container = document.getElementById('servicesContainer');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'service-row';
  row.style.cssText = 'display: flex; gap: 0.5rem; align-items: flex-start; background: var(--bg); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border);';
  row.innerHTML = `<div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;"><input type="text" class="svc-category" placeholder="${t('catNamePh')}" value="${escapeHtml(category)}"><input type="text" class="svc-items" placeholder="${t('svcItemsPh')}" value="${escapeHtml(items)}"></div><button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="padding: 0.5rem; color: var(--danger); border-color: var(--danger);" title="حذف"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>`;
  container.appendChild(row);
};

// تهيئة اللوحة عند فتح الموقع (Auto-Login & Listeners)
document.addEventListener('DOMContentLoaded', () => {
    const dashboardLoginForm = document.getElementById('dashboardLoginForm'); if (dashboardLoginForm) dashboardLoginForm.onsubmit = window.handleDashboardLogin;
    const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn'); if (dashboardLogoutBtn) dashboardLogoutBtn.onclick = window.logoutDashboard;
    const bookingToggleSwitch = document.getElementById('bookingToggleSwitch'); if (bookingToggleSwitch) bookingToggleSwitch.onchange = window.handleToggleBooking;

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
});
