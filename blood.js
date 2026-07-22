const SUPABASE_URL = 'https://wzvyumctmqhnptvqxkfk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dnl1bWN0bXFobnB0dnF4a2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MDQ5MzIsImV4cCI6MjEwMDI4MDkzMn0.BhK1XBNwYmBuxPyRzDPmFxgDieG9urM9OoJIKR9G7Zs';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== 1. منطق صفحة الإضافة (blood.html) ======
const addDonorForm = document.getElementById('addDonorForm');
if (addDonorForm) {
    addDonorForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // هذا السطر هو الذي يمنع الصفحة من تحديث نفسها ومسح البيانات
        
        const submitBtn = document.getElementById('submitBtn');
        const msgDiv = document.getElementById('formMessage');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري التسجيل...';
        
        // جمع البيانات
        const donorData = {
            name: document.getElementById('name').value,
            municipality: document.getElementById('municipality').value,
            blood_type: document.getElementById('blood_type').value,
            age: document.getElementById('age').value || null,
            gender: document.getElementById('gender').value || null,
            phone1: document.getElementById('phone1').value || null,
            phone2: document.getElementById('phone2').value || null,
            email: document.getElementById('email').value || null,
            last_donation: document.getElementById('last_donation').value || null,
        };

        // إرسال البيانات إلى Supabase
        const { data, error } = await supabase.from('donors').insert([donorData]);

        if (error) {
            msgDiv.className = 'message msg-error';
            msgDiv.textContent = 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.';
            console.error(error);
        } else {
            msgDiv.className = 'message msg-success';
            msgDiv.textContent = 'تم تسجيلك كمتبرع بنجاح! جزاك الله خيراً.';
            addDonorForm.reset(); // تفريغ الخانات بعد النجاح
        }
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل كمتبرع';
    });
}

// ====== 2. منطق صفحة البحث (search.html) ======
const searchForm = document.getElementById('searchForm');
if (searchForm) {
    const fetchDonors = async (municipality = '', blood_type = '') => {
        const resultsGrid = document.getElementById('resultsGrid');
        const loadingMsg = document.getElementById('loadingMessage');
        
        resultsGrid.innerHTML = '';
        loadingMsg.style.display = 'block';

        let query = supabase.from('donors').select('*').order('id', { ascending: false });
        
        if (municipality) query = query.eq('municipality', municipality);
        if (blood_type) query = query.eq('blood_type', blood_type);

        const { data, error } = await query;

        loadingMsg.style.display = 'none';

        if (error) {
            resultsGrid.innerHTML = '<div class="message msg-error">حدث خطأ في جلب البيانات</div>';
            return;
        }

        if (data.length === 0) {
            resultsGrid.innerHTML = '<div class="message">لا يوجد متبرعين بهذه المواصفات حالياً.</div>';
            return;
        }

        data.forEach(donor => {
            const card = document.createElement('div');
            card.className = 'donor-card';
            
            const phoneStr = [donor.phone1, donor.phone2].filter(Boolean).join(' / ') || 'غير متوفر';
            const lastDonation = donor.last_donation ? donor.last_donation : 'غير محدد';
            
            card.innerHTML = `
                <h3>${donor.name} <span class="blood-badge">${donor.blood_type}</span></h3>
                <div class="donor-info"><strong>البلدية:</strong> ${donor.municipality}</div>
                <div class="donor-info"><strong>الهاتف:</strong> <span dir="ltr">${phoneStr}</span></div>
                ${donor.age ? '<div class="donor-info"><strong>العمر:</strong> ' + donor.age + ' سنة</div>' : ''}
                <div class="donor-info"><strong>تاريخ آخر تبرع:</strong> <span dir="ltr">${lastDonation}</span></div>
            `;
            resultsGrid.appendChild(card);
        });
    };

    fetchDonors();

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const mun = document.getElementById('search_municipality').value;
        const bt = document.getElementById('search_blood_type').value;
        fetchDonors(mun, bt);
    });
}
