using Microsoft.AspNetCore.Identity;
using StudyConnect.Data;
using StudyConnect.Models;
using System.Text.Json;

namespace StudyConnect.Services;

public class AuditService : IAuditService
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(
     AppDbContext context,
    UserManager<ApplicationUser> userManager,
 IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _userManager = userManager;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string action, string? entityName = null, string? entityId = null,
   object? oldValues = null, object? newValues = null, string? additionalInfo = null)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return;

            var userId = httpContext.User?.Identity?.Name;
            ApplicationUser? user = null;

            if (!string.IsNullOrEmpty(userId))
            {
                user = await _userManager.FindByNameAsync(userId);
            }

            var auditLog = new AuditLog
            {
                UserId = user?.Id,
                UserName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Anonymous",
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
                NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
                IpAddress = httpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = httpContext.Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.Now,
                AdditionalInfo = additionalInfo
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Log to file or error tracking service if needed
            // Don't throw exception to prevent breaking the main functionality
        }
    }

    public async Task LogLoginAsync(string userName, bool success)
    {
        var action = success ? "User Login Success" : "User Login Failed";
        await LogAsync(action, "Authentication", userName, additionalInfo: success ? "Login successful" : "Login failed");
    }

    public async Task LogLogoutAsync(string userName)
    {
        await LogAsync("User Logout", "Authentication", userName);
    }

    public async Task LogCreateAsync(string entityName, string entityId, object newValues)
    {
        await LogAsync("Create", entityName, entityId, newValues: newValues);
    }

    public async Task LogUpdateAsync(string entityName, string entityId, object oldValues, object newValues)
    {
        await LogAsync("Update", entityName, entityId, oldValues, newValues);
    }

    public async Task LogDeleteAsync(string entityName, string entityId, object oldValues)
    {
        await LogAsync("Delete", entityName, entityId, oldValues: oldValues);
    }

    public async Task LogCustomActionAsync(string action, string? additionalInfo = null)
    {
        await LogAsync(action, additionalInfo: additionalInfo);
    }
}
