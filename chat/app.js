"use strict";

/* =========================================================
   GLOBAL STATE & CONSTANTS
========================================================= */

let db = null;

let currentUser = null;
let currentProfile = null;
let currentConversation = null;

let conversations = [];
let customers = [];
let currentMessages = [];

const PAGE_SIZE = 40;
let hasMoreMessages = false;
let loadingOlderMessages = false;
let oldestLoadedTimestamp = null;

const profileCache = new Map();
const reactionCache = new Map();
const readCache = new Map();        // Map<msgId, Set<userId>>
const pollVotesCache = new Map();   // Map<msgId, Array<{user_id, option_index}>>
const unreadCounts = new Map();     // Map<convId, number>
const previewCache = new Map();     // Map<convId, {last_content, last_type, last_created_at, last_sender_id}>
const renderingMessageIds = new Set();

const GROUP_CONFIG = {
    "2as": {
        title: "قسم 2 لغات أجنبية",
        subtitle: "السنة الثانية ثانوي · اللغة الإسبانية",
        icon: "📚"
    },
    "3as": {
        title: "قسم 3 لغات أجنبية",
        subtitle: "السنة الثالثة ثانوي · بكالوريا إسبانية",
        icon: "🎓"
    }
};

const MESSAGE_TAGS = {
    lesson: { label: "📖 درس", className: "tag-lesson" },
    exercise: { label: "✍️ تمرين", className: "tag-exercise" },
    pronunciation: { label: "🎧 نطق", className: "tag-pronunciation" },
    announcement: { label: "📢 إعلان", className: "tag-announcement" }
};

const REACTIONS = ["✅", "❓", "👏", "📌", "👍", "❤️"];

const AVATAR_COLORS = [
    "#008069", "#0284c7", "#7c3aed", "#db2777",
    "#d97706", "#059669", "#4f46e5", "#0d9488",
    "#e11d48", "#2563eb"
];

let replyingToMessage = null;
let editingMessage = null;
let selectedFile = null;
let selectedTag = "";
let defaultConversationSubtitle = "الأستاذ عبد الكريم";

let soundEnabled = true;
let audioCtx = null;

let mediaRecorder = null;
let recordingChunks = [];
let recordingStream = null;

let contextMenu = null;

let activeRealtimeChannel = null;
let globalRealtimeChannel = null;
let authSubscription = null;
let messageSyncTimer = null;
let messageSyncInProgress = false;

let typingTimer = null;
let isCurrentlyTyping = false;

let initialized = false;
let startingApplicationPromise = null;
let startingApplicationUserId = null;

// حالة نافذة الأعضاء
let modalConversationId = null;
let modalInitialMemberIds = new Set();
let modalSelectedMemberIds = new Set();
let modalAllStudents = [];

// حالة الأرشيف
let currentArchiveFilter = "file";
let archiveMessagesCache = [];

// حالة البحث داخل الدردشة
let chatSearchMatches = [];
let chatSearchIndex = -1;

const MIC_SVG = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
`;

const STOP_SVG = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <rect x="6" y="6" width="12" height="12" rx="2"></rect>
    </svg>
`;

const MOON_SVG = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
`;

const SUN_SVG = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
`;

const SOUND_ON_SVG = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
`;

const SOUND_OFF_SVG = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
`;

/* =========================================================
   DOM REFERENCES
========================================================= */

let offlineBanner = null;
let loginScreen = null;
let loginBox = null;
let loginForm = null;
let app = null;

let emailInput = null;
let passwordInput = null;
let loginButton = null;
let forgotPasswordButton = null;
let loginError = null;

let soundToggleButton = null;
let themeToggleButton = null;
let sidebarSearchInput = null;
let sidebarSearchEmpty = null;
let groupsSectionTitle = null;
let privateSectionTitle = null;
let groupButtons = [];
let customersList = null;
let logoutButton = null;

let mobileBackButton = null;
let chatAvatar = null;
let conversationTitle = null;
let conversationSubtitle = null;

let chatSearchButton = null;
let archiveButton = null;
let lockChatButton = null;
let manageMembersButton = null;

let chatSearchBar = null;
let chatSearchInput = null;
let chatSearchCount = null;
let chatSearchPrev = null;
let chatSearchNext = null;
let chatSearchClose = null;

let messagesContainer = null;
let lockedBanner = null;
let filePreview = null;

let editPreview = null;
let editPreviewContent = null;
let cancelEditButton = null;

let replyPreview = null;
let replyPreviewSender = null;
let replyPreviewText = null;
let cancelReplyButton = null;

let spanishBar = null;
let tagBar = null;

let messageForm = null;
let messageInput = null;
let sendButton = null;
let fileInput = null;
let fileButton = null;
let spanishToggleButton = null;
let tagToggleButton = null;
let pollButton = null;
let recordButton = null;

// Modals
let membersModal = null;
let membersModalTitle = null;
let membersModalClose = null;
let membersSearchInput = null;
let membersCount = null;
let membersChecklist = null;
let membersModalMessage = null;
let saveMembersButton = null;
let cancelMembersButton = null;

let archiveModal = null;
let archiveModalTitle = null;
let archiveModalClose = null;
let archiveTabs = null;
let archiveList = null;

let pollModal = null;
let pollModalClose = null;
let pollQuestionInput = null;
let pollModalMessage = null;
let sendPollButton = null;
let cancelPollButton = null;

let readersModal = null;
let readersModalClose = null;
let readersCountText = null;
let readersList = null;

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
    if (initialized) return;
    initialized = true;

    cacheDomElements();
    initThemePreference();
    initSoundPreference();
    initNetworkListeners();

    try {
        validateRequiredDom();
        initializeSupabase();
        bindEvents();
        await initializeAuth();
    } catch (error) {
        console.error("Initialization error:", error);
        showLoginError(error?.message || "حدث خطأ أثناء تشغيل التطبيق.");
    }
}

function cacheDomElements() {
    offlineBanner = document.getElementById("offlineBanner");
    loginScreen = document.getElementById("loginScreen");
    loginBox = document.querySelector(".login-box");
    loginForm = document.getElementById("loginForm");
    app = document.getElementById("app");

    emailInput = document.getElementById("email");
    passwordInput = document.getElementById("password");
    loginButton = document.getElementById("loginButton");
    forgotPasswordButton = document.getElementById("forgotPasswordButton");
    loginError = document.getElementById("loginError");

    soundToggleButton = document.getElementById("soundToggleButton");
    themeToggleButton = document.getElementById("themeToggleButton");
    sidebarSearchInput = document.getElementById("sidebarSearchInput");
    sidebarSearchEmpty = document.getElementById("sidebarSearchEmpty");
    groupsSectionTitle = document.getElementById("groupsSectionTitle");
    privateSectionTitle = document.getElementById("privateSectionTitle");
    groupButtons = Array.from(document.querySelectorAll(".group-button[data-group-key]"));
    customersList = document.getElementById("customersList");
    logoutButton = document.getElementById("logoutButton");

    mobileBackButton = document.getElementById("mobileBackButton");
    chatAvatar = document.querySelector(".chat-avatar");
    conversationTitle = document.getElementById("conversationTitle");
    conversationSubtitle = document.getElementById("conversationSubtitle");

    chatSearchButton = document.getElementById("chatSearchButton");
    archiveButton = document.getElementById("archiveButton");
    lockChatButton = document.getElementById("lockChatButton");
    manageMembersButton = document.getElementById("manageMembersButton");

    chatSearchBar = document.getElementById("chatSearchBar");
    chatSearchInput = document.getElementById("chatSearchInput");
    chatSearchCount = document.getElementById("chatSearchCount");
    chatSearchPrev = document.getElementById("chatSearchPrev");
    chatSearchNext = document.getElementById("chatSearchNext");
    chatSearchClose = document.getElementById("chatSearchClose");

    messagesContainer = document.getElementById("messages");
    lockedBanner = document.getElementById("lockedBanner");
    filePreview = document.getElementById("filePreview");

    editPreview = document.getElementById("editPreview");
    editPreviewContent = document.getElementById("editPreviewContent");
    cancelEditButton = document.getElementById("cancelEditButton");

    replyPreview = document.getElementById("replyPreview");
    replyPreviewSender = document.getElementById("replyPreviewSender");
    replyPreviewText = document.getElementById("replyPreviewContent");
    cancelReplyButton = document.getElementById("cancelReplyButton");

    spanishBar = document.getElementById("spanishBar");
    tagBar = document.getElementById("tagBar");

    messageForm = document.getElementById("messageForm");
    messageInput = document.getElementById("messageInput");
    sendButton = document.querySelector("#messageForm .send-button");
    fileInput = document.getElementById("imageInput");
    fileButton = document.getElementById("imageButton");
    spanishToggleButton = document.getElementById("spanishToggleButton");
    tagToggleButton = document.getElementById("tagToggleButton");
    pollButton = document.getElementById("pollButton");
    recordButton = document.getElementById("recordButton");

    membersModal = document.getElementById("membersModal");
    membersModalTitle = document.getElementById("membersModalTitle");
    membersModalClose = document.getElementById("membersModalClose");
    membersSearchInput = document.getElementById("membersSearchInput");
    membersCount = document.getElementById("membersCount");
    membersChecklist = document.getElementById("membersChecklist");
    membersModalMessage = document.getElementById("membersModalMessage");
    saveMembersButton = document.getElementById("saveMembersButton");
    cancelMembersButton = document.getElementById("cancelMembersButton");

    archiveModal = document.getElementById("archiveModal");
    archiveModalTitle = document.getElementById("archiveModalTitle");
    archiveModalClose = document.getElementById("archiveModalClose");
    archiveTabs = document.getElementById("archiveTabs");
    archiveList = document.getElementById("archiveList");

    pollModal = document.getElementById("pollModal");
    pollModalClose = document.getElementById("pollModalClose");
    pollQuestionInput = document.getElementById("pollQuestionInput");
    pollModalMessage = document.getElementById("pollModalMessage");
    sendPollButton = document.getElementById("sendPollButton");
    cancelPollButton = document.getElementById("cancelPollButton");

    readersModal = document.getElementById("readersModal");
    readersModalClose = document.getElementById("readersModalClose");
    readersCountText = document.getElementById("readersCountText");
    readersList = document.getElementById("readersList");
}

function validateRequiredDom() {
    const required = {
        loginScreen, app, loginForm, emailInput, passwordInput,
        loginButton, loginError, messagesContainer, messageForm, messageInput
    };
    const missing = Object.entries(required).filter(([, el]) => !el).map(([k]) => k);
    if (missing.length > 0) {
        throw new Error(`عناصر HTML مفقودة: ${missing.join(", ")}`);
    }
}

function initializeSupabase() {
    const supabaseApi = window.supabase;
    if (!supabaseApi || typeof supabaseApi.createClient !== "function") {
        throw new Error("لم يتم تحميل مكتبة Supabase.");
    }
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
    if (!url || !key) {
        throw new Error("بيانات config.js غير مكتملة.");
    }
    db = supabaseApi.createClient(url.trim(), key.trim());
}

/* =========================================================
   THEME, SOUND & OFFLINE BANNER
========================================================= */

function initThemePreference() {
    let saved = "light";
    try { saved = localStorage.getItem("espanol_theme") || "light"; } catch {}
    applyTheme(saved === "dark");
}

function applyTheme(isDark) {
    document.body.classList.toggle("dark-theme", isDark);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", isDark ? "#202c33" : "#008069");

    if (themeToggleButton) {
        themeToggleButton.innerHTML = isDark ? SUN_SVG : MOON_SVG;
        themeToggleButton.title = isDark ? "الوضع النهاري" : "الوضع الليلي";
    }
    try { localStorage.setItem("espanol_theme", isDark ? "dark" : "light"); } catch {}
}

function initSoundPreference() {
    let saved = "on";
    try { saved = localStorage.getItem("espanol_sound") || "on"; } catch {}
    soundEnabled = saved !== "off";
    updateSoundButtonUI();
}

function updateSoundButtonUI() {
    if (!soundToggleButton) return;
    soundToggleButton.innerHTML = soundEnabled ? SOUND_ON_SVG : SOUND_OFF_SVG;
    soundToggleButton.classList.toggle("muted", !soundEnabled);
    soundToggleButton.title = soundEnabled ? "صوت الإشعارات (مفعّل)" : "صوت الإشعارات (مكتوم)";
}

function playNotificationTone() {
    if (!soundEnabled) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtx) audioCtx = new AudioContextClass();
        if (audioCtx.state === "suspended") audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1180, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.17);
    } catch {}
}

function initNetworkListeners() {
    const syncOnlineStatus = () => {
        const online = navigator.onLine !== false;
        offlineBanner?.classList.toggle("hidden", online);
        if (online && currentUser) {
            loadUnreadCounts();
            loadConversationPreviews();
        }
    };
    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);
    syncOnlineStatus();
}

/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function openMobileChatView() {
    if (!app) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!app.classList.contains("mobile-chat-open")) {
        app.classList.add("mobile-chat-open");
        if (isMobile) {
            try { window.history.pushState({ mobileChat: true }, ""); } catch {}
        }
    }
}

function closeMobileChatView(fromPopState = false) {
    if (!app?.classList.contains("mobile-chat-open")) return;
    app.classList.remove("mobile-chat-open");
    closeContextMenu();
    closeAllReactionPickers();
    closeChatSearch();
    if (!fromPopState && window.history.state?.mobileChat) {
        try { window.history.back(); } catch {}
    }
}

/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {
    loginForm?.addEventListener("submit", e => { e.preventDefault(); login(); });
    forgotPasswordButton?.addEventListener("click", sendPasswordReset);
    messageForm?.addEventListener("submit", sendMessage);

    themeToggleButton?.addEventListener("click", () => {
        applyTheme(!document.body.classList.contains("dark-theme"));
    });

    soundToggleButton?.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        try { localStorage.setItem("espanol_sound", soundEnabled ? "on" : "off"); } catch {}
        updateSoundButtonUI();
        if (soundEnabled) playNotificationTone();
    });

    sidebarSearchInput?.addEventListener("input", filterSidebarList);

    messageInput?.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (typeof messageForm?.requestSubmit === "function") messageForm.requestSubmit();
            else sendMessage(event);
        }
    });

    messageInput?.addEventListener("input", handleLocalTyping);

    messageInput?.addEventListener("focus", () => {
        if (window.matchMedia("(max-width: 768px)").matches) {
            setTimeout(scrollMessagesToBottom, 300);
        }
    });

    fileButton?.addEventListener("click", event => {
        if (fileButton.tagName.toLowerCase() === "label") return;
        event.preventDefault();
        fileInput?.click();
    });

    fileInput?.addEventListener("change", handleFileSelection);
    recordButton?.addEventListener("click", toggleRecording);
    cancelReplyButton?.addEventListener("click", cancelReply);
    cancelEditButton?.addEventListener("click", cancelEdit);
    logoutButton?.addEventListener("click", logout);

    mobileBackButton?.addEventListener("click", () => closeMobileChatView(false));
    window.addEventListener("popstate", () => {
        if (app?.classList.contains("mobile-chat-open")) closeMobileChatView(true);
    });

    // الأحرف الإسبانية
    spanishToggleButton?.addEventListener("click", () => {
        const isHidden = spanishBar?.classList.toggle("hidden");
        spanishToggleButton.classList.toggle("active", !isHidden);
        if (!isHidden) {
            tagBar?.classList.add("hidden");
            tagToggleButton?.classList.remove("active");
        }
        messageInput?.focus();
    });

    spanishBar?.addEventListener("click", event => {
        const keyBtn = event.target.closest(".spanish-key");
        if (!keyBtn) return;
        insertTextAtCursor(keyBtn.dataset.char || "");
    });

    // وسوم الأستاذ
    tagToggleButton?.addEventListener("click", () => {
        const isHidden = tagBar?.classList.toggle("hidden");
        tagToggleButton.classList.toggle("active", !isHidden || Boolean(selectedTag));
        if (!isHidden) {
            spanishBar?.classList.add("hidden");
            spanishToggleButton?.classList.remove("active");
        }
    });

    tagBar?.addEventListener("click", event => {
        const chip = event.target.closest(".tag-chip");
        if (!chip) return;
        setSelectedTag(chip.dataset.tag || "");
    });

    // الاختبارات السريعة (Poll / Mini-Quiz)
    pollButton?.addEventListener("click", openPollModal);
    pollModalClose?.addEventListener("click", closePollModal);
    cancelPollButton?.addEventListener("click", closePollModal);
    sendPollButton?.addEventListener("click", submitNewPoll);
    pollModal?.addEventListener("click", e => { if (e.target === pollModal) closePollModal(); });

    // البحث داخل المحادثة
    chatSearchButton?.addEventListener("click", toggleChatSearch);
    chatSearchClose?.addEventListener("click", closeChatSearch);
    chatSearchInput?.addEventListener("input", runChatSearch);
    chatSearchPrev?.addEventListener("click", () => navigateChatSearch(-1));
    chatSearchNext?.addEventListener("click", () => navigateChatSearch(1));
    chatSearchInput?.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); navigateChatSearch(1); }
    });

    // الأقسام
    groupButtons.forEach(button => {
        button.addEventListener("click", () => {
            openMobileChatView();
            openGroupConversation(button.dataset.groupKey);
        });
    });

    lockChatButton?.addEventListener("click", toggleConversationLock);

    // الأعضاء
    manageMembersButton?.addEventListener("click", openMembersModal);
    membersModalClose?.addEventListener("click", closeMembersModal);
    cancelMembersButton?.addEventListener("click", closeMembersModal);
    saveMembersButton?.addEventListener("click", saveGroupMembers);
    membersSearchInput?.addEventListener("input", renderMembersChecklist);
    membersModal?.addEventListener("click", e => { if (e.target === membersModal) closeMembersModal(); });

    // الأرشيف
    archiveButton?.addEventListener("click", openArchiveModal);
    archiveModalClose?.addEventListener("click", closeArchiveModal);
    archiveModal?.addEventListener("click", e => { if (e.target === archiveModal) closeArchiveModal(); });
    archiveTabs?.addEventListener("click", event => {
        const tab = event.target.closest(".archive-tab");
        if (!tab) return;
        currentArchiveFilter = tab.dataset.filter || "file";
        archiveTabs.querySelectorAll(".archive-tab").forEach(btn => {
            btn.classList.toggle("active", btn === tab);
        });
        renderArchiveItems();
    });

    // نافذة من قرأ الرسالة
    readersModalClose?.addEventListener("click", closeReadersModal);
    readersModal?.addEventListener("click", e => { if (e.target === readersModal) closeReadersModal(); });

    document.addEventListener("click", handleDocumentClick);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeContextMenu();
            closeAllReactionPickers();
            closeImageLightbox();
            closeMembersModal();
            closeArchiveModal();
            closePollModal();
            closeReadersModal();
            closeChatSearch();
        }
    });

    window.addEventListener("resize", () => {
        closeContextMenu();
        closeAllReactionPickers();
    });

    window.addEventListener("scroll", closeContextMenu, true);
}

function handleDocumentClick(event) {
    if (
        contextMenu &&
        !contextMenu.contains(event.target) &&
        !event.target.closest(".message-bubble")
    ) {
        closeContextMenu();
    }

    if (
        !event.target.closest(".reaction-picker") &&
        !event.target.closest(".reaction-trigger")
    ) {
        closeAllReactionPickers();
    }
}

function insertTextAtCursor(char) {
    if (!messageInput || !char) return;
    const start = messageInput.selectionStart ?? messageInput.value.length;
    const end = messageInput.selectionEnd ?? messageInput.value.length;
    const value = messageInput.value;
    messageInput.value = value.slice(0, start) + char + value.slice(end);
    const nextPos = start + char.length;
    messageInput.focus();
    messageInput.setSelectionRange(nextPos, nextPos);
}

function setSelectedTag(tag) {
    selectedTag = tag || "";
    tagBar?.querySelectorAll(".tag-chip").forEach(chip => {
        chip.classList.toggle("active", (chip.dataset.tag || "") === selectedTag);
    });
    if (tagToggleButton) {
        const barOpen = !tagBar?.classList.contains("hidden");
        tagToggleButton.classList.toggle("active", Boolean(selectedTag) || barOpen);
    }
}

/* =========================================================
   SIDEBAR SEARCH & PREVIEWS
========================================================= */

function filterSidebarList() {
    const q = (sidebarSearchInput?.value || "").trim().toLowerCase();
    let visibleGroups = 0;
    let visibleCustomers = 0;

    groupButtons.forEach(btn => {
        const allowed = btn.dataset.allowed === "true";
        if (!allowed) {
            btn.classList.add("hidden");
            return;
        }
        const text = (btn.textContent || "").toLowerCase();
        const match = !q || text.includes(q);
        btn.classList.toggle("hidden", !match);
        if (match) visibleGroups++;
    });

    groupsSectionTitle?.classList.toggle("hidden", visibleGroups === 0);

    if (customersList) {
        customersList.querySelectorAll(".customer-button").forEach(btn => {
            const text = (btn.textContent || "").toLowerCase();
            const match = !q || text.includes(q);
            btn.classList.toggle("hidden", !match);
            if (match) visibleCustomers++;
        });
    }

    privateSectionTitle?.classList.toggle("hidden", Boolean(q) && visibleCustomers === 0);
    sidebarSearchEmpty?.classList.toggle("hidden", !(q && visibleGroups === 0 && visibleCustomers === 0));
}

async function loadConversationPreviews() {
    if (!db || !currentUser) return;

    const { data, error } = await db.rpc("get_conversation_previews");
    if (error || !Array.isArray(data)) return;

    previewCache.clear();
    data.forEach(row => {
        previewCache.set(String(row.conversation_id), row);
    });
    renderSidebarPreviews();
}

function updateSinglePreview(msg) {
    if (!msg?.conversation_id) return;
    previewCache.set(String(msg.conversation_id), {
        conversation_id: String(msg.conversation_id),
        last_content: msg.content,
        last_type: msg.message_type,
        last_created_at: msg.created_at,
        last_sender_id: msg.sender_id
    });
    renderSidebarPreviews();
}

function formatPreviewText(row, fallbackText) {
    if (!row) return fallbackText;
    const prefix = row.last_sender_id === currentUser?.id ? "أنت: " : "";
    if (row.last_type === "image") return `${prefix}🖼️ صورة`;
    if (row.last_type === "audio") return `${prefix}🎧 رسالة صوتية`;
    if (row.last_type === "file") return `${prefix}📄 ${row.last_content || "ملف"}`;
    if (row.last_type === "poll") return `${prefix}📊 ${row.last_content || "اختبار سريع"}`;
    return `${prefix}${row.last_content || fallbackText}`;
}

function renderSidebarPreviews() {
    groupButtons.forEach(btn => {
        const key = btn.dataset.groupKey;
        const conv = conversations.find(c => c.type === "group" && c.group_key === key);
        const previewEl = btn.querySelector(".conversation-preview");
        const timeEl = btn.querySelector(".conversation-time");
        const fallback = GROUP_CONFIG[key]?.subtitle || "قسم دراسي";

        const row = conv ? previewCache.get(String(conv.id)) : null;
        if (previewEl) previewEl.textContent = formatPreviewText(row, fallback);
        if (timeEl) timeEl.textContent = row?.last_created_at ? formatShortTime(row.last_created_at) : "";
    });

    if (customersList) {
        customersList.querySelectorAll(".customer-button").forEach(btn => {
            const targetId = btn.dataset.customerId;
            const conv = currentProfile?.role === "customer"
                ? conversations.find(c => c.type === "private" && c.customer_id === currentUser?.id)
                : conversations.find(c => c.type === "private" && String(c.customer_id) === String(targetId));

            const previewEl = btn.querySelector(".conversation-preview");
            const timeEl = btn.querySelector(".conversation-time");
            const row = conv ? previewCache.get(String(conv.id)) : null;

            if (previewEl) previewEl.textContent = formatPreviewText(row, "محادثة خاصة");
            if (timeEl) timeEl.textContent = row?.last_created_at ? formatShortTime(row.last_created_at) : "";
        });
    }
}

/* =========================================================
   AUTH
========================================================= */

async function initializeAuth() {
    if (!db) return;

    const authState = db.auth.onAuthStateChange((event, session) => {
        setTimeout(() => {
            if (event === "PASSWORD_RECOVERY") {
                showPasswordUpdateScreen();
                return;
            }
            if (event === "SIGNED_IN" && session?.user) {
                if (loginBox?.dataset.passwordRecovery === "true") return;
                startApplication(session.user).catch(console.error);
            }
            if (event === "SIGNED_OUT") {
                resetApplication();
            }
        }, 0);
    });

    if (authState?.data?.subscription) authSubscription = authState.data.subscription;

    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    if (data?.session?.user && loginBox?.dataset.passwordRecovery !== "true") {
        await startApplication(data.session.user);
    } else {
        window.showLoginScreen();
    }
}

async function login() {
    if (!db) { showLoginError("Supabase غير جاهز."); return; }

    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";

    if (!email || !isValidEmail(email)) {
        showLoginError("أدخل بريدًا إلكترونيًا صحيحًا.");
        emailInput?.focus();
        return;
    }
    if (!password) {
        showLoginError("أدخل كلمة المرور.");
        passwordInput?.focus();
        return;
    }

    clearLoginError();
    setLoginLoading(true);

    try {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data?.user) throw new Error("تعذر تسجيل الدخول.");
        await startApplication(data.user);
    } catch (error) {
        console.error("Login error:", error);
        showLoginError(authMessage(error));
    } finally {
        setLoginLoading(false);
    }
}

async function logout() {
    if (!db) return;
    try {
        const { error } = await db.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error("Logout error:", error);
        resetApplication();
    }
}

async function sendPasswordReset() {
    if (!db) return;
    const email = emailInput?.value?.trim() || "";
    if (!email || !isValidEmail(email)) {
        showLoginError("أدخل بريدًا إلكترونيًا صحيحًا أولًا.");
        emailInput?.focus();
        return;
    }
    clearLoginError();
    try {
        const { error } = await db.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}${window.location.pathname}`
        });
        if (error) throw error;
        showLoginSuccess("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
    } catch (error) {
        showLoginError(authMessage(error));
    }
}

function showPasswordUpdateScreen() {
    if (!loginBox) return;
    window.showLoginScreen();
    loginBox.dataset.passwordRecovery = "true";

    loginBox.innerHTML = `
        <div class="password-update-screen">
            <h2>تحديث كلمة المرور</h2>
            <p>أدخل كلمة المرور الجديدة.</p>
            <input id="new-password" type="password" autocomplete="new-password" placeholder="كلمة المرور الجديدة">
            <input id="confirm-new-password" type="password" autocomplete="new-password" placeholder="تأكيد كلمة المرور">
            <button id="update-password-button" type="button">تحديث كلمة المرور</button>
            <div id="password-update-error" class="login-error"></div>
        </div>
    `;

    const newPassword = document.getElementById("new-password");
    const confirmPassword = document.getElementById("confirm-new-password");
    const updateButton = document.getElementById("update-password-button");
    const updateError = document.getElementById("password-update-error");

    const updatePassword = async () => {
        const password = newPassword?.value || "";
        const confirm = confirmPassword?.value || "";
        if (password.length < 6) {
            if (updateError) updateError.textContent = "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.";
            return;
        }
        if (password !== confirm) {
            if (updateError) updateError.textContent = "كلمتا المرور غير متطابقتين.";
            return;
        }
        if (updateButton) { updateButton.disabled = true; updateButton.textContent = "جارٍ التحديث..."; }
        try {
            const { error } = await db.auth.updateUser({ password });
            if (error) throw error;
            delete loginBox.dataset.passwordRecovery;
            await db.auth.signOut();
            window.location.reload();
        } catch (error) {
            if (updateError) updateError.textContent = authMessage(error);
            if (updateButton) { updateButton.disabled = false; updateButton.textContent = "تحديث كلمة المرور"; }
        }
    };

    updateButton?.addEventListener("click", updatePassword);
    confirmPassword?.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); updatePassword(); } });
    newPassword?.focus();
}

/* =========================================================
   APPLICATION LIFECYCLE
========================================================= */

async function startApplication(user) {
    if (!db || !user) return;
    if (currentUser?.id === user.id && currentProfile) {
        window.showAppScreen();
        return;
    }
    if (startingApplicationPromise && startingApplicationUserId === user.id) {
        return startingApplicationPromise;
    }

    startingApplicationUserId = user.id;

    startingApplicationPromise = (async () => {
        try {
            const { data: profile, error } = await db
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            if (error) throw error;
            if (!profile) throw new Error("لم يتم العثور على ملف المستخدم في جدول profiles.");

            currentUser = user;
            currentProfile = profile;
            profileCache.set(user.id, profile);

            const isAdmin = profile.role === "admin";
            tagToggleButton?.classList.toggle("hidden", !isAdmin);
            pollButton?.classList.toggle("hidden", !isAdmin);

            window.showAppScreen();

            await loadConversations();
            await loadCustomers();
            await Promise.all([loadUnreadCounts(), loadConversationPreviews()]);
            await subscribeGlobalRealtime();

            if (currentProfile.role === "customer") {
                const assignedGroup = conversations.find(c => c.type === "group");
                const privateConv = conversations.find(c => c.type === "private" && c.customer_id === currentUser.id);
                if (assignedGroup) await selectConversation(assignedGroup, { openMobile: false });
                else if (privateConv) await selectConversation(privateConv, { openMobile: false });
            } else {
                await openInitialAdminConversation();
            }
        } catch (error) {
            console.error("Application start error:", error);
            currentUser = null;
            currentProfile = null;
            window.showLoginScreen();
            showLoginError(error?.message || "تعذر تحميل بيانات المستخدم.");
            try { await db.auth.signOut(); } catch {}
        }
    })();

    try { await startingApplicationPromise; }
    finally {
        if (startingApplicationUserId === user.id) {
            startingApplicationPromise = null;
            startingApplicationUserId = null;
        }
    }
}

window.showAppScreen = function () {
    loginScreen?.classList.add("hidden");
    app?.classList.remove("hidden");
    clearLoginError();
};

window.showLoginScreen = function () {
    app?.classList.add("hidden");
    loginScreen?.classList.remove("hidden");
    currentConversation = null;
    removePinnedBanner();
    manageMembersButton?.classList.add("hidden");
    lockChatButton?.classList.add("hidden");
    closeMembersModal();
    closeArchiveModal();
    closePollModal();
    closeReadersModal();
};

function resetApplication() {
    stopMessageSync();
    app?.classList.remove("mobile-chat-open");

    currentUser = null;
    currentProfile = null;
    conversations = [];
    customers = [];
    currentMessages = [];
    hasMoreMessages = false;
    oldestLoadedTimestamp = null;

    profileCache.clear();
    reactionCache.clear();
    readCache.clear();
    pollVotesCache.clear();
    unreadCounts.clear();
    previewCache.clear();
    renderingMessageIds.clear();

    currentConversation = null;
    replyingToMessage = null;
    editingMessage = null;
    selectedFile = null;
    setSelectedTag("");

    closeContextMenu();
    closeAllReactionPickers();
    closeImageLightbox();
    closeMembersModal();
    closeArchiveModal();
    closePollModal();
    closeReadersModal();
    closeChatSearch();
    cleanupRecording();
    cancelReply();
    cancelEdit();
    clearFilePreview();

    if (activeRealtimeChannel && db) { db.removeChannel(activeRealtimeChannel); activeRealtimeChannel = null; }
    if (globalRealtimeChannel && db) { db.removeChannel(globalRealtimeChannel); globalRealtimeChannel = null; }

    renderEmptyState();

    groupButtons.forEach(btn => {
        btn.dataset.allowed = "false";
        btn.classList.add("hidden");
        btn.classList.remove("active");
    });
    groupsSectionTitle?.classList.add("hidden");
    manageMembersButton?.classList.add("hidden");
    lockChatButton?.classList.add("hidden");
    tagToggleButton?.classList.add("hidden");
    pollButton?.classList.add("hidden");
    tagBar?.classList.add("hidden");
    spanishBar?.classList.add("hidden");
    lockedBanner?.classList.add("hidden");

    if (sidebarSearchInput) sidebarSearchInput.value = "";
    if (customersList) customersList.innerHTML = "";
    if (conversationTitle) conversationTitle.textContent = "فضاء الإسبانية";
    if (conversationSubtitle) {
        conversationSubtitle.textContent = "الأستاذ عبد الكريم";
        conversationSubtitle.classList.remove("typing");
    }
    if (chatAvatar) {
        chatAvatar.textContent = "🎓";
        chatAvatar.style.background = "";
    }

    window.showLoginScreen();
}

function renderEmptyState() {
    if (!messagesContainer) return;
    messagesContainer.innerHTML = `
        <div class="empty-messages">
            <div class="empty-icon" aria-hidden="true">👋</div>
            <strong>مرحبًا بك في فضاء الإسبانية</strong>
            <small>ابدأ بإرسال رسالة الآن</small>
        </div>
    `;
}

/* =========================================================
   UNREAD COUNTS & MESSAGE READS
========================================================= */

async function loadUnreadCounts() {
    if (!db || !currentUser) return;
    const { data, error } = await db.rpc("get_unread_counts");
    if (error) return;

    unreadCounts.clear();
    (data || []).forEach(row => {
        const count = Number(row.unread_count) || 0;
        if (count > 0) unreadCounts.set(String(row.conversation_id), count);
    });
    renderUnreadBadges();
}

function renderUnreadBadges() {
    groupButtons.forEach(btn => {
        const key = btn.dataset.groupKey;
        const badge = btn.querySelector(".unread-badge");
        if (!badge) return;
        const conv = conversations.find(c => c.type === "group" && c.group_key === key);
        const count = conv ? (unreadCounts.get(String(conv.id)) || 0) : 0;
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.classList.toggle("hidden", count === 0);
    });

    if (customersList) {
        customersList.querySelectorAll(".customer-button").forEach(btn => {
            const badge = btn.querySelector(".unread-badge");
            if (!badge) return;
            const targetId = btn.dataset.customerId;
            const conv = currentProfile?.role === "customer"
                ? conversations.find(c => c.type === "private" && c.customer_id === currentUser?.id)
                : conversations.find(c => c.type === "private" && String(c.customer_id) === String(targetId));
            const count = conv ? (unreadCounts.get(String(conv.id)) || 0) : 0;
            badge.textContent = count > 99 ? "99+" : String(count);
            badge.classList.toggle("hidden", count === 0);
        });
    }
}

async function markMessagesAsRead(messages) {
    if (!db || !currentUser || !Array.isArray(messages) || messages.length === 0) return;

    const unreadIds = messages
        .filter(m => m.sender_id !== currentUser.id)
        .filter(m => {
            const readers = readCache.get(String(m.id));
            return !readers || !readers.has(currentUser.id);
        })
        .map(m => m.id);

    if (currentConversation) {
        unreadCounts.delete(String(currentConversation.id));
        renderUnreadBadges();
    }

    if (unreadIds.length === 0) return;

    const rows = unreadIds.map(messageId => ({
        message_id: messageId,
        user_id: currentUser.id,
        read_at: new Date().toISOString()
    }));

    const { error } = await db
        .from("message_reads")
        .upsert(rows, { onConflict: "message_id,user_id" });

    if (error) return;

    unreadIds.forEach(id => {
        const key = String(id);
        if (!readCache.has(key)) readCache.set(key, new Set());
        readCache.get(key).add(currentUser.id);
    });
}

function isMessageReadByOthers(message) {
    if (!message || message.sender_id !== currentUser?.id) return false;
    const readers = readCache.get(String(message.id));
    if (!readers) return false;
    for (const uid of readers) {
        if (uid !== currentUser.id) return true;
    }
    return false;
}

function updateMessageTickUI(messageId) {
    const el = messagesContainer?.querySelector(
        `[data-message-id="${cssEscape(String(messageId))}"] .message-ticks`
    );
    if (!el) return;
    el.classList.add("read");
    el.title = "تمت القراءة";
}

/* =========================================================
   READERS MODAL (WHO READ THIS MESSAGE — ADMIN)
========================================================= */

async function openReadersModal(message) {
    if (!db || !readersModal || !message?.id) return;

    readersModal.classList.remove("hidden");
    if (readersCountText) readersCountText.textContent = "جارٍ التحميل...";
    if (readersList) readersList.innerHTML = `<div class="members-empty">جارٍ جلب قائمة القراء...</div>`;

    try {
        const { data, error } = await db
            .from("message_reads")
            .select("user_id, read_at")
            .eq("message_id", message.id)
            .order("read_at", { ascending: false });

        if (error) throw error;

        const rows = (data || []).filter(r => r.user_id !== message.sender_id);
        if (readersCountText) {
            readersCountText.textContent = rows.length === 1
                ? "قرأها تلميذ واحد"
                : `قرأها ${rows.length} أعضاء`;
        }

        if (rows.length === 0) {
            if (readersList) readersList.innerHTML = `<div class="members-empty">لم يقرأ أحد هذه الرسالة بعد.</div>`;
            return;
        }

        if (readersList) readersList.innerHTML = "";
        for (const row of rows) {
            const prof = await getProfile(row.user_id);
            const name = prof?.display_name || "عضو";
            const item = document.createElement("div");
            item.className = "reader-row";
            item.innerHTML = `
                <div class="reader-avatar" style="background:${getAvatarColor(name)}">${escapeHtml(getInitial(name))}</div>
                <div class="reader-info">
                    <span class="reader-name">${escapeHtml(name)}</span>
                    <span class="reader-time">${escapeHtml(row.read_at ? formatDate(row.read_at) : "تمت القراءة")}</span>
                </div>
            `;
            readersList.appendChild(item);
        }
    } catch (error) {
        console.error("Load readers error:", error);
        if (readersList) readersList.innerHTML = `<div class="members-empty">تعذر تحميل القراء.</div>`;
    }
}

function closeReadersModal() {
    readersModal?.classList.add("hidden");
}

/* =========================================================
   CONVERSATIONS, LOCK MODE & TYPING PRESENCE
========================================================= */

async function loadConversations() {
    if (!db || !currentUser) return;

    const { data, error } = await db
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) { showChatError(error.message); return; }

    let loaded = Array.isArray(data) ? data : [];

    if (currentProfile?.role === "customer") {
        const { data: myMemberships, error: memError } = await db
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", currentUser.id);

        if (!memError && Array.isArray(myMemberships)) {
            const memberIds = new Set(myMemberships.map(m => String(m.conversation_id)));
            loaded = loaded.filter(conv => {
                if (conv.type === "group") return memberIds.has(String(conv.id));
                return conv.customer_id === currentUser.id || memberIds.has(String(conv.id));
            });
        }
    }

    conversations = loaded;

    for (const conv of conversations) {
        if (conv.customer_id && !profileCache.has(conv.customer_id)) {
            await getProfile(conv.customer_id);
        }
    }

    updateVisibleGroupButtons();
    renderUnreadBadges();
    renderSidebarPreviews();
}

function updateVisibleGroupButtons() {
    const isAdmin = currentProfile?.role === "admin";
    const allowedKeys = new Set(
        conversations.filter(c => c.type === "group" && c.group_key).map(c => c.group_key)
    );

    groupButtons.forEach(btn => {
        const allowed = isAdmin || allowedKeys.has(btn.dataset.groupKey);
        btn.dataset.allowed = allowed ? "true" : "false";
    });

    filterSidebarList();
}

function getConversationTitle(conversation) {
    if (!conversation) return "محادثة";
    if (conversation.type === "group") {
        return conversation.title || GROUP_CONFIG[conversation.group_key]?.title || "المجموعة العامة";
    }
    if (conversation.type === "private") {
        if (currentProfile?.role === "customer") {
            const adminName = customersList?.querySelector(".customer-button strong");
            return adminName?.textContent?.trim() || "الأستاذ عبد الكريم";
        }
        if (conversation.customer_id) {
            return profileCache.get(conversation.customer_id)?.display_name || "محادثة خاصة";
        }
    }
    return "محادثة";
}

async function openInitialAdminConversation() {
    if (currentProfile?.role !== "admin") return;
    const preferredGroup =
        conversations.find(c => c.type === "group" && c.group_key === "3as") ||
        conversations.find(c => c.type === "group");
    if (preferredGroup) {
        await selectConversation(preferredGroup, { openMobile: false });
        return;
    }
    const privateConv = conversations.find(c => c.type === "private");
    if (privateConv) await selectConversation(privateConv, { openMobile: false });
}

async function selectConversation(conversation, options = {}) {
    if (!conversation || !conversation.id) return;

    if (options.openMobile !== false) openMobileChatView();

    closeContextMenu();
    closeAllReactionPickers();
    closeChatSearch();
    removePinnedBanner();
    cancelReply();
    cancelEdit();
    clearFilePreview();
    stopMessageSync();
    clearLocalTyping();

    currentConversation = { ...conversation };
    currentMessages = [];
    hasMoreMessages = false;
    oldestLoadedTimestamp = null;
    reactionCache.clear();
    readCache.clear();
    pollVotesCache.clear();
    renderingMessageIds.clear();

    const groupMeta = GROUP_CONFIG[conversation.group_key];
    const title = getConversationTitle(conversation);

    if (conversationTitle) conversationTitle.textContent = title;

    defaultConversationSubtitle = conversation.type === "group"
        ? (groupMeta?.subtitle || "المحادثة الجماعية")
        : "محادثة خاصة";

    if (conversationSubtitle) {
        conversationSubtitle.textContent = defaultConversationSubtitle;
        conversationSubtitle.classList.remove("typing");
    }

    if (chatAvatar) {
        if (conversation.type === "group") {
            chatAvatar.textContent = groupMeta?.icon || "👥";
            chatAvatar.style.background = "";
        } else {
            chatAvatar.textContent = getInitial(title);
            chatAvatar.style.background = getAvatarColor(title);
        }
    }

    const isAdminGroup = currentProfile?.role === "admin" && conversation.type === "group";
    manageMembersButton?.classList.toggle("hidden", !isAdminGroup);
    lockChatButton?.classList.toggle("hidden", !isAdminGroup);

    applyConversationLockUI(Boolean(conversation.is_locked));
    updateSidebarActiveState(conversation);

    if (activeRealtimeChannel && db) {
        try { await db.removeChannel(activeRealtimeChannel); } catch {}
        activeRealtimeChannel = null;
    }

    await loadMessages();

    if (String(currentConversation?.id) === String(conversation.id)) {
        await subscribeRealtime(conversation.id);
        startMessageSync(conversation.id);
    }
}

function handleLocalTyping() {
    if (!activeRealtimeChannel || !currentUser || !currentConversation) return;
    if (!isCurrentlyTyping) {
        isCurrentlyTyping = true;
        activeRealtimeChannel.track({
            user_id: currentUser.id,
            name: currentProfile?.display_name || "عضو",
            typing: true
        }).catch(() => {});
    }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(clearLocalTyping, 2500);
}

function clearLocalTyping() {
    clearTimeout(typingTimer);
    typingTimer = null;
    if (isCurrentlyTyping && activeRealtimeChannel && currentUser) {
        isCurrentlyTyping = false;
        activeRealtimeChannel.track({
            user_id: currentUser.id,
            name: currentProfile?.display_name || "عضو",
            typing: false
        }).catch(() => {});
    }
}

function updateTypingIndicatorFromPresence(channel) {
    if (!conversationSubtitle || !channel) return;
    const state = channel.presenceState();
    const typingNames = [];

    Object.values(state).forEach(presences => {
        (presences || []).forEach(p => {
            if (p.typing && p.user_id !== currentUser?.id && p.name) {
                if (!typingNames.includes(p.name)) typingNames.push(p.name);
            }
        });
    });

    if (typingNames.length === 1) {
        conversationSubtitle.textContent = `${typingNames[0]} يكتب الآن...`;
        conversationSubtitle.classList.add("typing");
    } else if (typingNames.length > 1) {
        conversationSubtitle.textContent = `${typingNames[0]} وآخرون يكتبون الآن...`;
        conversationSubtitle.classList.add("typing");
    } else {
        conversationSubtitle.textContent = defaultConversationSubtitle;
        conversationSubtitle.classList.remove("typing");
    }
}

function applyConversationLockUI(isLocked) {
    const isAdmin = currentProfile?.role === "admin";
    const isGroup = currentConversation?.type === "group";

    if (lockChatButton && isAdmin && isGroup) {
        lockChatButton.classList.toggle("locked", isLocked);
        lockChatButton.title = isLocked ? "فتح المحادثة للتلاميذ" : "قفل المحادثة (وضع الإعلانات)";
        const label = lockChatButton.querySelector("span");
        if (label) label.textContent = isLocked ? "فتح القسم" : "وضع الإعلانات";
    }

    const studentLocked = !isAdmin && isGroup && isLocked;
    lockedBanner?.classList.toggle("hidden", !studentLocked);
    messageForm?.classList.toggle("hidden", studentLocked);

    if (studentLocked) {
        spanishBar?.classList.add("hidden");
        spanishToggleButton?.classList.remove("active");
    }
}

async function toggleConversationLock() {
    if (!db || currentProfile?.role !== "admin" || currentConversation?.type !== "group") return;
    const nextLocked = !Boolean(currentConversation.is_locked);
    if (lockChatButton) lockChatButton.disabled = true;

    try {
        const { data, error } = await db
            .from("conversations")
            .update({ is_locked: nextLocked })
            .eq("id", currentConversation.id)
            .select("*")
            .single();

        if (error) throw error;
        currentConversation.is_locked = Boolean(data.is_locked);
        const idx = conversations.findIndex(c => String(c.id) === String(data.id));
        if (idx !== -1) conversations[idx].is_locked = currentConversation.is_locked;
        applyConversationLockUI(currentConversation.is_locked);
    } catch (error) {
        showChatError(error.message || "تعذر تغيير حالة القفل.");
    } finally {
        if (lockChatButton) lockChatButton.disabled = false;
    }
}

function updateSidebarActiveState(conversation) {
    const isGroup = conversation?.type === "group";
    groupButtons.forEach(btn => {
        btn.classList.toggle("active", isGroup && btn.dataset.groupKey === conversation?.group_key);
    });

    if (customersList) {
        customersList.querySelectorAll(".customer-button").forEach(btn => {
            if (isGroup) btn.classList.remove("active");
            else if (currentProfile?.role === "customer") btn.classList.add("active");
            else btn.classList.toggle("active", btn.dataset.customerId === String(conversation?.customer_id));
        });
    }
}

async function openPrivateConversation(customer) {
    if (!db || !currentUser || !customer) return;
    const customerId = customer.id;

    const { data: list, error } = await db
        .from("conversations")
        .select("*")
        .eq("type", "private")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1);

    if (error) { showChatError(error.message); return; }
    let conversation = list?.[0] || null;

    if (!conversation) {
        if (currentProfile?.role !== "admin") { showChatError("المحادثة الخاصة غير موجودة."); return; }
        const res = await db.from("conversations").insert({ type: "private", customer_id: customerId }).select("*").single();
        if (res.error) { showChatError(res.error.message); return; }
        conversation = res.data;
        conversations.push(conversation);
    }

    if (currentProfile?.role === "admin") {
        const { data: existing } = await db
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", conversation.id)
            .in("user_id", [currentUser.id, customerId]);
        const existingSet = new Set((existing || []).map(m => m.user_id));
        const missing = [currentUser.id, customerId]
            .filter(uid => !existingSet.has(uid))
            .map(uid => ({ conversation_id: conversation.id, user_id: uid }));
        if (missing.length > 0) await db.from("conversation_members").insert(missing);
    }

    profileCache.set(customerId, customer);
    await selectConversation(conversation);
}

async function openCustomerPrivateConversation() {
    if (!currentUser || currentProfile?.role !== "customer") return;
    const conv = conversations.find(c => c.type === "private" && c.customer_id === currentUser.id);
    if (!conv) { showChatError("المحادثة الخاصة غير موجودة."); return; }
    await selectConversation(conv);
}

async function openGroupConversation(groupKey) {
    if (!db || !currentUser || !groupKey) return;
    let group = conversations.find(c => c.type === "group" && c.group_key === groupKey);

    if (!group) {
        const { data, error } = await db
            .from("conversations")
            .select("*")
            .eq("type", "group")
            .eq("group_key", groupKey)
            .limit(1);
        if (error) { showChatError(error.message); return; }
        group = data?.[0] || null;
    }

    if (!group) {
        if (currentProfile?.role !== "admin") { showChatError("لست مسجلًا في هذا القسم."); return; }
        const res = await db
            .from("conversations")
            .insert({ type: "group", group_key: groupKey, title: GROUP_CONFIG[groupKey]?.title || "مجموعة" })
            .select("*")
            .single();
        if (res.error) { showChatError(res.error.message); return; }
        group = res.data;
        await db.from("conversation_members").insert({ conversation_id: group.id, user_id: currentUser.id });
    }

    if (!conversations.some(c => String(c.id) === String(group.id))) {
        conversations.push(group);
        updateVisibleGroupButtons();
    }
    await selectConversation(group);
}

/* =========================================================
   MANAGE GROUP MEMBERS MODAL
========================================================= */

async function openMembersModal() {
    if (!db || !membersModal || currentProfile?.role !== "admin" || currentConversation?.type !== "group") return;

    modalConversationId = currentConversation.id;
    modalInitialMemberIds = new Set();
    modalSelectedMemberIds = new Set();
    modalAllStudents = [];

    if (membersModalTitle) membersModalTitle.textContent = `أعضاء ${getConversationTitle(currentConversation)}`;
    if (membersSearchInput) membersSearchInput.value = "";
    hideMembersModalMessage();
    membersModal.classList.remove("hidden");

    if (membersChecklist) membersChecklist.innerHTML = `<div class="members-empty">جارٍ تحميل التلاميذ...</div>`;
    if (saveMembersButton) saveMembersButton.disabled = true;

    try {
        const [studentsRes, membersRes] = await Promise.all([
            db.from("profiles").select("id, display_name, role").eq("role", "customer").order("display_name", { ascending: true }),
            db.from("conversation_members").select("user_id").eq("conversation_id", modalConversationId)
        ]);
        if (studentsRes.error) throw studentsRes.error;
        if (membersRes.error) throw membersRes.error;

        modalAllStudents = studentsRes.data || [];
        const currentSet = new Set((membersRes.data || []).map(r => r.user_id));

        modalAllStudents.forEach(s => {
            if (currentSet.has(s.id)) {
                modalInitialMemberIds.add(s.id);
                modalSelectedMemberIds.add(s.id);
            }
        });

        renderMembersChecklist();
        if (saveMembersButton) saveMembersButton.disabled = false;
    } catch (error) {
        if (membersChecklist) membersChecklist.innerHTML = `<div class="members-empty">تعذر تحميل الأعضاء.</div>`;
        showMembersModalMessage(error?.message || "حدث خطأ.", "error");
    }
}

function renderMembersChecklist() {
    if (!membersChecklist) return;
    const q = (membersSearchInput?.value || "").trim().toLowerCase();
    const filtered = modalAllStudents.filter(s => (s.display_name || "تلميذ").toLowerCase().includes(q));
    if (membersCount) membersCount.textContent = `${modalSelectedMemberIds.size} محدد`;

    if (filtered.length === 0) {
        membersChecklist.innerHTML = `<div class="members-empty">لا يوجد تلاميذ مطابقون.</div>`;
        return;
    }

    membersChecklist.innerHTML = "";
    for (const student of filtered) {
        const label = document.createElement("label");
        label.className = "member-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = modalSelectedMemberIds.has(student.id);
        cb.addEventListener("change", () => {
            if (cb.checked) modalSelectedMemberIds.add(student.id);
            else modalSelectedMemberIds.delete(student.id);
            if (membersCount) membersCount.textContent = `${modalSelectedMemberIds.size} محدد`;
        });
        const span = document.createElement("span");
        span.className = "member-row-name";
        span.textContent = student.display_name || "تلميذ";
        label.appendChild(cb);
        label.appendChild(span);
        membersChecklist.appendChild(label);
    }
}

async function saveGroupMembers() {
    if (!db || !modalConversationId || currentProfile?.role !== "admin") return;

    const toAdd = [...modalSelectedMemberIds]
        .filter(uid => !modalInitialMemberIds.has(uid))
        .map(uid => ({ conversation_id: modalConversationId, user_id: uid }));
    const toRemove = [...modalInitialMemberIds].filter(uid => !modalSelectedMemberIds.has(uid));

    if (toAdd.length === 0 && toRemove.length === 0) { closeMembersModal(); return; }

    if (saveMembersButton) { saveMembersButton.disabled = true; saveMembersButton.textContent = "جارٍ الحفظ..."; }
    hideMembersModalMessage();

    try {
        if (toAdd.length > 0) {
            const { error } = await db.from("conversation_members").insert(toAdd);
            if (error) throw error;
        }
        if (toRemove.length > 0) {
            const { error } = await db
                .from("conversation_members")
                .delete()
                .eq("conversation_id", modalConversationId)
                .in("user_id", toRemove);
            if (error) throw error;
        }
        modalInitialMemberIds = new Set(modalSelectedMemberIds);
        showMembersModalMessage("تم تحديث أعضاء القسم بنجاح.", "success");
        setTimeout(closeMembersModal, 700);
    } catch (error) {
        showMembersModalMessage(error?.message || "تعذر حفظ التغييرات.", "error");
    } finally {
        if (saveMembersButton) { saveMembersButton.disabled = false; saveMembersButton.textContent = "حفظ التغييرات"; }
    }
}

function closeMembersModal() {
    membersModal?.classList.add("hidden");
    modalConversationId = null;
    hideMembersModalMessage();
}

function showMembersModalMessage(text, type = "error") {
    if (!membersModalMessage) return;
    membersModalMessage.textContent = text;
    membersModalMessage.classList.remove("hidden", "error", "success");
    membersModalMessage.classList.add(type);
}

function hideMembersModalMessage() {
    if (!membersModalMessage) return;
    membersModalMessage.textContent = "";
    membersModalMessage.classList.add("hidden");
    membersModalMessage.classList.remove("error", "success");
}

/* =========================================================
   MINI-QUIZ / POLL MODAL (ADMIN) & VOTING
========================================================= */

function openPollModal() {
    if (!pollModal || currentProfile?.role !== "admin" || !currentConversation) return;
    if (pollQuestionInput) pollQuestionInput.value = "";
    pollModal.querySelectorAll(".poll-option-input").forEach(inp => { inp.value = ""; });
    const noneRadio = pollModal.querySelector('input[name="pollCorrect"][value="-1"]');
    if (noneRadio) noneRadio.checked = true;
    hidePollModalMessage();
    pollModal.classList.remove("hidden");
    pollQuestionInput?.focus();
}

function closePollModal() {
    pollModal?.classList.add("hidden");
    hidePollModalMessage();
}

function showPollModalMessage(text) {
    if (!pollModalMessage) return;
    pollModalMessage.textContent = text;
    pollModalMessage.classList.remove("hidden", "success");
    pollModalMessage.classList.add("error");
}

function hidePollModalMessage() {
    if (!pollModalMessage) return;
    pollModalMessage.textContent = "";
    pollModalMessage.classList.add("hidden");
}

async function submitNewPoll() {
    if (!db || !currentUser || !currentConversation || currentProfile?.role !== "admin") return;

    const question = (pollQuestionInput?.value || "").trim();
    const rawInputs = Array.from(pollModal.querySelectorAll(".poll-option-input"));
    const selectedCorrectRadio = pollModal.querySelector('input[name="pollCorrect"]:checked');
    const rawCorrectIndex = Number(selectedCorrectRadio?.value ?? -1);

    const options = [];
    let mappedCorrectIndex = -1;

    rawInputs.forEach((inp, idx) => {
        const val = inp.value.trim();
        if (val) {
            if (idx === rawCorrectIndex) mappedCorrectIndex = options.length;
            options.push(val);
        }
    });

    if (!question) { showPollModalMessage("اكتب نص السؤال أولًا."); return; }
    if (options.length < 2) { showPollModalMessage("أدخل خيارين على الأقل."); return; }

    if (sendPollButton) { sendPollButton.disabled = true; sendPollButton.textContent = "جارٍ النشر..."; }
    hidePollModalMessage();

    try {
        const payload = {
            conversation_id: currentConversation.id,
            sender_id: currentUser.id,
            content: question,
            message_type: "poll",
            poll_data: {
                question,
                options,
                correct_index: mappedCorrectIndex
            }
        };
        if (selectedTag) payload.tag = selectedTag;

        const { data: inserted, error } = await db.from("messages").insert(payload).select("*").single();
        if (error) throw error;

        setSelectedTag("");
        closePollModal();

        if (inserted) {
            pollVotesCache.set(String(inserted.id), []);
            upsertCurrentMessage(inserted);
            updateSinglePreview(inserted);
            await renderMessage(inserted, { expectedConversationId: currentConversation.id });
            scrollMessagesToBottom();
        }
    } catch (error) {
        console.error("Create poll error:", error);
        showPollModalMessage(error?.message || "تعذر نشر الاختبار.");
    } finally {
        if (sendPollButton) { sendPollButton.disabled = false; sendPollButton.textContent = "نشر الاختبار"; }
    }
}

async function voteOnPoll(message, optionIndex) {
    if (!db || !currentUser || !message?.id) return;

    try {
        const { error } = await db
            .from("poll_votes")
            .upsert(
                { message_id: message.id, user_id: currentUser.id, option_index: optionIndex },
                { onConflict: "message_id,user_id" }
            );
        if (error) throw error;

        await reloadPollVotesForMessage(message.id);
        await renderMessage(message, {
            forceRefresh: true,
            expectedConversationId: currentConversation?.id
        });
    } catch (error) {
        console.error("Poll vote error:", error);
        showChatError(error?.message || "تعذر تسجيل إجابتك.");
    }
}

async function reloadPollVotesForMessage(messageId) {
    const { data, error } = await db
        .from("poll_votes")
        .select("user_id, option_index")
        .eq("message_id", messageId);
    if (!error) pollVotesCache.set(String(messageId), data || []);
}

function buildPollCardElement(message) {
    const data = message.poll_data || {};
    const options = Array.isArray(data.options) ? data.options : [];
    const correctIndex = Number.isInteger(data.correct_index) ? data.correct_index : -1;
    const isQuiz = correctIndex >= 0;

    const votes = pollVotesCache.get(String(message.id)) || [];
    const totalVotes = votes.length;
    const myVote = votes.find(v => v.user_id === currentUser?.id);
    const hasVoted = Boolean(myVote);
    const showResults = hasVoted || currentProfile?.role === "admin";
    const revealCorrect = isQuiz && showResults;

    const counts = options.map(() => 0);
    votes.forEach(v => {
        if (v.option_index >= 0 && v.option_index < counts.length) counts[v.option_index]++;
    });

    const card = document.createElement("div");
    card.className = "poll-card";

    const header = document.createElement("div");
    header.className = "poll-header";
    header.innerHTML =
        `<span class="poll-badge">${isQuiz ? "📝 اختبار سريع" : "📊 استطلاع رأي"}</span>` +
        `<div class="poll-question">${escapeHtml(data.question || message.content || "")}</div>` +
        `<div class="poll-subhint">${isQuiz ? "اختر الإجابة الصحيحة" : "اختر خيارًا واحدًا"}</div>`;
    card.appendChild(header);

    const list = document.createElement("div");
    list.className = "poll-options-list";

    options.forEach((optText, idx) => {
        const count = counts[idx] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isMyChoice = myVote?.option_index === idx;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "poll-option-btn";
        if (isMyChoice) btn.classList.add("selected");
        if (revealCorrect && idx === correctIndex) btn.classList.add("is-correct");
        if (revealCorrect && isMyChoice && idx !== correctIndex) btn.classList.add("is-wrong");

        let checkSymbol = "";
        if (revealCorrect && idx === correctIndex) checkSymbol = "✓";
        else if (revealCorrect && isMyChoice && idx !== correctIndex) checkSymbol = "✕";
        else if (isMyChoice) checkSymbol = "✓";

        const statsHtml = showResults
            ? `<span class="poll-opt-stats">${pct}% (${count})</span>`
            : "";

        btn.innerHTML =
            `<div class="poll-opt-top">` +
                `<span class="poll-check" aria-hidden="true">${checkSymbol}</span>` +
                `<span class="poll-opt-label">${escapeHtml(optText)}</span>` +
                statsHtml +
            `</div>` +
            `<div class="poll-bar-track">` +
                `<span class="poll-bar-fill" style="width:${showResults ? pct : 0}%"></span>` +
            `</div>`;

        btn.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            voteOnPoll(message, idx);
        });

        list.appendChild(btn);
    });

    card.appendChild(list);

    const meta = document.createElement("div");
    meta.className = "poll-meta";
    meta.innerHTML =
        `<span>${totalVotes === 0 ? "لا توجد أصوات بعد" : (totalVotes === 1 ? "صوت واحد" : `${totalVotes} أصوات`)}</span>` +
        `<span>${hasVoted ? "تم التصويت" : "اضغط للتصويت"}</span>`;
    card.appendChild(meta);

    return card;
}
/* =========================================================
   SECTION ARCHIVE MODAL (FULL CONVERSATION QUERY)
========================================================= */

async function openArchiveModal() {
    if (!archiveModal || !currentConversation) return;
    if (archiveModalTitle) {
        archiveModalTitle.textContent = `أرشيف ${getConversationTitle(currentConversation)}`;
    }
    archiveModal.classList.remove("hidden");
    if (archiveList) archiveList.innerHTML = `<div class="members-empty">جارٍ تحميل الأرشيف...</div>`;

    try {
        const { data, error } = await db
            .from("messages")
            .select("*")
            .eq("conversation_id", currentConversation.id)
            .or("message_type.in.(file,image,audio,poll),tag.not.is.null")
            .order("created_at", { ascending: false })
            .limit(200);

        archiveMessagesCache = !error && Array.isArray(data) ? data : currentMessages.slice().reverse();
    } catch {
        archiveMessagesCache = currentMessages.slice().reverse();
    }

    renderArchiveItems();
}

function closeArchiveModal() {
    archiveModal?.classList.add("hidden");
}

async function renderArchiveItems() {
    if (!archiveList) return;

    const filtered = archiveMessagesCache.filter(m => {
        if (currentArchiveFilter === "file") return m.message_type === "file";
        if (currentArchiveFilter === "image") return m.message_type === "image";
        if (currentArchiveFilter === "audio") return m.message_type === "audio";
        if (currentArchiveFilter === "poll") return m.message_type === "poll";
        if (currentArchiveFilter === "tagged") return Boolean(m.tag && MESSAGE_TAGS[m.tag]);
        return true;
    });

    if (filtered.length === 0) {
        archiveList.innerHTML = `<div class="members-empty">لا توجد عناصر في هذا القسم من الأرشيف حتى الآن.</div>`;
        return;
    }

    archiveList.innerHTML = "";

    for (const msg of filtered) {
        const sender = await getProfile(msg.sender_id);
        const senderName = sender?.display_name || "مستخدم";

        const item = document.createElement("div");
        item.className = "archive-item";

        const tagPrefix = msg.tag && MESSAGE_TAGS[msg.tag] ? `${MESSAGE_TAGS[msg.tag].label} · ` : "";
        const title = msg.message_type === "file"
            ? (msg.content || extractFileNameFromPath(msg.file_path))
            : getMessagePreview(msg);

        item.innerHTML = `
            <div class="archive-item-body">
                <div class="archive-item-title">${escapeHtml(tagPrefix + title)}</div>
                <div class="archive-item-meta">${escapeHtml(senderName)} · ${escapeHtml(formatDate(msg.created_at))}</div>
            </div>
            <div class="archive-item-actions"></div>
        `;

        const actions = item.querySelector(".archive-item-actions");

        if (msg.file_path && (msg.message_type === "file" || msg.message_type === "image")) {
            const openBtn = document.createElement("button");
            openBtn.type = "button";
            openBtn.className = "archive-btn";
            openBtn.textContent = msg.message_type === "file" ? "تحميل" : "عرض";
            openBtn.addEventListener("click", async () => {
                try {
                    const url = await signedUrl(msg.file_path);
                    if (!url) return;
                    if (msg.message_type === "image") openImageLightbox(url, title);
                    else window.open(url, "_blank", "noopener");
                } catch (e) { console.error(e); }
            });
            actions.appendChild(openBtn);
        }

        const isLoadedInDom = Boolean(
            messagesContainer?.querySelector(`[data-message-id="${cssEscape(String(msg.id))}"]`)
        );
        if (isLoadedInDom) {
            const jumpBtn = document.createElement("button");
            jumpBtn.type = "button";
            jumpBtn.className = "archive-btn";
            jumpBtn.textContent = "الرسالة";
            jumpBtn.addEventListener("click", () => {
                closeArchiveModal();
                scrollToMessage(msg.id);
            });
            actions.appendChild(jumpBtn);
        }

        archiveList.appendChild(item);
    }
}

/* =========================================================
   IN-CHAT SEARCH
========================================================= */

function toggleChatSearch() {
    if (!chatSearchBar) return;
    const isHidden = chatSearchBar.classList.toggle("hidden");
    chatSearchButton?.classList.toggle("active", !isHidden);
    if (!isHidden) {
        chatSearchInput?.focus();
        runChatSearch();
    } else {
        clearChatSearchHighlights();
    }
}

function closeChatSearch() {
    chatSearchBar?.classList.add("hidden");
    chatSearchButton?.classList.remove("active");
    if (chatSearchInput) chatSearchInput.value = "";
    clearChatSearchHighlights();
}

function clearChatSearchHighlights() {
    chatSearchMatches = [];
    chatSearchIndex = -1;
    if (chatSearchCount) chatSearchCount.textContent = "0 / 0";
    messagesContainer?.querySelectorAll(".search-match, .search-match-active").forEach(el => {
        el.classList.remove("search-match", "search-match-active");
    });
}

function runChatSearch() {
    clearChatSearchHighlights();
    const q = (chatSearchInput?.value || "").trim().toLowerCase();
    if (!q) return;

    const matchedIds = currentMessages
        .filter(m => {
            const text = `${m.content || ""} ${m.poll_data?.question || ""}`.toLowerCase();
            return text.includes(q);
        })
        .map(m => String(m.id));

    matchedIds.forEach(id => {
        const el = messagesContainer?.querySelector(`[data-message-id="${cssEscape(id)}"]`);
        if (el) {
            el.classList.add("search-match");
            chatSearchMatches.push(el);
        }
    });

    if (chatSearchMatches.length > 0) {
        chatSearchIndex = chatSearchMatches.length - 1;
        focusChatSearchMatch();
    }
}

function navigateChatSearch(delta) {
    if (chatSearchMatches.length === 0) return;
    chatSearchIndex = (chatSearchIndex + delta + chatSearchMatches.length) % chatSearchMatches.length;
    focusChatSearchMatch();
}

function focusChatSearchMatch() {
    chatSearchMatches.forEach((el, i) => {
        el.classList.toggle("search-match-active", i === chatSearchIndex);
    });
    const activeEl = chatSearchMatches[chatSearchIndex];
    if (activeEl) activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    if (chatSearchCount) {
        chatSearchCount.textContent = `${chatSearchIndex + 1} / ${chatSearchMatches.length}`;
    }
}

/* =========================================================
   CUSTOMERS LIST (WITH INITIALS AVATARS & PREVIEWS)
========================================================= */

function createCustomerButtonElement(id, displayName, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "customer-button";
    button.dataset.customerId = String(id);

    const avatarColor = getAvatarColor(displayName);
    const initial = getInitial(displayName);

    button.innerHTML = `
        <span class="customer-avatar" style="background:${avatarColor}" aria-hidden="true">${escapeHtml(initial)}</span>
        <span class="conversation-copy">
            <span class="conversation-row-top">
                <strong>${escapeHtml(displayName)}</strong>
                <span class="conversation-time"></span>
            </span>
            <span class="conversation-row-bottom">
                <small class="conversation-preview">محادثة خاصة</small>
                <span class="unread-badge hidden">0</span>
            </span>
        </span>
    `;

    button.addEventListener("click", onClick);
    return button;
}

async function loadCustomers() {
    if (!db || !customersList) return;
    customersList.innerHTML = "";

    if (currentProfile?.role === "admin") {
        const { data, error } = await db
            .from("profiles")
            .select("*")
            .eq("role", "customer")
            .order("display_name", { ascending: true });

        if (error) { showChatError(error.message); return; }
        customers = data || [];

        for (const customer of customers) {
            profileCache.set(customer.id, customer);
            const btn = createCustomerButtonElement(
                customer.id,
                customer.display_name || "تلميذ",
                () => {
                    openMobileChatView();
                    openPrivateConversation(customer);
                }
            );
            customersList.appendChild(btn);
        }
        renderUnreadBadges();
        renderSidebarPreviews();
        return;
    }

    if (currentProfile?.role === "customer") {
        const privateConv = conversations.find(c => c.type === "private" && c.customer_id === currentUser.id);
        if (!privateConv) return;

        const { data: members } = await db
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", privateConv.id);

        const adminMember = (members || []).find(m => m.user_id !== currentUser.id);
        if (!adminMember) return;

        const { data: adminProfile } = await db
            .from("profiles")
            .select("*")
            .eq("id", adminMember.user_id)
            .maybeSingle();
        if (!adminProfile) return;

        profileCache.set(adminProfile.id, adminProfile);
        const btn = createCustomerButtonElement(
            adminProfile.id,
            adminProfile.display_name || "الأستاذ عبد الكريم",
            () => {
                openMobileChatView();
                openCustomerPrivateConversation();
            }
        );
        customersList.appendChild(btn);
        renderUnreadBadges();
        renderSidebarPreviews();
    }
}

/* =========================================================
   MESSAGES, PAGINATION & DATE DIVIDERS
========================================================= */

async function loadMessages() {
    if (!db || !currentConversation || !messagesContainer) return;

    const conversationId = currentConversation.id;
    messagesContainer.innerHTML = "";
    reactionCache.clear();
    readCache.clear();
    pollVotesCache.clear();
    renderingMessageIds.clear();
    hasMoreMessages = false;
    oldestLoadedTimestamp = null;

    const { data, error } = await db
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE + 1);

    if (error) { showChatError(error.message); return; }
    if (String(currentConversation?.id) !== String(conversationId)) return;

    const rows = Array.isArray(data) ? data : [];
    hasMoreMessages = rows.length > PAGE_SIZE;
    const messages = rows.slice(0, PAGE_SIZE).reverse();

    currentMessages = messages;
    oldestLoadedTimestamp = messages[0]?.created_at || null;

    if (messages.length === 0) {
        renderEmptyState();
        removePinnedBanner();
        unreadCounts.delete(String(conversationId));
        renderUnreadBadges();
        return;
    }

    await preloadMessageMetadata(messages);
    if (String(currentConversation?.id) !== String(conversationId)) return;

    renderLoadOlderButton();

    for (const message of messages) {
        if (String(currentConversation?.id) !== String(conversationId)) return;
        await renderMessage(message, { expectedConversationId: conversationId });
    }

    syncDateDividers();
    await restorePinnedMessage(currentConversation);
    scrollMessagesToBottom();
    await markMessagesAsRead(messages);
}

async function loadOlderMessages() {
    if (!db || !currentConversation || !hasMoreMessages || loadingOlderMessages || !oldestLoadedTimestamp) return;
    loadingOlderMessages = true;

    const conversationId = currentConversation.id;
    const btn = messagesContainer?.querySelector(".load-older-btn");
    if (btn) { btn.disabled = true; btn.textContent = "جارٍ التحميل..."; }

    try {
        const { data, error } = await db
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .lt("created_at", oldestLoadedTimestamp)
            .order("created_at", { ascending: false })
            .limit(PAGE_SIZE + 1);

        if (error || String(currentConversation?.id) !== String(conversationId)) return;

        const rows = Array.isArray(data) ? data : [];
        hasMoreMessages = rows.length > PAGE_SIZE;
        const older = rows.slice(0, PAGE_SIZE).reverse();

        if (older.length === 0) {
            messagesContainer.querySelector(".load-older-wrap")?.remove();
            return;
        }

        await preloadMessageMetadata(older);
        if (String(currentConversation?.id) !== String(conversationId)) return;

        const prevHeight = messagesContainer.scrollHeight;
        const prevTop = messagesContainer.scrollTop;

        currentMessages = [...older, ...currentMessages];
        oldestLoadedTimestamp = older[0]?.created_at || oldestLoadedTimestamp;

        // إعادة رسم القائمة المرتبة مع الحفاظ على موقع التمرير
        messagesContainer.innerHTML = "";
        renderLoadOlderButton();

        for (const msg of currentMessages) {
            await renderMessage(msg, {
                expectedConversationId: conversationId,
                forceRefresh: true
            });
        }

        syncDateDividers();
        messagesContainer.scrollTop = prevTop + (messagesContainer.scrollHeight - prevHeight);
        await markMessagesAsRead(older);
    } finally {
        loadingOlderMessages = false;
    }
}

function renderLoadOlderButton() {
    messagesContainer?.querySelector(".load-older-wrap")?.remove();
    if (!hasMoreMessages || !messagesContainer) return;

    const wrap = document.createElement("div");
    wrap.className = "load-older-wrap";
    wrap.innerHTML = `<button type="button" class="load-older-btn">↑ تحميل رسائل أقدم</button>`;
    wrap.querySelector("button")?.addEventListener("click", loadOlderMessages);
    messagesContainer.prepend(wrap);
}

async function preloadMessageMetadata(messages) {
    await Promise.all([
        loadReplyMessages(messages),
        preloadReactions(messages),
        preloadReads(messages),
        preloadPollVotes(messages)
    ]);
}

async function preloadReactions(messages) {
    const ids = messages.map(m => m.id).filter(Boolean);
    if (ids.length === 0) return;
    const { data, error } = await db.from("message_reactions").select("*").in("message_id", ids);
    if (error) return;
    ids.forEach(id => { if (!reactionCache.has(id)) reactionCache.set(id, []); });
    (data || []).forEach(row => {
        if (!reactionCache.has(row.message_id)) reactionCache.set(row.message_id, []);
        reactionCache.get(row.message_id).push(row);
    });
}

async function preloadReads(messages) {
    const ids = messages.map(m => m.id).filter(Boolean);
    if (ids.length === 0) return;
    const { data, error } = await db.from("message_reads").select("message_id, user_id").in("message_id", ids);
    if (error) return;
    (data || []).forEach(row => {
        const key = String(row.message_id);
        if (!readCache.has(key)) readCache.set(key, new Set());
        readCache.get(key).add(row.user_id);
    });
}

async function preloadPollVotes(messages) {
    const pollIds = messages.filter(m => m.message_type === "poll").map(m => m.id);
    if (pollIds.length === 0) return;
    const { data, error } = await db.from("poll_votes").select("message_id, user_id, option_index").in("message_id", pollIds);
    if (error) return;
    pollIds.forEach(id => pollVotesCache.set(String(id), []));
    (data || []).forEach(row => {
        const key = String(row.message_id);
        if (!pollVotesCache.has(key)) pollVotesCache.set(key, []);
        pollVotesCache.get(key).push(row);
    });
}

function syncDateDividers() {
    if (!messagesContainer) return;
    messagesContainer.querySelectorAll(".date-divider").forEach(el => el.remove());

    let lastDateKey = "";
    const msgElements = Array.from(messagesContainer.querySelectorAll(".message"));

    for (const el of msgElements) {
        const dateKey = el.dataset.dateKey || "";
        if (dateKey && dateKey !== lastDateKey) {
            const divider = document.createElement("div");
            divider.className = "date-divider";
            divider.innerHTML = `<span>${escapeHtml(formatDateDividerLabel(el.dataset.createdAt))}</span>`;
            el.insertAdjacentElement("beforebegin", divider);
            lastDateKey = dateKey;
        }
    }
}

function stopMessageSync() {
    if (messageSyncTimer) { clearInterval(messageSyncTimer); messageSyncTimer = null; }
    messageSyncInProgress = false;
}

function startMessageSync(conversationId) {
    stopMessageSync();
    if (!conversationId) return;

    messageSyncTimer = setInterval(async () => {
        if (
            messageSyncInProgress ||
            !navigator.onLine ||
            !currentConversation ||
            String(currentConversation.id) !== String(conversationId)
        ) {
            return;
        }

        messageSyncInProgress = true;
        try {
            const latest = currentMessages[currentMessages.length - 1];
            let query = db
                .from("messages")
                .select("*")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true })
                .limit(30);

            if (latest?.created_at) query = query.gt("created_at", latest.created_at);

            const { data, error } = await query;
            if (error || String(currentConversation?.id) !== String(conversationId)) return;

            const newMessages = (data || []).filter(msg => {
                const msgId = String(msg.id);
                if (renderingMessageIds.has(msgId)) return false;
                return !messagesContainer.querySelector(`[data-message-id="${cssEscape(msgId)}"]`);
            });

            if (newMessages.length > 0) {
                const shouldScroll = isNearBottom();
                await preloadMessageMetadata(newMessages);
                for (const msg of newMessages) {
                    if (String(currentConversation?.id) !== String(conversationId)) break;
                    upsertCurrentMessage(msg);
                    updateSinglePreview(msg);
                    await renderMessage(msg, { expectedConversationId: conversationId });
                }
                syncDateDividers();
                if (shouldScroll || newMessages.some(m => m.sender_id === currentUser?.id)) {
                    scrollMessagesToBottom();
                }
                await markMessagesAsRead(newMessages);
            }
        } catch {}
        finally { messageSyncInProgress = false; }
    }, 6000);
}

function upsertCurrentMessage(msg) {
    const idx = currentMessages.findIndex(m => String(m.id) === String(msg.id));
    if (idx === -1) currentMessages.push(msg);
    else currentMessages[idx] = msg;
}

async function loadReplyMessages(messages) {
    const replyIds = messages.map(m => m.reply_to_message_id).filter(Boolean);
    if (replyIds.length === 0) return;
    const uniqueIds = [...new Set(replyIds)];
    const { data, error } = await db.from("messages").select("*").in("id", uniqueIds);
    if (error) return;
    const map = new Map((data || []).map(m => [m.id, m]));
    messages.forEach(m => {
        if (m.reply_to_message_id) m.replyMessage = map.get(m.reply_to_message_id) || null;
    });
}

/* =========================================================
   RENDER MESSAGE
========================================================= */

async function renderMessage(message, options = {}) {
    if (!messagesContainer || !message || !message.id) return;

    const messageId = String(message.id);
    const expectedConversationId = String(
        options.expectedConversationId || message.conversation_id || currentConversation?.id || ""
    );

    if (expectedConversationId && String(currentConversation?.id) !== expectedConversationId) return;

    if (!options.forceRefresh) {
        if (renderingMessageIds.has(messageId)) return;
        if (messagesContainer.querySelector(`[data-message-id="${cssEscape(messageId)}"]`)) return;
    }

    renderingMessageIds.add(messageId);

    try {
        const wrapper = document.createElement("div");
        wrapper.className = "message";
        wrapper.dataset.messageId = messageId;
        wrapper.dataset.createdAt = message.created_at || "";
        wrapper.dataset.dateKey = getDateKey(message.created_at);

        const isMine = message.sender_id === currentUser?.id;
        if (isMine) wrapper.classList.add("own");

        const sender = await getProfile(message.sender_id);
        const senderName = sender?.display_name || "مستخدم";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        if (message.tag && MESSAGE_TAGS[message.tag]) {
            const tagInfo = MESSAGE_TAGS[message.tag];
            const badge = document.createElement("div");
            badge.className = `message-tag-badge ${tagInfo.className}`;
            badge.textContent = tagInfo.label;
            bubble.appendChild(badge);
        }

        if (message.replyMessage) {
            const replyBox = document.createElement("div");
            replyBox.className = "message-reply";
            const replySender = await getProfile(message.replyMessage.sender_id);
            replyBox.innerHTML = `
                <div class="reply-sender">${escapeHtml(replySender?.display_name || "مستخدم")}</div>
                <div class="reply-content">${escapeHtml(getMessagePreview(message.replyMessage))}</div>
            `;
            replyBox.addEventListener("click", e => {
                e.preventDefault(); e.stopPropagation(); scrollToMessage(message.replyMessage.id);
            });
            bubble.appendChild(replyBox);
        }

        const senderEl = document.createElement("div");
        senderEl.className = "message-sender";
        senderEl.textContent = senderName;
        if (currentProfile?.role === "admin" && sender?.role === "customer" && !isMine) {
            senderEl.classList.add("clickable");
            senderEl.title = "فتح محادثة خاصة";
            senderEl.addEventListener("click", e => {
                e.preventDefault(); e.stopPropagation();
                openMobileChatView();
                openPrivateConversation(sender);
            });
        }
        bubble.appendChild(senderEl);

        const content = document.createElement("div");
        content.className = "message-content";

        if (message.message_type === "poll" && message.poll_data) {
            content.appendChild(buildPollCardElement(message));
        } else if (message.message_type === "image") {
            const image = document.createElement("img");
            image.className = "message-image";
            image.alt = message.content || "صورة";
            image.loading = "lazy";
            try {
                const url = await signedUrl(message.file_path);
                if (url) {
                    image.src = url;
                    image.addEventListener("click", e => {
                        e.preventDefault(); e.stopPropagation(); openImageLightbox(url, image.alt);
                    });
                }
            } catch {}
            content.appendChild(image);

            if (message.content && !/\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(message.content.trim())) {
                const caption = document.createElement("div");
                caption.className = "message-caption";
                caption.textContent = message.content;
                content.appendChild(caption);
            }
        } else if (message.message_type === "file") {
            const fileName = extractFileNameFromPath(message.file_path);
            const ext = getFileExtension(fileName);
            const hasCaption = message.content && message.content.trim() !== fileName.trim();

            const card = document.createElement("a");
            card.className = "message-file-card";
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.download = fileName;
            card.innerHTML = `
                <div class="file-card-icon ${getFileIconClass(ext)}">${escapeHtml(ext.toUpperCase() || "FILE")}</div>
                <div class="file-card-info">
                    <span class="file-card-name">${escapeHtml(fileName)}</span>
                    <span class="file-card-meta">اضغط للفتح أو التحميل</span>
                </div>
                <span class="file-card-download" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </span>
            `;
            try {
                const url = await signedUrl(message.file_path);
                if (url) card.href = url;
            } catch {}
            card.addEventListener("click", e => e.stopPropagation());
            content.appendChild(card);

            if (hasCaption) {
                const caption = document.createElement("div");
                caption.className = "message-caption";
                caption.textContent = message.content;
                content.appendChild(caption);
            }
        } else if (message.message_type === "audio") {
            const audio = document.createElement("audio");
            audio.controls = true;
            audio.preload = "metadata";
            try {
                const url = await signedUrl(message.file_path);
                if (url) audio.src = url;
            } catch {}
            content.appendChild(audio);
            if (message.content) {
                const audioName = document.createElement("div");
                audioName.className = "audio-name";
                audioName.textContent = message.content;
                content.appendChild(audioName);
            }
        } else {
            content.textContent = message.content || "";
        }

        bubble.appendChild(content);

        // التذييل: مُعدّلة + التوقيت + علامات القراءة
        const footer = document.createElement("div");
        footer.className = "message-footer";

        if (message.edited_at) {
            const editedEl = document.createElement("span");
            editedEl.className = "message-edited";
            editedEl.textContent = "مُعدّلة";
            footer.appendChild(editedEl);
        }

        const dateEl = document.createElement("span");
        dateEl.className = "message-date";
        dateEl.textContent = formatTimeOnly(message.created_at);
        footer.appendChild(dateEl);

        if (isMine) {
            const read = isMessageReadByOthers(message);
            const ticks = document.createElement("span");
            ticks.className = `message-ticks${read ? " read" : ""}`;
            ticks.title = read ? "تمت القراءة" : "تم التسليم";
            ticks.textContent = "✓✓";
            footer.appendChild(ticks);
        }

        bubble.appendChild(footer);

        const reactions = document.createElement("div");
        reactions.className = "message-reactions";
        await renderReactionSummary(message, reactions);
        bubble.appendChild(reactions);

        bubble.addEventListener("click", event => {
            if (
                event.target.closest(".reaction-trigger") ||
                event.target.closest(".reaction-summary") ||
                event.target.closest(".reaction-picker") ||
                event.target.closest(".message-sender") ||
                event.target.closest(".message-reply") ||
                event.target.closest(".message-file-card") ||
                event.target.closest(".poll-option-btn") ||
                event.target.closest("audio") ||
                event.target.closest("img")
            ) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            openMessageMenu(message, event.clientX, event.clientY);
        });

        bubble.addEventListener("contextmenu", event => {
            event.preventDefault();
            event.stopPropagation();
            openMessageMenu(message, event.clientX, event.clientY);
        });

        wrapper.appendChild(bubble);

        if (expectedConversationId && String(currentConversation?.id) !== expectedConversationId) return;

        messagesContainer.querySelector(".empty-messages")?.remove();
        const existing = messagesContainer.querySelector(`[data-message-id="${cssEscape(messageId)}"]`);

        if (existing) {
            existing.replaceWith(wrapper);
        } else {
            messagesContainer.appendChild(wrapper);
            syncDateDividers();
        }
    } finally {
        renderingMessageIds.delete(messageId);
    }
}

/* =========================================================
   LIGHTBOX & MESSAGE CONTEXT MENU
========================================================= */

function openImageLightbox(url, alt = "") {
    closeImageLightbox();
    const overlay = document.createElement("div");
    overlay.className = "image-lightbox";
    overlay.innerHTML = `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">`;
    overlay.addEventListener("click", closeImageLightbox);
    document.body.appendChild(overlay);
}

function closeImageLightbox() {
    document.querySelector(".image-lightbox")?.remove();
}

function openMessageMenu(message, x, y) {
    closeContextMenu();
    closeAllReactionPickers();

    contextMenu = document.createElement("div");
    contextMenu.className = "message-context-menu";

    const isMine = message.sender_id === currentUser?.id;
    const isAdmin = currentProfile?.role === "admin";
    const canEdit = isMine && message.message_type === "text";
    const canDelete = isMine || isAdmin;
    const pinned = isPinnedMessage(message);

    contextMenu.innerHTML = `
        <button type="button" data-action="copy">نسخ</button>
        <button type="button" data-action="reply">رد</button>
        <button type="button" data-action="reaction">تفاعل</button>
        ${canEdit ? `<button type="button" data-action="edit">تعديل الرسالة</button>` : ""}
        ${isAdmin ? `<button type="button" data-action="pin">${pinned ? "فك التثبيت للجميع" : "تثبيت الرسالة للجميع"}</button>` : ""}
        ${isAdmin ? `<button type="button" data-action="readers">👁️ من قرأ الرسالة؟</button>` : ""}
        ${canDelete ? `<button type="button" data-action="delete" class="danger">حذف</button>` : ""}
    `;

    document.body.appendChild(contextMenu);

    contextMenu.querySelector('[data-action="copy"]')?.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); closeContextMenu(); copyMessage(message);
    });
    contextMenu.querySelector('[data-action="reply"]')?.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); closeContextMenu(); startReply(message);
    });
    contextMenu.querySelector('[data-action="reaction"]')?.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); closeContextMenu(); showReactionPickerForMessage(message);
    });
    contextMenu.querySelector('[data-action="edit"]')?.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); closeContextMenu(); startEdit(message);
    });
    contextMenu.querySelector('[data-action="pin"]')?.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); closeContextMenu();
        if (isPinnedMessage(message)) unpinMessage(currentConversation?.id);
        else pinMessage(message);
    });
    contextMenu.querySelector('[data-action="readers"]')?.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); closeContextMenu(); openReadersModal(message);
    });
    contextMenu.querySelector('[data-action="delete"]')?.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); closeContextMenu(); deleteMessage(message);
    });

    positionContextMenu(x, y);
}

function positionContextMenu(x, y) {
    if (!contextMenu) return;
    const rect = contextMenu.getBoundingClientRect();
    let left = Number.isFinite(x) ? x : window.innerWidth / 2;
    let top = Number.isFinite(y) ? y : window.innerHeight / 2;

    if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 8;
    if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - 8;

    contextMenu.style.left = `${Math.max(8, left)}px`;
    contextMenu.style.top = `${Math.max(8, top)}px`;
}

function closeContextMenu() {
    if (contextMenu) { contextMenu.remove(); contextMenu = null; }
}

/* =========================================================
   COPY, EDIT, DELETE & REPLY
========================================================= */

async function copyMessage(message) {
    const text = getMessagePreview(message);
    if (!text) return;
    try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else {
            const ta = document.createElement("textarea");
            ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
        }
    } catch {}
}

function startEdit(message) {
    if (!message || message.message_type !== "text") return;
    cancelReply();
    clearFilePreview();
    editingMessage = message;
    editPreview?.classList.remove("hidden");
    if (editPreviewContent) editPreviewContent.textContent = message.content || "";
    if (messageInput) {
        messageInput.value = message.content || "";
        messageInput.focus();
    }
}

function cancelEdit() {
    editingMessage = null;
    editPreview?.classList.add("hidden");
    if (editPreviewContent) editPreviewContent.textContent = "";
    if (messageInput) messageInput.value = "";
}

async function deleteMessage(message) {
    if (!db || !message?.id) return;
    const isMine = message.sender_id === currentUser?.id;
    const isAdmin = currentProfile?.role === "admin";
    if (!isMine && !isAdmin) return;
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;

    const { error } = await db.from("messages").delete().eq("id", message.id);
    if (error) { showChatError(error.message); return; }

    if (isPinnedMessage(message) && isAdmin) await unpinMessage(currentConversation?.id);

    currentMessages = currentMessages.filter(m => String(m.id) !== String(message.id));
    document.querySelector(`[data-message-id="${cssEscape(message.id)}"]`)?.remove();
    syncDateDividers();

    if (messagesContainer && !messagesContainer.querySelector(".message")) {
        renderEmptyState();
    }
    loadConversationPreviews();
}

async function startReply(message) {
    if (!message) return;
    cancelEdit();
    replyingToMessage = message;
    replyPreview?.classList.remove("hidden");
    const sender = await getProfile(message.sender_id);
    if (replyPreviewSender) replyPreviewSender.textContent = `الرد على ${sender?.display_name || "مستخدم"}`;
    if (replyPreviewText) replyPreviewText.textContent = getMessagePreview(message);
    messageInput?.focus();
}

function cancelReply() {
    replyingToMessage = null;
    replyPreview?.classList.add("hidden");
    if (replyPreviewSender) replyPreviewSender.textContent = "الرد على";
    if (replyPreviewText) replyPreviewText.textContent = "";
}

/* =========================================================
   SEND MESSAGE, SAVE EDIT & FILE UPLOAD
========================================================= */

async function sendMessage(event) {
    event?.preventDefault();
    if (!db || !currentUser || !currentConversation) return;

    if (
        currentProfile?.role !== "admin" &&
        currentConversation.type === "group" &&
        currentConversation.is_locked
    ) {
        showChatError("هذه المحادثة في وضع الإعلانات حاليًا.");
        return;
    }

    const text = messageInput?.value?.trim() || "";

    // حفظ تعديل رسالة قائمة
    if (editingMessage) {
        if (!text) { cancelEdit(); return; }
        setMessageSending(true);
        try {
            const targetId = editingMessage.id;
            const { data: updated, error } = await db
                .from("messages")
                .update({ content: text, edited_at: new Date().toISOString() })
                .eq("id", targetId)
                .select("*")
                .single();
            if (error) throw error;

            cancelEdit();
            if (updated) {
                await refreshRenderedMessage(updated.id);
                loadConversationPreviews();
            }
        } catch (error) {
            showChatError(error.message || "تعذر تعديل الرسالة.");
        } finally {
            setMessageSending(false);
        }
        return;
    }

    if (selectedFile) {
        const file = selectedFile;
        selectedFile = null;
        clearFilePreview();
        await uploadAttachment(file, text);
        return;
    }

    if (!text) return;

    clearLocalTyping();
    setMessageSending(true);

    try {
        const payload = {
            conversation_id: currentConversation.id,
            sender_id: currentUser.id,
            content: text,
            message_type: "text"
        };
        if (replyingToMessage?.id) payload.reply_to_message_id = replyingToMessage.id;
        if (currentProfile?.role === "admin" && selectedTag) payload.tag = selectedTag;

        const { data: inserted, error } = await db.from("messages").insert(payload).select("*").single();
        if (error) throw error;

        if (messageInput) messageInput.value = "";
        const replyBackup = replyingToMessage;
        cancelReply();
        setSelectedTag("");

        if (inserted) {
            if (replyBackup) inserted.replyMessage = replyBackup;
            upsertCurrentMessage(inserted);
            updateSinglePreview(inserted);
            await renderMessage(inserted, { expectedConversationId: currentConversation.id });
            scrollMessagesToBottom();
        }
    } catch (error) {
        showChatError(error.message);
    } finally {
        setMessageSending(false);
    }
}

function handleFileSelection(event) {
    const file = event.target?.files?.[0];
    if (!file) { selectedFile = null; clearFilePreview(); return; }
    if (file.size > 20 * 1024 * 1024) {
        showChatError("حجم الملف يجب ألا يتجاوز 20MB.");
        clearFilePreview();
        return;
    }
    cancelEdit();
    selectedFile = file;
    showFilePreview(file);
}

function showFilePreview(file) {
    if (!filePreview) return;
    const icon = file.type.startsWith("image/") ? "🖼️" : "📄";
    filePreview.innerHTML = `
        <div class="file-preview-item">
            <span>${icon} ${escapeHtml(file.name)} (${formatFileSize(file.size)})</span>
            <button type="button" id="clear-file-preview">×</button>
        </div>
    `;
    filePreview.classList.remove("hidden");
    filePreview.querySelector("#clear-file-preview")?.addEventListener("click", clearFilePreview);
}

function clearFilePreview() {
    selectedFile = null;
    if (fileInput) fileInput.value = "";
    if (filePreview) { filePreview.innerHTML = ""; filePreview.classList.add("hidden"); }
}

async function uploadAttachment(file, caption = "") {
    if (!db || !currentUser || !currentConversation || !file) return;

    setMessageSending(true);
    const isImage = file.type.startsWith("image/");
    const path = buildStoragePath(isImage ? "images" : "files", file.name);
    const targetConvId = currentConversation.id;

    try {
        const { error: upErr } = await db.storage.from("chat-files").upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream"
        });
        if (upErr) throw upErr;

        const payload = {
            conversation_id: targetConvId,
            sender_id: currentUser.id,
            content: caption || file.name,
            message_type: isImage ? "image" : "file",
            file_path: path
        };
        if (replyingToMessage?.id) payload.reply_to_message_id = replyingToMessage.id;
        if (currentProfile?.role === "admin" && selectedTag) payload.tag = selectedTag;

        const { data: inserted, error: insErr } = await db.from("messages").insert(payload).select("*").single();
        if (insErr) {
            await db.storage.from("chat-files").remove([path]).catch(() => {});
            throw insErr;
        }

        if (messageInput) messageInput.value = "";
        const replyBackup = replyingToMessage;
        cancelReply();
        setSelectedTag("");

        if (inserted) {
            if (replyBackup) inserted.replyMessage = replyBackup;
            upsertCurrentMessage(inserted);
            updateSinglePreview(inserted);
            await renderMessage(inserted, { expectedConversationId: targetConvId });
            scrollMessagesToBottom();
        }
    } catch (error) {
        showChatError(error.message);
        selectedFile = file;
        showFilePreview(file);
    } finally {
        setMessageSending(false);
    }
}

/* =========================================================
   AUDIO RECORDING
========================================================= */

async function toggleRecording() {
    if (mediaRecorder) stopRecording();
    else await startRecording();
}

async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        showChatError("المتصفح لا يدعم تسجيل الصوت.");
        return;
    }
    if (!currentUser || !currentConversation) return;

    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
        const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || "";

        mediaRecorder = mimeType
            ? new MediaRecorder(recordingStream, { mimeType })
            : new MediaRecorder(recordingStream);

        recordingChunks = [];
        const recConvId = currentConversation.id;
        const recUserId = currentUser.id;
        const recReplyId = replyingToMessage?.id || null;
        const recTag = currentProfile?.role === "admin" ? selectedTag : "";

        mediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) recordingChunks.push(e.data); };
        mediaRecorder.onstop = async () => {
            const chunks = recordingChunks;
            recordingChunks = [];
            const recorder = mediaRecorder;
            mediaRecorder = null;
            recordingStream?.getTracks().forEach(t => { try { t.stop(); } catch {} });
            recordingStream = null;
            updateRecordButton(false);

            if (!chunks.length) return;
            const blob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" });
            await uploadAudio(blob, recConvId, recUserId, recReplyId, recTag);
        };
        mediaRecorder.onerror = () => { showChatError("حدث خطأ أثناء التسجيل."); cleanupRecording(); };

        mediaRecorder.start();
        updateRecordButton(true);
    } catch (error) {
        cleanupRecording();
        showChatError(error?.name === "NotAllowedError" ? "تم رفض صلاحية الميكروفون." : "تعذر تشغيل التسجيل.");
    }
}

function stopRecording() {
    if (!mediaRecorder) return;
    try { mediaRecorder.stop(); } catch { cleanupRecording(); }
}

function cleanupRecording() {
    try { if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop(); } catch {}
    mediaRecorder = null;
    recordingChunks = [];
    recordingStream?.getTracks().forEach(t => { try { t.stop(); } catch {} });
    recordingStream = null;
    updateRecordButton(false);
}

async function uploadAudio(blob, conversationId, userId, replyId = null, tag = "") {
    if (!db || !blob || !conversationId || !userId) return;
    setMessageSending(true);
    const path = buildStoragePath("audio", `recording.${getAudioExtension(blob.type)}`);

    try {
        const { error: upErr } = await db.storage.from("chat-files").upload(path, blob, {
            cacheControl: "3600", upsert: false, contentType: blob.type || "audio/webm"
        });
        if (upErr) throw upErr;

        const payload = {
            conversation_id: conversationId,
            sender_id: userId,
            content: "رسالة صوتية",
            message_type: "audio",
            file_path: path
        };
        if (replyId) payload.reply_to_message_id = replyId;
        if (tag) payload.tag = tag;

        const { data: inserted, error: insErr } = await db.from("messages").insert(payload).select("*").single();
        if (insErr) {
            await db.storage.from("chat-files").remove([path]).catch(() => {});
            throw insErr;
        }

        if (String(conversationId) === String(currentConversation?.id)) {
            cancelReply();
            setSelectedTag("");
            if (inserted) {
                upsertCurrentMessage(inserted);
                updateSinglePreview(inserted);
                await renderMessage(inserted, { expectedConversationId: conversationId });
                scrollMessagesToBottom();
            }
        }
    } catch (error) {
        showChatError(error.message);
    } finally {
        setMessageSending(false);
    }
}

function updateRecordButton(recording) {
    if (!recordButton) return;
    recordButton.classList.toggle("recording", recording);
    recordButton.title = recording ? "إيقاف التسجيل" : "تسجيل صوتي";
    recordButton.innerHTML = recording ? STOP_SVG : MIC_SVG;
}

/* =========================================================
   REACTIONS
========================================================= */

async function renderReactionSummary(message, container) {
    if (!message || !container) return;
    const reactions = await loadReactions(message.id);
    const grouped = new Map();

    for (const r of reactions) {
        if (!grouped.has(r.reaction)) grouped.set(r.reaction, []);
        grouped.get(r.reaction).push(r.user_id);
    }

    for (const [reaction, userIds] of grouped) {
        const names = await Promise.all(
            userIds.map(async uid => (await getProfile(uid))?.display_name || "عضو")
        );
        const button = document.createElement("button");
        button.type = "button";
        button.className = "reaction-summary";
        button.title = names.join("، ");
        button.textContent = `${reaction} ${userIds.length}`;
        button.addEventListener("click", async e => {
            e.preventDefault(); e.stopPropagation(); await toggleReaction(message, reaction);
        });
        container.appendChild(button);
    }

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "reaction-trigger";
    addBtn.title = "إضافة تفاعل";
    addBtn.setAttribute("aria-label", "إضافة تفاعل");
    addBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
    `;
    addBtn.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); showReactionPicker(message, addBtn);
    });
    container.appendChild(addBtn);
}

async function loadReactions(messageId) {
    if (reactionCache.has(messageId)) return reactionCache.get(messageId);
    const { data, error } = await db.from("message_reactions").select("*").eq("message_id", messageId);
    const list = !error && Array.isArray(data) ? data : [];
    reactionCache.set(messageId, list);
    return list;
}

function showReactionPicker(message, anchor) {
    closeAllReactionPickers();
    const picker = document.createElement("div");
    picker.className = "reaction-picker";

    for (const reaction of REACTIONS) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "reaction-option";
        btn.textContent = reaction;
        btn.addEventListener("click", async e => {
            e.preventDefault(); e.stopPropagation(); picker.remove(); await toggleReaction(message, reaction);
        });
        picker.appendChild(btn);
    }

    document.body.appendChild(picker);
    const rect = anchor.getBoundingClientRect();
    const pRect = picker.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 5;
    if (left + pRect.width > window.innerWidth) left = window.innerWidth - pRect.width - 8;
    if (top + pRect.height > window.innerHeight) top = rect.top - pRect.height - 5;
    picker.style.left = `${Math.max(8, left)}px`;
    picker.style.top = `${Math.max(8, top)}px`;
}

function showReactionPickerForMessage(message) {
    const el = document.querySelector(`[data-message-id="${cssEscape(message.id)}"]`);
    const btn = el?.querySelector(".reaction-trigger");
    if (btn) showReactionPicker(message, btn);
}

function closeAllReactionPickers() {
    document.querySelectorAll(".reaction-picker").forEach(p => p.remove());
}

async function toggleReaction(message, reaction) {
    if (!db || !currentUser || !message?.id) return;
    try {
        const { data: existing, error: findErr } = await db
            .from("message_reactions")
            .select("id,reaction")
            .eq("message_id", message.id)
            .eq("user_id", currentUser.id)
            .limit(1)
            .maybeSingle();
        if (findErr) throw findErr;

        if (existing) {
            if (existing.reaction === reaction) {
                const { error } = await db.from("message_reactions").delete().eq("id", existing.id);
                if (error) throw error;
            } else {
                const { error } = await db.from("message_reactions").update({ reaction }).eq("id", existing.id);
                if (error) throw error;
            }
        } else {
            const { error } = await db.from("message_reactions").insert({
                message_id: message.id, user_id: currentUser.id, reaction
            });
            if (error) throw error;
        }

        reactionCache.delete(message.id);
        await refreshRenderedMessage(message.id);
    } catch (error) {
        showChatError(error.message);
    }
}

async function refreshRenderedMessage(messageId) {
    if (!currentConversation || !messagesContainer || !db) return;
    const { data: message, error } = await db.from("messages").select("*").eq("id", messageId).maybeSingle();
    if (error || !message) return;

    if (message.reply_to_message_id) {
        const { data: replyMsg } = await db.from("messages").select("*").eq("id", message.reply_to_message_id).maybeSingle();
        message.replyMessage = replyMsg || null;
    }
    if (message.message_type === "poll") {
        await reloadPollVotesForMessage(message.id);
    }

    upsertCurrentMessage(message);
    await renderMessage(message, {
        forceRefresh: true,
        expectedConversationId: currentConversation.id
    });
}

/* =========================================================
   SHARED PINNED MESSAGES (STORED IN SUPABASE FOR EVERYONE)
========================================================= */

function isPinnedMessage(message) {
    if (!currentConversation || !message) return false;
    return String(currentConversation.pinned_message_id || "") === String(message.id);
}

async function pinMessage(message) {
    if (!db || !currentConversation || !message || currentProfile?.role !== "admin") return;

    const { error } = await db
        .from("conversations")
        .update({ pinned_message_id: message.id })
        .eq("id", currentConversation.id);

    if (error) { showChatError(error.message); return; }

    currentConversation.pinned_message_id = message.id;
    const idx = conversations.findIndex(c => String(c.id) === String(currentConversation.id));
    if (idx !== -1) conversations[idx].pinned_message_id = message.id;

    await renderPinnedBanner(message);
    scrollToMessage(message.id);
}

async function unpinMessage(conversationId = currentConversation?.id) {
    if (!db || !conversationId || currentProfile?.role !== "admin") return;

    const { error } = await db
        .from("conversations")
        .update({ pinned_message_id: null })
        .eq("id", conversationId);

    if (error) { showChatError(error.message); return; }

    if (String(currentConversation?.id) === String(conversationId)) {
        currentConversation.pinned_message_id = null;
    }
    const idx = conversations.findIndex(c => String(c.id) === String(conversationId));
    if (idx !== -1) conversations[idx].pinned_message_id = null;

    removePinnedBanner();
}

function removePinnedBanner() {
    document.querySelector(".pinned-message-banner")?.remove();
}

async function restorePinnedMessage(conversation) {
    if (!conversation?.pinned_message_id) { removePinnedBanner(); return; }

    let pinnedMsg = currentMessages.find(m => String(m.id) === String(conversation.pinned_message_id));
    if (!pinnedMsg && db) {
        const { data } = await db
            .from("messages")
            .select("*")
            .eq("id", conversation.pinned_message_id)
            .maybeSingle();
        pinnedMsg = data || null;
    }

    if (!pinnedMsg) { removePinnedBanner(); return; }
    await renderPinnedBanner(pinnedMsg);
}

async function renderPinnedBanner(message) {
    removePinnedBanner();
    const header = document.querySelector(".chat-header");
    if (!header) return;

    const sender = await getProfile(message.sender_id);
    const senderName = sender?.display_name || "الأستاذ";
    const preview = getMessagePreview(message);
    const isAdmin = currentProfile?.role === "admin";

    const banner = document.createElement("div");
    banner.className = "pinned-message-banner";
    banner.innerHTML = `
        <div class="pinned-message-content">
            <strong>📌 رسالة مثبتة للقسم</strong>
            <span>${escapeHtml(senderName)}: ${escapeHtml(preview)}</span>
        </div>
        ${isAdmin ? `<button type="button" class="unpin-message-button" aria-label="فك التثبيت">×</button>` : ""}
    `;

    header.insertAdjacentElement("afterend", banner);

    banner.querySelector(".unpin-message-button")?.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); unpinMessage(currentConversation?.id);
    });
    banner.addEventListener("click", e => {
        if (e.target.closest(".unpin-message-button")) return;
        scrollToMessage(message.id);
    });
}

function scrollToMessage(messageId) {
    const el = document.querySelector(`[data-message-id="${cssEscape(messageId)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("message-highlight");
    setTimeout(() => el.classList.remove("message-highlight"), 1600);
}

/* =========================================================
   REALTIME (MESSAGES, READS, POLLS, PINS, TYPING & SOUND)
========================================================= */

async function subscribeGlobalRealtime() {
    if (!db || !currentUser) return;
    if (globalRealtimeChannel) {
        try { await db.removeChannel(globalRealtimeChannel); } catch {}
        globalRealtimeChannel = null;
    }

    const channel = db.channel(`global:${currentUser.id}:${Date.now()}`);

    channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        payload => {
            const msg = payload?.new;
            if (!msg) return;
            updateSinglePreview(msg);

            if (msg.sender_id === currentUser?.id) return;

            playNotificationTone();

            const convId = String(msg.conversation_id);
            if (String(currentConversation?.id) !== convId) {
                unreadCounts.set(convId, (unreadCounts.get(convId) || 0) + 1);
                renderUnreadBadges();
            }
        }
    );

    channel.subscribe(status => {
        if (status === "SUBSCRIBED") globalRealtimeChannel = channel;
    });
}

async function subscribeRealtime(conversationId) {
    if (!db || !conversationId) return;
    if (activeRealtimeChannel) {
        try { await db.removeChannel(activeRealtimeChannel); } catch {}
        activeRealtimeChannel = null;
    }

    const channel = db.channel(`conversation:${conversationId}`, {
        config: { presence: { key: currentUser.id } }
    });

    channel.on("presence", { event: "sync" }, () => {
        updateTypingIndicatorFromPresence(channel);
    });

    channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async payload => handleRealtimeMessage(payload, conversationId)
    );

    channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        async payload => {
            const rec = payload?.new || payload?.old;
            if (!rec?.message_id) return;
            if (!document.querySelector(`[data-message-id="${cssEscape(rec.message_id)}"]`)) return;
            reactionCache.delete(rec.message_id);
            await refreshRenderedMessage(rec.message_id);
        }
    );

    channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        async payload => {
            const rec = payload?.new || payload?.old;
            if (!rec?.message_id) return;
            if (!document.querySelector(`[data-message-id="${cssEscape(rec.message_id)}"]`)) return;
            await reloadPollVotesForMessage(rec.message_id);
            const msg = currentMessages.find(m => String(m.id) === String(rec.message_id));
            if (msg) await renderMessage(msg, { forceRefresh: true, expectedConversationId: conversationId });
        }
    );

    channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_reads" },
        payload => {
            const rec = payload?.new;
            if (!rec?.message_id || !rec?.user_id) return;
            const key = String(rec.message_id);
            if (!readCache.has(key)) readCache.set(key, new Set());
            readCache.get(key).add(rec.user_id);
            if (rec.user_id !== currentUser?.id) updateMessageTickUI(rec.message_id);
        }
    );

    channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${conversationId}` },
        async payload => {
            const updated = payload?.new;
            if (!updated || String(currentConversation?.id) !== String(updated.id)) return;

            currentConversation.is_locked = Boolean(updated.is_locked);
            applyConversationLockUI(currentConversation.is_locked);

            if (String(currentConversation.pinned_message_id || "") !== String(updated.pinned_message_id || "")) {
                currentConversation.pinned_message_id = updated.pinned_message_id || null;
                await restorePinnedMessage(currentConversation);
            }
        }
    );

    channel.subscribe(async status => {
        if (status === "SUBSCRIBED") {
            activeRealtimeChannel = channel;
            try {
                await channel.track({
                    user_id: currentUser.id,
                    name: currentProfile?.display_name || "عضو",
                    typing: false
                });
            } catch {}
        }
    });
}

async function handleRealtimeMessage(payload, conversationId) {
    if (!currentConversation || !messagesContainer || String(currentConversation.id) !== String(conversationId)) return;

    const newRec = payload?.new;
    const oldRec = payload?.old;
    const msgId = newRec?.id || oldRec?.id;
    if (!msgId) return;

    if (payload.eventType === "INSERT") {
        let message = { ...newRec };
        if (message.reply_to_message_id) {
            const { data: replyMsg } = await db.from("messages").select("*").eq("id", message.reply_to_message_id).maybeSingle();
            message.replyMessage = replyMsg || null;
        }
        if (message.message_type === "poll") pollVotesCache.set(String(message.id), []);

        upsertCurrentMessage(message);
        const shouldScroll = isNearBottom() || message.sender_id === currentUser?.id;
        await renderMessage(message, { expectedConversationId: conversationId });

        if (shouldScroll) scrollMessagesToBottom();
        await markMessagesAsRead([message]);
        return;
    }

    if (payload.eventType === "UPDATE") {
        await refreshRenderedMessage(msgId);
        return;
    }

    if (payload.eventType === "DELETE") {
        currentMessages = currentMessages.filter(m => String(m.id) !== String(msgId));
        document.querySelector(`[data-message-id="${cssEscape(msgId)}"]`)?.remove();
        syncDateDividers();
        if (!messagesContainer.querySelector(".message")) renderEmptyState();
    }
}

/* =========================================================
   PROFILE, STORAGE, AVATARS & FORMATTING HELPERS
========================================================= */

async function getProfile(userId) {
    if (!userId) return null;
    if (profileCache.has(userId)) return profileCache.get(userId);
    if (!db) return null;
    const { data, error } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) return null;
    if (data) profileCache.set(userId, data);
    return data;
}

async function signedUrl(path) {
    if (!db || !path) return null;
    const { data, error } = await db.storage.from("chat-files").createSignedUrl(path, 3600);
    if (error) throw error;
    return data?.signedUrl || null;
}

function getInitial(name) {
    const clean = String(name || "").trim();
    return clean ? clean.charAt(0).toUpperCase() : "؟";
}

function getAvatarColor(seed) {
    const str = String(seed || "user");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function buildStoragePath(folder, fileName) {
    const safeName = String(fileName || "file").replace(/[^\w.\-]+/g, "_").slice(0, 150);
    const userId = currentUser?.id || "anonymous";
    return [folder, userId, `${Date.now()}_${createUniqueId()}_${safeName}`].join("/");
}

function extractFileNameFromPath(path) {
    if (!path) return "ملف";
    const last = String(path).split("/").pop() || "ملف";
    const parts = last.split("_");
    return parts.length >= 3 ? parts.slice(2).join("_") : last;
}

function getFileExtension(fileName) {
    const match = String(fileName || "").match(/\.([a-zA-Z0-9]{1,6})$/);
    return match ? match[1].toLowerCase() : "";
}

function getFileIconClass(ext) {
    if (ext === "pdf") return "ext-pdf";
    if (ext === "doc" || ext === "docx") return "ext-doc";
    if (ext === "ppt" || ext === "pptx") return "ext-ppt";
    if (ext === "xls" || ext === "xlsx") return "ext-xls";
    return "ext-other";
}

function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAudioExtension(mimeType) {
    const type = String(mimeType || "").toLowerCase();
    if (type.includes("ogg")) return "ogg";
    if (type.includes("mp4")) return "m4a";
    if (type.includes("mpeg")) return "mp3";
    return "webm";
}

function getDateKey(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatDateDividerLabel(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const todayKey = getDateKey(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const key = getDateKey(d);
    if (key === todayKey) return "اليوم";
    if (key === getDateKey(yesterday)) return "أمس";

    try {
        return new Intl.DateTimeFormat("ar-DZ", { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch {
        return d.toLocaleDateString();
    }
}

function formatTimeOnly(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    try {
        return new Intl.DateTimeFormat("ar-DZ", { hour: "2-digit", minute: "2-digit" }).format(d);
    } catch {
        return d.toLocaleTimeString();
    }
}

function formatShortTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    if (getDateKey(d) === getDateKey(now)) return formatTimeOnly(d);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (getDateKey(d) === getDateKey(yesterday)) return "أمس";
    try {
        return new Intl.DateTimeFormat("ar-DZ", { day: "2-digit", month: "2-digit" }).format(d);
    } catch {
        return d.toLocaleDateString();
    }
}

function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const isToday = getDateKey(d) === getDateKey(new Date());
    try {
        return new Intl.DateTimeFormat(
            "ar-DZ",
            isToday ? { hour: "2-digit", minute: "2-digit" } : { dateStyle: "short", timeStyle: "short" }
        ).format(d);
    } catch {
        return d.toLocaleString();
    }
}

function setLoginLoading(loading) {
    if (!loginButton) return;
    loginButton.disabled = loading;
    loginButton.textContent = loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول";
}

function setMessageSending(sending) {
    if (sendButton) sendButton.disabled = sending;
}

function showLoginError(message) {
    if (!loginError) return;
    loginError.textContent = message || "";
    loginError.classList.remove("success");
    loginError.classList.add("error");
}

function showLoginSuccess(message) {
    if (!loginError) return;
    loginError.textContent = message || "";
    loginError.classList.remove("error");
    loginError.classList.add("success");
}

function clearLoginError() {
    if (!loginError) return;
    loginError.textContent = "";
    loginError.classList.remove("error", "success");
}

function showChatError(message) {
    if (!messagesContainer) return;
    const el = document.createElement("div");
    el.className = "chat-error";
    el.textContent = message || "";
    messagesContainer.appendChild(el);
    scrollMessagesToBottom();
    setTimeout(() => el.remove(), 5000);
}

function isNearBottom() {
    if (!messagesContainer) return true;
    return messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 150;
}

function scrollMessagesToBottom() {
    if (!messagesContainer) return;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getMessagePreview(message) {
    if (!message) return "";
    if (message.message_type === "image") return message.content || "صورة";
    if (message.message_type === "file") return `📄 ${message.content || extractFileNameFromPath(message.file_path)}`;
    if (message.message_type === "audio") return message.content || "رسالة صوتية";
    if (message.message_type === "poll") return `📊 ${message.poll_data?.question || message.content || "اختبار سريع"}`;
    return message.content || "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function cssEscape(value) {
    const str = String(value ?? "");
    if (window.CSS?.escape) return window.CSS.escape(str);
    return str.replace(/[^a-zA-Z0-9_-]/g, c => `\\${c}`);
}

function createUniqueId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function authMessage(error) {
    const m = String(error?.message || "").toLowerCase();
    if (m.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    if (m.includes("email not confirmed")) return "يجب تأكيد البريد الإلكتروني أولًا.";
    if (m.includes("user not found")) return "المستخدم غير موجود.";
    if (m.includes("password") && m.includes("short")) return "كلمة المرور قصيرة جدًا.";
    if (m.includes("rate limit")) return "تم تجاوز عدد المحاولات. حاول لاحقًا.";
    return error?.message || "حدث خطأ غير متوقع.";
}

/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener("beforeunload", () => {
    try { clearLocalTyping(); } catch {}
    try { recordingStream?.getTracks().forEach(t => t.stop()); } catch {}
    try { if (activeRealtimeChannel && db) db.removeChannel(activeRealtimeChannel); } catch {}
    try { if (globalRealtimeChannel && db) db.removeChannel(globalRealtimeChannel); } catch {}
    try { authSubscription?.unsubscribe?.(); } catch {}
});
