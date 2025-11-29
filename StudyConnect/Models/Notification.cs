using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class Notification : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; }

        [Required]
        [MaxLength(100)]
        public string Type { get; set; } = string.Empty; // UpcomingEvent, MeetingScheduled, MeetingCancelled, MeetingUpdated, GroupInvitation, etc.

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Message { get; set; } = string.Empty;

        public bool IsViewed { get; set; } = false;

        public DateTime? ViewedAt { get; set; }

        // Reference to the related entity (if applicable)
        public int? StudyGroupId { get; set; }

        [ForeignKey(nameof(StudyGroupId))]
        public StudyGroup? StudyGroup { get; set; }

        public int? MeetingId { get; set; }

        [ForeignKey(nameof(MeetingId))]
        public StudyGroupMeeting? Meeting { get; set; }

        [MaxLength(500)]
        public string? ActionUrl { get; set; } // URL to navigate when notification is clicked

        [MaxLength(50)]
        public string Priority { get; set; } = "Normal"; // Low, Normal, High, Urgent

        public DateTime? EventDate { get; set; } // For upcoming events
    }
}
