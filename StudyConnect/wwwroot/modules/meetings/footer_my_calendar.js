// Global variables
let calendar;
let allMeetings = [];

$(document).ready(function () {
    initializeCalendar();
    loadMeetings();
});

// Initialize FullCalendar
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        buttonText: {
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'List'
        },
        editable: false,
        selectable: false,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        navLinks: true,
        events: [],
        eventClick: function (info) {
            showMeetingDetails(info.event);
        },
        eventDidMount: function (info) {
            // Add tooltip
            $(info.el).tooltip({
                title: info.event.title,
                placement: 'top',
                trigger: 'hover',
                container: 'body'
            });
        },
        loading: function (isLoading) {
            if (isLoading) {
                $('#calendar').addClass('calendar-loading');
            } else {
                $('#calendar').removeClass('calendar-loading');
            }
        },
        height: 'auto',
        contentHeight: 650,
        aspectRatio: 1.8
    });

    calendar.render();
}

// Load meetings from API
function loadMeetings() {
    AmagiLoader.show();

    $.ajax({
        url: '/Meetings/GetMyMeetings',
        type: 'GET',
        success: function (response) {
            AmagiLoader.hide();

            if (response.data && response.data.length > 0) {
                allMeetings = response.data;
                renderMeetingsToCalendar(response.data);
            } else {
                showEmptyState();
            }
        },
        error: function (xhr, status, error) {
            AmagiLoader.hide();
            console.error('Error loading meetings:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load meetings. Please try again.',
                confirmButtonColor: '#5D87FF'
            });
        }
    });
}

// Render meetings to calendar
function renderMeetingsToCalendar(meetings) {
    const events = meetings.map(meeting => {
        const now = new Date();
        const startDate = new Date(meeting.start);
        const endDate = new Date(meeting.end);

        let eventClass = 'event-upcoming';
        let eventColor = '#5D87FF'; // Primary blue

        // Determine meeting status
        if (now >= startDate && now <= endDate) {
            eventClass = 'event-ongoing';
            eventColor = '#13DEB9'; // Success green
        } else if (now > endDate) {
            eventClass = 'event-past';
            eventColor = '#6c757d'; // Secondary gray
        }

        // Add recurring indicator to title
        let displayTitle = meeting.title;
        if (meeting.isRecurring) {
            displayTitle = `🔄 ${displayTitle}`;
        }

        return {
            id: meeting.id,
            title: displayTitle,
            start: meeting.start,
            end: meeting.end,
            className: eventClass,
            backgroundColor: eventColor,
            borderColor: eventColor,
            extendedProps: {
                description: meeting.description,
                meetingLink: meeting.meetingLink,
                studyGroupId: meeting.studyGroupId,
                studyGroupName: meeting.studyGroupName,
                createdByName: meeting.createdByName,
                maxParticipants: meeting.maxParticipants,
                isRecurring: meeting.isRecurring,
                recurrencePattern: meeting.recurrencePattern
            }
        };
    });

    // Clear existing events and add new ones
    calendar.removeAllEvents();
    calendar.addEventSource(events);
}

// Show meeting details in modal
function showMeetingDetails(event) {
    const props = event.extendedProps;
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const now = new Date();

    // Determine status
    let status = 'Upcoming';
    let statusClass = 'status-upcoming';
    let statusIcon = 'ti-clock';

    if (now >= startDate && now <= endDate) {
        status = 'Live Now';
        statusClass = 'status-ongoing';
        statusIcon = 'ti-live-view';
    } else if (now > endDate) {
        status = 'Completed';
        statusClass = 'status-past';
        statusIcon = 'ti-check';
    }

    // Format dates
    const startFormatted = formatDateTime(startDate);
    const endFormatted = formatTime(endDate);
    const duration = calculateDuration(startDate, endDate);

    // Build modal content
    let modalContent = `
        <div class="meeting-detail-item">
            <div class="meeting-detail-icon bg-primary-subtle text-primary">
                <i class="ti ti-bookmark"></i>
            </div>
            <div class="meeting-detail-content">
                <div class="meeting-detail-label">Meeting Title</div>
                <div class="meeting-detail-value">${escapeHtml(event.title.replace('🔄 ', ''))}</div>
            </div>
        </div>

        <div class="meeting-detail-item">
            <div class="meeting-detail-icon bg-info-subtle text-info">
                <i class="ti ${statusIcon}"></i>
            </div>
            <div class="meeting-detail-content">
                <div class="meeting-detail-label">Status</div>
                <div class="meeting-detail-value">
                    <span class="meeting-status-badge ${statusClass}">
                        <i class="ti ${statusIcon}"></i>${status}
                    </span>
                </div>
            </div>
        </div>

        <div class="meeting-detail-item">
            <div class="meeting-detail-icon bg-success-subtle text-success">
                <i class="ti ti-calendar-event"></i>
            </div>
            <div class="meeting-detail-content">
                <div class="meeting-detail-label">Date & Time</div>
                <div class="meeting-detail-value">
                    <div><i class="ti ti-calendar me-2"></i>${startFormatted}</div>
                    <div class="mt-1"><i class="ti ti-clock me-2"></i>${endFormatted}</div>
                    <small class="text-muted"><i class="ti ti-clock-hour-4 me-2"></i>Duration: ${duration}</small>
                </div>
            </div>
        </div>

        <div class="meeting-detail-item">
            <div class="meeting-detail-icon bg-warning-subtle text-warning">
                <i class="ti ti-books"></i>
            </div>
            <div class="meeting-detail-content">
                <div class="meeting-detail-label">Study Group</div>
                <div class="meeting-detail-value">
                    <a href="/StudyGroups/Details/${props.studyGroupId}" class="text-decoration-none">
                        ${escapeHtml(props.studyGroupName)}
                        <i class="ti ti-external-link ms-1"></i>
                    </a>
                </div>
            </div>
        </div>

        <div class="meeting-detail-item">
            <div class="meeting-detail-icon bg-secondary-subtle text-secondary">
                <i class="ti ti-user"></i>
            </div>
            <div class="meeting-detail-content">
                <div class="meeting-detail-label">Created By</div>
                <div class="meeting-detail-value">${escapeHtml(props.createdByName)}</div>
            </div>
        </div>
    `;

    if (props.description) {
        modalContent += `
            <div class="meeting-detail-item">
                <div class="meeting-detail-icon bg-light text-dark">
                    <i class="ti ti-file-description"></i>
                </div>
                <div class="meeting-detail-content">
                    <div class="meeting-detail-label">Description</div>
                    <div class="meeting-detail-value">${escapeHtml(props.description)}</div>
                </div>
            </div>
        `;
    }

    if (props.isRecurring) {
        modalContent += `
            <div class="meeting-detail-item">
                <div class="meeting-detail-icon bg-info-subtle text-info">
                    <i class="ti ti-repeat"></i>
                </div>
                <div class="meeting-detail-content">
                    <div class="meeting-detail-label">Recurrence</div>
                    <div class="meeting-detail-value">
                        <span class="badge bg-info-subtle text-info">
                            <i class="ti ti-repeat me-1"></i>${props.recurrencePattern || 'Recurring'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    if (props.maxParticipants) {
        modalContent += `
            <div class="meeting-detail-item">
                <div class="meeting-detail-icon bg-primary-subtle text-primary">
                    <i class="ti ti-users"></i>
                </div>
                <div class="meeting-detail-content">
                    <div class="meeting-detail-label">Maximum Participants</div>
                    <div class="meeting-detail-value">${props.maxParticipants} participants</div>
                </div>
            </div>
        `;
    }

    modalContent += `
        <div class="meeting-detail-item">
            <div class="meeting-detail-icon bg-primary-subtle text-primary">
                <i class="ti ti-link"></i>
            </div>
            <div class="meeting-detail-content">
                <div class="meeting-detail-label">Meeting Link</div>
                <div class="meeting-detail-value">
                    <a href="${escapeHtml(props.meetingLink)}" class="meeting-link" target="_blank" onclick="event.stopPropagation();">
                        <i class="ti ti-external-link"></i>
                        Open Google Meet
                    </a>
                </div>
            </div>
        </div>
    `;

    // Update modal content
    $('#meetingDetailsContent').html(modalContent);
    $('#joinMeetingBtn').attr('href', props.meetingLink);

    // Show modal
    $('#meetingDetailsModal').modal('show');
}

// Show empty state
function showEmptyState() {
    const emptyStateHtml = `
        <div class="calendar-empty-state">
            <i class="ti ti-calendar-off"></i>
            <h6>No Meetings Scheduled</h6>
            <p class="text-muted">You don't have any upcoming meetings yet.</p>
            <p class="text-muted small">Join a study group to see meetings here!</p>
        </div>
    `;

    calendar.removeAllEvents();
    $('#calendar').append(emptyStateHtml);
}

// Refresh calendar
function refreshCalendar() {
    $('.calendar-empty-state').remove();
    loadMeetings();
}

// Helper Functions
function formatDateTime(date) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleTimeString('en-US', options);
}

function calculateDuration(start, end) {
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${minutes}m`;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function (m) {
        return map[m];
    });
}

// Auto-refresh calendar every 5 minutes
setInterval(function () {
    console.log('Auto-refreshing calendar...');
    loadMeetings();
}, 300000); // 5 minutes
