$(document).ready(function() {
    // Ensure page starts at top (hero section focus)
    window.scrollTo(0, 0);

    // Feature cards hover animation
    $('.feature-card').hover(
        function() {
            $(this).find('.feature-icon').addClass('animate__animated animate__pulse');
        },
        function() {
            $(this).find('.feature-icon').removeClass('animate__animated animate__pulse');
        }
    );

    // Statistics Counter Animation Function
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start).toLocaleString();
            }
        }, 16);
    }

    // Force show statistics cards immediately (fallback)
    $('.stats-card').each(function() {
        $(this).css({
            'display': 'block',
            'visibility': 'visible'
        });
    });

    // Intersection Observer for Statistics Animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                card.classList.add('animate');

                // Find and animate the number in this card
                const numberElement = card.querySelector('h3');
                if (numberElement) {
                    const text = numberElement.textContent;
                    const number = parseInt(text.replace(/[^\d]/g, ''));
                    if (number && number > 0) {
                        numberElement.textContent = '0';
                        setTimeout(() => {
                            animateCounter(numberElement, number);
                        }, 300);
                    }
                }

                // Stop observing this element once animated
                statsObserver.unobserve(card);
            }
        });
    }, observerOptions);

    // Simple fallback animation for stats cards
    function animateStatsCards() {
        $('.stats-card').each(function(index) {
            const $card = $(this);
            setTimeout(() => {
                $card.addClass('animate');

                // Animate numbers
                const $numberElement = $card.find('h3');
                if ($numberElement.length) {
                    const text = $numberElement.text();
                    const number = parseInt(text.replace(/[^\d]/g, ''));
                    if (number && number > 0) {
                        $numberElement.text('0');
                        animateCounter($numberElement[0], number);
                    }
                }
            }, index * 200);
        });
    }

    // Try Intersection Observer first, fallback to simple animation
    setTimeout(() => {
        const statsCards = document.querySelectorAll('.stats-card');
        if (statsCards.length > 0) {
            // Check if cards are visible
            let hasVisibleCards = false;
            statsCards.forEach(card => {
                if (card.offsetParent !== null) {
                    hasVisibleCards = true;
                    statsObserver.observe(card);
                }
            });

            // If no cards are visible or observer fails, use fallback
            if (!hasVisibleCards) {
                setTimeout(animateStatsCards, 500);
            }
        }
    }, 100);

    // Additional fallback - animate on scroll
    $(window).on('scroll', function() {
        const $statsSection = $('#stats-section');
        if ($statsSection.length) {
            const sectionTop = $statsSection.offset().top;
            const sectionHeight = $statsSection.outerHeight();
            const windowTop = $(window).scrollTop();
            const windowHeight = $(window).height();

            if (windowTop + windowHeight > sectionTop + 100) {
                $('.stats-card:not(.animate)').each(function(index) {
                    const $card = $(this);
                    setTimeout(() => {
                        $card.addClass('animate');

                        // Animate numbers
                        const $numberElement = $card.find('h3');
                        if ($numberElement.length && !$numberElement.hasClass('animated')) {
                            $numberElement.addClass('animated');
                            const text = $numberElement.text();
                            const number = parseInt(text.replace(/[^\d]/g, ''));
                            if (number && number > 0) {
                                $numberElement.text('0');
                                animateCounter($numberElement[0], number);
                            }
                        }
                    }, index * 200);
                });
            }
        }
    });

    // Scroll to Explore functionality
    $('.scroll-indicator').on('click', function() {
        const statsSection = $('#stats-section');
        if (statsSection.length) {
            $('html, body').animate({
                scrollTop: statsSection.offset().top - 80
            }, 800);
        }
    });

    // Hide/show scroll indicator based on scroll position
    $(window).on('scroll', function() {
        const scrollIndicator = $('.scroll-indicator');
        const currentScrollY = $(this).scrollTop();

        if (currentScrollY > 100) {
            scrollIndicator.css({
                'opacity': '0',
                'pointer-events': 'none'
            });
        } else {
            scrollIndicator.css({
                'opacity': '1',
                'pointer-events': 'auto'
            });
        }
    });

    // Smooth reveal animations for sections
    function revealOnScroll() {
        const reveals = document.querySelectorAll('.feature-card, .stats-card');

        for (let i = 0; i < reveals.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = reveals[i].getBoundingClientRect().top;
            const elementVisible = 150;

            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add('animate__animated', 'animate__fadeInUp');
            }
        }
    }

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // Button click animations
    $('.btn').on('click', function(e) {
        if (!$(this).attr('href') || $(this).attr('href').startsWith('#')) {
            e.preventDefault();
        }

        $(this).addClass('animate__animated animate__heartBeat');
        setTimeout(() => {
            $(this).removeClass('animate__animated animate__heartBeat');
        }, 1000);

        // If it's an external link, proceed after animation
        if ($(this).attr('href') && !$(this).attr('href').startsWith('#')) {
            setTimeout(() => {
                window.location.href = $(this).attr('href');
            }, 300);
        }
    });

    // Parallax effect for hero section
    $(window).scroll(function() {
        const scrolled = $(this).scrollTop();
        const parallax = $('.hero-section');
        const speed = scrolled * 0.5;

        parallax.css('background-position', 'center ' + speed + 'px');
    });

    // Auto-type effect for hero text (optional enhancement)
    if (typeof Typed !== 'undefined') {
        new Typed('.hero-typed', {
            strings: [
                'Connect with fellow students',
                'Learn through collaboration',
                'Succeed together'
            ],
            typeSpeed: 50,
            backSpeed: 30,
            loop: true,
            showCursor: false
        });
    }

    // Newsletter signup (if implemented)
    $('#newsletter-form').on('submit', function(e) {
        e.preventDefault();

        Swal.fire({
            title: 'Thank You!',
            text: 'You have successfully subscribed to our newsletter.',
            icon: 'success',
            confirmButtonText: 'Great!'
        });
    });

    // Contact form handling (if implemented)
    $('#contact-form').on('submit', function(e) {
        e.preventDefault();

        // Show loading
        Swal.fire({
            title: 'Sending...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Simulate form submission
        setTimeout(() => {
            Swal.fire({
                title: 'Message Sent!',
                text: 'Thank you for contacting us. We will get back to you soon.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        }, 2000);
    });

    // Mobile menu improvements
    $('.navbar-toggler').on('click', function() {
        $(this).toggleClass('active');
    });

    // Close mobile menu when clicking outside
    $(document).on('click', function(e) {
        const navbar = $('.navbar-collapse');
        if (!navbar.is(e.target) && navbar.has(e.target).length === 0) {
            navbar.removeClass('show');
            $('.navbar-toggler').removeClass('active');
        }
    });

    // Add loading spinner for page transitions
    $('a[href^="' + window.location.origin + '"]').on('click', function(e) {
        if ($(this).attr('target') !== '_blank') {
            const href = $(this).attr('href');
            if (href && href !== '#' && href !== window.location.href) {
                // Show loading overlay
                $('body').append('<div id="page-loader" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>');
            }
        }
    });
});
