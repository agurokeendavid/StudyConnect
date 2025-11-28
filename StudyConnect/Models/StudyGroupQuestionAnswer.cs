using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class StudyGroupQuestionAnswer : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int QuestionId { get; set; }

        [ForeignKey(nameof(QuestionId))]
        public StudyGroupQuestion Question { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; }

        [Required]
        [MaxLength(500)]
        public string UserAnswer { get; set; } = string.Empty; // User's submitted answer

        public bool IsCorrect { get; set; } = false; // Whether the answer is correct

        public int PointsEarned { get; set; } = 0; // Points earned for this answer

        public DateTime AnsweredAt { get; set; } = DateTime.Now;
    }
}
