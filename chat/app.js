"use strict";

/* =========================================================
   مركز التواصل
   app.js
   ========================================================= */

/* =========================
   1. SUPABASE
   ========================= */

const { createClient } = window.supabase;

const db = createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);

/* =========================
   2. DOM ELEMENTS
   ========================= */

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");
const loginError = document.getElementById("loginError");

const groupButton = document.getElementById("groupButton");
const customersList = document.getElementById("customersList");
const logoutButton = document.getElementById("logoutButton");

const conversationTitle = document.getElementById("conversationTitle");
const conversationSubtitle = document.getElementById("conversationSubtitle");

const messagesContainer = document.getElementById("messages");

const filePreview = document.getElementById("filePreview");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");
const recordButton = document.getElementById("recordButton");

/* =========================
   3. APPLICATION STATE
   ========================= */

let currentUser = null;
let currentProfile = null;
let currentConversation = null;

let realtimeChannel = null;

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

let selectedImage = null;
let contextMenu = null;

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

/* =========================
   4. INITIALIZATION
   ========================= */

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
    try {
        loginButton?.addEventListener("click", login);

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
            event => {
                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();

                    if (typeof messageForm.requestSubmit === "function") {
                        messageForm.requestSubmit();
                    } else {
                        sendMessage(event);
                    }
                }
            }
        );

        document.addEventListener("click", event => {
            if (
                contextMenu &&
                !contextMenu.contains(event.target)
            ) {
                closeContextMenu();
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeContextMenu();
            }
        });

        window.addEventListener("resize", () => {
            closeContextMenu();
        });

        db.auth.onAuthStateChange(async (event, session) => {
            try {
                if (event === "PASSWORD_RECOVERY") {
                    showPasswordUpdateScreen();
                    return;
                }

                if (
                    event === "SIGNED_IN" &&
                    session?.user &&
                    !currentUser
                ) {
                    await startApplication(session.user);
                    return;
                }

                if (event === "SIGNED_OUT") {
                    await resetApplication();
                }
            } catch (error) {
                console.error(
                    "Auth state error:",
                    error
                );
            }
        });

        const {
            data,
            error
        } = await db.auth.getSession();

        if (error) {
            console.error(error);
            showLoginError(
                authMessage(error)
            );
            return;
        }

        if (data?.session?.user) {
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

        showLoginError(
            "حدث خطأ أثناء تشغيل التطبيق."
        );
    }
}

/* =========================
   5. LOGIN
   ========================= */

async function login() {
    clearLoginError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
        showLoginError(
            "أدخل البريد الإلكتروني."
        );
        emailInput.focus();
        return;
    }

    if (!password) {
        showLoginError(
            "أدخل كلمة المرور."
        );
        passwordInput.focus();
        return;
    }

    setButton(
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
            throw error;
        }

        if (!data?.user) {
            throw new Error(
                "تعذر الحصول على بيانات المستخدم."
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
        setButton(
            loginButton,
            false,
            "تسجيل الدخول"
        );
    }
}

/* =========================
   6. PASSWORD RESET
   ========================= */

async function resetPassword() {
    clearLoginError();

    const email = emailInput.value.trim();

    if (!email) {
        showLoginError(
            "أدخل بريدك الإلكتروني أولاً."
        );
        emailInput.focus();
        return;
    }

    setButton(
        forgotPasswordButton,
        true,
        "جارٍ الإرسال..."
    );

    try {
        const {
            error
        } = await db.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    window.location.origin + "/"
            }
        );

        if (error) {
            throw error;
        }

        showLoginSuccess(
            "تم إرسال رابط استرجاع كلمة المرور إلى بريدك الإلكتروني."
        );

    } catch (error) {
        console.error(
            "Password reset error:",
            error
        );

        showLoginError(
            authMessage(error)
        );
    } finally {
        setButton(
            forgotPasswordButton,
            false,
            "نسيت كلمة المرور؟"
        );
    }
}

function showPasswordUpdateScreen() {
    loginScreen.classList.remove("hidden");
    app.classList.add("hidden");

    const box =
        loginScreen.querySelector(".login-box");

    if (!box) {
        return;
    }

    box.innerHTML = `
        <div class="logo" aria-hidden="true">🔐</div>

        <h1>تغيير كلمة المرور</h1>

        <p>
            أدخل كلمة المرور الجديدة لحسابك
        </p>

        <div class="field">
            <label for="newPassword">
                كلمة المرور الجديدة
            </label>

            <input
                id="newPassword"
                type="password"
                autocomplete="new-password"
                placeholder="أدخل كلمة المرور الجديدة"
            >
        </div>

        <div class="field">
            <label for="confirmPassword">
                تأكيد كلمة المرور
            </label>

            <input
                id="confirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="أعد كتابة كلمة المرور"
            >
        </div>

        <button
            id="updatePasswordButton"
            type="button"
            class="primary-button"
        >
            حفظ كلمة المرور
        </button>

        <div
            id="passwordUpdateError"
            class="error"
            role="alert"
            aria-live="polite"
        ></div>
    `;

    const newPassword =
        document.getElementById("newPassword");

    const confirmPassword =
        document.getElementById("confirmPassword");

    const updateButton =
        document.getElementById(
            "updatePasswordButton"
        );

    const errorBox =
        document.getElementById(
            "passwordUpdateError"
        );

    updateButton?.addEventListener(
        "click",
        async () => {
            const password =
                newPassword.value;

            const confirmation =
                confirmPassword.value;

            errorBox.textContent = "";
            errorBox.className = "error";

            if (password.length < 6) {
                errorBox.textContent =
                    "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
                return;
            }

            if (password !== confirmation) {
                errorBox.textContent =
                    "كلمتا المرور غير متطابقتين.";
                return;
            }

            setButton(
                updateButton,
                true,
                "جارٍ الحفظ..."
            );

            try {
                const {
                    error
                } = await db.auth.updateUser({
                    password
                });

                if (error) {
                    throw error;
                }

                errorBox.className =
                    "success";

                errorBox.textContent =
                    "تم تغيير كلمة المرور بنجاح.";

                setTimeout(
                    async () => {
                        await db.auth.signOut();
                    },
                    1200
                );

            } catch (error) {
                console.error(
                    "Update password error:",
                    error
                );

                errorBox.className =
                    "error";

                errorBox.textContent =
                    authMessage(error);

            } finally {
                setButton(
                    updateButton,
                    false,
                    "حفظ كلمة المرور"
                );
            }
        }
    );
}

/* =========================
   7. START APPLICATION
   ========================= */

async function startApplication(user) {
    if (!user) {
        return;
    }

    currentUser = user;

    const {
        data,
        error
    } = await db
        .from("profiles")
        .select(
            "id,display_name,role"
        )
        .eq("id", user.id)
        .single();

    if (error || !data) {
        console.error(
            "Profile error:",
            error
        );

        showLoginError(
            "تم تسجيل الدخول ولكن لم يتم العثور على ملف المستخدم في profiles."
        );

        return;
    }

    currentProfile = data;

    profileCache.set(
        data.id,
        data
    );

    loginScreen.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );

    await loadCustomers();

    await openGroupConversation();
}

/* =========================
   8. CUSTOMERS
   ========================= */

async function loadCustomers() {
    customersList.innerHTML = "";

    if (currentProfile?.role !== "admin") {
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
            "id,display_name,role"
        )
        .eq("role", "customer")
        .order(
            "display_name",
            {
                ascending: true
            }
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

    data.forEach(customer => {
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
            <span
                class="customer-icon"
                aria-hidden="true"
            >
                👤
            </span>

            <span class="conversation-copy">
                <strong>
                    ${escapeHtml(
                        customer.display_name ||
                        "عميل"
                    )}
                </strong>

                <small>
                    محادثة خاصة
                </small>
            </span>
        `;

        button.addEventListener(
            "click",
            () =>
                openPrivateConversation(
                    customer
                )
        );

        customersList.appendChild(
            button
        );
    });
}

/* =========================
   9. GROUP CONVERSATION
   ========================= */

async function openGroupConversation() {
    if (!currentUser) {
        return;
    }

    closeContextMenu();

    let {
        data,
        error
    } = await db
        .from("conversations")
        .select("*")
        .eq("type", "group")
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

    /*
     * إذا لم تكن المجموعة موجودة، يحاول
     * المسؤول إنشاءها تلقائيًا.
     */
    if (!data && currentProfile?.role === "admin") {
        const created =
            await db
                .from("conversations")
                .insert({
                    type: "group",
                    customer_id: null
                })
                .select("*")
                .single();

        if (created.error) {
            console.error(
                "Create group error:",
                created.error
            );

            showChatError(
                "لم يتم إنشاء المحادثة الجماعية. تأكد من سياسات RLS لجدول conversations."
            );

            return;
        }

        data = created.data;
    }

    if (!data) {
        showChatError(
            "لم يتم إنشاء المحادثة الجماعية في قاعدة البيانات بعد."
        );

        return;
    }

    await selectConversation(
        data,
        "المجموعة العامة",
        "المحادثة الجماعية"
    );

    setActive(
        groupButton
    );
}

/* =========================
   10. PRIVATE CONVERSATION
   ========================= */

async function openPrivateConversation(
    customer
) {
    if (!customer?.id) {
        return;
    }

    closeContextMenu();

    let {
        data,
        error
    } = await db
        .from("conversations")
        .select("*")
        .eq("type", "private")
        .eq(
            "customer_id",
            customer.id
        )
        .maybeSingle();

    if (error) {
        console.error(
            "Private conversation lookup:",
            error
        );

        showChatError(
            "تعذر البحث عن المحادثة الخاصة."
        );

        return;
    }

    /*
     * المسؤول يستطيع إنشاء محادثة خاصة
     * للعميل إذا لم تكن موجودة.
     */
    if (
        !data &&
        currentProfile?.role === "admin"
    ) {
        const created =
            await db
                .from("conversations")
                .insert({
                    type: "private",
                    customer_id: customer.id
                })
                .select("*")
                .single();

        if (created.error) {
            console.error(
                "Create private conversation:",
                created.error
            );

            showChatError(
                "تعذر إنشاء المحادثة الخاصة. تأكد من سياسات RLS."
            );

            return;
        }

        data = created.data;

        /*
         * إضافة الطرفين إلى conversation_members.
         */
        const members =
            await db
                .from("conversation_members")
                .upsert(
                    [
                        {
                            conversation_id:
                                data.id,
                            user_id:
                                customer.id
                        },
                        {
                            conversation_id:
                                data.id,
                            user_id:
                                currentUser.id
                        }
                    ],
                    {
                        onConflict:
                            "conversation_id,user_id"
                    }
                );

        if (members.error) {
            console.error(
                "conversation_members error:",
                members.error
            );
        }
    }

    if (!data) {
        showChatError(
            "لا توجد محادثة خاصة لهذا العميل."
        );

        return;
    }

    await selectConversation(
        data,
        customer.display_name ||
            "محادثة خاصة",
        "محادثة خاصة"
    );

    document
        .querySelectorAll(
            ".conversation-button"
        )
        .forEach(button =>
            button.classList.remove(
                "active"
            )
        );

    const customerButtons =
        document.querySelectorAll(
            ".customer-button"
        );

    customerButtons.forEach(button => {
        const strong =
            button.querySelector(
                "strong"
            );

        if (
            strong &&
            strong.textContent.trim() ===
                (
                    customer.display_name ||
                    "عميل"
                ).trim()
        ) {
            button.classList.add(
                "active"
            );
        }
    });
}

/* =========================
   11. SELECT CONVERSATION
   ========================= */

async function selectConversation(
    conversation,
    title,
    subtitle
) {
    if (!conversation?.id) {
        return;
    }

    currentConversation =
        conversation;

    conversationTitle.textContent =
        title || "محادثة";

    conversationSubtitle.textContent =
        subtitle || "";

    reactionCache.clear();

    closeContextMenu();

    clearFilePreview();

    messagesContainer.innerHTML = `
        <div class="empty-messages">
            <div class="empty-icon">
                ⏳
            </div>

            <strong>
                جارٍ تحميل الرسائل...
            </strong>
        </div>
    `;

    await loadMessages();

    subscribeRealtime();
}

/* =========================
   12. LOAD MESSAGES
   ========================= */

async function loadMessages() {
    if (!currentConversation?.id) {
        return;
    }

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

        messagesContainer.innerHTML = "";

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

                <strong>
                    لا توجد رسائل بعد
                </strong>

                <small>
                    ابدأ بإرسال رسالة الآن
                </small>
            </div>
        `;

        return;
    }

    /*
     * تحميل أسماء مرسلي الرسائل.
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
                "id,display_name,role"
            )
            .in(
                "id",
                senderIds
            );

        if (!profilesError) {
            profiles?.forEach(profile => {
                profileCache.set(
                    profile.id,
                    profile
                );
            });
        }
    }

    /*
     * تحميل التفاعلات.
     */
    await loadReactions(
        messages.map(
            message => message.id
        )
    );

    messagesContainer.innerHTML = "";

    for (const message of messages) {
        await renderMessage(
            message
        );
    }

    scrollBottom();
}

/* =========================
   13. LOAD REACTIONS
   ========================= */

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
            "id,message_id,user_id,reaction,created_at"
        )
        .in(
            "message_id",
            messageIds
        );

    if (error) {
        console.error(
            "Reaction load error:",
            error
        );

        return;
    }

    messageIds.forEach(id => {
        reactionCache.set(
            id,
            []
        );
    });

    data?.forEach(reaction => {
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
            .get(reaction.message_id)
            .push(reaction);
    });
}

/* =========================
   14. RENDER MESSAGE
   ========================= */

async function renderMessage(
    message
) {
    if (!message?.id) {
        return;
    }

    const existing =
        messagesContainer.querySelector(
            `[data-message-id="${cssEscape(
                message.id
            )}"]`
        );

    if (existing) {
        existing.remove();
    }

    const element =
        document.createElement("div");

    const own =
        message.sender_id ===
        currentUser?.id;

    const canDelete =
        own ||
        currentProfile?.role ===
            "admin";

    element.className =
        own
            ? "message own"
            : "message";

    element.dataset.messageId =
        message.id;

    const sender =
        profileCache.get(
            message.sender_id
        )?.display_name ||
        "مستخدم";

    let content = "";

    /*
     * صورة
     */
    if (
        message.message_type ===
        "image"
    ) {
        const url =
            await signedUrl(
                message.file_path
            );

        if (url) {
            content = `
                <a
                    class="image-message-link"
                    href="${escapeHtml(url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        class="message-image"
                        src="${escapeHtml(url)}"
                        alt="صورة مرسلة"
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
    }

    /*
     * تسجيل صوتي
     */
    else if (
        message.message_type ===
        "audio"
    ) {
        const url =
            await signedUrl(
                message.file_path
            );

        if (url) {
            content = `
                <audio
                    class="message-audio"
                    controls
                    preload="metadata"
                    src="${escapeHtml(url)}"
                ></audio>
            `;
        } else {
            content = `
                <div class="message-text">
                    تعذر تحميل التسجيل الصوتي
                </div>
            `;
        }
    }

    /*
     * رسالة نصية
     */
    else {
        content = `
            <div class="message-text">
                ${escapeHtml(
                    message.content || ""
                )}
            </div>
        `;
    }

    /*
     * مؤشر التفاعل الصغير.
     *
     * لا تظهر مجموعة الإيموجي كاملة
     * إلا عند الضغط على هذا الزر أو
     * اختيار "إضافة تفاعل" من القائمة.
     */
    const reactionTrigger = `
        <button
            type="button"
            class="reaction-trigger"
            title="إضافة تفاعل"
            aria-label="إضافة تفاعل"
        >
            ❤️
        </button>
    `;

    /*
     * قائمة التفاعلات الستة.
     */
    const reactionPicker = `
        <div
            class="reaction-picker"
            data-message-id="${escapeHtml(
                message.id
            )}"
            aria-label="اختيار تفاعل"
        >
            ${REACTIONS.map(
                reaction => `
                    <button
                        type="button"
                        class="reaction-button"
                        data-reaction="${reaction}"
                        title="${reaction}"
                        aria-label="${reaction}"
                    >
                        ${reaction}
                    </button>
                `
            ).join("")}
        </div>
    `;

    element.innerHTML = `
        <div class="message-wrapper">

            ${reactionPicker}

            ${reactionTrigger}

            ${
                canDelete
                    ? `
                        <button
                            type="button"
                            class="delete-message-btn"
                            title="حذف الرسالة"
                            aria-label="حذف الرسالة"
                        >
                            🗑️
                        </button>
                    `
                    : ""
            }

            <div
                class="message-bubble"
                tabindex="0"
                role="button"
                aria-label="خيارات الرسالة"
            >

                ${
                    !own
                        ? `
                            <div class="message-sender">
                                ${escapeHtml(
                                    sender
                                )}
                            </div>
                        `
                        : ""
                }

                ${content}

                <div class="message-footer">
                    <span class="message-time">
                        ${formatDate(
                            message.created_at
                        )}
                    </span>

                    ${
                        own
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
                class="message-reactions"
                data-reactions-for="${escapeHtml(
                    message.id
                )}"
            ></div>

        </div>
    `;

    messagesContainer.appendChild(
        element
    );

    const bubble =
        element.querySelector(
            ".message-bubble"
        );

    const picker =
        element.querySelector(
            ".reaction-picker"
        );

    const trigger =
        element.querySelector(
            ".reaction-trigger"
        );

    /*
     * الضغط على الرسالة يفتح القائمة.
     */
    bubble?.addEventListener(
        "click",
        event => {
            if (
                event.target.closest(
                    "a, audio, button"
                )
            ) {
                return;
            }

            openMessageMenu(
                message,
                element,
                event
            );
        }
    );

    /*
     * النقر بالزر الأيمن.
     */
    bubble?.addEventListener(
        "contextmenu",
        event => {
            event.preventDefault();

            openMessageMenu(
                message,
                element,
                event
            );
        }
    );

    /*
     * فتح التفاعلات عند الضغط
     * على القلب الصغير.
     */
    trigger?.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();

            closeAllReactionPickers(
                picker
            );

            picker?.classList.toggle(
                "force-show"
            );
        }
    );

    /*
     * أزرار التفاعلات الستة.
     */
    element
        .querySelectorAll(
            ".reaction-button"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                async event => {
                    event.preventDefault();
                    event.stopPropagation();

                    const reaction =
                        button.dataset
                            .reaction;

                    picker?.classList.remove(
                        "force-show"
                    );

                    await toggleReaction(
                        message.id,
                        reaction
                    );
                }
            );
        });

    /*
     * حذف الرسالة.
     */
    element
        .querySelector(
            ".delete-message-btn"
        )
        ?.addEventListener(
            "click",
            async event => {
                event.preventDefault();
                event.stopPropagation();

                await deleteMessage(
                    message.id,
                    element
                );
            }
        );

    /*
     * تحديث ملخص التفاعلات.
     */
    renderReactionSummary(
        message.id
    );
}

/* =========================
   15. MESSAGE MENU
   ========================= */

function openMessageMenu(
    message,
    element,
    event
) {
    closeContextMenu();

    contextMenu =
        document.createElement("div");

    contextMenu.className =
        "message-context-menu";

    const canDelete =
        message.sender_id ===
            currentUser?.id ||
        currentProfile?.role ===
            "admin";

    contextMenu.innerHTML = `
        <button
            type="button"
            class="context-item"
            data-action="copy"
        >
            <span class="context-icon">
                📋
            </span>

            <span>
                نسخ الرسالة
            </span>
        </button>

        <button
            type="button"
            class="context-item"
            data-action="reaction"
        >
            <span class="context-icon">
                ❤️
            </span>

            <span>
                إضافة تفاعل
            </span>
        </button>

        ${
            canDelete
                ? `
                    <button
                        type="button"
                        class="context-item danger"
                        data-action="delete"
                    >
                        <span class="context-icon">
                            🗑️
                        </span>

                        <span>
                            حذف الرسالة
                        </span>
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
            async () => {
                await copyMessage(
                    message
                );

                closeContextMenu();
            }
        );

    contextMenu
        .querySelector(
            '[data-action="reaction"]'
        )
        ?.addEventListener(
            "click",
            () => {
                closeContextMenu();

                const picker =
                    element.querySelector(
                        ".reaction-picker"
                    );

                closeAllReactionPickers();

                picker?.classList.add(
                    "force-show"
                );

                setTimeout(() => {
                    picker?.classList.remove(
                        "force-show"
                    );
                }, 2500);
            }
        );

    contextMenu
        .querySelector(
            '[data-action="delete"]'
        )
        ?.addEventListener(
            "click",
            async () => {
                closeContextMenu();

                await deleteMessage(
                    message.id,
                    element
                );
            }
        );

    const clientX =
        Number.isFinite(event?.clientX)
            ? event.clientX
            : window.innerWidth / 2;

    const clientY =
        Number.isFinite(event?.clientY)
            ? event.clientY
            : window.innerHeight / 2;

    positionMenu(
        clientX,
        clientY
    );
}

function positionMenu(
    x,
    y
) {
    if (!contextMenu) {
        return;
    }

    const rect =
        contextMenu.getBoundingClientRect();

    const margin = 8;

    const left = Math.max(
        margin,
        Math.min(
            x,
            window.innerWidth -
                rect.width -
                margin
        )
    );

    const top = Math.max(
        margin,
        Math.min(
            y,
            window.innerHeight -
                rect.height -
                margin
        )
    );

    contextMenu.style.left =
        `${left}px`;

    contextMenu.style.top =
        `${top}px`;
}

function closeContextMenu() {
    if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
    }
}

/* =========================
   16. REACTION PICKERS
   ========================= */

function closeAllReactionPickers(
    except = null
) {
    document
        .querySelectorAll(
            ".reaction-picker.force-show"
        )
        .forEach(picker => {
            if (picker !== except) {
                picker.classList.remove(
                    "force-show"
                );
            }
        });
}

/* =========================
   17. COPY MESSAGE
   ========================= */

async function copyMessage(
    message
) {
    if (
        message.message_type !==
            "text" ||
        !message.content
    ) {
        showChatError(
            "نسخ النص متاح للرسائل النصية فقط."
        );

        return;
    }

    try {
        if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText ===
                "function"
        ) {
            await navigator.clipboard.writeText(
                message.content
            );

            return;
        }

        throw new Error(
            "Clipboard API unavailable"
        );

    } catch (error) {
        try {
            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                message.content;

            textarea.style.position =
                "fixed";

            textarea.style.left =
                "-9999px";

            textarea.style.top =
                "0";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.focus();
            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();

        } catch (fallbackError) {
            console.error(
                "Copy error:",
                fallbackError
            );

            showChatError(
                "تعذر نسخ الرسالة."
            );
        }
    }
}

/* =========================
   18. DELETE MESSAGE
   ========================= */

async function deleteMessage(
    id,
    element
) {
    if (!id || !currentUser) {
        return;
    }

    const messageElement =
        element ||
        messagesContainer.querySelector(
            `[data-message-id="${cssEscape(id)}"]`
        );

    if (
        messageElement &&
        messageElement.classList.contains(
            "deleting"
        )
    ) {
        return;
    }

    const confirmed =
        window.confirm(
            "هل أنت متأكد أنك تريد حذف هذه الرسالة للجميع؟"
        );

    if (!confirmed) {
        return;
    }

    messageElement?.classList.add(
        "deleting"
    );

    const {
        error
    } = await db
        .from("messages")
        .delete()
        .eq(
            "id",
            id
        );

    if (error) {
        console.error(
            "Delete message error:",
            error
        );

        messageElement?.classList.remove(
            "deleting"
        );

        showChatError(
            "تعذر حذف الرسالة. تأكد من سياسات RLS."
        );

        return;
    }

    reactionCache.delete(
        id
    );

    messageElement?.remove();

    /*
     * إذا أصبحت المحادثة فارغة،
     * عرض الحالة الفارغة.
     */
    if (
        !messagesContainer.querySelector(
            ".message"
        )
    ) {
        messagesContainer.innerHTML = `
            <div class="empty-messages">
                <div class="empty-icon">
                    💬
                </div>

                <strong>
                    لا توجد رسائل بعد
                </strong>

                <small>
                    ابدأ بإرسال رسالة الآن
                </small>
            </div>
        `;
    }
}

/* =========================
   19. REACTIONS
   ========================= */

async function toggleReaction(
    messageId,
    reaction
) {
    if (
        !messageId ||
        !currentUser ||
        !REACTIONS.includes(
            reaction
        )
    ) {
        return;
    }

    const {
        data: existing,
        error: existingError
    } = await db
        .from("message_reactions")
        .select(
            "id,reaction"
        )
        .eq(
            "message_id",
            messageId
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .maybeSingle();

    if (existingError) {
        console.error(
            "Reaction lookup:",
            existingError
        );

        showChatError(
            "تعذر قراءة التفاعل."
        );

        return;
    }

    /*
     * إذا كان المستخدم لديه تفاعل:
     * - نفس التفاعل = إزالته
     * - تفاعل مختلف = تغييره
     */
    if (existing) {
        let result;

        if (
            existing.reaction ===
            reaction
        ) {
            result =
                await db
                    .from(
                        "message_reactions"
                    )
                    .delete()
                    .eq(
                        "id",
                        existing.id
                    );
        } else {
            result =
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
        }

        if (result.error) {
            console.error(
                "Reaction update:",
                result.error
            );

            showChatError(
                "تعذر تحديث التفاعل."
            );

            return;
        }

    } else {
        const {
            error
        } = await db
            .from(
                "message_reactions"
            )
            .insert({
                message_id:
                    messageId,
                user_id:
                    currentUser.id,
                reaction
            });

        if (error) {
            console.error(
                "Reaction insert:",
                error
            );

            showChatError(
                "تعذر إضافة التفاعل."
            );

            return;
        }
    }

    await refreshReactions(
        messageId
    );
}

async function refreshReactions(
    messageId
) {
    if (!messageId) {
        return;
    }

    const {
        data,
        error
    } = await db
        .from("message_reactions")
        .select(
            "id,message_id,user_id,reaction,created_at"
        )
        .eq(
            "message_id",
            messageId
        );

    if (error) {
        console.error(
            "Refresh reactions:",
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

function renderReactionSummary(
    messageId
) {
    const box =
        messagesContainer.querySelector(
            `[data-reactions-for="${cssEscape(
                messageId
            )}"]`
        );

    if (!box) {
        return;
    }

    const list =
        reactionCache.get(
            messageId
        ) || [];

    const counts =
        new Map();

    const mine =
        new Set();

    list.forEach(item => {
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
    });

    box.innerHTML =
        REACTIONS
            .filter(
                reaction =>
                    counts.has(
                        reaction
                    )
            )
            .map(
                reaction => `
                    <button
                        type="button"
                        class="reaction-summary ${
                            mine.has(
                                reaction
                            )
                                ? "mine"
                                : ""
                        }"
                        data-summary-reaction="${reaction}"
                        title="تفاعل ${reaction}"
                        aria-label="تفاعل ${reaction}"
                    >
                        <span>
                            ${reaction}
                        </span>

                        <b>
                            ${counts.get(
                                reaction
                            )}
                        </b>
                    </button>
                `
            )
            .join("");

    box.querySelectorAll(
        ".reaction-summary"
    ).forEach(button => {
        button.addEventListener(
            "click",
            async event => {
                event.preventDefault();
                event.stopPropagation();

                await toggleReaction(
                    messageId,
                    button.dataset
                        .summaryReaction
                );
            }
        );
    });
}

/* =========================
   20. SEND MESSAGE
   ========================= */

async function sendMessage(
    event
) {
    event?.preventDefault();

    if (
        !currentConversation?.id
    ) {
        showChatError(
            "اختر محادثة أولاً."
        );

        return;
    }

    const text =
        messageInput.value.trim();

    /*
     * إذا كانت هناك صورة مختارة،
     * إرسال الصورة بدل النص.
     */
    if (selectedImage) {
        await uploadImage(
            selectedImage
        );

        return;
    }

    if (!text) {
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
            "Send message error:",
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

/* =========================
   21. IMAGE SELECTION
   ========================= */

function handleImageSelection(
    event
) {
    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {
        clearFilePreview();

        showChatError(
            "الملف المختار ليس صورة."
        );

        return;
    }

    /*
     * الحد الأقصى 10 MB.
     */
    if (
        file.size >
        10 * 1024 * 1024
    ) {
        clearFilePreview();

        showChatError(
            "حجم الصورة يجب ألا يتجاوز 10 ميغابايت."
        );

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
                title="إلغاء الصورة"
                aria-label="إلغاء الصورة"
            >
                ✕
            </button>
        </div>
    `;

    document
        .getElementById(
            "removeFileButton"
        )
        ?.addEventListener(
            "click",
            clearFilePreview
        );
}

/* =========================
   22. UPLOAD IMAGE
   ========================= */

async function uploadImage(
    file
) {
    if (
        !file ||
        !currentConversation?.id ||
        !currentUser?.id
    ) {
        return;
    }

    const extension =
        ext(
            file.name
        );

    const path =
        `images/${currentConversation.id}/${currentUser.id}/${crypto.randomUUID()}.${extension}`;

    const upload =
        await db.storage
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
                        file.type
                }
            );

    if (upload.error) {
        console.error(
            "Image upload:",
            upload.error
        );

        showChatError(
            "تعذر رفع الصورة."
        );

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
                "image",
            content:
                file.name,
            file_path:
                path
        });

    if (error) {
        console.error(
            "Image message insert:",
            error
        );

        showChatError(
            "تم رفع الصورة ولكن تعذر إرسالها."
        );

        return;
    }

    clearFilePreview();

    messageInput.focus();
}

/* =========================
   23. AUDIO RECORDING
   ========================= */

async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
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

    if (!currentConversation?.id) {
        showChatError(
            "اختر محادثة أولاً."
        );

        return;
    }

    try {
        const stream =
            await navigator.mediaDevices.getUserMedia(
                {
                    audio: true
                }
            );

        audioChunks = [];

        let mimeType = "";

        if (
            typeof MediaRecorder !==
            "undefined"
        ) {
            const supportedTypes = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg;codecs=opus",
                "audio/ogg",
                "audio/mp4"
            ];

            mimeType =
                supportedTypes.find(
                    type =>
                        typeof MediaRecorder.isTypeSupported ===
                            "function" &&
                        MediaRecorder.isTypeSupported(
                            type
                        )
                ) || "";
        }

        mediaRecorder =
            mimeType
                ? new MediaRecorder(
                      stream,
                      {
                          mimeType
                      }
                  )
                : new MediaRecorder(
                      stream
                  );

        mediaRecorder.ondataavailable =
            event => {
                if (
                    event.data &&
                    event.data.size >
                        0
                ) {
                    audioChunks.push(
                        event.data
                    );
                }
            };

        mediaRecorder.onstop =
            async () => {
                try {
                    stream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                    const type =
                        mediaRecorder
                            ?.mimeType ||
                        "audio/webm";

                    const blob =
                        new Blob(
                            audioChunks,
                            {
                                type
                            }
                        );

                    if (
                        blob.size >
                        0
                    ) {
                        await uploadAudio(
                            blob
                        );
                    }
                } catch (error) {
                    console.error(
                        "Audio processing:",
                        error
                    );

                    showChatError(
                        "تعذر معالجة التسجيل الصوتي."
                    );
                } finally {
                    audioChunks = [];
                    mediaRecorder = null;
                }
            };

        mediaRecorder.start();

        isRecording = true;

        recordButton.textContent =
            "⏹️";

        recordButton.classList.add(
            "recording"
        );

        recordButton.title =
            "إيقاف التسجيل";

        recordButton.setAttribute(
            "aria-label",
            "إيقاف التسجيل"
        );

    } catch (error) {
        console.error(
            "Microphone error:",
            error
        );

        showChatError(
            "تعذر الوصول إلى الميكروفون. تأكد من السماح للموقع باستخدامه."
        );
    }
}

function stopRecording() {
    if (
        mediaRecorder &&
        mediaRecorder.state !==
            "inactive"
    ) {
        mediaRecorder.stop();
    }

    isRecording = false;

    recordButton.textContent =
        "🎤";

    recordButton.classList.remove(
        "recording"
    );

    recordButton.title =
        "تسجيل صوتي";

    recordButton.setAttribute(
        "aria-label",
        "تسجيل صوتي"
    );
}

/* =========================
   24. UPLOAD AUDIO
   ========================= */

async function uploadAudio(
    blob
) {
    if (
        !blob ||
        !currentConversation?.id ||
        !currentUser?.id
    ) {
        return;
    }

    /*
     * الامتداد الافتراضي WebM.
     */
    let extension = "webm";

    const mime =
        blob.type?.toLowerCase() ||
        "";

    if (
        mime.includes("ogg")
    ) {
        extension = "ogg";
    } else if (
        mime.includes("mp4")
    ) {
        extension = "m4a";
    }

    const path =
        `audio/${currentConversation.id}/${currentUser.id}/${crypto.randomUUID()}.${extension}`;

    const upload =
        await db.storage
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

    if (upload.error) {
        console.error(
            "Audio upload:",
            upload.error
        );

        showChatError(
            "تعذر رفع التسجيل الصوتي."
        );

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
                "audio",
            content:
                "رسالة صوتية",
            file_path:
                path
        });

    if (error) {
        console.error(
            "Audio message insert:",
            error
        );

        showChatError(
            "تم رفع التسجيل ولكن تعذر إرساله."
        );
    }
}

/* =========================
   25. SIGNED URL
   ========================= */

async function signedUrl(
    path
) {
    if (!path) {
        return null;
    }

    const {
        data,
        error
    } = await db.storage
        .from("chat-files")
        .createSignedUrl(
            path,
            3600
        );

    if (error) {
        console.error(
            "Signed URL error:",
            error
        );

        return null;
    }

    return (
        data?.signedUrl ||
        null
    );
}

/* =========================
   26. REALTIME
   ========================= */

function subscribeRealtime() {
    if (
        !currentConversation?.id
    ) {
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
        db.channel(
            `chat-${conversationId}-${Date.now()}`
        );

    /*
     * الرسائل.
     */
    realtimeChannel.on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "messages",
            filter:
                `conversation_id=eq.${conversationId}`
        },
        async payload => {
            try {
                /*
                 * حذف.
                 */
                if (
                    payload.eventType ===
                    "DELETE"
                ) {
                    const id =
                        payload.old?.id;

                    if (id) {
                        messagesContainer
                            .querySelector(
                                `[data-message-id="${cssEscape(
                                    id
                                )}"]`
                            )
                            ?.remove();

                        reactionCache.delete(
                            id
                        );
                    }

                    return;
                }

                /*
                 * إدخال رسالة جديدة.
                 */
                if (
                    payload.eventType ===
                    "INSERT"
                ) {
                    const message =
                        payload.new;

                    if (!message?.id) {
                        return;
                    }

                    /*
                     * منع تكرار الرسالة.
                     */
                    if (
                        messagesContainer.querySelector(
                            `[data-message-id="${cssEscape(
                                message.id
                            )}"]`
                        )
                    ) {
                        return;
                    }

                    messagesContainer
                        .querySelector(
                            ".empty-messages"
                        )
                        ?.remove();

                    /*
                     * تحميل ملف المرسل
                     * إذا لم يكن موجودًا.
                     */
                    if (
                        message.sender_id &&
                        !profileCache.has(
                            message.sender_id
                        )
                    ) {
                        const {
                            data
                        } = await db
                            .from(
                                "profiles"
                            )
                            .select(
                                "id,display_name,role"
                            )
                            .eq(
                                "id",
                                message.sender_id
                            )
                            .maybeSingle();

                        if (data) {
                            profileCache.set(
                                data.id,
                                data
                            );
                        }
                    }

                    reactionCache.set(
                        message.id,
                        []
                    );

                    await renderMessage(
                        message
                    );

                    scrollBottom();
                }

            } catch (error) {
                console.error(
                    "Realtime message error:",
                    error
                );
            }
        }
    );

    /*
     * التفاعلات.
     */
    realtimeChannel.on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "message_reactions"
        },
        async payload => {
            try {
                const messageId =
                    payload.new?.message_id ||
                    payload.old?.message_id;

                if (!messageId) {
                    return;
                }

                const messageExists =
                    messagesContainer.querySelector(
                        `[data-message-id="${cssEscape(
                            messageId
                        )}"]`
                    );

                if (!messageExists) {
                    return;
                }

                await refreshReactions(
                    messageId
                );

            } catch (error) {
                console.error(
                    "Realtime reaction error:",
                    error
                );
            }
        }
    );

    realtimeChannel.subscribe(
        status => {
            if (
                status ===
                "CHANNEL_ERROR"
            ) {
                console.error(
                    "Realtime channel error."
                );
            }
        }
    );
}

/* =========================
   27. LOGOUT
   ========================= */

async function logout() {
    try {
        if (isRecording) {
            stopRecording();
        }

        const {
            error
        } = await db.auth.signOut();

        if (error) {
            throw error;
        }

    } catch (error) {
        console.error(
            "Logout error:",
            error
        );

        showLoginError(
            authMessage(error)
        );
    }
}

/* =========================
   28. RESET APPLICATION
   ========================= */

async function resetApplication() {
    currentUser = null;
    currentProfile = null;
    currentConversation = null;

    profileCache.clear();
    reactionCache.clear();

    closeContextMenu();

    if (realtimeChannel) {
        try {
            await db.removeChannel(
                realtimeChannel
            );
        } catch (error) {
            console.error(
                "Remove channel error:",
                error
            );
        }

        realtimeChannel = null;
    }

    if (isRecording) {
        stopRecording();
    }

    clearFilePreview();

    messagesContainer.innerHTML = `
        <div class="empty-messages">
            <div class="empty-icon">
                👋
            </div>

            <strong>
                مرحبًا بك في مركز التواصل
            </strong>

            <small>
                ابدأ بإرسال رسالة الآن
            </small>
        </div>
    `;

    app.classList.add(
        "hidden"
    );

    loginScreen.classList.remove(
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

/* =========================
   29. UI HELPERS
   ========================= */

function clearLoginError() {
    loginError.textContent = "";
    loginError.className =
        "error";
}

function showLoginError(
    message
) {
    loginError.textContent =
        message || "";

    loginError.className =
        "error";
}

function showLoginSuccess(
    message
) {
    loginError.textContent =
        message || "";

    loginError.className =
        "success";
}

function showChatError(
    message
) {
    if (!messagesContainer) {
        return;
    }

    /*
     * إزالة أخطاء قديمة لتجنب
     * تكدس التنبيهات.
     */
    messagesContainer
        .querySelectorAll(
            ".chat-error"
        )
        .forEach(
            element =>
                element.remove()
        );

    const error =
        document.createElement(
            "div"
        );

    error.className =
        "chat-error";

    error.textContent =
        message || "حدث خطأ.";

    messagesContainer.appendChild(
        error
    );

    scrollBottom();

    setTimeout(() => {
        error.remove();
    }, 4500);
}

function setButton(
    button,
    loading,
    text
) {
    if (!button) {
        return;
    }

    button.disabled =
        Boolean(loading);

    button.textContent =
        text;
}

function setActive(
    button
) {
    document
        .querySelectorAll(
            ".conversation-button"
        )
        .forEach(item =>
            item.classList.remove(
                "active"
            )
        );

    button?.classList.add(
        "active"
    );
}

function clearFilePreview() {
    selectedImage = null;

    if (imageInput) {
        imageInput.value = "";
    }

    if (filePreview) {
        filePreview.innerHTML =
            "";

        filePreview.classList.add(
            "hidden"
        );
    }
}

function scrollBottom() {
    requestAnimationFrame(() => {
        if (!messagesContainer) {
            return;
        }

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;
    });
}

/* =========================
   30. SECURITY / UTILITY
   ========================= */

function escapeHtml(
    value
) {
    const element =
        document.createElement(
            "div"
        );

    element.textContent =
        value == null
            ? ""
            : String(value);

    return element.innerHTML;
}

function cssEscape(
    value
) {
    const stringValue =
        String(value);

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
        /["\\]/g,
        "\\$&"
    );
}

function ext(
    filename
) {
    const extension =
        String(filename || "")
            .split(".")
            .pop()
            .toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                ""
            );

    return (
        extension ||
        "bin"
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

/* =========================
   31. AUTH ERROR MESSAGES
   ========================= */

function authMessage(
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
        return (
            "البريد الإلكتروني أو كلمة المرور غير صحيحة."
        );
    }

    if (
        message.includes(
            "email rate limit exceeded"
        )
    ) {
        return (
            "تم تجاوز حد إرسال رسائل الاسترجاع مؤقتًا. انتظر قليلًا ثم حاول مرة أخرى."
        );
    }

    if (
        message.includes(
            "email not confirmed"
        )
    ) {
        return (
            "يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول."
        );
    }

    if (
        message.includes(
            "password should be at least"
        )
    ) {
        return (
            "كلمة المرور قصيرة جدًا."
        );
    }

    return (
        error?.message ||
        "حدث خطأ غير معروف."
    );
}
