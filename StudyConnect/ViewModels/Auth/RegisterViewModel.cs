using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace StudyConnect.ViewModels.Auth;

public class RegisterViewModel
{
    [Required]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    public string FirstName { get; set; } = string.Empty;
    
    public string? MiddleName { get; set; }
    
    [Required]
    public string LastName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "ID image is required")]
    public IFormFile? IdImage { get; set; }
    
    [Required(ErrorMessage = "Study load PDF is required")]
    public IFormFile? StudyLoadPdf { get; set; }
}