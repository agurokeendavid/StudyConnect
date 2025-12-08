$(function () {
    loadPendingAccounts();

    // Event handlers
    $('#btnApprove').on('click', approveAccount);
    $('#btnReject').on('click', showRejectModal);
    $('#btnConfirmReject').on('click', rejectAccount);
    
    // Clear rejection reason when modal is closed
    $('#rejectModal').on('hidden.bs.modal', function () {
        $('#rejectionReasonInput').val('').removeClass('is-invalid');
        $('#rejectionReasonError').hide();
    });
});

function loadPendingAccounts() {
    $("#accountsGrid").dxDataGrid({
        dataSource: {
            store: {
                type: 'array',
                key: 'id',
                data: []
            },
            load: function () {
                return $.ajax({
                    url: '/AccountVerification/GetPendingAccounts',
                    type: 'GET',
                    dataType: 'json'
                }).then(function (response) {
                    var accounts = response.data || [];
                    
                    // Update pending count badge
                    $('#pendingCount').text(accounts.length);
                    
                    return accounts;
                });
            }
        },
        columns: [
            {
                caption: 'User',
                alignment: 'center',
                cellTemplate: function (container, options) {
                    var initials = getInitials(options.data.fullName);
                    $('<div>').addClass('d-flex align-items-center justify-content-center').append(
                        $('<div>').addClass('message-avatar me-2').text(initials),
                        $('<div>').append(
                            $('<div>').addClass('fw-semibold').text(options.data.fullName),
                            $('<small>').addClass('text-muted').text(options.data.email)
                        )
                    ).appendTo(container);
                }
            },
            {
                dataField: 'role',
                caption: 'Role',
                width: 100,
                cellTemplate: function (container, options) {
                    var badgeClass = 'bg-primary';
                    if (options.value === 'Admin') badgeClass = 'bg-warning';
                    $('<span>').addClass('badge ' + badgeClass).text(options.value).appendTo(container);
                }
            },
            {
                dataField: 'createdAt',
                caption: 'Registered On',
                width: 180,
                dataType: 'string'
            },
            {
                dataField: 'hasDocuments',
                caption: 'Documents',
                width: 120,
                cellTemplate: function (container, options) {
                    $('<span>').addClass('badge bg-success-subtle text-success')
                        .html('<i class="ti ti-check me-1"></i>Uploaded')
                        .appendTo(container);
                    //if (options.value) {
                    //    $('<span>').addClass('badge bg-success-subtle text-success')
                    //        .html('<i class="ti ti-check me-1"></i>Uploaded')
                    //        .appendTo(container);
                    //} else {
                    //    $('<span>').addClass('badge bg-danger-subtle text-danger')
                    //        .html('<i class="ti ti-x me-1"></i>Missing')
                    //        .appendTo(container);
                    //}
                }
            },
            {
                caption: 'Actions',
                width: 150,
                cellTemplate: function (container, options) {
                    var btn = $('<button>')
                        .addClass('btn btn-sm btn-primary')
                        .html('<i class="ti ti-eye me-1"></i>Review')
                        .on('click', function () {
                            reviewAccount(options.data.id);
                        });
                    
                    //if (!options.data.hasDocuments) {
                    //    btn.prop('disabled', true);
                    //}
                    
                    container.append(btn);
                }
            }
        ],
        showBorders: true,
        showRowLines: true,
        showColumnLines: false,
        rowAlternationEnabled: true,
        hoverStateEnabled: true,
        paging: {
            pageSize: 10
        },
        pager: {
            showPageSizeSelector: true,
            allowedPageSizes: [5, 10, 20, 50],
            showInfo: true
        },
        searchPanel: {
            visible: true,
            width: '100%',
            placeholder: 'Search accounts...'
        },
        headerFilter: {
            visible: true
        }
    });
}

function reviewAccount(userId) {
    AmagiLoader.show();
    
    $.ajax({
        url: '/AccountVerification/GetAccountDetails',
        type: 'GET',
        data: { id: userId },
        success: function (response) {
            AmagiLoader.hide();
            
            if (response.MessageType === 'Success' && response.Data) {
                displayAccountDetails(response.Data);
                $('#reviewModal').modal('show');
            } else {
                Swal.fire('Error', response.Message || 'Failed to load account details', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while loading account details', 'error');
        }
    });
}

function displayAccountDetails(data) {
    $('#currentUserId').val(data.id);
    $('#userFullName').text(data.fullName);
    $('#userEmail').text(data.email);
    $('#userRole').text(data.role);
    $('#userCreatedAt').text(data.createdAt);
    
    // Show rejection reason if exists
    if (data.rejectionReason) {
        $('#rejectionReason').text(data.rejectionReason);
        $('#rejectionReasonSection').show();
    } else {
        $('#rejectionReasonSection').hide();
    }
    
    // Display ID image
    if (data.idImagePath) {
        $('#idImagePreview').html(`
            <img src="${escapeHtml(data.idImagePath)}" alt="ID Image" style="cursor: pointer;" onclick="window.open('${escapeHtml(data.idImagePath)}', '_blank')" />
        `);
        $('#btnOpenIdImage').attr('href', data.idImagePath);
        $('#idImageActions').show();
    } else {
        $('#idImagePreview').html(`
            <div class="text-center text-muted">
                <i class="ti ti-photo-off fs-1"></i>
                <p>No ID image uploaded</p>
            </div>
        `);
        $('#idImageActions').hide();
    }
    
    // Display study load PDF
    if (data.studyLoadPdfPath) {
        // Use iframe for better PDF display
        $('#studyLoadPreview').html(`
            <iframe src="${escapeHtml(data.studyLoadPdfPath)}#toolbar=0" style="cursor: pointer;"></iframe>
        `);
        $('#btnOpenStudyLoad').attr('href', data.studyLoadPdfPath);
        $('#studyLoadActions').show();
    } else {
        $('#studyLoadPreview').html(`
            <div class="text-center text-muted">
                <i class="ti ti-file-off fs-1"></i>
                <p>No study load PDF uploaded</p>
            </div>
        `);
        $('#studyLoadActions').hide();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
}

function approveAccount() {
    var userId = $('#currentUserId').val();
    
    Swal.fire({
        title: 'Approve Account?',
        text: 'This user will be able to login and access the system.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();
            
            $.ajax({
                url: '/AccountVerification/ApproveAccount',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(userId),
                headers: {
                    'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                },
                success: function (response) {
                    AmagiLoader.hide();
                    
                    if (response.MessageType === 'Success') {
                        Swal.fire({
                            title: 'Approved!',
                            text: response.Message,
                            icon: 'success',
                            confirmButtonColor: '#5D87FF'
                        }).then(() => {
                            $('#reviewModal').modal('hide');
                            $('#accountsGrid').dxDataGrid('instance').refresh();
                        });
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to approve account', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while approving the account', 'error');
                }
            });
        }
    });
}

function showRejectModal() {
    // Clear any previous input
    $('#rejectionReasonInput').val('').removeClass('is-invalid');
    $('#rejectionReasonError').hide();
    
    // Show the reject modal
    $('#rejectModal').modal('show');
}

function rejectAccount() {
    var userId = $('#currentUserId').val();
    var reason = $('#rejectionReasonInput').val().trim();
    
    // Validate input
    if (!reason) {
        $('#rejectionReasonInput').addClass('is-invalid');
        $('#rejectionReasonError').show();
        return;
    }
    
    // Remove validation error
    $('#rejectionReasonInput').removeClass('is-invalid');
    $('#rejectionReasonError').hide();
    
    // Hide rejection modal
    $('#rejectModal').modal('hide');
    
    // Show confirmation
    Swal.fire({
        title: 'Confirm Rejection',
        text: 'Are you sure you want to reject this account?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reject it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();
            
            $.ajax({
                url: '/AccountVerification/RejectAccount',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    userId: userId,
                    reason: reason
                }),
                headers: {
                    'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                },
                success: function (response) {
                    AmagiLoader.hide();
                    
                    if (response.MessageType === 'Success') {
                        Swal.fire({
                            title: 'Rejected!',
                            text: response.Message,
                            icon: 'success',
                            confirmButtonColor: '#5D87FF'
                        }).then(() => {
                            $('#reviewModal').modal('hide');
                            $('#accountsGrid').dxDataGrid('instance').refresh();
                        });
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to reject account', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while rejecting the account', 'error');
                }
            });
        } else {
            // If cancelled, show the reject modal again
            $('#rejectModal').modal('show');
        }
    });
}

function getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    }
    return name.charAt(0) + (name.charAt(1) || '');
}
