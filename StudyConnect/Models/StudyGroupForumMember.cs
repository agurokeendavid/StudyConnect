using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class StudyGroupForumMember : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ForumId { get; set; }

        [ForeignKey(nameof(ForumId))]
        public StudyGroupForum Forum { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; }

        public bool IsApproved { get; set; } = false;

        public DateTime? JoinedAt { get; set; }

        public DateTime? RequestedAt { get; set; } = DateTime.Now;
    }
}
