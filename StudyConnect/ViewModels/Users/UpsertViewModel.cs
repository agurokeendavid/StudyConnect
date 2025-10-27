using System.ComponentModel.DataAnnotations;

namespace StudyConnect.ViewModels.Users
{
    public class UpsertViewModel
    {
        public string? Id { get; set; }

        [Required]
        [Display(Name = "Last Name")]
        public string LastName { get; set; }

        [Required]
        [Display(Name = "First Name")]
        public string FirstName { get; set; }

        [Display(Name = "Middle Name")]
        public string? MiddleName { get; set; }

        [Required]
        [Display(Name = "Date of Birth")]
        public DateTime? Dob { get; set; }

        [Required]
        [Display(Name = "Sex")]
        public string Sex { get; set; }

        [Required]
        [Display(Name = "Residential Address")]
        public string Address { get; set; }

        [Required]
        [Display(Name = "Contact Number")]
        public string ContactNo { get; set; }

        [Required]
        [Display(Name = "Email Address")]
        public string EmailAddress { get; set; }

        [Required]
        [Display(Name = "Password")]
        public string Password { get; set; }

        [Required]
        [Display(Name = "Role")]
        public string RoleId { get; set; }
    }
}
