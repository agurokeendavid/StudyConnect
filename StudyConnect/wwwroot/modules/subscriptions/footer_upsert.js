$(document).ready(function () {
    initializeForm();
});

function initializeForm() {
    console.log('Initializing subscription form...');

    $('#subscriptionForm').on('submit', function (e) {
        e.preventDefault();

        const form = $(this);
        const url = form.attr('action');
        const formData = form.serialize();

        console.log('Submitting form:', url);

        $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            beforeSend: function () {
                showLoader();
                $('#btnSubmit').prop('disabled', true);
            },
            success: function (response) {
                hideLoader();
                $('#btnSubmit').prop('disabled', false);
                console.log('Submit response:', response);

                if (response.MessageType) {
                    showNotification(response.Message, 'success');
                    
                    if (response.RedirectUrl) {
                        setTimeout(function () {
                            window.location.href = response.RedirectUrl;
                        }, 1500);
                    }
                } else {
                    showNotification(response.Message, 'error');
                }
            },
            error: function (xhr, status, error) {
                hideLoader();
                $('#btnSubmit').prop('disabled', false);
                console.error('Submit error:', error);
                showNotification('An error occurred while saving the subscription', 'error');
            }
        });
    });
}

function showNotification(message, type) {
    DevExpress.ui.notify({
        message: message,
        type: type,
        displayTime: 3000,
        position: {
            my: 'top right',
            at: 'top right',
            offset: '-20 20'
        }
    });
}

function showLoader() {
    if (!$('#global-loader').length) {
        $('<div id="global-loader" class="dx-overlay-wrapper dx-loadpanel-wrapper"><div class="dx-loadpanel-content"><div class="dx-loadindicator dx-widget"><div class="dx-loadindicator-wrapper"><div class="dx-loadindicator-content"><div class="dx-loadindicator-icon"><div></div></div></div></div></div></div></div>')
            .appendTo('body');
    }
    $('#global-loader').show();
}

function hideLoader() {
    $('#global-loader').hide();
}
