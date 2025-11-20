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
using Microsoft.AspNetCore.SignalR;
using StudyConnect.Hubs;

namespace StudyConnect.Controllers
{
    [Authorize]
    public class StudyGroupsController : Controller
    {
        private readonly ILogger<StudyGroupsController> _logger;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;
        private readonly IHubContext<StudyGroupHub> _hubContext;
        private readonly ISubscriptionService _subscriptionService;

        public StudyGroupsController(
            ILogger<StudyGroupsController> logger,
            AppDbContext context,
            IAuditService auditService,
            IHubContext<StudyGroupHub> hubContext,
            ISubscriptionService subscriptionService)
        {
            _logger = logger;
            _context = context;
            _auditService = auditService;
            _hubContext = hubContext;
            _subscriptionService = subscriptionService;
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
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Check subscription status for students only
            if (!User.IsInRole("Admin") && !string.IsNullOrEmpty(currentUserId))
            {
                var hasActiveSubscription = await _subscriptionService.HasActiveSubscriptionAsync(currentUserId);
                var isExpired = await _subscriptionService.IsSubscriptionExpiredAsync(currentUserId);

                ViewBag.HasActiveSubscription = hasActiveSubscription;
                ViewBag.IsSubscriptionExpired = isExpired;

                if (isExpired)
                {
                    ViewBag.ExpiredMessage = "Your subscription has expired. Please upgrade to continue accessing study groups.";
                }
            }

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
                var currentMember = studyGroup.Members.FirstOrDefault(m => m.UserId == currentUserId && m.IsApproved);
                var isOwner = currentMember?.Role == "Owner";
                var isMember = currentMember != null;

                ViewBag.StudyGroupId = id;
                ViewBag.IsOwner = isOwner;
                ViewBag.IsMember = isMember;
                ViewBag.IsApproved = studyGroup.IsApproved;
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
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Check subscription status for students only
            if (!User.IsInRole("Admin") && !string.IsNullOrEmpty(currentUserId))
            {
                var hasActiveSubscription = await _subscriptionService.HasActiveSubscriptionAsync(currentUserId);
                var isExpired = await _subscriptionService.IsSubscriptionExpiredAsync(currentUserId);

                ViewBag.HasActiveSubscription = hasActiveSubscription;
                ViewBag.IsSubscriptionExpired = isExpired;

                if (isExpired)
                {
                    ViewBag.ExpiredMessage = "Your subscription has expired. Please upgrade to continue accessing your study groups.";
                }
            }

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
                    studyGroup.CategoryId = Convert.ToInt32(viewModel.CategoryId);
                    studyGroup.ModifiedBy = currentUserId ?? "";
                    studyGroup.ModifiedByName = currentUserName;
                    studyGroup.ModifiedAt = DateTime.Now;

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
                        CategoryId = Convert.ToInt32(viewModel.CategoryId),
                        CreatedBy = currentUserId ?? "",
                        CreatedByName = currentUserName,
                        CreatedAt = DateTime.Now,
                        ModifiedBy = currentUserId ?? "",
                        ModifiedByName = currentUserName,
                        ModifiedAt = DateTime.Now
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
                        JoinedAt = DateTime.Now,
                        CreatedBy = currentUserId ?? "",
                        CreatedByName = currentUserName,
                        CreatedAt = DateTime.Now,
                        ModifiedBy = currentUserId ?? "",
                        ModifiedByName = currentUserName,
                        ModifiedAt = DateTime.Now
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

                    return Json(ResponseHelper.Success("Study group created successfully.", null, redirectUrl: Url.Action("Details", "StudyGroups", new { id = studyGroup.Id })));
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
                    JoinedAt = studyGroup.Privacy == "Public" ? DateTime.Now : (DateTime?)null,
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
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
                member.DeletedAt = DateTime.Now;

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
                member.ModifiedAt = DateTime.Now;

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
        public async Task<IActionResult> ApproveRequest(int memberId)
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
                member.JoinedAt = DateTime.Now;
                member.ModifiedBy = currentUserId ?? "";
                member.ModifiedByName = currentUserName;
                member.ModifiedAt = DateTime.Now;

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
        public async Task<IActionResult> RejectRequest(int memberId)
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
                member.DeletedAt = DateTime.Now;

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
                studyGroup.ModifiedAt = DateTime.Now;

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
                studyGroup.ModifiedAt = DateTime.Now;

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
                studyGroup.ModifiedAt = DateTime.Now;

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

        [HttpPost]
        public async Task<IActionResult> UploadResource([FromForm] UploadResourceRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                // Validate the request
                if (request.File == null || request.File.Length == 0)
                {
                    return Json(ResponseHelper.Failed("Please select a file to upload."));
                }

                // Check if study group exists
                var studyGroup = await _context.StudyGroups
          .Where(sg => sg.DeletedAt == null)
        .FirstOrDefaultAsync(sg => sg.Id == request.StudyGroupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                // Check if user is a member
                var isMember = await _context.StudyGroupMembers
              .AnyAsync(m => m.StudyGroupId == request.StudyGroupId &&
         m.UserId == currentUserId &&
                  m.DeletedAt == null);

                if (!isMember)
                {
                    return Json(ResponseHelper.Failed("You must be a member to upload resources."));
                }

                // Validate file size (max 50MB)
                if (request.File.Length > 50 * 1024 * 1024)
                {
                    return Json(ResponseHelper.Failed("File size must not exceed 50MB."));
                }

                // Validate file type
                var allowedExtensions = new[] { ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".gif" };
                var fileExtension = Path.GetExtension(request.File.FileName).ToLower();

                if (!allowedExtensions.Contains(fileExtension))
                {
                    return Json(ResponseHelper.Failed("Invalid file type. Supported formats: PDF, Word, PowerPoint, Excel, Images."));
                }

                // Create uploads directory if it doesn't exist
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "study-groups", request.StudyGroupId.ToString());
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                // Generate unique filename
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, uniqueFileName);

                // Save file to disk
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.File.CopyToAsync(stream);
                }

                // Create database record
                var resource = new StudyGroupResource
                {
                    StudyGroupId = request.StudyGroupId,
                    Title = request.Title,
                    Description = request.Description,
                    FileName = request.File.FileName,
                    FilePath = $"/uploads/study-groups/{request.StudyGroupId}/{uniqueFileName}",
                    FileType = request.File.ContentType,
                    FileExtension = fileExtension,
                    FileSize = request.File.Length,
                    UploadedByUserId = currentUserId ?? "",
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
                };

                _context.StudyGroupResources.Add(resource);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogCreateAsync("StudyGroupResource", resource.Id.ToString(), new
                {
                    resource.Id,
                    resource.StudyGroupId,
                    resource.Title,
                    resource.FileName
                });

                return Json(ResponseHelper.Success("Resource uploaded successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while uploading the file."));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetResources(int studyGroupId)
        {
            try
            {
                var resources = await _context.StudyGroupResources
                    .Where(r => r.StudyGroupId == studyGroupId && r.DeletedAt == null)
                     .Include(r => r.UploadedByUser)
               .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        id = r.Id,
                        title = r.Title,
                        description = r.Description,
                        fileName = r.FileName,
                        filePath = r.FilePath,
                        fileType = r.FileType,
                        fileExtension = r.FileExtension,
                        fileSize = r.FileSize,
                        uploadedByName = $"{r.UploadedByUser.FirstName} {r.UploadedByUser.LastName}".Trim(),
                        uploadedByUserId = r.UploadedByUserId,
                        downloadCount = r.DownloadCount,
                        createdAt = r.CreatedAt.ToString("MMMM dd, yyyy hh:mm tt")
                    })
                        .ToListAsync();

                return Json(new { data = resources });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteResource([FromBody] int resourceId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var resource = await _context.StudyGroupResources
         .Where(r => r.DeletedAt == null)
               .FirstOrDefaultAsync(r => r.Id == resourceId);

                if (resource == null)
                {
                    return Json(ResponseHelper.Failed("Resource not found."));
                }

                // Check if user is owner, admin, or the uploader
                var member = await _context.StudyGroupMembers
                    .Where(m => m.StudyGroupId == resource.StudyGroupId &&
             m.UserId == currentUserId &&
                  m.DeletedAt == null)
                  .FirstOrDefaultAsync();

                bool canDelete = member != null && (member.Role == "Owner" || member.Role == "Admin")
                     || resource.UploadedByUserId == currentUserId;

                if (!canDelete)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to delete this resource."));
                }

                // Soft delete
                resource.DeletedBy = currentUserId;
                resource.DeletedByName = currentUserName;
                resource.DeletedAt = DateTime.Now;

                _context.StudyGroupResources.Update(resource);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogDeleteAsync("StudyGroupResource", resource.Id.ToString(), new
                {
                    resource.Id,
                    resource.StudyGroupId,
                    resource.Title,
                    resource.FileName
                });

                return Json(ResponseHelper.Success("Resource deleted successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }

        [HttpGet]
        public async Task<IActionResult> DownloadResource(int resourceId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var resource = await _context.StudyGroupResources
          .Where(r => r.DeletedAt == null)
       .FirstOrDefaultAsync(r => r.Id == resourceId);

                if (resource == null)
                {
                    return NotFound();
                }

                // Check if user is a member
                var isMember = await _context.StudyGroupMembers
               .AnyAsync(m => m.StudyGroupId == resource.StudyGroupId &&
            m.UserId == currentUserId &&
               m.IsApproved &&
        m.DeletedAt == null);

                if (!isMember)
                {
                    return Json(ResponseHelper.Failed("You must be a member to download resources."));
                }

                // Increment download count
                resource.DownloadCount++;
                _context.StudyGroupResources.Update(resource);
                await _context.SaveChangesAsync();

                // Get file path
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", resource.FilePath.TrimStart('/'));

                if (!System.IO.File.Exists(filePath))
                {
                    return Json(ResponseHelper.Failed("File not found on server."));
                }

                var memory = new MemoryStream();
                using (var stream = new FileStream(filePath, FileMode.Open))
                {
                    await stream.CopyToAsync(memory);
                }
                memory.Position = 0;

                return File(memory, resource.FileType, resource.FileName);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An error occurred while downloading the file."));
            }
        }

        [Authorize(Roles = "Student")]
        [HttpGet]
        public async Task<ViewResult> MyResources()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Check subscription status
            if (!string.IsNullOrEmpty(currentUserId))
            {
                var hasActiveSubscription = await _subscriptionService.HasActiveSubscriptionAsync(currentUserId);
                var isExpired = await _subscriptionService.IsSubscriptionExpiredAsync(currentUserId);

                ViewBag.HasActiveSubscription = hasActiveSubscription;
                ViewBag.IsSubscriptionExpired = isExpired;

                if (isExpired)
                {
                    ViewBag.ExpiredMessage = "Your subscription has expired. Please upgrade to continue accessing your resources.";
                }
            }

            return View();
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public ViewResult AllResources()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetMyResources()
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var resources = await _context.StudyGroupResources
         .Where(r => r.UploadedByUserId == currentUserId && r.DeletedAt == null)
     .Include(r => r.StudyGroup)
      .ThenInclude(sg => sg.Category)
 .Include(r => r.UploadedByUser)
       .OrderByDescending(r => r.CreatedAt)
 .Select(r => new
 {
     id = r.Id,
     title = r.Title,
     description = r.Description,
     fileName = r.FileName,
     filePath = r.FilePath,
     fileType = r.FileType,
     fileExtension = r.FileExtension,
     fileSize = r.FileSize,
     studyGroupId = r.StudyGroupId,
     studyGroupName = r.StudyGroup.Name,
     categoryName = r.StudyGroup.Category.Name,
     uploadedByName = $"{r.UploadedByUser.FirstName} {r.UploadedByUser.LastName}".Trim(),
     uploadedByUserId = r.UploadedByUserId,
     downloadCount = r.DownloadCount,
     createdAt = r.CreatedAt.ToString("MMMM dd, yyyy hh:mm tt")
 })
     .ToListAsync();

                return Json(new { data = resources });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllResources()
        {
            try
            {
                var resources = await _context.StudyGroupResources
              .Where(r => r.DeletedAt == null)
                .Include(r => r.StudyGroup)
            .ThenInclude(sg => sg.Category)
         .Include(r => r.UploadedByUser)
                   .OrderByDescending(r => r.CreatedAt)
             .Select(r => new
             {
                 id = r.Id,
                 title = r.Title,
                 description = r.Description,
                 fileName = r.FileName,
                 filePath = r.FilePath,
                 fileType = r.FileType,
                 fileExtension = r.FileExtension,
                 fileSize = r.FileSize,
                 studyGroupId = r.StudyGroupId,
                 studyGroupName = r.StudyGroup.Name,
                 categoryName = r.StudyGroup.Category.Name,
                 privacy = r.StudyGroup.Privacy,
                 uploadedByName = $"{r.UploadedByUser.FirstName} {r.UploadedByUser.LastName}".Trim(),
                 uploadedByUserId = r.UploadedByUserId,
                 uploadedByEmail = r.UploadedByUser.Email,
                 downloadCount = r.DownloadCount,
                 createdAt = r.CreatedAt.ToString("MMMM dd, yyyy hh:mm tt")
             })
           .ToListAsync();

                return Json(new { data = resources });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> AdminDeleteResource([FromBody] int resourceId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var resource = await _context.StudyGroupResources
                .Where(r => r.DeletedAt == null)
         .FirstOrDefaultAsync(r => r.Id == resourceId);

                if (resource == null)
                {
                    return Json(ResponseHelper.Failed("Resource not found."));
                }

                // Soft delete
                resource.DeletedBy = currentUserId;
                resource.DeletedByName = currentUserName;
                resource.DeletedAt = DateTime.Now;

                _context.StudyGroupResources.Update(resource);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogDeleteAsync("StudyGroupResource", resource.Id.ToString(), new
                {
                    resource.Id,
                    resource.StudyGroupId,
                    resource.Title,
                    resource.FileName,
                    DeletedByAdmin = true
                });

                return Json(ResponseHelper.Success("Resource deleted successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> PostMessage([FromBody] PostMessageRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    return Json(ResponseHelper.Failed("Message cannot be empty."));
                }

                // Check if study group exists
                var studyGroup = await _context.StudyGroups
                .Where(sg => sg.DeletedAt == null)
                    .FirstOrDefaultAsync(sg => sg.Id == request.StudyGroupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                // Check if user is an approved member, owner, or admin
                var member = await _context.StudyGroupMembers
                  .Where(m => m.StudyGroupId == request.StudyGroupId &&
            m.UserId == currentUserId &&
                 m.DeletedAt == null)
                .FirstOrDefaultAsync();

                if (member == null || !member.IsApproved)
                {
                    return Json(ResponseHelper.Failed("You must be an approved member to post messages."));
                }

                // Check if user is Owner, Admin, or regular approved member
                var canPost = member.Role == "Owner" || member.Role == "Admin" || (member.Role == "Member" && member.IsApproved);

                if (!canPost)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to post messages."));
                }

                // Create new message
                var message = new StudyGroupMessage
                {
                    StudyGroupId = request.StudyGroupId,
                    UserId = currentUserId ?? "",
                    Message = request.Message,
                    PostedAt = DateTime.Now,
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
                };

                _context.StudyGroupMessages.Add(message);
                await _context.SaveChangesAsync();

                // Get user info for real-time broadcast
                var user = await _context.Users.FindAsync(currentUserId);
                var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : currentUserName;

                // Prepare message data for broadcast
                var messageData = new
                {
                    id = message.Id,
                    message = message.Message,
                    userId = message.UserId,
                    userName = userName,
                    postedAt = message.PostedAt.ToString("MMMM dd, yyyy hh:mm tt"),
                    isCurrentUser = true // Will be updated by clients
                };

                // Broadcast to all clients in the study group via SignalR
                await _hubContext.Clients.Group($"StudyGroup_{request.StudyGroupId}")
                     .SendAsync("ReceiveMessage", messageData);

                // Log the action
                await _auditService.LogCreateAsync("StudyGroupMessage", message.Id.ToString(), new
                {
                    message.Id,
                    message.StudyGroupId,
                    MessagePreview = message.Message.Substring(0, Math.Min(50, message.Message.Length))
                });

                return Json(ResponseHelper.Success("Message posted successfully.", messageData));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while posting the message."));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMessages(int studyGroupId, int skip = 0, int take = 50)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Check if user is an approved member
                var isMember = await _context.StudyGroupMembers
        .AnyAsync(m => m.StudyGroupId == studyGroupId &&
  m.UserId == currentUserId &&
       m.IsApproved &&
    m.DeletedAt == null);

                if (!isMember)
                {
                    return Json(new { data = new List<object>() });
                }

                var messages = await _context.StudyGroupMessages
            .Where(m => m.StudyGroupId == studyGroupId && m.DeletedAt == null)
             .Include(m => m.User)
                   .OrderByDescending(m => m.PostedAt)
           .Skip(skip)
                .Take(take)
                  .Select(m => new
                  {
                      id = m.Id,
                      message = m.Message,
                      userId = m.UserId,
                      userName = $"{m.User.FirstName} {m.User.LastName}".Trim(),
                      postedAt = m.PostedAt.ToString("MMMM dd, yyyy hh:mm tt"),
                      isCurrentUser = m.UserId == currentUserId
                  })
           .ToListAsync();

                // Reverse to show oldest first
                messages.Reverse();

                return Json(new { data = messages });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteMessage([FromBody] int messageId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var message = await _context.StudyGroupMessages
    .Where(m => m.DeletedAt == null)
       .FirstOrDefaultAsync(m => m.Id == messageId);

                if (message == null)
                {
                    return Json(ResponseHelper.Failed("Message not found."));
                }

                // Check if user is the message owner, or an owner/admin of the group
                var member = await _context.StudyGroupMembers
                         .Where(m => m.StudyGroupId == message.StudyGroupId &&
                   m.UserId == currentUserId &&
                      m.DeletedAt == null)
                 .FirstOrDefaultAsync();

                bool canDelete = message.UserId == currentUserId ||
        (member != null && (member.Role == "Owner" || member.Role == "Admin"));

                if (!canDelete)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to delete this message."));
                }

                // Soft delete
                message.DeletedBy = currentUserId;
                message.DeletedByName = currentUserName;
                message.DeletedAt = DateTime.Now;

                _context.StudyGroupMessages.Update(message);
                await _context.SaveChangesAsync();

                // Notify all clients in the group
                await _hubContext.Clients.Group($"StudyGroup_{message.StudyGroupId}")
                   .SendAsync("MessageDeleted", messageId);

                // Log the action
                await _auditService.LogDeleteAsync("StudyGroupMessage", message.Id.ToString(), new
                {
                    message.Id,
                    message.StudyGroupId,
                    MessagePreview = message.Message.Substring(0, Math.Min(50, message.Message.Length))
                });

                return Json(ResponseHelper.Success("Message deleted successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> GenerateInviteLink([FromBody] GenerateInviteLinkRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
                  .AnyAsync(m => m.StudyGroupId == request.StudyGroupId &&
                 m.UserId == currentUserId &&
              m.Role == "Owner" &&
                   m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to generate invite links."));
                }

                var studyGroup = await _context.StudyGroups
               .Where(sg => sg.DeletedAt == null)
               .FirstOrDefaultAsync(sg => sg.Id == request.StudyGroupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                // Generate unique invite token
                studyGroup.InviteToken = Guid.NewGuid().ToString("N").Substring(0, 16);

                // Set expiration
                if (request.ExpirationDays.HasValue && request.ExpirationDays.Value > 0)
                {
                    studyGroup.InviteTokenExpiration = DateTime.Now.AddDays(request.ExpirationDays.Value);
                }
                else
                {
                    studyGroup.InviteTokenExpiration = null; // No expiration
                }

                studyGroup.ModifiedBy = currentUserId ?? "";
                studyGroup.ModifiedByName = currentUserName;
                studyGroup.ModifiedAt = DateTime.Now;

                _context.StudyGroups.Update(studyGroup);
                await _context.SaveChangesAsync();

                // Generate the full invite URL
                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var inviteUrl = $"{baseUrl}/StudyGroups/Invite?token={studyGroup.InviteToken}";

                await _auditService.LogCustomActionAsync($"Generated invite link for study group {request.StudyGroupId}");

                return Json(ResponseHelper.Success("Invite link generated successfully.", new
                {
                    inviteUrl = inviteUrl,
                    inviteToken = studyGroup.InviteToken,
                    expiresAt = studyGroup.InviteTokenExpiration?.ToString("MMMM dd, yyyy hh:mm tt")
                }));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> RevokeInviteLink([FromBody] int studyGroupId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
                  .AnyAsync(m => m.StudyGroupId == studyGroupId &&
                   m.UserId == currentUserId &&
             m.Role == "Owner" &&
           m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to revoke invite links."));
                }

                var studyGroup = await _context.StudyGroups
                     .Where(sg => sg.DeletedAt == null)
                           .FirstOrDefaultAsync(sg => sg.Id == studyGroupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                studyGroup.InviteToken = null;
                studyGroup.InviteTokenExpiration = null;
                studyGroup.ModifiedBy = currentUserId ?? "";
                studyGroup.ModifiedByName = currentUserName;
                studyGroup.ModifiedAt = DateTime.Now;

                _context.StudyGroups.Update(studyGroup);
                await _context.SaveChangesAsync();

                await _auditService.LogCustomActionAsync($"Revoked invite link for study group {studyGroupId}");

                return Json(ResponseHelper.Success("Invite link revoked successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Invite(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return NotFound();
                }

                var studyGroup = await _context.StudyGroups
                         .Include(sg => sg.Category)
                     .Include(sg => sg.Members.Where(m => m.DeletedAt == null && m.IsApproved))
                .Where(sg => sg.DeletedAt == null && sg.InviteToken == token)
                .FirstOrDefaultAsync();

                if (studyGroup == null)
                {
                    ViewBag.ErrorMessage = "Invalid or expired invite link.";
                    return View("InviteError");
                }

                // Check if link has expired
                if (studyGroup.InviteTokenExpiration.HasValue &&
                 studyGroup.InviteTokenExpiration.Value < DateTime.Now)
                {
                    ViewBag.ErrorMessage = "This invite link has expired.";
                    return View("InviteError");
                }

                // Check if study group is approved
                if (!studyGroup.IsApproved)
                {
                    ViewBag.ErrorMessage = "This study group is not yet approved.";
                    return View("InviteError");
                }

                // Check if user is authenticated
                if (User.Identity?.IsAuthenticated == true)
                {
                    var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                    // Check if user is already a member
                    var existingMember = studyGroup.Members.FirstOrDefault(m => m.UserId == currentUserId);

                    if (existingMember != null)
                    {
                        if (existingMember.IsApproved)
                        {
                            // Already a member, redirect to details
                            return RedirectToAction("Details", new { id = studyGroup.Id });
                        }
                        else
                        {
                            ViewBag.IsPendingApproval = true;
                        }
                    }
                }

                // Populate ViewBag with study group info
                ViewBag.StudyGroupId = studyGroup.Id;
                ViewBag.StudyGroupName = studyGroup.Name;
                ViewBag.StudyGroupDescription = studyGroup.Description;
                ViewBag.CategoryName = studyGroup.Category.Name;
                ViewBag.Privacy = studyGroup.Privacy;
                ViewBag.MaxMembers = studyGroup.MaximumNumbers;
                ViewBag.CurrentMemberCount = studyGroup.Members.Count;
                ViewBag.InviteToken = token;
                ViewBag.IsAuthenticated = User.Identity?.IsAuthenticated == true;

                return View();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return NotFound();
            }
        }

        [HttpPost]
        public async Task<IActionResult> RequestAccessViaInvite([FromBody] RequestAccessViaInviteRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Json(ResponseHelper.Failed("You must be logged in to join a study group."));
                }

                var studyGroup = await _context.StudyGroups
              .Where(sg => sg.DeletedAt == null && sg.InviteToken == request.InviteToken)
                    .FirstOrDefaultAsync();

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Invalid invite link."));
                }

                // Check if link has expired
                if (studyGroup.InviteTokenExpiration.HasValue &&
               studyGroup.InviteTokenExpiration.Value < DateTime.Now)
                {
                    return Json(ResponseHelper.Failed("This invite link has expired."));
                }

                // Check if user is already a member
                var existingMember = await _context.StudyGroupMembers
                  .Where(m => m.DeletedAt == null)
                .FirstOrDefaultAsync(m => m.StudyGroupId == studyGroup.Id && m.UserId == currentUserId);

                if (existingMember != null)
                {
                    if (existingMember.IsApproved)
                    {
                        return Json(ResponseHelper.Success("You are already a member of this group.",
                                redirectUrl: Url.Action("Details", "StudyGroups", new { id = studyGroup.Id })));
                    }
                    else
                    {
                        return Json(ResponseHelper.Failed("You already have a pending membership request."));
                    }
                }

                // Check if group has reached maximum capacity
                if (studyGroup.MaximumNumbers.HasValue)
                {
                    var currentMemberCount = await _context.StudyGroupMembers
                     .Where(m => m.StudyGroupId == studyGroup.Id && m.DeletedAt == null && m.IsApproved)
            .CountAsync();

                    if (currentMemberCount >= studyGroup.MaximumNumbers.Value)
                    {
                        return Json(ResponseHelper.Failed("Study group has reached its maximum capacity."));
                    }
                }

                // Add new member with pending approval
                var newMember = new StudyGroupMember
                {
                    StudyGroupId = studyGroup.Id,
                    UserId = currentUserId,
                    Role = "Member",
                    IsApproved = studyGroup.Privacy == "Public", // Auto-approve for public groups
                    JoinedAt = studyGroup.Privacy == "Public" ? DateTime.Now : null,
                    CreatedBy = currentUserId,
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId,
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
                };

                _context.StudyGroupMembers.Add(newMember);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogCreateAsync("StudyGroupMember", newMember.Id.ToString(), new
                {
                    newMember.Id,
                    newMember.StudyGroupId,
                    newMember.UserId,
                    newMember.Role,
                    JoinedViaInvite = true
                });

                var message = studyGroup.Privacy == "Public"
              ? "Successfully joined the study group!"
                      : "Join request sent. Waiting for approval from the group owner.";

                return Json(ResponseHelper.Success(message,
            redirectUrl: Url.Action("Details", "StudyGroups", new { id = studyGroup.Id })));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetInviteLink(int studyGroupId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
                    .AnyAsync(m => m.StudyGroupId == studyGroupId &&
                      m.UserId == currentUserId &&
               m.Role == "Owner" &&
                m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to view invite links."));
                }

                var studyGroup = await _context.StudyGroups
         .Where(sg => sg.DeletedAt == null)
                 .FirstOrDefaultAsync(sg => sg.Id == studyGroupId);

                if (studyGroup == null)
                {
                    return Json(ResponseHelper.Failed("Study group not found."));
                }

                if (string.IsNullOrEmpty(studyGroup.InviteToken))
                {
                    return Json(ResponseHelper.Success("No active invite link.", null));
                }

                // Check if expired
                bool isExpired = studyGroup.InviteTokenExpiration.HasValue &&
                studyGroup.InviteTokenExpiration.Value < DateTime.Now;

                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var inviteUrl = $"{baseUrl}/StudyGroups/Invite?token={studyGroup.InviteToken}";

                return Json(ResponseHelper.Success("", new
                {
                    inviteUrl = inviteUrl,
                    inviteToken = studyGroup.InviteToken,
                    expiresAt = studyGroup.InviteTokenExpiration?.ToString("MMMM dd, yyyy hh:mm tt"),
                    isExpired = isExpired
                }));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] CreateMeetingRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
                       .AnyAsync(m => m.StudyGroupId == request.StudyGroupId &&
              m.UserId == currentUserId &&
               m.Role == "Owner" &&
              m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to create meetings."));
                }

                // Validate Google Meet URL
                if (!request.MeetingLink.Contains("meet.google.com"))
                {
                    return Json(ResponseHelper.Failed("Please provide a valid Google Meet link."));
                }

                // Validate dates
                if (request.ScheduledStartTime < DateTime.Now)
                {
                    return Json(ResponseHelper.Failed("Start time cannot be in the past."));
                }

                if (request.ScheduledEndTime <= request.ScheduledStartTime)
                {
                    return Json(ResponseHelper.Failed("End time must be after start time."));
                }

                // Create new meeting
                var meeting = new StudyGroupMeeting
                {
                    StudyGroupId = request.StudyGroupId,
                    Title = request.Title,
                    Description = request.Description,
                    MeetingLink = request.MeetingLink,
                    ScheduledStartTime = request.ScheduledStartTime,
                    ScheduledEndTime = request.ScheduledEndTime,
                    IsRecurring = request.IsRecurring,
                    RecurrencePattern = request.RecurrencePattern,
                    RecurrenceEndDate = request.RecurrenceEndDate,
                    MaxParticipants = request.MaxParticipants,
                    CreatedByUserId = currentUserId ?? "",
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now,
                    IsActive = true,
                    IsCancelled = false
                };

                _context.StudyGroupMeetings.Add(meeting);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogCreateAsync("StudyGroupMeeting", meeting.Id.ToString(), new
                {
                    meeting.Id,
                    meeting.StudyGroupId,
                    meeting.Title,
                    meeting.ScheduledStartTime,
                    meeting.ScheduledEndTime
                });

                return Json(ResponseHelper.Success("Meeting created successfully.", new
                {
                    meetingId = meeting.Id
                }));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while creating the meeting."));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMeetings(int studyGroupId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Check if user is an approved member
                var isMember = await _context.StudyGroupMembers
                       .AnyAsync(m => m.StudyGroupId == studyGroupId &&
               m.UserId == currentUserId &&
              m.IsApproved &&
              m.DeletedAt == null);

                if (!isMember)
                {
                    return Json(new { data = new List<object>() });
                }

                var meetings = await _context.StudyGroupMeetings
   .Where(m => m.StudyGroupId == studyGroupId &&
   m.DeletedAt == null &&
       !m.IsCancelled &&
       m.IsActive)
     .Include(m => m.CreatedByUser)
          .OrderBy(m => m.ScheduledStartTime)
         .Select(m => new
         {
             id = m.Id,
             title = m.Title,
             description = m.Description,
             meetingLink = m.MeetingLink,
             scheduledStartTime = m.ScheduledStartTime,
             scheduledEndTime = m.ScheduledEndTime,
             startTimeFormatted = m.ScheduledStartTime.ToString("MMMM dd, yyyy hh:mm tt"),
             endTimeFormatted = m.ScheduledEndTime.ToString("hh:mm tt"),
             isRecurring = m.IsRecurring,
             recurrencePattern = m.RecurrencePattern,
             maxParticipants = m.MaxParticipants,
             createdByName = $"{m.CreatedByUser.FirstName} {m.CreatedByUser.LastName}".Trim(),
             createdByUserId = m.CreatedByUserId,
             isPast = m.ScheduledEndTime < DateTime.Now,
             isUpcoming = m.ScheduledStartTime > DateTime.Now,
             isOngoing = m.ScheduledStartTime <= DateTime.Now && m.ScheduledEndTime >= DateTime.Now
         })
          .ToListAsync();

                return Json(new { data = meetings });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateMeeting([FromBody] UpdateMeetingRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var meeting = await _context.StudyGroupMeetings
         .Where(m => m.DeletedAt == null)
             .FirstOrDefaultAsync(m => m.Id == request.MeetingId);

                if (meeting == null)
                {
                    return Json(ResponseHelper.Failed("Meeting not found."));
                }

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
                     .AnyAsync(m => m.StudyGroupId == meeting.StudyGroupId &&
                 m.UserId == currentUserId &&
                     m.Role == "Owner" &&
                            m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to update meetings."));
                }

                // Validate Google Meet URL
                if (!request.MeetingLink.Contains("meet.google.com"))
                {
                    return Json(ResponseHelper.Failed("Please provide a valid Google Meet link."));
                }

                // Validate dates
                if (request.ScheduledEndTime <= request.ScheduledStartTime)
                {
                    return Json(ResponseHelper.Failed("End time must be after start time."));
                }

                // Store old values for audit
                var oldValues = new
                {
                    meeting.Title,
                    meeting.Description,
                    meeting.MeetingLink,
                    meeting.ScheduledStartTime,
                    meeting.ScheduledEndTime
                };

                // Update meeting
                meeting.Title = request.Title;
                meeting.Description = request.Description;
                meeting.MeetingLink = request.MeetingLink;
                meeting.ScheduledStartTime = request.ScheduledStartTime;
                meeting.ScheduledEndTime = request.ScheduledEndTime;
                meeting.MaxParticipants = request.MaxParticipants;
                meeting.ModifiedBy = currentUserId ?? "";
                meeting.ModifiedByName = currentUserName;
                meeting.ModifiedAt = DateTime.Now;

                _context.StudyGroupMeetings.Update(meeting);
                await _context.SaveChangesAsync();

                // Store new values for audit
                var newValues = new
                {
                    meeting.Title,
                    meeting.Description,
                    meeting.MeetingLink,
                    meeting.ScheduledStartTime,
                    meeting.ScheduledEndTime
                };

                // Log the action
                await _auditService.LogUpdateAsync("StudyGroupMeeting", meeting.Id.ToString(), oldValues, newValues);

                return Json(ResponseHelper.Success("Meeting updated successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while updating the meeting."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> CancelMeeting([FromBody] CancelMeetingRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var meeting = await _context.StudyGroupMeetings
               .Where(m => m.DeletedAt == null)
                       .FirstOrDefaultAsync(m => m.Id == request.MeetingId);

                if (meeting == null)
                {
                    return Json(ResponseHelper.Failed("Meeting not found."));
                }

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
                 .AnyAsync(m => m.StudyGroupId == meeting.StudyGroupId &&
                      m.UserId == currentUserId &&
                    m.Role == "Owner" &&
                         m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to cancel meetings."));
                }

                // Cancel meeting
                meeting.IsCancelled = true;
                meeting.IsActive = false;
                meeting.CancellationReason = request.CancellationReason;
                meeting.ModifiedBy = currentUserId ?? "";
                meeting.ModifiedByName = currentUserName;
                meeting.ModifiedAt = DateTime.Now;

                _context.StudyGroupMeetings.Update(meeting);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogCustomActionAsync($"Cancelled meeting {meeting.Id} for study group {meeting.StudyGroupId}. Reason: {request.CancellationReason ?? "No reason provided"}");

                return Json(ResponseHelper.Success("Meeting cancelled successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while cancelling the meeting."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteMeeting([FromBody] int meetingId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = $"{User.FindFirstValue("FirstName")} {User.FindFirstValue("LastName")}".Trim();

                var meeting = await _context.StudyGroupMeetings
             .Where(m => m.DeletedAt == null)
                   .FirstOrDefaultAsync(m => m.Id == meetingId);

                if (meeting == null)
                {
                    return Json(ResponseHelper.Failed("Meeting not found."));
                }

                // Check if current user is owner
                var isOwner = await _context.StudyGroupMembers
              .AnyAsync(m => m.StudyGroupId == meeting.StudyGroupId &&
                    m.UserId == currentUserId &&
            m.Role == "Owner" &&
             m.DeletedAt == null);

                if (!isOwner)
                {
                    return Json(ResponseHelper.Failed("You don't have permission to delete meetings."));
                }

                // Soft delete
                meeting.DeletedBy = currentUserId;
                meeting.DeletedByName = currentUserName;
                meeting.DeletedAt = DateTime.Now;

                _context.StudyGroupMeetings.Update(meeting);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogDeleteAsync("StudyGroupMeeting", meeting.Id.ToString(), new
                {
                    meeting.Id,
                    meeting.StudyGroupId,
                    meeting.Title,
                    meeting.ScheduledStartTime
                });

                return Json(ResponseHelper.Success("Meeting deleted successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred while deleting the meeting."));
            }
        }
    }
}
