using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class StudyGroupMessage : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StudyGroupId { get; set; }

        [ForeignKey(nameof(StudyGroupId))]
        public StudyGroup StudyGroup { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; }

        [Required]
        [MaxLength(5000)]
        public string Message { get; set; } = string.Empty;

        public DateTime PostedAt { get; set; } = DateTime.Now;
    }
}
