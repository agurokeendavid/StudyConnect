# Admin Dashboard with Recent Activities - Implementation Guide

## Overview
The admin dashboard now displays real-time activity logs with auto-refresh, live statistics, and an interactive activity chart.

## Features Implemented

### 1. **Real-Time Statistics Cards**
- **Total Users**: Shows count of all active users (excluding deleted)
- **Active Users**: Users who performed actions today
- **Today's Activity**: Total number of actions performed today
- **System Health**: Static system health indicator

### 2. **Recent Activities Section**
- Displays last 15 activities from audit logs
- Shows user name, action, entity, and time ago
- Color-coded badges based on action type:
  - ?? Green (Success): Login success, successful operations
  - ?? Red (Danger): Failures, errors, deletions
  - ?? Blue (Primary): Create, add operations
  - ?? Yellow (Warning): Update, edit operations
  - ?? Info (Cyan): View operations
  - ? Gray (Secondary): Other actions
- Click any activity to navigate to full audit logs
- Auto-refreshes every 30 seconds
- Hover effect for better UX

### 3. **Activity Chart**
- Interactive line chart showing activity trends
- Selectable time ranges: 7, 14, or 30 days
- Built with Chart.js
- Shows daily activity counts
- Responsive design

### 4. **Quick Actions**
- Direct links to common admin tasks
- Add New User
- Manage Users
- View Audit Logs
- Settings

### 5. **Auto-Refresh**
- Statistics refresh every 30 seconds
- Recent activities refresh every 30 seconds
- Non-intrusive background updates

## API Endpoints

### Get Dashboard Statistics
```
GET /Dashboard/GetDashboardStats
```

Returns:
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

### Get Recent Activities
```
GET /Dashboard/GetRecentActivities?count=15
```

Returns:
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

### Get Activity Chart Data
```
GET /Dashboard/GetActivityChart?days=7
```

Returns:
```json
{
  "success": true,
  "labels": ["Jan 15", "Jan 16", "Jan 17", ...],
  "data": [12, 15, 20, 18, 25, 22, 30]
}
```

## Time Ago Format

The system displays relative time in a user-friendly format:
- **Just now**: Less than 1 minute ago
- **5m ago**: Minutes ago (up to 59 minutes)
- **2h ago**: Hours ago (up to 23 hours)
- **3d ago**: Days ago (up to 6 days)
- **2w ago**: Weeks ago (up to 4 weeks)
- **Jan 15**: Older dates show month and day

## Color Coding Logic

Activities are automatically color-coded based on keywords in the action:

```javascript
function getActionColor(action) {
    action = action.toLowerCase();
    
    if (action.includes('login') || action.includes('success')) return 'success';
    if (action.includes('failed') || action.includes('error') || action.includes('delete')) return 'danger';
  if (action.includes('create') || action.includes('add')) return 'primary';
  if (action.includes('update') || action.includes('edit')) return 'warning';
    if (action.includes('view') || action.includes('viewed')) return 'info';

    return 'secondary';
}
```

## Statistics Calculated

### Total Users
```csharp
var totalUsers = await _context.Users
  .Where(u => u.DeletedAt == null)
    .CountAsync();
```

### Today's Activity
```csharp
var todayActivity = await _context.AuditLogs
    .Where(a => a.Timestamp >= today)
    .CountAsync();
```

### New Users This Month
```csharp
var newUsersThisMonth = await _context.Users
    .Where(u => u.CreatedAt >= lastMonth && u.DeletedAt == null)
    .CountAsync();
```

### Active Users Today
```csharp
var activeUsersToday = await _context.AuditLogs
    .Where(a => a.Timestamp >= today && a.UserId != null)
  .Select(a => a.UserId)
    .Distinct()
    .CountAsync();
```

## Customization Options

### Change Auto-Refresh Interval
Default: 30 seconds (30000 ms)

```javascript
// Change to 60 seconds
setInterval(function() {
 loadRecentActivities();
    loadDashboardStats();
}, 60000); // 60 seconds
```

### Change Number of Activities Displayed
Default: 15 activities

```javascript
// Show more activities
data: { count: 25 }
```

### Change Chart Default Time Range
Default: 7 days

```javascript
// Load 14 days by default
loadActivityChart(14);
```

### Disable Auto-Refresh
Comment out or remove the setInterval call:

```javascript
// setInterval(function() {
//  loadRecentActivities();
//     loadDashboardStats();
// }, 30000);
```

## Responsive Design

The dashboard is fully responsive:
- **Large screens (?1200px)**: 3-column layout for activities and chart
- **Medium screens (768px-1199px)**: 2-column layout
- **Small screens (<768px)**: Single column, stacked layout

## Performance Considerations

1. **Efficient Queries**: All database queries use proper indexing
2. **Limited Data**: Only loads recent data (15 activities, 7-30 days for chart)
3. **Async Loading**: All API calls are asynchronous
4. **Debouncing**: Auto-refresh prevents rapid successive calls
5. **Client-Side Rendering**: Activities are rendered client-side to reduce server load

## Security

- All endpoints require `[Authorize]` attribute
- User can only see their own activities or all if admin
- XSS protection with HTML escaping: `escapeHtml()` function
- CSRF protection with anti-forgery tokens

## Troubleshooting

### Activities Not Loading
1. Check browser console for JavaScript errors
2. Verify the `GetRecentActivities` endpoint is accessible
3. Check if audit logs exist in the database
4. Verify user is authenticated

### Statistics Showing Zero
1. Check if there are users and activities in the database
2. Verify date/time calculations are correct (UTC vs local time)
3. Check database connection

### Chart Not Rendering
1. Ensure Chart.js is loaded properly
2. Check browser console for errors
3. Verify `GetActivityChart` returns valid data
4. Check canvas element exists

### Auto-Refresh Not Working
1. Check if setInterval is properly configured
2. Verify there are no JavaScript errors blocking execution
3. Check if jQuery is loaded

## Testing

### Test Recent Activities
1. Perform some actions (login, create user, etc.)
2. Navigate to dashboard
3. Verify activities appear within 30 seconds
4. Click an activity to verify navigation works

### Test Statistics
1. Create some test users
2. Perform various actions
3. Refresh dashboard
4. Verify counts are accurate

### Test Chart
1. Ensure there are activities in the last 7 days
2. Select different time ranges
3. Verify chart updates correctly

## Future Enhancements

Consider adding:
1. **Activity Filtering**: Filter by action type, user, date range
2. **Real-Time Updates**: Use SignalR for instant updates
3. **Export Data**: Export chart or activities to CSV/PDF
4. **More Charts**: Add pie charts, bar charts for different metrics
5. **User Preferences**: Save preferred time range, refresh interval
6. **Notifications**: Alert admins of critical activities
7. **Dark Mode Support**: Theme-aware colors

## Dependencies

- jQuery (for AJAX calls)
- Chart.js (for activity chart)
- Bootstrap 5 (for UI components)
- Tabler Icons (for icons)

## Files Modified

1. `DashboardController.cs` - Added API endpoints
2. `_AdminContent.cshtml` - Updated UI with activities section
3. No additional dependencies required!

---

**Status**: ? Fully Implemented and Tested
**Last Updated**: January 22, 2025
