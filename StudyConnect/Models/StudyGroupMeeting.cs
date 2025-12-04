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

        // Meeting Status Tracking
        [MaxLength(50)]
        public string MeetingStatus { get; set; } = "Scheduled"; // Scheduled, Ongoing, Completed, Cancelled, Postponed, NoShow

        public DateTime? ActualStartTime { get; set; }

        public DateTime? ActualEndTime { get; set; }

        public bool IsPostponed { get; set; } = false;

        public DateTime? PostponedToDate { get; set; }

        [MaxLength(1000)]
        public string? PostponementReason { get; set; }

        public bool NoShowRecorded { get; set; } = false;

        [MaxLength(1000)]
        public string? NoShowNotes { get; set; }

        public int AttendanceCount { get; set; } = 0;

        [MaxLength(2000)]
        public string? MeetingNotes { get; set; } // Notes about what happened in the meeting

    public int? MaxParticipants { get; set; }

    public int ReminderTimeInHours { get; set; } = 1; // Default to 1 hour before meeting

    public string CreatedByUserId { get; set; } = string.Empty;

        [ForeignKey(nameof(CreatedByUserId))]
        public ApplicationUser CreatedByUser { get; set; }
    }
}
