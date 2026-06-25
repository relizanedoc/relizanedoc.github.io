// ==========================================
// gallery.js - إدارة معرض الصور، الـ Lightbox، والسلايدر التسويقي
// ==========================================

let touchStartX = 0;
let touchEndX = 0;
let slideIndex = 0;
let slideTimer;

/**
 * فتح الـ Lightbox (تكبير الصورة)
 */
window.openClinicLightbox = function(imageUrl, index, docId) {
    const lb = document.getElementById('clinicLightbox_' + docId);
    const img = document.getElementById('clinicLightboxImg_' + docId);
    if (!lb || !img) return;

    // تخزين البيانات الحالية لسهولة التنقل
    window._currentLightboxDocId = docId;
    window._currentLightboxIndex = index;

    img.src = imageUrl;
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // منع تمرير الصفحة
};

/**
 * التنقل بين الصور داخل الـ Lightbox
 */
window.navigateLightbox = function(direction, docId) {
    const images = window._currentClinicImages || [];
    if (images.length <= 1) return;

    // حساب الفهرس الجديد
    let newIndex = window._currentLightboxIndex + direction;

    // نظام الدوران
    if (newIndex >= images.length) newIndex = 0;
    if (newIndex < 0) newIndex = images.length - 1;

    const img = document.getElementById('clinicLightboxImg_' + docId);
    if (img) {
        img.style.opacity = '0.3';
        setTimeout(() => {
            img.src = images[newIndex];
            img.style.opacity = '1';
        }, 150);
    }
    window._currentLightboxIndex = newIndex;
};

/**
 * إغلاق الـ Lightbox
 */
window.closeClinicLightbox = function(docId) {
    const lb = document.getElementById('clinicLightbox_' + docId);
    if (!lb) return;
    lb.style.display = 'none';
    document.body.style.overflow = ''; 
    window._currentLightboxDocId = null; 
};

// ==========================================
// دعم التنقل من لوحة المفاتيح (أسهم + Escape)
// ==========================================
document.addEventListener('keydown', function(e) {
    const docId = window._currentLightboxDocId;
    if (!docId) return;

    const lb = document.getElementById('clinicLightbox_' + docId);
    if (lb && lb.style.display === 'flex') {
        if (e.key === 'Escape') {
            window.closeClinicLightbox(docId);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const direction = e.key === 'ArrowLeft' ? -1 : 1;
            const isRTL = document.documentElement.dir === 'rtl';
            window.navigateLightbox(isRTL ? -direction : direction, docId);
        }
    }
});

// ==========================================
// دعم السحب والإفلات (Swipe) لمستخدمي الهواتف
// ==========================================
document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const docId = window._currentLightboxDocId;
    if (!docId) return;

    const lb = document.getElementById('clinicLightbox_' + docId);
    if (lb && lb.style.display === 'flex') {
        const threshold = 50; 
        const diff = touchEndX - touchStartX;

        if (Math.abs(diff) > threshold) {
            const isRTL = document.documentElement.dir === 'rtl';
            let direction = diff < 0 ? 1 : -1; 
            if (isRTL) direction = -direction; 

            window.navigateLightbox(direction, docId);
        }
    }
}

// ==========================================
// نظام تحريك الصور (السلايدر التسويقي)
// ==========================================
function showSlides(n) {
    let slides = document.getElementsByClassName("pitch-slide");
    let dots = document.getElementsByClassName("dot");

    if (slides.length === 0) return;

    if (n !== undefined) {
        slideIndex = n;
        clearInterval(slideTimer); 
        slideTimer = setInterval(() => showSlides(), 4000); 
    } else {
        slideIndex++; 
    }

    if (slideIndex > slides.length) { slideIndex = 1; }
    if (slideIndex < 1) { slideIndex = slides.length; }

    for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
    }
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
    }

    slides[slideIndex - 1].classList.add("active");
    dots[slideIndex - 1].classList.add("active");
}

window.currentSlide = function(n) {
    showSlides(n);
};

document.addEventListener("DOMContentLoaded", function() {
    showSlides(1); 
    slideTimer = setInterval(() => showSlides(), 4000); 
});
