using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Controllers;

[Authorize]
public class AuditLogsController : Controller
{
    private readonly ILogger<AuditLogsController> _logger;
    private readonly AppDbContext _context;
    private readonly IAuditService _auditService;

    public AuditLogsController(
   ILogger<AuditLogsController> logger,
        AppDbContext context,
 IAuditService auditService)
    {
        _logger = logger;
        _context = context;
        _auditService = auditService;
    }

    public async Task<IActionResult> Index()
    {
        await _auditService.LogCustomActionAsync("Viewed Audit Logs Page");
        return View();
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
          int draw,
       int start,
          int length,
          string? searchValue = null,
        string? sortColumn = null,
          string? sortDirection = null)
    {
        try
        {
            var query = _context.AuditLogs.AsQueryable();

            // Search
            if (!string.IsNullOrWhiteSpace(searchValue))
            {
                query = query.Where(a =>
                (a.UserName != null && a.UserName.Contains(searchValue)) ||
                         a.Action.Contains(searchValue) ||
                        (a.EntityName != null && a.EntityName.Contains(searchValue)) ||
                         (a.EntityId != null && a.EntityId.Contains(searchValue)));
            }

            // Total records count
            var totalRecords = await _context.AuditLogs.CountAsync();
            var filteredRecords = await query.CountAsync();

            // Sorting
            sortColumn = sortColumn ?? "Timestamp";
            sortDirection = sortDirection ?? "desc";

            query = sortColumn.ToLower() switch
            {
                "username" => sortDirection == "asc"
             ? query.OrderBy(a => a.UserName)
                 : query.OrderByDescending(a => a.UserName),
                "action" => sortDirection == "asc"
                       ? query.OrderBy(a => a.Action)
                       : query.OrderByDescending(a => a.Action),
                "entityname" => sortDirection == "asc"
             ? query.OrderBy(a => a.EntityName)
              : query.OrderByDescending(a => a.EntityName),
                "ipaddress" => sortDirection == "asc"
             ? query.OrderBy(a => a.IpAddress)
               : query.OrderByDescending(a => a.IpAddress),
                _ => sortDirection == "asc"
                     ? query.OrderBy(a => a.Timestamp)
               : query.OrderByDescending(a => a.Timestamp)
            };

            // Pagination
            var logs = await query
    .Skip(start)
         .Take(length)
 .Select(a => new
 {
     id = a.Id,
     userId = a.UserId,
     userName = a.UserName ?? "Anonymous",
     action = a.Action,
     entityName = a.EntityName ?? "-",
     entityId = a.EntityId ?? "-",
     ipAddress = a.IpAddress ?? "-",
     timestamp = a.Timestamp.ToString("MM/dd/yyyy hh:mm:ss tt"),
     additionalInfo = a.AdditionalInfo ?? "-"
 })
  .ToListAsync();

            return Json(new
            {
                draw = draw,
                recordsTotal = totalRecords,
                recordsFiltered = filteredRecords,
                data = logs
            });
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, exception.Message);
            return Json(new
            {
                draw = draw,
                recordsTotal = 0,
                recordsFiltered = 0,
                data = new List<object>()
            });
        }
    }

    [HttpGet]
    public async Task<IActionResult> Details(int id)
    {
        try
        {
            var log = await _context.AuditLogs.FindAsync(id);

            if (log == null)
            {
                return NotFound();
            }

            await _auditService.LogCustomActionAsync($"Viewed Audit Log Details (ID: {id})");

            var details = new
            {
                id = log.Id,
                userId = log.UserId,
                userName = log.UserName ?? "Anonymous",
                action = log.Action,
                entityName = log.EntityName ?? "-",
                entityId = log.EntityId ?? "-",
                oldValues = log.OldValues ?? "-",
                newValues = log.NewValues ?? "-",
                ipAddress = log.IpAddress ?? "-",
                userAgent = log.UserAgent ?? "-",
                timestamp = log.Timestamp.ToString("MM/dd/yyyy hh:mm:ss tt"),
                additionalInfo = log.AdditionalInfo ?? "-"
            };

            return Json(details);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, exception.Message);
            return NotFound();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetUserActivities(string userId)
    {
        try
        {
            var logs = await _context.AuditLogs
                          .Where(a => a.UserId == userId)
                 .OrderByDescending(a => a.Timestamp)
               .Take(50)
                          .Select(a => new
                          {
                              action = a.Action,
                              entityName = a.EntityName ?? "-",
                              timestamp = a.Timestamp.ToString("MM/dd/yyyy hh:mm:ss tt")
                          })
            .ToListAsync();

            return Json(new { data = logs });
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, exception.Message);
            return Json(new { data = new List<object>() });
        }
    }

    public async Task<IActionResult> MyActivityLogs()
    {
        await _auditService.LogCustomActionAsync("Viewed My Activity Logs Page");
        return View();
    }

    [HttpGet]
    public async Task<IActionResult> GetMyActivityLogs(
          int draw,
       int start,
      int length,
       string? searchValue = null,
   string? sortColumn = null,
          string? sortDirection = null)
    {
        try
        {
            // Get current user ID
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Json(new
                {
                    draw = draw,
                    recordsTotal = 0,
                    recordsFiltered = 0,
                    data = new List<object>()
                });
            }

            var query = _context.AuditLogs
         .Where(a => a.UserId == userId);

            // Search
            if (!string.IsNullOrWhiteSpace(searchValue))
            {
                query = query.Where(a =>
               a.Action.Contains(searchValue) ||
         (a.EntityName != null && a.EntityName.Contains(searchValue)) ||
   (a.EntityId != null && a.EntityId.Contains(searchValue)));
            }

            // Total records count for current user
            var totalRecords = await _context.AuditLogs
            .Where(a => a.UserId == userId)
                .CountAsync();
            var filteredRecords = await query.CountAsync();

            // Sorting
            sortColumn = sortColumn ?? "Timestamp";
            sortDirection = sortDirection ?? "desc";

            query = sortColumn.ToLower() switch
            {
                "action" => sortDirection == "asc"
                 ? query.OrderBy(a => a.Action)
                   : query.OrderByDescending(a => a.Action),
                "entityname" => sortDirection == "asc"
                ? query.OrderBy(a => a.EntityName)
                           : query.OrderByDescending(a => a.EntityName),
                "ipaddress" => sortDirection == "asc"
                ? query.OrderBy(a => a.IpAddress)
                  : query.OrderByDescending(a => a.IpAddress),
                _ => sortDirection == "asc"
                    ? query.OrderBy(a => a.Timestamp)
              : query.OrderByDescending(a => a.Timestamp)
            };

            // Pagination
            var logs = await query
        .Skip(start)
             .Take(length)
     .Select(a => new
     {
         id = a.Id,
         action = a.Action,
         entityName = a.EntityName ?? "-",
         entityId = a.EntityId ?? "-",
         ipAddress = a.IpAddress ?? "-",
         timestamp = a.Timestamp.ToString("MM/dd/yyyy hh:mm:ss tt"),
         additionalInfo = a.AdditionalInfo ?? "-"
     })
      .ToListAsync();

            return Json(new
            {
                draw = draw,
                recordsTotal = totalRecords,
                recordsFiltered = filteredRecords,
                data = logs
            });
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, exception.Message);
            return Json(new
            {
                draw = draw,
                recordsTotal = 0,
                recordsFiltered = 0,
                data = new List<object>()
            });
        }
    }
}
