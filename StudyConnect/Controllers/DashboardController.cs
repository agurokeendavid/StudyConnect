using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace StudyConnect.Controllers;

[Authorize]
public class DashboardController : Controller
{
    private readonly ILogger<DashboardController> _logger;
        
    public DashboardController(ILogger<DashboardController> logger)
    {
        _logger = logger;
    }
    
    public async Task<ViewResult> Index()
    {
        return View();
    }
}