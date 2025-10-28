# Forum Messaging System Implementation

## Overview
This implementation adds a real-time forum messaging system to study groups using **SignalR** for instant message delivery without polling or page refreshes.

## Features Implemented

### 1. **Real-Time Messaging**
- Messages appear instantly for all approved members in the study group
- No page refresh or polling required
- Uses WebSocket protocol via SignalR

### 2. **Access Control**
- Only approved members can view and post messages
- Owners and Admins can delete any message
- Members can only delete their own messages

### 3. **Database Storage**
- All messages are persisted in the `StudyGroupMessages` table
- Soft-delete support for message removal
- Audit trail maintained for all actions

## Files Created/Modified

### New Files:
1. `StudyConnect\Models\StudyGroupMessage.cs` - Message entity model
2. `StudyConnect\Hubs\StudyGroupHub.cs` - SignalR hub for real-time communication
3. `StudyConnect\Requests\PostMessageRequest.cs` - Request model for posting messages
4. `StudyConnect\Migrations\20250101000000_AddStudyGroupMessagesTable.cs` - Database migration

### Modified Files:
1. `StudyConnect\Data\AppDbContext.cs` - Added DbSet for messages
2. `StudyConnect\Program.cs` - Configured SignalR services and hub endpoint
3. `StudyConnect\Controllers\StudyGroupsController.cs` - Added message endpoints
4. `StudyConnect\Views\StudyGroups\Details.cshtml` - Added SignalR script reference
5. `StudyConnect\wwwroot\modules\study_groups\footer_details.js` - SignalR client integration
6. `StudyConnect\wwwroot\modules\study_groups\details.css` - Message styling

## Migration Instructions

### Step 1: Create Migration (Optional - Already provided)
If you want to create your own migration instead of using the provided one:

```bash
dotnet ef migrations add AddStudyGroupMessagesTable
```

### Step 2: Apply Migration
Run the migration to create the database table:

```bash
dotnet ef database update
```

Or if you prefer using Package Manager Console in Visual Studio:

```powershell
Update-Database
```

## How It Works

### SignalR Connection Flow:
1. When a user opens the study group details page, the JavaScript establishes a SignalR connection
2. The connection joins a specific group channel: `StudyGroup_{studyGroupId}`
3. When any user posts a message:
   - The message is saved to the database
   - The server broadcasts the message to all connected clients in that study group
   - All users see the new message instantly without refreshing

### Message Posting Flow:
1. User types a message and clicks "Post Message"
2. AJAX call sends message to `PostMessage` endpoint
3. Controller validates user is an approved member
4. Message is saved to database
5. SignalR broadcasts message to all group members
6. Message appears in real-time for all users

### Message Deletion Flow:
1. User clicks delete button on their message (or Owner/Admin deletes any message)
2. Controller validates permissions
3. Message is soft-deleted in database
4. SignalR broadcasts deletion event
5. Message is removed from UI for all users in real-time

## API Endpoints

### POST /StudyGroups/PostMessage
Posts a new message to the forum.

**Request Body:**
```json
{
  "studyGroupId": 1,
  "message": "Hello everyone!"
}
```

**Access:** Approved members, admins, and owners only

### GET /StudyGroups/GetMessages
Retrieves messages for a study group.

**Query Parameters:**
- `studyGroupId` (int, required)
- `skip` (int, optional, default: 0)
- `take` (int, optional, default: 50)

**Access:** Approved members only

### POST /StudyGroups/DeleteMessage
Soft deletes a message.

**Request Body:** `messageId` (int)

**Access:** Message owner, group owner, or group admin

## SignalR Hub Methods

### Server-to-Client Methods:
- `ReceiveMessage(messageData)` - Broadcasts new message to all group members
- `MessageDeleted(messageId)` - Notifies all group members that a message was deleted

### Client-to-Server Methods:
- `JoinStudyGroup(studyGroupId)` - Joins the SignalR group for real-time updates
- `LeaveStudyGroup(studyGroupId)` - Leaves the SignalR group

## Testing the Implementation

### Test Scenario 1: Real-time Messaging
1. Open the study group details page in two different browsers (or incognito mode)
2. Log in as two different approved members
3. Post a message from one browser
4. **Expected:** Message appears instantly in both browsers without refresh

### Test Scenario 2: Message Deletion
1. Delete a message from one browser
2. **Expected:** Message disappears from all connected browsers instantly

### Test Scenario 3: Access Control
1. Try posting as a non-member
2. **Expected:** Error message saying you must be an approved member

### Test Scenario 4: Reconnection
1. Disconnect internet briefly while viewing the page
2. Reconnect internet
3. Post a message from another browser
4. **Expected:** Message appears after automatic reconnection

## Configuration Notes

### SignalR Hub URL
The hub is configured at: `/studyGroupHub`

This is set in two places:
- **Server:** `Program.cs` - `app.MapHub<StudyGroupHub>("/studyGroupHub")`
- **Client:** `footer_details.js` - `.withUrl("/studyGroupHub")`

### Message Length Limit
Messages are limited to **5000 characters** (configurable in the model).

### Automatic Reconnection
SignalR client is configured with `.withAutomaticReconnect()` which will automatically attempt to reconnect if the connection is lost.

## Security Considerations

1. **Authentication Required:** All SignalR connections require authentication via `[Authorize]` attribute
2. **Membership Validation:** Server validates that users are approved members before allowing any operations
3. **XSS Protection:** All messages are HTML-escaped before rendering to prevent script injection
4. **Rate Limiting:** Consider adding rate limiting for message posting in production

## Performance Considerations

1. **Message Pagination:** Messages are loaded with pagination (default 50 at a time)
2. **Connection Pooling:** SignalR reuses connections efficiently
3. **Selective Loading:** Only approved members connect to the hub
4. **Efficient Broadcasting:** Messages are only sent to users in the specific study group

## Troubleshooting

### Messages not appearing in real-time:
- Check browser console for SignalR connection errors
- Verify user is an approved member
- Check that SignalR hub is properly mapped in `Program.cs`
- Ensure firewall allows WebSocket connections

### SignalR connection fails:
- Verify the hub URL is correct (`/studyGroupHub`)
- Check that SignalR service is added in `Program.cs`
- Ensure user is authenticated

### Messages not persisting:
- Check database migration was applied successfully
- Verify `StudyGroupMessages` table exists
- Check for any database connection errors in logs

## Future Enhancements (Optional)

1. **Message Reactions:** Add emoji reactions to messages
2. **Message Editing:** Allow users to edit their own messages
3. **File Attachments:** Support attaching files to messages
4. **Typing Indicators:** Show when someone is typing
5. **Read Receipts:** Track which users have read messages
6. **Message Search:** Add search functionality for messages
7. **Rich Text Formatting:** Support markdown or rich text in messages
8. **Mentions:** Allow @mentions of other members
9. **Message Threading:** Support reply threads
10. **Push Notifications:** Notify users of new messages via browser notifications

## Dependencies

The following NuGet package is already included in .NET 9:
- `Microsoft.AspNetCore.SignalR.Core` (built-in)

The JavaScript library is loaded from CDN:
- SignalR Client: `https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.0/signalr.min.js`

## Support

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Check the server logs for any exceptions
3. Verify the database migration was applied
4. Ensure all file changes were saved and the project was rebuilt

---

**Implementation Complete!** 

The forum now supports real-time messaging for approved study group members with instant updates via SignalR. No polling or page refreshes required!
