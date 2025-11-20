$(document).ready(function () {
    initializeDataGrid();
});

// ==================== DataGrid Initialization ====================
function initializeDataGrid() {
    console.log('Initializing Feedback DataGrid...');

    try {
        $("#feedbackDataGrid").dxDataGrid({
            dataSource: {
                load: function () {
                    console.log('Loading feedbacks...');
                    return $.ajax({
                        url: getUrl('GetFeedbacks'),
                        type: 'GET',
                        dataType: 'json'
                    }).then(function(response) {
                        return response.data || [];
                    });
                }
            },
            remoteOperations: false,
            showBorders: true,
            showRowLines: true,
            rowAlternationEnabled: true,
            hoverStateEnabled: true,
            columnAutoWidth: true,
            wordWrapEnabled: false,
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnHidingEnabled: true,
            columnResizingMode: 'widget',
            width: '100%',
            searchPanel: {
                visible: true,
                width: '100%',
                placeholder: 'Search feedbacks...'
            },
            headerFilter: {
                visible: true
            },
            filterRow: {
                visible: true
            },
            paging: {
                pageSize: 10
            },
            pager: {
                visible: true,
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20, 50],
                showInfo: true,
                showNavigationButtons: true
            },
            export: {
                enabled: true,
                fileName: 'Feedbacks'
            },
            columns: [
                {
                    dataField: 'Id',
                    caption: 'ID',
                    width: 100,
                    alignment: 'center'
                },
                {
                    dataField: 'Subject',
                    caption: 'Subject',
                    minWidth: 200
                },
                {
                    dataField: 'Category',
                    caption: 'Category',
                    width: 150
                },
                {
                    dataField: 'UserName',
                    caption: 'Submitted By',
                    width: 150
                },
                {
                    dataField: 'UserEmail',
                    caption: 'Email',
                    width: 180
                },
                {
                    dataField: 'Status',
                    caption: 'Status',
                    width: 120,
                    cellTemplate: function(container, options) {
                        let statusClass = '';
                        switch(options.value) {
                            case 'Pending':
                                statusClass = 'badge bg-warning';
                                break;
                            case 'In Progress':
                                statusClass = 'badge bg-info';
                                break;
                            case 'Resolved':
                                statusClass = 'badge bg-success';
                                break;
                            case 'Closed':
                                statusClass = 'badge bg-secondary';
                                break;
                            default:
                                statusClass = 'badge bg-light text-dark';
                        }
                        $('<span>')
                            .addClass(statusClass)
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'CreatedAt',
                    caption: 'Submitted Date',
                    dataType: 'datetime',
                    format: 'MM/dd/yyyy hh:mm a',
                    width: 180,
                    sortOrder: 'desc'
                },
                {
                    dataField: 'RespondedByName',
                    caption: 'Responded By',
                    width: 150
                },
                {
                    type: 'buttons',
                    caption: 'Actions',
                    width: 180,
                    buttons: [
                        {
                            hint: 'View Details',
                            icon: "ti ti-eye",
                            onClick: function (e) {
                                viewFeedback(e.row.data);
                            }
                        },
                        {
                            hint: 'Respond',
                            icon: "ti ti-message-reply",
                            cssClass: 'text-icon-primary',
                            onClick: function (e) {
                                respondToFeedback(e.row.data);
                            }
                        },
                        {
                            hint: 'Delete',
                            icon: "ti ti-trash",
                            cssClass: 'text-icon-red',
                            onClick: function (e) {
                                confirmDelete(e.row.data);
                            }
                        }
                    ]
                }
            ],
            onToolbarPreparing: function (e) {
                e.toolbarOptions.items.unshift({
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        icon: 'refresh',
                        hint: 'Refresh',
                        onClick: function () {
                            refreshGrid();
                        }
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error initializing DataGrid:', error);
    }
}

// ==================== View Feedback Details ====================
function viewFeedback(data) {
    const content = `
        <div class="feedback-details">
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Subject:</strong><br/>
                    <span>${data.Subject}</span>
                </div>
                <div class="col-md-6">
                    <strong>Category:</strong><br/>
                    <span class="badge bg-primary">${data.Category}</span>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Submitted By:</strong><br/>
                    <span>${data.UserName}</span>
                </div>
                <div class="col-md-6">
                    <strong>Email:</strong><br/>
                    <span>${data.UserEmail}</span>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-12">
                    <strong>Message:</strong><br/>
                    <div class="border p-3 mt-2 bg-light" style="max-height: 200px; overflow-y: auto;">
                        ${data.Message}
                    </div>
                </div>
            </div>
            ${data.AdminResponse ? `
                <div class="row mb-3">
                    <div class="col-12">
                        <strong>Admin Response:</strong><br/>
                        <div class="border p-3 mt-2 bg-success-subtle">
                            ${data.AdminResponse}
                        </div>
                        <small class="text-muted">Responded by ${data.RespondedByName} on ${new Date(data.RespondedAt).toLocaleString()}</small>
                    </div>
                </div>
            ` : ''}
            <div class="row">
                <div class="col-md-6">
                    <strong>Status:</strong><br/>
                    <span class="badge bg-info">${data.Status}</span>
                </div>
                <div class="col-md-6">
                    <strong>Submitted:</strong><br/>
                    <span>${new Date(data.CreatedAt).toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;

    DevExpress.ui.dialog.custom({
        title: 'Feedback Details',
        messageHtml: content,
        width: 800,
        buttons: [{
            text: 'Close',
            onClick: function() { return true; }
        }]
    }).show();
}

// ==================== Respond to Feedback ====================
function respondToFeedback(data) {
    const content = `
        <div class="respond-form">
            <div class="mb-3">
                <strong>Subject:</strong> ${data.Subject}<br/>
                <strong>From:</strong> ${data.UserName}
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Status</label>
                <select class="form-control" id="responseStatus">
                    <option value="Pending" ${data.Status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${data.Status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved" ${data.Status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    <option value="Closed" ${data.Status === 'Closed' ? 'selected' : ''}>Closed</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Your Response</label>
                <textarea class="form-control" id="responseMessage" rows="5" placeholder="Enter your response...">${data.AdminResponse || ''}</textarea>
            </div>
        </div>
    `;

    DevExpress.ui.dialog.custom({
        title: 'Respond to Feedback',
        messageHtml: content,
        buttons: [
            {
                text: 'Submit Response',
                type: 'success',
                onClick: function() {
                    const response = $('#responseMessage').val();
                    const status = $('#responseStatus').val();
                    
                    if (!response.trim()) {
                        showNotification('Please enter a response', 'error');
                        return false;
                    }

                    submitResponse(data.Id, response, status);
                    return true;
                }
            },
            {
                text: 'Cancel',
                onClick: function() { return true; }
            }
        ]
    }).show();
}

// ==================== Submit Response ====================
function submitResponse(id, response, status) {
    $.ajax({
        url: getUrl('RespondToFeedback'),
        type: 'POST',
        data: { id: id, response: response, status: status },
        headers: getAjaxHeaders(),
        beforeSend: function () {
            showLoader();
        },
        success: function (res) {
            hideLoader();
            if (res.MessageType === MessageTypes.SuccessString) {
                showNotification(res.Message, 'success');
                refreshGrid();
            } else {
                showNotification(res.Message, 'error');
            }
        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Response error:', error);
            showNotification('An error occurred while submitting response', 'error');
        }
    });
}

// ==================== Confirm Delete ====================
function confirmDelete(data) {
    DevExpress.ui.dialog.confirm(
        `Are you sure you want to delete the feedback "${data.Subject}"?`,
        'Confirm Delete'
    ).done(function (dialogResult) {
        if (dialogResult) {
            deleteFeedback(data.Id);
        }
    });
}

// ==================== Delete Feedback ====================
function deleteFeedback(id) {
    $.ajax({
        url: getUrl('Delete'),
        type: 'POST',
        data: { id: id },
        headers: getAjaxHeaders(),
        beforeSend: function () {
            showLoader();
        },
        success: function (response) {
            hideLoader();
            if (response.MessageType === MessageTypes.SuccessString) {
                showNotification(response.Message, 'success');
                refreshGrid();
            } else {
                showNotification(response.Message, 'error');
            }
        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Delete error:', error);
            showNotification('An error occurred while deleting feedback', 'error');
        }
    });
}

// ==================== Helper Functions ====================
function refreshGrid() {
    $("#feedbackDataGrid").dxDataGrid('instance').refresh();
}

function getUrl(action) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/Feedback/${action}`;
}

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
