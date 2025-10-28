# Study Group Members Feature - Migration Guide

## Overview
This feature adds member management functionality to study groups. Each study group can have multiple members with different roles (Owner, Admin, Member).

## Database Changes

### New Table: StudyGroupMembers
- **Id** (Primary Key)
- **StudyGroupId** (Foreign Key to StudyGroups)
- **UserId** (Foreign Key to AspNetUsers)
- **Role** (Owner/Admin/Member)
- **IsApproved** (For private groups requiring approval)
- **JoinedAt** (Timestamp when user joined)
- Plus all BaseModel fields (CreatedBy, CreatedAt, ModifiedBy, ModifiedAt, DeletedBy, DeletedAt, etc.)

### Updated Table: StudyGroups
- Added navigation property for Members collection

## Migration Instructions

### Step 1: Create the Migration
Open a terminal in the project directory and run:

```bash
dotnet ef migrations add AddStudyGroupMembersTable
```

### Step 2: Review the Migration
The migration file will be created in the `Migrations` folder. Review it to ensure it includes:
- Creation of `StudyGroupMembers` table
- Foreign key relationships to `StudyGroups` and `AspNetUsers`
- All required columns and constraints

### Step 3: Apply the Migration
Execute the migration to update the database:

```bash
dotnet ef database update
```

### Step 4: Verify the Changes
Check your database to confirm:
- `StudyGroupMembers` table exists
- Foreign keys are properly set up
- Indexes are created on foreign key columns

## Features Implemented

### 1. **Automatic Owner Assignment**
- When a user creates a study group, they are automatically added as the "Owner"
- The owner cannot be removed from the group
- The owner's role cannot be changed

### 2. **Member Management API Endpoints**

#### Get Members
```
GET /StudyGroups/GetMembers?studyGroupId={id}
```
Returns all members of a specific study group with their details.

#### Add Member
```
POST /StudyGroups/AddMember
Body: { "studyGroupId": 1, "userId": "user-id-here" }
```
Adds a new member to a study group. For public groups, members are auto-approved.

#### Remove Member
```
POST /StudyGroups/RemoveMember
Body: memberId (int)
```
Soft deletes a member from the group. Cannot remove owners.

#### Update Member Role
```
POST /StudyGroups/UpdateMemberRole
Body: { "memberId": 1, "newRole": "Admin" }
```
Changes a member's role. Cannot change owner's role.

### 3. **Member Roles**
- **Owner**: Full control, cannot be removed, one per group
- **Admin**: Can manage members and content (you can extend permissions)
- **Member**: Regular member with basic permissions

### 4. **Capacity Management**
- Respects `MaximumNumbers` setting
- Prevents adding members when group is full
- Displays current member count

### 5. **Privacy Support**
- **Public Groups**: Members are auto-approved when they join
- **Private Groups**: Members need approval (IsApproved = false initially)

### 6. **Audit Logging**
All member operations are logged:
- Member creation
- Member removal
- Role changes

## Code Structure

### Models
- `StudyGroupMember.cs` - Main membership model
- `StudyGroupRoles.cs` - Constants for role names
- `StudyGroup.cs` - Updated with Members navigation property

### Controller Methods
All in `StudyGroupsController.cs`:
- `GetMembers(int studyGroupId)` - Retrieve members
- `AddMember(AddMemberRequest request)` - Add new member
- `RemoveMember(int memberId)` - Remove member
- `UpdateMemberRole(UpdateMemberRoleRequest request)` - Change member role
- `Upsert(UpsertViewModel viewModel)` - Updated to auto-add owner

### Database Context
- `AppDbContext.cs` - Added `DbSet<StudyGroupMember>`

## Usage Examples

### Creating a Study Group
When you create a study group using the Upsert form, the system automatically:
1. Creates the study group
2. Adds you as the "Owner" member
3. Logs both actions in the audit trail

### Adding Members (via API)
```javascript
$.ajax({
    url: '/StudyGroups/AddMember',
    type: 'POST',
    contentType: 'application/json',
  data: JSON.stringify({
        studyGroupId: 1,
        userId: 'user-guid-here'
    }),
    success: function(response) {
   console.log('Member added');
    }
});
```

### Getting Members (via API)
```javascript
$.ajax({
    url: '/StudyGroups/GetMembers?studyGroupId=1',
    type: 'GET',
    success: function(response) {
        console.log(response.data); // Array of members
    }
});
```

## Next Steps

After migrating, you can:
1. Create a member management UI page
2. Add member invitation system
3. Implement join request functionality for private groups
4. Add member search and filtering
5. Create member permission system
6. Add notifications for member actions

## Testing

After migration, test:
1. ? Create a new study group (verify you're added as owner)
2. ? Try to add members via API
3. ? Verify capacity limits work
4. ? Test public vs private group behavior
5. ? Ensure owner cannot be removed
6. ? Check audit logs are created

## Rollback

If you need to rollback this migration:

```bash
dotnet ef database update PreviousMigrationName
dotnet ef migrations remove
```

Replace `PreviousMigrationName` with the name of the migration before this one.

## Support

If you encounter issues:
1. Check the error messages
2. Verify foreign key constraints
3. Ensure AspNetUsers table exists and has data
4. Check that CreatedBy/ModifiedBy fields accept the user IDs being used

---

**Migration created by**: GitHub Copilot
**Date**: $(Get-Date -Format "yyyy-MM-dd")
**Version**: 1.0
