using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Helpers;
using StudyConnect.Models;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize]
    public class NotificationsController : Controller
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(AppDbContext context, ILogger<NotificationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Json(new { success = false, message = "User not found" });

                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId && n.DeletedAt == null)
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(50)
                    .Select(n => new
                    {
                        Id = n.Id,
                        Type = n.Type,
                        Title = n.Title,
                        Message = n.Message,
                        IsViewed = n.IsViewed,
                        ViewedAt = n.ViewedAt,
                        ActionUrl = n.ActionUrl,
                        Priority = n.Priority,
                        EventDate = n.EventDate,
                        CreatedAt = n.CreatedAt
                    })
                    .ToListAsync();

                return Json(new { success = true, data = notifications });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching notifications");
                return Json(new { success = false, message = "Failed to load notifications" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Json(new { success = false, count = 0 });

                var count = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsViewed && n.DeletedAt == null)
                    .CountAsync();

                return Json(new { success = true, count = count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count");
                return Json(new { success = false, count = 0 });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarkAsViewed(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Json(ResponseHelper.Failed("User not found"));

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId && n.DeletedAt == null);

                if (notification == null)
                    return Json(ResponseHelper.Failed("Notification not found"));

                if (!notification.IsViewed)
                {
                    notification.IsViewed = true;
                    notification.ViewedAt = DateTime.Now;
                    await _context.SaveChangesAsync();
                }

                return Json(ResponseHelper.Success("Notification marked as viewed"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as viewed");
                return Json(ResponseHelper.Error("Failed to mark notification as viewed"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarkAllAsViewed()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Json(ResponseHelper.Failed("User not found"));

                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsViewed && n.DeletedAt == null)
                    .ToListAsync();

                foreach (var notification in notifications)
                {
                    notification.IsViewed = true;
                    notification.ViewedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return Json(ResponseHelper.Success("All notifications marked as viewed"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as viewed");
                return Json(ResponseHelper.Error("Failed to mark all notifications as viewed"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Json(ResponseHelper.Failed("User not found"));

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId && n.DeletedAt == null);

                if (notification == null)
                    return Json(ResponseHelper.Failed("Notification not found"));

                var currentUserName = User.FindFirstValue("FullName") ?? "System";
                notification.DeletedBy = userId;
                notification.DeletedByName = currentUserName;
                notification.DeletedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Json(ResponseHelper.Success("Notification deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification");
                return Json(ResponseHelper.Error("Failed to delete notification"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteAll()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Json(ResponseHelper.Failed("User not found"));

                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId && n.DeletedAt == null)
                    .ToListAsync();

                var currentUserName = User.FindFirstValue("FullName") ?? "System";
                foreach (var notification in notifications)
                {
                    notification.DeletedBy = userId;
                    notification.DeletedByName = currentUserName;
                    notification.DeletedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return Json(ResponseHelper.Success("All notifications deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting all notifications");
                return Json(ResponseHelper.Error("Failed to delete all notifications"));
            }
        }
    }
}
