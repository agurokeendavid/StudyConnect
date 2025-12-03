using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Helpers;
using StudyConnect.Hubs;
using StudyConnect.Models;
using StudyConnect.Requests;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize]
    public class ForumsController : Controller
    {
        private readonly ILogger<ForumsController> _logger;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;
        private readonly IHubContext<StudyGroupHub> _hubContext;

        public ForumsController(
            ILogger<ForumsController> logger,
            AppDbContext context,
            IAuditService auditService,
            IHubContext<StudyGroupHub> hubContext)
        {
            _logger = logger;
            _context = context;
            _auditService = auditService;
            _hubContext = hubContext;
        }

        // GET: Get all forums for a study group
        [HttpGet]
        public async Task<IActionResult> GetForums(int studyGroupId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Check if user is an approved member of the study group
                var isMember = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == studyGroupId &&
                        m.UserId == currentUserId &&
                        m.IsApproved &&
                        m.DeletedAt == null);

                if (!isMember)
                {
                    return Json(new { data = new List<object>() });
                }

                var forums = await _context.StudyGroupForums
                    .Where(f => f.StudyGroupId == studyGroupId && f.DeletedAt == null && f.IsActive)
                    .Include(f => f.CreatedByUser)
                    .Include(f => f.ForumMembers.Where(fm => fm.DeletedAt == null))
                    .OrderByDescending(f => f.CreatedAt)
                    .Select(f => new
                    {
                        id = f.Id,
                        name = f.Name,
                        description = f.Description,
                        createdByName = $"{f.CreatedByUser.FirstName} {f.CreatedByUser.LastName}".Trim(),
                        createdByUserId = f.CreatedByUserId,
                        createdAt = f.CreatedAt.ToString("MMMM dd, yyyy hh:mm tt"),
                        memberCount = f.ForumMembers.Count(fm => fm.IsApproved),
                        pendingRequestCount = f.ForumMembers.Count(fm => !fm.IsApproved),
                        isUserMember = f.ForumMembers.Any(fm => fm.UserId == currentUserId && fm.IsApproved && fm.DeletedAt == null),
                        hasPendingRequest = f.ForumMembers.Any(fm => fm.UserId == currentUserId && !fm.IsApproved && fm.DeletedAt == null)
                    })
                    .ToListAsync();

                return Json(new { data = forums });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        // POST: Create a new forum
        [HttpPost]
        public async Task<IActionResult> CreateForum([FromBody] CreateForumRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                // Check if user is the owner of the study group
                var isOwner = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == request.StudyGroupId &&
                        m.UserId == currentUserId &&
                        m.Role == "Owner" &&
                        m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("Only group owners can create forums."));
                }

                var forum = new StudyGroupForum
                {
                    StudyGroupId = request.StudyGroupId,
                    Name = request.Name,
                    Description = request.Description,
                    IsActive = true,
                    CreatedByUserId = currentUserId ?? "",
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
                };

                _context.StudyGroupForums.Add(forum);
                await _context.SaveChangesAsync();

                await _auditService.LogCreateAsync("StudyGroupForum", forum.Id.ToString(), new
                {
                    forum.Id,
                    forum.StudyGroupId,
                    forum.Name
                });

                // Broadcast to study group members
                await _hubContext.Clients.Group($"StudyGroup_{request.StudyGroupId}")
                    .SendAsync("ForumCreated", new
                    {
                        id = forum.Id,
                        name = forum.Name,
                        description = forum.Description,
                        createdByName = currentUserName,
                        createdAt = forum.CreatedAt.ToString("MMMM dd, yyyy hh:mm tt")
                    });

                return Json(ResponseHelper.Success("Forum created successfully.", new { forumId = forum.Id }));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while creating the forum."));
            }
        }

        // POST: Update forum
        [HttpPost]
        public async Task<IActionResult> UpdateForum([FromBody] UpdateForumRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var forum = await _context.StudyGroupForums
                    .Where(f => f.DeletedAt == null)
                    .FirstOrDefaultAsync(f => f.Id == request.ForumId);

                if (forum == null)
                {
                    return Json(ResponseHelper.Failed("Forum not found."));
                }

                // Check if user is the owner of the study group
                var isOwner = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == forum.StudyGroupId &&
                        m.UserId == currentUserId &&
                        m.Role == "Owner" &&
                        m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("Only group owners can update forums."));
                }

                var oldValues = new { forum.Name, forum.Description };

                forum.Name = request.Name;
                forum.Description = request.Description;
                forum.ModifiedBy = currentUserId ?? "";
                forum.ModifiedByName = currentUserName;
                forum.ModifiedAt = DateTime.Now;

                _context.StudyGroupForums.Update(forum);
                await _context.SaveChangesAsync();

                var newValues = new { forum.Name, forum.Description };

                await _auditService.LogUpdateAsync("StudyGroupForum", forum.Id.ToString(), oldValues, newValues);

                // Broadcast to study group members
                await _hubContext.Clients.Group($"StudyGroup_{forum.StudyGroupId}")
                    .SendAsync("ForumUpdated", new
                    {
                        id = forum.Id,
                        name = forum.Name,
                        description = forum.Description
                    });

                return Json(ResponseHelper.Success("Forum updated successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while updating the forum."));
            }
        }

        // POST: Delete forum
        [HttpPost]
        public async Task<IActionResult> DeleteForum([FromBody] int forumId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var forum = await _context.StudyGroupForums
                    .Where(f => f.DeletedAt == null)
                    .FirstOrDefaultAsync(f => f.Id == forumId);

                if (forum == null)
                {
                    return Json(ResponseHelper.Failed("Forum not found."));
                }

                // Check if user is the owner of the study group
                var isOwner = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == forum.StudyGroupId &&
                        m.UserId == currentUserId &&
                        m.Role == "Owner" &&
                        m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("Only group owners can delete forums."));
                }

                forum.DeletedBy = currentUserId;
                forum.DeletedByName = currentUserName;
                forum.DeletedAt = DateTime.Now;

                _context.StudyGroupForums.Update(forum);
                await _context.SaveChangesAsync();

                await _auditService.LogDeleteAsync("StudyGroupForum", forum.Id.ToString(), new
                {
                    forum.Id,
                    forum.StudyGroupId,
                    forum.Name
                });

                // Broadcast to study group members
                await _hubContext.Clients.Group($"StudyGroup_{forum.StudyGroupId}")
                    .SendAsync("ForumDeleted", forumId);

                return Json(ResponseHelper.Success("Forum deleted successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while deleting the forum."));
            }
        }

        // POST: Join forum (request to join)
        [HttpPost]
        public async Task<IActionResult> JoinForum([FromBody] JoinForumRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var forum = await _context.StudyGroupForums
                    .Include(f => f.StudyGroup)
                    .Where(f => f.DeletedAt == null)
                    .FirstOrDefaultAsync(f => f.Id == request.ForumId);

                if (forum == null)
                {
                    return Json(ResponseHelper.Failed("Forum not found."));
                }

                // Check if user is a member of the study group
                var isStudyGroupMember = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == forum.StudyGroupId &&
                        m.UserId == currentUserId &&
                        m.IsApproved &&
                        m.DeletedAt == null);

                if (!isStudyGroupMember)
                {
                    return Json(ResponseHelper.Failed("You must be a member of the study group to join a forum."));
                }

                // Check if already a member or has a pending request
                var existingMember = await _context.StudyGroupForumMembers
                    .FirstOrDefaultAsync(fm => fm.ForumId == request.ForumId &&
                        fm.UserId == currentUserId &&
                        fm.DeletedAt == null);

                if (existingMember != null)
                {
                    if (existingMember.IsApproved)
                    {
                        return Json(ResponseHelper.Failed("You are already a member of this forum."));
                    }
                    else
                    {
                        return Json(ResponseHelper.Failed("You already have a pending request to join this forum."));
                    }
                }

                var forumMember = new StudyGroupForumMember
                {
                    ForumId = request.ForumId,
                    UserId = currentUserId ?? "",
                    IsApproved = false,
                    RequestedAt = DateTime.Now,
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
                };

                _context.StudyGroupForumMembers.Add(forumMember);
                await _context.SaveChangesAsync();

                await _auditService.LogCreateAsync("StudyGroupForumMember", forumMember.Id.ToString(), new
                {
                    forumMember.Id,
                    forumMember.ForumId,
                    forumMember.UserId
                });

                // Notify study group owner
                await _hubContext.Clients.Group($"StudyGroup_{forum.StudyGroupId}")
                    .SendAsync("ForumJoinRequestCreated", new
                    {
                        forumId = forum.Id,
                        userId = currentUserId,
                        userName = currentUserName
                    });

                return Json(ResponseHelper.Success("Join request sent. Waiting for approval from the group owner."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while joining the forum."));
            }
        }

        // GET: Get forum join requests
        [HttpGet]
        public async Task<IActionResult> GetForumRequests(int forumId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var forum = await _context.StudyGroupForums
                    .Where(f => f.DeletedAt == null)
                    .FirstOrDefaultAsync(f => f.Id == forumId);

                if (forum == null)
                {
                    return Json(new { data = new List<object>() });
                }

                // Check if user is the owner of the study group
                var isOwner = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == forum.StudyGroupId &&
                        m.UserId == currentUserId &&
                        m.Role == "Owner" &&
                        m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(new { data = new List<object>() });
                }

                var requests = await _context.StudyGroupForumMembers
                    .Where(fm => fm.ForumId == forumId &&
                        !fm.IsApproved &&
                        fm.DeletedAt == null)
                    .Include(fm => fm.User)
                    .OrderBy(fm => fm.RequestedAt)
                    .Select(fm => new
                    {
                        id = fm.Id,
                        userId = fm.UserId,
                        userName = $"{fm.User.FirstName} {fm.User.LastName}".Trim(),
                        email = fm.User.Email,
                        requestedAt = fm.RequestedAt.HasValue ? fm.RequestedAt.Value.ToString("MM/dd/yyyy hh:mm tt") : ""
                    })
                    .ToListAsync();

                return Json(new { data = requests });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        // POST: Approve forum join request
        [HttpPost]
        public async Task<IActionResult> ApproveForumRequest([FromBody] int requestId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var request = await _context.StudyGroupForumMembers
                    .Include(fm => fm.Forum)
                    .Where(fm => fm.DeletedAt == null)
                    .FirstOrDefaultAsync(fm => fm.Id == requestId);

                if (request == null)
                {
                    return Json(ResponseHelper.Failed("Request not found."));
                }

                // Check if user is the owner of the study group
                var isOwner = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == request.Forum.StudyGroupId &&
                        m.UserId == currentUserId &&
                        m.Role == "Owner" &&
                        m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("Only group owners can approve forum requests."));
                }

                request.IsApproved = true;
                request.JoinedAt = DateTime.Now;
                request.ModifiedBy = currentUserId ?? "";
                request.ModifiedByName = currentUserName;
                request.ModifiedAt = DateTime.Now;

                _context.StudyGroupForumMembers.Update(request);
                await _context.SaveChangesAsync();

                await _auditService.LogCustomActionAsync($"Approved forum join request for user {request.UserId} in forum {request.ForumId}");

                // Notify user and study group
                await _hubContext.Clients.Group($"StudyGroup_{request.Forum.StudyGroupId}")
                    .SendAsync("ForumRequestApproved", new
                    {
                        forumId = request.ForumId,
                        userId = request.UserId
                    });

                return Json(ResponseHelper.Success("Forum join request approved successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }

        // POST: Reject forum join request
        [HttpPost]
        public async Task<IActionResult> RejectForumRequest([FromBody] int requestId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var request = await _context.StudyGroupForumMembers
                    .Include(fm => fm.Forum)
                    .Where(fm => fm.DeletedAt == null)
                    .FirstOrDefaultAsync(fm => fm.Id == requestId);

                if (request == null)
                {
                    return Json(ResponseHelper.Failed("Request not found."));
                }

                // Check if user is the owner of the study group
                var isOwner = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == request.Forum.StudyGroupId &&
                        m.UserId == currentUserId &&
                        m.Role == "Owner" &&
                        m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("Only group owners can reject forum requests."));
                }

                request.DeletedBy = currentUserId;
                request.DeletedByName = currentUserName;
                request.DeletedAt = DateTime.Now;

                _context.StudyGroupForumMembers.Update(request);
                await _context.SaveChangesAsync();

                await _auditService.LogCustomActionAsync($"Rejected forum join request for user {request.UserId} in forum {request.ForumId}");

                // Notify study group
                await _hubContext.Clients.Group($"StudyGroup_{request.Forum.StudyGroupId}")
                    .SendAsync("ForumRequestRejected", new
                    {
                        forumId = request.ForumId,
                        userId = request.UserId
                    });

                return Json(ResponseHelper.Success("Forum join request rejected."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }

        // GET: Get forum posts
        [HttpGet]
        public async Task<IActionResult> GetForumPosts(int forumId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var forum = await _context.StudyGroupForums
                    .Where(f => f.DeletedAt == null)
                    .FirstOrDefaultAsync(f => f.Id == forumId);

                if (forum == null)
                {
                    return Json(new { data = new List<object>() });
                }

                // Check if user is an approved member of the forum
                var isForumMember = await _context.StudyGroupForumMembers
                    .AnyAsync(fm => fm.ForumId == forumId &&
                        fm.UserId == currentUserId &&
                        fm.IsApproved &&
                        fm.DeletedAt == null);

                if (!isForumMember)
                {
                    return Json(new { data = new List<object>() });
                }

                var posts = await _context.StudyGroupForumPosts
                    .Where(p => p.ForumId == forumId && p.DeletedAt == null)
                    .Include(p => p.User)
                    .Include(p => p.Images.Where(i => i.DeletedAt == null))
                    .OrderByDescending(p => p.PostedAt)
                    .Select(p => new
                    {
                        id = p.Id,
                        content = p.Content,
                        userId = p.UserId,
                        userName = $"{p.User.FirstName} {p.User.LastName}".Trim(),
                        postedAt = p.PostedAt.ToString("MMMM dd, yyyy hh:mm tt"),
                        images = p.Images.Select(i => new
                        {
                            id = i.Id,
                            path = i.ImagePath,
                            fileName = i.FileName
                        }).ToList()
                    })
                    .ToListAsync();

                return Json(new { data = posts });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        // POST: Create forum post
        [HttpPost]
        public async Task<IActionResult> CreateForumPost([FromForm] CreateForumPostRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var forum = await _context.StudyGroupForums
                    .Where(f => f.DeletedAt == null)
                    .FirstOrDefaultAsync(f => f.Id == request.ForumId);

                if (forum == null)
                {
                    return Json(ResponseHelper.Failed("Forum not found."));
                }

                // Check if user is an approved member of the forum
                var isForumMember = await _context.StudyGroupForumMembers
                    .AnyAsync(fm => fm.ForumId == request.ForumId &&
                        fm.UserId == currentUserId &&
                        fm.IsApproved &&
                        fm.DeletedAt == null);

                if (!isForumMember)
                {
                    return Json(ResponseHelper.Failed("Only approved forum members can post."));
                }

                var post = new StudyGroupForumPost
                {
                    ForumId = request.ForumId,
                    Content = request.Content,
                    UserId = currentUserId ?? "",
                    PostedAt = DateTime.Now,
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
                };

                _context.StudyGroupForumPosts.Add(post);
                await _context.SaveChangesAsync();

                // Handle image uploads
                var imageList = new List<object>();
                if (request.Images != null && request.Images.Any())
                {
                    var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "forums", request.ForumId.ToString());
                    if (!Directory.Exists(uploadsPath))
                    {
                        Directory.CreateDirectory(uploadsPath);
                    }

                    foreach (var image in request.Images)
                    {
                        // Validate image
                        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                        var fileExtension = Path.GetExtension(image.FileName).ToLower();

                        if (!allowedExtensions.Contains(fileExtension))
                        {
                            continue;
                        }

                        if (image.Length > 5 * 1024 * 1024) // 5MB limit
                        {
                            continue;
                        }

                        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                        var filePath = Path.Combine(uploadsPath, uniqueFileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await image.CopyToAsync(stream);
                        }

                        var postImage = new StudyGroupForumPostImage
                        {
                            PostId = post.Id,
                            ImagePath = $"/uploads/forums/{request.ForumId}/{uniqueFileName}",
                            FileName = image.FileName,
                            FileSize = image.Length,
                            ContentType = image.ContentType,
                            CreatedBy = currentUserId ?? "",
                            CreatedByName = currentUserName,
                            CreatedAt = DateTime.Now,
                            ModifiedBy = currentUserId ?? "",
                            ModifiedByName = currentUserName,
                            ModifiedAt = DateTime.Now
                        };

                        _context.StudyGroupForumPostImages.Add(postImage);
                        
                        imageList.Add(new
                        {
                            id = postImage.Id,
                            path = postImage.ImagePath,
                            fileName = postImage.FileName
                        });
                    }

                    await _context.SaveChangesAsync();
                }

                await _auditService.LogCreateAsync("StudyGroupForumPost", post.Id.ToString(), new
                {
                    post.Id,
                    post.ForumId,
                    ContentPreview = post.Content.Substring(0, Math.Min(50, post.Content.Length))
                });

                // Broadcast to forum members
                var postData = new
                {
                    id = post.Id,
                    content = post.Content,
                    userId = currentUserId,
                    userName = currentUserName,
                    postedAt = post.PostedAt.ToString("MMMM dd, yyyy hh:mm tt"),
                    images = imageList
                };

                await _hubContext.Clients.Group($"Forum_{request.ForumId}")
                    .SendAsync("ForumPostCreated", postData);

                return Json(ResponseHelper.Success("Post created successfully.", postData));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while creating the post."));
            }
        }

        // POST: Delete forum post
        [HttpPost]
        public async Task<IActionResult> DeleteForumPost([FromBody] int postId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var post = await _context.StudyGroupForumPosts
                    .Include(p => p.Forum)
                    .Where(p => p.DeletedAt == null)
                    .FirstOrDefaultAsync(p => p.Id == postId);

                if (post == null)
                {
                    return Json(ResponseHelper.Failed("Post not found."));
                }

                // Check if user is the post owner or group owner
                var isOwner = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == post.Forum.StudyGroupId &&
                        m.UserId == currentUserId &&
                        m.Role == "Owner" &&
                        m.DeletedAt == null);

                if (!isOwner && post.UserId != currentUserId)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to delete this post."));
                }

                post.DeletedBy = currentUserId;
                post.DeletedByName = currentUserName;
                post.DeletedAt = DateTime.Now;

                _context.StudyGroupForumPosts.Update(post);
                await _context.SaveChangesAsync();

                await _auditService.LogDeleteAsync("StudyGroupForumPost", post.Id.ToString(), new
                {
                    post.Id,
                    post.ForumId,
                    ContentPreview = post.Content.Substring(0, Math.Min(50, post.Content.Length))
                });

                // Broadcast to forum members
                await _hubContext.Clients.Group($"Forum_{post.ForumId}")
                    .SendAsync("ForumPostDeleted", postId);

                return Json(ResponseHelper.Success("Post deleted successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }
    }
}
