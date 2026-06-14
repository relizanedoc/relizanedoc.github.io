// 2. تهيئة Supabase (جديد)
const SUPABASE_URL = 'https://iirjtmobphgmkgwkwumc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpcmp0bW9icGhnbWtnd2t3dW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDA2NjYsImV4cCI6MjA5NjUxNjY2Nn0.Yfa0oEwp_id9tHpSb3h0jf__B4drqXsM-TVs4VTTmp4';

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const RECAPTCHA_SITE_KEY = '6Ld2mAEtAAAAADCb15UwZclk7Yubl-Yh6lyFSlLT';
// ✅ الاستماع لتغيير حالة المصادقة (Supabase)
let isAuthInitialized = false;

supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('🔄 حدث المصادقة:', event);

  // 🔴 أضف هذا الشرط لالتقاط حدث استعادة كلمة المرور
  if (event === 'PASSWORD_RECOVERY') {
    console.log('✅ تم التقاط حدث استعادة كلمة المرور');
    // ننتظر نصف ثانية حتى تستقر الواجهة ثم نظهر نافذة تغيير كلمة المرور
    setTimeout(() => {
      handleChangePassword();
    }, 500);
  }

  if (['INITIAL_SESSION', 'SIGNED_IN', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
    // ... (باقي كودك الحالي كما هو) ...
    if (session) {
      console.log('✅ جلسة نشطة:', session.user);
      updateUserUI(session.user);
      
      if (event === 'SIGNED_IN') {
        router('user-dashboard');
        window.history.replaceState(null, '', window.location.pathname + '#user-dashboard');
      }
    } else if (event === 'INITIAL_SESSION') {
      updateUserUI(null);
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('❌ تم تسجيل الخروج');
    updateUserUI(null);
  }

  if (!isAuthInitialized) {
    const hash = window.location.hash;
    
    // 🔴 الحل السحري: لا تقم بتشغيل الراوتر إذا كان الرابط يحتوي على توكن المصادقة!
    if (!hash.includes('access_token') && !hash.includes('error=')) {
        const cleanHash = hash.replace('#', '');
const startView = ['home', 'add-doctor', 'booking', 'dashboard', 'login', 'track', 'user-dashboard', 'doctor-profile'].includes(cleanHash) ? cleanHash : 'home';
      router(startView, false);
    }
    
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
        termsOfUse: 'Terms of Use',
        navHome: 'Directory', navTrack: 'Track Booking', navAdd: 'Add Doctor', navDashboard: 'Doctor Login', navLogin: 'Login',
        chatTitle: 'Medical Assistant',
        clinicProfileTitle: 'Clinic Profile & Services',
        clinicEmail: 'Clinic Email',
        clinicEmailPh: 'contact@clinic.com',
        whatsappNum: 'WhatsApp Number',
        whatsappPh: 'e.g. +213550000000',
        facebookLink: 'Facebook Link',
        facebookPh: 'https://facebook.com/...',
        mapLink: 'Clinic Location (Google Maps)',
        mapLinkPh: 'Google Maps link...',
        servicesProvided: 'Provided Services',
        servicesHelp: 'Add service categories (e.g., Pediatrics) then write sub-services separated by commas (,).',
        addServiceBtn: 'Add New Service Category',
        saveChangesBtn: 'Save Changes',
        mapLocation: 'Location Map',
        openInGoogleMaps: 'Open in Google Maps',
        ourServices: 'Our Services',
        catNamePh: 'Category Name (e.g. Dentistry)',
        svcItemsPh: 'Services (comma-separated, e.g. Whitening, Braces...)',
        whatsappBtn: 'WhatsApp',
        facebookBtn: 'Facebook',
        emailBtn: 'Email',
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
        termsOfUse: 'شروط الاستعمال',
chatPhoneLabel: 'الهاتف: ',
chatMunLabel: 'البلدية: ',
chatAddressLabel: 'العنوان: ',
chatBookDetailsBtn: 'عرض التفاصيل والحجز',
        clinicProfileTitle: 'ملف العيادة والخدمات',
        clinicEmail: 'البريد الإلكتروني للعيادة',
        clinicEmailPh: 'contact@clinic.com',
        whatsappNum: 'رقم الواتساب',
        whatsappPh: 'مثال: 213550000000+',
        facebookLink: 'رابط حساب الفيسبوك',
        facebookPh: 'https://facebook.com/...',
        mapLink: 'رابط موقع العيادة (Google Maps)',
        mapLinkPh: 'رابط خرائط جوجل...',
        servicesProvided: 'الخدمات المقدمة (جدول الخدمات)',
        servicesHelp: 'أضف فئات الخدمات (مثال: طب الأطفال) ثم اكتب الخدمات التابعة لها مفصولة بفاصلة (,)',
        addServiceBtn: 'إضافة فئة خدمات جديدة',
        saveChangesBtn: 'حفظ التغييرات',
        mapLocation: 'الموقع الجغرافي',
        openInGoogleMaps: 'فتح في خرائط جوجل',
        ourServices: 'خدماتنا',
        catNamePh: 'اسم الفئة (مثال: طب الأسنان)',
        svcItemsPh: 'الخدمات (افصل بينها بفاصلة، مثال: تبييض، تقويم...)',
        whatsappBtn: 'واتساب',
        facebookBtn: 'فيسبوك',
        emailBtn: 'إيميل',
        municipalityPlaceholder: 'مثال: غليزان', extraInfo: 'معلومات إضافية', extraInfoPlaceholder: 'أوقات العمل، أجرة الكشف، اللغات المحكية، الشهادات...', registerBtn: 'تسجيل الطبيب',
        backToDirectory: '→ العودة للدليل', backToHome: '→ العودة للدليل', bookAppointment: 'حجز موعد', patientName: 'اسم المريض الكامل *', patientNamePlaceholder: 'الاسم الكامل',
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
    if (!document.getElementById('userPill')) {
    console.log('⏳ الصفحة لم تُحمّل بعد');
    return;
  }
  const pill = document.getElementById('userPill');
  const loginBtn = document.getElementById('navLoginBtn');
  const nameDisplay = document.getElementById('userNameDisplay');
  
  // ✅ إضافة حماية: إذا لم تُحمّل الصفحة بعد، اخرج من الدالة
  if (!pill && !loginBtn) {
    console.log('⏳ الصفحة لم تُحمّل بعد، سيتم تحديث الواجهة لاحقاً');
    return;
  }

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
      for (const view of ['home', 'add-doctor', 'booking', 'dashboard', 'login', 'doctor-profile']) { // 👈 تم إضافة القوس هنا
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
 // ✅ الكود المحسن لتسجيل الدخول بـ Google
async function handleGoogleSignIn() {
  if (isAccountLocked()) return;
  
  const btn = document.getElementById('googleSignInBtn');
  setLoading(btn, true); 

  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        // 🔴 التعديل هنا: يجب أن يكون الرابط الأساسي فقط بدون أي Hash
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) throw error;
    resetLoginAttempts();
  } catch (err) { 
    recordFailedAttempt(); 
    showToast(t('toastAuthError') + err.message, 'error'); 
    setLoading(btn, false);
  }
}

// ✅ الكود الجديد لتسجيل الدخول بالإيميل
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

      // ✅ تسجيل الدخول تلقائياً
      if (data.user) {
        const { error: loginError } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (loginError && loginError.message.includes('Email not confirmed')) {
          showToast('تم إنشاء الحساب! يمكنك تسجيل الدخول الآن.', 'success');
        } else {
          showToast('تم إنشاء الحساب بنجاح! ' + t('toastAuthSuccess') + name, 'success');
          setTimeout(() => router('user-dashboard'), 500);
        }
      }

    } else {
      // ✅ تسجيل دخول
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
    if (msg.includes('weak-password')) msg = t('weakPassword');
    else if (msg.includes('invalid-email')) msg = t('invalidEmail');
    else if (msg.includes('not found') || msg.includes('Invalid login')) msg = t('userNotFound');
    else if (msg.includes('wrong-password') || msg.includes('Invalid login credentials')) msg = t('wrongPassword');
    else if (msg.includes('already in use') || msg.includes('already registered')) msg = t('emailInUse');
    showToast(t('toastAuthError') + msg, 'error');
  } finally { 
    setLoading(btn, false); 
  }
}
// ✅ 1. دالة فتح نافذة استعادة كلمة المرور
function handleForgotPassword(e) {
  if (e) e.preventDefault();
  document.getElementById('resetEmailInput').value = ''; // تفريغ الحقل
  document.getElementById('forgotPasswordModal').classList.remove('hidden');
  document.getElementById('resetEmailInput').focus();
}

// ✅ 2. دالة إغلاق النافذة
function closeForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').classList.add('hidden');
}

// ✅ 3. دالة إرسال رابط الاستعادة عبر Supabase
async function submitPasswordReset() {
  const email = document.getElementById('resetEmailInput').value.trim();

  // التحقق من صحة البريد الإلكتروني
  if (!email || !email.includes('@')) {
    showToast(currentLang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email', 'error');
    return;
  }

  const btn = document.getElementById('sendResetLinkBtn');
  setLoading(btn, true, currentLang === 'ar' ? 'جاري الإرسال...' : 'Sending...');

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });

    if (error) throw error;

    showToast(currentLang === 'ar' ? 'تم إرسال رابط الاستعادة إلى بريدك بنجاح' : 'Reset link sent successfully', 'success');
    closeForgotPasswordModal(); // إغلاق النافذة بعد النجاح
  } catch (err) {
    let msg = err.message;
    if (msg.includes('not found')) msg = currentLang === 'ar' ? 'هذا البريد غير مسجل لدينا' : 'Email not found';
    showToast((currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + msg, 'error');
  } finally {
    setLoading(btn, false, currentLang === 'ar' ? 'إرسال الرابط' : 'Send Link');
  }
}
    function toggleAuthMode() {
  isSignUp = !isSignUp;
  document.getElementById('nameFieldGroup').classList.toggle('hidden', !isSignUp);
  
  // ✅ إخفاء أو إظهار رابط "نسيت كلمة المرور" بشكل احترافي
  const forgotLink = document.getElementById('forgotPasswordLink');
  if (forgotLink) {
    forgotLink.style.display = isSignUp ? 'none' : 'block';
  }

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
// ✅ تحويل واجهة العرض إلى صفحة كاملة باحترافية (مع حل مشاكل التداخل والـ QR العربي)
function openDoctorProfileModal(doc, doctorName) {
  let fbLink = doc.facebook_link || '';
  if (fbLink && !fbLink.match(/^https?:\/\//i)) {
      fbLink = 'https://' + fbLink;
  }

  const profileUrl = `${window.location.origin}${window.location.pathname}?doc=${doc.id}`;
  const shareText = currentLang === 'ar' ? 'مشاركة الرابط' : 'Share Link';
  const isBookingEnabled = doc.booking_enabled === true;

  // إعداد رسائل المشاركة الديناميكية
  const shareMessageText = currentLang === 'ar' ? `احجز موعد مع د. ${doctorName} عبر دليل أطباء غليزان` : `Book an appointment with Dr. ${doctorName} via Relizane Medical Directory`;
  const encodedShareText = encodeURIComponent(shareMessageText + '\n\n' + profileUrl);
  const encodedUrl = encodeURIComponent(profileUrl);

  // إعداد بيانات vCard
  let vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${doctorName}\n`;
  if (doc.phone) vCard += `TEL:${doc.phone}\n`;
  if (doc.contact_email) vCard += `EMAIL:${doc.contact_email}\n`;
  if (doc.exact_location) vCard += `ADR:;;${doc.exact_location};${t(doc.municipality)};;;\n`;
  vCard += `URL:${profileUrl}\nEND:VCARD`;

  const qrPrimary  = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vCard)}&color=000000`;
  const qrFallback = `https://quickchart.io/qr?size=150&text=${encodeURIComponent(vCard)}`;

  // تحديث بيانات الهيدر الملون الثابتة
  document.getElementById('fullProfileName').textContent = doctorName;
  document.getElementById('fullProfileSpec').querySelector('span').textContent = escapeHtml(t(doc.specialty));
  document.getElementById('fullProfileAvatar').textContent = (doc.first_name?.[0] || '') + (doc.last_name?.[0] || '');

  // بناء جدول العمل الأسبوعي
  let scheduleHtml = '';
  if (doc.working_days && Object.keys(doc.working_days).length > 0) {
    try {
      const wd = typeof doc.working_days === 'string' ? JSON.parse(doc.working_days) : doc.working_days;
      const daysNames = currentLang === 'ar' 
        ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] 
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for(let i=0; i<=6; i++) {
        if(wd[i] && wd[i].active) {
          scheduleHtml += `<div style="display:flex; justify-content:space-between; align-items: center; padding: 0.75rem 0; font-size: 0.95rem; border-bottom: 1px dashed var(--border);">
            <span style="color: #64748b; font-weight: 700;">${daysNames[i]}</span>
            <span dir="ltr" style="color: var(--primary-dark); font-weight: 800; background: #e0f2fe; padding: 0.4rem 0.8rem; border-radius: 8px; letter-spacing: 0.5px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);">${wd[i].start} - ${wd[i].end}</span>
          </div>`;
        }
      }
    } catch(e) { console.error(e); }
  }

  if(!scheduleHtml) {
    scheduleHtml = `<div class="text-sm text-gray" style="padding: 1.5rem 0; text-align: center; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border);">${currentLang === 'ar' ? 'غير متوفر حالياً' : 'Not available currently'}</div>`;
  }

  // بناء قسم الخدمات
  let servicesHtml = '';
  if (doc.services && Array.isArray(doc.services) && doc.services.length > 0) {
      servicesHtml = `
      <div style="margin-top: 2.5rem; background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03);">
        <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 0.75rem;">
           <span style="background: rgba(14, 165, 233, 0.1); color: var(--primary); padding: 0.6rem; border-radius: 10px; display: flex; box-shadow: inset 0 2px 4px rgba(14,165,233,0.1);">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
           </span>
           ${t('ourServices')}
        </h3>
        <div style="display: grid; gap: 1.25rem;">
            ${doc.services.map(service => `
                <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); box-shadow: inset 0 2px 5px rgba(0,0,0,0.01);">
                    <div style="color: var(--primary-dark); font-size: 1.1rem; font-weight: 800; margin-bottom: ${service.items.length > 0 ? '1rem' : '0'}; display: flex; align-items: center; gap: 10px;">
                        <span style="display: inline-block; width: 10px; height: 10px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary-light);"></span>
                        ${escapeHtml(service.category)}
                    </div>
                    ${service.items.length > 0 ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; padding-inline-start: 1.25rem;">
                            ${service.items.map(item => `
                                <div style="background: #f1f5f9; color: #475569; font-size: 0.9rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 50px; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color: #cbd5e1;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ${escapeHtml(item)}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
      </div>`;
  }

  // بناء شريط المشاركة (Social Share Icons)
  const shareSectionHtml = `
      <div style="margin-top: 2.5rem; text-align: center;">
        <h4 style="font-size: 1.15rem; font-weight: 900; color: var(--primary); margin-bottom: 1.25rem;">
          ${currentLang === 'ar' ? 'شارك مع:' : 'Share with:'}
        </h4>
        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; align-items: center;">
            <a href="https://api.whatsapp.com/send?text=${encodedShareText}" target="_blank" title="WhatsApp" style="background: #25D366; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(37,211,102,0.2);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></a>
            <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareMessageText)}" target="_blank" title="Telegram" style="background: #0088cc; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(0,136,204,0.2);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" title="Facebook" style="background: #1877F2; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(24,119,242,0.2);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
            <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(shareMessageText)}" target="_blank" title="X (Twitter)" style="background: #000000; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.2);"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 4.15H5.059z"/></svg></a>
            <a href="sms:?body=${encodedShareText}" title="SMS" style="background: #34C759; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(52,199,89,0.2);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></a>
        </div>
      </div>
  `;

  // تجميع وحقن المحتويات التفاعلية
  document.getElementById('fullProfileContent').innerHTML = `
    <div class="grid grid-1 grid-2" style="gap: 2.5rem; align-items: start;">
      
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <div style="background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; background: rgba(14, 165, 233, 0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(14,165,233,0.1);">
              <div style="background: white; color: var(--primary); padding: 0.75rem; border-radius: 12px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(14,165,233,0.1);">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.2rem;">${currentLang === 'ar' ? 'العنوان الدقيق' : 'Exact Location'}</div>
                <div style="font-weight: 900; color: #0f172a; font-size: 1.1rem; line-height: 1.4;">${escapeHtml(doc.exact_location)}, <span style="color: var(--primary);">${escapeHtml(t(doc.municipality))}</span></div>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 1rem; background: rgba(16, 185, 129, 0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(16,185,129,0.1);">
              <div style="background: white; color: #10b981; padding: 0.75rem; border-radius: 12px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(16,185,129,0.1);">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.2rem;">${currentLang === 'ar' ? 'رقم العيادة' : 'Clinic Phone'}</div>
                <div style="font-weight: 900; color: #0f172a; font-size: 1.25rem; letter-spacing: 1px;" dir="ltr">${escapeHtml(formatPhoneNumber(doc.phone))}</div>
              </div>
            </div>
        </div>

        <div style="background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03);">
          <div style="font-size: 1.15rem; font-weight: 900; color: #0f172a; margin-bottom: 1.25rem; display: flex; gap: 0.75rem; align-items: center;">
            <span style="background: rgba(14, 165, 233, 0.1); color: var(--primary); padding: 0.6rem; border-radius: 10px; display: flex; box-shadow: inset 0 2px 4px rgba(14,165,233,0.1);">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </span>
            <span>${currentLang === 'ar' ? 'أوقات العمل المتاحة' : 'Available Working Hours'}</span>
          </div>
          <div>
            ${scheduleHtml}
          </div>
        </div>

      </div>

      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <div style="background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03);">
          <div style="font-size: 1.15rem; font-weight: 900; color: #0f172a; margin-bottom: 1.25rem; display: flex; gap: 0.75rem; align-items: center;">
            <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.6rem; border-radius: 10px; display: flex; box-shadow: inset 0 2px 4px rgba(239,68,68,0.1);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </span>
            <span>${currentLang === 'ar' ? 'الموقع على الخريطة' : 'Map Location'}</span>
          </div>
          
          <div style="border-radius: 12px; overflow: hidden; border: 1px solid var(--border); margin-bottom: ${doc.map_link ? '1rem' : '0'}; position: relative; padding-bottom: 65%; height: 0; background: #f8fafc;">
           <iframe 
                src="https://maps.google.com/maps?q=${encodeURIComponent(doc.exact_location + ', ' + t(doc.municipality) + ', Relizane')}&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade">
            </iframe>
          </div>

          ${doc.map_link ? `
          <a href="${doc.map_link}" target="_blank" class="btn" style="width: 100%; justify-content: center; background: #fff5f5; color: #ef4444; border: 1px solid #fca5a5; padding: 0.85rem; font-weight: 800; font-size: 0.95rem; border-radius: 10px; transition: all 0.2s;" onmouseover="this.style.background='#ef4444'; this.style.color='white';" onmouseout="this.style.background='#fff5f5'; this.style.color='#ef4444';">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-inline-end:0.4rem;"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            ${currentLang === 'ar' ? 'فتح تطبيق الخرائط للتوجه' : 'Open in Maps App'}
          </a>` : ''}
        </div>

        <div style="background: white; padding: 2rem; border-radius: 20px; border: 1px solid rgba(0,0,0,0.03); text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.03);">
            <div style="color: #0f172a; font-weight: 900; font-size: 1.15rem; margin-bottom: 1.5rem;">
                <span style="background: rgba(14, 165, 233, 0.1); color: var(--primary); padding: 0.6rem; border-radius: 10px; display: inline-flex; vertical-align: bottom; margin-inline-end: 8px; box-shadow: inset 0 2px 4px rgba(14,165,233,0.1);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                </span>
                ${currentLang === 'ar' ? 'إمسح الرمز لحفظ جهة الاتصال' : 'Scan to save contact'}
            </div>
            <div id="vcard-qrcode" style="display: inline-flex; justify-content: center; align-items: center; padding: 1.25rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; box-shadow: inset 0 2px 5px rgba(0,0,0,0.01); min-width: 160px; min-height: 160px;">
                </div>
        </div>
      </div>
  </div>

   ${Array.isArray(doc.clinic_images) && doc.clinic_images.length > 0 ? `
    <div style="margin-top: 2.5rem; background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.03);">
        <h4 style="font-size: 1.15rem; font-weight: 900; margin-bottom: 1.5rem; color: #0f172a;">
            ${currentLang === 'ar' ? 'صور العيادة' : 'Clinic Gallery'}
        </h4>

        <div style="position: relative; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); height: 250px;">
            
            <div id="clinicSlider_${doc.id}" dir="ltr" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; width: 100%; height: 100%; scrollbar-width: none; -ms-overflow-style: none;">
                ${doc.clinic_images.map((url, index) => `
                    <img src="${url}" 
                         style="flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: center;" 
                         onerror="this.style.display='none'"
                         alt="Clinic Image ${index + 1}">
                `).join('')}
            </div>

            ${doc.clinic_images.length > 1 ? `
                <button onclick="moveClinicSlide('clinicSlider_${doc.id}', -1)" style="position: absolute; top: 50%; left: 10px; transform: translateY(-50%); background: rgba(255,255,255,0.85); backdrop-filter: blur(4px); border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 2; transition: all 0.2s;" onmouseover="this.style.background='white'" onmouseout="this.style.background='rgba(255,255,255,0.85)'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button onclick="moveClinicSlide('clinicSlider_${doc.id}', 1)" style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: rgba(255,255,255,0.85); backdrop-filter: blur(4px); border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 2; transition: all 0.2s;" onmouseover="this.style.background='white'" onmouseout="this.style.background='rgba(255,255,255,0.85)'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>

                <div style="position: absolute; bottom: 12px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; z-index: 2;">
                    ${doc.clinic_images.map((_, i) => `
                        <span class="slide-dot-${doc.id}" style="width: 8px; height: 8px; border-radius: 50%; background: ${i === 0 ? 'white' : 'rgba(255,255,255,0.4)'}; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: background 0.3s;"></span>
                    `).join('')}
                </div>
            ` : ''}
            
            <style>
                /* إخفاء شريط التمرير الافتراضي */
                #clinicSlider_${doc.id}::-webkit-scrollbar { display: none; }
            </style>
        </div>
    </div>
    ` : ''}

    ${servicesHtml}

    ${doc.extra_info ? `
    <div style="margin-top: 2.5rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.05);">
      <h4 style="font-size: 1.15rem; font-weight: 900; margin-bottom: 1rem; color: #d97706; display: flex; align-items: center; gap: 0.6rem;">
        <span style="background: rgba(245, 158, 11, 0.15); padding: 0.6rem; border-radius: 10px; display: flex;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </span>
        ${currentLang === 'ar' ? 'معلومات إضافية' : 'Extra Information'}
      </h4>
      <p style="color: #92400e; font-size: 1.05rem; line-height: 1.7; margin: 0; font-weight: 500;">${escapeHtml(doc.extra_info)}</p>
    </div>` : ''}

    ${shareSectionHtml}

    <div style="position: sticky; bottom: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); margin: 3.5rem -2rem -2rem -2rem; padding: 1rem 1.5rem; border-top: 1px solid rgba(0,0,0,0.08); box-shadow: 0 -10px 20px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 0.75rem; z-index: 100; border-radius: 20px 20px 0 0;">
      
      <div style="display: flex; gap: 0.75rem; width: 100%;">
          <button class="btn" style="background: white; border: 1px solid var(--border); color: #0f172a; padding: 0.75rem; font-size: 0.95rem; flex: 1; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="openReviewsModal('${doc.id}', '${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}')">
            <span style="color: #f59e0b; font-size: 1.1rem;">★</span> ${currentLang === 'ar' ? 'التقييمات' : 'Reviews'}
          </button>
          
          <button class="btn" style="background: white; border: 1px solid var(--border); color: #0f172a; padding: 0.75rem; font-size: 0.95rem; flex: 1; font-weight: 800; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="navigator.clipboard.writeText('${profileUrl}'); showToast(currentLang==='ar'?'تم نسخ الرابط بنجاح':'Copied', 'success');">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary)" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            ${shareText}
          </button>
      </div>

      <button class="btn ${isBookingEnabled ? 'btn-success' : 'btn-secondary'}" style="width: 100%; padding: 0.85rem; font-size: 1.1rem; font-weight: 900; letter-spacing: 0.5px; border-radius: 12px; justify-content: center; display: flex; align-items: center; box-shadow: ${isBookingEnabled ? '0 4px 15px rgba(16, 185, 129, 0.2)' : 'none'};" ${isBookingEnabled ? `onclick="openBooking('${doc.id}')"` : 'disabled'}>
        ${isBookingEnabled ? (currentLang === 'ar' ? 'احجز موعد الآن' : 'Book Appointment') : (currentLang === 'ar' ? 'الحجوزات مغلقة حالياً' : 'Bookings Closed')}
      </button>

    </div>
  `;

  // الانتقال للصفحة أولاً للسماح للمتصفح برسم العناصر
  router('doctor-profile');

  // رسم الـ QR Code والتأكد من ظهوره
  setTimeout(() => {
      const qrContainer = document.getElementById('vcard-qrcode');
      if (qrContainer) {
          qrContainer.innerHTML = '';
          if (typeof QRCode !== 'undefined') {
              try {
                  const utf8vCard = unescape(encodeURIComponent(vCard));
                  new QRCode(qrContainer, {
                      text: utf8vCard,
                      width: 140,
                      height: 140,
                      colorDark : "#0f172a",
                      colorLight : "#f8fafc",
                      correctLevel : QRCode.CorrectLevel.L
                  });
              } catch (e) {
                  console.warn("QR Library failed, using fallback APIs...");
                  qrContainer.innerHTML = `<img src="${qrPrimary}" data-fallback-url="${qrFallback}" onerror="handleQrError(this)" alt="QR Code" style="width: 140px; height: 140px; mix-blend-mode: multiply;" />`;
              }
          } else {
              qrContainer.innerHTML = `<img src="${qrPrimary}" data-fallback-url="${qrFallback}" onerror="handleQrError(this)" alt="QR Code" style="width: 140px; height: 140px; mix-blend-mode: multiply;" />`;
          }
      }

      // 🔴 تشغيل السلايدر التلقائي
      if (Array.isArray(doc.clinic_images) && doc.clinic_images.length > 1) {
          initClinicSlider(`clinicSlider_${doc.id}`, doc.id, doc.clinic_images.length);
      }

  }, 150);
    function escapeHtml(str) { if (!str) return ''; return DOMPurify.sanitize(str); }

function updateSEOMetaTags(doc) {
    if (!doc) return;
    // ✅ غيّر الخصائص إلى snake_case
    const pageTitle = currentLang === 'ar' ? `د. ${doc.first_name} ${doc.last_name} | ${doc.specialty} في ${doc.municipality}` : `Dr. ${doc.first_name} ${doc.last_name} | ${doc.specialty} in ${doc.municipality}`;
    const pageDesc = currentLang === 'ar' ? `احجز موعدك مع د. ${doc.first_name} ${doc.last_name}، أخصائي ${doc.specialty} في ${doc.municipality}، ولاية غليزان. العنوان: ${doc.exact_location}` : `Book an appointment with Dr. ${doc.first_name} ${doc.last_name}, ${doc.specialty} in ${doc.municipality}, Relizane.`;
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
const targetDoc = allDoctors.find(d => d.id === targetDocId);
          if (targetDoc) {
          updateSEOMetaTags(targetDoc);
          renderDoctors([targetDoc]);
          populateFilters(); // تأكد من استدعاء الفلاتر

          // === الجزء الجديد: هذا هو السحر الذي سيفتح النافذة تلقائياً ===
          const doctorName = (currentLang === 'ar' ? 'د. ' : 'Dr. ') + targetDoc.first_name + ' ' + targetDoc.last_name;
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
    // ✅ غيّر d.Specialty إلى d.specialty و d.Municipality إلى d.municipality
    const specs = [...new Set(allDoctors.map(d => d.specialty).filter(Boolean))].sort();
    const muns = [...new Set(allDoctors.map(d => d.municipality).filter(Boolean))].sort();
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
    
    // ✅ التعديل: تغيير أسماء الخصائص لتتطابق مع Supabase (snake_case)
    const filtered = allDoctors.filter(doc => {
        const text = `${doc.first_name||''} ${doc.last_name||''} ${doc.specialty||''} ${doc.municipality||''} ${doc.exact_location||''}`.toLowerCase();
        return (!search || text.includes(search)) && (!spec || doc.specialty === spec) && (!mun || doc.municipality === mun);
    });
    
    renderDoctors(filtered);
    
    if (!suggestionsDropdown) return;
    if (search.length < 2) { 
        suggestionsDropdown.classList.add('hidden'); 
        return; 
    }
    
    // ✅ التعديل: تغيير أسماء الخصائص ومعرف الطبيب (DoctorID إلى id)
    const suggestionsHtml = filtered.slice(0, 5).map(doc => {
        const avatarText = (doc.first_name?.[0] || '') + (doc.last_name?.[0] || '');
        const doctorName = escapeHtml(doc.first_name) + ' ' + escapeHtml(doc.last_name);
        const specialtyStr = escapeHtml(t(doc.specialty));
        
        return `
        <div class="suggestion-item" onclick="selectSuggestion('${doc.id}')">
            <div class="sugg-avatar">${avatarText}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: bold; font-size: 0.95rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${currentLang === 'ar' ? 'د.' : 'Dr.'} ${doctorName}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${specialtyStr} - ${escapeHtml(t(doc.municipality))}
                </div>
            </div>
        </div>`;
    }).join('');
    
    if (suggestionsHtml) { 
        suggestionsDropdown.innerHTML = suggestionsHtml; 
        suggestionsDropdown.classList.remove('hidden'); 
    } else { 
        suggestionsDropdown.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">${t('noDoctorsFound')}</div>`; 
        suggestionsDropdown.classList.remove('hidden'); 
    }
}

   window.selectSuggestion = function(doctorId) {
    const doc = allDoctors.find(d => d.id === doctorId);
    if (doc) {
        document.getElementById('searchInput').value = doc.first_name + ' ' + doc.last_name;
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
    
    if (!data.Specialty || !data.Municipality) {
        showToast(currentLang === 'ar' ? 'الرجاء اختيار الاختصاص والبلدية.' : 'Please select specialty and municipality.', 'error');
        setLoading(btn, false);
        return;
    }
    
    try {
        const defaultPassword = data.Phone.replace(/\s/g, '');
        
        // استدعاء الدالة الآمنة (RPC) من قاعدة البيانات مباشرة
        const { data: responseData, error } = await supabaseClient.rpc('register_doctor_secure', {
            p_first_name: data.FirstName.trim(),
            p_last_name: data.LastName.trim(),
            p_phone: defaultPassword,
            p_exact_location: data.ExactLocation.trim(),
            p_specialty: data.Specialty.trim(),
            p_municipality: data.Municipality.trim(),
            p_extra_info: data.ExtraInfo ? data.ExtraInfo.trim() : '',
            p_raw_password: defaultPassword
        });
        
        if (error) throw error;
        
        if (!responseData || !responseData.id) {
            throw new Error(responseData?.error || 'فشل في جلب معرف الطبيب الجديد');
        }
        
        const newDoctorId = responseData.id;
        showToast(t('toastRegisterSuccess') + newDoctorId, 'success');
        
        // إنشاء صفحة GitHub للطبيب
        const doctorDataForGithub = {
            first_name: data.FirstName.trim(),
            last_name: data.LastName.trim(),
            phone: defaultPassword,
            exact_location: data.ExactLocation.trim(),
            specialty: data.Specialty.trim(),
            municipality: data.Municipality.trim(),
            extra_info: data.ExtraInfo ? data.ExtraInfo.trim() : ''
        };
        createDoctorGitHubPageAsync(doctorDataForGithub, newDoctorId);
        
        e.target.reset();
        await loadDoctors();
        setTimeout(() => router('home'), 1500);
        
    } catch (err) {
        showToast(t('toastRegisterError') + err.message, 'error');
    } finally {
        setLoading(btn, false);
    }
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

// حساب التاريخ بناءً على التوقيت المحلي للجهاز لضمان دقة الأيام
const currentDate = new Date();
const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
const localDateString = new Date(currentDate.getTime() - timezoneOffset).toISOString().split('T')[0];
dateInput.min = localDateString;

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

  if (!data.PatientName || !data.PatientPhone || !data.AppointmentDate || !data.AppointmentTime) {
    showToast(currentLang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', 'error');
    setLoading(btn, false);
    return;
  }

  try {
    const { data: { user } } = await supabaseClient.auth.getUser();

    // ✅ استخراج البريد الإلكتروني سواء من النموذج أو من الحساب المسجل
    const finalEmail = data.PatientEmail ? data.PatientEmail.trim() : (user ? user.email : null);

    // ✅ حفظ الحجز في Supabase مع البريد الإلكتروني
    const { data: booking, error } = await supabaseClient
      .from('appointments')
      .insert([{
        doctor_id: data.DoctorID,
        patient_name: data.PatientName.trim(),
        patient_phone: data.PatientPhone.trim(),
        appointment_date: data.AppointmentDate,
        appointment_time: data.AppointmentTime,
        status: 'pending',
        user_id: user ? user.id : null,
        user_email: finalEmail // حفظ البريد هنا ليتم استخدامه لاحقاً في الإشعارات
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ خطأ في الحجز:', error);
      throw new Error(error.message);
    }

    // ✅ إصلاح الخلل: حماية الكود من الانهيار إذا كانت سياسات RLS تمنع القراءة بعد الإدخال
    if (!booking) {
        throw new Error("تم الحجز بنجاح، لكن يرجى تعديل صلاحيات RLS في Supabase للسماح بقراءة البيانات المضافة (Select policy).");
    }

    form.reset();
    const timeContainer = document.getElementById('timeSlotsContainer');
    if (timeContainer) {
      timeContainer.innerHTML = '<div class="text-sm text-gray" style="grid-column: 1 / -1;">يرجى تحديد تاريخ الموعد أولاً لعرض الأوقات المتاحة...</div>';
    }
    
    // --- بناء التذكرة الإلكترونية ---
    const bId = booking.id;
    const shortId = bId.substring(0, 8).toUpperCase();
    const bName = data.PatientName;
    const bDate = data.AppointmentDate;
    const bTime = data.AppointmentTime;
    const targetDoctorData = allDoctors.find(d => d.id === data.DoctorID);
    const bDoctor = targetDoctorData ? `${targetDoctorData.first_name} ${targetDoctorData.last_name}` : '';

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
      </div>
    `;

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
// استبدل كود تعبئة حقول ملف العيادة القديم بهذا:
if (data.doctorDetails) {
    document.getElementById('dash_contact_email').value = data.doctorDetails.contact_email || '';
    document.getElementById('dash_whatsapp').value = data.doctorDetails.whatsapp_number || '';
    document.getElementById('dash_facebook').value = data.doctorDetails.facebook_link || '';
    document.getElementById('dash_map_link').value = data.doctorDetails.map_link || '';
    
    // رسم جدول الخدمات
    const srvContainer = document.getElementById('servicesContainer');
    if (srvContainer) srvContainer.innerHTML = ''; // مسح القديم
    
    if (data.doctorDetails.services && Array.isArray(data.doctorDetails.services) && data.doctorDetails.services.length > 0) {
        data.doctorDetails.services.forEach(s => {
            addServiceCategory(s.category, s.items.join('، '));
        });
    } else {
        addServiceCategory(); // إضافة سطر فارغ افتراضي
    }
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
// ✅ تسجيل دخول الطبيب (محدث ليتوافق مع التشفير الآمن الجديد)
async function handleDashboardLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (isAccountLocked()) return;
    
    const btn = document.getElementById('dashboardLoginBtn');
    if (!btn) {
        console.error('❌ زر تسجيل الدخول غير موجود');
        return;
    }
    
    setLoading(btn, true);
    
    const phoneInput = document.getElementById('loginPhone');
    const passwordInput = document.getElementById('loginDoctorPassword');
    
    if (!phoneInput || !passwordInput) {
        console.error('❌ حقول الإدخال غير موجودة');
        setLoading(btn, false);
        showToast('خطأ في النموذج. يرجى تحديث الصفحة.', 'error');
        return;
    }
    
    const phone = phoneInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!phone || !password) {
        setLoading(btn, false);
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    try {
        // 1. استدعاء دالة التحقق الآمنة من قاعدة البيانات مباشرة (RPC)
        const { data: responseData, error: rpcError } = await supabaseClient.rpc('login_doctor_secure', {
            p_phone: phone,
            p_raw_password: password
        });
        
        if (rpcError) {
            console.error('خطأ في الاتصال:', rpcError);
            throw new Error('خطأ في الاتصال بقاعدة البيانات');
        }
        
        // التحقق من نتيجة الدخول
        if (!responseData || !responseData.success) {
            throw new Error(responseData?.error || 'بيانات الدخول غير صحيحة (تحقق من رقم الهاتف أو كلمة المرور)');
        }

        // استخراج بيانات الطبيب
        const doctor = responseData.doctor;
        
        // 2. جلب المواعيد الخاصة بهذا الطبيب
// 2. جلب المواعيد الخاصة بهذا الطبيب باستخدام الدالة الآمنة
        // 2. جلب المواعيد الخاصة بهذا الطبيب باستخدام الدالة الآمنة
        const { data: appointments, error: apptError } = await supabaseClient
          .rpc('get_doctor_appointments_secure', {
            p_doctor_id: doctor.id,               
            p_session_token: doctor.session_token // 👈 التعديل هنا: استخدمنا doctor.session_token بدلاً من المتغير غير الموجود
          });

        if (apptError) {
          console.error('❌ خطأ في جلب مواعيد الطبيب:', apptError);
        }
        
        // 3. نجاح تسجيل الدخول
        resetLoginAttempts();
        
        // 4. حفظ الجلسة (Session) في المتصفح باستخدام التوكن الجديد
        const sessionData = {
            doctorId: doctor.id,
            phone: doctor.phone,
            sessionToken: doctor.session_token
        };
        localStorage.setItem('doctorSession', JSON.stringify(sessionData));
        
        // 5. تجهيز البيانات لعرضها في لوحة التحكم
        const dashboardData = {
            doctorName: `${doctor.first_name} ${doctor.last_name}`,
            workingDays: typeof doctor.working_days === 'object' ? JSON.stringify(doctor.working_days) : (doctor.working_days || '{}'),
            bookingEnabled: doctor.booking_enabled,
            appointments: appointments || []
        };
        
        // 6. تحديث الواجهة الأمامية وإخفاء نافذة الدخول
        const loginSection = document.getElementById('loginSection');
        const dashboardSection = document.getElementById('dashboardSection');
        
        if (loginSection) loginSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        
        renderDashboardUI(dashboardData, doctor.id);
        showToast('تم تسجيل الدخول بنجاح', 'success');
        
    } catch (err) {
        console.error('❌ خطأ في تسجيل دخول الطبيب:', err);
        recordFailedAttempt();
        showToast(t('toastLoginError') + (err.message || 'تحقق من البيانات المدخلة'), 'error');
    } finally {
        setLoading(btn, false);
    }
}
// ✅ تسجيل خروج الطبيب (محدث - يمسح session_token من قاعدة البيانات)
async function logoutDashboard() {
    const sessionStr = localStorage.getItem('doctorSession');
    
    if (sessionStr) {
        try {
            const session = JSON.parse(sessionStr);
            
            // ✅ مسح session_token من Supabase
            await supabaseClient
                .from('doctors')
                .update({ session_token: null })
                .eq('id', session.doctorId);
            
        } catch (err) {
            console.error('خطأ في مسح الجلسة:', err);
        }
    }
    
    localStorage.removeItem('doctorSession');
    
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    
    const loginPhone = document.getElementById('loginPhone');
    const loginDoctorPassword = document.getElementById('loginDoctorPassword');
    if (loginPhone) loginPhone.value = '';
    if (loginDoctorPassword) loginDoctorPassword.value = '';
    
    showToast('تم تسجيل الخروج بنجاح', 'success');
    router('home');
}

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



// ✅ حفظ أوقات العمل (محدّثة لتتوافق مع RLS عبر دالة RPC الآمنة)
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
    // ✅ التحويل إلى الدالة الآمنة لإنقاذ العملية من حظر جدار الحماية RLS
    const { error } = await supabaseClient.rpc('update_doctor_settings_secure', {
        p_doctor_id: session.doctorId,
        p_session_token: session.sessionToken,
        p_working_days: workingDaysData
    });

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



   // ✅ تفعيل/إيقاف الحجوزات (محدّثة لتمرير التعديل عبر الـ RPC الآمن)
async function handleToggleBooking(e) {
  const isChecked = e.target.checked;
  const sessionStr = localStorage.getItem('doctorSession');
  if (!sessionStr) { showToast('يرجى تسجيل الدخول', 'error'); return; }
  const session = JSON.parse(sessionStr);

  const toggleSwitch = document.getElementById('bookingToggleSwitch');
  toggleSwitch.disabled = true;

  try {
    // ✅ استخدام الـ RPC الموحد لتجاوز قيود الـ RLS بنجاح
    const { error } = await supabaseClient.rpc('update_doctor_settings_secure', {
        p_doctor_id: session.doctorId,
        p_session_token: session.sessionToken,
        p_booking_enabled: isChecked
    });

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
// أضف async للدالة
async function router(viewName, pushHistory = true) {
  // التحقق من تسجيل الدخول قبل الدخول لصفحة إضافة طبيب
  if (viewName === 'add-doctor') {
    getCurrentUser().then(user => { 
        if (!user) { 
            showToast(t('loginRequired'), 'error'); 
            router('login'); 
        } 
    });
  }

  // إخفاء جميع الواجهات وإظهار الواجهة المطلوبة
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.remove('hidden');

  // تحديث حالة الأزرار في القائمة العلوية
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-btn[data-nav="${viewName}"]`);
  if (activeNav) activeNav.classList.add('active');

  // تحديث رابط المتصفح
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
      // ✅ جلب الجلسة بطريقة آمنة (بدون await) لمنع تعطل السكريبت
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
          updateUserUI(session ? session.user : null);
      }).catch(err => console.error("Error fetching session:", err));
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

    // ✅ جلب التقييمات من Supabase مباشرة
// ✅ جلب التقييمات من Supabase مباشرة
async function loadReviews(doctorId) {
  const list = document.getElementById('reviewsList');
  list.innerHTML = `<div class='p-4 text-center text-gray text-sm'>${currentLang === 'ar' ? 'جاري تحميل التقييمات...' : 'Loading reviews...'}</div>`;

  try {
    // جلب المستخدم الحالي
    const currentUser = await getCurrentUser();

    // ✅ جلب التقييمات (بدون فلترة الحالة، لأن RLS سيتكفل بالباقي: سيحضر المعتمدة للجميع، وقيد المراجعة لصاحبها فقط)
    const { data: reviews, error } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('✅ التقييمات:', reviews);

    if (!reviews || reviews.length === 0) {
      list.innerHTML = `<div class='p-4 text-center text-gray text-sm'>${currentLang === 'ar' ? 'لا توجد تقييمات بعد. كن أول من يقيّم!' : 'No reviews yet. Be the first to review!'}</div>`;
      return;
    }

    list.innerHTML = reviews.map(r => {
      // ✅ اللمسة السحرية: التحقق من الحالة لطباعة شارة المراجعة باللغتين
      const isPending = r.status === 'pending';
      const pendingBadge = isPending 
        ? `<span style="font-size: 0.7rem; background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; margin-inline-start: 8px;">${currentLang === 'ar' ? 'قيد المراجعة' : 'Pending Approval'}</span>` 
        : '';

      return `
      <div class="review-item" id="review-${r.id}" style="${isPending ? 'opacity: 0.8; background: var(--bg);' : ''}">
        <div class="review-header">
          <div>
            <span class="review-author">${escapeHtml(r.patient_name || (currentLang === 'ar' ? 'مستخدم' : 'User'))} ${pendingBadge}</span>
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
      `;
    }).join('');

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
          status: 'pending' 
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
        showToast(currentLang === 'ar' ? 'تم إرسال تقييمك بنجاح. سيتم نشره بعد المراجعة.' : 'Review submitted successfully. It will be published after moderation.', 'success');
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

      if (dateInput) {
          const currentDate = new Date();
          const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
          dateInput.min = new Date(currentDate.getTime() - timezoneOffset).toISOString().split('T')[0];
      }

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
          const phoneStr = document.getElementById('trackPhone').value.trim();
          const resultDiv = document.getElementById('trackResult');

          setLoading(btn, true);
          resultDiv.classList.add('hidden');

          try {
            // ✅ استخدام الدالة الآمنة للبحث بالمعرف القصير وتخطي RLS
            const { data, error } = await supabaseClient.rpc('track_booking_secure', {
              p_short_id: bookingId,
              p_phone: phoneStr
            });

            if (error) throw error;

            // التأكد من وجود بيانات مطابقة
            if (data && data.length > 0) {
              const booking = data[0]; // نأخذ النتيجة الأولى
              let statusStyle = 'background: #f1f5f9; color: #64748b;';
              let displayStatus = booking.status;

              // معالجة حالة الحجز وتحويلها لرسوميات ملائمة
              if (booking.status === 'confirmed') {
                  statusStyle = 'background: #ecfdf5; color: #10b981;';
                  displayStatus = currentLang === 'ar' ? 'مؤكد' : 'Confirmed';
              } else if (booking.status === 'cancelled') {
                  statusStyle = 'background: #fef2f2; color: #ef4444;';
                  displayStatus = currentLang === 'ar' ? 'ملغى' : 'Cancelled';
              } else {
                  displayStatus = currentLang === 'ar' ? 'قيد الانتظار' : 'Pending';
              }

              const detailsTxt = currentLang === 'ar' ? 'تفاصيل الحجز:' : 'Booking Details:';
              const idTxt = currentLang === 'ar' ? 'رقم الحجز:' : 'Booking ID:';
              const nameTxt = currentLang === 'ar' ? 'الاسم:' : 'Patient Name:';
              const dateTimeTxt = currentLang === 'ar' ? 'التاريخ والوقت:' : 'Date & Time:';
              const currentStatusTxt = currentLang === 'ar' ? 'الحالة الحالية:' : 'Current Status:';

              resultDiv.innerHTML = `
                <h4 class="font-bold mb-2">${detailsTxt}</h4>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>${idTxt}</span> <strong style="font-family: monospace;">${escapeHtml(booking.id.substring(0,8).toUpperCase())}</strong></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>${nameTxt}</span> <strong>${escapeHtml(booking.patient_name)}</strong></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>${dateTimeTxt}</span> <strong dir="ltr">${escapeHtml(booking.appointment_date)} ${escapeHtml(booking.appointment_time)}</strong></div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; border-top:1px solid var(--border); padding-top:1rem;">
                  <span>${currentStatusTxt}</span> 
                  <span class="badge" style="${statusStyle}">${escapeHtml(displayStatus)}</span>
                </div>
              `;
              resultDiv.classList.remove('hidden');
            } else {
              showToast(currentLang === 'ar' ? 'لم يتم العثور على الحجز. تأكد من الرقم والهاتف.' : 'Booking not found', 'error');
            }
          } catch (err) {
            console.error("Track error:", err);
            showToast(currentLang === 'ar' ? 'خطأ في الاتصال بقاعدة البيانات' : 'Connection Error', 'error');
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

// ✅ هذا هو الكود الصحيح والمحمي
// 1. نرفع أزرار التنقل للأعلى لضمان تشغيلها دائماً قبل أي شيء آخر
document.querySelectorAll('.nav-btn[data-nav]').forEach(btn => { 
    btn.onclick = () => router(btn.getAttribute('data-nav')); 
});

// 2. نتأكد من وجود العنصر في الصفحة (if) قبل ربط الحدث به
const addDoctorForm = document.getElementById('addDoctorForm');
if (addDoctorForm) addDoctorForm.onsubmit = handleAddDoctor;

const bookingBtn = document.getElementById('bookingBtn');
if (bookingBtn) bookingBtn.onclick = confirmBooking;

const confirmDialogOkBtn = document.getElementById('confirmDialogOkBtn');
if (confirmDialogOkBtn) confirmDialogOkBtn.onclick = submitBooking;

const cancelDialogBtn = document.getElementById('cancelDialogBtn');
if (cancelDialogBtn) cancelDialogBtn.onclick = closeConfirmDialog;

const dashboardLoginForm = document.getElementById('dashboardLoginForm');
if (dashboardLoginForm) dashboardLoginForm.onsubmit = handleDashboardLogin;

const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn');
if (dashboardLogoutBtn) dashboardLogoutBtn.onclick = logoutDashboard;

const bookingToggleSwitch = document.getElementById('bookingToggleSwitch');
if (bookingToggleSwitch) bookingToggleSwitch.onchange = handleToggleBooking;

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = logoutUser;

const searchInput = document.getElementById('searchInput');
if (searchInput) searchInput.oninput = filterDoctors;

const specialtyFilter = document.getElementById('specialtyFilter');
if (specialtyFilter) specialtyFilter.onchange = filterDoctors;

const municipalityFilter = document.getElementById('municipalityFilter');
if (municipalityFilter) municipalityFilter.onchange = filterDoctors;

      window.onscroll = () => { const btn = document.getElementById('backToTop'); if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) btn.classList.remove('hidden'); else btn.classList.add('hidden'); };



      document.getElementById('backToTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });



      window.onpopstate = (e) => { const view = (e.state && e.state.view) ? e.state.view : 'home'; router(view, false); };







   // === كود تسجيل الدخول التلقائي الآمن للطبيب (محدث لـ Supabase) ===
const savedSession = localStorage.getItem('doctorSession');
if (savedSession) {
    try {
        const session = JSON.parse(savedSession);
        
        // تفريغ الحقول
        const loginPhone = document.getElementById('loginPhone');
        const loginDoctorPassword = document.getElementById('loginDoctorPassword');
        if (loginPhone) loginPhone.value = session.phone || '';
        if (loginDoctorPassword) loginDoctorPassword.value = '';
        
        const btn = document.getElementById('dashboardLoginBtn');
        if (btn) setLoading(btn, true);
        
        // ✅ التحقق من session_token في Supabase
        (async () => {
            try {
                const { data: doctor, error } = await supabaseClient
                    .from('doctors')
                    .select('id, first_name, last_name, phone, working_days, booking_enabled, session_token')
                    .eq('id', session.doctorId)
                    .eq('session_token', session.sessionToken) // ✅ التحقق من الرمز
                    .maybeSingle();
                
                if (error) {
                    console.error('خطأ في التحقق من الجلسة:', error);
                    throw error;
                }
                
                if (doctor && doctor.session_token === session.sessionToken) {
                    // ✅ نجاح تسجيل الدخول التلقائي
                    // جلب المواعيد باستخدام الدالة الأمنية لضمان جلب البيانات وتخطي حظر الـ RLS
                    const { data: appointments, error: apptError } = await supabaseClient
                      .rpc('get_doctor_appointments_secure', {
                        p_doctor_id: doctor.id,                
                        p_session_token: doctor.session_token
                      });

                    if (apptError) console.error('❌ خطأ في جلب المواعيد (Auto-Login):', apptError);
                    
                    const dashboardData = {
                        doctorName: `${doctor.first_name} ${doctor.last_name}`,
                        workingDays: typeof doctor.working_days === 'object' ? JSON.stringify(doctor.working_days) : (doctor.working_days || '{}'),
                        bookingEnabled: doctor.booking_enabled,
                        appointments: appointments || []
                    };
                    
                    // تحديث الواجهة
                    const loginSection = document.getElementById('loginSection');
                    const dashboardSection = document.getElementById('dashboardSection');
                    
                    if (loginSection) loginSection.classList.add('hidden');
                    if (dashboardSection) dashboardSection.classList.remove('hidden');
                    
                    renderDashboardUI(dashboardData, doctor.id);
                    console.log('✅ تم تسجيل الدخول التلقائي بنجاح');
                } else {
                    // ❌ الرمز غير صالح، مسح الجلسة
                    console.log('❌ session_token غير صالح');
                    localStorage.removeItem('doctorSession');
                }
                
                if (btn) setLoading(btn, false);
                
            } catch (err) {
                console.error('خطأ في تسجيل الدخول التلقائي:', err);
                localStorage.removeItem('doctorSession');
                if (btn) setLoading(btn, false);
            }
        })();
        
    } catch(e) {
        console.error('خطأ في قراءة الجلسة:', e);
        localStorage.removeItem('doctorSession');
    }
}
    // =======================================
    });

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

   // ========================================================
// CHATBOT IMPROVED LOGIC
// ========================================================

const processUserMessage = (rawMsg) => {
    const cleanMsg = normalizeText(rawMsg);
    if (!allDoctors || allDoctors.length === 0) {
        return t('chatLoadingDB');
    }

    // نوايا المستخدم (سؤال عن هاتف أو موقع)
    const isAskingForPhone = currentLang === 'ar' ?
        /رقم|هاتف|تلفون|موبيل|اتصال/i.test(cleanMsg) :
        /phone|number|contact|call/i.test(cleanMsg);
    const isAskingForLocation = currentLang === 'ar' ?
        /عنوان|اين|مكان|موقع|وين/i.test(cleanMsg) :
        /address|location|where|place/i.test(cleanMsg);

    const availableSpecialties = [...new Set(allDoctors.map(d => d.specialty).filter(Boolean))];
    const availableMunicipalities = [...new Set(allDoctors.map(d => d.municipality).filter(Boolean))];

    let detectedSpecialty = null;
    let detectedMunicipality = null;
    let detectedName = null;

    // 1. البحث عن التخصص (مع دعم الكلمات الجزئية مثل "عيون" لـ "طب العيون")
    const specKeywords = currentLang === 'ar' ? 
        ['عيون', 'اسنان', 'قلب', 'اطفال', 'نساء', 'توليد', 'باطني', 'جلدية', 'عظام', 'انف', 'اذن', 'حنجرة', 'صدر', 'اعصاب', 'نفسية', 'جراحة', 'عام', 'تحاليل', 'اشعة', 'تغذية', 'روماتيزم', 'غدد', 'سكري', 'كلى', 'مسالك', 'اورام', 'حساسية', 'شيخوخة', 'طوارئ', 'اوعية', 'تجميل', 'تخدير', 'علاج طبيعي', 'نطق', 'هضم', 'دم'] :
        ['eye', 'ophthalmo', 'dental', 'dentist', 'cardio', 'pediatric', 'gyno', 'internal', 'derma', 'skin', 'ortho', 'bone', 'ent', 'ear', 'nose', 'throat', 'lung', 'neuro', 'psych', 'surgery', 'general', 'lab', 'radiology', 'nutrition', 'rheum', 'joint', 'endocrino', 'diabetes', 'nephro', 'kidney', 'urology', 'oncology', 'cancer', 'allergy', 'geriat', 'emergency', 'vascular', 'plastic', 'anesth', 'family', 'physio', 'rehab', 'speech', 'gastro', 'hema'];
    
    for (const spec of availableSpecialties) {
        const normalizedSpec = normalizeText(t(spec));
        if (cleanMsg.includes(normalizedSpec)) {
            detectedSpecialty = spec;
            break;
        }
    }
    if (!detectedSpecialty) {
        for (const spec of availableSpecialties) {
            const specLower = normalizeText(t(spec));
            for (const keyword of specKeywords) {
                if (specLower.includes(normalizeText(keyword)) && cleanMsg.includes(normalizeText(keyword))) {
                    detectedSpecialty = spec;
                    break;
                }
            }
            if (detectedSpecialty) break;
        }
    }

    // 2. البحث عن البلدية
    for (const mun of availableMunicipalities) {
        const normalizedMun = normalizeText(t(mun));
        if (cleanMsg.includes(normalizedMun)) {
            detectedMunicipality = mun;
            break;
        }
    }

    // 3. البحث عن الاسم
    const docNameMatch = allDoctors.find(doc => {
        const fullName = normalizeText((doc.first_name || "") + " " + (doc.last_name || ""));
        return cleanMsg.split(' ').some(word => word.length >= 3 && fullName.includes(word));
    });
    if (docNameMatch) {
        detectedName = docNameMatch;
    }

    let matchedDoctors = [];
    let responsePrefix = '';
    const totalFound = 0; // سنحسبه لاحقاً

    // منطق البحث المتقدم (مركب)
    if (detectedSpecialty && detectedMunicipality) {
        // بحث بالتخصص والبلدية معاً (الأكثر شيوعاً)
        matchedDoctors = allDoctors.filter(doc => 
            doc.specialty === detectedSpecialty && doc.municipality === detectedMunicipality
        );
        responsePrefix = currentLang === 'ar' ? 
            `وجدت لك ${matchedDoctors.length} طبيباً متخصصاً في <strong>${t(detectedSpecialty)}</strong> في <strong>${t(detectedMunicipality)}</strong>. إليك أبرز النتائج:` :
            `Found ${matchedDoctors.length} <strong>${t(detectedSpecialty)}</strong> doctors in <strong>${t(detectedMunicipality)}</strong>. Here are the top results:`;
    } else if (detectedSpecialty) {
        // بحث بالتخصص فقط
        matchedDoctors = allDoctors.filter(doc => doc.specialty === detectedSpecialty);
        responsePrefix = currentLang === 'ar' ? 
            `إليك قائمة بأفضل الأطباء المتخصصين في <strong>${t(detectedSpecialty)}</strong> عبر جميع بلديات غليزان:` :
            `Here is a list of top <strong>${t(detectedSpecialty)}</strong> specialists across Relizane:`;
    } else if (detectedMunicipality) {
        // بحث بالبلدية فقط
        matchedDoctors = allDoctors.filter(doc => doc.municipality === detectedMunicipality);
        responsePrefix = currentLang === 'ar' ? 
            `إليك جميع الأطباء المتوفرين في بلدية <strong>${t(detectedMunicipality)}</strong>:` :
            `Here are all available doctors in <strong>${t(detectedMunicipality)}</strong>:`;
    } else if (detectedName) {
        // بحث بالاسم
        matchedDoctors = allDoctors.filter(doc => {
            const fullName = normalizeText((doc.first_name || "") + " " + (doc.last_name || ""));
            return cleanMsg.split(' ').some(word => word.length >= 3 && fullName.includes(word));
        });
        responsePrefix = currentLang === 'ar' ? 
            `وجدت نتائج مطابقة لاسم "<strong>${detectedName.first_name} ${detectedName.last_name}</strong>":` :
            `Found results matching "<strong>${detectedName.first_name} ${detectedName.last_name}</strong>":`;
    } else {
        // بحث عام بالكلمات المفتاحية
        matchedDoctors = allDoctors.filter(doc => {
            const text = normalizeText(`${doc.first_name||''} ${doc.last_name||''} ${doc.specialty||''} ${doc.municipality||''} ${doc.exact_location||''}`);
            return cleanMsg.split(' ').some(word => word.length >= 3 && text.includes(word));
        });
        if (matchedDoctors.length > 0) {
            responsePrefix = currentLang === 'ar' ? 
                `إليك أفضل النتائج المطابقة لبحثك:` :
                `Here are the best results matching your search:`;
        }
    }

    if (matchedDoctors.length === 0) {
        return currentLang === 'ar' ? 
            `عذراً، لم أتمكن من العثور على أطباء يطابقون بحثك "<strong>${rawMsg}</strong>".<br><br>💡 <strong>جرب البحث بـ:</strong><br>• اسم الطبيب (مثل: د. أمين)<br>• التخصص (مثل: طبيب عيون، أسنان)<br>• البلدية (مثل: غليزان، وادي رهيو)<br>• أو مزيج (مثل: طبيب أطفال في مازونة)` :
            `Sorry, I couldn't find any doctors matching "<strong>${rawMsg}</strong>".<br><br>💡 <strong>Try searching by:</strong><br>• Doctor's name (e.g. Dr. Amine)<br>• Specialty (e.g. eye doctor, dentist)<br>• Municipality (e.g. Relizane, Oued Rhiou)<br>• Or a combination (e.g. pediatrician in Mazouna)`;
    }

    const displayCount = Math.min(3, matchedDoctors.length);
    const remaining = matchedDoctors.length - displayCount;
    
    let response = responsePrefix;
    if (remaining > 0) {
        response += currentLang === 'ar' ? 
            `<br><span style="color: var(--text-secondary); font-size: 0.85rem;">📋 و ${remaining} نتيجة أخرى متاحة في الدليل الرئيسي</span>` :
            `<br><span style="color: var(--text-secondary); font-size: 0.85rem;">📋 And ${remaining} more results available in the main directory</span>`;
    }
    
    response += generateCardsHtml(matchedDoctors.slice(0, 3), isAskingForPhone, isAskingForLocation);
    return response;
};

const generateCardsHtml = (doctorsList, focusPhone, focusLocation) => {
    return doctorsList.map(doc => {
        const docPrefix = currentLang === 'ar' ? 'د.' : 'Dr.';
        let infoHtml = `<div class="bot-card-result" style="border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-top: 12px; background: var(--surface); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">`;
        
        infoHtml += `<div style="font-weight: bold; color: var(--primary-dark); font-size: 1.05rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            ${docPrefix} ${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}
        </div>`;
        infoHtml += `<div style="color: var(--text); font-size: 0.9rem; margin-bottom: 4px;"><strong>${t('chatSpecLabel')}</strong> ${escapeHtml(t(doc.specialty))}</div>`;
        infoHtml += `<div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 8px;"><strong>${t('chatMunLabel')}</strong> ${escapeHtml(t(doc.municipality))}</div>`;
        
        if (focusPhone || (!focusPhone && !focusLocation)) {
            infoHtml += `<div style="font-size: 0.9rem; margin-bottom: 4px;"><strong>${t('chatPhoneLabel')}</strong> <span dir="ltr" style="display: inline-block; direction: ltr; color: var(--primary); font-weight: 600;">${escapeHtml(formatPhoneNumber(doc.phone))}</span></div>`;
        }
        if (focusLocation || (!focusPhone && !focusLocation)) {
            infoHtml += `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;"><strong>${t('chatAddressLabel')}</strong> ${escapeHtml(doc.exact_location)}</div>`;
        }
        
        infoHtml += `<button onclick="document.getElementById('medicalChatbot').classList.add('hidden'); openDoctorProfileModal(allDoctors.find(d => d.id === '${doc.id}'), '${docPrefix} ${escapeHtml(doc.first_name)} ${escapeHtml(doc.last_name)}')" style="margin-top: 12px; background: var(--primary); color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 0.9rem; font-weight: bold; width: 100%; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${t('chatBookDetailsBtn')}
        </button>`;
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

// ✅ دالة مساعدة لاستدعاء Edge Function بشكل غير متزامن
function createDoctorGitHubPageAsync(doctorData, doctorId) {
    // استدعاء Edge Function دون انتظار النتيجة
    supabaseClient.functions.invoke('create-github-page', {
        body: { doctorData, doctorId }
    })
    .then(({ data, error }) => {
        if (error) {
            console.error('❌ خطأ في Edge Function:', error);
        } else if (data && data.success) {
            console.log('✅ تم إنشاء صفحة GitHub بنجاح:', data.url);
            showToast('تم إنشاء صفحة الطبيب على GitHub!', 'success');
        }
    })
    .catch(err => {
        console.error('❌ فشل استدعاء Edge Function:', err);
    });
}
// ✅ دالة تأكيد أو إلغاء الحجز من لوحة تحكم الطبيب (بنسخة آمنة تتخطى RLS)
window.changeBookingStatus = async function(bookingId, newStatus, userEmail, doctorName, appointmentDate) {
    const confirmMsg = newStatus === 'confirmed' 
        ? (currentLang === 'ar' ? 'هل أنت متأكد من تأكيد هذا الموعد؟' : 'Are you sure you want to confirm this appointment?')
        : (currentLang === 'ar' ? 'هل أنت متأكد من إلغاء هذا الموعد؟' : 'Are you sure you want to cancel this appointment?');

    if (!confirm(confirmMsg)) return;

    try {
        // جلب جلسة الطبيب الحالية
        const sessionStr = localStorage.getItem('doctorSession');
        if (!sessionStr) throw new Error('يرجى تسجيل الدخول مجدداً');
        const session = JSON.parse(sessionStr);

        // ✅ 1. تحديث حالة الحجز باستخدام الدالة الآمنة (RPC) لتخطي حماية RLS
        const { error } = await supabaseClient.rpc('update_booking_status_secure', {
            p_booking_id: bookingId,
            p_new_status: newStatus,
            p_doctor_id: session.doctorId,
            p_session_token: session.sessionToken
        });

        if (error) throw error;

        // 2. إظهار رسالة نجاح
        showToast(currentLang === 'ar' ? 'تم تحديث حالة الحجز بنجاح' : 'Booking status updated successfully', 'success');

        // 4. إعادة تحميل بيانات المواعيد لتحديث الواجهة فوراً باستخدام الدالة الآمنة
        const { data: updatedAppointments, error: fetchError } = await supabaseClient
            .rpc('get_doctor_appointments_secure', {
                p_doctor_id: session.doctorId,
                p_session_token: session.sessionToken
            });
            
        if (fetchError) throw fetchError;

        // تحديث البيانات في المتغير العام وإعادة رسم الواجهة
        if (globalDashboardData) {
            globalDashboardData.appointments = updatedAppointments || [];
            renderDashboardUI(globalDashboardData, globalDashboardDoctorId);
        }

    } catch (err) {
        console.error('❌ خطأ في تحديث حالة الحجز:', err);
        showToast(currentLang === 'ar' ? 'خطأ في تحديث الحالة: ' + err.message : 'Error updating status: ' + err.message, 'error');
    }
};
// ✅ فتح النافذة الاحترافية وإعادة ضبط حقل العين
function handleChangePassword() {
  const input = document.getElementById('newPasswordInput');
  const icon = document.getElementById('eyeIconModal');
  
  // 1. تفريغ الحقل
  input.value = ''; 
  
  // 2. إعادة الحقل لوضع الإخفاء الافتراضي (تجنباً لبقاء العين مفتوحة من عملية سابقة)
  if (input && icon) {
    input.type = 'password';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    icon.style.color = 'var(--text-secondary)';
  }

  // 3. إظهار النافذة
  document.getElementById('changePasswordModal').classList.remove('hidden');
  input.focus();
}

// ✅ إغلاق النافذة
function closeChangePasswordModal() {
  document.getElementById('changePasswordModal').classList.add('hidden');
}

// ✅ إرسال كلمة المرور الجديدة (مع زر انتظار Loading)
async function submitNewPassword() {
  const newPassword = document.getElementById('newPasswordInput').value;
  
  if (!newPassword || newPassword.length < 6) {
    showToast(currentLang === 'ar' ? 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل!' : 'Password must be at least 6 characters!', 'error');
    return;
  }

  const btn = document.getElementById('saveNewPasswordBtn');
  setLoading(btn, true);

  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    showToast(currentLang === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully', 'success');
    closeChangePasswordModal();
  } catch (err) {
    showToast((currentLang === 'ar' ? 'فشل تغيير كلمة المرور: ' : 'Error: ') + err.message, 'error');
  } finally {
    setLoading(btn, false, currentLang === 'ar' ? 'حفظ التغييرات' : 'Save Changes');
  }
}
// ✅ دالة إظهار وإخفاء كلمة المرور
function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  
  if (input.type === 'password') {
    // تحويل الحقل إلى نص (إظهار)
    input.type = 'text';
    // تغيير الأيقونة إلى عين مفتوحة
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    icon.style.color = 'var(--primary)'; // تغيير اللون للدلالة على التفعيل
  } else {
    // تحويل الحقل إلى كلمة مرور (إخفاء)
    input.type = 'password';
    // إرجاع الأيقونة إلى عين مشطوبة
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    icon.style.color = 'var(--text-secondary)';
  }
}
// ✅ دالة مساعدة لتحويل الصورة إلى Base64 قبل إرسالها لـ Edge Function
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            name: file.name,
            base64: reader.result.split(',')[1] // أخذ النص المشفر فقط
        });
        reader.onerror = error => reject(error);
    });
};

// ✅ دالة حفظ ملف العيادة (باستخدام GitHub Edge Function)
window.saveClinicProfile = async function() {
    const sessionStr = localStorage.getItem('doctorSession');
    if (!sessionStr) return;
    const session = JSON.parse(sessionStr);

    const btn = document.getElementById('saveProfileBtn');
    setLoading(btn, true, 'جاري الحفظ...');

    try {
        // 1. تجميع الخدمات
        const formattedServices = [];
        document.querySelectorAll('.service-row').forEach(row => {
            const category = row.querySelector('.svc-category').value.trim();
            const itemsStr = row.querySelector('.svc-items').value.trim();
            if (category || itemsStr) {
                formattedServices.push({
                    category: category || 'خدمات عامة',
                    items: itemsStr ? itemsStr.split(/[,،]/).map(i => i.trim()).filter(Boolean) : []
                });
            }
        });

        const certificatesText = document.getElementById('dash_certificates') ? document.getElementById('dash_certificates').value.trim() : '';
        let finalImageUrls = globalDashboardData.doctorDetails?.clinic_images || [];

        // 2. معالجة الصور (رفع إلى GitHub إذا وجد ملفات جديدة)
        const fileInput = document.getElementById('dash_clinic_images');
        if (fileInput && fileInput.files.length > 0) {
            const filesToUpload = Array.from(fileInput.files).slice(0, 3);
            const base64Images = await Promise.all(filesToUpload.map(async file => {
                return {
                    name: file.name,
                    base64: await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result.split(',')[1]);
                        reader.readAsDataURL(file);
                    })
                };
            }));

            // رفع الصور باستخدام الـ Edge Function
            const { data, error } = await supabaseClient.functions.invoke('upload-github-images', {
                body: { doctorId: session.doctorId, images: base64Images }
            });

            if (error) throw new Error("فشل رفع الصور: " + error.message);
            
            if (data && data.urls) {
                finalImageUrls = [...finalImageUrls, ...data.urls];
            }
        }

        // 3. تحديث قاعدة البيانات
        const contactEmail = document.getElementById('dash_contact_email').value.trim();
        const whatsapp = document.getElementById('dash_whatsapp').value.trim();
        const facebook = document.getElementById('dash_facebook').value.trim();
        const mapLink = document.getElementById('dash_map_link').value.trim();

        const { error: dbError } = await supabaseClient.rpc('update_clinic_profile_secure', {
            p_doctor_id: session.doctorId,
            p_session_token: session.sessionToken,
            p_contact_email: contactEmail,
            p_whatsapp_number: whatsapp,
            p_facebook_link: facebook,
            p_map_link: mapLink,
            p_services: formattedServices,
            p_certificates: certificatesText,
            p_clinic_images: finalImageUrls
        });

        if (dbError) throw dbError;

        // 4. تحديث المصفوفة المحلية
        const docIndex = allDoctors.findIndex(d => d.id === session.doctorId);
        if (docIndex > -1) {
            allDoctors[docIndex] = { 
                ...allDoctors[docIndex], 
                contact_email: contactEmail,
                whatsapp_number: whatsapp,
                facebook_link: facebook,
                map_link: mapLink,
                services: formattedServices,
                certificates: certificatesText,
                clinic_images: finalImageUrls
            };
        }

        showToast('تم حفظ الملف بنجاح!', 'success');
        location.reload(); 

    } catch (err) {
        console.error("خطأ الحفظ:", err);
        showToast('خطأ: ' + err.message, 'error');
    } finally {
        setLoading(btn, false, 'حفظ التغييرات');
        if (fileInput) fileInput.value = '';
    }
};
window.addServiceCategory = function(category = '', items = '') {
    const container = document.getElementById('servicesContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'service-row';
    row.style.cssText = 'display: flex; gap: 0.5rem; align-items: flex-start; background: var(--bg); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border);';
    row.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
            <input type="text" class="svc-category" placeholder="${t('catNamePh')}" value="${escapeHtml(category)}">
            <input type="text" class="svc-items" placeholder="${t('svcItemsPh')}" value="${escapeHtml(items)}">
        </div>
        <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="padding: 0.5rem; color: var(--danger); border-color: var(--danger);" title="حذف">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
    `;
    container.appendChild(row);
};
// ✅ دالة التبديل الاحتياطي المستقرة لرموز QR
window.handleQrError = function(img) {
    if(!img.dataset.fallback){
        img.dataset.fallback = '1';
        img.src = img.dataset.fallbackUrl;
    }
};
// ✅ دالة تحريك السلايدر يدوياً عبر الأزرار
window.moveClinicSlide = function(sliderId, direction) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    const scrollAmount = slider.clientWidth * direction;
    slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
};

// ✅ دالة التشغيل التلقائي وتحديث النقاط
window.initClinicSlider = function(sliderId, docId, imagesCount) {
    const slider = document.getElementById(sliderId);
    if (!slider || imagesCount <= 1) return;

    let currentIndex = 0;
    const dots = document.querySelectorAll(`.slide-dot-${docId}`);

    // تحديث النقاط عند التمرير باللمس أو الماوس
    slider.addEventListener('scroll', () => {
        const newIndex = Math.round(slider.scrollLeft / slider.clientWidth);
        if (newIndex !== currentIndex && newIndex < imagesCount && newIndex >= 0) {
            currentIndex = newIndex;
            dots.forEach((dot, i) => {
                dot.style.background = i === currentIndex ? 'white' : 'rgba(255,255,255,0.4)';
            });
        }
    });

    // التشغيل التلقائي كل 3 ثواني
    let autoPlay = setInterval(() => {
        // إيقاف مؤقت إذا كان مؤشر الماوس فوق الصور
        if (slider.matches(':hover')) return; 
        
        if (currentIndex >= imagesCount - 1) {
            slider.scrollTo({ left: 0, behavior: 'smooth' }); // العودة للبداية
        } else {
            slider.scrollBy({ left: slider.clientWidth, behavior: 'smooth' }); // الصورة التالية
        }
    }, 3000);
};
