$(function () {
    // Initialize DevExtreme Button for Add User
    $("#btn-add-user").dxButton({
        text: "Add New User",
        icon: "ti ti-user-plus",
        type: "success",
        stylingMode: "contained",
        elementAttr: {
            class: "btn-success rounded-pill px-4"
        },
        onClick: function () {
            window.location.href = "/Users/Upsert";
        }
    });

    // Initialize DevExtreme DataGrid
    $("#usersDataGrid").dxDataGrid({
        dataSource: {
            load: function () {
                return $.ajax({
                    url: "/Users/GetUsers",
                    type: "GET",
                    dataType: "json"
                }).then(function (response) {
                    return response.data;
                });
            }
        },
        remoteOperations: false,
        showBorders: true,
        showRowLines: true,
        showColumnLines: true,
        rowAlternationEnabled: true,
        columnAutoWidth: true,
        hoverStateEnabled: true,
        allowColumnReordering: true,
        allowColumnResizing: true,
        columnResizingMode: "widget",
        paging: {
            pageSize: 10
        },
        pager: {
            visible: true,
            showPageSizeSelector: true,
            allowedPageSizes: [10, 25, 50, 100],
            showInfo: true,
            showNavigationButtons: true
        },
        filterRow: {
            visible: true
        },
        searchPanel: {
            visible: true,
            width: 240,
            placeholder: "Search users..."
        },
        headerFilter: {
            visible: true
        },
        export: {
            enabled: true,
            fileName: "Users"
        },
        selection: {
            mode: "single"
        },
        columns: [
            {
                dataField: "fullName",
                caption: "Full Name",
                width: 200,
                cellTemplate: function (container, options) {
                    var nameHtml = '<div class="d-flex align-items-center">' +
                        '<div class="ms-2">' +
                        '<h6 class="mb-0 fw-semibold">' + options.data.fullName + '</h6>' +
                        '<small class="text-muted">' + options.data.email + '</small>' +
                        '</div>' +
                        '</div>';
                    container.append(nameHtml);
                }
            },
            {
                dataField: "role",
                caption: "Role",
                width: 120,
                cellTemplate: function (container, options) {
                    var badgeClass = options.value === "Admin" ? "bg-danger" : "bg-primary";
                    var badge = '<span class="badge ' + badgeClass + '">' + options.value + '</span>';
                    container.append(badge);
                }
            },
            {
                dataField: "sex",
                caption: "Gender",
                width: 100
            },
            {
                dataField: "dob",
                caption: "Date of Birth",
                width: 120
            },
            {
                dataField: "contactNo",
                caption: "Contact No.",
                width: 150
            },
            {
                dataField: "address",
                caption: "Address",
                minWidth: 200
            },
            {
                dataField: "emailConfirmed",
                caption: "Status",
                width: 100,
                cellTemplate: function (container, options) {
                    var statusClass = options.value ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning";
                    var statusText = options.value ? "Active" : "Pending";
                    var badge = '<span class="badge ' + statusClass + '">' + statusText + '</span>';
                    container.append(badge);
                }
            },
            {
                dataField: "createdAt",
                caption: "Created At",
                width: 150
            },
            {
                type: "buttons",
                caption: "Actions",
                width: 120,
                buttons: [
                    {
                        hint: "Edit",
                        icon: "ti ti-edit",
                        cssClass: "btn btn-sm btn-primary",
                        onClick: function (e) {
                            window.location.href = "/Users/Upsert?id=" + e.row.data.id;
                        }
                    },
                    {
                        hint: "Delete",
                        icon: "ti ti-trash",
                        cssClass: "btn btn-sm btn-danger",
                        onClick: function (e) {
                            deleteUser(e.row.data.id, e.row.data.fullName);
                        }
                    }
                ]
            }
        ],
        onToolbarPreparing: function (e) {
            e.toolbarOptions.items.unshift({
                location: "after",
                widget: "dxButton",
                options: {
                    icon: "refresh",
                    hint: "Refresh",
                    onClick: function () {
                        $("#usersDataGrid").dxDataGrid("instance").refresh();
                    }
                }
            });
        },
        onContentReady: function (e) {
            // Add custom styling to action buttons
            e.element.find(".dx-command-edit .dx-link").each(function () {
                $(this).addClass("me-1");
            });
        }
    });

    // Delete User Function
    function deleteUser(userId, userName) {
        Swal.fire({
            title: 'Are you sure?',
            html: 'You are about to delete user <strong>' + userName + '</strong>.<br>This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/Users/DeleteUser',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(userId),
                    dataType: 'json',
                    beforeSend: function () {
                        AmagiLoader.show();
                    },
                    success: function (response) {
                        ResponseHandler.handle(response, {
                            customHandlers: {
                                [MessageTypes.SuccessString]: function (response) {
                                    Swal.fire({
                                        title: 'Deleted!',
                                        text: response.Message,
                                        icon: 'success',
                                        confirmButtonColor: '#28a745',
                                        timer: 2000,
                                        timerProgressBar: true
                                    }).then(() => {
                                        // Refresh the grid
                                        $("#usersDataGrid").dxDataGrid("instance").refresh();
                                    });
                                }
                            }
                        });
                    },
                    error: function (result) {
                        console.error(result);
                        Swal.fire({
                            title: 'Failed!',
                            text: 'Error occurred while deleting user.',
                            icon: 'error'
                        });
                    },
                    complete: function () {
                        AmagiLoader.hide();
                    }
                });
            }
        });
    }
});
