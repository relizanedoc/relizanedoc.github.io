"use strict";

/* =========================================================
   GLOBAL STATE
========================================================= */

let db = null;

let currentUser = null;
let currentProfile = null;
let currentConversation = null;

let conversations = [];
let customers = [];
let currentMessages = [];

const profileCache = new Map();
const reactionCache = new Map();
const readCache = new Map();       // Map<messageId, Set<userId>>
const unreadCounts = new Map();    // Map<conversationId, number>
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

let replyingToMessage = null;
let selectedFile = null;
let selectedTag = "";

let mediaRecorder = null;
let recordingChunks = [];
let recordingStream = null;

let contextMenu = null;

let activeRealtimeChannel = null;
let globalRealtimeChannel = null;
let authSubscription = null;
let messageSyncTimer = null;
let messageSyncInProgress = false;

let initialized = false;
let startingApplicationPromise = null;
let startingApplicationUserId = null;

// حالة نافذة إدارة الأعضاء
let modalConversationId = null;
let modalInitialMemberIds = new Set();
let modalSelectedMemberIds = new Set();
let modalAllStudents = [];

// حالة الأرشيف
let currentArchiveFilter = "file";

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

/* =========================================================
   DOM REFERENCES
========================================================= */

let loginScreen = null;
let loginBox = null;
let loginForm = null;
let app = null;

let emailInput = null;
let passwordInput = null;
let loginButton = null;
let forgotPasswordButton = null;
let loginError = null;
let chatError = null;

let chatAvatar = null;
let conversationTitle = null;
let conversationSubtitle = null;
let customersList = null;
let messagesContainer = null;
let lockedBanner = null;

let messageForm = null;
let messageInput = null;
let sendButton = null;

let fileInput = null;
let fileButton = null;
let filePreview = null;
let recordButton = null;

let spanishToggleButton = null;
let spanishBar = null;
let tagToggleButton = null;
let tagBar = null;

let replyPreview = null;
let replyPreviewSender = null;
let replyPreviewText = null;
let cancelReplyButton = null;

let logoutButton = null;
let groupsSectionTitle = null;
let groupButtons = [];

let archiveButton = null;
let lockChatButton = null;
let manageMembersButton = null;

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

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
    if (initialized) return;
    initialized = true;

    cacheDomElements();

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
    loginScreen = document.getElementById("loginScreen");
    loginBox = document.querySelector(".login-box");
    loginForm = document.getElementById("loginForm");
    app = document.getElementById("app");

    emailInput = document.getElementById("email");
    passwordInput = document.getElementById("password");
    loginButton = document.getElementById("loginButton");
    forgotPasswordButton = document.getElementById("forgotPasswordButton");
    loginError = document.getElementById("loginError");
    chatError = document.getElementById("chatError");

    chatAvatar = document.querySelector(".chat-avatar");
    conversationTitle = document.getElementById("conversationTitle");
    conversationSubtitle = document.getElementById("conversationSubtitle");
    customersList = document.getElementById("customersList");
    messagesContainer = document.getElementById("messages");
    lockedBanner = document.getElementById("lockedBanner");

    messageForm = document.getElementById("messageForm");
    messageInput = document.getElementById("messageInput");
    sendButton = document.querySelector("#messageForm .send-button");

    fileInput = document.getElementById("imageInput");
    fileButton = document.getElementById("imageButton");
    filePreview = document.getElementById("filePreview");
    recordButton = document.getElementById("recordButton");

    spanishToggleButton = document.getElementById("spanishToggleButton");
    spanishBar = document.getElementById("spanishBar");
    tagToggleButton = document.getElementById("tagToggleButton");
    tagBar = document.getElementById("tagBar");

    replyPreview = document.getElementById("replyPreview");
    replyPreviewSender = document.getElementById("replyPreviewSender");
    replyPreviewText = document.getElementById("replyPreviewContent");
    cancelReplyButton = document.getElementById("cancelReplyButton");

    logoutButton = document.getElementById("logoutButton");
    groupsSectionTitle = document.getElementById("groupsSectionTitle");
    groupButtons = Array.from(document.querySelectorAll(".group-button[data-group-key]"));

    archiveButton = document.getElementById("archiveButton");
    lockChatButton = document.getElementById("lockChatButton");
    manageMembersButton = document.getElementById("manageMembersButton");

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
}

function validateRequiredDom() {
    const required = {
        loginScreen,
        app,
        loginForm,
        emailInput,
        passwordInput,
        loginButton,
        loginError,
        messagesContainer,
        messageForm,
        messageInput
    };

    const missing = Object.entries(required)
        .filter(([, el]) => !el)
        .map(([name]) => name);

    if (missing.length > 0) {
        throw new Error(`عناصر HTML مفقودة: ${missing.join(", ")}`);
    }
}

function initializeSupabase() {
    const supabaseApi = window.supabase;
    if (!supabaseApi || typeof supabaseApi.createClient !== "function") {
        throw new Error("لم يتم تحميل مكتبة Supabase.");
    }

    const supabaseUrl = window.SUPABASE_URL;
    const supabaseAnonKey = window.SUPABASE_ANON_KEY;

    if (typeof supabaseUrl !== "string" || !supabaseUrl.trim()) {
        throw new Error("SUPABASE_URL غير موجود في config.js.");
    }

    if (typeof supabaseAnonKey !== "string" || !supabaseAnonKey.trim()) {
        throw new Error("SUPABASE_ANON_KEY غير موجود في config.js.");
    }

    db = supabaseApi.createClient(supabaseUrl.trim(), supabaseAnonKey.trim());
}

/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {
    loginForm?.addEventListener("submit", event => {
        event.preventDefault();
        login();
    });

    forgotPasswordButton?.addEventListener("click", sendPasswordReset);
    messageForm?.addEventListener("submit", sendMessage);

    messageInput?.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (typeof messageForm?.requestSubmit === "function") {
                messageForm.requestSubmit();
            } else {
                sendMessage(event);
            }
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
    logoutButton?.addEventListener("click", logout);

    // شريط الأحرف الإسبانية
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

    // شريط وسوم الأستاذ
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

    // أزرار الأقسام
    groupButtons.forEach(button => {
        button.addEventListener("click", () => {
            openGroupConversation(button.dataset.groupKey);
        });
    });

    // وضع الإعلانات
    lockChatButton?.addEventListener("click", toggleConversationLock);

    // نافذة الأعضاء
    manageMembersButton?.addEventListener("click", openMembersModal);
    membersModalClose?.addEventListener("click", closeMembersModal);
    cancelMembersButton?.addEventListener("click", closeMembersModal);
    saveMembersButton?.addEventListener("click", saveGroupMembers);
    membersSearchInput?.addEventListener("input", renderMembersChecklist);
    membersModal?.addEventListener("click", e => {
        if (e.target === membersModal) closeMembersModal();
    });

    // نافذة الأرشيف
    archiveButton?.addEventListener("click", openArchiveModal);
    archiveModalClose?.addEventListener("click", closeArchiveModal);
    archiveModal?.addEventListener("click", e => {
        if (e.target === archiveModal) closeArchiveModal();
    });
    archiveTabs?.addEventListener("click", event => {
        const tab = event.target.closest(".archive-tab");
        if (!tab) return;
        currentArchiveFilter = tab.dataset.filter || "file";
        archiveTabs.querySelectorAll(".archive-tab").forEach(btn => {
            btn.classList.toggle("active", btn === tab);
        });
        renderArchiveItems();
    });

    document.addEventListener("click", handleDocumentClick);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeContextMenu();
            closeAllReactionPickers();
            closeImageLightbox();
            closeMembersModal();
            closeArchiveModal();
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
                startApplication(session.user).catch(error => {
                    console.error("startApplication error:", error);
                });
            }

            if (event === "SIGNED_OUT") {
                resetApplication();
            }
        }, 0);
    });

    if (authState?.data?.subscription) {
        authSubscription = authState.data.subscription;
    }

    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    if (data?.session?.user && loginBox?.dataset.passwordRecovery !== "true") {
        await startApplication(data.session.user);
    } else {
        window.showLoginScreen();
    }
}

async function login() {
    if (!db) {
        showLoginError("Supabase غير جاهز.");
        return;
    }

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
    if (!db) {
        showLoginError("Supabase غير جاهز.");
        return;
    }

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
        console.error("Password reset error:", error);
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

        if (updateButton) {
            updateButton.disabled = true;
            updateButton.textContent = "جارٍ التحديث...";
        }

        try {
            const { error } = await db.auth.updateUser({ password });
            if (error) throw error;
            delete loginBox.dataset.passwordRecovery;
            await db.auth.signOut();
            window.location.reload();
        } catch (error) {
            console.error("Update password error:", error);
            if (updateError) updateError.textContent = authMessage(error);
            if (updateButton) {
                updateButton.disabled = false;
                updateButton.textContent = "تحديث كلمة المرور";
            }
        }
    };

    updateButton?.addEventListener("click", updatePassword);
    confirmPassword?.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            updatePassword();
        }
    });

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
            if (!profile) {
                throw new Error("لم يتم العثور على ملف المستخدم في جدول profiles.");
            }

            currentUser = user;
            currentProfile = profile;
            profileCache.set(user.id, profile);

            tagToggleButton?.classList.toggle("hidden", profile.role !== "admin");

            window.showAppScreen();

            await loadConversations();
            await loadCustomers();
            await loadUnreadCounts();
            await subscribeGlobalUnread();

            if (currentProfile.role === "customer") {
                const assignedGroup = conversations.find(c => c.type === "group");
                const privateConversation = conversations.find(
                    c => c.type === "private" && c.customer_id === currentUser.id
                );

                if (assignedGroup) {
                    await selectConversation(assignedGroup);
                } else if (privateConversation) {
                    await selectConversation(privateConversation);
                }
            } else {
                await openInitialAdminConversation();
            }
        } catch (error) {
            console.error("Application start error:", error);
            currentUser = null;
            currentProfile = null;
            window.showLoginScreen();
            showLoginError(error?.message || "تعذر تحميل بيانات المستخدم.");
            try { await db.auth.signOut(); } catch (e) { console.error(e); }
        }
    })();

    try {
        await startingApplicationPromise;
    } finally {
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
};

function resetApplication() {
    stopMessageSync();

    currentUser = null;
    currentProfile = null;
    conversations = [];
    customers = [];
    currentMessages = [];

    profileCache.clear();
    reactionCache.clear();
    readCache.clear();
    unreadCounts.clear();
    renderingMessageIds.clear();

    currentConversation = null;
    replyingToMessage = null;
    selectedFile = null;
    setSelectedTag("");

    closeContextMenu();
    closeAllReactionPickers();
    closeImageLightbox();
    closeMembersModal();
    closeArchiveModal();
    cleanupRecording();
    cancelReply();
    clearFilePreview();

    if (activeRealtimeChannel && db) {
        db.removeChannel(activeRealtimeChannel);
        activeRealtimeChannel = null;
    }
    if (globalRealtimeChannel && db) {
        db.removeChannel(globalRealtimeChannel);
        globalRealtimeChannel = null;
    }

    renderEmptyState();

    groupButtons.forEach(btn => {
        btn.classList.add("hidden");
        btn.classList.remove("active");
    });
    groupsSectionTitle?.classList.add("hidden");
    manageMembersButton?.classList.add("hidden");
    lockChatButton?.classList.add("hidden");
    tagToggleButton?.classList.add("hidden");
    tagBar?.classList.add("hidden");
    spanishBar?.classList.add("hidden");
    lockedBanner?.classList.add("hidden");

    if (customersList) customersList.innerHTML = "";
    if (conversationTitle) conversationTitle.textContent = "فضاء الإسبانية";
    if (conversationSubtitle) conversationSubtitle.textContent = "الأستاذ عبد الكريم";
    if (chatAvatar) chatAvatar.textContent = "🎓";

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
    if (error) {
        console.warn("Load unread counts warning:", error);
        return;
    }

    unreadCounts.clear();
    (data || []).forEach(row => {
        const count = Number(row.unread_count) || 0;
        if (count > 0) {
            unreadCounts.set(String(row.conversation_id), count);
        }
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
            let conv = null;

            if (currentProfile?.role === "customer") {
                conv = conversations.find(
                    c => c.type === "private" && c.customer_id === currentUser?.id
                );
            } else {
                conv = conversations.find(
                    c => c.type === "private" && String(c.customer_id) === String(targetId)
                );
            }

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

    if (error) {
        console.warn("Mark read warning:", error);
        return;
    }

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
   CONVERSATIONS & LOCK MODE
========================================================= */

async function loadConversations() {
    if (!db || !currentUser) return;

    const { data, error } = await db
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Load conversations error:", error);
        showChatError(error.message);
        return;
    }

    let loaded = Array.isArray(data) ? data : [];

    if (currentProfile?.role === "customer") {
        const { data: myMemberships, error: memError } = await db
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", currentUser.id);

        if (!memError && Array.isArray(myMemberships)) {
            const memberConvIds = new Set(myMemberships.map(m => String(m.conversation_id)));
            loaded = loaded.filter(conv => {
                if (conv.type === "group") {
                    return memberConvIds.has(String(conv.id));
                }
                return conv.customer_id === currentUser.id || memberConvIds.has(String(conv.id));
            });
        }
    }

    conversations = loaded;

    for (const conversation of conversations) {
        if (conversation.customer_id && !profileCache.has(conversation.customer_id)) {
            await getProfile(conversation.customer_id);
        }
    }

    updateVisibleGroupButtons();
    renderUnreadBadges();
}

function updateVisibleGroupButtons() {
    const isAdmin = currentProfile?.role === "admin";
    const allowedGroupKeys = new Set(
        conversations
            .filter(c => c.type === "group" && c.group_key)
            .map(c => c.group_key)
    );

    let visibleCount = 0;

    groupButtons.forEach(button => {
        const key = button.dataset.groupKey;
        const canSee = isAdmin || allowedGroupKeys.has(key);
        button.classList.toggle("hidden", !canSee);
        if (canSee) visibleCount++;
    });

    if (groupsSectionTitle) {
        groupsSectionTitle.classList.toggle("hidden", visibleCount === 0);
    }
}

function getConversationTitle(conversation) {
    if (!conversation) return "محادثة";

    if (conversation.type === "group") {
        return (
            conversation.title ||
            GROUP_CONFIG[conversation.group_key]?.title ||
            "المجموعة العامة"
        );
    }

    if (conversation.type === "private") {
        if (currentProfile?.role === "customer") {
            const adminName = customersList?.querySelector(".customer-button-name");
            return adminName?.textContent?.trim() || "الأستاذ عبد الكريم";
        }
        if (conversation.customer_id) {
            const customer = profileCache.get(conversation.customer_id);
            return customer?.display_name || "محادثة خاصة";
        }
        return "محادثة خاصة";
    }

    return "محادثة";
}

async function openInitialAdminConversation() {
    if (currentProfile?.role !== "admin") return;

    const preferredGroup =
        conversations.find(c => c.type === "group" && c.group_key === "3as") ||
        conversations.find(c => c.type === "group");

    if (preferredGroup) {
        await selectConversation(preferredGroup);
        return;
    }

    const privateConversation = conversations.find(c => c.type === "private");
    if (privateConversation) {
        await selectConversation(privateConversation);
    }
}

async function selectConversation(conversation) {
    if (!conversation || !conversation.id) return;

    closeContextMenu();
    closeAllReactionPickers();
    removePinnedBanner();
    cancelReply();
    clearFilePreview();
    stopMessageSync();

    currentConversation = { ...conversation };
    currentMessages = [];
    reactionCache.clear();
    readCache.clear();
    renderingMessageIds.clear();

    const groupMeta = GROUP_CONFIG[conversation.group_key];

    if (conversationTitle) {
        conversationTitle.textContent = getConversationTitle(conversation);
    }

    if (conversationSubtitle) {
        conversationSubtitle.textContent =
            conversation.type === "group"
                ? (groupMeta?.subtitle || "المحادثة الجماعية")
                : "محادثة خاصة";
    }

    if (chatAvatar) {
        chatAvatar.textContent =
            conversation.type === "group" ? (groupMeta?.icon || "👥") : "👤";
    }

    const isAdminGroup =
        currentProfile?.role === "admin" && conversation.type === "group";

    manageMembersButton?.classList.toggle("hidden", !isAdminGroup);
    lockChatButton?.classList.toggle("hidden", !isAdminGroup);

    applyConversationLockUI(Boolean(conversation.is_locked));
    updateSidebarActiveState(conversation);

    if (activeRealtimeChannel && db) {
        try { await db.removeChannel(activeRealtimeChannel); } catch (e) { console.warn(e); }
        activeRealtimeChannel = null;
    }

    await loadMessages();

    if (String(currentConversation?.id) === String(conversation.id)) {
        await subscribeRealtime(conversation.id);
        startMessageSync(conversation.id);
    }
}

function applyConversationLockUI(isLocked) {
    const isAdmin = currentProfile?.role === "admin";
    const isGroup = currentConversation?.type === "group";

    if (lockChatButton && isAdmin && isGroup) {
        lockChatButton.classList.toggle("locked", isLocked);
        lockChatButton.title = isLocked
            ? "فتح المحادثة للتلاميذ"
            : "قفل المحادثة (وضع الإعلانات)";
        const label = lockChatButton.querySelector("span");
        if (label) {
            label.textContent = isLocked ? "فتح القسم" : "وضع الإعلانات";
        }
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
    if (
        !db ||
        currentProfile?.role !== "admin" ||
        !currentConversation ||
        currentConversation.type !== "group"
    ) {
        return;
    }

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
        console.error("Toggle lock error:", error);
        showChatError(error.message || "تعذر تغيير حالة قفل القسم.");
    } finally {
        if (lockChatButton) lockChatButton.disabled = false;
    }
}

function updateSidebarActiveState(conversation) {
    const isGroup = conversation?.type === "group";

    groupButtons.forEach(button => {
        const isCurrentGroup =
            isGroup && button.dataset.groupKey === conversation?.group_key;
        button.classList.toggle("active", isCurrentGroup);
    });

    if (customersList) {
        customersList.querySelectorAll(".customer-button").forEach(button => {
            if (isGroup) {
                button.classList.remove("active");
            } else if (currentProfile?.role === "customer") {
                button.classList.add("active");
            } else {
                button.classList.toggle(
                    "active",
                    button.dataset.customerId === String(conversation?.customer_id)
                );
            }
        });
    }
}

async function openPrivateConversation(customer) {
    if (!db || !currentUser || !customer) return;
    if (customer.role && customer.role !== "customer") return;

    const customerId = customer.id;

    const { data: privateConversations, error } = await db
        .from("conversations")
        .select("*")
        .eq("type", "private")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1);

    if (error) {
        showChatError(error.message);
        return;
    }

    let conversation = privateConversations?.[0] || null;

    if (!conversation) {
        if (currentProfile?.role !== "admin") {
            showChatError("المحادثة الخاصة غير موجودة.");
            return;
        }

        const result = await db
            .from("conversations")
            .insert({ type: "private", customer_id: customerId })
            .select("*")
            .single();

        if (result.error) {
            showChatError(result.error.message);
            return;
        }

        conversation = result.data;
        conversations.push(conversation);
    }

    if (currentProfile?.role === "admin") {
        const { data: existingMembers } = await db
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", conversation.id)
            .in("user_id", [currentUser.id, customerId]);

        const existingIds = new Set((existingMembers || []).map(m => m.user_id));
        const missingMembers = [currentUser.id, customerId]
            .filter(uid => !existingIds.has(uid))
            .map(uid => ({ conversation_id: conversation.id, user_id: uid }));

        if (missingMembers.length > 0) {
            await db.from("conversation_members").insert(missingMembers);
        }
    }

    profileCache.set(customerId, customer);
    await selectConversation(conversation);
}

async function openCustomerPrivateConversation() {
    if (!currentUser || currentProfile?.role !== "customer") return;

    const conversation = conversations.find(
        c => c.type === "private" && c.customer_id === currentUser.id
    );

    if (!conversation) {
        showChatError("المحادثة الخاصة غير موجودة.");
        return;
    }

    await selectConversation(conversation);
}

async function openGroupConversation(groupKey) {
    if (!db || !currentUser || typeof groupKey !== "string" || !groupKey) return;

    let group = conversations.find(c => c.type === "group" && c.group_key === groupKey);

    if (!group) {
        const { data: groups, error } = await db
            .from("conversations")
            .select("*")
            .eq("type", "group")
            .eq("group_key", groupKey)
            .limit(1);

        if (error) {
            showChatError(error.message);
            return;
        }
        group = groups?.[0] || null;
    }

    if (!group) {
        if (currentProfile?.role !== "admin") {
            showChatError("لست مسجلًا في هذا القسم.");
            return;
        }

        const result = await db
            .from("conversations")
            .insert({
                type: "group",
                group_key: groupKey,
                title: GROUP_CONFIG[groupKey]?.title || "مجموعة عامة"
            })
            .select("*")
            .single();

        if (result.error) {
            showChatError(result.error.message);
            return;
        }

        group = result.data;
        await db.from("conversation_members").insert({
            conversation_id: group.id,
            user_id: currentUser.id
        });
    }

    if (!conversations.some(c => String(c.id) === String(group.id))) {
        conversations.push(group);
        updateVisibleGroupButtons();
    }

    await selectConversation(group);
}

/* =========================================================
   MANAGE GROUP MEMBERS MODAL (ADMIN)
========================================================= */

async function openMembersModal() {
    if (
        !db ||
        !membersModal ||
        currentProfile?.role !== "admin" ||
        currentConversation?.type !== "group"
    ) {
        return;
    }

    modalConversationId = currentConversation.id;
    modalInitialMemberIds = new Set();
    modalSelectedMemberIds = new Set();
    modalAllStudents = [];

    if (membersModalTitle) {
        membersModalTitle.textContent = `أعضاء ${getConversationTitle(currentConversation)}`;
    }
    if (membersSearchInput) membersSearchInput.value = "";

    hideMembersModalMessage();
    membersModal.classList.remove("hidden");

    if (membersChecklist) {
        membersChecklist.innerHTML = `<div class="members-empty">جارٍ تحميل قائمة التلاميذ...</div>`;
    }
    if (saveMembersButton) saveMembersButton.disabled = true;

    try {
        const [studentsRes, membersRes] = await Promise.all([
            db
                .from("profiles")
                .select("id, display_name, role")
                .eq("role", "customer")
                .order("display_name", { ascending: true }),
            db
                .from("conversation_members")
                .select("user_id")
                .eq("conversation_id", modalConversationId)
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (membersRes.error) throw membersRes.error;

        modalAllStudents = Array.isArray(studentsRes.data) ? studentsRes.data : [];
        const currentMemberSet = new Set((membersRes.data || []).map(r => r.user_id));

        modalAllStudents.forEach(student => {
            if (currentMemberSet.has(student.id)) {
                modalInitialMemberIds.add(student.id);
                modalSelectedMemberIds.add(student.id);
            }
        });

        renderMembersChecklist();
        if (saveMembersButton) saveMembersButton.disabled = false;
    } catch (error) {
        console.error("Load group members error:", error);
        if (membersChecklist) {
            membersChecklist.innerHTML = `<div class="members-empty">تعذر تحميل الأعضاء.</div>`;
        }
        showMembersModalMessage(error?.message || "حدث خطأ أثناء تحميل الأعضاء.", "error");
    }
}

function renderMembersChecklist() {
    if (!membersChecklist) return;

    const query = (membersSearchInput?.value || "").trim().toLowerCase();
    const filtered = modalAllStudents.filter(s =>
        (s.display_name || "تلميذ").toLowerCase().includes(query)
    );

    if (membersCount) {
        membersCount.textContent = `${modalSelectedMemberIds.size} محدد`;
    }

    if (filtered.length === 0) {
        membersChecklist.innerHTML = `<div class="members-empty">لا يوجد تلاميذ مطابقون للبحث.</div>`;
        return;
    }

    membersChecklist.innerHTML = "";

    for (const student of filtered) {
        const label = document.createElement("label");
        label.className = "member-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = modalSelectedMemberIds.has(student.id);
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) modalSelectedMemberIds.add(student.id);
            else modalSelectedMemberIds.delete(student.id);
            if (membersCount) membersCount.textContent = `${modalSelectedMemberIds.size} محدد`;
        });

        const nameSpan = document.createElement("span");
        nameSpan.className = "member-row-name";
        nameSpan.textContent = student.display_name || "تلميذ";

        label.appendChild(checkbox);
        label.appendChild(nameSpan);
        membersChecklist.appendChild(label);
    }
}

async function saveGroupMembers() {
    if (!db || !modalConversationId || currentProfile?.role !== "admin") return;

    const toAdd = [];
    const toRemove = [];

    for (const uid of modalSelectedMemberIds) {
        if (!modalInitialMemberIds.has(uid)) {
            toAdd.push({ conversation_id: modalConversationId, user_id: uid });
        }
    }
    for (const uid of modalInitialMemberIds) {
        if (!modalSelectedMemberIds.has(uid)) toRemove.push(uid);
    }

    if (toAdd.length === 0 && toRemove.length === 0) {
        closeMembersModal();
        return;
    }

    if (saveMembersButton) {
        saveMembersButton.disabled = true;
        saveMembersButton.textContent = "جارٍ الحفظ...";
    }
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
        console.error("Save group members error:", error);
        showMembersModalMessage(error?.message || "تعذر حفظ التغييرات.", "error");
    } finally {
        if (saveMembersButton) {
            saveMembersButton.disabled = false;
            saveMembersButton.textContent = "حفظ التغييرات";
        }
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
   SECTION ARCHIVE MODAL
========================================================= */

function openArchiveModal() {
    if (!archiveModal || !currentConversation) return;
    if (archiveModalTitle) {
        archiveModalTitle.textContent = `أرشيف ${getConversationTitle(currentConversation)}`;
    }
    archiveModal.classList.remove("hidden");
    renderArchiveItems();
}

function closeArchiveModal() {
    archiveModal?.classList.add("hidden");
}

async function renderArchiveItems() {
    if (!archiveList) return;

    const filtered = currentMessages.filter(m => {
        if (currentArchiveFilter === "file") return m.message_type === "file";
        if (currentArchiveFilter === "image") return m.message_type === "image";
        if (currentArchiveFilter === "audio") return m.message_type === "audio";
        if (currentArchiveFilter === "tagged") return Boolean(m.tag && MESSAGE_TAGS[m.tag]);
        return true;
    }).slice().reverse();

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

        const tagPrefix = msg.tag && MESSAGE_TAGS[msg.tag]
            ? `${MESSAGE_TAGS[msg.tag].label} · `
            : "";

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
                    if (msg.message_type === "image") {
                        openImageLightbox(url, title);
                    } else {
                        window.open(url, "_blank", "noopener");
                    }
                } catch (e) {
                    console.error(e);
                }
            });
            actions.appendChild(openBtn);
        }

        const jumpBtn = document.createElement("button");
        jumpBtn.type = "button";
        jumpBtn.className = "archive-btn";
        jumpBtn.textContent = "الرسالة";
        jumpBtn.addEventListener("click", () => {
            closeArchiveModal();
            scrollToMessage(msg.id);
        });
        actions.appendChild(jumpBtn);

        archiveList.appendChild(item);
    }
}

/* =========================================================
   CUSTOMERS LIST
========================================================= */

async function loadCustomers() {
    if (!db || !customersList) return;
    customersList.innerHTML = "";

    if (currentProfile?.role === "admin") {
        const { data, error } = await db
            .from("profiles")
            .select("*")
            .eq("role", "customer")
            .order("display_name", { ascending: true });

        if (error) {
            showChatError(error.message);
            return;
        }

        customers = Array.isArray(data) ? data : [];

        for (const customer of customers) {
            profileCache.set(customer.id, customer);

            const button = document.createElement("button");
            button.type = "button";
            button.className = "customer-button";
            button.dataset.customerId = String(customer.id);
            button.innerHTML = `
                <span class="customer-button-name">${escapeHtml(customer.display_name || "تلميذ")}</span>
                <span class="unread-badge hidden">0</span>
            `;
            button.addEventListener("click", () => openPrivateConversation(customer));
            customersList.appendChild(button);
        }
        renderUnreadBadges();
        return;
    }

    if (currentProfile?.role === "customer") {
        const privateConversation = conversations.find(
            c => c.type === "private" && c.customer_id === currentUser.id
        );
        if (!privateConversation) return;

        const { data: members, error: membersError } = await db
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", privateConversation.id);

        if (membersError) return;

        const adminMember = (members || []).find(m => m.user_id !== currentUser.id);
        if (!adminMember) return;

        const { data: adminProfile, error: adminError } = await db
            .from("profiles")
            .select("*")
            .eq("id", adminMember.user_id)
            .maybeSingle();

        if (adminError || !adminProfile) return;

        profileCache.set(adminProfile.id, adminProfile);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "customer-button";
        button.dataset.customerId = String(adminProfile.id);
        button.innerHTML = `
            <span class="customer-button-name">${escapeHtml(adminProfile.display_name || "الأستاذ عبد الكريم")}</span>
            <span class="unread-badge hidden">0</span>
        `;
        button.addEventListener("click", openCustomerPrivateConversation);
        customersList.appendChild(button);
        renderUnreadBadges();
    }
}

/* =========================================================
   MESSAGES & BATCH PRELOADING
========================================================= */

async function loadMessages() {
    if (!db || !currentConversation || !messagesContainer) return;

    const conversationId = currentConversation.id;
    messagesContainer.innerHTML = "";
    reactionCache.clear();
    readCache.clear();
    renderingMessageIds.clear();

    const { data, error } = await db
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Load messages error:", error);
        showChatError(error.message);
        return;
    }

    if (String(currentConversation?.id) !== String(conversationId)) return;

    const messages = Array.isArray(data) ? data : [];
    currentMessages = messages;

    if (messages.length === 0) {
        renderEmptyState();
        removePinnedBanner();
        unreadCounts.delete(String(conversationId));
        renderUnreadBadges();
        return;
    }

    await Promise.all([
        loadReplyMessages(messages),
        preloadReactions(messages),
        preloadReads(messages)
    ]);

    if (String(currentConversation?.id) !== String(conversationId)) return;

    for (const message of messages) {
        if (String(currentConversation?.id) !== String(conversationId)) return;
        await renderMessage(message, { expectedConversationId: conversationId });
    }

    await restorePinnedMessage(messages);
    scrollMessagesToBottom();
    await markMessagesAsRead(messages);
}

async function preloadReactions(messages) {
    const ids = messages.map(m => m.id).filter(Boolean);
    if (ids.length === 0) return;

    const { data, error } = await db
        .from("message_reactions")
        .select("*")
        .in("message_id", ids);

    if (error) return;

    ids.forEach(id => reactionCache.set(id, []));
    (data || []).forEach(row => {
        if (!reactionCache.has(row.message_id)) reactionCache.set(row.message_id, []);
        reactionCache.get(row.message_id).push(row);
    });
}

async function preloadReads(messages) {
    const ids = messages.map(m => m.id).filter(Boolean);
    if (ids.length === 0) return;

    const { data, error } = await db
        .from("message_reads")
        .select("message_id, user_id")
        .in("message_id", ids);

    if (error) return;

    (data || []).forEach(row => {
        const key = String(row.message_id);
        if (!readCache.has(key)) readCache.set(key, new Set());
        readCache.get(key).add(row.user_id);
    });
}

function stopMessageSync() {
    if (messageSyncTimer) {
        clearInterval(messageSyncTimer);
        messageSyncTimer = null;
    }
    messageSyncInProgress = false;
}

function startMessageSync(conversationId) {
    stopMessageSync();
    if (!conversationId) return;

    messageSyncTimer = setInterval(async () => {
        if (
            messageSyncInProgress ||
            !currentConversation ||
            String(currentConversation.id) !== String(conversationId)
        ) {
            return;
        }

        messageSyncInProgress = true;

        try {
            const { data, error } = await db
                .from("messages")
                .select("*")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true });

            if (error || String(currentConversation?.id) !== String(conversationId)) return;

            const newMessages = (data || []).filter(msg => {
                const msgId = String(msg.id);
                if (renderingMessageIds.has(msgId)) return false;
                return !messagesContainer.querySelector(
                    `[data-message-id="${cssEscape(msgId)}"]`
                );
            });

            if (newMessages.length > 0) {
                const shouldScroll = isNearBottom();
                await loadReplyMessages(newMessages);

                for (const msg of newMessages) {
                    if (String(currentConversation?.id) !== String(conversationId)) break;
                    upsertCurrentMessage(msg);
                    await renderMessage(msg, { expectedConversationId: conversationId });
                }

                if (shouldScroll || newMessages.some(m => m.sender_id === currentUser?.id)) {
                    scrollMessagesToBottom();
                }

                await markMessagesAsRead(newMessages);
            }
        } catch (error) {
            console.error("Message sync error:", error);
        } finally {
            messageSyncInProgress = false;
        }
    }, 5000);
}

function upsertCurrentMessage(msg) {
    const idx = currentMessages.findIndex(m => String(m.id) === String(msg.id));
    if (idx === -1) currentMessages.push(msg);
    else currentMessages[idx] = msg;
}

async function loadReplyMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return;

    const replyIds = messages.map(m => m.reply_to_message_id).filter(Boolean);
    if (replyIds.length === 0) return;

    const uniqueIds = [...new Set(replyIds)];
    const { data, error } = await db.from("messages").select("*").in("id", uniqueIds);
    if (error) return;

    const replyMap = new Map((data || []).map(m => [m.id, m]));
    for (const message of messages) {
        if (message.reply_to_message_id) {
            message.replyMessage = replyMap.get(message.reply_to_message_id) || null;
        }
    }
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

    if (expectedConversationId && String(currentConversation?.id) !== expectedConversationId) {
        return;
    }

    if (!options.forceRefresh) {
        if (renderingMessageIds.has(messageId)) return;
        const alreadyRendered = messagesContainer.querySelector(
            `[data-message-id="${cssEscape(messageId)}"]`
        );
        if (alreadyRendered) return;
    }

    renderingMessageIds.add(messageId);

    try {
        const wrapper = document.createElement("div");
        wrapper.className = "message";
        wrapper.dataset.messageId = messageId;

        const isMine = message.sender_id === currentUser?.id;
        if (isMine) wrapper.classList.add("own");

        const sender = await getProfile(message.sender_id);
        const senderName = sender?.display_name || "مستخدم";

        const messageBubble = document.createElement("div");
        messageBubble.className = "message-bubble";

        // وسم الرسالة التعليمية
        if (message.tag && MESSAGE_TAGS[message.tag]) {
            const tagInfo = MESSAGE_TAGS[message.tag];
            const badge = document.createElement("div");
            badge.className = `message-tag-badge ${tagInfo.className}`;
            badge.textContent = tagInfo.label;
            messageBubble.appendChild(badge);
        }

        // الرد المقتبس
        if (message.replyMessage) {
            const replyBox = document.createElement("div");
            replyBox.className = "message-reply";

            const replySender = await getProfile(message.replyMessage.sender_id);
            const replySenderName = replySender?.display_name || "مستخدم";
            const replyContent = getMessagePreview(message.replyMessage);

            replyBox.innerHTML = `
                <div class="reply-sender">${escapeHtml(replySenderName)}</div>
                <div class="reply-content">${escapeHtml(replyContent)}</div>
            `;

            replyBox.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                scrollToMessage(message.replyMessage.id);
            });

            messageBubble.appendChild(replyBox);
        }

        // اسم المرسل
        const senderElement = document.createElement("div");
        senderElement.className = "message-sender";
        senderElement.textContent = senderName;

        if (currentProfile?.role === "admin" && sender?.role === "customer" && !isMine) {
            senderElement.classList.add("clickable");
            senderElement.title = "فتح محادثة خاصة";
            senderElement.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                openPrivateConversation(sender);
            });
        }

        messageBubble.appendChild(senderElement);

        // المحتوى
        const content = document.createElement("div");
        content.className = "message-content";

        if (message.message_type === "image") {
            const image = document.createElement("img");
            image.className = "message-image";
            image.alt = message.content || "صورة";
            image.loading = "lazy";

            try {
                const url = await signedUrl(message.file_path);
                if (url) {
                    image.src = url;
                    image.addEventListener("click", event => {
                        event.preventDefault();
                        event.stopPropagation();
                        openImageLightbox(url, image.alt);
                    });
                }
            } catch (error) {
                console.error("Image URL error:", error);
            }

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
            const extClass = getFileIconClass(ext);
            const hasCustomCaption =
                message.content && message.content.trim() !== fileName.trim();

            const card = document.createElement("a");
            card.className = "message-file-card";
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.download = fileName;

            card.innerHTML = `
                <div class="file-card-icon ${extClass}">${escapeHtml(ext.toUpperCase() || "FILE")}</div>
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
            } catch (error) {
                console.error("File URL error:", error);
            }

            card.addEventListener("click", e => e.stopPropagation());
            content.appendChild(card);

            if (hasCustomCaption) {
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
            } catch (error) {
                console.error("Audio URL error:", error);
            }

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

        messageBubble.appendChild(content);

        // التوقيت وعلامتا القراءة
        const footer = document.createElement("div");
        footer.className = "message-footer";

        const date = document.createElement("span");
        date.className = "message-date";
        date.textContent = formatDate(message.created_at);
        footer.appendChild(date);

        if (isMine) {
            const readByOthers = isMessageReadByOthers(message);
            const ticks = document.createElement("span");
            ticks.className = `message-ticks${readByOthers ? " read" : ""}`;
            ticks.title = readByOthers ? "تمت القراءة" : "تم التسليم";
            ticks.textContent = "✓✓";
            footer.appendChild(ticks);
        }

        messageBubble.appendChild(footer);

        // التفاعلات
        const reactions = document.createElement("div");
        reactions.className = "message-reactions";
        await renderReactionSummary(message, reactions);
        messageBubble.appendChild(reactions);

        messageBubble.addEventListener("click", event => {
            if (
                event.target.closest(".reaction-trigger") ||
                event.target.closest(".reaction-summary") ||
                event.target.closest(".reaction-picker") ||
                event.target.closest(".message-sender") ||
                event.target.closest(".message-reply") ||
                event.target.closest(".message-file-card") ||
                event.target.closest("audio") ||
                event.target.closest("img")
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            openMessageMenu(message, event.clientX, event.clientY);
        });

        messageBubble.addEventListener("contextmenu", event => {
            event.preventDefault();
            event.stopPropagation();
            openMessageMenu(message, event.clientX, event.clientY);
        });

        wrapper.appendChild(messageBubble);

        if (expectedConversationId && String(currentConversation?.id) !== expectedConversationId) {
            return;
        }

        messagesContainer.querySelector(".empty-messages")?.remove();

        const currentExisting = messagesContainer.querySelector(
            `[data-message-id="${cssEscape(messageId)}"]`
        );

        if (currentExisting) {
            currentExisting.replaceWith(wrapper);
        } else {
            messagesContainer.appendChild(wrapper);
        }
    } finally {
        renderingMessageIds.delete(messageId);
    }
}

/* =========================================================
   LIGHTBOX & MESSAGE MENU
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
    const canDelete = isMine || currentProfile?.role === "admin";
    const pinned = isPinnedMessage(message);

    contextMenu.innerHTML = `
        <button type="button" data-action="copy">نسخ</button>
        <button type="button" data-action="reply">رد</button>
        <button type="button" data-action="reaction">تفاعل</button>
        <button type="button" data-action="pin">${pinned ? "فك التثبيت" : "تثبيت الرسالة"}</button>
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
    contextMenu.querySelector('[data-action="pin"]')?.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation(); closeContextMenu();
        if (isPinnedMessage(message)) unpinMessage(currentConversation?.id);
        else pinMessage(message);
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
    if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
    }
}

/* =========================================================
   COPY / DELETE / REPLY
========================================================= */

async function copyMessage(message) {
    const text = getMessagePreview(message);
    if (!text) return;
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
        }
    } catch (e) { console.error(e); }
}

async function deleteMessage(message) {
    if (!db || !message?.id) return;
    const isMine = message.sender_id === currentUser?.id;
    const isAdmin = currentProfile?.role === "admin";
    if (!isMine && !isAdmin) return;

    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;

    const { error } = await db.from("messages").delete().eq("id", message.id);
    if (error) {
        showChatError(error.message);
        return;
    }

    if (isPinnedMessage(message)) unpinMessage(currentConversation?.id);
    currentMessages = currentMessages.filter(m => String(m.id) !== String(message.id));
    document.querySelector(`[data-message-id="${cssEscape(message.id)}"]`)?.remove();

    if (messagesContainer && !messagesContainer.querySelector(".message")) {
        renderEmptyState();
    }
}

async function startReply(message) {
    if (!message) return;
    replyingToMessage = message;
    replyPreview?.classList.remove("hidden");

    const sender = await getProfile(message.sender_id);
    const senderName = sender?.display_name || "مستخدم";

    if (replyPreviewSender) replyPreviewSender.textContent = `الرد على ${senderName}`;
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
   SEND MESSAGE & FILE / IMAGE UPLOAD
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

    if (selectedFile) {
        const file = selectedFile;
        selectedFile = null;
        clearFilePreview();
        await uploadAttachment(file, text);
        return;
    }

    if (!text) return;

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

        const { data: inserted, error } = await db
            .from("messages")
            .insert(payload)
            .select("*")
            .single();

        if (error) throw error;

        if (messageInput) messageInput.value = "";
        const replyBackup = replyingToMessage;
        cancelReply();
        setSelectedTag("");

        if (inserted) {
            if (replyBackup) inserted.replyMessage = replyBackup;
            upsertCurrentMessage(inserted);
            await renderMessage(inserted, { expectedConversationId: currentConversation.id });
            scrollMessagesToBottom();
        }
    } catch (error) {
        console.error("Send message error:", error);
        showChatError(error.message);
    } finally {
        setMessageSending(false);
    }
}

function handleFileSelection(event) {
    const file = event.target?.files?.[0];
    if (!file) {
        selectedFile = null;
        clearFilePreview();
        return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
        showChatError("حجم الملف يجب ألا يتجاوز 20MB.");
        clearFilePreview();
        return;
    }

    selectedFile = file;
    showFilePreview(file);
}

function showFilePreview(file) {
    if (!filePreview) return;
    const isImage = file.type.startsWith("image/");
    const icon = isImage ? "🖼️" : "📄";
    const sizeLabel = formatFileSize(file.size);

    filePreview.innerHTML = `
        <div class="file-preview-item">
            <span>${icon} ${escapeHtml(file.name)} (${sizeLabel})</span>
            <button type="button" id="clear-file-preview">×</button>
        </div>
    `;

    filePreview.classList.remove("hidden");
    filePreview.querySelector("#clear-file-preview")?.addEventListener("click", clearFilePreview);
}

function clearFilePreview() {
    selectedFile = null;
    if (fileInput) fileInput.value = "";
    if (filePreview) {
        filePreview.innerHTML = "";
        filePreview.classList.add("hidden");
    }
}

async function uploadAttachment(file, caption = "") {
    if (!db || !currentUser || !currentConversation || !file) return;

    setMessageSending(true);
    const isImage = file.type.startsWith("image/");
    const folder = isImage ? "images" : "files";
    const messageType = isImage ? "image" : "file";
    const path = buildStoragePath(folder, file.name);
    const targetConversationId = currentConversation.id;

    try {
        const { error: uploadError } = await db.storage
            .from("chat-files")
            .upload(path, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type || "application/octet-stream"
            });

        if (uploadError) throw uploadError;

        const payload = {
            conversation_id: targetConversationId,
            sender_id: currentUser.id,
            content: caption || file.name,
            message_type: messageType,
            file_path: path
        };

        if (replyingToMessage?.id) payload.reply_to_message_id = replyingToMessage.id;
        if (currentProfile?.role === "admin" && selectedTag) payload.tag = selectedTag;

        const { data: inserted, error: insertError } = await db
            .from("messages")
            .insert(payload)
            .select("*")
            .single();

        if (insertError) {
            await db.storage.from("chat-files").remove([path]).catch(console.warn);
            throw insertError;
        }

        if (messageInput) messageInput.value = "";
        const replyBackup = replyingToMessage;
        cancelReply();
        setSelectedTag("");

        if (inserted) {
            if (replyBackup) inserted.replyMessage = replyBackup;
            upsertCurrentMessage(inserted);
            await renderMessage(inserted, { expectedConversationId: targetConversationId });
            scrollMessagesToBottom();
        }
    } catch (error) {
        console.error("Upload attachment error:", error);
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

        mediaRecorder.ondataavailable = e => {
            if (e.data && e.data.size > 0) recordingChunks.push(e.data);
        };

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

        mediaRecorder.onerror = () => {
            showChatError("حدث خطأ أثناء تسجيل الصوت.");
            cleanupRecording();
        };

        mediaRecorder.start();
        updateRecordButton(true);
    } catch (error) {
        cleanupRecording();
        showChatError(
            error?.name === "NotAllowedError"
                ? "تم رفض صلاحية الميكروفون."
                : "تعذر تشغيل تسجيل الصوت."
        );
    }
}

function stopRecording() {
    if (!mediaRecorder) return;
    try { mediaRecorder.stop(); } catch { cleanupRecording(); }
}

function cleanupRecording() {
    try {
        if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    } catch {}
    mediaRecorder = null;
    recordingChunks = [];
    recordingStream?.getTracks().forEach(t => { try { t.stop(); } catch {} });
    recordingStream = null;
    updateRecordButton(false);
}

async function uploadAudio(blob, conversationId, userId, replyId = null, tag = "") {
    if (!db || !blob || !conversationId || !userId) return;

    setMessageSending(true);
    const ext = getAudioExtension(blob.type);
    const path = buildStoragePath("audio", `recording.${ext}`);

    try {
        const { error: uploadError } = await db.storage
            .from("chat-files")
            .upload(path, blob, {
                cacheControl: "3600",
                upsert: false,
                contentType: blob.type || "audio/webm"
            });

        if (uploadError) throw uploadError;

        const payload = {
            conversation_id: conversationId,
            sender_id: userId,
            content: "رسالة صوتية",
            message_type: "audio",
            file_path: path
        };

        if (replyId) payload.reply_to_message_id = replyId;
        if (tag) payload.tag = tag;

        const { data: inserted, error: insertError } = await db
            .from("messages")
            .insert(payload)
            .select("*")
            .single();

        if (insertError) {
            await db.storage.from("chat-files").remove([path]).catch(console.warn);
            throw insertError;
        }

        if (String(conversationId) === String(currentConversation?.id)) {
            cancelReply();
            setSelectedTag("");
            if (inserted) {
                upsertCurrentMessage(inserted);
                await renderMessage(inserted, { expectedConversationId: conversationId });
                scrollMessagesToBottom();
            }
        }
    } catch (error) {
        console.error("Upload audio error:", error);
        showChatError(error.message);
    } finally {
        setMessageSending(false);
    }
}

function updateRecordButton(recording) {
    if (!recordButton) return;
    recordButton.classList.toggle("recording", recording);
    recordButton.setAttribute("aria-label", recording ? "إيقاف التسجيل" : "تسجيل صوتي");
    recordButton.title = recording ? "إيقاف التسجيل" : "تسجيل صوتي";
    recordButton.innerHTML = recording ? STOP_SVG : MIC_SVG;
}

/* =========================================================
   REACTIONS (WITH NAMES TOOLTIP)
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
        button.dataset.reaction = reaction;
        button.title = names.join("، ");
        button.textContent = `${reaction} ${userIds.length}`;
        button.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            await toggleReaction(message, reaction);
        });
        container.appendChild(button);
    }

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "reaction-trigger";
    addButton.title = "إضافة تفاعل";
    addButton.setAttribute("aria-label", "إضافة تفاعل");
    addButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
    `;
    addButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        showReactionPicker(message, addButton);
    });
    container.appendChild(addButton);
}

async function loadReactions(messageId) {
    if (reactionCache.has(messageId)) return reactionCache.get(messageId);

    const { data, error } = await db
        .from("message_reactions")
        .select("*")
        .eq("message_id", messageId);

    const reactions = !error && Array.isArray(data) ? data : [];
    reactionCache.set(messageId, reactions);
    return reactions;
}

function showReactionPicker(message, anchor) {
    closeAllReactionPickers();

    const picker = document.createElement("div");
    picker.className = "reaction-picker";

    for (const reaction of REACTIONS) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "reaction-option";
        button.textContent = reaction;
        button.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();
            picker.remove();
            await toggleReaction(message, reaction);
        });
        picker.appendChild(button);
    }

    document.body.appendChild(picker);

    const rect = anchor.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom + 5;

    if (left + pickerRect.width > window.innerWidth) left = window.innerWidth - pickerRect.width - 8;
    if (top + pickerRect.height > window.innerHeight) top = rect.top - pickerRect.height - 5;

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
        const { data: existing, error: findError } = await db
            .from("message_reactions")
            .select("id,reaction")
            .eq("message_id", message.id)
            .eq("user_id", currentUser.id)
            .limit(1)
            .maybeSingle();

        if (findError) throw findError;

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
                message_id: message.id,
                user_id: currentUser.id,
                reaction
            });
            if (error) throw error;
        }

        reactionCache.delete(message.id);
        await refreshRenderedMessage(message.id);
    } catch (error) {
        console.error("Toggle reaction error:", error);
        showChatError(error.message);
    }
}

async function refreshRenderedMessage(messageId) {
    if (!currentConversation || !messagesContainer || !db) return;

    const { data: message, error } = await db
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .maybeSingle();

    if (error || !message) return;

    if (message.reply_to_message_id) {
        const { data: replyMessage } = await db
            .from("messages")
            .select("*")
            .eq("id", message.reply_to_message_id)
            .maybeSingle();
        message.replyMessage = replyMessage || null;
    }

    upsertCurrentMessage(message);
    await renderMessage(message, {
        forceRefresh: true,
        expectedConversationId: currentConversation.id
    });
}

/* =========================================================
   PINNED MESSAGES
========================================================= */

function getPinnedStorageKey(conversationId) { return `pinned_message_${conversationId}`; }

function getPinnedMessage(conversationId) {
    if (!conversationId) return null;
    try {
        const value = localStorage.getItem(getPinnedStorageKey(conversationId));
        return value ? JSON.parse(value) : null;
    } catch { return null; }
}

function savePinnedMessage(conversationId, message) {
    if (!conversationId || !message) return;
    try { localStorage.setItem(getPinnedStorageKey(conversationId), JSON.stringify(message)); } catch {}
}

function removePinnedStorage(conversationId) {
    if (!conversationId) return;
    try { localStorage.removeItem(getPinnedStorageKey(conversationId)); } catch {}
}

function isPinnedMessage(message) {
    if (!currentConversation || !message) return false;
    return String(getPinnedMessage(currentConversation.id)?.id) === String(message.id);
}

function pinMessage(message, isRestoring = false) {
    if (!currentConversation || !message) return;
    savePinnedMessage(currentConversation.id, message);
    renderPinnedBanner(message);
    if (!isRestoring) scrollToMessage(message.id);
}

function unpinMessage(conversationId = currentConversation?.id) {
    removePinnedStorage(conversationId);
    removePinnedBanner();
}

function removePinnedBanner() {
    document.querySelector(".pinned-message-banner")?.remove();
}

async function restorePinnedMessage(messages) {
    if (!currentConversation) return;
    const pinned = getPinnedMessage(currentConversation.id);
    if (!pinned?.id) { removePinnedBanner(); return; }

    const actualMessage = messages.find(m => String(m.id) === String(pinned.id));
    if (!actualMessage) {
        removePinnedStorage(currentConversation.id);
        removePinnedBanner();
        return;
    }
    await renderPinnedBanner(actualMessage);
}

async function renderPinnedBanner(message) {
    removePinnedBanner();
    const header = document.querySelector(".chat-header");
    if (!header) return;

    const sender = await getProfile(message.sender_id);
    const senderName = sender?.display_name || "مستخدم";
    const preview = getMessagePreview(message);

    const banner = document.createElement("div");
    banner.className = "pinned-message-banner";
    banner.innerHTML = `
        <div class="pinned-message-content">
            <strong>📌 رسالة مثبتة</strong>
            <span>${escapeHtml(senderName)}: ${escapeHtml(preview)}</span>
        </div>
        <button type="button" class="unpin-message-button" aria-label="فك التثبيت">×</button>
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
    const element = document.querySelector(`[data-message-id="${cssEscape(messageId)}"]`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("message-highlight");
    setTimeout(() => element.classList.remove("message-highlight"), 1600);
}

/* =========================================================
   REALTIME
========================================================= */

async function subscribeGlobalUnread() {
    if (!db || !currentUser) return;

    if (globalRealtimeChannel) {
        try { await db.removeChannel(globalRealtimeChannel); } catch {}
        globalRealtimeChannel = null;
    }

    const channel = db.channel(`global_unread:${currentUser.id}:${Date.now()}`);

    channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        payload => {
            const msg = payload?.new;
            if (!msg || msg.sender_id === currentUser?.id) return;
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

    const channel = db.channel(`conversation:${conversationId}:${Date.now()}`);

    channel.on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`
        },
        async payload => handleRealtimeMessage(payload, conversationId)
    );

    channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        async payload => handleRealtimeReaction(payload)
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
            if (rec.user_id !== currentUser?.id) {
                updateMessageTickUI(rec.message_id);
            }
        }
    );

    channel.on(
        "postgres_changes",
        {
            event: "UPDATE",
            schema: "public",
            table: "conversations",
            filter: `id=eq.${conversationId}`
        },
        payload => {
            const updated = payload?.new;
            if (!updated || String(currentConversation?.id) !== String(updated.id)) return;
            currentConversation.is_locked = Boolean(updated.is_locked);
            applyConversationLockUI(currentConversation.is_locked);
        }
    );

    channel.subscribe(status => {
        if (status === "SUBSCRIBED") activeRealtimeChannel = channel;
    });
}

async function handleRealtimeMessage(payload, conversationId) {
    if (
        !currentConversation ||
        !messagesContainer ||
        String(currentConversation.id) !== String(conversationId)
    ) {
        return;
    }

    const newRecord = payload?.new;
    const oldRecord = payload?.old;
    const messageId = newRecord?.id || oldRecord?.id;
    if (!messageId) return;

    if (payload.eventType === "INSERT") {
        let message = { ...newRecord };

        if (message.reply_to_message_id) {
            const { data: replyMessage } = await db
                .from("messages")
                .select("*")
                .eq("id", message.reply_to_message_id)
                .maybeSingle();
            message.replyMessage = replyMessage || null;
        }

        upsertCurrentMessage(message);
        const shouldScroll = isNearBottom() || message.sender_id === currentUser?.id;
        await renderMessage(message, { expectedConversationId: conversationId });

        if (shouldScroll) scrollMessagesToBottom();
        await markMessagesAsRead([message]);
        return;
    }

    if (payload.eventType === "UPDATE") {
        await refreshRenderedMessage(messageId);
        return;
    }

    if (payload.eventType === "DELETE") {
        const saved = getPinnedMessage(currentConversation.id);
        if (String(saved?.id) === String(messageId)) unpinMessage(currentConversation.id);
        currentMessages = currentMessages.filter(m => String(m.id) !== String(messageId));
        document.querySelector(`[data-message-id="${cssEscape(messageId)}"]`)?.remove();
        if (!messagesContainer.querySelector(".message")) renderEmptyState();
    }
}

async function handleRealtimeReaction(payload) {
    const record = payload?.new || payload?.old;
    const messageId = record?.message_id;
    if (!messageId) return;

    const element = document.querySelector(`[data-message-id="${cssEscape(messageId)}"]`);
    if (!element) return;

    reactionCache.delete(messageId);
    await refreshRenderedMessage(messageId);
}

/* =========================================================
   PROFILE, STORAGE & HELPERS
========================================================= */

async function getProfile(userId) {
    if (!userId) return null;
    if (profileCache.has(userId)) return profileCache.get(userId);
    if (!db) return null;

    const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

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

function buildStoragePath(folder, fileName) {
    const safeName = sanitizeFileName(fileName);
    const id = createUniqueId();
    const userId = currentUser?.id || "anonymous";
    return [folder, userId, `${Date.now()}_${id}_${safeName}`].join("/");
}

function sanitizeFileName(fileName) {
    return String(fileName || "file").replace(/[^\w.\-]+/g, "_").slice(0, 150);
}

function extractFileNameFromPath(path) {
    if (!path) return "ملف";
    const lastSegment = String(path).split("/").pop() || "ملف";
    const parts = lastSegment.split("_");
    return parts.length >= 3 ? parts.slice(2).join("_") : lastSegment;
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
    if (chatError) {
        chatError.textContent = message || "";
        chatError.classList.remove("hidden");
        setTimeout(() => chatError?.classList.add("hidden"), 5000);
        return;
    }

    if (messagesContainer) {
        const el = document.createElement("div");
        el.className = "chat-error";
        el.textContent = message || "";
        messagesContainer.appendChild(el);
        scrollMessagesToBottom();
        setTimeout(() => el.remove(), 5000);
    }
}

function isNearBottom() {
    if (!messagesContainer) return true;
    return messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 140;
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
    return message.content || "";
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

    try {
        return new Intl.DateTimeFormat(
            "ar-DZ",
            isToday ? { hour: "2-digit", minute: "2-digit" } : { dateStyle: "short", timeStyle: "short" }
        ).format(date);
    } catch {
        return date.toLocaleString();
    }
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
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function authMessage(error) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    if (message.includes("email not confirmed")) return "يجب تأكيد البريد الإلكتروني أولًا.";
    if (message.includes("user not found")) return "المستخدم غير موجود.";
    if (message.includes("password") && message.includes("short")) return "كلمة المرور قصيرة جدًا.";
    if (message.includes("rate limit")) return "تم تجاوز عدد المحاولات المسموح بها. حاول لاحقًا.";
    return error?.message || "حدث خطأ غير متوقع.";
}

/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener("beforeunload", () => {
    try { recordingStream?.getTracks().forEach(t => t.stop()); } catch {}
    try { if (activeRealtimeChannel && db) db.removeChannel(activeRealtimeChannel); } catch {}
    try { if (globalRealtimeChannel && db) db.removeChannel(globalRealtimeChannel); } catch {}
    try { authSubscription?.unsubscribe?.(); } catch {}
});
