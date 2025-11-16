# Audit Trail - Quick Reference

## Common Logging Patterns

### 1. Log Page View
```csharp
public async Task<IActionResult> Index()
{
    await _auditService.LogCustomActionAsync("Viewed Dashboard");
    return View();
}
```

### 2. Log Create Action
```csharp
[HttpPost]
public async Task<IActionResult> Create(ProductModel model)
{
    // Create logic
    var product = new Product { Name = model.Name, Price = model.Price };
    _context.Products.Add(product);
    await _context.SaveChangesAsync();
    
    // Log it
    await _auditService.LogCreateAsync("Product", product.Id, new
    {
        product.Name,
        product.Price,
        product.Category
    });
    
    return RedirectToAction("Index");
}
```

### 3. Log Update Action
```csharp
[HttpPost]
public async Task<IActionResult> Update(ProductModel model)
{
    var oldProduct = await _context.Products.FindAsync(model.Id);
    
    // Store old values
 var oldValues = new
    {
        oldProduct.Name,
        oldProduct.Price,
        oldProduct.Category
    };
    
// Update logic
    oldProduct.Name = model.Name;
    oldProduct.Price = model.Price;
    await _context.SaveChangesAsync();
    
    // Store new values
    var newValues = new
{
      oldProduct.Name,
    oldProduct.Price,
   oldProduct.Category
    };
 
    // Log it
    await _auditService.LogUpdateAsync("Product", model.Id, oldValues, newValues);
 
    return RedirectToAction("Index");
}
```

### 4. Log Delete Action
```csharp
[HttpPost]
public async Task<IActionResult> Delete(string id)
{
    var product = await _context.Products.FindAsync(id);
    
    // Store values before delete
    var oldValues = new
    {
        product.Name,
    product.Price,
        product.Category
    };
    
// Delete logic
    _context.Products.Remove(product);
    await _context.SaveChangesAsync();
    
    // Log it
    await _auditService.LogDeleteAsync("Product", id, oldValues);
    
    return RedirectToAction("Index");
}
```

### 5. Log Custom Action with Details
```csharp
public async Task<IActionResult> ExportData()
{
    // Export logic
    var data = GetExportData();
    
    // Log it
    await _auditService.LogCustomActionAsync(
        "Exported Data", 
        $"Exported {data.Count} records"
    );
    
    return File(data, "application/csv", "export.csv");
}
```

### 6. Log Search/Filter Action
```csharp
public async Task<IActionResult> Search(string searchTerm)
{
    var results = await _context.Products
        .Where(p => p.Name.Contains(searchTerm))
    .ToListAsync();
    
    await _auditService.LogCustomActionAsync(
        "Searched Products", 
    $"Search term: '{searchTerm}', Results: {results.Count}"
    );
    
    return View(results);
}
```

### 7. Log Configuration Change
```csharp
[HttpPost]
public async Task<IActionResult> UpdateSettings(SettingsModel model)
{
    var oldSettings = await _context.Settings.FirstOrDefaultAsync();
    
    var oldValues = new
    {
        oldSettings.EmailNotifications,
    oldSettings.MaxLoginAttempts,
        oldSettings.SessionTimeout
    };
    
    oldSettings.EmailNotifications = model.EmailNotifications;
    oldSettings.MaxLoginAttempts = model.MaxLoginAttempts;
    await _context.SaveChangesAsync();
    
    var newValues = new
    {
    oldSettings.EmailNotifications,
        oldSettings.MaxLoginAttempts,
        oldSettings.SessionTimeout
    };
    
    await _auditService.LogUpdateAsync("Settings", "system", oldValues, newValues);
    
    return RedirectToAction("Index");
}
```

### 8. Log File Upload
```csharp
[HttpPost]
public async Task<IActionResult> UploadFile(IFormFile file)
{
    // Upload logic
    var fileName = await SaveFile(file);
    
    await _auditService.LogCustomActionAsync(
        "Uploaded File", 
        $"File: {file.FileName}, Size: {file.Length} bytes"
    );
    
  return Ok();
}
```

### 9. Log Bulk Action
```csharp
[HttpPost]
public async Task<IActionResult> DeleteSelected(List<string> ids)
{
 var products = await _context.Products
        .Where(p => ids.Contains(p.Id))
        .ToListAsync();
    
    _context.Products.RemoveRange(products);
    await _context.SaveChangesAsync();
    
    await _auditService.LogCustomActionAsync(
        "Bulk Delete Products", 
        $"Deleted {ids.Count} products: {string.Join(", ", ids)}"
    );
    
    return RedirectToAction("Index");
}
```

### 10. Log Status Change
```csharp
[HttpPost]
public async Task<IActionResult> ChangeStatus(string id, string newStatus)
{
    var order = await _context.Orders.FindAsync(id);
    var oldStatus = order.Status;
    
    order.Status = newStatus;
    await _context.SaveChangesAsync();
    
    await _auditService.LogUpdateAsync("Order", id, 
        new { Status = oldStatus }, 
        new { Status = newStatus }
    );
    
    return Ok();
}
```

## Action Names Convention

Use clear, descriptive action names:
- ? "Viewed Dashboard"
- ? "Exported User Data"
- ? "Changed Password"
- ? "Approved Request"
- ? "Action1"
- ? "Did something"

## Entity Names Convention

Use consistent entity names:
- ? "User"
- ? "Product"
- ? "Order"
- ? "Settings"
- ? "user_table"
- ? "tblProducts"

## When to Log

**DO Log:**
- Authentication attempts
- Data modifications (Create, Update, Delete)
- Configuration changes
- Access to sensitive data
- Administrative actions
- Bulk operations
- Status changes
- File uploads/downloads
- Export operations

**DON'T Log:**
- Regular page views (unless required)
- API health checks
- Static resource requests
- Frequent polling operations

## Performance Tips

1. **Fire and forget**: Audit logging is async, don't wait for it
2. **Batch logs**: Consider batching for high-frequency operations
3. **Index properly**: Ensure UserId and Timestamp are indexed
4. **Archive old logs**: Move old logs to archive tables

## Injection in Controllers

```csharp
public class YourController : Controller
{
    private readonly IAuditService _auditService;
    
    public YourController(IAuditService auditService)
    {
        _auditService = auditService;
    }
}
```

## Viewing Logs

1. Navigate to `/AuditLogs`
2. Use search to filter
3. Click "View Details" for complete information
4. Sort by any column
5. Adjust pagination as needed

## Sample SQL Queries

### Recent Activities
```sql
SELECT * FROM AuditLogs 
ORDER BY Timestamp DESC 
LIMIT 100;
```

### User Activity
```sql
SELECT * FROM AuditLogs 
WHERE UserId = 'user-id-here' 
ORDER BY Timestamp DESC;
```

### Failed Logins
```sql
SELECT * FROM AuditLogs 
WHERE Action LIKE '%Login Failed%' 
ORDER BY Timestamp DESC;
```

### Changes to Specific Entity
```sql
SELECT * FROM AuditLogs 
WHERE EntityName = 'User' AND EntityId = 'specific-user-id' 
ORDER BY Timestamp DESC;
```

---

**Remember**: Audit logging should be comprehensive but not intrusive. Log what matters for security, compliance, and debugging!
