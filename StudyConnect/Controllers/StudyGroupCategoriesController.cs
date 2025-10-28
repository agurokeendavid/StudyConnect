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
    public class StudyGroupCategoriesController : Controller
    {
        private readonly ILogger<StudyGroupCategoriesController> _logger;
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public StudyGroupCategoriesController(
            ILogger<StudyGroupCategoriesController> logger,
            AppDbContext context,
            IAuditService auditService)
        {
            _logger = logger;
            _context = context;
            _auditService = auditService;
        }

        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Study Group Categories Page");
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _context.StudyGroupCategories
                    .Where(c => c.DeletedAt == null)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.Name,
                        description = c.Description,
                        createdAt = c.CreatedAt,
                        createdByName = c.CreatedByName,
                        modifiedAt = c.ModifiedAt,
                        modifiedByName = c.ModifiedByName
                    })
                    .ToListAsync();

                return Json(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching study group categories");
                return Json(new { error = "Failed to load categories" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetCategory(int id)
        {
            try
            {
                var category = await _context.StudyGroupCategories
                    .Where(c => c.Id == id && c.DeletedAt == null)
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.Name,
                        description = c.Description
                    })
                    .FirstOrDefaultAsync();

                if (category == null)
                    return NotFound(new { message = "Category not found" });

                return Json(category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching category {Id}", id);
                return Json(new { error = "Failed to load category" });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([FromBody] StudyGroupCategory model)
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

                var category = new StudyGroupCategory
                {
                    Name = model.Name,
                    Description = model.Description,
                    CreatedBy = currentUserId ?? "",
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.UtcNow,
                    ModifiedBy = currentUserId ?? "",
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.UtcNow
                };

                _context.StudyGroupCategories.Add(category);
                await _context.SaveChangesAsync();

                await _auditService.LogCreateAsync(
                    "StudyGroupCategory",
                    category.Id.ToString(),
                    new { category.Name, category.Description }
                );

                return Json(ResponseHelper.Success("Category created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating study group category");
                return Json(ResponseHelper.Error("Failed to create category"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Update([FromBody] StudyGroupCategory model)
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

                var category = await _context.StudyGroupCategories
                    .FirstOrDefaultAsync(c => c.Id == model.Id && c.DeletedAt == null);

                if (category == null)
                    return Json(ResponseHelper.Failed("Category not found"));

                var oldValues = new
                {
                    category.Name,
                    category.Description
                };

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                category.Name = model.Name;
                category.Description = model.Description;
                category.ModifiedBy = currentUserId ?? "";
                category.ModifiedByName = currentUserName;
                category.ModifiedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _auditService.LogUpdateAsync(
                    "StudyGroupCategory",
                    category.Id.ToString(),
                    oldValues,
                    new { category.Name, category.Description }
                );

                return Json(ResponseHelper.Success("Category updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating study group category");
                return Json(ResponseHelper.Error("Failed to update category"));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var category = await _context.StudyGroupCategories
                    .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);

                if (category == null)
                    return Json(ResponseHelper.Failed("Category not found"));

                var oldValues = new
                {
                    category.Id,
                    category.Name,
                    category.Description
                };

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUserName = User.FindFirstValue("FullName") ?? "System";

                category.DeletedBy = currentUserId;
                category.DeletedByName = currentUserName;
                category.DeletedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _auditService.LogDeleteAsync(
                    "StudyGroupCategory",
                    category.Id.ToString(),
                    oldValues
                );

                return Json(ResponseHelper.Success("Category deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting study group category");
                return Json(ResponseHelper.Error("Failed to delete category"));
            }
        }
    }
}
