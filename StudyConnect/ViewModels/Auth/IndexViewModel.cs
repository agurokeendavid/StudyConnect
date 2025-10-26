using System.ComponentModel.DataAnnotations;

namespace StudyConnect.ViewModels.Auth;

public class IndexViewModel
{
    [Required, EmailAddress] 
    public string Email { get; set; } = string.Empty;
    [Required, DataType(DataType.Password)] 
    public string Password { get; set; } = string.Empty;
    public bool RememberMe { get; set; }
    public string? ReturnUrl { get; set; }
}