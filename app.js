/**
 * Torn Target Tracker - Website JavaScript
 * Handles navigation, animations, and interactive features
 * @version 3.0.0
 * @author Robin Doak
 */

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        particleCount: { mobile: 15, desktop: 30 },
        mobileBreakpoint: 900,
        scrollThreshold: 50,
        throttleDelay: 16, // ~60fps
        resizeThrottle: 250,
        revealOffset: 100,
        backToTopThreshold: 300,
        swipeThreshold: 50,
        lazyLoadMargin: '100px',
        navbarHideThreshold: 5,
        screenshotAutoplayInterval: 5000,
        progressRingCircumference: 125.6 // 2 * PI * 20 (radius)
    };

    // ===== STATE =====
    const state = {
        lastScrollY: 0,
        scrollDirection: 'up',
        ticking: false,
        isNavbarHidden: false,
        screenshotAutoplay: null,
        hasShownBackToTop: false
    };

    // ===== DOM ELEMENTS =====
    const elements = {
        navbar: document.getElementById('navbar'),
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        mobileMenu: document.getElementById('mobile-menu'),
        mobileMenuClose: document.getElementById('mobile-menu-close'),
        mobileMenuOverlay: document.getElementById('mobile-menu-overlay'),
        mobileNavLinks: document.querySelectorAll('.mobile-nav-link'),
        particlesContainer: document.getElementById('particles'),
        screenshotTabs: document.querySelectorAll('.screenshot-tab'),
        screenshots: document.querySelectorAll('.screenshot-frame img'),
        screenshotCaption: document.getElementById('screenshot-caption'),
        backToTopBtn: null, // Will be set in init
        progressRing: null  // Will be set in init
    };

    // Screenshot captions mapping
    const captions = {
        home: 'Target Command Center — Your central hub for all operations',
        stats: 'Statistics Dashboard — Real-time insights and analytics',
        history: 'Attack History — Premium timeline of your recent attacks',
        npc: 'NPC Loot Timer — Track loot levels for Torn NPCs and bosses',
        bounty: 'Bounty Tracker — Manage bounty targets and statistics',
        ratelimit: 'Rate Limit Popover — Detailed API rate limit breakdown',
        backup: 'Backup & Restore — Full data backup to file'
    };

    // ===== UTILITY FUNCTIONS =====

    /**
     * Throttle function using requestAnimationFrame for smooth performance
     * @param {Function} func - Function to throttle
     * @returns {Function} - Throttled function
     */
    function rafThrottle(func) {
        let ticking = false;
        return function(...args) {
            if (!ticking) {
                requestAnimationFrame(() => {
                    func.apply(this, args);
                    ticking = false;
                });
                ticking = true;
            }
        };
    }

    /**
     * Throttle function for performance optimization
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} - Throttled function
     */
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Debounce function for delayed execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * Safely query DOM element with error handling
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element
     * @returns {Element|null}
     */
    function $(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (e) {
            console.warn(`Invalid selector: ${selector}`);
            return null;
        }
    }

    /**
     * Safely query all DOM elements with error handling
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element
     * @returns {NodeList}
     */
    function $$(selector, context = document) {
        try {
            return context.querySelectorAll(selector);
        } catch (e) {
            console.warn(`Invalid selector: ${selector}`);
            return [];
        }
    }

    /**
     * Check if user prefers reduced motion
     * @returns {boolean}
     */
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Check if device is mobile
     * @returns {boolean}
     */
    function isMobile() {
        return window.innerWidth < CONFIG.mobileBreakpoint;
    }

    /**
     * Check if device supports touch
     * @returns {boolean}
     */
    function isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Get scroll percentage of the page
     * @returns {number} - Scroll percentage (0-1)
     */
    function getScrollPercent() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        return docHeight > 0 ? clamp(scrollTop / docHeight, 0, 1) : 0;
    }

    // ===== MOBILE MENU =====

    /**
     * Open mobile menu with animations
     */
    function openMobileMenu() {
        const { mobileMenu, mobileMenuOverlay, mobileMenuBtn } = elements;
        if (!mobileMenu || !mobileMenuOverlay || !mobileMenuBtn) return;

        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        mobileMenuBtn.classList.add('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');

        // Animate menu items with staggered delay
        const menuItems = mobileMenu.querySelectorAll('.mobile-nav-item');
        menuItems.forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.05}s`;
        });

        // Focus first focusable element for accessibility
        const firstFocusable = mobileMenu.querySelector('a, button');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    }

    /**
     * Close mobile menu
     */
    function closeMobileMenu() {
        const { mobileMenu, mobileMenuOverlay, mobileMenuBtn } = elements;
        if (!mobileMenu || !mobileMenuOverlay || !mobileMenuBtn) return;

        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
        mobileMenuBtn.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');

        // Reset transition delays
        const menuItems = mobileMenu.querySelectorAll('.mobile-nav-item');
        menuItems.forEach(item => {
            item.style.transitionDelay = '0s';
        });

        // Return focus to menu button
        mobileMenuBtn.focus();
    }

    /**
     * Toggle mobile menu state
     */
    function toggleMobileMenu() {
        if (!elements.mobileMenu) return;
        elements.mobileMenu.classList.contains('active') ? closeMobileMenu() : openMobileMenu();
    }

    /**
     * Check if mobile menu is open
     * @returns {boolean}
     */
    function isMobileMenuOpen() {
        return elements.mobileMenu && elements.mobileMenu.classList.contains('active');
    }

    // ===== NAVIGATION =====

    /**
     * Handle navbar scroll effect with auto-hide on scroll down
     */
    function handleNavbarScroll() {
        const { navbar } = elements;
        if (!navbar) return;

        const currentScrollY = window.scrollY;
        const scrollDiff = currentScrollY - state.lastScrollY;

        // Add/remove scrolled class for background
        navbar.classList.toggle('scrolled', currentScrollY > CONFIG.scrollThreshold);

        // Auto-hide navbar on scroll down (only on desktop and when not at top)
        if (!isMobile() && currentScrollY > CONFIG.scrollThreshold * 2) {
            if (scrollDiff > CONFIG.navbarHideThreshold && !state.isNavbarHidden) {
                navbar.style.transform = 'translateY(-100%)';
                state.isNavbarHidden = true;
            } else if (scrollDiff < -CONFIG.navbarHideThreshold && state.isNavbarHidden) {
                navbar.style.transform = 'translateY(0)';
                state.isNavbarHidden = false;
            }
        } else {
            navbar.style.transform = 'translateY(0)';
            state.isNavbarHidden = false;
        }

        state.lastScrollY = currentScrollY;
    }

    /**
     * Initialize smooth scroll for anchor links
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    if (isMobileMenuOpen()) {
                        closeMobileMenu();
                    }

                    const navbarHeight = elements.navbar ? elements.navbar.offsetHeight : 0;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
                    });

                    // Update URL without triggering scroll
                    history.pushState(null, '', href);
                }
            });
        });
    }

    // ===== PARTICLES =====

    /**
     * Generate floating particles
     */
    function generateParticles() {
        if (!elements.particlesContainer || prefersReducedMotion()) return;

        // Clear existing particles
        elements.particlesContainer.innerHTML = '';

        const count = isMobile() ? CONFIG.particleCount.mobile : CONFIG.particleCount.desktop;

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 20}s;
                animation-duration: ${15 + Math.random() * 15}s;
                ${Math.random() > 0.5 ? 'background: #ff006e;' : ''}
            `;
            fragment.appendChild(particle);
        }
        elements.particlesContainer.appendChild(fragment);
    }

    // ===== SCREENSHOT GALLERY =====

    /**
     * Switch to a specific screenshot tab
     * @param {number} index - Tab index to switch to
     */
    function switchScreenshotTab(index) {
        const { screenshotTabs, screenshots, screenshotCaption } = elements;
        if (!screenshotTabs.length) return;

        const tab = screenshotTabs[index];
        if (!tab) return;

        const target = tab.dataset.tab;

        // Update tabs
        screenshotTabs.forEach((t, i) => {
            t.classList.toggle('active', i === index);
            t.setAttribute('aria-selected', i === index ? 'true' : 'false');
            t.setAttribute('tabindex', i === index ? '0' : '-1');
        });

        // Update screenshots with fade effect
        screenshots.forEach(img => {
            img.classList.toggle('active', img.dataset.screenshot === target);
        });

        // Update caption
        if (screenshotCaption && captions[target]) {
            screenshotCaption.textContent = captions[target];
        }
    }

    /**
     * Get current active screenshot index
     * @returns {number}
     */
    function getActiveScreenshotIndex() {
        const tabs = Array.from(elements.screenshotTabs);
        return tabs.findIndex(tab => tab.classList.contains('active'));
    }

    /**
     * Initialize screenshot gallery tabs
     */
    function initScreenshotTabs() {
        const { screenshotTabs } = elements;
        if (!screenshotTabs || screenshotTabs.length === 0) return;

        screenshotTabs.forEach((tab, index) => {
            // Click handler
            tab.addEventListener('click', () => switchScreenshotTab(index));

            // Keyboard navigation
            tab.addEventListener('keydown', (e) => {
                const tabs = Array.from(screenshotTabs);
                let nextIndex;

                switch (e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        nextIndex = (index + 1) % tabs.length;
                        tabs[nextIndex].focus();
                        switchScreenshotTab(nextIndex);
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        nextIndex = (index - 1 + tabs.length) % tabs.length;
                        tabs[nextIndex].focus();
                        switchScreenshotTab(nextIndex);
                        break;
                    case 'Home':
                        e.preventDefault();
                        tabs[0].focus();
                        switchScreenshotTab(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        tabs[tabs.length - 1].focus();
                        switchScreenshotTab(tabs.length - 1);
                        break;
                }
            });
        });
    }

    /**
     * Start screenshot autoplay rotation
     */
    function startScreenshotAutoplay() {
        if (state.screenshotAutoplay || prefersReducedMotion()) return;

        state.screenshotAutoplay = setInterval(() => {
            const currentIndex = getActiveScreenshotIndex();
            const nextIndex = (currentIndex + 1) % elements.screenshotTabs.length;
            switchScreenshotTab(nextIndex);
        }, CONFIG.screenshotAutoplayInterval);
    }

    /**
     * Stop screenshot autoplay rotation
     */
    function stopScreenshotAutoplay() {
        if (state.screenshotAutoplay) {
            clearInterval(state.screenshotAutoplay);
            state.screenshotAutoplay = null;
        }
    }

    // ===== SCROLL ANIMATIONS =====

    /**
     * Initialize scroll reveal using Intersection Observer for better performance
     */
    function initScrollReveal() {
        const reveals = $$('.reveal');

        if (prefersReducedMotion()) {
            reveals.forEach(el => el.classList.add('visible'));
            return;
        }

        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: `-${CONFIG.revealOffset}px`
            });

            reveals.forEach(el => revealObserver.observe(el));
        } else {
            // Fallback for older browsers
            handleScrollRevealFallback();
        }
    }

    /**
     * Fallback scroll reveal for older browsers
     */
    function handleScrollRevealFallback() {
        const reveals = $$('.reveal:not(.visible)');
        const windowHeight = window.innerHeight;

        reveals.forEach(el => {
            const top = el.getBoundingClientRect().top;
            if (top < windowHeight - CONFIG.revealOffset) {
                el.classList.add('visible');
            }
        });
    }

    // ===== IMAGE PRELOADING & LAZY LOADING =====

    /**
     * Preload screenshot images for smoother transitions
     */
    function preloadImages() {
        const imageUrls = Array.from(elements.screenshots).map(img => img.src).filter(Boolean);

        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    /**
     * Initialize lazy loading for images using Intersection Observer
     */
    function initLazyLoading() {
        const lazyImages = $$('img[data-src]');

        if (!lazyImages.length) return;

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.add('lazy-loaded');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: CONFIG.lazyLoadMargin
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }

    /**
     * Handle image load states
     */
    function initImageLoadHandlers() {
        const allImages = $$('.hero-image, .screenshot-frame img');

        allImages.forEach(img => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => img.classList.add('loaded'));
                img.addEventListener('error', () => img.classList.add('error'));
            }
        });
    }

    // ===== BACK TO TOP BUTTON =====

    /**
     * Update scroll progress ring
     */
    function updateScrollProgress() {
        if (!elements.progressRing) return;

        const scrollPercent = getScrollPercent();
        const offset = CONFIG.progressRingCircumference * (1 - scrollPercent);
        elements.progressRing.style.strokeDashoffset = offset;
    }

    /**
     * Initialize back-to-top button with scroll progress
     */
    function initBackToTop() {
        elements.backToTopBtn = $('.back-to-top');
        elements.progressRing = $('.progress-ring-circle');

        if (!elements.backToTopBtn) return;

        // Click handler
        elements.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion() ? 'auto' : 'smooth'
            });
        });

        // Keyboard support
        elements.backToTopBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                elements.backToTopBtn.click();
            }
        });
    }

    /**
     * Handle back-to-top visibility and progress
     */
    function handleBackToTop() {
        if (!elements.backToTopBtn) return;

        const shouldShow = window.scrollY > CONFIG.backToTopThreshold;

        if (shouldShow && !elements.backToTopBtn.classList.contains('visible')) {
            elements.backToTopBtn.classList.add('visible');

            // Add pulse animation on first appearance
            if (!state.hasShownBackToTop) {
                state.hasShownBackToTop = true;
                elements.backToTopBtn.classList.add('pulse');
                setTimeout(() => {
                    elements.backToTopBtn.classList.remove('pulse');
                }, 2000);
            }
        } else if (!shouldShow) {
            elements.backToTopBtn.classList.remove('visible');
        }

        // Update progress ring
        updateScrollProgress();
    }

    // ===== TOUCH GESTURES =====

    /**
     * Initialize swipe gestures for screenshot gallery
     */
    function initSwipeGestures() {
        const gallery = $('.screenshot-frame');
        if (!gallery || !elements.screenshotTabs.length) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        gallery.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            stopScreenshotAutoplay(); // Stop autoplay on interaction
        }, { passive: true });

        gallery.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            // Only handle horizontal swipes (ignore vertical scrolling)
            if (Math.abs(diffX) < CONFIG.swipeThreshold || Math.abs(diffY) > Math.abs(diffX)) {
                return;
            }

            const currentIndex = getActiveScreenshotIndex();
            let nextIndex;

            if (diffX > 0) {
                // Swipe left - next
                nextIndex = (currentIndex + 1) % elements.screenshotTabs.length;
            } else {
                // Swipe right - previous
                nextIndex = (currentIndex - 1 + elements.screenshotTabs.length) % elements.screenshotTabs.length;
            }

            switchScreenshotTab(nextIndex);
        }
    }

    // ===== KEYBOARD SHORTCUTS =====

    /**
     * Initialize keyboard shortcuts
     */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.matches('input, textarea, select, [contenteditable]')) return;

            switch (e.key) {
                case 'Escape':
                    if (isMobileMenuOpen()) {
                        closeMobileMenu();
                    }
                    break;

                case 't':
                case 'T':
                    // Scroll to top
                    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                        window.scrollTo({
                            top: 0,
                            behavior: prefersReducedMotion() ? 'auto' : 'smooth'
                        });
                    }
                    break;

                case 'd':
                case 'D':
                    // Jump to download section
                    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                        const downloadSection = $('#download');
                        if (downloadSection) {
                            downloadSection.scrollIntoView({
                                behavior: prefersReducedMotion() ? 'auto' : 'smooth'
                            });
                        }
                    }
                    break;
            }
        });
    }

    // ===== EVENT HANDLERS =====

    /**
     * Master scroll handler using RAF for performance
     */
    const handleScroll = rafThrottle(() => {
        handleNavbarScroll();
        handleBackToTop();
    });

    /**
     * Handle window resize
     */
    const handleResize = throttle(() => {
        // Close mobile menu on desktop
        if (!isMobile() && isMobileMenuOpen()) {
            closeMobileMenu();
        }
        // Regenerate particles
        generateParticles();
    }, CONFIG.resizeThrottle);

    // ===== ACCESSIBILITY =====

    /**
     * Initialize ARIA attributes
     */
    function initAccessibility() {
        const { mobileMenuBtn, screenshotTabs } = elements;

        // Mobile menu button
        if (mobileMenuBtn) {
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.setAttribute('aria-controls', 'mobile-menu');
            mobileMenuBtn.setAttribute('aria-label', 'Toggle navigation menu');
        }

        // Screenshot tabs
        screenshotTabs.forEach((tab, index) => {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });

        // Tab container
        const tabContainer = $('.screenshot-tabs');
        if (tabContainer) {
            tabContainer.setAttribute('role', 'tablist');
            tabContainer.setAttribute('aria-label', 'Screenshot gallery tabs');
        }
    }

    // ===== EVENT LISTENERS =====

    /**
     * Initialize all event listeners
     */
    function initEventListeners() {
        const { mobileMenuBtn, mobileMenuClose, mobileMenuOverlay, mobileNavLinks } = elements;

        // Mobile menu
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }

        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', closeMobileMenu);
        }

        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', closeMobileMenu);
        }

        // Mobile nav links
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(closeMobileMenu, 100);
            });
        });

        // Scroll handler
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Resize events
        window.addEventListener('resize', handleResize, { passive: true });

        // Reduced motion change
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
            generateParticles();
            if (prefersReducedMotion()) {
                stopScreenshotAutoplay();
            }
        });

        // Visibility change - pause autoplay when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopScreenshotAutoplay();
            }
        });

        // Screenshot gallery hover - pause autoplay
        const screenshotGallery = $('.screenshot-gallery');
        if (screenshotGallery) {
            screenshotGallery.addEventListener('mouseenter', stopScreenshotAutoplay);
            screenshotGallery.addEventListener('focusin', stopScreenshotAutoplay);
        }
    }

    // ===== DROPDOWN MENUS =====

    /**
     * Initialize dropdown menu keyboard accessibility
     */
    function initDropdownMenus() {
        const dropdowns = $$('.nav-dropdown');

        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.nav-dropdown-trigger');
            const menu = dropdown.querySelector('.nav-dropdown-menu');

            if (!trigger || !menu) return;

            // Toggle on click for touch devices
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpen = dropdown.classList.contains('open');

                // Close all other dropdowns
                dropdowns.forEach(d => d.classList.remove('open'));

                if (!isOpen) {
                    dropdown.classList.add('open');
                }
            });

            // Keyboard navigation
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    dropdown.classList.toggle('open');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    dropdown.classList.add('open');
                    const firstLink = menu.querySelector('a');
                    if (firstLink) firstLink.focus();
                } else if (e.key === 'Escape') {
                    dropdown.classList.remove('open');
                    trigger.focus();
                }
            });

            // Menu item keyboard navigation
            const menuLinks = menu.querySelectorAll('a');
            menuLinks.forEach((link, index) => {
                link.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const next = menuLinks[index + 1] || menuLinks[0];
                        next.focus();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prev = menuLinks[index - 1] || menuLinks[menuLinks.length - 1];
                        prev.focus();
                    } else if (e.key === 'Escape') {
                        dropdown.classList.remove('open');
                        trigger.focus();
                    }
                });
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-dropdown')) {
                dropdowns.forEach(d => d.classList.remove('open'));
            }
        });
    }

    // ===== ACTIVE SECTION HIGHLIGHTING =====

    /**
     * Track which section is currently in view and highlight nav
     */
    function initActiveSectionTracking() {
        const sections = $$('section[id]');
        const navLinks = $$('.nav-links a[href^="#"], .nav-dropdown-menu a[href^="#"]');

        if (!sections.length || !navLinks.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-80px 0px -50% 0px'
        });

        sections.forEach(section => observer.observe(section));
    }

    // ===== PARALLAX EFFECTS =====

    /**
     * Add subtle parallax effect to hero section
     */
    function initParallax() {
        const heroVisual = $('.hero-visual');
        const heroGlow = $('.hero-glow');

        if (!heroVisual || prefersReducedMotion()) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    const maxScroll = window.innerHeight;

                    if (scrollY < maxScroll) {
                        const parallaxAmount = scrollY * 0.3;
                        heroVisual.style.transform = `translateY(${parallaxAmount}px)`;

                        if (heroGlow) {
                            heroGlow.style.opacity = 1 - (scrollY / maxScroll);
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ===== ANIMATED COUNTERS =====

    /**
     * Animate counting numbers when they come into view
     */
    function initAnimatedCounters() {
        const counters = $$('[data-count]');

        if (!counters.length) return;

        const animateCounter = (element) => {
            const target = parseInt(element.dataset.count, 10);
            const duration = 2000;
            const start = performance.now();

            const updateCount = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function for smooth animation
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const current = Math.floor(easeOutQuart * target);

                element.textContent = current.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    element.textContent = target.toLocaleString();
                }
            };

            requestAnimationFrame(updateCount);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }

    // ===== CONTEXT MENU & DRAG PREVENTION =====

    /**
     * Prevent right-click context menu on images
     */
    function initContextMenuPrevention() {
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
            }
        });

        // Prevent image dragging
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
            }
        });
    }

    // ===== COPY PROTECTION =====

    /**
     * Add copy event listener for attribution
     */
    function initCopyProtection() {
        document.addEventListener('copy', (e) => {
            const selection = window.getSelection().toString();
            if (selection.length > 100) {
                e.clipboardData.setData('text/plain',
                    selection + '\n\n— Copied from Torn Target Tracker (https://torntargettracker.com)'
                );
                e.preventDefault();
            }
        });
    }

    // ===== PERFORMANCE MONITORING =====

    /**
     * Log performance metrics in development
     */
    function logPerformance(startTime) {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return;
        }

        const initTime = (performance.now() - startTime).toFixed(2);
        const metrics = {
            initTime: `${initTime}ms`,
            particleCount: elements.particlesContainer ? elements.particlesContainer.children.length : 0,
            isMobile: isMobile(),
            reducedMotion: prefersReducedMotion(),
            touchDevice: isTouchDevice()
        };

        console.log('%c⚡ Torn Target Tracker', 'font-weight: bold; font-size: 14px; color: #00f5d4;');
        console.table(metrics);
    }

    // ===== INITIALIZATION =====

    /**
     * Initialize the application
     */
    function init() {
        const startTime = performance.now();

        try {
            // Accessibility first
            initAccessibility();

            // Visual elements
            generateParticles();
            initImageLoadHandlers();
            initLazyLoading();

            // Interactive features
            initScreenshotTabs();
            initSmoothScroll();
            initDropdownMenus();
            initEventListeners();
            initBackToTop();
            initSwipeGestures();
            initKeyboardShortcuts();

            // Scroll-based features
            initScrollReveal();
            initActiveSectionTracking();
            initParallax();
            handleNavbarScroll();
            handleBackToTop();

            // Enhanced features
            initAnimatedCounters();
            initContextMenuPrevention();
            initCopyProtection();

            // Preload images after initial render
            requestAnimationFrame(() => {
                preloadImages();
            });

            // Performance logging
            logPerformance(startTime);

        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
