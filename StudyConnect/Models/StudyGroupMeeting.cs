using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class StudyGroupMeeting : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StudyGroupId { get; set; }

        [ForeignKey(nameof(StudyGroupId))]
        public StudyGroup StudyGroup { get; set; }

        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(1000)]
        public string MeetingLink { get; set; } = string.Empty;

        [Required]
        public DateTime ScheduledStartTime { get; set; }

        [Required]
        public DateTime ScheduledEndTime { get; set; }

        public bool IsRecurring { get; set; } = false;

        [MaxLength(50)]
        public string? RecurrencePattern { get; set; } // Daily, Weekly, Monthly

        public DateTime? RecurrenceEndDate { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsCancelled { get; set; } = false;

        [MaxLength(1000)]
        public string? CancellationReason { get; set; }

        public int? MaxParticipants { get; set; }

        public string CreatedByUserId { get; set; } = string.Empty;

        [ForeignKey(nameof(CreatedByUserId))]
        public ApplicationUser CreatedByUser { get; set; }
    }
}
