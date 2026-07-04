// ===== MEDICAL DATA =====
const medicalData = [
    // === العلامات الحيوية ===
    {
        id: 'blood-pressure',
        category: 'vital',
        title: 'ضغط الدم',
        subtitle: 'Blood Pressure',
        icon: 'fas fa-heartbeat',
        color: '#ef4444',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '120/80',
        unit: 'mmHg',
        percentage: 75,
        rangeMin: '90/60',
        rangeMax: '140/90',
        details: [
            { label: 'الانقباضي', value: '90 - 120', small: 'mmHg' },
            { label: 'الانبساطي', value: '60 - 80', small: 'mmHg' },
            { label: 'مرتفع قليلاً', value: '120-139 / 80-89', small: '' },
            { label: 'ارتفاع ضغط', value: '≥140 / ≥90', small: '' }
        ],
        note: 'يُقاس بعد الراحة لمدة 5 دقائق. يتأثر بالتوتر والكافيين والنشاط البدني.'
    },
    {
        id: 'heart-rate',
        category: 'vital',
        title: 'معدل ضربات القلب',
        subtitle: 'Heart Rate',
        icon: 'fas fa-heart',
        color: '#ec4899',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '72',
        unit: 'نبضة/دقيقة',
        percentage: 72,
        rangeMin: '60',
        rangeMax: '100',
        details: [
            { label: 'أثناء الراحة', value: '60 - 100', small: 'نبضة/د' },
            { label: 'للرياضيين', value: '40 - 60', small: 'نبضة/د' },
            { label: 'أثناء النوم', value: '40 - 50', small: 'نبضة/د' },
            { label: 'أثناء التمرين', value: '100 - 180', small: 'نبضة/د' }
        ],
        note: 'يختلف حسب العمر واللياقة البدنية. يُقاس من الرسغ أو الرقبة.'
    },
    {
        id: 'temperature',
        category: 'vital',
        title: 'درجة حرارة الجسم',
        subtitle: 'Body Temperature',
        icon: 'fas fa-thermometer-half',
        color: '#f97316',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '37',
        unit: '°C',
        percentage: 74,
        rangeMin: '36.1',
        rangeMax: '37.2',
        details: [
            { label: 'طبيعي', value: '36.1 - 37.2', small: '°C' },
            { label: 'حمى خفيفة', value: '37.3 - 38.0', small: '°C' },
            { label: 'حمى', value: '38.1 - 39.0', small: '°C' },
            { label: 'حمى عالية', value: '> 39.0', small: '°C' }
        ],
        note: 'تختلف حسب وقت القياس ومكانه. تكون أقل في الصباح وأعلى مساءً.'
    },
    {
        id: 'respiratory-rate',
        category: 'vital',
        title: 'معدل التنفس',
        subtitle: 'Respiratory Rate',
        icon: 'fas fa-lungs',
        color: '#06b6d4',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '16',
        unit: 'نفس/دقيقة',
        percentage: 64,
        rangeMin: '12',
        rangeMax: '20',
        details: [
            { label: 'البالغين', value: '12 - 20', small: 'نفس/د' },
            { label: 'الأطفال', value: '15 - 30', small: 'نفس/د' },
            { label: 'الرضع', value: '30 - 60', small: 'نفس/د' },
            { label: 'كبار السن', value: '12 - 28', small: 'نفس/د' }
        ],
        note: 'يُقاس في حالة الراحة التامة. يتأثر بالنشاط البدني والارتفاع عن سطح البحر.'
    },
    {
        id: 'oxygen-saturation',
        category: 'vital',
        title: 'تشبع الأكسجين',
        subtitle: 'Oxygen Saturation (SpO2)',
        icon: 'fas fa-wind',
        color: '#3b82f6',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '98',
        unit: '%',
        percentage: 98,
        rangeMin: '95',
        rangeMax: '100',
        details: [
            { label: 'طبيعي', value: '95 - 100', small: '%' },
            { label: 'مقبول', value: '90 - 94', small: '%' },
            { label: 'منخفض', value: '< 90', small: '%' },
            { label: 'حرج', value: '< 85', small: '%' }
        ],
        note: 'يُقاس بجهاز قياس النبض (Pulse Oximeter). أقل من 90% يتطلب تدخلاً طبياً.'
    },

    // === تحاليل الدم ===
    {
        id: 'hemoglobin',
        category: 'blood',
        title: 'الهيموجلوبين',
        subtitle: 'Hemoglobin (Hb)',
        icon: 'fas fa-tint',
        color: '#dc2626',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '14',
        unit: 'g/dL',
        percentage: 70,
        rangeMin: '12',
        rangeMax: '17.5',
        details: [
            { label: 'الرجال', value: '13.5 - 17.5', small: 'g/dL' },
            { label: 'النساء', value: '12.0 - 15.5', small: 'g/dL' },
            { label: 'الأطفال', value: '11.0 - 13.5', small: 'g/dL' },
            { label: 'الحوامل', value: '11.0 - 14.0', small: 'g/dL' }
        ],
        note: 'انخفاض الهيموجلوبين يدل على فقر الدم. يرتفع عند التدخين والعيش في المرتفعات.'
    },
    {
        id: 'wbc',
        category: 'blood',
        title: 'كريات الدم البيضاء',
        subtitle: 'White Blood Cells (WBC)',
        icon: 'fas fa-shield-virus',
        color: '#8b5cf6',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '7.0',
        unit: '×10³/µL',
        percentage: 60,
        rangeMin: '4.5',
        rangeMax: '11.0',
        details: [
            { label: 'الطبيعي', value: '4,500 - 11,000', small: '/µL' },
            { label: 'العدلات', value: '40 - 60', small: '%' },
            { label: 'اللمفاويات', value: '20 - 40', small: '%' },
            { label: 'الوحيدات', value: '2 - 8', small: '%' }
        ],
        note: 'ترتفع عند العدوى والالتهابات. تنخفض في حالات نقص المناعة وبعض الأدوية.'
    },
    {
        id: 'rbc',
        category: 'blood',
        title: 'كريات الدم الحمراء',
        subtitle: 'Red Blood Cells (RBC)',
        icon: 'fas fa-circle',
        color: '#ef4444',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '5.0',
        unit: '×10⁶/µL',
        percentage: 72,
        rangeMin: '4.0',
        rangeMax: '5.9',
        details: [
            { label: 'الرجال', value: '4.7 - 6.1', small: '×10⁶/µL' },
            { label: 'النساء', value: '4.2 - 5.4', small: '×10⁶/µL' },
            { label: 'الأطفال', value: '4.0 - 5.5', small: '×10⁶/µL' },
            { label: 'عمر الخلية', value: '120', small: 'يوم' }
        ],
        note: 'تنتج في نخاع العظام. تنخفض في حالات فقر الدم والنزيف.'
    },
    {
        id: 'platelets',
        category: 'blood',
        title: 'الصفائح الدموية',
        subtitle: 'Platelets',
        icon: 'fas fa-droplet',
        color: '#f59e0b',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '250',
        unit: '×10³/µL',
        percentage: 62,
        rangeMin: '150',
        rangeMax: '400',
        details: [
            { label: 'الطبيعي', value: '150 - 400', small: '×10³/µL' },
            { label: 'انخفاض خفيف', value: '100 - 150', small: '×10³/µL' },
            { label: 'انخفاض شديد', value: '< 50', small: '×10³/µL' },
            { label: 'ارتفاع', value: '> 450', small: '×10³/µL' }
        ],
        note: 'مسؤولة عن تخثر الدم. انخفاضها يسبب النزيف وارتفاعها يزيد خطر الجلطات.'
    },
    {
        id: 'esr',
        category: 'blood',
        title: 'سرعة ترسب الدم',
        subtitle: 'ESR (Erythrocyte Sedimentation Rate)',
        icon: 'fas fa-hourglass-half',
        color: '#f97316',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '10',
        unit: 'mm/hr',
        percentage: 30,
        rangeMin: '0',
        rangeMax: '20',
        details: [
            { label: 'الرجال < 50', value: '0 - 15', small: 'mm/hr' },
            { label: 'الرجال > 50', value: '0 - 20', small: 'mm/hr' },
            { label: 'النساء < 50', value: '0 - 20', small: 'mm/hr' },
            { label: 'النساء > 50', value: '0 - 30', small: 'mm/hr' }
        ],
        note: 'مؤشر غير نوعي للالتهابات. يرتفع في العدوى والأمراض الروماتيزمية.'
    },

    // === الأيض والكيمياء ===
    {
        id: 'blood-sugar',
        category: 'metabolic',
        title: 'سكر الدم (صائم)',
        subtitle: 'Fasting Blood Glucose',
        icon: 'fas fa-candy-cane',
        color: '#f59e0b',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '90',
        unit: 'mg/dL',
        percentage: 65,
        rangeMin: '70',
        rangeMax: '100',
        details: [
            { label: 'طبيعي (صائم)', value: '70 - 100', small: 'mg/dL' },
            { label: 'ما قبل السكري', value: '100 - 125', small: 'mg/dL' },
            { label: 'سكري', value: '≥ 126', small: 'mg/dL' },
            { label: 'بعد الأكل بساعتين', value: '< 140', small: 'mg/dL' }
        ],
        note: 'يُقاس بعد صيام 8-12 ساعة. التراكمي (HbA1c) الطبيعي أقل من 5.7%.'
    },
    {
        id: 'hba1c',
        category: 'metabolic',
        title: 'السكر التراكمي',
        subtitle: 'HbA1c',
        icon: 'fas fa-chart-line',
        color: '#10b981',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '5.4',
        unit: '%',
        percentage: 54,
        rangeMin: '4.0',
        rangeMax: '5.7',
        details: [
            { label: 'طبيعي', value: '< 5.7', small: '%' },
            { label: 'ما قبل السكري', value: '5.7 - 6.4', small: '%' },
            { label: 'سكري', value: '≥ 6.5', small: '%' },
            { label: 'هدف لمرضى السكري', value: '< 7.0', small: '%' }
        ],
        note: 'يعكس متوسط السكر خلال 2-3 أشهر. لا يتأثر بالطعام في يوم التحليل.'
    },
    {
        id: 'cholesterol',
        category: 'metabolic',
        title: 'الكوليسترول الكلي',
        subtitle: 'Total Cholesterol',
        icon: 'fas fa-vial',
        color: '#8b5cf6',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '180',
        unit: 'mg/dL',
        percentage: 60,
        rangeMin: '125',
        rangeMax: '200',
        details: [
            { label: 'مرغوب', value: '< 200', small: 'mg/dL' },
            { label: 'حدّي', value: '200 - 239', small: 'mg/dL' },
            { label: 'مرتفع', value: '≥ 240', small: 'mg/dL' },
            { label: 'LDL (الضار)', value: '< 100', small: 'mg/dL' }
        ],
        note: 'يُقاس بعد صيام 12 ساعة. يشمل LDL وHDL والدهون الثلاثية.'
    },
    {
        id: 'triglycerides',
        category: 'metabolic',
        title: 'الدهون الثلاثية',
        subtitle: 'Triglycerides',
        icon: 'fas fa-oil-can',
        color: '#ec4899',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '120',
        unit: 'mg/dL',
        percentage: 48,
        rangeMin: '50',
        rangeMax: '150',
        details: [
            { label: 'طبيعي', value: '< 150', small: 'mg/dL' },
            { label: 'حدّي', value: '150 - 199', small: 'mg/dL' },
            { label: 'مرتفع', value: '200 - 499', small: 'mg/dL' },
            { label: 'مرتفع جداً', value: '≥ 500', small: 'mg/dL' }
        ],
        note: 'ترتفع مع السمنة والسكري والإفراط في الكربوهيدرات والكحول.'
    },
    {
        id: 'uric-acid',
        category: 'metabolic',
        title: 'حمض اليوريك',
        subtitle: 'Uric Acid',
        icon: 'fas fa-bolt',
        color: '#f97316',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '5.5',
        unit: 'mg/dL',
        percentage: 55,
        rangeMin: '3.5',
        rangeMax: '7.2',
        details: [
            { label: 'الرجال', value: '3.4 - 7.0', small: 'mg/dL' },
            { label: 'النساء', value: '2.4 - 6.0', small: 'mg/dL' },
            { label: 'الأطفال', value: '2.0 - 5.5', small: 'mg/dL' },
            { label: 'خطر النقرس', value: '> 7.0', small: 'mg/dL' }
        ],
        note: 'ارتفاعه يسبب النقرس وحصى الكلى. يتأثر بالأطعمة الغنية بالبيورين.'
    },

    // === وظائف الأعضاء ===
    {
        id: 'creatinine',
        category: 'organ',
        title: 'الكرياتينين',
        subtitle: 'Creatinine',
        icon: 'fas fa-kidneys',
        color: '#06b6d4',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '1.0',
        unit: 'mg/dL',
        percentage: 50,
        rangeMin: '0.7',
        rangeMax: '1.3',
        details: [
            { label: 'الرجال', value: '0.7 - 1.3', small: 'mg/dL' },
            { label: 'النساء', value: '0.6 - 1.1', small: 'mg/dL' },
            { label: 'الأطفال', value: '0.3 - 0.7', small: 'mg/dL' },
            { label: 'GFR الطبيعي', value: '> 90', small: 'mL/min' }
        ],
        note: 'مؤشر رئيسي لوظائف الكلى. يتأثر بالكتلة العضلية والعمر.'
    },
    {
        id: 'liver-enzymes',
        category: 'organ',
        title: 'إنزيمات الكبد',
        subtitle: 'ALT / AST',
        icon: 'fas fa-liver',
        color: '#10b981',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '25',
        unit: 'U/L',
        percentage: 45,
        rangeMin: '7',
        rangeMax: '56',
        details: [
            { label: 'ALT', value: '7 - 56', small: 'U/L' },
            { label: 'AST', value: '10 - 40', small: 'U/L' },
            { label: 'ALP', value: '44 - 147', small: 'U/L' },
            { label: 'GGT', value: '9 - 48', small: 'U/L' }
        ],
        note: 'ارتفاعها يدل على التهاب أو تلف الكبد. تتأثر بالأدوية والكحول.'
    },
    {
        id: 'albumin',
        category: 'organ',
        title: 'الألبومين',
        subtitle: 'Serum Albumin',
        icon: 'fas fa-flask-vial',
        color: '#3b82f6',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '4.2',
        unit: 'g/dL',
        percentage: 70,
        rangeMin: '3.5',
        rangeMax: '5.5',
        details: [
            { label: 'الطبيعي', value: '3.5 - 5.5', small: 'g/dL' },
            { label: 'البروتين الكلي', value: '6.0 - 8.3', small: 'g/dL' },
            { label: 'نصف العمر', value: '20', small: 'يوم' },
            { label: 'ينتج في', value: 'الكبد', small: '' }
        ],
        note: 'ينخفض في أمراض الكبد والكلى وسوء التغذية.'
    },
    {
        id: 'calcium',
        category: 'organ',
        title: 'الكالسيوم',
        subtitle: 'Serum Calcium',
        icon: 'fas fa-bone',
        color: '#f59e0b',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '9.5',
        unit: 'mg/dL',
        percentage: 68,
        rangeMin: '8.5',
        rangeMax: '10.5',
        details: [
            { label: 'الطبيعي', value: '8.5 - 10.5', small: 'mg/dL' },
            { label: 'المتأين', value: '4.5 - 5.6', small: 'mg/dL' },
            { label: 'الفوسفور', value: '2.5 - 4.5', small: 'mg/dL' },
            { label: 'فيتامين D', value: '30 - 100', small: 'ng/mL' }
        ],
        note: 'أساسي لصحة العظام والأسنان. ينظمه هرمون الغدة الجار درقية.'
    },

    // === الهرمونات ===
    {
        id: 'tsh',
        category: 'hormone',
        title: 'هرمون الغدة الدرقية',
        subtitle: 'TSH (Thyroid Stimulating Hormone)',
        icon: 'fas fa-dna',
        color: '#8b5cf6',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '2.5',
        unit: 'mIU/L',
        percentage: 50,
        rangeMin: '0.4',
        rangeMax: '4.0',
        details: [
            { label: 'TSH', value: '0.4 - 4.0', small: 'mIU/L' },
            { label: 'T4 الحر', value: '0.8 - 1.8', small: 'ng/dL' },
            { label: 'T3 الحر', value: '2.3 - 4.2', small: 'pg/mL' },
            { label: 'أجسام مضادة', value: '< 35', small: 'IU/mL' }
        ],
        note: 'يُنظم الأيض والطاقة. ارتفاع TSH يدل على خمول الغدة الدرقية.'
    },
    {
        id: 'cortisol',
        category: 'hormone',
        title: 'الكورتيزول',
        subtitle: 'Cortisol (هرمون التوتر)',
        icon: 'fas fa-brain',
        color: '#ec4899',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '12',
        unit: 'µg/dL',
        percentage: 60,
        rangeMin: '6',
        rangeMax: '23',
        details: [
            { label: 'صباحاً (8 ص)', value: '6 - 23', small: 'µg/dL' },
            { label: 'مساءً (4 م)', value: '3 - 16', small: 'µg/dL' },
            { label: 'ليلاً', value: '< 7.5', small: 'µg/dL' },
            { label: 'في البول 24س', value: '20 - 90', small: 'µg/24h' }
        ],
        note: 'هرمون التوتر. يتبع إيقاعاً يومياً (أعلى صباحاً). ارتفاعه المزمن ضار بالصحة.'
    },
    {
        id: 'testosterone',
        category: 'hormone',
        title: 'التستوستيرون',
        subtitle: 'Testosterone',
        icon: 'fas fa-mars',
        color: '#3b82f6',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '500',
        unit: 'ng/dL',
        percentage: 55,
        rangeMin: '300',
        rangeMax: '1000',
        details: [
            { label: 'الرجال', value: '300 - 1,000', small: 'ng/dL' },
            { label: 'النساء', value: '15 - 70', small: 'ng/dL' },
            { label: 'الحر (رجال)', value: '9 - 30', small: 'ng/dL' },
            { label: 'SHBG (رجال)', value: '10 - 57', small: 'nmol/L' }
        ],
        note: 'يبلغ ذروته في العشرينات وينخفض تدريجياً. مهم للعضلات والطاقة والمزاج.'
    },
    {
        id: 'vitamin-d',
        category: 'hormone',
        title: 'فيتامين D',
        subtitle: '25-Hydroxyvitamin D',
        icon: 'fas fa-sun',
        color: '#f59e0b',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '45',
        unit: 'ng/mL',
        percentage: 60,
        rangeMin: '30',
        rangeMax: '100',
        details: [
            { label: 'نقص شديد', value: '< 10', small: 'ng/mL' },
            { label: 'نقص', value: '10 - 20', small: 'ng/mL' },
            { label: 'غير كافٍ', value: '20 - 30', small: 'ng/mL' },
            { label: 'كافٍ', value: '30 - 100', small: 'ng/mL' }
        ],
        note: 'ضروري لصحة العظام والمناعة. النقص شائع جداً خاصة في منطقة الشرق الأوسط.'
    },
    {
        id: 'iron-ferritin',
        category: 'blood',
        title: 'مخزون الحديد (الفيريتين)',
        subtitle: 'Ferritin',
        icon: 'fas fa-magnet',
        color: '#ef4444',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '100',
        unit: 'ng/mL',
        percentage: 50,
        rangeMin: '24',
        rangeMax: '336',
        details: [
            { label: 'الرجال', value: '24 - 336', small: 'ng/mL' },
            { label: 'النساء', value: '11 - 307', small: 'ng/mL' },
            { label: 'الحديد', value: '60 - 170', small: 'µg/dL' },
            { label: 'TIBC', value: '250 - 370', small: 'µg/dL' }
        ],
        note: 'أفضل مؤشر لمخزون الحديد في الجسم. ينخفض في فقر الدم بعوز الحديد.'
    },
    {
        id: 'potassium',
        category: 'metabolic',
        title: 'البوتاسيوم',
        subtitle: 'Potassium (K+)',
        icon: 'fas fa-atom',
        color: '#10b981',
        status: 'normal',
        statusText: 'طبيعي',
        normalValue: '4.2',
        unit: 'mEq/L',
        percentage: 65,
        rangeMin: '3.5',
        rangeMax: '5.0',
        details: [
            { label: 'الطبيعي', value: '3.5 - 5.0', small: 'mEq/L' },
            { label: 'نقص خفيف', value: '3.0 - 3.5', small: 'mEq/L' },
            { label: 'ارتفاع خفيف', value: '5.0 - 5.5', small: 'mEq/L' },
            { label: 'الصوديوم', value: '136 - 145', small: 'mEq/L' }
        ],
        note: 'حيوي لوظائف القلب والعضلات. الاختلال الشديد قد يكون مهدداً للحياة.'
    }
];

// ===== CATEGORY CONFIG =====
const categoryConfig = {
    vital: { name: 'العلامات الحيوية', icon: 'fas fa-heartbeat', color: '#ef4444' },
    blood: { name: 'تحاليل الدم', icon: 'fas fa-tint', color: '#dc2626' },
    metabolic: { name: 'الأيض والكيمياء', icon: 'fas fa-flask', color: '#f59e0b' },
    organ: { name: 'وظائف الأعضاء', icon: 'fas fa-lungs', color: '#06b6d4' },
    hormone: { name: 'الهرمونات', icon: 'fas fa-dna', color: '#8b5cf6' }
};

// ===== RENDER FUNCTIONS =====
function createGaugeSVG(percentage, color, value, unit) {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return `
        <svg class="gauge-svg" viewBox="0 0 100 100">
            <circle class="gauge-bg" cx="50" cy="50" r="${radius}" />
            <circle class="gauge-fill" cx="50" cy="50" r="${radius}" 
                stroke="${color}" 
                stroke-dasharray="${circumference}" 
                stroke-dashoffset="${circumference}" 
                data-target="${offset}" />
            <text class="gauge-text" x="50" y="46">${value}</text>
            <text class="gauge-unit" x="50" y="62">${unit}</text>
        </svg>
    `;
}

function createCard(item) {
    const detailsHTML = item.details.map(d => `
        <div class="detail-item">
            <div class="detail-label">${d.label}</div>
            <div class="detail-value">${d.value} <span class="small">${d.small}</span></div>
        </div>
    `).join('');

    return `
        <article class="vital-card" data-category="${item.category}" data-id="${item.id}" 
            style="--card-accent: ${item.color}">
            <div class="card-header">
                <div class="card-icon" style="background: ${item.color}">
                    <i class="${item.icon}"></i>
                </div>
                <div class="card-status ${item.status}">
                    <i class="fas fa-circle" style="font-size: 6px;"></i>
                    ${item.statusText}
                </div>
            </div>
            
            <h3 class="card-title">${item.title}</h3>
            <p class="card-subtitle">${item.subtitle}</p>
            
            <div class="gauge-container">
                ${createGaugeSVG(item.percentage, item.color, item.normalValue, item.unit)}
                <div class="gauge-info">
                    <h3 style="color: ${item.color}">${item.normalValue}</h3>
                    <span class="unit">${item.unit}</span>
                </div>
            </div>
            
            <div class="range-section">
                <div class="range-labels">
                    <span>الحد الأدنى: ${item.rangeMin}</span>
                    <span>الحد الأقصى: ${item.rangeMax}</span>
                </div>
                <div class="range-bar">
                    <div class="range-fill" style="width: 0%; background: linear-gradient(90deg, ${item.color}, ${item.color}88);" data-width="${item.percentage}%"></div>
                </div>
            </div>
            
            <div class="details-grid">
                ${detailsHTML}
            </div>
            
            <div class="info-note">
                <i class="fas fa-info-circle"></i>
                <p>${item.note}</p>
            </div>
        </article>
    `;
}
// ===== INTERSECTION OBSERVER =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            card.classList.add('visible');
            
            const gaugeFill = card.querySelector('.gauge-fill');
            if (gaugeFill) {
                gaugeFill.style.strokeDashoffset = gaugeFill.dataset.target;
            }
            
            const rangeFill = card.querySelector('.range-fill');
            if (rangeFill) {
                rangeFill.style.width = rangeFill.dataset.width;
            }
            
            observer.unobserve(card);
        }
    });
}, { threshold: 0.1 });

function renderCards(filter = 'all') {
}
function renderCards(filter = 'all') {
    const container = document.getElementById('mainContent');
    const filtered = filter === 'all' 
        ? medicalData 
        : medicalData.filter(item => item.category === filter);

    // Group by category
    const grouped = {};
    filtered.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
    });

    let html = '';
    for (const [cat, items] of Object.entries(grouped)) {
        const config = categoryConfig[cat];
        html += `
            <div class="section-title">
                <div class="icon-box" style="background: ${config.color}">
                    <i class="${config.icon}"></i>
                </div>
                <h2>${config.name}</h2>
                <span class="count">${items.length} مؤشر</span>
            </div>
            <div class="cards-grid">
                ${items.map(item => createCard(item)).join('')}
            </div>
        `;
    }

    container.innerHTML = html;

    // Animate cards in
    document.querySelectorAll('.vital-card').forEach(card => {
    observer.observe(card);
});
}

// ===== SEARCH =====
document.getElementById('searchInput').addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.vital-card');
    
    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const subtitle = card.querySelector('.card-subtitle').textContent.toLowerCase();
        const match = title.includes(query) || subtitle.includes(query) || query === '';
        card.style.display = match ? '' : 'none';
    });
});

// ===== TABS =====
document.getElementById('tabsWrapper').addEventListener('click', function(e) {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    renderCards(btn.dataset.category);
});

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
let isDark = true;

themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
});

// ===== HEADER SCROLL =====
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    const backToTop = document.getElementById('backToTop');
    
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    if (window.scrollY > 500) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
});

// ===== BMI CALCULATOR =====
function calculateBMI() {
    const weight = parseFloat(document.getElementById('weightInput').value);
    const height = parseFloat(document.getElementById('heightInput').value) / 100;

    if (!weight || !height || weight <= 0 || height <= 0) {
        alert('الرجاء إدخال وزن وطول صحيحين');
        return;
    }

    const bmi = (weight / (height * height)).toFixed(1);
    let category, color;

    if (bmi < 18.5) {
        category = 'نقص في الوزن';
        color = 'var(--accent-cyan)';
    } else if (bmi < 25) {
        category = 'وزن طبيعي ✅';
        color = 'var(--accent-green)';
    } else if (bmi < 30) {
        category = 'وزن زائد ⚠️';
        color = 'var(--accent-yellow)';
    } else if (bmi < 35) {
        category = 'سمنة من الدرجة الأولى 🔶';
        color = 'var(--accent-orange)';
    } else {
        category = 'سمنة مفرطة 🔴';
        color = 'var(--accent-red)';
    }

    const result = document.getElementById('bmiResult');
    const bmiValueEl = document.getElementById('bmiValue');
    const bmiCategoryEl = document.getElementById('bmiCategory');
    const pointer = document.getElementById('bmiPointer');

    bmiValueEl.textContent = bmi;
    bmiValueEl.style.color = color;
    bmiCategoryEl.textContent = category;
    bmiCategoryEl.style.color = color;

    // Position pointer (BMI range 15-40 mapped to 0-100%)
    const pointerPos = Math.min(Math.max(((bmi - 15) / 25) * 100, 2), 98);
    pointer.style.left = pointerPos + '%';

    result.classList.add('show');
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== ANIMATED COUNTERS =====
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const step = target / (duration / 16);
    
    function update() {
        start += step;
        if (start >= target) {
            element.textContent = target + '+';
            return;
        }
        element.textContent = Math.floor(start) + '+';
        requestAnimationFrame(update);
    }
    update();
}

// ===== LOADER =====
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
        
        // Render cards
        renderCards('all');
        
        // Animate stats
        animateCounter(document.getElementById('totalIndicators'), medicalData.length, 1500);
        animateCounter(document.getElementById('totalCategories'), Object.keys(categoryConfig).length, 1500);
        animateCounter(document.getElementById('totalTests'), 45, 1500);
    }, 1800);
});
