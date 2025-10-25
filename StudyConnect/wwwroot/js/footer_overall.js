
'use strict';
function clearValueControls(ctrlElements) {
    for (var i = 0; i < ctrlElements.length; i++) {
        if ($(ctrlElements[i]).is('input')) {
            $(ctrlElements[i]).val(null);
        } else if ($(ctrlElements[i]).is('select')) {
            $(ctrlElements[i]).val(null).trigger('change');
        } else if ($(ctrlElements[i]).is('textarea')) {
            $(ctrlElements[i]).val(null);
        } else if ($(ctrlElements[i]).is('h1')) {
            $(ctrlElements[i]).html(null);
        } else if ($(ctrlElements[i]).is('h2')) {
            $(ctrlElements[i]).html(null);
        } else if ($(ctrlElements[i]).is('h3')) {
            $(ctrlElements[i]).html(null);
        } else if ($(ctrlElements[i]).is('p')) {
            $(ctrlElements[i]).html(null);
        } else if ($(ctrlElements[i]).is('video')) {
            $(ctrlElements[i])[0].pause();
        } else if ($(ctrlElements[i]).is('object')) {
            $(ctrlElements[i]).attr('data', null);
        }
    }
}

// Footer Enhancement Features
$(document).ready(function() {
    // Back to Top Button Functionality
    const backToTopButton = $('#backToTop');

    // Show/hide back to top button based on scroll position
    $(window).scroll(function() {
        if ($(this).scrollTop() > 300) {
            backToTopButton.addClass('show');
        } else {
            backToTopButton.removeClass('show');
        }
    });

    // Smooth scroll to top when button is clicked
    backToTopButton.click(function(e) {
        e.preventDefault();
        $('html, body').animate({scrollTop: 0}, 800, 'easeInOutCubic');
    });

    // Newsletter Subscription Functionality
    $('.footer-newsletter .btn').click(function(e) {
        e.preventDefault();
        const emailInput = $('.footer-newsletter .form-control');
        const email = emailInput.val().trim();
        const button = $(this);

        // Validate email
        if (!email) {
            showNotification('Please enter your email address', 'warning');
            emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            emailInput.focus();
            return;
        }

        // Simulate subscription process
        button.prop('disabled', true);
        button.html('<i class="fas fa-spinner fa-spin me-2"></i>Subscribing...');

        // Simulate API call
        setTimeout(function() {
            button.prop('disabled', false);
            button.html('<i class="fas fa-paper-plane me-2"></i>Subscribe');
            emailInput.val('');
            showNotification('Successfully subscribed to our newsletter!', 'success');
        }, 2000);
    });

    // Enhanced hover effects for footer links
    $('.footer a').hover(
        function() {
            $(this).addClass('animate__animated animate__pulse');
        },
        function() {
            $(this).removeClass('animate__animated animate__pulse');
        }
    );

    // Social media links tracking (optional)
    $('.social-links a').click(function(e) {
        e.preventDefault();
        const platform = $(this).attr('title');
        console.log(`Social media click: ${platform}`);
        // Here you can add actual social media links or analytics tracking
        showNotification(`${platform} link clicked!`, 'info');
    });
});

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system for footer interactions
function showNotification(message, type = 'info') {
    // Remove existing notifications
    $('.footer-notification').remove();

    const notificationClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };

    const notification = $(`
        <div class="footer-notification alert ${notificationClass[type]} alert-dismissible fade show" 
             style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 350px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);

    $('body').append(notification);

    // Auto-remove notification after 5 seconds
    setTimeout(function() {
        notification.fadeOut(500, function() {
            $(this).remove();
        });
    }, 5000);
}

// Smooth scrolling for all footer links
$('.footer a[href^="#"]').click(function(e) {
    e.preventDefault();
    const target = $(this.getAttribute('href'));
    if (target.length) {
        $('html, body').animate({
            scrollTop: target.offset().top - 100
        }, 800, 'easeInOutCubic');
    }
});

// Add loading animation to footer on page load
$(window).on('load', function() {
    $('.footer').addClass('animate__animated animate__fadeInUp');
});

// Custom easing function for smooth animations
$.easing.easeInOutCubic = function (x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t + b;
    return c/2*((t-=2)*t*t + 2) + b;
};
