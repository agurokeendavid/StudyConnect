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

                var user = new ApplicationUser
                {
                    UserName = viewModel.Email,
                    Email = viewModel.Email,
                    FirstName = viewModel.FirstName,
                    MiddleName = viewModel.MiddleName,
                    LastName = viewModel.LastName
                };

                var result = await _userManager.CreateAsync(user, viewModel.Password);
                if (result.Succeeded)
                {
                    await _signInManager.SignInAsync(user, isPersistent: false);
                    return RedirectToAction("Index", "Home");
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
    }
}
