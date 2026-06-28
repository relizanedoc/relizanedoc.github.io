// ==========================================
// chatbot.js - نظام الشات بوت الذكي (النسخة النهائية والمصححة)
// ==========================================
import { state } from './state.js';
import { t, escapeHtml } from './utils.js';
import { openDoctorProfileModal } from './ui.js';
import { supabaseClient } from './api.js';

// ==========================================
// 1. دوال مساعدة (لحل مشاكل النطاق ومعالجة النصوص)
// ==========================================

// ✅ ربط الدالة بالنطاق العام (window) لتتمكن أزرار الـ HTML من الوصول إليها بدون أخطاء
window.triggerDoctorProfile = function(doctorId, doctorName) {
    document.getElementById('medicalChatbot').classList.add('hidden');
    // التعديل: البحث في الدليل الشامل بدلاً من المعروض فقط
    const doctor = state.globalDirectory.find(d => d.id === doctorId);
    if (doctor) {
        openDoctorProfileModal(doctor, doctorName);
    }
};

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
                <span style="font-size: 1.5rem;">🚨</span> حالة طارئة!
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
                ⚠️ لا تنتظر - اتصل الآن إذا كانت الحالة خطيرة
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
                    <span style="font-size: 1.2rem;">🚑</span> Civil Protection: 100
                </a>
            </div>
        </div>
    `;
}
// ==========================================
// 2.5. نظام المحادثة الطبيعية (التحيات والشكر والمساعدة)
// ==========================================
const CONVERSATION_KEYWORDS = {
    greetings: ['سلام', 'مرحبا', 'اهلين', 'صباح', 'مساء', 'هلا', 'أهلا'],
    thanks: ['شكرا', 'مشكور', 'يعطيك الصحة', 'بارك الله فيك', 'يعطيك العافيه', 'تسلم'],
    help: ['مساعدة', 'كيف', 'وش ندير', 'شرح', 'help']
};

// دالة لمعالجة المحادثات الجانبية (لماذا نفصلها؟ للحفاظ على نظافة كود البحث الأساسي)
function handleConversationalMessage(cleanMsg, rawMsg) {
    const lang = state.currentLang;
    
    // 1. التحقق من الشكر
    if (CONVERSATION_KEYWORDS.thanks.some(kw => cleanMsg.includes(kw))) {
        return lang === 'ar' 
            ? 'العفو! أنا هنا دائماً في خدمتك وخدمة صحتك. هل تحتاج لأي مساعدة أخرى؟ 😊' 
            : 'You are very welcome! Let me know if you need anything else. 😊';
    }

    // 2. التحقق من التحيات
    if (CONVERSATION_KEYWORDS.greetings.some(kw => cleanMsg.includes(kw))) {
        const hour = new Date().getHours();
        let timeGreeting = '';
        
        if (cleanMsg.includes('صباح') || (hour < 12 && !cleanMsg.includes('مساء'))) {
            timeGreeting = lang === 'ar' ? 'صباح النور والسرور!' : 'Good morning!';
        } else if (cleanMsg.includes('مساء') || hour >= 12) {
            timeGreeting = lang === 'ar' ? 'مساء الخيرات!' : 'Good afternoon/evening!';
        } else {
            timeGreeting = lang === 'ar' ? 'أهلاً بك!' : 'Hello!';
        }

        return lang === 'ar'
            ? `${timeGreeting} 👋 كيف يمكنني مساعدتك في العثور على طبيبك اليوم؟ (يمكنك كتابة التخصص أو اسم الطبيب)`
            : `${timeGreeting} 👋 How can I help you find a doctor today?`;
    }

    // 3. التحقق من طلب المساعدة
    if (CONVERSATION_KEYWORDS.help.some(kw => cleanMsg.includes(kw))) {
        return lang === 'ar'
            ? `<strong>أنا هنا لمساعدتك! 💡</strong><br><br>يمكنك أن تطلب مني:<br>1️⃣ البحث عن تخصص (مثل: طبيب أسنان)<br>2️⃣ البحث عن اسم طبيب<br>3️⃣ البحث بالمنطقة (مثل: طبيب في الشلف)<br>4️⃣ الإبلاغ عن حالة طوارئ`
            : `<strong>I'm here to help! 💡</strong><br><br>You can ask me to:<br>1️⃣ Search for a specialty<br>2️⃣ Search for a doctor's name<br>3️⃣ Search by location<br>4️⃣ Report an emergency`;
    }

    return null; // إذا لم تكن محادثة جانبية، نرجع null لنكمل مسار البحث عن طبيب
}
// ==========================================
// 3. معالجة رسائل المستخدم
// ==========================================
async function processUserMessage(rawMsg) {
    const cleanMsg = normalizeText(rawMsg);
    
    // 1. فحص الطوارئ أولاً (الأولوية القصوى)
    if (detectEmergency(rawMsg)) return getEmergencyResponse();

    // 2. فحص حجز المواعيد
    if (cleanMsg.includes('حجز موعد') || cleanMsg.includes('احجز موعد') || cleanMsg === 'حجز') {
        return state.currentLang === 'ar' 
            ? `لحجز موعد، يمكنك:<br><br>1️⃣ <strong>البحث عن طبيب</strong> أولاً (اكتب التخصص أو الاسم)<br>2️⃣ ثم اضغط على زر "عرض التفاصيل والحجز"`
            : `To book an appointment:<br><br>1️⃣ <strong>Search for a doctor</strong> first<br>2️⃣ Then click "View Details & Book"`;
    }

    // 3. فحص المحادثات الطبيعية (السلام، الشكر، المساعدة) - الإضافة الجديدة
    const conversationalResponse = handleConversationalMessage(cleanMsg, rawMsg);
    if (conversationalResponse) {
        return conversationalResponse;
    }

    try {
        if (!state.globalDirectory || state.globalDirectory.length === 0) {
            return state.currentLang === 'ar' 
                ? 'عذراً، جاري تحميل بيانات الأطباء... حاول مجدداً بعد لحظات.' 
                : 'Loading doctors data... please try again in a moment.';
        }

        // 🌟 قائمة الكلمات الزائدة (Stop Words) 🌟
        const stopWords = ['ابحث', 'عن', 'اريد', 'طبيب', 'طبيبة', 'د', 'دكتور', 'دكتورة', 'في', 'من', 'احجز', 'موعد', 'ولاية', 'بلدية'];
        
        // استخراج الكلمات المفتاحية
        const searchTerms = cleanMsg.split(/\s+/).filter(t => t.length > 0 && !stopWords.includes(t));

        if (searchTerms.length === 0) {
            return state.currentLang === 'ar' 
                ? 'الرجاء كتابة اسم الطبيب أو التخصص الذي تبحث عنه.' 
                : 'Please type the doctor name or specialty.';
        }
        
        // خوارزمية البحث المحلي
        let matchedDoctors = state.globalDirectory.filter(doc => {
            const searchString = normalizeText(`
                ${doc.first_name || ''} ${doc.last_name || ''} 
                ${doc.first_name_en || ''} ${doc.last_name_en || ''} 
                ${doc.specialty || ''} ${doc.municipality || ''} 
            `);
            
            return searchTerms.every(term => searchString.includes(term));
        });

        matchedDoctors = matchedDoctors.slice(0, 5);

        if (!matchedDoctors || matchedDoctors.length === 0) {
            return state.currentLang === 'ar' 
                ? `عذراً، لم أتمكن من العثور على أطباء يطابقون بحثك "<strong>${escapeHtml(rawMsg)}</strong>".<br><br>💡 <strong>جرب البحث بـ:</strong><br>• اسم الطبيب<br>• التخصص (مثل: طبيب عيون)<br>• البلدية` 
                : `Sorry, I couldn't find any doctors matching "<strong>${escapeHtml(rawMsg)}</strong>".`;
        }

        let response = state.currentLang === 'ar' ? `إليك أفضل النتائج المطابقة لبحثك:` : `Here are the best results:`;
        
        response += matchedDoctors.map(doc => {
            const docPrefix = state.currentLang === 'ar' ? 'د.' : 'Dr.';
            const cleanName = `${docPrefix} ${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}`;
            const safeNameForJs = cleanName.replace(/'/g, "\\'");
            
            return `<div class="bot-card-result" style="border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-top: 12px; background: var(--surface);">
                <div style="font-weight: bold; color: var(--primary-dark); font-size: 1.05rem; margin-bottom: 8px;">${cleanName}</div>
                <div style="color: var(--text); font-size: 0.9rem; margin-bottom: 4px;"><strong>${t('chatSpecLabel') || 'التخصص:'}</strong> ${escapeHtml(t(doc.specialty))}</div>
                <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 8px;"><strong>${t('chatMunLabel') || 'البلدية:'}</strong> ${escapeHtml(t(doc.municipality))}</div>
                <button onclick="window.triggerDoctorProfile('${doc.id}', '${safeNameForJs}')" style="margin-top: 12px; background: var(--primary); color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: bold; width: 100%;">${t('chatBookDetailsBtn') || 'عرض التفاصيل والحجز'}</button>
            </div>`;
        }).join('');
        
        return response;

    } catch (err) {
        console.error("Chatbot Local Search Error:", err);
        return state.currentLang === 'ar' ? 'عذراً، حدث خطأ في معالجة البيانات. حاول مجدداً.' : 'Sorry, a processing error occurred. Try again.';
    }
}
// ==========================================
// 4. دالة الإرسال (مصدرة)
// ==========================================
export async function handleSend() {
    const chatInputText = document.getElementById('chatInputText');
    const chatMessages = document.getElementById('chatMessages');
    
    const text = chatInputText.value.trim();
    if (!text) return;
    
    const suggestionsDiv = document.getElementById('chatSuggestions');
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
    
    // 1. طباعة رسالة المستخدم فوراُ
    const userMsg = document.createElement('div'); 
    userMsg.className = `chat-msg user-msg`; 
    userMsg.innerHTML = escapeHtml(text); 
    chatMessages.appendChild(userMsg);
    chatInputText.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 2. إظهار مؤشر حركة الكتابة
    const typingId = "typing-" + Date.now();
    const botTyping = document.createElement('div'); 
    botTyping.className = `chat-msg bot-msg`; 
    botTyping.innerHTML = `<div id="${typingId}" class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`; 
    chatMessages.appendChild(botTyping); 
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 3. الانتظار الفعلي لاستجابة خادم السيرفر السحابي
    const botResponseHtml = await processUserMessage(text);

    // 4. مسح مؤشر حركة الكتابة وطباعة الكروت الناتجة
    const typingIndicator = document.getElementById(typingId);
    if (typingIndicator) typingIndicator.parentElement.remove();
    
    const botRes = document.createElement('div'); 
    botRes.className = `chat-msg bot-msg`; 
    botRes.innerHTML = botResponseHtml; 
    chatMessages.appendChild(botRes); 
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
// تصدير الدالة على window لاستخدامها في onclick
window.handleSend = handleSend;

// ==========================================
// 5. رسائل الترحيب الذكية
// ==========================================
function getSmartWelcome() {
    const hour = new Date().getHours();
    const lang = state.currentLang;
    
    // الحل الذكي: قراءة اسم المستخدم مباشرة من الشريط العلوي المرئي
    const userNameElement = document.getElementById('userNameDisplay');
    const userName = userNameElement && userNameElement.textContent ? userNameElement.textContent.trim() : null;
    
    let greeting = '';
    if (hour < 12) greeting = lang === 'ar' ? 'صباح الخير' : 'Good morning';
    else if (hour < 18) greeting = lang === 'ar' ? 'مساء الخير' : 'Good afternoon';
    else greeting = lang === 'ar' ? 'مساء النور' : 'Good evening';
    
    // إضافة الاسم إذا كان المستخدم متصلاً
    if (userName && userName !== '') {
        greeting += ` ${userName}! 👋`;
    } else {
        greeting += '! 👋';
    }
    
    const subtitle = lang === 'ar' 
        ? 'كيف يمكنني مساعدتك اليوم؟' 
        : 'How can I help you today?';
    
    return `${greeting}<br><span style="color: var(--text-secondary); font-size: 0.9rem;">${subtitle}</span>`;
}

// ==========================================
// 6. الأزرار التفاعلية السريعة (Quick Replies)
// ==========================================
function showQuickReplies(chatMessages, replies = []) {
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

    // التعديل: جلب الاقتراحات من الدليل الشامل
    if (!state.globalDirectory) return;

    // اقتراحات الأطباء
    state.globalDirectory.forEach(doc => {
        const fullName = `${doc.first_name} ${doc.last_name}`.toLowerCase();
        if (fullName.includes(lowerText)) {
            suggestions.push({
                type: 'doctor',
                icon: '👨‍⚕️',
                text: `${state.currentLang === 'ar' ? 'د.' : 'Dr.'} ${doc.first_name} ${doc.last_name}`,
                value: `ابحث عن د. ${doc.first_name} ${doc.last_name}`
            });
        }
    });

    // اقتراحات التخصصات
    const specialties = [...new Set(state.globalDirectory.map(d => d.specialty))];
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
    const municipalities = [...new Set(state.globalDirectory.map(d => d.municipality))];
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

    // ✅ متغير لتتبع أول فتح للشات
    let isFirstOpen = true;

    const toggleChat = () => { 
        medicalChatbot.classList.toggle('hidden'); 
        if (!medicalChatbot.classList.contains('hidden')) {
            chatInputText.focus();
            
            // ✅ الترتيب الصحيح والمنطق الجديد:
            // إذا كانت هذه هي المرة الأولى لفتح الشات، امسح الرسالة الثابتة واطبع الذكية
            if (isFirstOpen) {
                chatMessages.innerHTML = ''; // تفريغ الرسالة الثابتة القادمة من HTML
                
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'chat-msg bot-msg';
                welcomeMsg.innerHTML = getSmartWelcome();
                chatMessages.appendChild(welcomeMsg);
                
                isFirstOpen = false; // تغيير الحالة حتى لا تمسح المحادثة في المرات القادمة
            }
            
            // ✅ إظهار الأزرار السريعة أسفلها لكي لا تتداخل
            showQuickReplies(chatMessages, [
                { icon: '📅', label: state.currentLang === 'ar' ? 'احجز موعد' : 'Book Appointment', value: 'حجز موعد' },
                { icon: '🚨', label: state.currentLang === 'ar' ? 'حالة طارئة' : 'Emergency', value: 'طوارئ' }
            ]);
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
