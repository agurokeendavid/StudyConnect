using Microsoft.AspNetCore.Mvc;

namespace StudyConnect.Controllers
{
    public class AuthController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
