using StudyConnect.Models.Contracts;

namespace StudyConnect.Models
{
    public class UserSubscription : BaseModel
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int SubscriptionId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public int FilesUploaded { get; set; }
        
        // Navigation properties
        public ApplicationUser? User { get; set; }
        public Subscription? Subscription { get; set; }
    }
}
