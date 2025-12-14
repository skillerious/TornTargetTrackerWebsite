/**
 * Torn Target Tracker - Website JavaScript
 * Handles navigation, animations, and interactive features
 * @version 2.0.0
 */

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        particleCount: { mobile: 15, desktop: 30 },
        mobileBreakpoint: 768,
        scrollThreshold: 50,
        throttleDelay: 16, // ~60fps
        resizeThrottle: 250,
        revealOffset: 100
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
        screenshotCaption: document.getElementById('screenshot-caption')
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
     * Handle navbar scroll effect
     */
    function handleNavbarScroll() {
        if (!elements.navbar) return;
        elements.navbar.classList.toggle('scrolled', window.scrollY > CONFIG.scrollThreshold);
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

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 20}s;
                animation-duration: ${15 + Math.random() * 15}s;
                ${Math.random() > 0.5 ? 'background: #ff006e;' : ''}
            `;
            elements.particlesContainer.appendChild(particle);
        }
    }

    // ===== SCREENSHOT GALLERY =====

    /**
     * Initialize screenshot gallery tabs
     */
    function initScreenshotTabs() {
        const { screenshotTabs, screenshots, screenshotCaption } = elements;
        if (!screenshotTabs || screenshotTabs.length === 0) return;

        screenshotTabs.forEach((tab) => {
            // Click handler
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                if (!target) return;

                // Update tabs
                screenshotTabs.forEach((t) => {
                    t.classList.toggle('active', t === tab);
                    t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
                    t.setAttribute('tabindex', t === tab ? '0' : '-1');
                });

                // Update screenshots with fade effect
                screenshots.forEach(img => {
                    img.classList.toggle('active', img.dataset.screenshot === target);
                });

                // Update caption
                if (screenshotCaption && captions[target]) {
                    screenshotCaption.textContent = captions[target];
                }
            });

            // Keyboard navigation
            tab.addEventListener('keydown', (e) => {
                const tabs = Array.from(screenshotTabs);
                const currentIndex = tabs.indexOf(tab);
                let nextIndex;

                switch (e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        nextIndex = (currentIndex + 1) % tabs.length;
                        tabs[nextIndex].focus();
                        tabs[nextIndex].click();
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                        tabs[nextIndex].focus();
                        tabs[nextIndex].click();
                        break;
                    case 'Home':
                        e.preventDefault();
                        tabs[0].focus();
                        tabs[0].click();
                        break;
                    case 'End':
                        e.preventDefault();
                        tabs[tabs.length - 1].focus();
                        tabs[tabs.length - 1].click();
                        break;
                }
            });
        });
    }

    // ===== SCROLL ANIMATIONS =====

    /**
     * Handle scroll reveal animations
     */
    function handleScrollReveal() {
        if (prefersReducedMotion()) {
            // Show all elements immediately if reduced motion is preferred
            document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
            return;
        }

        const reveals = document.querySelectorAll('.reveal:not(.visible)');
        const windowHeight = window.innerHeight;

        reveals.forEach(el => {
            const top = el.getBoundingClientRect().top;
            if (top < windowHeight - CONFIG.revealOffset) {
                el.classList.add('visible');
            }
        });
    }

    // ===== IMAGE PRELOADING =====

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
     * Handle image load states
     */
    function initImageLoadHandlers() {
        const allImages = document.querySelectorAll('.hero-image, .screenshot-frame img');

        allImages.forEach(img => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                img.addEventListener('error', () => {
                    img.classList.add('error');
                });
            }
        });
    }

    // ===== EVENT HANDLERS =====

    /**
     * Handle escape key press
     */
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && isMobileMenuOpen()) {
            closeMobileMenu();
        }
    }

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
        const tabContainer = document.querySelector('.screenshot-tabs');
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

        // Throttled scroll handler
        const throttledScrollHandler = throttle(() => {
            handleNavbarScroll();
            handleScrollReveal();
        }, CONFIG.throttleDelay);

        window.addEventListener('scroll', throttledScrollHandler, { passive: true });

        // Keyboard events
        document.addEventListener('keydown', handleEscapeKey);

        // Resize events
        window.addEventListener('resize', handleResize, { passive: true });

        // Reduced motion change
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
            generateParticles();
            handleScrollReveal();
        });
    }

    // ===== INITIALIZATION =====

    /**
     * Initialize the application
     */
    function init() {
        // Accessibility first
        initAccessibility();

        // Visual elements
        generateParticles();
        initImageLoadHandlers();

        // Interactive features
        initScreenshotTabs();
        initSmoothScroll();
        initEventListeners();

        // Initial state checks
        handleNavbarScroll();
        handleScrollReveal();

        // Preload images after initial render
        requestAnimationFrame(() => {
            preloadImages();
        });

        // Log initialization (dev only)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Torn Target Tracker Website initialized');
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
