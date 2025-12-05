using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Helpers;
using StudyConnect.Models;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AccountVerificationController : Controller
    {
        private readonly ILogger<AccountVerificationController> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public AccountVerificationController(
            ILogger<AccountVerificationController> logger,
            UserManager<ApplicationUser> userManager,
            AppDbContext context,
            IAuditService auditService,
            IWebHostEnvironment webHostEnvironment)
        {
            _logger = logger;
            _userManager = userManager;
            _context = context;
            _auditService = auditService;
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Account Verification Page");
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetPendingAccounts()
        {
            try
            {
                var pendingUsers = await _userManager.Users
                    .Where(u => u.DeletedAt == null && !u.IsAccountActivated)
                    .OrderByDescending(u => u.CreatedAt)
                    .ToListAsync();

                var userList = new List<object>();

                foreach (var user in pendingUsers)
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
                        idImagePath = user.IdImagePath,
                        studyLoadPdfPath = user.StudyLoadPdfPath,
                        role = role,
                        createdAt = user.CreatedAt.ToString("MM/dd/yyyy hh:mm tt"),
                        hasDocuments = !string.IsNullOrEmpty(user.IdImagePath) && !string.IsNullOrEmpty(user.StudyLoadPdfPath)
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

        [HttpGet]
        public async Task<IActionResult> GetAccountDetails(string id)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return Json(ResponseHelper.Failed("User not found"));
                }

                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? "No Role";

                var details = new
                {
                    id = user.Id,
                    fullName = $"{user.FirstName} {user.MiddleName ?? ""} {user.LastName}".Replace("  ", " ").Trim(),
                    firstName = user.FirstName,
                    middleName = user.MiddleName,
                    lastName = user.LastName,
                    email = user.Email,
                    idImagePath = user.IdImagePath,
                    studyLoadPdfPath = user.StudyLoadPdfPath,
                    role = role,
                    createdAt = user.CreatedAt.ToString("MM/dd/yyyy hh:mm tt"),
                    isActivated = user.IsAccountActivated,
                    rejectionReason = user.RejectionReason
                };

                return Json(ResponseHelper.Success("Account details retrieved", details));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("Failed to retrieve account details"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ApproveAccount([FromBody] string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Json(ResponseHelper.Failed("User not found"));
                }

                if (user.IsAccountActivated)
                {
                    return Json(ResponseHelper.Failed("Account is already activated"));
                }

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUser = await _userManager.FindByIdAsync(currentUserId ?? "");
                var currentUserName = currentUser != null
                    ? $"{currentUser.FirstName} {currentUser.LastName}"
                    : "Admin";

                user.IsAccountActivated = true;
                user.EmailConfirmed = true;
                user.ActivatedBy = currentUserId;
                user.ActivatedByName = currentUserName;
                user.ActivatedAt = DateTime.Now;
                user.RejectionReason = null;
                user.ModifiedBy = currentUserId ?? "";
                user.ModifiedByName = currentUserName;
                user.ModifiedAt = DateTime.Now;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    string errors = string.Join("\n", result.Errors.Select(e => e.Description));
                    return Json(ResponseHelper.Failed(errors));
                }

                await _auditService.LogCustomActionAsync($"Approved account for user: {user.Email}");

                return Json(ResponseHelper.Success("Account approved successfully. User can now login."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> RejectAccount([FromBody] RejectAccountRequest request)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(request.UserId);
                if (user == null)
                {
                    return Json(ResponseHelper.Failed("User not found"));
                }

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUser = await _userManager.FindByIdAsync(currentUserId ?? "");
                var currentUserName = currentUser != null
                    ? $"{currentUser.FirstName} {currentUser.LastName}"
                    : "Admin";

                user.RejectionReason = request.Reason;
                user.ModifiedBy = currentUserId ?? "";
                user.ModifiedByName = currentUserName;
                user.ModifiedAt = DateTime.Now;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    string errors = string.Join("\n", result.Errors.Select(e => e.Description));
                    return Json(ResponseHelper.Failed(errors));
                }

                await _auditService.LogCustomActionAsync($"Rejected account for user: {user.Email}. Reason: {request.Reason}");

                return Json(ResponseHelper.Success("Account rejected. User has been notified."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                return Json(ResponseHelper.Error("An unexpected error occurred"));
            }
        }

        public class RejectAccountRequest
        {
            public string UserId { get; set; } = string.Empty;
            public string Reason { get; set; } = string.Empty;
        }
    }
}
