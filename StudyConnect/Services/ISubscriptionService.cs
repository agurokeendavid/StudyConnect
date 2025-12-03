using StudyConnect.Models;

namespace StudyConnect.Services
{
    public interface ISubscriptionService
    {
        Task<bool> HasActiveSubscriptionAsync(string userId);
        Task<UserSubscription?> GetActiveSubscriptionAsync(string userId);
        Task<bool> CanUploadFileAsync(string userId);
        Task<bool> CanCreateUserGroupAsync(string userId);
        Task IncrementFileUploadCountAsync(string userId);
        Task IncrementGroupsCreatedCountAsync(string userId);
        Task<bool> IsSubscriptionExpiredAsync(string userId);
        Task<int> GetRemainingFileUploadsAsync(string userId);
    }
}
