using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Helpers;
using StudyConnect.Models;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize]
    public class FeedbackController : Controller
    {
        private readonly ILogger<FeedbackController> _logger;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public FeedbackController(
            ILogger<FeedbackController> logger,
            AppDbContext context,
            IAuditService auditService)
        {
            _logger = logger;
            _context = context;
            _auditService = auditService;
        }

        // Admin View - List all feedbacks
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Feedback Management Page");
            return View();
        }

        // Admin API - Get all feedbacks
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetFeedbacks()
        {
            try
            {
                var feedbacks = await _context.Feedbacks
                    .Include(f => f.User)
                    .Where(f => f.DeletedAt == null)
                    .OrderByDescending(f => f.CreatedAt)
                    .Select(f => new
                    {
                        f.Id,
                        f.Subject,
                        f.Category,
                        f.Message,
                        f.Status,
                        f.AdminResponse,
                        f.RespondedByName,
                        f.RespondedAt,
                        f.CreatedAt,
                        f.CreatedByName,
                        UserEmail = f.User.Email,
                        UserName = f.User.FirstName + " " + f.User.LastName
                    })
                    .ToListAsync();

                return Json(new { data = feedbacks });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching feedbacks");
                return Json(new { data = new List<object>() });
            }
        }

        // User View - Submit feedback form
        public async Task<IActionResult> SubmitFeedback()
        {
            await _auditService.LogCustomActionAsync("Viewed Submit Feedback Page");
            return View();
        }

        // User API - Submit new feedback
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SubmitFeedback(string subject, string category, string message)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(category) || string.IsNullOrWhiteSpace(message))
                {
                    return Json(ResponseHelper.Failed("All fields are required"));
                }

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "User";

                var feedback = new Feedback
                {
                    UserId = currentUserId ?? "",
                    Subject = subject,
                    Category = category,
                    Message = message,
                    Status = "Pending",
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
                };

                _context.Feedbacks.Add(feedback);
                await _context.SaveChangesAsync();

                await _auditService.LogCreateAsync("Feedback", feedback.Id.ToString(), new { feedback.Id, feedback.Subject, feedback.Category });

                return Json(ResponseHelper.Success("Thank you for your feedback! We'll review it shortly.", null, redirectUrl: Url.Action("SubmitFeedback", "Feedback")));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting feedback");
                return Json(ResponseHelper.Error("Failed to submit feedback. Please try again."));
            }
        }

        // Admin API - Get single feedback details
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetFeedback(int id)
        {
            try
            {
                var feedback = await _context.Feedbacks
                    .Include(f => f.User)
                    .Where(f => f.Id == id && f.DeletedAt == null)
                    .Select(f => new
                    {
                        f.Id,
                        f.Subject,
                        f.Category,
                        f.Message,
                        f.Status,
                        f.AdminResponse,
                        f.RespondedByName,
                        f.RespondedAt,
                        f.CreatedAt,
                        f.CreatedByName,
                        UserEmail = f.User.Email,
                        UserName = f.User.FirstName + " " + f.User.LastName
                    })
                    .FirstOrDefaultAsync();

                if (feedback == null)
                    return Json(ResponseHelper.Failed("Feedback not found"));

                return Json(ResponseHelper.Success("Feedback loaded", feedback));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching feedback");
                return Json(ResponseHelper.Error("Failed to load feedback"));
            }
        }

        // Admin API - Update feedback status
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, string status)
        {
            try
            {
                var feedback = await _context.Feedbacks
                    .FirstOrDefaultAsync(f => f.Id == id && f.DeletedAt == null);

                if (feedback == null)
                    return Json(ResponseHelper.Failed("Feedback not found"));

                var oldValue = feedback.Status;
                feedback.Status = status;

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "Admin";

                feedback.ModifiedBy = currentUserId ?? "";
                feedback.ModifiedByName = currentUserName;
                feedback.ModifiedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await _auditService.LogUpdateAsync("Feedback", feedback.Id.ToString(), new { Status = oldValue }, new { Status = status });

                return Json(ResponseHelper.Success("Status updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating feedback status");
                return Json(ResponseHelper.Error("Failed to update status"));
            }
        }

        // Admin API - Respond to feedback
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RespondToFeedback(int id, string response, string status)
        {
            try
            {
                var feedback = await _context.Feedbacks
                    .FirstOrDefaultAsync(f => f.Id == id && f.DeletedAt == null);

                if (feedback == null)
                    return Json(ResponseHelper.Failed("Feedback not found"));

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "Admin";

                feedback.AdminResponse = response;
                feedback.Status = status;
                feedback.RespondedBy = currentUserId;
                feedback.RespondedByName = currentUserName;
                feedback.RespondedAt = DateTime.Now;
                feedback.ModifiedBy = currentUserId ?? "";
                feedback.ModifiedByName = currentUserName;
                feedback.ModifiedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await _auditService.LogUpdateAsync("Feedback", feedback.Id.ToString(), null, new { Response = response, Status = status });

                return Json(ResponseHelper.Success("Response submitted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error responding to feedback");
                return Json(ResponseHelper.Error("Failed to submit response"));
            }
        }

        // Admin API - Delete feedback
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var feedback = await _context.Feedbacks
                    .FirstOrDefaultAsync(f => f.Id == id && f.DeletedAt == null);

                if (feedback == null)
                    return Json(ResponseHelper.Failed("Feedback not found"));

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "Admin";

                feedback.DeletedBy = currentUserId;
                feedback.DeletedByName = currentUserName;
                feedback.DeletedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                await _auditService.LogDeleteAsync("Feedback", feedback.Id.ToString(), new { feedback.Id, feedback.Subject });

                return Json(ResponseHelper.Success("Feedback deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting feedback");
                return Json(ResponseHelper.Error("Failed to delete feedback"));
            }
        }
    }
}
