// ===================================
// 🌙 الوضع الليلي
// ===================================
const darkModeToggle = document.getElementById('darkModeToggle');
const html = document.documentElement;

if (localStorage.getItem('darkMode') === 'true') {
    html.classList.add('dark');
}

darkModeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('darkMode', html.classList.contains('dark'));
});

// ===================================
// 📅 أسماء الشهور (لهجة جزائرية)
// ===================================
const months = [
    'جانفي', 'فيفري', 'مارس', 'أبريل', 'ماي', 'جوان',
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// ===================================
// 📅 بيانات تطور الجنين أسبوعياً
// ===================================
const fetalDevelopment = {
    1: { fruit: "🌸", fruitName: "بداية الدورة", size: "0", weight: "0", description: "الأسبوع الأول من الحمل يُحسب من أول يوم في آخر دورة شهرية. لم يحدث الحمل بعد فعلياً" },
    2: { fruit: "🥚", fruitName: "بويضة", size: "0.01", weight: "0", description: "يستعد الجسم للإباضة. تخرج بويضة ناضجة من المبيض في نهاية هذا الأسبوع" },
    3: { fruit: "✨", fruitName: "خلية مخصبة", size: "0.01", weight: "0", description: "يحدث الإخصاب وتبدأ البويضة المخصبة بالانقسام والتوجه نحو الرحم للانغراس" },
    4: { fruit: "🫐", fruitName: "حبة توت", size: "0.1", weight: "0.01", description: "يبدأ تكوين الكيس الأمنيوسي وبدء تطور الجهاز العصبي" },
    5: { fruit: "🌰", fruitName: "بذرة سمسم", size: "0.2", weight: "0.02", description: "يبدأ تشكل القلب والدماغ والحبل الشوكي" },
    6: { fruit: "🫘", fruitName: "عدسة", size: "0.5", weight: "0.05", description: "تبدأ ملامح الوجه بالتشكل وتظهر براعم الأطراف" },
    7: { fruit: "🫐", fruitName: "توتة زرقاء", size: "1.3", weight: "0.5", description: "يبدأ نمو الدماغ بسرعة وتتشكل العيون والأذنين" },
    8: { fruit: "🍓", fruitName: "فراولة", size: "1.6", weight: "1", description: "تتطور الأصابع وتبدأ حركات الجنين الأولى" },
    9: { fruit: "🍒", fruitName: "حبّة كرز", size: "2.3", weight: "2", description: "تتطور الأعضاء الحيوية وتبدأ الأظافر بالتشكل" },
    10: { fruit: "🍊", fruitName: "كمكوات", size: "3.1", weight: "4", description: "ينمو الجنين بسرعة وتتشكل الأعضاء التناسلية" },
    11: { fruit: "🍋", fruitName: "ليمونة", size: "4.1", weight: "7", description: "تتطور بصمات الأصابع وتبدأ العظام بالتصلب" },
    12: { fruit: "🍑", fruitName: "خوخة", size: "5.4", weight: "14", description: "تتطور ردود الفعل ويمكن للجنين فتح وإغلاق قبضة يديه" },
    13: { fruit: "🍊", fruitName: "برتقالة", size: "7.4", weight: "23", description: "تتطور الحبال الصوتية وتبدأ البصمات الفريدة بالتشكل" },
    14: { fruit: "🍋", fruitName: "ليمونة كبيرة", size: "8.7", weight: "43", description: "تتطور تعابير الوجه ويمكن للجنين المص والبلع" },
    15: { fruit: "🍎", fruitName: "تفاحة", size: "10", weight: "70", description: "يمكن للجنين سماع الأصوات من الخارج" },
    16: { fruit: "🍐", fruitName: "كمثرى", size: "11.6", weight: "100", description: "تتطور حاسة التذوق وتبدأ الحركات التنفسية" },
    17: { fruit: "🥑", fruitName: "أفوكادو", size: "13", weight: "140", description: "يتطور النسيج الدهني وتصبح الحركات أكثر تناسقاً" },
    18: { fruit: "🫑", fruitName: "فلفل رومي", size: "14.2", weight: "190", description: "تتطور الأذنين بشكل كامل ويمكن سماع دقات القلب" },
    19: { fruit: "🥭", fruitName: "مانجو", size: "15.3", weight: "240", description: "تتطور الحواس الخمس وتبدأ الحواجب والرموش بالنمو" },
    20: { fruit: "🍌", fruitName: "موزة", size: "16.4", weight: "300", description: "نصف رحلة الحمل! الجنين يصبح أكثر نشاطاً" },
    21: { fruit: "🥕", fruitName: "جزرة", size: "26.7", weight: "360", description: "تتطور الحواجب وتبدأ الجفون بالتشكل" },
    22: { fruit: "🌽", fruitName: "ذرة", size: "27.8", weight: "430", description: "يتطور الشعر على الرأس وتتشكل الرموش" },
    23: { fruit: "🍊", fruitName: "جريب فروت", size: "28.9", weight: "500", description: "تتطور الرئتان وتبدأ بإنتاج المادة الفعالة سطحياً" },
    24: { fruit: "🌽", fruitName: "ذرة حلوة", size: "30", weight: "600", description: "تتطور حاسة السمع بشكل كامل ويستجيب للأصوات" },
    25: { fruit: "🍆", fruitName: "باذنجان", size: "34.6", weight: "660", description: "تتطور الرئتان وتبدأ بإنتاج المادة الفعالة سطحياً" },
    26: { fruit: "🥒", fruitName: "خيارة", size: "35.6", weight: "760", description: "تفتح العيون ويستجيب الجنين للضوء" },
    27: { fruit: "🥦", fruitName: "قرنبيط", size: "36.6", weight: "875", description: "يتطور الدماغ بسرعة وتنتظم دورات النوم والاستيقاظ" },
    28: { fruit: "🥬", fruitName: "خس", size: "37.6", weight: "1005", description: "بداية الثلث الثالث! الجنين يحلم ويبدأ بتخزين الدهون" },
    29: { fruit: "🥬", fruitName: "خس كبير", size: "38.6", weight: "1153", description: "تتطور العضلات والرئتان وتزداد الحركات" },
    30: { fruit: "🥬", fruitName: "ملفوف", size: "39.9", weight: "1319", description: "يتطور نخاع العظم وتبدأ كريات الدم الحمراء بالتشكل" },
    31: { fruit: "🥥", fruitName: "جوزة هند", size: "41.1", weight: "1502", description: "تتطور الاتصالات العصبية في الدماغ بسرعة" },
    32: { fruit: "🍍", fruitName: "أناناس", size: "42.4", weight: "1702", description: "تتطور الأظافر بالكامل ويبدأ الشعر بالنمو" },
    33: { fruit: "🍍", fruitName: "أناناس كبير", size: "43.7", weight: "1918", description: "تتطور العظام وتتصلب باستثناء جمجمة الرأس" },
    34: { fruit: "🥥", fruitName: "جوزة هند كبيرة", size: "45", weight: "2146", description: "تتطور الرئتان بشكل شبه كامل" },
    35: { fruit: "🍈", fruitName: "شمام", size: "46.2", weight: "2383", description: "يتطور الكبد والجهاز المناعي" },
    36: { fruit: "🍈", fruitName: "شمام كبير", size: "47.4", weight: "2622", description: "تتطور قبضة اليد ويصبح الجنين مستعداً للولادة" },
    37: { fruit: "🍉", fruitName: "بطيخة صغيرة", size: "48.6", weight: "2859", description: "الحمل في مرحلة المكتمل المبكر. الجنين مستعد للحياة خارج الرحم" },
    38: { fruit: "🍉", fruitName: "بطيخة متوسطة", size: "49.8", weight: "3100", description: "يستمر النضج النهائي للدماغ والرئتين، والجنين جاهز للولادة" },
    39: { fruit: "🍉", fruitName: "بطيخة كبيرة", size: "50.7", weight: "3300", description: "الجنين مكتمل النمو تماماً، والولادة يمكن أن تحدث في أي لحظة" },
    40: { fruit: "🍉", fruitName: "بطيخة كاملة", size: "51.2", weight: "3500", description: "موعد الولادة! الجنين مكتمل النمو تماماً" },
};

// ===================================
// 💡 نصائح طبية حسب المرحلة
// ===================================
const medicalTips = {
    first: [
        { icon: "💊", text: "تناولي حمض الفوليك يومياً (400-800 ميكروغرام)" },
        { icon: "🥗", text: "تناولي وجبات صحية متوازنة غنية بالفيتامينات" },
        { icon: "💧", text: "اشربي 8-10 أكواب من الماء يومياً" },
        { icon: "🚫", text: "تجنبي الكافيين والكحول والتدخين" },
        { icon: "😴", text: "احصلي على قسط كافٍ من الراحة والنوم" },
        { icon: "🏃‍♀️", text: "مارسي تمارين خفيفة مثل المشي بعد استشارة الطبيب" },
        { icon: "📖", text: "أكثري من قراءة القرآن والاستماع إليه لتهدئة النفس" },
        { icon: "🤲", text: "أكثري من الدعاء والذكر وطلب الحفظ من الله" },
    ],
    second: [
        { icon: "🥛", text: "زيادة تناول الكالسيوم والحديد" },
        { icon: "👶", text: "ابدئي بالحديث مع جنينك وقراءة القرآن له" },
        { icon: "🧘‍♀️", text: "مارسي تمارين كيجل لتقوية عضلات الحوض" },
        { icon: "📚", text: "ابدئي بالقراءة عن الولادة والعناية بالمولود" },
        { icon: "👗", text: "ارتدي ملابس مريحة وفضفاضة" },
        { icon: "🕌", text: "حافظي على الصلاة والذكر والدعاء للجنين" },
    ],
    third: [
        { icon: "🏥", text: "جهزي حقيبة المستشفى مبكراً" },
        { icon: "🚗", text: "ركبي مقعد الطفل في السيارة" },
        { icon: "📋", text: "تعرفي على علامات الولادة المبكرة" },
        { icon: "🤱", text: "تعلمي عن الرضاعة الطبيعية وأحكامها" },
        { icon: "🛏️", text: "نامي على جانبك الأيسر لتحسين الدورة الدموية" },
        { icon: "📞", text: "احتفظي برقم الطوارئ الطبي قريباً" },
        { icon: "🤲", text: "أكثري من الدعاء بولادة سهلة وميسرة" },
    ]
};

// ===================================
// 📝 دوال تنسيق التاريخ
// ===================================
const formatDate = (date) => {
    const days = [
        'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
    ];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}، ${day} ${month} ${year}`;
};

const formatDateShort = (date) => {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
};

// ===================================
// 🚀 المنطق الرئيسي
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    
    // ✅ ملء قوائم التاريخ (داخل DOMContentLoaded)
    const daySelect = document.getElementById('day');
    const monthSelect = document.getElementById('month');
    const yearSelect = document.getElementById('year');
    
    // ملء قائمة الأيام (1-31)
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }
    
    // ملء قائمة الشهور (1-12)
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    
    // ملء قائمة السنوات (السنة الحالية والسنة السابقة)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 1; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    
    // تحديد التاريخ الافتراضي (أمس)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    daySelect.value = yesterday.getDate();
    monthSelect.value = yesterday.getMonth() + 1;
    yearSelect.value = yesterday.getFullYear();
    
    // ===================================
    // 📊 معالجة النموذج
    // ===================================
    const form = document.getElementById('calcForm');
    const ONE_DAY = 1000 * 60 * 60 * 24;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // استخراج المدخلات
        const day = parseInt(document.getElementById('day').value);
        const month = parseInt(document.getElementById('month').value);
        const year = parseInt(document.getElementById('year').value);
        const cycleLength = parseInt(document.getElementById('cycle').value);

        // التحقق من المدخلات
        if (!day || !month || !year || isNaN(cycleLength)) {
            alert('الرجاء إدخال جميع البيانات المطلوبة');
            return;
        }

        // إنشاء تاريخ من القيم المختارة
        const lmpDate = new Date(year, month - 1, day);
        const today = new Date();

        // التحقق من صحة التاريخ
        if (lmpDate > today) {
            alert('لا يمكن أن يكون تاريخ آخر دورة في المستقبل');
            return;
        }

        // التحقق من أن التاريخ ليس قديماً جداً
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (lmpDate < oneYearAgo) {
            alert('الرجاء التأكد من صحة التاريخ المدخل');
            return;
        }

        // الحسابات الطبية
        const cycleAdjustment = cycleLength - 28;

        // يوم التبويض/الإخصاب
        const conceptionTime = lmpDate.getTime() + ((14 + cycleAdjustment) * ONE_DAY);
        const conceptionDate = new Date(conceptionTime);

        // موعد الولادة المتوقع
        const eddTime = lmpDate.getTime() + ((280 + cycleAdjustment) * ONE_DAY);
        const eddDate = new Date(eddTime);

        // حساب عمر الحمل الحالي
        let diffDays = Math.floor((today - lmpDate) / ONE_DAY);

        if (diffDays < 0) diffDays = 0;
        if (diffDays > 294) diffDays = 294;

        const currentWeek = Math.floor(diffDays / 7);
        const currentDay = diffDays % 7;

        // حساب نسبة التقدم
        const progressPercentage = Math.min(100, Math.max(0, (diffDays / 280) * 100));

        // تحديد ثلث الحمل
        let trimester = "الأول (أسابيع 1-13)";
        let trimesterKey = "first";
        if (currentWeek >= 14 && currentWeek <= 27) {
            trimester = "الثاني (أسابيع 14-27)";
            trimesterKey = "second";
        } else if (currentWeek >= 28) {
            trimester = "الثالث (أسابيع 28-40+)";
            trimesterKey = "third";
        }

        // عرض النتائج
        document.getElementById('eddResult').innerText = formatDate(eddDate);
        document.getElementById('conceptionDate').innerText = formatDate(conceptionDate);

        // نافذة التبويض
        const ovulationStart = new Date(conceptionTime - (2 * ONE_DAY));
        const ovulationEnd = new Date(conceptionTime + (1 * ONE_DAY));
        document.getElementById('ovulationDate').innerText =
            `${formatDateShort(ovulationStart)} - ${formatDateShort(ovulationEnd)}`;

        document.getElementById('gestationalAge').innerText = `${currentWeek} أسبوع و ${currentDay} أيام`;
        document.getElementById('trimester').innerText = trimester;

        // العداد التنازلي
        const daysUntilBirth = Math.max(0, Math.floor((eddDate - today) / ONE_DAY));
        const weeksUntilBirth = Math.floor(daysUntilBirth / 7);
        const monthsUntilBirth = Math.floor(daysUntilBirth / 30);
        const hoursUntilBirth = Math.max(0, Math.floor(((eddDate - today) / (1000 * 60 * 60))));

        document.getElementById('countdownDays').innerText = daysUntilBirth;
        document.getElementById('countdownWeeks').innerText = weeksUntilBirth;
        document.getElementById('countdownMonths').innerText = monthsUntilBirth;
        document.getElementById('countdownHours').innerText = hoursUntilBirth;

        // تطور الجنين
        const weekData = fetalDevelopment[Math.min(40, Math.max(1, currentWeek))] || fetalDevelopment[20];
        document.getElementById('fruitIcon').innerText = weekData.fruit;
        document.getElementById('fruitName').innerText = `بحجم ${weekData.fruitName}`;
        document.getElementById('weekTitle').innerText = `الأسبوع ${currentWeek}`;
        document.getElementById('weekDescription').innerText = weekData.description;
        document.getElementById('babySize').innerText = `الطول: ${weekData.size} سم`;
        document.getElementById('babyWeight').innerText = `الوزن: ${weekData.weight} غرام`;

        // النصائح الطبية
        const tipsContainer = document.getElementById('medicalTips');
        tipsContainer.innerHTML = '';
        medicalTips[trimesterKey].forEach(tip => {
            const tipElement = document.createElement('div');
            tipElement.className = 'flex items-start gap-4 bg-gradient-to-br from-primary-50 to-pink-50 dark:from-primary-900/20 dark:to-pink-900/20 p-4 rounded-xl hover-lift';
            tipElement.innerHTML = `
                <div class="text-3xl">${tip.icon}</div>
                <p class="text-gray-700 dark:text-gray-300 flex-1">${tip.text}</p>
            `;
            tipsContainer.appendChild(tipElement);
        });

        // تحديث شريط التقدم
        setTimeout(() => {
            document.getElementById('progressBar').style.width = `${progressPercentage}%`;
            document.getElementById('progressText').innerText = `${Math.floor(progressPercentage)}%`;
        }, 100);

        // حفظ البيانات
        localStorage.setItem('pregnancyData', JSON.stringify({
            day: day,
            month: month,
            year: year,
            cycle: cycleLength,
            edd: eddDate.toISOString(),
            savedAt: new Date().toISOString()
        }));

        // إظهار قسم النتائج
        document.getElementById('resultsArea').classList.remove('hidden');

        // تمرير الشاشة
        setTimeout(() => {
            document.getElementById('resultsArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    });

    // ===================================
    // 💾 تحميل البيانات المحفوظة
    // ===================================
    const savedData = localStorage.getItem('pregnancyData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            if (data.day) daySelect.value = data.day;
            if (data.month) monthSelect.value = data.month;
            if (data.year) yearSelect.value = data.year;
            if (data.cycle) document.getElementById('cycle').value = data.cycle;
        } catch (e) {
            console.error('خطأ في تحميل البيانات المحفوظة');
        }
    }
});
