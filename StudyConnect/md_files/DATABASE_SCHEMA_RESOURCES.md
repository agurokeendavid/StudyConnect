# StudyGroupResources Table Schema

## Table: StudyGroupResources

### Primary Key
- `Id` INT PRIMARY KEY AUTO_INCREMENT

### Foreign Keys
- `StudyGroupId` INT NOT NULL
  - References: `StudyGroups(Id)` ON DELETE CASCADE
- `UploadedByUserId` VARCHAR(255) NOT NULL
  - References: `AspNetUsers(Id)` ON DELETE CASCADE

### Resource Information
- `Title` VARCHAR(255) NOT NULL
- `Description` VARCHAR(1000) NULL
- `FileName` VARCHAR(255) NOT NULL
- `FilePath` VARCHAR(500) NOT NULL
- `FileType` VARCHAR(100) NOT NULL
- `FileExtension` VARCHAR(50) NOT NULL
- `FileSize` BIGINT NOT NULL
- `DownloadCount` INT NOT NULL DEFAULT 0

### Audit Fields (from BaseModel)
- `CreatedBy` VARCHAR(MAX) NOT NULL
- `CreatedByName` VARCHAR(MAX) NOT NULL
- `CreatedAt` DATETIME(6) NOT NULL
- `ModifiedBy` VARCHAR(MAX) NOT NULL
- `ModifiedByName` VARCHAR(MAX) NOT NULL
- `ModifiedAt` DATETIME(6) NOT NULL
- `DeletedBy` VARCHAR(MAX) NULL
- `DeletedByName` VARCHAR(MAX) NULL
- `DeletedAt` DATETIME(6) NULL

## Indexes

Recommended indexes for optimal performance:
- `IX_StudyGroupResources_StudyGroupId` ON `StudyGroupId`
- `IX_StudyGroupResources_UploadedByUserId` ON `UploadedByUserId`
- `IX_StudyGroupResources_DeletedAt` ON `DeletedAt` (for soft delete queries)

## Sample Data

```sql
-- Example: PDF Document
INSERT INTO StudyGroupResources (
    StudyGroupId, Title, Description, FileName, FilePath, 
    FileType, FileExtension, FileSize, UploadedByUserId,
    DownloadCount, CreatedBy, CreatedByName, CreatedAt,
    ModifiedBy, ModifiedByName, ModifiedAt
) VALUES (
    1, 
    'Introduction to Algorithms', 
    'Chapter 1 notes from textbook', 
    'algorithms-ch1.pdf',
    '/uploads/study-groups/1/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6.pdf',
    'application/pdf',
    '.pdf',
    2048576,
    'user-guid-here',
0,
    'user-guid-here',
    'John Doe',
    '2025-01-15 14:30:00',
    'user-guid-here',
    'John Doe',
    '2025-01-15 14:30:00'
);
```

## Relationships

```
StudyGroupResources
??? BelongsTo: StudyGroup (via StudyGroupId)
?   ??? Cascade Delete: Yes
??? BelongsTo: ApplicationUser (via UploadedByUserId)
    ??? Cascade Delete: Yes
```

## Entity Framework Core Configuration

The configuration is automatically handled by EF Core conventions and the model annotations. The migration will generate the correct schema.

## Query Examples

### Get all resources for a study group
```csharp
var resources = await _context.StudyGroupResources
    .Where(r => r.StudyGroupId == studyGroupId && r.DeletedAt == null)
    .Include(r => r.UploadedByUser)
    .OrderByDescending(r => r.CreatedAt)
    .ToListAsync();
```

### Get resource by ID with relationships
```csharp
var resource = await _context.StudyGroupResources
    .Include(r => r.StudyGroup)
    .Include(r => r.UploadedByUser)
    .FirstOrDefaultAsync(r => r.Id == resourceId && r.DeletedAt == null);
```

### Get total file size for a study group
```csharp
var totalSize = await _context.StudyGroupResources
    .Where(r => r.StudyGroupId == studyGroupId && r.DeletedAt == null)
    .SumAsync(r => r.FileSize);
```

## Migration Command

```bash
# Create migration
dotnet ef migrations add AddStudyGroupResourcesTable

# Apply migration
dotnet ef database update

# Rollback if needed
dotnet ef database update PreviousMigrationName
```

## Notes

- **Soft Delete**: Resources are marked as deleted (DeletedAt is set) but not physically removed
- **File Path**: Stored as relative path from wwwroot (e.g., `/uploads/study-groups/1/file.pdf`)
- **File Size**: Stored in bytes (BIGINT to support files up to ~9 exabytes)
- **Cascade Delete**: If a study group or user is deleted, their resources are also deleted
- **Download Count**: Can be used for analytics and popular resource identification
