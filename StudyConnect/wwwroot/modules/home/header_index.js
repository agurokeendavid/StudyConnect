// Initialize page loading animations
document.addEventListener('DOMContentLoaded', function() {
    // Enhanced navbar functionality
    initializeNavbar();

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 90; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    const toggler = document.querySelector('.navbar-toggler');
                    toggler.click();
                }
            }
        });
    });

    // Enhanced navbar scroll effects
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        // Add scrolled class for styling
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide/show navbar on scroll (optional - uncomment to enable)
        /*
        if (currentScroll > lastScrollTop && currentScroll > 200) {
            navbar.classList.add('navbar-hidden');
            navbar.classList.remove('navbar-visible');
        } else {
            navbar.classList.remove('navbar-hidden');
            navbar.classList.add('navbar-visible');
        }
        */

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;

        // Update active navigation links based on scroll position
        updateActiveNavLinks();
    });

    // Initialize active nav links
    updateActiveNavLinks();
});

function initializeNavbar() {
    // Add click effects to auth buttons
    document.querySelectorAll('.btn-auth').forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            createRippleEffect(this, e);
        });
    });

    // Enhanced mobile menu functionality
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    if (navbarToggler) {
        navbarToggler.addEventListener('click', function() {
            setTimeout(() => {
                if (navbarCollapse.classList.contains('show')) {
                    navbarCollapse.style.animation = 'slideDown 0.3s ease-out';
                } else {
                    navbarCollapse.style.animation = 'slideUp 0.3s ease-out';
                }
            }, 10);
        });
    }

    // Logo click animation
    const logoWrapper = document.querySelector('.logo-wrapper');
    if (logoWrapper) {
        logoWrapper.addEventListener('click', function() {
            this.style.animation = 'logoSpin 0.6s ease-in-out';
            setTimeout(() => {
                this.style.animation = '';
            }, 600);
        });
    }
}

function updateActiveNavLinks() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link-custom');

    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;

        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    // Handle home section special case
    if (window.pageYOffset < 200) {
        current = 'home';
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');

        if ((current === 'home' && (href === '/' || href.includes('site_url'))) ||
            (href === `#${current}`) ||
            (current === 'home-section' && (href === '/' || href.includes('site_url')))) {
            link.classList.add('active');
        }
    });
}

function createRippleEffect(button, e) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;

    button.style.position = 'relative';
    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Enhanced hero section functionality
function initializeEnhancedHero() {
    // Animate stats counter in hero section
    const statsNumber = document.querySelector('.stats-number');
    if (statsNumber) {
        const targetCount = parseInt(statsNumber.getAttribute('data-count'));
        animateCounter(statsNumber, targetCount, '10,000+');
    }

    // Initialize particle system
    createParticleSystem();

    // Add enhanced button interactions
    initializeHeroButtons();

    // Initialize floating bubbles interactions
    initializeFloatingBubbles();

    // Add scroll indicator interaction
    initializeScrollIndicator();
}

// Counter animation for hero stats
function animateCounter(element, target, finalText) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = finalText;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString() + '+';
        }
    }, 20);
}

// Create simple particle system
function createParticleSystem() {
    const particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) return;

    // Create floating particles
    for (let i = 0; i < 50; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
        `;

    // Random position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';

    // Random animation
    const duration = 10 + Math.random() * 20;
    const delay = Math.random() * 5;

    particle.style.animation = `particleFloat ${duration}s linear ${delay}s infinite`;

    container.appendChild(particle);

    // Remove and recreate particle after animation
    setTimeout(() => {
        particle.remove();
        createParticle(container);
    }, (duration + delay) * 1000);
}

// Enhanced button interactions
function initializeHeroButtons() {
    const heroButtons = document.querySelectorAll('.btn-hero-primary, .btn-hero-outline');

    heroButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });

        button.addEventListener('click', function(e) {
            // Create ripple effect
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement('span');
            ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: heroRipple 0.6s linear;
                    pointer-events: none;
                `;

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Floating bubbles interactions
function initializeFloatingBubbles() {
    const bubbles = document.querySelectorAll('.feature-bubble');

    bubbles.forEach(bubble => {
        bubble.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2)';
            this.style.background = 'rgba(255, 255, 255, 0.3)';
        });

        bubble.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.background = 'rgba(255, 255, 255, 0.15)';
        });
    });
}

// Scroll indicator interaction
function initializeScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const aboutSection = document.querySelector('#about-section');
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Hide scroll indicator when user starts scrolling
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
            } else {
                scrollIndicator.style.opacity = '1';
            }
        });
    }
}

// Enhanced parallax effects for hero section
function initializeHeroParallax() {
    const heroSection = document.querySelector('.hero-section');
    const floatingShapes = document.querySelectorAll('.shape');
    const logoContainer = document.querySelector('.logo-container');

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;

        // Parallax background
        if (heroSection) {
            heroSection.style.transform = `translate3d(0, ${rate}px, 0)`;
        }

        // Move floating shapes
        floatingShapes.forEach((shape, index) => {
            const speed = 0.2 + (index * 0.1);
            shape.style.transform = `translate3d(0, ${scrolled * speed}px, 0)`;
        });

        // 3D logo rotation based on scroll
        if (logoContainer) {
            const rotation = scrolled * 0.1;
            logoContainer.style.transform = `rotateY(${rotation}deg) rotateX(${rotation * 0.5}deg)`;
        }
    });
}

// Mouse movement effects
function initializeMouseEffects() {
    const heroSection = document.querySelector('.hero-section');

    heroSection.addEventListener('mousemove', function(e) {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        const xPercent = (clientX / innerWidth) * 100;
        const yPercent = (clientY / innerHeight) * 100;

        // Move floating bubbles based on mouse
        const bubbles = document.querySelectorAll('.feature-bubble');
        bubbles.forEach((bubble, index) => {
            const speed = 0.02 + (index * 0.01);
            const x = (xPercent - 50) * speed;
            const y = (yPercent - 50) * speed;
            bubble.style.transform = `translate(${x}px, ${y}px)`;
        });

        // Slight logo tilt based on mouse position
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            const tiltX = (yPercent - 50) * 0.1;
            const tiltY = (xPercent - 50) * 0.1;
            logoContainer.style.transform += ` rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        }
    });
}

// Initialize all hero enhancements
initializeEnhancedHero();
initializeHeroParallax();
initializeMouseEffects();

// Add hero-specific CSS animations
const heroStyle = document.createElement('style');
heroStyle.textContent = `
        @keyframes heroRipple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        @keyframes logoGlow {
            0%, 100% {
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            }
            50% {
                box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
            }
        }

        .hero-logo:hover {
            animation: logoGlow 2s ease-in-out infinite;
        }

        .btn-hero-primary:active {
            transform: translateY(-2px) scale(0.98);
        }

        .btn-hero-outline:active {
            transform: translateY(-1px) scale(0.98);
        }

        /* Enhanced mobile animations */
        @media (max-width: 768px) {
            .particles {
                background-size: 30px 30px;
            }
            
            .shape {
                animation-duration: 6s;
            }
            
            .hero-title .title-line {
                animation-delay: 0.2s;
            }
            
            .hero-title .title-line:nth-child(2) {
                animation-delay: 0.4s;
            }
            
            .hero-title .title-line:nth-child(3) {
                animation-delay: 0.6s;
            }
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
            .hero-section * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            
            .particles {
                animation: none;
            }
            
            .floating-shapes .shape {
                animation: none;
            }
        }
    `;
document.head.appendChild(heroStyle);

// Add CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }

        @keyframes logoSpin {
            0% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.2) rotate(180deg); }
            100% { transform: scale(1) rotate(360deg); }
        }
    `;
document.head.appendChild(style);
