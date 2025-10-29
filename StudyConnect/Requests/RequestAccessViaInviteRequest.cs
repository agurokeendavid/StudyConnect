using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Requests
{
    public class RequestAccessViaInviteRequest
    {
        [Required]
        public string InviteToken { get; set; } = string.Empty;
    }
}
