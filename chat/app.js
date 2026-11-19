"use strict";

/* =========================================================
   GLOBAL STATE
========================================================= */
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
let db = null;

let currentUser = null;
let currentProfile = null;
let currentConversation = null;

let conversations = [];
let customers = [];

const profileCache = new Map();
const reactionCache = new Map();
const renderingMessageIds = new Set();

let replyingToMessage = null;
let selectedImage = null;

let mediaRecorder = null;
let recordingChunks = [];
let recordingStream = null;

let contextMenu = null;

let activeRealtimeChannel = null;
let authSubscription = null;
let messageSyncTimer = null;
let messageSyncInProgress = false;

let initialized = false;
let startingApplicationPromise = null;
let startingApplicationUserId = null;

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
let conversationList = null;
let customersList = null;
let messagesContainer = null;

let messageForm = null;
let messageInput = null;
let sendButton = null;

let imageInput = null;
let imageButton = null;
let filePreview = null;
let recordButton = null;

let replyPreview = null;
let replyPreviewSender = null;
let replyPreviewText = null;
let cancelReplyButton = null;

let logoutButton = null;
let groupButtons = [];

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
        ensureReplyPreview();
        await initializeAuth();
    } catch (error) {
        console.error("Initialization error:", error);
        showLoginError(error?.message || "حدث خطأ أثناء تشغيل التطبيق.");
    }
}

/* =========================================================
   DOM
========================================================= */

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
    conversationList = document.getElementById("conversationList");
    customersList = document.getElementById("customersList");
    messagesContainer = document.getElementById("messages");

    messageForm = document.getElementById("messageForm");
    messageInput = document.getElementById("messageInput");
    sendButton = document.querySelector("#messageForm .send-button");

    imageInput = document.getElementById("imageInput");
    imageButton = document.getElementById("imageButton");
    filePreview = document.getElementById("filePreview");
    recordButton = document.getElementById("recordButton");

    replyPreview = document.getElementById("replyPreview");
    replyPreviewSender = document.getElementById("replyPreviewSender");
    replyPreviewText = document.getElementById("replyPreviewContent");
    cancelReplyButton = document.getElementById("cancelReplyButton");

  logoutButton = document.getElementById("logoutButton");
    groupButtons = Array.from(document.querySelectorAll(".group-button[data-group-key]"));
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

/* =========================================================
   SUPABASE
========================================================= */

function initializeSupabase() {
    const supabaseApi = window.supabase;
    if (!supabaseApi || typeof supabaseApi.createClient !== "function") {
        throw new Error("لم يتم تحميل مكتبة Supabase. تأكد من إضافة supabase-js قبل app.js.");
    }

    const supabaseUrl = window.SUPABASE_URL;
    const supabaseAnonKey = window.SUPABASE_ANON_KEY;

    if (typeof supabaseUrl !== "string" || !supabaseUrl.trim()) {
        throw new Error("SUPABASE_URL غير موجود. تأكد من ملف config.js.");
    }

    if (typeof supabaseAnonKey !== "string" || !supabaseAnonKey.trim()) {
        throw new Error("SUPABASE_ANON_KEY غير موجود. تأكد من ملف config.js.");
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

    imageButton?.addEventListener("click", event => {
        if (imageButton.tagName.toLowerCase() === "label") return;
        event.preventDefault();
        imageInput?.click();
    });

    imageInput?.addEventListener("change", handleImageSelection);
    recordButton?.addEventListener("click", toggleRecording);
  cancelReplyButton?.addEventListener("click", cancelReply);
    logoutButton?.addEventListener("click", logout);

    groupButtons.forEach(button => {
        button.addEventListener("click", () => {
            openGroupConversation(button.dataset.groupKey);
        });
    });

    document.addEventListener("click", handleDocumentClick);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeContextMenu();
            closeAllReactionPickers();
            closeImageLightbox();
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
                if (loginBox?.dataset.passwordRecovery === "true") {
                    return;
                }
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

/* =========================================================
   LOGIN / LOGOUT / PASSWORD RESET
========================================================= */

async function login() {
    if (!db) {
        showLoginError("Supabase غير جاهز.");
        return;
    }

    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";

    if (!email) {
        showLoginError("أدخل البريد الإلكتروني.");
        emailInput?.focus();
        return;
    }

    if (!isValidEmail(email)) {
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
    if (!email) {
        showLoginError("أدخل البريد الإلكتروني أولًا.");
        emailInput?.focus();
        return;
    }

    if (!isValidEmail(email)) {
        showLoginError("أدخل بريدًا إلكترونيًا صحيحًا.");
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
    confirmPassword?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
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
                throw new Error("تم تسجيل الدخول بنجاح، لكن لم يتم العثور على ملف المستخدم في جدول profiles.");
            }

            currentUser = user;
            currentProfile = profile;
            profileCache.set(user.id, profile);

            window.showAppScreen();

            await loadConversations();
            await loadCustomers();

            if (currentProfile.role === "customer") {
                const privateConversation = conversations.find(
                    c => c.type === "private" && c.customer_id === currentUser.id
                );
                const publicGroup = conversations.find(c => c.type === "group");

                if (privateConversation) {
                    await selectConversation(privateConversation);
                } else if (publicGroup) {
                    await selectConversation(publicGroup);
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

            try {
                await db.auth.signOut();
            } catch (signOutError) {
                console.error(signOutError);
            }
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
};

function resetApplication() {
    stopMessageSync();

    currentUser = null;
    currentProfile = null;
    conversations = [];
    customers = [];

    profileCache.clear();
    reactionCache.clear();
    renderingMessageIds.clear();

    currentConversation = null;
    replyingToMessage = null;
    selectedImage = null;

    closeContextMenu();
    closeAllReactionPickers();
    closeImageLightbox();
    cleanupRecording();
    cancelReply();
    clearFilePreview();

    if (activeRealtimeChannel && db) {
        db.removeChannel(activeRealtimeChannel);
        activeRealtimeChannel = null;
    }

    renderEmptyState();

    if (conversationList) conversationList.innerHTML = "";
    if (customersList) customersList.innerHTML = "";
    if (conversationTitle) conversationTitle.textContent = "المجموعة العامة";
    if (conversationSubtitle) conversationSubtitle.textContent = "المحادثة الجماعية";
    if (chatAvatar) chatAvatar.textContent = "👥";

    window.showLoginScreen();
}

function renderEmptyState() {
    if (!messagesContainer) return;
    messagesContainer.innerHTML = `
        <div class="empty-messages">
            <div class="empty-icon" aria-hidden="true">👋</div>
            <strong>مرحبًا بك في مركز التواصل</strong>
            <small>ابدأ بإرسال رسالة الآن</small>
        </div>
    `;
}

/* =========================================================
   CONVERSATIONS
========================================================= */

async function loadConversations() {
    if (!db || !currentUser) return;

    if (conversationList) conversationList.innerHTML = "";

    const { data, error } = await db
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Load conversations error:", error);
        showChatError(error.message);
        return;
    }

    conversations = Array.isArray(data) ? data : [];

    for (const conversation of conversations) {
        if (conversation.customer_id && !profileCache.has(conversation.customer_id)) {
            await getProfile(conversation.customer_id);
        }
    }

    renderConversationList();
}

function renderConversationList() {
    if (!conversationList) return;
    conversationList.innerHTML = "";

    for (const conversation of conversations) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "conversation-button";
        button.dataset.conversationId = String(conversation.id);
        button.textContent = getConversationTitle(conversation);

        button.addEventListener("click", () => selectConversation(conversation));

        if (String(currentConversation?.id) === String(conversation.id)) {
            button.classList.add("active");
        }

        conversationList.appendChild(button);
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
            const adminBtn = customersList?.querySelector(".customer-button");
            return adminBtn?.textContent?.trim() || "الأستاذ عبد الكريم";
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

    const groupConversation = conversations.find(c => c.type === "group");
    if (groupConversation) {
        await selectConversation(groupConversation);
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
    reactionCache.clear();
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
            conversation.type === "group"
                ? (groupMeta?.icon || "👥")
                : "👤";
    }

    updateSidebarActiveState(conversation);

    if (activeRealtimeChannel && db) {
        try {
            await db.removeChannel(activeRealtimeChannel);
        } catch (error) {
            console.error("Remove old realtime channel error:", error);
        }
        activeRealtimeChannel = null;
    }

    await loadMessages();

    if (String(currentConversation?.id) === String(conversation.id)) {
        await subscribeRealtime(conversation.id);
        startMessageSync(conversation.id);
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

    if (conversationList) {
        conversationList.querySelectorAll(".conversation-button").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.conversationId === String(conversation?.id)
            );
        });
    }
}

    if (conversationList) {
        conversationList.querySelectorAll(".conversation-button").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.conversationId === String(conversation?.id)
            );
        });
    }
}

/* =========================================================
   PRIVATE & GROUP CONVERSATIONS
========================================================= */

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
        console.error("Find private conversation error:", error);
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
            console.error("Create private conversation error:", result.error);
            showChatError(result.error.message);
            return;
        }

        conversation = result.data;
        conversations.push(conversation);
        renderConversationList();
    }

    if (currentProfile?.role === "admin") {
        const { data: existingMembers, error: membersCheckError } = await db
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", conversation.id)
            .in("user_id", [currentUser.id, customerId]);

        if (!membersCheckError) {
            const existingIds = new Set((existingMembers || []).map(m => m.user_id));
            const missingMembers = [currentUser.id, customerId]
                .filter(uid => !existingIds.has(uid))
                .map(uid => ({ conversation_id: conversation.id, user_id: uid }));

            if (missingMembers.length > 0) {
                const { error: membersError } = await db
                    .from("conversation_members")
                    .insert(missingMembers);

                if (membersError) {
                    console.warn("Conversation members warning:", membersError);
                }
            }
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

async function openGroupConversation(groupKey = "3as") {
    if (!db || !currentUser || !groupKey) return;

    const { data: groups, error } = await db
        .from("conversations")
        .select("*")
        .eq("type", "group")
        .eq("group_key", groupKey)
        .limit(1);

    if (error) {
        console.error("Find group error:", error);
        showChatError(error.message);
        return;
    }

    let group = groups?.[0] || null;

    if (!group) {
        if (currentProfile?.role !== "admin") {
            showChatError("هذه المجموعة غير متوفرة حاليًا.");
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
            console.error("Create group error:", result.error);
            showChatError(result.error.message);
            return;
        }

        group = result.data;
    }

    if (!conversations.some(c => String(c.id) === String(group.id))) {
        conversations.push(group);
        renderConversationList();
    }

    await selectConversation(group);
}

/* =========================================================
   CUSTOMERS
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
            console.error("Load customers error:", error);
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
            button.textContent = customer.display_name || "عميل";
            button.addEventListener("click", () => openPrivateConversation(customer));

            customersList.appendChild(button);
        }
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

        if (membersError) {
            console.error("Load private conversation members error:", membersError);
            showChatError(membersError.message);
            return;
        }

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
        button.textContent = adminProfile.display_name || "مدير";
        button.addEventListener("click", openCustomerPrivateConversation);

        customersList.appendChild(button);
    }
}

/* =========================================================
   MESSAGES & SAFE SYNC
========================================================= */

async function loadMessages() {
    if (!db || !currentConversation || !messagesContainer) return;

    const conversationId = currentConversation.id;
    messagesContainer.innerHTML = "";
    reactionCache.clear();
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

    if (messages.length === 0) {
        renderEmptyState();
        removePinnedBanner();
        return;
    }

    await loadReplyMessages(messages);

    if (String(currentConversation?.id) !== String(conversationId)) return;

    for (const message of messages) {
        if (String(currentConversation?.id) !== String(conversationId)) return;
        await renderMessage(message, { expectedConversationId: conversationId });
    }

    await restorePinnedMessage(messages);
    scrollMessagesToBottom();
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

            if (error || String(currentConversation?.id) !== String(conversationId)) {
                return;
            }

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
                    await renderMessage(msg, { expectedConversationId: conversationId });
                }

                if (shouldScroll || newMessages.some(m => m.sender_id === currentUser?.id)) {
                    scrollMessagesToBottom();
                }
            }
        } catch (error) {
            console.error("Message sync error:", error);
        } finally {
            messageSyncInProgress = false;
        }
    }, 4000);
}

async function loadReplyMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return;

    const replyIds = messages.map(m => m.reply_to_message_id).filter(Boolean);
    if (replyIds.length === 0) return;

    const uniqueIds = [...new Set(replyIds)];
    const { data, error } = await db.from("messages").select("*").in("id", uniqueIds);

    if (error) {
        console.warn("Load reply messages error:", error);
        return;
    }

    const replyMap = new Map((data || []).map(m => [m.id, m]));

    for (const message of messages) {
        if (message.reply_to_message_id) {
            message.replyMessage = replyMap.get(message.reply_to_message_id) || null;
        }
    }
}

/* =========================================================
   RENDER MESSAGE (In-Place Update + No Duplicates)
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
        if (isMine) {
            wrapper.classList.add("own");
        }

        const sender = await getProfile(message.sender_id);
        const senderName = sender?.display_name || "مستخدم";

        const messageBubble = document.createElement("div");
        messageBubble.className = "message-bubble";

        // Quoted Reply
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

        // Sender Name
        const senderElement = document.createElement("div");
        senderElement.className = "message-sender";
        senderElement.textContent = senderName;

        if (
            currentProfile?.role === "admin" &&
            sender?.role === "customer" &&
            !isMine
        ) {
            senderElement.classList.add("clickable");
            senderElement.title = "فتح محادثة خاصة";
            senderElement.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                openPrivateConversation(sender);
            });
        }

        messageBubble.appendChild(senderElement);

        // Content
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

            // عرض التعليق تحت الصورة إن كان مختلفاً عن اسم الملف الخام
            if (message.content && !/\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(message.content.trim())) {
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

        // Footer (Timestamp + WhatsApp Checkmarks)
        const footer = document.createElement("div");
        footer.className = "message-footer";

        const date = document.createElement("span");
        date.className = "message-date";
        date.textContent = formatDate(message.created_at);
        footer.appendChild(date);

        if (isMine) {
            const ticks = document.createElement("span");
            ticks.className = "message-ticks";
            ticks.setAttribute("aria-hidden", "true");
            ticks.textContent = "✓✓";
            footer.appendChild(ticks);
        }

        messageBubble.appendChild(footer);

        // Reactions
        const reactions = document.createElement("div");
        reactions.className = "message-reactions";
        await renderReactionSummary(message, reactions);
        messageBubble.appendChild(reactions);

        // Context Menu Triggers
        messageBubble.addEventListener("click", event => {
            if (
                event.target.closest(".reaction-trigger") ||
                event.target.closest(".reaction-summary") ||
                event.target.closest(".reaction-picker") ||
                event.target.closest(".message-sender") ||
                event.target.closest(".message-reply") ||
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

        // تحقق نهائي قبل التعديل على الصفحة لمنع تسرب رسائل محادثة سابقة
        if (expectedConversationId && String(currentConversation?.id) !== expectedConversationId) {
            return;
        }

        messagesContainer.querySelector(".empty-messages")?.remove();

        const currentExisting = messagesContainer.querySelector(
            `[data-message-id="${cssEscape(messageId)}"]`
        );

        if (currentExisting) {
            // تحديث الرسالة في نفس مكانها بدون نقلها لأسفل المحادثة
            currentExisting.replaceWith(wrapper);
        } else {
            messagesContainer.appendChild(wrapper);
        }
    } finally {
        renderingMessageIds.delete(messageId);
    }
}

/* =========================================================
   IMAGE LIGHTBOX
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

/* =========================================================
   MESSAGE MENU
========================================================= */

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
        e.preventDefault();
        e.stopPropagation();
        closeContextMenu();
        copyMessage(message);
    });

    contextMenu.querySelector('[data-action="reply"]')?.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        closeContextMenu();
        startReply(message);
    });

    contextMenu.querySelector('[data-action="reaction"]')?.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        closeContextMenu();
        showReactionPickerForMessage(message);
    });

    contextMenu.querySelector('[data-action="pin"]')?.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        closeContextMenu();
        if (isPinnedMessage(message)) {
            unpinMessage(currentConversation?.id);
        } else {
            pinMessage(message);
        }
    });

    contextMenu.querySelector('[data-action="delete"]')?.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        closeContextMenu();
        deleteMessage(message);
    });

    positionContextMenu(x, y);
}

function positionContextMenu(x, y) {
    if (!contextMenu) return;

    const rect = contextMenu.getBoundingClientRect();
    let left = Number.isFinite(x) ? x : window.innerWidth / 2;
    let top = Number.isFinite(y) ? y : window.innerHeight / 2;

    if (left + rect.width > window.innerWidth) {
        left = window.innerWidth - rect.width - 8;
    }

    if (top + rect.height > window.innerHeight) {
        top = window.innerHeight - rect.height - 8;
    }

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
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
        }
    } catch (error) {
        console.error("Copy error:", error);
    }
}

async function deleteMessage(message) {
    if (!db || !message?.id) return;

    const isMine = message.sender_id === currentUser?.id;
    const isAdmin = currentProfile?.role === "admin";
    if (!isMine && !isAdmin) return;

    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;

    const { error } = await db.from("messages").delete().eq("id", message.id);

    if (error) {
        console.error("Delete message error:", error);
        showChatError(error.message);
        return;
    }

    if (isPinnedMessage(message)) {
        unpinMessage(currentConversation?.id);
    }

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

function ensureReplyPreview() {
    if (replyPreview && replyPreviewSender && replyPreviewText && cancelReplyButton) return;
    if (!messageForm) return;

    if (!replyPreview) {
        replyPreview = document.createElement("div");
        replyPreview.id = "replyPreview";
        replyPreview.className = "reply-preview hidden";
        replyPreview.innerHTML = `
            <div class="reply-preview-content">
                <span class="reply-preview-icon">↩</span>
                <div class="reply-preview-text">
                    <strong id="replyPreviewSender">الرد على</strong>
                    <span id="replyPreviewContent"></span>
                </div>
            </div>
            <button type="button" id="cancelReplyButton" class="cancel-reply" aria-label="إلغاء الرد">×</button>
        `;
        messageForm.parentElement?.insertBefore(replyPreview, messageForm);
    }

    replyPreviewSender = replyPreviewSender || replyPreview.querySelector("#replyPreviewSender");
    replyPreviewText = replyPreviewText || replyPreview.querySelector("#replyPreviewContent");
    cancelReplyButton = cancelReplyButton || replyPreview.querySelector("#cancelReplyButton");

    if (cancelReplyButton && !cancelReplyButton.dataset.bound) {
        cancelReplyButton.dataset.bound = "true";
        cancelReplyButton.addEventListener("click", cancelReply);
    }
}

/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(event) {
    event?.preventDefault();
    if (!db || !currentUser || !currentConversation) return;

    const text = messageInput?.value?.trim() || "";

    if (selectedImage) {
        const file = selectedImage;
        selectedImage = null;
        clearFilePreview();
        await uploadImage(file, text);
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

        if (replyingToMessage?.id) {
            payload.reply_to_message_id = replyingToMessage.id;
        }

        const { data: inserted, error } = await db
            .from("messages")
            .insert(payload)
            .select("*")
            .single();

        if (error) throw error;

        if (messageInput) messageInput.value = "";
        const replyBackup = replyingToMessage;
        cancelReply();

        // عرض الرسالة فوراً دون انتظار Realtime
        if (inserted) {
            if (replyBackup) inserted.replyMessage = replyBackup;
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

/* =========================================================
   IMAGE UPLOAD
========================================================= */

function handleImageSelection(event) {
    const file = event.target?.files?.[0];
    if (!file) {
        selectedImage = null;
        clearFilePreview();
        return;
    }

    if (!file.type.startsWith("image/")) {
        showChatError("الملف المحدد ليس صورة.");
        clearFilePreview();
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showChatError("حجم الصورة يجب ألا يتجاوز 10MB.");
        clearFilePreview();
        return;
    }

    selectedImage = file;
    showFilePreview(file);
}

function showFilePreview(file) {
    if (!filePreview) return;

    filePreview.innerHTML = `
        <div class="file-preview-item">
            <span>📷 ${escapeHtml(file.name)}</span>
            <button type="button" id="clear-file-preview">×</button>
        </div>
    `;

    filePreview.classList.remove("hidden");
    filePreview.querySelector("#clear-file-preview")?.addEventListener("click", clearFilePreview);
}

function clearFilePreview() {
    selectedImage = null;
    if (imageInput) imageInput.value = "";
    if (filePreview) {
        filePreview.innerHTML = "";
        filePreview.classList.add("hidden");
    }
}

async function uploadImage(file, caption = "") {
    if (!db || !currentUser || !currentConversation || !file) return;

    setMessageSending(true);
    const path = buildStoragePath("images", file.name);
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
            message_type: "image",
            file_path: path
        };

        if (replyingToMessage?.id) {
            payload.reply_to_message_id = replyingToMessage.id;
        }

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

        if (inserted) {
            if (replyBackup) inserted.replyMessage = replyBackup;
            await renderMessage(inserted, { expectedConversationId: targetConversationId });
            scrollMessagesToBottom();
        }
    } catch (error) {
        console.error("Upload image error:", error);
        showChatError(error.message);
        selectedImage = file;
        showFilePreview(file);
    } finally {
        setMessageSending(false);
    }
}

/* =========================================================
   AUDIO RECORDING
========================================================= */

async function toggleRecording() {
    if (mediaRecorder) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
        showChatError("المتصفح لا يدعم تسجيل الصوت.");
        return;
    }

    if (typeof MediaRecorder === "undefined") {
        showChatError("MediaRecorder غير مدعوم في هذا المتصفح.");
        return;
    }

    if (!currentUser || !currentConversation) return;

    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mimeTypes = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus",
            "audio/mp4"
        ];
        const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || "";

        mediaRecorder = mimeType
            ? new MediaRecorder(recordingStream, { mimeType })
            : new MediaRecorder(recordingStream);

        recordingChunks = [];

        const recordingConversationId = currentConversation.id;
        const recordingUserId = currentUser.id;
        const recordingReplyId = replyingToMessage?.id || null;

        mediaRecorder.ondataavailable = event => {
            if (event.data && event.data.size > 0) {
                recordingChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const chunks = recordingChunks;
            recordingChunks = [];
            const recorder = mediaRecorder;
            mediaRecorder = null;

            recordingStream?.getTracks().forEach(track => {
                try { track.stop(); } catch (e) { console.warn(e); }
            });
            recordingStream = null;
            updateRecordButton(false);

            if (!chunks.length) return;

            const blob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" });
            await uploadAudio(blob, recordingConversationId, recordingUserId, recordingReplyId);
        };

        mediaRecorder.onerror = event => {
            console.error("MediaRecorder error:", event);
            showChatError("حدث خطأ أثناء تسجيل الصوت.");
            cleanupRecording();
        };

        mediaRecorder.start();
        updateRecordButton(true);
    } catch (error) {
        console.error("Start recording error:", error);
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
    try {
        mediaRecorder.stop();
    } catch (error) {
        console.error("Stop recording error:", error);
        cleanupRecording();
    }
}

function cleanupRecording() {
    try {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
    } catch (error) {
        console.warn(error);
    }

    mediaRecorder = null;
    recordingChunks = [];
    recordingStream?.getTracks().forEach(track => {
        try { track.stop(); } catch (e) { console.warn(e); }
    });
    recordingStream = null;
    updateRecordButton(false);
}

async function uploadAudio(blob, conversationId, userId, replyId = null) {
    if (!db || !blob || !conversationId || !userId) return;

    setMessageSending(true);
    const extension = getAudioExtension(blob.type);
    const path = buildStoragePath("audio", `recording.${extension}`);

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
            if (inserted) {
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
    recordButton.textContent = recording ? "⏹" : "🎤";
}

/* =========================================================
   REACTIONS
========================================================= */

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

async function renderReactionSummary(message, container) {
    if (!message || !container) return;

    const reactions = await loadReactions(message.id);
    const counts = new Map();

    for (const r of reactions) {
        counts.set(r.reaction, (counts.get(r.reaction) || 0) + 1);
    }

    for (const [reaction, count] of counts) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "reaction-summary";
        button.dataset.reaction = reaction;
        button.title = `${reaction} ${count}`;
        button.textContent = `${reaction} ${count}`;
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
    if (reactionCache.has(messageId)) {
        return reactionCache.get(messageId);
    }

    const { data, error } = await db
        .from("message_reactions")
        .select("*")
        .eq("message_id", messageId);

    if (error) {
        console.warn("Load reactions error:", error);
        reactionCache.set(messageId, []);
        return [];
    }

    const reactions = Array.isArray(data) ? data : [];
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

    if (left + pickerRect.width > window.innerWidth) {
        left = window.innerWidth - pickerRect.width - 8;
    }

    if (top + pickerRect.height > window.innerHeight) {
        top = rect.top - pickerRect.height - 5;
    }

    picker.style.left = `${Math.max(8, left)}px`;
    picker.style.top = `${Math.max(8, top)}px`;
}

function showReactionPickerForMessage(message) {
    const element = document.querySelector(`[data-message-id="${cssEscape(message.id)}"]`);
    const button = element?.querySelector(".reaction-trigger");
    if (button) showReactionPicker(message, button);
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
                const { error } = await db
                    .from("message_reactions")
                    .delete()
                    .eq("id", existing.id);
                if (error) throw error;
            } else {
                const { error } = await db
                    .from("message_reactions")
                    .update({ reaction })
                    .eq("id", existing.id);
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

    await renderMessage(message, {
        forceRefresh: true,
        expectedConversationId: currentConversation.id
    });
}

/* =========================================================
   PINNED MESSAGES
========================================================= */

function getPinnedStorageKey(conversationId) {
    return `pinned_message_${conversationId}`;
}

function getPinnedMessage(conversationId) {
    if (!conversationId) return null;
    try {
        const value = localStorage.getItem(getPinnedStorageKey(conversationId));
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function savePinnedMessage(conversationId, message) {
    if (!conversationId || !message) return;
    try {
        localStorage.setItem(getPinnedStorageKey(conversationId), JSON.stringify(message));
    } catch (error) {
        console.warn("Save pinned message error:", error);
    }
}

function removePinnedStorage(conversationId) {
    if (!conversationId) return;
    try {
        localStorage.removeItem(getPinnedStorageKey(conversationId));
    } catch (error) {
        console.warn("Remove pinned message error:", error);
    }
}

function isPinnedMessage(message) {
    if (!currentConversation || !message) return false;
    const pinned = getPinnedMessage(currentConversation.id);
    return String(pinned?.id) === String(message.id);
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

    if (!pinned?.id) {
        removePinnedBanner();
        return;
    }

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

    banner.querySelector(".unpin-message-button")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        unpinMessage(currentConversation?.id);
    });

    banner.addEventListener("click", event => {
        if (event.target.closest(".unpin-message-button")) return;
        scrollToMessage(message.id);
    });
}

function scrollToMessage(messageId) {
    const element = document.querySelector(`[data-message-id="${cssEscape(messageId)}"]`);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("message-highlight");
    setTimeout(() => element.classList.remove("message-highlight"), 1500);
}

/* =========================================================
   REALTIME
========================================================= */

async function subscribeRealtime(conversationId) {
    if (!db || !conversationId) return;

    if (activeRealtimeChannel) {
        try {
            await db.removeChannel(activeRealtimeChannel);
        } catch (error) {
            console.warn("Remove realtime channel error:", error);
        }
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
        {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `id=eq.${conversationId}`
        },
        async () => loadConversations()
    );

    channel.subscribe(status => {
        if (status === "SUBSCRIBED") {
            activeRealtimeChannel = channel;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("Realtime status:", status);
        }
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

        const shouldScroll = isNearBottom() || message.sender_id === currentUser?.id;
        await renderMessage(message, { expectedConversationId: conversationId });

        if (shouldScroll) scrollMessagesToBottom();
        return;
    }

    if (payload.eventType === "UPDATE") {
        await refreshRenderedMessage(messageId);
        return;
    }

    if (payload.eventType === "DELETE") {
        const saved = getPinnedMessage(currentConversation.id);
        if (String(saved?.id) === String(messageId)) {
            unpinMessage(currentConversation.id);
        }
        document.querySelector(`[data-message-id="${cssEscape(messageId)}"]`)?.remove();
        if (!messagesContainer.querySelector(".message")) {
            renderEmptyState();
        }
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
   PROFILE & STORAGE
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

    if (error) {
        console.warn("Get profile error:", error);
        return null;
    }

    if (data) profileCache.set(userId, data);
    return data;
}

async function signedUrl(path) {
    if (!db || !path) return null;

    const { data, error } = await db.storage
        .from("chat-files")
        .createSignedUrl(path, 60 * 60);

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

function getAudioExtension(mimeType) {
    const type = String(mimeType || "").toLowerCase();
    if (type.includes("ogg")) return "ogg";
    if (type.includes("mp4")) return "m4a";
    if (type.includes("mpeg")) return "mp3";
    return "webm";
}

/* =========================================================
   UI HELPERS & FORMATTING
========================================================= */

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
        const errorElement = document.createElement("div");
        errorElement.className = "chat-error";
        errorElement.textContent = message || "";
        messagesContainer.appendChild(errorElement);
        scrollMessagesToBottom();
        setTimeout(() => errorElement.remove(), 5000);
    }
}

function isNearBottom() {
    if (!messagesContainer) return true;
    const distance =
        messagesContainer.scrollHeight -
        messagesContainer.scrollTop -
        messagesContainer.clientHeight;
    return distance < 140;
}

function scrollMessagesToBottom() {
    if (!messagesContainer) return;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getMessagePreview(message) {
    if (!message) return "";
    if (message.message_type === "image") return message.content || "صورة";
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
            isToday
                ? { hour: "2-digit", minute: "2-digit" }
                : { dateStyle: "short", timeStyle: "short" }
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
    if (window.CSS && typeof window.CSS.escape === "function") {
        return window.CSS.escape(str);
    }
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
    if (message.includes("invalid login credentials")) {
        return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
    if (message.includes("email not confirmed")) {
        return "يجب تأكيد البريد الإلكتروني أولًا.";
    }
    if (message.includes("user not found")) {
        return "المستخدم غير موجود.";
    }
    if (message.includes("password") && message.includes("short")) {
        return "كلمة المرور قصيرة جدًا.";
    }
    if (message.includes("rate limit")) {
        return "تم تجاوز عدد المحاولات المسموح بها. حاول لاحقًا.";
    }
    return error?.message || "حدث خطأ غير متوقع.";
}

/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener("beforeunload", () => {
    try {
        recordingStream?.getTracks().forEach(track => track.stop());
    } catch (e) { console.warn(e); }

    try {
        if (activeRealtimeChannel && db) db.removeChannel(activeRealtimeChannel);
    } catch (e) { console.warn(e); }

    try {
        authSubscription?.unsubscribe?.();
    } catch (e) { console.warn(e); }
});
