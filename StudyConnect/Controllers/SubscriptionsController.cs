using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Helpers;
using StudyConnect.Models;
using StudyConnect.Services;
using StudyConnect.ViewModels.Subscriptions;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize(Roles = "Admin")]
    public class SubscriptionsController : Controller
    {
        private readonly ILogger<SubscriptionsController> _logger;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public SubscriptionsController(
            ILogger<SubscriptionsController> logger,
            AppDbContext context,
            IAuditService auditService)
        {
            _logger = logger;
            _context = context;
            _auditService = auditService;
        }

        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Subscriptions Management Page");
            return View();
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> AvailablePlans()
        {
            await _auditService.LogCustomActionAsync("Viewed Available Subscription Plans");
            return View();
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveSubscriptions()
        {
            try
            {
                var subscriptions = await _context.Subscriptions
                    .Where(s => s.DeletedAt == null && s.IsActive)
                    .OrderBy(s => s.Price)
                    .Select(s => new
                    {
                        s.Id,
                        s.Name,
                        s.Description,
                        s.Price,
                        s.DurationInDays,
                        s.MaxFileUploads,
                        s.HasUnlimitedAccess
                    })
                    .ToListAsync();

                return Json(new { data = subscriptions });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching active subscriptions");
                return Json(new { data = new List<object>() });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetSubscriptions()
        {
            try
            {
                var subscriptions = await _context.Subscriptions
                    .Where(s => s.DeletedAt == null)
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new
                    {
                        s.Id,
                        s.Name,
                        s.Description,
                        s.Price,
                        s.DurationInDays,
                        s.MaxFileUploads,
                        s.HasUnlimitedAccess,
                        s.IsActive,
                        s.CreatedByName,
                        s.CreatedAt,
                        s.ModifiedByName,
                        s.ModifiedAt
                    })
                    .ToListAsync();

                return Json(new { data = subscriptions });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching subscriptions");
                return Json(new { data = new List<object>() });
            }
        }

        [HttpGet]
        public async Task<IActionResult> Upsert(int? id)
        {
            try
            {
                if (id.HasValue)
                {
                    await _auditService.LogCustomActionAsync($"Viewed Edit Subscription Page (ID: {id})");

                    var subscription = await _context.Subscriptions
                        .Where(s => s.Id == id && s.DeletedAt == null)
                        .FirstOrDefaultAsync();

                    if (subscription == null)
                    {
                        return NotFound();
                    }

                    var viewModel = new UpsertViewModel
                    {
                        Id = subscription.Id,
                        Name = subscription.Name,
                        Description = subscription.Description,
                        Price = subscription.Price,
                        DurationInDays = subscription.DurationInDays,
                        MaxFileUploads = subscription.MaxFileUploads,
                        HasUnlimitedAccess = subscription.HasUnlimitedAccess,
                        IsActive = subscription.IsActive
                    };

                    return View(viewModel);
                }
                else
                {
                    await _auditService.LogCustomActionAsync("Viewed Create Subscription Page");
                }

                return View(new UpsertViewModel());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading upsert page");
                return NotFound();
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Upsert(UpsertViewModel viewModel)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = string.Join(", ", ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage));
                    return Json(ResponseHelper.Failed(errors));
                }

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                if (viewModel.Id.HasValue)
                {
                    var subscription = await _context.Subscriptions
                        .FirstOrDefaultAsync(s => s.Id == viewModel.Id && s.DeletedAt == null);

                    if (subscription == null)
                        return Json(ResponseHelper.Failed("Subscription not found"));

                    var oldValues = new
                    {
                        subscription.Name,
                        subscription.Description,
                        subscription.Price,
                        subscription.DurationInDays,
                        subscription.MaxFileUploads,
                        subscription.HasUnlimitedAccess,
                        subscription.IsActive
                    };

                    subscription.Name = viewModel.Name;
                    subscription.Description = viewModel.Description;
                    subscription.Price = viewModel.Price;
                    subscription.DurationInDays = viewModel.DurationInDays;
                    subscription.MaxFileUploads = viewModel.MaxFileUploads;
                    subscription.HasUnlimitedAccess = viewModel.HasUnlimitedAccess;
                    subscription.IsActive = viewModel.IsActive;
                    subscription.ModifiedBy = currentUserId ?? "";
                    subscription.ModifiedByName = currentUserName;
                    subscription.ModifiedAt = DateTime.Now;

                    await _context.SaveChangesAsync();

                    var newValues = new
                    {
                        subscription.Name,
                        subscription.Description,
                        subscription.Price,
                        subscription.DurationInDays,
                        subscription.MaxFileUploads,
                        subscription.HasUnlimitedAccess,
                        subscription.IsActive
                    };
                    await _auditService.LogUpdateAsync("Subscription", subscription.Id.ToString(), oldValues, newValues);

                    return Json(ResponseHelper.Success("Subscription updated successfully", null, redirectUrl: Url.Action("Index", "Subscriptions")));
                }
                else
                {
                    var subscription = new Subscription
                    {
                        Name = viewModel.Name,
                        Description = viewModel.Description,
                        Price = viewModel.Price,
                        DurationInDays = viewModel.DurationInDays,
                        MaxFileUploads = viewModel.MaxFileUploads,
                        HasUnlimitedAccess = viewModel.HasUnlimitedAccess,
                        IsActive = viewModel.IsActive,
                        CreatedBy = currentUserId ?? "",
                        CreatedByName = currentUserName,
                        CreatedAt = DateTime.Now,
                        ModifiedBy = currentUserId ?? "",
                        ModifiedByName = currentUserName,
                        ModifiedAt = DateTime.Now
                    };

                    _context.Subscriptions.Add(subscription);
                    await _context.SaveChangesAsync();

                    await _auditService.LogCreateAsync("Subscription", subscription.Id.ToString(), new
                    {
                        subscription.Id,
                        subscription.Name,
                        subscription.Price
                    });

                    return Json(ResponseHelper.Success("Subscription created successfully", null, redirectUrl: Url.Action("Index", "Subscriptions")));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting subscription");
                return Json(ResponseHelper.Error("Failed to save subscription"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var subscription = await _context.Subscriptions
                    .FirstOrDefaultAsync(s => s.Id == id && s.DeletedAt == null);

                if (subscription == null)
                    return Json(ResponseHelper.Failed("Subscription not found"));

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                subscription.DeletedBy = currentUserId;
                subscription.DeletedByName = currentUserName;
                subscription.DeletedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                await _auditService.LogDeleteAsync("Subscription", subscription.Id.ToString(), new
                {
                    subscription.Id,
                    subscription.Name
                });

                return Json(ResponseHelper.Success("Subscription deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting subscription");
                return Json(ResponseHelper.Error("Failed to delete subscription"));
            }
        }

        [HttpPost]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            try
            {
                var subscription = await _context.Subscriptions
                    .FirstOrDefaultAsync(s => s.Id == id && s.DeletedAt == null);

                if (subscription == null)
                    return Json(ResponseHelper.Failed("Subscription not found"));

                var oldValue = subscription.IsActive;
                subscription.IsActive = !subscription.IsActive;

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                subscription.ModifiedBy = currentUserId ?? "";
                subscription.ModifiedByName = currentUserName;
                subscription.ModifiedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await _auditService.LogUpdateAsync("Subscription", subscription.Id.ToString(),
                    new { IsActive = oldValue },
                    new { IsActive = subscription.IsActive });

                return Json(ResponseHelper.Success($"Subscription {(subscription.IsActive ? "activated" : "deactivated")} successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling subscription status");
                return Json(ResponseHelper.Error("Failed to toggle subscription status"));
            }
        }
    }
}
