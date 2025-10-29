using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Requests
{
    public class GenerateInviteLinkRequest
    {
        [Required]
        public int StudyGroupId { get; set; }

        public int? ExpirationDays { get; set; } // null = no expiration, otherwise X days
    }
}
