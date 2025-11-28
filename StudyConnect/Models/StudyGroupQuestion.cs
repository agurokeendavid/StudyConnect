using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class StudyGroupQuestion : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StudyGroupId { get; set; }

        [ForeignKey(nameof(StudyGroupId))]
        public StudyGroup StudyGroup { get; set; }

        [Required]
        [MaxLength(500)]
        public string QuestionText { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string QuestionType { get; set; } = "MultipleChoice"; // MultipleChoice, TrueFalse, ShortAnswer

        // For Multiple Choice questions
        [MaxLength(500)]
        public string? OptionA { get; set; }

        [MaxLength(500)]
        public string? OptionB { get; set; }

        [MaxLength(500)]
        public string? OptionC { get; set; }

        [MaxLength(500)]
        public string? OptionD { get; set; }

        [Required]
        [MaxLength(500)]
        public string CorrectAnswer { get; set; } = string.Empty; // Stores correct option (A/B/C/D) or True/False or expected text

        public int Points { get; set; } = 1; // Points awarded for correct answer

        public bool IsActive { get; set; } = true;

        [Required]
        public string CreatedByUserId { get; set; } = string.Empty;

        [ForeignKey(nameof(CreatedByUserId))]
        public ApplicationUser CreatedByUser { get; set; }

        // Navigation property for answers
        public ICollection<StudyGroupQuestionAnswer> Answers { get; set; } = new List<StudyGroupQuestionAnswer>();
    }
}
