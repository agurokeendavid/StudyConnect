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
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
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
                        return Redirect(viewModel.ReturnUrl);
                    }
                    
                    return RedirectToAction("Index", "Home");
                }

                return Json(ResponseHelper.Failed("Invalid email address/password."));
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, exception.Message);
            }
            return Json(ResponseHelper.Error("An unexpected error occurred. Please try again later."));
        }
    }
}
