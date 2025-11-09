using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Models
{
    public class Ad : BaseModel
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? LinkUrl { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string Position { get; set; } = string.Empty; // Top, Bottom, Sidebar, etc.

        public bool IsActive { get; set; } = true;

        public int ViewCount { get; set; } = 0;

        public int ClickCount { get; set; } = 0;
    }
}
