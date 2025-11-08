using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Requests
{
    public class UpdateMeetingRequest
    {
        [Required]
        public int MeetingId { get; set; }

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

        public int? MaxParticipants { get; set; }
    }
}
