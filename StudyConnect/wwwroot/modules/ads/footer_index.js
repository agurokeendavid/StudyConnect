$(document).ready(function () {
    // Initialize DataGrid
    initializeDataGrid();

    // Initialize Add Button
    initializeAddButton();
});

// ==================== DataGrid Initialization ====================
function initializeDataGrid() {
    console.log('Initializing Ads DataGrid...');

    try {
        $("#adsDataGrid").dxDataGrid({
            dataSource: {
                load: function () {
                    console.log('Loading ads...');
                    return $.ajax({
                        url: getUrl('GetAds'),
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
                placeholder: 'Search ads...'
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
                fileName: 'Ads'
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
                    dataField: 'Description',
                    caption: 'Description',
                    minWidth: 250
                },
                {
                    dataField: 'Position',
                    caption: 'Position',
                    width: 120
                },
                {
                    dataField: 'StartDate',
                    caption: 'Start Date',
                    dataType: 'datetime',
                    format: 'MM/dd/yyyy',
                    width: 130
                },
                {
                    dataField: 'EndDate',
                    caption: 'End Date',
                    dataType: 'datetime',
                    format: 'MM/dd/yyyy',
                    width: 130
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
                    width: 100,
                    alignment: 'center'
                },
                {
                    dataField: 'ClickCount',
                    caption: 'Clicks',
                    width: 100,
                    alignment: 'center'
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
                                window.location.href = getUrl('Upsert') + '?id=' + e.row.data.Id;
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
        $("#btn-add-ads").dxButton({
            text: 'Add Ad',
            icon: 'add',
            type: 'success',
            onClick: function () {
                window.location.href = getUrl('Upsert');
            }
        });

    } catch (error) {
        console.error('Error initializing Add Button:', error);
    }
}

// ==================== Toggle Status ====================
function toggleStatus(data) {
    console.log('Toggling status for:', data);

    const action = data.isActive ? 'deactivate' : 'activate';
    DevExpress.ui.dialog.confirm(
        `Are you sure you want to ${action} the ad "${data.Title}"?`,
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
        `Are you sure you want to delete the ad "${data.Title}"?`,
        'Confirm Delete'
    ).done(function (dialogResult) {
        if (dialogResult) {
            deleteAd(data.Id);
        }
    });
}

// ==================== Delete Ad ====================
function deleteAd(id) {
    console.log('Deleting ad:', id);

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
            showNotification('An error occurred while deleting the ad', 'error');
        }
    });
}

// ==================== Helper Functions ====================
function refreshGrid() {
    console.log('Refreshing grid...');
    $("#adsDataGrid").dxDataGrid('instance').refresh();
}

function getUrl(action) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/Ads/${action}`;
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
