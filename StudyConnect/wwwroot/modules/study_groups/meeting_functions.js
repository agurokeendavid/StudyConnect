// ============================================
// GOOGLE MEET MANAGEMENT FUNCTIONS
// Add these functions to your existing footer_details.js file
// ============================================

// Load initial meetings when page loads
// Add this line in your main $(function() { ... }) block:
// if (isMember) { loadMeetings(); }

// Create Meeting Button Handler
// Add this in your main $(function() { ... }) block:
// $('#btnCreateMeeting').on('click', openCreateMeetingModal);
// $('#btnSubmitMeeting').on('click', submitMeeting);

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
                statusBadge = '<span class="badge bg-warning-subtle text-warning"><i class="ti ti-calendar-pause me-1"></i>Postponed</span>';
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
            <button class="btn btn-success btn-sm" onclick="joinMeetingNow(${meeting.id}, '${escapeHtml(meeting.meetingLink)}', true)">
                <i class="ti ti-video me-1"></i>Join Now
            </button>
        `;
    } else if (status === 'upcoming' && meeting.meetingStatus !== 'Cancelled') {
        joinButton = `
            <button class="btn btn-outline-primary btn-sm" onclick="joinMeetingNow(${meeting.id}, '${escapeHtml(meeting.meetingLink)}', false)">
                <i class="ti ti-video me-1"></i>View Link
            </button>
        `;
    } else {
        joinButton = `
            <button class="btn btn-outline-secondary btn-sm" disabled>
                <i class="ti ti-video-off me-1"></i>Ended
            </button>
        `;
    }

    var actionButtons = '';
    if (isOwner && status !== 'past') {
        actionButtons = `
            <div class="btn-group btn-group-sm ms-2">
                <button type="button" class="btn btn-outline-primary" onclick="editMeeting(${meeting.id})" title="Edit Meeting">
                    <i class="ti ti-edit"></i>
                </button>
                <button type="button" class="btn btn-outline-warning" onclick="postponeMeeting(${meeting.id})" title="Postpone Meeting">
                    <i class="ti ti-calendar-pause"></i>
                </button>
                <button type="button" class="btn btn-outline-danger" onclick="deleteMeeting(${meeting.id})" title="Delete Meeting">
                    <i class="ti ti-trash"></i>
                </button>
            </div>
        `;
    }

    // Status management button (for owner/admin)
    var statusButton = '';
    if (isOwner || isMember) {
        const statusType = status === 'past' ? 'Completed' : status === 'ongoing' ? 'Ongoing' : null;
        if (statusType) {
            statusButton = `
                <button type="button" class="btn btn-outline-info btn-sm ms-2" onclick="recordMeetingStatus(${meeting.id}, '${statusType}')" title="Record Status">
                    <i class="ti ti-file-text me-1"></i>Record Status
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
    
    startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
    endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());
    
    $('#meetingStartTime').val(startDate.toISOString().slice(0, 16));
    $('#meetingEndTime').val(endDate.toISOString().slice(0, 16));
    $('#meetingMaxParticipants').val(meeting.maxParticipants || '');
    
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

    var data = {
        studyGroupId: studyGroupId,
        title: title,
     description: description,
      meetingLink: meetingLink,
        scheduledStartTime: startDate.toISOString(),
        scheduledEndTime: endDate.toISOString(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null
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
     $(`#meeting-${meetingId}`).fadeOut(300, function() {
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

// Cancel Meeting (optional - if you want to implement cancel instead of delete)
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

// Track which meetings have been notified to avoid duplicate notifications
var notifiedMeetings = new Set();

// Function to join meeting and notify other members
function joinMeetingNow(meetingId, meetingLink, isOngoing) {
    // Check if we've already notified for this meeting in this session
    if (!notifiedMeetings.has(meetingId)) {
        // Mark as notified
        notifiedMeetings.add(meetingId);
        
        // Send notification to backend (no loader, happens in background)
        $.ajax({
            url: '/StudyGroups/NotifyMeetingStarted',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(meetingId),
            success: function(response) {
                if (response.MessageType === 'Success') {
                    console.log('Meeting start notification sent to group members');
                }
            },
            error: function() {
                console.error('Failed to send meeting start notification');
            }
        });
    }
    
    // Open the meeting link in a new tab
    window.open(meetingLink, '_blank');
}

// Auto-refresh meetings every 5 minutes
setInterval(function() {
    if (isMember && $('#meetings-tab').hasClass('active')) {
    loadMeetings();
    }
}, 300000); // 5 minutes
