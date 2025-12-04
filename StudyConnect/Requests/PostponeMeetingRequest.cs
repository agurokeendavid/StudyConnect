using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Requests
{
    public class PostponeMeetingRequest
    {
        [Required]
        public int MeetingId { get; set; }

        [Required]
        public DateTime NewStartTime { get; set; }

        [Required]
        public DateTime NewEndTime { get; set; }

        [MaxLength(1000)]
        public string? PostponementReason { get; set; }
    }
}
