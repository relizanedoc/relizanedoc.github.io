// ==========================================
// ui.js - دوال رسم الواجهات والتحديثات البصرية
// ==========================================
import { state } from './state.js';
import { t, escapeHtml, formatPhoneNumber, showToast } from './utils.js';

export function updateUserUI(user) {
  const pill = document.getElementById('userPill');
  const loginBtn = document.getElementById('navLoginBtn');
  const nameDisplay = document.getElementById('userNameDisplay');
  
  if (!pill && !loginBtn) return;

  if (user) {
    if (pill) pill.classList.remove('hidden');
    if (loginBtn) loginBtn.classList.add('hidden');

    const displayName = user.user_metadata?.name || user.email.split('@')[0];

    if (nameDisplay) {
      nameDisplay.textContent = displayName;
      nameDisplay.style.cursor = 'pointer';
      nameDisplay.style.textDecoration = 'underline';
      nameDisplay.title = state.currentLang === 'ar' ? 'الذهاب للوحة التحكم' : 'Go to Dashboard';
      nameDisplay.onclick = () => window.router('user-dashboard');
    }

    const dashName = document.getElementById('memberDashName');
    const dashEmail = document.getElementById('memberDashEmail');
    const dashAvatar = document.getElementById('memberDashAvatar');

    if (dashName) dashName.textContent = displayName;
    if (dashEmail) dashEmail.textContent = user.email;
    if (dashAvatar) dashAvatar.textContent = displayName.charAt(0).toUpperCase();

    const userData = {
      UserID: user.id,
      Email: user.email,
      Name: displayName,
      Provider: user.app_metadata?.provider || 'supabase',
      Role: 'member'
    };
    localStorage.setItem('medicalUser', JSON.stringify(userData));
  } else {
    if (pill) pill.classList.add('hidden');
    if (loginBtn) loginBtn.classList.remove('hidden');
    localStorage.removeItem('medicalUser');
  }
}

export function updateToggleText(isEnabled) {
  const textEl = document.getElementById('bookingStatusText');
  if (textEl) {
    textEl.textContent = isEnabled ? t('disableBooking') : t('enableBooking');
  }
}

export function updateSEOMetaTags(doc) {
  if (!doc) return;
  const pageTitle = state.currentLang === 'ar' ? `د. ${doc.first_name} ${doc.last_name} | ${doc.specialty} في ${doc.municipality}` : `Dr. ${doc.first_name} ${doc.last_name} | ${doc.specialty} in ${doc.municipality}`;
  const pageDesc = state.currentLang === 'ar' ? `احجز موعدك مع د. ${doc.first_name} ${doc.last_name}، أخصائي ${doc.specialty} في ${doc.municipality}، ولاية غليزان. العنوان: ${doc.exact_location}` : `Book an appointment with Dr. ${doc.first_name} ${doc.last_name}, ${doc.specialty} in ${doc.municipality}, Relizane.`;
  
  document.title = pageTitle;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', pageDesc);
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', pageTitle);
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', pageDesc);
}

export function renderDoctors(doctors) {
  const container = document.getElementById('doctorsList');
  container.innerHTML = '';

  if (!doctors || doctors.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon" style="opacity: 1; color: var(--text-secondary); margin-bottom: 1rem; display: flex; justify-content: center;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div><div>' + t('noDoctorsFound') + '</div></div>';
    return;
  }

  doctors.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'card doctor-card card-hover';
    card.style.cssText = 'cursor: pointer;';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = (doc.first_name?.[0] || '') + (doc.last_name?.[0] || '');

    const docPrefix = state.currentLang === 'ar' ? 'د.' : 'Dr.';
const rawName = state.currentLang === 'en' && doc.first_name_en && doc.last_name_en 
    ? `${doc.first_name_en} ${doc.last_name_en}` 
    : `${doc.first_name} ${doc.last_name}`;
const doctorName = `${docPrefix} ${escapeHtml(rawName)}`;
    const headerRight = document.createElement('div');
    headerRight.style.cssText = 'flex: 1; min-width: 0;'; 
    headerRight.innerHTML = `
      <div class="font-bold text-lg" style="display: flex; align-items: center; gap: 4px; overflow: hidden; margin-bottom: 0.3rem; color: var(--primary-dark);">
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doctorName}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="2" style="flex-shrink: 0;"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.823 3.823 7.177-7.177-1.06-1.061-6.117 6.12z"></path></svg>
      </div>
      <div class="text-sm" style="display: flex; align-items: center; gap: 6px; margin-bottom: 0.3rem; color: var(--text);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${escapeHtml(t(doc.specialty))}</span>
      </div>
      <div class="text-sm font-semibold" style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(t(doc.municipality))}</span>
      </div>
    `;

    const doctorHeader = document.createElement('div');
    doctorHeader.className = 'doctor-header';
    doctorHeader.appendChild(avatar);
    doctorHeader.appendChild(headerRight);

    const isBookingEnabled = doc.booking_enabled === true;
    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn ' + (isBookingEnabled ? 'btn-primary' : 'btn-secondary') + ' btn-block';
    actionBtn.style.cssText = 'margin-top: 1rem; padding: 0.6rem; border-radius: 8px; transition: all 0.2s;';
    actionBtn.innerHTML = isBookingEnabled ? 
        (state.currentLang === 'ar' ? 'عرض التفاصيل والحجز' : 'View Details & Book') : 
        (state.currentLang === 'ar' ? 'الحجوزات مغلقة حالياً' : 'Bookings Currently Closed');

    card.appendChild(doctorHeader);
    card.appendChild(actionBtn);

    card.onclick = () => openDoctorProfileModal(doc, doctorName);
    container.appendChild(card);
  });
}

export function openDoctorProfileModal(doc, doctorName) {
window.activeProfileDoctor = doc;
window._currentClinicImages = doc.clinic_images || [];     
  let fbLink = doc.facebook_link || '';
  if (fbLink && !fbLink.match(/^https?:\/\//i)) {
      fbLink = 'https://' + fbLink;
  }
  const profileUrl = `${window.location.origin}/doctors/${doc.id}.html`;
  const shareText = state.currentLang === 'ar' ? 'مشاركة الرابط' : 'Share Link';
  const isBookingEnabled = doc.booking_enabled === true;

  const shareMessageText = state.currentLang === 'ar' ? `احجز موعد مع د. ${doctorName} عبر دليل أطباء غليزان` : `Book an appointment with Dr. ${doctorName} via Relizane Medical Directory`;
  const encodedShareText = encodeURIComponent(shareMessageText + '\n\n' + profileUrl);
  const encodedUrl = encodeURIComponent(profileUrl);

  let vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${doctorName}\n`;
  if (doc.phone) vCard += `TEL:${doc.phone}\n`;
  if (doc.contact_email) vCard += `EMAIL:${doc.contact_email}\n`;
  if (doc.exact_location) vCard += `ADR:;;${doc.exact_location};${t(doc.municipality)};;;\n`;
  vCard += `URL:${profileUrl}\nEND:VCARD`;

  const qrPrimary  = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vCard)}&color=000000`;
  const qrFallback = `https://quickchart.io/qr?size=150&text=${encodeURIComponent(vCard)}`;

  document.getElementById('fullProfileName').textContent = doctorName;
  document.getElementById('fullProfileSpec').querySelector('span').textContent = escapeHtml(t(doc.specialty));
  document.getElementById('fullProfileAvatar').textContent = (doc.first_name?.[0] || '') + (doc.last_name?.[0] || '');

  let scheduleHtml = '';
  if (doc.working_days && Object.keys(doc.working_days).length > 0) {
    try {
      const wd = typeof doc.working_days === 'string' ? JSON.parse(doc.working_days) : doc.working_days;
      const daysNames = state.currentLang === 'ar' 
        ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] 
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for(let i=0; i<=6; i++) {
        if(wd[i] && wd[i].active) {
          scheduleHtml += `<div style="display:flex; justify-content:space-between; align-items: center; padding: 0.75rem 0; font-size: 0.95rem; border-bottom: 1px dashed var(--border);">
            <span style="color: #64748b; font-weight: 700;">${daysNames[i]}</span>
            <span dir="ltr" style="color: var(--primary-dark); font-weight: 800; background: #e0f2fe; padding: 0.4rem 0.8rem; border-radius: 8px; letter-spacing: 0.5px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);">${wd[i].start} - ${wd[i].end}</span>
          </div>`;
        }
      }
    } catch(e) { console.error(e); }
  }

  if(!scheduleHtml) {
    scheduleHtml = `<div class="text-sm text-gray" style="padding: 1.5rem 0; text-align: center; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border);">${state.currentLang === 'ar' ? 'غير متوفر حالياً' : 'Not available currently'}</div>`;
  }

  let servicesHtml = '';
  if (doc.services && Array.isArray(doc.services) && doc.services.length > 0) {
      servicesHtml = `
      <div style="margin-top: 1.5rem; background: white; border-radius: 20px; padding: clamp(1rem, 3vw, 1.5rem); box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03); width: 100%; box-sizing: border-box; overflow: hidden;">
        <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 0.75rem;">
           <span style="background: rgba(14, 165, 233, 0.1); color: var(--primary); padding: 0.6rem; border-radius: 10px; display: flex; flex-shrink: 0; box-shadow: inset 0 2px 4px rgba(14,165,233,0.1);">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
           </span>
           <span>${t('ourServices')}</span>
        </h3>
        <div style="display: grid; gap: 1rem; width: 100%;">
            ${doc.services.map(service => `
                <div style="background: white; border-radius: 12px; padding: clamp(1rem, 3vw, 1.25rem); border: 1px solid var(--border); box-shadow: inset 0 2px 5px rgba(0,0,0,0.01); width: 100%; box-sizing: border-box; overflow: hidden;">
                    <div style="color: var(--primary-dark); font-size: 1.1rem; font-weight: 800; margin-bottom: ${service.items.length > 0 ? '1rem' : '0'}; display: flex; align-items: center; gap: 10px; word-break: break-word;">
                        <span style="display: inline-block; width: 10px; height: 10px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary-light); flex-shrink: 0;"></span>
                        <span style="flex: 1;">${escapeHtml(service.category)}</span>
                    </div>
                    ${service.items.length > 0 ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding-inline-start: clamp(0.5rem, 2vw, 1rem);">
                            ${service.items.map(item => `
                                <div style="background: #f1f5f9; color: #475569; font-size: 0.9rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 20px; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); max-width: 100%; box-sizing: border-box;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color: #cbd5e1; flex-shrink: 0;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span style="word-break: break-word; overflow-wrap: anywhere; white-space: normal;">${escapeHtml(item)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
      </div>`;
  }

  const shareSectionHtml = `
      <div style="margin-top: 2.5rem; text-align: center;">
        <h4 style="font-size: 1.15rem; font-weight: 900; color: var(--primary); margin-bottom: 1.25rem;">
          ${state.currentLang === 'ar' ? 'شارك مع:' : 'Share with:'}
        </h4>
        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; align-items: center;">
            <a href="https://api.whatsapp.com/send?text=${encodedShareText}" target="_blank" title="WhatsApp" style="background: #25D366; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(37,211,102,0.2);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></a>
            <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareMessageText)}" target="_blank" title="Telegram" style="background: #0088cc; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(0,136,204,0.2);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" title="Facebook" style="background: #1877F2; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(24,119,242,0.2);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
            <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(shareMessageText)}" target="_blank" title="X (Twitter)" style="background: #000000; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.2);"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 4.15H5.059z"/></svg></a>
        </div>
      </div>
  `;

  document.getElementById('fullProfileContent').innerHTML = `
    <div class="grid grid-1 grid-2" style="gap: 1.5rem; align-items: start;">
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="background: white; border-radius: 20px; padding: 1.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; background: rgba(14, 165, 233, 0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(14,165,233,0.1);">
              <div style="background: white; color: var(--primary); padding: 0.75rem; border-radius: 12px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(14,165,233,0.1);">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.2rem;">${state.currentLang === 'ar' ? 'العنوان الدقيق' : 'Exact Location'}</div>
                <div style="font-weight: 900; color: #0f172a; font-size: 1.1rem; line-height: 1.4;">${escapeHtml(doc.exact_location)}, <span style="color: var(--primary);">${escapeHtml(t(doc.municipality))}</span></div>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 1rem; background: rgba(16, 185, 129, 0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(16,185,129,0.1);">
              <div style="background: white; color: #10b981; padding: 0.75rem; border-radius: 12px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(16,185,129,0.1);">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.2rem;">${state.currentLang === 'ar' ? 'رقم العيادة' : 'Clinic Phone'}</div>
                <div style="font-weight: 900; color: #0f172a; font-size: 1.25rem; letter-spacing: 1px;" dir="ltr">${escapeHtml(formatPhoneNumber(doc.phone))}</div>
              </div>
            </div>
        </div>

        <div style="background: white; border-radius: 20px; padding: 1.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03);">
          <div style="font-size: 1.15rem; font-weight: 900; color: #0f172a; margin-bottom: 1.25rem; display: flex; gap: 0.75rem; align-items: center;">
            <span style="background: rgba(14, 165, 233, 0.1); color: var(--primary); padding: 0.6rem; border-radius: 10px; display: flex; box-shadow: inset 0 2px 4px rgba(14,165,233,0.1);">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </span>
            <span>${state.currentLang === 'ar' ? 'أوقات العمل المتاحة' : 'Available Working Hours'}</span>
          </div>
          <div>${scheduleHtml}</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="background: white; border-radius: 20px; padding: 1.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03);">
          <div style="font-size: 1.15rem; font-weight: 900; color: #0f172a; margin-bottom: 1.25rem; display: flex; gap: 0.75rem; align-items: center;">
            <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.6rem; border-radius: 10px; display: flex; box-shadow: inset 0 2px 4px rgba(239,68,68,0.1);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </span>
            <span>${state.currentLang === 'ar' ? 'الموقع على الخريطة' : 'Map Location'}</span>
          </div>
          
          <div style="border-radius: 12px; overflow: hidden; border: 1px solid var(--border); margin-bottom: ${doc.map_link ? '1rem' : '0'}; position: relative; padding-bottom: 65%; height: 0; background: #f8fafc;">
           <iframe 
    src="https://maps.google.com/maps?q=${encodeURIComponent(doc.exact_location + ' ' + t(doc.municipality) + ' Relizane')}&t=&z=15&ie=UTF8&iwloc=&output=embed" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
    allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
</iframe>
          </div>

          ${doc.map_link ? `
          <a href="${doc.map_link}" target="_blank" class="btn" style="width: 100%; justify-content: center; background: #fff5f5; color: #ef4444; border: 1px solid #fca5a5; padding: 0.85rem; font-weight: 800; font-size: 0.95rem; border-radius: 10px; transition: all 0.2s;" onmouseover="this.style.background='#ef4444'; this.style.color='white';" onmouseout="this.style.background='#fff5f5'; this.style.color='#ef4444';">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-inline-end:0.4rem;"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            ${state.currentLang === 'ar' ? 'فتح تطبيق الخرائط للتوجه' : 'Open in Maps App'}
          </a>` : ''}
        </div>

        <div style="background: white; padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(0,0,0,0.03); text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.03);">
            <div style="color: #0f172a; font-weight: 900; font-size: 1.15rem; margin-bottom: 1.5rem;">
                <span style="background: rgba(14, 165, 233, 0.1); color: var(--primary); padding: 0.6rem; border-radius: 10px; display: inline-flex; vertical-align: bottom; margin-inline-end: 8px; box-shadow: inset 0 2px 4px rgba(14,165,233,0.1);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                </span>
                ${state.currentLang === 'ar' ? 'إمسح الرمز لحفظ جهة الاتصال' : 'Scan to save contact'}
            </div>
            <div id="vcard-qrcode" style="display: inline-flex; justify-content: center; align-items: center; padding: 1.25rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; box-shadow: inset 0 2px 5px rgba(0,0,0,0.01); width: 140px; height: 140px; margin: 0 auto;"></div>
        </div>
      </div>
  </div>
${Array.isArray(doc.clinic_images) && doc.clinic_images.length > 0 ? `
<style>
/* إعدادات الحاوية للسلايدر المستمر */
.clinic-marquee-wrapper {
    overflow: hidden;
    width: 100%;
    position: relative;
    padding: 10px 0;
    background: #f1f5f9;
    border-radius: 16px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
}

/* المسار الذي يتحرك بشكل مستمر */
.clinic-marquee-track {
    display: flex;
    width: max-content;
    gap: 15px;
    animation: marqueeScroll 25s linear infinite; 
}

/* إيقاف الحركة عند وضع الماوس (للحاسوب) أو اللمس (للهاتف) */
.clinic-marquee-wrapper:hover .clinic-marquee-track,
.clinic-marquee-wrapper:active .clinic-marquee-track {
    animation-play-state: paused;
}

@keyframes marqueeScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

.clinic-marquee-item {
    width: 280px;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    cursor: zoom-in;
    flex-shrink: 0;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clinic-marquee-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
}

@media (max-width: 768px) {
    .clinic-marquee-item { width: 280px; height: 200px; }
}
@media (max-width: 480px) {
    .clinic-marquee-item { width: 280px; height: 200px; }
}
</style>

<!-- هذا هو كود السلايدر الذي كان مفقوداً -->
<div style="margin-top: 1.5rem; background: white; border-radius: 20px; padding: 1.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); max-width: 90%px; margin-left: auto; margin-right: auto;">
    <h4 style="font-size: 1.15rem; font-weight: 900; margin-bottom: 1rem; color: #0f172a;">
        ${state.currentLang === 'ar' ? 'صور العيادة' : 'Clinic Gallery'}
    </h4>
    
    <div class="clinic-marquee-wrapper" dir="ltr">
        <div class="clinic-marquee-track">
            ${doc.clinic_images.map((url, index) => `
                <div class="clinic-marquee-item" onclick="window.openClinicLightbox('${url}', ${index}, '${doc.id}')">
                    <img src="${url}" onerror="this.parentElement.style.display='none'" alt="Clinic Image ${index + 1}" loading="lazy" decoding="async">
                </div>
            `).join('')}
            ${doc.clinic_images.map((url, index) => `
                <div class="clinic-marquee-item" onclick="window.openClinicLightbox('${url}', ${index}, '${doc.id}')">
                    <img src="${url}" onerror="this.parentElement.style.display='none'" alt="Clinic Image Copy" loading="lazy" decoding="async">
                </div>
            `).join('')}
        </div>
    </div>
</div>

<!-- كود نافذة التكبير -->
<div id="clinicLightbox_${doc.id}" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 99999; align-items: center; justify-content: center; padding: 1rem;" onclick="window.closeClinicLightbox('${doc.id}')">
    <button onclick="event.stopPropagation(); window.closeClinicLightbox('${doc.id}')" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); width: 44px; height: 44px; border-radius: 50%; color: white; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: background 0.3s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.8)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">×</button>
    
    ${doc.clinic_images.length > 1 ? `
    <button onclick="event.stopPropagation(); window.navigateLightbox(-1, '${doc.id}')" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); width: 50px; height: 50px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; backdrop-filter: blur(4px); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    ` : ''}

    <img id="clinicLightboxImg_${doc.id}" src="" style="max-width: 85vw; max-height: 85vh; object-fit: contain; border-radius: 12px; box-shadow: 0 25px 80px rgba(0,0,0,0.6); cursor: default; transition: opacity 0.2s ease-in-out;" onclick="event.stopPropagation()">
    
    ${doc.clinic_images.length > 1 ? `
    <button onclick="event.stopPropagation(); window.navigateLightbox(1, '${doc.id}')" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); width: 50px; height: 50px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; backdrop-filter: blur(4px); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
    ` : ''}
</div>
` : ''}
    ${servicesHtml}

    ${doc.extra_info ? `
    <div style="margin-top: 1.5rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 20px; padding: 1.25rem; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.05);">
      <h4 style="font-size: 1.15rem; font-weight: 900; margin-bottom: 1rem; color: #d97706; display: flex; align-items: center; gap: 0.6rem;">
        <span style="background: rgba(245, 158, 11, 0.15); padding: 0.6rem; border-radius: 10px; display: flex;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>
        ${state.currentLang === 'ar' ? 'معلومات إضافية' : 'Extra Information'}
      </h4>
      <p style="color: #92400e; font-size: 1.05rem; line-height: 1.7; margin: 0; font-weight: 500;">${escapeHtml(doc.extra_info)}</p>
    </div>` : ''}

    ${shareSectionHtml}

    <div style="position: sticky; bottom: 0; background: var(--surface); padding: 1rem; margin-top: 2rem; border-top: 1px solid var(--border); box-shadow: 0 -4px 10px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 0.75rem; z-index: 100; border-radius: 20px 20px 0 0;">
      <div style="display: flex; gap: 0.5rem; width: 100%;">
          <button class="btn" style="background: white; border: 1px solid var(--border); color: #0f172a; padding: 0.75rem; font-size: 0.9rem; flex: 1; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" onclick="window.openFullReviewsPage('${doc.id}')">
            <span style="color: #f59e0b; font-size: 1.2rem;">★</span> ${state.currentLang === 'ar' ? 'التقييمات' : 'Reviews'}
          </button>
          
          <button class="btn" style="background: white; border: 1px solid var(--border); color: #0f172a; padding: 0.75rem; font-size: 0.9rem; flex: 1; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="navigator.clipboard.writeText('${profileUrl}'); window.showToast('${state.currentLang === 'ar' ? 'تم نسخ الرابط بنجاح' : 'Copied'}', 'success');">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary)" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            ${shareText}
          </button>
      </div>
      <button class="btn ${isBookingEnabled ? 'btn-success' : 'btn-secondary'}" style="width: 100%; padding: 0.85rem; font-size: 1rem; font-weight: 900; letter-spacing: 0.5px; border-radius: 12px; justify-content: center; display: flex; align-items: center;" ${isBookingEnabled ? `onclick="window.openBooking('${doc.id}')"` : 'disabled'}>
        ${isBookingEnabled ? (state.currentLang === 'ar' ? 'احجز موعد الآن' : 'Book Appointment') : (state.currentLang === 'ar' ? 'الحجوزات مغلقة حالياً' : 'Bookings Closed')}
      </button>
    </div>
  `;
  
  window.router('doctor-profile');
  window.history.replaceState({ view: 'doctor-profile' }, document.title, `/doctors/${doc.id}.html`);

  setTimeout(() => {
      const qrContainer = document.getElementById('vcard-qrcode');
      if (qrContainer) {
          qrContainer.innerHTML = '';
          if (typeof QRCode !== 'undefined') {
              try {
                  const utf8vCard = unescape(encodeURIComponent(vCard));
                  new QRCode(qrContainer, { text: utf8vCard, width: 140, height: 140, colorDark : "#0f172a", colorLight : "#f8fafc", correctLevel : QRCode.CorrectLevel.L });
              } catch (e) {
                  console.warn("QR Library failed, using fallback APIs...");
                  qrContainer.innerHTML = `<img src="${qrPrimary}" data-fallback-url="${qrFallback}" onerror="window.handleQrError(this)" alt="QR Code" style="width: 140px; height: 140px; mix-blend-mode: multiply;" />`;
              }
          } else {
              qrContainer.innerHTML = `<img src="${qrPrimary}" data-fallback-url="${qrFallback}" onerror="window.handleQrError(this)" alt="QR Code" style="width: 140px; height: 140px; mix-blend-mode: multiply;" />`;
          }
      }

      if (Array.isArray(doc.clinic_images) && doc.clinic_images.length > 1) {
          window.initClinicSlider(`clinicSlider_${doc.id}`, doc.id, doc.clinic_images.length);
      }
  }, 150);
}

export function renderDashboardUI(data, doctorId) {
  state.globalDashboardData = data;
  state.globalDashboardDoctorId = doctorId;

let rawDashName = data.doctorName;
if (data.doctorDetails) {
    rawDashName = state.currentLang === 'en' && data.doctorDetails.first_name_en && data.doctorDetails.last_name_en 
        ? `${data.doctorDetails.first_name_en} ${data.doctorDetails.last_name_en}` 
        : `${data.doctorDetails.first_name} ${data.doctorDetails.last_name}`;
}
document.getElementById('dashboardSubtitle').textContent = rawDashName ? (state.currentLang === 'ar' ? `د. ${rawDashName}` : `Dr. ${rawDashName}`) : doctorId;
  const daysNames = state.currentLang === 'ar' ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let savedDays = {};
  try { savedDays = JSON.parse(data.workingDays || '{}'); } catch(e) {}

  const container = document.getElementById('daysListContainer');
  container.innerHTML = '';
  for (let i = 0; i <= 6; i++) {
    const dayData = savedDays[i.toString()] || { active: true, start: '08:00', end: '16:00' };
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; background: var(--bg); padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--border);';
    row.innerHTML = `
      <div style="flex: 1; min-width: 100px; display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="day_active_${i}" ${dayData.active ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
        <label for="day_active_${i}" style="margin: 0; cursor: pointer; font-weight: bold;">${daysNames[i]}</label>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="time" id="day_start_${i}" value="${dayData.start}" style="padding: 0.4rem; max-width: 110px;">
        <span>-</span>
        <input type="time" id="day_end_${i}" value="${dayData.end}" style="padding: 0.4rem; max-width: 110px;">
      </div>
    `;
    container.appendChild(row);
  }
// 🔴 جلب الأسماء باللغتين
    const fNameAr = document.getElementById('dash_first_name_ar');
    const lNameAr = document.getElementById('dash_last_name_ar');
    const fNameEn = document.getElementById('dash_first_name_en');
    const lNameEn = document.getElementById('dash_last_name_en');
    
    if(fNameAr) fNameAr.value = data.doctorDetails.first_name || '';
    if(lNameAr) lNameAr.value = data.doctorDetails.last_name || '';
    if(fNameEn) fNameEn.value = data.doctorDetails.first_name_en || '';
    if(lNameEn) lNameEn.value = data.doctorDetails.last_name_en || '';
  if (data.doctorDetails) {
    document.getElementById('dash_contact_email').value = data.doctorDetails.contact_email || '';
    document.getElementById('dash_whatsapp').value = data.doctorDetails.whatsapp_number || '';
    document.getElementById('dash_facebook').value = data.doctorDetails.facebook_link || '';
    document.getElementById('dash_map_link').value = data.doctorDetails.map_link || '';
    
    const certInput = document.getElementById('dash_certificates');
    if (certInput) certInput.value = data.doctorDetails.certificates || '';
    
    window.dashboardCurrentImages = data.doctorDetails.clinic_images || [];
    if (typeof window.renderClinicImageThumbnails === 'function') window.renderClinicImageThumbnails();
    
    const srvContainer = document.getElementById('servicesContainer');
    if (srvContainer) srvContainer.innerHTML = '';
    
    if (data.doctorDetails.services && Array.isArray(data.doctorDetails.services) && data.doctorDetails.services.length > 0) {
        data.doctorDetails.services.forEach(s => window.addServiceCategory(s.category, s.items.join('، ')));
    } else {
        window.addServiceCategory(); 
    }
  }

  const isEnabled = !!data.bookingEnabled;
  const toggleSwitch = document.getElementById('bookingToggleSwitch');
  if (toggleSwitch) toggleSwitch.checked = isEnabled;
  updateToggleText(isEnabled);

  const appointments = data.appointments || [];
  const tbody = document.getElementById('appointmentsTable');
  const empty = document.getElementById('noAppointments');

  if (appointments.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  const confirmTxt = state.currentLang === 'ar' ? 'تأكيد' : 'Confirm';
  const cancelTxt = state.currentLang === 'ar' ? 'إلغاء' : 'Cancel';
  const completedTxt = state.currentLang === 'ar' ? 'مكتمل' : 'Completed';

  empty.classList.add('hidden');
  tbody.innerHTML = appointments.map(a => {
    const statusTextDb = a.status || 'pending';
    const bookingId = a.id;
    const patientName = a.patient_name;
    const patientPhone = a.patient_phone;
    const apptDate = a.appointment_date;
    const apptTime = a.appointment_time;
    const userEmail = a.user_email || '';

    let displayStatus = statusTextDb;
    let statusStyle = 'background: #f1f5f9; color: #64748b; border: 0.5px solid #cbd5e1;';

    if (statusTextDb === 'confirmed') {
      statusStyle = 'background: #ecfdf5; color: #10b981; border: 0.5px solid #a7f3d0;';
      displayStatus = state.currentLang === 'ar' ? 'مؤكد' : 'Confirmed';
    } else if (statusTextDb === 'cancelled') {
      statusStyle = 'background: #fef2f2; color: #ef4444; border: 0.5px solid #fecaca;';
      displayStatus = state.currentLang === 'ar' ? 'ملغى' : 'Cancelled';
    } else if (statusTextDb === 'pending') {
      displayStatus = state.currentLang === 'ar' ? 'قيد الانتظار' : 'Pending';
    }

    let statusIndicator = '#f59e0b';
    if (statusTextDb === 'confirmed') statusIndicator = '#10b981';
    if (statusTextDb === 'cancelled') statusIndicator = '#ef4444';

    const actionsHtml = (statusTextDb === 'pending') ? `
      <button class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: #ecfdf5; border: 1px solid #10b981; color: #10b981; border-radius: 6px;" 
        onclick="window.changeBookingStatus('${bookingId}', 'confirmed', '${userEmail}', '${escapeHtml(data.doctorName)}', '${apptDate}')">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-inline-end: 0.25rem; vertical-align: middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>${confirmTxt}
      </button>
      <button class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: #fef2f2; border: 1px solid #ef4444; color: #ef4444; border-radius: 6px;" 
        onclick="window.changeBookingStatus('${bookingId}', 'cancelled', '${userEmail}', '${escapeHtml(data.doctorName)}', '${apptDate}')">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-inline-end: 0.25rem; vertical-align: middle;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>${cancelTxt}
      </button>
    ` : `<span class="badge" style="background: var(--bg); color: var(--text-secondary); border: 1px solid var(--border); padding: 0.4rem 0.8rem;"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-inline-end: 0.25rem; vertical-align: middle;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>${completedTxt}</span>`;

    return `
    <div class="card-hover" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
      <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 4px; background: ${statusIndicator};"></div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-right: 0.5rem;">
        <div style="flex: 1; min-width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="font-family: monospace; font-size: 0.85rem; color: var(--text-secondary); background: var(--bg); padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid var(--border); letter-spacing: 0.5px;">${bookingId.substring(0, 8)}...</span>
            <span class="badge" style="${statusStyle}">${escapeHtml(displayStatus)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h4 style="font-size: 1.15rem; font-weight: bold; color: var(--text); margin-bottom: 0.25rem;">${escapeHtml(patientName)}</h4>
              <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--primary); font-size: 0.95rem; font-weight: 600; direction: ltr; justify-content: flex-end;">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                ${escapeHtml(formatPhoneNumber(patientPhone))}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-top: 1px dashed var(--border); padding-top: 0.75rem; margin-top: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.9rem;">
              <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-secondary);">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span dir="ltr">${escapeHtml(apptDate)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-secondary);">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span dir="ltr">${escapeHtml(apptTime)}</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${actionsHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('');
}

export function generateTimeSlots(startStr, endStr, intervalMins) {
  const slots = [];
  let [startH, startM] = startStr.split(':').map(Number);
  let [endH, endM] = endStr.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current < end) {
    let h = Math.floor(current / 60);
    let m = current % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    current += intervalMins;
  }
  return slots;
}

export function displayTimeSlots(container, slots, timeInput) {
  const morningDiv = document.createElement('div');
  morningDiv.style.cssText = 'grid-column: 1 / -1; margin-bottom: 1rem; border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; background: var(--surface);';
  morningDiv.innerHTML = `
    <h4 style="font-size:0.95rem; color:var(--text); margin-bottom:0.75rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.25rem; display: inline-block;">
      ☀️ <span>${t('morningSession')}</span>
    </h4>
    <div class="slots-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap:0.5rem;"></div>
  `;

  const eveningDiv = document.createElement('div');
  eveningDiv.style.cssText = 'grid-column: 1 / -1; margin-bottom: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; background: var(--surface);';
  eveningDiv.innerHTML = `
    <h4 style="font-size:0.95rem; color:var(--text); margin-bottom:0.75rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.25rem; display: inline-block;">
      🌙 <span>${t('eveningSession')}</span>
    </h4>
    <div class="slots-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap:0.5rem;"></div>
  `;

  slots.forEach(slot => {
    const btn = document.createElement('div');
    btn.className = 'time-slot-btn';
    btn.textContent = slot;
    btn.onclick = () => {
      document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      timeInput.value = slot;
    };

    const hour = parseInt(slot.split(':')[0]);
    if (hour < 12) {
      morningDiv.querySelector('.slots-grid').appendChild(btn);
    } else {
      eveningDiv.querySelector('.slots-grid').appendChild(btn);
    }
  });

  if (morningDiv.querySelector('.slots-grid').hasChildNodes()) container.appendChild(morningDiv);
  if (eveningDiv.querySelector('.slots-grid').hasChildNodes()) container.appendChild(eveningDiv);
}

// ✅ الدالة المفقودة: فتح نافذة الجدول الأسبوعي
export function openScheduleModal(doctorName, scheduleHtml) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; padding: 1rem;';
    const modal = document.createElement('div');
    modal.className = 'card';
    modal.style.cssText = 'width: 100%; max-width: 380px; transform: translateY(30px); transition: transform 0.3s ease; position: relative; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); text-align: center; border-top: 4px solid var(--primary);';
    const titleText = state.currentLang === 'ar' ? 'الجدول الأسبوعي' : 'Weekly Schedule';
    const closeText = state.currentLang === 'ar' ? 'إغلاق النافذة' : 'Close';
    modal.innerHTML = `
        <div style="background: #e6f4ea; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; color: var(--primary);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: bold; color: var(--text); margin-bottom: 0.25rem;">${titleText}</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.25rem; font-weight: 600;">Dr. ${doctorName}</p>
        <div style="background: var(--bg); border-radius: 8px; padding: 1rem; border: 1px solid var(--border); margin-bottom: 1.5rem; text-align: ${state.currentLang === 'ar' ? 'right' : 'left'};">${scheduleHtml}</div>
        <button class="btn btn-primary btn-block" id="closeScheduleModalBtn">${closeText}</button>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; });
    const closeModal = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(30px)'; setTimeout(() => overlay.remove(), 300); };
    modal.querySelector('#closeScheduleModalBtn').onclick = closeModal;
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

// --- ربط الدوال المساعدة للواجهة بنافذة المتصفح (Window) ---
window.toggleWorkingHours = function() {
  const content = document.getElementById('workingHoursContent');
  const header = document.getElementById('workingHoursToggle');
  content.classList.toggle('open');
  header.classList.toggle('open');
};

window.toggleAppointments = function() {
  const content = document.getElementById('appointmentsContent');
  const header = document.getElementById('appointmentsToggle');
  content.classList.toggle('open');
  header.classList.toggle('open');
};

window.handleQrError = function(img) {
  if(!img.dataset.fallback){
      img.dataset.fallback = '1';
      img.src = img.dataset.fallbackUrl;
  }
};

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
      imgDiv.innerHTML = `
          <img src="${url}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Clinic Image">
          <button type="button" onclick="window.removeClinicImage(${index})" 
              style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;"
              onmouseover="this.style.background='red'" onmouseout="this.style.background='rgba(239, 68, 68, 0.9)'" title="حذف الصورة">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
      `;
      container.appendChild(imgDiv);
  });
};

window.removeClinicImage = function(index) {
  const confirmMsg = state.currentLang === 'ar' ? 'هل أنت متأكد من إزالة هذه الصورة؟' : 'Are you sure you want to remove this image?';
  if (confirm(confirmMsg)) {
      window.dashboardCurrentImages.splice(index, 1); 
      window.renderClinicImageThumbnails(); 
  }
};

window.addServiceCategory = function(category = '', items = '') {
  const container = document.getElementById('servicesContainer');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'service-row';
  row.style.cssText = 'display: flex; gap: 0.5rem; align-items: flex-start; background: var(--bg); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border);';
  row.innerHTML = `
      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
          <input type="text" class="svc-category" placeholder="${t('catNamePh')}" value="${escapeHtml(category)}">
          <input type="text" class="svc-items" placeholder="${t('svcItemsPh')}" value="${escapeHtml(items)}">
      </div>
      <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="padding: 0.5rem; color: var(--danger); border-color: var(--danger);" title="حذف">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
  `;
  container.appendChild(row);
};

window.showToast = showToast; // لضمان وصولها من الـ HTML
// ==========================================
// نظام تحريك الصور (السلايدر التسويقي)
// ==========================================

let slideIndex = 0;
let slideTimer;

function showSlides(n) {
  let slides = document.getElementsByClassName("pitch-slide");
  let dots = document.getElementsByClassName("dot");

  if (slides.length === 0) return;

  if (n !== undefined) {
    slideIndex = n;
    clearInterval(slideTimer); 
    slideTimer = setInterval(() => showSlides(), 4000); 
  } else {
    slideIndex++; 
  }

  if (slideIndex > slides.length) { slideIndex = 1; }
  if (slideIndex < 1) { slideIndex = slides.length; }

  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove("active");
  }
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active");
  }

  slides[slideIndex - 1].classList.add("active");
  dots[slideIndex - 1].classList.add("active");
}

// جعل الدالة متاحة عالمياً (مهم جداً لأنك تستخدم Modules)
window.currentSlide = function(n) {
  showSlides(n);
};

// تشغيل السلايدر بمجرد تحميل الصفحة
document.addEventListener("DOMContentLoaded", function() {
  showSlides(1); 
  slideTimer = setInterval(() => showSlides(), 4000); 
});
