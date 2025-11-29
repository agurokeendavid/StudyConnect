using StudyConnect.Models;

namespace StudyConnect.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(string userId, string type, string title, string message, 
            int? studyGroupId = null, int? meetingId = null, string? actionUrl = null, 
            string priority = "Normal", DateTime? eventDate = null);
        
        Task CreateNotificationForGroupMembersAsync(int studyGroupId, string type, string title, 
            string message, int? meetingId = null, string? actionUrl = null, 
            string priority = "Normal", DateTime? eventDate = null, string? excludeUserId = null);
        
        Task CreateUpcomingEventNotificationsAsync();
    }
}
