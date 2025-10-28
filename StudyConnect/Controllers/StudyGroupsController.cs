using Microsoft.AspNetCore.Mvc;

namespace StudyConnect.Controllers
{
    public class StudyGroupsController : Controller
    {
        public IActionResult Upsert()
        {
            return View();
        }
    }
}
