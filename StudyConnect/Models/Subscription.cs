using StudyConnect.Models.Contracts;

namespace StudyConnect.Models
{
    public class Subscription : BaseModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int DurationInDays { get; set; }
        public int MaxFileUploads { get; set; }
        public bool HasUnlimitedAccess { get; set; }
        public bool IsActive { get; set; }
    }
}
