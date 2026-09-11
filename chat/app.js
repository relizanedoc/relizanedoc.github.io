"use strict";

/* =========================================================
   SUPABASE
========================================================= */

const { createClient } = window.supabase;

if (
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY
) {
    throw new Error(
        "SUPABASE_URL أو SUPABASE_ANON_KEY غير موجود في config.js"
    );
}

const db = createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);


/* =========================================================
   DOM ELEMENTS
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

        loginButton.addEventListener(
            "click",
            login
        );

        forgotPasswordButton.addEventListener(
            "click",
            resetPassword
        );

        logoutButton.addEventListener(
            "click",
            logout
        );

        groupButton.addEventListener(
            "click",
            openGroupConversation
        );

        messageForm.addEventListener(
            "submit",
            sendMessage
        );

        imageInput.addEventListener(
            "change",
            handleImageSelection
        );

        recordButton.addEventListener(
            "click",
            toggleRecording
        );


        messageInput.addEventListener(
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


        /*
         * مراقبة حالة تسجيل الدخول
         */

        db.auth.onAuthStateChange(
            async function (event, session) {

                if (event === "PASSWORD_RECOVERY") {

                    showPasswordUpdateScreen();

                    return;
                }


                if (event === "SIGNED_IN") {

                    if (
                        session &&
                        session.user &&
                        !currentUser
                    ) {
                        await startApplication(
                            session.user
                        );
                    }

                    return;
                }


                if (event === "SIGNED_OUT") {

                    currentUser = null;
                    currentProfile = null;
                    currentConversation = null;

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


        /*
         * الحصول على الجلسة الحالية
         */

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
            email: email,
            password: password
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
            "دخول"
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

        /*
         * مهم:
         * يجب أن يكون redirectTo هو عنوان الموقع نفسه
         * وليس /** أو أي مسار آخر.
         */

        const redirectTo =
            window.location.origin + "/";


        const {
            error
        } = await db.auth.resetPasswordForEmail(
            email,
            {
                redirectTo: redirectTo
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
   PASSWORD UPDATE SCREEN
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
                    password: password
                });


                if (error) {

                    console.error(
                        "Password update error:",
                        error
                    );

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
                    "Unexpected password update error:",
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
            .select("*")
            .eq("id", user.id)
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


    /*
     * العميل لا يحتاج إلى رؤية قائمة العملاء.
     */

    if (currentProfile.role !== "admin") {

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
        .select("id, display_name, role")
        .eq("role", "customer")
        .order("display_name");


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


    if (!data || data.length === 0) {

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

                <span>👤</span>

                <div>

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
            error.message
        );
    }
}


/* =========================================================
   OPEN PRIVATE CONVERSATION
========================================================= */

async function openPrivateConversation(customer) {

    if (!currentUser || !customer) {
        return;
    }


    try {

        let conversation = null;


        /*
         * البحث عن المحادثة الخاصة الموجودة.
         */

        const {
            data: existingConversation,
            error: searchError
        } = await db
            .from("conversations")
            .select("*")
            .eq("type", "private")
            .eq("customer_id", customer.id)
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


        /*
         * إذا كان المستخدم Admin ولا توجد محادثة،
         * نحاول إنشاءها.
         */

        if (
            !conversation &&
            currentProfile &&
            currentProfile.role === "admin"
        ) {

            const {
                data: createdConversation,
                error: createError
            } = await db
                .from("conversations")
                .insert({
                    type: "private",
                    customer_id: customer.id
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


            /*
             * إضافة العميل والـ Admin إلى المحادثة.
             */

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


        /*
         * إزالة active من المجموعة
         */

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
            error.message
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
        data,
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


    if (!data || data.length === 0) {

        messagesContainer.innerHTML = `
            <div class="empty-messages">
                لا توجد رسائل بعد
            </div>
        `;

        return;
    }


    messagesContainer.innerHTML = "";


    for (
        const message of data
    ) {

        await renderMessage(
            message
        );
    }


    scrollMessagesToBottom();
}


/* =========================================================
   RENDER MESSAGE
========================================================= */

async function renderMessage(message) {

    const messageElement =
        document.createElement("div");


    const ownMessage =
        message.sender_id ===
        currentUser.id;


    messageElement.className =
        ownMessage
            ? "message own"
            : "message";


    let senderName = "مستخدم";


    if (
        profileCache.has(
            message.sender_id
        )
    ) {

        senderName =
            profileCache.get(
                message.sender_id
            ).display_name ||
            "مستخدم";

    } else {

        const {
            data
        } = await db
            .from("profiles")
            .select(
                "id, display_name, role"
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

            senderName =
                data.display_name ||
                "مستخدم";
        }
    }


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
                    href="${imageUrl}"
                    target="_blank"
                    rel="noopener"
                >
                    <img
                        class="message-image"
                        src="${imageUrl}"
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
                    src="${audioUrl}"
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

        <div class="message-bubble">

            ${
                !ownMessage
                    ? `
                        <div class="message-sender">
                            ${escapeHtml(
                                senderName
                            )}
                        </div>
                    `
                    : ""
            }

            ${content}

            <div class="message-time">
                ${date}
            </div>

        </div>

    `;


    messagesContainer.appendChild(
        messageElement
    );
}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(event) {

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


    if (!text && !selectedImage) {
        return;
    }


    /*
     * إذا كانت هناك صورة مختارة
     */

    if (selectedImage) {

        await uploadImage(
            selectedImage
        );

        return;
    }


    /*
     * إرسال النص
     */

    await sendTextMessage(
        text
    );
}


/* =========================================================
   SEND TEXT
========================================================= */

async function sendTextMessage(text) {

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
   IMAGE SELECTION
========================================================= */

function handleImageSelection(event) {

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


    /*
     * حد أقصى 10MB
     */

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
                ${escapeHtml(file.name)}
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

async function uploadImage(file) {

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
            error.message
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


/* =========================================================
   START RECORDING
========================================================= */

async function startRecording() {

    if (!navigator.mediaDevices) {

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


/* =========================================================
   STOP RECORDING
========================================================= */

function stopRecording() {

    if (
        !mediaRecorder ||
        mediaRecorder.state === "inactive"
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

async function uploadAudio(blob) {

    if (!currentConversation) {

        showChatError(
            "اختر محادثة أولاً."
        );

        return;
    }


    try {

        const extension =
            "webm";


        const filePath =
            `audio/${currentConversation.id}/${currentUser.id}/${crypto.randomUUID()}.${extension}`;


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
            error.message
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


    /*
     * إزالة الاشتراك السابق
     */

    if (realtimeChannel) {

        db.removeChannel(
            realtimeChannel
        );

        realtimeChannel = null;
    }


    realtimeChannel =
        db
            .channel(
                `messages-${currentConversation.id}`
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",

                    schema: "public",

                    table: "messages",

                    filter:
                        `conversation_id=eq.${currentConversation.id}`
                },

                async function (payload) {

                    /*
                     * التأكد من أن الرسالة تخص
                     * المحادثة الحالية.
                     */

                    if (
                        !currentConversation ||
                        payload.new.conversation_id !==
                        currentConversation.id
                    ) {
                        return;
                    }


                    /*
                     * إزالة رسالة "لا توجد رسائل"
                     */

                    const empty =
                        messagesContainer.querySelector(
                            ".empty-messages"
                        );


                    if (empty) {
                        empty.remove();
                    }


                    await renderMessage(
                        payload.new
                    );


                    scrollMessagesToBottom();
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
            error.message
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

    loginError.textContent = "";

    loginError.className = "";
}


function showError(message) {

    loginError.textContent =
        message || "حدث خطأ.";

    loginError.className =
        "error";
}


function showSuccess(message) {

    loginError.textContent =
        message || "";

    loginError.className =
        "success";
}


function showChatError(message) {

    console.error(
        "Chat error:",
        message
    );


    /*
     * إظهار الخطأ داخل منطقة الرسائل
     * حتى لا يفشل التطبيق بصمت.
     */

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

    imageInput.value = "";

    filePreview.innerHTML = "";

    filePreview.classList.add(
        "hidden"
    );
}


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {

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

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}


/* =========================================================
   AUTH ERROR TRANSLATION
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
