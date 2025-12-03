using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class StudyGroupForumPostImage : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PostId { get; set; }

        [ForeignKey(nameof(PostId))]
        public StudyGroupForumPost Post { get; set; }

        [Required]
        [MaxLength(500)]
        public string ImagePath { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        public long FileSize { get; set; }

        [Required]
        [MaxLength(100)]
        public string ContentType { get; set; } = string.Empty;
    }
}
