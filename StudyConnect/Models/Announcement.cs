using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class Announcement : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(5000)]
        public string Content { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Type { get; set; } = "General"; // General, Important, Urgent, Event

        [MaxLength(50)]
        public string Priority { get; set; } = "Normal"; // Low, Normal, High

        public bool IsActive { get; set; } = true;

        public bool IsPinned { get; set; } = false;

        public DateTime? PublishDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public int ViewCount { get; set; } = 0;

        [MaxLength(500)]
        public string? AttachmentUrl { get; set; }

        public string TargetAudience { get; set; } = "All"; // All, Students, Admins
    }
}
