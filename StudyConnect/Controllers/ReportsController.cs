using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize(Roles = "Admin")]
    public class ReportsController : Controller
    {
        private readonly ILogger<ReportsController> _logger;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public ReportsController(
            ILogger<ReportsController> logger,
            AppDbContext context,
            IAuditService auditService)
        {
            _logger = logger;
            _context = context;
            _auditService = auditService;
        }

        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Reports Page");
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetUserGrowthData()
        {
            try
            {
                var last30Days = DateTime.Now.Date.AddDays(-30);
                
                var userGrowth = await _context.Users
                    .Where(u => u.CreatedAt >= last30Days && u.DeletedAt == null)
                    .GroupBy(u => u.CreatedAt.Date)
                    .Select(g => new
                    {
                        date = g.Key,
                        count = g.Count()
                    })
                    .OrderBy(x => x.date)
                    .ToListAsync();

                return Json(new { success = true, data = userGrowth });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user growth data");
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetStudyGroupStats()
        {
            try
            {
                var totalGroups = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null)
                    .CountAsync();

                var approvedGroups = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null && sg.IsApproved)
                    .CountAsync();

                var pendingGroups = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null && !sg.IsApproved && !sg.IsRejected)
                    .CountAsync();

                var rejectedGroups = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null && sg.IsRejected)
                    .CountAsync();

                var categoryStats = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null)
                    .GroupBy(sg => sg.Category.Name)
                    .Select(g => new
                    {
                        category = g.Key,
                        count = g.Count()
                    })
                    .ToListAsync();

                return Json(new
                {
                    success = true,
                    data = new
                    {
                        totalGroups,
                        approvedGroups,
                        pendingGroups,
                        rejectedGroups,
                        categoryStats
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching study group stats");
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetActivityStats()
        {
            try
            {
                var last7Days = DateTime.Now.Date.AddDays(-7);

                var activityByDay = await _context.AuditLogs
                    .Where(a => a.Timestamp >= last7Days)
                    .GroupBy(a => a.Timestamp.Date)
                    .Select(g => new
                    {
                        date = g.Key,
                        count = g.Count()
                    })
                    .OrderBy(x => x.date)
                    .ToListAsync();

                var activityByAction = await _context.AuditLogs
                    .Where(a => a.Timestamp >= last7Days)
                    .GroupBy(a => a.Action)
                    .Select(g => new
                    {
                        action = g.Key,
                        count = g.Count()
                    })
                    .OrderByDescending(x => x.count)
                    .Take(10)
                    .ToListAsync();

                return Json(new
                {
                    success = true,
                    data = new
                    {
                        activityByDay,
                        activityByAction
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching activity stats");
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetSubscriptionStats()
        {
            try
            {
                var activeSubscriptions = await _context.UserSubscriptions
                    .Where(us => us.IsActive && us.DeletedAt == null)
                    .CountAsync();

                var expiredSubscriptions = await _context.UserSubscriptions
                    .Where(us => !us.IsActive && us.DeletedAt == null)
                    .CountAsync();

                var subscriptionsByPlan = await _context.UserSubscriptions
                    .Where(us => us.DeletedAt == null)
                    .GroupBy(us => us.Subscription.Name)
                    .Select(g => new
                    {
                        plan = g.Key,
                        count = g.Count()
                    })
                    .ToListAsync();

                var revenueByPlan = await _context.UserSubscriptions
                    .Where(us => us.DeletedAt == null)
                    .GroupBy(us => us.Subscription.Name)
                    .Select(g => new
                    {
                        plan = g.Key,
                        revenue = g.Sum(us => us.Subscription.Price)
                    })
                    .ToListAsync();

                return Json(new
                {
                    success = true,
                    data = new
                    {
                        activeSubscriptions,
                        expiredSubscriptions,
                        subscriptionsByPlan,
                        revenueByPlan
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching subscription stats");
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetResourceStats()
        {
            try
            {
                var totalResources = await _context.StudyGroupResources
                    .Where(r => r.DeletedAt == null)
                    .CountAsync();

                var totalDownloads = await _context.StudyGroupResources
                    .Where(r => r.DeletedAt == null)
                    .SumAsync(r => r.DownloadCount);

                var resourcesByType = await _context.StudyGroupResources
                    .Where(r => r.DeletedAt == null)
                    .GroupBy(r => r.FileType)
                    .Select(g => new
                    {
                        type = g.Key,
                        count = g.Count()
                    })
                    .ToListAsync();

                var topDownloadedResources = await _context.StudyGroupResources
                    .Where(r => r.DeletedAt == null)
                    .OrderByDescending(r => r.DownloadCount)
                    .Take(10)
                    .Select(r => new
                    {
                        title = r.Title,
                        downloads = r.DownloadCount,
                        fileType = r.FileType
                    })
                    .ToListAsync();

                return Json(new
                {
                    success = true,
                    data = new
                    {
                        totalResources,
                        totalDownloads,
                        resourcesByType,
                        topDownloadedResources
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching resource stats");
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetOverviewStats()
        {
            try
            {
                var totalUsers = await _context.Users
                    .Where(u => u.DeletedAt == null)
                    .CountAsync();

                var activeUsers = await _context.AuditLogs
                    .Where(a => a.Timestamp >= DateTime.Now.Date && a.UserId != null)
                    .Select(a => a.UserId)
                    .Distinct()
                    .CountAsync();

                var totalStudyGroups = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null)
                    .CountAsync();

                var totalResources = await _context.StudyGroupResources
                    .Where(r => r.DeletedAt == null)
                    .CountAsync();

                var totalMeetings = await _context.StudyGroupMeetings
                    .Where(m => m.DeletedAt == null && !m.IsCancelled)
                    .CountAsync();

                var totalSubscriptions = await _context.UserSubscriptions
                    .Where(us => us.IsActive && us.DeletedAt == null)
                    .CountAsync();

                var newUsersToday = await _context.Users
                    .Where(u => u.CreatedAt >= DateTime.Now.Date && u.DeletedAt == null)
                    .CountAsync();

                var newGroupsToday = await _context.StudyGroups
                    .Where(sg => sg.CreatedAt >= DateTime.Now.Date && sg.DeletedAt == null)
                    .CountAsync();

                return Json(new
                {
                    success = true,
                    data = new
                    {
                        totalUsers,
                        activeUsers,
                        totalStudyGroups,
                        totalResources,
                        totalMeetings,
                        totalSubscriptions,
                        newUsersToday,
                        newGroupsToday
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching overview stats");
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUserRoleDistribution()
        {
            try
            {
                var userRoles = await (from user in _context.Users
                                      join userRole in _context.UserRoles on user.Id equals userRole.UserId
                                      join role in _context.Roles on userRole.RoleId equals role.Id
                                      where user.DeletedAt == null
                                      group user by role.Name into g
                                      select new
                                      {
                                          role = g.Key,
                                          count = g.Count()
                                      }).ToListAsync();

                return Json(new { success = true, data = userRoles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user role distribution");
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMeetingStats()
        {
            try
            {
                var upcomingMeetings = await _context.StudyGroupMeetings
                    .Where(m => m.ScheduledStartTime >= DateTime.Now && !m.IsCancelled && m.DeletedAt == null)
                    .CountAsync();

                var completedMeetings = await _context.StudyGroupMeetings
                    .Where(m => m.ScheduledEndTime < DateTime.Now && !m.IsCancelled && m.DeletedAt == null)
                    .CountAsync();

                var cancelledMeetings = await _context.StudyGroupMeetings
                    .Where(m => m.IsCancelled && m.DeletedAt == null)
                    .CountAsync();

                var meetingsByMonth = await _context.StudyGroupMeetings
                    .Where(m => m.CreatedAt >= DateTime.Now.AddMonths(-6) && m.DeletedAt == null)
                    .GroupBy(m => new { m.ScheduledStartTime.Year, m.ScheduledStartTime.Month })
                    .Select(g => new
                    {
                        month = $"{g.Key.Year}-{g.Key.Month:D2}",
                        count = g.Count()
                    })
                    .OrderBy(x => x.month)
                    .ToListAsync();

                return Json(new
                {
                    success = true,
                    data = new
                    {
                        upcomingMeetings,
                        completedMeetings,
                        cancelledMeetings,
                        meetingsByMonth
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching meeting stats");
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}
