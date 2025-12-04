// ============================================
// MEETING STATUS MANAGEMENT FUNCTIONS
// ============================================

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
                        <i class="ti ti-x text-warning" style="font-size: 32px;"></i>
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
