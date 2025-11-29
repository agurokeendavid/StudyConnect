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
                var tomorrow = DateTime.Now.AddDays(1);
                var startOfTomorrow = new DateTime(tomorrow.Year, tomorrow.Month, tomorrow.Day, 0, 0, 0);
                var endOfTomorrow = new DateTime(tomorrow.Year, tomorrow.Month, tomorrow.Day, 23, 59, 59);

                // Get meetings happening tomorrow
                var upcomingMeetings = await _context.StudyGroupMeetings
                    .Include(m => m.StudyGroup)
                    .Where(m => m.DeletedAt == null
                        && m.IsActive
                        && !m.IsCancelled
                        && m.ScheduledStartTime >= startOfTomorrow
                        && m.ScheduledStartTime <= endOfTomorrow)
                    .ToListAsync();

                foreach (var meeting in upcomingMeetings)
                {
                    // Check if notification already exists for this meeting
                    var existingNotifications = await _context.Notifications
                        .Where(n => n.MeetingId == meeting.Id
                            && n.Type == NotificationTypes.UpcomingEvent
                            && n.DeletedAt == null
                            && n.CreatedAt >= DateTime.Now.AddHours(-12)) // Only check last 12 hours
                        .AnyAsync();

                    if (!existingNotifications)
                    {
                        var title = $"Upcoming Meeting Tomorrow";
                        var message = $"'{meeting.Title}' is scheduled for tomorrow at {meeting.ScheduledStartTime:h:mm tt}";
                        var actionUrl = $"/Meetings/Details?id={meeting.Id}";

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

                        _logger.LogInformation("Created upcoming event notifications for meeting {MeetingId}", meeting.Id);
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
