# Google Meet Scheduling Integration - Complete Implementation Guide

## Summary
This document contains all the code you need to manually add to complete the Google Meet scheduling feature.

## 1. Controller Methods to Add

Add these methods to `StudyConnect/Controllers/StudyGroupsController.cs` **BEFORE the last two closing braces `}}`**:

```csharp
     // ============================================
        // GOOGLE MEET MANAGEMENT METHODS
        // ============================================

     [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] CreateMeetingRequest request)
        {
            try
    {
    var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
   var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

       // Check if current user is owner
          var isOwner = await _context.StudyGroupMembers
      .AnyAsync(m => m.StudyGroupId == request.StudyGroupId &&
        m.UserId == currentUserId &&
         m.Role == "Owner" &&
        m.DeletedAt == null);

                if (!isOwner)
   {
                 return Json(ResponseHelper.Failed("You don't have permission to create meetings."));
       }

         // Validate Google Meet URL
      if (!request.MeetingLink.Contains("meet.google.com"))
            {
             return Json(ResponseHelper.Failed("Please provide a valid Google Meet link."));
        }

                // Validate dates
  if (request.ScheduledStartTime < DateTime.Now)
           {
           return Json(ResponseHelper.Failed("Start time cannot be in the past."));
    }

     if (request.ScheduledEndTime <= request.ScheduledStartTime)
        {
      return Json(ResponseHelper.Failed("End time must be after start time."));
   }

        // Create new meeting
         var meeting = new StudyGroupMeeting
                {
        StudyGroupId = request.StudyGroupId,
     Title = request.Title,
        Description = request.Description,
      MeetingLink = request.MeetingLink,
            ScheduledStartTime = request.ScheduledStartTime,
            ScheduledEndTime = request.ScheduledEndTime,
             IsRecurring = request.IsRecurring,
            RecurrencePattern = request.RecurrencePattern,
          RecurrenceEndDate = request.RecurrenceEndDate,
            MaxParticipants = request.MaxParticipants,
         CreatedByUserId = currentUserId ?? "",
          CreatedBy = currentUserId ?? "",
         CreatedByName = currentUserName,
  CreatedAt = DateTime.Now,
        ModifiedBy = currentUserId ?? "",
           ModifiedByName = currentUserName,
        ModifiedAt = DateTime.Now,
     IsActive = true,
  IsCancelled = false
   };

       _context.StudyGroupMeetings.Add(meeting);
                await _context.SaveChangesAsync();

        // Log the action
      await _auditService.LogCreateAsync("StudyGroupMeeting", meeting.Id.ToString(), new
    {
meeting.Id,
    meeting.StudyGroupId,
   meeting.Title,
        meeting.ScheduledStartTime,
                 meeting.ScheduledEndTime
   });

            return Json(ResponseHelper.Success("Meeting created successfully.", new
     {
        meetingId = meeting.Id
    }));
          }
    catch (Exception exception)
            {
      _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while creating the meeting."));
       }
        }

        [HttpGet]
        public async Task<IActionResult> GetMeetings(int studyGroupId)
      {
          try
          {
      var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

    // Check if user is an approved member
    var isMember = await _context.StudyGroupMembers
           .AnyAsync(m => m.StudyGroupId == studyGroupId &&
   m.UserId == currentUserId &&
  m.IsApproved &&
  m.DeletedAt == null);

   if (!isMember)
            {
        return Json(new { data = new List<object>() });
                }

                var meetings = await _context.StudyGroupMeetings
   .Where(m => m.StudyGroupId == studyGroupId &&
   m.DeletedAt == null &&
       !m.IsCancelled &&
       m.IsActive)
     .Include(m => m.CreatedByUser)
          .OrderBy(m => m.ScheduledStartTime)
         .Select(m => new
    {
    id = m.Id,
      title = m.Title,
   description = m.Description,
         meetingLink = m.MeetingLink,
       scheduledStartTime = m.ScheduledStartTime,
  scheduledEndTime = m.ScheduledEndTime,
          startTimeFormatted = m.ScheduledStartTime.ToString("MMMM dd, yyyy hh:mm tt"),
     endTimeFormatted = m.ScheduledEndTime.ToString("hh:mm tt"),
isRecurring = m.IsRecurring,
    recurrencePattern = m.RecurrencePattern,
        maxParticipants = m.MaxParticipants,
     createdByName = $"{m.CreatedByUser.FirstName} {m.CreatedByUser.LastName}".Trim(),
         createdByUserId = m.CreatedByUserId,
         isPast = m.ScheduledEndTime < DateTime.Now,
 isUpcoming = m.ScheduledStartTime > DateTime.Now,
                     isOngoing = m.ScheduledStartTime <= DateTime.Now && m.ScheduledEndTime >= DateTime.Now
       })
          .ToListAsync();

   return Json(new { data = meetings });
            }
            catch (Exception exception)
     {
       _logger.LogError(exception, exception.Message);
       return Json(new { data = new List<object>() });
            }
    }

        [HttpPost]
      public async Task<IActionResult> UpdateMeeting([FromBody] UpdateMeetingRequest request)
  {
            try
  {
      var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
          var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

         var meeting = await _context.StudyGroupMeetings
  .Where(m => m.DeletedAt == null)
      .FirstOrDefaultAsync(m => m.Id == request.MeetingId);

    if (meeting == null)
     {
     return Json(ResponseHelper.Failed("Meeting not found."));
            }

         // Check if current user is owner
  var isOwner = await _context.StudyGroupMembers
       .AnyAsync(m => m.StudyGroupId == meeting.StudyGroupId &&
   m.UserId == currentUserId &&
       m.Role == "Owner" &&
              m.DeletedAt == null);

          if (!isOwner)
   {
    return Json(ResponseHelper.Failed("You don't have permission to update meetings."));
      }

        // Validate Google Meet URL
            if (!request.MeetingLink.Contains("meet.google.com"))
     {
         return Json(ResponseHelper.Failed("Please provide a valid Google Meet link."));
    }

  // Validate dates
          if (request.ScheduledEndTime <= request.ScheduledStartTime)
   {
                return Json(ResponseHelper.Failed("End time must be after start time."));
    }

        // Store old values for audit
     var oldValues = new
           {
    meeting.Title,
        meeting.Description,
 meeting.MeetingLink,
     meeting.ScheduledStartTime,
    meeting.ScheduledEndTime
     };

       // Update meeting
             meeting.Title = request.Title;
     meeting.Description = request.Description;
       meeting.MeetingLink = request.MeetingLink;
         meeting.ScheduledStartTime = request.ScheduledStartTime;
     meeting.ScheduledEndTime = request.ScheduledEndTime;
     meeting.MaxParticipants = request.MaxParticipants;
         meeting.ModifiedBy = currentUserId ?? "";
meeting.ModifiedByName = currentUserName;
      meeting.ModifiedAt = DateTime.Now;

         _context.StudyGroupMeetings.Update(meeting);
           await _context.SaveChangesAsync();

       // Store new values for audit
      var newValues = new
        {
   meeting.Title,
      meeting.Description,
   meeting.MeetingLink,
        meeting.ScheduledStartTime,
     meeting.ScheduledEndTime
      };

      // Log the action
  await _auditService.LogUpdateAsync("StudyGroupMeeting", meeting.Id.ToString(), oldValues, newValues);

     return Json(ResponseHelper.Success("Meeting updated successfully."));
        }
    catch (Exception exception)
            {
       _logger.LogError(exception, exception.Message);
       return Json(ResponseHelper.Error("An unexpected error occurred while updating the meeting."));
            }
 }

        [HttpPost]
  public async Task<IActionResult> CancelMeeting([FromBody] CancelMeetingRequest request)
        {
  try
    {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
       var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

   var meeting = await _context.StudyGroupMeetings
  .Where(m => m.DeletedAt == null)
          .FirstOrDefaultAsync(m => m.Id == request.MeetingId);

            if (meeting == null)
        {
          return Json(ResponseHelper.Failed("Meeting not found."));
  }

    // Check if current user is owner
       var isOwner = await _context.StudyGroupMembers
        .AnyAsync(m => m.StudyGroupId == meeting.StudyGroupId &&
             m.UserId == currentUserId &&
           m.Role == "Owner" &&
                m.DeletedAt == null);

         if (!isOwner)
          {
            return Json(ResponseHelper.Failed("You don't have permission to cancel meetings."));
       }

    // Cancel meeting
          meeting.IsCancelled = true;
     meeting.IsActive = false;
     meeting.CancellationReason = request.CancellationReason;
  meeting.ModifiedBy = currentUserId ?? "";
        meeting.ModifiedByName = currentUserName;
         meeting.ModifiedAt = DateTime.Now;

           _context.StudyGroupMeetings.Update(meeting);
                await _context.SaveChangesAsync();

            // Log the action
                await _auditService.LogCustomActionAsync($"Cancelled meeting {meeting.Id} for study group {meeting.StudyGroupId}. Reason: {request.CancellationReason ?? "No reason provided"}");

        return Json(ResponseHelper.Success("Meeting cancelled successfully."));
     }
     catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while cancelling the meeting."));
   }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteMeeting([FromBody] int meetingId)
        {
            try
            {
           var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
  var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

     var meeting = await _context.StudyGroupMeetings
  .Where(m => m.DeletedAt == null)
        .FirstOrDefaultAsync(m => m.Id == meetingId);

       if (meeting == null)
    {
  return Json(ResponseHelper.Failed("Meeting not found."));
   }

     // Check if current user is owner
       var isOwner = await _context.StudyGroupMembers
     .AnyAsync(m => m.StudyGroupId == meeting.StudyGroupId &&
           m.UserId == currentUserId &&
   m.Role == "Owner" &&
    m.DeletedAt == null);

           if (!isOwner)
                {
            return Json(ResponseHelper.Failed("You don't have permission to delete meetings."));
          }

              // Soft delete
          meeting.DeletedBy = currentUserId;
       meeting.DeletedByName = currentUserName;
              meeting.DeletedAt = DateTime.Now;

   _context.StudyGroupMeetings.Update(meeting);
          await _context.SaveChangesAsync();

      // Log the action
           await _auditService.LogDeleteAsync("StudyGroupMeeting", meeting.Id.ToString(), new
                {
          meeting.Id,
    meeting.StudyGroupId,
           meeting.Title,
   meeting.ScheduledStartTime
         });

      return Json(ResponseHelper.Success("Meeting deleted successfully."));
     }
      catch (Exception exception)
     {
    _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while deleting the meeting."));
}
        }
```

## 2. JavaScript Functions to Add

Add these functions to the END of `StudyConnect/wwwroot/modules/study_groups/footer_details.js`:

```javascript
// ============================================
// GOOGLE MEET MANAGEMENT FUNCTIONS
// ============================================

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

    if (status === 'ongoing') {
        statusBadge = '<span class="badge bg-success-subtle text-success"><i class="ti ti-live-view me-1"></i>Live Now</span>';
        statusClass = 'border-success';
        joinButton = `
            <a href="${escapeHtml(meeting.meetingLink)}" target="_blank" class="btn btn-success btn-sm">
       <i class="ti ti-video me-1"></i>Join Now
    </a>
 `;
    } else if (status === 'upcoming') {
        statusBadge = '<span class="badge bg-primary-subtle text-primary"><i class="ti ti-clock me-1"></i>Upcoming</span>';
        statusClass = 'border-primary';
   joinButton = `
            <a href="${escapeHtml(meeting.meetingLink)}" target="_blank" class="btn btn-outline-primary btn-sm">
 <i class="ti ti-video me-1"></i>View Link
            </a>
  `;
    } else {
        statusBadge = '<span class="badge bg-secondary-subtle text-secondary"><i class="ti ti-check me-1"></i>Completed</span>';
        statusClass = '';
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
          <button type="button" class="btn btn-outline-danger" onclick="deleteMeeting(${meeting.id})" title="Delete Meeting">
                    <i class="ti ti-trash"></i>
     </button>
            </div>
      `;
    }

    var recurringBadge = meeting.isRecurring
        ? `<span class="badge bg-info-subtle text-info ms-2"><i class="ti ti-repeat me-1"></i>${meeting.recurrencePattern}</span>`
    : '';

    var participantsBadge = meeting.maxParticipants
        ? `<span class="text-muted small ms-3"><i class="ti ti-users me-1"></i>Max: ${meeting.maxParticipants}</span>`
        : '';

    var card = `
        <div class="card mb-3 ${statusClass}" id="meeting-${meeting.id}">
            <div class="card-body">
    <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="flex-grow-1">
 <div class="d-flex align-items-center mb-2">
  <h6 class="mb-0 fw-semibold">${escapeHtml(meeting.title)}</h6>
    ${statusBadge}
             ${recurringBadge}
      </div>
     ${meeting.description ? `<p class="text-muted small mb-2">${escapeHtml(meeting.description)}</p>` : ''}
            <div class="d-flex flex-wrap gap-3 text-muted small">
  <span><i class="ti ti-calendar me-1"></i>${meeting.startTimeFormatted}</span>
             <span><i class="ti ti-clock-hour-4 me-1"></i>${meeting.endTimeFormatted}</span>
       <span><i class="ti ti-user me-1"></i>Created by ${escapeHtml(meeting.createdByName)}</span>
               ${participantsBadge}
   </div>
   </div>
     </div>
         <div class="d-flex align-items-center justify-content-between mt-3">
         <div>
        ${joinButton}
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

// Auto-refresh meetings every 5 minutes
setInterval(function() {
    if (isMember && $('#meetings-tab').hasClass('active')) {
      loadMeetings();
    }
}, 300000); // 5 minutes
```

## 3. Database Migration

Run these commands in your terminal:

```bash
dotnet ef migrations add AddStudyGroupMeetingsTable
dotnet ef database update
```

## 4. Build and Test

After adding all the code:

```bash
dotnet build
```

If there are any errors, check that:
- All using statements are in place at the top of the controller
- The controller methods are added BEFORE the closing braces
- The JavaScript functions are added at the END of footer_details.js

## 5. Features Implemented

? **Owner-Only Creation**: Only study group owners can create/edit/delete Google Meet links
? **Member Viewing**: All approved members can view meeting schedules and join meetings
? **Multiple Meetings**: Support for creating multiple scheduled meetings
? **Meeting Status**: Displays meetings as Ongoing, Upcoming, or Past
? **Validation**: Validates Google Meet URLs and datetime ranges
? **Edit & Delete**: Owners can edit and delete scheduled meetings
? **Audit Logging**: All meeting operations are logged
? **Soft Delete**: Meetings can be soft-deleted with audit trail
? **Auto-Refresh**: Meetings auto-refresh every 5 minutes
? **Responsive UI**: Beautiful cards with status badges and action buttons

## 6. Testing Checklist

After implementation, test:

- [ ] Owner can schedule a new meeting
- [ ] Meeting appears in the schedule
- [ ] "Join Now" button appears for ongoing meetings
- [ ] "View Link" button appears for upcoming meetings
- [ ] Past meetings show as "Ended"
- [ ] Owner can edit existing meetings
- [ ] Owner can delete meetings
- [ ] Members can view but not edit/delete
- [ ] Google Meet link validation works
- [ ] Date/time validation prevents past dates
- [ ] End time must be after start time

Good luck with the implementation!
