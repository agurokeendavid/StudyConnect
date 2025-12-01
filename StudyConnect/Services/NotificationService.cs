using Microsoft.EntityFrameworkCore;
using StudyConnect.Constants;
using StudyConnect.Data;
using StudyConnect.Models;

namespace StudyConnect.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(AppDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task CreateNotificationAsync(string userId, string type, string title, string message,
            int? studyGroupId = null, int? meetingId = null, string? actionUrl = null,
            string priority = "Normal", DateTime? eventDate = null)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Type = type,
                    Title = title,
                    Message = message,
                    StudyGroupId = studyGroupId,
                    MeetingId = meetingId,
                    ActionUrl = actionUrl,
                    Priority = priority,
                    EventDate = eventDate,
                    IsViewed = false,
                    CreatedBy = "System",
                    CreatedByName = "System",
                    CreatedAt = DateTime.Now,
                    ModifiedBy = "System",
                    ModifiedByName = "System",
                    ModifiedAt = DateTime.Now
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification for user {UserId}", userId);
            }
        }

        public async Task CreateNotificationForGroupMembersAsync(int studyGroupId, string type, string title,
            string message, int? meetingId = null, string? actionUrl = null,
            string priority = "Normal", DateTime? eventDate = null, string? excludeUserId = null)
        {
            try
            {
                var members = await _context.StudyGroupMembers
                    .Where(m => m.StudyGroupId == studyGroupId 
                        && m.IsApproved 
                        && m.DeletedAt == null
                        && (excludeUserId == null || m.UserId != excludeUserId))
                    .Select(m => m.UserId)
                    .ToListAsync();

                foreach (var userId in members)
                {
                    await CreateNotificationAsync(userId, type, title, message, studyGroupId, meetingId, actionUrl, priority, eventDate);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notifications for group {StudyGroupId}", studyGroupId);
            }
        }

        public async Task CreateUpcomingEventNotificationsAsync()
        {
            try
            {
                var currentTime = DateTime.Now;

                // Get all upcoming meetings that haven't been cancelled or deleted
                var upcomingMeetings = await _context.StudyGroupMeetings
                    .Include(m => m.StudyGroup)
                    .Where(m => m.DeletedAt == null
                        && m.IsActive
                        && !m.IsCancelled
                        && m.ScheduledStartTime > currentTime)
                    .ToListAsync();

                foreach (var meeting in upcomingMeetings)
                {
                    // Calculate when to send notification based on ReminderTimeInHours
                    var reminderTime = meeting.ScheduledStartTime.AddHours(-meeting.ReminderTimeInHours);
                    
                    // Check if it's time to send the notification (within the next hour)
                    var shouldSendNotification = reminderTime <= currentTime.AddHours(1) && reminderTime >= currentTime.AddHours(-1);

                    if (shouldSendNotification)
                    {
                        // Check if notification already exists for this meeting
                        var existingNotifications = await _context.Notifications
                            .Where(n => n.MeetingId == meeting.Id
                                && n.Type == NotificationTypes.UpcomingEvent
                                && n.DeletedAt == null
                                && n.CreatedAt >= currentTime.AddHours(-2)) // Only check last 2 hours
                            .AnyAsync();

                        if (!existingNotifications)
                        {
                            var hourWord = meeting.ReminderTimeInHours == 1 ? "hour" : "hours";
                            var title = $"Upcoming Meeting in {meeting.ReminderTimeInHours} {hourWord}";
                            var message = $"'{meeting.Title}' is scheduled for {meeting.ScheduledStartTime:MMMM dd, yyyy h:mm tt}";
                            var actionUrl = $"/StudyGroups/Details/{meeting.StudyGroupId}";

                            await CreateNotificationForGroupMembersAsync(
                                meeting.StudyGroupId,
                                NotificationTypes.UpcomingEvent,
                                title,
                                message,
                                meeting.Id,
                                actionUrl,
                                "High",
                                meeting.ScheduledStartTime
                            );

                            _logger.LogInformation("Created upcoming event notifications for meeting {MeetingId} with {Hours} hours reminder", 
                                meeting.Id, meeting.ReminderTimeInHours);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating upcoming event notifications");
            }
        }
    }
}
