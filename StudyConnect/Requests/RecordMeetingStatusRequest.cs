using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Requests
{
    public class RecordMeetingStatusRequest
    {
        [Required]
        public int MeetingId { get; set; }

        [Required]
        [MaxLength(50)]
        public string MeetingStatus { get; set; } = string.Empty; // Completed, NoShow, etc.

        public DateTime? ActualStartTime { get; set; }

        public DateTime? ActualEndTime { get; set; }

        public int? AttendanceCount { get; set; }

        [MaxLength(2000)]
        public string? MeetingNotes { get; set; }

        [MaxLength(1000)]
        public string? NoShowNotes { get; set; }
    }
}
