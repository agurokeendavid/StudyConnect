$(function () {
    loadNotifications();
    loadUnreadCount();

    // Refresh notifications every 30 seconds
    setInterval(function () {
        loadUnreadCount();
    }, 30000);
});

function loadNotifications() {
    $.ajax({
        url: '/Notifications/GetNotifications',
        type: 'GET',
        success: function (response) {
            if (response.success && response.data) {
                renderNotifications(response.data);
            } else {
                $('#noNotifications').show();
                $('#notificationsContainer').empty();
            }
        },
        error: function () {
            console.error('Error loading notifications');
            $('#noNotifications').show();
        }
    });
}

function renderNotifications(notifications) {
    var container = $('#notificationsContainer');
    container.empty();

    if (notifications.length === 0) {
        $('#noNotifications').show();
        return;
    }

    $('#noNotifications').hide();

    notifications.forEach(function (notification) {
        var card = createNotificationCard(notification);
        container.append(card);
    });
}

function createNotificationCard(notification) {
    var iconClass = getNotificationIcon(notification.Type);
    var priorityClass = getPriorityClass(notification.Priority);
    var viewedClass = notification.IsViewed ? 'bg-light' : 'bg-white border-start border-primary border-4';
    
    var timeAgo = getTimeAgo(new Date(notification.CreatedAt));
    
    var actionButton = '';
    if (notification.ActionUrl) {
        actionButton = `
            <a href="${notification.ActionUrl}" class="btn btn-sm btn-outline-primary" onclick="markAsViewed(${notification.Id})">
                <i class="ti ti-external-link me-1"></i>View
            </a>
        `;
    }

    var card = `
        <div class="card mb-2 ${viewedClass}" id="notification-${notification.Id}">
            <div class="card-body p-3">
                <div class="d-flex align-items-start">
                    <div class="flex-shrink-0 me-3">
                        <div class="rounded-circle bg-${priorityClass} d-flex align-items-center justify-content-center" 
                             style="width: 40px; height: 40px;">
                            <i class="${iconClass} text-white"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="mb-0 ${notification.IsViewed ? 'text-muted' : 'fw-semibold'}">${escapeHtml(notification.Title)}</h6>
                            ${notification.IsViewed ? '<span class="badge bg-success-subtle text-success">Read</span>' : '<span class="badge bg-primary">New</span>'}
                        </div>
                        <p class="mb-2 text-muted small">${escapeHtml(notification.Message)}</p>
                        ${notification.EventDate ? `<small class="text-muted"><i class="ti ti-calendar me-1"></i>${new Date(notification.EventDate).toLocaleString()}</small>` : ''}
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <small class="text-muted">
                                <i class="ti ti-clock me-1"></i>${timeAgo}
                            </small>
                            <div>
                                ${actionButton}
                                ${!notification.IsViewed ? `<button class="btn btn-sm btn-outline-secondary ms-2" onclick="markAsViewed(${notification.Id})"><i class="ti ti-check"></i></button>` : ''}
                                <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteNotification(${notification.Id})">
                                    <i class="ti ti-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return card;
}

function getNotificationIcon(type) {
    var icons = {
        'UpcomingEvent': 'ti ti-calendar-event',
        'MeetingScheduled': 'ti ti-video',
        'MeetingCancelled': 'ti ti-video-off',
        'MeetingUpdated': 'ti ti-video-plus',
        'GroupInvitation': 'ti ti-user-plus',
        'GroupApproved': 'ti ti-check',
        'GroupRejected': 'ti ti-x',
        'MemberJoined': 'ti ti-users',
        'MemberLeft': 'ti ti-user-minus',
        'ResourceUploaded': 'ti ti-file-upload',
        'QuestionPosted': 'ti ti-help',
        'AnnouncementPosted': 'ti ti-speakerphone'
    };
    return icons[type] || 'ti ti-bell';
}

function getPriorityClass(priority) {
    var classes = {
        'Low': 'secondary',
        'Normal': 'info',
        'High': 'warning',
        'Urgent': 'danger'
    };
    return classes[priority] || 'info';
}

function getTimeAgo(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    
    var interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
}

function markAsViewed(notificationId) {
    $.ajax({
        url: '/Notifications/MarkAsViewed',
        type: 'POST',
        data: { id: notificationId },
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        },
        success: function (response) {
            if (response.MessageType === 'Success') {
                var card = $(`#notification-${notificationId}`);
                card.removeClass('bg-white border-start border-primary border-4').addClass('bg-light');
                card.find('.badge.bg-primary').replaceWith('<span class="badge bg-success-subtle text-success">Read</span>');
                card.find('h6').removeClass('fw-semibold').addClass('text-muted');
                card.find('.btn-outline-secondary').remove();
                loadUnreadCount();
            }
        },
        error: function () {
            console.error('Error marking notification as viewed');
        }
    });
}

function markAllNotificationsAsViewed() {
    $.ajax({
        url: '/Notifications/MarkAllAsViewed',
        type: 'POST',
        headers: {
            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
        },
        success: function (response) {
            if (response.MessageType === 'Success') {
                Swal.fire('Success', 'All notifications marked as read', 'success');
                loadNotifications();
                loadUnreadCount();
            }
        },
        error: function () {
            Swal.fire('Error', 'Failed to mark notifications as read', 'error');
        }
    });
}

function deleteNotification(notificationId) {
    Swal.fire({
        title: 'Delete Notification?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/Notifications/Delete',
                type: 'POST',
                data: { id: notificationId },
                headers: {
                    'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                },
                success: function (response) {
                    if (response.MessageType === 'Success') {
                        $(`#notification-${notificationId}`).fadeOut(300, function () {
                            $(this).remove();
                            if ($('#notificationsContainer .card').length === 0) {
                                $('#noNotifications').show();
                            }
                        });
                        loadUnreadCount();
                    }
                },
                error: function () {
                    Swal.fire('Error', 'Failed to delete notification', 'error');
                }
            });
        }
    });
}

function deleteAllNotifications() {
    Swal.fire({
        title: 'Delete All Notifications?',
        text: 'This will remove all your notifications permanently.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete all!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/Notifications/DeleteAll',
                type: 'POST',
                headers: {
                    'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                },
                success: function (response) {
                    if (response.MessageType === 'Success') {
                        Swal.fire('Success', 'All notifications deleted', 'success');
                        $('#notificationsContainer').empty();
                        $('#noNotifications').show();
                        loadUnreadCount();
                    }
                },
                error: function () {
                    Swal.fire('Error', 'Failed to delete notifications', 'error');
                }
            });
        }
    });
}

function loadUnreadCount() {
    $.ajax({
        url: '/Notifications/GetUnreadCount',
        type: 'GET',
        success: function (response) {
            if (response.success) {
                updateNotificationBadge(response.count);
            }
        },
        error: function () {
            console.error('Error loading unread count');
        }
    });
}

function updateNotificationBadge(count) {
    var badge = $('#notificationBadge');
    var countElement = $('#notificationCount');
    
    if (count > 0) {
        badge.text(count > 99 ? '99+' : count).show();
        countElement.text(count + ' New');
    } else {
        badge.hide();
        countElement.text('0 New');
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

// Load notifications in header dropdown
function loadHeaderNotifications() {
    $.ajax({
        url: '/Notifications/GetNotifications',
        type: 'GET',
        success: function (response) {
            if (response.success && response.data) {
                renderHeaderNotifications(response.data.slice(0, 5)); // Show only first 5
            }
        }
    });
}

function renderHeaderNotifications(notifications) {
    var container = $('#notificationsList');
    container.empty();

    if (notifications.length === 0) {
        container.html('<div class="text-center py-3 text-muted">No new notifications</div>');
        return;
    }

    notifications.forEach(function (notification) {
        var iconClass = getNotificationIcon(notification.Type);
        var priorityClass = getPriorityClass(notification.Priority);
        var timeAgo = getTimeAgo(new Date(notification.CreatedAt));
        // window.location.href='${notification.ActionUrl}'; 
        var item = `
            <div class="py-3 px-2 border-bottom ${notification.IsViewed ? '' : 'bg-light-subtle'}" 
                 style="cursor: pointer;" 
                 onclick="${notification.ActionUrl ? `markAsViewed(${notification.Id});` : `markAsViewed(${notification.Id});`}">
                <div class="d-flex align-items-start">
                    <div class="flex-shrink-0 me-2">
                        <div class="rounded-circle bg-${priorityClass} d-flex align-items-center justify-content-center" 
                             style="width: 32px; height: 32px;">
                            <i class="${iconClass} text-white fs-5"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1 fs-3 ${notification.IsViewed ? 'text-muted' : 'fw-semibold'}">${escapeHtml(notification.Title)}</h6>
                        <p class="mb-1 fs-2 text-muted">${escapeHtml(notification.Message).substring(0, 60)}...</p>
                        <small class="text-muted">${timeAgo}</small>
                    </div>
                </div>
            </div>
        `;

        container.append(item);
    });
}

// Load header notifications when dropdown is opened
$(document).on('show.bs.dropdown', '#drop-notifications', function () {
    loadHeaderNotifications();
});

// Initial load of unread count
loadUnreadCount();
