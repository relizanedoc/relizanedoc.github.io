"use strict";

/*
 * app.js
 * Supabase Chat / Contact Center
 *
 * متوافق مع قاعدة البيانات الحالية:
 *
 * profiles:
 * id
 * display_name
 * role
 * created_at
 *
 * conversations:
 * id
 * type
 * customer_id
 * created_at
 *
 * conversation_members:
 * conversation_id
 * user_id
 *
 * messages:
 * id
 * conversation_id
 * sender_id
 * message_type
 * content
 * file_path
 * created_at
 * reply_to_message_id
 *
 * message_reactions:
 * id
 * message_id
 * user_id
 * reaction
 * created_at
 *
 * message_reads:
 * message_id
 * user_id
 * read_at
 *
 * Storage bucket:
 * chat-files
 */


/* =========================================================
   GLOBAL STATE
========================================================= */

let db = null;

let currentUser = null;
let currentProfile = null;
let currentConversation = null;

let conversations = [];
let customers = [];

const profileCache = new Map();
const reactionCache = new Map();

let replyingToMessage = null;
let selectedImage = null;

let mediaRecorder = null;
let recordingChunks = [];
let recordingStream = null;

let contextMenu = null;

let activeRealtimeChannel = null;
let authSubscription = null;

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
let groupConversationButton = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    if (initialized) {
        return;
    }

    initialized = true;

    cacheDomElements();

    try {

        validateRequiredDom();

        initializeSupabase();

        bindEvents();

        ensureReplyPreview();

        await initializeAuth();

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        showLoginError(
            error?.message ||
            "حدث خطأ أثناء تشغيل التطبيق."
        );
    }
}


/* =========================================================
   DOM
========================================================= */

function cacheDomElements() {

    loginScreen =
        document.getElementById("loginScreen");

    loginBox =
        document.querySelector(".login-box");

    loginForm =
        document.getElementById("loginForm");

    app =
        document.getElementById("app");

    emailInput =
        document.getElementById("email");

    passwordInput =
        document.getElementById("password");

    loginButton =
        document.getElementById("loginButton");

    forgotPasswordButton =
        document.getElementById("forgotPasswordButton");

    loginError =
        document.getElementById("loginError");

    chatError =
        document.getElementById("chatError");

    conversationTitle =
        document.getElementById("conversationTitle");

    conversationSubtitle =
        document.getElementById("conversationSubtitle");

    conversationList =
        document.getElementById("conversationList");

    customersList =
        document.getElementById("customersList");

    messagesContainer =
        document.getElementById("messages");

    messageForm =
        document.getElementById("messageForm");

    messageInput =
        document.getElementById("messageInput");

    sendButton =
        document.querySelector(
            "#messageForm .send-button"
        );

    imageInput =
        document.getElementById("imageInput");

    imageButton =
        document.getElementById("imageButton");

    filePreview =
        document.getElementById("filePreview");

    recordButton =
        document.getElementById("recordButton");

    replyPreview =
        document.getElementById("replyPreview");

    replyPreviewSender =
        document.getElementById("replyPreviewSender");

    replyPreviewText =
        document.getElementById("replyPreviewContent");

    cancelReplyButton =
        document.getElementById("cancelReplyButton");

    logoutButton =
        document.getElementById("logoutButton");

    groupConversationButton =
        document.getElementById("groupButton");
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

    const missing =
        Object.entries(required)
            .filter(
                ([, element]) => !element
            )
            .map(
                ([name]) => name
            );

    if (missing.length > 0) {

        throw new Error(
            `عناصر HTML مفقودة: ${missing.join(", ")}`
        );
    }
}


/* =========================================================
   SUPABASE
========================================================= */

function initializeSupabase() {

    const supabaseApi =
        window.supabase;

    if (
        !supabaseApi ||
        typeof supabaseApi.createClient !==
            "function"
    ) {

        throw new Error(
            "لم يتم تحميل مكتبة Supabase. تأكد من إضافة supabase-js قبل app.js."
        );
    }

    const supabaseUrl =
        window.SUPABASE_URL;

    const supabaseAnonKey =
        window.SUPABASE_ANON_KEY;

    if (
        typeof supabaseUrl !== "string" ||
        !supabaseUrl.trim()
    ) {

        throw new Error(
            "SUPABASE_URL غير موجود. تأكد من ملف config.js."
        );
    }

    if (
        typeof supabaseAnonKey !== "string" ||
        !supabaseAnonKey.trim()
    ) {

        throw new Error(
            "SUPABASE_ANON_KEY غير موجود. تأكد من ملف config.js."
        );
    }

    db =
        supabaseApi.createClient(
            supabaseUrl.trim(),
            supabaseAnonKey.trim()
        );
}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    loginForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            login();
        }
    );


    forgotPasswordButton?.addEventListener(
        "click",
        sendPasswordReset
    );


    messageForm?.addEventListener(
        "submit",
        sendMessage
    );


    messageInput?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                if (
                    typeof messageForm?.requestSubmit ===
                    "function"
                ) {

                    messageForm.requestSubmit();

                } else {

                    sendMessage(event);
                }
            }
        }
    );


    imageButton?.addEventListener(
        "click",
        event => {

            if (
                imageButton.tagName.toLowerCase() ===
                "label"
            ) {
                return;
            }

            event.preventDefault();

            imageInput?.click();
        }
    );


    imageInput?.addEventListener(
        "change",
        handleImageSelection
    );


    recordButton?.addEventListener(
        "click",
        toggleRecording
    );


    cancelReplyButton?.addEventListener(
        "click",
        cancelReply
    );


    logoutButton?.addEventListener(
        "click",
        logout
    );


    groupConversationButton?.addEventListener(
        "click",
        openGroupConversation
    );


    document.addEventListener(
        "click",
        handleDocumentClick
    );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeContextMenu();

                closeAllReactionPickers();
            }
        }
    );


    window.addEventListener(
        "resize",
        () => {

            closeContextMenu();

            closeAllReactionPickers();
        }
    );


    window.addEventListener(
        "scroll",
        () => {

            closeContextMenu();
        },
        true
    );
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

    if (!db) {
        return;
    }

    const authState =
        db.auth.onAuthStateChange(
            (event, session) => {

                setTimeout(
                    () => {

                        if (
                            event === "SIGNED_IN" &&
                            session?.user
                        ) {

                            startApplication(
                                session.user
                            ).catch(
                                error => {

                                    console.error(
                                        "startApplication error:",
                                        error
                                    );
                                }
                            );
                        }


                        if (
                            event ===
                            "PASSWORD_RECOVERY"
                        ) {

                            showPasswordUpdateScreen();
                        }


                        if (
                            event ===
                            "SIGNED_OUT"
                        ) {

                            resetApplication();
                        }

                    },
                    0
                );
            }
        );


    if (
        authState?.data?.subscription
    ) {

        authSubscription =
            authState.data.subscription;
    }


    const {
        data,
        error
    } =
        await db.auth.getSession();


    if (error) {
        throw error;
    }


    if (data?.session?.user) {

        await startApplication(
            data.session.user
        );

    } else {

        window.showLoginScreen();

    }
}

/* =========================================================
   LOGIN
========================================================= */

async function login() {

    if (!db) {

        showLoginError(
            "Supabase غير جاهز."
        );

        return;
    }


    const email =
        emailInput?.value?.trim() || "";


    const password =
        passwordInput?.value || "";


    if (!email) {

        showLoginError(
            "أدخل البريد الإلكتروني."
        );

        emailInput?.focus();

        return;
    }


    if (!isValidEmail(email)) {

        showLoginError(
            "أدخل بريدًا إلكترونيًا صحيحًا."
        );

        emailInput?.focus();

        return;
    }


    if (!password) {

        showLoginError(
            "أدخل كلمة المرور."
        );

        passwordInput?.focus();

        return;
    }


    clearLoginError();

    setLoginLoading(true);


    try {

        const {
            data,
            error
        } =
            await db.auth.signInWithPassword({
                email,
                password
            });


        if (error) {
            throw error;
        }


        if (!data?.user) {

            throw new Error(
                "تعذر تسجيل الدخول."
            );
        }


        await startApplication(
            data.user
        );

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showLoginError(
            authMessage(error)
        );

    } finally {

        setLoginLoading(false);
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    if (!db) {
        return;
    }

    try {

        const {
            error
        } =
            await db.auth.signOut();


        if (error) {
            throw error;
        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        resetApplication();
    }
}


/* =========================================================
   PASSWORD RESET
========================================================= */

async function sendPasswordReset() {

    if (!db) {

        showLoginError(
            "Supabase غير جاهز."
        );

        return;
    }


    const email =
        emailInput?.value?.trim() || "";


    if (!email) {

        showLoginError(
            "أدخل البريد الإلكتروني أولًا."
        );

        emailInput?.focus();

        return;
    }


    if (!isValidEmail(email)) {

        showLoginError(
            "أدخل بريدًا إلكترونيًا صحيحًا."
        );

        return;
    }


    clearLoginError();


    try {

        const {
            error
        } =
            await db.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo:
                        `${window.location.origin}${window.location.pathname}`
                }
            );


        if (error) {
            throw error;
        }


        showLoginSuccess(
            "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني."
        );

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        showLoginError(
            authMessage(error)
        );
    }
}


/* =========================================================
   PASSWORD UPDATE
========================================================= */

function showPasswordUpdateScreen() {

    if (!loginBox) {
        return;
    }


    loginBox.dataset.passwordRecovery =
        "true";


    loginBox.innerHTML = `
        <div class="password-update-screen">

            <h2>تحديث كلمة المرور</h2>

            <p>
                أدخل كلمة المرور الجديدة.
            </p>

            <input
                id="new-password"
                type="password"
                autocomplete="new-password"
                placeholder="كلمة المرور الجديدة"
            >

            <input
                id="confirm-new-password"
                type="password"
                autocomplete="new-password"
                placeholder="تأكيد كلمة المرور"
            >

            <button
                id="update-password-button"
                type="button"
            >
                تحديث كلمة المرور
            </button>

            <div
                id="password-update-error"
                class="login-error"
            ></div>

        </div>
    `;


    const newPassword =
        document.getElementById(
            "new-password"
        );


    const confirmPassword =
        document.getElementById(
            "confirm-new-password"
        );


    const updateButton =
        document.getElementById(
            "update-password-button"
        );


    const updateError =
        document.getElementById(
            "password-update-error"
        );


    const updatePassword =
        async () => {

            const password =
                newPassword?.value || "";


            const confirm =
                confirmPassword?.value || "";


            if (password.length < 6) {

                if (updateError) {

                    updateError.textContent =
                        "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.";
                }

                return;
            }


            if (password !== confirm) {

                if (updateError) {

                    updateError.textContent =
                        "كلمتا المرور غير متطابقتين.";
                }

                return;
            }


            if (updateButton) {

                updateButton.disabled = true;

                updateButton.textContent =
                    "جارٍ التحديث...";
            }


            try {

                const {
                    error
                } =
                    await db.auth.updateUser({
                        password
                    });


                if (error) {
                    throw error;
                }


                await db.auth.signOut();

                window.location.reload();

            } catch (error) {

                console.error(
                    "Update password error:",
                    error
                );


                if (updateError) {

                    updateError.textContent =
                        authMessage(error);
                }


                if (updateButton) {

                    updateButton.disabled =
                        false;

                    updateButton.textContent =
                        "تحديث كلمة المرور";
                }
            }
        };


    updateButton?.addEventListener(
        "click",
        updatePassword
    );


    confirmPassword?.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                updatePassword();
            }
        }
    );


    newPassword?.focus();
}


/* =========================================================
   APPLICATION
========================================================= */

async function startApplication(user) {

    if (!db || !user) {
        return;
    }


    if (
        currentUser?.id === user.id &&
        currentProfile
    ) {

window.showAppScreen();
        return;
    }


    if (
        startingApplicationPromise &&
        startingApplicationUserId === user.id
    ) {

        return startingApplicationPromise;
    }


    startingApplicationUserId =
        user.id;


    startingApplicationPromise =
        (async () => {

            try {

                const {
                    data: profile,
                    error
                } =
                    await db
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .maybeSingle();


                if (error) {
                    throw error;
                }


                if (!profile) {

                    throw new Error(
                        "تم تسجيل الدخول بنجاح، لكن لم يتم العثور على ملف المستخدم في جدول profiles."
                    );
                }


                currentUser =
                    user;


                currentProfile =
                    profile;


                profileCache.set(
                    user.id,
                    profile
                );


window.showAppScreen();

                /*
                 * مهم:
                 * نحمّل المحادثات أولاً حتى تتمكن
                 * loadCustomers() من العثور على
                 * المحادثة الخاصة بالعميل.
                 */
                await loadConversations();


                /*
                 * تحميل قائمة العملاء للأدمن،
                 * أو إظهار الأدمن للعميل.
                 */
                await loadCustomers();


                /*
                 * CUSTOMER
                 */
                if (
                    currentProfile.role ===
                    "customer"
                ) {

                    // المحادثة الخاصة بالعميل
                    const privateConversation =
                        conversations.find(
                            conversation =>
                                conversation.type ===
                                    "private" &&
                                conversation.customer_id ===
                                    currentUser.id
                        );


                    // المجموعة العامة
                    const publicGroup =
                        conversations.find(
                            conversation =>
                                conversation.type ===
                                "group"
                        );


                    /*
                     * افتح المحادثة الخاصة أولاً
                     */
                    if (privateConversation) {

                        await selectConversation(
                            privateConversation
                        );

                    }

                    /*
                     * إذا لم توجد الخاصة،
                     * افتح المجموعة العامة
                     */
                    else if (publicGroup) {

                        await selectConversation(
                            publicGroup
                        );
                    }

                }


                /*
                 * ADMIN
                 */
                else {

                    await openInitialAdminConversation();
                }


            } catch (error) {

                console.error(
                    "Application start error:",
                    error
                );


                currentUser = null;

                currentProfile = null;


window.showLoginScreen();

                showLoginError(
                    error?.message ||
                    "تعذر تحميل بيانات المستخدم."
                );


                try {

                    await db.auth.signOut();

                } catch (signOutError) {

                    console.error(
                        signOutError
                    );
                }
            }

        })();


    try {

        await startingApplicationPromise;

    } finally {

        if (
            startingApplicationUserId ===
            user.id
        ) {

            startingApplicationPromise =
                null;

            startingApplicationUserId =
                null;
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

    currentUser = null;
    currentProfile = null;

    conversations = [];
    customers = [];

    profileCache.clear();
    reactionCache.clear();

    currentConversation = null;

    replyingToMessage = null;
    selectedImage = null;

    closeContextMenu();
    closeAllReactionPickers();
    cleanupRecording();

    cancelReply();
    clearFilePreview();

    if (activeRealtimeChannel && db) {
        db.removeChannel(activeRealtimeChannel);
        activeRealtimeChannel = null;
    }

    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="empty-messages">
                <div class="empty-icon" aria-hidden="true">👋</div>
                <strong>مرحبًا بك في مركز التواصل</strong>
                <small>ابدأ بإرسال رسالة الآن</small>
            </div>
        `;
    }

    if (conversationList) {
        conversationList.innerHTML = "";
    }

    if (customersList) {
        customersList.innerHTML = "";
    }

    if (conversationTitle) {
        conversationTitle.textContent = "المجموعة العامة";
    }

    if (conversationSubtitle) {
        conversationSubtitle.textContent = "المحادثة الجماعية";
    }

    window.showLoginScreen();
}
/* =========================================================
   CONVERSATIONS
========================================================= */

async function loadConversations() {

    if (!db || !currentUser) {
        return;
    }


    if (conversationList) {
        conversationList.innerHTML = "";
    }


    let query =
        db
            .from("conversations")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );
    const {
        data,
        error
    } = await query;


    if (error) {

        console.error(
            "Load conversations error:",
            error
        );

        showChatError(
            error.message
        );

        return;
    }


    conversations =
        Array.isArray(data)
            ? data
            : [];
console.log("CUSTOMER CONVERSATIONS:", conversations);

    for (
        const conversation of conversations
    ) {

        if (
            conversation.customer_id &&
            !profileCache.has(
                conversation.customer_id
            )
        ) {

            await getProfile(
                conversation.customer_id
            );
        }
    }


    renderConversationList();
}


function renderConversationList() {

    if (!conversationList) {
        return;
    }


    conversationList.innerHTML = "";


    for (
        const conversation of conversations
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "conversation-button";


        button.dataset.conversationId =
            conversation.id;


        button.textContent =
            getConversationTitle(
                conversation
            );


        button.addEventListener(
            "click",
            () => {

                selectConversation(
                    conversation
                );
            }
        );


        if (
            currentConversation?.id ===
            conversation.id
        ) {

            button.classList.add(
                "active"
            );
        }


        conversationList.appendChild(
            button
        );
    }
}

function getConversationTitle(
    conversation
) {

    if (!conversation) {
        return "محادثة";
    }

    if (
        conversation.type ===
        "group"
    ) {
        return "المجموعة العامة";
    }

    if (
        conversation.type ===
        "private"
    ) {

        if (
            currentProfile?.role ===
            "customer"
        ) {
            return "عبد الكريم";
        }

        if (
            conversation.customer_id
        ) {

            const customer =
                profileCache.get(
                    conversation.customer_id
                );

            return (
                customer?.display_name ||
                "محادثة خاصة"
            );
        }

        return "محادثة خاصة";
    }

    return "محادثة";
}
async function openInitialAdminConversation() {

    if (
        currentProfile?.role !==
        "admin"
    ) {

        return;
    }


    const groupConversation =
        conversations.find(
            conversation =>
                conversation.type ===
                "group"
        );


    if (groupConversation) {

        await selectConversation(
            groupConversation
        );

        return;
    }


    const privateConversation =
        conversations.find(
            conversation =>
                conversation.type ===
                "private"
        );


    if (privateConversation) {

        await selectConversation(
            privateConversation
        );
    }
}


async function selectConversation(
    conversation
) {

    if (
        !conversation ||
        !conversation.id
    ) {
        return;
    }

    closeContextMenu();
    closeAllReactionPickers();
    removePinnedBanner();

    cancelReply();
    clearFilePreview();

    /*
     * نحدد المحادثة الجديدة فورًا قبل
     * أي طلب للرسائل.
     */
    currentConversation = {
        ...conversation
    };

    reactionCache.clear();

    if (conversationTitle) {
        conversationTitle.textContent =
            getConversationTitle(
                conversation
            );
    }

    if (conversationSubtitle) {
        conversationSubtitle.textContent =
            conversation.type === "group"
                ? "المحادثة الجماعية"
                : "محادثة خاصة";
    }

    setActiveConversationButton(
        conversation.id
    );

    /*
     * إلغاء اشتراك المحادثة السابقة.
     */
    if (
        activeRealtimeChannel &&
        db
    ) {
        try {
            await db.removeChannel(
                activeRealtimeChannel
            );
        } catch (error) {
            console.error(
                "Remove old realtime channel error:",
                error
            );
        }

        activeRealtimeChannel = null;
    }

    /*
     * تحميل رسائل المحادثة المختارة فقط.
     */
    await loadMessages();

    /*
     * لا نشترك إلا إذا بقيت هذه هي
     * المحادثة الحالية.
     */
    if (
        currentConversation?.id ===
        conversation.id
    ) {
        await subscribeRealtime(
            conversation.id
        );
    }
}

function setActiveConversationButton(
    conversationId
) {

    if (!conversationList) {
        return;
    }


    conversationList
        .querySelectorAll(
            ".conversation-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.conversationId ===
                        conversationId
                );
            }
        );
}


/* =========================================================
   PRIVATE CONVERSATION
========================================================= */

async function openPrivateConversation(
    customer
) {

    if (
        !db ||
        !currentUser ||
        !customer
    ) {

        return;
    }


    if (
        customer.role &&
        customer.role !== "customer"
    ) {

        return;
    }


    const customerId =
        customer.id;


    const {
        data: privateConversations,
        error
    } =
        await db
            .from("conversations")
            .select("*")
            .eq(
                "type",
                "private"
            )
            .eq(
                "customer_id",
                customerId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(1);


    if (error) {

        console.error(
            "Find private conversation error:",
            error
        );

        showChatError(
            error.message
        );

        return;
    }


    let conversation =
        privateConversations?.[0] ||
        null;


    if (!conversation) {

        if (
            currentProfile?.role !==
            "admin"
        ) {

            showChatError(
                "المحادثة الخاصة غير موجودة."
            );

            return;
        }


        const result =
            await db
                .from("conversations")
                .insert({
                    type: "private",
                    customer_id:
                        customerId
                })
                .select("*")
                .single();


        if (result.error) {

            console.error(
                "Create private conversation error:",
                result.error
            );

            showChatError(
                result.error.message
            );

            return;
        }


        conversation =
            result.data;


        conversations.push(
            conversation
        );


        renderConversationList();
    }


    if (
        currentProfile?.role ===
        "admin"
    ) {

        const {
            error: membersError
        } =
            await db
                .from(
                    "conversation_members"
                )
                .upsert(
                    [
                        {
                            conversation_id:
                                conversation.id,

                            user_id:
                                currentUser.id
                        },

                        {
                            conversation_id:
                                conversation.id,

                            user_id:
                                customerId
                        }
                    ],
                    {
                        onConflict:
                            "conversation_id,user_id"
                    }
                );


        if (membersError) {

            console.warn(
                "Conversation members warning:",
                membersError
            );
        }
    }


    profileCache.set(
        customerId,
        customer
    );


    await selectConversation(
        conversation
    );


    customersList
        ?.querySelectorAll(
            ".customer-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.customerId ===
                        String(customerId)
                );
            }
        );
}

async function openCustomerPrivateConversation() {

    if (
        !currentUser ||
        currentProfile?.role !== "customer"
    ) {
        return;
    }

    const conversation =
        conversations.find(
            conversation =>
                conversation.type === "private" &&
                conversation.customer_id === currentUser.id
        );

    if (!conversation) {

        showChatError(
            "المحادثة الخاصة غير موجودة."
        );

        return;
    }

    await selectConversation(
        conversation
    );

    customersList
        ?.querySelectorAll(
            ".customer-button"
        )
        .forEach(
            button => {

                button.classList.add(
                    "active"
                );
            }
        );
}
/* =========================================================
   GROUP CONVERSATION
========================================================= */

async function openGroupConversation() {

    if (
        !db ||
        !currentUser
    ) {
        return;
    }


    const {
        data: groups,
        error
    } =
        await db
            .from("conversations")
            .select("*")
            .eq(
                "type",
                "group"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(1);


    if (error) {

        console.error(
            "Find group error:",
            error
        );

        showChatError(
            error.message
        );

        return;
    }


    let group =
        groups?.[0] ||
        null;


    /*
     * إذا لم توجد المجموعة،
     * يقوم الأدمن بإنشائها.
     */
    if (!group) {

        if (
            currentProfile?.role !==
            "admin"
        ) {

            showChatError(
                "المجموعة العامة غير موجودة."
            );

            return;
        }


        const result =
            await db
                .from("conversations")
                .insert({
                    type: "group"
                })
                .select("*")
                .single();


        if (result.error) {

            console.error(
                "Create group error:",
                result.error
            );

            showChatError(
                result.error.message
            );

            return;
        }


        group =
            result.data;


        conversations.push(
            group
        );


        renderConversationList();
    }


    /*
     * تأكد أن المجموعة موجودة في الذاكرة.
     */
    const existingGroup =
        conversations.find(
            conversation =>
                conversation.id ===
                group.id
        );


    if (!existingGroup) {

        conversations.push(
            group
        );

        renderConversationList();
    }


    /*
     * افتح المجموعة للعميل أو الأدمن.
     */
    await selectConversation(
        group
    );
}
/* =========================================================
   CUSTOMERS
========================================================= */

async function loadCustomers() {

    if (
        !db ||
        !customersList
    ) {
        return;
    }

    customersList.innerHTML = "";

    /* =====================================================
       ADMIN
    ===================================================== */

    if (currentProfile?.role === "admin") {

        const {
            data,
            error
        } =
            await db
                .from("profiles")
                .select("*")
                .eq(
                    "role",
                    "customer"
                )
                .order(
                    "display_name",
                    {
                        ascending: true
                    }
                );

        if (error) {

            console.error(
                "Load customers error:",
                error
            );

            showChatError(
                error.message
            );

            return;
        }

        customers =
            Array.isArray(data)
                ? data
                : [];

        for (
            const customer of customers
        ) {

            profileCache.set(
                customer.id,
                customer
            );

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "customer-button";

            button.dataset.customerId =
                customer.id;

            button.textContent =
                customer.display_name ||
                "عميل";

            button.addEventListener(
                "click",
                () => {

                    openPrivateConversation(
                        customer
                    );
                }
            );

            customersList.appendChild(
                button
            );
        }

        return;
    }


    /* =====================================================
       CUSTOMER
       إظهار الأدمن في المحادثات الخاصة
    ===================================================== */

    if (currentProfile?.role === "customer") {

        const privateConversation =
            conversations.find(
                conversation =>
                    conversation.type === "private" &&
                    conversation.customer_id === currentUser.id
            );

        if (!privateConversation) {
            return;
        }


        const {
            data: members,
            error: membersError
        } =
            await db
                .from("conversation_members")
                .select("user_id")
                .eq(
                    "conversation_id",
                    privateConversation.id
                );


        if (membersError) {

            console.error(
                "Load private conversation members error:",
                membersError
            );

            showChatError(
                membersError.message
            );

            return;
        }


        const adminMember =
            (members || []).find(
                member =>
                    member.user_id !==
                    currentUser.id
            );


        if (!adminMember) {
            return;
        }


        const {
            data: adminProfile,
            error: adminError
        } =
            await db
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    adminMember.user_id
                )
                .maybeSingle();


        if (adminError) {

            console.error(
                "Load admin profile error:",
                adminError
            );

            showChatError(
                adminError.message
            );

            return;
        }


        if (!adminProfile) {
            return;
        }


        profileCache.set(
            adminProfile.id,
            adminProfile
        );


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "customer-button";


        button.dataset.customerId =
            adminProfile.id;


        button.textContent =
            adminProfile.display_name ||
            "مدير";


        button.addEventListener(
            "click",
            () => {

                openCustomerPrivateConversation();
            }
        );


        customersList.appendChild(
            button
        );
    }
}
/* =========================================================
   MESSAGES
========================================================= */

async function loadMessages() {

    if (
        !db ||
        !currentConversation ||
        !messagesContainer
    ) {
        return;
    }

    const conversationId =
        currentConversation.id;

    messagesContainer.innerHTML = "";
    reactionCache.clear();

    const {
        data,
        error
    } =
        await db
            .from("messages")
            .select("*")
            .eq(
                "conversation_id",
                conversationId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (error) {
        console.error(
            "Load messages error:",
            error
        );

        showChatError(
            error.message
        );

        return;
    }

    /*
     * إذا انتقل المستخدم إلى محادثة أخرى
     * أثناء تحميل الرسائل، لا نعرض نتائج
     * المحادثة القديمة.
     */
    if (
        !currentConversation ||
        currentConversation.id !== conversationId
    ) {
        return;
    }

    const messages =
        Array.isArray(data)
            ? data
            : [];

    await loadReplyMessages(
        messages
    );

    /*
     * تحقق مرة ثانية بعد العمليات غير المتزامنة.
     */
    if (
        !currentConversation ||
        currentConversation.id !== conversationId
    ) {
        return;
    }

    for (
        const message of messages
    ) {

        await renderMessage(
            message
        );
    }

    await restorePinnedMessage(
        messages
    );

    scrollMessagesToBottom();
}


async function loadReplyMessages(
    messages
) {

    if (
        !Array.isArray(messages) ||
        messages.length === 0
    ) {

        return;
    }


    const replyIds =
        messages
            .map(
                message =>
                    message.reply_to_message_id
            )
            .filter(Boolean);


    if (replyIds.length === 0) {
        return;
    }


    const uniqueIds =
        [
            ...new Set(replyIds)
        ];


    const {
        data,
        error
    } =
        await db
            .from("messages")
            .select("*")
            .in(
                "id",
                uniqueIds
            );


    if (error) {

        console.warn(
            "Load reply messages error:",
            error
        );

        return;
    }


    const replyMap =
        new Map(
            (data || []).map(
                message => [
                    message.id,
                    message
                ]
            )
        );


    for (
        const message of messages
    ) {

        if (
            message.reply_to_message_id
        ) {

            message.replyMessage =
                replyMap.get(
                    message.reply_to_message_id
                ) || null;
        }
    }
}


/* =========================================================
   RENDER MESSAGE
========================================================= */

async function renderMessage(
    message
) {

    if (
        !messagesContainer ||
        !message
    ) {

        return;
    }


    const existing =
        messagesContainer.querySelector(
            `[data-message-id="${cssEscape(
                message.id
            )}"]`
        );


    existing?.remove();


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "message";


    wrapper.dataset.messageId =
        message.id;


    const isMine =
        message.sender_id ===
        currentUser?.id;


    if (isMine) {

        wrapper.classList.add(
            "own"
        );
    }


    const sender =
        await getProfile(
            message.sender_id
        );


    const senderName =
        sender?.display_name ||
        "مستخدم";


    const messageBubble =
        document.createElement(
            "div"
        );


    messageBubble.className =
        "message-bubble";


    if (message.replyMessage) {

        const replyBox =
            document.createElement(
                "div"
            );


        replyBox.className =
            "message-reply";


        const replySender =
            await getProfile(
                message.replyMessage.sender_id
            );


        const replySenderName =
            replySender?.display_name ||
            "مستخدم";


        const replyContent =
            getMessagePreview(
                message.replyMessage
            );


        replyBox.innerHTML = `
            <div class="reply-sender">
                ${escapeHtml(
                    replySenderName
                )}
            </div>

            <div class="reply-content">
                ${escapeHtml(
                    replyContent
                )}
            </div>
        `;


        messageBubble.appendChild(
            replyBox
        );
    }


    const senderElement =
        document.createElement(
            "div"
        );


    senderElement.className =
        "message-sender";


    senderElement.textContent =
        senderName;


    if (
        currentProfile?.role === "admin" &&
        sender?.role === "customer" &&
        message.sender_id !== currentUser?.id
    ) {

        senderElement.classList.add(
            "clickable"
        );


        senderElement.title =
            "فتح محادثة خاصة";


        senderElement.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                openPrivateConversation(
                    sender
                );
            }
        );
    }


    messageBubble.appendChild(
        senderElement
    );


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "message-content";


    if (
        message.message_type === "image"
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.className =
            "message-image";


        image.alt =
            message.content ||
            "صورة";


        try {

            const url =
                await signedUrl(
                    message.file_path
                );


            if (url) {

                image.src =
                    url;
            }

        } catch (error) {

            console.error(
                "Image URL error:",
                error
            );
        }


        content.appendChild(
            image
        );

    } else if (
        message.message_type === "audio"
    ) {

        const audio =
            document.createElement(
                "audio"
            );


        audio.controls = true;

        audio.preload =
            "metadata";


        try {

            const url =
                await signedUrl(
                    message.file_path
                );


            if (url) {

                audio.src =
                    url;
            }

        } catch (error) {

            console.error(
                "Audio URL error:",
                error
            );
        }


        content.appendChild(
            audio
        );


        if (message.content) {

            const audioName =
                document.createElement(
                    "div"
                );


            audioName.className =
                "audio-name";


            audioName.textContent =
                message.content;


            content.appendChild(
                audioName
            );
        }

    } else {

        content.textContent =
            message.content || "";
    }


    messageBubble.appendChild(
        content
    );


    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "message-footer";


    const date =
        document.createElement(
            "span"
        );


    date.className =
        "message-date";


    date.textContent =
        formatDate(
            message.created_at
        );


    footer.appendChild(
        date
    );


    messageBubble.appendChild(
        footer
    );


    const reactions =
        document.createElement(
            "div"
        );


    reactions.className =
        "message-reactions";


    await renderReactionSummary(
        message,
        reactions
    );


    messageBubble.appendChild(
        reactions
    );


    messageBubble.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".reaction-trigger"
                ) ||
                event.target.closest(
                    ".reaction-picker"
                ) ||
                event.target.closest(
                    ".message-sender"
                ) ||
                event.target.closest(
                    "audio"
                ) ||
                event.target.closest(
                    "img"
                )
            ) {

                return;
            }


            event.preventDefault();

            event.stopPropagation();


            openMessageMenu(
                message,
                event.clientX,
                event.clientY
            );
        }
    );


    messageBubble.addEventListener(
        "contextmenu",
        event => {

            event.preventDefault();

            event.stopPropagation();


            openMessageMenu(
                message,
                event.clientX,
                event.clientY
            );
        }
    );


    wrapper.appendChild(
        messageBubble
    );


    messagesContainer.appendChild(
        wrapper
    );
}


/* =========================================================
   MESSAGE MENU
========================================================= */

function openMessageMenu(
    message,
    x,
    y
) {

    closeContextMenu();

    closeAllReactionPickers();


    contextMenu =
        document.createElement(
            "div"
        );


    contextMenu.className =
        "message-context-menu";


    const isMine =
        message.sender_id ===
        currentUser?.id;


    const canDelete =
        isMine ||
        currentProfile?.role ===
            "admin";


    const pinned =
        isPinnedMessage(
            message
        );


    contextMenu.innerHTML = `
        <button
            type="button"
            data-action="copy"
        >
            نسخ
        </button>

        <button
            type="button"
            data-action="reply"
        >
            رد
        </button>

        <button
            type="button"
            data-action="reaction"
        >
            تفاعل
        </button>

        <button
            type="button"
            data-action="pin"
        >
            ${
                pinned
                    ? "فك التثبيت"
                    : "تثبيت الرسالة"
            }
        </button>

        ${
            canDelete
                ? `
                    <button
                        type="button"
                        data-action="delete"
                        class="danger"
                    >
                        حذف
                    </button>
                `
                : ""
        }
    `;


    document.body.appendChild(
        contextMenu
    );


    contextMenu
        .querySelector(
            '[data-action="copy"]'
        )
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeContextMenu();

                copyMessage(
                    message
                );
            }
        );


    contextMenu
        .querySelector(
            '[data-action="reply"]'
        )
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeContextMenu();

                startReply(
                    message
                );
            }
        );


    contextMenu
        .querySelector(
            '[data-action="reaction"]'
        )
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeContextMenu();

                showReactionPickerForMessage(
                    message
                );
            }
        );


    contextMenu
        .querySelector(
            '[data-action="pin"]'
        )
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeContextMenu();


                if (
                    isPinnedMessage(
                        message
                    )
                ) {

                    unpinMessage(
                        currentConversation?.id
                    );

                } else {

                    pinMessage(
                        message
                    );
                }
            }
        );


    contextMenu
        .querySelector(
            '[data-action="delete"]'
        )
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                closeContextMenu();

                deleteMessage(
                    message
                );
            }
        );


    positionContextMenu(
        x,
        y
    );
}


function positionContextMenu(
    x,
    y
) {

    if (!contextMenu) {
        return;
    }


    const rect =
        contextMenu.getBoundingClientRect();


    let left =
        Number.isFinite(x)
            ? x
            : window.innerWidth / 2;


    let top =
        Number.isFinite(y)
            ? y
            : window.innerHeight / 2;


    if (
        left + rect.width >
        window.innerWidth
    ) {

        left =
            window.innerWidth -
            rect.width -
            8;
    }


    if (
        top + rect.height >
        window.innerHeight
    ) {

        top =
            window.innerHeight -
            rect.height -
            8;
    }


    contextMenu.style.left =
        `${Math.max(8, left)}px`;


    contextMenu.style.top =
        `${Math.max(8, top)}px`;
}


function closeContextMenu() {

    if (contextMenu) {

        contextMenu.remove();

        contextMenu = null;
    }
}


/* =========================================================
   COPY
========================================================= */

async function copyMessage(
    message
) {

    const text =
        getMessagePreview(
            message
        );


    if (!text) {
        return;
    }


    try {

        if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText ===
                "function"
        ) {

            await navigator.clipboard.writeText(
                text
            );

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                text;


            textarea.style.position =
                "fixed";


            textarea.style.opacity =
                "0";


            document.body.appendChild(
                textarea
            );


            textarea.select();


            document.execCommand(
                "copy"
            );


            textarea.remove();
        }

    } catch (error) {

        console.error(
            "Copy error:",
            error
        );
    }
}


/* =========================================================
   DELETE
========================================================= */

async function deleteMessage(
    message
) {

    if (
        !db ||
        !message?.id
    ) {

        return;
    }


    const isMine =
        message.sender_id ===
        currentUser?.id;


    const isAdmin =
        currentProfile?.role ===
        "admin";


    if (
        !isMine &&
        !isAdmin
    ) {

        return;
    }


    const confirmed =
        window.confirm(
            "هل أنت متأكد من حذف هذه الرسالة؟"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await db
            .from("messages")
            .delete()
            .eq(
                "id",
                message.id
            );


    if (error) {

        console.error(
            "Delete message error:",
            error
        );

        showChatError(
            error.message
        );

        return;
    }


    if (
        isPinnedMessage(
            message
        )
    ) {

        unpinMessage(
            currentConversation?.id
        );
    }


    document
        .querySelector(
            `[data-message-id="${cssEscape(
                message.id
            )}"]`
        )
        ?.remove();
}


/* =========================================================
   REPLY
========================================================= */

async function startReply(
    message
) {

    if (!message) {
        return;
    }


    replyingToMessage =
        message;


    if (replyPreview) {

        replyPreview.classList.remove(
            "hidden"
        );
    }


    const sender =
        await getProfile(
            message.sender_id
        );


    const senderName =
        sender?.display_name ||
        "مستخدم";


    if (replyPreviewSender) {

        replyPreviewSender.textContent =
            `الرد على ${senderName}`;
    }


    if (replyPreviewText) {

        replyPreviewText.textContent =
            getMessagePreview(
                message
            );
    }


    messageInput?.focus();
}


function cancelReply() {

    replyingToMessage =
        null;


    if (replyPreview) {

        replyPreview.classList.add(
            "hidden"
        );
    }


    if (replyPreviewSender) {

        replyPreviewSender.textContent =
            "الرد على";
    }


    if (replyPreviewText) {

        replyPreviewText.textContent =
            "";
    }
}


function ensureReplyPreview() {

    if (
        replyPreview &&
        replyPreviewSender &&
        replyPreviewText &&
        cancelReplyButton
    ) {

        return;
    }


    const form =
        messageForm;


    if (!form) {
        return;
    }


    if (!replyPreview) {

        replyPreview =
            document.createElement(
                "div"
            );


        replyPreview.id =
            "replyPreview";


        replyPreview.className =
            "reply-preview hidden";


        replyPreview.innerHTML = `
            <div class="reply-preview-content">

                <span class="reply-preview-icon">
                    ↩
                </span>

                <div class="reply-preview-text">

                    <strong id="replyPreviewSender">
                        الرد على
                    </strong>

                    <span id="replyPreviewContent"></span>

                </div>

            </div>

            <button
                type="button"
                id="cancelReplyButton"
                aria-label="إلغاء الرد"
            >
                ×
            </button>
        `;


        form.parentElement?.insertBefore(
            replyPreview,
            form
        );
    }


    if (!replyPreviewSender) {

        replyPreviewSender =
            replyPreview.querySelector(
                "#replyPreviewSender"
            );
    }


    if (!replyPreviewText) {

        replyPreviewText =
            replyPreview.querySelector(
                "#replyPreviewContent"
            );
    }


    if (!cancelReplyButton) {

        cancelReplyButton =
            replyPreview.querySelector(
                "#cancelReplyButton"
            );
    }


    if (
        cancelReplyButton &&
        !cancelReplyButton.dataset.bound
    ) {

        cancelReplyButton.dataset.bound =
            "true";

        cancelReplyButton.addEventListener(
            "click",
            cancelReply
        );
    }
}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(
    event
) {

    event?.preventDefault();


    if (
        !db ||
        !currentUser ||
        !currentConversation
    ) {

        return;
    }


    const text =
        messageInput?.value?.trim() ||
        "";


    if (selectedImage) {

        const file =
            selectedImage;


        selectedImage = null;

        clearFilePreview();


        await uploadImage(
            file,
            text
        );

        return;
    }


    if (!text) {
        return;
    }


    setMessageSending(true);


    try {

        const payload = {

            conversation_id:
                currentConversation.id,

            sender_id:
                currentUser.id,

            content:
                text,

            message_type:
                "text"
        };


        /*
         * الاسم الصحيح في قاعدة البيانات:
         * reply_to_message_id
         */
        if (
            replyingToMessage?.id
        ) {

            payload.reply_to_message_id =
                replyingToMessage.id;
        }


        const {
            error
        } =
            await db
                .from("messages")
                .insert(
                    payload
                );


        if (error) {
            throw error;
        }


        if (messageInput) {

            messageInput.value =
                "";
        }


        cancelReply();

    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        showChatError(
            error.message
        );

    } finally {

        setMessageSending(false);
    }
}


/* =========================================================
   IMAGE
========================================================= */

function handleImageSelection(
    event
) {

    const file =
        event.target?.files?.[0];


    if (!file) {

        selectedImage = null;

        clearFilePreview();

        return;
    }


    if (
        !file.type.startsWith("image/")
    ) {

        showChatError(
            "الملف المحدد ليس صورة."
        );

        clearFilePreview();

        return;
    }


    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        showChatError(
            "حجم الصورة يجب ألا يتجاوز 10MB."
        );

        clearFilePreview();

        return;
    }


    selectedImage =
        file;


    showFilePreview(
        file
    );
}


function showFilePreview(
    file
) {

    if (!filePreview) {
        return;
    }


    filePreview.innerHTML = `
        <div class="file-preview-item">

            <span>
                ${escapeHtml(
                    file.name
                )}
            </span>

            <button
                type="button"
                id="clear-file-preview"
            >
                ×
            </button>

        </div>
    `;


    filePreview.classList.remove(
        "hidden"
    );


    filePreview
        .querySelector(
            "#clear-file-preview"
        )
        ?.addEventListener(
            "click",
            clearFilePreview
        );
}


function clearFilePreview() {

    selectedImage = null;


    if (imageInput) {

        imageInput.value = "";
    }


    if (filePreview) {

        filePreview.innerHTML = "";

        filePreview.classList.add(
            "hidden"
        );
    }
}


async function uploadImage(
    file,
    caption = ""
) {

    if (
        !db ||
        !currentUser ||
        !currentConversation ||
        !file
    ) {

        return;
    }


    setMessageSending(true);


    const path =
        buildStoragePath(
            "images",
            file.name
        );


    try {

        const {
            error: uploadError
        } =
            await db
                .storage
                .from("chat-files")
                .upload(
                    path,
                    file,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type ||
                            "application/octet-stream"
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        const payload = {

            conversation_id:
                currentConversation.id,

            sender_id:
                currentUser.id,

            content:
                caption ||
                file.name,

            message_type:
                "image",

            file_path:
                path
        };


        if (
            replyingToMessage?.id
        ) {

            payload.reply_to_message_id =
                replyingToMessage.id;
        }


        const {
            error: insertError
        } =
            await db
                .from("messages")
                .insert(
                    payload
                );


        if (insertError) {

            try {

                await db
                    .storage
                    .from("chat-files")
                    .remove([
                        path
                    ]);

            } catch (removeError) {

                console.warn(
                    removeError
                );
            }


            throw insertError;
        }


        if (messageInput) {

            messageInput.value =
                "";
        }


        cancelReply();

    } catch (error) {

        console.error(
            "Upload image error:",
            error
        );


        showChatError(
            error.message
        );


        selectedImage =
            file;


        showFilePreview(
            file
        );

    } finally {

        setMessageSending(false);
    }
}


/* =========================================================
   AUDIO
========================================================= */

async function toggleRecording() {

    if (mediaRecorder) {

        stopRecording();

    } else {

        await startRecording();
    }
}


async function startRecording() {

    if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !==
            "function"
    ) {

        showChatError(
            "المتصفح لا يدعم تسجيل الصوت."
        );

        return;
    }


    if (
        typeof MediaRecorder ===
        "undefined"
    ) {

        showChatError(
            "MediaRecorder غير مدعوم في هذا المتصفح."
        );

        return;
    }


    if (
        !currentUser ||
        !currentConversation
    ) {

        return;
    }


    try {

        recordingStream =
            await navigator.mediaDevices.getUserMedia(
                {
                    audio: true
                }
            );


        const mimeTypes = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus",
            "audio/mp4"
        ];


        let mimeType = "";


        for (
            const type of mimeTypes
        ) {

            if (
                MediaRecorder.isTypeSupported(
                    type
                )
            ) {

                mimeType =
                    type;

                break;
            }
        }


        mediaRecorder =
            mimeType
                ? new MediaRecorder(
                      recordingStream,
                      {
                          mimeType
                      }
                  )
                : new MediaRecorder(
                      recordingStream
                  );


        recordingChunks = [];


        const recordingConversationId =
            currentConversation.id;


        const recordingUserId =
            currentUser.id;


        const recordingReplyId =
            replyingToMessage?.id ||
            null;


        mediaRecorder.ondataavailable =
            event => {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    recordingChunks.push(
                        event.data
                    );
                }
            };


        mediaRecorder.onstop =
            async () => {

                const chunks =
                    recordingChunks;


                recordingChunks = [];


                const recorder =
                    mediaRecorder;


                mediaRecorder = null;


                recordingStream
                    ?.getTracks()
                    .forEach(
                        track => {

                            try {
                                track.stop();
                            } catch (error) {
                                console.warn(error);
                            }
                        }
                    );


                recordingStream = null;


                updateRecordButton(false);


                if (!chunks.length) {
                    return;
                }


                const blob =
                    new Blob(
                        chunks,
                        {
                            type:
                                recorder?.mimeType ||
                                "audio/webm"
                        }
                    );


                await uploadAudio(
                    blob,
                    recordingConversationId,
                    recordingUserId,
                    recordingReplyId
                );
            };


        mediaRecorder.onerror =
            event => {

                console.error(
                    "MediaRecorder error:",
                    event
                );


                showChatError(
                    "حدث خطأ أثناء تسجيل الصوت."
                );


                cleanupRecording();
            };


        mediaRecorder.start();


        updateRecordButton(true);

    } catch (error) {

        console.error(
            "Start recording error:",
            error
        );


        cleanupRecording();


        if (
            error?.name ===
            "NotAllowedError"
        ) {

            showChatError(
                "تم رفض صلاحية الميكروفون."
            );

        } else {

            showChatError(
                "تعذر تشغيل تسجيل الصوت."
            );
        }
    }
}


function stopRecording() {

    if (!mediaRecorder) {
        return;
    }


    try {

        mediaRecorder.stop();

    } catch (error) {

        console.error(
            "Stop recording error:",
            error
        );

        cleanupRecording();
    }
}


function cleanupRecording() {

    try {

        if (
            mediaRecorder &&
            mediaRecorder.state !==
                "inactive"
        ) {

            mediaRecorder.stop();
        }

    } catch (error) {

        console.warn(error);
    }


    mediaRecorder = null;

    recordingChunks = [];


    recordingStream
        ?.getTracks()
        .forEach(
            track => {

                try {
                    track.stop();
                } catch (error) {
                    console.warn(error);
                }
            }
        );


    recordingStream = null;


    updateRecordButton(false);
}


async function uploadAudio(
    blob,
    conversationId,
    userId,
    replyId = null
) {

    if (
        !db ||
        !blob ||
        !conversationId ||
        !userId
    ) {

        return;
    }


    setMessageSending(true);


    const extension =
        getAudioExtension(
            blob.type
        );


    const path =
        buildStoragePath(
            "audio",
            `recording.${extension}`
        );


    try {

        const {
            error: uploadError
        } =
            await db
                .storage
                .from("chat-files")
                .upload(
                    path,
                    blob,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            blob.type ||
                            "audio/webm"
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        const payload = {

            conversation_id:
                conversationId,

            sender_id:
                userId,

            content:
                "رسالة صوتية",

            message_type:
                "audio",

            file_path:
                path
        };


        if (replyId) {

            payload.reply_to_message_id =
                replyId;
        }


        const {
            error: insertError
        } =
            await db
                .from("messages")
                .insert(
                    payload
                );


        if (insertError) {

            try {

                await db
                    .storage
                    .from("chat-files")
                    .remove([
                        path
                    ]);

            } catch (removeError) {

                console.warn(
                    removeError
                );
            }


            throw insertError;
        }


        if (
            conversationId ===
            currentConversation?.id
        ) {

            cancelReply();
        }

    } catch (error) {

        console.error(
            "Upload audio error:",
            error
        );


        showChatError(
            error.message
        );

    } finally {

        setMessageSending(false);
    }
}


function updateRecordButton(
    recording
) {

    if (!recordButton) {
        return;
    }


    recordButton.classList.toggle(
        "recording",
        recording
    );


    recordButton.setAttribute(
        "aria-label",
        recording
            ? "إيقاف التسجيل"
            : "تسجيل صوت"
    );


    recordButton.title =
        recording
            ? "إيقاف التسجيل"
            : "تسجيل صوت";


    recordButton.textContent =
        recording
            ? "⏹"
            : "🎙";
}


/* =========================================================
   REACTIONS
========================================================= */

const REACTIONS = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "😡"
];


async function renderReactionSummary(
    message,
    container
) {

    if (
        !message ||
        !container
    ) {

        return;
    }


    const reactions =
        await loadReactions(
            message.id
        );


    const counts =
        new Map();


    for (
        const reaction of reactions
    ) {

        const value =
            reaction.reaction;


        counts.set(
            value,
            (counts.get(value) || 0) + 1
        );
    }


    for (
        const [
            reaction,
            count
        ] of counts
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "reaction-summary";


        button.dataset.reaction =
            reaction;


        button.title =
            `${reaction} ${count}`;


        button.textContent =
            `${reaction} ${count}`;


        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                event.stopPropagation();


                await toggleReaction(
                    message,
                    reaction
                );
            }
        );


        container.appendChild(
            button
        );
    }


    const addButton =
        document.createElement(
            "button"
        );


    addButton.type = "button";

    addButton.className =
        "reaction-trigger";


    addButton.textContent = "＋";

    addButton.title =
        "إضافة تفاعل";


    addButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            showReactionPicker(
                message,
                addButton
            );
        }
    );


    container.appendChild(
        addButton
    );
}


async function loadReactions(
    messageId
) {

    if (
        reactionCache.has(
            messageId
        )
    ) {

        return reactionCache.get(
            messageId
        );
    }


    const {
        data,
        error
    } =
        await db
            .from("message_reactions")
            .select("*")
            .eq(
                "message_id",
                messageId
            );


    if (error) {

        console.warn(
            "Load reactions error:",
            error
        );


        reactionCache.set(
            messageId,
            []
        );


        return [];
    }


    const reactions =
        Array.isArray(data)
            ? data
            : [];


    reactionCache.set(
        messageId,
        reactions
    );


    return reactions;
}


function showReactionPicker(
    message,
    anchor
) {

    closeAllReactionPickers();


    const picker =
        document.createElement(
            "div"
        );


    picker.className =
        "reaction-picker";


    for (
        const reaction of REACTIONS
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "reaction-option";


        button.textContent =
            reaction;


        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                event.stopPropagation();


                picker.remove();


                await toggleReaction(
                    message,
                    reaction
                );
            }
        );


        picker.appendChild(
            button
        );
    }


    document.body.appendChild(
        picker
    );


    const rect =
        anchor.getBoundingClientRect();


    let left =
        rect.left;


    let top =
        rect.bottom + 5;


    const pickerRect =
        picker.getBoundingClientRect();


    if (
        left + pickerRect.width >
        window.innerWidth
    ) {

        left =
            window.innerWidth -
            pickerRect.width -
            8;
    }


    if (
        top + pickerRect.height >
        window.innerHeight
    ) {

        top =
            rect.top -
            pickerRect.height -
            5;
    }


    picker.style.left =
        `${Math.max(8, left)}px`;


    picker.style.top =
        `${Math.max(8, top)}px`;
}


function showReactionPickerForMessage(
    message
) {

    const element =
        document.querySelector(
            `[data-message-id="${cssEscape(
                message.id
            )}"]`
        );


    const button =
        element?.querySelector(
            ".reaction-trigger"
        );


    if (button) {

        showReactionPicker(
            message,
            button
        );
    }
}


function closeAllReactionPickers() {

    document
        .querySelectorAll(
            ".reaction-picker"
        )
        .forEach(
            picker =>
                picker.remove()
        );
}


async function toggleReaction(
    message,
    reaction
) {

    if (
        !db ||
        !currentUser ||
        !message?.id
    ) {

        return;
    }


    try {

        const {
            data: existing,
            error: findError
        } =
            await db
                .from("message_reactions")
                .select("id,reaction")
                .eq(
                    "message_id",
                    message.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .limit(1)
                .maybeSingle();


        if (findError) {
            throw findError;
        }


        if (existing) {

            if (
                existing.reaction ===
                reaction
            ) {

                const {
                    error
                } =
                    await db
                        .from(
                            "message_reactions"
                        )
                        .delete()
                        .eq(
                            "id",
                            existing.id
                        );


                if (error) {
                    throw error;
                }

            } else {

                const {
                    error
                } =
                    await db
                        .from(
                            "message_reactions"
                        )
                        .update({
                            reaction
                        })
                        .eq(
                            "id",
                            existing.id
                        );


                if (error) {
                    throw error;
                }
            }

        } else {

            const {
                error
            } =
                await db
                    .from(
                        "message_reactions"
                    )
                    .insert({
                        message_id:
                            message.id,

                        user_id:
                            currentUser.id,

                        reaction
                    });


            if (error) {
                throw error;
            }
        }


        reactionCache.delete(
            message.id
        );


        await refreshRenderedMessage(
            message.id
        );

    } catch (error) {

        console.error(
            "Toggle reaction error:",
            error
        );


        showChatError(
            error.message
        );
    }
}


async function refreshRenderedMessage(
    messageId
) {

    if (
        !currentConversation ||
        !messagesContainer ||
        !db
    ) {

        return;
    }


    const {
        data: message,
        error
    } =
        await db
            .from("messages")
            .select("*")
            .eq(
                "id",
                messageId
            )
            .maybeSingle();


    if (error) {

        console.warn(error);

        return;
    }


    if (!message) {
        return;
    }


    const {
        data: replyMessage
    } =
        message.reply_to_message_id
            ? await db
                  .from("messages")
                  .select("*")
                  .eq(
                      "id",
                      message.reply_to_message_id
                  )
                  .maybeSingle()
            : {
                  data: null
              };


    message.replyMessage =
        replyMessage || null;


    await renderMessage(
        message
    );
}


/* =========================================================
   PINNED MESSAGES
========================================================= */

function getPinnedStorageKey(
    conversationId
) {

    return `pinned_message_${conversationId}`;
}


function getPinnedMessage(
    conversationId
) {

    if (!conversationId) {
        return null;
    }


    try {

        const value =
            localStorage.getItem(
                getPinnedStorageKey(
                    conversationId
                )
            );


        if (!value) {
            return null;
        }


        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "Read pinned message error:",
            error
        );


        return null;
    }
}


function savePinnedMessage(
    conversationId,
    message
) {

    if (
        !conversationId ||
        !message
    ) {

        return;
    }


    try {

        localStorage.setItem(
            getPinnedStorageKey(
                conversationId
            ),
            JSON.stringify(
                message
            )
        );

    } catch (error) {

        console.warn(
            "Save pinned message error:",
            error
        );
    }
}


function removePinnedStorage(
    conversationId
) {

    if (!conversationId) {
        return;
    }


    try {

        localStorage.removeItem(
            getPinnedStorageKey(
                conversationId
            )
        );

    } catch (error) {

        console.warn(
            "Remove pinned message error:",
            error
        );
    }
}


function isPinnedMessage(
    message
) {

    if (
        !currentConversation ||
        !message
    ) {

        return false;
    }


    const pinned =
        getPinnedMessage(
            currentConversation.id
        );


    return (
        pinned?.id ===
        message.id
    );
}


function pinMessage(
    message,
    isRestoring = false
) {

    if (
        !currentConversation ||
        !message
    ) {

        return;
    }


    savePinnedMessage(
        currentConversation.id,
        message
    );


    renderPinnedBanner(
        message
    );


    if (!isRestoring) {

        scrollToMessage(
            message.id
        );
    }
}


function unpinMessage(
    conversationId =
        currentConversation?.id
) {

    removePinnedStorage(
        conversationId
    );


    removePinnedBanner();
}


function removePinnedBanner() {

    document
        .querySelector(
            ".pinned-message-banner"
        )
        ?.remove();
}


async function restorePinnedMessage(
    messages
) {

    if (!currentConversation) {
        return;
    }


    const pinned =
        getPinnedMessage(
            currentConversation.id
        );


    if (!pinned?.id) {

        removePinnedBanner();

        return;
    }


    const actualMessage =
        messages.find(
            message =>
                message.id ===
                pinned.id
        );


    if (!actualMessage) {

        removePinnedStorage(
            currentConversation.id
        );


        removePinnedBanner();

        return;
    }


    await renderPinnedBanner(
        actualMessage
    );
}


async function renderPinnedBanner(
    message
) {

    removePinnedBanner();


    const header =
        document.querySelector(
            ".chat-header"
        );


    if (!header) {
        return;
    }


    const sender =
        await getProfile(
            message.sender_id
        );


    const senderName =
        sender?.display_name ||
        "مستخدم";


    const preview =
        getMessagePreview(
            message
        );


    const banner =
        document.createElement(
            "div"
        );


    banner.className =
        "pinned-message-banner";


    banner.innerHTML = `
        <div class="pinned-message-content">

            <strong>
                رسالة مثبتة
            </strong>

            <span>
                ${escapeHtml(
                    senderName
                )}: ${escapeHtml(
                    preview
                )}
            </span>

        </div>

        <button
            type="button"
            class="unpin-message-button"
            aria-label="فك التثبيت"
        >
            ×
        </button>
    `;


    header.insertAdjacentElement(
        "afterend",
        banner
    );


    banner
        .querySelector(
            ".unpin-message-button"
        )
        ?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();


                unpinMessage(
                    currentConversation?.id
                );
            }
        );


    banner.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".unpin-message-button"
                )
            ) {

                return;
            }


            scrollToMessage(
                message.id
            );
        }
    );
}


function scrollToMessage(
    messageId
) {

    const element =
        document.querySelector(
            `[data-message-id="${cssEscape(
                messageId
            )}"]`
        );


    if (!element) {
        return;
    }


    element.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    element.classList.add(
        "message-highlight"
    );


    setTimeout(() => {

        element.classList.remove(
            "message-highlight"
        );

    }, 1500);
}


/* =========================================================
   REALTIME
========================================================= */

async function subscribeRealtime(
    conversationId
) {

    if (!db || !conversationId) {
        return;
    }


    if (activeRealtimeChannel) {

        try {

            await db.removeChannel(
                activeRealtimeChannel
            );

        } catch (error) {

            console.warn(
                "Remove realtime channel error:",
                error
            );
        }


        activeRealtimeChannel = null;
    }


    const channelName =
        `conversation:${conversationId}:${Date.now()}`;


    const channel =
        db.channel(
            channelName
        );


    channel.on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "messages",
            filter:
                `conversation_id=eq.${conversationId}`
        },
        async payload => {

            await handleRealtimeMessage(
                payload
            );
        }
    );


    channel.on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table:
                "message_reactions"
        },
        async payload => {

            await handleRealtimeReaction(
                payload
            );
        }
    );


    channel.on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table:
                "conversations",
            filter:
                `id=eq.${conversationId}`
        },
        async () => {

            await loadConversations();
        }
    );


    channel.subscribe(
        status => {

            if (
                status ===
                "SUBSCRIBED"
            ) {

                activeRealtimeChannel =
                    channel;
            }


            if (
                status ===
                    "CHANNEL_ERROR" ||
                status ===
                    "TIMED_OUT"
            ) {

                console.error(
                    "Realtime status:",
                    status
                );
            }
        }
    );
}


async function handleRealtimeMessage(
    payload
) {

    if (
        !currentConversation ||
        !messagesContainer
    ) {

        return;
    }


    const newRecord =
        payload?.new;


    const oldRecord =
        payload?.old;


    const messageId =
        newRecord?.id ||
        oldRecord?.id;


    if (!messageId) {
        return;
    }


    if (
        payload.eventType ===
        "INSERT"
    ) {

        const existing =
            messagesContainer.querySelector(
                `[data-message-id="${cssEscape(
                    messageId
                )}"]`
            );


        if (existing) {
            return;
        }


        let message =
            newRecord;


        if (
            message?.reply_to_message_id
        ) {

            const {
                data: replyMessage
            } =
                await db
                    .from("messages")
                    .select("*")
                    .eq(
                        "id",
                        message.reply_to_message_id
                    )
                    .maybeSingle();


            message = {
                ...message,
                replyMessage:
                    replyMessage || null
            };
        }


        await renderMessage(
            message
        );


        scrollMessagesToBottom();

        return;
    }


    if (
        payload.eventType ===
        "UPDATE"
    ) {

        await refreshRenderedMessage(
            messageId
        );

        return;
    }


    if (
        payload.eventType ===
        "DELETE"
    ) {

        const saved =
            getPinnedMessage(
                currentConversation.id
            );


        if (
            saved?.id ===
            messageId
        ) {

            unpinMessage(
                currentConversation.id
            );
        }


        document
            .querySelector(
                `[data-message-id="${cssEscape(
                    messageId
                )}"]`
            )
            ?.remove();
    }
}


async function handleRealtimeReaction(
    payload
) {

    const record =
        payload?.new ||
        payload?.old;


    const messageId =
        record?.message_id;


    if (!messageId) {
        return;
    }


    const element =
        document.querySelector(
            `[data-message-id="${cssEscape(
                messageId
            )}"]`
        );


    if (!element) {
        return;
    }


    reactionCache.delete(
        messageId
    );


    await refreshRenderedMessage(
        messageId
    );
}


/* =========================================================
   PROFILE
========================================================= */

async function getProfile(
    userId
) {

    if (!userId) {
        return null;
    }


    if (
        profileCache.has(
            userId
        )
    ) {

        return profileCache.get(
            userId
        );
    }


    if (!db) {
        return null;
    }


    const {
        data,
        error
    } =
        await db
            .from("profiles")
            .select("*")
            .eq(
                "id",
                userId
            )
            .maybeSingle();


    if (error) {

        console.warn(
            "Get profile error:",
            error
        );


        return null;
    }


    if (data) {

        profileCache.set(
            userId,
            data
        );
    }


    return data;
}


/* =========================================================
   STORAGE
========================================================= */

async function signedUrl(
    path
) {

    if (
        !db ||
        !path
    ) {

        return null;
    }


    const {
        data,
        error
    } =
        await db
            .storage
            .from("chat-files")
            .createSignedUrl(
                path,
                60 * 60
            );


    if (error) {
        throw error;
    }


    return (
        data?.signedUrl ||
        null
    );
}


function buildStoragePath(
    folder,
    fileName
) {

    const safeName =
        sanitizeFileName(
            fileName
        );


    const id =
        createUniqueId();


    const userId =
        currentUser?.id ||
        "anonymous";


    return [
        folder,
        userId,
        `${Date.now()}_${id}_${safeName}`
    ].join("/");
}


function sanitizeFileName(
    fileName
) {

    const value =
        String(
            fileName ||
            "file"
        );


    return value
        .replace(
            /[^\w.\-]+/g,
            "_"
        )
        .slice(
            0,
            150
        );
}


function getAudioExtension(
    mimeType
) {

    const type =
        String(
            mimeType || ""
        ).toLowerCase();


    if (
        type.includes("ogg")
    ) {

        return "ogg";
    }


    if (
        type.includes("mp4")
    ) {

        return "m4a";
    }


    if (
        type.includes("mpeg")
    ) {

        return "mp3";
    }


    return "webm";
}


/* =========================================================
   UI
========================================================= */

function setLoginLoading(
    loading
) {

    if (!loginButton) {
        return;
    }


    loginButton.disabled =
        loading;


    loginButton.textContent =
        loading
            ? "جارٍ تسجيل الدخول..."
            : "تسجيل الدخول";
}


function setMessageSending(
    sending
) {

    if (sendButton) {

        sendButton.disabled =
            sending;
    }
}


function showLoginError(
    message
) {

    if (!loginError) {
        return;
    }


    loginError.textContent =
        message || "";


    loginError.classList.remove(
        "success"
    );


    loginError.classList.add(
        "error"
    );
}


function showLoginSuccess(
    message
) {

    if (!loginError) {
        return;
    }


    loginError.textContent =
        message || "";


    loginError.classList.remove(
        "error"
    );


    loginError.classList.add(
        "success"
    );
}


function clearLoginError() {

    if (!loginError) {
        return;
    }


    loginError.textContent =
        "";


    loginError.classList.remove(
        "error",
        "success"
    );
}


function showChatError(
    message
) {

    if (chatError) {

        chatError.textContent =
            message || "";


        chatError.classList.remove(
            "hidden"
        );


        setTimeout(() => {

            chatError?.classList.add(
                "hidden"
            );

        }, 5000);


        return;
    }


    if (messagesContainer) {

        const errorElement =
            document.createElement(
                "div"
            );


        errorElement.className =
            "chat-error";


        errorElement.textContent =
            message || "";


        messagesContainer.appendChild(
            errorElement
        );


        scrollMessagesToBottom();


        setTimeout(() => {

            errorElement.remove();

        }, 5000);
    }
}


function scrollMessagesToBottom() {

    if (!messagesContainer) {
        return;
    }


    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}


/* =========================================================
   FORMATTING
========================================================= */

function getMessagePreview(
    message
) {

    if (!message) {
        return "";
    }


    if (
        message.message_type ===
        "image"
    ) {

        return (
            message.content ||
            "صورة"
        );
    }


    if (
        message.message_type ===
        "audio"
    ) {

        return (
            message.content ||
            "رسالة صوتية"
        );
    }


    return (
        message.content ||
        ""
    );
}


function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    try {

        return new Intl.DateTimeFormat(
            "ar-DZ",
            {
                dateStyle:
                    "short",

                timeStyle:
                    "short"
            }
        ).format(date);

    } catch (error) {

        return date.toLocaleString();
    }
}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function cssEscape(
    value
) {

    const stringValue =
        String(
            value ?? ""
        );


    if (
        window.CSS &&
        typeof window.CSS.escape ===
            "function"
    ) {

        return window.CSS.escape(
            stringValue
        );
    }


    return stringValue.replace(
        /[^a-zA-Z0-9_-]/g,
        character =>
            `\\${character}`
    );
}


function createUniqueId() {

    if (
        typeof crypto !==
            "undefined" &&
        typeof crypto.randomUUID ===
            "function"
    ) {

        return crypto.randomUUID();
    }


    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}


/* =========================================================
   AUTH ERROR MESSAGES
========================================================= */

function authMessage(
    error
) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "يجب تأكيد البريد الإلكتروني أولًا.";
    }


    if (
        message.includes(
            "user not found"
        )
    ) {

        return "المستخدم غير موجود.";
    }


    if (
        message.includes("password") &&
        message.includes("short")
    ) {

        return "كلمة المرور قصيرة جدًا.";
    }


    if (
        message.includes("rate limit")
    ) {

        return "تم تجاوز عدد المحاولات المسموح بها. حاول لاحقًا.";
    }


    return (
        error?.message ||
        "حدث خطأ غير متوقع."
    );
}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        try {

            recordingStream
                ?.getTracks()
                .forEach(
                    track =>
                        track.stop()
                );

        } catch (error) {

            console.warn(error);
        }


        try {

            if (
                activeRealtimeChannel &&
                db
            ) {

                db.removeChannel(
                    activeRealtimeChannel
                );
            }

        } catch (error) {

            console.warn(error);
        }


        try {

            authSubscription?.unsubscribe?.();

        } catch (error) {

            console.warn(error);
        }
    }
);
