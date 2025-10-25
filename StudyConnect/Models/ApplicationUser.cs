using Microsoft.AspNetCore.Identity;

namespace StudyConnect.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName  { get; set; } = string.Empty;
        public DateTime? Dob { get; set; }
        public string? Sex { get; set; }
    }
}
