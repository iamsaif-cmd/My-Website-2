// 1. Register GSAP Plugins FIRST
gsap.registerPlugin(ScrollTrigger);

// ── Adaptive Refresh Rate (60/90/120/144Hz) ──
// GSAP ticker auto-adapts to screen refresh rate via rAF
gsap.ticker.fps(-1); // -1 = match device display rate (fully adaptive)

// 2. Initialize Lenis Smooth Scroll
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.8,
    touchMultiplier: 1.5,
    infinite: false,
});

// Sync Lenis scroll position with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

// Use GSAP ticker to drive Lenis — fully adaptive to device refresh rate
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

// Prevent GSAP ticker lag compensation from conflicting
gsap.ticker.lagSmoothing(0);

// ── Disable right-click context menu ──
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ── Disable text selection via keyboard/mouse ──
document.addEventListener('selectstart', (e) => e.preventDefault());

// ── Disable image/element drag ──
document.addEventListener('dragstart', (e) => e.preventDefault());


// 3. Preloader Logic
const loader = document.getElementById('loader');
const progressBar = document.querySelector('.progress-bar');
const progressText = document.querySelector('.progress-text');

let progress = 0;
const loadInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 10) + 2;
    if (progress > 100) progress = 100;
    
    gsap.to(progressBar, { width: progress + '%', duration: 0.1 });
    progressText.innerText = progress.toString().padStart(2, '0');
    
    if (progress === 100) {
        clearInterval(loadInterval);
        setTimeout(initSite, 500);
    }
}, 50);

function initSite() {
    try {
        const tl = gsap.timeline({
            onComplete: () => {
                // Ensure loader is truly gone after animation
                if (loader) { loader.style.display = 'none'; }
            }
        });
        
        tl.to(loader, {
            yPercent: -100,
            duration: 1.5,
            ease: "power4.inOut"
        })
        .from(".line span", {
            yPercent: 100,
            duration: 1.2,
            stagger: 0.2,
            ease: "power4.out"
        }, "-=0.5")
        .from(".hero-badge, .hero-meta, .hero-scroll-indicator", {
            opacity: 0,
            y: 20,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out"
        }, "-=1")
        .from(".hero-image-wrap", {
            scale: 1.08,
            opacity: 0,
            duration: 1.5,
            ease: "power4.out"
        }, "-=1.2")
        .from(".hero-bottom", {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: "power3.out"
        }, "-=1")
        .from(".main-header", {
            y: -80,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        }, "-=1.5");
    } catch(err) {
        // Fallback: show everything immediately if GSAP animation fails
        console.warn('initSite animation error, showing content:', err);
        if (loader) { loader.style.opacity = '0'; loader.style.pointerEvents = 'none'; }
        document.querySelector('.main-header').style.opacity = '1';
        document.querySelector('.main-header').style.transform = 'none';
    }
}

// 5. Parallax Effect on All Parallax Images
const parallaxImages = document.querySelectorAll('.parallax-img');
parallaxImages.forEach(img => {
    gsap.fromTo(img, {
        yPercent: -10
    }, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
            trigger: img.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });
});

// 6. Section Reveal Animations (with CSS fallback)
const revealItems = document.querySelectorAll('.reveal-item');

// Safety fallback: if ScrollTrigger doesn't fire (e.g., elements above fold),
// force-show all items after a generous timeout
const revealFallback = setTimeout(() => {
    revealItems.forEach(item => {
        gsap.set(item, { opacity: 1, y: 0 });
    });
}, 3500);

revealItems.forEach(item => {
    gsap.to(item, {
        scrollTrigger: {
            trigger: item,
            start: "top 88%",
            toggleActions: "play none none none",
            onEnter: () => clearTimeout(revealFallback)
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out"
    });
});

// 7. Service Hover Image Logic (with null guard for mobile)
const serviceItems = document.querySelectorAll('.service-item');
const serviceImg = document.querySelector('.active-service-img');

serviceItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        serviceItems.forEach(si => si.classList.remove('active'));
        item.classList.add('active');
        
        if (!serviceImg) return; // Guard: hidden on mobile
        const newImg = item.getAttribute('data-img');
        if (!newImg) return;
        gsap.to(serviceImg, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                serviceImg.src = newImg;
                gsap.to(serviceImg, { opacity: 1, duration: 0.3 });
            }
        });
    });
});

// 8. Stats Counter — targets .stat-num elements
const counters = document.querySelectorAll('.stat-num');
counters.forEach(counter => {
    const rawText = counter.innerText;
    const target = parseInt(rawText);           // "14+" → 14, "120+" → 120
    const suffix = rawText.replace(/[0-9]/g, ''); // Extract suffix like "+"
    if (isNaN(target)) return;
    
    let hasAnimated = false;
    ScrollTrigger.create({
        trigger: counter,
        start: "top 90%",
        onEnter: () => {
            if (hasAnimated) return;
            hasAnimated = true;
            let obj = { val: 0 };
            gsap.to(obj, {
                val: target,
                duration: 2,
                ease: "power2.out",
                onUpdate: () => {
                    counter.innerText = Math.ceil(obj.val) + suffix;
                }
            });
        }
    });
});

// 9. Header Scroll Appearance
ScrollTrigger.create({
    start: "top -50",
    onUpdate: (self) => {
        if (self.direction === 1) {
            document.querySelector('.main-header').classList.add('scrolled');
        } else if (self.scroll() < 50) {
            document.querySelector('.main-header').classList.remove('scrolled');
        }
    }
});

// 11. Background Image Sequence Evolution (Canvas)
const canvas = document.getElementById("evolution-canvas");

if (canvas) {
    const context = canvas.getContext("2d");
    // Lower resolution on mobile saves GPU memory & fill-rate
    const isMobileCanvas = window.innerWidth < 768;
    canvas.width  = isMobileCanvas ? 960  : 1920;
    canvas.height = isMobileCanvas ? 540  : 1080;

    const frameCount  = 122;
    const currentFrame = index =>
        `assets/images/evolution/frame-${(index + 1).toString().padStart(3, '0')}.jpg`;

    // Pre-fill with nulls — frames are loaded on-demand
    const images    = new Array(frameCount).fill(null);
    const evolution = { frame: 0 };

    // ── Load ONLY the first frame now so something renders immediately ──
    const firstImg   = new Image();
    firstImg.onload  = () => render();
    firstImg.src     = currentFrame(0);
    images[0]        = firstImg;

    // ── Lazy batch loader — runs AFTER page load, low priority ──
    function loadFramesBatch(from, batchSize) {
        if (from >= frameCount) return;
        const to = Math.min(from + batchSize, frameCount);
        for (let i = from; i < to; i++) {
            if (!images[i]) {
                const img = new Image();
                img.src   = currentFrame(i);
                images[i] = img;
            }
        }
        if (to < frameCount) {
            setTimeout(() => loadFramesBatch(to, batchSize), 200);
        }
    }

    // Start loading the rest 2 s after page load so critical
    // resources (hero img, fonts, GSAP) always get full bandwidth
    window.addEventListener('load', () => {
        setTimeout(() => loadFramesBatch(1, 6), 2000);
    });

    gsap.to(evolution, {
        frame: frameCount - 1,
        snap:  "frame",
        ease:  "none",
        scrollTrigger: {
            trigger: "#main-content",
            start:   "top top",
            end:     "bottom bottom",
            scrub:   0.5
        },
        onUpdate: render
    });

    function render() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Find the nearest already-loaded frame (search backwards)
        let img = null;
        for (let i = evolution.frame; i >= 0; i--) {
            const candidate = images[i];
            if (candidate && candidate.complete && candidate.naturalWidth > 0) {
                img = candidate;
                break;
            }
        }

        if (img) {
            const canvasAspect = canvas.width  / canvas.height;
            const imgAspect    = img.naturalWidth / img.naturalHeight;
            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgAspect > canvasAspect) {
                drawHeight = canvas.height;
                drawWidth  = canvas.height * imgAspect;
                offsetX    = -(drawWidth  - canvas.width)  / 2;
                offsetY    = 0;
            } else {
                drawWidth  = canvas.width;
                drawHeight = canvas.width  / imgAspect;
                offsetX    = 0;
                offsetY    = -(drawHeight - canvas.height) / 2;
            }
            context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
    }

    window.addEventListener('resize', render);
}

// Refresh ScrollTrigger after init
window.addEventListener('load', () => {
    ScrollTrigger.refresh();
});

// ── Mobile Menu Logic ──
const menuTrigger = document.getElementById('menuTrigger');
const mobileMenu  = document.getElementById('mobileMenu');
const menuClose   = document.getElementById('mobileMenuClose');
const mobileLinks = document.querySelectorAll('.mobile-nav-link');

function openMenu() {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
    lenis.stop();

    // Stagger animate links in
    gsap.fromTo(mobileLinks,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.15 }
    );
}

function closeMenu() {
    gsap.to(mobileLinks, {
        opacity: 0, y: -20,
        duration: 0.3, stagger: 0.05, ease: 'power2.in',
        onComplete: () => {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
            lenis.start();
        }
    });
}

if (menuTrigger) menuTrigger.addEventListener('click', openMenu);
if (menuClose)   menuClose.addEventListener('click', closeMenu);

// Close on nav link click
mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Close on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
});

// ── Fix: Ensure page-navigation links always work (Lenis fix) ──
document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Only intercept actual page links (not hash anchors)
    if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel')) {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            lenis.stop();
            window.location.href = href;
        });
    }
});
