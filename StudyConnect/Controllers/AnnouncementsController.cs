using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Helpers;
using StudyConnect.Models;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize]
    public class AnnouncementsController : Controller
    {
        private readonly ILogger<AnnouncementsController> _logger;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public AnnouncementsController(
            ILogger<AnnouncementsController> logger,
            AppDbContext context,
            IAuditService auditService)
        {
            _logger = logger;
            _context = context;
            _auditService = auditService;
        }

        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Announcements Management Page");
            return View();
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAnnouncements()
        {
            try
            {
                var announcements = await _context.Announcements
                    .Where(a => a.DeletedAt == null)
                    .OrderByDescending(a => a.IsPinned)
                    .ThenByDescending(a => a.CreatedAt)
                    .Select(a => new
                    {
                        Id = a.Id,
                        Title = a.Title,
                        Content = a.Content,
                        Type = a.Type,
                        Priority = a.Priority,
                        IsActive = a.IsActive,
                        IsPinned = a.IsPinned,
                        PublishDate = a.PublishDate,
                        ExpiryDate = a.ExpiryDate,
                        ViewCount = a.ViewCount,
                        TargetAudience = a.TargetAudience,
                        CreatedAt = a.CreatedAt,
                        CreatedByName = a.CreatedByName,
                        ModifiedAt = a.ModifiedAt,
                        ModifiedByName = a.ModifiedByName
                    })
                    .ToListAsync();

                return Json(new { data = announcements });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching announcements");
                return Json(new { error = "Failed to load announcements" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveAnnouncements()
        {
            try
            {
                var currentDate = DateTime.Now;
                var userRole = User.IsInRole("Admin") ? "Admins" : "Students";

                var announcements = await _context.Announcements
                    .Where(a => a.DeletedAt == null 
                        && a.IsActive 
                        && (a.PublishDate == null || a.PublishDate <= currentDate)
                        && (a.ExpiryDate == null || a.ExpiryDate >= currentDate)
                        && (a.TargetAudience == "All" || a.TargetAudience == userRole))
                    .OrderByDescending(a => a.IsPinned)
                    .ThenByDescending(a => a.Priority == "High")
                    .ThenByDescending(a => a.CreatedAt)
                    .Take(5)
                    .Select(a => new
                    {
                        Id = a.Id,
                        Title = a.Title,
                        Content = a.Content,
                        Type = a.Type,
                        Priority = a.Priority,
                        IsPinned = a.IsPinned,
                        PublishDate = a.PublishDate,
                        CreatedAt = a.CreatedAt,
                        CreatedByName = a.CreatedByName
                    })
                    .ToListAsync();

                return Json(new { data = announcements });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching active announcements");
                return Json(new { error = "Failed to load announcements" });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAnnouncement(int id)
        {
            try
            {
                var announcement = await _context.Announcements
                    .Where(a => a.Id == id && a.DeletedAt == null)
                    .Select(a => new
                    {
                        Id = a.Id,
                        Title = a.Title,
                        Content = a.Content,
                        Type = a.Type,
                        Priority = a.Priority,
                        IsActive = a.IsActive,
                        IsPinned = a.IsPinned,
                        PublishDate = a.PublishDate,
                        ExpiryDate = a.ExpiryDate,
                        TargetAudience = a.TargetAudience
                    })
                    .FirstOrDefaultAsync();

                if (announcement == null)
                    return NotFound(new { message = "Announcement not found" });

                return Json(announcement);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching announcement {Id}", id);
                return Json(new { error = "Failed to load announcement" });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] Announcement model)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(model.Title) || string.IsNullOrWhiteSpace(model.Content))
                {
                    return Json(ResponseHelper.Failed("Title and Content are required"));
                }

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                var announcement = new Announcement
                {
                    Title = model.Title,
                    Content = model.Content,
                    Type = model.Type,
                    Priority = model.Priority,
                    IsActive = model.IsActive,
                    IsPinned = model.IsPinned,
                    PublishDate = model.PublishDate,
                    ExpiryDate = model.ExpiryDate,
                    TargetAudience = model.TargetAudience,
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
                };

                _context.Announcements.Add(announcement);
                await _context.SaveChangesAsync();

                await _auditService.LogCreateAsync(
                    "Announcement",
                    announcement.Id.ToString(),
                    new { announcement.Title, announcement.Content, announcement.Type }
                );

                return Json(ResponseHelper.Success("Announcement created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating announcement");
                return Json(ResponseHelper.Error("Failed to create announcement"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] Announcement model)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(model.Title) || string.IsNullOrWhiteSpace(model.Content))
                {
                    return Json(ResponseHelper.Failed("Title and Content are required"));
                }

                var announcement = await _context.Announcements
                    .FirstOrDefaultAsync(a => a.Id == model.Id && a.DeletedAt == null);

                if (announcement == null)
                    return Json(ResponseHelper.Failed("Announcement not found"));

                var oldValues = new
                {
                    announcement.Title,
                    announcement.Content,
                    announcement.Type,
                    announcement.Priority
                };

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                announcement.Title = model.Title;
                announcement.Content = model.Content;
                announcement.Type = model.Type;
                announcement.Priority = model.Priority;
                announcement.IsActive = model.IsActive;
                announcement.IsPinned = model.IsPinned;
                announcement.PublishDate = model.PublishDate;
                announcement.ExpiryDate = model.ExpiryDate;
                announcement.TargetAudience = model.TargetAudience;
                announcement.ModifiedBy = currentUserId ?? "";
                announcement.ModifiedByName = currentUserName;
                announcement.ModifiedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await _auditService.LogUpdateAsync(
                    "Announcement",
                    announcement.Id.ToString(),
                    oldValues,
                    new { announcement.Title, announcement.Content, announcement.Type, announcement.Priority }
                );

                return Json(ResponseHelper.Success("Announcement updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating announcement");
                return Json(ResponseHelper.Error("Failed to update announcement"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var announcement = await _context.Announcements
                    .FirstOrDefaultAsync(a => a.Id == id && a.DeletedAt == null);

                if (announcement == null)
                    return Json(ResponseHelper.Failed("Announcement not found"));

                var oldValues = new
                {
                    announcement.Id,
                    announcement.Title,
                    announcement.Content
                };

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                announcement.DeletedBy = currentUserId;
                announcement.DeletedByName = currentUserName;
                announcement.DeletedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await _auditService.LogDeleteAsync(
                    "Announcement",
                    announcement.Id.ToString(),
                    oldValues
                );

                return Json(ResponseHelper.Success("Announcement deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting announcement");
                return Json(ResponseHelper.Error("Failed to delete announcement"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            try
            {
                var announcement = await _context.Announcements
                    .FirstOrDefaultAsync(a => a.Id == id && a.DeletedAt == null);

                if (announcement == null)
                    return Json(ResponseHelper.Failed("Announcement not found"));

                announcement.IsActive = !announcement.IsActive;

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                announcement.ModifiedBy = currentUserId ?? "";
                announcement.ModifiedByName = currentUserName;
                announcement.ModifiedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await _auditService.LogUpdateAsync(
                    "Announcement",
                    announcement.Id.ToString(),
                    new { IsActive = !announcement.IsActive },
                    new { IsActive = announcement.IsActive }
                );

                var statusText = announcement.IsActive ? "activated" : "deactivated";
                return Json(ResponseHelper.Success($"Announcement {statusText} successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling announcement status");
                return Json(ResponseHelper.Error("Failed to toggle status"));
            }
        }
    }
}
