# Study Group Resources Feature - Implementation Summary

## Overview
I've successfully implemented the file resource upload and management system for study groups. This allows members to upload, download, and manage files (documents, images, etc.) within their study groups.

## Database Changes

### New Table: StudyGroupResources
The following table needs to be added to your database:

**Columns:**
- `Id` (int, Primary Key, Auto-increment)
- `StudyGroupId` (int, Foreign Key to StudyGroups)
- `Title` (varchar(255), Required) - Display name for the resource
- `Description` (varchar(1000), Optional) - Description of the resource
- `FilePath` (varchar(500), Required) - Relative path to uploaded file
- `FileName` (varchar(255), Required) - Original filename
- `FileType` (varchar(100), Required) - MIME type (e.g., "application/pdf")
- `FileExtension` (varchar(50), Required) - File extension (e.g., ".pdf")
- `FileSize` (bigint, Required) - File size in bytes
- `UploadedByUserId` (varchar(255), Foreign Key to AspNetUsers)
- `DownloadCount` (int, Default: 0) - Tracks download statistics

**Plus all BaseModel fields:**
- `CreatedBy` (varchar)
- `CreatedByName` (varchar)
- `CreatedAt` (datetime)
- `ModifiedBy` (varchar)
- `ModifiedByName` (varchar)
- `ModifiedAt` (datetime)
- `DeletedBy` (varchar, nullable)
- `DeletedByName` (varchar, nullable)
- `DeletedAt` (datetime, nullable)

### Database Migration Steps

**IMPORTANT: You need to manually create and run the migration**

1. **Open Terminal/PowerShell** in your project directory

2. **Create the migration:**
   ```bash
   dotnet ef migrations add AddStudyGroupResourcesTable
   ```

3. **Review the migration file** in the `Migrations` folder to ensure it looks correct

4. **Apply the migration to your database:**
   ```bash
   dotnet ef database update
   ```

5. **Verify the changes** in your MySQL database:
   - Check that `StudyGroupResources` table was created
   - Verify foreign keys to `StudyGroups` and `AspNetUsers`
   - Confirm all columns are present with correct data types

## Files Created

### 1. Model: `StudyConnect\Models\StudyGroupResource.cs`
- Defines the resource entity with all required properties
- Includes relationships to StudyGroup and ApplicationUser
- Tracks upload metadata and download statistics

### 2. Request DTO: `StudyConnect\Requests\UploadResourceRequest.cs`
- Handles file upload form data
- Validates required fields

## Files Modified

### 1. Database Context: `StudyConnect\Data\AppDbContext.cs`
- Added `DbSet<StudyGroupResource>` for database access

### 2. Study Group Model: `StudyConnect\Models\StudyGroup.cs`
- Added navigation property `Resources` for EF Core relationship

### 3. Controller: `StudyConnect\Controllers\StudyGroupsController.cs`
Added four new endpoints:

#### a. **Upload Resource** - `POST /StudyGroups/UploadResource`
- Accepts file uploads with title and description
- Validates file type and size (max 50MB)
- Supported formats: PDF, Word, PowerPoint, Excel, Images (JPG, PNG, GIF)
- Saves files to `wwwroot/uploads/study-groups/{studyGroupId}/`
- Creates database record
- Requires user to be a member

#### b. **Get Resources** - `GET /StudyGroups/GetResources?studyGroupId={id}`
- Returns all resources for a study group
- Includes uploader information and metadata
- Ordered by most recent first

#### c. **Delete Resource** - `POST /StudyGroups/DeleteResource`
- Soft deletes a resource
- Only owner, admin, or uploader can delete
- Logs deletion in audit trail

#### d. **Download Resource** - `POST /StudyGroups/DownloadResource?resourceId={id}`
- Downloads the file
- Increments download counter
- Requires user to be a member
- Returns file with original filename

### 4. JavaScript: `StudyConnect\wwwroot\modules\study_groups\footer_details.js`
Updated functions:
- `loadResources()` - Fetches and displays resources from API
- `uploadResource()` - Handles file upload with FormData
- `renderResources(resources)` - Creates resource cards dynamically
- `createResourceCard(resource)` - Builds HTML for each resource
- `downloadResource(resourceId)` - Initiates file download
- `deleteResource(resourceId)` - Handles resource deletion with confirmation
- `escapeHtml(text)` - Security function to prevent XSS

### 5. View: `StudyConnect\Views\StudyGroups\Details.cshtml`
- Added `@using System.Security.Claims` directive
- Added `currentUserId` JavaScript variable for permission checks
- UI already had the upload modal and resources section

### 6. CSS: `StudyConnect\wwwroot\modules\study_groups\details.css`
- Enhanced resource card styling
- Added file type icon colors
- Responsive design updates
- Hover effects

## Features Implemented

### 1. **File Upload**
- ? Modal dialog for uploading files
- ? Title and description fields
- ? File type validation
- ? File size limit (50MB)
- ? Unique filename generation (prevents conflicts)
- ? Organized storage by study group

### 2. **Resource Display**
- ? Grid layout showing all resources
- ? File type icons (PDF, Word, Excel, PowerPoint, Images)
- ? Resource metadata (title, description, uploader, date, size)
- ? Download count tracking
- ? Empty state when no resources exist

### 3. **Permissions**
- ? Only members can upload resources
- ? Only members can download resources
- ? Owner, admin, or uploader can delete resources
- ? Visual delete button only for authorized users

### 4. **File Management**
- ? Files stored in `wwwroot/uploads/study-groups/{studyGroupId}/`
- ? Unique filenames prevent overwrites
- ? Soft delete (files remain on disk, marked deleted in DB)
- ? Download counter increments on each download

### 5. **Security**
- ? Member verification before upload/download
- ? File type whitelist
- ? File size limits
- ? XSS prevention in display
- ? Audit logging for all operations

### 6. **User Experience**
- ? Sweet Alert confirmations
- ? Loading indicators (AmagiLoader)
- ? Error handling with user-friendly messages
- ? Responsive design
- ? File size formatting
- ? Hover effects on cards

## Supported File Types

| Type | Extensions | MIME Type | Icon |
|------|-----------|-----------|------|
| PDF | .pdf | application/pdf | Red PDF icon |
| Word | .doc, .docx | application/msword | Blue Word icon |
| Excel | .xls, .xlsx | application/vnd.ms-excel | Green Excel icon |
| PowerPoint | .ppt, .pptx | application/vnd.ms-powerpoint | Orange PPT icon |
| Images | .jpg, .jpeg, .png, .gif | image/* | Blue image icon |

## File Storage Structure

```
wwwroot/
??? uploads/
    ??? study-groups/
        ??? 1/             (Study Group ID)
        ?   ??? {guid}.pdf
        ?   ??? {guid}.docx
        ?   ??? {guid}.png
  ??? 2/
        ?   ??? {guid}.pdf
   ??? 3/
  ??? {guid}.xlsx
```

## API Response Formats

### Upload Resource
```json
{
  "IsSuccess": true,
  "Message": "Resource uploaded successfully.",
  "MessageType": "success"
}
```

### Get Resources
```json
{
  "data": [
    {
      "id": 1,
 "title": "Course Notes",
      "description": "Week 1 lecture notes",
   "fileName": "notes.pdf",
    "filePath": "/uploads/study-groups/1/abc-123.pdf",
      "fileType": "application/pdf",
      "fileExtension": ".pdf",
      "fileSize": 2048576,
      "uploadedByName": "John Doe",
      "uploadedByUserId": "user-guid",
      "downloadCount": 5,
      "createdAt": "January 15, 2025 02:30 PM"
    }
  ]
}
```

## Testing Checklist

After running the migration, test the following:

- [ ] Upload a PDF file
- [ ] Upload a Word document
- [ ] Upload an image
- [ ] Verify files appear in the Resources tab
- [ ] Download a file (check download count increases)
- [ ] Delete a resource you uploaded
- [ ] Try to delete someone else's resource (should fail unless owner/admin)
- [ ] Verify file size is correctly displayed
- [ ] Check that non-members cannot upload/download
- [ ] Verify empty state shows when no resources exist
- [ ] Test file size limit (try uploading >50MB - should fail)
- [ ] Test invalid file type (try .exe - should fail)
- [ ] Check audit logs are created for upload/delete operations

## Next Steps (Optional Enhancements)

1. **File Preview** - Add modal to preview PDFs and images without downloading
2. **Bulk Upload** - Allow uploading multiple files at once
3. **Search/Filter** - Add search functionality for resources
4. **Categories** - Organize resources by category (Notes, Assignments, etc.)
5. **Versioning** - Allow updating files while maintaining history
6. **Sharing** - Generate shareable links for specific resources
7. **Cloud Storage** - Integrate Azure Blob Storage or AWS S3 for better scalability
8. **File Scanning** - Add virus/malware scanning before upload
9. **Thumbnails** - Generate thumbnails for images and PDFs
10. **Notifications** - Notify members when new resources are uploaded

## Troubleshooting

### Migration Issues
- **Error: Table already exists** ? Drop the table or use a different migration name
- **Error: Foreign key constraint fails** ? Ensure StudyGroups and AspNetUsers tables exist

### Upload Issues
- **File not uploading** ? Check file size and type restrictions
- **Permission denied** ? Verify user is a member of the study group
- **File not found** ? Check `wwwroot/uploads/study-groups/` folder permissions

### Download Issues
- **File not found** ? Check if file exists on disk at the specified path
- **Permission denied** ? Verify user is a member

### Display Issues
- **Resources not showing** ? Check browser console for JavaScript errors
- **Icons not displaying** ? Verify Tabler Icons CSS is loaded

## Notes

- Files are stored on the local filesystem (not in database)
- Soft delete keeps files on disk even after deletion from UI
- To permanently delete files, you'll need a cleanup job
- Consider implementing file size quotas per study group
- Monitor disk space usage as files accumulate

## Security Considerations

? **Implemented:**
- File type whitelist
- File size limits
- Member verification
- XSS prevention
- SQL injection prevention (using EF Core)
- Audit logging

?? **Consider Adding:**
- Virus scanning
- Rate limiting on uploads
- Storage quotas per group
- CAPTCHA for uploads
- File encryption at rest

---

**Created by**: GitHub Copilot
**Date**: 2025-01-XX
**Version**: 1.0

## Quick Start Command

Run this command to create the migration:

```bash
dotnet ef migrations add AddStudyGroupResourcesTable
```

Then apply it:

```bash
dotnet ef database update
```

That's it! Your study groups will now have full file resource management capabilities. ??
