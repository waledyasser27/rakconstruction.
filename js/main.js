// ==========================================
// Rafic A. Kreidie Engineers & Contractors
// Main JavaScript File
// ==========================================

// Initialize AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    offset: 100
});

// Runtime anti-jump fallback: restore last user scroll if page snaps to a section without user scroll
let __isUserScrolling = false;
let __lastUserY = 0;
['wheel','touchstart','touchmove','keydown'].forEach(ev=>{
    window.addEventListener(ev, ()=>{ __isUserScrolling = true; }, { passive: true });
});
window.addEventListener('scroll', ()=>{
    const y = window.pageYOffset;
    if (__isUserScrolling) {
        __lastUserY = y;
        // reset shortly after user stops
        clearTimeout(window.__scrollEndTimer);
        window.__scrollEndTimer = setTimeout(()=>{ __isUserScrolling = false; }, 120);
        return;
    }
    // If not user scrolling and we jumped near career section, snap back
    const careerSec = document.getElementById('career');
    if (careerSec) {
        const top = careerSec.offsetTop;
        if (Math.abs(y - top) < 120) {
            withScrollPermission(()=>{ window.scrollTo({ top: __lastUserY, behavior: 'auto' }); });
        }
    }
}, { passive: true });

// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Guard against unintended hash-based auto-scroll (e.g., jumping to #career)
let __userInteracted = false;
['click','touchstart','keydown','mousedown'].forEach(ev=>
    window.addEventListener(ev, ()=> { __userInteracted = true; }, { once: false })
);
// Global guard to prevent unwanted programmatic scrolls
let __allowProgrammaticScroll = false;
const __origScrollTo = window.scrollTo.bind(window);
window.scrollTo = function() {
    if (!__allowProgrammaticScroll) return;
    return __origScrollTo.apply(window, arguments);
}
const __origScroll = window.scroll.bind(window);
window.scroll = function() {
    if (!__allowProgrammaticScroll) return;
    return __origScroll.apply(window, arguments);
}
const __origScrollIntoView = Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView = function() {
    if (!__allowProgrammaticScroll) return;
    return __origScrollIntoView.apply(this, arguments);
}
function withScrollPermission(fn){
    __allowProgrammaticScroll = true;
    try { fn && fn(); } finally {
        setTimeout(()=>{ __allowProgrammaticScroll = false; }, 600);
    }
}
// Prevent browser restoring scroll position unexpectedly
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.addEventListener('load', ()=>{
    if (location.hash && !__userInteracted) {
        history.replaceState(null, '', location.pathname + location.search);
    }
    // Re-affirm position shortly after load to avoid late hash jumps
    setTimeout(()=>{
        if (location.hash && !__userInteracted) {
            history.replaceState(null, '', location.pathname + location.search);
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, 150);
});

// If hash changes without user action, clear it (prevents automatic anchor jumps)
window.addEventListener('hashchange', ()=>{
    const y = window.pageYOffset;
    history.replaceState(null, '', location.pathname + location.search);
    withScrollPermission(()=>{ window.scrollTo({ top: y, behavior: 'auto' }); });
});

// ========== Language Toggle ==========
const html = document.documentElement;
const langToggle = document.getElementById('langToggle');
const navLangToggle = document.getElementById('navLangToggle');

// Get saved language or default to Arabic
let currentLang = localStorage.getItem('language') || 'ar';
setLanguage(currentLang);

// Language toggle handlers
if (langToggle) {
    langToggle.addEventListener('click', toggleLanguage);
}

// Smooth scroll helper with top offset for fixed header
function smoothScrollToEl(el, offset, userInitiated = true) {
    if (!el) return;
    if (!userInitiated) return; // ignore non-user initiated scrolls
    // Auto-detect header height to avoid covering target on phones
    const headerEl = document.getElementById('header');
    const autoOffset = headerEl ? (headerEl.getBoundingClientRect().height + 10) : (window.innerWidth < 640 ? 70 : 90);
    const appliedOffset = typeof offset === 'number' ? offset : autoOffset;
    const rect = el.getBoundingClientRect();
    const top = window.pageYOffset + rect.top - appliedOffset;
    withScrollPermission(()=>{
        window.scrollTo({ top, behavior: 'smooth' });
    });
}

// Ensure hero items animate in strict order
function initHeroSequence(){
    const title = document.querySelector('.hero-title');
    const subtitle = document.querySelector('.hero-subtitle');
    const btn1 = document.querySelector('.hero-buttons .btn:nth-child(1)');
    const btn2 = document.querySelector('.hero-buttons .btn:nth-child(2)');
    const seq = [title, subtitle, btn1, btn2].filter(Boolean);
    if(!seq.length) return;

    seq.forEach((el, idx)=>{
        el.classList.add('will-animate');
        // Explicit delay per order (0s, 0.12s, 0.24s, 0.36s)
        el.style.transitionDelay = `${0.12 * idx}s`;
    });
}

// ========== Career Form ==========
const careerForm = document.getElementById('careerForm');
const careerFormMessage = document.getElementById('careerFormMessage');

if (careerForm) {
    careerForm.addEventListener('submit', async (e) => {
        const action = careerForm.getAttribute('action') || '';
        const submitBtn = careerForm.querySelector('.btn-submit');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.textContent = currentLang === 'ar' ? 'جاري الإرسال...' : 'Sending...';
            submitBtn.disabled = true;
        }
        // If using FormSubmit (static hosting), allow native submission
        if (action.includes('formsubmit.co')) {
            return; // do not preventDefault; browser will submit the form
        }
        // Otherwise fallback to API (if hosted somewhere that supports it)
        e.preventDefault();
        try {
            const formData = new FormData(careerForm);
            const res = await fetch('/api/career', { method: 'POST', body: formData });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Request failed');
            careerForm.reset();
            careerFormMessage.textContent = currentLang === 'ar' ? 'تم استلام طلبك وسيتم التواصل معك قريباً.' : 'Your application has been received. We will contact you soon.';
            careerFormMessage.className = 'form-message success';
        } catch (err) {
            console.error('Career form error:', err);
            careerFormMessage.textContent = currentLang === 'ar' ? 'تعذر إرسال الطلب. تأكد من الاتصال وحاول مرة أخرى.' : 'Submission failed. Check your connection and try again.';
            careerFormMessage.className = 'form-message error';
        } finally {
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    });
}

// ========== Divisions -> on click, keep user within divisions grid (projects section removed) ==========
const divisionCards = document.querySelectorAll('.division-card');
divisionCards.forEach(card => {
    card.addEventListener('click', () => {
        const target = card.getAttribute('data-target');
        if (target) {
            showSubProjects(target);
        }
        // No scroll: open inline for a smoother UX
    });
});

if (navLangToggle) {
    navLangToggle.addEventListener('click', toggleLanguage);
}

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(currentLang);
}

function setLanguage(lang) {
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('language', lang);
    
    // Update dynamic content
    updateDynamicContent();
}

function updateDynamicContent() {
    // Update navigation links
    document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
        const text = currentLang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        if (text) {
            el.textContent = text;
        }
    });
    
    // Update select options
    document.querySelectorAll('select option[data-ar], select option[data-en]').forEach(option => {
        const text = currentLang === 'ar' ? option.getAttribute('data-ar') : option.getAttribute('data-en');
        if (text) {
            option.textContent = text;
        }
    });
}

// ========== Header Scroll Effect ==========
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// ========== Mobile Navigation ==========
const navToggle = document.getElementById('navToggle');
const navClose = document.getElementById('navClose');
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        nav.classList.add('active');
    });
}

if (navClose) {
    navClose.addEventListener('click', () => {
        nav.classList.remove('active');
    });
}

// Close nav on link click
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
    });
});

// ========== Active Navigation Link ==========
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        
        if (navLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            navLink.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

// ========== Smooth Scroll ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                // Temporarily disable smooth anchor scrolling to isolate jump issue
                withScrollPermission(()=>{
                    const y = target.offsetTop - 80;
                    window.scrollTo({ top: y, behavior: 'auto' });
                });
            }
        }
    });
});

// ========== Stats Counter Animation ==========
const statNumbers = document.querySelectorAll('.stat-number');

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Intersection Observer for stats
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            if (statNumber && !statNumber.classList.contains('animated')) {
                animateCounter(statNumber);
                statNumber.classList.add('animated');
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
    statsObserver.observe(stat);
});

// ========== Project Filters ==========
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        
        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Filter projects
        projectCards.forEach(card => {
            const category = card.getAttribute('data-category');
            
            if (filter === 'all' || category === filter) {
                card.classList.remove('hidden');
                gsap.fromTo(card, 
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.5 }
                );
            } else {
                card.classList.add('hidden');
            }
        });

        // Show sub-projects browser for a specific category
        if (filter !== 'all') {
            showSubProjects(filter);
        } else {
            resetProjectBrowser();
        }
    });
});

// ========== Subcategories (Projects) & Gallery Browser ==========
const projectListEl = document.getElementById('projectList');
const galleryEl = document.getElementById('galleryContainer');
const breadcrumbEl = document.getElementById('projectBreadcrumb');

// Project data built from available local images per category
const PROJECT_DATA = {
    commercial: [
        { ar: 'Boulevard Mall', en: 'Boulevard Mall', images: [ { src: 'commercial/polivard.jpg', ar: 'Boulevard Mall', en: 'Boulevard Mall' } ] },
        { ar: 'Rabigh King Abdullah Resort', en: 'Rabigh King Abdullah Resort', images: [ { src: 'commercial/rabigh king abdullag.jpg', ar: 'Rabigh King Abdullah Resort', en: 'Rabigh King Abdullah Resort' } ] },
        { ar: 'Roshana Mall', en: 'Roshana Mall', images: [ { src: 'commercial/roshanamall.jpg', ar: 'Roshana Mall', en: 'Roshana Mall' } ] },
        { ar: '10 Boutique Mall', en: '10 Boutique Mall', images: [ { src: 'commercial/10botiquemall.jpg', ar: '10 Boutique Mall', en: '10 Boutique Mall' } ] },
        { ar: 'Anaghayr Mall', en: 'Anaghayr Mall', images: [ { src: 'commercial/anaghayrmall.jpg', ar: 'Anaghayr Mall', en: 'Anaghayr Mall' } ] },
        { ar: 'Dallah Group Offices', en: 'Dallah Group Offices', images: [ { src: 'commercial/dallah group.jpg', ar: 'Dallah Group Offices', en: 'Dallah Group Offices' } ] },
        { ar: 'Randa Office Building', en: 'Randa Office Building', images: [ { src: 'commercial/randaofficebuilding.jpg', ar: 'Randa Office Building', en: 'Randa Office Building' } ] }
    ],
    residential: [
        { ar: 'Daraytam', en: 'Daraytam', images: [ { src: 'residential/daraytam.jpg', ar: 'Daraytam', en: 'Daraytam' } ] },
        { ar: 'Private Villa 1', en: 'Private Villa 1', images: [ { src: 'residential/privatevilla1.jpg', ar: 'Private Villa 1', en: 'Private Villa 1' } ] },
        { ar: 'Private Villa 2', en: 'Private Villa 2', images: [ { src: 'residential/privatevilla2.jpg', ar: 'Private Villa 2', en: 'Private Villa 2' } ] },
        { ar: 'Private Villa 3', en: 'Private Villa 3', images: [ { src: 'residential/privatevilla3.jpg', ar: 'Private Villa 3', en: 'Private Villa 3' } ] },
        { ar: 'Private Villa 4', en: 'Private Villa 4', images: [ { src: 'residential/privatevilla4.jpg', ar: 'Private Villa 4', en: 'Private Villa 4' } ] },
        { ar: 'Private Villa 5', en: 'Private Villa 5', images: [ { src: 'residential/privatevilla5.jpg', ar: 'Private Villa 5', en: 'Private Villa 5' } ] },
        { ar: 'Private Villa 6', en: 'Private Villa 6', images: [ { src: 'residential/privatevilla6.jpg', ar: 'Private Villa 6', en: 'Private Villa 6' } ] }
    ],
    infrastructure: [
        // No local images found yet; keep placeholder empty array
    ],
    industrial: [
        { ar: 'Aujan Industry', en: 'Aujan Industry', images: [ { src: 'industrial/Aujan industry.jpg', ar: 'Aujan Industry', en: 'Aujan Industry' } ] },
        { ar: 'SIPCO Warehouse', en: 'SIPCO Warehouse', images: [ { src: 'industrial/SIPCOWAREHOUSE.JPG', ar: 'SIPCO Warehouse', en: 'SIPCO Warehouse' } ] },
        { ar: 'Ford Showroom & Workshop', en: 'Ford Showroom & Workshop', images: [ { src: 'industrial/ford_showroom_workshop.jpg', ar: 'Ford Showroom & Workshop', en: 'Ford Showroom & Workshop' } ] },
        { ar: 'Mercedes Facility', en: 'Mercedes Facility', images: [ { src: 'industrial/mercedes.jpg', ar: 'Mercedes Facility', en: 'Mercedes Facility' } ] },
        { ar: 'Omatra Iveco Showroom', en: 'Omatra Iveco Showroom', images: [ { src: 'industrial/omatraiveco_showroom.jpg', ar: 'Omatra Iveco Showroom', en: 'Omatra Iveco Showroom' } ] },
        { ar: 'Red Sea Gateway Warehouse', en: 'Red Sea Gateway Warehouse', images: [ { src: 'industrial/redeseagatewaywarehouse.jpg', ar: 'Red Sea Gateway Warehouse', en: 'Red Sea Gateway Warehouse' } ] }
    ],
    educational: [
        { ar: 'CNCF Building', en: 'CNCF Building', images: [ { src: 'educational/cncf.jpg', ar: 'CNCF Building', en: 'CNCF Building' } ] },
        { ar: 'Female Reception Building', en: 'Female Reception Building', images: [ { src: 'educational/female_reciption_building.jpg', ar: 'Female Reception Building', en: 'Female Reception Building' } ] },
        { ar: 'Gabegh GEMS High School', en: 'Gabegh GEMS High School', images: [ { src: 'educational/gabegh_gems_highschool.jpg', ar: 'Gabegh GEMS High School', en: 'Gabegh GEMS High School' } ] },
        { ar: 'King Abdulaziz Business Building', en: 'King Abdulaziz Business Building', images: [ { src: 'educational/king_abdelaziz_buisness_building.jpg', ar: 'King Abdulaziz Business Building', en: 'King Abdulaziz Business Building' } ] },
        { ar: 'King Abdulaziz Engineering Building', en: 'King Abdulaziz Engineering Building', images: [ { src: 'educational/king_abdelaziz_engineering_building.jpg', ar: 'King Abdulaziz Engineering Building', en: 'King Abdulaziz Engineering Building' } ] },
        { ar: 'Material Lab Phase 2', en: 'Material Lab Phase 2', images: [ { src: 'educational/material_lap_phase2.jpg', ar: 'Material Lab Phase 2', en: 'Material Lab Phase 2' } ] },
        { ar: 'VIP Manasik Kobar Visitors', en: 'VIP Manasik Kobar Visitors', images: [ { src: 'educational/vip_manasetkobar_elzowar.jpg', ar: 'VIP Manasik Kobar Visitors', en: 'VIP Manasik Kobar Visitors' } ] }
    ],
    hospitality: [
        { ar: 'Hyatt Hotel', en: 'Hyatt Hotel', images: [ { src: 'hospitality/hayathotel.jpg', ar: 'Hyatt Hotel', en: 'Hyatt Hotel' } ] }
    ],
    medical: [
        { ar: 'Abdelkarim Bakr Medical', en: 'Abdelkarim Bakr Medical', images: [ { src: 'medical/abdelkarim_bakr.jpg', ar: 'Abdelkarim Bakr Medical', en: 'Abdelkarim Bakr Medical' } ] },
        { ar: 'Asser Home Medical Center', en: 'Asser Home Medical Center', images: [ { src: 'medical/asserhomemedicalcenter.jpg', ar: 'Asser Home Medical Center', en: 'Asser Home Medical Center' } ] },
        { ar: 'Juffali Medical Center', en: 'Juffali Medical Center', images: [ { src: 'medical/juffali_medical_center.jpg', ar: 'Juffali Medical Center', en: 'Juffali Medical Center' } ] },
        { ar: 'Makkah Dialysis Center - Kella', en: 'Makkah Dialysis Center - Kella', images: [ { src: 'medical/mekkah_diyalsis_center_kella.jpg', ar: 'Makkah Dialysis Center - Kella', en: 'Makkah Dialysis Center - Kella' } ] },
        { ar: 'National Guard Medical', en: 'National Guard Medical', images: [ { src: 'medical/national_guard_medical.jpg', ar: 'National Guard Medical', en: 'National Guard Medical' } ] }
    ]
};

let currentCategoryKey = null;
let currentProjectIndex = null;

function t(keyAr, keyEn) {
    return currentLang === 'ar' ? keyAr : keyEn;
}

function renderBreadcrumb(parts) {
    if (!breadcrumbEl) return;
    breadcrumbEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    parts.forEach((p, i) => {
        const span = document.createElement('span');
        span.className = 'crumb';
        span.textContent = p.label;
        if (p.onClick) {
            span.style.cursor = 'pointer';
            span.addEventListener('click', p.onClick);
        }
        frag.appendChild(span);
        if (i < parts.length - 1) {
            const sep = document.createElement('span');
            sep.className = 'sep';
            sep.textContent = currentLang === 'ar' ? '›' : '›';
            frag.appendChild(sep);
        }
    });
    breadcrumbEl.appendChild(frag);
    breadcrumbEl.style.display = 'flex';
}

function resetProjectBrowser() {
    if (projectListEl) projectListEl.style.display = 'none';
    if (galleryEl) galleryEl.style.display = 'none';
    if (breadcrumbEl) breadcrumbEl.style.display = 'none';
    currentCategoryKey = null;
    currentProjectIndex = null;
}

function showSubProjects(categoryKey) {
    if (!projectListEl || !PROJECT_DATA[categoryKey]) return;
    currentCategoryKey = categoryKey;
    currentProjectIndex = null;

    // Build list
    projectListEl.innerHTML = '';
    PROJECT_DATA[categoryKey].forEach((proj, idx) => {
        const item = document.createElement('button');
        item.className = 'project-item';
        item.textContent = t(proj.ar, proj.en);
        item.addEventListener('click', () => showGallery(categoryKey, idx));
        projectListEl.appendChild(item);
    });

    // Breadcrumb
    const catLabel = {
        commercial: t('تجاري', 'Commercial'),
        residential: t('سكني', 'Residential'),
        infrastructure: t('بنية تحتية', 'Infrastructure'),
        industrial: t('صناعي', 'Industrial'),
        educational: t('تعليمي', 'Educational'),
        hospitality: t('ضيافة', 'Hospitality'),
        medical: t('طبي', 'Medical')
    }[categoryKey];

    renderBreadcrumb([
        { label: t('التصنيفات', 'Categories'), onClick: () => { resetProjectBrowser(); filterBtns.forEach(b=> b.dataset.filter==='all' && b.click()); } },
        { label: catLabel, onClick: () => showSubProjects(categoryKey) }
    ]);

    projectListEl.style.display = 'grid';
    galleryEl.style.display = 'none';

    // Animate list reveal
    gsap.fromTo(projectListEl,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );

    // Scroll user to classifications area for better UX
    withScrollPermission(()=> smoothScrollToEl(projectListEl, 90, true));
}

function showGallery(categoryKey, projectIdx) {
    if (!galleryEl) return;
    currentProjectIndex = projectIdx;
    const proj = PROJECT_DATA[categoryKey][projectIdx];
    galleryEl.innerHTML = '';

    proj.images.forEach(item => {
        const wrap = document.createElement('div');
        wrap.className = 'gallery-img';

        const isObj = typeof item === 'object' && item !== null;
        const src = isObj ? (item.src || item.url) : item;
        const captionText = isObj ? t(item.ar || proj.ar, item.en || proj.en) : t(proj.ar, proj.en);

        // Caption
        const caption = document.createElement('div');
        caption.className = 'gallery-caption';
        caption.textContent = captionText;
        wrap.appendChild(caption);

        // Image
        const img = document.createElement('img');
        img.src = encodeURI(src);
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = captionText;
        wrap.appendChild(img);

        galleryEl.appendChild(wrap);
    });

    // Breadcrumb with project
    const catLabel = {
        commercial: t('تجاري', 'Commercial'),
        residential: t('سكني', 'Residential'),
        infrastructure: t('بنية تحتية', 'Infrastructure'),
        industrial: t('صناعي', 'Industrial'),
        educational: t('تعليمي', 'Educational'),
        hospitality: t('ضيافة', 'Hospitality'),
        medical: t('طبي', 'Medical')
    }[categoryKey];

    renderBreadcrumb([
        { label: t('التصنيفات', 'Categories'), onClick: () => { resetProjectBrowser(); filterBtns.forEach(b=> b.dataset.filter==='all' && b.click()); } },
        { label: catLabel, onClick: () => showSubProjects(categoryKey) },
        { label: t(proj.ar, proj.en) }
    ]);

    projectListEl.style.display = 'grid';
    galleryEl.style.display = 'grid';

    // Animate gallery reveal
    gsap.fromTo(galleryEl,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    );

    // Scroll to gallery area
    withScrollPermission(()=> smoothScrollToEl(galleryEl, 90, true));
}

// ========== Contact Form ==========
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        const action = contactForm.getAttribute('action') || '';
        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.textContent = currentLang === 'ar' ? 'جاري الإرسال...' : 'Sending...';
            submitBtn.disabled = true;
        }
        if (action.includes('formsubmit.co')) {
            return; // allow native submission to FormSubmit
        }
        e.preventDefault();
        try {
            const formData = new FormData(contactForm);
            const data = {
                company_name: formData.get('company_name'),
                services: formData.get('services'),
                contact_name: formData.get('contact_name'),
                email: formData.get('email'),
                message: formData.get('message')
            };
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                showMessage('success', currentLang === 'ar' ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' : 'Your message has been sent successfully! We will contact you soon.');
                contactForm.reset();
            } else {
                throw new Error(result.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showMessage('error', currentLang === 'ar' ? 'حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.' : 'An error occurred while sending your message. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.textContent = originalText || (currentLang === 'ar' ? 'إرسال الطلب' : 'Send Request');
                submitBtn.disabled = false;
            }
        }
    });
}

function showMessage(type, text) {
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
    
    setTimeout(() => {
        formMessage.className = 'form-message';
    }, 5000);
}

// ========== GSAP Animations ==========

// Hero Section
gsap.from('.hero-content', {
    opacity: 0,
    y: 50,
    duration: 1,
    delay: 0.5,
    ease: 'power3.out'
});

// Section Titles
gsap.utils.toArray('.section-title').forEach(title => {
    gsap.from(title, {
        scrollTrigger: {
            trigger: title,
            start: 'top 80%'
        },
        opacity: 0,
        x: currentLang === 'ar' ? 50 : -50,
        duration: 0.8,
        ease: 'power2.out'
    });
});

// Service Cards Stagger
gsap.from('.service-card', {
    scrollTrigger: {
        trigger: '.services-grid',
        start: 'top 70%'
    },
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power2.out'
});

// Projects Grid
gsap.from('.project-card', {
    scrollTrigger: {
        trigger: '.projects-grid',
        start: 'top 70%'
    },
    opacity: 0,
    scale: 0.9,
    stagger: 0.1,
    duration: 0.6,
    ease: 'back.out'
});

// ========== Form Input Effects ==========
const formInputs = document.querySelectorAll('.form-input');

formInputs.forEach(input => {
    // Add placeholder for label animation
    if (!input.hasAttribute('placeholder')) {
        input.setAttribute('placeholder', ' ');
    }
    
    // Focus/blur effects
    input.addEventListener('focus', () => {
        gsap.to(input, {
            borderColor: '#D4AF37',
            duration: 0.3
        });
    });
    
    input.addEventListener('blur', () => {
        if (!input.value) {
            gsap.to(input, {
                borderColor: 'transparent',
                duration: 0.3
            });
        }
    });
});

// ========== Parallax Effect for Hero ==========
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero-video');
    
    if (parallax) {
        parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// ========== Image Lazy Loading Observer ==========
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
        }
    });
});

document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

// ========== Cursor Effect (Optional) ==========
if (window.innerWidth > 768) {
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
    
    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(1.5)';
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
        });
    });
}

// ========== Page Load Animation ==========
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ========== Scroll to Top Button (Optional) ==========
const scrollTopBtn = document.createElement('button');
scrollTopBtn.className = 'scroll-top-btn';
scrollTopBtn.innerHTML = '↑';
scrollTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: #D4AF37;
    color: #0D0D0D;
    border: none;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 999;
`;

document.body.appendChild(scrollTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
        scrollTopBtn.style.opacity = '1';
    } else {
        scrollTopBtn.style.opacity = '0';
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// RTL adjustment for scroll button
if (currentLang === 'ar') {
    scrollTopBtn.style.right = 'auto';
    scrollTopBtn.style.left = '30px';
}

// ========== Console Welcome Message ==========
console.log('%c🏗️ Rafic A. Kreidie Engineers & Contractors', 'color: #D4AF37; font-size: 20px; font-weight: bold;');
console.log('%cBuilding Excellence Since 1985', 'color: #FFFFFF; font-size: 14px;');
console.log('%cWebsite developed with ❤️', 'color: #D4AF37; font-size: 12px;');

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    updateDynamicContent();
    updateActiveNav();
    initRevealAnimations();
});

// ========== Partners Carousel ==========
// ضع روابط صور الشركاء داخل عناصر <img> في index.html داخل .partners-track
// فقط استبدل رابط placeholder وأكتب اسم الشريك مكان PARTNER في alt
(function initPartnersCarousel(){
    const track = document.getElementById('partnersTrack');
    if(!track) return;
    const prev = document.querySelector('.partners-carousel .prev');
    const next = document.querySelector('.partners-carousel .next');
    const slides = Array.from(track.children);
    function getCenterIndex(){
        const trackRect = track.getBoundingClientRect();
        const centerX = trackRect.left + trackRect.width / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        slides.forEach((el, i)=>{
            const r = el.getBoundingClientRect();
            const slideCenter = r.left + r.width / 2;
            const d = Math.abs(slideCenter - centerX);
            if (d < bestDist) { bestDist = d; bestIdx = i; }
        });
        return bestIdx;
    }

    function snapToIndex(i){
        const maxIndex = Math.max(0, slides.length - 1);
        const clamped = Math.min(Math.max(i, 0), maxIndex);
        const el = slides[clamped];
        if (!el) return;
        const trackRect = track.getBoundingClientRect();
        const slideRect = el.getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;
        const slideCenter = slideRect.left + slideRect.width / 2;
        const delta = slideCenter - trackCenter;
        track.scrollBy({ left: delta, behavior: 'smooth' });
    }

    function nextSlide(){
        const idx = getCenterIndex();
        snapToIndex(idx + 1);
    }
    function prevSlide(){
        const idx = getCenterIndex();
        snapToIndex(idx - 1);
    }

    next?.addEventListener('click', nextSlide);
    prev?.addEventListener('click', prevSlide);

    // Autoplay disabled to avoid unexpected page reposition

    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    function onDown(clientX){
        isDown = true;
        startX = clientX;
        startScroll = track.scrollLeft;
    }
    function onMove(clientX){
        if(!isDown) return;
        const dx = clientX - startX;
        track.scrollLeft = startScroll - dx;
    }
    function onUp(){
        if(!isDown) return;
        isDown = false;
        const idx = getCenterIndex();
        snapToIndex(idx);
    }

    track.addEventListener('mousedown', (e)=> { onDown(e.clientX); });
    window.addEventListener('mousemove', (e)=> { onMove(e.clientX); });
    window.addEventListener('mouseup', onUp);
    track.addEventListener('touchstart', (e)=> { if(e.touches[0]) onDown(e.touches[0].clientX); }, { passive: true });
    track.addEventListener('touchmove', (e)=> { if(e.touches[0]) onMove(e.touches[0].clientX); }, { passive: true });
    track.addEventListener('touchend', onUp);

    window.addEventListener('resize', () => { const idx = getCenterIndex(); snapToIndex(idx); });
    snapToIndex(0);
})();

// ========== Reveal Animations for text over images ==========
function initRevealAnimations(){
    const targets = [
        '.hero-title',
        '.hero-subtitle',
        '.hero-buttons .btn',
        '.services .section-header .section-title',
        '.services .section-header .section-subtitle',
        '.services .service-card',
        '.projects .project-card .project-overlay .project-info',
        '.divisions .division-title'
    ];

    const elements = document.querySelectorAll(targets.join(', '));
    if(!elements.length) return;

    elements.forEach((el, i)=>{
        el.classList.add('will-animate');
        if(i % 3 === 1) el.classList.add('delay-1');
        if(i % 3 === 2) el.classList.add('delay-2');
    });

    const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                entry.target.classList.add('animate-in');
                io.unobserve(entry.target);
            }
        })
    },{ threshold: 0.2 });

    elements.forEach(el=> io.observe(el));
}