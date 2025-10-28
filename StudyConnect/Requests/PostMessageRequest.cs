namespace StudyConnect.Requests
{
    public class PostMessageRequest
    {
        public int StudyGroupId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
