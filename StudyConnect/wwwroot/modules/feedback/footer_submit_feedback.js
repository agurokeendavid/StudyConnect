$(document).ready(function () {
    initializeFeedbackForm();
});

// ==================== Form Initialization ====================
function initializeFeedbackForm() {
    $('#feedbackForm').on('submit', function (e) {
        e.preventDefault();
        
        const subject = $('#subject').val().trim();
        const category = $('#category').val();
        const message = $('#message').val().trim();

        if (!subject || !category || !message) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (subject.length < 5) {
            showNotification('Subject must be at least 5 characters long', 'error');
            return;
        }

        if (message.length < 10) {
            showNotification('Feedback message must be at least 10 characters long', 'error');
            return;
        }

        submitFeedback(subject, category, message);
    });
}

// ==================== Submit Feedback ====================
function submitFeedback(subject, category, message) {
    const token = $('input[name="__RequestVerificationToken"]').val();

    $.ajax({
        url: getUrl('SubmitFeedback'),
        type: 'POST',
        data: {
            subject: subject,
            category: category,
            message: message,
            __RequestVerificationToken: token
        },
        beforeSend: function () {
            $('#submitBtn').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Submitting...');
        },
        success: function (response) {
            console.log('Submission response:', response);

            $('#submitBtn').prop('disabled', false).html('<i class="ti ti-send me-1"></i>Submit Feedback');

            if (response.MessageType === MessageTypes.SuccessString) {
                showSuccessDialog(response.Message);
                $('#feedbackForm')[0].reset();
            } else {
                showNotification(response.Message || 'Failed to submit feedback', 'error');
            }
        },
        error: function (xhr, status, error) {
            console.error('Submission error:', error);
            $('#submitBtn').prop('disabled', false).html('<i class="ti ti-send me-1"></i>Submit Feedback');
            showNotification('An error occurred. Please try again.', 'error');
        }
    });
}

// ==================== Success Dialog ====================
function showSuccessDialog(message) {
    Swal.fire({
        icon: 'success',
        title: 'Thank You!',
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#5D87FF',
        timer: 5000,
        timerProgressBar: true
    });
}

// ==================== Helper Functions ====================
function getUrl(action) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/Feedback/${action}`;
}

function showNotification(message, type) {
    let icon = 'info';
    let title = 'Information';
    
    switch(type) {
        case 'success':
            icon = 'success';
            title = 'Success';
            break;
        case 'error':
            icon = 'error';
            title = 'Error';
            break;
        case 'warning':
            icon = 'warning';
            title = 'Warning';
            break;
    }

    Swal.fire({
        icon: icon,
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#5D87FF',
        timer: 3000,
        timerProgressBar: true
    });
}
