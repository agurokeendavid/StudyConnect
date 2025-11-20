using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Models
{
    public class Feedback : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [MaxLength(5000)]
        public string Message { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, In Progress, Resolved, Closed

        [MaxLength(2000)]
        public string? AdminResponse { get; set; }

        public string? RespondedBy { get; set; }

        public string? RespondedByName { get; set; }

        public DateTime? RespondedAt { get; set; }

        // Navigation property
        public virtual ApplicationUser User { get; set; }
    }
}
