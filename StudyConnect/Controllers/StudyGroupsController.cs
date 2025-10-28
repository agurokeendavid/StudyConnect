using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Helpers;
using StudyConnect.Models;
using StudyConnect.Services;
using StudyConnect.ViewModels.StudyGroups;
using System.Security.Claims;
using StudyConnect.Requests;

namespace StudyConnect.Controllers
{
    [Authorize]
    public class StudyGroupsController : Controller
    {
        private readonly ILogger<StudyGroupsController> _logger;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public StudyGroupsController(
            ILogger<StudyGroupsController> logger,
            AppDbContext context,
            IAuditService auditService)
        {
            _logger = logger;
            _context = context;
            _auditService = auditService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Study Groups Management Page");
            return View();
        }

        [HttpGet]
        public async Task<ViewResult> AvailableStudyGroups()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Details(int id)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var studyGroup = await _context.StudyGroups
                    .Include(sg => sg.Category)
                    .Include(sg => sg.Members.Where(m => m.DeletedAt == null))
                        .ThenInclude(m => m.User)
                    .Where(sg => sg.DeletedAt == null)
                    .FirstOrDefaultAsync(sg => sg.Id == id);

                if (studyGroup == null)
                {
                    return NotFound();
                }

                // Check if current user is a member
                var currentMember = studyGroup.Members.FirstOrDefault(m => m.UserId == currentUserId);
                var isOwner = currentMember?.Role == "Owner";
                var isMember = currentMember != null;

                ViewBag.StudyGroupId = id;
                ViewBag.IsOwner = isOwner;
                ViewBag.IsMember = isMember;
                ViewBag.StudyGroupName = studyGroup.Name;
                ViewBag.StudyGroupDescription = studyGroup.Description;
                ViewBag.CategoryName = studyGroup.Category.Name;
                ViewBag.Privacy = studyGroup.Privacy;
                ViewBag.MaxMembers = studyGroup.MaximumNumbers;
                ViewBag.CurrentMemberCount = studyGroup.Members.Count(m => m.IsApproved);
                ViewBag.CreatedAt = studyGroup.CreatedAt.ToString("MMMM dd, yyyy");

                await _auditService.LogCustomActionAsync($"Viewed Study Group Details (ID: {id})");

                return View();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
            }

            return NotFound();
        }

        [HttpGet]
        public async Task<ViewResult> MyStudyGroups()
        {
            await _auditService.LogCustomActionAsync("Viewed My Study Groups Page");
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Upsert(int? id)
        {
            try
            {
                if (id.HasValue && id.Value > 0)
                {
                    await _auditService.LogCustomActionAsync($"Viewed Edit Study Group Page (ID: {id})");

                    var studyGroup = await _context.StudyGroups
                        .Where(sg => sg.DeletedAt == null)
                        .FirstOrDefaultAsync(sg => sg.Id == id.Value);

                    if (studyGroup is null)
                    {
                        return NotFound();
                    }

                    var viewModel = new UpsertViewModel()
                    {
                        Id = studyGroup.Id,
                        Name = studyGroup.Name,
                        Description = studyGroup.Description,
                        MaximumNumbers = studyGroup.MaximumNumbers,
                        Privacy = studyGroup.Privacy,
                        CategoryId = studyGroup.CategoryId
                    };
                    return View(viewModel);
                }
                else
                {
                    await _auditService.LogCustomActionAsync("Viewed Create Study Group Page");
                }

                return View(new UpsertViewModel());
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
            }

            return NotFound();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Upsert(UpsertViewModel viewModel)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    string errorMessages = string.Join("\n", ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage));
                    return Json(ResponseHelper.Failed(errorMessages));
                }

                // Get current user ID
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();
                if (string.IsNullOrEmpty(currentUserName))
                {
                    currentUserName = User.Identity?.Name ?? "System";
                }

                // Check if updating existing study group
                if (viewModel.Id.HasValue && viewModel.Id.Value > 0)
                {
                    var studyGroup = await _context.StudyGroups
                        .Where(sg => sg.DeletedAt == null)
                        .FirstOrDefaultAsync(sg => sg.Id == viewModel.Id.Value);

                    if (studyGroup == null)
                    {
                        return Json(ResponseHelper.Failed("Study group not found."));
                    }

                    // Store old values for audit
                    var oldValues = new
                    {
                        studyGroup.Name,
                        studyGroup.Description,
                        studyGroup.MaximumNumbers,
                        studyGroup.Privacy,
                        studyGroup.CategoryId
                    };

                    // Update study group properties
                    studyGroup.Name = viewModel.Name;
                    studyGroup.Description = viewModel.Description;
                    studyGroup.MaximumNumbers = viewModel.MaximumNumbers;
                    studyGroup.Privacy = viewModel.Privacy;
                    studyGroup.CategoryId = viewModel.CategoryId;
                    studyGroup.ModifiedBy = currentUserId ?? "";
                    studyGroup.ModifiedByName = currentUserName;
                    studyGroup.ModifiedAt = DateTime.UtcNow;

                    _context.StudyGroups.Update(studyGroup);
                    await _context.SaveChangesAsync();

                    // Store new values for audit
                    var newValues = new
                    {
                        studyGroup.Name,
                        studyGroup.Description,
                        studyGroup.MaximumNumbers,
                        studyGroup.Privacy,
                        studyGroup.CategoryId
                    };

                    // Log the update
                    await _auditService.LogUpdateAsync("StudyGroup", studyGroup.Id.ToString(), oldValues, newValues);

                    return Json(ResponseHelper.Success("Study group updated successfully.", null, redirectUrl: Url.Action("Details", "StudyGroups", new { id = studyGroup.Id })));
                }
                else
                {
                    // Creating new study group
                    var studyGroup = new StudyGroup
                    {
                        Name = viewModel.Name,
                        Description = viewModel.Description,
                        MaximumNumbers = viewModel.MaximumNumbers,
                        Privacy = viewModel.Privacy,
                        CategoryId = viewModel.CategoryId,
                        CreatedBy = currentUserId ?? "",
                        CreatedByName = currentUserName,
                        CreatedAt = DateTime.UtcNow,
                        ModifiedBy = currentUserId ?? "",
                        ModifiedByName = currentUserName,
                        ModifiedAt = DateTime.UtcNow
                    };

                    _context.StudyGroups.Add(studyGroup);
                    await _context.SaveChangesAsync();

                    // Automatically add the creator as the owner member
                    var ownerMember = new StudyGroupMember
                    {
                        StudyGroupId = studyGroup.Id,
                        UserId = currentUserId ?? "",
                        Role = "Owner",
                        IsApproved = true,
                        JoinedAt = DateTime.UtcNow,
                        CreatedBy = currentUserId ?? "",
                        CreatedByName = currentUserName,
                        CreatedAt = DateTime.UtcNow,
                        ModifiedBy = currentUserId ?? "",
                        ModifiedByName = currentUserName,
                        ModifiedAt = DateTime.UtcNow
                    };

                    _context.StudyGroupMembers.Add(ownerMember);
                    await _context.SaveChangesAsync();

                    // Log the create action
                    var newValues = new
                    {
                        studyGroup.Id,
                        studyGroup.Name,
                        studyGroup.Description,
                        studyGroup.MaximumNumbers,
                        studyGroup.Privacy,
                        studyGroup.CategoryId,
                        OwnerMemberId = ownerMember.Id
                    };
                    await _auditService.LogCreateAsync("StudyGroup", studyGroup.Id.ToString(), newValues);

                    return Json(ResponseHelper.Success("Study group created successfully.", null, redirectUrl: Url.Action("Details", "StudyGroups", new { id = studyGroup.Id})));
                }
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
            }

            return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _context.StudyGroupCategories
                    .Where(c => c.DeletedAt == null)
                    .OrderBy(c => c.Name)
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.Name
                    })
                    .ToListAsync();

                return Json(categories);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new List<object>());
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMembers(int studyGroupId)
        {
            try
            {
                var members = await _context.StudyGroupMembers
                    .Where(m => m.StudyGroupId == studyGroupId && m.DeletedAt == null)
                    .Include(m => m.User)
                    .OrderBy(m => m.Role == "Owner" ? 0 : m.Role == "Admin" ? 1 : 2)
                    .ThenBy(m => m.JoinedAt)
                    .Select(m => new
                    {
                        id = m.Id,
                        userId = m.UserId,
                        userName = $"{m.User.FirstName} {m.User.LastName}".Trim(),
                        email = m.User.Email,
                        role = m.Role,
                        isApproved = m.IsApproved,
                        joinedAt = m.JoinedAt.HasValue ? m.JoinedAt.Value.ToString("MM/dd/yyyy hh:mm tt") : ""
                    })
                    .ToListAsync();

                return Json(new { data = members });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddMember([FromBody] AddMemberRequest request)
        {
            try
            {
                // Get current user ID
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                // If userId is not provided, use current user
                var targetUserId = string.IsNullOrEmpty(request.UserId) ? currentUserId : request.UserId;

                // Check if study group exists
                var studyGroup = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null)
                    .FirstOrDefaultAsync(sg => sg.Id == request.StudyGroupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                // Check if user is already a member
                var existingMember = await _context.StudyGroupMembers
                    .Where(m => m.DeletedAt == null)
                    .FirstOrDefaultAsync(m => m.StudyGroupId == request.StudyGroupId && m.UserId == targetUserId);

                if (existingMember != null)
                {
                    return Json(ResponseHelper.Failed("User is already a member of this group."));
                }

                // Check if group has reached maximum capacity
                if (studyGroup.MaximumNumbers.HasValue)
                {
                    var currentMemberCount = await _context.StudyGroupMembers
                        .Where(m => m.StudyGroupId == request.StudyGroupId && m.DeletedAt == null && m.IsApproved)
                        .CountAsync();

                    if (currentMemberCount >= studyGroup.MaximumNumbers.Value)
                    {
                        return Json(ResponseHelper.Failed("Study group has reached its maximum capacity."));
                    }
                }

                // Add new member
                var newMember = new StudyGroupMember
                {
                    StudyGroupId = request.StudyGroupId,
                    UserId = targetUserId ?? "",
                    Role = "Member",
                    IsApproved = studyGroup.Privacy == "Public", // Auto-approve for public groups
                    JoinedAt = studyGroup.Privacy == "Public" ? DateTime.UtcNow : (DateTime?)null,
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.UtcNow
                };

                _context.StudyGroupMembers.Add(newMember);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogCreateAsync("StudyGroupMember", newMember.Id.ToString(), new
                {
                    newMember.Id,
                    newMember.StudyGroupId,
                    newMember.UserId,
                    newMember.Role
                });

                var message = studyGroup.Privacy == "Public"
                    ? "Successfully joined the study group."
                    : "Join request sent. Waiting for approval from the group owner.";

                return Json(ResponseHelper.Success(message));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> RemoveMember([FromBody] int memberId)
        {
            try
            {
                // Get current user ID
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var member = await _context.StudyGroupMembers
                    .Where(m => m.DeletedAt == null)
                    .FirstOrDefaultAsync(m => m.Id == memberId);

                if (member == null)
                {
                    return Json(ResponseHelper.Failed("Member not found."));
                }

                // Prevent removing the owner
                if (member.Role == "Owner")
                {
                    return Json(ResponseHelper.Failed("Cannot remove the group owner."));
                }

                // Soft delete
                member.DeletedBy = currentUserId;
                member.DeletedByName = currentUserName;
                member.DeletedAt = DateTime.UtcNow;

                _context.StudyGroupMembers.Update(member);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogDeleteAsync("StudyGroupMember", member.Id.ToString(), new
                {
                    member.Id,
                    member.StudyGroupId,
                    member.UserId,
                    member.Role
                });

                return Json(ResponseHelper.Success("Member removed successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateMemberRole([FromBody] UpdateMemberRoleRequest request)
        {
            try
            {
                // Get current user ID
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var member = await _context.StudyGroupMembers
                    .Where(m => m.DeletedAt == null)
                    .FirstOrDefaultAsync(m => m.Id == request.MemberId);

                if (member == null)
                {
                    return Json(ResponseHelper.Failed("Member not found."));
                }

                // Prevent changing owner role
                if (member.Role == "Owner")
                {
                    return Json(ResponseHelper.Failed("Cannot change the owner's role."));
                }

                var oldRole = member.Role;
                member.Role = request.NewRole;
                member.ModifiedBy = currentUserId ?? "";
                member.ModifiedByName = currentUserName;
                member.ModifiedAt = DateTime.UtcNow;

                _context.StudyGroupMembers.Update(member);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogUpdateAsync("StudyGroupMember", member.Id.ToString(),
                    new { Role = oldRole },
                    new { Role = member.Role });

                return Json(ResponseHelper.Success("Member role updated successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMyStudyGroups()
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var myGroups = await _context.StudyGroupMembers
                    .Where(m => m.UserId == currentUserId && m.DeletedAt == null)
                    .Include(m => m.StudyGroup)
                    .ThenInclude(sg => sg.Category)
                    .Where(m => m.StudyGroup.DeletedAt == null)
                    .OrderByDescending(m => m.StudyGroup.CreatedAt) // Order by DateTime, not formatted string
                    .Select(m => new
                    {
                        id = m.StudyGroup.Id,
                        name = m.StudyGroup.Name,
                        description = m.StudyGroup.Description,
                        privacy = m.StudyGroup.Privacy,
                        maximumNumbers = m.StudyGroup.MaximumNumbers,
                        categoryName = m.StudyGroup.Category.Name,
                        categoryId = m.StudyGroup.CategoryId,
                        role = m.Role,
                        isApproved = m.StudyGroup.IsApproved,
                        isRejected = m.StudyGroup.IsRejected,
                        memberCount = _context.StudyGroupMembers
                            .Count(sgm => sgm.StudyGroupId == m.StudyGroup.Id && sgm.DeletedAt == null),
                        createdAt = m.StudyGroup.CreatedAt // Return DateTime, format in client,
                    })
                    .ToListAsync();

                // Format the dates after retrieving from database
                var formattedGroups = myGroups.Select(g => new
                {
                    g.id,
                    g.name,
                    g.description,
                    g.privacy,
                    g.maximumNumbers,
                    g.categoryName,
                    g.categoryId,
                    g.role,
                    g.isApproved,
                    g.isRejected,
                    g.memberCount,
                    createdAt = g.createdAt.ToString("MMMM dd, yyyy") // Format here instead
                }).ToList();

                return Json(new { data = formattedGroups });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAvailableStudyGroups()
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Get IDs of groups the user is already a member of
                var userGroupIds = await _context.StudyGroupMembers
                    .Where(m => m.UserId == currentUserId && m.DeletedAt == null)
                    .Select(m => m.StudyGroupId)
                    .ToListAsync();

                // Get all study groups that the user is not a member of
                var availableGroups = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null && sg.IsApproved && !userGroupIds.Contains(sg.Id))
                    .Include(sg => sg.Category)
                    .OrderByDescending(sg => sg.CreatedAt)
                    .Select(sg => new
                    {
                        id = sg.Id,
                        name = sg.Name,
                        description = sg.Description,
                        privacy = sg.Privacy,
                        maximumNumbers = sg.MaximumNumbers,
                        categoryName = sg.Category.Name,
                        categoryId = sg.CategoryId,
                        isApproved = sg.IsApproved,
                        isRejected = sg.IsRejected,
                        memberCount = _context.StudyGroupMembers
                            .Count(sgm => sgm.StudyGroupId == sg.Id && sgm.DeletedAt == null && sgm.IsApproved),
                        createdAt = sg.CreatedAt
                    })
                    .ToListAsync();

                // Format the dates after retrieving from database
                var formattedGroups = availableGroups.Select(g => new
                {
                    g.id,
                    g.name,
                    g.description,
                    g.privacy,
                    g.maximumNumbers,
                    g.categoryName,
                    g.categoryId,
                    g.isApproved,
                    g.isRejected,
                    g.memberCount,
                    isFull = g.maximumNumbers.HasValue && g.memberCount >= g.maximumNumbers.Value,
                    createdAt = g.createdAt.ToString("MMMM dd, yyyy")
                }).ToList();

                return Json(new { data = formattedGroups });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMembershipRequests(int studyGroupId)
        {
            try
            {
                var requests = await _context.StudyGroupMembers
            .Where(m => m.StudyGroupId == studyGroupId && m.DeletedAt == null && !m.IsApproved)
          .Include(m => m.User)
         .OrderBy(m => m.CreatedAt)
               .Select(m => new
               {
                   id = m.Id,
                   userId = m.UserId,
                   userName = $"{m.User.FirstName} {m.User.LastName}".Trim(),
                   email = m.User.Email,
                   joinedAt = m.CreatedAt.ToString("MM/dd/yyyy hh:mm tt"),
                   isApproved = m.IsApproved
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

        [HttpPost]
        public async Task<IActionResult> ApproveRequest([FromBody] int memberId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var member = await _context.StudyGroupMembers
                   .Include(m => m.StudyGroup)
                    .Where(m => m.DeletedAt == null)
                  .FirstOrDefaultAsync(m => m.Id == memberId);

                if (member == null)
                {
                    return Json(ResponseHelper.Failed("Request not found."));
                }

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
                        .AnyAsync(m => m.StudyGroupId == member.StudyGroupId && m.UserId == currentUserId && m.Role == "Owner" && m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to approve requests."));
                }

                member.IsApproved = true;
                member.JoinedAt = DateTime.UtcNow;
                member.ModifiedBy = currentUserId ?? "";
                member.ModifiedByName = currentUserName;
                member.ModifiedAt = DateTime.UtcNow;

                _context.StudyGroupMembers.Update(member);
                await _context.SaveChangesAsync();

                await _auditService.LogCustomActionAsync($"Approved membership request for user {member.UserId} in study group {member.StudyGroupId}");

                return Json(ResponseHelper.Success("Membership request approved successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> RejectRequest([FromBody] int memberId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var member = await _context.StudyGroupMembers
                .Where(m => m.DeletedAt == null)
                  .FirstOrDefaultAsync(m => m.Id == memberId);

                if (member == null)
                {
                    return Json(ResponseHelper.Failed("Request not found."));
                }

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
  .AnyAsync(m => m.StudyGroupId == member.StudyGroupId && m.UserId == currentUserId && m.Role == "Owner" && m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to reject requests."));
                }

                // Soft delete
                member.DeletedBy = currentUserId;
                member.DeletedByName = currentUserName;
                member.DeletedAt = DateTime.UtcNow;

                _context.StudyGroupMembers.Update(member);
                await _context.SaveChangesAsync();

                await _auditService.LogCustomActionAsync($"Rejected membership request for user {member.UserId} in study group {member.StudyGroupId}");

                return Json(ResponseHelper.Success("Membership request rejected."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> SaveMeetingLink([FromBody] SaveMeetingLinkRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
                       .AnyAsync(m => m.StudyGroupId == request.StudyGroupId && m.UserId == currentUserId && m.Role == "Owner" && m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to update meeting link."));
                }

                var studyGroup = await _context.StudyGroups
              .Where(sg => sg.DeletedAt == null)
                .FirstOrDefaultAsync(sg => sg.Id == request.StudyGroupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                // For now, we'll store it in the description or create a new field
                // TODO: Add MeetingLink property to StudyGroup model
                // studyGroup.MeetingLink = request.MeetingLink;

                studyGroup.ModifiedBy = currentUserId ?? "";
                studyGroup.ModifiedByName = currentUserName;
                studyGroup.ModifiedAt = DateTime.UtcNow;

                _context.StudyGroups.Update(studyGroup);
                await _context.SaveChangesAsync();

                await _auditService.LogCustomActionAsync($"Updated Google Meet link for study group {request.StudyGroupId}");

                return Json(ResponseHelper.Success("Meeting link saved successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMeetingLink(int studyGroupId)
        {
            try
            {
                var studyGroup = await _context.StudyGroups
             .Where(sg => sg.DeletedAt == null)
            .FirstOrDefaultAsync(sg => sg.Id == studyGroupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                // TODO: Return actual meeting link from database
                // return Json(ResponseHelper.Success("", studyGroup.MeetingLink));
                return Json(ResponseHelper.Success("", ""));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllStudyGroupsForAdmin()
        {
            try
            {
                var studyGroups = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null)
                    .Include(sg => sg.Category)
                    .Include(sg => sg.Members.Where(m => m.DeletedAt == null && m.Role == "Owner"))
                        .ThenInclude(m => m.User)
                    .OrderByDescending(sg => sg.CreatedAt)
                    .Select(sg => new
                    {
                        id = sg.Id,
                        name = sg.Name,
                        description = sg.Description,
                        privacy = sg.Privacy,
                        maximumNumbers = sg.MaximumNumbers,
                        categoryName = sg.Category.Name,
                        categoryId = sg.CategoryId,
                        isApproved = sg.IsApproved,
                        isRejected = sg.IsRejected, // Add this field if you implement rejection
                        memberCount = _context.StudyGroupMembers
                            .Count(sgm => sgm.StudyGroupId == sg.Id && sgm.DeletedAt == null && sgm.IsApproved),
                        ownerName = sg.Members.FirstOrDefault() != null
   ? $"{sg.Members.FirstOrDefault().User.FirstName} {sg.Members.FirstOrDefault().User.LastName}".Trim()
           : "Unknown",
                        createdAt = sg.CreatedAt
                    })
                    .ToListAsync();

                // Format the dates after retrieving from database
                var formattedGroups = studyGroups.Select(g => new
                {
                    g.id,
                    g.name,
                    g.description,
                    g.privacy,
                    g.maximumNumbers,
                    g.categoryName,
                    g.categoryId,
                    g.isApproved,
                    g.isRejected,
                    g.memberCount,
                    g.ownerName,
                    isFull = g.maximumNumbers.HasValue && g.memberCount >= g.maximumNumbers.Value,
                    createdAt = g.createdAt.ToString("MMMM dd, yyyy")
                }).ToList();

                return Json(new { data = formattedGroups });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveStudyGroup([FromBody] int groupId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var studyGroup = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null)
 .FirstOrDefaultAsync(sg => sg.Id == groupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                if (studyGroup.IsApproved)
                {
                    return Json(ResponseHelper.Failed("Study group is already approved."));
                }

                var oldStatus = studyGroup.IsApproved;
                studyGroup.IsApproved = true;
                studyGroup.IsRejected = false;
                studyGroup.ModifiedBy = currentUserId ?? "";
                studyGroup.ModifiedByName = currentUserName;
                studyGroup.ModifiedAt = DateTime.UtcNow;

                _context.StudyGroups.Update(studyGroup);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogUpdateAsync("StudyGroup", studyGroup.Id.ToString(),
                    new { IsApproved = oldStatus },
                    new { IsApproved = studyGroup.IsApproved });

                return Json(ResponseHelper.Success("Study group approved successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DisapproveStudyGroup([FromBody] int groupId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var studyGroup = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null)
                    .FirstOrDefaultAsync(sg => sg.Id == groupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                if (!studyGroup.IsApproved)
                {
                    return Json(ResponseHelper.Failed("Study group is already not approved."));
                }

                var oldStatus = studyGroup.IsApproved;
                studyGroup.IsApproved = false;
                studyGroup.IsRejected = true;
                studyGroup.ModifiedBy = currentUserId ?? "";
                studyGroup.ModifiedByName = currentUserName;
                studyGroup.ModifiedAt = DateTime.UtcNow;

                _context.StudyGroups.Update(studyGroup);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogUpdateAsync("StudyGroup", studyGroup.Id.ToString(),
                    new { IsApproved = oldStatus },
                    new { IsApproved = studyGroup.IsApproved });

                return Json(ResponseHelper.Success("Study group disapproved successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectStudyGroup([FromBody] RejectStudyGroupRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var studyGroup = await _context.StudyGroups
                    .Where(sg => sg.DeletedAt == null)
                    .FirstOrDefaultAsync(sg => sg.Id == request.GroupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                // Soft delete the study group
                studyGroup.IsApproved = false;
                studyGroup.IsRejected = true;
                studyGroup.ModifiedAt = DateTime.Now;
                studyGroup.ModifiedBy = currentUserId ?? "";
                studyGroup.ModifiedByName = currentUserName;

                _context.StudyGroups.Update(studyGroup);
                await _context.SaveChangesAsync();

                // Log the action with reason
                var logDetails = new
                {
                    studyGroup.Id,
                    studyGroup.Name,
                    Reason = request.Reason ?? "No reason provided"
                };
                await _auditService.LogDeleteAsync("StudyGroup", studyGroup.Id.ToString(), logDetails);

                return Json(ResponseHelper.Success("Study group rejected successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }
    }
}
