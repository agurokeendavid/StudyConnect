# Ad Display Testing Guide

## Quick Testing Steps

### 1. Run the Application
```bash
# Start the application
dotnet run
```
The seed data will automatically create 5 sample ads in the database.

### 2. Test as Free Trial Student
1. **Login**:
   - Email: `student@studyconnect.local`
   - Password: `Qwerty123!`

2. **Navigate to Dashboard**
   - You should see ads in 3 locations:
     * Top banner (full-width gradient ad)
     * Sidebar (replacing Quick Actions)
     * Middle section (horizontal card ad)

3. **Test Ad Interactions**:
   - ? Ads should load automatically
   - ? Click any ad - it opens subscription page in new tab
   - ? View count increments (check in admin panel)
   - ? Click count increments (check in admin panel)

### 3. Test as Admin (No Ads)
1. **Login**:
   - Email: `administrator@studyconnect.ph`
   - Password: `Qwerty123!`

2. **Navigate to Dashboard**
   - ? No ads should be visible
   - ? Dashboard shows admin content

3. **Manage Ads**:
   - Navigate to **Ads Management**
   - View the 5 seeded ads
   - Check ViewCount and ClickCount columns
   - Edit/toggle/delete ads as needed

### 4. Test Premium User (No Ads)
To test Premium experience:

1. **Update Student to Premium** (in database):
```sql
-- Option 1: Update existing subscription
UPDATE UserSubscriptions 
SET SubscriptionId = (SELECT Id FROM Subscriptions WHERE Name = 'Premium'),
    EndDate = DATE_ADD(NOW(), INTERVAL 30 DAY)
WHERE UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'student@studyconnect.local');

-- Option 2: Create new Premium subscription
INSERT INTO UserSubscriptions (UserId, SubscriptionId, StartDate, EndDate, IsActive, FilesUploaded, CreatedBy, CreatedByName, CreatedAt, ModifiedBy, ModifiedByName, ModifiedAt)
SELECT 
    u.Id,
    s.Id,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    1,
    0,
    u.Id,
    CONCAT(u.FirstName, ' ', u.LastName),
    NOW(),
    u.Id,
    CONCAT(u.FirstName, ' ', u.LastName),
    NOW()
FROM AspNetUsers u
CROSS JOIN Subscriptions s
WHERE u.Email = 'student@studyconnect.local'
AND s.Name = 'Premium';
```

2. **Login as Student**
   - ? No ads should appear
   - ? Quick Actions panel visible instead
   - ? Clean dashboard experience

## Expected Behavior

### Free Trial Users See:
```
???????????????????????????????????????????
?  TOP BANNER AD (Gradient Background)   ?
?  "Upgrade to Premium - Unlock All..."  ?
???????????????????????????????????????????

???????????????????????????????????????????
? Statistics  ?  Statistics  ? Statistics ?
???????????????????????????????????????????

??????????????????????????????????????????
?  Welcome Card       ?  SIDEBAR AD      ?
?                     ?  "Student        ?
?                     ?   Discount..."   ?
??????????????????????????????????????????

???????????????????????????????????????????
?  MIDDLE AD (Horizontal Card)            ?
?  "Free Trial Ending Soon?..."           ?
???????????????????????????????????????????
```

### Premium Users See:
```
???????????????????????????????????????????
?  Statistics  ?  Statistics  ? Statistics ?
???????????????????????????????????????????

??????????????????????????????????????????
?  Welcome Card       ?  Quick Actions   ?
?                     ?  Panel           ?
??????????????????????????????????????????
```

## Verification Checklist

### Visual Checks
- [ ] Top banner has gradient purple background
- [ ] Banner has image on right side
- [ ] Sidebar ad shows image, title, description
- [ ] Middle ad is horizontal layout
- [ ] All ads have "SPONSORED" or "Ad" badge
- [ ] Hover effects work (shadow, transform)
- [ ] Mobile responsive (test at 768px, 576px)

### Functional Checks
- [ ] Ads load on page load
- [ ] Different ads show on refresh (random)
- [ ] Click opens link in new tab
- [ ] View count increments automatically
- [ ] Click count increments on click
- [ ] No JavaScript errors in console
- [ ] AJAX calls succeed (check Network tab)

### Database Checks
Run these queries to verify:

```sql
-- Check ads exist
SELECT COUNT(*) FROM Ads WHERE DeletedAt IS NULL;
-- Expected: 5

-- Check ad activity
SELECT Position, COUNT(*) 
FROM Ads 
WHERE DeletedAt IS NULL AND IsActive = 1 
GROUP BY Position;
-- Expected: Top(2), Sidebar(2), Middle(1)

-- Check tracking data
SELECT Title, ViewCount, ClickCount 
FROM Ads 
WHERE DeletedAt IS NULL 
ORDER BY ViewCount DESC;
-- ViewCount should increase after viewing dashboard
-- ClickCount should increase after clicking ads
```

## Common Issues & Solutions

### Issue: Ads Not Appearing
**Solution**:
1. Check subscription type: `SELECT * FROM UserSubscriptions WHERE UserId = 'user-id'`
2. Verify ads are active: `SELECT * FROM Ads WHERE IsActive = 1`
3. Check console for JavaScript errors
4. Clear browser cache
5. Verify `ViewBag.IsFreeTrial` is set to `true`

### Issue: Images Not Loading
**Solution**:
1. Check image URLs are accessible
2. Verify internet connection
3. Try different Unsplash images
4. Use local images instead of external URLs

### Issue: Tracking Not Working
**Solution**:
1. Check anti-forgery token exists in page
2. Verify AJAX endpoints are correct
3. Check database write permissions
4. Review browser Network tab for errors

### Issue: Wrong Layout
**Solution**:
1. Verify CSS file is loaded: `index.css`
2. Check for CSS conflicts
3. Test in different browsers
4. Clear browser cache and hard reload

## Performance Testing

### Test Scenarios
1. **Load Test**: Refresh dashboard 10 times
   - ? Ads should load quickly (<500ms)
   - ? No duplicate tracking calls
   - ? Different ads on each load

2. **Concurrent Users**: Test with multiple browser tabs
   - ? Each tab loads independently
   - ? Tracking works per session
   - ? No race conditions

3. **Mobile Test**: Test on mobile devices/emulators
   - ? Responsive layout works
   - ? Images scale properly
   - ? Touch interactions work
   - ? No horizontal scroll

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if available)
- [ ] Mobile browsers

## Sample Test Data

### Created Ads in Seed Data:

1. **Top Banner 1**
   - Title: "Upgrade to Premium - Unlock All Features!"
   - Position: Top
   - Image: Study group collaboration

2. **Top Banner 2**
   - Title: "Limited Time Offer - 50% Off Premium!"
   - Position: Top
   - Image: Laptop with coffee

3. **Sidebar 1**
   - Title: "Student Discount Available"
   - Position: Sidebar
   - Image: Students studying together

4. **Sidebar 2**
   - Title: "Boost Your Grades"
   - Position: Sidebar
   - Image: Notebook with coffee

5. **Middle 1**
   - Title: "Free Trial Ending Soon?"
   - Position: Middle
   - Image: Study materials on desk

All ads:
- Active: ?
- Date Range: Last 7 days to +6 months
- Link: `/Subscriptions/AvailablePlans`
- Tracking: ViewCount and ClickCount start at 0

## Success Criteria

The feature is working correctly if:
1. ? Free Trial users see 3 ads (top, sidebar, middle)
2. ? Premium users see 0 ads
3. ? Admin users see 0 ads
4. ? Clicking ads opens subscription page
5. ? ViewCount increases automatically
6. ? ClickCount increases on click
7. ? Ads are responsive on mobile
8. ? No JavaScript errors
9. ? Random ad rotation works
10. ? Admin can manage ads

## Next Steps After Testing

1. **Replace Images**: Change Unsplash URLs to your own hosted images
2. **Update Content**: Customize ad titles and descriptions
3. **Set Real Dates**: Update StartDate and EndDate for production
4. **Monitor Performance**: Track CTR and engagement
5. **Iterate**: A/B test different ad designs
6. **Optimize**: Adjust based on user behavior

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Ready for Testing ?
