$(function () {
    // Initialize SignalR connection
    if (isMember) {
        initializeSignalR();
    }

    // Initialize tabs
    initializeTabs();

    // Load initial data
    loadMembers();
    loadResources();
    loadForumMessages();
    //loadMeetingLink();
    loadMeetings();

    if (isMember) {
        loadQuestions();
        loadUserScore();
        loadLeaderboard();
    }

    if (isOwner) {
        loadMembershipRequests();
        loadInviteLink();
    }

    // Event handlers
    $('#btnUploadResource').on('click', function () {
        $('#uploadResourceModal').modal('show');
    });

    $('#btnSubmitResource').on('click', uploadResource);
    $('#btnPostMessage').on('click', postForumMessage);
    $('#btnSaveMeetLink').on('click', saveMeetingLink);
    $('#btnJoinMeet').on('click', joinMeeting);
    
    // Invite link handlers
    $('#btnGenerateInvite').on('click', generateInviteLink);
    $('#btnCopyInvite').on('click', copyInviteLink);
    $('#btnRevokeInvite').on('click', revokeInviteLink);
    $('#btnShareInvite').on('click', shareInviteLink);
    
    // Meeting handlers
    $('#btnCreateMeeting').on('click', openCreateMeetingModal);
    $('#btnSubmitMeeting').on('click', submitMeeting);

    // Question handlers
    $('#btnCreateQuestion').on('click', openCreateQuestionModal);
    $('#btnSubmitQuestion').on('click', submitQuestion);
    $('#btnSubmitAnswer').on('click', submitAnswer);
    $('#questionType').on('change', handleQuestionTypeChange);
});

// Global SignalR connection variable
var connection = null;

// Initialize SignalR Connection
function initializeSignalR() {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("/studyGroupHub")
        .withAutomaticReconnect()
        .build();

    // Handle incoming messages
    connection.on("ReceiveMessage", function (messageData) {
        appendMessageToUI(messageData);
    });

    // Handle message deletion
    connection.on("MessageDeleted", function (messageId) {
        $(`#message-${messageId}`).fadeOut(300, function() {
            $(this).remove();
            checkForumEmpty();
        });
    });

    // Forum SignalR Events
    connection.on("ForumCreated", function (data) {
        if (typeof handleForumCreated === 'function') {
            handleForumCreated(data);
        }
    });

    connection.on("ForumUpdated", function (data) {
        if (typeof handleForumUpdated === 'function') {
            handleForumUpdated(data);
        }
    });

    connection.on("ForumDeleted", function (forumId) {
        if (typeof handleForumDeleted === 'function') {
            handleForumDeleted(forumId);
        }
    });

    connection.on("ForumPostCreated", function (data) {
        if (typeof handleForumPostCreated === 'function') {
            handleForumPostCreated(data);
        }
    });

    connection.on("ForumPostDeleted", function (postId) {
        if (typeof handleForumPostDeleted === 'function') {
            handleForumPostDeleted(postId);
        }
    });

    connection.on("ForumJoinRequestCreated", function (data) {
        if (typeof handleForumJoinRequestCreated === 'function') {
            handleForumJoinRequestCreated(data);
        }
    });

    connection.on("ForumRequestApproved", function (data) {
        if (typeof handleForumRequestApproved === 'function') {
            handleForumRequestApproved(data);
        }
    });

    connection.on("ForumRequestRejected", function (data) {
        if (typeof handleForumRequestRejected === 'function') {
            handleForumRequestRejected(data);
        }
    });

    // Start the connection
    connection.start()
        .then(function () {
            console.log("SignalR Connected");
            // Join the study group
            return connection.invoke("JoinStudyGroup", studyGroupId);
        })
        .then(function () {
            console.log("Joined study group: " + studyGroupId);
        })
        .catch(function (err) {
            console.error("SignalR Connection Error: ", err);
        });

    // Handle reconnection
    connection.onreconnected(function () {
        console.log("SignalR Reconnected");
        connection.invoke("JoinStudyGroup", studyGroupId)
            .catch(function (err) {
                console.error("Error rejoining group: ", err);
            });
    });

    // Handle disconnection
    connection.onclose(function () {
        console.log("SignalR Disconnected");
    });
}

// Initialize Tabs
function initializeTabs() {
    var triggerTabList = [].slice.call(document.querySelectorAll('#studyGroupTabs button'))
    triggerTabList.forEach(function (triggerEl) {
        var tabTrigger = new bootstrap.Tab(triggerEl)
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault()
            tabTrigger.show()
            
            // Load meeting statistics when meetings tab is activated
            if (triggerEl.id === 'meetings-tab' && isMember) {
                loadMeetingStatistics();
            }
        })
    })
}

// Load Members with DevExtreme DataGrid
function loadMembers() {
    $("#membersGrid").dxDataGrid({
        width: '100%',
        dataSource: {
            store: {
                type: 'array',
                key: 'id',
                data: []
            },
            load: function () {
                return $.ajax({
                    url: '/StudyGroups/GetMembers',
                    type: 'GET',
                    data: { studyGroupId: studyGroupId },
                    dataType: 'json'
                }).then(function (response) {
                    return response.data || [];
                });
            }
        },
        columns: [
            {
                caption: 'Member',
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
                dataField: 'role',
                caption: 'Role',
                cellTemplate: function (container, options) {
                    var badgeClass = 'bg-primary';
                    if (options.value === 'Owner') badgeClass = 'bg-danger';
                    else if (options.value === 'Admin') badgeClass = 'bg-warning';
                    $('<span>').addClass('badge ' + badgeClass).text(options.value).appendTo(container);
                }
            },
            {
                dataField: 'joinedAt',
                caption: 'Joined',
                dataType: 'string'
            },
            {
                dataField: 'isApproved',
                caption: 'Status',
                cellTemplate: function (container, options) {
                    var badgeClass = options.value ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning';
                    var text = options.value ? 'Approved' : 'Pending';
                    $('<span>').addClass('badge ' + badgeClass).text(text).appendTo(container);
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
            allowedPageSizes: [5, 10, 20],
            showInfo: true
        },
        searchPanel: {
            visible: true,
            width: '100%',
            placeholder: 'Search members...'
        },
        headerFilter: {
            visible: true
        },
        filterRow: {
            visible: false
        }
    });
}

// Load Resources
function loadResources() {
    $.ajax({
        url: '/StudyGroups/GetResources',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            if (response.data && response.data.length > 0) {
                renderResources(response.data);
                $('#resourcesEmpty').hide();
                $('#resourcesList').show();
            } else {
                $('#resourcesEmpty').show();
                $('#resourcesList').hide();
            }
        },
        error: function () {
            console.error('Error loading resources');
        }
    });
}

function renderResources(resources) {
    var container = $('#resourcesList');
    container.empty();

    resources.forEach(function (resource) {
        var card = createResourceCard(resource);
        container.append(card);
    });
}

function createResourceCard(resource) {
    var iconClass = getFileIcon(resource.fileName);
    var fileSize = formatFileSize(resource.fileSize);

    // Only show delete button if user is owner, admin, or uploader
    var deleteButton = '';
    if (isOwner || resource.uploadedByUserId === currentUserId) {
        deleteButton = `
     <button class="btn btn-sm btn-outline-danger" onclick="deleteResource(${resource.id})">
              <i class="ti ti-trash"></i>
        </button>
        `;
    }

    var card = `
   <div class="col-md-4 mb-3">
            <div class="card h-100 resource-card">
      <div class="card-body">
   <div class="d-flex align-items-start mb-3">
       <div class="resource-icon me-3">
   <i class="ti ${iconClass}"></i>
      </div>
  <div class="flex-grow-1">
          <h6 class="card-title mb-1">${escapeHtml(resource.title)}</h6>
     <small class="text-muted">${resource.fileName}</small>
            </div>
     </div>
     
           ${resource.description ? `<p class="card-text text-muted small mb-3">${escapeHtml(resource.description)}</p>` : ''}
             
       <div class="resource-meta mb-3">
      <div class="d-flex justify-content-between text-muted small">
     <span><i class="ti ti-file-size me-1"></i>${fileSize}</span>
             <span><i class="ti ti-download me-1"></i>${resource.downloadCount}</span>
      </div>
   <div class="text-muted small mt-1">
    <i class="ti ti-user me-1"></i>${escapeHtml(resource.uploadedByName)}
      </div>
        <div class="text-muted small">
            <i class="ti ti-clock me-1"></i>${resource.createdAt}
               </div>
   </div>
  
      <div class="d-flex gap-2">
<button class="btn btn-sm btn-primary flex-grow-1" onclick="${isMember ? `downloadResource(${resource.id});` : `void(0);`}">
    <i class="ti ti-download me-1"></i>Download
</button>
       ${deleteButton}
           </div>
            </div>
         </div>
        </div>
    `;

    return card;
}

// Upload Resource
function uploadResource() {
    var title = $('#resourceTitle').val();
    var description = $('#resourceDescription').val();
    var fileInput = $('#resourceFile')[0];

    if (!title || !fileInput.files[0]) {
        Swal.fire('Error', 'Please fill in all required fields', 'error');
        return;
    }

    var formData = new FormData();
    formData.append('studyGroupId', studyGroupId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', fileInput.files[0]);

    AmagiLoader.show();

    $.ajax({
        url: '/StudyGroups/UploadResource',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success') {
                Swal.fire('Success', 'Resource uploaded successfully', 'success');
                $('#uploadResourceModal').modal('hide');
                $('#uploadResourceForm')[0].reset();
                loadResources();
            } else {
                Swal.fire('Error', response.Message || 'Failed to upload resource', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while uploading', 'error');
        }
    });
}

function downloadResource(resourceId) {
    window.location.href = `/StudyGroups/DownloadResource?resourceId=${resourceId}`;
}

function deleteResource(resourceId) {
    Swal.fire({
        title: 'Delete Resource?',
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
                url: '/StudyGroups/DeleteResource',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(resourceId),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType) {
                        Swal.fire('Deleted!', 'Resource has been deleted.', 'success');
                        loadResources();
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to delete resource', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while deleting', 'error');
                }
            });
        }
    });
}

// Load Forum Messages
function loadForumMessages() {
    $.ajax({
  url: '/StudyGroups/GetMessages',
  type: 'GET',
        data: { studyGroupId: studyGroupId },
  success: function (response) {
     if (response.data && response.data.length > 0) {
                renderMessages(response.data);
           $('#forumEmpty').hide();
     $('#forumMessages').show();
            } else {
      $('#forumEmpty').show();
 $('#forumMessages').empty();
       }
        },
        error: function () {
        console.error('Error loading messages');
  $('#forumEmpty').show();
   }
    });
}

function renderMessages(messages) {
    var container = $('#forumMessages');
    container.empty();

    messages.forEach(function (msg) {
        appendMessageToUI(msg);
    });

    // Scroll to bottom
    scrollToBottomOfMessages();
}

function appendMessageToUI(messageData) {
    var container = $('#forumMessages');
    
    // Hide empty state
    $('#forumEmpty').hide();
    container.show();
    
    // Check if message already exists (prevent duplicates)
    if ($(`#message-${messageData.id}`).length > 0) {
        return;
    }

    var initials = getInitials(messageData.userName);
  var isCurrentUserMessage = messageData.userId === currentUserId;
    
    var messageHtml = `
  <div class="card mb-3" id="message-${messageData.id}">
            <div class="card-body">
   <div class="d-flex align-items-start">
          <div class="message-avatar me-3">${initials}</div>
  <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start mb-2">
                   <div>
              <h6 class="mb-0 fw-semibold">${escapeHtml(messageData.userName)}</h6>
           <small class="text-muted">${messageData.postedAt}</small>
     </div>
    ${isCurrentUserMessage || isOwner ? `
           <button class="btn btn-sm btn-outline-danger" onclick="deleteMessage(${messageData.id})">
         <i class="ti ti-trash"></i>
   </button>
    ` : ''}
     </div>
            <p class="mb-0">${escapeHtml(messageData.message)}</p>
          </div>
        </div>
     </div>
        </div>
    `;
    
    container.append(messageHtml);
    
    // Scroll to bottom when new message arrives
    scrollToBottomOfMessages();
}

function scrollToBottomOfMessages() {
    var container = $('#forumMessages');
    if (container.length) {
        container.animate({ scrollTop: container.prop('scrollHeight') }, 300);
    }
}

function checkForumEmpty() {
    if ($('#forumMessages .card').length === 0) {
        $('#forumEmpty').show();
        $('#forumMessages').hide();
    }
}

// Post Forum Message
function postForumMessage() {
    var message = $('#forumMessage').val().trim();

    if (!message) {
        Swal.fire('Error', 'Please enter a message', 'error');
        return;
    }

    if (message.length > 5000) {
        Swal.fire('Error', 'Message is too long. Maximum 5000 characters.', 'error');
        return;
    }

    AmagiLoader.show();

    $.ajax({
    url: '/StudyGroups/PostMessage',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
     studyGroupId: studyGroupId,
message: message
  }),
        success: function (response) {
  AmagiLoader.hide();
            if (response.MessageType === 'Success') {
   $('#forumMessage').val('');
  // Message will be added via SignalR
            } else {
            Swal.fire('Error', response.Message || 'Failed to post message', 'error');
       }
  },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while posting', 'error');
     }
  });
}

function deleteMessage(messageId) {
    Swal.fire({
     title: 'Delete Message?',
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
    url: '/StudyGroups/DeleteMessage',
  type: 'POST',
     contentType: 'application/json',
      data: JSON.stringify(messageId),
                success: function (response) {
      AmagiLoader.hide();
 if (response.MessageType === 'Success') {
          // Message will be removed via SignalR
         Swal.fire('Deleted!', 'Message has been deleted.', 'success');
              } else {
   Swal.fire('Error', response.Message || 'Failed to delete message', 'error');
   }
       },
 error: function () {
    AmagiLoader.hide();
      Swal.fire('Error', 'An error occurred while deleting', 'error');
   }
        });
        }
    });
}

// Load Meeting Link
function loadMeetingLink() {
    $.ajax({
        url: '/StudyGroups/GetMeetingLink',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            if (response.IsSuccess && response.Data) {
                $('#meetLink').val(response.Data);
                $('#btnJoinMeet').prop('disabled', false);
            }
        }
    });
}

// Save Meeting Link
function saveMeetingLink() {
    var meetLink = $('#meetLink').val().trim();

    if (!meetLink) {
        Swal.fire('Error', 'Please enter a Google Meet link', 'error');
        return;
    }

    // Validate Google Meet URL
    if (!meetLink.includes('meet.google.com')) {
        Swal.fire('Error', 'Please enter a valid Google Meet link', 'error');
        return;
    }

    AmagiLoader.show();

    $.ajax({
        url: '/StudyGroups/SaveMeetingLink',
        type: 'POST',
        data: {
            studyGroupId: studyGroupId,
            meetingLink: meetLink
        },
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success') {
                $('#btnJoinMeet').prop('disabled', false);
                Swal.fire('Success', 'Meeting link saved successfully', 'success');
            } else {
                Swal.fire('Error', response.Message || 'Failed to save meeting link', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while saving', 'error');
        }
    });
}

// Join Meeting
function joinMeeting() {
    var meetLink = $('#meetLink').val().trim();
    if (meetLink) {
        window.open(meetLink, '_blank');
    }
}

// Load Membership Requests (Owner Only)
function loadMembershipRequests() {
    $("#requestsGrid").dxDataGrid({
        dataSource: {
            store: {
                type: 'array',
                key: 'id',
                data: []
            },
            load: function () {
                return $.ajax({
                    url: '/StudyGroups/GetMembershipRequests',
                    type: 'GET',
                    data: { studyGroupId: studyGroupId },
                    dataType: 'json'
                }).then(function (response) {
                    var pendingRequests = (response.data || []).filter(function (item) {
                        return !item.isApproved;
                    });

                    // Update badge count
                    if (pendingRequests.length > 0) {
                        $('#requestCount').text(pendingRequests.length).show();
                        $('#requestsEmpty').hide();
                    } else {
                        $('#requestCount').hide();
                        $('#requestsEmpty').show();
                    }

                    return pendingRequests;
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
                dataField: 'joinedAt',
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
                                approveRequest(options.data.id);
                            }),
                        $('<button>').addClass('btn btn-sm btn-danger')
                            .html('<i class="ti ti-x me-1"></i>Reject')
                            .on('click', function () {
                                rejectRequest(options.data.id);
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

// Approve Membership Request
function approveRequest(memberId) {
    Swal.fire({
        title: 'Approve Request?',
        text: 'This user will become a member of the study group.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/StudyGroups/ApproveRequest',
                type: 'POST',
                data: { memberId: memberId },
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === "Success") {
                        Swal.fire('Approved!', 'Member request has been approved.', 'success');
                        loadMembershipRequests();
                        loadMembers();
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

// Reject Membership Request
function rejectRequest(memberId) {
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
                url: '/StudyGroups/RejectRequest',
                type: 'POST',
                data: { memberId: memberId },
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === "Success") {
                        Swal.fire('Rejected!', 'Member request has been rejected.', 'success');
                        loadMembershipRequests();
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

// Load Invite Link (Owner Only)
function loadInviteLink() {
    $.ajax({
        url: '/StudyGroups/GetInviteLink',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            if (response.IsSuccess && response.Data) {
                displayInviteLink(response.Data);
            } else {
                $('#noInviteLink').show();
                $('#activeInviteLink').hide();
            }
        },
        error: function () {
            console.error('Error loading invite link');
            $('#noInviteLink').show();
            $('#activeInviteLink').hide();
        }
    });
}

function displayInviteLink(data) {
    $('#inviteLinkInput').val(data.inviteUrl);
    
    if (data.expiresAt) {
        $('#expiryDate').text(data.expiresAt);
        $('#inviteExpiry').show();
        
        if (data.isExpired) {
            $('#inviteExpiry').removeClass('alert-info').addClass('alert-danger');
            $('#expiryDate').parent().html('<i class="ti ti-alert-circle me-1"></i>Expired on: ' + data.expiresAt);
        }
    } else {
        $('#inviteExpiry').hide();
    }
    
    $('#noInviteLink').hide();
    $('#activeInviteLink').show();
}

// Generate Invite Link
function generateInviteLink() {
    var expirationDays = $('#inviteExpiration').val();
    var data = {
        studyGroupId: studyGroupId
    };
    
    if (expirationDays) {
        data.expirationDays = parseInt(expirationDays);
    }
    
    Swal.fire({
        title: 'Generate Invite Link?',
        text: expirationDays ? `This link will expire in ${expirationDays} day(s).` : 'This link will never expire.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#5D87FF',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Generate'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();
            
            $.ajax({
                url: '/StudyGroups/GenerateInviteLink',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        Swal.fire('Success!', 'Invite link generated successfully', 'success');
                        displayInviteLink(response.Data);
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to generate invite link', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while generating the link', 'error');
                }
            });
        }
    });
}

function copyInviteLink() {
    var inviteLink = $('#inviteLinkInput').val();
    
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(inviteLink).then(function() {
            Swal.fire({
                title: 'Copied!',
                text: 'Invite link copied to clipboard',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            fallbackCopyToClipboard(inviteLink);
        });
    } else {
        fallbackCopyToClipboard(inviteLink);
    }
}

function fallbackCopyToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        var successful = document.execCommand('copy');
        if (successful) {
            Swal.fire({
                title: 'Copied!',
                text: 'Invite link copied to clipboard',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire('Error', 'Failed to copy link', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Failed to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

function revokeInviteLink() {
    Swal.fire({
        title: 'Revoke Invite Link?',
        text: 'The current invite link will no longer work. This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, revoke it!'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();
            
            $.ajax({
                url: '/StudyGroups/RevokeInviteLink',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(studyGroupId),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        Swal.fire('Revoked!', 'Invite link has been revoked.', 'success');
                        $('#noInviteLink').show();
                        $('#activeInviteLink').hide();
                        $('#inviteExpiration').val('');
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to revoke invite link', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while revoking the link', 'error');
                }
            });
        }
    });
}

function shareInviteLink() {
    var inviteLink = $('#inviteLinkInput').val();
    
    // Check if Web Share API is supported
    if (navigator.share) {
        navigator.share({
            title: 'Join our Study Group',
            text: 'You\'re invited to join our study group on StudyConnect!',
            url: inviteLink
        }).then(() => {
            console.log('Shared successfully');
        }).catch((error) => {
            console.log('Error sharing:', error);
            // Fallback to copy
            copyInviteLink();
        });
    } else {
        // Fallback to copy for browsers that don't support Web Share API
        copyInviteLink();
    }
}

// Load Meetings
function loadMeetings() {
    $.ajax({
        url: '/StudyGroups/GetMeetings',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            if (response.data && response.data.length > 0) {
                renderMeetings(response.data);
                $('#meetingsEmpty').hide();
                $('#meetingSchedule').show();
            } else {
                $('#meetingsEmpty').show();
                $('#meetingSchedule').empty();
            }
        },
        error: function () {
            console.error('Error loading meetings');
            $('#meetingsEmpty').show();
        }
    });
}

function renderMeetings(meetings) {
    var container = $('#meetingSchedule');
    container.empty();

    // Group meetings by status
    var upcomingMeetings = meetings.filter(m => m.isUpcoming);
    var ongoingMeetings = meetings.filter(m => m.isOngoing);
    var pastMeetings = meetings.filter(m => m.isPast);

    // Render ongoing meetings first
    if (ongoingMeetings.length > 0) {
        container.append('<h6 class="text-success mb-3"><i class="ti ti-live-view me-2"></i>Ongoing</h6>');
        ongoingMeetings.forEach(function (meeting) {
            container.append(createMeetingCard(meeting, 'ongoing'));
        });
    }

    // Render upcoming meetings
    if (upcomingMeetings.length > 0) {
        container.append('<h6 class="text-primary mb-3 mt-4"><i class="ti ti-clock me-2"></i>Upcoming</h6>');
        upcomingMeetings.forEach(function (meeting) {
            container.append(createMeetingCard(meeting, 'upcoming'));
        });
    }

    // Render past meetings
    if (pastMeetings.length > 0) {
        container.append('<h6 class="text-muted mb-3 mt-4"><i class="ti ti-history me-2"></i>Past</h6>');
        pastMeetings.forEach(function (meeting) {
            container.append(createMeetingCard(meeting, 'past'));
        });
    }
}

function createMeetingCard(meeting, status) {
    var statusBadge = '';
    var statusClass = '';
    var joinButton = '';

    // Override status with meeting's actual status if available
    if (meeting.meetingStatus) {
        switch (meeting.meetingStatus) {
            case 'Completed':
                statusBadge = '<span class="badge bg-success-subtle text-success"><i class="ti ti-check me-1"></i>Completed</span>';
                statusClass = 'border-success';
                status = 'past';
                break;
            case 'Cancelled':
                statusBadge = '<span class="badge bg-danger-subtle text-danger"><i class="ti ti-x me-1"></i>Cancelled</span>';
                statusClass = 'border-danger';
                status = 'past';
                break;
            case 'Postponed':
                statusBadge = '<span class="badge bg-warning-subtle text-warning"><i class="ti ti-ban me-1"></i>Postponed</span>';
                statusClass = 'border-warning';
                break;
            case 'NoShow':
                statusBadge = '<span class="badge bg-secondary-subtle text-secondary"><i class="ti ti-user-off me-1"></i>No Show</span>';
                statusClass = 'border-secondary';
                status = 'past';
                break;
            case 'Ongoing':
                statusBadge = '<span class="badge bg-info-subtle text-info"><i class="ti ti-live-view me-1"></i>Ongoing</span>';
                statusClass = 'border-info';
                break;
        }
    } else {
        // Default status badges
        if (status === 'ongoing') {
            statusBadge = '<span class="badge bg-success-subtle text-success"><i class="ti ti-live-view me-1"></i>Live Now</span>';
            statusClass = 'border-success';
        } else if (status === 'upcoming') {
            statusBadge = '<span class="badge bg-primary-subtle text-primary"><i class="ti ti-clock me-1"></i>Upcoming</span>';
            statusClass = 'border-primary';
        } else {
            statusBadge = '<span class="badge bg-secondary-subtle text-secondary"><i class="ti ti-check me-1"></i>Completed</span>';
            statusClass = '';
        }
    }

    // Join button logic
    if (status === 'ongoing' && meeting.meetingStatus !== 'Cancelled' && meeting.meetingStatus !== 'NoShow') {
        joinButton = `
            <a href="${escapeHtml(meeting.meetingLink)}" target="_blank" class="btn btn-success btn-sm">
                <i class="ti ti-video me-1"></i>Join Now
            </a>
        `;
    } else if (status === 'upcoming' && meeting.meetingStatus !== 'Cancelled') {
        joinButton = `
            <a href="${escapeHtml(meeting.meetingLink)}" target="_blank" class="btn btn-outline-primary btn-sm">
                <i class="ti ti-video me-1"></i>View Link
            </a>
        `;
    } else {
        joinButton = `
            <button class="btn btn-outline-secondary btn-sm" disabled>
                <i class="ti ti-video-off me-1"></i>Ended
            </button>
        `;
    }

    var actionButtons = '';
    if (isOwner && status !== 'past' && meeting.meetingStatus !== 'Cancelled') {
        actionButtons = `
            <div class="btn-group btn-group-sm ms-2">
                <button type="button" class="btn btn-outline-primary" onclick="editMeeting(${meeting.id})" title="Edit Meeting">
                    <i class="ti ti-edit"></i>
                </button>
                <button type="button" class="btn btn-outline-warning" onclick="postponeMeeting(${meeting.id})" title="Postpone Meeting">
                    <i class="ti ti-ban"></i>
                </button>
                <button type="button" class="btn btn-outline-danger" onclick="cancelMeeting(${meeting.id})" title="Cancel Meeting">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `;
    }

    // Status management button (for owner/admin)
    var statusButton = '';
    if (isOwner || isMember) {
        if (status === 'past' && meeting.meetingStatus !== 'Cancelled' && meeting.meetingStatus !== 'NoShow' && meeting.meetingStatus !== 'Completed') {
            statusButton = `
                <button type="button" class="btn btn-outline-info btn-sm ms-2" onclick="recordMeetingStatus(${meeting.id}, 'Completed')" title="Record Status">
                    <i class="ti ti-file-text me-1"></i>Mark Complete
                </button>
            `;
        }
    }

    var recurringBadge = meeting.isRecurring
        ? `<span class="badge bg-info-subtle text-info ms-2"><i class="ti ti-repeat me-1"></i>${meeting.recurrencePattern}</span>`
        : '';

    var postponedBadge = meeting.isPostponed
        ? `<span class="badge bg-warning-subtle text-warning ms-2"><i class="ti ti-alert-triangle me-1"></i>Rescheduled</span>`
        : '';

    var participantsBadge = meeting.maxParticipants
        ? `<span class="text-muted small ms-3"><i class="ti ti-users me-1"></i>Max: ${meeting.maxParticipants}</span>`
        : '';

    var attendanceBadge = meeting.attendanceCount > 0
        ? `<span class="text-muted small ms-3"><i class="ti ti-users-group me-1"></i>Attended: ${meeting.attendanceCount}</span>`
        : '';

    var postponementInfo = '';
    if (meeting.isPostponed && meeting.postponementReason) {
        postponementInfo = `
            <div class="alert alert-warning alert-dismissible fade show mt-2 mb-0" role="alert">
                <small>
                    <i class="ti ti-info-circle me-1"></i>
                    <strong>Postponed:</strong> ${escapeHtml(meeting.postponementReason)}
                </small>
            </div>
        `;
    }

    var noShowInfo = '';
    if (meeting.noShowRecorded && meeting.noShowNotes) {
        noShowInfo = `
            <div class="alert alert-secondary alert-dismissible fade show mt-2 mb-0" role="alert">
                <small>
                    <i class="ti ti-alert-circle me-1"></i>
                    <strong>No Show:</strong> ${escapeHtml(meeting.noShowNotes)}
                </small>
            </div>
        `;
    }

    var meetingNotesInfo = '';
    if (meeting.meetingNotes) {
        meetingNotesInfo = `
            <div class="alert alert-info alert-dismissible fade show mt-2 mb-0" role="alert">
                <small>
                    <i class="ti ti-note me-1"></i>
                    <strong>Notes:</strong> ${escapeHtml(meeting.meetingNotes)}
                </small>
            </div>
        `;
    }

    var card = `
        <div class="card mb-3 ${statusClass}" id="meeting-${meeting.id}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <h6 class="mb-0 fw-semibold">${escapeHtml(meeting.title)}</h6>
                            ${statusBadge}
                            ${recurringBadge}
                            ${postponedBadge}
                        </div>
                        ${meeting.description ? `<p class="text-muted small mb-2">${escapeHtml(meeting.description)}</p>` : ''}
                        <div class="d-flex flex-wrap gap-3 text-muted small">
                            <span><i class="ti ti-calendar me-1"></i>${meeting.startTimeFormatted}</span>
                            <span><i class="ti ti-clock-hour-4 me-1"></i>${meeting.endTimeFormatted}</span>
                            <span><i class="ti ti-user me-1"></i>Created by ${escapeHtml(meeting.createdByName)}</span>
                            ${participantsBadge}
                            ${attendanceBadge}
                        </div>
                        ${postponementInfo}
                        ${noShowInfo}
                        ${meetingNotesInfo}
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between mt-3">
                    <div>
                        ${joinButton}
                        ${statusButton}
                        ${actionButtons}
                    </div>
                </div>
            </div>
        </div>
    `;

    return card;
}

// Open Create Meeting Modal
function openCreateMeetingModal() {
    $('#meetingId').val('');
    $('#meetingForm')[0].reset();
    $('#meetingModalTitle').text('Schedule New Meeting');
    $('#btnSubmitMeeting').html('<i class="ti ti-device-floppy me-1"></i>Save Meeting');

    // Set minimum datetime to now
    var now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('#meetingStartTime').attr('min', now.toISOString().slice(0, 16));

    $('#meetingModal').modal('show');
}

// Edit Meeting
function editMeeting(meetingId) {
    // Get meeting data
    $.ajax({
        url: '/StudyGroups/GetMeetings',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            var meeting = response.data.find(m => m.id === meetingId);
            if (meeting) {
                populateMeetingForm(meeting);
                $('#meetingModal').modal('show');
            }
        },
        error: function () {
            Swal.fire('Error', 'Failed to load meeting details', 'error');
        }
    });
}

function populateMeetingForm(meeting) {
    $('#meetingId').val(meeting.id);
    $('#meetingTitle').val(meeting.title);
    $('#meetingDescription').val(meeting.description || '');
    $('#meetingLink').val(meeting.meetingLink);

    // Convert datetime to local datetime-local format
    var startDate = new Date(meeting.scheduledStartTime);
    var endDate = new Date(meeting.scheduledEndTime);

    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    var startLocal = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000));
    var endLocal = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000));

    $('#meetingStartTime').val(startLocal.toISOString().slice(0, 16));
    $('#meetingEndTime').val(endLocal.toISOString().slice(0, 16));
    $('#meetingMaxParticipants').val(meeting.maxParticipants || '');
    $('#reminderTime').val(meeting.reminderTimeInHours || 1);

    $('#meetingModalTitle').text('Edit Meeting');
    $('#btnSubmitMeeting').html('<i class="ti ti-device-floppy me-1"></i>Update Meeting');
}

// Submit Meeting (Create or Update)
function submitMeeting() {
    var meetingId = $('#meetingId').val();
    var title = $('#meetingTitle').val().trim();
    var description = $('#meetingDescription').val().trim();
    var meetingLink = $('#meetingLink').val().trim();
    var startTime = $('#meetingStartTime').val();
    var endTime = $('#meetingEndTime').val();
    var maxParticipants = $('#meetingMaxParticipants').val();
    var reminderTime = $('#reminderTime').val();

    // Validation
    if (!title) {
        Swal.fire('Error', 'Please enter a meeting title', 'error');
        return;
    }

    if (!meetingLink) {
        Swal.fire('Error', 'Please enter a Google Meet link', 'error');
        return;
    }

    if (!meetingLink.includes('meet.google.com')) {
        Swal.fire('Error', 'Please enter a valid Google Meet link', 'error');
        return;
    }

    if (!startTime || !endTime) {
        Swal.fire('Error', 'Please select start and end times', 'error');
        return;
    }

    // Create Date objects from datetime-local input values
    // The datetime-local value is in format: YYYY-MM-DDTHH:mm
    var startDate = new Date(startTime);
    var endDate = new Date(endTime);

    if (endDate <= startDate) {
        Swal.fire('Error', 'End time must be after start time', 'error');
        return;
    }

    if (startDate < new Date() && !meetingId) {
        Swal.fire('Error', 'Start time cannot be in the past', 'error');
        return;
    }

    // Format dates as ISO strings for sending to server
    // The server will receive these in the user's local timezone
    var data = {
        studyGroupId: studyGroupId,
        title: title,
        description: description,
        meetingLink: meetingLink,
        scheduledStartTime: startDate.toISOString(),
        scheduledEndTime: endDate.toISOString(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        reminderTimeInHours: reminderTime ? parseInt(reminderTime) : 1
    };

    var url = '/StudyGroups/CreateMeeting';
    var successMessage = 'Meeting scheduled successfully!';

    if (meetingId) {
        url = '/StudyGroups/UpdateMeeting';
        data.meetingId = parseInt(meetingId);
        successMessage = 'Meeting updated successfully!';
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
                $('#meetingModal').modal('hide');
                loadMeetings();
            } else {
                Swal.fire('Error', response.Message || 'Failed to save meeting', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while saving the meeting', 'error');
        }
    });
}

// Delete Meeting
function deleteMeeting(meetingId) {
    Swal.fire({
        title: 'Delete Meeting?',
        text: 'This action cannot be undone. All participants will lose access to this meeting link.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/StudyGroups/DeleteMeeting',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(meetingId),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        Swal.fire('Deleted!', 'Meeting has been deleted.', 'success');
                        $(`#meeting-${meetingId}`).fadeOut(300, function () {
                            $(this).remove();
                            // Check if there are no more meetings
                            if ($('#meetingSchedule .card').length === 0) {
                                $('#meetingsEmpty').show();
                                $('#meetingSchedule').hide();
                            }
                        });
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to delete meeting', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while deleting the meeting', 'error');
                }
            });
        }
    });
}

// Cancel Meeting
function cancelMeeting(meetingId) {
    Swal.fire({
        title: 'Cancel Meeting?',
        text: 'Please provide a reason for cancellation:',
        input: 'textarea',
        inputPlaceholder: 'Reason for cancellation...',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Cancel Meeting',
        cancelButtonText: 'Close',
        inputValidator: (value) => {
            if (!value) {
                return 'Please provide a reason for cancellation';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/StudyGroups/CancelMeeting',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    meetingId: meetingId,
                    cancellationReason: result.value
                }),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === 'Success') {
                        Swal.fire('Cancelled!', 'Meeting has been cancelled.', 'success');
                        loadMeetings();
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to cancel meeting', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while cancelling the meeting', 'error');
                }
            });
        }
    });
}

// Postpone Meeting
function postponeMeeting(meetingId) {
    // Get meeting data first
    $.ajax({
        url: '/StudyGroups/GetMeetings',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            var meeting = response.data.find(m => m.id === meetingId);
            if (meeting) {
                showPostponeMeetingModal(meeting);
            }
        },
        error: function () {
            Swal.fire('Error', 'Failed to load meeting details', 'error');
        }
    });
}

function showPostponeMeetingModal(meeting) {
    Swal.fire({
        title: 'Postpone Meeting',
        html: `
            <div class="text-start">
                <p class="mb-3"><strong>Current meeting:</strong> ${escapeHtml(meeting.title)}</p>
                <p class="mb-3"><strong>Scheduled for:</strong> ${meeting.startTimeFormatted}</p>
                <div class="mb-3">
                    <label class="form-label">New Start Date & Time</label>
                    <input type="datetime-local" id="postponeStartTime" class="form-control">
                </div>
                <div class="mb-3">
                    <label class="form-label">New End Date & Time</label>
                    <input type="datetime-local" id="postponeEndTime" class="form-control">
                </div>
                <div class="mb-3">
                    <label class="form-label">Reason for Postponement</label>
                    <textarea id="postponeReason" class="form-control" rows="3" placeholder="Explain why the meeting is being postponed..."></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Postpone Meeting',
        confirmButtonColor: '#FFA500',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
            const newStartTime = document.getElementById('postponeStartTime').value;
            const newEndTime = document.getElementById('postponeEndTime').value;
            const reason = document.getElementById('postponeReason').value.trim();

            if (!newStartTime || !newEndTime) {
                Swal.showValidationMessage('Please select new start and end times');
                return false;
            }

            const startDate = new Date(newStartTime);
            const endDate = new Date(newEndTime);

            if (endDate <= startDate) {
                Swal.showValidationMessage('End time must be after start time');
                return false;
            }

            if (startDate < new Date()) {
                Swal.showValidationMessage('New start time cannot be in the past');
                return false;
            }

            return {
                meetingId: meeting.id,
                newStartTime: startDate.toISOString(),
                newEndTime: endDate.toISOString(),
                postponementReason: reason
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            submitPostponeMeeting(result.value);
        }
    });

    // Set minimum datetime to now
    setTimeout(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('postponeStartTime').min = now.toISOString().slice(0, 16);
    }, 100);
}

function submitPostponeMeeting(data) {
    AmagiLoader.show();

    $.ajax({
        url: '/StudyGroups/PostponeMeeting',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success') {
                Swal.fire('Success', 'Meeting postponed successfully. Members will be notified.', 'success');
                loadMeetings();
            } else {
                Swal.fire('Error', response.Message || 'Failed to postpone meeting', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while postponing the meeting', 'error');
        }
    });
}

// Record Meeting Status
function recordMeetingStatus(meetingId, suggestedStatus = null) {
    // Get meeting data first
    $.ajax({
        url: '/StudyGroups/GetMeetings',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            var meeting = response.data.find(m => m.id === meetingId);
            if (meeting) {
                showRecordStatusModal(meeting, suggestedStatus);
            }
        },
        error: function () {
            Swal.fire('Error', 'Failed to load meeting details', 'error');
        }
    });
}

function showRecordStatusModal(meeting, suggestedStatus) {
    const statusOptions = [
        { value: 'Scheduled', label: 'Scheduled' },
        { value: 'Ongoing', label: 'Ongoing' },
        { value: 'Completed', label: 'Completed' },
        { value: 'NoShow', label: 'No One Showed Up' },
        { value: 'Cancelled', label: 'Cancelled' }
    ];

    const optionsHtml = statusOptions.map(opt => 
        `<option value="${opt.value}" ${opt.value === suggestedStatus ? 'selected' : ''}>${opt.label}</option>`
    ).join('');

    Swal.fire({
        title: 'Record Meeting Status',
        html: `
            <div class="text-start">
                <p class="mb-3"><strong>Meeting:</strong> ${escapeHtml(meeting.title)}</p>
                <p class="mb-3"><strong>Scheduled:</strong> ${meeting.startTimeFormatted}</p>
                
                <div class="mb-3">
                    <label class="form-label">Meeting Status <span class="text-danger">*</span></label>
                    <select id="recordStatus" class="form-select">
                        ${optionsHtml}
                    </select>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Actual Start Time</label>
                    <input type="datetime-local" id="actualStartTime" class="form-control">
                    <small class="text-muted">Leave empty if meeting didn't start</small>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Actual End Time</label>
                    <input type="datetime-local" id="actualEndTime" class="form-control">
                    <small class="text-muted">Leave empty if meeting didn't end</small>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Attendance Count</label>
                    <input type="number" id="attendanceCount" class="form-control" min="0" placeholder="Number of attendees">
                </div>
                
                <div class="mb-3" id="noShowNotesContainer" style="display: none;">
                    <label class="form-label">Notes (No Show)</label>
                    <textarea id="noShowNotes" class="form-control" rows="2" placeholder="Why did no one show up?"></textarea>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Meeting Notes</label>
                    <textarea id="meetingNotes" class="form-control" rows="3" placeholder="What happened during the meeting? Key discussion points?"></textarea>
                </div>
            </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Save Status',
        confirmButtonColor: '#5D87FF',
        cancelButtonText: 'Cancel',
        didOpen: () => {
            // Show/hide no show notes based on status
            document.getElementById('recordStatus').addEventListener('change', function() {
                const noShowContainer = document.getElementById('noShowNotesContainer');
                if (this.value === 'NoShow') {
                    noShowContainer.style.display = 'block';
                } else {
                    noShowContainer.style.display = 'none';
                }
            });

            // Trigger initial state
            document.getElementById('recordStatus').dispatchEvent(new Event('change'));
        },
        preConfirm: () => {
            const status = document.getElementById('recordStatus').value;
            const actualStartTime = document.getElementById('actualStartTime').value;
            const actualEndTime = document.getElementById('actualEndTime').value;
            const attendanceCount = document.getElementById('attendanceCount').value;
            const noShowNotes = document.getElementById('noShowNotes').value.trim();
            const meetingNotes = document.getElementById('meetingNotes').value.trim();

            if (!status) {
                Swal.showValidationMessage('Please select a meeting status');
                return false;
            }

            if (actualStartTime && actualEndTime) {
                const startDate = new Date(actualStartTime);
                const endDate = new Date(actualEndTime);
                if (endDate <= startDate) {
                    Swal.showValidationMessage('Actual end time must be after start time');
                    return false;
                }
            }

            return {
                meetingId: meeting.id,
                meetingStatus: status,
                actualStartTime: actualStartTime ? new Date(actualStartTime).toISOString() : null,
                actualEndTime: actualEndTime ? new Date(actualEndTime).toISOString() : null,
                attendanceCount: attendanceCount ? parseInt(attendanceCount) : null,
                noShowNotes: noShowNotes,
                meetingNotes: meetingNotes
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            submitMeetingStatus(result.value);
        }
    });
}

function submitMeetingStatus(data) {
    AmagiLoader.show();

    $.ajax({
        url: '/StudyGroups/RecordMeetingStatus',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success') {
                Swal.fire('Success', 'Meeting status recorded successfully.', 'success');
                loadMeetings();
            } else {
                Swal.fire('Error', response.Message || 'Failed to record meeting status', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while recording meeting status', 'error');
        }
    });
}

// Load Meeting Statistics
function loadMeetingStatistics() {
    $.ajax({
        url: '/StudyGroups/GetMeetingStatistics',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
            if (response.MessageType === 'Success' && response.Data) {
                renderMeetingStatistics(response.Data);
            }
        },
        error: function () {
            console.error('Error loading meeting statistics');
        }
    });
}

function renderMeetingStatistics(stats) {
    const statsHtml = `
        <div class="row g-3">
            <div class="col-md-4">
                <div class="card border-0 bg-primary-subtle">
                    <div class="card-body text-center">
                        <i class="ti ti-calendar-event text-primary" style="font-size: 32px;"></i>
                        <h4 class="fw-bold mt-2 mb-0">${stats.totalMeetings}</h4>
                        <p class="text-muted mb-0 small">Total Meetings</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 bg-success-subtle">
                    <div class="card-body text-center">
                        <i class="ti ti-check text-success" style="font-size: 32px;"></i>
                        <h4 class="fw-bold mt-2 mb-0">${stats.completedMeetings}</h4>
                        <p class="text-muted mb-0 small">Completed</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 bg-warning-subtle">
                    <div class="card-body text-center">
                        <i class="ti ti-ban text-warning" style="font-size: 32px;"></i>
                        <h4 class="fw-bold mt-2 mb-0">${stats.postponedMeetings}</h4>
                        <p class="text-muted mb-0 small">Postponed</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 bg-danger-subtle">
                    <div class="card-body text-center">
                        <i class="ti ti-x text-danger" style="font-size: 32px;"></i>
                        <h4 class="fw-bold mt-2 mb-0">${stats.cancelledMeetings}</h4>
                        <p class="text-muted mb-0 small">Cancelled</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 bg-secondary-subtle">
                    <div class="card-body text-center">
                        <i class="ti ti-user-off text-secondary" style="font-size: 32px;"></i>
                        <h4 class="fw-bold mt-2 mb-0">${stats.noShowMeetings}</h4>
                        <p class="text-muted mb-0 small">No Shows</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 bg-info-subtle">
                    <div class="card-body text-center">
                        <i class="ti ti-users text-info" style="font-size: 32px;"></i>
                        <h4 class="fw-bold mt-2 mb-0">${stats.averageAttendance.toFixed(1)}</h4>
                        <p class="text-muted mb-0 small">Avg Attendance</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('#meetingStatistics').html(statsHtml);
}

// Auto-refresh meetings every 5 minutes
setInterval(function () {
    if (isMember && $('#meetings-tab').hasClass('active')) {
        loadMeetings();
    }
}, 300000); // 5 minutes

// Helper Functions
function getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.charAt(0) + (name.charAt(1) || '');
}

function getFileIcon(fileName) {
    var ext = fileName.split('.').pop().toLowerCase();
    var iconMap = {
        'pdf': 'ti-file',
        'doc': 'ti-file',
        'docx': 'ti-file',
        'xls': 'ti-file',
        'xlsx': 'ti-file',
        'ppt': 'ti-file',
        'pptx': 'ti-file',
        'jpg': 'ti-photo',
        'jpeg': 'ti-photo',
        'png': 'ti-photo',
        'gif': 'ti-photo'
    };
    return iconMap[ext] || 'ti-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

// Invite Link Functions
function loadInviteLink() {
    $.ajax({
        url: '/StudyGroups/GetInviteLink',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function (response) {
       if (response.MessageType === "Success" && response.Data && response.Data.inviteUrl) {
    displayInviteLink(response.Data);
    } else {
           $('#noInviteLink').show();
                $('#activeInviteLink').hide();
            }
        },
        error: function () {
     console.error('Error loading invite link');
        $('#noInviteLink').show();
    $('#activeInviteLink').hide();
        }
    });
}

function displayInviteLink(data) {
    $('#inviteLinkInput').val(data.inviteUrl);
    
    if (data.expiresAt) {
        $('#expiryDate').text(data.expiresAt);
        $('#inviteExpiry').show();
        
if (data.isExpired) {
            $('#inviteExpiry').removeClass('alert-info').addClass('alert-danger');
            $('#expiryDate').parent().html('<i class="ti ti-alert-circle me-1"></i>Expired on: ' + data.expiresAt);
        }
    } else {
        $('#inviteExpiry').hide();
    }
    
    $('#noInviteLink').hide();
    $('#activeInviteLink').show();
}

function generateInviteLink() {
    var expirationDays = $('#inviteExpiration').val();
var data = {
    studyGroupId: studyGroupId
    };
    
    if (expirationDays) {
        data.expirationDays = parseInt(expirationDays);
    }
    
    Swal.fire({
        title: 'Generate Invite Link?',
        text: expirationDays ? `This link will expire in ${expirationDays} day(s).` : 'This link will never expire.',
        icon: 'question',
        showCancelButton: true,
     confirmButtonColor: '#5D87FF',
   cancelButtonColor: '#6c757d',
        confirmButtonText: 'Generate'
  }).then((result) => {
        if (result.isConfirmed) {
       AmagiLoader.show();
            
$.ajax({
    url: '/StudyGroups/GenerateInviteLink',
     type: 'POST',
     contentType: 'application/json',
     data: JSON.stringify(data),
         success: function (response) {
        AmagiLoader.hide();
        if (response.MessageType === 'Success') {
      Swal.fire('Success!', 'Invite link generated successfully', 'success');
      displayInviteLink(response.Data);
  } else {
            Swal.fire('Error', response.Message || 'Failed to generate invite link', 'error');
   }
  },
      error: function () {
            AmagiLoader.hide();
 Swal.fire('Error', 'An error occurred while generating the link', 'error');
         }
            });
        }
  });
}

function copyInviteLink() {
    var inviteLink = $('#inviteLinkInput').val();
    
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(inviteLink).then(function() {
    Swal.fire({
         title: 'Copied!',
  text: 'Invite link copied to clipboard',
        icon: 'success',
          timer: 2000,
     showConfirmButton: false
            });
        }).catch(function(err) {
     console.error('Failed to copy: ', err);
            fallbackCopyToClipboard(inviteLink);
        });
    } else {
        fallbackCopyToClipboard(inviteLink);
    }
}

function fallbackCopyToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        var successful = document.execCommand('copy');
        if (successful) {
    Swal.fire({
     title: 'Copied!',
 text: 'Invite link copied to clipboard',
       icon: 'success',
     timer: 2000,
    showConfirmButton: false
            });
        } else {
   Swal.fire('Error', 'Failed to copy link', 'error');
    }
    } catch (err) {
        Swal.fire('Error', 'Failed to copy link', 'error');
  }
    
    document.body.removeChild(textArea);
}

function revokeInviteLink() {
    Swal.fire({
        title: 'Revoke Invite Link?',
        text: 'The current invite link will no longer work. This action cannot be undone.',
    icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
  confirmButtonText: 'Yes, revoke it!'
    }).then((result) => {
        if (result.isConfirmed) {
   AmagiLoader.show();
            
            $.ajax({
         url: '/StudyGroups/RevokeInviteLink',
        type: 'POST',
       contentType: 'application/json',
  data: JSON.stringify(studyGroupId),
        success: function (response) {
            AmagiLoader.hide();
     if (response.MessageType === 'Success') {
       Swal.fire('Revoked!', 'Invite link has been revoked.', 'success');
       $('#noInviteLink').show();
   $('#activeInviteLink').hide();
           $('#inviteExpiration').val('');
       } else {
  Swal.fire('Error', response.Message || 'Failed to revoke invite link', 'error');
     }
   },
     error: function () {
           AmagiLoader.hide();
   Swal.fire('Error', 'An error occurred while revoking the link', 'error');
     }
      });
        }
    });
}

function shareInviteLink() {
    var inviteLink = $('#inviteLinkInput').val();
    
    // Check if Web Share API is supported
    if (navigator.share) {
        navigator.share({
        title: 'Join our Study Group',
  text: 'You\'re invited to join our study group on StudyConnect!',
      url: inviteLink
}).then(() => {
       console.log('Shared successfully');
        }).catch((error) => {
      console.log('Error sharing:', error);
      // Fallback to copy
copyInviteLink();
    });
    } else {
        // Fallback to copy for browsers that don't support Web Share API
        copyInviteLink();
    }
}
