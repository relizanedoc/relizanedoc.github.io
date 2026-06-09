// دالة لتنفيذ الكود بمجرد تحميل الصفحة
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doc'); // هل هناك كود طبيب في الرابط؟

    if (doctorId) {
        console.log("تم اكتشاف رابط مباشر للطبيب: " + doctorId);

        // هنا استدعِ الدالة التي تفتح تفاصيل الطبيب في تطبيقك
        // استبدل 'openDoctorModal' بالدالة التي تستخدمها في تطبيقك لعرض الطبيب
        openDoctorModal(doctorId); 
    }
});
// 1. تهيئة Firebase (مؤقت - لا تحذفه الآن)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCvWB0huHg4Wei98dAkQAvRANmB5Xs_GWI",
  authDomain: "relizane-doc-4dbf2.firebaseapp.com",
  projectId: "relizane-doc-4dbf2",
  appId: "1:284439573850:web:9edd0f408e68a511de6f63"
};

firebase.initializeApp(FIREBASE_CONFIG);

// 2. تهيئة Supabase (جديد)
const SUPABASE_URL = 'https://iirjtmobphgmkgwkwumc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpcmp0bW9icGhnbWtnd2t3dW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDA2NjYsImV4cCI6MjA5NjUxNjY2Nn0.Yfa0oEwp_id9tHpSb3h0jf__B4drqXsM-TVs4VTTmp4';

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const RECAPTCHA_SITE_KEY = '6Ld2mAEtAAAAADCb15UwZclk7Yubl-Yh6lyFSlLT';
const API_URL = 'https://script.google.com/macros/s/AKfycbxuQvatnWUMoMMSA6QTsbpxhO6r3Qh54yoj8Zrkor_2Icg3n3AVP7_2ajh0NvEPMlTgRw/exec';
// ✅ الاستماع لتغيير حالة المصادقة (Supabase)
let isAuthInitialized = false;

supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('🔄 حدث المصادقة:', event);

  if (event === 'SIGNED_IN' && session) {
    console.log('✅ تم تسجيل الدخول:', session.user);
    updateUserUI(session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('❌ تم تسجيل الخروج');
    updateUserUI(null);
  } else if (event === 'USER_UPDATED') {
    if (session) updateUserUI(session.user);
  } else if (event === 'TOKEN_REFRESHED') {
    if (session) updateUserUI(session.user);
  }

  if (!isAuthInitialized) {
    const hash = window.location.hash.replace('#', '');
    const startView = ['home', 'add-doctor', 'booking', 'dashboard', 'login', 'track', 'user-dashboard'].includes(hash) ? hash : 'home';
    router(startView, false);
    isAuthInitialized = true;
  }
});

// ✅ التحقق من الجلسة الحالية عند تحميل الصفحة
window.addEventListener('load', async () => {
  console.log('🔍 التحقق من الجلسة الحالية...');
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    console.log('✅ جلسة موجودة، تحديث الواجهة');
    updateUserUI(session.user);
  } else {
    console.log('❌ لا توجد جلسة');
    updateUserUI(null);
  }
});
// دالة مساعدة لتحل محل firebase.auth().currentUser
async function getCurrentSupabaseUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}
    const i18n = {
      en: {
        memberDashboardTitle: 'Member Dashboard', trackPhoneLabel: 'Phone Number used for booking',
        appName: 'Relizane Medical', findDoctor: 'Find a Doctor', searchPlaceholder: '🔍 Search by name, specialty, or location...',
        allSpecialties: 'All Specialties', allMunicipalities: 'All Municipalities', loadingDoctors: 'Loading doctors...',
        noDoctorsFound: 'No doctors found matching your criteria.', registerDoctor: 'Register New Doctor',
        firstName: 'First Name *', firstNamePlaceholder: 'e.g. Amine', lastName: 'Last Name *', lastNamePlaceholder: 'e.g. Benali',
        phone: 'Phone Number *', phonePlaceholder: 'e.g. 0550 123 456', exactLocation: 'Exact Location / Address *',
        locationPlaceholder: 'Street, Building, Floor, Landmark...', specialty: 'Specialty *', specialtyPlaceholder: 'e.g. General Practice',
        municipality: 'Municipality (Baladiya) *', municipalityPlaceholder: 'e.g. Relizane', extraInfo: 'Extra Information',
        extraInfoPlaceholder: 'Working hours, consultation fees, languages spoken, diplomas...', registerBtn: 'Register Doctor',
        backToDirectory: '← Back to Directory', backToHome: '← Back to Directory', bookAppointment: 'Book Appointment',
        patientName: 'Patient Full Name *', patientNamePlaceholder: 'Full name', patientPhone: 'Patient Phone *',
        patientPhonePlaceholder: 'Contact number', appointmentDate: 'Appointment Date *', appointmentTime: 'Time *',
        confirmBooking: 'Confirm Booking', confirmDialogTitle: 'Confirm Appointment', confirmDialogMsg: 'Are you sure you want to book this appointment?',
        cancel: 'Cancel', doctorLogin: 'Doctor Login', loginDesc: 'Enter your Doctor ID and registered phone number to view your appointments.',
        patientLabel: 'Patient: ', statusPending: 'Pending', statusConfirmed: 'Confirmed', statusCancelled: 'Cancelled',
        bookNewAppointment: 'Book New Appointment', fetchingBookings: 'Fetching your bookings...', noUserBookings: 'No bookings registered to your account currently.',
        bookFirstAppt: 'Book your first appointment', fetchBookingsError: 'Connection error: Unable to fetch appointments.', bookingNumber: 'Booking ID: ',
        doctorId: 'Doctor ID', doctorIdPlaceholder: 'e.g. DOC-20240526-143022', loginPhone: 'Phone Number', loginPhonePlaceholder: 'Your registered phone',
        viewAppointments: 'View My Appointments', myAppointments: 'My Appointments', logout: 'Logout', thBookingId: 'Booking ID', thPatientName: 'Patient Name',
        thPhone: 'Phone', thDate: 'Date', thTime: 'Time', thStatus: 'Status', thActions: 'Actions', noAppointmentsMsg: 'No appointments found.',
        navHome: 'Directory', navTrack: 'Track Booking', navAdd: 'Add Doctor', navDashboard: 'Doctor Login', navLogin: 'Login',
        chatTitle: 'Medical Assistant',
chatSubtitle: 'Available for instant reply',
chatWelcome: 'Hello! I am your AI assistant 🩺. How can I help you today? (e.g. "I need an eye doctor in Relizane" or "Find Dr. Amine")',
chatInputPlaceholder: 'Type your question here...',
chatToggleBtn: 'Chat with us',
chatLoadingDB: 'Sorry, the doctors database is currently loading. Please try again in a moment.',
chatNoResults: 'Sorry, I couldn\'t find any doctors matching your search. Try typing the name correctly, or mention the specialty and municipality.',
chatFoundPrefix: 'I found ',
chatFoundSuffix: ' doctors based on your request. Here are the top 3 results:',
chatExactResults: 'Here are the results matching your question:',
chatDoctorLabel: 'Doctor: ',
chatSpecLabel: 'Specialty: ',
chatPhoneLabel: 'Phone: ',
chatMunLabel: 'Municipality: ',
chatAddressLabel: 'Address: ',
chatBookDetailsBtn: 'View Details & Book',
        loginTitle: 'Member Login', signUpTitle: 'Create Account', loginBtn: 'Login', signUpBtn: 'Sign Up', googleSignIn: 'Sign in with Google', or: 'or',
        fullName: 'Full Name', fullNamePlaceholder: 'Your full name', email: 'Email *', emailPlaceholder: 'your@email.com', password: 'Password *',
        passwordPlaceholder: '••••••••', noAccount: "Don't have an account? Sign up", hasAccount: 'Already have an account? Login',
        loginRequired: 'Please login to add a doctor.', toastRegisterSuccess: 'Doctor registered! ID: ', toastRegisterError: 'Registration failed: ',
        toastBookingSuccess: 'Appointment confirmed! ID: ', toastBookingError: 'Booking failed: ', toastLoginError: 'Login failed: ',
        toastLoadError: 'Failed to load directory', loadingError: 'Unable to load doctors.', bookBtn: 'Book Appointment',
        toastAuthSuccess: 'Welcome! ', toastAuthError: 'Authentication failed: ', toastLogout: 'Logged out', weakPassword: 'Password must be at least 6 characters',
        invalidEmail: 'Invalid email address', userNotFound: 'No account found with this email', wrongPassword: 'Incorrect password', emailInUse: 'This email is already registered',
        footerRights: '© 2026 Relizane Medical Directory. All rights reserved.', privacyPolicy: 'Privacy Policy', contactUs: 'Contact Us',
        heroTitle: 'Relizane Medical Directory', registeredMember: 'Registered Member', myRecentBookings: 'My Recent Bookings',
        trackAnotherBooking: 'Track Another Booking', heroSubtitle: 'Your comprehensive platform to find doctors, clinics, and book medical appointments across all municipalities of Relizane.',
        enableBooking: 'Enable Bookings', disableBooking: 'Disable Bookings', bookingsClosed: 'Bookings Closed', toastToggleSuccess: 'Booking status updated', 
        toastToggleError: 'Failed to update status', trackBookingTitle: 'Track Booking Status', trackBookingDesc: 'Enter your booking ID to check if the doctor has confirmed it.',
        bookingIdLabel: 'Booking ID (APT)', trackSearchBtn: 'Search Booking', workingHoursTitle: 'Working Days & Hours Settings',
        workingHoursDesc: 'Enable your working days and set the start/end time for each day.', saveHoursBtnText: 'Save Hours',
        scheduleTitle: 'Available Schedule', fallbackTitle: 'Available Working Hours', dailyTxt: 'Daily:', selectDateFirst: 'Please select an appointment date first to see available times...',
        invalidDate: 'Please enter a valid date...', selectSpec: '-- Select Specialty --', ratingLabel: 'What is your rating?',
        reviewPlaceholder: 'Write your experience to help others...', submitReviewBtn: 'Publish Review', loginToReviewText: 'You must log in to add a review.',
        selectMun: '-- Select Municipality --', doctorOff: 'Doctor is not available on this day, please choose another date.', noSlots: 'Sorry, no available time slots on this day.',
        morningSession: 'Morning Session', eveningSession: 'Afternoon / Evening', sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
        'الأرطوفونيا (تقويم النطق) - Speech Therapy': 'Speech Therapy', 'الأشعة - Radiology': 'Radiology', 'الأمراض الجلدية - Dermatology': 'Dermatology', 'الأمراض الصدرية - Pulmonology': 'Pulmonology',
        'الأمراض المعدية - Infectious Disease': 'Infectious Disease', 'الأنف والأذن والحنجرة - ENT (Otolaryngology)': 'ENT (Otolaryngology)', 'التخدير - Anesthesiology': 'Anesthesiology',
        'التغذية العلاجية - Clinical Nutrition': 'Clinical Nutrition', 'الجراحة التجميلية - Plastic Surgery': 'Plastic Surgery', 'الجراحة العامة - General Surgery': 'General Surgery',
        'الطب الباطني - Internal Medicine': 'Internal Medicine', 'الطب المخبري (التحاليل) - Laboratory Medicine': 'Laboratory Medicine', 'الطب النفسي - Psychiatry': 'Psychiatry',
        'العلاج الطبيعي وإعادة التأهيل - Physiotherapy & Rehabilitation': 'Physiotherapy & Rehabilitation', 'الغدد الصماء والسكري - Endocrinology': 'Endocrinology', 'أمراض الجهاز الهضمي - Gastroenterology': 'Gastroenterology',
        'أمراض الدم - Hematology': 'Hematology', 'أمراض الروماتيزم والمفاصل - Rheumatology': 'Rheumatology', 'أمراض القلب - Cardiology': 'Cardiology', 'أمراض الكلى - Nephrology': 'Nephrology',
        'أمراض النساء والتوليد - Gynecology & Obstetrics': 'Gynecology & Obstetrics', 'جراحة الأوعية الدموية - Vascular Surgery': 'Vascular Surgery', 'جراحة العظام - Orthopedics': 'Orthopedics',
        'جراحة القلب والصدر - Cardiothoracic Surgery': 'Cardiothoracic Surgery', 'جراحة المخ والأعصاب - Neurosurgery': 'Neurosurgery', 'جراحة المسالك البولية - Urology': 'Urology',
        'طب الأعصاب - Neurology': 'Neurology', 'طب الأسرة - Family Medicine': 'Family Medicine', 'طب الأسنان - Dentistry': 'Dentistry', 'طب الأطفال - Pediatrics': 'Pediatrics',
        'طب الأورام - Oncology': 'Oncology', 'طب الحساسية والمناعة - Allergy & Immunology': 'Allergy & Immunology', 'طب الشيخوخة - Geriatrics': 'Geriatrics', 'طب الطوارئ - Emergency Medicine': 'Emergency Medicine',
        'طب العيون - Ophthalmology': 'Ophthalmology', 'طب عام - General Medicine': 'General Medicine', 'علم الوراثة الطبية - Medical Genetics': 'Medical Genetics',
        'أولاد سيدي الميهوب': 'Ouled Sidi Mihoub', 'أولاد يعيش': 'Ouled Yaich', 'الحاسي': 'El Hassi', 'الحمادنة': 'El Hamadna', 'القطار': 'El Guettar', 'القلعة': 'El Kalaa',
        'المطمر': 'El Matmar', 'المرجة': 'El Merdja', 'الولجة': 'El Oueldja', 'بن داود': 'Bendaoud', 'بني درقون': 'Beni Dergoun', 'بني زنطيس': 'Beni Zentis',
        'بلعسل بوزقزة': 'Belassel Bouzegza', 'جديوية': 'Djidiouia', 'حد الشكالة': 'Had Echkalla', 'حمري': 'Hamri', 'دار بن عبد الله': 'Dar Benabdellah', 'رمكة': 'Ramka',
        'زمورة': 'Zemmoura', 'سوق الحد': 'Souk El Had', 'سيدي امحمد بن علي': 'Sidi Mhamed Ben Ali', 'سيدي امحمد بن عودة': 'Sidi Mhamed Benaouda', 'سيدي خطاب': 'Sidi Khettab',
        'سيدي سعادة': 'Sidi Saada', 'سيدي لزرق': 'Sidi Lazreg', 'عين الرحمة': 'Ain Rahma', 'عين طارق': 'Ain Tarek', 'عمي موسى': 'Ammi Moussa', 'غليزان': 'Relizane',
        'لحلاف': 'Lahlef', 'مازونة': 'Mazouna', 'مديونة': 'Mediouna', 'منداس': 'Mendes', 'وادي الجمعة': 'Oued El Djemaa', 'وادي السلام': 'Oued Essalem', 'وادي رهيو': 'Oued Rhiou',
        'واريزان': 'Ouarizane', 'يلل': 'Yellel'
      },
      ar: {
        memberDashboardTitle: 'لوحة تحكم العضو', trackPhoneLabel: 'رقم الهاتف المرفق بالحجز', appName: 'دليل أطباء غليزان', findDoctor: 'ابحث عن طبيب',
        searchPlaceholder: '🔍 ابحث بالاسم أو الاختصاص أو الموقع...', allSpecialties: 'جميع الاختصاصات', allMunicipalities: 'جميع البلديات', loadingDoctors: 'جاري تحميل قائمة الأطباء...',
        noDoctorsFound: 'لا يوجد أطباء مطابقون لبحثك.', registerDoctor: 'تسجيل طبيب جديد', firstName: 'الاسم *', firstNamePlaceholder: 'مثال: أمين',
        lastName: 'اللقب *', lastNamePlaceholder: 'مثال: بن علي', phone: 'رقم الهاتف *', phonePlaceholder: 'مثال: 0550 123 456', exactLocation: 'العنوان الدقيق *',
        locationPlaceholder: 'الشارع، المبنى، الطابق، معلم قريب...', specialty: 'الاختصاص *', specialtyPlaceholder: 'مثال: الطب العام', municipality: 'البلدية *',
        chatTitle: 'المستشار الطبي',
chatSubtitle: 'متاح للرد الفوري',
chatWelcome: 'أهلاً بك في دليل أطباء غليزان. أنا مساعدك الآلي🩺. كيف يمكنني مساعدتك اليوم؟ (مثال: "أريد رقم طبيب عيون في غليزان" أو "ابحث عن الدكتور أمين")',
chatInputPlaceholder: 'اكتب سؤالك هنا...',
chatToggleBtn: 'تحدث معنا',
chatLoadingDB: 'عذراً، جاري تحميل قاعدة بيانات الأطباء حالياً. يرجى المحاولة بعد لحظات.',
chatNoResults: 'عذراً، لم أتمكن من العثور على أطباء يطابقون بحثك. حاول كتابة اسم الطبيب بدقة، أو ذكر الاختصاص والبلدية.',
chatFoundPrefix: 'وجدت ',
chatFoundSuffix: ' أطباء بناءً على طلبك. إليك أبرز 3 نتائج:',
chatExactResults: 'تفضل، لقد وجدت هذه النتائج المطابقة لسؤالك:',
chatDoctorLabel: 'الدكتور(ة): ',
chatSpecLabel: 'الاختصاص: ',
chatPhoneLabel: 'الهاتف: ',
chatMunLabel: 'البلدية: ',
chatAddressLabel: 'العنوان: ',
chatBookDetailsBtn: 'عرض التفاصيل والحجز',
        municipalityPlaceholder: 'مثال: غليزان', extraInfo: 'معلومات إضافية', extraInfoPlaceholder: 'أوقات العمل، أجرة الكشف، اللغات المحكية، الشهادات...', registerBtn: 'تسجيل الطبيب',
        backToDirectory: '← العودة للدليل', backToHome: '← العودة للدليل', bookAppointment: 'حجز موعد', patientName: 'اسم المريض الكامل *', patientNamePlaceholder: 'الاسم الكامل',
        patientPhone: 'هاتف المريض *', patientPhonePlaceholder: 'رقم الاتصال', appointmentDate: 'تاريخ الموعد *', appointmentTime: 'الوقت *', confirmBooking: 'تأكيد الحجز',
        confirmDialogTitle: 'تأكيد الموعد', confirmDialogMsg: 'هل أنت متأكد من حجز هذا الموعد؟', cancel: 'إلغاء', doctorLogin: 'تسجيل دخول الطبيب', patientLabel: 'المريض: ',
        statusPending: 'قيد الانتظار', statusConfirmed: 'مؤكد', statusCancelled: 'ملغى', bookNewAppointment: 'حجز موعد جديد', fetchingBookings: 'جاري جلب حجوزاتك...',
        noUserBookings: 'لا توجد حجوزات مسجلة بحسابك حالياً.', bookFirstAppt: 'احجز موعدك الأول', selectSpec: '-- اختر الاختصاص --', selectMun: '-- اختر البلدية --',
        fetchBookingsError: 'خطأ في الاتصال: تعذر جلب المواعيد.', bookingNumber: 'رقم الحجز: ', loginDesc: 'أدخل معرف الطبيب ورقم الهاتف المسجل لعرض مواعيدك.', doctorId: 'معرف الطبيب',
        doctorIdPlaceholder: 'مثال: DOC-20240526-143022', loginPhone: 'رقم الهاتف', loginPhonePlaceholder: 'الهاتف المسجل', viewAppointments: 'عرض مواعيدي', myAppointments: 'مواعيدي',
        logout: 'تسجيل الخروج', thBookingId: 'رقم الحجز', thPatientName: 'اسم المريض', thPhone: 'الهاتف', thDate: 'التاريخ', thTime: 'الوقت', thStatus: 'الحالة', thActions: 'الإجراءات',
        noAppointmentsMsg: 'لا توجد مواعيد.', registeredMember: 'عضو مسجل', myRecentBookings: 'حجوزاتي الأخيرة', trackAnotherBooking: 'تتبع حجز آخر', ratingLabel: 'ما هو تقييمك؟',
        reviewPlaceholder: 'اكتب تجربتك مع هذا الطبيب لمساعدة الآخرين...', submitReviewBtn: 'نشر التقييم', loginToReviewText: 'يجب تسجيل الدخول لإضافة تقييم.', navHome: 'الدليل',
        navTrack: 'تتبع حجزي', navAdd: 'إضافة طبيب', navDashboard: 'دخول الأطباء', navLogin: 'تسجيل الدخول', loginTitle: 'تسجيل دخول الأعضاء', signUpTitle: 'إنشاء حساب جديد',
        loginBtn: 'دخول', signUpBtn: 'سجل الآن', googleSignIn: 'تسجيل الدخول عبر غوغل', or: 'أو', fullName: 'الاسم الكامل', fullNamePlaceholder: 'اسمك الكامل', email: 'البريد الإلكتروني *',
        emailPlaceholder: 'your@email.com', password: 'كلمة المرور *', passwordPlaceholder: '••••••••', noAccount: 'ليس لديك حساب؟ سجل الآن', hasAccount: 'لديك حساب بالفعل؟ سجل الدخول',
        loginRequired: 'يجب تسجيل الدخول لإضافة طبيب.', toastRegisterSuccess: 'تم تسجيل الطبيب! المعرف: ', toastRegisterError: 'فشل التسجيل: ', toastBookingSuccess: 'تم تأكيد الموعد! رقم الحجز: ',
        toastBookingError: 'فشل الحجز: ', toastLoginError: 'فشل تسجيل الدخول: ', toastLoadError: 'فشل تحميل الدليل', loadingError: 'تعذر تحميل قائمة الأطباء.', bookBtn: 'حجز موعد',
        toastAuthSuccess: 'أهلاً! ', toastAuthError: 'فشل المصادقة: ', toastLogout: 'تم تسجيل الخروج', weakPassword: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', invalidEmail: 'بريد إلكتروني غير صالح',
        userNotFound: 'لا يوجد حساب بهذا البريد', wrongPassword: 'كلمة المرور غير صحيحة', emailInUse: 'هذا البريد مسجل بالفعل', footerRights: '© 2026 دليل أطباء غليزان. جميع الحقوق محفوظة.',
        privacyPolicy: 'سياسة الخصوصية', contactUs: 'اتصل بنا', heroTitle: 'دليل أطباء ولاية غليزان', heroSubtitle: 'منصتك الشاملة للبحث عن الأطباء، العيادات، وحجز المواعيد الطبية في كافة بلديات ولاية غليزان.',
        enableBooking: 'تفعيل الحجوزات', disableBooking: 'إيقاف الحجوزات', bookingsClosed: 'الحجوزات مغلقة حالياً', toastToggleSuccess: 'تم تحديث حالة الحجز', toastToggleError: 'فشل تحديث الحالة',
        trackBookingTitle: 'تتبع حالة الحجز', trackBookingDesc: 'أدخل رقم الحجز الذي حصلت عليه للتحقق من تأكيد الطبيب.', bookingIdLabel: 'رقم الحجز (APT)', trackSearchBtn: 'بحث عن الحجز',
        workingHoursTitle: 'إعدادات أيام وأوقات العمل', workingHoursDesc: 'قم بتفعيل الأيام التي تعمل فيها وحدد وقت البداية والنهاية لكل يوم.', saveHoursBtnText: 'حفظ الأوقات',
        scheduleTitle: 'جدول العمل المتاح للطبيب', fallbackTitle: 'أوقات العمل المتاحة', dailyTxt: 'يومياً:', selectDateFirst: 'يرجى تحديد تاريخ الموعد أولاً لعرض الأوقات المتاحة...',
        invalidDate: 'يرجى إدخال تاريخ صحيح...', doctorOff: 'الطبيب لا يعمل في هذا اليوم، يرجى اختيار تاريخ آخر.', noSlots: 'عذراً، لا توجد فترات زمنية كافية للحجز في هذا اليوم.',
        morningSession: 'الفترة الصباحية', eveningSession: 'الفترة المسائية', sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة', sat: 'السبت',
        'الأرطوفونيا (تقويم النطق) - Speech Therapy': 'الأرطوفونيا (تقويم النطق)', 'الأشعة - Radiology': 'الأشعة', 'الأمراض الجلدية - Dermatology': 'الأمراض الجلدية', 'الأمراض الصدرية - Pulmonology': 'الأمراض الصدرية',
        'الأمراض المعدية - Infectious Disease': 'الأمراض المعدية', 'الأنف والأذن والحنجرة - ENT (Otolaryngology)': 'الأنف والأذن والحنجرة', 'التخدير - Anesthesiology': 'التخدير', 'التغذية العلاجية - Clinical Nutrition': 'التغذية العلاجية',
        'الجراحة التجميلية - Plastic Surgery': 'الجراحة التجميلية', 'الجراحة العامة - General Surgery': 'الجراحة العامة', 'الطب الباطني - Internal Medicine': 'الطب الباطني', 'الطب المخبري (التحاليل) - Laboratory Medicine': 'الطب المخبري (التحاليل)',
        'الطب النفسي - Psychiatry': 'الطب النفسي', 'العلاج الطبيعي وإعادة التأهيل - Physiotherapy & Rehabilitation': 'العلاج الطبيعي وإعادة التأهيل', 'الغدد الصماء والسكري - Endocrinology': 'الغدد الصماء والسكري',
        'أمراض الجهاز الهضمي - Gastroenterology': 'أمراض الجهاز الهضمي', 'أمراض الدم - Hematology': 'أمراض الدم', 'أمراض الروماتيزم والمفاصل - Rheumatology': 'أمراض الروماتيزم والمفاصل', 'أمراض القلب - Cardiology': 'أمراض القلب',
        'أمراض الكلى - Nephrology': 'أمراض الكلى', 'أمراض النساء والتوليد - Gynecology & Obstetrics': 'أمراض النساء والتوليد', 'جراحة الأوعية الدموية - Vascular Surgery': 'جراحة الأوعية الدموية', 'جراحة العظام - Orthopedics': 'جراحة العظام',
        'جراحة القلب والصدر - Cardiothoracic Surgery': 'جراحة القلب والصدر', 'جراحة المخ والأعصاب - Neurosurgery': 'جراحة المخ والأعصاب', 'جراحة المسالك البولية - Urology': 'جراحة المسالك البولية', 'طب الأعصاب - Neurology': 'طب الأعصاب',
        'طب الأسرة - Family Medicine': 'طب الأسرة', 'طب الأسنان - Dentistry': 'طب الأسنان', 'طب الأطفال - Pediatrics': 'طب الأطفال', 'طب الأورام - Oncology': 'طب الأورام', 'طب الحساسية والمناعة - Allergy & Immunology': 'طب الحساسية والمناعة',
        'طب الشيخوخة - Geriatrics': 'طب الشيخوخة', 'طب الطوارئ - Emergency Medicine': 'طب الطوارئ', 'طب العيون - Ophthalmology': 'طب العيون', 'طب عام - General Medicine': 'طب عام', 'علم الوراثة الطبية - Medical Genetics': 'علم الوراثة الطبية',
        'أولاد سيدي الميهوب': 'أولاد سيدي الميهوب', 'أولاد يعيش': 'أولاد يعيش', 'الحاسي': 'الحاسي', 'الحمادنة': 'الحمادنة', 'القطار': 'القطار', 'القلعة': 'القلعة', 'المطمر': 'المطمر', 'المرجة': 'المرجة', 'الولجة': 'الولجة', 'بن داود': 'بن داود',
        'بني درقون': 'بني درقون', 'بني زنطيس': 'بني زنطيس', 'بلعسل بوزقزة': 'بلعسل بوزقزة', 'جديوية': 'جديوية', 'حد الشكالة': 'حد الشكالة', 'حمري': 'حمري', 'دار بن عبد الله': 'دار بن عبد الله', 'رمكة': 'رمكة', 'زمورة': 'زمورة',
        'سوق الحد': 'سوق الحد', 'سيدي امحمد بن علي': 'سيدي امحمد بن علي', 'سيدي امحمد بن عودة': 'سيدي امحمد بن عودة', 'سيدي خطاب': 'سيدي خطاب', 'سيدي سعادة': 'سيدي سعادة', 'سيدي لزرق': 'سيدي لزرق', 'عين الرحمة': 'عين الرحمة',
        'عين طارق': 'عين طارق', 'عمي موسى': 'عمي موسى', 'غليزان': 'غليزان', 'لحلاف': 'لحلاف', 'مازونة': 'مازونة', 'مديونة': 'مديونة', 'منداس': 'منداس', 'وادي الجمعة': 'وادي الجمعة', 'وادي السلام': 'وادي السلام',
        'وادي رهيو': 'وادي رهيو', 'واريزان': 'واريزان', 'يلل': 'يلل'
      }
    };

    let currentLang = 'en';
    let allDoctors = [];
    let currentDoctor = null;
    let isSignUp = false;
    let globalDashboardData = null;
    let globalDashboardDoctorId = null;
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 30 * 60 * 1000;
    const LOCKOUT_KEY = 'loginLockoutTime';
    const ATTEMPTS_KEY = 'loginAttempts';

    function t(key) { return (i18n[currentLang] && i18n[currentLang][key]) ? i18n[currentLang][key] : (i18n['en'][key] || key); }

    function showToast(message, type) {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast ' + (type || 'success');
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => { toast.style.animation = 'fadeOutDown 0.3s ease-in forwards'; setTimeout(() => toast.remove(), 350); }, 4000);
    }

    function setLoading(btn, isLoading, originalText = null) {
      if (isLoading) {
        btn.disabled = true;
        if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = '<div class="spinner"></div> ' + (currentLang === 'ar' ? 'جاري المعالجة...' : 'Processing...');
      } else {
        btn.disabled = false;
        btn.innerHTML = originalText || btn.dataset.originalHtml || (currentLang === 'ar' ? 'إرسال' : 'Submit');
      }
    }

    function isAccountLocked() {
      const lockoutTime = localStorage.getItem(LOCKOUT_KEY);
      if (!lockoutTime) return false;
      if (Date.now() < parseInt(lockoutTime, 10)) {
        const remaining = Math.ceil((parseInt(lockoutTime, 10) - Date.now()) / 60000);
        showToast((currentLang === 'ar' ? 'الحساب مقفل. حاول بعد ' : 'Account locked. Try again in ') + remaining + (currentLang === 'ar' ? ' دقيقة.' : ' minutes.'), 'error');
        return true;
      }
      localStorage.removeItem(LOCKOUT_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
      return false;
    }

    function recordFailedAttempt() {
      let attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
      localStorage.setItem(ATTEMPTS_KEY, String(attempts));
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION));
        showToast(currentLang === 'ar' ? 'محاولات كثيرة. الحساب مقفل 30 دقيقة.' : 'Too many failed attempts. Account locked for 30 minutes.', 'error');
        return true;
      }
      return false;
    }

    function resetLoginAttempts() { localStorage.removeItem(ATTEMPTS_KEY); localStorage.removeItem(LOCKOUT_KEY); }

    async function syncUserWithBackend(firebaseUser) {
      if (!firebaseUser) return null;
      try {
        const idToken = await firebaseUser.getIdToken();
        const result = await apiPost('authFirebase', { idToken, provider: firebaseUser.providerData[0]?.providerId || 'firebase' });
        if (result.success) {
          const userData = result.data;
          localStorage.setItem('medicalUser', JSON.stringify(userData));
          return userData;
        } else throw new Error(result.error);
      } catch (err) {
        console.error('Sync user failed:', err);
        return null;
      }
    }

    // ✅ الحصول على المستخدم الحالي
async function getCurrentUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    console.log('❌ لا توجد جلسة');
    return null;
  }

  console.log('✅ المستخدم الحالي:', session.user);

  // إرجاع بيانات متوافقة مع الكود القديم
  return {
    UserID: session.user.id,
    Email: session.user.email,
    Name: session.user.user_metadata?.name || session.user.email.split('@')[0],
    Provider: session.user.app_metadata?.provider || 'supabase',
    Role: 'member'
  };
}

    // ✅ تحديث واجهة المستخدم حسب حالة تسجيل الدخول (Supabase)
function updateUserUI(user) {
  console.log('🎨 updateUserUI called with:', user);

  const pill = document.getElementById('userPill');
  const loginBtn = document.getElementById('navLoginBtn');
  const nameDisplay = document.getElementById('userNameDisplay');

  if (user) {
    // المستخدم مسجل دخول
    console.log('✅ عرض واجهة المستخدم المسجل');

    if (pill) pill.classList.remove('hidden');
    if (loginBtn) loginBtn.classList.add('hidden');

    const displayName = user.user_metadata?.name || user.email.split('@')[0];

    if (nameDisplay) {
      nameDisplay.textContent = displayName;
      nameDisplay.style.cursor = 'pointer';
      nameDisplay.style.textDecoration = 'underline';
      nameDisplay.title = currentLang === 'ar' ? 'الذهاب للوحة التحكم' : 'Go to Dashboard';
      nameDisplay.onclick = () => router('user-dashboard');
    }

    // تحديث لوحة التحكم
    const dashName = document.getElementById('memberDashName');
    const dashEmail = document.getElementById('memberDashEmail');
    const dashAvatar = document.getElementById('memberDashAvatar');

    if (dashName) dashName.textContent = displayName;
    if (dashEmail) dashEmail.textContent = user.email;
    if (dashAvatar) dashAvatar.textContent = displayName.charAt(0).toUpperCase();

    // حفظ المستخدم في localStorage
    const userData = {
      UserID: user.id,
      Email: user.email,
      Name: displayName,
      Provider: user.app_metadata?.provider || 'supabase',
      Role: 'member'
    };
    localStorage.setItem('medicalUser', JSON.stringify(userData));

  } else {
    // المستخدم غير مسجل دخول
    console.log('❌ عرض واجهة الزائر');

    if (pill) pill.classList.add('hidden');
    if (loginBtn) loginBtn.classList.remove('hidden');
    localStorage.removeItem('medicalUser');
  }
}
    function getCurrentVisibleView() {
      for (const view of ['home', 'add-doctor', 'booking', 'dashboard', 'login']) {
        const el = document.getElementById('view-' + view);
        if (el && !el.classList.contains('hidden')) return view;
      }
      return 'home';
    }
    // ✅ تسجيل الخروج (Supabase)
async function logoutUser() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    localStorage.removeItem('medicalUser');
    updateUserUI(null);
    showToast(t('toastLogout'), 'success');
    router('home');
  } catch (err) {
    console.error('خطأ في تسجيل الخروج:', err);
    showToast('خطأ في تسجيل الخروج: ' + err.message, 'error');
  }
}
    async function apiGet(action, params = {}) {
      const qs = new URLSearchParams({ action, ...params }).toString();
      const res = await fetch(API_URL + '?' + qs);
      return res.json();
    }

    async function apiPost(action, data = {}) {
      if (typeof grecaptcha !== 'undefined' && RECAPTCHA_SITE_KEY !== 'YOUR_RECAPTCHA_SITE_KEY') {
        try { data.recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }); } catch(e) {}
      }
      const fbUser = firebase.auth().currentUser;
      if (fbUser && action !== 'authFirebase') data.idToken = await fbUser.getIdToken();
      const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action, data }) });
      return res.json();
    }

    // ✅ الكود الجديد لتسجيل الدخول بـ Google:
async function handleGoogleSignIn() {
  if (isAccountLocked()) return;
  try {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    resetLoginAttempts();
  } catch (err) { 
    recordFailedAttempt(); 
    showToast(t('toastAuthError') + err.message, 'error'); 
  }
}

// ✅ الكود الجديد لتسجيل الدخول بالإيميل:
// ✅ الكود الجديد لتسجيل الدخول بالإيميل (مع التحقق من التأكيد)
async function handleEmailAuth() {
  if (isAccountLocked()) return;
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim();
  const btn = document.getElementById('authSubmitBtn');

  if (!email || !password) return;
  setLoading(btn, true);

  try {
  if (isSignUp) {
  if (!name) { 
    showToast(t('fullName') + ' required', 'error'); 
    setLoading(btn, false); 
    return; 
  }

  // ✅ تسجيل حساب جديد
  const { data, error } = await supabaseClient.auth.signUp({ 
    email: email, 
    password: password,
    options: { 
      data: { name: name, display_name: name },
      emailRedirectTo: window.location.origin
    }
  });

  if (error) throw error;

  resetLoginAttempts();

  // ✅ تسجيل الدخول تلقائياً حتى لو لم يؤكد البريد
  if (data.user) {
    // محاولة تسجيل الدخول مباشرة
    const { error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (loginError && loginError.message.includes('Email not confirmed')) {
      // البريد غير مؤكد، لكن نعرض رسالة نجاح فقط
      showToast('تم إنشاء الحساب! يمكنك تسجيل الدخول الآن.', 'success');
    } else {
      showToast('تم إنشاء الحساب بنجاح! ' + t('toastAuthSuccess') + name, 'success');
      setTimeout(() => router('user-dashboard'), 500);
    }
  }

} else {
  // تسجيل دخول
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) throw error;
  resetLoginAttempts();
  showToast(t('toastAuthSuccess') + (data.user.user_metadata?.name || email), 'success');
  setTimeout(() => router('user-dashboard'), 500);
}
  } catch (err) {
    recordFailedAttempt();
    let msg = err.message;
    if (err.code === 'auth/weak-password') msg = t('weakPassword');
    else if (err.code === 'auth/invalid-email') msg = t('invalidEmail');
    else if (err.code === 'auth/user-not-found') msg = t('userNotFound');
    else if (err.code === 'auth/wrong-password') msg = t('wrongPassword');
    else if (err.code === 'auth/email-already-in-use') msg = t('emailInUse');
    showToast(t('toastAuthError') + msg, 'error');
  } finally { 
    setLoading(btn, false); 
  }
}
    function toggleAuthMode() {
      isSignUp = !isSignUp;
      document.getElementById('nameFieldGroup').classList.toggle('hidden', !isSignUp);
      document.getElementById('authFormTitle').textContent = t(isSignUp ? 'signUpTitle' : 'loginTitle');
      document.getElementById('authSubmitBtn').querySelector('span').textContent = t(isSignUp ? 'signUpBtn' : 'loginBtn');
      document.getElementById('authToggleText').textContent = t(isSignUp ? 'hasAccount' : 'noAccount');
    }

    function openScheduleModal(doctorName, scheduleHtml) {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; padding: 1rem;';
      const modal = document.createElement('div');
      modal.className = 'card';
      modal.style.cssText = 'width: 100%; max-width: 380px; transform: translateY(30px); transition: transform 0.3s ease; position: relative; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); text-align: center; border-top: 4px solid var(--primary);';
      const titleText = currentLang === 'ar' ? 'الجدول الأسبوعي' : 'Weekly Schedule';
      const closeText = currentLang === 'ar' ? 'إغلاق النافذة' : 'Close';
      modal.innerHTML = `
        <div style="background: #e6f4ea; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; color: var(--primary);">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: bold; color: var(--text); margin-bottom: 0.25rem;">${titleText}</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.25rem; font-weight: 600;">Dr. ${doctorName}</p>
        <div style="background: var(--bg); border-radius: 8px; padding: 1rem; border: 1px solid var(--border); margin-bottom: 1.5rem; text-align: ${currentLang === 'ar' ? 'right' : 'left'};">${scheduleHtml}</div>
        <button class="btn btn-primary btn-block" id="closeScheduleModalBtn">${closeText}</button>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.transform = 'translateY(0)'; });
      const closeModal = () => { overlay.style.opacity = '0'; modal.style.transform = 'translateY(30px)'; setTimeout(() => overlay.remove(), 300); };
      modal.querySelector('#closeScheduleModalBtn').onclick = closeModal;
      overlay.onclick = (e) => { if (e.target === overlay) closeModal(); }; 
    }

    // ✅ الدالة الجديدة لعرض الأطباء
function renderDoctors(doctors) {
  const container = document.getElementById('doctorsList');
  container.innerHTML = '';

  if (!doctors || doctors.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon" style="opacity: 1; color: var(--text-secondary); margin-bottom: 1rem; display: flex; justify-content: center;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div><div>' + t('noDoctorsFound') + '</div></div>';
    return;
  }

  doctors.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'card doctor-card card-hover';
    card.style.cssText = 'cursor: pointer;';

    // إنشاء Avatar
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = (doc.first_name?.[0] || '') + (doc.last_name?.[0] || '');

    // اسم الطبيب
    const docPrefix = currentLang === 'ar' ? 'د.' : 'Dr.';
    const doctorName = `${docPrefix} ${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}`;

    // الرأس (Avatar + المعلومات)
    const headerRight = document.createElement('div');
    headerRight.style.cssText = 'flex: 1; min-width: 0;'; 
    headerRight.innerHTML = `
      <div class="font-bold text-lg" style="display: flex; align-items: center; gap: 4px; overflow: hidden; margin-bottom: 0.3rem; color: var(--primary-dark);">
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doctorName}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0ea5e9" stroke="white" stroke-width="2" style="flex-shrink: 0;"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.823 3.823 7.177-7.177-1.06-1.061-6.117 6.12z"></path></svg>
      </div>
      <div class="text-sm" style="display: flex; align-items: center; gap: 6px; margin-bottom: 0.3rem; color: var(--text);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${escapeHtml(t(doc.specialty))}</span>
      </div>
      <div class="text-sm font-semibold" style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(t(doc.municipality))}</span>
      </div>
    `;

    const doctorHeader = document.createElement('div');
    doctorHeader.className = 'doctor-header';
    doctorHeader.appendChild(avatar);
    doctorHeader.appendChild(headerRight);

    // زر الحجز
    const isBookingEnabled = doc.booking_enabled === true;
    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn ' + (isBookingEnabled ? 'btn-primary' : 'btn-secondary') + ' btn-block';
    actionBtn.style.cssText = 'margin-top: 1rem; padding: 0.6rem; border-radius: 8px; transition: all 0.2s;';
    actionBtn.innerHTML = isBookingEnabled ? 
        (currentLang === 'ar' ? 'عرض التفاصيل والحجز' : 'View Details & Book') : 
        (currentLang === 'ar' ? 'الحجوزات مغلقة حالياً' : 'Bookings Currently Closed');

    card.appendChild(doctorHeader);
    card.appendChild(actionBtn);

    // فتح نافذة التفاصيل عند النقر
    card.onclick = () => openDoctorProfileModal(doc, doctorName);

    container.appendChild(card);
  });
}
    // ✅ الدالة الجديدة لعرض تفاصيل الطبيب
function openDoctorProfileModal(doc, doctorName) {
  const modal = document.getElementById('doctorProfileModal');
  const content = document.getElementById('dpModalContent');

  // إنشاء رابط المشاركة (يستخدم UUID الآن)
  const profileUrl = `${window.location.origin}${window.location.pathname}?doc=${doc.id}`;
  const shareText = currentLang === 'ar' ? 'مشاركة الرابط' : 'Share Link';
  const isBookingEnabled = doc.booking_enabled === true;

  // بناء جدول العمل
  let scheduleHtml = '';
  if (doc.working_days && Object.keys(doc.working_days).length > 0) {
    try {
      const wd = typeof doc.working_days === 'string' ? JSON.parse(doc.working_days) : doc.working_days;
      const daysNames = currentLang === 'ar' 
        ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] 
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for(let i=0; i<=6; i++) {
        if(wd[i] && wd[i].active) {
          scheduleHtml += `<div style="display:flex; justify-content:space-between; padding: 0.25rem 0; font-size: 0.9rem;">
            <span style="color: var(--text-secondary);">${daysNames[i]}</span>
            <span dir="ltr" style="color: var(--text); font-weight: 600;">${wd[i].start} - ${wd[i].end}</span>
          </div>`;
        }
      }
    } catch(e) {
      console.error('Error parsing working days:', e);
    }
  }

  if(!scheduleHtml) {
    scheduleHtml = `<div class="text-sm text-gray">${currentLang === 'ar' ? 'غير متوفر' : 'Not available'}</div>`;
  }

  // محتوى النافذة
  content.innerHTML = `
    <div class="dp-header">
      <button class="dp-close" onclick="document.getElementById('doctorProfileModal').classList.add('hidden')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="avatar" style="width: 64px; height: 64px; font-size: 1.5rem; background: white; color: var(--primary); box-shadow: none;">
        ${(doc.first_name?.[0] || '') + (doc.last_name?.[0] || '')}
      </div>
      <div>
        <h2 style="margin: 0; font-size: 1.25rem; font-weight: bold;">${doctorName}</h2>
        <div style="opacity: 0.9; font-size: 0.9rem;">${escapeHtml(t(doc.specialty))}</div>
      </div>
    </div>
    
    <div class="dp-body">
      <div class="dp-info-row">
        <div class="dp-info-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.2rem;">
            ${currentLang === 'ar' ? 'العنوان الدقيق' : 'Exact Location'}
          </div>
          <div style="font-weight: 600; color: var(--text);">
            ${escapeHtml(doc.exact_location)}, ${escapeHtml(t(doc.municipality))}
          </div>
        </div>
      </div>
      
      <div class="dp-info-row">
        <div class="dp-info-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.2rem;">
            ${currentLang === 'ar' ? 'رقم العيادة' : 'Clinic Phone'}
          </div>
          <div style="font-weight: 600; color: var(--text);" dir="ltr">
            ${escapeHtml(formatPhoneNumber(doc.phone))}
          </div>
        </div>
      </div>
      
      <div class="dp-info-row">
        <div class="dp-info-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
            ${currentLang === 'ar' ? 'أوقات العمل المتاحة' : 'Available Working Hours'}
          </div>
          <div style="background: var(--surface); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border);">
            ${scheduleHtml}
          </div>
        </div>
      </div>
      
      ${doc.extra_info ? `
      <div class="dp-info-row">
        <div class="dp-info-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.2rem;">
            ${currentLang === 'ar' ? 'معلومات إضافية' : 'Extra Information'}
          </div>
          <div style="color: var(--text); font-size: 0.9rem; line-height: 1.5;">
            ${escapeHtml(doc.extra_info)}
          </div>
        </div>
      </div>` : ''}
      
      <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
        <button class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;" 
          onclick="openReviewsModal('${doc.id}', '${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}')">
          <span style="color: #b45309; margin-inline-end: 4px;">★</span> 
          ${currentLang === 'ar' ? 'التقييمات' : 'Reviews'}
        </button>
        <button class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;" 
          onclick="navigator.clipboard.writeText('${profileUrl}'); showToast(currentLang==='ar'?'تم النسخ':'Copied', 'success');">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-inline-end: 4px;">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          ${shareText}
        </button>
      </div>
    </div>
    
    <div class="dp-footer">
      <button class="btn ${isBookingEnabled ? 'btn-success' : 'btn-secondary'} btn-block" 
        ${isBookingEnabled ? `onclick="document.getElementById('doctorProfileModal').classList.add('hidden'); openBooking('${doc.id}')"` : 'disabled'}>
        ${isBookingEnabled ? (currentLang === 'ar' ? 'تأكيد وحجز موعد' : 'Confirm & Book') : (currentLang === 'ar' ? 'الحجوزات مغلقة' : 'Bookings Closed')}
      </button>
    </div>
  `;

  modal.classList.remove('hidden');
}

    function escapeHtml(str) { if (!str) return ''; return DOMPurify.sanitize(str); }

    function updateSEOMetaTags(doc) {
      if (!doc) return;
      const pageTitle = currentLang === 'ar' ? `د. ${doc.FirstName} ${doc.LastName} | ${doc.Specialty} في ${doc.Municipality}` : `Dr. ${doc.FirstName} ${doc.LastName} | ${doc.Specialty} in ${doc.Municipality}`;
      const pageDesc = currentLang === 'ar' ? `احجز موعدك مع د. ${doc.FirstName} ${doc.LastName}، أخصائي ${doc.Specialty} في ${doc.Municipality}، ولاية غليزان. العنوان: ${doc.ExactLocation}` : `Book an appointment with Dr. ${doc.FirstName} ${doc.LastName}, ${doc.Specialty} in ${doc.Municipality}, Relizane.`;
      document.title = pageTitle;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', pageDesc);
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', pageTitle);
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', pageDesc);
    }

function handleSEOAndRender() {
      const urlParams = new URLSearchParams(window.location.search);
      const targetDocId = urlParams.get('doc');
      if (targetDocId) {
        const targetDoc = allDoctors.find(d => d.DoctorID === targetDocId);
        if (targetDoc) {
          updateSEOMetaTags(targetDoc);
          renderDoctors([targetDoc]);
          populateFilters(); // تأكد من استدعاء الفلاتر

          // === الجزء الجديد: هذا هو السحر الذي سيفتح النافذة تلقائياً ===
          const doctorName = (currentLang === 'ar' ? 'د. ' : 'Dr. ') + targetDoc.FirstName + ' ' + targetDoc.LastName;
          setTimeout(() => {
              openDoctorProfileModal(targetDoc, doctorName);
          }, 300); // تأخير بسيط لضمان أن الواجهة جاهزة للرسم
          // ========================================================

          let backBtn = document.getElementById('seoBackBtn');
          if(!backBtn) {
             backBtn = document.createElement('button');
             backBtn.id = 'seoBackBtn';
             backBtn.className = 'btn btn-secondary btn-block mb-4';
             backBtn.innerHTML = currentLang === 'ar' ? '&#8594; عرض جميع الأطباء المتاحين' : '&#8592; View All Available Doctors';
             backBtn.onclick = () => {
                 window.history.pushState({}, document.title, window.location.pathname);
                 document.title = currentLang === 'ar' ? 'دليل أطباء ولاية غليزان' : 'Relizane Medical Directory';
                 renderDoctors(allDoctors);
                 backBtn.remove();
             };
             document.getElementById('doctorsList').insertAdjacentElement('beforebegin', backBtn);
          }
          return;
        }
      }
      renderDoctors(allDoctors);
      populateFilters();
    }

    // ✅ الدالة الجديدة باستخدام Supabase
async function loadDoctors() {
  const container = document.getElementById('doctorsList');

  // إظهار Skeleton Loading (موجود في الكود القديم)
  let skeletonHtml = '';
  for(let i=0; i<6; i++) {
    skeletonHtml += `
      <div class="skeleton-card">
        <div class="s-header"><div class="s-avatar"></div><div style="flex:1;"><div class="s-line s-w-75" style="height: 16px;"></div><div class="s-line s-w-50"></div></div></div>
        <div class="s-line s-w-100"></div><div class="s-line s-w-100"></div><div class="s-line s-w-100" style="height: 40px; margin-top: 1.5rem;"></div>
      </div>`;
  }
  container.innerHTML = skeletonHtml;

  try {
    // ✅ جلب البيانات من Supabase
    const { data, error } = await supabaseClient
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading doctors:', error);
      throw new Error(error.message);
    }

    // حفظ البيانات في المتغير العام
    allDoctors = data || [];

    console.log('✅ تم تحميل الأطباء:', allDoctors.length);

    // عرض البيانات
    handleSEOAndRender();

  } catch (err) {
    console.error('Failed to load doctors:', err);
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>' + t('loadingError') + '</div></div>';
    showToast(t('toastLoadError'), 'error');
  }
}

    function formatPhoneNumber(phone) {
      if (!phone) return '';
      let cleaned = String(phone).replace(/\D/g, '');
      if (cleaned.length === 10) return cleaned.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      return cleaned || phone; 
    }

    function populateFilters() {
      const specs = [...new Set(allDoctors.map(d => d.Specialty).filter(Boolean))].sort();
      const muns = [...new Set(allDoctors.map(d => d.Municipality).filter(Boolean))].sort();
      const specSel = document.getElementById('specialtyFilter');
      const munSel = document.getElementById('municipalityFilter');
      const prevSpec = specSel.value;
      const prevMun = munSel.value;
      specSel.innerHTML = '<option value="">' + t('allSpecialties') + '</option>';
      munSel.innerHTML = '<option value="">' + t('allMunicipalities') + '</option>';
      specs.forEach(s => { const opt = document.createElement('option'); opt.value = s; opt.textContent = t(s); specSel.appendChild(opt); });
      muns.forEach(m => { const opt = document.createElement('option'); opt.value = m; opt.textContent = t(m); munSel.appendChild(opt); });
      if (prevSpec && specs.includes(prevSpec)) specSel.value = prevSpec;
      if (prevMun && muns.includes(prevMun)) munSel.value = prevMun;
      if (window.tsSpecialtyFilter) { window.tsSpecialtyFilter.clearOptions(); Array.from(specSel.options).forEach(opt => window.tsSpecialtyFilter.addOption({value: opt.value, text: opt.text})); window.tsSpecialtyFilter.setValue(prevSpec); }
      if (window.tsMunicipalityFilter) { window.tsMunicipalityFilter.clearOptions(); Array.from(munSel.options).forEach(opt => window.tsMunicipalityFilter.addOption({value: opt.value, text: opt.text})); window.tsMunicipalityFilter.setValue(prevMun); }
      filterDoctors();
    }

    function filterDoctors() {
      const searchInput = document.getElementById('searchInput');
      const search = searchInput.value.toLowerCase().trim();
      const spec = document.getElementById('specialtyFilter').value;
      const mun = document.getElementById('municipalityFilter').value;
      const suggestionsDropdown = document.getElementById('searchSuggestions');
      const filtered = allDoctors.filter(doc => {
        const text = `${doc.FirstName||''} ${doc.LastName||''} ${doc.Specialty||''} ${doc.Municipality||''} ${doc.ExactLocation||''}`.toLowerCase();
        return (!search || text.includes(search)) && (!spec || doc.Specialty === spec) && (!mun || doc.Municipality === mun);
      });
      renderDoctors(filtered);
      if (!suggestionsDropdown) return;
      if (search.length < 2) { suggestionsDropdown.classList.add('hidden'); return; }
      const suggestionsHtml = filtered.slice(0, 5).map(doc => {
          const avatarText = (doc.FirstName?.[0] || '') + (doc.LastName?.[0] || '');
          const doctorName = escapeHtml(doc.FirstName) + ' ' + escapeHtml(doc.LastName);
          const specialtyStr = escapeHtml(t(doc.Specialty));
          return `
            <div class="suggestion-item" onclick="selectSuggestion('${doc.DoctorID}')">
              <div class="sugg-avatar">${avatarText}</div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: bold; font-size: 0.95rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${currentLang === 'ar' ? 'د.' : 'Dr.'} ${doctorName}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${specialtyStr} - ${escapeHtml(t(doc.Municipality))}</div>
              </div>
            </div>`;
      }).join('');
      if (suggestionsHtml) { suggestionsDropdown.innerHTML = suggestionsHtml; suggestionsDropdown.classList.remove('hidden'); } 
      else { suggestionsDropdown.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">${t('noDoctorsFound')}</div>`; suggestionsDropdown.classList.remove('hidden'); }
    }

    window.selectSuggestion = function(doctorId) {
        const doc = allDoctors.find(d => d.DoctorID === doctorId);
        if (doc) {
            document.getElementById('searchInput').value = doc.FirstName + ' ' + doc.LastName;
            document.getElementById('searchSuggestions').classList.add('hidden');
            renderDoctors([doc]);
        }
    };
    document.addEventListener('click', function(e) {
        const searchInput = document.getElementById('searchInput');
        const suggestionsDropdown = document.getElementById('searchSuggestions');
        if (searchInput && suggestionsDropdown && !searchInput.contains(e.target) && !suggestionsDropdown.contains(e.target)) {
            suggestionsDropdown.classList.add('hidden');
        }
    });

    // ✅ دالة إضافة طبيب جديد (محدثة لـ Supabase)
async function handleAddDoctor(e) {
  e.preventDefault();
  const user = await getCurrentUser();
  if (!user) { 
    showToast(t('loginRequired'), 'error'); 
    router('login'); 
    return; 
  }

  const btn = document.getElementById('addDoctorBtn');
  setLoading(btn, true);

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  // التحقق من الحقول المطلوبة
  if (!data.Specialty) { 
    showToast(currentLang === 'ar' ? 'الرجاء اختيار الاختصاص.' : 'Please select a specialty.', 'error'); 
    setLoading(btn, false); 
    return; 
  }
  if (!data.Municipality) { 
    showToast(currentLang === 'ar' ? 'الرجاء اختيار البلدية.' : 'Please select a municipality.', 'error'); 
    setLoading(btn, false); 
    return; 
  }

  try {
    // 1. تشفير كلمة المرور (استخدمنا رقم الهاتف ككلمة مرور افتراضية للتبسيط)
    // ملاحظة: في الإنتاج الحقيقي، يجب أن يدخل الطبيب كلمة مرور خاصة به
    const defaultPassword = data.Phone.replace(/\s/g, ''); 
    const hashedPassword = await hashPassword(defaultPassword);

    // 2. حفظ البيانات في Supabase
    const { data: newDoctor, error } = await supabaseClient
      .from('doctors')
      .insert([{
        first_name: data.FirstName.trim(),
        last_name: data.LastName.trim(),
        phone: data.Phone.replace(/\s/g, ''),
        exact_location: data.ExactLocation.trim(),
        specialty: data.Specialty.trim(),
        municipality: data.Municipality.trim(),
        extra_info: data.ExtraInfo ? data.ExtraInfo.trim() : '',
        password_hash: hashedPassword,
        booking_enabled: false, // يبدأ الحجز وهو مغلق
        working_days: {} // جدول فارغ افتراضياً
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding doctor:', error);
      throw new Error(error.message);
    }

    showToast(t('toastRegisterSuccess') + newDoctor.id, 'success');
    e.target.reset();

    // إعادة تحميل قائمة الأطباء
    await loadDoctors();
    setTimeout(() => router('home'), 1500);

  } catch (err) { 
    showToast(t('toastRegisterError') + err.message, 'error'); 
  } finally { 
    setLoading(btn, false); 
  }
}

// ✅ دالة مساعدة لتشفير كلمة المرور (SHA-256)
// هذه دالة بسيطة للتجربة، في الإنتاج استخدم bcrypt عبر Edge Function
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
  function generateTimeSlots(startStr, endStr, intervalMins) {
    const slots = [];
    let [startH, startM] = startStr.split(':').map(Number);
    let [endH, endM] = endStr.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (current < end) {
      let h = Math.floor(current / 60);
      let m = current % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      current += intervalMins;
    }
    return slots;
  }

 // ✅ الدالة الجديدة لفتح نموذج الحجز
function openBooking(doctorId) {
  // البحث عن الطبيب باستخدام UUID
  currentDoctor = allDoctors.find(d => d.id === doctorId);
  if (!currentDoctor) {
    console.error('Doctor not found:', doctorId);
    showToast(currentLang === 'ar' ? 'الطبيب غير موجود' : 'Doctor not found', 'error');
    return;
  }

  // تعيين معرف الطبيب في النموذج
  document.getElementById('bookingDoctorId').value = doctorId;

  // معلومات الطبيب
  let infoHtml = `
    <div class="doctor-header">
      <div class="avatar">
        ${(currentDoctor.first_name?.[0]||'')+(currentDoctor.last_name?.[0]||'')}
      </div>
      <div>
        <div class="font-bold text-lg">
          Dr. ${escapeHtml(currentDoctor.first_name)} ${escapeHtml(currentDoctor.last_name)}
        </div>
        <div class="text-sm text-gray">
          ${escapeHtml(t(currentDoctor.specialty))} • ${escapeHtml(t(currentDoctor.municipality))}
        </div>
      </div>
    </div>
  `;

  // جدول العمل
  let scheduleHtml = '';
  let wd = {};
  if (currentDoctor.working_days) {
    try {
      wd = typeof currentDoctor.working_days === 'string' 
        ? JSON.parse(currentDoctor.working_days) 
        : currentDoctor.working_days;

      const daysKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      let activeDaysHtml = '';

      for(let i=0; i<=6; i++) {
        if(wd[i] && wd[i].active) {
          activeDaysHtml += `
            <div style="display:flex; justify-content:space-between; padding: 0.375rem 0; border-bottom: 1px dashed var(--border); font-size: 0.875rem;">
              <span class="font-semibold" style="color: var(--text);" data-i18n="${daysKeys[i]}">
                ${t(daysKeys[i])}
              </span>
              <span dir="ltr" style="color: var(--primary); font-weight: 600;">
                ${wd[i].start} - ${wd[i].end}
              </span>
            </div>
          `;
        }
      }

      if(activeDaysHtml !== '') {
        scheduleHtml = `
          <div style="margin-top: 1.25rem; padding: 1rem; background: var(--bg); border-radius: var(--radius); border: 1px solid var(--border);">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom: 0.75rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h4 style="font-size: 0.95rem; font-weight: bold; color: var(--text); margin:0;" data-i18n="scheduleTitle">
                ${t('scheduleTitle')}
              </h4>
            </div>
            ${activeDaysHtml}
          </div>
        `;
      }
    } catch(e) {
      console.error('Error parsing working days:', e);
    }
  }

  // إذا لم يكن هناك جدول، استخدم الأوقات الافتراضية
  if (scheduleHtml === '') {
    const st = currentDoctor.working_days ? '08:00' : (currentDoctor.StartTime ? currentDoctor.StartTime.substring(0, 5) : '08:00');
    const et = currentDoctor.working_days ? '16:00' : (currentDoctor.EndTime ? currentDoctor.EndTime.substring(0, 5) : '16:00');
    scheduleHtml = `
      <div style="margin-top: 1.25rem; padding: 1rem; background: var(--bg); border-radius: var(--radius); border: 1px solid var(--border);">
        <h4 style="font-size: 0.95rem; font-weight: bold; color: var(--text); margin-bottom: 0.5rem;" data-i18n="fallbackTitle">
          ${t('fallbackTitle')}
        </h4>
        <div style="font-size: 0.875rem; color: var(--primary); font-weight: 600;" dir="ltr">
          <span data-i18n="dailyTxt">${t('dailyTxt')}</span> ${st} - ${et}
        </div>
      </div>
    `;
  }

  document.getElementById('bookingDoctorInfo').innerHTML = infoHtml + scheduleHtml;

  // إعداد حقول التاريخ والوقت
  const dateInput = document.getElementById('apptDateInput');
  const timeContainer = document.getElementById('timeSlotsContainer');
  let timeInputHidden = document.getElementById('apptTimeInput');

  if (!timeInputHidden) {
    timeInputHidden = document.createElement('input');
    timeInputHidden.type = 'hidden';
    timeInputHidden.id = 'apptTimeInput';
    timeInputHidden.name = 'AppointmentTime';
    timeInputHidden.required = true;
    document.querySelector('#bookingForm .grid').appendChild(timeInputHidden);
  }

  // تصفير الحقول
  dateInput.value = '';
  if (timeContainer) timeContainer.innerHTML = `<div class="text-sm text-gray" style="grid-column: 1 / -1;" data-i18n="selectDateFirst">${t('selectDateFirst')}</div>`;
  timeInputHidden.value = '';

  // حدث تغيير التاريخ
 // ✅ تصحيح حدث تغيير التاريخ
dateInput.onchange = function() {
  console.log('📅 تاريخ مختار:', this.value);
  console.log('🕐 workingDays:', wd);
  handleDateSelection(this.value, wd);
};

// أيضاً أضف هذا للتأكد من أن التاريخ لا يمكن أن يكون في الماضي
const today = new Date().toISOString().split('T')[0];
dateInput.min = today;

  // الانتقال لصفحة الحجز
  router('booking');
}

  // ✅ دالة تأكيد الحجز (قبل الإرسال)
function confirmBooking() {
  const form = document.getElementById('bookingForm');

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const patientName = form.elements['PatientName'].value.trim();
  const apptDate = form.elements['AppointmentDate'].value;
  const apptTime = form.elements['AppointmentTime'].value;

  // التحقق من اختيار الوقت
  if (!apptTime) {
    showToast(currentLang === 'ar' ? 'يرجى اختيار وقت الموعد' : 'Please select appointment time', 'error');
    return;
  }

  // التحقق من أن الوقت ضمن نطاق العمل
  const selectedDate = new Date(apptDate);
  const dayNum = selectedDate.getDay();
  let wd = {};
  if (currentDoctor.working_days) {
    try {
      wd = typeof currentDoctor.working_days === 'string' 
        ? JSON.parse(currentDoctor.working_days) 
        : currentDoctor.working_days;
    } catch(err) {}
  }

  if (wd[dayNum] && wd[dayNum].active) {
    if (apptTime < wd[dayNum].start || apptTime > wd[dayNum].end) {
      showToast(
        currentLang === 'ar' 
          ? `الوقت متاح فقط بين ${wd[dayNum].start} و ${wd[dayNum].end}` 
          : `Time only available between ${wd[dayNum].start} and ${wd[dayNum].end}`,
        'error'
      );
      return;
    }
  }

  // إظهار نافذة التأكيد
  const doctorName = currentDoctor 
    ? `${currentDoctor.first_name} ${currentDoctor.last_name}` 
    : '';

  document.getElementById('confirmDialogBody').textContent = 
    (currentLang === 'ar' 
      ? `المريض: ${patientName} | الطبيب: د. ${doctorName} | التاريخ: ${apptDate} ${apptTime}` 
      : `Patient: ${patientName} | Doctor: Dr. ${doctorName} | Date: ${apptDate} at ${apptTime}`);

  document.getElementById('confirmDialog').classList.remove('hidden');
}

  function closeConfirmDialog() { document.getElementById('confirmDialog').classList.add('hidden'); }

// ✅ دالة حفظ الحجز في Supabase
async function submitBooking() {
  closeConfirmDialog();

  const btn = document.getElementById('bookingBtn');
  setLoading(btn, true);

  const form = document.getElementById('bookingForm');
  const data = Object.fromEntries(new FormData(form));

  // التحقق من البيانات
  if (!data.PatientName || !data.PatientPhone || !data.AppointmentDate || !data.AppointmentTime) {
    showToast(currentLang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', 'error');
    setLoading(btn, false);
    return;
  }

  try {
    // الحصول على المستخدم الحالي (إن وجد)
    const { data: { user } } = await supabaseClient.auth.getUser();

    // ✅ حفظ الحجز في Supabase
    const { data: booking, error } = await supabaseClient
      .from('appointments')
      .insert([{
        doctor_id: data.DoctorID,
        patient_name: data.PatientName.trim(),
        patient_phone: data.PatientPhone.trim(),
        appointment_date: data.AppointmentDate,
        appointment_time: data.AppointmentTime,
        status: 'pending',
        user_id: user ? user.id : null
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في الحجز:', error);
      throw new Error(error.message);
    }

    console.log('✅ تم الحجز بنجاح:', booking);

    // مسح النموذج
    form.reset();

    // تصفير حاوية الأوقات
    const timeContainer = document.getElementById('timeSlotsContainer');
    if (timeContainer) {
      timeContainer.innerHTML = '<div class="text-sm text-gray" style="grid-column: 1 / -1;">يرجى تحديد تاريخ الموعد أولاً لعرض الأوقات المتاحة...</div>';
    }
    
    // --- بناء التذكرة الإلكترونية (E-Ticket) ---
    const bId = booking.id;
    const shortId = bId.substring(0, 8).toUpperCase();
    const bName = data.PatientName;
    const bDate = data.AppointmentDate;
    const bTime = data.AppointmentTime;
    const bDoctor = currentDoctor ? `${currentDoctor.first_name} ${currentDoctor.last_name}` : '';

    const ticketHtml = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 1.5rem; text-align: center; color: white; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 320px; margin: 0 auto;">
        <div style="background: white; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; color: #10b981;">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: bold;">${currentLang === 'ar' ? 'تم تأكيد الحجز' : 'Booking Confirmed'}</h3>
        <div style="font-size: 0.85rem; opacity: 0.95; margin-bottom: 1.5rem;">
          ${currentLang === 'ar' ? 'د.' : 'Dr.'} ${escapeHtml(bDoctor)}
        </div>
        
        <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <span style="opacity: 0.9; font-size: 0.9rem;">${currentLang === 'ar' ? 'رقم الحجز' : 'Booking ID'}</span>
            <span style="font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 2px; font-size: 1.1rem;">${shortId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <span style="opacity: 0.9; font-size: 0.9rem;">${currentLang === 'ar' ? 'المريض' : 'Patient'}</span>
            <span style="font-weight: 600;">${escapeHtml(bName)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="opacity: 0.9; font-size: 0.9rem;">${currentLang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</span>
            <span dir="ltr" style="font-weight: 600; font-size: 0.85rem;">${bDate} | ${bTime}</span>
          </div>
        </div>
        
        <div style="background: white; padding: 1rem; border-radius: 8px; display: inline-block;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bId}&color=667eea" alt="QR Code" style="width: 120px; height: 120px;" />
        </div>
        
        <div style="margin-top: 1.5rem; font-size: 0.85rem; opacity: 0.9;">
          ${currentLang === 'ar' ? 'يرجى إبراز هذه التذكرة عند الوصول' : 'Please show this ticket upon arrival'}
        </div>
      </div>
    `;

    // إظهار التذكرة
    document.getElementById('eTicketContainer').innerHTML = ticketHtml;
    document.getElementById('successDialog').classList.remove('hidden');

  } catch (err) {
    console.error('❌ خطأ في الحجز:', err);
    showToast(t('toastBookingError') + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}
    // دالة جديدة لإغلاق نافذة النجاح والعودة للرئيسية



    window.closeSuccessDialog = function() {



      document.getElementById('successDialog').classList.add('hidden');



      router('home');



    };

// ========================================================================

// DASHBOARD

// ========================================================================



// 1. دالة جديدة مساعدة لرسم لوحة تحكم الطبيب (تطبيق مبدأ DRY)

// 1. دالة جديدة مساعدة لرسم لوحة تحكم الطبيب (مع الترجمة الديناميكية)
// ✅ رسم لوحة تحكم الطبيب (محدّثة لـ Supabase)
function renderDashboardUI(data, doctorId) {
  globalDashboardData = data;
  globalDashboardDoctorId = doctorId;

  // تحديث العنوان
  document.getElementById('dashboardSubtitle').textContent = 
    data.doctorName ? (currentLang === 'ar' ? `د. ${data.doctorName}` : `Dr. ${data.doctorName}`) : doctorId;

  // بناء قائمة أيام العمل
  const daysNames = currentLang === 'ar' 
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let savedDays = {};
  try { savedDays = JSON.parse(data.workingDays || '{}'); } catch(e) {}

  const container = document.getElementById('daysListContainer');
  container.innerHTML = '';
  for (let i = 0; i <= 6; i++) {
    const dayData = savedDays[i.toString()] || { active: true, start: '08:00', end: '16:00' };
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; background: var(--bg); padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--border);';
    row.innerHTML = `
      <div style="flex: 1; min-width: 100px; display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="day_active_${i}" ${dayData.active ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
        <label for="day_active_${i}" style="margin: 0; cursor: pointer; font-weight: bold;">${daysNames[i]}</label>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="time" id="day_start_${i}" value="${dayData.start}" style="padding: 0.4rem; max-width: 110px;">
        <span>-</span>
        <input type="time" id="day_end_${i}" value="${dayData.end}" style="padding: 0.4rem; max-width: 110px;">
      </div>
    `;
    container.appendChild(row);
  }

  // تحديث زر إيقاف/تشغيل الحجوزات
  const isEnabled = !!data.bookingEnabled;
  const toggleSwitch = document.getElementById('bookingToggleSwitch');
  if (toggleSwitch) toggleSwitch.checked = isEnabled;
  updateToggleText(isEnabled);

  // رسم جدول المواعيد
  const appointments = data.appointments || [];
  const tbody = document.getElementById('appointmentsTable');
  const empty = document.getElementById('noAppointments');

  if (appointments.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  const confirmTxt = currentLang === 'ar' ? 'تأكيد' : 'Confirm';
  const cancelTxt = currentLang === 'ar' ? 'إلغاء' : 'Cancel';
  const completedTxt = currentLang === 'ar' ? 'مكتمل' : 'Completed';

  empty.classList.add('hidden');
  tbody.innerHTML = appointments.map(a => {
    // ✅ أسماء الأعمدة الجديدة من Supabase
    const statusTextDb = a.status || 'pending';
    const bookingId = a.id;
    const patientName = a.patient_name;
    const patientPhone = a.patient_phone;
    const apptDate = a.appointment_date;
    const apptTime = a.appointment_time;
    const userEmail = a.user_email || '';

    let displayStatus = statusTextDb;
    let statusStyle = 'background: #f1f5f9; color: #64748b; border: 0.5px solid #cbd5e1;';

    if (statusTextDb === 'confirmed') {
      statusStyle = 'background: #ecfdf5; color: #10b981; border: 0.5px solid #a7f3d0;';
      displayStatus = currentLang === 'ar' ? 'مؤكد' : 'Confirmed';
    } else if (statusTextDb === 'cancelled') {
      statusStyle = 'background: #fef2f2; color: #ef4444; border: 0.5px solid #fecaca;';
      displayStatus = currentLang === 'ar' ? 'ملغى' : 'Cancelled';
    } else if (statusTextDb === 'pending') {
      displayStatus = currentLang === 'ar' ? 'قيد الانتظار' : 'Pending';
    }

    let statusIndicator = '#f59e0b';
    if (statusTextDb === 'confirmed') statusIndicator = '#10b981';
    if (statusTextDb === 'cancelled') statusIndicator = '#ef4444';

    const actionsHtml = (statusTextDb === 'pending') ? `
      <button class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: #ecfdf5; border: 1px solid #10b981; color: #10b981; border-radius: 6px;" 
        onclick="changeBookingStatus('${bookingId}', 'confirmed', '${userEmail}', '${escapeHtml(data.doctorName)}', '${apptDate}')">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-inline-end: 0.25rem; vertical-align: middle;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        ${confirmTxt}
      </button>
      <button class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: #fef2f2; border: 1px solid #ef4444; color: #ef4444; border-radius: 6px;" 
        onclick="changeBookingStatus('${bookingId}', 'cancelled', '${userEmail}', '${escapeHtml(data.doctorName)}', '${apptDate}')">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-inline-end: 0.25rem; vertical-align: middle;">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        ${cancelTxt}
      </button>
    ` : `<span class="badge" style="background: var(--bg); color: var(--text-secondary); border: 1px solid var(--border); padding: 0.4rem 0.8rem;">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-inline-end: 0.25rem; vertical-align: middle;">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      ${completedTxt}
    </span>`;

    return `
    <div class="card-hover" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
      <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 4px; background: ${statusIndicator};"></div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-right: 0.5rem;">
        <div style="flex: 1; min-width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="font-family: monospace; font-size: 0.85rem; color: var(--text-secondary); background: var(--bg); padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid var(--border); letter-spacing: 0.5px;">
              ${bookingId.substring(0, 8)}...
            </span>
            <span class="badge" style="${statusStyle}">${escapeHtml(displayStatus)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h4 style="font-size: 1.15rem; font-weight: bold; color: var(--text); margin-bottom: 0.25rem;">${escapeHtml(patientName)}</h4>
              <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--primary); font-size: 0.95rem; font-weight: 600; direction: ltr; justify-content: flex-end;">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                ${escapeHtml(formatPhoneNumber(patientPhone))}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-top: 1px dashed var(--border); padding-top: 0.75rem; margin-top: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.9rem;">
              <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-secondary);">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span dir="ltr">${escapeHtml(apptDate)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-secondary);">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span dir="ltr">${escapeHtml(apptTime)}</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${actionsHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('');
}
// 2. دالة تسجيل الدخول اليدوي المحدثة

// ✅ تسجيل دخول الطبيب (يتصل بـ Edge Function)
async function handleDashboardLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (isAccountLocked()) return;

  const btn = document.getElementById('dashboardLoginBtn');
  setLoading(btn, true);

  const doctorId = document.getElementById('loginDoctorId').value.trim();
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginDoctorPassword').value.trim();

  try {
    // ✅ الاتصال بـ Edge Function للتحقق من بيانات الطبيب
    const { data, error } = await supabaseClient.functions.invoke('doctor-auth', {
      body: { 
        action: 'login', 
        doctorId: doctorId, 
        phone: phone, 
        password: password 
      }
    });

    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.error || 'بيانات الدخول غير صحيحة');

    resetLoginAttempts();

    // حفظ الجلسة
    localStorage.setItem('doctorSession', JSON.stringify({
      doctorId: doctorId,
      phone: phone,
      sessionToken: data.sessionToken
    }));

    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');

    // استدعاء دالة الرسم
    renderDashboardUI(data, doctorId);

  } catch (err) {
    recordFailedAttempt();
    showToast(t('toastLoginError') + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}
    function logoutDashboard() {



      localStorage.removeItem('doctorSession'); // مسح المفكرة



      document.getElementById('loginSection').classList.remove('hidden');



      document.getElementById('dashboardSection').classList.add('hidden');
      document.getElementById('loginDoctorId').value = '';
      document.getElementById('loginPhone').value = '';
      document.getElementById('loginDoctorPassword').value = ''; 
    }
 // ✅ تغيير حالة الحجز (محدّثة لـ Supabase)
window.changeBookingStatus = async function(bookingId, newStatus, patientEmail, doctorName, apptDate) {
  if (!confirm('تأكيد تغيير حالة الحجز إلى: ' + (newStatus === 'confirmed' ? 'مؤكد' : 'ملغى') + '؟')) return;

  const sessionStr = localStorage.getItem('doctorSession');
  if (!sessionStr) { showToast('يرجى تسجيل الدخول مجدداً', 'error'); return; }
  const session = JSON.parse(sessionStr);

  try {
    // ✅ تحديث الحالة مباشرة في Supabase
    const { error } = await supabaseClient
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', bookingId)
      .eq('doctor_id', session.doctorId);

    if (error) throw error;

    showToast('تم التحديث بنجاح', 'success');

    // إرسال الإيميل التلقائي
    if (patientEmail && patientEmail !== 'undefined' && patientEmail !== '') {
      window.sendBookingEmail(patientEmail, doctorName, apptDate, newStatus);
    }

    // إعادة تحميل البيانات
    refreshDoctorDashboard(session.doctorId, session.phone, session.sessionToken);

  } catch (err) {
    showToast('خطأ: ' + err.message, 'error');
  }
};

// ✅ دالة مساعدة لإعادة تحميل لوحة التحكم
async function refreshDoctorDashboard(doctorId, phone, sessionToken) {
  try {
    const { data, error } = await supabaseClient.functions.invoke('doctor-auth', {
      body: { 
        action: 'getAppointments', 
        doctorId: doctorId, 
        phone: phone, 
        sessionToken: sessionToken 
      }
    });

    if (error) throw error;
    if (data.success) {
      renderDashboardUI(data, doctorId);
    }
  } catch (err) {
    console.error('خطأ في تحديث لوحة التحكم:', err);
  }
}

window.toggleWorkingHours = function() {
      const content = document.getElementById('workingHoursContent');
      const header = document.getElementById('workingHoursToggle');

      content.classList.toggle('open');
      header.classList.toggle('open');
    };

    window.toggleAppointments = function() {
      const content = document.getElementById('appointmentsContent');
      const header = document.getElementById('appointmentsToggle');
      content.classList.toggle('open');
      header.classList.toggle('open');
};



// ✅ حفظ أوقات العمل (محدّثة لـ Supabase)
window.saveWorkingHours = async function() {
  const sessionStr = localStorage.getItem('doctorSession');
  if (!sessionStr) return;
  const session = JSON.parse(sessionStr);

  const btn = document.getElementById('saveHoursBtn');
  setLoading(btn, true, 'حفظ الأوقات');

  const workingDaysData = {};
  for (let i = 0; i <= 6; i++) {
    const active = document.getElementById(`day_active_${i}`).checked;
    const start = document.getElementById(`day_start_${i}`).value;
    const end = document.getElementById(`day_end_${i}`).value;
    workingDaysData[i.toString()] = { active, start, end };
  }

  try {
    // ✅ تحديث أوقات العمل مباشرة في Supabase
    const { error } = await supabaseClient
      .from('doctors')
      .update({ working_days: workingDaysData })
      .eq('id', session.doctorId)
      .eq('phone', session.phone);

    if (error) throw error;

    showToast('تم حفظ أوقات وأيام العمل بنجاح', 'success');

    // تحديث المصفوفة المحلية
    const docIndex = allDoctors.findIndex(d => d.id === session.doctorId);
    if(docIndex > -1) {
      allDoctors[docIndex].working_days = workingDaysData;
    }

  } catch(err) {
    showToast('خطأ: ' + err.message, 'error');
  } finally {
    setLoading(btn, false, 'حفظ الأوقات');
  }
};

    // ========================================================================

    // ROUTER & LANGUAGE
    // ========================================================================
     // ========================================================================

    // TOGGLE BOOKING STATUS
    // ========================================================================



    function updateToggleText(isEnabled) {



      const textEl = document.getElementById('bookingStatusText');



      if (textEl) {



        textEl.textContent = isEnabled ? t('disableBooking') : t('enableBooking');



      }



    }



   // ✅ تفعيل/إيقاف الحجوزات (محدّثة لـ Supabase)
async function handleToggleBooking(e) {
  const isChecked = e.target.checked;
  const sessionStr = localStorage.getItem('doctorSession');
  if (!sessionStr) { showToast('يرجى تسجيل الدخول', 'error'); return; }
  const session = JSON.parse(sessionStr);

  const toggleSwitch = document.getElementById('bookingToggleSwitch');
  toggleSwitch.disabled = true;

  try {
    // ✅ تحديث حالة الحجوزات مباشرة في Supabase
    const { error } = await supabaseClient
      .from('doctors')
      .update({ booking_enabled: isChecked })
      .eq('id', session.doctorId)
      .eq('phone', session.phone);

    if (error) throw error;

    showToast(t('toastToggleSuccess'), 'success');
    updateToggleText(isChecked);

    // تحديث المصفوفة المحلية
    const docIndex = allDoctors.findIndex(d => d.id === session.doctorId);
    if (docIndex > -1) {
      allDoctors[docIndex].booking_enabled = isChecked;
    }

  } catch (err) {
    e.target.checked = !isChecked;
    showToast(t('toastToggleError') + ': ' + err.message, 'error');
  } finally {
    toggleSwitch.disabled = false;
  }
}
// ========================================================================
    // جلب حجوزات العضو
    // ========================================================================
   // ✅ جلب حجوزات العضو من Supabase
// ✅ جلب حجوزات العضو من Supabase
async function loadUserBookings() {
  const container = document.getElementById('userBookingsContainer');
  container.innerHTML = `<div class="text-center p-4"><div class="spinner" style="border-top-color: var(--primary); margin: 0 auto; width: 24px; height: 24px;"></div><p class="mt-2 text-gray text-sm">${t('fetchingBookings')}</p></div>`;

  try {
    const user = await getCurrentUser();
    if (!user) return;

    // ✅ جلب الحجوزات مع اسم الطبيب (Join)
    const { data: bookings, error } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        patient_name,
        appointment_date,
        appointment_time,
        status,
        doctors (first_name, last_name)
      `)
      .eq('user_id', user.UserID)
      .order('appointment_date', { ascending: false });

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      container.innerHTML = `
        <div class='empty-state' style='padding: 2rem 1rem; background: var(--bg); border-radius: var(--radius); border: 1px dashed var(--border);'>
          <div class='empty-state-icon' style='color: var(--primary); opacity: 0.7; margin-bottom: 0.5rem;'>
            <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <p style='color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1rem;'>${t('noUserBookings')}</p>
          <button class='btn btn-primary' style='padding: 0.5rem 1rem; font-size: 0.875rem;' onclick="router('home')">${t('bookFirstAppt')}</button>
        </div>
      `;
      return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
    bookings.forEach(b => {
      let statusStyle = 'background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;';
      let statusIndicator = '#f59e0b';
      let displayStatus = t('statusPending');

      if (b.status === 'confirmed') {
        statusStyle = 'background: #ecfdf5; color: #10b981; border: 1px solid #a7f3d0;';
        statusIndicator = '#10b981';
        displayStatus = t('statusConfirmed');
      } else if (b.status === 'cancelled') {
        statusStyle = 'background: #fef2f2; color: #ef4444; border: 1px solid #fecaca;';
        statusIndicator = '#ef4444';
        displayStatus = t('statusCancelled');
      }

      // ✅ استخراج اسم الطبيب من العلاقة
      const doctorName = b.doctors ? `${b.doctors.first_name} ${b.doctors.last_name}` : 'طبيب';
      // ✅ عرض أول 8 أحرف من UUID بشكل احترافي
      const shortId = b.id.substring(0, 8).toUpperCase();

      html += `
        <div class="card-hover" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; position: relative; overflow: hidden; box-shadow: var(--shadow-sm);">
          <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 4px; background: ${statusIndicator};"></div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-right: 0.5rem;">
            <div style="flex: 1; min-width: 250px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <span style="font-family: 'Courier New', monospace; font-size: 0.85rem; color: var(--primary); background: var(--bg); padding: 0.35rem 0.75rem; border-radius: 6px; border: 1px solid var(--border); letter-spacing: 1px; font-weight: bold;">${shortId}</span>
                <span class="badge" style="${statusStyle}">${displayStatus}</span>
              </div>
              <h4 style="font-size: 1.15rem; font-weight: bold; color: var(--text); margin-bottom: 0.25rem;">${currentLang === 'ar' ? 'د.' : 'Dr.'} ${doctorName}</h4>
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">${t('patientLabel')}<span style="color: var(--text); font-weight: 500;">${b.patient_name}</span></p>
              <div style="display: flex; align-items: center; gap: 1.5rem; font-size: 0.9rem; border-top: 1px dashed var(--border); padding-top: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-secondary);">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span dir="ltr" style="font-weight: 600;">${b.appointment_date}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-secondary);">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span dir="ltr" style="font-weight: 600;">${b.appointment_time}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    html += `
      <div style="margin-top: 1.5rem; text-align: center;">
        <button class='btn btn-primary' style='padding: 0.6rem 1.5rem; font-size: 0.95rem; border-radius: 50px;' onclick="router('home')">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-inline-end: 0.4rem; vertical-align: middle;"><path d="M12 5v14M5 12h14"></path></svg>
          ${t('bookNewAppointment')}
        </button>
      </div>
    `;

    container.innerHTML = html;

  } catch(err) {
    console.error('Error loading bookings:', err);
    container.innerHTML = `<div class="text-center p-4 text-danger">خطأ في الاتصال: تعذر جلب المواعيد.</div>`;
  }
}
    // ========================================================================
    // دالة التوجيه (Router)
    // ========================================================================
 function router(viewName, pushHistory = true) {
      if (viewName === 'add-doctor') {
        getCurrentUser().then(user => { if (!user) { showToast(t('loginRequired'), 'error'); router('login'); } });
      }

      document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));

      const target = document.getElementById('view-' + viewName);
      if (target) target.classList.remove('hidden');

      document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

      const activeNav = document.querySelector(`.nav-btn[data-nav="${viewName}"]`);
      if (activeNav) activeNav.classList.add('active');

      if (pushHistory) history.pushState({ view: viewName }, '', '#' + viewName);

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // معالجة الواجهات وجلب البيانات
      if (viewName === 'home') loadDoctors();
      if (viewName === 'user-dashboard') loadUserBookings();

      // إخفاء اسم العضو من الشريط العلوي إذا كنا داخل لوحة الطبيب لمنع التضارب البصري
      const pill = document.getElementById('userPill');
      if (viewName === 'dashboard') {
          if(pill) pill.classList.add('hidden');
      } else {
          updateUserUI(); // إعادة إظهار الاسم في باقي الصفحات إذا كان مسجل الدخول
      }
    }
  function setLang(lang) {
      currentLang = lang;
      localStorage.setItem('appLanguage', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.getElementById('btn-en').classList.toggle('active', lang === 'en');
      document.getElementById('btn-ar').classList.toggle('active', lang === 'ar');

      document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (i18n[lang][key]) el.innerHTML = i18n[lang][key]; });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const key = el.getAttribute('data-i18n-placeholder'); if (i18n[lang][key]) el.placeholder = i18n[lang][key]; });

      const navMap = { 'home': 'navHome', 'track': 'navTrack', 'add-doctor': 'navAdd', 'dashboard': 'navDashboard', 'login': 'navLogin' };
      document.querySelectorAll('[data-nav]').forEach(btn => { const view = btn.getAttribute('data-nav'); if (navMap[view] && i18n[lang][navMap[view]]) btn.textContent = i18n[lang][navMap[view]]; });

      const specSel = document.getElementById('specialtyFilter');
      if (specSel && specSel.options[0]) specSel.options[0].text = t('allSpecialties');
      const munSel = document.getElementById('municipalityFilter');
      if (munSel && munSel.options[0]) munSel.options[0].text = t('allMunicipalities');

      const addSpecSel = document.querySelector('select[name="Specialty"]');
      if (addSpecSel && addSpecSel.options[0]) addSpecSel.options[0].text = t('selectSpec');
      const addMunSel = document.querySelector('select[name="Municipality"]');
      if (addMunSel && addMunSel.options[0]) addMunSel.options[0].text = t('selectMun');

      updateAuthToggle();
      updateUserUI();

      if (allDoctors.length > 0) {
        populateFilters();
        renderDoctors(allDoctors);
      }

      if (typeof globalDashboardData !== 'undefined' && globalDashboardData !== null && typeof globalDashboardDoctorId !== 'undefined' && globalDashboardDoctorId !== null) {
        renderDashboardUI(globalDashboardData, globalDashboardDoctorId);
      }

      // تحديث قوائم مكتبة Tom Select بأمان لتجنب أي تعطل
      setTimeout(() => {
          if (window.tsAddSpecialty && addSpecSel) {
              const val = window.tsAddSpecialty.getValue();
              window.tsAddSpecialty.clearOptions();
              Array.from(addSpecSel.options).forEach(opt => window.tsAddSpecialty.addOption({value: opt.value, text: opt.text}));
              if(val) window.tsAddSpecialty.setValue(val);
          }
          if (window.tsAddMunicipality && addMunSel) {
              const val = window.tsAddMunicipality.getValue();
              window.tsAddMunicipality.clearOptions();
              Array.from(addMunSel.options).forEach(opt => window.tsAddMunicipality.addOption({value: opt.value, text: opt.text}));
              if(val) window.tsAddMunicipality.setValue(val);
          }
      }, 50);
    }
    function updateAuthToggle() { document.getElementById('authToggleText').textContent = t(isSignUp ? 'hasAccount' : 'noAccount'); }
// ========================================================================
    // REVIEWS SYSTEM
    // ========================================================================
    let currentReviewRating = 0;

    // 1. تفعيل تأثير التمرير والضغط على النجوم
    document.querySelectorAll('#starRatingInput .star').forEach(star => {
        star.addEventListener('mouseover', function() {
            let val = parseInt(this.getAttribute('data-val'));
            document.querySelectorAll('#starRatingInput .star').forEach(s => {
                s.style.color = parseInt(s.getAttribute('data-val')) <= val ? '#f59e0b' : 'var(--border)';
            });
        });
        star.addEventListener('mouseout', function() {
            document.querySelectorAll('#starRatingInput .star').forEach(s => {
                s.style.color = parseInt(s.getAttribute('data-val')) <= currentReviewRating ? '#f59e0b' : 'var(--border)';
            });
        });
        star.addEventListener('click', function() {
            currentReviewRating = parseInt(this.getAttribute('data-val'));
            document.getElementById('ratingValue').value = currentReviewRating;
        });
    });

    // 2. دالة فتح نافذة التقييمات
    window.openReviewsModal = async function(doctorId, doctorName) {
        document.getElementById('reviewsDoctorName').textContent = (currentLang === 'ar' ? 'تقييمات د. ' : 'Reviews for Dr. ') + doctorName;
        document.getElementById('reviewDoctorId').value = doctorId;
        document.getElementById('reviewsModal').classList.remove('hidden');

        // التحقق من تسجيل الدخول للسماح بالتقييم
        const user = await getCurrentUser();
        if (user) {
            document.getElementById('addReviewSection').classList.remove('hidden');
            document.getElementById('loginToReviewMsg').classList.add('hidden');
        } else {
            document.getElementById('addReviewSection').classList.add('hidden');
            document.getElementById('loginToReviewMsg').classList.remove('hidden');
        }

        loadReviews(doctorId);
    }

   // 3. دالة جلب التقييمات من قاعدة البيانات
    // ✅ جلب التقييمات من Supabase مباشرة
async function loadReviews(doctorId) {
  const list = document.getElementById('reviewsList');
  list.innerHTML = `<div class='p-4 text-center text-gray text-sm'>${currentLang === 'ar' ? 'جاري تحميل التقييمات...' : 'Loading reviews...'}</div>`;

  try {
    // جلب المستخدم الحالي
    const currentUser = await getCurrentUser();

    // ✅ جلب التقييمات من Supabase
    const { data: reviews, error } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('✅ التقييمات:', reviews);

    if (!reviews || reviews.length === 0) {
      list.innerHTML = `<div class='p-4 text-center text-gray text-sm'>${currentLang === 'ar' ? 'لا توجد تقييمات بعد. كن أول من يقيّم!' : 'No reviews yet. Be the first to review!'}</div>`;
      return;
    }

    list.innerHTML = reviews.map(r => `
      <div class="review-item" id="review-${r.id}">
        <div class="review-header">
          <div>
            <span class="review-author">${escapeHtml(r.patient_name || 'مستخدم')}</span>
            <span class="review-date" dir="ltr" style="margin: 0 0.5rem;">
              ${new Date(r.created_at).toLocaleDateString(currentLang === 'ar' ? 'ar-DZ' : 'en-US')}
            </span>
          </div>
          ${currentUser && r.user_id === currentUser.UserID ? `
            <button onclick="deleteReview('${r.id}', '${doctorId}')" 
              style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:0.85rem; display:flex; align-items:center; gap:0.2rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
              ${currentLang === 'ar' ? 'حذف' : 'Delete'}
            </button>
          ` : ''}
        </div>
        <div class="star-display">
          ${'★'.repeat(r.rating)}<span style="color:var(--border)">${'★'.repeat(5 - r.rating)}</span>
        </div>
        <div class="review-text">${escapeHtml(r.comment)}</div>
      </div>
    `).join('');

  } catch (err) {
    console.error('❌ خطأ في جلب التقييمات:', err);
    list.innerHTML = `<div class='p-4 text-center text-danger text-sm'>${currentLang === 'ar' ? 'خطأ في جلب التقييمات' : 'Error loading reviews'}</div>`;
  }
}

    // ✅ حذف التقييم من Supabase
window.deleteReview = async function(reviewId, doctorId) {
  if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد أنك تريد حذف تقييمك بشكل نهائي؟' : 'Are you sure you want to delete your review?')) 
    return;

  try {
    const reviewDiv = document.getElementById('review-' + reviewId);
    if(reviewDiv) reviewDiv.style.opacity = '0.5';

    // ✅ تحديث حالة التقييم إلى deleted
    const { error } = await supabaseClient
      .from('reviews')
      .update({ status: 'deleted' })
      .eq('id', reviewId);

    if (error) throw error;

    showToast(currentLang === 'ar' ? 'تم حذف التقييم بنجاح' : 'Review deleted successfully', 'success');
    loadReviews(doctorId);

  } catch (err) {
    console.error('❌ خطأ في حذف التقييم:', err);
    showToast(currentLang === 'ar' ? 'خطأ: ' + err.message : 'Error: ' + err.message, 'error');
    const reviewDiv = document.getElementById('review-' + reviewId);
    if(reviewDiv) reviewDiv.style.opacity = '1';
  }
};
// ✅ إرسال تقييم جديد إلى Supabase
document.addEventListener('submit', async function(e) {
  if (e.target && e.target.id === 'reviewForm') {
    e.preventDefault();

    const btn = document.getElementById('submitReviewBtn');
    const doctorId = document.getElementById('reviewDoctorId').value;
    const rating = document.getElementById('ratingValue').value;
    const comment = document.getElementById('reviewComment').value;

    if (!rating || rating === "0") {
      showToast(currentLang === 'ar' ? 'الرجاء اختيار التقييم بالنجوم' : 'Please select a star rating', 'error');
      return;
    }
    if (!comment.trim()) {
      showToast(currentLang === 'ar' ? 'الرجاء كتابة تجربتك' : 'Please write your review', 'error');
      return;
    }

    setLoading(btn, true);

    try {
      // ✅ الحصول على المستخدم الحالي من Supabase
      const user = await getCurrentUser();

      if (!user) {
        showToast(currentLang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first', 'error');
        setLoading(btn, false);
        return;
      }

      // ✅ إضافة التقييم في Supabase
      const { data, error } = await supabaseClient
        .from('reviews')
        .insert([{
          doctor_id: doctorId,
          user_id: user.UserID,
          patient_name: user.Name || user.Email.split('@')[0],
          rating: parseInt(rating),
          comment: comment.trim(),
          status: 'approved'
        }])
        .select()
        .single();

      if (error) {
        // إذا كان الخطأ بسبب التقييم المكرر
        if (error.code === '23505') {
          showToast(currentLang === 'ar' ? 'لقد قمت بتقييم هذا الطبيب مسبقاً!' : 'You have already reviewed this doctor!', 'error');
        } else {
          throw error;
        }
      } else {
        showToast(currentLang === 'ar' ? 'تم إضافة تقييمك بنجاح' : 'Review added successfully', 'success');
        e.target.reset();
        currentReviewRating = 0;
        document.getElementById('ratingValue').value = '';
        document.querySelectorAll('#starRatingInput .star').forEach(s => s.style.color = 'var(--border)');
        loadReviews(doctorId);
      }

    } catch (err) {
      console.error('❌ خطأ في إضافة التقييم:', err);
      showToast(currentLang === 'ar' ? 'خطأ: ' + err.message : 'Error: ' + err.message, 'error');
    } finally {
      setLoading(btn, false, currentLang === 'ar' ? 'نشر التقييم' : 'Submit Review');
    }
  }
});
    // ========================================================================

    // INITIALIZATION
    // ========================================================================

   document.addEventListener('DOMContentLoaded', () => {

      const dateInput = document.getElementById('apptDateInput');

      if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

      const hash = window.location.hash.replace('#', '');

      const startView = ['home', 'add-doctor', 'booking', 'dashboard', 'login', 'track', 'user-dashboard'].includes(hash) ? hash : 'home';

      // قراءة اللغة المحفوظة، وإذا لم تكن موجودة نجعل العربية هي الافتراضية
      const savedLang = localStorage.getItem('appLanguage') || 'ar';
      setLang(savedLang);



      updateAuthToggle();



      document.getElementById('logoHomeBtn').onclick = () => router('home');



      document.getElementById('btn-en').onclick = () => setLang('en');



      document.getElementById('btn-ar').onclick = () => setLang('ar');



      document.getElementById('googleSignInBtn').onclick = handleGoogleSignIn;



      document.getElementById('authSubmitBtn').onclick = handleEmailAuth;



      document.getElementById('authToggleText').onclick = toggleAuthMode;



      document.getElementById('backToHomeBtn').onclick = () => router('home');



      document.getElementById('backToDirBtn').onclick = () => router('home');

// === تفعيل البحث في القوائم المنسدلة (Tom Select) ===
      const tsSettings = {
        create: false,
        sortField: { field: "text", direction: "asc" },
        render: {
          no_results: function(data, escape) {
            return '<div class="no-results">' + (currentLang === 'ar' ? 'لا توجد نتائج' : 'No results found') + '</div>';
          }
        }
      };

      // تطبيق المكتبة على فلاتر البحث في الصفحة الرئيسية
      window.tsSpecialtyFilter = new TomSelect("#specialtyFilter", tsSettings);
      window.tsMunicipalityFilter = new TomSelect("#municipalityFilter", tsSettings);

      // تطبيق المكتبة على نموذج إضافة طبيب
      window.tsAddSpecialty = new TomSelect('select[name="Specialty"]', tsSettings);
      window.tsAddMunicipality = new TomSelect('select[name="Municipality"]', tsSettings);


     // === تتبع الحجز ===
      const trackForm = document.getElementById('trackBookingForm');
      if (trackForm) {
        trackForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = document.getElementById('trackBtn');
          const bookingId = document.getElementById('trackBookingId').value.trim();
          const phoneStr = document.getElementById('trackPhone').value.trim(); // التقاط رقم الهاتف
          const resultDiv = document.getElementById('trackResult');

          setLoading(btn, true);
          resultDiv.classList.add('hidden');

          try {
            // إرسال الهاتف مع رقم الحجز للتحقق الأمني
            const result = await apiPost('getBookingStatus', { bookingId: bookingId, phone: phoneStr });

            if (result.success) {

              const data = result.data;



              // 1. تحديد الألوان

              let statusStyle = 'background: #f1f5f9; color: #64748b;';

              if (data.status === 'مؤكد') statusStyle = 'background: #ecfdf5; color: #10b981;';

              if (data.status === 'ملغى') statusStyle = 'background: #fef2f2; color: #ef4444;';



              // 2. ترجمة كلمة الحالة (Status)

              let displayStatus = data.status;

              if (currentLang === 'en') {

                 if (data.status === 'مؤكد') displayStatus = 'Confirmed';

                 else if (data.status === 'ملغى') displayStatus = 'Cancelled';

                 else displayStatus = 'Pending';

              }



              // 3. نصوص الواجهة المترجمة ديناميكياً

              const detailsTxt = currentLang === 'ar' ? 'تفاصيل الحجز:' : 'Booking Details:';

              const idTxt = currentLang === 'ar' ? 'رقم الحجز:' : 'Booking ID:';

              const nameTxt = currentLang === 'ar' ? 'الاسم:' : 'Patient Name:';

              const dateTimeTxt = currentLang === 'ar' ? 'التاريخ والوقت:' : 'Date & Time:';

              const currentStatusTxt = currentLang === 'ar' ? 'الحالة الحالية:' : 'Current Status:';



              // 4. بناء النتيجة

              resultDiv.innerHTML = `

                <h4 class="font-bold mb-2">${detailsTxt}</h4>

                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>${idTxt}</span> <strong>${escapeHtml(data.bookingId)}</strong></div>

                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>${nameTxt}</span> <strong>${escapeHtml(data.patientName)}</strong></div>

                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>${dateTimeTxt}</span> <strong dir="ltr">${escapeHtml(data.date)} ${escapeHtml(data.time)}</strong></div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; border-top:1px solid var(--border); padding-top:1rem;">

                  <span>${currentStatusTxt}</span> 

                  <span class="badge" style="${statusStyle}">${escapeHtml(displayStatus)}</span>

                </div>

              `;

              resultDiv.classList.remove('hidden');

            } else {

              showToast(currentLang === 'ar' ? result.error : 'Booking not found', 'error');

            }

          } catch (err) {

            showToast(currentLang === 'ar' ? 'خطأ في الاتصال' : 'Connection Error', 'error');

          } finally {

            setLoading(btn, false, currentLang === 'ar' ? 'بحث عن الحجز' : 'Search Booking');

          }

        });

      }



      // ===================================================







      // === إجبار حقول الهاتف على قبول 10 أرقام فقط (بدون مسافات أو حروف) ===



      document.querySelectorAll('input[type="tel"]').forEach(input => {



        input.addEventListener('input', function() {



          // مسح أي حرف أو مسافة أو رمز فوراً



          this.value = this.value.replace(/\D/g, '');



          // تحديد الحد الأقصى بـ 10 أرقام فقط



          if (this.value.length > 10) {



            this.value = this.value.slice(0, 10);



          }



        });



      });



      // ====================================================================







      // === تفعيل زر قائمة الهواتف (Hamburger) ===



      const hamburgerBtn = document.getElementById('hamburgerBtn');



      const navLinks = document.getElementById('navLinks');



      if (hamburgerBtn && navLinks) {



        hamburgerBtn.addEventListener('click', () => {



          navLinks.classList.toggle('show');



        });



      }







      // إغلاق القائمة تلقائياً عند الضغط على أي زر داخلها



      document.querySelectorAll('.nav-btn').forEach(btn => {



        btn.addEventListener('click', () => {



          if (window.innerWidth <= 768) {



            navLinks.classList.remove('show');



          }



        });



      });







      document.getElementById('addDoctorForm').onsubmit = handleAddDoctor;



      document.getElementById('bookingBtn').onclick = confirmBooking;



      document.getElementById('confirmDialogOkBtn').onclick = submitBooking;



      document.getElementById('cancelDialogBtn').onclick = closeConfirmDialog;



      document.getElementById('dashboardLoginForm').onsubmit = handleDashboardLogin;



      document.getElementById('dashboardLogoutBtn').onclick = logoutDashboard;



      document.getElementById('bookingToggleSwitch').onchange = handleToggleBooking;



      document.getElementById('logoutBtn').onclick = logoutUser;



      document.getElementById('searchInput').oninput = filterDoctors;



      document.getElementById('specialtyFilter').onchange = filterDoctors;



      document.getElementById('municipalityFilter').onchange = filterDoctors;



      document.querySelectorAll('.nav-btn[data-nav]').forEach(btn => { btn.onclick = () => router(btn.getAttribute('data-nav')); });







      window.onscroll = () => { const btn = document.getElementById('backToTop'); if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) btn.classList.remove('hidden'); else btn.classList.add('hidden'); };



      document.getElementById('backToTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });



      window.onpopstate = (e) => { const view = (e.state && e.state.view) ? e.state.view : 'home'; router(view, false); };







    // === كود تسجيل الدخول التلقائي الآمن للطبيب ===

    const savedSession = localStorage.getItem('doctorSession');

    if (savedSession) {

      try {

        const session = JSON.parse(savedSession);



        if(document.getElementById('loginDoctorId')) document.getElementById('loginDoctorId').value = session.doctorId || '';

        if(document.getElementById('loginPhone')) document.getElementById('loginPhone').value = session.phone || '';

        if(document.getElementById('loginDoctorPassword')) document.getElementById('loginDoctorPassword').value = ''; 



        const btn = document.getElementById('dashboardLoginBtn');

        if (btn) setLoading(btn, true);



        apiPost('doctorLogin', { 

            doctorId: session.doctorId, 

            phone: session.phone, 

            sessionToken: session.sessionToken 

        }).then(result => {

            if (result && result.success) {

                localStorage.setItem('doctorSession', JSON.stringify({ 

                    doctorId: session.doctorId, 

                    phone: session.phone, 

                    sessionToken: result.data.sessionToken 

                }));



                document.getElementById('loginSection').classList.add('hidden');

                document.getElementById('dashboardSection').classList.remove('hidden');



                // === التعديل هنا: استدعاء دالة الرسم بدلاً من التعليق الناقص ===

                renderDashboardUI(result.data, session.doctorId);



            } else {

                localStorage.removeItem('doctorSession');

            }

            if (btn) setLoading(btn, false);

        }).catch(() => {

            if (btn) setLoading(btn, false);

        });



     } catch(e) {
        localStorage.removeItem('doctorSession');
      }
    }
    // =======================================
    });

    // ========================================================================
    // نظام إرسال الإشعارات عبر البريد (Google Apps Script)
    // ========================================================================
   window.sendBookingEmail = function(recipientEmail, doctorName, appointmentDate, status) {
      var subject = "";
      var htmlBody = "";

      // ألوان وتصميم متناسق مع منصتك
      var primaryColor = "#0ea5e9";
      var containerStyle = "font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;";
      var headerStyle = "background-color: " + primaryColor + "; color: white; padding: 20px; text-align: center; font-size: 1.25rem; font-weight: bold;";
      var bodyStyle = "padding: 20px; color: #0f172a; line-height: 1.6;";
      var footerStyle = "background-color: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 0.85rem; border-top: 1px solid #e2e8f0;";

      if (status === "confirm" || status === "مؤكد") {
        subject = "تأكيد موعدك الطبي - دليل أطباء غليزان";
        htmlBody = `
          <div style="${containerStyle}">
            <div style="${headerStyle}">تأكيد الموعد الطبي</div>
            <div style="${bodyStyle}">
              <p>مرحباً بك،</p>
              <p>يسعدنا إعلامك بأنه تم <strong>تأكيد</strong> موعدك الطبي بنجاح عبر منصة "دليل أطباء غليزان".</p>
              <div style="background-color: #f8fafc; border-right: 4px solid ${primaryColor}; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>الطبيب المَعني:</strong> ${doctorName}</p>
                <p style="margin: 0;"><strong>تاريخ الموعد:</strong> <span dir="ltr">${appointmentDate}</span></p>
              </div>
              <p>يرجى الحضور إلى العيادة في الموعد المحدد. نتمنى لك دوام الصحة والعافية.</p>
            </div>
            <div style="${footerStyle}">© 2026 دليل أطباء ولاية غليزان. جميع الحقوق محفوظة.</div>
          </div>
        `;
      } else if (status === "cancel" || status === "ملغى") {
        subject = "إشعار بإلغاء موعدك الطبي - دليل أطباء غليزان";
        htmlBody = `
          <div style="${containerStyle}">
            <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; font-size: 1.25rem; font-weight: bold;">إلغاء الموعد الطبي</div>
            <div style="${bodyStyle}">
              <p>مرحباً بك،</p>
              <p>نعتذر بشدة لإعلامك بأنه قد تم <strong>إلغاء</strong> موعدك الطبي المجدول مع <strong>${doctorName}</strong> في تاريخ <span dir="ltr">${appointmentDate}</span>.</p>
              <p>قد يعود سبب الإلغاء لظرف طارئ خارج عن إرادة الطبيب. ندعوك لزيارة المنصة مجدداً لحجز موعد في وقت آخر يناسبك.</p>
            </div>
            <div style="${footerStyle}">© 2026 دليل أطباء ولاية غليزان. جميع الحقوق محفوظة.</div>
          </div>
        `;
      }

      apiPost('sendEmail', {
        recipient: recipientEmail,
        subject: subject,
        htmlBody: htmlBody
      })
      .then(response => console.log("تم الإرسال: ", response))
      .catch(error => console.error("خطأ في الإرسال: ", error));
    };
// ========================================================================
// CHATBOT SYSTEM LOGIC (Multilingual & Fixed RTL Phone Display)
// ========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggleBtn = document.getElementById('chatbotToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const medicalChatbot = document.getElementById('medicalChatbot');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInputText = document.getElementById('chatInputText');
    const chatMessages = document.getElementById('chatMessages');

    const toggleChat = () => {
        medicalChatbot.classList.toggle('hidden');
        if (!medicalChatbot.classList.contains('hidden')) {
            chatInputText.focus();
        }
    };
    chatbotToggleBtn.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', toggleChat);

    // توحيد النصوص للغتين
    const normalizeText = (text) => {
        if (!text) return "";
        return text.trim().toLowerCase()
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/[ًٌٍَُِّْ]/g, '') 
            .replace(/[^a-z0-9ا-ي\s]/g, ''); 
    };

    const processUserMessage = (rawMsg) => {
        const cleanMsg = normalizeText(rawMsg);

        if (!allDoctors || allDoctors.length === 0) {
            return t('chatLoadingDB');
        }

        // قواميس البحث بناءً على اللغة الحالية
        const isAskingForPhone = currentLang === 'ar' ? 
            /رقم|هاتف|تلفون|موبيل|اتصال/i.test(cleanMsg) : 
            /phone|number|contact|call/i.test(cleanMsg);

        const isAskingForLocation = currentLang === 'ar' ? 
            /عنوان|اين|مكان|موقع|وين/i.test(cleanMsg) : 
            /address|location|where|place/i.test(cleanMsg);

        let matchedDoctors = [];
        const availableSpecialties = [...new Set(allDoctors.map(d => d.Specialty).filter(Boolean))];
        const availableMunicipalities = [...new Set(allDoctors.map(d => d.Municipality).filter(Boolean))];

        let detectedSpecialty = null;
        let detectedMunicipality = null;

        availableSpecialties.forEach(spec => {
            if (cleanMsg.includes(normalizeText(t(spec)))) detectedSpecialty = spec;
        });

        availableMunicipalities.forEach(mun => {
            if (cleanMsg.includes(normalizeText(t(mun)))) detectedMunicipality = mun;
        });

        matchedDoctors = allDoctors.filter(doc => {
            const docNameAr = normalizeText(doc.FirstName + " " + doc.LastName);
            const docNameEn = normalizeText(doc.FirstName + " " + doc.LastName); // في حال وجود أسماء بالإنجليزية

            const isNameMatch = cleanMsg.split(' ').some(word => 
                word.length > 2 && (docNameAr.includes(word) || docNameEn.includes(word))
            );
            const isSpecMatch = detectedSpecialty ? doc.Specialty === detectedSpecialty : true;
            const isMunMatch = detectedMunicipality ? doc.Municipality === detectedMunicipality : true;

            if (isNameMatch && !detectedSpecialty && !detectedMunicipality) return true;
            if ((detectedSpecialty || detectedMunicipality) && isSpecMatch && isMunMatch) return true;

            return false;
        });

        if (matchedDoctors.length === 0) {
            return t('chatNoResults');
        }

        if (matchedDoctors.length > 3) {
            return `${t('chatFoundPrefix')} ${matchedDoctors.length} ${t('chatFoundSuffix')}` + 
                   generateCardsHtml(matchedDoctors.slice(0, 3), isAskingForPhone, isAskingForLocation);
        }

        return t('chatExactResults') + generateCardsHtml(matchedDoctors, isAskingForPhone, isAskingForLocation);
    };

    const generateCardsHtml = (doctorsList, focusPhone, focusLocation) => {
        return doctorsList.map(doc => {
            const docPrefix = currentLang === 'ar' ? 'د.' : 'Dr.';
            let infoHtml = `<div class="bot-card-result">`;

            infoHtml += `<div><strong>${t('chatDoctorLabel')}</strong> ${docPrefix} ${escapeHtml(doc.FirstName)} ${escapeHtml(doc.LastName)}</div>`;
            infoHtml += `<div><strong>${t('chatSpecLabel')}</strong> ${escapeHtml(t(doc.Specialty))}</div>`;

            if (focusPhone || (!focusPhone && !focusLocation)) {
                // إضافة dir="ltr" مع inline-block لإجبار الرقم على عرض صحيح من اليسار لليمين دون تشويه التخطيط
                infoHtml += `<div><strong>${t('chatPhoneLabel')}</strong> <span dir="ltr" style="display: inline-block; direction: ltr;">${escapeHtml(formatPhoneNumber(doc.Phone))}</span></div>`;
            }
            if (focusLocation || (!focusPhone && !focusLocation)) {
                infoHtml += `<div><strong>${t('chatMunLabel')}</strong> ${escapeHtml(t(doc.Municipality))}</div>`;
                infoHtml += `<div><strong>${t('chatAddressLabel')}</strong> ${escapeHtml(doc.ExactLocation)}</div>`;
            }

            infoHtml += `<button onclick="document.getElementById('medicalChatbot').classList.add('hidden'); openDoctorProfileModal(allDoctors.find(d => d.DoctorID === '${doc.DoctorID}'), '${docPrefix} ${escapeHtml(doc.FirstName)} ${escapeHtml(doc.LastName)}')" style="margin-top: 8px; background: var(--primary-light); color: var(--primary-dark); border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: bold; width: 100%; transition: opacity 0.2s;">${t('chatBookDetailsBtn')}</button>`;

            infoHtml += `</div>`;
            return infoHtml;
        }).join('');
    };

    const appendMessage = (sender, htmlContent) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender === 'user' ? 'user-msg' : 'bot-msg'}`;
        msgDiv.innerHTML = htmlContent;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleSend = () => {
        const text = chatInputText.value.trim();
        if (!text) return;

        appendMessage('user', escapeHtml(text));
        chatInputText.value = '';

        const typingId = "typing-" + Date.now();
        const typingHtml = `<div id="${typingId}" class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
        appendMessage('bot', typingHtml);

        setTimeout(() => {
            const typingIndicator = document.getElementById(typingId);
            if (typingIndicator) typingIndicator.parentElement.remove();

            const botResponse = processUserMessage(text);
            appendMessage('bot', botResponse);
        }, 800);
    };

    sendChatBtn.addEventListener('click', handleSend);
    chatInputText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});
// 🧪 اختبار الاتصال - احذف هذا بعد التأكد
async function testSupabaseConnection() {
  try {
    console.log('🔍 جاري اختبار الاتصال بـ Supabase...');

    const { data, error } = await supabaseClient
      .from('doctors')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ خطأ في الاتصال:', error.message);
      showToast('فشل الاتصال بـ Supabase: ' + error.message, 'error');
    } else {
      console.log('✅ نجح الاتصال! البيانات:', data);
      showToast('✅ تم الاتصال بـ Supabase بنجاح!', 'success');
    }
  } catch (err) {
    console.error('❌ خطأ غير متوقع:', err);
    showToast('خطأ غير متوقع: ' + err.message, 'error');
  }
}

// تشغيل الاختبار عند تحميل الصفحة
window.addEventListener('load', testSupabaseConnection);
// ✅ دالة جديدة لمعالجة اختيار التاريخ
// ✅ دالة معالجة اختيار التاريخ (مع تحسينات)
async function handleDateSelection(selectedDateStr, workingDays) {
  console.log('🔍 handleDateSelection called with:', { selectedDateStr, workingDays });

  const container = document.getElementById('timeSlotsContainer');
  const timeInput = document.getElementById('apptTimeInput');

  if (!container) {
    console.error('❌ timeSlotsContainer not found');
    return;
  }

  // مسح المحتوى السابق
  container.innerHTML = '';
  if (timeInput) timeInput.value = '';

  if (!selectedDateStr) {
    container.innerHTML = `<div class="text-sm text-gray" style="grid-column: 1 / -1;" data-i18n="selectDateFirst">${t('selectDateFirst')}</div>`;
    return;
  }

  const selectedDate = new Date(selectedDateStr);
  if (isNaN(selectedDate.getTime())) {
    container.innerHTML = `<div class="text-sm text-gray" style="grid-column: 1 / -1;" data-i18n="invalidDate">${t('invalidDate')}</div>`;
    return;
  }

  const dayNum = selectedDate.getDay();
  console.log('📅 يوم الأسبوع:', dayNum);

  // التحقق من يوم العمل
  let isWorking = true;
  let shiftStart = '08:00';
  let shiftEnd = '16:00';

  if (workingDays && Object.keys(workingDays).length > 0) {
    console.log('📋 التحقق من workingDays:', workingDays[dayNum]);
    if (!workingDays[dayNum] || !workingDays[dayNum].active) {
      isWorking = false;
    } else {
      shiftStart = workingDays[dayNum].start;
      shiftEnd = workingDays[dayNum].end;
    }
  }

  console.log('⏰ وقت العمل:', shiftStart, 'إلى', shiftEnd);

  if (!isWorking) {
    showToast(t('doctorOff'), 'error');
    document.getElementById('apptDateInput').value = '';
    container.innerHTML = `<div class="text-sm text-danger" style="grid-column: 1 / -1; color: var(--danger);" data-i18n="doctorOff">${t('doctorOff')}</div>`;
    return;
  }

  // جلب الأوقات المحجوزة من Supabase
  try {
    console.log('🔌 جلب الأوقات المحجوزة من Supabase...');

    const { data: bookedSlots, error } = await supabaseClient
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', currentDoctor.id)
      .eq('appointment_date', selectedDateStr)
      .neq('status', 'cancelled');

    if (error) {
      console.error('❌ خطأ في جلب الأوقات:', error);
      throw error;
    }

    console.log('✅ الأوقات المحجوزة:', bookedSlots);

    const bookedTimes = bookedSlots.map(s => s.appointment_time);

    // توليد الأوقات المتاحة
    const slots = generateTimeSlots(shiftStart, shiftEnd, 30);
    console.log('🕐 جميع الأوقات المولدة:', slots);

    const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));
    console.log('✅ الأوقات المتاحة:', availableSlots);

    if (availableSlots.length === 0) {
      container.innerHTML = `<div class="text-sm text-gray" style="grid-column: 1 / -1;" data-i18n="noSlots">${t('noSlots')}</div>`;
      return;
    }

    // عرض الأوقات
    displayTimeSlots(container, availableSlots, timeInput);

  } catch (err) {
    console.error('❌ خطأ في جلب الأوقات المتاحة:', err);
    showToast(currentLang === 'ar' ? 'خطأ في جلب الأوقات: ' + err.message : 'Error fetching available times', 'error');
    container.innerHTML = `<div class="text-sm text-danger">خطأ: ${err.message}</div>`;
  }
}
// ✅ توليد الأوقات
function generateTimeSlots(startStr, endStr, intervalMins) {
  const slots = [];
  let [startH, startM] = startStr.split(':').map(Number);
  let [endH, endM] = endStr.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current < end) {
    let h = Math.floor(current / 60);
    let m = current % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    current += intervalMins;
  }
  return slots;
}

// ✅ عرض الأوقات
function displayTimeSlots(container, slots, timeInput) {
  const morningDiv = document.createElement('div');
  morningDiv.style.cssText = 'grid-column: 1 / -1; margin-bottom: 1rem; border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; background: var(--surface);';
  morningDiv.innerHTML = `
    <h4 style="font-size:0.95rem; color:var(--text); margin-bottom:0.75rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.25rem; display: inline-block;">
      ☀️ <span data-i18n="morningSession">${t('morningSession')}</span>
    </h4>
    <div class="slots-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap:0.5rem;"></div>
  `;

  const eveningDiv = document.createElement('div');
  eveningDiv.style.cssText = 'grid-column: 1 / -1; margin-bottom: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; background: var(--surface);';
  eveningDiv.innerHTML = `
    <h4 style="font-size:0.95rem; color:var(--text); margin-bottom:0.75rem; border-bottom: 2px solid var(--primary-light); padding-bottom: 0.25rem; display: inline-block;">
      🌙 <span data-i18n="eveningSession">${t('eveningSession')}</span>
    </h4>
    <div class="slots-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap:0.5rem;"></div>
  `;

  slots.forEach(slot => {
    const btn = document.createElement('div');
    btn.className = 'time-slot-btn';
    btn.textContent = slot;
    btn.onclick = () => {
      document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      timeInput.value = slot;
    };

    const hour = parseInt(slot.split(':')[0]);
    if (hour < 12) {
      morningDiv.querySelector('.slots-grid').appendChild(btn);
    } else {
      eveningDiv.querySelector('.slots-grid').appendChild(btn);
    }
  });

  if (morningDiv.querySelector('.slots-grid').hasChildNodes()) {
    container.appendChild(morningDiv);
  }
  if (eveningDiv.querySelector('.slots-grid').hasChildNodes()) {
    container.appendChild(eveningDiv);
  }
}
