// Forum management JavaScript for Study Groups
var currentForumConnection = null;

$(function () {
    // Load forums when Forums tab is clicked
    $('#forums-tab').on('click', function () {
        loadForums();
    });

    // Event handlers
    $('#btnCreateForum').on('click', openCreateForumModal);
    $('#btnSubmitForum').on('click', submitForum);
    $('#forumPostForm').on('submit', submitForumPost);
    $('#forumPostImages').on('change', handleImagePreview);
});

// ==================== Load Forums ====================
function loadForums() {
    $.ajax({
        url: '/Forums/GetForums',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            if (response.data && response.data.length > 0) {
                renderForums(response.data);
                $('#forumsEmpty').hide();
                $('#forumsList').show();
            } else {
                $('#forumsEmpty').show();
                $('#forumsList').empty();
            }
        },
        error: function () {
            console.error('Error loading forums');
            $('#forumsEmpty').show();
        }
    });
}

function renderForums(forums) {
    var container = $('#forumsList');
    container.empty();

    forums.forEach(function (forum) {
        var card = createForumCard(forum);
        container.append(card);
    });
}

function createForumCard(forum) {
    var memberBadge = `<span class="badge bg-success-subtle text-success">
        <i class="ti ti-users me-1"></i>${forum.memberCount} Members
    </span>`;

    var pendingBadge = forum.pendingRequestCount > 0 && isOwner
        ? `<span class="badge bg-warning-subtle text-warning ms-2">
            <i class="ti ti-clock me-1"></i>${forum.pendingRequestCount} Pending
        </span>`
        : '';

    var actionButtons = '';
    
    if (forum.isUserMember) {
        actionButtons = `
            <button class="btn btn-sm btn-primary" onclick="viewForum(${forum.id}, '${escapeHtml(forum.name)}')">
                <i class="ti ti-eye me-1"></i>View Posts
            </button>
        `;
    } else if (forum.hasPendingRequest) {
        actionButtons = `
            <button class="btn btn-sm btn-secondary" disabled>
                <i class="ti ti-clock me-1"></i>Request Pending
            </button>
        `;
    } else {
        actionButtons = `
            <button class="btn btn-sm btn-success" onclick="joinForum(${forum.id})">
                <i class="ti ti-user-plus me-1"></i>Request to Join
            </button>
        `;
    }

    var ownerButtons = '';
    if (isOwner) {
        ownerButtons = `
            <div class="btn-group btn-group-sm ms-2">
                <button type="button" class="btn btn-outline-primary" onclick="editForum(${forum.id}, '${escapeHtml(forum.name)}', '${escapeHtml(forum.description || '')}')">
                    <i class="ti ti-edit"></i>
                </button>
                <button type="button" class="btn btn-outline-danger" onclick="deleteForum(${forum.id})">
                    <i class="ti ti-trash"></i>
                </button>
                ${forum.pendingRequestCount > 0 ? `
                <button type="button" class="btn btn-outline-warning" onclick="viewForumRequests(${forum.id}, '${escapeHtml(forum.name)}')">
                    <i class="ti ti-user-check"></i> ${forum.pendingRequestCount}
                </button>
                ` : ''}
            </div>
        `;
    }

    var card = `
        <div class="col-md-6 mb-3" id="forum-${forum.id}">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="flex-grow-1">
                            <h5 class="card-title mb-2">${escapeHtml(forum.name)}</h5>
                            ${forum.description ? `<p class="card-text text-muted small mb-3">${escapeHtml(forum.description)}</p>` : ''}
                            <div class="mb-3">
                                ${memberBadge}
                                ${pendingBadge}
                            </div>
                            <small class="text-muted">
                                <i class="ti ti-user me-1"></i>Created by ${escapeHtml(forum.createdByName)}
                            </small>
                            <br>
                            <small class="text-muted">
                                <i class="ti ti-calendar me-1"></i>${forum.createdAt}
                            </small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        ${actionButtons}
                        ${ownerButtons}
                    </div>
                </div>
            </div>
        </div>
    `;

    return card;
}

// ==================== Create/Edit Forum ====================
function openCreateForumModal() {
    $('#forumId').val('');
    $('#forumForm')[0].reset();
    $('#forumModalTitle').text('Create Forum');
    $('#btnSubmitForum').html('<i class="ti ti-device-floppy me-1"></i>Save Forum');
    $('#forumModal').modal('show');
}

function editForum(forumId, name, description) {
    $('#forumId').val(forumId);
    $('#forumName').val(name);
    $('#forumDescription').val(description);
    $('#forumModalTitle').text('Edit Forum');
    $('#btnSubmitForum').html('<i class="ti ti-device-floppy me-1"></i>Update Forum');
    $('#forumModal').modal('show');
}

function submitForum() {
    var forumId = $('#forumId').val();
    var name = $('#forumName').val().trim();
    var description = $('#forumDescription').val().trim();

    if (!name) {
        Swal.fire('Error', 'Please enter a forum name', 'error');
        return;
    }

    var data = {
        studyGroupId: studyGroupId,
        name: name,
        description: description
    };

    var url = '/Forums/CreateForum';
    var successMessage = 'Forum created successfully!';

    if (forumId) {
        url = '/Forums/UpdateForum';
        data.forumId = parseInt(forumId);
        successMessage = 'Forum updated successfully!';
    }

    AmagiLoader.show();

    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success') {
                Swal.fire('Success', successMessage, 'success');
                $('#forumModal').modal('hide');
                loadForums();
            } else {
                Swal.fire('Error', response.Message || 'Failed to save forum', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while saving the forum', 'error');
        }
    });
}

function deleteForum(forumId) {
    Swal.fire({
        title: 'Delete Forum?',
        text: 'This will delete all posts in this forum. This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/Forums/DeleteForum',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(forumId),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        Swal.fire('Deleted!', 'Forum has been deleted.', 'success');
                        $(`#forum-${forumId}`).fadeOut(300, function () {
                            $(this).remove();
                            if ($('#forumsList .col-md-6').length === 0) {
                                $('#forumsEmpty').show();
                                $('#forumsList').hide();
                            }
                        });
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to delete forum', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while deleting the forum', 'error');
                }
            });
        }
    });
}

// ==================== Join Forum ====================
function joinForum(forumId) {
    Swal.fire({
        title: 'Request to Join Forum?',
        text: 'The group owner will need to approve your request.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Send Request'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/Forums/JoinForum',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ forumId: forumId }),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        Swal.fire('Request Sent!', response.Message, 'success');
                        loadForums();
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to send request', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while sending the request', 'error');
                }
            });
        }
    });
}

// ==================== View Forum & Posts ====================
function viewForum(forumId, forumName) {
    $('#currentForumId').val(forumId);
    $('#viewForumTitle').text(forumName);
    $('#viewForumModal').modal('show');
    
    // Join forum SignalR group
    joinForumSignalR(forumId);
    
    // Load forum posts
    loadForumPosts(forumId);
}

function joinForumSignalR(forumId) {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("JoinForum", forumId)
            .then(function () {
                console.log("Joined forum: " + forumId);
            })
            .catch(function (err) {
                console.error("Error joining forum: ", err);
            });
    }
}

function leaveForumSignalR(forumId) {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("LeaveForum", forumId)
            .then(function () {
                console.log("Left forum: " + forumId);
            })
            .catch(function (err) {
                console.error("Error leaving forum: ", err);
            });
    }
}

// Handle modal close
$('#viewForumModal').on('hidden.bs.modal', function () {
    var forumId = $('#currentForumId').val();
    if (forumId) {
        leaveForumSignalR(parseInt(forumId));
    }
    $('#forumPostForm')[0].reset();
    $('#imagePreview').hide();
    $('#imagePreviewContainer').empty();
});

function loadForumPosts(forumId) {
    $.ajax({
        url: '/Forums/GetForumPosts',
        type: 'GET',
        data: { forumId: forumId },
        success: function (response) {
            if (response.data && response.data.length > 0) {
                renderForumPosts(response.data);
                $('#forumPostsEmpty').hide();
                $('#forumPostsList').show();
            } else {
                $('#forumPostsEmpty').show();
                $('#forumPostsList').empty();
            }
        },
        error: function () {
            console.error('Error loading forum posts');
            $('#forumPostsEmpty').show();
        }
    });
}

function renderForumPosts(posts) {
    var container = $('#forumPostsList');
    container.empty();

    posts.forEach(function (post) {
        var postCard = createForumPostCard(post);
        container.append(postCard);
    });
}

function createForumPostCard(post) {
    var initials = getInitials(post.userName);
    
    var imagesHtml = '';
    if (post.images && post.images.length > 0) {
        imagesHtml = '<div class="mt-3 d-flex gap-2 flex-wrap">';
        post.images.forEach(function (image) {
            imagesHtml += `
                <a href="${image.path}" target="_blank">
                    <img src="${image.path}" alt="${escapeHtml(image.fileName)}" 
                         class="img-thumbnail" style="max-height: 150px; cursor: pointer;">
                </a>
            `;
        });
        imagesHtml += '</div>';
    }

    var deleteButton = '';
    if (post.userId === currentUserId || isOwner) {
        deleteButton = `
            <button class="btn btn-sm btn-outline-danger" onclick="deleteForumPost(${post.id})">
                <i class="ti ti-trash"></i>
            </button>
        `;
    }

    var card = `
        <div class="card mb-3" id="forumPost-${post.id}">
            <div class="card-body">
                <div class="d-flex align-items-start">
                    <div class="message-avatar me-3">${initials}</div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="mb-0 fw-semibold">${escapeHtml(post.userName)}</h6>
                                <small class="text-muted">${post.postedAt}</small>
                            </div>
                            ${deleteButton}
                        </div>
                        <p class="mb-0">${escapeHtml(post.content)}</p>
                        ${imagesHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    return card;
}

// ==================== Create Forum Post ====================
function handleImagePreview() {
    var files = $('#forumPostImages')[0].files;
    var container = $('#imagePreviewContainer');
    container.empty();

    if (files.length > 0) {
        $('#imagePreview').show();
        
        for (var i = 0; i < Math.min(files.length, 5); i++) {
            var file = files[i];
            var reader = new FileReader();
            
            reader.onload = (function(file) {
                return function(e) {
                    var img = $(`
                        <div class="position-relative">
                            <img src="${e.target.result}" class="img-thumbnail" style="max-height: 100px;">
                        </div>
                    `);
                    container.append(img);
                };
            })(file);
            
            reader.readAsDataURL(file);
        }
    } else {
        $('#imagePreview').hide();
    }
}

function submitForumPost(e) {
    e.preventDefault();
    
    var forumId = $('#currentForumId').val();
    var content = $('#forumPostContent').val().trim();
    var files = $('#forumPostImages')[0].files;

    if (!content) {
        Swal.fire('Error', 'Please enter some content', 'error');
        return;
    }

    if (files.length > 5) {
        Swal.fire('Error', 'Maximum 5 images allowed', 'error');
        return;
    }

    var formData = new FormData();
    formData.append('forumId', forumId);
    formData.append('content', content);

    for (var i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }

    AmagiLoader.show();

    $.ajax({
        url: '/Forums/CreateForumPost',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success') {
                $('#forumPostForm')[0].reset();
                $('#imagePreview').hide();
                $('#imagePreviewContainer').empty();
                // Post will be added via SignalR
            } else {
                Swal.fire('Error', response.Message || 'Failed to create post', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while creating the post', 'error');
        }
    });
}

function deleteForumPost(postId) {
    Swal.fire({
        title: 'Delete Post?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/Forums/DeleteForumPost',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(postId),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        // Post will be removed via SignalR
                        Swal.fire('Deleted!', 'Post has been deleted.', 'success');
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to delete post', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while deleting the post', 'error');
                }
            });
        }
    });
}

// ==================== Forum Join Requests (Owner) ====================
function viewForumRequests(forumId, forumName) {
    $('#requestsForumId').val(forumId);
    $('#forumRequestsModal .modal-title').text(`Join Requests - ${forumName}`);
    $('#forumRequestsModal').modal('show');
    loadForumRequests(forumId);
}

function loadForumRequests(forumId) {
    $("#forumRequestsGrid").dxDataGrid({
        dataSource: {
            store: {
                type: 'array',
                key: 'id',
                data: []
            },
            load: function () {
                return $.ajax({
                    url: '/Forums/GetForumRequests',
                    type: 'GET',
                    data: { forumId: forumId },
                    dataType: 'json'
                }).then(function (response) {
                    var requests = response.data || [];

                    if (requests.length > 0) {
                        $('#forumRequestsEmpty').hide();
                    } else {
                        $('#forumRequestsEmpty').show();
                    }

                    return requests;
                });
            }
        },
        columns: [
            {
                caption: 'User',
                cellTemplate: function (container, options) {
                    var initials = getInitials(options.data.userName);
                    $('<div>').addClass('d-flex align-items-center').append(
                        $('<div>').addClass('message-avatar me-2').text(initials),
                        $('<div>').append(
                            $('<div>').addClass('fw-semibold').text(options.data.userName),
                            $('<small>').addClass('text-muted').text(options.data.email)
                        )
                    ).appendTo(container);
                }
            },
            {
                dataField: 'requestedAt',
                caption: 'Requested On',
                width: 150,
                dataType: 'string'
            },
            {
                caption: 'Actions',
                width: 200,
                cellTemplate: function (container, options) {
                    $('<div>').addClass('d-flex gap-2').append(
                        $('<button>').addClass('btn btn-sm btn-success')
                            .html('<i class="ti ti-check me-1"></i>Approve')
                            .on('click', function () {
                                approveForumRequest(options.data.id, forumId);
                            }),
                        $('<button>').addClass('btn btn-sm btn-danger')
                            .html('<i class="ti ti-x me-1"></i>Reject')
                            .on('click', function () {
                                rejectForumRequest(options.data.id, forumId);
                            })
                    ).appendTo(container);
                }
            }
        ],
        showBorders: true,
        showRowLines: true,
        rowAlternationEnabled: true,
        hoverStateEnabled: true,
        paging: {
            pageSize: 10
        }
    });
}

function approveForumRequest(requestId, forumId) {
    Swal.fire({
        title: 'Approve Request?',
        text: 'This user will be able to view and post in this forum.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/Forums/ApproveForumRequest',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(requestId),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        Swal.fire('Approved!', 'Request has been approved.', 'success');
                        loadForumRequests(forumId);
                        loadForums();
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to approve request', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred', 'error');
                }
            });
        }
    });
}

function rejectForumRequest(requestId, forumId) {
    Swal.fire({
        title: 'Reject Request?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reject'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/Forums/RejectForumRequest',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(requestId),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        Swal.fire('Rejected!', 'Request has been rejected.', 'success');
                        loadForumRequests(forumId);
                        loadForums();
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to reject request', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred', 'error');
                }
            });
        }
    });
}

// ==================== SignalR Event Handlers ====================
// These will be called from the main SignalR connection in footer_details.js

function handleForumCreated(data) {
    loadForums();
}

function handleForumUpdated(data) {
    loadForums();
}

function handleForumDeleted(forumId) {
    $(`#forum-${forumId}`).fadeOut(300, function () {
        $(this).remove();
        if ($('#forumsList .col-md-6').length === 0) {
            $('#forumsEmpty').show();
            $('#forumsList').hide();
        }
    });
}

function handleForumPostCreated(data) {
    var currentForumId = parseInt($('#currentForumId').val());
    if (data.forumId === currentForumId) {
        $('#forumPostsEmpty').hide();
        $('#forumPostsList').show();
        
        var postCard = createForumPostCard(data);
        $('#forumPostsList').prepend(postCard);
    }
}

function handleForumPostDeleted(postId) {
    $(`#forumPost-${postId}`).fadeOut(300, function () {
        $(this).remove();
        if ($('#forumPostsList .card').length === 0) {
            $('#forumPostsEmpty').show();
            $('#forumPostsList').hide();
        }
    });
}

function handleForumJoinRequestCreated(data) {
    if (isOwner) {
        loadForums();
    }
}

function handleForumRequestApproved(data) {
    loadForums();
}

function handleForumRequestRejected(data) {
    loadForums();
}
