/**
 * Torn Target Tracker - Website JavaScript
 * Handles navigation, animations, and interactive features
 */

(function() {
    'use strict';

    // DOM Elements
    const navbar = document.getElementById('navbar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const particlesContainer = document.getElementById('particles');
    const screenshotTabs = document.querySelectorAll('.screenshot-tab');
    const screenshots = document.querySelectorAll('.screenshot-frame img');
    const screenshotCaption = document.getElementById('screenshot-caption');

    // Screenshot captions
    const captions = {
        home: 'Target Command Center — Your central hub for all operations',
        stats: 'Statistics Dashboard — Real-time insights and analytics',
        history: 'Attack History — Premium timeline of your recent attacks',
        npc: 'NPC Loot Timer — Track loot levels for Torn NPCs and bosses',
        bounty: 'Bounty Tracker — Manage bounty targets and statistics',
        ratelimit: 'Rate Limit Popover — Detailed API rate limit breakdown',
        backup: 'Backup & Restore — Full data backup to file'
    };

    /**
     * Mobile Menu Functions
     */
    function openMobileMenu() {
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        mobileMenuBtn.classList.add('active');
        
        // Animate menu items
        const menuItems = mobileMenu.querySelectorAll('.mobile-nav-item');
        menuItems.forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.05}s`;
        });
    }

    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
        mobileMenuBtn.classList.remove('active');
        
        // Reset transition delays
        const menuItems = mobileMenu.querySelectorAll('.mobile-nav-item');
        menuItems.forEach(item => {
            item.style.transitionDelay = '0s';
        });
    }

    function toggleMobileMenu() {
        if (mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    /**
     * Navbar Scroll Effect
     */
    function handleNavbarScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    /**
     * Particle Generation
     */
    function generateParticles() {
        if (!particlesContainer) return;
        
        const particleCount = window.innerWidth < 768 ? 15 : 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (15 + Math.random() * 15) + 's';
            
            // Randomly color some particles magenta
            if (Math.random() > 0.5) {
                particle.style.background = '#ff006e';
            }
            
            particlesContainer.appendChild(particle);
        }
    }

    /**
     * Screenshot Gallery Tabs
     */
    function handleScreenshotTabs() {
        screenshotTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                
                // Update active tab
                screenshotTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active screenshot
                screenshots.forEach(img => {
                    if (img.dataset.screenshot === target) {
                        img.classList.add('active');
                    } else {
                        img.classList.remove('active');
                    }
                });
                
                // Update caption
                if (screenshotCaption && captions[target]) {
                    screenshotCaption.textContent = captions[target];
                }
            });
        });
    }

    /**
     * Scroll Reveal Animations
     */
    function handleScrollReveal() {
        const reveals = document.querySelectorAll('.reveal');
        
        reveals.forEach(el => {
            const top = el.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (top < windowHeight - 100) {
                el.classList.add('visible');
            }
        });
    }

    /**
     * Smooth Scroll for Anchor Links
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Skip if it's just "#"
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    // Close mobile menu if open
                    closeMobileMenu();
                    
                    // Calculate offset for fixed navbar
                    const navbarHeight = navbar ? navbar.offsetHeight : 0;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /**
     * Handle Escape Key
     */
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    }

    /**
     * Handle Window Resize
     */
    function handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    }

    /**
     * Initialize Event Listeners
     */
    function initEventListeners() {
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
                closeMobileMenu();
            });
        });
        
        // Scroll events
        window.addEventListener('scroll', () => {
            handleNavbarScroll();
            handleScrollReveal();
        }, { passive: true });
        
        // Keyboard events
        document.addEventListener('keydown', handleEscapeKey);
        
        // Resize events
        window.addEventListener('resize', handleResize, { passive: true });
    }

    /**
     * Initialize Application
     */
    function init() {
        generateParticles();
        handleScreenshotTabs();
        initSmoothScroll();
        initEventListeners();
        
        // Initial scroll check
        handleNavbarScroll();
        handleScrollReveal();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
