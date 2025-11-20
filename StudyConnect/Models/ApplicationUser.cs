using Microsoft.AspNetCore.Identity;
using StudyConnect.Models.Contracts;

namespace StudyConnect.Models
{
    public class ApplicationUser : IdentityUser, IBaseModel
    {
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string LastName  { get; set; } = string.Empty;
        public DateTime? Dob { get; set; }
        public string? Sex { get; set; }
        public string? Address { get; set; }
        public string? ContactNo { get; set; }
        
        // Subscription tracking
        public DateTime? SubscriptionStartDate { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }
        public int FilesUploadedCount { get; set; }
        public bool HasActiveSubscription { get; set; }
        
        public string CreatedBy { get; set; } = string.Empty;
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string ModifiedBy { get; set; } = string.Empty;
        public string ModifiedByName { get; set; } = string.Empty;
        public DateTime ModifiedAt { get; set; } = DateTime.Now;
        public string? DeletedBy { get; set; }
        public string? DeletedByName { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}
