namespace StudyConnect.Requests
{
    public class CreateForumRequest
    {
        public int StudyGroupId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
