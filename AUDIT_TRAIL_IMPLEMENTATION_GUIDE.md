# Audit Trail / Activity Logs Implementation Guide

## Overview
This implementation provides a comprehensive audit trail system that tracks all user activities including:
- Authentication (Login/Logout)
- User Management (Create, Update, Delete)
- Page Views
- Custom Actions

## Files Created/Modified

### Models
1. **StudyConnect\Models\AuditLog.cs** - Main audit log entity

### Services
1. **StudyConnect\Services\IAuditService.cs** - Service interface
2. **StudyConnect\Services\AuditService.cs** - Service implementation

### Controllers
1. **StudyConnect\Controllers\AuditLogsController.cs** - View audit logs
2. **StudyConnect\Controllers\AuthController.cs** - Modified to log authentication
3. **StudyConnect\Controllers\UsersController.cs** - Modified to log user CRUD operations

### Views
1. **StudyConnect\Views\AuditLogs\Index.cshtml** - Audit logs page with DataTables

### Database
1. **StudyConnect\Data\AppDbContext.cs** - Added AuditLogs DbSet
2. **StudyConnect\Migrations\20250122000000_AddAuditLogTable.cs** - Migration file

### Configuration
1. **StudyConnect\Program.cs** - Registered services

## Setup Instructions

### Step 1: Apply Database Migration
Run the following command in the terminal from the StudyConnect project directory:

```bash
dotnet ef database update
```

If you encounter issues, you can manually run the migration SQL or recreate the table:

```sql
CREATE TABLE `AuditLogs` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` longtext CHARACTER SET utf8mb4 NULL,
    `UserName` longtext CHARACTER SET utf8mb4 NULL,
    `Action` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `EntityName` varchar(200) CHARACTER SET utf8mb4 NULL,
    `EntityId` longtext CHARACTER SET utf8mb4 NULL,
    `OldValues` longtext CHARACTER SET utf8mb4 NULL,
    `NewValues` longtext CHARACTER SET utf8mb4 NULL,
    `IpAddress` varchar(200) CHARACTER SET utf8mb4 NULL,
    `UserAgent` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Timestamp` datetime(6) NOT NULL,
    `AdditionalInfo` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_AuditLogs` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_AuditLogs_Timestamp` ON `AuditLogs` (`Timestamp`);
CREATE INDEX `IX_AuditLogs_UserId` ON `AuditLogs` (`UserId`(255));
CREATE INDEX `IX_AuditLogs_Action` ON `AuditLogs` (`Action`);
```

### Step 2: Test the Implementation
1. **Build the project**: `dotnet build`
2. **Run the application**: `dotnet run` or F5 in Visual Studio
3. **Access Audit Logs**: Navigate to `/AuditLogs` or `/AuditLogs/Index`

## Features

### Audit Service Methods

#### Basic Logging
```csharp
await _auditService.LogAsync(
 action: "Action Name",
  entityName: "EntityType",
    entityId: "12345",
    oldValues: oldObject,
    newValues: newObject,
    additionalInfo: "Extra information"
);
```

#### Authentication Logging
```csharp
// Login
await _auditService.LogLoginAsync(userName, success: true);

// Logout
await _auditService.LogLogoutAsync(userName);
```

#### CRUD Operations
```csharp
// Create
await _auditService.LogCreateAsync("User", userId, newValues);

// Update
await _auditService.LogUpdateAsync("User", userId, oldValues, newValues);

// Delete
await _auditService.LogDeleteAsync("User", userId, oldValues);
```

#### Custom Actions
```csharp
await _auditService.LogCustomActionAsync("Viewed Dashboard", "Additional context");
```

### Audit Log View Features
1. **Server-side DataTables** - Efficient pagination and searching
2. **Detailed View Modal** - Shows complete audit information including:
   - User information
   - Action performed
   - Entity details
   - Old and new values (formatted JSON)
   - IP Address and User Agent
   - Timestamp
3. **Search and Filter** - Search across all fields
4. **Sorting** - Sort by any column
5. **Responsive Design** - Works on all devices

## Adding Audit Logging to Other Controllers

### Example 1: Log Custom Action
```csharp
public class YourController : Controller
{
    private readonly IAuditService _auditService;

    public YourController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    public async Task<IActionResult> YourAction()
    {
        await _auditService.LogCustomActionAsync("Viewed Your Page");
        return View();
    }
}
```

### Example 2: Log CRUD Operations
```csharp
[HttpPost]
public async Task<IActionResult> Create(YourModel model)
{
 // Create logic here
    
    var newValues = new
    {
        model.Name,
  model.Description,
        model.Status
    };
    
    await _auditService.LogCreateAsync("YourEntity", model.Id, newValues);
    
    return RedirectToAction("Index");
}

[HttpPost]
public async Task<IActionResult> Update(YourModel model)
{
    var oldEntity = await _context.YourEntities.FindAsync(model.Id);
    
    var oldValues = new
    {
        oldEntity.Name,
  oldEntity.Description,
      oldEntity.Status
    };
    
  // Update logic here
    
    var newValues = new
    {
        model.Name,
        model.Description,
  model.Status
    };
  
    await _auditService.LogUpdateAsync("YourEntity", model.Id, oldValues, newValues);
    
    return RedirectToAction("Index");
}

[HttpPost]
public async Task<IActionResult> Delete(string id)
{
    var entity = await _context.YourEntities.FindAsync(id);
 
    var oldValues = new
    {
        entity.Name,
    entity.Description,
        entity.Status
    };
    
    // Delete logic here
    
    await _auditService.LogDeleteAsync("YourEntity", id, oldValues);
    
    return RedirectToAction("Index");
}
```

## Navigation Menu Integration

Add this to your navigation menu (e.g., `_LeftSidebar.cshtml` or `_NavBar.cshtml`):

```html
<li class="nav-item">
    <a class="nav-link" asp-controller="AuditLogs" asp-action="Index">
        <i class="ti ti-file-analytics"></i>
     <span class="hide-menu">Audit Logs</span>
    </a>
</li>
```

## Data Captured

The audit system captures:
- **UserId**: ID of the user performing the action
- **UserName**: Full name of the user
- **Action**: Description of the action (e.g., "User Login Success", "Create", "Update", "Delete")
- **EntityName**: Type of entity affected (e.g., "User", "Product")
- **EntityId**: ID of the affected entity
- **OldValues**: JSON of values before the change
- **NewValues**: JSON of values after the change
- **IpAddress**: IP address of the user
- **UserAgent**: Browser/device information
- **Timestamp**: UTC timestamp of the action
- **AdditionalInfo**: Optional additional context

## Security Considerations

1. **Sensitive Data**: Be careful not to log sensitive information (passwords, credit cards, etc.)
2. **Access Control**: Add `[Authorize(Roles = "Admin")]` to AuditLogsController if only admins should view logs
3. **Data Retention**: Consider implementing a data retention policy to automatically delete old logs

Example:
```csharp
// In your cleanup job or scheduled task
var cutoffDate = DateTime.UtcNow.AddMonths(-6); // Keep last 6 months
var oldLogs = _context.AuditLogs.Where(a => a.Timestamp < cutoffDate);
_context.AuditLogs.RemoveRange(oldLogs);
await _context.SaveChangesAsync();
```

## Troubleshooting

### Migration Issues
If `dotnet ef database update` fails:
1. Make sure you're in the correct directory (StudyConnect project folder)
2. Verify the connection string in `appsettings.json`
3. Check if the database server is running
4. Try running the SQL script manually

### Service Not Found
If you get "IAuditService not registered" error:
- Make sure `builder.Services.AddScoped<IAuditService, AuditService>();` is in `Program.cs`
- Make sure `builder.Services.AddHttpContextAccessor();` is registered
- Rebuild the solution

### DataTables Not Loading
If the audit logs table doesn't load:
1. Check browser console for JavaScript errors
2. Verify the route is correct (`/AuditLogs/GetAuditLogs`)
3. Check if data is being returned by navigating directly to the endpoint

## Future Enhancements

Consider adding:
1. **Export functionality** - Export logs to CSV/Excel
2. **Advanced filtering** - Filter by date range, user, action type
3. **Dashboard widgets** - Show recent activity, most active users
4. **Real-time notifications** - Alert admins of critical actions
5. **Audit log viewer for specific entities** - Show audit history for a specific user or record

## Conclusion

You now have a complete audit trail system that tracks all user activities in your application. The system is extensible and can be easily integrated into any controller or service.
