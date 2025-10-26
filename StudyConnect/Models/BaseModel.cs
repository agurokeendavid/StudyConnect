using StudyConnect.Models.Contracts;

namespace StudyConnect.Models;

public class BaseModel : IBaseModel
{
    public string CreatedBy { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public string ModifiedBy { get; set; } = string.Empty;
    public string ModifiedByName { get; set; } = string.Empty;
    public DateTime ModifiedAt { get; set; } = DateTime.Now;
    public string? DeletedBy { get; set; }
    public string? DeletedByName { get; set; }
    public DateTime? DeletedAt { get; set; }
}