const {
    createClient
} = supabase;


const db = createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);


// ===============================
// VARIABLES
// ===============================

let currentUser = null;

let currentProfile = null;

let currentConversation = null;

let currentCustomer = null;

let realtimeChannel = null;

let mediaRecorder = null;

let audioChunks = [];


// ===============================
// ELEMENTS
// ===============================

const loginScreen =
    document.getElementById("loginScreen");

const app =
    document.getElementById("app");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const loginError =
    document.getElementById("loginError");

const groupButton =
    document.getElementById("groupButton");

const customersList =
    document.getElementById("customersList");

const messages =
    document.getElementById("messages");

const conversationTitle =
    document.getElementById("conversationTitle");

const conversationSubtitle =
    document.getElementById("conversationSubtitle");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const imageInput =
    document.getElementById("imageInput");

const recordButton =
    document.getElementById("recordButton");

const logoutButton =
    document.getElementById("logoutButton");


// ===============================
// START
// ===============================

initialize();


async function initialize() {

    const {
        data: {
            session
        }
    } = await db.auth.getSession();

    if (session) {

        await startApplication(
            session.user
        );

    }
}


// ===============================
// AUTH STATE
// ===============================

db.auth.onAuthStateChange(
    async (event, session) => {

        if (!session) {

            app.classList.add("hidden");

            loginScreen.classList.remove("hidden");

            return;
        }

        if (event === "SIGNED_IN") {

            await startApplication(
                session.user
            );
        }

    }
);


// ===============================
// LOGIN
// ===============================

loginButton.addEventListener(
    "click",
    login
);


async function login() {

    loginError.textContent = "";

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    if (!email || !password) {

        loginError.textContent =
            "أدخل البريد الإلكتروني وكلمة المرور.";

        return;
    }


    const {
        error
    } = await db.auth.signInWithPassword({

        email,

        password

    });


    if (error) {

        loginError.textContent =
            "بيانات الدخول غير صحيحة.";

    }

}


// ===============================
// APPLICATION
// ===============================

async function startApplication(user) {

    currentUser = user;


    const {
        data: profile,
        error
    } = await db
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


    if (error || !profile) {

        alert(
            "لم يتم إنشاء ملف المستخدم في جدول profiles."
        );

        return;
    }


    currentProfile = profile;


    loginScreen.classList.add("hidden");

    app.classList.remove("hidden");


    await loadCustomers();


    await openGroupConversation();

}


// ===============================
// CUSTOMERS
// ===============================

async function loadCustomers() {

    customersList.innerHTML = "";


    if (currentProfile.role !== "admin") {

        const ownPrivate =
            document.createElement("div");

        ownPrivate.className =
            "customer";

        ownPrivate.textContent =
            "🔒 محادثتي الخاصة";

        ownPrivate.addEventListener(
            "click",
            async () => {

                await openPrivateConversation(
                    currentUser.id,
                    currentProfile.display_name
                );

            }
        );


        customersList.appendChild(
            ownPrivate
        );

        return;
    }


    const {
        data,
        error
    } = await db
        .from("profiles")
        .select(
            "id,display_name"
        )
        .eq("role", "customer")
        .order(
            "display_name",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(error);

        return;
    }


    data.forEach(customer => {

        const item =
            document.createElement("div");


        item.className =
            "customer";


        item.innerHTML =
            "👤 " +
            escapeHtml(
                customer.display_name
            );


        item.addEventListener(
            "click",
            async () => {

                await openPrivateConversation(
                    customer.id,
                    customer.display_name
                );

            }
        );


        customersList.appendChild(
            item
        );

    });

}


// ===============================
// GROUP CONVERSATION
// ===============================

groupButton.addEventListener(
    "click",
    openGroupConversation
);


async function openGroupConversation() {

    currentCustomer = null;


    let {
        data: conversation
    } = await db
        .from("conversations")
        .select("*")
        .eq("type", "group")
        .limit(1)
        .maybeSingle();


    if (!conversation) {

        const result =
            await db
                .from("conversations")
                .insert({

                    type: "group"

                })
                .select()
                .single();


        if (result.error) {

            console.error(
                result.error
            );

            return;
        }


        conversation =
            result.data;
    }


    currentConversation =
        conversation;


    await ensureGroupMembers(
        conversation.id
    );


    conversationTitle.textContent =
        "👥 المجموعة";

    conversationSubtitle.textContent =
        "المحادثة الجماعية";


    updateActiveSidebar(
        groupButton
    );


    await loadMessages();

    subscribeToMessages();

}


// ===============================
// GROUP MEMBERS
// ===============================

async function ensureGroupMembers(
    conversationId
) {

    const {
        data: profiles
    } = await db
        .from("profiles")
        .select("id");


    if (!profiles) return;


    const {
        data: members
    } = await db
        .from("conversation_members")
        .select("user_id")
        .eq(
            "conversation_id",
            conversationId
        );


    const existing =
        new Set(
            (members || [])
                .map(member =>
                    member.user_id
                )
        );


    const missing =
        profiles
            .filter(
                profile =>
                    !existing.has(
                        profile.id
                    )
            )
            .map(
                profile => ({

                    conversation_id:
                        conversationId,

                    user_id:
                        profile.id

                })
            );


    if (missing.length) {

        await db
            .from("conversation_members")
            .insert(missing);

    }

}


// ===============================
// PRIVATE CONVERSATION
// ===============================

async function openPrivateConversation(
    customerId,
    customerName
) {

    currentCustomer = {
        id: customerId,
        display_name: customerName
    };


    let {
        data: conversation
    } = await db
        .from("conversations")
        .select("*")
        .eq("type", "private")
        .eq(
            "customer_id",
            customerId
        )
        .limit(1)
        .maybeSingle();


    if (!conversation) {

        const result =
            await db
                .from("conversations")
                .insert({

                    type: "private",

                    customer_id:
                        customerId

                })
                .select()
                .single();


        if (result.error) {

            console.error(
                result.error
            );

            alert(
                "تعذر إنشاء المحادثة الخاصة."
            );

            return;
        }


        conversation =
            result.data;

    }


    currentConversation =
        conversation;


    await ensurePrivateMembers(
        conversation.id,
        customerId
    );


    conversationTitle.textContent =
        "🔒 " + customerName;

    conversationSubtitle.textContent =
        "محادثة خاصة";


    updateActiveSidebar();


    await loadMessages();

    subscribeToMessages();

}


// ===============================
// PRIVATE MEMBERS
// ===============================

async function ensurePrivateMembers(
    conversationId,
    customerId
) {

    const users = [
        currentUser.id,
        customerId
    ];


    const uniqueUsers =
        [...new Set(users)];


    for (const userId of uniqueUsers) {

        const {
            data
        } = await db
            .from(
                "conversation_members"
            )
            .select("*")
            .eq(
                "conversation_id",
                conversationId
            )
            .eq(
                "user_id",
                userId
            )
            .maybeSingle();


        if (!data) {

            await db
                .from(
                    "conversation_members"
                )
                .insert({

                    conversation_id:
                        conversationId,

                    user_id:
                        userId

                });

        }

    }

}


// ===============================
// LOAD MESSAGES
// ===============================

async function loadMessages() {

    messages.innerHTML = "";


    if (!currentConversation)
        return;


    const {
        data,
        error
    } = await db
        .from("messages")
        .select(`
            id,
            conversation_id,
            sender_id,
            message_type,
            content,
            file_path,
            created_at,
            profiles (
                display_name
            )
        `)
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

        console.error(error);

        return;
    }


    for (const message of data) {

        await renderMessage(
            message
        );

    }


    scrollMessages();

}


// ===============================
// REALTIME
// ===============================

function subscribeToMessages() {

    if (realtimeChannel) {

        db.removeChannel(
            realtimeChannel
        );

    }


    if (!currentConversation)
        return;


    realtimeChannel =
        db.channel(
            "chat-" +
            currentConversation.id
        );


    realtimeChannel
        .on(

            "postgres_changes",

            {
                event: "INSERT",

                schema: "public",

                table: "messages",

                filter:
                    "conversation_id=eq." +
                    currentConversation.id

            },

            async payload => {

                const {
                    data
                } = await db
                    .from("messages")
                    .select(`
                        id,
                        conversation_id,
                        sender_id,
                        message_type,
                        content,
                        file_path,
                        created_at,
                        profiles (
                            display_name
                        )
                    `)
                    .eq(
                        "id",
                        payload.new.id
                    )
                    .single();


                if (data) {

                    await renderMessage(
                        data
                    );

                    scrollMessages();

                }

            }

        )
        .subscribe();

}


// ===============================
// RENDER MESSAGE
// ===============================

async function renderMessage(message) {

    const element =
        document.createElement("div");


    element.className =
        "message";


    if (
        message.sender_id ===
        currentUser.id
    ) {

        element.classList.add(
            "mine"
        );

    }


    const senderName =
        message.profiles?.display_name ||
        "مستخدم";


    const sender =
        document.createElement(
            "div"
        );


    sender.className =
        "sender";


    sender.textContent =
        senderName;


    element.appendChild(
        sender
    );


    if (
        message.message_type ===
        "text"
    ) {

        const text =
            document.createElement(
                "div"
            );


        text.className =
            "message-text";


        text.textContent =
            message.content || "";


        element.appendChild(
            text
        );

    }


    if (
        message.message_type ===
        "image"
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.className =
            "message-image";


        const {
            data,
            error
        } =
            await db.storage
                .from("chat-files")
                .createSignedUrl(
                    message.file_path,
                    3600
                );


        if (!error && data) {

            image.src =
                data.signedUrl;

        }


        image.alt =
            "صورة";


        element.appendChild(
            image
        );

    }


    if (
        message.message_type ===
        "audio"
    ) {

        const audio =
            document.createElement(
                "audio"
            );


        audio.controls =
            true;


        const {
            data,
            error
        } =
            await db.storage
                .from("chat-files")
                .createSignedUrl(
                    message.file_path,
                    3600
                );


        if (!error && data) {

            audio.src =
                data.signedUrl;

        }


        element.appendChild(
            audio
        );

    }


    const time =
        document.createElement(
            "div"
        );


    time.className =
        "message-time";


    time.textContent =
        new Date(
            message.created_at
        ).toLocaleString(
            "ar-DZ"
        );


    element.appendChild(
        time
    );


    messages.appendChild(
        element
    );

}


// ===============================
// SEND TEXT
// ===============================

messageForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const text =
            messageInput.value.trim();


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

            alert(
                "تعذر إرسال الرسالة."
            );

            console.error(error);

            return;

        }


        messageInput.value = "";

    }
);


// ===============================
// IMAGE
// ===============================

imageInput.addEventListener(
    "change",
    async event => {

        const file =
            event.target.files[0];


        if (!file)
            return;


        if (
            !currentConversation
        )
            return;


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "الملف ليس صورة."
            );

            return;
        }


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            alert(
                "أقصى حجم للصورة 10MB."
            );

            return;
        }


        const extension =
            file.name
                .split(".")
                .pop();


        const path =
            currentUser.id +
            "/" +
            crypto.randomUUID() +
            "." +
            extension;


        const upload =
            await db.storage
                .from("chat-files")
                .upload(
                    path,
                    file,
                    {
                        contentType:
                            file.type,

                        upsert: false
                    }
                );


        if (upload.error) {

            alert(
                "فشل رفع الصورة."
            );

            console.error(
                upload.error
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

                file_path:
                    path

            });


        if (error) {

            alert(
                "تم رفع الصورة لكن لم يتم إرسالها."
            );

            console.error(error);

        }


        imageInput.value = "";

    }
);


// ===============================
// AUDIO RECORDING
// ===============================

recordButton.addEventListener(
    "click",
    startOrStopRecording
);


async function startOrStopRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state ===
        "recording"
    ) {

        mediaRecorder.stop();

        return;

    }


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        alert(
            "المتصفح لا يدعم التسجيل الصوتي."
        );

        return;
    }


    if (!currentConversation) {

        return;
    }


    try {

        const stream =
            await navigator
                .mediaDevices
                .getUserMedia({
                    audio: true
                });


        audioChunks = [];


        mediaRecorder =
            new MediaRecorder(
                stream
            );


        mediaRecorder.ondataavailable =
            event => {

                if (
                    event.data.size > 0
                ) {

                    audioChunks.push(
                        event.data
                    );

                }

            };


        mediaRecorder.onstop =
            async () => {

                stream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );


                recordButton.classList
                    .remove(
                        "recording"
                    );


                recordButton.textContent =
                    "🎤";


                const blob =
                    new Blob(
                        audioChunks,
                        {
                            type:
                                "audio/webm"
                        }
                    );


                if (
                    blob.size >
                    10 * 1024 * 1024
                ) {

                    alert(
                        "التسجيل كبير جدًا."
                    );

                    return;
                }


                const path =
                    currentUser.id +
                    "/" +
                    crypto.randomUUID() +
                    ".webm";


                const upload =
                    await db.storage
                        .from(
                            "chat-files"
                        )
                        .upload(
                            path,
                            blob,
                            {
                                contentType:
                                    "audio/webm",

                                upsert:
                                    false
                            }
                        );


                if (
                    upload.error
                ) {

                    alert(
                        "فشل رفع التسجيل."
                    );

                    console.error(
                        upload.error
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

                        file_path:
                            path

                    });


                if (error) {

                    alert(
                        "فشل إرسال التسجيل."
                    );

                    console.error(
                        error
                    );

                }

            };


        mediaRecorder.start();


        recordButton.classList.add(
            "recording"
        );


        recordButton.textContent =
            "⏹️";


    } catch (error) {

        console.error(error);

        alert(
            "لم يتم السماح باستخدام الميكروفون."
        );

    }

}


// ===============================
// LOGOUT
// ===============================

logoutButton.addEventListener(
    "click",
    async () => {

        if (realtimeChannel) {

            await db.removeChannel(
                realtimeChannel
            );

        }


        await db.auth.signOut();

    }
);


// ===============================
// HELPERS
// ===============================

function scrollMessages() {

    messages.scrollTop =
        messages.scrollHeight;

}


function updateActiveSidebar(
    element
) {

    document
        .querySelectorAll(
            ".conversation-button, .customer"
        )
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );


    if (element) {

        element.classList.add(
            "active"
        );

    }

}


function escapeHtml(value) {

    return String(
        value || ""
    ).replace(
        /[&<>"']/g,
        character => {

            const entities = {

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#039;"

            };


            return entities[
                character
            ];

        }
    );

}
