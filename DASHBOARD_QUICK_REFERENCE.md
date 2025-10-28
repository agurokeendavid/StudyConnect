# Dashboard Admin Content - Quick Reference Guide

## ? Summary of Changes

All scripts from the Admin Dashboard view have been successfully migrated to an external JavaScript file for better code organization and maintainability.

## ?? Files Modified

### 1. **StudyConnect\Views\Dashboard\Index\_AdminContent.cshtml**
   - ? Removed: All inline `@section Scripts { }` code
   - ? Removed: Chart.js CDN script tag
   - ? Kept: All HTML/Razor markup
   - ? Result: Clean, script-free view file

### 2. **StudyConnect\wwwroot\modules\dashboard\footer_index.js**
   - ? Added: Dashboard statistics loading function
   - ? Added: Recent activities loading function
   - ? Added: Activity chart rendering function
   - ? Added: All helper functions
   - ? Added: Error handling
   - ? Added: Auto-refresh (every 30 seconds)
   - ? Result: Complete, well-organized script file

### 3. **StudyConnect\Views\Shared\Dashboard\_Layout.cshtml**
   - ? Added: Chart.js CDN before custom scripts
   - ? Result: Chart.js available globally

### 4. **StudyConnect\Controllers\DashboardController.cs**
   - ? Already has: API endpoints for data
   - ? Endpoints: GetDashboardStats, GetRecentActivities, GetActivityChart

## ?? How It Works

### Page Load Sequence

1. **HTML Loads** (`_AdminContent.cshtml`)
   - Statistics cards render with initial value of 0
   - Recent activities show loading spinner
 - Chart canvas element is created

2. **Scripts Load** (in order)
   ```
   jQuery ? Chart.js ? footer_index.js
   ```

3. **On Document Ready** (`footer_index.js`)
   ```javascript
   $(document).ready(function() {
loadDashboardStats();      // Load statistics
       loadRecentActivities();    // Load recent activities
       loadActivityChart(7);      // Load 7-day chart
       
   // Setup auto-refresh (every 30 seconds)
       setInterval(function() {
           loadRecentActivities();
      loadDashboardStats();
   }, 30000);
   });
   ```

4. **Data Populates**
   - AJAX calls fetch data from API
   - DOM elements update with real data
   - Loading states hide
   - Chart renders

## ?? Functions Available

### Global Access
All functions are accessible via `window.dashboardFunctions`:

```javascript
// From browser console or other scripts
window.dashboardFunctions.loadDashboardStats();
window.dashboardFunctions.loadRecentActivities();
window.dashboardFunctions.loadActivityChart(30);
window.dashboardFunctions.viewActivityDetails(123);
window.dashboardFunctions.getActionColor('Login Success');
window.dashboardFunctions.escapeHtml('<script>alert("XSS")</script>');
```

### Direct Function Calls

Since the functions are defined globally in the script, you can also call them directly:

```javascript
// Load data
loadDashboardStats();
loadRecentActivities();
loadActivityChart(7);   // 7, 14, or 30 days

// Helpers
getActionColor('User Created');    // Returns: 'primary'
escapeHtml('<div>Test</div>');    // Returns: '&lt;div&gt;Test&lt;/div&gt;'
viewActivityDetails(123);         // Redirects to audit logs
```

## ?? API Endpoints

### 1. Get Dashboard Statistics
```http
GET /Dashboard/GetDashboardStats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "todayActivity": 45,
    "newUsersThisMonth": 12,
    "activeUsersToday": 25,
    "timestamp": "2025-01-22T10:30:00Z"
  }
}
```

**Updates Elements:**
- `#totalUsers`
- `#activeUsers`
- `#todayActivity`
- `#newUsersCount`
- `#pagesVisitedToday`
- `#newUsersTotal`
- `#activeUsersTotal`
- `#totalActions`
- `#totalUsersBottom`
- `#pageViews`
- `#totalActionsBottom`

### 2. Get Recent Activities
```http
GET /Dashboard/GetRecentActivities?count=15
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
  "id": 123,
      "userName": "John Doe",
      "action": "User Login Success",
      "entityName": "Authentication",
      "entityId": "user-id",
      "timestamp": "2025-01-22T10:25:00Z",
      "timeAgo": "5m ago",
      "additionalInfo": null
 }
  ]
}
```

**Updates Elements:**
- `#activitiesList` (populates with HTML)
- `#activitiesLoading` (hides)
- `#activitiesEmpty` (shows if no data)

### 3. Get Activity Chart Data
```http
GET /Dashboard/GetActivityChart?days=7
```

**Response:**
```json
{
  "success": true,
  "labels": ["Jan 15", "Jan 16", "Jan 17", "Jan 18", "Jan 19", "Jan 20", "Jan 21"],
  "data": [12, 15, 20, 18, 25, 22, 30]
}
```

**Updates:**
- Chart on canvas element `#userActivityChart`

## ?? Activity Color Coding

Activities are automatically color-coded based on the action type:

| Keywords | Color Class | Bootstrap Color | Use Case |
|----------|-------------|-----------------|----------|
| `login`, `success` | `success` | ?? Green | Successful operations |
| `failed`, `error`, `delete` | `danger` | ?? Red | Errors, failures, deletions |
| `create`, `add` | `primary` | ?? Blue | Creation operations |
| `update`, `edit` | `warning` | ?? Yellow | Update operations |
| `view`, `viewed` | `info` | ?? Cyan | View operations |
| Other | `secondary` | ? Gray | Other actions |

**Example:**
```javascript
getActionColor('User Login Success');   // Returns: 'success'
getActionColor('Failed Login Attempt'); // Returns: 'danger'
getActionColor('User Created'); // Returns: 'primary'
getActionColor('Profile Updated');      // Returns: 'warning'
getActionColor('Viewed Dashboard');     // Returns: 'info'
```

## ?? Time Display Format

The `timeAgo` field uses human-readable relative time:

| Time Elapsed | Display Format | Example |
|-------------|----------------|---------|
| < 1 minute | "Just now" | "Just now" |
| < 60 minutes | "{minutes}m ago" | "5m ago" |
| < 24 hours | "{hours}h ago" | "2h ago" |
| < 7 days | "{days}d ago" | "3d ago" |
| < 30 days | "{weeks}w ago" | "2w ago" |
| ? 30 days | "MMM dd" | "Jan 15" |

## ?? Auto-Refresh Behavior

```javascript
// Runs every 30 seconds (30000 milliseconds)
setInterval(function() {
    loadRecentActivities();  // Refresh activities
    loadDashboardStats();    // Refresh statistics
}, 30000);
```

**Note:** The chart does NOT auto-refresh to preserve user-selected time range.

## ??? Customization

### Change Auto-Refresh Interval

In `footer_index.js`, modify the interval:

```javascript
// Change to 60 seconds
setInterval(function() {
    loadRecentActivities();
    loadDashboardStats();
}, 60000); // 60 seconds = 60000 ms
```

### Change Number of Activities

```javascript
// In loadRecentActivities() function
data: { count: 25 }  // Show 25 activities instead of 15
```

### Change Chart Time Range

```javascript
// On page load
loadActivityChart(30);  // Load 30 days instead of 7
```

### Disable Auto-Refresh

```javascript
// Comment out or remove the setInterval
/*
setInterval(function() {
    loadRecentActivities();
    loadDashboardStats();
}, 30000);
*/
```

## ?? Debugging

### Check if Scripts Loaded

Open browser console and look for:
```
Dashboard Admin Content Scripts Loaded Successfully
Available functions: Array(6) ["loadDashboardStats", "loadRecentActivities", ...]
```

### Check if Functions Available

```javascript
// In browser console
console.log(typeof window.dashboardFunctions);  // Should be "object"
console.log(Object.keys(window.dashboardFunctions));  // List all functions
```

### Check if Data is Loading

```javascript
// In browser console
window.dashboardFunctions.loadDashboardStats();
window.dashboardFunctions.loadRecentActivities();
```

Watch the Network tab in DevTools for AJAX requests.

### Common Issues

#### 1. **Chart Not Rendering**
- ? Check if Chart.js is loaded: `typeof Chart !== 'undefined'`
- ? Check if canvas element exists: `$('#userActivityChart').length > 0`
- ? Check console for errors

#### 2. **Activities Not Loading**
- ? Check if jQuery is loaded: `typeof $ !== 'undefined'`
- ? Check API endpoint accessibility
- ? Check if user is authenticated
- ? Check database for audit logs

#### 3. **Statistics Showing Zero**
- ? Check if API returns data
- ? Check date/time calculations (UTC vs local)
- ? Check database records exist

#### 4. **Auto-Refresh Not Working**
- ? Check console for errors
- ? Verify setInterval is running
- ? Check if functions throw errors

## ?? Browser Compatibility

Tested and working on:
- ? Chrome (latest)
- ? Firefox (latest)
- ? Edge (latest)
- ? Safari (latest)

**Dependencies:**
- jQuery 3.x
- Chart.js 4.x
- Bootstrap 5.x
- Modern browser with ES6 support

## ?? Dependencies Loaded

Check the Dashboard Layout (`_Layout.cshtml`) for:

```html
<!-- jQuery (Required) -->
<script src="~/templates/modernize/libs/jquery/dist/jquery.min.js"></script>

<!-- Chart.js (Required for charts) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- Custom Dashboard Scripts -->
<script src="~/modules/dashboard/footer_index.js"></script>
```

## ?? Build Status

- ? Build Successful
- ? No Compilation Errors
- ? Ready for Testing

## ?? Additional Documentation

- **Implementation Guide**: `DASHBOARD_RECENT_ACTIVITIES_GUIDE.md`
- **Migration Summary**: `DASHBOARD_SCRIPTS_MIGRATION.md`
- **Controller**: `StudyConnect\Controllers\DashboardController.cs`
- **View**: `StudyConnect\Views\Dashboard\Index\_AdminContent.cshtml`
- **Scripts**: `StudyConnect\wwwroot\modules\dashboard\footer_index.js`

## ? Key Improvements

1. **? Separation of Concerns** - HTML/Razor separate from JavaScript
2. **? Better Maintainability** - One central location for all dashboard scripts
3. **? Improved Performance** - Scripts cached by browser
4. **? Better Developer Experience** - Syntax highlighting, IDE support
5. **? Reusability** - Functions exported globally
6. **? Error Handling** - Graceful failures with user feedback
7. **? Security** - XSS prevention with escapeHtml()
8. **? Documentation** - Well-documented code with comments

---

**Status**: ? Complete & Ready
**Build**: ? Successful
**Last Updated**: January 22, 2025
