// ==========================================
// chatbot.js - نظام الشات بوت الذكي (النسخة النهائية)
// ==========================================
import { state } from './state.js';
import { t, escapeHtml } from './utils.js';
import { openDoctorProfileModal } from './ui.js';

// ==========================================
// 1. دوال مساعدة
// ==========================================
function normalizeText(text) {
    if (!text) return "";
    return text.trim().toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ًٌٍَُِّْ]/g, '')
        .replace(/[^a-z0-9ا-ي\s]/g, '');
}

// ==========================================
// 2. نظام الطوارئ الذكي
// ==========================================
const EMERGENCY_KEYWORDS = {
    ar: ['طوارئ', 'طارئ', 'إسعاف', 'نوبة قلبية', 'جلطة', 'نزيف', 'اختناق', 'حادث', 'حريق'],
    en: ['emergency', 'urgent', 'ambulance', 'heart attack', 'stroke', 'bleeding', 'accident']
};

function detectEmergency(message) {
    const keywords = EMERGENCY_KEYWORDS[state.currentLang] || [];
    const lowerMsg = message.toLowerCase();
    return keywords.some(kw => lowerMsg.includes(kw));
}
function getEmergencyResponse() {
    return state.currentLang === 'ar' ? `
        <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 16px; color: #991b1b; animation: pulse 2s infinite;">
            <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.5rem;"></span> حالة طارئة!
            </div>
            <div style="margin-bottom: 12px; font-size: 0.95rem;">
                إذا كانت الحالة خطيرة، اتصل فوراً بـ:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <a href="tel:1021" style="background: #ef4444; color: white; padding: 12px; border-radius: 8px; text-align: center; text-decoration: none; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                    <span style="font-size: 1.2rem;">🚑</span> الحماية المدنية: 1021
                </a>
            </div>
            <div style="margin-top: 12px; font-size: 0.85rem; color: #b91c1c; text-align: center;">
                ️ لا تنتظر - اتصل الآن إذا كانت الحالة خطيرة
            </div>
        </div>
    ` : `
        <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 16px; color: #991b1b; animation: pulse 2s infinite;">
            <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.5rem;">🚨</span> Emergency!
            </div>
            <div style="margin-bottom: 12px; font-size: 0.95rem;">
                If the situation is serious, call immediately:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <a href="tel:100" style="background: #ef4444; color: white; padding: 12px; border-radius: 8px; text-align: center; text-decoration: none; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span style="font-size: 1.2rem;"></span> Civil Protection: 100
                </a>
            </div>
        </div>
    `;
}

// ==========================================
// 3. معالجة رسائل المستخدم
// ==========================================
function processUserMessage(rawMsg) {
    const cleanMsg = normalizeText(rawMsg);
    
    // ✅ معالجة الأوامر العامة
    if (cleanMsg.includes('حجز موعد') || cleanMsg.includes('احجز موعد') || cleanMsg === 'حجز') {
        return state.currentLang === 'ar' 
            ? `لحجز موعد، يمكنك:<br><br>
               1️ <strong>البحث عن طبيب</strong> أولاً (اكتب التخصص أو الاسم)<br>
               2️⃣ ثم اضغط على زر "عرض التفاصيل والحجز"<br><br>
               💡 <strong>مثال:</strong> اكتب "طبيب عيون في غليزان"`
            : `To book an appointment:<br><br>
               1️⃣ <strong>Search for a doctor</strong> first (type specialty or name)<br>
               2️⃣ Then click "View Details & Book"<br><br>
               💡 <strong>Example:</strong> Type "eye doctor in Relizane"`;
    }
    
    // التحقق من الحالة الطارئة
    if (detectEmergency(rawMsg)) {
        return getEmergencyResponse();
    }

    // البحث عن الأطباء
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
            : `<br><span style="color: var(--text-secondary); font-size: 0.85rem;"> And ${remaining} more results available</span>`;
    }
    
    response += matchedDoctors.slice(0, 3).map(doc => {
        const docPrefix = state.currentLang === 'ar' ? 'د.' : 'Dr.';
        return `<div class="bot-card-result" style="border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-top: 12px; background: var(--surface);">
            <div style="font-weight: bold; color: var(--primary-dark); font-size: 1.05rem; margin-bottom: 8px;">${docPrefix} ${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}</div>
            <div style="color: var(--text); font-size: 0.9rem; margin-bottom: 4px;"><strong>${t('chatSpecLabel')}</strong> ${escapeHtml(t(doc.specialty))}</div>
            <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 8px;"><strong>${t('chatMunLabel')}</strong> ${escapeHtml(t(doc.municipality))}</div>
            <button onclick="document.getElementById('medicalChatbot').classList.add('hidden'); window.openDoctorProfileModal(state.allDoctors.find(d => d.id === '${doc.id}'), '${docPrefix} ${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}')" style="margin-top: 12px; background: var(--primary); color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: bold; width: 100%;">${t('chatBookDetailsBtn')}</button>
        </div>`;
    }).join('');
    
    return response;
}

// ==========================================
// 4. دالة الإرسال (مصدرة)
// ==========================================
export function handleSend() {
    const chatInputText = document.getElementById('chatInputText');
    const chatMessages = document.getElementById('chatMessages');
    
    const text = chatInputText.value.trim();
    if (!text) return;
    
    // إخفاء الاقتراحات
    const suggestionsDiv = document.getElementById('chatSuggestions');
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
    
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
}

// تصدير الدالة على window لاستخدامها في onclick
window.handleSend = handleSend;

// ==========================================
// 5. رسائل الترحيب الذكية
// ==========================================
function getSmartWelcome() {
    const hour = new Date().getHours();
    const lang = state.currentLang;
    const user = JSON.parse(localStorage.getItem('medicalUser') || 'null');
    
    let greeting = '';
    if (hour < 12) greeting = lang === 'ar' ? 'صباح الخير' : 'Good morning';
    else if (hour < 18) greeting = lang === 'ar' ? 'مساء الخير' : 'Good afternoon';
    else greeting = lang === 'ar' ? 'مساء النور' : 'Good evening';
    
    if (user) {
        greeting += ` ${user.Name}! 👋`;
    } else {
        greeting += '! ';
    }
    
    const subtitle = lang === 'ar' 
        ? 'كيف يمكنني مساعدتك اليوم؟' 
        : 'How can I help you today?';
    
    return `${greeting}<br><span style="color: var(--text-secondary); font-size: 0.9rem;">${subtitle}</span>`;
}

// ==========================================
// 6. الأزرار التفاعلية السريعة (Quick Replies) - زرّان فقط
// ==========================================
function showQuickReplies(chatMessages, replies = []) {
    // إزالة الأزرار القديمة إذا وجدت
    const existingQuick = chatMessages.querySelector('.quick-replies-container');
    if (existingQuick) existingQuick.remove();

    const quickDiv = document.createElement('div');
    quickDiv.className = 'quick-replies-container';
    quickDiv.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; padding: 8px; animation: fadeIn 0.3s ease;';
    
    replies.forEach(reply => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.innerHTML = reply.icon ? `${reply.icon} ${reply.label}` : reply.label;
        btn.style.cssText = `
            background: linear-gradient(135deg, var(--primary-light), var(--primary));
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
        `;
        btn.onmouseover = () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.3)';
        };
        btn.onmouseout = () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.2)';
        };
        btn.onclick = () => {
            quickDiv.remove();
            document.getElementById('chatInputText').value = reply.value;
            window.handleSend();
        };
        quickDiv.appendChild(btn);
    });
    
    chatMessages.appendChild(quickDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================
// 7. نظام الاقتراحات التلقائية (Autocomplete)
// ==========================================
function showChatSuggestions(text) {
    let suggestionsDiv = document.getElementById('chatSuggestions');
    if (!suggestionsDiv) {
        suggestionsDiv = document.createElement('div');
        suggestionsDiv.id = 'chatSuggestions';
        suggestionsDiv.style.cssText = 'position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 400px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 200px; overflow-y: auto; z-index: 10000; display: none;';
        document.body.appendChild(suggestionsDiv);
    }

    if (text.length < 2) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    const suggestions = [];
    const lowerText = text.toLowerCase();

    // اقتراحات الأطباء
    state.allDoctors.forEach(doc => {
        const fullName = `${doc.first_name} ${doc.last_name}`.toLowerCase();
        if (fullName.includes(lowerText)) {
            suggestions.push({
                type: 'doctor',
                icon: '👨️',
                text: `${state.currentLang === 'ar' ? 'د.' : 'Dr.'} ${doc.first_name} ${doc.last_name}`,
                value: `ابحث عن د. ${doc.first_name} ${doc.last_name}`
            });
        }
    });

    // اقتراحات التخصصات
    const specialties = [...new Set(state.allDoctors.map(d => d.specialty))];
    specialties.forEach(spec => {
        if (spec.toLowerCase().includes(lowerText)) {
            suggestions.push({
                type: 'specialty',
                icon: '🩺',
                text: t(spec),
                value: `أريد طبيب ${t(spec)}`
            });
        }
    });

    // اقتراحات البلديات
    const municipalities = [...new Set(state.allDoctors.map(d => d.municipality))];
    municipalities.forEach(mun => {
        if (mun.toLowerCase().includes(lowerText)) {
            suggestions.push({
                type: 'municipality',
                icon: '📍',
                text: t(mun),
                value: `طبيب في ${t(mun)}`
            });
        }
    });

    if (suggestions.length > 0) {
        suggestionsDiv.innerHTML = suggestions.slice(0, 5).map(s => `
            <div class="chat-suggestion" style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.2s; display: flex; align-items: center; gap: 10px;" 
                 onmouseover="this.style.background='var(--bg)'" 
                 onmouseout="this.style.background='white'"
                 onclick="document.getElementById('chatInputText').value='${s.value}'; document.getElementById('chatSuggestions').style.display='none'; window.handleSend();">
                <span style="font-size: 1.2rem;">${s.icon}</span>
                <span style="flex: 1; font-size: 0.9rem; color: var(--text);">${s.text}</span>
                <span style="color: var(--text-secondary); font-size: 0.8rem;"></span>
            </div>
        `).join('');
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

// ==========================================
// 8. تهيئة الشات بوت (مصدرة)
// ==========================================
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
            
            // ✅ إظهار الأزرار السريعة دائماً عند الفتح (زرّان فقط)
            showQuickReplies(chatMessages, [
                { icon: '', label: state.currentLang === 'ar' ? 'احجز موعد' : 'Book Appointment', value: 'حجز موعد' },
                { icon: '🆘', label: state.currentLang === 'ar' ? 'حالة طارئة' : 'Emergency', value: 'طوارئ' }
            ]);

            // إضافة رسالة الترحيب الديناميكية فقط إذا كان الشات فارغاً تماماً
            if (chatMessages.children.length === 0) {
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'chat-msg bot-msg';
                welcomeMsg.innerHTML = getSmartWelcome();
                chatMessages.appendChild(welcomeMsg);
            }
        }
    };
    
    chatbotToggleBtn.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', toggleChat);

    // ربط الاقتراحات بحقل الإدخال
    chatInputText.addEventListener('input', function() {
        showChatSuggestions(this.value.trim());
    });

    // إخفاء الاقتراحات عند الضغط خارجها
    document.addEventListener('click', function(e) {
        const suggestionsDiv = document.getElementById('chatSuggestions');
        if (suggestionsDiv && !e.target.closest('#chatSuggestions') && e.target !== chatInputText) {
            suggestionsDiv.style.display = 'none';
        }
    });

    sendChatBtn.addEventListener('click', handleSend);
    chatInputText.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') handleSend(); 
    });
}
