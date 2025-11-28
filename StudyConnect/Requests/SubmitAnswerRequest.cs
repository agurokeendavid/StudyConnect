using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Requests
{
    public class SubmitAnswerRequest
    {
        [Required]
        public int QuestionId { get; set; }

        [Required]
        [MaxLength(500)]
        public string UserAnswer { get; set; } = string.Empty;
    }
}
