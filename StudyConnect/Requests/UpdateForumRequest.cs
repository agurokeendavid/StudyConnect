namespace StudyConnect.Requests
{
    public class UpdateForumRequest
    {
        public int ForumId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
