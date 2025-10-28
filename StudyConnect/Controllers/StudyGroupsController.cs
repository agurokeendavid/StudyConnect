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
        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Study Groups List Page");
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

                    return Json(ResponseHelper.Success("Study group updated successfully.", null, redirectUrl: Url.Action("Index", "StudyGroups")));
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

                    return Json(ResponseHelper.Success("Study group created successfully.", null, redirectUrl: Url.Action("Index", "StudyGroups")));
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
                    .FirstOrDefaultAsync(m => m.StudyGroupId == request.StudyGroupId && m.UserId == request.UserId);

                if (existingMember != null)
                {
                    return Json(ResponseHelper.Failed("User is already a member of this group."));
                }

                // Check if group has reached maximum capacity
                if (studyGroup.MaximumNumbers.HasValue)
                {
                    var currentMemberCount = await _context.StudyGroupMembers
                        .Where(m => m.StudyGroupId == request.StudyGroupId && m.DeletedAt == null)
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
                    UserId = request.UserId,
                    Role = "Member",
                    IsApproved = studyGroup.Privacy == "Public", // Auto-approve for public groups
                    JoinedAt = DateTime.UtcNow,
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

                return Json(ResponseHelper.Success("Member added successfully."));
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
                        memberCount = _context.StudyGroupMembers
                            .Count(sgm => sgm.StudyGroupId == m.StudyGroup.Id && sgm.DeletedAt == null),
                        createdAt = m.StudyGroup.CreatedAt // Return DateTime, format in client
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
    }
}
