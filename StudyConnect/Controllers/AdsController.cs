using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Helpers;
using StudyConnect.Models;
using StudyConnect.Services;
using StudyConnect.ViewModels.Ads;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdsController : Controller
    {
        private readonly ILogger<AdsController> _logger;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public AdsController(
            ILogger<AdsController> logger,
            AppDbContext context,
            IAuditService auditService)
        {
            _logger = logger;
            _context = context;
            _auditService = auditService;
        }

        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Ads Management Page");
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetAds()
        {
            try
            {
                var ads = await _context.Ads
                    .Where(a => a.DeletedAt == null)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                return Json(new { data = ads });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching ads");
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
                    await _auditService.LogCustomActionAsync($"Viewed Edit Ad Page (ID: {id})");

                    var ad = await _context.Ads
                        .Where(a => a.Id == id && a.DeletedAt == null)
                        .FirstOrDefaultAsync();

                    if (ad == null)
                    {
                        return NotFound();
                    }

                    var viewModel = new UpsertViewModel
                    {
                        Id = ad.Id,
                        Title = ad.Title,
                        Description = ad.Description,
                        ImageUrl = ad.ImageUrl,
                        LinkUrl = ad.LinkUrl,
                        StartDate = ad.StartDate,
                        EndDate = ad.EndDate,
                        Position = ad.Position,
                        IsActive = ad.IsActive
                    };

                    return View(viewModel);
                }
                else
                {
                    await _auditService.LogCustomActionAsync("Viewed Create Ad Page");
                }

                return View(new UpsertViewModel { StartDate = DateTime.Now, EndDate = DateTime.Now.AddMonths(1) });
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

                if (viewModel.StartDate >= viewModel.EndDate)
                {
                    return Json(ResponseHelper.Failed("End date must be after start date"));
                }

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                if (viewModel.Id.HasValue)
                {
                    var ad = await _context.Ads
                        .FirstOrDefaultAsync(a => a.Id == viewModel.Id && a.DeletedAt == null);

                    if (ad == null)
                        return Json(ResponseHelper.Failed("Ad not found"));

                    var oldValues = new { ad.Title, ad.Description, ad.Position, ad.IsActive };

                    ad.Title = viewModel.Title;
                    ad.Description = viewModel.Description;
                    ad.ImageUrl = viewModel.ImageUrl;
                    ad.LinkUrl = viewModel.LinkUrl;
                    ad.StartDate = viewModel.StartDate.Value;
                    ad.EndDate = viewModel.EndDate.Value;
                    ad.Position = viewModel.Position;
                    ad.IsActive = viewModel.IsActive;
                    ad.ModifiedBy = currentUserId ?? "";
                    ad.ModifiedByName = currentUserName;
                    ad.ModifiedAt = DateTime.Now;

                    await _context.SaveChangesAsync();

                    var newValues = new { ad.Title, ad.Description, ad.Position, ad.IsActive };
                    await _auditService.LogUpdateAsync("Ad", ad.Id.ToString(), oldValues, newValues);

                    return Json(ResponseHelper.Success("Ad updated successfully", null, redirectUrl: Url.Action("Index", "Ads")));
                }
                else
                {
                    var ad = new Ad
                    {
                        Title = viewModel.Title,
                        Description = viewModel.Description,
                        ImageUrl = viewModel.ImageUrl,
                        LinkUrl = viewModel.LinkUrl,
                        StartDate = viewModel.StartDate.Value,
                        EndDate = viewModel.EndDate.Value,
                        Position = viewModel.Position,
                        IsActive = viewModel.IsActive,
                        ViewCount = 0,
                        ClickCount = 0,
                        CreatedBy = currentUserId ?? "",
                        CreatedByName = currentUserName,
                        CreatedAt = DateTime.Now,
                        ModifiedBy = currentUserId ?? "",
                        ModifiedByName = currentUserName,
                        ModifiedAt = DateTime.Now
                    };

                    _context.Ads.Add(ad);
                    await _context.SaveChangesAsync();

                    await _auditService.LogCreateAsync("Ad", ad.Id.ToString(), new { ad.Id, ad.Title, ad.Position });

                    return Json(ResponseHelper.Success("Ad created successfully", null, redirectUrl: Url.Action("Index", "Ads")));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting ad");
                return Json(ResponseHelper.Error("Failed to save ad"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var ad = await _context.Ads
                    .FirstOrDefaultAsync(a => a.Id == id && a.DeletedAt == null);

                if (ad == null)
                    return Json(ResponseHelper.Failed("Ad not found"));

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                ad.DeletedBy = currentUserId;
                ad.DeletedByName = currentUserName;
                ad.DeletedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                await _auditService.LogDeleteAsync("Ad", ad.Id.ToString(), new { ad.Id, ad.Title });

                return Json(ResponseHelper.Success("Ad deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting ad");
                return Json(ResponseHelper.Error("Failed to delete ad"));
            }
        }

        [HttpPost]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            try
            {
                var ad = await _context.Ads
                    .FirstOrDefaultAsync(a => a.Id == id && a.DeletedAt == null);

                if (ad == null)
                    return Json(ResponseHelper.Failed("Ad not found"));

                var oldValue = ad.IsActive;
                ad.IsActive = !ad.IsActive;
                
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";
                
                ad.ModifiedBy = currentUserId ?? "";
                ad.ModifiedByName = currentUserName;
                ad.ModifiedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                await _auditService.LogUpdateAsync("Ad", ad.Id.ToString(), new { IsActive = oldValue }, new { IsActive = ad.IsActive });

                return Json(ResponseHelper.Success($"Ad {(ad.IsActive ? "activated" : "deactivated")} successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling ad status");
                return Json(ResponseHelper.Error("Failed to toggle ad status"));
            }
        }
    }
}
