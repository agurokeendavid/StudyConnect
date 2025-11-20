$(document).ready(function () {
    console.log('Initializing Ads Upsert Form...');
    console.log('Edit Mode:', isEditMode);
    console.log('Ad ID:', adId);
    console.log('Model Data:', modelData);

    // Initialize form editors
    initializeFormEditors();

    // Initialize save button
    initializeSaveButton();
});

// ==================== Form Editors Initialization ====================
function initializeFormEditors() {
    try {
        // Title Editor
        $('#titleEditor').dxTextBox({
            placeholder: "Title",
            maxLength: 200,
            value: modelData?.Title || '',
            showClearButton: true
        });

        // Description Editor
        $('#descriptionEditor').dxTextArea({
            placeholder: "Description",
            maxLength: 2000,
            height: 120,
            value: modelData?.Description || '',
            showClearButton: true
        });

        // Image URL Editor
        $('#imageUrlEditor').dxTextBox({
            placeholder: "Image URL",
            maxLength: 500,
            value: modelData?.ImageUrl || '',
            showClearButton: true
        });

        // Link URL Editor
        $('#linkUrlEditor').dxTextBox({
            placeholder: "Link URL",
            maxLength: 500,
            value: modelData?.LinkUrl || '',
            showClearButton: true
        });

        // Position Editor
        $('#positionEditor').dxSelectBox({
            items: ['Top', 'Bottom', 'Sidebar', 'Header', 'Footer', 'Banner'],
            value: modelData?.Position || 'Top',
            searchEnabled: true
        });

        // Start Date Editor
        $('#startDateEditor').dxDateBox({
            placeholder: "Start Date",
            type: 'date',
            displayFormat: 'MM/dd/yyyy',
            value: modelData?.StartDate ? new Date(modelData.StartDate) : new Date(),
            showClearButton: true
        });

        // End Date Editor
        $('#endDateEditor').dxDateBox({
            placeholder: "End Date",
            type: 'date',
            displayFormat: 'MM/dd/yyyy',
            value: modelData?.EndDate ? new Date(modelData.EndDate) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
            showClearButton: true
        });

        // Is Active Editor
        $('#isActiveEditor').dxCheckBox({
            text: 'Ad is Active',
            value: modelData?.IsActive !== false
        });

    } catch (error) {
        console.error('Error initializing form editors:', error);
    }
}

// ==================== Save Button Initialization ====================
function initializeSaveButton() {
    try {
        $('#btn-save').dxButton({
            text: isEditMode ? 'Update Ad' : 'Save Ad',
            type: 'success',
            icon: 'save',
            useSubmitBehavior: false,
            onClick: function () {
                saveAd();
            }
        });

    } catch (error) {
        console.error('Error initializing save button:', error);
    }
}

// ==================== Save Ad ====================
function saveAd() {
    console.log('Saving ad...');

    try {
        // Get form values
        const title = $('#titleEditor').dxTextBox('instance').option('value');
        const description = $('#descriptionEditor').dxTextArea('instance').option('value');
        const imageUrl = $('#imageUrlEditor').dxTextBox('instance').option('value');
        const linkUrl = $('#linkUrlEditor').dxTextBox('instance').option('value');
        const position = $('#positionEditor').dxSelectBox('instance').option('value');
        const startDate = $('#startDateEditor').dxDateBox('instance').option('value');
        const endDate = $('#endDateEditor').dxDateBox('instance').option('value');
        const isActive = $('#isActiveEditor').dxCheckBox('instance').option('value');

        // Validation
        if (!title || title.trim() === '') {
            showNotification('Title is required', 'error');
            return;
        }

        if (!description || description.trim() === '') {
            showNotification('Description is required', 'error');
            return;
        }

        if (!imageUrl || imageUrl.trim() === '') {
            showNotification('Image URL is required', 'error');
            return;
        }

        if (!position || position.trim() === '') {
            showNotification('Position is required', 'error');
            return;
        }

        if (!startDate) {
            showNotification('Start date is required', 'error');
            return;
        }

        if (!endDate) {
            showNotification('End date is required', 'error');
            return;
        }

        // Convert dates to ISO format (yyyy-MM-dd) for proper server-side binding
        const formatDate = (date) => {
            if (!date) return null;
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Prepare data
        const formData = {
            Id: isEditMode ? adId : null,
            Title: title,
            Description: description,
            ImageUrl: imageUrl,
            LinkUrl: linkUrl || null,
            Position: position,
            StartDate: formatDate(startDate),
            EndDate: formatDate(endDate),
            IsActive: isActive
        };

        console.log('Form data:', formData);

        // Submit form
        $.ajax({
            url: window.location.origin + '/Ads/Upsert',
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            data: $.param(formData),
            headers: getAjaxHeaders(),
            beforeSend: function () {
                showLoader();
            },
            success: function (response) {
                hideLoader();
                console.log('Save response:', response);

                if (response.MessageType) {
                    showNotification(response.Message, 'success');
                    if (response.RedirectUrl) {
                        setTimeout(function () {
                            window.location.href = response.RedirectUrl;
                        }, 1000);
                    }
                } else {
                    showNotification(response.Message, 'error');
                }
            },
            error: function (xhr, status, error) {
                hideLoader();
                console.error('Save error:', error);
                showNotification('An error occurred while saving the ad', 'error');
            }
        });

    } catch (error) {
        console.error('Error in saveAd:', error);
        showNotification('An unexpected error occurred', 'error');
    }
}

// ==================== Helper Functions ====================
function getAjaxHeaders() {
    const token = $('input[name="__RequestVerificationToken"]').val();
    return {
        'RequestVerificationToken': token
    };
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
