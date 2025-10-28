namespace StudyConnect.Requests
{
    public class UploadResourceRequest
{
        public int StudyGroupId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public IFormFile File { get; set; }
    }
}
