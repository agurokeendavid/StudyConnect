using Microsoft.AspNetCore.Http;

namespace StudyConnect.Requests
{
    public class CreateForumPostRequest
    {
        public int ForumId { get; set; }
        public string Content { get; set; } = string.Empty;
        public List<IFormFile>? Images { get; set; }
    }
}
