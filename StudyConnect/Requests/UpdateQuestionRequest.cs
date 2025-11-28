using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Requests
{
    public class UpdateQuestionRequest
    {
        [Required]
        public int QuestionId { get; set; }

        [Required]
        [MaxLength(500)]
        public string QuestionText { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string QuestionType { get; set; } = "MultipleChoice";

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
        public string CorrectAnswer { get; set; } = string.Empty;

        public int Points { get; set; } = 1;
    }
}
