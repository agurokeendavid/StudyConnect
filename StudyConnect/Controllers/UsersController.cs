using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StudyConnect.Helpers;
using StudyConnect.Models;
using StudyConnect.ViewModels.Users;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Services;
using StudyConnect.Data;

namespace StudyConnect.Controllers
{
    [Authorize]
    public class UsersController : Controller
    {
        private readonly ILogger<UsersController> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IAuditService _auditService;
        private readonly AppDbContext _context;

        public UsersController(
            ILogger<UsersController> logger,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IAuditService auditService,
            AppDbContext context)
        {
            _logger = logger;
            _userManager = userManager;
            _roleManager = roleManager;
            _auditService = auditService;
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Users List Page");
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _userManager.Users
                   .Where(u => u.DeletedAt == null)
                       .OrderByDescending(u => u.CreatedAt)
               .ToListAsync();

                var userList = new List<object>();

                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    var role = roles.FirstOrDefault() ?? "No Role";

                    userList.Add(new
                    {
                        id = user.Id,
                        fullName = $"{user.FirstName} {user.MiddleName ?? ""} {user.LastName}".Replace("  ", " ").Trim(),
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        email = user.Email,
                        sex = user.Sex ?? "Not Specified",
                        dob = user.Dob?.ToString("MM/dd/yyyy"),
                        contactNo = user.ContactNo,
                        address = user.Address,
                        role = role,
                        createdAt = user.CreatedAt.ToString("MM/dd/yyyy hh:mm tt"),
                        emailConfirmed = user.EmailConfirmed
                    });
                }

                return Json(new { data = userList });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteUser([FromBody] string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    return Json(ResponseHelper.Failed("User ID is required."));
                }

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return Json(ResponseHelper.Failed("User not found."));
                }

                // Store old values for audit
                var oldValues = new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email
                };

                // Get current user ID
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUser = await _userManager.FindByIdAsync(currentUserId ?? "");
                var currentUserName = currentUser != null
        ? $"{currentUser.FirstName} {currentUser.LastName}"
               : "System";

                // Soft delete
                user.DeletedBy = currentUserId;
                user.DeletedByName = currentUserName;
                user.DeletedAt = DateTime.Now;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    string errors = string.Join("\n", result.Errors.Select(e => e.Description));
                    return Json(ResponseHelper.Failed(errors));
                }

                // Log the delete action
                await _auditService.LogDeleteAsync("User", user.Id, oldValues);

                return Json(ResponseHelper.Success("User deleted successfully."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
            }
        }

        [HttpGet]
        public async Task<IActionResult> Upsert(string? id)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(id))
                {
                    await _auditService.LogCustomActionAsync($"Viewed Edit User Page (ID: {id})");

                    var user = await _userManager.FindByIdAsync(id);

                    if (user is null)
                    {
                        return NotFound();
                    }

                    // Get user roles
                    var roles = await _userManager.GetRolesAsync(user);
                    var userRole = roles.FirstOrDefault() ?? "";

                    var viewModel = new UpsertViewModel()
                    {
                        Id = user.Id,
                        LastName = user.LastName,
                        FirstName = user.FirstName,
                        MiddleName = user.MiddleName,
                        Dob = user.Dob,
                        Sex = user.Sex,
                        Address = user.Address,
                        ContactNo = user.ContactNo,
                        EmailAddress = user.Email ?? "",
                        RoleId = userRole
                    };
                    return View(viewModel);
                }
                else
                {
                    await _auditService.LogCustomActionAsync("Viewed Create User Page");
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
                if (!string.IsNullOrWhiteSpace(viewModel.Id))
                {
                    ModelState.Remove(nameof(viewModel.EmailAddress));
                    ModelState.Remove(nameof(viewModel.Password));
                }

                if (!ModelState.IsValid)
                {
                    string errorMessages = string.Join("\n", ModelState.Values
                                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                    return Json(ResponseHelper.Failed(errorMessages));
                }

                // Get current user ID
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUser = await _userManager.FindByIdAsync(currentUserId ?? "");
                var currentUserName = currentUser != null
         ? $"{currentUser.FirstName} {currentUser.LastName}"
              : "System";

                // Check if updating existing user
                if (!string.IsNullOrWhiteSpace(viewModel.Id))
                {
                    var user = await _userManager.FindByIdAsync(viewModel.Id);
                    if (user == null)
                    {
                        return Json(ResponseHelper.Failed("User not found."));
                    }

                    // Store old values for audit
                    var oldValues = new
                    {
                        user.FirstName,
                        user.LastName,
                        user.MiddleName,
                        user.Dob,
                        user.Sex,
                        user.Address,
                        user.ContactNo
                    };

                    // Update user properties
                    user.LastName = viewModel.LastName;
                    user.FirstName = viewModel.FirstName;
                    user.MiddleName = viewModel.MiddleName;
                    user.Dob = viewModel.Dob;
                    user.Sex = viewModel.Sex;
                    user.Address = viewModel.Address;
                    user.ContactNo = viewModel.ContactNo;
                    user.ModifiedBy = currentUserId ?? "";
                    user.ModifiedByName = currentUserName;
                    user.ModifiedAt = DateTime.Now;

                    var updateResult = await _userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                    {
                        string errors = string.Join("\n", updateResult.Errors.Select(e => e.Description));
                        return Json(ResponseHelper.Failed(errors));
                    }

                    // Update role if changed
                    var currentRoles = await _userManager.GetRolesAsync(user);
                    if (!currentRoles.Contains(viewModel.RoleId))
                    {
                        // Remove old roles
                        if (currentRoles.Any())
                        {
                            await _userManager.RemoveFromRolesAsync(user, currentRoles);
                        }

                        // Add new role
                        await _userManager.AddToRoleAsync(user, viewModel.RoleId);
                    }

                    // Store new values for audit
                    var newValues = new
                    {
                        user.FirstName,
                        user.LastName,
                        user.MiddleName,
                        user.Dob,
                        user.Sex,
                        user.Address,
                        user.ContactNo,
                        Role = viewModel.RoleId
                    };

                    // Log the update
                    await _auditService.LogUpdateAsync("User", user.Id, oldValues, newValues);

                    return Json(ResponseHelper.Success("User updated successfully.", null, redirectUrl: Url.Action("Index", "Users")));
                }
                else
                {
                    // Creating new user
                    // Check if email already exists
                    var existingUser = await _userManager.FindByEmailAsync(viewModel.EmailAddress);
                    if (existingUser != null)
                    {
                        return Json(ResponseHelper.Failed("Email address is already registered."));
                    }

                    string generatedGuid = Guid.NewGuid().ToString();
                    var user = new ApplicationUser
                    {
                        Id = generatedGuid,
                        UserName = viewModel.EmailAddress,
                        Email = viewModel.EmailAddress,
                        FirstName = viewModel.FirstName,
                        MiddleName = viewModel.MiddleName,
                        LastName = viewModel.LastName,
                        Dob = viewModel.Dob,
                        Sex = viewModel.Sex,
                        Address = viewModel.Address,
                        ContactNo = viewModel.ContactNo,
                        EmailConfirmed = true,
                        CreatedBy = currentUserId ?? generatedGuid,
                        CreatedByName = currentUserName,
                        CreatedAt = DateTime.Now,
                        ModifiedBy = currentUserId ?? generatedGuid,
                        ModifiedByName = currentUserName,
                        ModifiedAt = DateTime.Now
                    };

                    var result = await _userManager.CreateAsync(user, viewModel.Password);
                    if (!result.Succeeded)
                    {
                        string errors = string.Join("\n", result.Errors.Select(e => e.Description));
                        return Json(ResponseHelper.Failed(errors));
                    }

                    // Assign role
                    await _userManager.AddToRoleAsync(user, viewModel.RoleId);

                    // Add custom claims
                    var claims = new List<Claim>
      {
 new Claim("FirstName", user.FirstName),
         new Claim("LastName", user.LastName),
      new Claim("FullName", $"{user.FirstName} {user.LastName}")
        };

                    if (!string.IsNullOrEmpty(user.Sex))
                    {
                        claims.Add(new Claim("Gender", user.Sex));
                    }

                    await _userManager.AddClaimsAsync(user, claims);

                    // Log the create action
                    var newValues = new
                    {
                        user.Id,
                        user.FirstName,
                        user.LastName,
                        user.Email,
                        Role = viewModel.RoleId
                    };
                    await _auditService.LogCreateAsync("User", user.Id, newValues);

                    return Json(ResponseHelper.Success("User created successfully.", null, redirectUrl: Url.Action("Index", "Users")));
                }
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
            }

            return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UsersWithSubscriptions()
        {
            await _auditService.LogCustomActionAsync("Viewed Users With Subscriptions Page");
            return View();
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsersWithSubscriptions()
        {
            try
            {
                var usersWithSubscriptions = await _userManager.Users
                    .Where(u => u.DeletedAt == null)
                    .Select(u => new
                    {
                        id = u.Id,
                        fullName = $"{u.FirstName} {(u.MiddleName ?? "")} {u.LastName}".Replace("  ", " ").Trim(),
                        email = u.Email,
                        contactNo = u.ContactNo,
                        userSubscriptions = _context.UserSubscriptions
                            .Where(us => us.UserId == u.Id && us.DeletedAt == null)
                            .Include(us => us.Subscription)
                            .Select(us => new
                            {
                                id = us.Id,
                                subscriptionName = us.Subscription!.Name,
                                subscriptionPrice = us.Subscription!.Price,
                                startDate = us.StartDate,
                                endDate = us.EndDate,
                                isActive = us.IsActive,
                                filesUploaded = us.FilesUploaded,
                                maxFileUploads = us.Subscription!.MaxFileUploads,
                                hasUnlimitedAccess = us.Subscription!.HasUnlimitedAccess,
                                durationInDays = us.Subscription!.DurationInDays
                            })
                            .OrderByDescending(us => us.startDate)
                            .ToList()
                    })
                    .ToListAsync();

                // Filter only users who have at least one subscription
                var filteredUsers = usersWithSubscriptions
                    .Where(u => u.userSubscriptions.Any())
                    .Select(u => new
                    {
                        u.id,
                        u.fullName,
                        u.email,
                        u.contactNo,
                        activeSubscription = u.userSubscriptions.FirstOrDefault(us => us.isActive),
                        totalSubscriptions = u.userSubscriptions.Count,
                        subscriptionHistory = u.userSubscriptions.Select(us => new
                        {
                            us.subscriptionName,
                            us.subscriptionPrice,
                            startDate = us.startDate.ToString("MM/dd/yyyy"),
                            endDate = us.endDate.ToString("MM/dd/yyyy"),
                            us.isActive,
                            us.filesUploaded,
                            us.maxFileUploads,
                            us.hasUnlimitedAccess,
                            daysRemaining = us.isActive ? (us.endDate - DateTime.Now).Days : 0,
                            status = us.isActive 
                                ? (us.endDate < DateTime.Now ? "Expired" : "Active") 
                                : "Inactive"
                        })
                    })
                    .ToList();

                return Json(new { data = filteredUsers });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(new { data = new List<object>() });
            }
        }
    }
}
