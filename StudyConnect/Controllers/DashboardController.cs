using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Controllers;

[Authorize]
public class DashboardController : Controller
{
    private readonly ILogger<DashboardController> _logger;
    private readonly AppDbContext _context;
    private readonly IAuditService _auditService;
    private readonly ISubscriptionService _subscriptionService;
        
    public DashboardController(
        ILogger<DashboardController> logger,
        AppDbContext context,
        IAuditService auditService,
        ISubscriptionService subscriptionService)
    {
        _logger = logger;
        _context = context;
        _auditService = auditService;
        _subscriptionService = subscriptionService;
    }
    
    public async Task<ViewResult> Index()
    {
        await _auditService.LogCustomActionAsync("Viewed Dashboard");
        
        // Check if user is on free trial for displaying ads
        if (User.IsInRole("Student"))
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                var activeSubscription = await _subscriptionService.GetActiveSubscriptionAsync(userId);
                ViewBag.IsFreeTrial = activeSubscription?.Subscription?.Name == "Free Trial";
            }
        }
        
        return View();
    }

    [HttpGet]
    public async Task<IActionResult> GetRecentActivities(int count = 10)
    {
        try
        {
            var activities = await _context.AuditLogs
                .OrderByDescending(a => a.Timestamp)
                .Take(count)
                .Select(a => new
                {
                    id = a.Id,
                    userName = a.UserName ?? "System",
                    action = a.Action,
                    entityName = a.EntityName ?? "-",
                    entityId = a.EntityId ?? "-",
                    timestamp = a.Timestamp,
                    timeAgo = GetTimeAgo(a.Timestamp),
                    additionalInfo = a.AdditionalInfo
                })
                .ToListAsync();

            return Json(new { success = true, data = activities });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching recent activities");
            return Json(new { success = false, message = "Error loading activities" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboardStats()
    {
        try
        {
            var now = DateTime.Now;
            var today = now.Date;
            var yesterday = today.AddDays(-1);
            var lastMonth = now.AddMonths(-1);

            // Total users (excluding deleted)
            var totalUsers = await _context.Users
                .Where(u => u.DeletedAt == null)
                .CountAsync();

            // Today's activity count
            var todayActivity = await _context.AuditLogs
                .Where(a => a.Timestamp >= today)
                .CountAsync();

            // New users this month
            var newUsersThisMonth = await _context.Users
                .Where(u => u.CreatedAt >= lastMonth && u.DeletedAt == null)
                .CountAsync();

            // Active users today (users who have activity today)
            var activeUsersToday = await _context.AuditLogs
                .Where(a => a.Timestamp >= today && a.UserId != null)
                .Select(a => a.UserId)
                .Distinct()
                .CountAsync();

            var stats = new
            {
                totalUsers,
                todayActivity,
                newUsersThisMonth,
                activeUsersToday,
                timestamp = DateTime.Now
            };

            return Json(new { success = true, data = stats });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard stats");
            return Json(new { success = false, message = "Error loading stats" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetActivityChart(int days = 7)
    {
        try
        {
            var startDate = DateTime.Now.Date.AddDays(-days);
            
            var activityData = await _context.AuditLogs
                .Where(a => a.Timestamp >= startDate)
                .GroupBy(a => a.Timestamp.Date)
                .Select(g => new
                {
                    date = g.Key,
                    count = g.Count()
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            var labels = activityData.Select(a => a.date.ToString("MMM dd")).ToList();
            var data = activityData.Select(a => a.count).ToList();

            return Json(new
            {
                success = true,
                    labels,
                    data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching activity chart data");
            return Json(new { success = false, message = "Error loading chart" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetActiveAds(string? position = null)
    {
        try
        {
            var now = DateTime.Now;
            var query = _context.Ads
                .Where(a => a.IsActive 
                    && a.DeletedAt == null
                    && a.StartDate <= now
                    && a.EndDate >= now);

            if (!string.IsNullOrEmpty(position))
            {
                query = query.Where(a => a.Position == position);
            }

            var ads = await query
                .OrderBy(a => Guid.NewGuid()) // Random order
                .Take(3)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.Description,
                    a.ImageUrl,
                    a.LinkUrl,
                    a.Position
                })
                .ToListAsync();

            return Json(new { success = true, data = ads });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching active ads");
            return Json(new { success = false, message = "Error loading ads" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> TrackAdView(int adId)
    {
        try
        {
            var ad = await _context.Ads.FindAsync(adId);
            if (ad != null)
            {
                ad.ViewCount++;
                await _context.SaveChangesAsync();
                return Json(new { success = true });
            }
            return Json(new { success = false });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error tracking ad view for ad {adId}");
            return Json(new { success = false });
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> TrackAdClick(int adId)
    {
        try
        {
            var ad = await _context.Ads.FindAsync(adId);
            if (ad != null)
            {
                ad.ClickCount++;
                await _context.SaveChangesAsync();
                await _auditService.LogCustomActionAsync($"Clicked on Ad: {ad.Title} (ID: {adId})");
                return Json(new { success = true });
            }
            return Json(new { success = false });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error tracking ad click for ad {adId}");
            return Json(new { success = false });
        }
    }

    private static string GetTimeAgo(DateTime timestamp)
    {
        var timeSpan = DateTime.Now - timestamp;

        if (timeSpan.TotalMinutes < 1)
            return "Just now";
        if (timeSpan.TotalMinutes < 60)
            return $"{(int)timeSpan.TotalMinutes}m ago";
        if (timeSpan.TotalHours < 24)
            return $"{(int)timeSpan.TotalHours}h ago";
        if (timeSpan.TotalDays < 7)
            return $"{(int)timeSpan.TotalDays}d ago";
        if (timeSpan.TotalDays < 30)
            return $"{(int)(timeSpan.TotalDays / 7)}w ago";
        
        return timestamp.ToString("MMM dd");
    }
}