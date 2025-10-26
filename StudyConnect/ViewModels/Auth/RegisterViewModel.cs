using System.ComponentModel.DataAnnotations;

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
}