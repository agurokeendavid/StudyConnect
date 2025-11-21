$(document).ready(function () {
    initializeDataGrid();
    initializeAddButton();
});

// ==================== DataGrid Initialization ====================
function initializeDataGrid() {
    console.log('Initializing Announcements DataGrid...');

    try {
        $("#announcementsDataGrid").dxDataGrid({
            dataSource: {
                load: function () {
                    console.log('Loading announcements...');
                    return $.ajax({
                        url: getUrl('GetAnnouncements'),
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
            wordWrapEnabled: true,
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnHidingEnabled: true,
            columnResizingMode: 'widget',
            width: '100%',
            searchPanel: {
                visible: true,
                width: '100%',
                placeholder: 'Search announcements...'
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
                fileName: 'Announcements'
            },
            columns: [
                {
                    dataField: 'Id',
                    caption: 'ID',
                    width: 80,
                    alignment: 'center',
                    visible: false
                },
                {
                    dataField: 'Title',
                    caption: 'Title',
                    minWidth: 200
                },
                {
                    dataField: 'Content',
                    caption: 'Content',
                    minWidth: 250,
                    cellTemplate: function(container, options) {
                        const truncated = options.value.length > 100 
                            ? options.value.substring(0, 100) + '...' 
                            : options.value;
                        $('<div>').text(truncated).appendTo(container);
                    }
                },
                {
                    dataField: 'Type',
                    caption: 'Type',
                    width: 120,
                    cellTemplate: function(container, options) {
                        const typeClass = 'badge type-' + options.value.toLowerCase();
                        $('<span>')
                            .addClass(typeClass)
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'Priority',
                    caption: 'Priority',
                    width: 100,
                    cellTemplate: function(container, options) {
                        const priorityClass = 'priority-' + options.value.toLowerCase();
                        $('<span>')
                            .addClass(priorityClass)
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'TargetAudience',
                    caption: 'Audience',
                    width: 120
                },
                {
                    dataField: 'IsPinned',
                    caption: 'Pinned',
                    width: 90,
                    dataType: 'boolean',
                    cellTemplate: function(container, options) {
                        if (options.value) {
                            $('<i>').addClass('ti ti-pin fs-5 text-warning').appendTo(container);
                        }
                    }
                },
                {
                    dataField: 'IsActive',
                    caption: 'Status',
                    width: 100,
                    cellTemplate: function(container, options) {
                        const statusClass = options.value ? 'badge bg-success' : 'badge bg-secondary';
                        const statusText = options.value ? 'Active' : 'Inactive';
                        $('<span>')
                            .addClass(statusClass)
                            .text(statusText)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'ViewCount',
                    caption: 'Views',
                    width: 90,
                    alignment: 'center'
                },
                {
                    dataField: 'PublishDate',
                    caption: 'Publish Date',
                    dataType: 'datetime',
                    format: 'MM/dd/yyyy',
                    width: 130
                },
                {
                    dataField: 'ExpiryDate',
                    caption: 'Expiry Date',
                    dataType: 'datetime',
                    format: 'MM/dd/yyyy',
                    width: 130
                },
                {
                    dataField: 'CreatedByName',
                    caption: 'Created By',
                    width: 150
                },
                {
                    dataField: 'CreatedAt',
                    caption: 'Created Date',
                    dataType: 'datetime',
                    format: 'MM/dd/yyyy hh:mm a',
                    width: 180,
                    sortOrder: 'desc'
                },
                {
                    type: 'buttons',
                    caption: 'Actions',
                    width: 200,
                    buttons: [
                        {
                            hint: 'Edit',
                            icon: "ti ti-edit",
                            onClick: function (e) {
                                showEditPopup(e.row.data);
                            }
                        },
                        {
                            hint: 'Toggle Status',
                            icon: "ti ti-toggle-left",
                            cssClass: 'text-icon-primary',
                            onClick: function (e) {
                                toggleStatus(e.row.data);
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

// ==================== Add Button Initialization ====================
function initializeAddButton() {
    try {
        $("#btn-add-announcement").dxButton({
            text: 'Add Announcement',
            icon: 'add',
            type: 'success',
            onClick: function () {
                showAddPopup();
            }
        });

    } catch (error) {
        console.error('Error initializing Add Button:', error);
    }
}

// Global popup variable
let announcementPopup = null;

// ==================== Add Popup ====================
function showAddPopup() {
    if ($('#announcementPopupContainer').length === 0) {
        $('<div id="announcementPopupContainer"></div>').appendTo('body');
    }

    if (announcementPopup) {
        announcementPopup.dispose();
    }

    announcementPopup = $('#announcementPopupContainer').dxPopup({
        title: 'Add Announcement',
        width: 700,
        height: 'auto',
        showTitle: true,
        dragEnabled: false,
        closeOnOutsideClick: false,
        showCloseButton: true,
        contentTemplate: function (contentElement) {
            let formHtml = `
                <div id="announcementForm" style="padding: 20px;">
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="mb-3">
                                <label for="titleEditor" class="form-label">Title <code>*</code></label>
                                <div id="titleEditor"></div>
                            </div>
                        </div>
                        <div class="col-sm-12">
                            <div class="mb-3">
                                <label for="contentEditor" class="form-label">Content <code>*</code></label>
                                <div id="contentEditor"></div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="mb-3">
                                <label for="typeEditor" class="form-label">Type</label>
                                <div id="typeEditor"></div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="mb-3">
                                <label for="priorityEditor" class="form-label">Priority</label>
                                <div id="priorityEditor"></div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="mb-3">
                                <label for="targetAudienceEditor" class="form-label">Target Audience</label>
                                <div id="targetAudienceEditor"></div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="mb-3">
                                <label for="publishDateEditor" class="form-label">Publish Date</label>
                                <div id="publishDateEditor"></div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="mb-3">
                                <label for="expiryDateEditor" class="form-label">Expiry Date</label>
                                <div id="expiryDateEditor"></div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="mb-3">
                                <label class="form-label">Options</label>
                                <div id="isActiveEditor"></div>
                                <div id="isPinnedEditor" style="margin-top: 10px;"></div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 25px; text-align: right;">
                        <div id="cancelButton" style="display: inline-block; margin-right: 10px;"></div>
                        <div id="saveButton" style="display: inline-block;"></div>
                    </div>
                </div>
            `;

            contentElement.append(formHtml);

            $('#titleEditor').dxTextBox({
                placeholder: 'Enter announcement title',
                maxLength: 200,
                value: ''
            });

            $('#contentEditor').dxTextArea({
                placeholder: 'Enter announcement content',
                height: 150,
                maxLength: 5000,
                value: ''
            });

            $('#typeEditor').dxSelectBox({
                items: ['General', 'Important', 'Urgent', 'Event'],
                value: 'General'
            });

            $('#priorityEditor').dxSelectBox({
                items: ['Low', 'Normal', 'High'],
                value: 'Normal'
            });

            $('#targetAudienceEditor').dxSelectBox({
                items: ['All', 'Students', 'Admins'],
                value: 'All'
            });

            $('#publishDateEditor').dxDateBox({
                type: 'datetime',
                value: new Date()
            });

            $('#expiryDateEditor').dxDateBox({
                type: 'datetime'
            });

            $('#isActiveEditor').dxCheckBox({
                text: 'Active',
                value: true
            });

            $('#isPinnedEditor').dxCheckBox({
                text: 'Pin to Top',
                value: false
            });

            $('#cancelButton').dxButton({
                text: 'Cancel',
                type: 'normal',
                onClick: function () {
                    announcementPopup.hide();
                }
            });

            $('#saveButton').dxButton({
                text: 'Save',
                type: 'success',
                onClick: function () {
                    let title = $('#titleEditor').dxTextBox('instance').option('value');
                    let content = $('#contentEditor').dxTextArea('instance').option('value');
                    let type = $('#typeEditor').dxSelectBox('instance').option('value');
                    let priority = $('#priorityEditor').dxSelectBox('instance').option('value');
                    let targetAudience = $('#targetAudienceEditor').dxSelectBox('instance').option('value');
                    let publishDate = $('#publishDateEditor').dxDateBox('instance').option('value');
                    let expiryDate = $('#expiryDateEditor').dxDateBox('instance').option('value');
                    let isActive = $('#isActiveEditor').dxCheckBox('instance').option('value');
                    let isPinned = $('#isPinnedEditor').dxCheckBox('instance').option('value');

                    if (!title || title.trim() === '') {
                        DevExpress.ui.notify('Title is required', 'error', 3000);
                        return;
                    }

                    if (!content || content.trim() === '') {
                        DevExpress.ui.notify('Content is required', 'error', 3000);
                        return;
                    }

                    saveAnnouncement({
                        title: title,
                        content: content,
                        type: type,
                        priority: priority,
                        targetAudience: targetAudience,
                        publishDate: publishDate,
                        expiryDate: expiryDate,
                        isActive: isActive,
                        isPinned: isPinned
                    });
                }
            });
        }
    }).dxPopup('instance');

    announcementPopup.show();
}

// ==================== Edit Popup ====================
function showEditPopup(data) {
    console.log('Opening Edit Popup for:', data);

    $.ajax({
        url: getUrl('GetAnnouncement'),
        type: 'GET',
        data: { id: data.Id },
        success: function (announcement) {
            console.log('Announcement data loaded:', announcement);

            if ($('#announcementPopupContainer').length === 0) {
                $('<div id="announcementPopupContainer"></div>').appendTo('body');
            }

            if (announcementPopup) {
                announcementPopup.dispose();
            }

            announcementPopup = $('#announcementPopupContainer').dxPopup({
                title: 'Edit Announcement',
                width: 700,
                height: 'auto',
                showTitle: true,
                dragEnabled: false,
                closeOnOutsideClick: false,
                showCloseButton: true,
                contentTemplate: function (contentElement) {
                    let formHtml = `
                        <div id="announcementForm" style="padding: 20px;">
                            <input type="hidden" id="announcementId" value="${announcement.Id}" />
                            <div class="row">
                                <div class="col-sm-12">
                                    <div class="mb-3">
                                        <label for="titleEditor" class="form-label">Title <code>*</code></label>
                                        <div id="titleEditor"></div>
                                    </div>
                                </div>
                                <div class="col-sm-12">
                                    <div class="mb-3">
                                        <label for="contentEditor" class="form-label">Content <code>*</code></label>
                                        <div id="contentEditor"></div>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label for="typeEditor" class="form-label">Type</label>
                                        <div id="typeEditor"></div>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label for="priorityEditor" class="form-label">Priority</label>
                                        <div id="priorityEditor"></div>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label for="targetAudienceEditor" class="form-label">Target Audience</label>
                                        <div id="targetAudienceEditor"></div>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label for="publishDateEditor" class="form-label">Publish Date</label>
                                        <div id="publishDateEditor"></div>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label for="expiryDateEditor" class="form-label">Expiry Date</label>
                                        <div id="expiryDateEditor"></div>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label class="form-label">Options</label>
                                        <div id="isActiveEditor"></div>
                                        <div id="isPinnedEditor" style="margin-top: 10px;"></div>
                                    </div>
                                </div>
                            </div>
                            <div style="margin-top: 25px; text-align: right;">
                                <div id="cancelButton" style="display: inline-block; margin-right: 10px;"></div>
                                <div id="updateButton" style="display: inline-block;"></div>
                            </div>
                        </div>
                    `;

                    contentElement.append(formHtml);

                    $('#titleEditor').dxTextBox({
                        placeholder: 'Enter announcement title',
                        maxLength: 200,
                        value: announcement.Title
                    });

                    $('#contentEditor').dxTextArea({
                        placeholder: 'Enter announcement content',
                        height: 150,
                        maxLength: 5000,
                        value: announcement.Content
                    });

                    $('#typeEditor').dxSelectBox({
                        items: ['General', 'Important', 'Urgent', 'Event'],
                        value: announcement.Type
                    });

                    $('#priorityEditor').dxSelectBox({
                        items: ['Low', 'Normal', 'High'],
                        value: announcement.Priority
                    });

                    $('#targetAudienceEditor').dxSelectBox({
                        items: ['All', 'Students', 'Admins'],
                        value: announcement.TargetAudience
                    });

                    $('#publishDateEditor').dxDateBox({
                        type: 'datetime',
                        value: announcement.PublishDate ? new Date(announcement.PublishDate) : null
                    });

                    $('#expiryDateEditor').dxDateBox({
                        type: 'datetime',
                        value: announcement.ExpiryDate ? new Date(announcement.ExpiryDate) : null
                    });

                    $('#isActiveEditor').dxCheckBox({
                        text: 'Active',
                        value: announcement.IsActive
                    });

                    $('#isPinnedEditor').dxCheckBox({
                        text: 'Pin to Top',
                        value: announcement.IsPinned
                    });

                    $('#cancelButton').dxButton({
                        text: 'Cancel',
                        type: 'normal',
                        onClick: function () {
                            announcementPopup.hide();
                        }
                    });

                    $('#updateButton').dxButton({
                        text: 'Update',
                        type: 'success',
                        onClick: function () {
                            let id = $('#announcementId').val();
                            let title = $('#titleEditor').dxTextBox('instance').option('value');
                            let content = $('#contentEditor').dxTextArea('instance').option('value');
                            let type = $('#typeEditor').dxSelectBox('instance').option('value');
                            let priority = $('#priorityEditor').dxSelectBox('instance').option('value');
                            let targetAudience = $('#targetAudienceEditor').dxSelectBox('instance').option('value');
                            let publishDate = $('#publishDateEditor').dxDateBox('instance').option('value');
                            let expiryDate = $('#expiryDateEditor').dxDateBox('instance').option('value');
                            let isActive = $('#isActiveEditor').dxCheckBox('instance').option('value');
                            let isPinned = $('#isPinnedEditor').dxCheckBox('instance').option('value');

                            if (!title || title.trim() === '') {
                                DevExpress.ui.notify('Title is required', 'error', 3000);
                                return;
                            }

                            if (!content || content.trim() === '') {
                                DevExpress.ui.notify('Content is required', 'error', 3000);
                                return;
                            }

                            updateAnnouncement({
                                id: parseInt(id),
                                title: title,
                                content: content,
                                type: type,
                                priority: priority,
                                targetAudience: targetAudience,
                                publishDate: publishDate,
                                expiryDate: expiryDate,
                                isActive: isActive,
                                isPinned: isPinned
                            });
                        }
                    });
                }
            }).dxPopup('instance');

            announcementPopup.show();
        },
        error: function () {
            showNotification('Error loading announcement data', 'error');
        }
    });
}

// ==================== Save Announcement ====================
function saveAnnouncement(data) {
    console.log('Saving announcement:', data);

    $.ajax({
        url: getUrl('Create'),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        headers: getAjaxHeaders(),
        beforeSend: function () {
            showLoader();
        },
        success: function (response) {
            hideLoader();
            console.log('Save response:', response);

            if (response.MessageType) {
                showNotification(response.Message, 'success');
                announcementPopup.hide();
                refreshGrid();
            } else {
                showNotification(response.Message, 'error');
            }
        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Save error:', error);
            showNotification('An error occurred while saving the announcement', 'error');
        }
    });
}

// ==================== Update Announcement ====================
function updateAnnouncement(data) {
    console.log('Updating announcement:', data);

    $.ajax({
        url: getUrl('Update'),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        headers: getAjaxHeaders(),
        beforeSend: function () {
            showLoader();
        },
        success: function (response) {
            hideLoader();
            console.log('Update response:', response);

            if (response.MessageType) {
                showNotification(response.Message, 'success');
                announcementPopup.hide();
                refreshGrid();
            } else {
                showNotification(response.Message, 'error');
            }
        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Update error:', error);
            showNotification('An error occurred while updating the announcement', 'error');
        }
    });
}

// ==================== Toggle Status ====================
function toggleStatus(data) {
    console.log('Toggling status for:', data);

    const action = data.IsActive ? 'deactivate' : 'activate';
    DevExpress.ui.dialog.confirm(
        `Are you sure you want to ${action} the announcement "${data.Title}"?`,
        'Confirm Status Change'
    ).done(function (dialogResult) {
        if (dialogResult) {
            $.ajax({
                url: getUrl('ToggleStatus'),
                type: 'POST',
                data: { id: data.Id },
                headers: getAjaxHeaders(),
                beforeSend: function () {
                    showLoader();
                },
                success: function (response) {
                    hideLoader();
                    console.log('Toggle response:', response);

                    if (response.MessageType) {
                        showNotification(response.Message, 'success');
                        refreshGrid();
                    } else {
                        showNotification(response.Message, 'error');
                    }
                },
                error: function (xhr, status, error) {
                    hideLoader();
                    console.error('Toggle error:', error);
                    showNotification('An error occurred while toggling status', 'error');
                }
            });
        }
    });
}

// ==================== Confirm Delete ====================
function confirmDelete(data) {
    console.log('Confirming delete for:', data);

    DevExpress.ui.dialog.confirm(
        `Are you sure you want to delete the announcement "${data.Title}"?`,
        'Confirm Delete'
    ).done(function (dialogResult) {
        if (dialogResult) {
            deleteAnnouncement(data.Id);
        }
    });
}

// ==================== Delete Announcement ====================
function deleteAnnouncement(id) {
    console.log('Deleting announcement:', id);

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
            console.log('Delete response:', response);

            if (response.MessageType) {
                showNotification(response.Message, 'success');
                refreshGrid();
            } else {
                showNotification(response.Message, 'error');
            }
        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Delete error:', error);
            showNotification('An error occurred while deleting the announcement', 'error');
        }
    });
}

// ==================== Helper Functions ====================
function refreshGrid() {
    console.log('Refreshing grid...');
    $("#announcementsDataGrid").dxDataGrid('instance').refresh();
}

function getUrl(action) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/Announcements/${action}`;
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
