// ==========================================
// chatbot.js - نظام المستشار الطبي (كامل ومصلح)
// ==========================================
import { state } from './state.js';
import { t, escapeHtml, formatPhoneNumber } from './utils.js';

// 1. تنظيف النصوص
const normalizeText = (text) => {
    if (!text) return "";
    return text.trim().toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ًٌٍَُِّْ]/g, '') 
        .replace(/[^a-z0-9ا-ي\s]/g, ''); 
};

// 2. فحص الطوارئ
function detectEmergency(rawMsg) {
    if (!rawMsg) return false;
    const msg = rawMsg.toLowerCase();
    const emergencyKeywords = [
        'نزيف', 'جلطة', 'غيبوبة', 'حادث', 'طوارئ', 'نوبة قلبية', 'اختناق', 'حرق شديد',
        'emergency', 'stroke', 'bleeding', 'coma', 'accident', 'heart attack', 'choking'
    ];
    return emergencyKeywords.some(keyword => msg.includes(keyword));
}

function getEmergencyResponse() {
    return state.currentLang === 'ar'
        ? `🚨 <strong>تنبيه حالة طارئة:</strong><br><br>عذراً، أنا مساعد آلي ولا يمكنني التعامل مع الحالات الطبية الحرجة الحية.<br><br>📞 <strong>الرجاء الاتصال فوراً بالحماية المدنية أو الإسعاف على الرقم: <span style="color: #ef4444; font-size: 1.3rem;">141</span></strong>`
        : `🚨 <strong>Emergency Alert:</strong><br><br>Sorry, I am an AI assistant and cannot handle acute or critical medical emergencies.<br><br>📞 <strong>Please immediately call emergency services at: <span style="color: #ef4444; font-size: 1.3rem;">141</span></strong>`;
}

// 3. بناء بطاقات الأطباء
function generateCardsHtml(doctorsList) {
    return doctorsList.map(doc => {
        const docPrefix = state.currentLang === 'ar' ? 'د.' : 'Dr.';
        return `
        <div class="bot-card-result" style="border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-top: 12px; background: var(--surface); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="font-weight: bold; color: var(--primary-dark); font-size: 1.05rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                ${docPrefix} ${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}
            </div>
            <div style="color: var(--text); font-size: 0.9rem; margin-bottom: 4px;"><strong>${t('chatSpecLabel')}</strong> ${escapeHtml(t(doc.specialty))}</div>
            <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 8px;"><strong>${t('chatMunLabel')}</strong> ${escapeHtml(t(doc.municipality))}</div>
            <div style="font-size: 0.9rem; margin-bottom: 4px;"><strong>${t('chatPhoneLabel')}</strong> <span dir="ltr" style="display: inline-block; direction: ltr; color: var(--primary); font-weight: 600;">${escapeHtml(formatPhoneNumber(doc.phone))}</span></div>
            
            <button onclick="document.getElementById('medicalChatbot').classList.add('hidden'); window.openDoctorProfileModal(window.state.allDoctors.find(d => d.id === '${doc.id}'), '${docPrefix} ${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}')" 
                    style="margin-top: 12px; background: var(--primary); color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 0.9rem; font-weight: bold; width: 100%; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${t('chatBookDetailsBtn')}
            </button>
        </div>`;
    }).join('');
}

// 4. الدالة الرئيسية للمنطق (كودك الأصلي المحدّث)
const processUserMessage = (rawMsg) => {
    const cleanMsg = normalizeText(rawMsg);
    
    // معالجة الأوامر العامة أولاً
    if (cleanMsg.includes('حجز موعد') || cleanMsg.includes('احجز موعد') || cleanMsg === 'حجز') {
        return state.currentLang === 'ar' 
            ? `لحجز موعد، يمكنك:<br><br>
               1️⃣ <strong>البحث عن طبيب</strong> أولاً (اكتب التخصص أو الاسم)<br>
               2️⃣ ثم اضغط على زر "عرض التفاصيل والحجز"<br><br>
               💡 <strong>مثال:</strong> اكتب "طبيب عيون في غليزان"`
            : `To book an appointment:<br><br>
               1️⃣ <strong>Search for a doctor</strong> first (type specialty or name)<br>
               2️⃣ Then click "View Details & Book"<br><br>
               💡 <strong>Example:</strong> Type "eye doctor in Relizane"`;
    }
    
    if (cleanMsg.includes('أريد طبيب') || cleanMsg.includes('ابحث عن طبيب') || cleanMsg === 'طبيب') {
        return state.currentLang === 'ar'
            ? `أهلاً بك! 👋<br><br>
               💡 <strong>كيف يمكنني مساعدتك في العثور على الطبيب المناسب؟</strong><br><br>
               يمكنك البحث عن طريق:<br>
               • <strong>التخصص:</strong> "طبيب عيون"، "طبيب أسنان"<br>
               • <strong>البلدية:</strong> "أطباء في غليزان"<br>
               • <strong>الاسم:</strong> "د. أمين"<br>
               • <strong>أو الكل معاً:</strong> "طبيب أطفال في مازونة"`
            : `Welcome! 👋<br><br>
               💡 <strong>How can I help you find the right doctor?</strong><br><br>
               You can search by:<br>
               • <strong>Specialty:</strong> "eye doctor", "dentist"<br>
               • <strong>Municipality:</strong> "doctors in Relizane"<br>
               • <strong>Name:</strong> "Dr. Amine"<br>
               • <strong>Or combined:</strong> "pediatrician in Mazouna"`;
    }
    
    if (cleanMsg.includes('نصيحة') || cleanMsg.includes('نصائح طبية') || cleanMsg === 'نصيحة' || cleanMsg === 'نصائح') {
        return state.currentLang === 'ar'
            ? `🩺 <strong>نصائح طبية عامة:</strong><br><br>
               ✅ اشرب 8 أكواب ماء يومياً<br>
               ✅ نم 7-8 ساعات يومياً<br>
               ✅ مارس الرياضة 30 دقيقة يومياً<br>
               ✅ تناول الفواكه والخضروات<br>
               ✅ تجنب التدخين<br><br>
               ⚠️ <strong>للحالات الطارئة، اتصل بـ 141</strong>`
            : `🩺 <strong>General Medical Advice:</strong><br><br>
               ✅ Drink 8 glasses of water daily<br>
               ✅ Sleep 7-8 hours daily<br>
               ✅ Exercise 30 minutes daily<br>
               ✅ Eat fruits and vegetables<br>
               ✅ Avoid smoking<br><br>
               ⚠️ <strong>For emergencies, call 141</strong>`;
    }

    // التحقق من الحالة الطارئة
    if (detectEmergency(rawMsg)) {
        return getEmergencyResponse();
    }

    // البحث في قاعدة البيانات
    if (!state.allDoctors || state.allDoctors.length === 0) return t('chatLoadingDB');
    
    const availableSpecialties = [...new Set(state.allDoctors.map(d => d.specialty).filter(Boolean))];
    const availableMunicipalities = [...new Set(state.allDoctors.map(d => d.municipality).filter(Boolean))];
    let detectedSpecialty = null, detectedMunicipality = null, detectedName = null;

    for (const spec of availableSpecialties) { 
        if (cleanMsg.includes(normalizeText(t(spec)))) { 
            detectedSpecialty = spec; 
            break; 
        } 
    }
    for (const mun of availableMunicipalities) { 
        if (cleanMsg.includes(normalizeText(t(mun)))) { 
            detectedMunicipality = mun; 
            break; 
        } 
    }
    detectedName = state.allDoctors.find(doc => { 
        const fullName = normalizeText((doc.first_name || "") + " " + (doc.last_name || "")); 
        return cleanMsg.split(' ').some(w => w.length >= 3 && fullName.includes(w)); 
    });

    let matchedDoctors = [];
    let responsePrefix = '';
    
    if (detectedSpecialty && detectedMunicipality) {
        matchedDoctors = state.allDoctors.filter(doc => doc.specialty === detectedSpecialty && doc.municipality === detectedMunicipality);
        responsePrefix = state.currentLang === 'ar' 
            ? `وجدت لك ${matchedDoctors.length} طبيباً متخصصاً في <strong>${t(detectedSpecialty)}</strong> في <strong>${t(detectedMunicipality)}</strong>. إليك أبرز النتائج:` 
            : `Found ${matchedDoctors.length} <strong>${t(detectedSpecialty)}</strong> doctors in <strong>${t(detectedMunicipality)}</strong>. Here are the top results:`;
    } else if (detectedSpecialty) {
        matchedDoctors = state.allDoctors.filter(doc => doc.specialty === detectedSpecialty);
        responsePrefix = state.currentLang === 'ar' 
            ? `إليك قائمة بأفضل الأطباء المتخصصين في <strong>${t(detectedSpecialty)}</strong>:` 
            : `Here is a list of top <strong>${t(detectedSpecialty)}</strong> specialists:`;
    } else if (detectedMunicipality) {
        matchedDoctors = state.allDoctors.filter(doc => doc.municipality === detectedMunicipality);
        responsePrefix = state.currentLang === 'ar' 
            ? `إليك جميع الأطباء المتوفرين في بلدية <strong>${t(detectedMunicipality)}</strong>:` 
            : `Here are all available doctors in <strong>${t(detectedMunicipality)}</strong>:`;
    } else if (detectedName) {
        matchedDoctors = state.allDoctors.filter(doc => { 
            const fullName = normalizeText((doc.first_name || "") + " " + (doc.last_name || "")); 
            return cleanMsg.split(' ').some(w => w.length >= 3 && fullName.includes(w)); 
        });
        responsePrefix = state.currentLang === 'ar' 
            ? `وجدت نتائج مطابقة لاسم "<strong>${detectedName.first_name} ${detectedName.last_name}</strong>":` 
            : `Found results matching "<strong>${detectedName.first_name} ${detectedName.last_name}</strong>":`;
    } else {
        matchedDoctors = state.allDoctors.filter(doc => { 
            const text = normalizeText(`${doc.first_name||''} ${doc.last_name||''} ${doc.specialty||''} ${doc.municipality||''} ${doc.exact_location||''}`); 
            return cleanMsg.split(' ').some(w => w.length >= 3 && text.includes(w)); 
        });
        if (matchedDoctors.length > 0) {
            responsePrefix = state.currentLang === 'ar' 
                ? `إليك أفضل النتائج المطابقة لبحثك:` 
                : `Here are the best results matching your search:`;
        }
    }

    if (matchedDoctors.length === 0) {
        return state.currentLang === 'ar' 
            ? `عذراً، لم أتمكن من العثور على أطباء يطابقون بحثك "<strong>${rawMsg}</strong>".<br><br>💡 <strong>جرب البحث بـ:</strong><br>• اسم الطبيب (مثل: د. أمين)<br>• التخصص (مثل: طبيب عيون، أسنان)<br>• البلدية (مثل: غليزان، وادي رهيو)<br>• أو مزيج (مثل: طبيب أطفال في مازونة)` 
            : `Sorry, I couldn't find any doctors matching "<strong>${rawMsg}</strong>".<br><br>💡 <strong>Try searching by:</strong><br>• Doctor's name (e.g. Dr. Amine)<br>• Specialty (e.g. eye doctor, dentist)<br>• Municipality (e.g. Relizane, Oued Rhiou)<br>• Or a combination (e.g. pediatrician in Mazouna)`;
    }

    let response = responsePrefix;
    const remaining = matchedDoctors.length - Math.min(3, matchedDoctors.length);
    if (remaining > 0) {
        response += state.currentLang === 'ar' 
            ? `<br><span style="color: var(--text-secondary); font-size: 0.85rem;">📋 و ${remaining} نتيجة أخرى متاحة في الدليل الرئيسي</span>` 
            : `<br><span style="color: var(--text-secondary); font-size: 0.85rem;">📋 And ${remaining} more results available in the main directory</span>`;
    }
    
    response += generateCardsHtml(matchedDoctors.slice(0, 3));
    return response;
};

// 5. ربط الواجهة وتفعيل الأحداث
export function initChatbot() {
    const chatbotToggleBtn = document.getElementById('chatbotToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const medicalChatbot = document.getElementById('medicalChatbot');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInputText = document.getElementById('chatInputText');
    const chatMessages = document.getElementById('chatMessages');

    if (!chatbotToggleBtn || !medicalChatbot) return;

    const toggleChat = () => {
        medicalChatbot.classList.toggle('hidden');
        if (!medicalChatbot.classList.contains('hidden')) {
            chatInputText.focus();
        }
    };

    chatbotToggleBtn.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', toggleChat);

    const handleSend = () => {
        const text = chatInputText.value.trim();
        if (!text) return;

        const userMsg = document.createElement('div');
        userMsg.className = `chat-msg user-msg`;
        userMsg.innerHTML = escapeHtml(text);
        chatMessages.appendChild(userMsg);

        chatInputText.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const typingId = "typing-" + Date.now();
        const botTyping = document.createElement('div');
        botTyping.className = `chat-msg bot-msg`;
        botTyping.innerHTML = `<div id="${typingId}" class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
        chatMessages.appendChild(botTyping);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            const typingIndicator = document.getElementById(typingId);
            if (typingIndicator) typingIndicator.parentElement.remove();
            
            const botResponseHtml = processUserMessage(text);
            const botRes = document.createElement('div');
            botRes.className = `chat-msg bot-msg`;
            botRes.innerHTML = botResponseHtml;
            chatMessages.appendChild(botRes);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 800);
    };

    sendChatBtn.addEventListener('click', handleSend);
    chatInputText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}
