$(document).ready(function () {
    // Initialize DataGrid
    initializeDataGrid();

    // Initialize Add Button
    initializeAddButton();
});

// ==================== DataGrid Initialization ====================
function initializeDataGrid() {
    console.log('Initializing DataGrid...');

    try {
        $("#studyGroupCategoriesDataGrid").dxDataGrid({
            dataSource: {
                load: function () {
                    console.log('Loading categories...');
                    return $.ajax({
                        url: getUrl('GetCategories'),
                        type: 'GET',
                        dataType: 'json'
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
                placeholder: 'Search categories...'
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
                fileName: 'StudyGroupCategories'
            },
            columns: [
                {
                    dataField: 'id',
                    caption: 'ID',
                    width: 80,
                    alignment: 'center',
                    visible: false
                },
                {
                    dataField: 'name',
                    caption: 'Category Name',
                    minWidth: 200
                },
                {
                    dataField: 'description',
                    caption: 'Description',
                    minWidth: 250
                },
                {
                    dataField: 'createdByName',
                    caption: 'Created By',
                    width: 150
                },
                {
                    dataField: 'createdAt',
                    caption: 'Created Date',
                    dataType: 'datetime',
                    format: 'MM/dd/yyyy hh:mm a',
                    width: 180,
                    sortOrder: 'desc'
                },
                {
                    dataField: 'modifiedByName',
                    caption: 'Modified By',
                    width: 150
                },
                {
                    dataField: 'modifiedAt',
                    caption: 'Modified Date',
                    dataType: 'datetime',
                    format: 'MM/dd/yyyy hh:mm a',
                    width: 180
                },
                {
                    type: 'buttons',
                    caption: 'Actions',
                    width: 150,
                    buttons: [
                        {
                            hint: 'Edit',
                            icon: "ti ti-edit",
                            onClick: function (e) {
                                showEditPopup(e.row.data);
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
        $("#btn-add-study-group-category").dxButton({
            text: 'Add Category',
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
let categoryPopup = null;

// ==================== Add Popup ====================
function showAddPopup() {
    // Create popup container if it doesn't exist
    if ($('#categoryPopupContainer').length === 0) {
        $('<div id="categoryPopupContainer"></div>').appendTo('body');
    }

    // Destroy existing popup if any
    if (categoryPopup) {
        categoryPopup.dispose();
    }

    // Create popup
    categoryPopup = $('#categoryPopupContainer').dxPopup({
        title: 'Add Study Group Category',
        width: 600,
        height: 'auto',
        showTitle: true,
        dragEnabled: false,
        closeOnOutsideClick: false,
        showCloseButton: true,
        contentTemplate: function (contentElement) {
            // Form HTML
            let formHtml = `
           <div id="categoryForm" style="padding: 20px;">
           <div class="row">
           <div class="col-sm-12">
                                    <div class="mb-3">
                                        <label for="nameEditor" class="form-label">Category Name <code>*</code></label>
                                        <div id="nameEditor"></div>
                                    </div>
                                </div>

                                <div class="col-sm-12">
                                    <div class="mb-3">
                                        <label for="descriptionEditor" class="form-label">Description</label>
                                        <div id="descriptionEditor"></div>
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

            // Initialize name editor
            $('#nameEditor').dxTextBox({
                placeholder: 'Enter category name',
                maxLength: 100,
                value: ''
            });

            // Initialize description editor
            $('#descriptionEditor').dxTextArea({
                placeholder: 'Enter category description',
                height: 100,
                maxLength: 500,
                value: ''
            });

            // Initialize cancel button
            $('#cancelButton').dxButton({
                text: 'Cancel',
                type: 'normal',
                onClick: function () {
                    categoryPopup.hide();
                }
            });

            // Initialize save button
            $('#saveButton').dxButton({
                text: 'Save',
                type: 'success',
                onClick: function () {
                    let name = $('#nameEditor').dxTextBox('instance').option('value');
                    let description = $('#descriptionEditor').dxTextArea('instance').option('value');

                    if (!name || name.trim() === '') {
                        DevExpress.ui.notify('Category name is required', 'error', 3000);
                        return;
                    }

                    saveCategory({ name: name, description: description });
                }
            });
        }
    }).dxPopup('instance');

    // Show popup
    categoryPopup.show();
}

// ==================== Edit Popup ====================
function showEditPopup(data) {
    console.log('Opening Edit Popup for:', data);

    // Load full category data
    $.ajax({
        url: getUrl('GetCategory'),
        type: 'GET',
        data: { id: data.id },
        success: function (category) {
            console.log('Category data loaded:', category);

            // Create popup container if it doesn't exist
            if ($('#categoryPopupContainer').length === 0) {
                $('<div id="categoryPopupContainer"></div>').appendTo('body');
            }

            // Destroy existing popup if any
            if (categoryPopup) {
                categoryPopup.dispose();
            }

            // Create popup
            categoryPopup = $('#categoryPopupContainer').dxPopup({
                title: 'Edit Study Group Category',
                width: 600,
                height: 'auto',
                showTitle: true,
                dragEnabled: false,
                closeOnOutsideClick: false,
                showCloseButton: true,
                contentTemplate: function (contentElement) {
                    // Form HTML
                    let formHtml = `
     <div id="categoryForm" style="padding: 20px;">
<input type="hidden" id="categoryId" value="${category.id}" />
          <div class="row">
           <div class="col-sm-12">
                                    <div class="mb-3">
                                        <label for="nameEditor" class="form-label">Category Name <code>*</code></label>
                                        <div id="nameEditor"></div>
                                    </div>
                                </div>

                                <div class="col-sm-12">
                                    <div class="mb-3">
                                        <label for="descriptionEditor" class="form-label">Description</label>
                                        <div id="descriptionEditor"></div>
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

                    // Initialize name editor
                    $('#nameEditor').dxTextBox({
                        placeholder: 'Enter category name',
                        maxLength: 100,
                        value: category.name
                    });

                    // Initialize description editor
                    $('#descriptionEditor').dxTextArea({
                        placeholder: 'Enter category description',
                        height: 100,
                        maxLength: 500,
                        value: category.description
                    });

                    // Initialize cancel button
                    $('#cancelButton').dxButton({
                        text: 'Cancel',
                        type: 'normal',
                        onClick: function () {
                            categoryPopup.hide();
                        }
                    });

                    // Initialize update button
                    $('#updateButton').dxButton({
                        text: 'Update',
                        type: 'success',
                        onClick: function () {
                            let id = $('#categoryId').val();
                            let name = $('#nameEditor').dxTextBox('instance').option('value');
                            let description = $('#descriptionEditor').dxTextArea('instance').option('value');

                            if (!name || name.trim() === '') {
                                DevExpress.ui.notify('Category name is required', 'error', 3000);
                                return;
                            }

                            updateCategory({ id: parseInt(id), name: name, description: description });
                        }
                    });
                }
            }).dxPopup('instance');

            // Show popup
            categoryPopup.show();
        },
        error: function () {
            showNotification('Error loading category data', 'error');
        }
    });
}

// ==================== Save Category ====================
function saveCategory(data) {
    console.log('Saving category:', data);

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
                categoryPopup.hide();
                refreshGrid();
            } else {
                showNotification(response.Message, 'error');
            }
        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Save error:', error);
            showNotification('An error occurred while saving the category', 'error');
        }
    });
}

// ==================== Update Category ====================
function updateCategory(data) {
    console.log('Updating category:', data);

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
                categoryPopup.hide();
                refreshGrid();
            } else {
                showNotification(response.Message, 'error');
            }
        },
        error: function (xhr, status, error) {
            hideLoader();
            console.error('Update error:', error);
            showNotification('An error occurred while updating the category', 'error');
        }
    });
}

// ==================== Confirm Delete ====================
function confirmDelete(data) {
    console.log('Confirming delete for:', data);

    DevExpress.ui.dialog.confirm(
        `Are you sure you want to delete the category "${data.name}"?`,
        'Confirm Delete'
    ).done(function (dialogResult) {
        if (dialogResult) {
            deleteCategory(data.id);
        }
    });
}

// ==================== Delete Category ====================
function deleteCategory(id) {
    console.log('Deleting category:', id);

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
            showNotification('An error occurred while deleting the category', 'error');
        }
    });
}

// ==================== Helper Functions ====================
function refreshGrid() {
    console.log('Refreshing grid...');
    $("#studyGroupCategoriesDataGrid").dxDataGrid('instance').refresh();
}

function getUrl(action) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/StudyGroupCategories/${action}`;
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
