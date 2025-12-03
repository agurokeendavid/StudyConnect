using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class StudyGroupForumPost : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ForumId { get; set; }

        [ForeignKey(nameof(ForumId))]
        public StudyGroupForum Forum { get; set; }

        [Required]
        [MaxLength(5000)]
        public string Content { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; }

        public DateTime PostedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public ICollection<StudyGroupForumPostImage> Images { get; set; } = new List<StudyGroupForumPostImage>();
    }
}
