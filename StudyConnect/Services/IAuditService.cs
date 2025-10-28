namespace StudyConnect.Services;

public interface IAuditService
{
    Task LogAsync(string action, string? entityName = null, string? entityId = null, 
        object? oldValues = null, object? newValues = null, string? additionalInfo = null);
        
    Task LogLoginAsync(string userName, bool success);
    
    Task LogLogoutAsync(string userName);
    
    Task LogCreateAsync(string entityName, string entityId, object newValues);
    
    Task LogUpdateAsync(string entityName, string entityId, object oldValues, object newValues);
    
    Task LogDeleteAsync(string entityName, string entityId, object oldValues);
    
    Task LogCustomActionAsync(string action, string? additionalInfo = null);
}
