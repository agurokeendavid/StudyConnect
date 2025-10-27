using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StudyConnect.Helpers;
using StudyConnect.Models;
using StudyConnect.ViewModels.Auth;

namespace StudyConnect.Controllers
{
    public class AuthController : Controller
    {
        private readonly ILogger<AuthController> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        
        public AuthController(ILogger<AuthController> logger, UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
        {
            _logger = logger;
            _userManager = userManager;
            _signInManager = signInManager;
        }
        public ViewResult Index()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Index(IndexViewModel viewModel)
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
                
                var user = await _userManager.FindByEmailAsync(viewModel.Email);
                if (user == null)
                {
                    return Json(ResponseHelper.Failed("Invalid email address/password."));
                }

                var result = await _signInManager.PasswordSignInAsync(user, viewModel.Password, viewModel.RememberMe, lockoutOnFailure: false);
                if (result.Succeeded)
                {
                    // Get existing claims
                    var existingClaims = await _userManager.GetClaimsAsync(user);
                    
                    // Add custom claims
                    var claims = new List<Claim>
                    {
                        new Claim("FirstName", user.FirstName),
                        new Claim("LastName", user.LastName),
                        new Claim("Gender", user.Sex ?? "Not Specified"),
                        new Claim("FullName", $"{user.FirstName} {user.LastName}")
                    };
                    
                    // Add user roles as claims
                    var roles = await _userManager.GetRolesAsync(user);
                    foreach (var role in roles)
                    {
                        claims.Add(new Claim(ClaimTypes.Role, role));
                    }
                    
                    // Filter out role claims and claims that already exist
                    var claimsToAdd = claims.Where(c => 
                        !c.Type.Equals(ClaimTypes.Role) && 
                        !existingClaims.Any(existingClaim => existingClaim.Type == c.Type)
                    ).ToList();
                    
                    // Add claims to the user's identity if there are any new ones
                    if (claimsToAdd.Any())
                    {
                        await _userManager.AddClaimsAsync(user, claimsToAdd);
                    }
                    
                    // Sign in again to refresh the claims in the cookie
                    await _signInManager.SignOutAsync();
                    await _signInManager.SignInAsync(user, viewModel.RememberMe);
                    
                    if (!string.IsNullOrEmpty(viewModel.ReturnUrl) && Url.IsLocalUrl(viewModel.ReturnUrl))
                    {
                        return Json(ResponseHelper.Success("Account successfully logged in.", null, redirectUrl: viewModel.ReturnUrl));
                    }
                    return Json(ResponseHelper.Success("Account successfully logged in.", null, redirectUrl: Url.Action("Index", "Dashboard")));
                }

                return Json(ResponseHelper.Failed("Invalid email address/password."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
            }
            return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
        }

        public ViewResult Register()
        {
            return View();
        }
        
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel viewModel)
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

                string generatedGuid = Guid.NewGuid().ToString();
                var user = new ApplicationUser
                {
                    Id = generatedGuid,
                    UserName = viewModel.Email,
                    Email = viewModel.Email,
                    FirstName = viewModel.FirstName,
                    MiddleName = viewModel.MiddleName,
                    LastName = viewModel.LastName,
                    CreatedBy = generatedGuid,
                    CreatedByName = $"{viewModel.FirstName} {viewModel.LastName}",
                    ModifiedBy = generatedGuid,
                    ModifiedByName = $"{viewModel.FirstName} {viewModel.LastName}",
                };

                var result = await _userManager.CreateAsync(user, viewModel.Password);
                if (result.Succeeded)
                {
                    // Assign default role (Student)
                    await _userManager.AddToRoleAsync(user, AppRoles.Student);

                    // Get existing claims
                    var existingClaims = await _userManager.GetClaimsAsync(user);

                    // Add custom claims
                    var claims = new List<Claim>
                    {
                        new Claim("FirstName", user.FirstName),
                        new Claim("LastName", user.LastName),
                        new Claim("Gender", user.Sex ?? "Not Specified"),
                        new Claim("FullName", $"{user.FirstName} {user.LastName}")
                    };

                    // Add user roles as claims
                    var roles = await _userManager.GetRolesAsync(user);
                    foreach (var role in roles)
                    {
                        claims.Add(new Claim(ClaimTypes.Role, role));
                    }

                    // Filter out role claims and claims that already exist
                    var claimsToAdd = claims.Where(c =>
                        !c.Type.Equals(ClaimTypes.Role) &&
                        !existingClaims.Any(existingClaim => existingClaim.Type == c.Type)
                    ).ToList();

                    // Add claims to the user's identity if there are any new ones
                    if (claimsToAdd.Any())
                    {
                        await _userManager.AddClaimsAsync(user, claimsToAdd);
                    }

                    // Sign in again to refresh the claims in the cookie
                    await _signInManager.SignOutAsync();
                    await _signInManager.SignInAsync(user, isPersistent: false);
                    return Json(ResponseHelper.Success("Successfully registered.", null, redirectUrl: Url.Action("Index", "Dashboard")));
                }

                string errors = string.Join("\n", result.Errors.Select(e => e.Description));
                return Json(ResponseHelper.Failed(errors));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
            }
            return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
        }
        
        public async Task<IActionResult> Logout()
        {
            try
            {
                await _signInManager.SignOutAsync();
                TempData["LogoutSuccess"] = "You have been successfully logged out.";
                return RedirectToAction("Index", "Home");
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
                TempData["LogoutError"] = "An error occurred while logging out.";
                return RedirectToAction("Index", "Home");
            }
        }
    }
}
