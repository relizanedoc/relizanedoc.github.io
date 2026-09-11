const { createClient } = supabase;

const db = createClient(
window.SUPABASE_URL,
window.SUPABASE_ANON_KEY
);

// ======================================================
// VARIABLES
// ======================================================

let currentUser = null;
let currentProfile = null;
let currentConversation = null;
let currentCustomer = null;
let realtimeChannel = null;

let mediaRecorder = null;
let audioChunks = [];

// ======================================================
// ELEMENTS
// ======================================================

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

const forgotPasswordButton =
document.getElementById("forgotPasswordButton");

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

// ======================================================
// START
// ======================================================

initialize();

// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {

```
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
```

}

// ======================================================
// AUTH STATE
// ======================================================

db.auth.onAuthStateChange(
async (event, session) => {

```
    console.log(
        "Auth event:",
        event
    );


    // ----------------------------------------------
    // PASSWORD RECOVERY
    // ----------------------------------------------

    if (
        event === "PASSWORD_RECOVERY"
    ) {

        showPasswordUpdateScreen();

        return;
    }


    // ----------------------------------------------
    // LOGGED OUT
    // ----------------------------------------------

    if (!session) {

        currentUser = null;
        currentProfile = null;
        currentConversation = null;

        if (realtimeChannel) {

            await db.removeChannel(
                realtimeChannel
            );

            realtimeChannel = null;
        }

        app.classList.add("hidden");

        loginScreen.classList.remove(
            "hidden"
        );

        return;
    }


    // ----------------------------------------------
    // SIGNED IN
    // ----------------------------------------------

    if (
        event === "SIGNED_IN"
    ) {

        await startApplication(
            session.user
        );

    }

}
```

);

// ======================================================
// LOGIN
// ======================================================

if (loginButton) {

```
loginButton.addEventListener(
    "click",
    login
);
```

}

async function login() {

```
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


loginButton.disabled = true;

loginButton.textContent =
    "جارٍ الدخول...";


const {
    data,
    error
} = await db.auth.signInWithPassword({

    email: email,

    password: password

});


console.log(
    "Login result:",
    data
);

console.log(
    "Login error:",
    error
);


loginButton.disabled = false;

loginButton.textContent =
    "دخول";


if (error) {

    console.error(
        "Supabase Login Error:",
        error
    );

    loginError.textContent =
        error.message;

    return;
}


loginError.textContent =
    "";
```

}

// ======================================================
// FORGOT PASSWORD
// ======================================================

if (forgotPasswordButton) {

```
forgotPasswordButton.addEventListener(
    "click",
    resetPassword
);
```

}

async function resetPassword() {

```
loginError.textContent = "";

const email =
    emailInput.value.trim();


if (!email) {

    loginError.textContent =
        "أدخل بريدك الإلكتروني أولاً.";

    emailInput.focus();

    return;
}


forgotPasswordButton.disabled =
    true;

forgotPasswordButton.textContent =
    "جارٍ الإرسال...";


const {
    error
} =
    await db.auth.resetPasswordForEmail(
        email,
        {
            redirectTo:
                window.location.origin + "/"
        }
    );


forgotPasswordButton.disabled =
    false;

forgotPasswordButton.textContent =
    "نسيت كلمة المرور؟";


if (error) {

    console.error(
        "Password reset error:",
        error
    );

    loginError.textContent =
        error.message;

    return;
}


loginError.textContent =
    "تم إرسال رابط استرجاع كلمة المرور إلى بريدك الإلكتروني.";
```

}

// ======================================================
// PASSWORD UPDATE SCREEN
// ======================================================

function showPasswordUpdateScreen() {

```
// لا ننشئ الشاشة مرتين
const existing =
    document.getElementById(
        "passwordUpdateScreen"
    );

if (existing) {

    existing.classList.remove(
        "hidden"
    );

    return;
}


const screen =
    document.createElement("div");

screen.id =
    "passwordUpdateScreen";

screen.className =
    "login-screen";


screen.innerHTML = `

    <div class="login-box">

        <div class="logo">
            🔐
        </div>

        <h1>
            تغيير كلمة المرور
        </h1>

        <p>
            أدخل كلمة المرور الجديدة
        </p>

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

    </div>

`;


document.body.appendChild(
    screen
);


const newPassword =
    document.getElementById(
        "newPassword"
    );

const confirmPassword =
    document.getElementById(
        "confirmPassword"
    );

const updateButton =
    document.getElementById(
        "updatePasswordButton"
    );

const errorElement =
    document.getElementById(
        "passwordUpdateError"
    );


updateButton.addEventListener(
    "click",
    async () => {

        errorElement.textContent =
            "";


        const password =
            newPassword.value;

        const confirmation =
            confirmPassword.value;


        if (!password) {

            errorElement.textContent =
                "أدخل كلمة المرور الجديدة.";

            return;
        }


        if (password.length < 6) {

            errorElement.textContent =
                "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.";

            return;
        }


        if (
            password !==
            confirmation
        ) {

            errorElement.textContent =
                "كلمتا المرور غير متطابقتين.";

            return;
        }


        updateButton.disabled =
            true;

        updateButton.textContent =
            "جارٍ الحفظ...";


        const {
            error
        } =
            await db.auth.updateUser({

                password:
                    password

            });


        updateButton.disabled =
            false;

        updateButton.textContent =
            "حفظ كلمة المرور";


        if (error) {

            console.error(
                "Update password error:",
                error
            );

            errorElement.textContent =
                error.message;

            return;
        }


        errorElement.textContent =
            "تم تغيير كلمة المرور بنجاح.";


        newPassword.value =
            "";

        confirmPassword.value =
            "";


        setTimeout(
            async () => {

                screen.remove();

                await db.auth.signOut();

                loginScreen.classList.remove(
                    "hidden"
                );

                app.classList.add(
                    "hidden"
                );

            },
            1500
        );

    }
);
```

}

// ======================================================
// APPLICATION
// ======================================================

async function startApplication(user) {

```
currentUser = user;


const {
    data: profile,
    error
} =
    await db
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


if (error || !profile) {

    console.error(
        "Profile error:",
        error
    );

    loginScreen.classList.remove(
        "hidden"
    );

    app.classList.add(
        "hidden"
    );

    loginError.textContent =
        "تم تسجيل الدخول، لكن لم يتم العثور على ملف المستخدم في profiles.";

    return;
}


currentProfile =
    profile;


loginScreen.classList.add(
    "hidden"
);

app.classList.remove(
    "hidden"
);


await loadCustomers();

await openGroupConversation();
```

}

// ======================================================
// CUSTOMERS
// ======================================================

async function loadCustomers() {

```
customersList.innerHTML = "";


// ----------------------------------------------
// CUSTOMER
// ----------------------------------------------

if (
    currentProfile.role !==
    "admin"
) {

    const ownPrivate =
        document.createElement(
            "div"
        );

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


// ----------------------------------------------
// ADMIN
// ----------------------------------------------

const {
    data,
    error
} =
    await db
        .from("profiles")
        .select(
            "id,display_name"
        )
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
        "Customers error:",
        error
    );

    return;
}


(data || []).forEach(
    customer => {

        const item =
            document.createElement(
                "div"
            );


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

    }
);
```

}

// ======================================================
// GROUP CONVERSATION
// ======================================================

if (groupButton) {

```
groupButton.addEventListener(
    "click",
    openGroupConversation
);
```

}

async function openGroupConversation() {

```
currentCustomer = null;


let {
    data: conversation,
    error
} =
    await db
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

    return;
}


if (!conversation) {

    const result =
        await db
            .from("conversations")
            .insert({

                type:
                    "group"

            })
            .select()
            .single();


    if (result.error) {

        console.error(
            "Create group error:",
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
```

}

// ======================================================
// GROUP MEMBERS
// ======================================================

async function ensureGroupMembers(
conversationId
) {

```
const {
    data: profiles,
    error: profilesError
} =
    await db
        .from("profiles")
        .select("id");


if (profilesError) {

    console.error(
        "Profiles error:",
        profilesError
    );

    return;
}


if (!profiles) return;


const {
    data: members,
    error: membersError
} =
    await db
        .from("conversation_members")
        .select("user_id")
        .eq(
            "conversation_id",
            conversationId
        );


if (membersError) {

    console.error(
        "Members error:",
        membersError
    );

    return;
}


const existing =
    new Set(
        (members || [])
            .map(
                member =>
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


if (
    missing.length
) {

    const {
        error
    } =
        await db
            .from(
                "conversation_members"
            )
            .insert(
                missing
            );


    if (error) {

        console.error(
            "Insert group members error:",
            error
        );

    }

}
```

}

// ======================================================
// PRIVATE CONVERSATION
// ======================================================

async function openPrivateConversation(
customerId,
customerName
) {

```
currentCustomer = {

    id:
        customerId,

    display_name:
        customerName

};


let {
    data: conversation,
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
        .limit(1)
        .maybeSingle();


if (error) {

    console.error(
        "Private conversation error:",
        error
    );

    return;
}


if (!conversation) {

    const result =
        await db
            .from("conversations")
            .insert({

                type:
                    "private",

                customer_id:
                    customerId

            })
            .select()
            .single();


    if (result.error) {

        console.error(
            "Create private conversation error:",
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
    "🔒 " +
    customerName;

conversationSubtitle.textContent =
    "محادثة خاصة";


updateActiveSidebar();


await loadMessages();

subscribeToMessages();
```

}

// ======================================================
// PRIVATE MEMBERS
// ======================================================

async function ensurePrivateMembers(
conversationId,
customerId
) {

```
const users = [
    currentUser.id,
    customerId
];


const uniqueUsers =
    [
        ...new Set(users)
    ];


for (
    const userId of uniqueUsers
) {

    const {
        data,
        error
    } =
        await db
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


    if (error) {

        console.error(
            "Private member check error:",
            error
        );

        continue;
    }


    if (!data) {

        const {
            error: insertError
        } =
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


        if (insertError) {

            console.error(
                "Private member insert error:",
                insertError
            );

        }

    }

}
```

}

// ======================================================
// LOAD MESSAGES
// ======================================================

async function loadMessages() {

```
messages.innerHTML = "";


if (!currentConversation)
    return;


const {
    data,
    error
} =
    await db
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

    console.error(
        "Messages error:",
        error
    );

    return;
}


for (
    const message of (
        data || []
    )
) {

    await renderMessage(
        message
    );

}


scrollMessages();
```

}

// ======================================================
// REALTIME
// ======================================================

function subscribeToMessages() {

```
if (realtimeChannel) {

    db.removeChannel(
        realtimeChannel
    );

    realtimeChannel =
        null;
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
            event:
                "INSERT",

            schema:
                "public",

            table:
                "messages",

            filter:
                "conversation_id=eq." +
                currentConversation.id

        },

        async payload => {

            const {
                data,
                error
            } =
                await db
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


            if (error) {

                console.error(
                    "Realtime message error:",
                    error
                );

                return;
            }


            if (data) {

                // منع تكرار الرسالة
                if (
                    document.querySelector(
                        `[data-message-id="${data.id}"]`
                    )
                ) {

                    return;
                }


                await renderMessage(
                    data
                );

                scrollMessages();

            }

        }

    )
    .subscribe(
        status => {

            console.log(
                "Realtime status:",
                status
            );

        }
    );
```

}

// ======================================================
// RENDER MESSAGE
// ======================================================

async function renderMessage(
message
) {

```
// منع تكرار الرسالة
if (
    document.querySelector(
        `[data-message-id="${message.id}"]`
    )
) {

    return;
}


const element =
    document.createElement(
        "div"
    );


element.className =
    "message";


element.dataset.messageId =
    message.id;


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


// ----------------------------------------------
// TEXT
// ----------------------------------------------

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
        message.content ||
        "";


    element.appendChild(
        text
    );

}


// ----------------------------------------------
// IMAGE
// ----------------------------------------------

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


    image.alt =
        "صورة";


    if (
        message.file_path
    ) {

        const {
            data,
            error
        } =
            await db.storage
                .from(
                    "chat-files"
                )
                .createSignedUrl(
                    message.file_path,
                    3600
                );


        if (
            !error &&
            data
        ) {

            image.src =
                data.signedUrl;

        }

    }


    element.appendChild(
        image
    );

}


// ----------------------------------------------
// AUDIO
// ----------------------------------------------

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


    if (
        message.file_path
    ) {

        const {
            data,
            error
        } =
            await db.storage
                .from(
                    "chat-files"
                )
                .createSignedUrl(
                    message.file_path,
                    3600
                );


        if (
            !error &&
            data
        ) {

            audio.src =
                data.signedUrl;

        }

    }


    element.appendChild(
        audio
    );

}


// ----------------------------------------------
// TIME
// ----------------------------------------------

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
```

}

// ======================================================
// SEND TEXT
// ======================================================

if (messageForm) {

```
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
        } =
            await db
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

            alert(
                "تعذر إرسال الرسالة: " +
                error.message
            );

            return;
        }


        messageInput.value =
            "";

    }
);
```

}

// ======================================================
// IMAGE UPLOAD
// ======================================================

if (imageInput) {

```
imageInput.addEventListener(
    "change",
    async event => {

        const file =
            event.target.files[0];


        if (!file)
            return;


        if (!currentConversation) {

            imageInput.value =
                "";

            return;
        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "الملف ليس صورة."
            );

            imageInput.value =
                "";

            return;
        }


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            alert(
                "أقصى حجم للصورة 10MB."
            );

            imageInput.value =
                "";

            return;
        }


        const extension =
            (
                file.name
                    .split(".")
                    .pop() ||
                "jpg"
            )
            .toLowerCase();


        const path =
            currentUser.id +
            "/" +
            crypto.randomUUID() +
            "." +
            extension;


        const upload =
            await db.storage
                .from(
                    "chat-files"
                )
                .upload(
                    path,
                    file,
                    {
                        contentType:
                            file.type,

                        upsert:
                            false
                    }
                );


        if (upload.error) {

            console.error(
                "Image upload error:",
                upload.error
            );

            alert(
                "فشل رفع الصورة: " +
                upload.error.message
            );

            imageInput.value =
                "";

            return;
        }


        const {
            error
        } =
            await db
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

            console.error(
                "Image message error:",
                error
            );

            alert(
                "تم رفع الصورة لكن لم يتم إرسالها: " +
                error.message
            );

        }


        imageInput.value =
            "";

    }
);
```

}

// ======================================================
// AUDIO RECORDING
// ======================================================

if (recordButton) {

```
recordButton.addEventListener(
    "click",
    startOrStopRecording
);
```

}

async function startOrStopRecording() {

```
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

    alert(
        "اختر محادثة أولاً."
    );

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


    let mimeType =
        "audio/webm";


    if (
        !MediaRecorder.isTypeSupported(
            "audio/webm"
        )
    ) {

        mimeType =
            "";

    }


    mediaRecorder =
        mimeType
            ? new MediaRecorder(
                stream,
                {
                    mimeType:
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


            recordButton.classList.remove(
                "recording"
            );


            recordButton.textContent =
                "🎤";


            const blobType =
                mediaRecorder.mimeType ||
                "audio/webm";


            const blob =
                new Blob(
                    audioChunks,
                    {
                        type:
                            blobType
                    }
                );


            if (
                blob.size === 0
            ) {

                alert(
                    "لم يتم تسجيل أي صوت."
                );

                return;
            }


            if (
                blob.size >
                10 * 1024 * 1024
            ) {

                alert(
                    "التسجيل كبير جدًا. الحد الأقصى 10MB."
                );

                return;
            }


            const extension =
                blobType.includes(
                    "mp4"
                )
                    ? "mp4"
                    : "webm";


            const path =
                currentUser.id +
                "/" +
                crypto.randomUUID() +
                "." +
                extension;


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
                                blobType,

                            upsert:
                                false
                        }
                    );


            if (
                upload.error
            ) {

                console.error(
                    "Audio upload error:",
                    upload.error
                );

                alert(
                    "فشل رفع التسجيل: " +
                    upload.error.message
                );

                return;
            }


            const {
                error
            } =
                await db
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

                console.error(
                    "Audio message error:",
                    error
                );

                alert(
                    "فشل إرسال التسجيل: " +
                    error.message
                );

            }

        };


    mediaRecorder.onerror =
        event => {

            console.error(
                "MediaRecorder error:",
                event
            );

        };


    mediaRecorder.start();


    recordButton.classList.add(
        "recording"
    );


    recordButton.textContent =
        "⏹️";


} catch (error) {

    console.error(
        "Microphone error:",
        error
    );


    alert(
        "لم يتم السماح باستخدام الميكروفون: " +
        error.message
    );

}
```

}

// ======================================================
// LOGOUT
// ======================================================

if (logoutButton) {

```
logoutButton.addEventListener(
    "click",
    async () => {

        if (realtimeChannel) {

            await db.removeChannel(
                realtimeChannel
            );

            realtimeChannel =
                null;
        }


        const {
            error
        } =
            await db.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);
```

}

// ======================================================
// HELPERS
// ======================================================

function scrollMessages() {

```
messages.scrollTop =
    messages.scrollHeight;
```

}

function updateActiveSidebar(
element
) {

```
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
```

}

function escapeHtml(value) {

```
return String(
    value || ""
).replace(
    /[&<>"']/g,
    character => {

        const entities = {

            "&":
                "&amp;",

            "<":
                "&lt;",

            ">":
                "&gt;",

            '"':
                "&quot;",

            "'":
                "&#039;"

        };


        return entities[
            character
        ];

    }
);
```

}
