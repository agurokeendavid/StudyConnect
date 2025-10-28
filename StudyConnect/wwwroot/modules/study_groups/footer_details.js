$(function () {
    // Initialize tabs
  initializeTabs();
    
    // Load initial data
    loadMembers();
    loadResources();
    loadForumMessages();
    loadMeetingLink();
    
    if (isOwner) {
        loadMembershipRequests();
    }

    // Event handlers
    $('#btnUploadResource').on('click', function () {
        $('#uploadResourceModal').modal('show');
    });

    $('#btnSubmitResource').on('click', uploadResource);
    $('#btnPostMessage').on('click', postForumMessage);
    $('#btnSaveMeetLink').on('click', saveMeetingLink);
    $('#btnJoinMeet').on('click', joinMeeting);
});

// Initialize Tabs
function initializeTabs() {
    var triggerTabList = [].slice.call(document.querySelectorAll('#studyGroupTabs button'))
    triggerTabList.forEach(function (triggerEl) {
   var tabTrigger = new bootstrap.Tab(triggerEl)
        triggerEl.addEventListener('click', function (event) {
     event.preventDefault()
     tabTrigger.show()
     })
    })
}

// Load Members with DevExtreme DataGrid
function loadMembers() {
    $("#membersGrid").dxDataGrid({
      dataSource: {
   store: {
         type: 'array',
 key: 'id',
                data: []
    },
            load: function() {
       return $.ajax({
       url: '/StudyGroups/GetMembers',
     type: 'GET',
            data: { studyGroupId: studyGroupId },
            dataType: 'json'
  }).then(function(response) {
             return response.data || [];
           });
          }
        },
        columns: [
            {
                caption: 'Member',
                cellTemplate: function(container, options) {
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
         width: 120,
            cellTemplate: function(container, options) {
         var badgeClass = 'bg-primary';
             if (options.value === 'Owner') badgeClass = 'bg-danger';
      else if (options.value === 'Admin') badgeClass = 'bg-warning';
             $('<span>').addClass('badge ' + badgeClass).text(options.value).appendTo(container);
 }
          },
       {
  dataField: 'joinedAt',
                caption: 'Joined',
             width: 150,
       dataType: 'string'
     },
         {
         dataField: 'isApproved',
       caption: 'Status',
           width: 100,
                cellTemplate: function(container, options) {
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
    // TODO: Implement API endpoint for resources
    // For now, show empty state
    $('#resourcesEmpty').show();
    $('#resourcesList').hide();
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
        success: function(response) {
            AmagiLoader.hide();
   if (response.IsSuccess) {
   Swal.fire('Success', 'Resource uploaded successfully', 'success');
     $('#uploadResourceModal').modal('hide');
      $('#uploadResourceForm')[0].reset();
                loadResources();
        } else {
           Swal.fire('Error', response.Message || 'Failed to upload resource', 'error');
       }
        },
    error: function() {
            AmagiLoader.hide();
      Swal.fire('Error', 'An error occurred while uploading', 'error');
        }
    });
}

// Load Forum Messages
function loadForumMessages() {
    // TODO: Implement API endpoint for forum messages
    // For now, show empty state
    $('#forumEmpty').show();
    $('#forumMessages').hide();
}

// Post Forum Message
function postForumMessage() {
    var message = $('#forumMessage').val().trim();
    
    if (!message) {
        Swal.fire('Error', 'Please enter a message', 'error');
        return;
    }

    AmagiLoader.show();

    $.ajax({
     url: '/StudyGroups/PostMessage',
        type: 'POST',
        data: {
            studyGroupId: studyGroupId,
    message: message
 },
      success: function(response) {
            AmagiLoader.hide();
  if (response.IsSuccess) {
                $('#forumMessage').val('');
 loadForumMessages();
            Swal.fire('Success', 'Message posted successfully', 'success');
    } else {
      Swal.fire('Error', response.Message || 'Failed to post message', 'error');
            }
        },
        error: function() {
AmagiLoader.hide();
  Swal.fire('Error', 'An error occurred while posting', 'error');
    }
    });
}

// Load Meeting Link
function loadMeetingLink() {
    $.ajax({
      url: '/StudyGroups/GetMeetingLink',
        type: 'GET',
        data: { studyGroupId: studyGroupId },
        success: function(response) {
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
        success: function(response) {
   AmagiLoader.hide();
    if (response.IsSuccess) {
      $('#btnJoinMeet').prop('disabled', false);
 Swal.fire('Success', 'Meeting link saved successfully', 'success');
            } else {
                Swal.fire('Error', response.Message || 'Failed to save meeting link', 'error');
            }
      },
        error: function() {
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
   load: function() {
           return $.ajax({
   url: '/StudyGroups/GetMembershipRequests',
            type: 'GET',
          data: { studyGroupId: studyGroupId },
   dataType: 'json'
      }).then(function(response) {
     var pendingRequests = (response.data || []).filter(function(item) {
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
           cellTemplate: function(container, options) {
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
     cellTemplate: function(container, options) {
$('<div>').addClass('d-flex gap-2').append(
             $('<button>').addClass('btn btn-sm btn-success')
          .html('<i class="ti ti-check me-1"></i>Approve')
     .on('click', function() {
     approveRequest(options.data.id);
      }),
               $('<button>').addClass('btn btn-sm btn-danger')
           .html('<i class="ti ti-x me-1"></i>Reject')
        .on('click', function() {
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
     success: function(response) {
     AmagiLoader.hide();
           if (response.IsSuccess) {
              Swal.fire('Approved!', 'Member request has been approved.', 'success');
  loadMembershipRequests();
    loadMembers();
      } else {
            Swal.fire('Error', response.Message || 'Failed to approve request', 'error');
         }
          },
   error: function() {
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
             success: function(response) {
  AmagiLoader.hide();
     if (response.IsSuccess) {
      Swal.fire('Rejected!', 'Member request has been rejected.', 'success');
    loadMembershipRequests();
  } else {
            Swal.fire('Error', response.Message || 'Failed to reject request', 'error');
         }
             },
        error: function() {
       AmagiLoader.hide();
    Swal.fire('Error', 'An error occurred', 'error');
        }
  });
     }
    });
}

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
        'pdf': 'ti-file-type-pdf',
        'doc': 'ti-file-type-doc',
        'docx': 'ti-file-type-doc',
  'xls': 'ti-file-type-xls',
      'xlsx': 'ti-file-type-xls',
        'ppt': 'ti-file-type-ppt',
        'pptx': 'ti-file-type-ppt',
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
