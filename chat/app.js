/* =========================================================
SUPABASE
========================================================= */

const { createClient } = supabase;

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

const logoutButton =
document.getElementById("logoutButton");

const groupButton =
document.getElementById("groupButton");

const customersList =
document.getElementById("customersList");

const conversationTitle =
document.getElementById("conversationTitle");

const conversationSubtitle =
document.getElementById("conversationSubtitle");

const messagesContainer =
document.getElementById("messages");

const messageForm =
document.getElementById("messageForm");

const messageInput =
document.getElementById("messageInput");

const imageInput =
document.getElementById("imageInput");

const recordButton =
document.getElementById("recordButton");

const filePreview =
document.getElementById("filePreview");

/* =========================================================
STATE
========================================================= */

let currentUser = null;
let currentProfile = null;

let currentConversation = null;

let realtimeChannel = null;

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

/* =========================================================
INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {

```
loginButton.addEventListener("click", login);

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
    sendTextMessage
);

imageInput.addEventListener(
    "change",
    handleImageSelection
);

recordButton.addEventListener(
    "click",
    toggleRecording
);


passwordInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            login();
        }

    }
);


emailInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            passwordInput.focus();
        }

    }
);


/*
   IMPORTANT:
   Detect password recovery before normal startup.
*/

db.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "Auth event:",
            event
        );


        if (event === "PASSWORD_RECOVERY") {

            showPasswordUpdateScreen();

            return;
        }


        if (
            event === "SIGNED_IN" &&
            session
        ) {

            /*
               If this is a normal login,
               start the application.
            */

            if (!currentUser) {

                await startApplication(
                    session.user
                );

            }

            return;
        }


        if (event === "SIGNED_OUT") {

            currentUser = null;
            currentProfile = null;

            showLoginScreen();

        }

    }
);


/*
   Check existing session.
*/

const {
    data,
    error
} = await db.auth.getSession();


if (error) {

    console.error(
        "Session error:",
        error
    );

    return;
}


if (data.session) {

    /*
       Do not automatically open the app
       when the URL is a password recovery URL.
    */

    const hash =
        window.location.hash || "";

    if (
        hash.includes("access_token=") &&
        hash.includes("type=recovery")
    ) {

        showPasswordUpdateScreen();

        return;
    }


    await startApplication(
        data.session.user
    );

} else {

    showLoginScreen();

}
```

}

/* =========================================================
LOGIN SCREEN
========================================================= */

function showLoginScreen() {

```
loginScreen.classList.remove("hidden");

app.classList.add("hidden");

loginError.textContent = "";
```

}

function showApplication() {

```
loginScreen.classList.add("hidden");

app.classList.remove("hidden");
```

}

/* =========================================================
LOGIN
========================================================= */

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

    email,
    password

});


loginButton.disabled = false;

loginButton.textContent =
    "دخول";


if (error) {

    console.error(
        "Login error:",
        error
    );

    loginError.textContent =
        error.message ||
        "بيانات الدخول غير صحيحة.";

    return;
}


if (data.user) {

    await startApplication(
        data.user
    );

}
```

}

/* =========================================================
PASSWORD RESET REQUEST
========================================================= */

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


forgotPasswordButton.disabled = true;

forgotPasswordButton.textContent =
    "جارٍ الإرسال...";


/*
   IMPORTANT:
   This MUST match the URL configured
   in Supabase Authentication > URL Configuration.
*/

const redirectTo =
    window.location.origin + "/";


const {
    error
} =
    await db.auth.resetPasswordForEmail(
        email,
        {
            redirectTo
        }
    );


forgotPasswordButton.disabled = false;

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

/* =========================================================
PASSWORD UPDATE SCREEN
========================================================= */

function showPasswordUpdateScreen() {

```
loginScreen.classList.add("hidden");

app.classList.add("hidden");


const oldScreen =
    document.getElementById(
        "passwordUpdateScreen"
    );


if (oldScreen) {
    oldScreen.remove();
}


const screen =
    document.createElement("div");

screen.id =
    "passwordUpdateScreen";

screen.className =
    "login-screen";


screen.innerHTML = `

    <div class="login-box">

        <div class="logo">🔐</div>

        <h1>تغيير كلمة المرور</h1>

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


document.body.appendChild(screen);


const updateButton =
    document.getElementById(
        "updatePasswordButton"
    );


updateButton.addEventListener(
    "click",
    updatePassword
);
```

}

async function updatePassword() {

```
const newPassword =
    document.getElementById(
        "newPassword"
    ).value;

const confirmPassword =
    document.getElementById(
        "confirmPassword"
    ).value;

const errorBox =
    document.getElementById(
        "passwordUpdateError"
    );


errorBox.textContent = "";


if (!newPassword || !confirmPassword) {

    errorBox.textContent =
        "أدخل كلمة المرور الجديدة.";

    return;
}


if (newPassword.length < 6) {

    errorBox.textContent =
        "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";

    return;
}


if (newPassword !== confirmPassword) {

    errorBox.textContent =
        "كلمتا المرور غير متطابقتين.";

    return;
}


const updateButton =
    document.getElementById(
        "updatePasswordButton"
    );


updateButton.disabled = true;

updateButton.textContent =
    "جارٍ الحفظ...";


const {
    error
} =
    await db.auth.updateUser({

        password:
            newPassword

    });


if (error) {

    console.error(
        "Password update error:",
        error
    );

    errorBox.textContent =
        error.message;

    updateButton.disabled = false;

    updateButton.textContent =
        "حفظ كلمة المرور";

    return;
}


/*
   Password changed successfully.
*/

errorBox.textContent =
    "تم تغيير كلمة المرور بنجاح.";


setTimeout(
    async () => {

        const screen =
            document.getElementById(
                "passwordUpdateScreen"
            );

        if (screen) {
            screen.remove();
        }


        /*
           Clean recovery hash.
        */

        history.replaceState(
            null,
            "",
            window.location.pathname
        );


        const {
            data
        } =
            await db.auth.getSession();


        if (data.session) {

            await startApplication(
                data.session.user
            );

        } else {

            showLoginScreen();

        }

    },
    1200
);
```

}

/* =========================================================
START APPLICATION
========================================================= */

async function startApplication(user) {

```
currentUser = user;


const {
    data,
    error
} =
    await db
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


if (error) {

    console.error(
        "Profile error:",
        error
    );


    loginError.textContent =
        "تعذر تحميل بيانات المستخدم.";


    await db.auth.signOut();

    return;
}


currentProfile =
    data;


showApplication();


await loadCustomers();


await openGroupConversation();


subscribeToRealtime();
```

}

/* =========================================================
LOAD CUSTOMERS
========================================================= */

async function loadCustomers() {

```
customersList.innerHTML = "";


const {
    data,
    error
} =
    await db
        .from("profiles")
        .select("*")
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

    return;
}


for (const customer of data) {

    const button =
        document.createElement(
            "button"
        );


    button.type = "button";

    button.className =
        "conversation-button";


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
```

}

/* =========================================================
GROUP CONVERSATION
========================================================= */

async function openGroupConversation() {

```
setActiveConversationButton(
    groupButton
);


conversationTitle.textContent =
    "المجموعة";

conversationSubtitle.textContent =
    "المحادثة الجماعية";


let {
    data,
    error
} =
    await db
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

    return;
}


/*
   If group doesn't exist,
   create it.
*/

if (!data) {

    const result =
        await db
            .from("conversations")
            .insert({

                type: "group",

                customer_id: null

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


    data =
        result.data;
}


currentConversation =
    data;


await loadMessages();
```

}

/* =========================================================
PRIVATE CONVERSATION
========================================================= */

async function openPrivateConversation(
customer
) {

```
conversationTitle.textContent =
    customer.display_name ||
    "محادثة خاصة";


conversationSubtitle.textContent =
    "محادثة خاصة";


let {
    data,
    error
} =
    await db
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
        "Private conversation error:",
        error
    );

    return;
}


/*
   Create private conversation
   if it doesn't exist.
*/

if (!data) {

    const result =
        await db
            .from("conversations")
            .insert({

                type: "private",

                customer_id:
                    customer.id

            })
            .select()
            .single();


    if (result.error) {

        console.error(
            "Create private conversation error:",
            result.error
        );

        return;
    }


    data =
        result.data;
}


currentConversation =
    data;


await loadMessages();
```

}

/* =========================================================
LOAD MESSAGES
========================================================= */

async function loadMessages() {

```
messagesContainer.innerHTML = "";


if (!currentConversation) {
    return;
}


const {
    data,
    error
} =
    await db
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

    return;
}


for (const message of data) {

    await renderMessage(
        message
    );

}


scrollMessagesToBottom();
```

}

/* =========================================================
RENDER MESSAGE
========================================================= */

async function renderMessage(
message
) {

```
const wrapper =
    document.createElement(
        "div"
    );


const mine =
    message.sender_id ===
    currentUser.id;


wrapper.className =
    mine
        ? "message mine"
        : "message";


const bubble =
    document.createElement(
        "div"
    );


bubble.className =
    "message-bubble";


if (message.message_type === "text") {

    bubble.textContent =
        message.content || "";

}


else if (
    message.message_type === "image"
) {

    if (message.file_path) {

        const url =
            await getSignedUrl(
                message.file_path
            );


        if (url) {

            const image =
                document.createElement(
                    "img"
                );

            image.src = url;

            image.alt = "صورة";

            image.className =
                "message-image";


            image.addEventListener(
                "click",
                () => {

                    window.open(
                        url,
                        "_blank"
                    );

                }
            );


            bubble.appendChild(
                image
            );

        }

    }

}


else if (
    message.message_type === "audio"
) {

    if (message.file_path) {

        const url =
            await getSignedUrl(
                message.file_path
            );


        if (url) {

            const audio =
                document.createElement(
                    "audio"
                );

            audio.controls = true;

            audio.src = url;


            bubble.appendChild(
                audio
            );

        }

    }

}


wrapper.appendChild(
    bubble
);


messagesContainer.appendChild(
    wrapper
);
```

}

/* =========================================================
SEND TEXT
========================================================= */

async function sendTextMessage(
event
) {

```
event.preventDefault();


const text =
    messageInput.value.trim();


if (!text) {
    return;
}


if (!currentConversation) {
    return;
}


messageInput.disabled = true;


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
                text,

            file_path:
                null

        });


messageInput.disabled = false;


if (error) {

    console.error(
        "Send message error:",
        error
    );

    alert(
        error.message
    );

    return;
}


messageInput.value = "";
```

}

/* =========================================================
IMAGE
========================================================= */

async function handleImageSelection(
event
) {

```
const file =
    event.target.files[0];


if (!file) {
    return;
}


if (!currentConversation) {

    alert(
        "اختر محادثة أولاً."
    );

    return;
}


if (!file.type.startsWith("image/")) {

    alert(
        "الملف ليس صورة."
    );

    return;
}


showFilePreview(
    `📷 ${file.name}`
);


const filePath =
    await uploadFile(
        file,
        "images"
    );


if (!filePath) {

    clearFilePreview();

    imageInput.value = "";

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

            content:
                null,

            file_path:
                filePath

        });


if (error) {

    console.error(
        "Image message error:",
        error
    );

    alert(
        error.message
    );

}


clearFilePreview();

imageInput.value = "";
```

}

/* =========================================================
AUDIO RECORDING
========================================================= */

async function toggleRecording() {

```
if (isRecording) {

    stopRecording();

} else {

    await startRecording();

}
```

}

async function startRecording() {

```
if (!currentConversation) {

    alert(
        "اختر محادثة أولاً."
    );

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


try {

    const stream =
        await navigator.mediaDevices.getUserMedia(
            {
                audio: true
            }
        );


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


            const blob =
                new Blob(
                    audioChunks,
                    {
                        type:
                            mediaRecorder.mimeType ||
                            "audio/webm"
                    }
                );


            await sendAudio(
                blob
            );

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


} catch (error) {

    console.error(
        "Microphone error:",
        error
    );

    alert(
        "تعذر الوصول إلى الميكروفون."
    );

}
```

}

function stopRecording() {

```
if (
    mediaRecorder &&
    isRecording
) {

    mediaRecorder.stop();

    isRecording = false;


    recordButton.textContent =
        "🎤";


    recordButton.classList.remove(
        "recording"
    );


    recordButton.title =
        "تسجيل صوتي";

}
```

}

/* =========================================================
SEND AUDIO
========================================================= */

async function sendAudio(blob) {

```
showFilePreview(
    "🎤 جارٍ إرسال التسجيل..."
);


const extension =
    getAudioExtension(
        blob.type
    );


const file =
    new File(
        [
            blob
        ],
        `voice-${Date.now()}.${extension}`,
        {
            type:
                blob.type ||
                "audio/webm"
        }
    );


const filePath =
    await uploadFile(
        file,
        "audio"
    );


if (!filePath) {

    clearFilePreview();

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

            content:
                null,

            file_path:
                filePath

        });


if (error) {

    console.error(
        "Audio message error:",
        error
    );

    alert(
        error.message
    );

}


clearFilePreview();
```

}

function getAudioExtension(
mimeType
) {

```
if (
    mimeType.includes(
        "mp4"
    )
) {
    return "mp4";
}

if (
    mimeType.includes(
        "ogg"
    )
) {
    return "ogg";
}

if (
    mimeType.includes(
        "mpeg"
    )
) {
    return "mp3";
}

return "webm";
```

}

/* =========================================================
STORAGE UPLOAD
========================================================= */

async function uploadFile(
file,
folder
) {

```
if (!currentUser) {
    return null;
}


const extension =
    getFileExtension(
        file.name
    );


const fileName =
    `${crypto.randomUUID()}.${extension}`;


const filePath =
    `${currentUser.id}/${folder}/${fileName}`;


const {
    error
} =
    await db
        .storage
        .from("chat-files")
        .upload(
            filePath,
            file,
            {
                upsert: false,

                contentType:
                    file.type

            }
        );


if (error) {

    console.error(
        "Upload error:",
        error
    );

    alert(
        error.message
    );

    return null;
}


return filePath;
```

}

function getFileExtension(
filename
) {

```
const parts =
    filename.split(".");


if (parts.length < 2) {
    return "bin";
}


return parts
    .pop()
    .toLowerCase();
```

}

/* =========================================================
SIGNED URL
========================================================= */

async function getSignedUrl(
path
) {

```
const {
    data,
    error
} =
    await db
        .storage
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


return data.signedUrl;
```

}

/* =========================================================
REALTIME
========================================================= */

function subscribeToRealtime() {

```
if (realtimeChannel) {

    db.removeChannel(
        realtimeChannel
    );

}


realtimeChannel =
    db
        .channel(
            "messages-realtime"
        )
        .on(
            "postgres_changes",
            {
                event: "INSERT",

                schema: "public",

                table: "messages"
            },
            async payload => {

                const message =
                    payload.new;


                /*
                   Only show the message if it
                   belongs to the currently open
                   conversation.
                */

                if (
                    currentConversation &&
                    message.conversation_id ===
                    currentConversation.id
                ) {

                    await renderMessage(
                        message
                    );

                    scrollMessagesToBottom();

                }

            }
        )
        .subscribe(
            status => {

                console.log(
                    "Realtime:",
                    status
                );

            }
        );
```

}

/* =========================================================
LOGOUT
========================================================= */

async function logout() {

```
if (realtimeChannel) {

    await db.removeChannel(
        realtimeChannel
    );

    realtimeChannel = null;

}


await db.auth.signOut();

currentUser = null;

currentProfile = null;

currentConversation = null;

showLoginScreen();
```

}

/* =========================================================
UI HELPERS
========================================================= */

function setActiveConversationButton(
activeButton
) {

```
document
    .querySelectorAll(
        ".conversation-button"
    )
    .forEach(
        button => {

            button.classList.remove(
                "active"
            );

        }
    );


if (activeButton) {

    activeButton.classList.add(
        "active"
    );

}
```

}

function showFilePreview(
text
) {

```
filePreview.textContent =
    text;

filePreview.classList.remove(
    "hidden"
);
```

}

function clearFilePreview() {

```
filePreview.textContent = "";

filePreview.classList.add(
    "hidden"
);
```

}

function scrollMessagesToBottom() {

```
messagesContainer.scrollTop =
    messagesContainer.scrollHeight;
```

}

function escapeHtml(
value
) {

```
return String(value)
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
```

}
