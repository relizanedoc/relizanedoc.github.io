"use strict";

/* =========================================================
   SUPABASE
========================================================= */

const { createClient } = window.supabase;

if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    throw new Error(
        "SUPABASE_URL أو SUPABASE_ANON_KEY غير موجود في config.js"
    );
}

const db = createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);

/* =========================================================
   DOM
========================================================= */

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const forgotPasswordButton =
    document.getElementById("forgotPasswordButton");

const loginError = document.getElementById("loginError");

const groupButton =
    document.getElementById("groupButton");

const customersList =
    document.getElementById("customersList");

const logoutButton =
    document.getElementById("logoutButton");

const conversationTitle =
    document.getElementById("conversationTitle");

const conversationSubtitle =
    document.getElementById("conversationSubtitle");

const messagesContainer =
    document.getElementById("messages");

const filePreview =
    document.getElementById("filePreview");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const imageInput =
    document.getElementById("imageInput");

const recordButton =
    document.getElementById("recordButton");

/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentProfile = null;
let currentConversation = null;

let realtimeChannel = null;

let mediaRecorder = null;
let audioChunks = [];
let recording = false;

let selectedImage = null;

const profileCache = new Map();

const reactionCache = new Map();

const REACTIONS = [
    "❤️",
    "👍",
    "😂",
    "😮",
    "😢",
    "😡"
];

/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);

/* =========================================================
   INITIALIZE
========================================================= */

async function initialize() {

    try {

        loginButton?.addEventListener(
            "click",
            login
        );

        forgotPasswordButton?.addEventListener(
            "click",
            resetPassword
        );

        logoutButton?.addEventListener(
            "click",
            logout
        );

        groupButton?.addEventListener(
            "click",
            openGroupConversation
        );

        messageForm?.addEventListener(
            "submit",
            sendMessage
        );

        imageInput?.addEventListener(
            "change",
            handleImageSelection
        );

        recordButton?.addEventListener(
            "click",
            toggleRecording
        );

        messageInput?.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    messageForm.requestSubmit();
                }
            }
        );

        db.auth.onAuthStateChange(
            async function (event, session) {

                if (
                    event ===
                    "PASSWORD_RECOVERY"
                ) {

                    showPasswordUpdateScreen();

                    return;
                }

                if (
                    event === "SIGNED_IN"
                ) {

                    if (
                        session?.user &&
                        !currentUser
                    ) {

                        await startApplication(
                            session.user
                        );
                    }

                    return;
                }

                if (
                    event === "SIGNED_OUT"
                ) {

                    currentUser = null;
                    currentProfile = null;
                    currentConversation = null;

                    profileCache.clear();
                    reactionCache.clear();

                    if (realtimeChannel) {

                        await db.removeChannel(
                            realtimeChannel
                        );

                        realtimeChannel = null;
                    }

                    showLoginScreen();
                }
            }
        );

        const {
            data,
            error
        } = await db.auth.getSession();

        if (error) {

            console.error(
                "getSession error:",
                error
            );

            showLoginScreen();

            return;
        }

        if (data.session) {

            await startApplication(
                data.session.user
            );

        } else {

            showLoginScreen();
        }

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        showError(
            error.message ||
            "حدث خطأ أثناء تشغيل التطبيق."
        );
    }
}

/* =========================================================
   LOGIN
========================================================= */

async function login() {

    clearLoginError();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    if (!email) {

        showError(
            "أدخل البريد الإلكتروني."
        );

        emailInput.focus();

        return;
    }

    if (!password) {

        showError(
            "أدخل كلمة المرور."
        );

        passwordInput.focus();

        return;
    }

    setButtonLoading(
        loginButton,
        true,
        "جارٍ تسجيل الدخول..."
    );

    try {

        const {
            data,
            error
        } = await db.auth.signInWithPassword({
            email,
            password
        });

        if (error) {

            console.error(
                "Login error:",
                error
            );

            showError(
                getAuthErrorMessage(error)
            );

            return;
        }

        if (!data.session) {

            showError(
                "تعذر إنشاء جلسة تسجيل الدخول."
            );

            return;
        }

        await startApplication(
            data.user
        );

    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        showError(
            error.message ||
            "حدث خطأ أثناء تسجيل الدخول."
        );

    } finally {

        setButtonLoading(
            loginButton,
            false,
            "تسجيل الدخول"
        );
    }
}

/* =========================================================
   PASSWORD RESET
========================================================= */

async function resetPassword() {

    clearLoginError();

    const email =
        emailInput.value.trim();

    if (!email) {

        showError(
            "أدخل بريدك الإلكتروني أولاً."
        );

        emailInput.focus();

        return;
    }

    setButtonLoading(
        forgotPasswordButton,
        true,
        "جارٍ الإرسال..."
    );

    try {

        const redirectTo =
            window.location.origin + "/";

        const {
            error
        } = await db.auth.resetPasswordForEmail(
            email,
            {
                redirectTo
            }
        );

        if (error) {

            console.error(
                "Password reset error:",
                error
            );

            showError(
                getAuthErrorMessage(error)
            );

            return;
        }

        showSuccess(
            "تم إرسال رابط استرجاع كلمة المرور إلى بريدك الإلكتروني."
        );

    } catch (error) {

        console.error(
            "Unexpected password reset error:",
            error
        );

        showError(
            error.message ||
            "حدث خطأ أثناء إرسال رابط الاسترجاع."
        );

    } finally {

        setButtonLoading(
            forgotPasswordButton,
            false,
            "نسيت كلمة المرور؟"
        );
    }
}

/* =========================================================
   PASSWORD UPDATE
========================================================= */

function showPasswordUpdateScreen() {

    loginScreen.classList.remove("hidden");
    app.classList.add("hidden");

    const box =
        loginScreen.querySelector(".login-box");

    box.innerHTML = `

        <div class="logo">🔐</div>

        <h1>تغيير كلمة المرور</h1>

        <p>أدخل كلمة المرور الجديدة</p>

        <input
            id="newPassword"
            type="password"
            placeholder="كلمة المرور الجديدة"
            autocomplete="new-password"
        >

        <input
            id="confirmPassword"
            type="password"
            placeholder="تأكيد كلمة المرور"
            autocomplete="new-password"
        >

        <button
            id="updatePasswordButton"
            type="button"
        >
            حفظ كلمة المرور
        </button>

        <div id="passwordUpdateError"></div>

    `;

    const newPassword =
        document.getElementById("newPassword");

    const confirmPassword =
        document.getElementById("confirmPassword");

    const updateButton =
        document.getElementById(
            "updatePasswordButton"
        );

    const updateError =
        document.getElementById(
            "passwordUpdateError"
        );

    updateButton.addEventListener(
        "click",
        async function () {

            updateError.textContent = "";

            const password =
                newPassword.value;

            const confirmation =
                confirmPassword.value;

            if (!password) {

                updateError.textContent =
                    "أدخل كلمة المرور الجديدة.";

                return;
            }

            if (password.length < 6) {

                updateError.textContent =
                    "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";

                return;
            }

            if (password !== confirmation) {

                updateError.textContent =
                    "كلمتا المرور غير متطابقتين.";

                return;
            }

            updateButton.disabled = true;

            updateButton.textContent =
                "جارٍ الحفظ...";

            try {

                const {
                    error
                } = await db.auth.updateUser({
                    password
                });

                if (error) {

                    updateError.textContent =
                        getAuthErrorMessage(error);

                    return;
                }

                updateError.textContent =
                    "تم تغيير كلمة المرور بنجاح.";

                setTimeout(
                    async function () {

                        await db.auth.signOut();

                        window.location.reload();

                    },
                    1500
                );

            } catch (error) {

                console.error(
                    "Password update error:",
                    error
                );

                updateError.textContent =
                    error.message ||
                    "حدث خطأ أثناء تغيير كلمة المرور.";

            } finally {

                updateButton.disabled = false;

                updateButton.textContent =
                    "حفظ كلمة المرور";
            }
        }
    );
}

/* =========================================================
   START APPLICATION
========================================================= */

async function startApplication(user) {

    if (!user) {
        return;
    }

    currentUser = user;

    try {

        const {
            data,
            error
        } = await db
            .from("profiles")
            .select(
                "id, display_name, role"
            )
            .eq(
                "id",
                user.id
            )
            .single();

        if (error) {

            console.error(
                "Profile error:",
                error
            );

            showError(
                "تم تسجيل الدخول ولكن لم يتم العثور على ملف المستخدم في profiles."
            );

            return;
        }

        currentProfile = data;

        profileCache.set(
            data.id,
            data
        );

        showApplication();

        await loadCustomers();

        await openGroupConversation();

    } catch (error) {

        console.error(
            "Application startup error:",
            error
        );

        showError(
            error.message ||
            "حدث خطأ أثناء تشغيل التطبيق."
        );
    }
}

/* =========================================================
   LOAD CUSTOMERS
========================================================= */

async function loadCustomers() {

    customersList.innerHTML = "";

    if (!currentProfile) {
        return;
    }

    if (
        currentProfile.role !==
        "admin"
    ) {

        customersList.innerHTML = `
            <div class="customer-empty">
                محادثتك الخاصة مع الإدارة
            </div>
        `;

        return;
    }

    const {
        data,
        error
    } = await db
        .from("profiles")
        .select(
            "id, display_name, role"
        )
        .eq(
            "role",
            "customer"
        )
        .order(
            "display_name"
        );

    if (error) {

        console.error(
            "Customers error:",
            error
        );

        customersList.innerHTML = `
            <div class="customer-empty">
                تعذر تحميل العملاء
            </div>
        `;

        return;
    }

    if (!data?.length) {

        customersList.innerHTML = `
            <div class="customer-empty">
                لا يوجد عملاء
            </div>
        `;

        return;
    }

    data.forEach(
        function (customer) {

            profileCache.set(
                customer.id,
                customer
            );

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "conversation-button customer-button";

            button.innerHTML = `

                <span class="customer-icon">
                    👤
                </span>

                <div class="customer-info">

                    <strong>
                        ${escapeHtml(
                            customer.display_name ||
                            "عميل"
                        )}
                    </strong>

                    <small>
                        محادثة خاصة
                    </small>

                </div>

            `;

            button.addEventListener(
                "click",
                function () {

                    openPrivateConversation(
                        customer
                    );
                }
            );

            customersList.appendChild(
                button
            );
        }
    );
}

/* =========================================================
   OPEN GROUP
========================================================= */

async function openGroupConversation() {

    if (!currentUser) {
        return;
    }

    try {

        const {
            data,
            error
        } = await db
            .from("conversations")
            .select("*")
            .eq(
                "type",
                "group"
            )
            .limit(1)
            .maybeSingle();

        if (error) {

            console.error(
                "Group conversation error:",
                error
            );

            showChatError(
                "تعذر الوصول إلى المحادثة الجماعية."
            );

            return;
        }

        if (!data) {

            showChatError(
                "لم يتم إنشاء المحادثة الجماعية في قاعدة البيانات بعد."
            );

            return;
        }

        await selectConversation(
            data,
            "المجموعة",
            "المحادثة الجماعية"
        );

        setActiveButton(
            groupButton
        );

    } catch (error) {

        console.error(
            "Open group error:",
            error
        );

        showChatError(
            error.message ||
            "حدث خطأ أثناء فتح المجموعة."
        );
    }
}

/* =========================================================
   OPEN PRIVATE
========================================================= */

async function openPrivateConversation(
    customer
) {

    if (!currentUser || !customer) {
        return;
    }

    try {

        let conversation = null;

        const {
            data: existingConversation,
            error: searchError
        } = await db
            .from("conversations")
            .select("*")
            .eq(
                "type",
                "private"
            )
            .eq(
                "customer_id",
                customer.id
            )
            .maybeSingle();

        if (searchError) {

            console.error(
                "Private conversation search error:",
                searchError
            );

            showChatError(
                "تعذر البحث عن المحادثة الخاصة."
            );

            return;
        }

        conversation =
            existingConversation;

        if (
            !conversation &&
            currentProfile?.role ===
            "admin"
        ) {

            const {
                data: createdConversation,
                error: createError
            } = await db
                .from("conversations")
                .insert({
                    type: "private",
                    customer_id:
                        customer.id
                })
                .select()
                .single();

            if (createError) {

                console.error(
                    "Create private conversation error:",
                    createError
                );

                showChatError(
                    "تعذر إنشاء المحادثة الخاصة. تأكد من سياسات RLS."
                );

                return;
            }

            conversation =
                createdConversation;

            const members = [
                {
                    conversation_id:
                        conversation.id,

                    user_id:
                        customer.id
                },

                {
                    conversation_id:
                        conversation.id,

                    user_id:
                        currentUser.id
                }
            ];

            const {
                error: membersError
            } = await db
                .from("conversation_members")
                .upsert(
                    members,
                    {
                        onConflict:
                            "conversation_id,user_id"
                    }
                );

            if (membersError) {

                console.error(
                    "Members error:",
                    membersError
                );

                showChatError(
                    "تم إنشاء المحادثة ولكن تعذر إضافة الأعضاء."
                );

                return;
            }
        }

        if (!conversation) {

            showChatError(
                "لا توجد محادثة خاصة لهذا العميل."
            );

            return;
        }

        await selectConversation(
            conversation,
            customer.display_name ||
            "محادثة خاصة",
            "محادثة خاصة"
        );

        document
            .querySelectorAll(
                ".conversation-button"
            )
            .forEach(
                function (button) {

                    button.classList.remove(
                        "active"
                    );
                }
            );

    } catch (error) {

        console.error(
            "Private conversation error:",
            error
        );

        showChatError(
            error.message ||
            "حدث خطأ أثناء فتح المحادثة الخاصة."
        );
    }
}

/* =========================================================
   SELECT CONVERSATION
========================================================= */

async function selectConversation(
    conversation,
    title,
    subtitle
) {

    currentConversation =
        conversation;

    conversationTitle.textContent =
        title;

    conversationSubtitle.textContent =
        subtitle;

    messagesContainer.innerHTML = "";

    clearFilePreview();

    reactionCache.clear();

    await loadMessages();

    subscribeToMessages();
}

/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages() {

    if (!currentConversation) {
        return;
    }

    messagesContainer.innerHTML = "";

    const {
        data: messages,
        error
    } = await db
        .from("messages")
        .select("*")
        .eq(
            "conversation_id",
            currentConversation.id
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "Messages error:",
            error
        );

        showChatError(
            "تعذر تحميل الرسائل."
        );

        return;
    }

    if (!messages?.length) {

        messagesContainer.innerHTML = `
            <div class="empty-messages">
                <div class="empty-icon">
                    💬
                </div>
                <div>
                    لا توجد رسائل بعد
                </div>
                <small>
                    ابدأ المحادثة الآن
                </small>
            </div>
        `;

        return;
    }

    /*
     * تحميل أسماء المرسلين
     */

    const senderIds = [
        ...new Set(
            messages
                .map(
                    message =>
                        message.sender_id
                )
                .filter(Boolean)
        )
    ];

    if (senderIds.length) {

        const {
            data: profiles,
            error: profilesError
        } = await db
            .from("profiles")
            .select(
                "id, display_name, role"
            )
            .in(
                "id",
                senderIds
            );

        if (profilesError) {

            console.error(
                "Profiles error:",
                profilesError
            );

        } else {

            profiles?.forEach(
                function (profile) {

                    profileCache.set(
                        profile.id,
                        profile
                    );
                }
            );
        }
    }

    /*
     * تحميل جميع التفاعلات دفعة واحدة
     */

    const messageIds =
        messages.map(
            message => message.id
        );

    await loadReactions(
        messageIds
    );

    messagesContainer.innerHTML = "";

    for (const message of messages) {

        await renderMessage(
            message
        );
    }

    scrollMessagesToBottom();
}

/* =========================================================
   LOAD REACTIONS
========================================================= */

async function loadReactions(
    messageIds
) {

    if (!messageIds?.length) {
        return;
    }

    const {
        data,
        error
    } = await db
        .from("message_reactions")
        .select(
            "id, message_id, user_id, reaction, created_at"
        )
        .in(
            "message_id",
            messageIds
        );

    if (error) {

        console.error(
            "Reactions error:",
            error
        );

        return;
    }

    messageIds.forEach(
        function (messageId) {

            reactionCache.set(
                messageId,
                []
            );
        }
    );

    data?.forEach(
        function (reaction) {

            if (
                !reactionCache.has(
                    reaction.message_id
                )
            ) {

                reactionCache.set(
                    reaction.message_id,
                    []
                );
            }

            reactionCache
                .get(
                    reaction.message_id
                )
                .push(
                    reaction
                );
        }
    );
}

/* =========================================================
   RENDER MESSAGE
========================================================= */

async function renderMessage(
    message
) {

    if (!message?.id) {
        return;
    }

    const messageElement =
        document.createElement("div");

    const ownMessage =
        message.sender_id ===
        currentUser.id;

    messageElement.className =
        ownMessage
            ? "message own"
            : "message";

    messageElement.dataset.messageId =
        message.id;

    const senderProfile =
        profileCache.get(
            message.sender_id
        );

    const senderName =
        senderProfile?.display_name ||
        "مستخدم";

    let content = "";

    if (
        message.message_type ===
        "text"
    ) {

        content = `
            <div class="message-text">
                ${escapeHtml(
                    message.content || ""
                )}
            </div>
        `;

    } else if (
        message.message_type ===
        "image"
    ) {

        let imageUrl = null;

        if (message.file_path) {

            imageUrl =
                await createSignedUrl(
                    message.file_path
                );
        }

        if (imageUrl) {

            content = `
                <a
                    class="image-message-link"
                    href="${escapeHtml(
                        imageUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        class="message-image"
                        src="${escapeHtml(
                            imageUrl
                        )}"
                        alt="صورة"
                        loading="lazy"
                    >
                </a>
            `;

        } else {

            content = `
                <div class="message-text">
                    تعذر تحميل الصورة
                </div>
            `;
        }

    } else if (
        message.message_type ===
        "audio"
    ) {

        let audioUrl = null;

        if (message.file_path) {

            audioUrl =
                await createSignedUrl(
                    message.file_path
                );
        }

        if (audioUrl) {

            content = `
                <audio
                    class="message-audio"
                    controls
                    src="${escapeHtml(
                        audioUrl
                    )}"
                ></audio>
            `;

        } else {

            content = `
                <div class="message-text">
                    تعذر تحميل التسجيل الصوتي
                </div>
            `;
        }

    } else {

        content = `
            <div class="message-text">
                ${escapeHtml(
                    message.content || ""
                )}
            </div>
        `;
    }

    const date =
        formatDate(
            message.created_at
        );

    messageElement.innerHTML = `

        <div class="message-wrapper">

            <div class="message-bubble">

                ${!ownMessage ? `
                <div class="message-sender">
                    ${escapeHtml(
                        senderName
                    )}
                </div>` : ''}

                ${content}

                <div class="message-footer">

                    <span class="message-time">
                        ${date}
                    </span>

                    ${
                        ownMessage
                            ? `
                                <span
                                    class="message-status"
                                    title="تم الإرسال"
                                >
                                    ✓✓
                                </span>
                            `
                            : ""
                    }

                </div>

            </div>

            <div
                class="reaction-picker"
                data-message-id="${escapeHtml(
                    message.id
                )}"
            >

                ${REACTIONS.map(
                    function (reaction) {

                        return `
                            <button
                                type="button"
                                class="reaction-button"
                                data-reaction="${reaction}"
                                title="${reaction}"
                            >
                                ${reaction}
                            </button>
                        `;
                    }
                ).join("")}

            </div>

            <div
                class="message-reactions"
                data-reactions-for="${escapeHtml(
                    message.id
                )}"
            ></div>

        </div>
    `;

    messagesContainer.appendChild(
        messageElement
    );

    setupReactionButtons(
        messageElement
    );

    renderReactionSummary(
        message.id
    );
}

/* =========================================================
   REACTION BUTTONS
========================================================= */

function setupReactionButtons(
    messageElement
) {

    const buttons =
        messageElement.querySelectorAll(
            ".reaction-button"
        );

    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function (event) {

                    event.stopPropagation();

                    const messageId =
                        messageElement.dataset.messageId;

                    const reaction =
                        button.dataset.reaction;

                    await toggleReaction(
                        messageId,
                        reaction
                    );
                }
            );
        }
    );
}

/* =========================================================
   TOGGLE REACTION
========================================================= */

async function toggleReaction(
    messageId,
    reaction
) {

    if (
        !currentUser ||
        !messageId ||
        !REACTIONS.includes(
            reaction
        )
    ) {

        return;
    }

    try {

        const {
            data: existing,
            error: findError
        } = await db
            .from("message_reactions")
            .select(
                "id"
            )
            .eq(
                "message_id",
                messageId
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .eq(
                "reaction",
                reaction
            )
            .maybeSingle();

        if (findError) {

            console.error(
                "Find reaction error:",
                findError
            );

            return;
        }

        if (existing) {

            const {
                error
            } = await db
                .from("message_reactions")
                .delete()
                .eq(
                    "id",
                    existing.id
                );

            if (error) {

                console.error(
                    "Delete reaction error:",
                    error
                );

                showChatError(
                    "تعذر إزالة التفاعل."
                );

                return;
            }

        } else {

            const {
                error
            } = await db
                .from("message_reactions")
                .insert({
                    message_id:
                        messageId,

                    user_id:
                        currentUser.id,

                    reaction
                });

            if (error) {

                console.error(
                    "Insert reaction error:",
                    error
                );

                showChatError(
                    "تعذر إضافة التفاعل."
                );

                return;
            }
        }

        await refreshMessageReactions(
            messageId
        );

    } catch (error) {

        console.error(
            "Reaction error:",
            error
        );

        showChatError(
            error.message ||
            "حدث خطأ أثناء التفاعل."
        );
    }
}

/* =========================================================
   REFRESH REACTIONS
========================================================= */

async function refreshMessageReactions(
    messageId
) {

    const {
        data,
        error
    } = await db
        .from("message_reactions")
        .select(
            "id, message_id, user_id, reaction, created_at"
        )
        .eq(
            "message_id",
            messageId
        );

    if (error) {

        console.error(
            "Refresh reactions error:",
            error
        );

        return;
    }

    reactionCache.set(
        messageId,
        data || []
    );

    renderReactionSummary(
        messageId
    );
}

/* =========================================================
   RENDER REACTION SUMMARY
========================================================= */

function renderReactionSummary(
    messageId
) {

    const container =
        messagesContainer.querySelector(
            `[data-reactions-for="${cssEscape(
                messageId
            )}"]`
        );

    if (!container) {
        return;
    }

    const reactions =
        reactionCache.get(
            messageId
        ) || [];

    if (!reactions.length) {

        container.innerHTML = "";

        return;
    }

    const counts = new Map();

    const mine = new Set();

    reactions.forEach(
        function (item) {

            const current =
                counts.get(
                    item.reaction
                ) || 0;

            counts.set(
                item.reaction,
                current + 1
            );

            if (
                item.user_id ===
                currentUser?.id
            ) {

                mine.add(
                    item.reaction
                );
            }
        }
    );

    const ordered =
        REACTIONS.filter(
            reaction =>
                counts.has(
                    reaction
                )
        );

    container.innerHTML =
        ordered.map(
            function (reaction) {

                const count =
                    counts.get(
                        reaction
                    );

                const active =
                    mine.has(
                        reaction
                    );

                return `
                    <button
                        type="button"
                        class="reaction-summary ${
                            active
                                ? "mine"
                                : ""
                        }"
                        data-summary-reaction="${reaction}"
                        title="إزالة/إضافة ${reaction}"
                    >
                        <span>
                            ${reaction}
                        </span>

                        <b>
                            ${count}
                        </b>
                    </button>
                `;
            }
        ).join("");

    container
        .querySelectorAll(
            ".reaction-summary"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        toggleReaction(
                            messageId,
                            button.dataset.summaryReaction
                        );
                    }
                );
            }
        );
}

/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(
    event
) {

    event.preventDefault();

    if (!currentUser) {
        return;
    }

    if (!currentConversation) {

        showChatError(
            "اختر محادثة أولاً."
        );

        return;
    }

    const text =
        messageInput.value.trim();

    if (
        !text &&
        !selectedImage
    ) {

        return;
    }

    if (selectedImage) {

        await uploadImage(
            selectedImage
        );

        return;
    }

    await sendTextMessage(
        text
    );
}

/* =========================================================
   SEND TEXT
========================================================= */

async function sendTextMessage(
    text
) {

    if (
        !text ||
        !currentConversation
    ) {

        return;
    }

    const {
        error
    } = await db
        .from("messages")
        .insert({
            conversation_id:
                currentConversation.id,

            sender_id:
                currentUser.id,

            message_type:
                "text",

            content:
                text
        });

    if (error) {

        console.error(
            "Send text error:",
            error
        );

        showChatError(
            "تعذر إرسال الرسالة."
        );

        return;
    }

    messageInput.value = "";

    messageInput.focus();
}

/* =========================================================
   IMAGE
========================================================= */

function handleImageSelection(
    event
) {

    const file =
        event.target.files &&
        event.target.files[0];

    if (!file) {
        return;
    }

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showChatError(
            "الملف المختار ليس صورة."
        );

        imageInput.value = "";

        return;
    }

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        showChatError(
            "حجم الصورة يجب ألا يتجاوز 10 ميغابايت."
        );

        imageInput.value = "";

        return;
    }

    selectedImage = file;

    filePreview.classList.remove(
        "hidden"
    );

    filePreview.innerHTML = `

        <div class="selected-file">

            <span>
                🖼️
                ${escapeHtml(
                    file.name
                )}
            </span>

            <button
                type="button"
                id="removeFileButton"
            >
                ✕
            </button>

        </div>
    `;

    document
        .getElementById(
            "removeFileButton"
        )
        .addEventListener(
            "click",
            clearFilePreview
        );
}

/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadImage(
    file
) {

    if (!currentConversation) {
        return;
    }

    const extension =
        getFileExtension(
            file.name
        );

    const filePath =
        `images/${currentConversation.id}/${currentUser.id}/${crypto.randomUUID()}.${extension}`;

    try {

        const {
            error: uploadError
        } = await db.storage
            .from("chat-files")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType:
                        file.type
                }
            );

        if (uploadError) {

            console.error(
                "Image upload error:",
                uploadError
            );

            showChatError(
                "تعذر رفع الصورة."
            );

            return;
        }

        const {
            error: messageError
        } = await db
            .from("messages")
            .insert({
                conversation_id:
                    currentConversation.id,

                sender_id:
                    currentUser.id,

                message_type:
                    "image",

                content:
                    file.name,

                file_path:
                    filePath
            });

        if (messageError) {

            console.error(
                "Image message error:",
                messageError
            );

            showChatError(
                "تم رفع الصورة ولكن تعذر إرسالها."
            );

            return;
        }

        clearFilePreview();

    } catch (error) {

        console.error(
            "Unexpected image error:",
            error
        );

        showChatError(
            error.message ||
            "حدث خطأ أثناء رفع الصورة."
        );
    }
}

/* =========================================================
   RECORD AUDIO
========================================================= */

async function toggleRecording() {

    if (recording) {

        stopRecording();

        return;
    }

    await startRecording();
}

async function startRecording() {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        showChatError(
            "المتصفح لا يدعم تسجيل الصوت."
        );

        return;
    }

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        audioChunks = [];

        mediaRecorder =
            new MediaRecorder(
                stream
            );

        mediaRecorder.ondataavailable =
            function (event) {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    audioChunks.push(
                        event.data
                    );
                }
            };

        mediaRecorder.onstop =
            async function () {

                stream
                    .getTracks()
                    .forEach(
                        function (track) {

                            track.stop();
                        }
                    );

                const audioBlob =
                    new Blob(
                        audioChunks,
                        {
                            type:
                                mediaRecorder.mimeType ||
                                "audio/webm"
                        }
                    );

                if (
                    audioBlob.size === 0
                ) {

                    return;
                }

                await uploadAudio(
                    audioBlob
                );
            };

        mediaRecorder.start();

        recording = true;

        recordButton.textContent =
            "⏹️";

        recordButton.title =
            "إيقاف التسجيل";

        recordButton.classList.add(
            "recording"
        );

    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );

        showChatError(
            "تعذر الوصول إلى الميكروفون. اسمح للموقع باستخدام الميكروفون."
        );
    }
}

function stopRecording() {

    if (
        !mediaRecorder ||
        mediaRecorder.state ===
        "inactive"
    ) {

        recording = false;

        return;
    }

    mediaRecorder.stop();

    recording = false;

    recordButton.textContent =
        "🎤";

    recordButton.title =
        "تسجيل صوتي";

    recordButton.classList.remove(
        "recording"
    );
}

/* =========================================================
   UPLOAD AUDIO
========================================================= */

async function uploadAudio(
    blob
) {

    if (!currentConversation) {

        showChatError(
            "اختر محادثة أولاً."
        );

        return;
    }

    try {

        const filePath =
            `audio/${currentConversation.id}/${currentUser.id}/${crypto.randomUUID()}.webm`;

        const {
            error: uploadError
        } = await db.storage
            .from("chat-files")
            .upload(
                filePath,
                blob,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType:
                        blob.type ||
                        "audio/webm"
                }
            );

        if (uploadError) {

            console.error(
                "Audio upload error:",
                uploadError
            );

            showChatError(
                "تعذر رفع التسجيل الصوتي."
            );

            return;
        }

        const {
            error: messageError
        } = await db
            .from("messages")
            .insert({
                conversation_id:
                    currentConversation.id,

                sender_id:
                    currentUser.id,

                message_type:
                    "audio",

                content:
                    "رسالة صوتية",

                file_path:
                    filePath
            });

        if (messageError) {

            console.error(
                "Audio message error:",
                messageError
            );

            showChatError(
                "تم رفع التسجيل ولكن تعذر إرساله."
            );
        }

    } catch (error) {

        console.error(
            "Unexpected audio error:",
            error
        );

        showChatError(
            error.message ||
            "حدث خطأ أثناء رفع التسجيل الصوتي."
        );
    }
}

/* =========================================================
   SIGNED URL
========================================================= */

async function createSignedUrl(
    filePath
) {

    if (!filePath) {
        return null;
    }

    const {
        data,
        error
    } = await db.storage
        .from("chat-files")
        .createSignedUrl(
            filePath,
            60 * 60
        );

    if (error) {

        console.error(
            "Signed URL error:",
            error
        );

        return null;
    }

    return data?.signedUrl || null;
}

/* =========================================================
   REALTIME
========================================================= */

function subscribeToMessages() {

    if (!currentConversation) {
        return;
    }

    if (realtimeChannel) {

        db.removeChannel(
            realtimeChannel
        );

        realtimeChannel = null;
    }

    const conversationId =
        currentConversation.id;

    realtimeChannel =
        db
            .channel(
                `chat-${conversationId}`
            )

            /* -----------------------------------------
               NEW MESSAGE
            ----------------------------------------- */

            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter:
                        `conversation_id=eq.${conversationId}`
                },

                async function (payload) {

                    if (
                        !currentConversation ||
                        payload.new.conversation_id !==
                        currentConversation.id
                    ) {

                        return;
                    }

                    const empty =
                        messagesContainer.querySelector(
                            ".empty-messages"
                        );

                    if (empty) {
                        empty.remove();
                    }

                    if (
                        payload.new.sender_id &&
                        !profileCache.has(
                            payload.new.sender_id
                        )
                    ) {

                        const {
                            data: profile
                        } = await db
                            .from("profiles")
                            .select(
                                "id, display_name, role"
                            )
                            .eq(
                                "id",
                                payload.new.sender_id
                            )
                            .maybeSingle();

                        if (profile) {

                            profileCache.set(
                                profile.id,
                                profile
                            );
                        }
                    }

                    reactionCache.set(
                        payload.new.id,
                        []
                    );

                    await renderMessage(
                        payload.new
                    );

                    scrollMessagesToBottom();
                }
            )

            /* -----------------------------------------
               NEW / DELETE REACTION
            ----------------------------------------- */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "message_reactions"
                },

                async function (payload) {

                    const messageId =
                        payload.new?.message_id ||
                        payload.old?.message_id;

                    if (!messageId) {
                        return;
                    }

                    const messageElement =
                        messagesContainer.querySelector(
                            `[data-message-id="${cssEscape(
                                messageId
                            )}"]`
                        );

                    if (!messageElement) {
                        return;
                    }

                    await refreshMessageReactions(
                        messageId
                    );
                }
            )

            .subscribe(
                function (status) {

                    console.log(
                        "Realtime status:",
                        status
                    );
                }
            );
}

/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        await db.auth.signOut();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showError(
            error.message ||
            "حدث خطأ أثناء تسجيل الخروج."
        );
    }
}

/* =========================================================
   UI
========================================================= */

function showApplication() {

    loginScreen.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );
}

function showLoginScreen() {

    loginScreen.classList.remove(
        "hidden"
    );

    app.classList.add(
        "hidden"
    );
}

function clearLoginError() {

    if (!loginError) {
        return;
    }

    loginError.textContent = "";

    loginError.className = "";
}

function showError(
    message
) {

    if (!loginError) {
        return;
    }

    loginError.textContent =
        message || "حدث خطأ.";

    loginError.className =
        "error";
}

function showSuccess(
    message
) {

    if (!loginError) {
        return;
    }

    loginError.textContent =
        message || "";

    loginError.className =
        "success";
}

function showChatError(
    message
) {

    console.error(
        "Chat error:",
        message
    );

    if (!messagesContainer) {
        return;
    }

    const element =
        document.createElement("div");

    element.className =
        "chat-error";

    element.textContent =
        message ||
        "حدث خطأ.";

    messagesContainer.appendChild(
        element
    );

    scrollMessagesToBottom();
}

function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }

    button.disabled =
        loading;

    button.textContent =
        text;
}

function setActiveButton(
    button
) {

    document
        .querySelectorAll(
            ".conversation-button"
        )
        .forEach(
            function (element) {

                element.classList.remove(
                    "active"
                );
            }
        );

    if (button) {

        button.classList.add(
            "active"
        );
    }
}

/* =========================================================
   FILE PREVIEW
========================================================= */

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

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}

function cssEscape(
    value
) {

    if (
        window.CSS &&
        typeof window.CSS.escape ===
        "function"
    ) {

        return window.CSS.escape(
            String(value)
        );
    }

    return String(value)
        .replace(
            /["\\]/g,
            "\\$&"
        );
}

function getFileExtension(
    filename
) {

    const parts =
        filename.split(".");

    if (parts.length < 2) {
        return "bin";
    }

    return parts
        .pop()
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        ) || "bin";
}

function formatDate(
    dateString
) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    return date.toLocaleString(
        "ar-DZ",
        {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function scrollMessagesToBottom() {

    if (!messagesContainer) {
        return;
    }

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}

/* =========================================================
   AUTH ERROR
========================================================= */

function getAuthErrorMessage(
    error
) {

    const message =
        (
            error?.message ||
            ""
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
            "email rate limit exceeded"
        )
    ) {

        return "تم تجاوز حد إرسال رسائل الاسترجاع مؤقتًا من Supabase. انتظر قليلًا قبل طلب رسالة جديدة.";
    }

    if (
        message.includes(
            "rate limit"
        )
    ) {

        return "تم تجاوز الحد المسموح مؤقتًا. حاول مرة أخرى لاحقًا.";
    }

    if (
        message.includes(
            "user not found"
        )
    ) {

        return "لا يوجد حساب بهذا البريد الإلكتروني.";
    }

    if (
        message.includes(
            "password should be at least"
        )
    ) {

        return "كلمة المرور قصيرة جدًا.";
    }

    return (
        error?.message ||
        "حدث خطأ غير معروف."
    );
}

window.SUPABASE_URL = "https://kdbxfsifrzoohgihqqqz.supabase.co";

window.SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYnhmc2lmcnpvb2hnaWhxcXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMTQzNTcsImV4cCI6MjEwNDY5MDM1N30.FqQnBYtv4nkW4OC8UAt9nJBzysaFoXuoPZA-yTso9kk";
