# Migration Instructions

## Step-by-Step Guide to Add StudyGroupResources Table

### Prerequisites
- .NET EF Core Tools installed
- MySQL database connection configured
- All code changes already applied (completed)

### Steps

#### 1. Open Terminal/PowerShell
Navigate to your project directory where the `.csproj` file is located:
```bash
cd E:\Users\agurokeendavid\Documents\Thesis\2025\studyconnect\StudyConnect\StudyConnect
```

#### 2. Create Migration
Run the following command to create a new migration:
```bash
dotnet ef migrations add AddStudyGroupResourcesTable
```

**Expected Output:**
```
Build started...
Build succeeded.
Done. To undo this action, use 'dotnet ef migrations remove'
```

A new file will be created in the `Migrations` folder with a name like:
`20250115XXXXXX_AddStudyGroupResourcesTable.cs`

#### 3. Review Migration (Optional but Recommended)
Open the newly created migration file and verify it contains:
- `CreateTable` operation for `StudyGroupResources`
- All columns (Id, StudyGroupId, Title, Description, etc.)
- Foreign key constraints to `StudyGroups` and `AspNetUsers`
- Indexes on foreign keys

#### 4. Apply Migration
Run the following command to update your database:
```bash
dotnet ef database update
```

**Expected Output:**
```
Build started...
Build succeeded.
Applying migration '20250115XXXXXX_AddStudyGroupResourcesTable'.
Done.
```

#### 5. Verify in Database
Connect to your MySQL database and check:

```sql
-- Check if table exists
SHOW TABLES LIKE 'StudyGroupResources';

-- View table structure
DESCRIBE StudyGroupResources;

-- Check foreign keys
SHOW CREATE TABLE StudyGroupResources;
```

### Troubleshooting

#### Problem: "Build failed"
**Solution:** Make sure you're in the correct directory with the `.csproj` file

#### Problem: "No DbContext was found"
**Solution:** Ensure your connection string in `appsettings.json` is correct

#### Problem: "Table already exists"
**Solution:** Either drop the existing table or use a different migration name:
```bash
dotnet ef migrations add AddStudyGroupResourcesTableV2
```

#### Problem: "Foreign key constraint fails"
**Solution:** Ensure `StudyGroups` and `AspNetUsers` tables exist in your database

### Rollback (If Needed)

If you need to undo the migration:

```bash
# Rollback to previous migration
dotnet ef database update PreviousMigrationName

# Remove the migration file
dotnet ef migrations remove
```

### Success Indicators

? Migration file created in `Migrations` folder
? Command completed without errors
? Table `StudyGroupResources` exists in database
? Foreign keys properly configured
? All columns present with correct data types

### Next Steps After Migration

1. **Test File Upload**
   - Go to any study group details page
   - Click "Upload Resource" button
   - Upload a test file
   - Verify it appears in the Resources tab

2. **Check File Storage**
   - Navigate to `wwwroot/uploads/study-groups/`
   - Verify the uploaded file is stored there

3. **Test Downloads**
   - Click download on any resource
   - Verify file downloads correctly

4. **Test Permissions**
   - Try to delete a resource as the owner (should work)
   - Try to delete someone else's resource as a non-admin (should fail)

### Create Uploads Directory

The application will create the uploads directory automatically, but you can create it manually if preferred:

```bash
# From project root
mkdir -p wwwroot/uploads/study-groups
```

### File Permissions (If on Linux/Mac)

If running on Linux/Mac, ensure write permissions:
```bash
chmod 755 wwwroot/uploads
chmod 755 wwwroot/uploads/study-groups
```

## Complete Command Sequence

Here's the complete sequence of commands to run:

```bash
# 1. Navigate to project directory
cd E:\Users\agurokeendavid\Documents\Thesis\2025\studyconnect\StudyConnect\StudyConnect

# 2. Create migration
dotnet ef migrations add AddStudyGroupResourcesTable

# 3. Apply migration
dotnet ef database update

# 4. Build project
dotnet build

# 5. Run application
dotnet run
```

That's it! Your file resources feature is now ready to use. ??

---

**Note**: All code changes have already been implemented. You ONLY need to run the migration commands above.
