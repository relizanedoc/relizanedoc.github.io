// ==========================================
// init.js - تهيئة التطبيق والأحداث المتبقية
// ==========================================
import { supabaseClient } from './api.js';
import { state, i18n } from './state.js';
import { t, escapeHtml, formatPhoneNumber, showToast, setLoading } from './utils.js';
import { updateUserUI, updateToggleText, updateSEOMetaTags, renderDoctors, openDoctorProfileModal, renderDashboardUI, generateTimeSlots, displayTimeSlots, openScheduleModal } from './ui.js';
import { isAccountLocked, recordFailedAttempt, resetLoginAttempts, getCurrentUser } from './auth.js';
import { initChatbot } from './chatbot.js'; 

// ✅ ✅ ✅ الاستماع لتغيير حالة المصادقة
let isAuthInitialized = false;
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('🔄 حدث المصادقة:', event);

    if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ تم التقاط حدث استعادة كلمة المرور');
        setTimeout(() => {
            if(typeof window.handleChangePassword === 'function') window.handleChangePassword();
        }, 500);
    }

    if (['INITIAL_SESSION', 'SIGNED_IN', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
        if (session) {
            console.log('✅ جلسة نشطة:', session.user);
            updateUserUI(session.user);

            if (event === 'SIGNED_IN') {
                const hash = window.location.hash;
                if (hash.includes('access_token')) {
                    if(typeof window.router === 'function') window.router('user-dashboard');
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
            if(typeof window.router === 'function') window.router(startView, false); 
        }
        isAuthInitialized = true;
    }
});

// ✅ التحقق من الجلسة الحالية واللغة عند تحميل الصفحة
window.addEventListener('load', async () => {
    console.log('🔍 التحقق من الجلسة الحالية واللغة...');
    const savedLang = localStorage.getItem('appLanguage') || 'ar';
    setTimeout(() => {
        if(typeof window.setLang === 'function') window.setLang(savedLang);
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

window.updateAuthToggle = function() { 
    const el = document.getElementById('authToggleText');
    if(el) el.textContent = t(state.isSignUp ? 'hasAccount' : 'noAccount'); 
};
window.selectSuggestion = function(doctorId) {};

// ==========================================
// 4. نظام الحجوزات 
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
  if(timeInputHidden) timeInputHidden.value = '';

  dateInput.onchange = function() { window.handleDateSelection(this.value, wd); };

  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
  dateInput.min = new Date(currentDate.getTime() - timezoneOffset).toISOString().split('T')[0];

  if(typeof window.router === 'function') window.router('booking');
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
    const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
    const turnstileToken = turnstileResponse ? turnstileResponse.value : null;

    if (!turnstileToken) throw new Error("يرجى إكمال التحقق الأمني (الكابتشا).");

    const { data: authData } = await supabaseClient.auth.getUser();
    const user = authData ? authData.user : null;
    const finalEmail = data.PatientEmail ? data.PatientEmail.trim() : (user ? user.email : null);

    const bookingPayload = {
      doctor_id: data.DoctorID, patient_name: data.PatientName.trim(), patient_phone: data.PatientPhone.trim(),
      appointment_date: data.AppointmentDate, appointment_time: data.AppointmentTime, status: 'pending',
      user_id: user ? user.id : null, user_email: finalEmail
    };

    const { data: functionResponse, error: functionError } = await supabaseClient.functions.invoke('verify-booking', { body: { turnstileToken: turnstileToken, bookingData: bookingPayload } });

    if (functionError) throw new Error("خطأ في الاتصال بالخادم الداخلي.");
    if (functionResponse && functionResponse.error) throw new Error(functionResponse.error);

    const booking = functionResponse.booking;
    form.reset();
    document.getElementById('timeSlotsContainer').innerHTML = `<div class="text-sm text-gray" style="grid-column: 1 / -1;">${t('selectDateFirst')}</div>`;

    const bId = booking.id;
    const shortId = bId.substring(0, 8).toUpperCase();
    const targetDoctorData = state.allDoctors.find(d => d.id === data.DoctorID);
    const bDoctor = targetDoctorData ? `${targetDoctorData.first_name} ${targetDoctorData.last_name}` : '';

    const qrText = state.currentLang === 'ar' ? `تفاصيل الحجز:\nرقم الحجز: ${shortId}\nالمريض: ${data.PatientName}\nالطبيب: د. ${bDoctor}\nالتاريخ: ${data.AppointmentDate}\nالوقت: ${data.AppointmentTime}` : `Booking Details:\nID: ${shortId}\nPatient: ${data.PatientName}\nDoctor: Dr. ${bDoctor}\nDate: ${data.AppointmentDate}\nTime: ${data.AppointmentTime}`;

    document.getElementById('eTicketContainer').innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 1.25rem 1rem; text-align: center; color: white; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 290px; margin: 0 auto;">
        <div style="background: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem auto; color: #10b981;"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
        <h3 style="margin: 0 0 0.25rem 0; font-size: 1.2rem; font-weight: bold;">${state.currentLang === 'ar' ? 'تم تأكيد الحجز' : 'Booking Confirmed'}</h3>
        <div style="font-size: 0.85rem; opacity: 0.95; margin-bottom: 1rem;">${state.currentLang === 'ar' ? 'د.' : 'Dr.'} ${escapeHtml(bDoctor)}</div>
        <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7rem; padding-bottom: 0.7rem; border-bottom: 1px solid rgba(255,255,255,0.2);"><span style="opacity: 0.9; font-size: 0.85rem;">${state.currentLang === 'ar' ? 'رقم الحجز' : 'Booking ID'}</span><span style="font-family: monospace; font-weight: bold; letter-spacing: 1px; font-size: 1rem;">${shortId}</span></div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7rem; padding-bottom: 0.7rem; border-bottom: 1px solid rgba(255,255,255,0.2);"><span style="opacity: 0.9; font-size: 0.85rem;">${state.currentLang === 'ar' ? 'المريض' : 'Patient'}</span><span style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(data.PatientName)}</span></div>
          <div style="display: flex; justify-content: space-between; align-items: center;"><span style="opacity: 0.9; font-size: 0.85rem;">${state.currentLang === 'ar' ? 'الوقت' : 'Time'}</span><span dir="ltr" style="font-weight: 600; font-size: 0.85rem;">${data.AppointmentDate} | ${data.AppointmentTime}</span></div>
        </div>
        <div style="background: white; padding: 0.4rem; border-radius: 8px; display: inline-block;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrText)}&color=667eea" alt="QR" style="width: 85px; height: 85px; display: block;" /></div>
      </div>
    `;
    document.getElementById('successDialog').classList.remove('hidden');
  } catch (err) { showToast(err.message, 'error'); } finally { setLoading(btn, false); }
};

window.closeSuccessDialog = function() { document.getElementById('successDialog').classList.add('hidden'); if(typeof window.router === 'function') window.router('home'); };

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
      let statusStyle = 'background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;'; let statusIndicator = '#f59e0b'; let displayStatus = t('statusPending');
      if (b.status === 'confirmed') { statusStyle = 'background: #ecfdf5; color: #10b981; border: 1px solid #a7f3d0;'; statusIndicator = '#10b981'; displayStatus = t('statusConfirmed'); } 
      else if (b.status === 'completed') { statusStyle = 'background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe;'; statusIndicator = '#3b82f6'; displayStatus = state.currentLang === 'ar' ? 'مكتمل' : 'Completed'; }
      else if (b.status === 'cancelled') { statusStyle = 'background: #fef2f2; color: #ef4444; border: 1px solid #fecaca;'; statusIndicator = '#ef4444'; displayStatus = t('statusCancelled'); }
      const doctorName = b.doctors ? (state.currentLang === 'en' && b.doctors.first_name_en && b.doctors.last_name_en ? `${b.doctors.first_name_en} ${b.doctors.last_name_en}` : `${b.doctors.first_name} ${b.doctors.last_name}`) : 'طبيب';
      const shortId = b.id.substring(0, 8).toUpperCase();

      html += `
        <div class="card-hover" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
          <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 4px; background: ${statusIndicator};"></div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-right: 0.5rem;">
            <div style="flex: 1; min-width: 250px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><span style="font-family: monospace; font-size: 0.85rem; color: var(--primary); background: var(--bg); padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid var(--border); font-weight: bold;">${shortId}</span><span class="badge" style="${statusStyle}">${displayStatus}</span></div>
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
  if (!user) { showToast(t('loginRequired'), 'error'); if(typeof window.router === 'function') window.router('login'); return; }

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
    e.target.reset();
    if(typeof window.loadDoctors === 'function') await window.loadDoctors();
    setTimeout(() => { if(typeof window.router === 'function') window.router('home'); }, 1500);
  } catch (err) { showToast((state.currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + err.message, 'error'); } 
  finally { setLoading(btn, false); }
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

// ==========================================
// 5. ربط الأحداث العامة بالكامل
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initNewsTicker();
    initChatbot();

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

    document.querySelectorAll('.nav-btn[data-nav]').forEach(btn => { btn.onclick = () => { if(typeof window.router === 'function') window.router(btn.getAttribute('data-nav')); }; });
    const btnEn = document.getElementById('btn-en'); if(btnEn) btnEn.onclick = () => { if(typeof window.setLang === 'function') window.setLang('en'); };
    const btnAr = document.getElementById('btn-ar'); if(btnAr) btnAr.onclick = () => { if(typeof window.setLang === 'function') window.setLang('ar'); };
    
    const addDoctorForm = document.getElementById('addDoctorForm'); if (addDoctorForm) addDoctorForm.onsubmit = window.handleAddDoctor;
    const bookingBtn = document.getElementById('bookingBtn'); if (bookingBtn) bookingBtn.onclick = window.confirmBooking;
    const confirmDialogOkBtn = document.getElementById('confirmDialogOkBtn'); if (confirmDialogOkBtn) confirmDialogOkBtn.onclick = window.submitBooking;
    const cancelDialogBtn = document.getElementById('cancelDialogBtn'); if (cancelDialogBtn) cancelDialogBtn.onclick = window.closeConfirmDialog;
    const logoutBtn = document.getElementById('logoutBtn'); if (logoutBtn) logoutBtn.onclick = window.logoutUser;

    const backToHomeBtn = document.getElementById('backToHomeBtn'); if (backToHomeBtn) backToHomeBtn.onclick = () => { if(typeof window.router === 'function') window.router('home'); };
    const authToggleText = document.getElementById('authToggleText'); if (authToggleText) authToggleText.onclick = window.toggleAuthMode;
    const googleSignInBtn = document.getElementById('googleSignInBtn'); if (googleSignInBtn) googleSignInBtn.onclick = window.handleGoogleSignIn;
    const authSubmitBtn = document.getElementById('authSubmitBtn'); if (authSubmitBtn) authSubmitBtn.onclick = (e) => { e.preventDefault(); window.handleEmailAuth(); };

    const searchInput = document.getElementById('searchInput'); if (searchInput) searchInput.oninput = window.filterDoctors;
    const specialtyFilter = document.getElementById('specialtyFilter'); if (specialtyFilter) specialtyFilter.onchange = window.filterDoctors;
    const municipalityFilter = document.getElementById('municipalityFilter'); if (municipalityFilter) municipalityFilter.onchange = window.filterDoctors;

    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.onscroll = () => { if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) backToTop.classList.remove('hidden'); else backToTop.classList.add('hidden'); };
        backToTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.onpopstate = (e) => { const view = (e.state && e.state.view) ? e.state.view : 'home'; if(typeof window.router === 'function') window.router(view, false); };
    const logoHomeBtn = document.getElementById('logoHomeBtn'); if (logoHomeBtn) logoHomeBtn.addEventListener('click', () => { if(typeof window.router === 'function') window.router('home'); });

    // تسجيل الدخول التلقائي للوحة الطبيب
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
                        if (typeof window.renderDashboardUI === 'function') window.renderDashboardUI(dashboardData, doctor.id);
                    } else localStorage.removeItem('doctorSession');
                    if (btn) setLoading(btn, false);
                } catch (err) { localStorage.removeItem('doctorSession'); if (btn) setLoading(btn, false); }
            })();
        } catch(e) { localStorage.removeItem('doctorSession'); }
    }
});

window.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); e.stopPropagation(); return false; } 
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) { e.preventDefault(); e.stopPropagation(); return false; }
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); e.stopPropagation(); return false; }
}, true);
