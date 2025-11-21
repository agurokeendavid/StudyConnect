using Microsoft.AspNetCore.Mvc;

namespace StudyConnect.Controllers
{
    public class AnnouncementsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
