namespace StudyConnect.Requests
{
    public class SendDirectMessageRequest
    {
        public string ReceiverId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
