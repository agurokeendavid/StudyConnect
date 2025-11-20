using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Models;

namespace StudyConnect.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SubscriptionService> _logger;

        public SubscriptionService(AppDbContext context, ILogger<SubscriptionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> HasActiveSubscriptionAsync(string userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return false;

                if (!user.HasActiveSubscription) return false;

                if (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value < DateTime.Now)
                {
                    user.HasActiveSubscription = false;
                    await _context.SaveChangesAsync();
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking active subscription for user {userId}");
                return false;
            }
        }

        public async Task<UserSubscription?> GetActiveSubscriptionAsync(string userId)
        {
            try
            {
                return await _context.UserSubscriptions
                    .Include(us => us.Subscription)
                    .Include(us => us.User)
                    .Where(us => us.UserId == userId 
                        && us.IsActive 
                        && us.EndDate > DateTime.Now
                        && us.DeletedAt == null)
                    .OrderByDescending(us => us.EndDate)
                    .FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting active subscription for user {userId}");
                return null;
            }
        }

        public async Task<bool> CanUploadFileAsync(string userId)
        {
            try
            {
                var userSubscription = await GetActiveSubscriptionAsync(userId);
                if (userSubscription == null) return false;

                // If unlimited uploads (0 or premium)
                if (userSubscription.Subscription?.MaxFileUploads == 0 || 
                    userSubscription.Subscription?.HasUnlimitedAccess == true)
                {
                    return true;
                }

                // Check if user hasn't exceeded the limit
                return userSubscription.FilesUploaded < (userSubscription.Subscription?.MaxFileUploads ?? 0);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking file upload permission for user {userId}");
                return false;
            }
        }

        public async Task IncrementFileUploadCountAsync(string userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.FilesUploadedCount++;
                    await _context.SaveChangesAsync();
                }

                var userSubscription = await GetActiveSubscriptionAsync(userId);
                if (userSubscription != null)
                {
                    userSubscription.FilesUploaded++;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error incrementing file upload count for user {userId}");
            }
        }

        public async Task<bool> IsSubscriptionExpiredAsync(string userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return true;

                if (!user.SubscriptionEndDate.HasValue) return true;

                return user.SubscriptionEndDate.Value < DateTime.Now;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking subscription expiration for user {userId}");
                return true;
            }
        }

        public async Task<int> GetRemainingFileUploadsAsync(string userId)
        {
            try
            {
                var userSubscription = await GetActiveSubscriptionAsync(userId);
                if (userSubscription == null) return 0;

                // If unlimited
                if (userSubscription.Subscription?.MaxFileUploads == 0 || 
                    userSubscription.Subscription?.HasUnlimitedAccess == true)
                {
                    return int.MaxValue;
                }

                var maxUploads = userSubscription.Subscription?.MaxFileUploads ?? 0;
                var remaining = maxUploads - userSubscription.FilesUploaded;
                return remaining > 0 ? remaining : 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting remaining file uploads for user {userId}");
                return 0;
            }
        }
    }
}
