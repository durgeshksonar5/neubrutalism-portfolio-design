// ============================================================
//  SHRIPARTH PORTFOLIO  —  script.js  v4.0
//  Fixes: mobile cursor, scrolled header, active nav, Escape
//  modal, scroll progress, corner marks, real video embed,
//  filter buttons, stats counter, keyboard accessibility
// ============================================================

gsap.registerPlugin(ScrollTrigger, Flip);

// ── Reduced motion preference ─────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Smooth scroll (Lenis) ────────────────────────────────
let lenis;
try {
    lenis = new Lenis({
        duration: prefersReducedMotion ? 0 : 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: !prefersReducedMotion,
        smoothTouch: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
} catch (e) {
    // Lenis not loaded — create a minimal fallback so lenis.on / lenis.scrollTo don't crash
    console.warn('Lenis not available, using fallback scroll.');
    lenis = {
        on: (evt, cb) => {
            if (evt === 'scroll') {
                window.addEventListener('scroll', () => {
                    cb({ scroll: window.scrollY });
                }, { passive: true });
            }
        },
        scrollTo: (target, opts) => {
            const el = typeof target === 'string' ? document.querySelector(target) : null;
            if (target === 0) { window.scrollTo({ top: 0, behavior: 'smooth' }); }
            else if (el) { el.scrollIntoView({ behavior: 'smooth' }); }
        },
        stop: () => { document.body.style.overflow = 'hidden'; },
        start: () => { document.body.style.overflow = ''; },
        raf: () => {},
    };
}

// ── Scroll Top button (declared early so scroll handler can use it) ──
const scrollBtn = document.getElementById('scrollTopBtn');

// ── Scroll Progress Bar + Header state (single consolidated listener) ──
const progressBar = document.getElementById('scroll-progress');
const siteHeader = document.getElementById('siteHeader');

let _scrollMax = document.body.scrollHeight - window.innerHeight;
window.addEventListener('resize', () => { _scrollMax = document.body.scrollHeight - window.innerHeight; }, { passive: true });

lenis.on('scroll', (e) => {
    // Progress bar
    const pct = (_scrollMax > 0) ? (e.scroll / _scrollMax) * 100 : 0;
    if (progressBar) progressBar.style.width = Math.min(pct, 100) + '%';
    // Header scrolled state
    if (siteHeader) siteHeader.classList.toggle('scrolled', e.scroll > 60);
    // Scroll-to-top button visibility
    if (scrollBtn) scrollBtn.classList.toggle('is-visible', e.scroll > 500);
});

// ── Hamburger nav ────────────────────────────────────────
const navToggle  = document.getElementById('navToggle');
const siteNav    = document.getElementById('siteNav');

if (navToggle && siteHeader) {
    navToggle.addEventListener('click', () => {
        const isOpen = siteHeader.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', isOpen);
    });
    siteNav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            siteHeader.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
    document.addEventListener('click', (e) => {
        if (!siteHeader.contains(e.target)) {
            siteHeader.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// ── Header active nav highlight ──────────────────────────
const headerIndicator = document.querySelector('.header-indicator');
// Active nav via ScrollTrigger
const navSections = ['about', 'work', 'philosophy', 'contact'];
navSections.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onToggle: ({ isActive }) => {
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (link) link.classList.toggle('is-active', isActive);
            // Move header indicator to active link
            if (isActive && link && headerIndicator) {
                const rect = link.getBoundingClientRect();
                const headerRect = siteHeader.getBoundingClientRect();
                headerIndicator.style.left  = (rect.left - headerRect.left) + 'px';
                headerIndicator.style.width = rect.width + 'px';
            }
        },
    });
});

// ── Custom cursor (desktop only) ─────────────────────────
const cursorDot  = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

if (window.innerWidth > 768 && cursorDot) {

    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId = null;

    document.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY;
        if (!rafId) rafId = requestAnimationFrame(tickCursor);
    }, { passive: true });

    function tickCursor() {
        rafId = null;
        // Dot: instant
        cursorDot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
        // Ring: lerp toward mouse
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        cursorRing.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`;
        if (Math.abs(mx - rx) > 0.3 || Math.abs(my - ry) > 0.3) {
            rafId = requestAnimationFrame(tickCursor);
        }
    }

    // Hide when cursor leaves window
    document.addEventListener('mouseleave', () => {
        cursorDot.classList.add('hidden');
        cursorRing.classList.add('hidden');
    }, { passive: true });
    document.addEventListener('mouseenter', () => {
        cursorDot.classList.remove('hidden');
        cursorRing.classList.remove('hidden');
    }, { passive: true });

    // Click animation
    document.addEventListener('mousedown', () => cursorRing.classList.add('clicking'), { passive: true });
    document.addEventListener('mouseup',   () => cursorRing.classList.remove('clicking'), { passive: true });

    // Hover on interactive elements
    const hoverTargets = 'a, button, .play-trigger, .proj-card, .tool-card, .filter-btn, .social-tile, .vid-frame, .modal-close, .scroll-top, .nav-link';

    document.querySelectorAll(hoverTargets).forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.style.background = 'var(--yellow)';
            cursorDot.style.width = '10px';
            cursorDot.style.height = '10px';
            cursorRing.classList.add('hovered');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.style.background = 'var(--red)';
            cursorDot.style.width = '6px';
            cursorDot.style.height = '6px';
            cursorRing.classList.remove('hovered');
        });
    });
}

// ── Nav link hover flash ─────────────────────────────────
document.querySelectorAll('.nav-link').forEach(el => {
    el.addEventListener('mouseenter', function () {
        gsap.to(el, {
            opacity: 0.7, duration: 0.12, ease: 'power1.out',
            onComplete: () => gsap.to(el, { opacity: 1, duration: 0.18, ease: 'power1.in' }),
        });
    });
});

// ── Play btn hover scale ─────────────────────────────────
document.querySelectorAll('.play-btn').forEach(el => {
    el.addEventListener('mouseenter', () => gsap.to(el, { scale: 1.12, duration: 0.25, ease: 'power2.out' }));
    el.addEventListener('mouseleave', () => gsap.to(el, { scale: 1,    duration: 0.35, ease: 'elastic.out(1, 0.5)' }));
});

// ── Live timecode counter ────────────────────────────────
(function () {
    const tc = document.querySelector('.timecode');
    if (!tc) return;
    let frames = 0;
    setInterval(() => {
        frames++;
        const f = frames % 25;
        const s = Math.floor(frames / 25) % 60;
        const m = Math.floor(frames / (25 * 60)) % 60;
        const h = Math.floor(frames / (25 * 3600));
        tc.textContent =
            String(h).padStart(2,'0') + ':' +
            String(m).padStart(2,'0') + ':' +
            String(s).padStart(2,'0') + ':' +
            String(f).padStart(2,'0');
    }, 1000 / 25);
})();

// ── Corner marks on vid-frame ────────────────────────────
function injectCornerMarks(container) {
    ['tl','tr','bl','br'].forEach(pos => {
        const m = document.createElement('div');
        m.className = `corner-mark corner-${pos}`;
        container.appendChild(m);
    });
}
document.querySelectorAll('.vid-frame').forEach(injectCornerMarks);

// ── Stats counter animation ──────────────────────────────
function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const obj = { val: 0 };
    gsap.to(obj, {
        val: target, duration: 1.8, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.val); },
    });
}
const statObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            statObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num[data-count]').forEach(el => statObs.observe(el));

// ══════════════════════════════════════════════════════════
// LOADER + HERO ENTRANCE — robust, never gets stuck
// ══════════════════════════════════════════════════════════

function dismissLoader() {
    const loader = document.getElementById('loader');
    if (!loader || loader.dataset.dismissed === 'true') return;
    loader.dataset.dismissed = 'true';

    // Pure CSS class dismissal — works even if GSAP failed
    loader.classList.add('loader-exit');

    // Also try GSAP if available
    if (typeof gsap !== 'undefined') {
        try {
            gsap.timeline()
                .to('.ls', { rotation: 360, scale: 1.4, stagger: 0.1, duration: 0.6, ease: 'power3.inOut' })
                .to('.loader-label',          { y: -30, opacity: 0, duration: 0.3 }, '-=0.2')
                .to('.loader-progress-track', { opacity: 0, duration: 0.15 }, '-=0.1')
                .to('#loader', { yPercent: -100, duration: 0.65, ease: 'power4.inOut',
                    onComplete: () => {
                        loader.style.display = 'none';
                        if (typeof initHero === 'function') initHero();
                    }
                });
        } catch(e) {
            loader.style.display = 'none';
            if (typeof initHero === 'function') try { initHero(); } catch(e2) {}
        }
    } else {
        // No GSAP — pure CSS already handles slide-up, just hide after transition
        setTimeout(() => {
            loader.style.display = 'none';
            if (typeof initHero === 'function') try { initHero(); } catch(e) {}
        }, 700);
    }
}

// Progress bar fill
const loaderFill = document.getElementById('loaderFill');
if (loaderFill) {
    let prog = 0;
    const fillInterval = setInterval(() => {
        prog = Math.min(prog + Math.random() * 18, 90);
        loaderFill.style.width = prog + '%';
    }, 100);
    const clearFill = () => { clearInterval(fillInterval); loaderFill.style.width = '100%'; };
    window.addEventListener('load', clearFill, { once: true });
    setTimeout(clearFill, 2000);
}

// Layer 1: window load event (ideal path)
window.addEventListener('load', () => setTimeout(dismissLoader, 200), { once: true });

// Layer 2: DOMContentLoaded safety (if load already fired)
if (document.readyState === 'complete') {
    setTimeout(dismissLoader, 400);
} else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(dismissLoader, 600), { once: true });
}

// Layer 3: Hard timeout — pure JS, no GSAP dependency, fires at 2.5s no matter what
setTimeout(dismissLoader, 2500);

function initHero() {
    gsap.set('.monitor',        { y: 50, opacity: 0 });
    gsap.set('.hero-tagline',   { opacity: 0, x: -20 });
    gsap.set('.hero-btns',      { opacity: 0, y: 16 });
    gsap.set('.monitor-bottom', { opacity: 0 });
    gsap.set('.scroll-cue',     { opacity: 0 });

    const tl = gsap.timeline({
        onComplete: () => {
            gsap.set(['.monitor','.hero-tagline','.hero-btns','.monitor-bottom','.scroll-cue'], { clearProps: 'all' });
        },
    });

    tl.to('.monitor',        { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out' })
      .to('.hero-tagline',   { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .to('.hero-btns',      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,y' }, '-=0.35')
      .to('.monitor-bottom', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .to('.scroll-cue',     { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.25');

    // Headline parallax (skip if reduced motion)
    if (!prefersReducedMotion) {
        gsap.to('#heroHeadline', {
            scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
            y: -50, ease: 'none',
        });

    // Ambient shape floats — paused when hero not visible
    const hs1Tween = gsap.to('.hs1', { y: -22, x: 10,  duration: 15, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true });
    const hs2Tween = gsap.to('.hs2', { y:  20, x: -9,  duration: 12, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true });
    const hs3Tween = gsap.to('.hs3', { y: -14, x:  6,  duration: 18, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true });
    ScrollTrigger.create({
        trigger: '#hero',
        start: 'top bottom', end: 'bottom top',
        onEnter:      () => { hs1Tween.play(); hs2Tween.play(); hs3Tween.play(); },
        onLeave:      () => { hs1Tween.pause(); hs2Tween.pause(); hs3Tween.pause(); },
        onEnterBack:  () => { hs1Tween.play(); hs2Tween.play(); hs3Tween.play(); },
        onLeaveBack:  () => { hs1Tween.pause(); hs2Tween.pause(); hs3Tween.pause(); },
    });
    }
}

// ══════════════════════════════════════════════════════════
// REVEAL-UP — IntersectionObserver
// ══════════════════════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

// ══════════════════════════════════════════════════════════
// ABOUT — animations
// ══════════════════════════════════════════════════════════
try {
    const s = new SplitType('.about-h2', { types: 'words' });
    gsap.from(s.words, {
        scrollTrigger: { trigger: '.about-h2', start: 'top 83%' },
        y: 40, autoAlpha: 0, stagger: 0.06, duration: 0.9, ease: 'power3.out',
    });
} catch (e) {}

// ── YouTube section — coordinated entrance timeline ──────
(function () {
    // Set initial hidden state for all YT elements
    gsap.set('.yt-eyebrow', { autoAlpha: 0, y: 16 });
    gsap.set('.yt-sub',     { autoAlpha: 0, y: 16 });
    gsap.set('.yt-frame',   { autoAlpha: 0, y: 60, scale: 0.97 });
    gsap.set('.yt-subscribe-btn', { autoAlpha: 0, y: 20 });

    // Split title into words (not chars — smoother, less DOM nodes)
    let titleWords = null;
    try {
        const split = new SplitType('.yt-title', { types: 'words' });
        titleWords = split.words;
        gsap.set(titleWords, { autoAlpha: 0, y: 40 });
    } catch (e) {
        gsap.set('.yt-title', { autoAlpha: 0, y: 40 });
    }

    ScrollTrigger.create({
        trigger: '.yt-section',
        start: 'top 65%',
        once: true,
        onEnter: () => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // Eyebrow fades in
            tl.to('.yt-eyebrow', { autoAlpha: 1, y: 0, duration: 0.5 })
            // Title words stagger up
              .to(titleWords || '.yt-title', {
                  autoAlpha: 1, y: 0,
                  stagger: 0.08, duration: 0.75,
              }, '-=0.25')
            // Subtitle fades in
              .to('.yt-sub', { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.45')
            // Frame lifts into view — clean y + fade, no clipPath
              .to('.yt-frame', {
                  autoAlpha: 1, y: 0, scale: 1,
                  duration: 0.85, ease: 'power2.out',
              }, '-=0.2')
            // Subscribe button
              .to('.yt-subscribe-btn', { autoAlpha: 1, y: 0, duration: 0.45 }, '-=0.4');
        },
    });
})();

gsap.from('.stamp-tag', {
    scrollTrigger: { trigger: '.stamp-tag', start: 'top 88%' },
    x: -24, autoAlpha: 0, duration: 0.6, ease: 'power2.out',
});
gsap.from('.about-meta', {
    scrollTrigger: { trigger: '.about-meta', start: 'top 88%' },
    y: 16, autoAlpha: 0, duration: 0.55, ease: 'power2.out', delay: 0.1,
});
gsap.utils.toArray('.about-body p, .about-body blockquote').forEach((el, i) => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%' },
        y: 20, autoAlpha: 0, duration: 0.65, ease: 'power2.out', delay: i * 0.08,
    });
});
gsap.from('.about-img', {
    scrollTrigger: { trigger: '.about-right', start: 'top 80%' },
    clipPath: 'inset(0% 100% 0% 0%)',
    duration: 1.1, ease: 'expo.inOut',
});
gsap.from('.img-shadow', {
    scrollTrigger: { trigger: '.about-right', start: 'top 80%' },
    x: -20, y: -20, autoAlpha: 0, duration: 0.9, ease: 'power3.out', delay: 0.5,
});
gsap.from('.img-badge', {
    scrollTrigger: { trigger: '.about-right', start: 'top 75%' },
    scale: 0.6, autoAlpha: 0, duration: 0.5, ease: 'back.out(2)', delay: 0.8,
});
gsap.to('.ag-blue',   { scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 2   }, y: 130,  ease: 'none' });
gsap.to('.ag-yellow', { scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1.5 }, y: -100, ease: 'none' });

// ══════════════════════════════════════════════════════════
// FEATURED WORK — animations
// ══════════════════════════════════════════════════════════
gsap.from('.featured-section .section-title', {
    scrollTrigger: { trigger: '.featured-section', start: 'top 82%' },
    x: -30, autoAlpha: 0, duration: 0.7, ease: 'power3.out',
});
gsap.from('.feat-vid-col .vid-frame', {
    scrollTrigger: { trigger: '.feat-grid', start: 'top 80%' },
    clipPath: 'inset(0% 100% 0% 0%)',
    duration: 1.1, ease: 'expo.inOut',
});
gsap.from('.vid-accent', {
    scrollTrigger: { trigger: '.feat-grid', start: 'top 80%' },
    x: 20, y: 20, autoAlpha: 0, duration: 0.7, ease: 'power3.out', delay: 0.7,
});
gsap.from('.feat-card', {
    scrollTrigger: { trigger: '.feat-grid', start: 'top 80%' },
    x: 40, autoAlpha: 0, duration: 0.85, ease: 'power3.out', delay: 0.2,
});

// Stats count up
gsap.utils.toArray('.fs-num').forEach(el => {
    const raw   = el.childNodes[0];
    const text  = raw ? raw.textContent.trim() : el.textContent.trim();
    const match = text.match(/^([\d.]+)([KkMm+]*)/);
    if (!match) return;
    const end    = parseFloat(match[1]);
    const suffix = match[2] || '';
    const obj    = { val: 0 };
    ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => {
            gsap.to(obj, {
                val: end, duration: 1.6, ease: 'power2.out',
                onUpdate: () => { raw.textContent = Math.round(obj.val) + suffix; },
            });
        },
    });
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%' },
        scale: 0.7, autoAlpha: 0, duration: 0.55, ease: 'back.out(2)',
    });
});

gsap.from('.ftag', {
    scrollTrigger: { trigger: '.feat-tags', start: 'top 90%' },
    y: 12, autoAlpha: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out',
});
gsap.from('.featured-section .btn', {
    scrollTrigger: { trigger: '.featured-section .btn', start: 'top 92%' },
    y: 14, autoAlpha: 0, duration: 0.5, ease: 'power2.out',
});

// ── Philosophy ────────────────────────────────────────────
gsap.to('.philo-bg-word', {
    scrollTrigger: { trigger: '.philo-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
    x: 360, ease: 'none',
});
try {
    const s = new SplitType('.philo-q', { types: 'words' });
    gsap.from(s.words, {
        scrollTrigger: { trigger: '.philo-q', start: 'top 86%' },
        y: 36, autoAlpha: 0, stagger: 0.04, duration: 0.85, ease: 'power3.out',
    });
} catch (e) {}

document.querySelectorAll('.philo-content p').forEach((p, i) => {
    gsap.from(p, {
        scrollTrigger: { trigger: p, start: 'top 90%', once: true },
        y: 16, autoAlpha: 0, duration: 0.6, ease: 'power2.out', delay: i * 0.07,
    });
});

gsap.utils.toArray('.mlist li, .purpose-word').forEach(el => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 62%', scrub: 1 },
        x: -24, autoAlpha: 0,
    });
});

// ── Skills scattered cards ────────────────────────────────
if (window.innerWidth > 768) {
    document.querySelectorAll('.tool-card').forEach((card, i) => {
        const rotations = [-3.2, 2.8, 1.5, -2.4, -1.8, 3.5];
        const rot = rotations[i] || 0;
        gsap.from(card, {
            scrollTrigger: { trigger: '.tools-grid', start: 'top 85%' },
            y: 60 + i * 12, x: (i % 2 === 0 ? -30 : 30),
            autoAlpha: 0, rotation: rot * 2.5,
            duration: 0.9, ease: 'power3.out', delay: i * 0.09,
            onComplete: () => { gsap.set(card, { rotation: rot }); }
        });
    });
} else {
    document.querySelectorAll('.tool-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 92%' },
            y: 24, autoAlpha: 0, duration: 0.55, ease: 'power2.out', delay: i * 0.05,
        });
    });
}

// ── Project card data-num ─────────────────────────────────
document.querySelectorAll('.proj-card').forEach((card, i) => {
    card.setAttribute('data-num', String(i + 1).padStart(2, '0'));
});

// ══════════════════════════════════════════════════════════
// PROJECT SHOWCASE — cards animate in, with filter
// ══════════════════════════════════════════════════════════
const workTitle = document.querySelector('.work-section .section-title');
if (workTitle) {
    workTitle.classList.remove('reveal-up');
    gsap.fromTo(workTitle,
        { x: -30, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: workTitle, start: 'top 95%', once: true } }
    );
}

const projCards = Array.from(document.querySelectorAll('.proj-card'));
projCards.forEach(card => {
    card.classList.remove('reveal-up');
    gsap.set(card, { opacity: 0, y: 55, scale: 0.95 });
});

function animateRow(cards, startDelay = 0) {
    cards.forEach((card, col) => {
        const d = startDelay + col * 0.2;
        gsap.to(card, {
            opacity: 1, y: 0, scale: 1,
            duration: 0.72, ease: 'power3.out', delay: d,
            onComplete: () => gsap.set(card, { clearProps: 'transform' }),
        });
        const thumb = card.querySelector('.proj-thumb');
        if (thumb) gsap.from(thumb, { scale: 0.88, duration: 0.85, ease: 'power2.out', delay: d + 0.12 });
        const info = card.querySelector('.proj-info');
        if (info) gsap.fromTo(info,
            { y: 16, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.42, ease: 'power2.out', delay: d + 0.28 }
        );
    });
}

ScrollTrigger.create({ trigger: projCards[0], start: 'top 86%', once: true, onEnter: () => animateRow(projCards.slice(0, 3), 0) });
ScrollTrigger.create({ trigger: projCards[3], start: 'top 88%', once: true, onEnter: () => animateRow(projCards.slice(3, 6), 0) });

// ── Filter buttons ────────────────────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        projCards.forEach(card => {
            const cat = card.dataset.category || 'all';
            const show = filter === 'all' || cat === filter;
            gsap.to(card, {
                opacity: show ? 1 : 0.25,
                scale: show ? 1 : 0.97,
                duration: 0.3, ease: 'power2.out',
            });
            card.style.pointerEvents = show ? '' : 'none';
        });
    });
});

// ── Real YouTube thumbnails on project cards ─────────────
(function () {
    // Map card data-video-id to videoMeta for thumbnail lookup
    document.querySelectorAll('.proj-card[data-video-id]').forEach(card => {
        const id   = card.dataset.videoId;
        const meta = videoMeta[id];
        if (!meta) return;
        const thumb = card.querySelector('.proj-thumb');
        if (!thumb) return;

        if (meta.type === 'youtube' || meta.type === 'short') {
            // Try maxresdefault, fall back to hqdefault
            const imgUrl = `https://img.youtube.com/vi/${meta.id}/hqdefault.jpg`;
            thumb.style.backgroundImage = `url('${imgUrl}')`;
            thumb.style.backgroundSize  = 'cover';
            thumb.style.backgroundPosition = 'center';

            // Try max-res first, silently fall back
            const probe = new Image();
            probe.onload = () => {
                if (probe.naturalWidth > 120) {
                    thumb.style.backgroundImage = `url('https://img.youtube.com/vi/${meta.id}/maxresdefault.jpg')`;
                }
            };
            probe.src = `https://img.youtube.com/vi/${meta.id}/maxresdefault.jpg`;
        }
        // Drive files keep their gradient background
    });
})();

// ══════════════════════════════════════════════════════════
// VIDEO MODAL — with real YouTube embed + Escape key
// ══════════════════════════════════════════════════════════
const modal      = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const modalScreen= document.getElementById('modalScreen');
const modalTitle = document.getElementById('modalTitle');
const modalBox   = document.getElementById('modalBox');
let   activeThumb = null;
let   lastFocused = null;


//footer section animation
gsap.from('.social-tile', {
    scrollTrigger: { trigger: '.social-row', start: 'top 88%' },
    y: 30, autoAlpha: 0, stagger: 0.12,
    duration: 0.6, ease: 'power3.out',
});



// ── Video registry ────────────────────────────────────────
const videoMeta = {
    featured1: { id: 'GXsNEZdMbBc', type: 'youtube', title: 'Silence Between Frames',
                 tag: 'CINEMA ESSAY', desc: 'A cinematic deep-dive into the emotional power of negative space — how the moments between cuts define a film\'s soul.',
                 meta: [['Views','50K+'],['Editing','90 hrs'],['Runtime','18 min']] },
    proj1:     { id: '7rNf4TygTEw', type: 'youtube', title: 'Frames That Broke Us',
                 tag: 'VIDEO ESSAY', desc: 'Exploring the cuts, the silences, and the compositions that shattered our perception of what cinema can be.',
                 meta: [['Type','Essay'],['Format','YouTube'],['Category','Cinema']] },
    proj2:     { id: 'E8WvVFB7klo', type: 'youtube', title: 'Golden Hour Noir',
                 tag: 'NARRATIVE SHORT', desc: 'A short film that plays with golden-hour light as both a visual style and emotional metaphor for endings.',
                 meta: [['Type','Short Film'],['Tone','Noir'],['Color','Cinematic']] },
    proj3:     { id: '1V7s1Uhwp3hlsEPXw1Ak3bYLTsoTlEENI', type: 'drive', title: 'The Uncut Truth',
                 tag: 'DOCUMENTARY EDIT', desc: 'A documentary edit that lets raw footage breathe — no music, no narration, just the truth in every frame.',
                 meta: [['Type','Documentary'],['Tools','Premiere Pro'],['Grade','DaVinci']] },
    proj4:     { id: '15Symfk-qvGEtbBEG6sWaaKqdUErEPEpW', type: 'drive', title: 'Brand in Motion',
                 tag: 'COMMERCIAL EDIT', desc: 'Brand storytelling through fast-paced editing, motion graphics and precise color grading for maximum visual impact.',
                 meta: [['Type','Commercial'],['Tools','After Effects'],['Grade','Lumetri']] },
    proj5:     { id: 'Te60HUvDC5w', type: 'short', title: 'Cinematic Pulse',
                 tag: '⚡ YOUTUBE SHORT', desc: 'Vertical storytelling — fast, punchy, every second earns its place in this cinematic short-form piece.',
                 meta: [['Format','9:16'],['Length','< 60 sec'],['Platform','Shorts']] },
    proj6:     { id: 'KiQfJWcboAg', type: 'short', title: 'Street Energy',
                 tag: '⚡ YOUTUBE SHORT', desc: 'Raw street footage transformed through editing rhythm and sound design into a kinetic visual poem.',
                 meta: [['Format','9:16'],['Length','< 60 sec'],['Platform','Shorts']] },
    short1:    { id: 'VaIK3nOEJhg', type: 'short', title: 'The Reveal',
                 tag: '⚡ YOUTUBE SHORT', desc: 'A single reveal moment stretched into 32 seconds of pure cinematic tension.',
                 meta: [['Duration','0:32'],['Format','9:16'],['Style','Tension']] },
    short2:    { id: 'biz9dt3WI-Q', type: 'short', title: 'After Midnight',
                 tag: '⚡ YOUTUBE SHORT', desc: 'Late-night aesthetics — moody color grading and minimal cuts create an atmosphere that lingers.',
                 meta: [['Duration','0:28'],['Format','9:16'],['Mood','Moody']] },
    short3:    { id: '0qDoA_gSulQ', type: 'short', title: 'One Take',
                 tag: '⚡ YOUTUBE SHORT', desc: 'No cuts. No edits. One continuous take that proves sometimes restraint is the best edit of all.',
                 meta: [['Duration','0:44'],['Format','9:16'],['Style','Minimal']] },
    short4:    { id: 'Rr7MueDRwDU', type: 'short', title: 'Motion Study',
                 tag: '⚡ YOUTUBE SHORT', desc: 'A study in movement — how camera motion and subject motion create a visual conversation.',
                 meta: [['Duration','0:38'],['Format','9:16'],['Focus','Motion']] },
    short5:    { id: 'EUEsxEKYs0I', type: 'short', title: 'Raw Cut',
                 tag: '⚡ YOUTUBE SHORT', desc: 'Unpolished, unfiltered, uncut. The beauty of chaos when every frame has something to say.',
                 meta: [['Duration','0:55'],['Format','9:16'],['Style','Raw']] },
};

function addWatchButton(meta) {
    if (!modalScreen) return;
    // Don't add twice
    if (modalScreen.querySelector('.modal-watch-btn')) return;
    const watchURL = getYouTubeWatchURL(meta);
    const btn = document.createElement('a');
    btn.href      = watchURL;
    btn.target    = '_blank';
    btn.rel       = 'noopener';
    btn.className = 'modal-watch-btn';
    btn.textContent = '↗ WATCH ON YOUTUBE';
    modalScreen.appendChild(btn);
}

function getYouTubeWatchURL(meta) {
    if (meta.type === 'short') return `https://youtube.com/shorts/${meta.id}`;
    return `https://youtu.be/${meta.id}`;
}

function showEmbedFallback(meta) {
    if (!modalScreen) return;
    const watchURL = getYouTubeWatchURL(meta);
    modalScreen.innerHTML = `
        <div class="modal-fallback">
            <div class="mf-icon">▶</div>
            <p class="mf-msg">This video can't be played here<br><span>Embedding is disabled by the owner on YouTube</span></p>
            <a href="${watchURL}" target="_blank" rel="noopener" class="btn btn-hero-y mf-btn">WATCH ON YOUTUBE ↗</a>
            <p class="mf-fix">To fix: YouTube Studio → Content → Select video → Details → More options → Enable embedding</p>
        </div>`;
}

// ── YouTube IFrame API ready callback (global) ────────────
window.onYouTubeIframeAPIReady = function() { window._ytApiReady = true; };

function getThumb(id) {
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

function buildBlockedScreen(meta) {
    // Beautiful fallback shown when embedding is disabled on that video
    const isShort = meta.type === 'short';
    return `
    <div class="modal-blocked" style="background-image:url('${getThumb(meta.id)}')">
        <div class="mb-vignette"></div>
        <div class="mb-body">
            <span class="mb-tag">${isShort ? '⚡ SHORT' : '▶ VIDEO'}</span>
            <h3 class="mb-title">${meta.title}</h3>
            <div class="mb-steps">
                <p class="mb-head">Enable in-page playback in 3 steps:</p>
                <ol class="mb-list">
                    <li>Open <strong>YouTube Studio</strong></li>
                    <li>Content → select this video → Details → More options</li>
                    <li>Tick <strong>✅ Allow embedding</strong> → Save</li>
                </ol>
            </div>
        </div>
    </div>`;
}

function openModal(id, trigger) {
    const meta = videoMeta[id];
    if (!meta) return;
    lastFocused = document.activeElement;
    activeThumb = trigger;

    const isShort  = meta.type === 'short';
    
    // Check for inline play (Featured Section & Shorts)
    if (trigger && trigger.dataset.playInline === 'true') {
        const iframeHost = trigger.querySelector('.short-iframe-host') || 
                           trigger.querySelector('.feat-iframe-host') ||
                           document.getElementById('featuredIframeHost');
        
        if (iframeHost && !trigger.classList.contains('video-active')) {
            trigger.classList.add('video-active');
            let params = `autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&enablejsapi=1`;
            if (isShort) params += `&loop=1&playlist=${meta.id}`;
            
            const uniqueId = `loader-${Math.floor(Math.random() * 10000)}`;

            iframeHost.innerHTML = `
                <div class="short-loader" id="${uniqueId}"><div class="myw-spinner"></div></div>
                <iframe src="https://www.youtube.com/embed/${meta.id}?${params}" 
                    title="${meta.title}" frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen
                    onload="document.getElementById('${uniqueId}').style.display='none'"></iframe>`;
            trigger.style.cursor = 'default';
            return;
        } else if (trigger && trigger.classList.contains('video-active')) {
            return;
        }
    }

    const thumb    = meta.type !== 'drive'
        ? `https://img.youtube.com/vi/${meta.id}/maxresdefault.jpg`
        : '';

    // ── Hero background ────────────────────────────────────
    const heroBg = document.getElementById('modalHeroBg');
    if (heroBg && thumb) {
        heroBg.style.backgroundImage = `url('${thumb}')`;
    }

    // ── Info panel ─────────────────────────────────────────
    const infoTag   = document.getElementById('modalInfoTag');
    const infoTitle = document.getElementById('modalInfoTitle');
    const infoDesc  = document.getElementById('modalInfoDesc');
    const infoMeta  = document.getElementById('modalInfoMeta');

    if (infoTag)   infoTag.textContent   = meta.tag   || 'PROJECT';
    if (infoTitle) infoTitle.textContent = meta.title || '—';
    if (infoDesc)  infoDesc.textContent  = meta.desc  || '';
    if (infoMeta && meta.meta) {
        infoMeta.innerHTML = meta.meta.map(([lbl, val]) =>
            `<div class="mim-item"><span class="mim-lbl">${lbl}</span><span class="mim-val">${val}</span></div>`
        ).join('');
    }

    // ── Short format: narrow player ────────────────────────
    const playerFrame = document.getElementById('modalScreen');
    if (playerFrame) {
        playerFrame.classList.toggle('is-short', isShort);
    }

    // ── Bottom title bar ───────────────────────────────────
    if (modalTitle) modalTitle.textContent = meta.title;

    // ── Video embed ────────────────────────────────────────
    if (modalScreen) {
        if (meta.type === 'drive') {
            modalScreen.innerHTML = `
                <iframe src="https://drive.google.com/file/d/${meta.id}/preview"
                    title="${meta.title}" frameborder="0"
                    allow="autoplay" allowfullscreen
                    style="width:100%;height:100%;border:none;"></iframe>`;
        } else {
            const iframeId = 'yt-iframe-' + Date.now();
            const src = `https://www.youtube.com/embed/${meta.id}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1&showinfo=0&origin=${window.location.origin}`;
            
            modalScreen.innerHTML = `
                <div class="modal-yt-wrap" style="background-image:url('${thumb}')">
                    <div class="myw-vignette"></div>
                    <div class="myw-loader" id="modalLoader"><div class="myw-spinner"></div></div>
                    <iframe id="${iframeId}" 
                        src="${src}" 
                        title="${meta.title}" 
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen
                        style="position:absolute;inset:0;width:100%;height:100%;border:none;z-index:10;pointer-events:all;">
                    </iframe>
                </div>`;

            const iframe = document.getElementById(iframeId);
            if (iframe) {
                iframe.onload = () => {
                    const loader = document.getElementById('modalLoader');
                    if (loader) loader.style.display = 'none';
                };
                // Fallback for loader if onload doesn't fire (rare)
                setTimeout(() => {
                    const loader = document.getElementById('modalLoader');
                    if (loader) loader.style.display = 'none';
                }, 3500);
            }
        }
    }

    // ── Open modal ─────────────────────────────────────────
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    lenis.stop();

    if (typeof gsap !== 'undefined') {
        gsap.fromTo('#modalBox',
            { y: 40, opacity: 0 },
            { y: 0,  opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
        gsap.fromTo('.modal-hero-bg',
            { scale: 1.08 },
            { scale: 1, duration: 0.8, ease: 'power2.out' }
        );
        gsap.fromTo('#modalInfoCol',
            { x: 30, opacity: 0 },
            { x: 0,  opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.15 }
        );
    }

    setTimeout(() => { if (modalClose) modalClose.focus(); }, 100);
}

function closeModal() {
    if (!modal.classList.contains('active')) return;

    const iframe = modalScreen && modalScreen.querySelector('iframe');
    if (iframe && iframe._cleanupMsg) iframe._cleanupMsg();

    if (typeof gsap !== 'undefined') {
        gsap.to('#modalBox', {
            y: 30, opacity: 0, duration: 0.28, ease: 'power3.in',
            onComplete: finishClose,
        });
    } else { finishClose(); }

    function finishClose() {
        modal.classList.remove('active');
        if (modalScreen) {
            modalScreen.innerHTML = `<div class="modal-placeholder"><div class="mp-icon">▶</div><p>Select a project to watch</p></div>`;
            modalScreen.classList.remove('is-short');
        }
        const heroBg = document.getElementById('modalHeroBg');
        if (heroBg) heroBg.style.backgroundImage = '';
        if (modalTitle) modalTitle.textContent = '—';
        const infoTitle = document.getElementById('modalInfoTitle');
        if (infoTitle) infoTitle.textContent = '—';
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        lenis.start();
        if (lastFocused) lastFocused.focus();
        activeThumb = null;
    }
}

// ── Play trigger — event delegation (robust, works regardless of GSAP state) ──
// ── Unified Video Handler (Inline vs Modal) ────────────────
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.play-trigger');
    if (!trigger) return;
    
    const videoKey = trigger.dataset.videoId;
    if (!videoKey) return;

    // Check for inline play (Featured Section)
    if (trigger.dataset.playInline === 'true') {
        const container = document.getElementById('featuredVidContainer');
        const triggerEl = container ? container.querySelector('.featured-inline-trigger') : null;
        const iframeHost = document.getElementById('featuredIframeHost');
        
        if (triggerEl && iframeHost && !triggerEl.classList.contains('video-active')) {
            const meta = videoMeta[videoKey];
            const videoId = meta ? meta.id : videoKey;
            
            triggerEl.classList.add('video-active');
            iframeHost.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&enablejsapi=1" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen>
                </iframe>`;
            triggerEl.style.cursor = 'default';
            return;
        } else if (triggerEl && triggerEl.classList.contains('video-active')) {
            return;
        }
    }

    // Default: Open in Modal
    openModal(videoKey, trigger);
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('.play-trigger');
    if (!trigger) return;
    e.preventDefault();
    trigger.click(); 
});

// ESCAPE key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ── Nav smooth scroll ─────────────────────────────────────
document.querySelectorAll('.nav-link[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
        e.preventDefault();
        lenis.scrollTo(this.getAttribute('href'), {
            offset: -70, duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
    });
});

// ── Scroll top (handler — button declared at top) ────────
if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
        lenis.scrollTo(0, { duration: 1.4, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    });
}

// ── Footer heading data-text ──────────────────────────────
const fh = document.querySelector('.footer-h');
if (fh && !fh.dataset.text) fh.setAttribute('data-text', fh.textContent);

// ── Magnetic button effect (hero CTAs) ───────────────────
if (window.innerWidth > 768) {
    document.querySelectorAll('.btn.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width  / 2;
            const cy = rect.top  + rect.height / 2;
            const dx = (e.clientX - cx) * 0.22;
            const dy = (e.clientY - cy) * 0.22;
            gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        });
    });
}
// ── Shorts strip — drag to scroll + cursor hover ─────────
(function () {
    const track = document.querySelector('.shorts-track');
    if (!track) return;

    let isDown = false, startX = 0, scrollLeft = 0;

    track.addEventListener('mousedown', (e) => {
        isDown = true;
        track.classList.add('is-dragging');
        startX    = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
    });
    track.addEventListener('mouseleave', () => { isDown = false; track.classList.remove('is-dragging'); });
    track.addEventListener('mouseup',    () => { isDown = false; track.classList.remove('is-dragging'); });
    track.addEventListener('mousemove',  (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x    = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 1.4;
        track.scrollLeft = scrollLeft - walk;
    });

    // Animate cards on scroll into view
    const shortCards = track.querySelectorAll('.short-card');
    gsap.set(shortCards, { y: 40, opacity: 0 });
    ScrollTrigger.create({
        trigger: '.shorts-section',
        start: 'top 80%',
        once: true,
        onEnter: () => {
            gsap.to(shortCards, {
                y: 0, opacity: 1,
                stagger: 0.1, duration: 0.65, ease: 'power3.out',
            });
        },
    });
})();
